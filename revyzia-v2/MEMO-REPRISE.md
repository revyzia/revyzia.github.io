# Revyzia v2, memo de reprise

Pour demarrer une nouvelle session Claude dans le projet REVYZIA.
Derniere mise a jour : 6 novembre 2026, version du site v1.3.

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

- `index.html` : connexion Google, hub (statistiques, matieres, seance du jour, Classroom)
- `chapitre.html` : moteur de chapitre (cours, flashcards, QCM, exercices, progression)
- `ajouter.html` : depot d'un cours, lecture du PDF dans le navigateur, generation, publication
- `cours/index.json` : manifeste des matieres et des chapitres fichiers
- `cours/*.json` : chapitres ecrits a la main
- `firestore.rules` : regles de securite, a coller dans la console Firebase

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

1. Finir le design des pages chapitre et ajouter, sur le modele du hub v1.3
2. Import de l'emploi du temps Pronote en PDF, avec verification du nom
3. Remplir la classe et les groupes depuis Classroom
4. Contenu : chapitres reels dans trois ou quatre matieres
5. Signalement des erreurs de QCM, avec le systeme de corrections
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
les maquettes. On en est a la v1.3, le hub suit la maquette 4a. Prochaine etape : [X]."
