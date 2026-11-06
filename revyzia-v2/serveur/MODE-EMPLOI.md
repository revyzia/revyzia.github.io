# Serveur Revyzia, mise en route

Tout se fait depuis ton ordinateur, avec le compte Cloudflare de Revyzia.
Aucune carte bancaire. Aucune cle d'API dans le code.

## 1. Installer l'outil Cloudflare

Il faut Node.js. Ensuite, dans un terminal, place-toi dans le dossier `serveur` :

    npx wrangler login

Une page s'ouvre, tu autorises avec le compte Revyzia.

## 2. Publier le serveur

    npx wrangler deploy

Cloudflare renvoie une adresse du type :

    https://revyzia-api.revyzia.workers.dev

Note-la, c'est elle que le site appellera.

## 3. Verifier qu'il repond

Ouvre dans le navigateur :

    https://revyzia-api.revyzia.workers.dev/sante

Tu dois voir `{"ok":true,"modele":"@cf/meta/llama-3.1-8b-instruct"}`.

## 4. Activer le quota par eleve

    npx wrangler kv namespace create QUOTAS

La commande affiche un identifiant. Decommente le bloc `[[kv_namespaces]]`
dans `wrangler.toml`, colle l'identifiant a la place de `a_remplacer`, puis :

    npx wrangler deploy

Sans cette etape le serveur marche quand meme, mais rien ne limite
le nombre de generations par eleve.

## 5. Changer de modele

Le modele est une simple variable dans `wrangler.toml`. Pour en essayer
un autre, change `AI_MODELE` puis redeploie. La liste des modeles
disponibles sur le plan gratuit est dans le tableau de bord Cloudflare,
section AI, Workers AI.

## Ce que fait le serveur

- `GET /sante` : dit s'il tourne et quel modele est actif.
- `POST /generer` : recoit le texte d'un cours, rend un chapitre au format Revyzia.

Il refuse toute requete sans jeton Firebase valide, donc seul un eleve
connecte a Revyzia peut l'utiliser. Il refuse aussi les requetes venant
d'un autre site que revyzia.pages.dev.

## Limites connues

- 10 000 neurones par jour sur le plan gratuit, remis a zero a minuit UTC.
- 12 generations par eleve et par jour.
- 24 000 caracteres par document, au dela le texte est coupe.
- Le serveur recoit du texte, pas des PDF. L'extraction du texte se fait
  dans le navigateur, c'est la prochaine etape.
