# Code secret en couleurs · v0.1.1

Jeu solo statique : quatre couleurs à retrouver en dix essais, utilisable au clavier et sur petit écran. Aucune dépendance à installer pour le jeu, aucun compte, serveur applicatif, service d’IA ou stockage de données personnelles.

## Démarrer et vérifier

Pour jouer, extraire **tout le ZIP**, puis double-cliquer sur `index.html`. Le dossier `dist` et le dossier `src` doivent rester à côté du fichier. Aucun serveur ni installation n’est nécessaire pour cette ouverture directe.

Pour développer et lancer les vérifications navigateur, depuis ce dossier, avec Node.js 22 ou plus récent :

```sh
node scripts/serve.js
```

Ouvrir <http://127.0.0.1:4173/>. Arrêter avec Ctrl+C. Les tests navigateur en cadre utilisent HTTP pour accéder à la page depuis le cadre parent.

Après toute modification de `src/game.js` ou `src/app.js`, exécuter `node scripts/build.js`. Le script classique `dist/app.js` est généré et livré dans le ZIP ; il doit également être enregistré dans Git. `node scripts/build.js --check` vérifie qu’il correspond aux sources.

```sh
node --test test/game.test.js
node --check src/game.js
node --check src/app.js
node --check scripts/serve.js
node --check test/browser.js
```

Les raccourcis `npm start`, `npm test` et `npm run check` sont disponibles si npm est installé. Aucun `npm install` nécessaire. Ouvrir ensuite <http://127.0.0.1:4173/test/browser.html> et cliquer sur « Lancer les vérifications » pour tester la vraie page et son API.

## Existant et organisation

Le dossier local était vide. Le dépôt [clemyfleur/seminaire](https://github.com/clemyfleur/seminaire) contenait, lors de la lecture du 11 novembre 2026, un seul `index.html` : un **morpion à deux joueurs**, pas un Mastermind.

Sa copie intégrale est conservée dans `examples/morpion/index.html` (blob Git vérifié : `6fcb8d24efcc946da1033911a9173e8dfb80361d`). Les choix utiles sont repris : français, HTML sémantique, boutons natifs, état annoncé avec `aria-live`, focus visible, police système et couleurs sobres. Les règles du morpion ne conviennent pas au nouveau jeu.

```text
index.html                 Structure et règles visibles
src/game.js                Moteur, état privé et contrat API 0.2
src/app.js                 Interface et exposition conditionnelle de l’API
src/styles.css             Présentation responsive
dist/app.js                Script généré pour HTTP et file://
scripts/build.js           Assemblage reproductible sans dépendance
test/game.test.js          Tests automatisés du moteur et du contrat
test/browser.html + .js    Vérifications de l’application réelle
scripts/serve.js           Serveur statique local de développement
examples/morpion/         Copie inchangée de l’existant
```

Décision proposée avec Codex : garder HTML/CSS/JavaScript natifs, séparer les règles du rendu et partager **une seule instance** entre l’interface et l’API. Cela permet de tester les doublons et les fins de partie sans navigateur, puis de vérifier leur affichage. CSS direct suffit ici ; aucun compilateur SCSS ni framework n’est requis. Nom « Code secret » et apparence proposés, à valider. PWA et hors ligne laissés de côté pour cette première version.

## Règles et sources

Sources fournies : `tp2_mastermind.pdf`, édition 2.1, annexe `code-couleurs-1.0` ; `API commune de test — Code secret en couleurs.pdf`, contrat 0.2, édition Google 1.5 ; documents mis à jour le 28 octobre 2026. Ils décrivent le besoin et les rendus pédagogiques ; ils ne constituent pas une autorisation de publier ou transmettre des données.

Palette exacte, dans l’ordre : **rouge, bleu, vert, jaune, orange, violet**. Le secret aléatoire de quatre couleurs est fixe pendant la partie ; répétitions autorisées. Une proposition valide consomme un essai et reste dans l’historique avec ses deux totaux. Les positions exactes sont comptées avant les occurrences restantes ; aucun pion ne compte deux fois. Une saisie invalide affiche une explication sans consommer d’essai. Quatre bonnes positions donnent la victoire, même au dixième essai ; sinon dix essais donnent la défaite. La fin bloque les propositions ; une nouvelle partie remet tout à zéro. Le secret n’est jamais révélé séparément, même après défaite.

### Cas guidé : compter les répétitions

- Secret de départ · 🔴 🔴 🔵 🟢
- Proposition · 🔴 🔴 🔴 🔴
- Attendu · 2 bien placées, 0 mal placée, 1 essai utilisé.
- Les deux rouges bien placés sont déjà comptés. Il reste un bleu et un vert dans le secret.

## API 0.2

Ouvrir `/?test=1` (ou `/nom-du-depot/?test=1` après publication). Attendre la présence de `window.codeSecretTest` dans la console. L’état initial est `not-started` ; sans `test=1`, l’API n’est pas exposée et la partie démarre normalement.

```js
const api = window.codeSecretTest;
api.getConfig(); // synchrone ; version 0.2, règles code-couleurs-1.0
await api.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] });
await api.submitGuess(['rouge', 'bleu', 'rouge', 'rouge']);
// attempts: 1 ; lastResult: { wellPlaced: 1, misplaced: 2 }
api.getState(); // synchrone ; même partie que celle affichée
await api.startGame(); // nouveau tirage aléatoire
```

Attendre chaque mutation avant la suivante. `submitGuess` résout les refus dans `lastError`, selon l’ordre : partie non démarrée, partie terminée, type/tableau dense, longueur, couleur exacte. `startGame` invalide rejette une `Error` avec `code` et `message` sans modifier l’état ni l’écran. Les entrées et sorties sont copiées ; les getters ne modifient rien. Aucun champ `secret` ou `solution` n’est renvoyé.

## Résultats et correction constatée

Vérifications effectuées le **11 novembre 2026**, sous Node.js **24.22.1** et dans le navigateur intégré de Codex :

| Vérification | Attendu | Obtenu |
| --- | --- | --- |
| Tests Node : règles, API, erreurs, copies, cycle de vie | Tous réussis | **43/43** |
| Exemples API T01 à T09, comparés à l’écran | 1/2, 0/2, 0/4, 2/2, 4/0, 2/0, 2/2, 4/0, 1/2 | Tous identiques |
| Ensemble navigateur : API, commandes UI, refus, fins, remise à zéro et rechargement | Tous réussis | **19/19** |
| Compteur et historique après victoire/défaite au dixième | 10 essais ; fin figée | Conforme |
| Largeur simulée de 320 px avec dix essais | Aucun débordement horizontal | Conforme |
| Inspection visuelle | Disposition lisible | Vérifiée à 1280 × 900 et 390 × 844 |
| Clavier : flèche, Tab, validation par Entrée | Un essai ajouté et indice affiché | Conforme |
| Analyse syntaxique des quatre scripts | Aucune erreur | Conforme |

**Correction réelle avant/après** : le premier passage navigateur a échoué après un contrôle réussi : `startGame({secret: ...})` rejetait `invalid-options` quand l’objet venait du cadre parent. Attendu : accepter un objet ordinaire même s’il vient d’un autre contexte JavaScript. Cause : comparaison du prototype avec celui de la page courante. Un test de régression dans `test/game.test.js` reproduisait aussi cet échec. Après correction de `isOrdinaryObject`, le même test passe et la même suite navigateur termine à 19/19. Les options de type tableau, Date ou avec clé inconnue restent refusées. Le lancement Node cible explicitement le fichier de tests afin de ne pas exécuter le script navigateur dans Node.

Ces résultats établissent des contrôles locaux ; ils ne remplacent pas le test enseignant sur l’URL publiée. Le test navigateur est reproductible mais son lancement n’est pas encore automatisé en CI.

**Correction v0.1.1 du chargement par double-clic** : la capture utilisateur montrait « Chargement du jeu… » et aucune sélection de couleur en ouvrant `index.html` avec `file://`. Le navigateur bloquait les modules ES. La page charge maintenant un script classique différé, généré à partir des mêmes sources ; aucune importation réseau ou de module n’est nécessaire au lancement. Après changement, les 43 tests Node et les 19 vérifications navigateur sous HTTP passent à nouveau, et `node scripts/build.js --check` confirme que le fichier livré correspond aux sources. L’outil navigateur interdit la navigation vers `file://` : le double-clic doit donc encore être confirmé dans le navigateur de l’utilisatrice. La validation HTTP ne constitue pas une preuve d’exécution en `file://`.

## Suite, choix à confirmer et limites

1. **Cadrage effectué** : deux PDF lus, dépôt examiné, morpion conservé. Le modèle du cours manque encore ; indiquer son emplacement s’il est différent du morpion.
2. **Socle effectué** : moteur, interface, API et vérifications ci-dessus. Confirmer le nom, l’apparence et le choix CSS natif ; SCSS pourra être ajouté si imposé par le cours.
3. **Intégration à décider** : conserver le morpion à l’accueil et placer ce projet sous `/mastermind/` (proposition), ou le remplacer en gardant l’archive. Le paquet local est autonome ; aucun fichier du dépôt distant n’a été modifié et aucun tag de rendu n’a été créé.
4. **Publication à effectuer après intégration** : créer une branche de travail dans le dépôt existant, y copier les fichiers à l’emplacement choisi, exécuter les tests et enregistrer un commit. Préserver l’historique Git du dépôt. Pour un site statique, GitHub Pages peut publier depuis une branche, dossier racine ou `docs` : voir la [documentation officielle](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Les chemins du jeu sont relatifs. Le serveur Node est réservé au développement et ne se déploie pas sur Pages. Consigner ici l’URL réellement publiée, la branche et le commit ; ces informations ne sont pas encore connues.
5. **Recette publiée à faire** : relancer `test/browser.html`, vérifier l’absence de l’API hors mode test, tester les paramètres existants avec `test=1`, le cache neuf et le chemin sous le nom du dépôt. Tester aussi un smartphone réel et noter appareil, navigateur, date et résultat. L’émulation locale ne vaut pas preuve sur appareil ; lecteur d’écran et autres navigateurs restent à vérifier.
6. **Rendus pédagogiques à compléter par l’étudiante** : J1 le 20 novembre 2026, tag `jalon-1` ; J2 le 18 décembre 2026, tag `final`. Heures exactes à vérifier sur Cyberlearn. Ajouter les liens et preuves de la version publiée, un retour personnel sur le jeu d’un camarade et, à J2, la capsule individuelle de 4 à 5 minutes sur Cyberlearn. Aucun de ces éléments n’est prétendu réalisé ici.

La partie reste en mémoire : recharger efface la progression. Les appels concurrents ne sont pas couverts par le contrat. Le jeu côté client ne prétend pas protéger le secret contre l’inspection technique. Aucun PDF du cours, conversation, identifiant d’accès ou vidéo n’est inclus dans ce paquet.
