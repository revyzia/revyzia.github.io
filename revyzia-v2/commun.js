/* =====================================================================
   Revyzia v1.6, socle commun : Firebase, reglages, barre, menu profil,
   parametres, notifications, activite (serie), classement (podium).
   Charge dans le <head> de chaque page, avant le premier rendu.
   ===================================================================== */
(function () {
  "use strict";

  var RVZ = window.RVZ = {};
  RVZ.version = "v1.6";

  var FIREBASE = "11.3.1";
  var BASES = [
    "https://cdn.jsdelivr.net/npm/firebase@" + FIREBASE + "/",
    "https://unpkg.com/firebase@" + FIREBASE + "/",
    "https://www.gstatic.com/firebasejs/" + FIREBASE + "/"
  ];
  var FICHIERS = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"];
  var CONFIG = {
    apiKey: "AIzaSyDRUVa_1o3Mbz6Gyn8SuQlbjYyV5RNVKGY",
    authDomain: "revyzia-app.firebaseapp.com",
    projectId: "revyzia-app",
    storageBucket: "revyzia-app.firebasestorage.app",
    messagingSenderId: "841690966708",
    appId: "1:841690966708:web:412fd2b2a48686dc9785e1"
  };
  var ETABLISSEMENT = "lfihk";
  var EN_LIGNE_MS = 6 * 60 * 1000;     // vu il y a moins de 6 minutes = en ligne
  var POULS_MS = 4 * 60 * 1000;        // on signale sa presence toutes les 4 minutes

  RVZ.FONDS = {
    lagon:   { nom: "Lagon",   apercu: "radial-gradient(circle at 25% 25%,#CFE6F5,transparent 60%),radial-gradient(circle at 80% 85%,#BFE3E8,transparent 60%),#E8DFF2" },
    brume:   { nom: "Brume",   apercu: "linear-gradient(120deg,#dfe4f7,#f6e3ea)" },
    rayures: { nom: "Rayures", apercu: "repeating-linear-gradient(45deg,#cfe3ea 0 5px,#f2f8fa 5px 10px)" },
    aube:    { nom: "Aube",    apercu: "radial-gradient(circle at 30% 30%,#ffe3c2 0 30%,#cfe6f5 60%,#e8d9f2 100%)" },
    damier:  { nom: "Damier",  apercu: "conic-gradient(from 45deg,#eef0f4 0 25%,#dfe2ea 0 50%,#eef0f4 0 75%,#dfe2ea 0)" }
  };
  RVZ.COULEURS_ACCENT = {
    lagon: ["Lagon", "#0E7490", "#1FA2B8"],
    indigo: ["Indigo", "#4F56C8", "#7A80E8"],
    framboise: ["Framboise", "#B83266", "#E0578A"],
    sauge: ["Sauge", "#2E7D5B", "#4FA67E"],
    graphite: ["Graphite", "#3F4754", "#66707F"]
  };
  // couleurs des tuiles de matieres, partagees par toutes les pages
  RVZ.COULEURS_MATIERES = {
    maths:   ["#0E7490", "#1FA2B8"],
    francais:["#4F56C8", "#7A80E8"],
    histoire:["#A0522D", "#C77B4E"],
    geo:     ["#A0522D", "#C77B4E"],
    svt:     ["#2A9D4E", "#34C759"],
    physique:["#0077B6", "#00A8E8"],
    ses:     ["#8A5A9E", "#B07DC4"],
    emc:     ["#5A6472", "#7E8795"],
    anglais: ["#B3433F", "#D9736F"],
    espagnol:["#C9732B", "#E29A57"],
    snt:     ["#1F7A6C", "#2FA894"]
  };
  RVZ.couleurMatiere = function (id) {
    var c = RVZ.COULEURS_MATIERES[id] || ["#5A6472", "#7E8795"];
    return "linear-gradient(135deg," + c[0] + "," + c[1] + ")";
  };
  RVZ.NIVEAUX = ["Début", "En route", "Bien lancé", "Sérieux", "Costaud", "Redoutable", "Machine", "Cerveau en fusion"];
  RVZ.XP_PAR_NIVEAU = 200;
  RVZ.niveau = function (xp) {
    var n = Math.floor(xp / RVZ.XP_PAR_NIVEAU) + 1;
    return { numero: n, nom: RVZ.NIVEAUX[Math.min(n - 1, RVZ.NIVEAUX.length - 1)],
             reste: xp % RVZ.XP_PAR_NIVEAU, prochain: n * RVZ.XP_PAR_NIVEAU };
  };

  var ICONES = {
    flamme: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#E07A3E" aria-hidden="true"><path d="M12 2c1 4-3 5.5-3 9a3 3 0 006 0c0-1.5-.8-2.6-.8-2.6S18 10 18 13.5A6 6 0 016 13.5C6 7.5 11 6.5 12 2z"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    croix: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    maison: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V19h12V9.5"/></svg>',
    livre: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.7 4.5 5.4v12.2c2.5-.7 5.5-.4 7.5 1.1 2-1.5 5-1.8 7.5-1.1V5.4C17 4.7 14 5 12 6.5z"/><path d="M12 6.5v12.2"/></svg>',
    ajout: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    podium: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20V9h6v11"/><path d="M3 20v-6h6M15 20v-8h6v8"/><path d="M2.5 20h19"/></svg>',
    badge: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.6 5 2.6-1.5-7.5"/></svg>',
    logo: '<svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="6" y="9" width="24" height="17" rx="5" fill="#9AD2DE" transform="rotate(-9 18 17)"/><rect x="10" y="14" width="24" height="17" rx="5" fill="#0E7490"/><path d="M17 22.5l3 3 6.5-6.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    coche: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
  };
  RVZ.ICONES = ICONES;

  function $(id) { return document.getElementById(id); }
  RVZ.$ = $;
  RVZ.echapper = function (t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  RVZ.nombre = function (n) { return Number(n || 0).toLocaleString("fr-FR"); };
  function stocker(cle, valeur) { try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; } }
  function relire(cle) { try { return JSON.parse(localStorage.getItem(cle)); } catch (e) { return null; } }

  /* ------------------------------------------------------------------ */
  /* Reglages : appliques tout de suite depuis le cache de l'appareil    */
  /* ------------------------------------------------------------------ */
  var DEFAUT = { theme: "auto", couleur: "lagon", fond: "lagon", effet: "verre", podium: true };
  RVZ.reglages = {};
  (function () {
    var c = relire("rvz_reglages") || {};
    for (var k in DEFAUT) RVZ.reglages[k] = DEFAUT[k];
    for (var j in c) RVZ.reglages[j] = c[j];
  })();
  var sombreSysteme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  RVZ.themeEffectif = function () {
    var r = RVZ.reglages;
    if (r.theme === "clair" || r.theme === "sombre") return r.theme;
    // le verre s'adapte au fond : une photo sombre passe l'interface en sombre
    if (r.fond === "photo" && typeof r.fondLum === "number" && imagePhoto()) return r.fondLum < 0.5 ? "sombre" : "clair";
    return sombreSysteme && sombreSysteme.matches ? "sombre" : "clair";
  };

  function imagePhoto() {
    var p = relire("rvz_fond");
    return p && p.image ? p.image : null;
  }

  RVZ.appliquer = function () {
    var r = RVZ.reglages, h = document.documentElement;
    var photo = r.fond === "photo" ? imagePhoto() : null;
    h.setAttribute("data-theme", RVZ.themeEffectif());
    h.setAttribute("data-accent", RVZ.COULEURS_ACCENT[r.couleur] ? r.couleur : "lagon");
    h.setAttribute("data-fond", photo ? "photo" : (RVZ.FONDS[r.fond] ? r.fond : "lagon"));
    h.setAttribute("data-effet", r.effet === "simple" ? "simple" : "verre");
    var f = document.querySelector(".fond");
    if (f) {
      if (photo) { f.classList.add("photo"); f.style.backgroundImage = "url(" + photo + ")"; }
      else { f.classList.remove("photo"); f.style.backgroundImage = ""; }
    }
  };
  RVZ.appliquer();
  if (sombreSysteme) {
    var suivre = function () { RVZ.appliquer(); };
    if (sombreSysteme.addEventListener) sombreSysteme.addEventListener("change", suivre);
    else if (sombreSysteme.addListener) sombreSysteme.addListener(suivre);
  }

  /* Appele en tout debut de <body> : le filtre de verre et le fond */
  RVZ.debut = function () {
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="fond" aria-hidden="true"></div>' + FILTRE_SVG);
    RVZ.appliquer();
  };

  /* ------------------------------------------------------------------ */
  /* Barre du haut + onglets du bas (telephone)                          */
  /* ------------------------------------------------------------------ */
  RVZ.page = "";
  RVZ.surHub = false;
  function lienOnglet(o) { return (RVZ.surHub ? "" : "./") + "#" + o; }

  RVZ.barre = function (page) {
    RVZ.page = page;
    RVZ.surHub = ["accueil", "matieres", "podium", "badges"].indexOf(page) !== -1;
    var onglets = [["accueil", "Accueil", ICONES.maison], ["matieres", "Matières", ICONES.livre],
                   ["podium", "Podium", ICONES.podium], ["badges", "Badges", ICONES.badge]];
    var nav = onglets.map(function (o) {
      return '<a data-onglet="' + o[0] + '" href="' + lienOnglet(o[0]) + '"' + (o[0] === page ? ' class="actif"' : "") + ">" + o[1] + "</a>";
    }).join("");
    var h = $("barre");
    h.className = "barre";
    h.innerHTML =
      '<a class="barre-gauche" href="' + (RVZ.surHub ? "#accueil" : "./") + '" data-onglet="accueil">' + ICONES.logo +
      '<span class="marque">Revyzia</span><span class="version">' + RVZ.version + '</span></a>' +
      '<nav class="nav-haut" aria-label="Navigation">' + nav + '</nav>' +
      '<div class="barre-droite">' +
        (page === "ajouter" ? "" : '<a class="bouton-ajout" href="ajouter.html" title="Ajouter un cours">' + ICONES.plus + '<span class="texte">Ajouter</span></a>') +
        '<span class="pilule jeton serie-haut" title="Série de jours">' + '<span data-rvz="serie">0</span> j</span>' +
        '<span class="pilule jeton" title="XP total"><span data-rvz="xp">0</span> XP</span>' +
        '<div class="menu-ancre">' +
          '<button class="avatar-bouton" id="rvzAvatar" aria-haspopup="true" aria-expanded="false" title="Profil et réglages">' +
            '<span id="rvzInitiale">?</span><span class="pastille-notif masque" id="rvzPastille"></span></button>' +
          '<div class="menu masque" id="rvzMenu" role="menu"></div>' +
        '</div>' +
      '</div>';

    var bas = document.createElement("nav");
    bas.className = "pilule onglets-bas";
    bas.setAttribute("aria-label", "Navigation");
    bas.innerHTML = [onglets[0], onglets[1], ["ajouter", "Ajouter", ICONES.ajout], onglets[2], onglets[3]].map(function (o) {
      var href = o[0] === "ajouter" ? "ajouter.html" : lienOnglet(o[0]);
      return '<a data-onglet="' + o[0] + '" href="' + href + '"' + (o[0] === page ? ' class="actif"' : "") + ">" + o[2] + "<span>" + o[1] + "</span></a>";
    }).join("");
    document.body.appendChild(bas);

    $("rvzAvatar").addEventListener("click", function (e) {
      e.stopPropagation();
      basculerMenu();
    });
    document.addEventListener("click", function (e) {
      var m = $("rvzMenu");
      if (m && !m.classList.contains("masque") && !m.contains(e.target)) fermerMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { fermerMenu(); fermerFeuille(); }
    });
    majBarre();
  };

  RVZ.activerOnglet = function (o) {
    RVZ.page = o;
    var liens = document.querySelectorAll("[data-onglet]");
    for (var i = 0; i < liens.length; i++) {
      if (liens[i].classList.contains("barre-gauche")) continue;
      liens[i].classList.toggle("actif", liens[i].getAttribute("data-onglet") === o);
    }
  };

  function majBarre() {
    var e = RVZ.etat;
    var xp = document.querySelectorAll('[data-rvz="xp"]');
    for (var i = 0; i < xp.length; i++) xp[i].textContent = RVZ.nombre(e ? e.xp : 0);
    var se = document.querySelectorAll('[data-rvz="serie"]');
    for (var j = 0; j < se.length; j++) se[j].textContent = e ? e.serie.serie : 0;
    var av = $("rvzAvatar");
    if (!av || !RVZ.utilisateur) return;
    var photo = (RVZ.fiche && RVZ.fiche.photo) || RVZ.utilisateur.photoURL || "";
    var ini = $("rvzInitiale");
    if (photo && !av.querySelector("img")) {
      var img = document.createElement("img");
      img.alt = ""; img.referrerPolicy = "no-referrer"; img.src = photo;
      img.onerror = function () { img.remove(); ini.style.display = ""; };
      av.insertBefore(img, ini);
      ini.style.display = "none";
    } else if (!photo) {
      ini.textContent = RVZ.prenom().charAt(0).toUpperCase() || "?";
    }
    majPastille();
  }
  RVZ.majBarre = majBarre;

  RVZ.prenom = function () {
    var n = (RVZ.fiche && RVZ.fiche.nom) || (RVZ.utilisateur && RVZ.utilisateur.displayName) || "";
    return n.split(/[\s(]/)[0] || "toi";
  };

  /* ------------------------------------------------------------------ */
  /* Menu profil, comme la maquette 4a                                   */
  /* ------------------------------------------------------------------ */
  function pastillesFond(classeInput) {
    var r = RVZ.reglages;
    var html = Object.keys(RVZ.FONDS).map(function (k) {
      return '<button class="pastille-fond' + (r.fond === k ? " actif" : "") + '" data-fond="' + k + '" title="' + RVZ.FONDS[k].nom +
             '" style="background:' + RVZ.FONDS[k].apercu + '"></button>';
    }).join("");
    var photo = imagePhoto();
    html += '<label class="pastille-fond ajout' + (r.fond === "photo" && photo ? " actif" : "") + '" title="Importer une photo"' +
            (photo ? ' style="background:url(' + photo + ') center/cover"' : "") + ">" + (photo ? "" : "+") +
            '<input type="file" accept="image/*" class="' + classeInput + '"></label>';
    return html;
  }
  function brancherFonds(racine, rafraichir) {
    var b = racine.querySelectorAll(".pastille-fond[data-fond]");
    for (var i = 0; i < b.length; i++) {
      b[i].addEventListener("click", function (e) {
        e.stopPropagation();
        RVZ.changerReglage({ fond: this.getAttribute("data-fond") });
        rafraichir();
      });
    }
    var f = racine.querySelector("input[type=file]");
    if (f) f.addEventListener("change", function () {
      if (f.files[0]) RVZ.importerPhoto(f.files[0]).then(rafraichir);
    });
  }

  function remplirMenu() {
    var m = $("rvzMenu"), fi = RVZ.fiche || {}, u = RVZ.utilisateur;
    if (!u) {
      m.innerHTML = '<div class="menu-nom">Pas connecté</div><hr class="separe">' +
        '<div class="menu-liens"><a class="menu-lien" href="./">Se connecter</a></div>';
      return;
    }
    var nonLues = RVZ.notifs ? RVZ.notifs.filter(function (n) { return n.nouvelle; }).length : 0;
    m.innerHTML =
      '<div class="menu-nom">' + RVZ.echapper(fi.nom || u.displayName || "") + '</div>' +
      '<div class="menu-mail">' + RVZ.echapper(fi.email || u.email || "") + (fi.classe ? " · " + RVZ.echapper(fi.classe) : "") + '</div>' +
      '<hr class="separe">' +
      '<div class="sur-titre" style="margin-bottom:8px">Fond d\'écran</div>' +
      '<div class="pastilles-fond">' + pastillesFond("menu-photo") + '</div>' +
      '<div class="menu-note">Le verre s\'adapte automatiquement au fond choisi.</div>' +
      '<hr class="separe">' +
      '<div class="menu-liens">' +
        '<a class="menu-lien" href="' + lienOnglet("badges") + '" data-ferme>Mon profil &amp; badges</a>' +
        '<button class="menu-lien" id="rvzOuvrirNotifs">Notifications' + (nonLues ? '<span class="menu-compte">' + nonLues + '</span>' : "") + '</button>' +
        '<button class="menu-lien" id="rvzOuvrirReglages">Paramètres</button>' +
        '<button class="menu-lien danger" id="rvzDeconnexion">Se déconnecter</button>' +
      '</div>';
    brancherFonds(m, remplirMenu);
    m.querySelector("[data-ferme]").addEventListener("click", fermerMenu);
    $("rvzOuvrirNotifs").addEventListener("click", function () { fermerMenu(); RVZ.ouvrirNotifications(); });
    $("rvzOuvrirReglages").addEventListener("click", function () { fermerMenu(); RVZ.ouvrirReglages(); });
    $("rvzDeconnexion").addEventListener("click", RVZ.deconnecter);
  }
  function basculerMenu() {
    var m = $("rvzMenu");
    if (m.classList.contains("masque")) {
      remplirMenu();
      m.classList.remove("masque");
      $("rvzAvatar").setAttribute("aria-expanded", "true");
      if (!RVZ.notifs) RVZ.chargerNotifications().then(function () { if (!m.classList.contains("masque")) remplirMenu(); });
    } else fermerMenu();
  }
  function fermerMenu() {
    var m = $("rvzMenu");
    if (!m) return;
    m.classList.add("masque");
    $("rvzAvatar").setAttribute("aria-expanded", "false");
  }

  /* ------------------------------------------------------------------ */
  /* Feuilles : parametres et notifications                              */
  /* ------------------------------------------------------------------ */
  var feuilleOuverte = null;
  function ouvrirFeuille(titre, contenu) {
    fermerFeuille();
    var v = document.createElement("div");
    v.className = "voile";
    v.innerHTML = '<div class="feuille" role="dialog" aria-modal="true" aria-label="' + RVZ.echapper(titre) + '">' +
      '<div class="feuille-haut"><h2>' + RVZ.echapper(titre) + '</h2><button class="fermer" title="Fermer">' + ICONES.croix + '</button></div>' +
      '<div class="feuille-corps"></div></div>';
    v.querySelector(".feuille-corps").appendChild(contenu);
    v.addEventListener("click", function (e) { if (e.target === v) fermerFeuille(); });
    v.querySelector(".fermer").addEventListener("click", fermerFeuille);
    document.body.appendChild(v);
    document.body.style.overflow = "hidden";
    feuilleOuverte = v;
    return v;
  }
  function fermerFeuille() {
    if (!feuilleOuverte) return;
    feuilleOuverte.remove();
    feuilleOuverte = null;
    document.body.style.overflow = "";
  }
  RVZ.ouvrirFeuille = ouvrirFeuille;
  RVZ.fermerFeuille = fermerFeuille;

  function segments(cle, options) {
    var v = RVZ.reglages[cle];
    return '<div class="segments" data-cle="' + cle + '">' + options.map(function (o) {
      return '<button class="segment' + (v === o[0] ? " actif" : "") + '" data-valeur="' + o[0] + '">' + o[1] + "</button>";
    }).join("") + "</div>";
  }

  RVZ.ouvrirReglages = function () {
    var corps = document.createElement("div");
    function rendre() {
      var r = RVZ.reglages, fi = RVZ.fiche || {}, u = RVZ.utilisateur || {};
      var photo = imagePhoto();
      corps.innerHTML =
        '<div class="sur-titre">Apparence</div>' +
        '<div class="reglage"><div class="reglage-nom">Thème</div>' +
          '<div class="reglage-aide">Auto suit ton appareil, ou la photo de fond si tu en as mis une.</div>' +
          segments("theme", [["auto", "Auto"], ["clair", "Clair"], ["sombre", "Sombre"]]) + '</div>' +
        '<div class="reglage"><div class="reglage-nom">Couleur</div>' +
          '<div class="couleurs">' + Object.keys(RVZ.COULEURS_ACCENT).map(function (k) {
            var c = RVZ.COULEURS_ACCENT[k];
            return '<button class="couleur' + (r.couleur === k ? " actif" : "") + '" data-couleur="' + k + '" title="' + c[0] +
                   '" style="background:linear-gradient(135deg,' + c[1] + ',' + c[2] + ')">' + (r.couleur === k ? ICONES.coche : "") + "</button>";
          }).join("") + '</div></div>' +
        '<div class="reglage"><div class="reglage-nom">Fond d\'écran</div>' +
          '<div class="reglage-aide">Un des fonds, ou ta propre photo. Elle te suit sur tous tes appareils.</div>' +
          '<div class="pastilles-fond" style="margin-top:10px">' + pastillesFond("reglage-photo") + '</div>' +
          (photo ? '<button class="btn sobre petit" id="rvzRetirerPhoto" style="margin-top:10px">Retirer ma photo</button>' : "") + '</div>' +
        '<div class="reglage"><div class="reglage-nom">Effet de verre</div>' +
          '<div class="reglage-aide">Le flou simple est plus léger si ton appareil rame.</div>' +
          segments("effet", [["verre", "Verre avec réfraction"], ["simple", "Flou simple"]]) + '</div>' +
        '<div class="sur-titre" style="margin-top:12px">Classe</div>' +
        '<div class="reglage"><div class="reglage-ligne"><div><div class="reglage-nom">Apparaître au podium</div>' +
          '<div class="reglage-aide">Ta classe voit ton prénom, ton XP et quand tu es en ligne. Désactivé, ton nom disparaît du classement mais ton XP continue de compter.</div></div>' +
          '<button class="interrupteur" id="rvzPodium" role="switch" aria-checked="' + (r.podium !== false) + '" title="Apparaître au podium"></button></div></div>' +
        '<div class="reglage"><div class="reglage-nom">Ta classe</div>' +
          '<div class="reglage-aide">' + (fi.classeSource === "classroom" ? "Reconnue depuis tes cours Classroom." : fi.classeSource === "manuel" ? "Saisie à la main." : "Pas encore reconnue : ouvre l'accueil juste après t'être connecté, ou écris-la ici.") + '</div>' +
          '<div style="display:flex;gap:8px;margin-top:10px"><input class="champ-classe" id="rvzClasse" maxlength="20" placeholder="Par exemple 2nde3" value="' + RVZ.echapper(fi.classe || "") + '">' +
          '<button class="btn petit" id="rvzClasseOk">Enregistrer</button></div></div>' +
        '<div class="sur-titre" style="margin-top:12px">Compte</div>' +
        '<div class="reglage"><div class="reglage-nom">' + RVZ.echapper(fi.nom || u.displayName || "") + '</div>' +
          '<div class="reglage-aide">' + RVZ.echapper(fi.email || u.email || "") + '<br>' +
          (fi.classe ? "Classe " + RVZ.echapper(fi.classe) : "Classe pas encore reconnue") + ' · ' + ((fi.groupes || []).length) + ' groupes · ' + RVZ.echapper(fi.role || "eleve") + '</div>' +
          '<button class="btn sobre petit" id="rvzDeco2" style="margin-top:12px">Se déconnecter</button></div>';

      var segs = corps.querySelectorAll(".segments[data-cle]");
      for (var i = 0; i < segs.length; i++) {
        (function (s) {
          var bs = s.querySelectorAll(".segment");
          for (var j = 0; j < bs.length; j++) bs[j].addEventListener("click", function () {
            var ch = {}; ch[s.getAttribute("data-cle")] = this.getAttribute("data-valeur");
            RVZ.changerReglage(ch); rendre();
          });
        })(segs[i]);
      }
      var cs = corps.querySelectorAll(".couleur");
      for (var k = 0; k < cs.length; k++) cs[k].addEventListener("click", function () {
        RVZ.changerReglage({ couleur: this.getAttribute("data-couleur") }); rendre();
      });
      brancherFonds(corps, rendre);
      var ret = corps.querySelector("#rvzRetirerPhoto");
      if (ret) ret.addEventListener("click", function () { RVZ.retirerPhoto(); rendre(); });
      corps.querySelector("#rvzPodium").addEventListener("click", function () {
        RVZ.changerReglage({ podium: RVZ.reglages.podium === false });
        rendre();
        RVZ.classementCache = null;
        RVZ.publierClassement(true);
        if (RVZ.surClasse) setTimeout(function () { RVZ.surClasse(); }, 600);
      });
      corps.querySelector("#rvzDeco2").addEventListener("click", RVZ.deconnecter);
      corps.querySelector("#rvzClasseOk").addEventListener("click", function () {
        var b = this;
        b.disabled = true;
        RVZ.changerClasse(corps.querySelector("#rvzClasse").value, "manuel").then(function () {
          RVZ.toast("Classe enregistrée"); rendre();
        }).catch(function (e) { RVZ.toast("Classe non enregistrée : " + (e.code || e.message)); b.disabled = false; });
      });
    }
    rendre();
    ouvrirFeuille("Paramètres", corps);
  };

  RVZ.notifs = null;
  RVZ.chargerNotifications = function () {
    if (!RVZ.db || !RVZ.utilisateur) return Promise.resolve([]);
    var vue = RVZ.fiche && RVZ.fiche.notifsVues && RVZ.fiche.notifsVues.toMillis ? RVZ.fiche.notifsVues.toMillis() : 0;
    var depuis = Math.max(vue - 14 * 86400000, Date.now() - 30 * 86400000);
    return RVZ.db.collection("chapitres")
      .where("creele", ">", firebase.firestore.Timestamp.fromMillis(depuis)).get().then(function (lot) {
        var liste = [];
        lot.forEach(function (d) {
          var c = d.data();
          if (c.auteur === RVZ.utilisateur.uid) return;
          var t = c.creele && c.creele.toMillis ? c.creele.toMillis() : 0;
          liste.push({ type: "chapitre", id: d.id, titre: c.titre, matiere: c.matiereNom || c.matiere, quand: t, nouvelle: t > vue });
        });
        RVZ.mesCorrections.forEach(function (c) {
          if (c.statut !== "confirmee") return;
          var t = c.creele && c.creele.toMillis ? c.creele.toMillis() : 0;
          if (t < depuis) return;
          liste.push({ type: "correction", titre: c.question || "Ta correction", texte: "Confirmée, +" + RVZ.XP_CORRECTION + " XP", quand: t, nouvelle: t > vue, chapitre: c.chapitre });
        });
        (RVZ.badgesNouveaux || []).forEach(function (b) {
          liste.push({ type: "badge", titre: b.nom, texte: b.description, quand: Date.now(), nouvelle: true });
        });
        liste.sort(function (a, b) { return b.quand - a.quand; });
        RVZ.notifs = liste;
        majPastille();
        return liste;
      }).catch(function (e) {
        console.warn("[Revyzia] notifications illisibles", e);
        RVZ.notifs = [];
        return [];
      });
  };
  function majPastille() {
    var p = $("rvzPastille");
    if (!p) return;
    var n = RVZ.notifs ? RVZ.notifs.filter(function (x) { return x.nouvelle; }).length : 0;
    p.textContent = n > 9 ? "9+" : n;
    p.classList.toggle("masque", !n);
  }
  RVZ.majPastille = majPastille;

  function quand(ms) {
    var j = Math.floor((Date.now() - ms) / 86400000);
    if (j <= 0) return "aujourd'hui";
    if (j === 1) return "hier";
    return "il y a " + j + " jours";
  }
  RVZ.ouvrirNotifications = function () {
    var corps = document.createElement("div");
    corps.innerHTML = '<div class="squelette"></div><div class="squelette" style="width:70%"></div>';
    ouvrirFeuille("Notifications", corps);
    RVZ.chargerNotifications().then(function (liste) {
      if (!liste.length) {
        corps.innerHTML = '<p class="vide">Rien de neuf. Les nouveaux chapitres publiés et tes badges débloqués arrivent ici.</p>';
      } else {
        corps.innerHTML = liste.map(function (n) {
          if (n.type === "correction") return '<a class="notif' + (n.nouvelle ? " nouvelle" : "") + '" href="chapitre.html?c=' + encodeURIComponent(n.chapitre) + '"><span class="tuile" style="width:34px;height:34px;border-radius:11px">' + ICONES.coche +
            '</span><div><div class="notif-titre">Correction confirmée : ' + RVZ.echapper(n.titre) + '</div><div class="notif-texte">' + RVZ.echapper(n.texte) + '</div></div></a>';
          if (n.type === "badge") return '<div class="notif nouvelle"><span class="tuile" style="width:34px;height:34px;border-radius:11px">' + ICONES.coche +
            '</span><div><div class="notif-titre">Badge débloqué : ' + RVZ.echapper(n.titre) + '</div><div class="notif-texte">' + RVZ.echapper(n.texte || "") + '</div></div></div>';
          return '<a class="notif' + (n.nouvelle ? " nouvelle" : "") + '" href="chapitre.html?c=' + encodeURIComponent(n.id) + '">' +
            '<span class="tuile" style="width:34px;height:34px;border-radius:11px;font-size:14px">' + RVZ.echapper((n.matiere || "?").charAt(0).toUpperCase()) + '</span>' +
            '<div><div class="notif-titre">' + RVZ.echapper(n.titre) + '</div><div class="notif-texte">Nouveau chapitre en ' + RVZ.echapper(n.matiere || "") + ', ' + quand(n.quand) + '</div></div></a>';
        }).join("");
      }
      // tout est lu
      RVZ.badgesNouveaux = [];
      RVZ.notifs.forEach(function (n) { n.nouvelle = false; });
      RVZ.notifs = RVZ.notifs.filter(function (n) { return n.type !== "badge"; });
      majPastille();
      if (RVZ.db && RVZ.utilisateur) {
        RVZ.db.collection("users").doc(RVZ.utilisateur.uid)
          .update({ notifsVues: firebase.firestore.FieldValue.serverTimestamp() })
          .then(function () { if (RVZ.fiche) RVZ.fiche.notifsVues = firebase.firestore.Timestamp.now(); })
          .catch(function (e) { console.warn("[Revyzia] notifications non marquees", e); });
      }
    });
  };

  RVZ.toast = function (message) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };

  /* ------------------------------------------------------------------ */
  /* Changement de reglage : appareil tout de suite, compte ensuite      */
  /* ------------------------------------------------------------------ */
  var envoiReglages = null;
  RVZ.changerReglage = function (changements) {
    for (var k in changements) RVZ.reglages[k] = changements[k];
    stocker("rvz_reglages", RVZ.reglages);
    RVZ.appliquer();
    clearTimeout(envoiReglages);
    envoiReglages = setTimeout(function () {
      if (!RVZ.db || !RVZ.utilisateur) return;
      RVZ.db.collection("users").doc(RVZ.utilisateur.uid).update({ reglages: RVZ.reglages })
        .catch(function (e) { console.warn("[Revyzia] reglages non enregistres", e); });
    }, 500);
  };

  // photo : compressee en JPEG dans le navigateur, gardee dans users/{uid}/prive/fond
  RVZ.importerPhoto = function (fichier) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(fichier);
      var img = new Image();
      img.onload = function () {
        var cote = 1920, w = img.naturalWidth, h = img.naturalHeight;
        var echelle = Math.min(1, cote / Math.max(w, h));
        var c = document.createElement("canvas");
        var image = "", qualite = 0.8;
        for (var essai = 0; essai < 6; essai++) {
          c.width = Math.round(w * echelle); c.height = Math.round(h * echelle);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          image = c.toDataURL("image/jpeg", qualite);
          if (image.length < 520000) break;
          qualite -= 0.1; echelle *= 0.82;
        }
        // luminosite moyenne, pour adapter le verre
        var p = document.createElement("canvas");
        p.width = 24; p.height = 24;
        var cx = p.getContext("2d");
        cx.drawImage(img, 0, 0, 24, 24);
        var d = cx.getImageData(0, 0, 24, 24).data, total = 0;
        for (var i = 0; i < d.length; i += 4) total += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        URL.revokeObjectURL(url);
        var version = Date.now();
        if (!stocker("rvz_fond", { v: version, image: image })) RVZ.toast("Photo trop lourde pour cet appareil");
        RVZ.changerReglage({ fond: "photo", fondLum: Math.round(total / (d.length / 4) * 100) / 100, fondVersion: version });
        if (RVZ.db && RVZ.utilisateur) {
          RVZ.db.collection("users").doc(RVZ.utilisateur.uid).collection("prive").doc("fond")
            .set({ image: image, v: version })
            .then(function () { RVZ.toast("Fond enregistré sur ton compte"); })
            .catch(function (e) { console.warn("[Revyzia] photo non enregistree", e); RVZ.toast("Fond gardé sur cet appareil seulement"); });
        }
        ok();
      };
      img.onerror = function () { URL.revokeObjectURL(url); RVZ.toast("Image illisible"); ok(); };
      img.src = url;
    });
  };
  RVZ.retirerPhoto = function () {
    try { localStorage.removeItem("rvz_fond"); } catch (e) {}
    RVZ.changerReglage({ fond: "lagon", fondLum: null, fondVersion: null });
    if (RVZ.db && RVZ.utilisateur) {
      RVZ.db.collection("users").doc(RVZ.utilisateur.uid).collection("prive").doc("fond").delete().catch(function () {});
    }
  };
  function synchroniserPhoto() {
    var r = RVZ.reglages;
    if (r.fond !== "photo" || !r.fondVersion) return;
    var local = relire("rvz_fond");
    if (local && local.v === r.fondVersion) return;
    RVZ.db.collection("users").doc(RVZ.utilisateur.uid).collection("prive").doc("fond").get().then(function (d) {
      if (!d.exists) return;
      stocker("rvz_fond", { v: d.data().v, image: d.data().image });
      RVZ.appliquer();
    }).catch(function (e) { console.warn("[Revyzia] photo illisible", e); });
  }

  /* ------------------------------------------------------------------ */
  /* Firebase                                                            */
  /* ------------------------------------------------------------------ */
  function charger(url) {
    return new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = url; s.async = false;
      s.onload = function () { ok(); };
      s.onerror = function () { ko(new Error(url)); };
      document.head.appendChild(s);
    });
  }
  RVZ.chargerScript = charger;
  // gstatic est souvent bloque a Hong Kong, il passe en dernier
  function avecSecours(fichier) {
    var i = 0;
    function suivant() {
      if (i >= BASES.length) return Promise.reject(new Error("aucune source pour " + fichier));
      var url = BASES[i++] + fichier;
      return charger(url).catch(function () {
        console.warn("[Revyzia] indisponible :", url);
        return suivant();
      });
    }
    return suivant();
  }
  var sdk = null;
  RVZ.sdk = function () {
    if (sdk) return sdk;
    sdk = FICHIERS.reduce(function (c, f) { return c.then(function () { return avecSecours(f); }); }, Promise.resolve())
      .then(function () {
        firebase.initializeApp(CONFIG);
        RVZ.auth = firebase.auth();
        RVZ.db = firebase.firestore();
        try { RVZ.db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
      });
    return sdk;
  };

  function avecDelai(promesse, ms) {
    return Promise.race([promesse, new Promise(function (_, ko) { setTimeout(function () { ko(new Error("delai")); }, ms); })]);
  }

  function ficheUtilisateur(u) {
    var ref = RVZ.db.collection("users").doc(u.uid);
    return ref.get().then(function (d) {
      if (d.exists) return d.data();
      var nouvelle = {
        email: u.email || "", nom: u.displayName || "", photo: u.photoURL || "",
        role: "eleve", etablissement: ETABLISSEMENT, classe: "", groupes: [],
        reglages: RVZ.reglages, xp: 0, serie: 0, derniereRevision: "",
        creele: firebase.firestore.FieldValue.serverTimestamp()
      };
      return ref.set(nouvelle).then(function () { return nouvelle; });
    });
  }

  /* RVZ.demarrer({ surPret(etat), surDeconnecte(), surErreur(e) }) */
  RVZ.demarrer = function (o) {
    o = o || {};
    var dejaPret = false;
    RVZ.sdk().then(function () {
      RVZ.auth.onAuthStateChanged(function (u) {
        RVZ.utilisateur = u;
        if (!u) { majBarre(); if (o.surDeconnecte) o.surDeconnecte(); return; }
        if (dejaPret) return;
        avecDelai(Promise.all([ficheUtilisateur(u), lireProgression(u), lireActivite(u), lireMesCorrections(u)]), 12000).then(function (r) {
          dejaPret = true;
          RVZ.fiche = r[0];
          // les reglages du compte priment sur ceux de l'appareil
          if (RVZ.fiche.reglages) {
            for (var k in RVZ.fiche.reglages) RVZ.reglages[k] = RVZ.fiche.reglages[k];
            stocker("rvz_reglages", RVZ.reglages);
            RVZ.appliquer();
            synchroniserPhoto();
          }
          RVZ.mesCorrections = r[3];
          RVZ.etat = construireEtat(r[1], r[2]);
          majBarre();
          return assurerClassement().then(function () {
            RVZ.publierClassement(false);
            setInterval(pouls, POULS_MS);
            if (o.surPret) o.surPret(RVZ.etat);
            encaisserCorrections();
            RVZ.chargerNotifications();
          });
        }).catch(function (e) {
          console.error("[Revyzia] demarrage", e);
          if (o.surErreur) o.surErreur(e);
        });
      });
    }).catch(function (e) {
      console.error("[Revyzia] SDK indisponible", e);
      if (o.surErreur) o.surErreur(e);
    });
  };

  RVZ.deconnecter = function () {
    try { sessionStorage.removeItem("rvz_jeton"); } catch (e) {}
    if (!RVZ.auth) { location.href = "./"; return; }
    RVZ.auth.signOut().then(function () { location.href = "./"; });
  };

  /* ------------------------------------------------------------------ */
  /* Progression, activite du jour, serie                                */
  /* ------------------------------------------------------------------ */
  function lireProgression(u) {
    return RVZ.db.collection("users").doc(u.uid).collection("progression").get().then(function (lot) {
      var docs = {};
      lot.forEach(function (d) { docs[d.id] = d.data(); });
      return docs;
    }).catch(function (e) { console.warn("[Revyzia] progression illisible", e); return {}; });
  }
  function lireActivite(u) {
    return RVZ.db.collection("users").doc(u.uid).collection("prive").doc("activite").get().then(function (d) {
      return d.exists ? (d.data().jours || {}) : null;
    }).catch(function (e) { console.warn("[Revyzia] activite illisible", e); return null; });
  }

  function jourCle(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  RVZ.jourCle = jourCle;
  function decaler(cle, n) {
    var p = cle.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return jourCle(d);
  }
  function lundi() {
    var d = new Date();
    var ecart = (d.getDay() + 6) % 7;
    return jourCle(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ecart));
  }
  RVZ.cleSemaine = lundi;

  RVZ.calculerSerie = function (jours) {
    var aujourd = jourCle(), d = aujourd, serie = 0;
    if (!(jours[d] > 0)) d = decaler(d, -1);
    while (jours[d] > 0) { serie++; d = decaler(d, -1); }
    var cles = Object.keys(jours).filter(function (k) { return jours[k] > 0; }).sort();
    var record = 0, courant = 0, avant = null;
    cles.forEach(function (k) {
      courant = avant && decaler(avant, 1) === k ? courant + 1 : 1;
      if (courant > record) record = courant;
      avant = k;
    });
    return { serie: serie, record: Math.max(record, serie), aujourdhui: jours[aujourd] > 0 };
  };

  function construireEtat(progression, jours) {
    var xp = 0;
    for (var id in progression) xp += progression[id].xpGagne || 0;
    RVZ.mesCorrections.forEach(function (c) { if (c.recompensee) xp += RVZ.XP_CORRECTION; });
    var aSemer = !jours;
    if (!jours) {
      // premiere visite en v1.5 : on reconstruit l'activite a partir des dates de progression
      jours = {};
      for (var c in progression) {
        var p = progression[c];
        if (p.maj && p.maj.toDate && p.xpGagne) {
          var k = jourCle(p.maj.toDate());
          jours[k] = (jours[k] || 0) + p.xpGagne;
        }
      }
    }
    var etat = { xp: xp, progression: progression, jours: jours };
    recalculer(etat);
    if (aSemer && Object.keys(jours).length) sauverActivite(etat);
    return etat;
  }
  function recalculer(etat) {
    etat.serie = RVZ.calculerSerie(etat.jours);
    var l = lundi(), semaine = 0;
    for (var k in etat.jours) if (k >= l) semaine += etat.jours[k] || 0;
    etat.xpSemaine = semaine;
  }

  var envoiActivite = null;
  function sauverActivite(etat) {
    clearTimeout(envoiActivite);
    envoiActivite = setTimeout(function () {
      if (!RVZ.db || !RVZ.utilisateur) return;
      // on garde 400 jours, assez pour les records
      var limite = decaler(jourCle(), -400), propre = {};
      for (var k in etat.jours) if (k >= limite) propre[k] = etat.jours[k];
      etat.jours = propre;
      RVZ.db.collection("users").doc(RVZ.utilisateur.uid).collection("prive").doc("activite")
        .set({ jours: propre, maj: firebase.firestore.FieldValue.serverTimestamp() })
        .catch(function (e) { console.warn("[Revyzia] activite non enregistree", e); });
    }, 1200);
  }

  /* A appeler par les pages quand l'eleve gagne de l'XP */
  RVZ.gagnerXp = function (n) {
    var e = RVZ.etat;
    if (!e || !n) return;
    var avant = e.serie.serie;
    var k = jourCle();
    e.xp += n;
    e.jours[k] = (e.jours[k] || 0) + n;
    recalculer(e);
    majBarre();
    if (e.serie.serie > avant && e.serie.serie > 1) RVZ.toast("Série de " + e.serie.serie + " jours, continue");
    sauverActivite(e);
    xpEnAttente += n;
    planifierXp(1200);
    if (RVZ.surXp) RVZ.surXp(e);
  };

  /* ------------------------------------------------------------------ */
  /* Classement et presence                                              */
  /* ------------------------------------------------------------------ */
  /* L'XP du podium ne se fixe pas : il monte par petits paquets que les regles Firestore verifient
     (120 XP au plus par ecriture, une ecriture toutes les 2 secondes, 1 500 XP par jour glissant). */
  var MAX_PAR_ECRITURE = 120, MAX_PAR_JOUR = 1500, ESPACEMENT_MS = 2600;
  var JOUR_MS = 86400000;
  RVZ.monClassement = null;      // etat de sa ligne, tel que Firestore l'a
  var xpEnAttente = 0, envoiXp = null, dernierEnvoiXp = 0, echecsXp = 0, capAnnonce = false;

  function refClassement() { return RVZ.db.collection("classement").doc(RVZ.utilisateur.uid); }
  function ms(t) { return t && t.toMillis ? t.toMillis() : 0; }
  function visible() { return RVZ.reglages.podium !== false; }
  function profil() {
    var fi = RVZ.fiche || {}, v = visible();
    return {
      prenom: v ? RVZ.prenom().slice(0, 40) : "",
      photo: v ? (fi.photo || RVZ.utilisateur.photoURL || "").slice(0, 500) : "",
      visible: v,
      classe: fi.classe || "",
      serie: RVZ.etat ? Math.min(RVZ.etat.serie.serie, 3650) : 0,
      vu: firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  // Cree sa ligne si elle manque (ou si elle date de la v1.5, sans compteurs) : l'XP du podium part de 0.
  function assurerClassement() {
    var ref = refClassement();
    return ref.get().then(function (d) {
      var c = d.exists ? d.data() : null;
      if (c && c.xpMaj && typeof c.xpJour === "number" && "visible" in c) {
        RVZ.monClassement = { xp: c.xp || 0, xpSemaine: c.xpSemaine || 0, semaine: c.semaine || "",
                              xpJour: c.xpJour || 0, jourDebut: ms(c.jourDebut), xpMaj: ms(c.xpMaj) };
        // une autre page vient peut-etre d'ecrire : on respecte l'espacement des la premiere ecriture
        dernierEnvoiXp = Math.min(Date.now(), RVZ.monClassement.xpMaj);
        return;
      }
      var supprimer = c ? ref.delete() : Promise.resolve();
      return supprimer.then(function () {
        var fi = RVZ.fiche || {}, ts = firebase.firestore.FieldValue.serverTimestamp();
        var ligne = profil();
        ligne.etablissement = fi.etablissement || ETABLISSEMENT;
        ligne.xp = 0; ligne.xpSemaine = 0; ligne.semaine = lundi(); ligne.xpJour = 0;
        ligne.jourDebut = ts; ligne.xpMaj = ts; ligne.vu = ts;
        return ref.set(ligne).then(function () {
          RVZ.monClassement = { xp: 0, xpSemaine: 0, semaine: lundi(), xpJour: 0, jourDebut: Date.now(), xpMaj: Date.now() };
          dernierEnvoiXp = Date.now();
        });
      });
    }).catch(function (e) { console.warn("[Revyzia] ligne du podium indisponible", e); });
  }

  // Prenom, photo, classe, serie, visibilite : sans toucher a l'XP
  var envoiProfil = null;
  RVZ.publierClassement = function (immediat) {
    clearTimeout(envoiProfil);
    envoiProfil = setTimeout(function () {
      if (!RVZ.db || !RVZ.utilisateur || !RVZ.monClassement) return;
      refClassement().update(profil()).then(function () { RVZ.classementCache = null; })
        .catch(function (e) { console.warn("[Revyzia] podium non mis a jour", e); });
    }, immediat ? 0 : 1500);
  };

  function planifierXp(delai) {
    clearTimeout(envoiXp);
    envoiXp = setTimeout(envoyerXp, Math.max(delai, dernierEnvoiXp + ESPACEMENT_MS - Date.now(), 0));
  }
  function envoyerXp() {
    var m = RVZ.monClassement;
    if (!m || !xpEnAttente || !RVZ.db || !RVZ.utilisateur) return;
    var maintenant = Date.now(), ecoule = maintenant - m.jourDebut;
    var remise = ecoule > 21 * 3600000;                 // la regle accepte la remise a zero apres 20 h
    if (!remise && ecoule > 23 * 3600000) { planifierXp(60000); return; }
    var dejaJour = remise ? 0 : m.xpJour;
    var delta = Math.min(xpEnAttente, MAX_PAR_ECRITURE, MAX_PAR_JOUR - dejaJour);
    if (delta <= 0) {
      if (!capAnnonce) { capAnnonce = true; RVZ.toast("1 500 XP aujourd'hui : le podium s'arrête là, tes révisions comptent quand même"); }
      xpEnAttente = 0;
      return;
    }
    var semaine = lundi(), ts = firebase.firestore.FieldValue.serverTimestamp();
    var maj = profil();
    maj.xp = m.xp + delta;
    maj.semaine = semaine;
    maj.xpSemaine = (semaine === m.semaine ? m.xpSemaine : 0) + delta;
    maj.xpJour = dejaJour + delta;
    if (remise) maj.jourDebut = ts;
    maj.xpMaj = ts;
    dernierEnvoiXp = maintenant;
    refClassement().update(maj).then(function () {
      m.xp = maj.xp; m.semaine = semaine; m.xpSemaine = maj.xpSemaine; m.xpJour = maj.xpJour;
      if (remise) m.jourDebut = Date.now();
      m.xpMaj = Date.now();
      xpEnAttente -= delta; echecsXp = 0;
      RVZ.classementCache = null;
      if (xpEnAttente > 0) planifierXp(ESPACEMENT_MS);
    }).catch(function (e) {
      echecsXp++;
      console.warn("[Revyzia] XP du podium refuse (" + echecsXp + ")", e && e.code);
      if (echecsXp < 4) planifierXp(5000 * echecsXp);
      else { xpEnAttente = 0; echecsXp = 0; }
    });
  }

  function pouls() {
    if (document.visibilityState !== "visible" || !visible()) return;
    if (!RVZ.db || !RVZ.utilisateur || !RVZ.monClassement) return;
    refClassement().update({ vu: firebase.firestore.FieldValue.serverTimestamp() })
      .catch(function (e) { console.warn("[Revyzia] presence non signalee", e && e.code); });
  }

  /* portee : "classe" ou "lycee". Renvoie la liste des lignes visibles. */
  RVZ.classementCache = null;
  RVZ.lireClassement = function (portee) {
    var fi = RVZ.fiche || {};
    var parClasse = portee === "classe" && fi.classe;
    var cle = parClasse ? "c:" + fi.classe : "l";
    if (RVZ.classementCache && RVZ.classementCache.cle === cle && Date.now() - RVZ.classementCache.quand < 60000) {
      return Promise.resolve(RVZ.classementCache.liste);
    }
    var q = RVZ.db.collection("classement").where("etablissement", "==", fi.etablissement || ETABLISSEMENT);
    if (parClasse) q = q.where("classe", "==", fi.classe);
    var semaine = lundi(), maintenant = Date.now();
    return q.get().then(function (lot) {
      var liste = [];
      lot.forEach(function (d) {
        var c = d.data();
        if (c.visible === false || !c.prenom) return;
        liste.push({
          uid: d.id, prenom: c.prenom, classe: c.classe || "", photo: c.photo || "",
          xp: c.xp || 0, xpSemaine: c.semaine === semaine ? (c.xpSemaine || 0) : 0, serie: c.serie || 0,
          enLigne: maintenant - ms(c.vu) < EN_LIGNE_MS, moi: RVZ.utilisateur && d.id === RVZ.utilisateur.uid
        });
      });
      // sa propre ligne, a jour avec l'XP pas encore envoye
      var m = RVZ.monClassement;
      if (visible() && m && RVZ.utilisateur) {
        liste = liste.filter(function (c) { return !c.moi; });
        liste.push({ uid: RVZ.utilisateur.uid, prenom: RVZ.prenom(), classe: fi.classe || "",
                     photo: fi.photo || RVZ.utilisateur.photoURL || "", xp: m.xp + xpEnAttente,
                     xpSemaine: (m.semaine === semaine ? m.xpSemaine : 0) + xpEnAttente,
                     serie: RVZ.etat ? RVZ.etat.serie.serie : 0, enLigne: true, moi: true });
      }
      RVZ.classementCache = { cle: cle, quand: Date.now(), liste: liste };
      return liste;
    });
  };

  /* Classe : deduite de Classroom ou saisie a la main, puis reportee sur le podium */
  RVZ.changerClasse = function (classe, source, groupes) {
    classe = String(classe || "").trim().slice(0, 20);
    var maj = { classe: classe, classeSource: source || "manuel" };
    if (groupes) maj.groupes = groupes;
    return RVZ.db.collection("users").doc(RVZ.utilisateur.uid).update(maj).then(function () {
      for (var k in maj) RVZ.fiche[k] = maj[k];
      RVZ.classementCache = null;
      RVZ.publierClassement(true);
      if (RVZ.surClasse) RVZ.surClasse(classe);
    });
  };

  /* ------------------------------------------------------------------ */
  /* Corrections : recompense de 50 XP, encaissee une seule fois         */
  /* ------------------------------------------------------------------ */
  RVZ.XP_CORRECTION = 50;
  RVZ.mesCorrections = [];
  function lireMesCorrections(u) {
    return RVZ.db.collection("corrections").where("auteur", "==", u.uid).get().then(function (lot) {
      var l = [];
      lot.forEach(function (d) { var c = d.data(); c.id = d.id; l.push(c); });
      return l;
    }).catch(function (e) { console.warn("[Revyzia] corrections illisibles", e); return []; });
  }
  function encaisserCorrections() {
    RVZ.mesCorrections.forEach(function (c) {
      if (c.statut !== "confirmee" || c.recompensee) return;
      RVZ.db.collection("corrections").doc(c.id).update({ recompensee: true }).then(function () {
        c.recompensee = true;
        RVZ.gagnerXp(RVZ.XP_CORRECTION);
        RVZ.toast("Ta correction est confirmée : +" + RVZ.XP_CORRECTION + " XP");
      }).catch(function (e) { console.warn("[Revyzia] recompense non encaissee", e); });
    });
  }

  var FILTRE_SVG = "<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\"> <defs> <filter id=\"rvzLens\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"> <feImage href=\"data:image/png;base64,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\" preserveAspectRatio=\"none\" result=\"carte\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"></feImage> <feDisplacementMap in=\"SourceGraphic\" in2=\"carte\" scale=\"22\" xChannelSelector=\"R\" yChannelSelector=\"G\"></feDisplacementMap> </filter> </defs> </svg>";
})();
