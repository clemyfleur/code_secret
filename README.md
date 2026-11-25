# Code secret en couleurs · v0.2.0

## PWA installable · préparation et vérification du 25 novembre 2026

État initial : jeu statique v0.1.4, sans manifeste ni service worker. Choix : conserver le nom « Code secret » et les règles ; icône originale à quatre pions, installation progressive, cache des seuls fichiers du jeu, aucune sauvegarde de partie. Le QR code visera `https://clemyfleur.github.io/code_secret/#installer` pour ouvrir le jeu directement sur le guide. Les tags `jalon-1` et `jalon-2` seront conservés.

Avant essais : vérifier le manifeste et les dimensions des icônes ; décoder le QR pour retrouver cette URL ; exécuter les tests du moteur, du cache hors ligne et du guide d’installation ; relancer les 30 contrôles de l’interface ; inspecter le guide en 375 px. Attendus : mêmes règles/API, aucun débordement, aucune API exposée en mode normal, service worker limité au dossier du jeu, ressources disponibles en cache, guide utilisable même sans bouton d’installation natif. Vérifier le chargement sous `/code_secret/`. Les tests simulés de réseau coupé seront distingués d’un véritable essai en mode avion, et l’installation réelle sur iPhone, Android et ordinateur restera à confirmer sur ces appareils.

### Installer Code secret

Ouvrir le [jeu et son guide](https://clemyfleur.github.io/code_secret/#installer), ou scanner le QR. Le code contient exactement cette URL, sans redirection ni suivi. Conserver sa marge blanche et ses proportions à l’impression.

![QR code vers Code secret et son guide](assets/qr-code-secret.png)

[QR PNG de 656 × 656 px](assets/qr-code-secret.png) · [QR vectoriel SVG](assets/qr-code-secret.svg)

- **iPhone/iPad** : Safari → Partager → Sur l’écran d’accueil → Ajouter ; activer « Ouvrir comme app web » si proposé.
- **Android** : bouton « Installer Code secret » si proposé, sinon menu du navigateur → Installer l’application / Ajouter à l’écran d’accueil.
- **Ordinateur** : Chrome/Edge → icône ou menu d’installation ; Safari sur Mac compatible → Fichier → Ajouter au Dock. Sans commande d’installation, le jeu reste jouable dans le navigateur.

Le nom affiché est **Code secret**. L’icône originale à quatre pions existe en PNG 192 et 512 px, en version maskable 512 px et en icône Apple 180 px ; `assets/icon.svg` est la source graphique. Le bouton natif apparaît seulement après `beforeinstallprompt` ; le guide reste accessible à tous. Sources : [MDN installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [invitation native](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt), [Apple](https://support.apple.com/guide/iphone/iphea86e5236/ios).

### Procédure sur téléphone : installation et test hors connexion

Cette procédure est à exécuter sur votre téléphone. Elle décrit un essai prévu : sa présence dans le README ne signifie pas qu’une installation réelle ou un test en mode avion a déjà été effectué.

**Installer à partir du QR code**

1. Affichez le QR code sur un ordinateur ou sur papier, puis scannez-le avec l’appareil photo du téléphone.
2. Ouvrez le lien dans **Safari sur iPhone** ou **Chrome sur Android**. Si le lien s’ouvre dans une messagerie, utilisez son menu pour l’ouvrir dans le navigateur. Vérifiez l’adresse : `https://clemyfleur.github.io/code_secret/#installer`, sans `?test=1`.
3. Avec Internet activé, attendez le message **« Jeu prêt hors connexion sur cet appareil »** dans le guide d’installation.
4. Sur **iPhone**, choisissez **Partager → Sur l’écran d’accueil → Ajouter** ; activez « Ouvrir comme app web » si proposé. Sur **Android**, touchez **Installer Code secret**, ou choisissez **⋮ → Installer l’application / Ajouter à l’écran d’accueil**, puis confirmez. Les intitulés peuvent varier selon la version du navigateur.
5. Repérez l’icône à quatre pions nommée **Code secret** sur l’écran d’accueil ou dans les applications. Ouvrez le jeu depuis cette icône une première fois **avec Internet**, puis attendez à nouveau le message de disponibilité hors connexion. Cette étape prépare aussi le contexte de l’application installée.

**Vérifier sans Internet**

État de départ : application installée, ouverte une première fois en ligne depuis son icône, message « prêt hors connexion » affiché. Attendu : une nouvelle partie doit pouvoir démarrer après fermeture et réouverture sans réseau.

1. Fermez le jeu ; ne vous contentez pas de le laisser au premier plan.
2. Activez le **mode avion**, puis vérifiez que le **Wi-Fi est également désactivé**.
3. Rouvrez **Code secret depuis son icône**, sans réactiver Internet.
4. Choisissez quatre couleurs, puis touchez **Valider le code**.
5. Vérifiez les résultats attendus dans le tableau ci-dessous, puis touchez **Nouvelle partie**.

| Contrôle | Résultat attendu |
| --- | --- |
| Réouverture sans réseau | Le jeu, ses couleurs et ses commandes se chargent |
| Première proposition complète | Compteur à **1/10**, une ligne dans l’historique et un indice affiché |
| Cohérence de l’affichage | Même indice dans le message et la ligne de l’historique ; aucune erreur de chargement |
| Nouvelle partie | Compteur à **0/10**, historique vide, sélections réinitialisées et commandes actives |

La réouverture démarre une nouvelle partie : la progression précédente n’est pas sauvegardée. Ce test vérifie l’usage hors connexion ; un indice obtenu avec un secret aléatoire inconnu ne prouve pas à lui seul l’exactitude du calcul.

**Si le chargement échoue** : réactivez Internet, ouvrez le jeu depuis son icône, attendez le message « prêt hors connexion », puis fermez et recommencez le test. Si le problème persiste, notez l’étape, le message et l’appareil avant d’envisager une correction. Réactivez vos connexions à la fin de l’essai.

**Trace à compléter après l’essai réel**

| Date | Téléphone / système | Navigateur / version | Version du jeu | Nom et icône corrects | Réouverture en mode avion | Proposition et historique | Nouvelle partie | Obtenu / statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| À renseigner | À renseigner | À renseigner | À relever dans le pied de page | À vérifier | À vérifier | À vérifier | À vérifier | Non exécuté dans le cadre de cette procédure |

### Hors connexion et mises à jour

Après une première ouverture HTTPS (ou localhost en développement), attendre « Jeu prêt hors connexion sur cet appareil ». Seuls le jeu, le guide, les icônes et le QR sont précachés ; le cache est propre au sous-répertoire. Les pages de tests et les requêtes `?test=1` ne sont pas servies par ce cache ; le mode test n’enregistre pas de service worker.

La partie reste en mémoire : fermer, recharger ou rouvrir démarre une nouvelle partie. Le navigateur ou l’utilisateur peut effacer le cache ; une visite en ligne le prépare à nouveau. Une mise à jour attend la fermeture de toutes les fenêtres et onglets du jeu avant activation, sans rechargement forcé d’une partie. Incrémenter ensemble la version de `sw.js`, les URL des ressources versionnées et celle du jeu lors d’une livraison affectant le précache. Seuls les anciens caches de ce jeu et de ce sous-répertoire sont supprimés.

### Vérifications PWA du 25 novembre 2026

Version v0.2.0 ; Node.js v24.22.3 et navigateur intégré de Codex, serveur local sous `http://127.0.0.1:4174/code_secret/`.

| Vérification | Résultat local |
| --- | --- |
| Moteur et API | 45/45 tests Node réussis |
| Manifeste/icônes, isolation et cache hors ligne, invitation à installer | 10/10 tests Node réussis, dont réseau coupé et événements d’installation simulés |
| Vraie interface et API | 30/30 contrôles navigateur réussis sur v0.2.0 |
| Manifeste/icônes servis, guide et jeu à 375 px, service worker actif et cache réel | 4/4 contrôles PWA navigateur réussis |
| Inspection visuelle du guide | Texte et QR lisibles ; largeur totale et utile de 360 px, aucun débordement |
| Décodage du QR dans ce navigateur | Non vérifié : `BarcodeDetector` indisponible ; scan réel à confirmer |

**Après publication le 25 novembre 2026** : GitHub Pages a déployé avec succès le commit `efc7ddb73a2c8fe61849ab1c65aa35726df6f4f9`. Les 29 fichiers distants, PNG compris, ont été comparés aux fichiers locaux par leur empreinte Git : identiques. Sur l’adresse publique et la v0.2.0 affichée : **30/30 contrôles du jeu et 4/4 contrôles PWA réussis, 0 échec**. Le service worker est actif dans `/code_secret/`, les ressources attendues sont dans le cache réel et les trois guides sont ouvrables. Inspection visuelle et mesure à 375 × 844 px : largeur totale 360 px, égale à la largeur utile avec barre verticale ; aucun débordement. Le décodeur QR du navigateur est indisponible sur le site public également.

Reproduire avec le [banc du jeu](https://clemyfleur.github.io/code_secret/test/browser.html?pwa=0.2.0) et le [banc PWA](https://clemyfleur.github.io/code_secret/test/pwa.html?release=0.2.0). Capture du guide conservée localement hors du dépôt : `outputs/pwa-guide-mobile.jpg`. Le cache réel observé ne constitue pas à lui seul une preuve de réouverture en mode avion. Les tags `jalon-1` et `jalon-2` conservent leurs commits ; la PWA est une livraison ultérieure sur `main`.

Restent à vérifier sur appareils : installation réelle sur iPhone/Android/ordinateur, nom et icône sur l’écran d’accueil, fermeture puis réouverture en mode avion, passage d’une version installée à la suivante. Les simulations ne remplacent pas ces essais.

### Organisation et vérification PWA

`manifest.webmanifest` décrit l’installation ; `src/pwa.js` gère l’invitation et les messages ; `sw.js` prépare le cache ; `assets/` contient les icônes et QR. Aucun service externe ni dépendance n’est ajouté au jeu.

```sh
node --test test/game.test.js test/pwa.test.js
node --check src/pwa.js
node --check sw.js
```

`test/pwa.html` et `test/pwa.js` vérifient la vraie PWA. Pour reproduire le sous-répertoire Pages en PowerShell, définir `$env:BASE_PATH='/code_secret/'` et `$env:PORT='4174'`, puis lancer `node scripts/serve.js`. Ouvrir `/code_secret/test/browser.html` et `/code_secret/test/pwa.html`. Le serveur écoute en local ; un téléphone utilise l’adresse publique HTTPS.

Jeu solo statique : quatre couleurs à retrouver en dix essais, utilisable au clavier et sur petit écran. Aucune dépendance à installer pour le jeu, aucun compte, serveur applicatif, service d’IA ou stockage de données personnelles.

Depuis la v0.1.4, chaque partie normale choisit **quatre couleurs au hasard parmi les six, avec répétitions possibles**, y compris après « Nouvelle partie ». Le secret reste inchangé pendant la partie. Deux tirages peuvent donner le même code par hasard. Le code fixe introduit en v0.1.3 a été retiré ; le tirage suit à nouveau l’exigence de l’énoncé et du contrat commun 0.2. L’API de test conserve la possibilité d’imposer explicitement un secret via `startGame({ secret: [...] })`. Le cas guidé conserve son secret rouge – rouge – bleu – vert, indépendant de la partie principale.

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
AGENTS.md                  Consignes de développement et de vérification
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

Palette exacte, dans l’ordre : **rouge, bleu, vert, jaune, orange, violet**. Le secret de quatre couleurs est tiré au hasard à chaque nouvelle partie et reste fixe pendant la partie ; répétitions autorisées. Une proposition valide consomme un essai et reste dans l’historique avec ses deux totaux. Les positions exactes sont comptées avant les occurrences restantes ; aucun pion ne compte deux fois. Une saisie invalide affiche une explication sans consommer d’essai. Quatre bonnes positions donnent la victoire, même au dixième essai ; sinon dix essais donnent la défaite. La fin bloque les propositions ; une nouvelle partie remet tout à zéro. Le secret n’est jamais révélé séparément, même après défaite.

### Cas guidé : compter les répétitions

Dans le jeu, ouvrir « Cas guidé : compter les répétitions », puis cliquer sur « Afficher le résultat de l’exemple ». Le résultat est calculé avec le moteur commun. L’exemple est indépendant : il ne démarre pas et ne modifie pas votre partie, son compteur ou son historique.

- Secret de départ · 🔴 🔴 🔵 🟢
- Proposition · 🔴 🔴 🔴 🔴
- Attendu · 2 bien placées, 0 mal placée, 1 essai utilisé.
- Les deux rouges bien placés sont déjà comptés. Il reste un bleu et un vert dans le secret.

Vérification du 18 novembre 2026 (v0.1.2) : le bouton affiche le résultat calculé ci-dessus. Les **43 tests Node et 21 contrôles navigateur passent**, dont deux nouveaux contrôles confirmant que l’exemple ne modifie pas la partie principale, avant son démarrage ou pendant une partie en cours. Le fichier `dist/app.js` a été régénéré pour conserver l’ouverture directe de `index.html`.

## API 0.2

### Audit du contrat du 25 novembre 2026

Contrat relu : édition Google 1.5 du 28 octobre 2026, six pages. Au début de cet audit, les 16 fichiers du projet local correspondent au dépôt `main` (`bc463b665e021fd71d5490e90339c8787c6b9b87`). L’API 0.2 est déjà implémentée : `createGame(render)` crée la partie principale dans `src/app.js` ; la même instance reçoit les actions du formulaire, celles de « Nouvelle partie » et les appels via `window.codeSecretTest`. Le cas guidé reste un exemple séparé et n’est pas utilisé pour répondre aux tests de la partie principale.

**Plan** : conserver le moteur et cette intégration, compléter les contrôles navigateur qui manquent, puis exécuter les contrôles locaux et disponibles sur le site publié. Ne pas réécrire une API déjà présente sans défaut identifié.

Attendus consignés avant les nouveaux contrôles navigateur :

| Contrôle complémentaire | Résultat attendu | Obtenu |
| --- | --- | --- |
| Formes de retour et configuration | Getters synchrones, mutations sous forme de promesses, configuration exacte, état sérialisable sans secret | Conforme, écran mis à jour avant résolution |
| Proposition avant démarrage | Priorité `game-not-started`, aucune partie démarrée | Conforme, aucun essai ni historique ajouté |
| Validations via l’API réelle | Type avant longueur avant couleur ; refus sans essai ni changement d’historique ; explication visible | Conforme pour les 13 entrées invalides contrôlées |
| Démarrages invalides via l’API réelle | Promesse rejetée avec `Error`, `code` et message ; état et HTML inchangés | Conforme pour les 12 options invalides contrôlées |
| Protection des données et getters | Modifier entrées, réponses et configuration ne change pas la partie ; getters sans effet sur l’écran et l’erreur | Conforme, copies et rendu conservés |
| Trois couleurs saisies dans l’interface | `invalid-length`, compteur et historique conservés après un essai valide ; proposition complète suivante acceptée | Conforme, puis victoire à 2 essais visible et relue par l’API |
| Fin perdue et redémarrage | Priorité `game-finished`, partie figée, redémarrage depuis `lost` remettant tout à zéro | Conforme, compteur, historique, sélections et erreur remis à zéro |
| Mauvaises valeurs du paramètre test | API absente pour `test=0` et `test=true` | Conforme, partie normale prête |

Résultats exécutés le **25 novembre 2026**, jeu **v0.1.4** :

| Vérification | Environnement et version | Résultat observé |
| --- | --- | --- |
| Tests automatisés du moteur et du contrat | Node.js v24.22.3, sources locales identiques à `main` au début de l’audit | **45/45 réussis** |
| Cohérence du script généré et analyses syntaxiques | `build.js --check`, moteur, interface, serveur, script livré et banc navigateur local | Conforme, aucune erreur |
| Application réelle, API et interface, huit contrôles complémentaires inclus | Navigateur intégré de Codex, `http://127.0.0.1:4173/test/browser.html`, v0.1.4 | **30/30 réussis, 0 échec** |
| Application publiée, banc existant | Même navigateur, `https://clemyfleur.github.io/code_secret/test/browser.html`, v0.1.4 affichée, publication de `main` bc463b6 | **22/22 réussis, 0 échec** |

Les contrôles navigateur sont automatisés par la page de vérification, lancée manuellement. Les neuf exemples T01 à T09 donnent les indices attendus, identiques dans l’état et à l’écran. Les victoires, la défaite au dixième, la remise à zéro, le rechargement et l’absence d’API en mode normal passent aussi. Aucun écart fonctionnel détecté ne justifie de modifier le moteur : l’intégration déjà présente est conservée. Seuls ce README et le banc `test/browser.js` ont été complétés ; la version du jeu reste v0.1.4.

### Publication et vérification des 30 contrôles sur Pages

Le **25 novembre 2026**, le README et le banc complété ont été publiés sur `main` dans le commit `955181be03e473ea55291fbb7f447713ef0c9cda`. Le premier chargement public utilisait encore le script de 22 contrôles en cache. Le commit `02a5d5756c9f350843717a884799f16ed5fbbe27` ajoute donc un paramètre de version au chargement de `test/browser.js` dans `test/browser.html`, sans changer le jeu.

Après déploiement réussi de ce commit, le [banc public](https://clemyfleur.github.io/code_secret/test/browser.html?publication=02a5d57) a été exécuté dans le navigateur intégré de Codex : **30 vérifications réussies, 0 échec**, version affichée **v0.1.4**, application testée `https://clemyfleur.github.io/code_secret/?autre=conserve&test=1`. Les huit contrôles complémentaires sont donc désormais publiés et exécutés sur Pages. Le résultat public 22/22 ci-dessus décrit le passage antérieur avec l’ancien banc.

**Limites** : le banc enseignant n’a pas été fourni ni exécuté. Le double-clic `file://`, un contexte navigateur garanti neuf, un smartphone réel, les autres navigateurs et un lecteur d’écran restent à vérifier. La largeur de 320 px vérifiée dans le banc est une simulation. Le tag `jalon-1` n’a pas été modifié et conserve le commit `99d8ad6f6a9b5f00f7b6a84e17690cdddf807c4a`.

Ouvrir `/?test=1` (ou `/nom-du-depot/?test=1` après publication). Attendre la présence de `window.codeSecretTest` dans la console. L’état initial est `not-started` ; sans `test=1`, l’API n’est pas exposée et la partie démarre normalement.

```js
const api = window.codeSecretTest;
api.getConfig(); // synchrone ; version 0.2, règles code-couleurs-1.0
await api.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] });
await api.submitGuess(['rouge', 'bleu', 'rouge', 'rouge']);
// attempts: 1 ; lastResult: { wellPlaced: 1, misplaced: 2 }
api.getState(); // synchrone ; même partie que celle affichée
await api.startGame(); // nouvelle partie : secret aléatoire
```

Attendre chaque mutation avant la suivante. `submitGuess` résout les refus dans `lastError`, selon l’ordre : partie non démarrée, partie terminée, type/tableau dense, longueur, couleur exacte. `startGame` invalide rejette une `Error` avec `code` et `message` sans modifier l’état ni l’écran. Les entrées et sorties sont copiées ; les getters ne modifient rien. Aucun champ `secret` ou `solution` n’est renvoyé.

## Trois scénarios reproductibles (v0.1.3)

Les actions et attendus ci-dessous ont été inscrits avant leur exécution. Chaque scénario repart d’une partie neuve avec le secret connu **rouge – rouge – bleu – vert**. Pour reproduire dans le navigateur, ouvrir le jeu avec `?test=1`, puis utiliser `const api = window.codeSecretTest` dans la console et attendre chaque appel.

**Exécution réalisée le 18 novembre 2026 sur la version locale v0.1.3**, via les méthodes `startGame`, `submitGuess` et `getState` du moteur `src/game.js`, sous Node.js v24.22.3. Les trois scénarios ont été exécutés avec assertions et réussissent. Cette exécution vérifie les états du moteur ; l’affichage et les interactions dans le navigateur n’ont pas été retestés ici. Aucun code du jeu n’a été modifié.

### 1. Compter les rouges sans compter deux fois une occurrence

- **État connu** : `await api.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] })` ; `playing`, 0 essai, historique vide.
- **Action** : `await api.submitGuess(['rouge', 'rouge', 'rouge', 'rouge'])`.
- **Attendu** : 2 bien placées, 0 mal placée ; 1 essai utilisé ; 1 entrée dans l’historique ; partie toujours `playing` ; aucune erreur. Les deux rouges exacts sont déjà comptés : les couleurs restantes du secret sont bleu et vert.
- **Obtenu (v0.1.3)** : `{ wellPlaced: 2, misplaced: 0 }`, `attempts: 1`, `history.length: 1`, `status: 'playing'`, `lastError: null`. **Conforme.**

### 2. Refuser une proposition incomplète sans consommer d’essai

- **État connu** : redémarrer avec le même `startGame` ; `playing`, 0 essai, historique vide.
- **Action** : `await api.submitGuess(['rouge'])`.
- **Attendu** : refus `invalid-length` accompagné d’un message explicatif ; `playing`, toujours 0 essai et historique vide ; `lastGuess` et `lastResult` restent `null`.
- **Obtenu (v0.1.3)** : `lastError.code: 'invalid-length'`, message « Choisissez exactement quatre couleurs. », `status: 'playing'`, `attempts: 0`, `history: []`, `lastGuess: null`, `lastResult: null`. **Conforme.**

### 3. Gagner au dixième et dernier essai

- **État connu** : redémarrer avec le même secret, puis envoyer neuf fois `await api.submitGuess(['bleu', 'bleu', 'bleu', 'bleu'])`. Vérifier `playing`, 9 essais et 9 entrées dans l’historique avant l’action finale.
- **Action** : `await api.submitGuess(['rouge', 'rouge', 'bleu', 'vert'])`.
- **Attendu** : 4 bien placées, 0 mal placée ; victoire `won` ; 10 essais utilisés et 10 entrées dans l’historique ; aucune erreur. La victoire doit être prioritaire sur la limite de dix essais.
- **Obtenu (v0.1.3)** : avant l’action, `playing` à 9 essais ; après l’action, `{ wellPlaced: 4, misplaced: 0 }`, `status: 'won'`, `attempts: 10`, `history.length: 10`, `lastError: null`. **Conforme.**

### Retest de l’interface des trois scénarios

Retest effectué le **18 novembre 2026**, version locale **v0.1.3**, dans le navigateur intégré de Codex, à `http://127.0.0.1:4173/?test=1`. Chaque scénario a été préparé par le bouton « Nouvelle partie » (secret fixe rouge – rouge – bleu – vert), puis exécuté avec les listes de couleurs et le bouton « Valider le code ». Aucun code du jeu n’a été modifié pour ce retest.

| Scénario | Résultat visible obtenu | Comparaison avec l’attendu |
| --- | --- | --- |
| 1. Quatre rouges | Compteur `1 / 10 essais`, indice `2 bien placée(s) · 0 mal placée(s)`, une ligne dans l’historique, 9 essais restants et saisie active | Conforme |
| 2. Seulement la première position rouge, les trois autres sur « Choisir… » | Compteur `0 / 10 essais`, historique vide, 10 essais restants, message « Utilisez uniquement rouge, bleu, vert, jaune, orange ou violet, en minuscules. » | Refus et compteur conformes ; message différent de « Choisissez exactement quatre couleurs. » attendu dans le scénario API |
| 3. Neuf propositions de quatre bleus, puis le code exact | Avant validation : `9 / 10 essais`. Après : `10 / 10 essais`, « Bravo ! Code trouvé en 10 essai(s). », dix lignes dans l’historique, dernier indice `4 bien placée(s) · 0 mal placée(s)`, listes et validation désactivées | Conforme |

**Écart du scénario 2** : le scénario API envoie un tableau d’un seul élément (`['rouge']`), ce qui produit `invalid-length`. L’interface envoie toujours les quatre valeurs des listes ; les trois positions non choisies sont des chaînes vides (`['rouge', '', '', '']`), d’où `invalid-color` et le message différent. Le moteur respecte son ordre de validation dans les deux cas, mais le message de l’interface gagnerait à expliquer explicitement que des positions sont manquantes. Cet écart est signalé, sans correction dans ce retest.

### Correction et nouvelle vérification (v0.1.4)

L’écart décrit ci-dessus concernait la v0.1.3. En v0.1.4, l’interface retire les choix vides avant d’envoyer la proposition au moteur. Une position manquante produit ainsi `invalid-length` et le message **« Choisissez exactement quatre couleurs. »**, sans consommer d’essai ni modifier l’historique. Les propositions complètes conservent leur ordre de gauche à droite ; les validations et priorités d’erreur de l’API restent identiques.

Vérification du 18 novembre 2026 : **45 tests Node et 22 contrôles navigateur réussis**. Le nouveau contrôle navigateur couvre une proposition entièrement vide, un seul rouge et une position manquante au début, au milieu ou à la fin. Le compteur reste à `0 / 10 essais`, l’historique reste vide et le message attendu est affiché dans chaque cas. Une vérification directe avec les listes et le bouton a également confirmé le message corrigé pour un seul rouge.

Les tests du tirage emploient une source aléatoire contrôlée : quatre appels par démarrage sans secret, six couleurs accessibles, répétitions possibles, aucun nouveau tirage pendant une partie et retour au tirage aléatoire après un secret imposé. Ces tests vérifient le mécanisme sans exiger que deux parties aient toujours des codes différents. Les tests à secret connu utilisent désormais explicitement `startGame({ secret: [...] })` : le bouton « Nouvelle partie » ne garantit plus rouge – rouge – bleu – vert.

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

### Essai mobile du 25 novembre 2026

État de départ : jeu publié v0.1.4 en mode normal, partie neuve à zéro essai, aperçu Codex de 390 × 844 px. Actions : sélectionner les six couleurs à travers les quatre listes, valider une proposition complète, refuser une saisie incomplète, remplir l’historique jusqu’à dix essais si la partie n’est pas gagnée avant, puis utiliser « Nouvelle partie ». Attendus : commandes accessibles par défilement vertical, noms et pastilles lisibles, indice et compteur actualisés, refus sans consommation, historique consultable et aucune largeur supérieure à celle de la page ; le redémarrage vide l’historique. Il s’agit d’un navigateur de bureau avec dimensions simulées, sans preuve de fonctionnement tactile sur téléphone réel.

**Exécution du 25 novembre 2026** : interactions effectuées dans la vraie interface publiée (sélections et clics pilotés, puis inspection visuelle et mesures du DOM), v0.1.4, `https://clemyfleur.github.io/code_secret/`, 390 × 844 px. Les six couleurs ont été sélectionnées : rouge–bleu–vert–jaune puis orange–violet–vert–jaune. Premier indice observé : 1 bien placée, 2 mal placées ; deuxième : 1 bien placée, 1 mal placée. Le secret est aléatoire : ces indices servent ici à observer le rendu, pas à prouver le calcul à secret connu.

| Contrôle mobile | Obtenu | Statut |
| --- | --- | --- |
| Quatre listes et six couleurs | Sélections possibles, noms et pastilles visibles ; listes de 73,5 × 44 px | Réussi |
| Boutons de validation et redémarrage | Deux boutons visibles dans la largeur, chacun de 149,5 × 46 px | Réussi |
| Proposition complète puis incomplète | Une ligne ajoutée, puis message « Choisissez exactement quatre couleurs. » avec compteur et historique inchangés à 1 | Réussi |
| Historique rempli et fin de partie | Dix lignes, noms des quatre couleurs et indices lisibles ; essai 10 atteint par défilement vertical ; validation désactivée à la défaite | Réussi |
| Débordement horizontal | Largeur de page et de corps 375 px, égale à la largeur utile (390 px moins 15 px de barre verticale) ; aucun élément du jeu ne dépasse horizontalement | Réussi |
| Nouvelle partie | Retour à 0 essai, historique vide, quatre sélections vides et actives, erreur effacée | Réussi |

Preuve visuelle conservée localement hors des sources : `outputs/mobile-390-historique.jpg` (non incluse dans le dépôt). Aucun code du jeu modifié. Cette vérification ne couvre pas le toucher réel, le lecteur d’écran ni un autre navigateur. Compte rendu publié dans le README sur `main` à la demande de l’utilisatrice, sans modifier le tag `jalon-1`.

### Essai en largeur de 375 px du 25 novembre 2026

Test d’interface réalisé sur le [jeu publié](https://clemyfleur.github.io/code_secret/), version affichée **v0.1.4**, dans l’aperçu Codex réglé à **375 × 844 px**. État de départ : partie normale neuve, secret aléatoire inconnu, compteur à zéro et historique vide. Action demandée : jouer un coup puis vérifier commandes, indices et historique sans débordement horizontal. Les attendus étaient définis dans la demande avant l’essai ; ce compte rendu a été ajouté au README après exécution.

Méthode : sélection des couleurs et clic dans la vraie interface par pilotage navigateur, puis inspection visuelle et mesures du DOM. Il s’agit d’un essai ponctuel de l’interface, distinct des 30 contrôles du banc automatisé.

| Comportement vérifié | Attendu | Observé | Statut |
| --- | --- | --- | --- |
| Commandes | Quatre listes utilisables et deux boutons dans la largeur disponible | Rouge, bleu, vert et jaune sélectionnés ; listes de 69,75 × 44 px ; boutons visibles et actifs de 142 × 46 px | Réussi |
| Validation d’un coup | Un seul essai et une ligne ajoutés, sans erreur | Proposition rouge–bleu–vert–jaune acceptée ; compteur 1/10 ; erreur vide ; neuf essais restants | Réussi |
| Affichage des indices | Même indice dans le message et l’historique | 1 bien placée et 1 mal placée dans les deux emplacements | Réussi |
| Historique | Quatre couleurs, leurs noms et l’indice consultables | Une ligne numérotée 01, pastilles et noms lisibles par défilement vertical | Réussi |
| Largeur | Aucun défilement horizontal nécessaire | Largeur totale de page 360 px, égale à la largeur utile (375 px moins 15 px de barre verticale) ; aucun élément du jeu ne dépasse | Réussi |

Aucun problème reproduit, aucune correction du jeu nécessaire. L’exactitude mathématique de l’indice n’est pas établie par cet essai car le secret n’est pas connu. Les six couleurs, les dix lignes d’historique et le redémarrage ne sont pas retestés dans cet essai à 375 px ; ils ont été contrôlés séparément en 390 × 844 px ci-dessus. Le toucher sur téléphone réel et le lecteur d’écran restent à vérifier. Capture conservée localement : `outputs/test-mobile-375-un-coup.jpg` (non incluse dans le dépôt). Aucun nouveau test ni changement de code lors de la publication de ce compte rendu. Les tags `jalon-1` et `jalon-2` restent inchangés.

1. **Cadrage effectué** : deux PDF lus, dépôt examiné, morpion conservé. Le modèle du cours manque encore ; indiquer son emplacement s’il est différent du morpion.
2. **Socle effectué** : moteur, interface, API et vérifications ci-dessus. Confirmer le nom, l’apparence et le choix CSS natif ; SCSS pourra être ajouté si imposé par le cours.
3. **Intégration effectuée** : le jeu occupe la racine du dépôt [clemyfleur/code_secret](https://github.com/clemyfleur/code_secret). Le morpion reste archivé dans `examples/morpion/`.
4. **Publication effectuée** : [jeu GitHub Pages](https://clemyfleur.github.io/code_secret/), branche `main`, dossier racine. Au début de l’audit du 25 novembre, la version publiée correspond à `bc463b665e021fd71d5490e90339c8787c6b9b87`. Le [tag jalon-1](https://github.com/clemyfleur/code_secret/releases/tag/jalon-1) conserve le commit `99d8ad6f6a9b5f00f7b6a84e17690cdddf807c4a`. Les ajouts documentaires ultérieurs ne sont pas inclus rétroactivement dans ce tag. Le serveur Node sert uniquement au développement.
5. **Recette publiée réalisée en partie** : le banc public a été relancé le 25 novembre après publication des huit contrôles complémentaires : **30/30 contrôles réussis**, dont l’absence de l’API hors mode test et la conservation des paramètres avec `test=1`. Un contexte navigateur garanti neuf, un smartphone réel, un lecteur d’écran et d’autres navigateurs restent à vérifier ; noter appareil, navigateur, date et résultat. La simulation de largeur ne vaut pas preuve sur appareil.
6. **Rendus pédagogiques à suivre par l’étudiante** : J1 le 20 novembre 2026, tag `jalon-1` créé ; J2 le 18 décembre 2026, tag `final` à préparer. La remise effective sur Cyberlearn n’est pas vérifiée ici. Heures exactes à vérifier sur Cyberlearn. Prévoir le retour personnel sur le jeu d’un camarade et, à J2, la capsule individuelle de 4 à 5 minutes.

La partie reste en mémoire : recharger efface la progression. Les appels concurrents ne sont pas couverts par le contrat. Le jeu côté client ne prétend pas protéger le secret contre l’inspection technique. Aucun PDF du cours, conversation, identifiant d’accès ou vidéo n’est inclus dans ce paquet.
