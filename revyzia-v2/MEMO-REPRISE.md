# Revyzia v2, memo de reprise

Pour demarrer une nouvelle session Claude dans le projet REVYZIA.
Derniere mise a jour : 7 novembre 2026, version du site v1.6.

## Ce qui existe et tourne

| Quoi | Ou |
|---|---|
| Site | https://revyzia.pages.dev (Cloudflare Pages, relie a GitHub) |
| Code | GitHub revyzia/revyzia.github.io, dossier `revyzia-v2` (Root directory de Cloudflare) |
| Serveur de generation | https://revyzia-api.revyzia.workers.dev (Cloudflare Worker) |
| Base et comptes | Firebase projet `revyzia-app`, Firestore region asia-southeast1 |
| Google Cloud | projet `revyzia-app`, mode Test, utilisateurs test a ajouter un par un |

Comptes : tout est sur revyzia@gmail.com, sauf la connexion au site qui se fait
avec l'adresse du lycee. Ne jamais melanger avec le compte GitHub d'Ebenai.

## Fichiers du site

- `commun.css` + `commun.js` : socle partage par les 3 pages (theme, couleur, fonds, effet verre,
  barre + menu profil + onglets du bas sur telephone, parametres, notifications, serie, podium).
  Le filtre de verre (carte en base64) vit dans commun.js. Les 3 pages chargent ces 2 fichiers.
- `index.html` : connexion Google, hub en 4 onglets (#accueil, #matieres, #podium, #badges), Classroom
- `chapitre.html` : moteur de chapitre (cours, flashcards, QCM, exercices, progression)
- `ajouter.html` : depot d'un cours, lecture du PDF dans le navigateur, generation, publication
- `cours/index.json` : manifeste des matieres et des chapitres fichiers
- `cours/*.json` : chapitres ecrits a la main
- `firestore.rules` : regles de securite, a coller dans la console Firebase
  (v1.6 : progression et classement bornes, corrections, prive/activite et prive/fond)

## Donnees ajoutees en v1.5

- `users/{uid}.reglages` : theme (auto/clair/sombre), couleur (lagon/indigo/framboise/sauge/graphite),
  fond (lagon/brume/rayures/aube/damier/photo), effet (verre/simple), podium (true/false), fondLum, fondVersion
- `users/{uid}.notifsVues` : date de derniere lecture des notifications
- `users/{uid}/prive/activite` : { jours: { "AAAA-MM-JJ": xp } }, sert a la serie, au record et a l'XP de la semaine
- `users/{uid}/prive/fond` : photo de fond compressee en JPEG (moins de 520 Ko), suit l'eleve partout
- `classement/{uid}` : prenom, classe, etablissement, visible, xp, xpSemaine, semaine, xpJour, jourDebut,
  xpMaj, serie, photo, vu. Lisible par les connectes, chacun n'ecrit que sa ligne. En ligne = vu < 6 min.
  Masque (podium = false) : prenom et photo vides, visible false, l'XP continue de compter.
  Anti-triche v1.6 : l'XP du podium part de 0, +120 max par ecriture, une ecriture toutes les 2 s,
  1 500 XP max par 24 h glissantes. La progression n'accepte que des elements nouveaux (1 a 12 par
  ecriture, 3 a 10 XP chacun, une ecriture toutes les 2 s). Triche encore possible mais bornee a 1 500/jour.
- `corrections/{id}` : chapitre, section, item, question, proposition (-1 = retirer), message, auteur,
  auteurPrenom, confirmations [uids], statut (ouverte/confirmee/rejetee), recompensee, parProf.
  3 confirmations d'autres eleves ou 1 prof = confirmee : la bonne reponse change pour tous (ou la
  question disparait si -1), l'auteur encaisse 50 XP une seule fois au prochain chargement.
- `users/{uid}.classe`, `classeSource` (classroom ou manuel), `groupes` (ids des cours Classroom retenus) :
  la classe est deduite des noms des cours Classroom (2nde3, 1ere2, Tle4, 3eA...), corrigeable dans
  Parametres ; une saisie manuelle n'est jamais ecrasee.
- Badges calcules dans le navigateur (15 badges, liste BADGES dans index.html)

## Serveur

`serveur/src/worker.js`, deploye par l'editeur en ligne de Cloudflare, pas par le terminal.
Bindings en place : `AI` (Workers AI), `QUOTAS` (KV), variable `AI_MODELE`.
Aucune cle d'API nulle part : le modele est appele par le binding.
Verifie le jeton Firebase a chaque requete, 12 generations par eleve et par jour,
origine limitee a revyzia.pages.dev, et la sortie du modele est revalidee avant usage.

## Decisions prises, a ne pas rediscuter

- Identite couleur : Lagon #0E7490, accent clair #7FD3E0
- Polices : Bricolage Grotesque pour les titres, Instrument Sans pour le texte
- Design : liquid glass avec refraction reelle, carte de deformation en base64 dans la page,
  recette reprise de la maquette 4a du fichier Claude Design
- Methode de verre retenue : backdrop-filter avec filtre SVG, repli en flou simple sur Safari
- Le contenu vient des cours des profs, jamais du programme officiel
- Deux sources : Classroom (teste, fonctionne, Drive compris) et depot par les eleves
- L'emploi du temps sert aux horaires, Classroom sert a l'appartenance aux groupes
- Un groupe = classe ou groupe matiere ; SES et EMC partagent un cours Classroom
- Corrections : 3 confirmations d'eleves ou 1 prof, 50 XP si confirmee
- Fiches : publiques par defaut, interrupteur par fiche, XP a l'usage reel
- Tout doit rester gratuit, zero carte bancaire
- Jamais de tiret cadratin, ni dans les reponses ni dans le code

## Ce qui reste a faire

1. (fait en v1.5) Tout le design de la maquette 4a et les options prevues : menu profil avec fonds
   et photo, parametres (theme, couleur, effet, podium), notifications, onglets Matieres / Podium /
   Badges, serie reelle, podium de classe et eleves en ligne, source Classroom dans ajouter,
   mise en page fluide jusqu'a 1560 px et barre d'onglets en bas sur telephone.
   (fait en v1.6) Anti-triche par les regles, systeme de corrections complet, classe depuis Classroom,
   bug du 12e quota corrige dans serveur/src/worker.js.
   A FAIRE : coller firestore.rules dans la console, recoller worker.js dans l'editeur Cloudflare,
   tester en ligne, pousser les 6 fichiers du site sur GitHub.
2. Import de l'emploi du temps Pronote en PDF, avec verification du nom
3. (fait en v1.6) Remplir la classe et les groupes depuis Classroom
4. Contenu : chapitres reels dans trois ou quatre matieres
5. (fait en v1.6) Signalement des erreurs de QCM, avec le systeme de corrections
6. Fiches memo creees par les eleves
7. Espace prof, puis page admin et statistiques
8. Essayer un modele plus gros que llama-3.1-8b

## Comment demarrer la nouvelle session

Dans le projet REVYZIA, nouveau chat, et joindre :
- `revyzia-v2.zip`, le code actuel du site
- `serveur/src/worker.js`, le code du serveur
- `Revyzia_dc.html`, le fichier des maquettes Claude Design, la reference du design
- ce memo

Premier message suggere : "On continue Revyzia v2. Voici le code actuel, le serveur et
les maquettes. On en est a la v1.6 : maquette 4a complete, podium borne, corrections, classe depuis Classroom. Prochaine etape : [X]."
