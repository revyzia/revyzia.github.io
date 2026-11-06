/**
 * Revyzia, serveur de generation.
 * Tourne sur Cloudflare Workers. Aucune cle n'est exposee au navigateur :
 * le modele est appele par le binding AI, cote Cloudflare.
 *
 * Routes
 *   GET  /sante      etat du serveur
 *   POST /generer    { titre, matiere, texte } -> chapitre au format Revyzia v2
 */

const ORIGINES = [
  "https://revyzia.pages.dev",
  "http://localhost:8788"
];

const PROJET_FIREBASE = "revyzia-app";
const MODELE_DEFAUT = "@cf/meta/llama-3.1-8b-instruct";
const MAX_CARACTERES = 24000;   // un document plus long est coupe
const QUOTA_PAR_JOUR = 12;      // generations par eleve et par jour

export default {
  async fetch(requete, env) {
    const url = new URL(requete.url);
    const origine = requete.headers.get("Origin") || "";
    const entetes = enTetesCors(origine);

    if (requete.method === "OPTIONS") return new Response(null, { status: 204, headers: entetes });

    try {
      if (url.pathname === "/sante") {
        return json({ ok: true, modele: env.AI_MODELE || MODELE_DEFAUT }, 200, entetes);
      }

      if (url.pathname === "/generer" && requete.method === "POST") {
        return await routeGenerer(requete, env, entetes);
      }

      return json({ erreur: "route inconnue" }, 404, entetes);
    } catch (e) {
      console.error("[revyzia] erreur", e && e.stack ? e.stack : e);
      return json({ erreur: "erreur interne" }, 500, entetes);
    }
  }
};

function enTetesCors(origine) {
  const autorisee = ORIGINES.includes(origine) ? origine : ORIGINES[0];
  return {
    "Access-Control-Allow-Origin": autorisee,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}

function json(corps, statut, entetes) {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, entetes || {})
  });
}

/* ------------------------------------------------------------------ */
/* Verification du jeton Firebase                                      */
/* ------------------------------------------------------------------ */

let cacheCles = { valeurs: null, expire: 0 };

async function clesGoogle() {
  const maintenant = Date.now();
  if (cacheCles.valeurs && maintenant < cacheCles.expire) return cacheCles.valeurs;

  const r = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!r.ok) throw new Error("certificats Google illisibles");
  const certificats = await r.json();

  const controle = r.headers.get("cache-control") || "";
  const age = /max-age=(\d+)/.exec(controle);
  cacheCles = { valeurs: certificats, expire: maintenant + (age ? parseInt(age[1], 10) : 3600) * 1000 };
  return certificats;
}

function base64UrlVersOctets(texte) {
  const base64 = texte.replace(/-/g, "+").replace(/_/g, "/");
  const comble = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binaire = atob(comble);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return octets;
}

function pemVersBinaire(pem) {
  const corps = pem.replace(/-----BEGIN CERTIFICATE-----/, "")
                   .replace(/-----END CERTIFICATE-----/, "")
                   .replace(/\s+/g, "");
  return base64UrlVersOctets(corps);
}

// Extrait la cle publique RSA d'un certificat X.509 (la cle est le dernier BIT STRING)
async function clePubliqueDepuisCertificat(pem) {
  const der = pemVersBinaire(pem);
  // recherche de la sequence SubjectPublicKeyInfo, marqueur de l'OID rsaEncryption
  const motif = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];
  let debut = -1;
  for (let i = 0; i < der.length - motif.length; i++) {
    let trouve = true;
    for (let j = 0; j < motif.length; j++) if (der[i + j] !== motif[j]) { trouve = false; break; }
    if (trouve) { debut = i; break; }
  }
  if (debut < 0) throw new Error("certificat illisible");

  // remonter a la SEQUENCE englobante : on reconstruit un SubjectPublicKeyInfo
  let i = debut - 1;
  while (i > 0 && der[i] !== 0x30) i--;
  // longueur de la sequence
  let p = i + 1;
  let longueur = der[p];
  if (longueur & 0x80) {
    const octets = longueur & 0x7f;
    longueur = 0;
    for (let k = 0; k < octets; k++) longueur = (longueur << 8) | der[p + 1 + k];
    p += octets;
  }
  const spki = der.slice(i, p + 1 + longueur);

  return crypto.subtle.importKey(
    "spki", spki,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["verify"]
  );
}

async function verifierJeton(jeton) {
  const morceaux = jeton.split(".");
  if (morceaux.length !== 3) throw new Error("jeton mal forme");

  const entete = JSON.parse(new TextDecoder().decode(base64UrlVersOctets(morceaux[0])));
  const charge = JSON.parse(new TextDecoder().decode(base64UrlVersOctets(morceaux[1])));

  const certificats = await clesGoogle();
  const pem = certificats[entete.kid];
  if (!pem) throw new Error("cle inconnue");

  const cle = await clePubliqueDepuisCertificat(pem);
  const signe = new TextEncoder().encode(morceaux[0] + "." + morceaux[1]);
  const signature = base64UrlVersOctets(morceaux[2]);

  const valide = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cle, signature, signe);
  if (!valide) throw new Error("signature invalide");

  const maintenant = Math.floor(Date.now() / 1000);
  if (charge.exp < maintenant) throw new Error("jeton expire");
  if (charge.aud !== PROJET_FIREBASE) throw new Error("mauvais projet");
  if (charge.iss !== "https://securetoken.google.com/" + PROJET_FIREBASE) throw new Error("mauvais emetteur");
  if (!charge.sub) throw new Error("sujet absent");

  return charge;
}

/* ------------------------------------------------------------------ */
/* Quota par eleve                                                     */
/* ------------------------------------------------------------------ */

async function consommerQuota(env, uid) {
  if (!env.QUOTAS) return { reste: QUOTA_PAR_JOUR, suivi: false };

  const cle = "q:" + uid + ":" + new Date().toISOString().slice(0, 10);
  const brut = await env.QUOTAS.get(cle);
  const utilise = brut ? parseInt(brut, 10) : 0;
  // deja 12 generations aujourd'hui : on refuse sans rien compter
  if (utilise >= QUOTA_PAR_JOUR) return { reste: 0, suivi: true, refuse: true };

  await env.QUOTAS.put(cle, String(utilise + 1), { expirationTtl: 60 * 60 * 30 });
  return { reste: QUOTA_PAR_JOUR - utilise - 1, suivi: true, refuse: false };
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

const CONSIGNE = [
  "Tu transformes un cours de lycee en chapitre de revision.",
  "Tu reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans balises de code.",
  "Tu n'inventes jamais de contenu absent du cours fourni.",
  "Tu ecris en francais, sans tiret cadratin.",
  "Structure attendue :",
  '{"titre":"","sousTitre":"","sections":[{"id":"","titre":"",',
  '"cours":[{"type":"paragraphe|definition|exemple|piege|formule","titre":"","texte":""}],',
  '"flashcards":[{"id":"","recto":"","verso":""}],',
  '"qcm":[{"id":"","question":"","options":["","","",""],"bonne":0,"explication":""}],',
  '"exercices":[{"id":"","enonce":"","correction":""}]}]}',
  "Entre 1 et 4 sections. Par section : 3 a 6 blocs de cours, 4 a 8 flashcards, 3 a 6 questions de QCM.",
  "Chaque QCM a exactement 4 options et une seule bonne reponse, indiquee par son indice de 0 a 3.",
  "Les identifiants sont courts et uniques dans le chapitre."
].join(" ");

async function routeGenerer(requete, env, entetes) {
  const autorisation = requete.headers.get("Authorization") || "";
  if (!autorisation.startsWith("Bearer ")) {
    return json({ erreur: "jeton absent" }, 401, entetes);
  }

  let charge;
  try {
    charge = await verifierJeton(autorisation.slice(7));
  } catch (e) {
    return json({ erreur: "jeton refuse : " + e.message }, 401, entetes);
  }

  let corps;
  try { corps = await requete.json(); }
  catch (e) { return json({ erreur: "corps illisible" }, 400, entetes); }

  const texte = String(corps.texte || "").trim();
  if (texte.length < 200) {
    return json({ erreur: "cours trop court, il faut au moins 200 caracteres lisibles" }, 400, entetes);
  }

  const quota = await consommerQuota(env, charge.sub);
  if (quota.refuse) {
    return json({ erreur: "quota du jour atteint, reviens demain" }, 429, entetes);
  }

  const modele = env.AI_MODELE || MODELE_DEFAUT;
  const extrait = texte.slice(0, MAX_CARACTERES);

  const reponse = await env.AI.run(modele, {
    messages: [
      { role: "system", content: CONSIGNE },
      { role: "user", content:
          "Matiere : " + (corps.matiere || "inconnue") + "\n" +
          "Titre propose : " + (corps.titre || "a deduire du cours") + "\n\n" +
          "Cours :\n" + extrait }
    ],
    max_tokens: 4000,
    temperature: 0.2
  });

  const brut = (reponse && (reponse.response || reponse.result)) || "";
  const chapitre = extraireJson(brut);
  if (!chapitre) {
    console.error("[revyzia] sortie non analysable", String(brut).slice(0, 400));
    return json({ erreur: "le modele n'a pas rendu un chapitre lisible, reessaie" }, 502, entetes);
  }

  const propre = valider(chapitre, corps);
  if (!propre) {
    return json({ erreur: "chapitre incomplet, reessaie" }, 502, entetes);
  }

  return json({ ok: true, reste: quota.reste, chapitre: propre }, 200, entetes);
}

// Le modele ajoute parfois du texte autour du JSON : on isole le premier objet complet.
function extraireJson(brut) {
  const texte = String(brut).replace(/```json/gi, "").replace(/```/g, "");
  const debut = texte.indexOf("{");
  if (debut < 0) return null;
  let profondeur = 0, dansChaine = false, echappe = false;
  for (let i = debut; i < texte.length; i++) {
    const c = texte[i];
    if (dansChaine) {
      if (echappe) echappe = false;
      else if (c === "\\") echappe = true;
      else if (c === '"') dansChaine = false;
      continue;
    }
    if (c === '"') dansChaine = true;
    else if (c === "{") profondeur++;
    else if (c === "}") {
      profondeur--;
      if (profondeur === 0) {
        try { return JSON.parse(texte.slice(debut, i + 1)); }
        catch (e) { return null; }
      }
    }
  }
  return null;
}

// On ne fait jamais confiance a la sortie du modele : on reconstruit un objet propre.
function valider(brut, demande) {
  if (!brut || !Array.isArray(brut.sections) || !brut.sections.length) return null;

  const typesCours = ["paragraphe", "definition", "exemple", "piege", "formule", "liste"];
  let compteur = 0;
  const id = () => "i" + (++compteur);

  const sections = brut.sections.map(function (s, n) {
    const cours = (Array.isArray(s.cours) ? s.cours : [])
      .filter(function (b) { return b && typeof b.texte === "string" && b.texte.trim(); })
      .map(function (b) {
        return {
          type: typesCours.indexOf(b.type) >= 0 ? b.type : "paragraphe",
          titre: typeof b.titre === "string" ? b.titre.slice(0, 120) : "",
          texte: b.texte.trim().slice(0, 1200)
        };
      });

    const flashcards = (Array.isArray(s.flashcards) ? s.flashcards : [])
      .filter(function (f) { return f && f.recto && f.verso; })
      .map(function (f) {
        return { id: String(f.id || id()), recto: String(f.recto).slice(0, 300), verso: String(f.verso).slice(0, 600) };
      });

    const qcm = (Array.isArray(s.qcm) ? s.qcm : [])
      .filter(function (q) {
        return q && q.question && Array.isArray(q.options) && q.options.length >= 2
          && Number.isInteger(q.bonne) && q.bonne >= 0 && q.bonne < q.options.length;
      })
      .map(function (q) {
        return {
          id: String(q.id || id()),
          question: String(q.question).slice(0, 400),
          options: q.options.slice(0, 4).map(function (o) { return String(o).slice(0, 200); }),
          bonne: q.bonne,
          explication: String(q.explication || "").slice(0, 600)
        };
      });

    const exercices = (Array.isArray(s.exercices) ? s.exercices : [])
      .filter(function (e) { return e && e.enonce; })
      .map(function (e) {
        return { id: String(e.id || id()), enonce: String(e.enonce).slice(0, 900), correction: String(e.correction || "").slice(0, 1500) };
      });

    return {
      id: String(s.id || "s" + (n + 1)).replace(/[^a-z0-9_-]/gi, "").toLowerCase() || ("s" + (n + 1)),
      titre: String(s.titre || "Partie " + (n + 1)).slice(0, 120),
      cours: cours, flashcards: flashcards, qcm: qcm, exercices: exercices
    };
  }).filter(function (s) { return s.cours.length || s.flashcards.length || s.qcm.length; });

  if (!sections.length) return null;

  return {
    id: "",                                   // rempli au moment du depot
    matiere: String(demande.matiere || "divers"),
    matiereNom: String(demande.matiereNom || demande.matiere || "Divers"),
    titre: String(brut.titre || demande.titre || "Chapitre").slice(0, 140),
    sousTitre: String(brut.sousTitre || "").slice(0, 200),
    niveau: "2nde",
    statut: "genere",
    version: 1,
    sections: sections
  };
}
