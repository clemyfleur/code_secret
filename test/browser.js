const frame = document.getElementById('app');
const report = document.getElementById('report');
const button = document.getElementById('run');
const red = Array(4).fill('rouge');
const blue = Array(4).fill('bleu');
const basic = ['rouge', 'bleu', 'vert', 'jaune'];
const duplicate = ['rouge', 'rouge', 'bleu', 'vert'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const load = (url) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Chargement trop long')), 10000);
  frame.onload = () => { clearTimeout(timeout); resolve(); };
  frame.src = url;
});

button.addEventListener('click', async () => {
  button.disabled = true;
  report.textContent = '';
  let passed = 0;
  const check = async (name, action) => {
    await action(); passed += 1;
    report.textContent += `OK ${name}\n`;
  };
  try {
    await load('../?autre=conserve&test=1');
    const api = frame.contentWindow.codeSecretTest;
    const doc = frame.contentDocument;
    const node = (id) => doc.getElementById(id);
    await check('API 0.2 exposée ; état initial not-started ; saisie désactivée', () => {
      assert(api?.version === '0.2', 'API absente');
      assert(api.getState().status === 'not-started', 'Partie démarrée trop tôt');
      assert(node('code-fields').disabled, 'Saisie active avant démarrage');
    });
    await check('Avant démarrage : game-not-started prioritaire sans consommation', async () => {
      const state = await api.submitGuess(null);
      assert(state.status === 'not-started' && state.attempts === 0 && state.history.length === 0, 'Refus démarre ou modifie la partie');
      assert(state.lastError.code === 'game-not-started' && state.lastError.message.length > 0, 'Mauvaise priorité avant démarrage');
      assert(state.lastGuess === null && state.lastResult === null && node('code-fields').disabled, 'État initial altéré');
    });
    await check('Cas guidé : 2/0, un essai, sans démarrer la partie', async () => {
      const before = JSON.stringify(api.getState());
      node('run-example').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert(node('example-result').textContent === '2 bien placées, 0 mal placée, 1 essai utilisé.', 'Résultat guidé incorrect');
      assert(!node('example-explanation').hidden, 'Explication absente');
      assert(JSON.stringify(api.getState()) === before, 'Exemple modifie la partie');
      node('run-example').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert(node('example-result').textContent.includes('1 essai utilisé'), 'Exemple non reproductible');
    });
    await check('Configuration exacte, getters synchrones et mutations sous forme de promesses', async () => {
      const config = api.getConfig();
      const expected = { apiVersion: '0.2', rulesVersion: 'code-couleurs-1.0', secretLength: 4, maxAttempts: 10, allowDuplicates: true, colors: ['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet'] };
      assert(typeof config?.then === 'undefined' && typeof api.getState()?.then === 'undefined', 'Getter asynchrone');
      Object.entries(expected).forEach(([key, value]) => assert(JSON.stringify(config[key]) === JSON.stringify(value), `Configuration incorrecte : ${key}`));
      const starting = api.startGame({ secret: duplicate });
      assert(typeof starting?.then === 'function', 'startGame ne retourne pas de promesse');
      await starting;
      const submitting = api.submitGuess(red);
      assert(typeof submitting?.then === 'function', 'submitGuess ne retourne pas de promesse');
      const state = await submitting;
      assert(JSON.stringify(state) === JSON.stringify(api.getState()), 'État retourné différent du véritable jeu');
      assert(!('secret' in state) && !('solution' in state), 'Secret révélé dans l’état');
      assert(node('counter').textContent === '1 / 10 essais', 'Promesse résolue avant le rendu');
      report.dataset.version = node('version').textContent;
      report.dataset.application = frame.src;
    });
    const examples = [
      [basic, ['rouge', 'vert', 'bleu', 'orange'], 1, 2],
      [basic, ['orange', 'violet', 'rouge', 'bleu'], 0, 2],
      [basic, ['bleu', 'rouge', 'jaune', 'vert'], 0, 4],
      [basic, ['rouge', 'bleu', 'jaune', 'vert'], 2, 2],
      [basic, basic, 4, 0], [duplicate, red, 2, 0],
      [duplicate, ['rouge', 'bleu', 'rouge', 'vert'], 2, 2],
      [duplicate, duplicate, 4, 0],
      [duplicate, ['rouge', 'bleu', 'rouge', 'rouge'], 1, 2],
    ];
    for (const [i, [secret, guess, well, misplaced]] of examples.entries()) {
      await check(`T${String(i + 1).padStart(2, '0')} : API et écran ${well}/${misplaced}`, async () => {
        await api.startGame({ secret });
        assert(node('history').children.length === 0, 'Historique non remis à zéro');
        const state = await api.submitGuess(guess);
        assert(state.lastResult.wellPlaced === well && state.lastResult.misplaced === misplaced, 'Indice API incorrect');
        assert(node('counter').textContent === '1 / 10 essais', 'Compteur différent');
        assert(node('history').children.length === 1, 'Essai absent');
        assert(node('history').querySelector('.hints').textContent === `${well} bien placée(s) · ${misplaced} mal placée(s)`, 'Indice visible différent');
        assert([...node('history').querySelectorAll('.peg')].every((peg, j) => peg.textContent === guess[j]), 'Couleurs visibles différentes');
      });
    }
    await check('API navigateur : types, longueurs, couleurs exactes et priorités des refus', async () => {
      await api.startGame({ secret: duplicate });
      await api.submitGuess(red);
      const cases = [
        [null, 'invalid-type'], ['rouge', 'invalid-type'], [new Array(4), 'invalid-type'],
        [['rouge', null], 'invalid-type'], [['rouge', undefined, 'bleu', 'vert'], 'invalid-type'],
        [[], 'invalid-length'], [['rouge'], 'invalid-length'],
        [['rouge', 'rouge', 'bleu'], 'invalid-length'], [['inconnue'], 'invalid-length'],
        [['rouge', 'bleu', 'vert', 'jaune', 'orange'], 'invalid-length'],
        [['rouge', 'rouge', 'bleu', 'Violet'], 'invalid-color'],
        [['rouge', 'rouge', 'bleu', 'violet '], 'invalid-color'],
        [['rouge', 'rouge', 'bleu', 'purple'], 'invalid-color'],
      ];
      for (const [guess, code] of cases) {
        const before = api.getState();
        const state = await api.submitGuess(guess);
        assert(state.lastError?.code === code && state.lastError.message.length > 0, `Refus attendu : ${code}`);
        assert(JSON.stringify({ ...state, lastError: null }) === JSON.stringify({ ...before, lastError: null }), 'Un refus modifie les données de jeu');
        assert(node('counter').textContent === '1 / 10 essais' && node('history').children.length === 1, 'Un refus modifie le compteur ou l’historique visible');
        assert(node('error').textContent === state.lastError.message, 'Refus non expliqué à l’écran');
      }
      assert((await api.submitGuess(duplicate)).lastError === null && node('error').textContent === '', 'Proposition valide ne supprime pas l’erreur');
    });
    await check('API navigateur : démarrages invalides rejetés sans toucher état ou écran', async () => {
      await api.startGame({ secret: duplicate });
      await api.submitGuess(red);
      await api.submitGuess([]);
      const cases = [
        [null, 'invalid-options'], [[], 'invalid-options'], [true, 'invalid-options'],
        ['secret', 'invalid-options'], [new Date(), 'invalid-options'],
        [{ mode: 'facile', secret: null }, 'invalid-options'],
        [{ secret: undefined }, 'invalid-type'], [{ secret: null }, 'invalid-type'],
        [{ secret: ['rouge', null] }, 'invalid-type'], [{ secret: new Array(4) }, 'invalid-type'],
        [{ secret: ['rouge', 'rouge', 'bleu'] }, 'invalid-length'],
        [{ secret: ['rouge', 'rouge', 'bleu', 'red'] }, 'invalid-color'],
      ];
      for (const [options, code] of cases) {
        const before = JSON.stringify(api.getState());
        const html = node('game').innerHTML;
        let rejected = false;
        try { await api.startGame(options); }
        catch (error) {
          rejected = error instanceof frame.contentWindow.Error && error.code === code && typeof error.message === 'string' && error.message.length > 0;
        }
        assert(rejected, `Promesse non rejetée avec Error et code ${code}`);
        assert(JSON.stringify(api.getState()) === before && node('game').innerHTML === html, 'Démarrage invalide altère la partie ou le rendu');
      }
    });
    await check('API navigateur : copies indépendantes, JSON et getters sans effet sur le rendu', async () => {
      const secret = [...duplicate];
      const start = api.startGame({ secret });
      secret.fill('orange');
      const started = await start;
      started.status = 'lost';
      const guess = [...red];
      const submission = api.submitGuess(guess);
      guess.fill('jaune');
      const returned = await submission;
      assert(returned.lastResult.wellPlaced === 2 && returned.lastResult.misplaced === 0, 'Les tableaux fournis sont restés liés au moteur');
      const before = JSON.stringify(api.getState());
      const html = node('game').innerHTML;
      returned.history[0].guess.fill('violet');
      returned.lastGuess.fill('vert');
      returned.lastResult.wellPlaced = 0;
      api.getConfig().colors.fill('red');
      api.getState().history.length = 0;
      assert(JSON.stringify(api.getState()) === before && node('game').innerHTML === html, 'Une copie retournée modifie la partie ou l’écran');
      assert(api.getConfig().colors[0] === 'rouge', 'Configuration interne modifiée');
      await api.submitGuess([]);
      const errorState = JSON.stringify(api.getState());
      const errorHtml = node('game').innerHTML;
      api.getConfig(); api.getState();
      assert(JSON.stringify(api.getState()) === errorState && node('game').innerHTML === errorHtml, 'Getter modifie lastError ou l’écran');
    });
    await check('Trois couleurs dans l’interface : historique conservé puis victoire partagée', async () => {
      await api.startGame({ secret: duplicate });
      await api.submitGuess(red);
      const before = api.getState();
      const history = node('history').innerHTML;
      const fields = [...doc.querySelectorAll('select')];
      fields.forEach((select, i) => { select.value = i < 3 ? duplicate[i] : ''; });
      node('submit').click();
      const refused = api.getState();
      assert(refused.lastError.code === 'invalid-length', 'Trois couleurs acceptées');
      assert(JSON.stringify({ ...refused, lastError: null }) === JSON.stringify(before), 'Refus modifie la partie existante');
      assert(node('history').innerHTML === history && node('counter').textContent === '1 / 10 essais', 'Historique ou compteur visible modifié');
      fields[3].value = duplicate[3];
      node('submit').click();
      const won = api.getState();
      assert(won.status === 'won' && won.attempts === 2 && won.history.length === 2 && won.lastError === null, 'Action interface et API non synchronisées');
      assert(node('status').textContent.includes('Bravo') && node('error').textContent === '', 'Victoire ou suppression d’erreur non visible');
    });
    await check('Cas guidé pendant la partie : aucun essai ni historique modifié', async () => {
      await api.startGame({ secret: basic });
      await api.submitGuess(blue);
      const before = JSON.stringify(api.getState());
      const visible = node('game').innerHTML;
      node('run-example').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert(JSON.stringify(api.getState()) === before && node('game').innerHTML === visible, 'La partie active a changé');
    });
    await check('Saisie incomplète dans l’interface : message précis, aucun essai consommé', async () => {
      await api.startGame({ secret: duplicate });
      const fields = [...doc.querySelectorAll('select')];
      for (const values of [ ['rouge', '', '', ''], ['', 'rouge', 'bleu', 'vert'], ['rouge', '', 'bleu', 'vert'], ['rouge', 'rouge', 'bleu', ''], ['', '', '', ''] ]) {
        fields.forEach((select, i) => { select.value = values[i]; });
        node('submit').click();
        const state = api.getState();
        assert(state.lastError.code === 'invalid-length', 'Mauvais code de refus');
        assert(node('error').textContent === 'Choisissez exactement quatre couleurs.', 'Message incomplet incorrect');
        assert(state.attempts === 0 && state.history.length === 0 && state.lastGuess === null && state.lastResult === null, 'Saisie refusée modifie la partie');
        assert(node('counter').textContent === '0 / 10 essais' && node('history').children.length === 0, 'Affichage modifié par le refus');
      }
    });
    await check('Action interface relue par getState ; saisie invalide sans essai', async () => {
      await api.startGame({ secret: duplicate });
      node('submit').click();
      assert(api.getState().attempts === 0 && node('error').textContent.length > 0, 'Saisie vide acceptée');
      [...doc.querySelectorAll('select')].forEach((select, i) => {
        select.value = duplicate[i];
        select.dispatchEvent(new frame.contentWindow.Event('change', { bubbles: true }));
      });
      node('submit').click();
      assert(api.getState().status === 'won', 'Action interface non partagée');
      assert(node('status').textContent.includes('Bravo'), 'Victoire absente de l’écran');
      assert(node('submit').disabled && node('code-fields').disabled, 'Commandes encore actives');
    });
    await check('Priorité game-finished, historique inchangé', async () => {
      const before = node('history').textContent;
      const state = await api.submitGuess(null);
      assert(state.lastError.code === 'game-finished' && node('history').textContent === before, 'Fin non figée');
    });
    await check('Nouvelle partie depuis interface et API synchronisées', () => {
      node('restart').click();
      assert(api.getState().status === 'playing' && api.getState().attempts === 0, 'Redémarrage non partagé');
      assert(node('history').children.length === 0, 'Historique non vide');
      assert([...doc.querySelectorAll('select')].every((select) => select.value === ''), 'Saisie non remise à zéro');
    });
    await check('Démarrage invalide : état, erreur et écran intégralement inchangés', async () => {
      await api.submitGuess([]);
      const before = JSON.stringify(api.getState());
      const html = node('game').innerHTML;
      let rejected = false;
      try { await api.startGame({ secret: undefined }); }
      catch (error) { rejected = error.code === 'invalid-type'; }
      assert(rejected && JSON.stringify(api.getState()) === before && node('game').innerHTML === html, 'Démarrage invalide non atomique');
    });
    await check('Victoire au dixième après refus au neuvième', async () => {
      await api.startGame({ secret: red });
      for (let i = 0; i < 9; i += 1) await api.submitGuess(blue);
      await api.submitGuess(['rouge']);
      assert(api.getState().attempts === 9 && node('counter').textContent === '9 / 10 essais', 'Refus consomme un essai');
      const state = await api.submitGuess(red);
      assert(state.status === 'won' && node('status').textContent.includes('Bravo') && node('history').children.length === 10, 'Victoire au dixième incorrecte');
    });
    await check('Défaite au dixième visible et commandes désactivées', async () => {
      await api.startGame({ secret: red });
      for (let i = 0; i < 10; i += 1) await api.submitGuess(blue);
      assert(api.getState().status === 'lost' && node('status').textContent.includes('écoulés') && node('submit').disabled, 'Défaite incorrecte');
      assert(node('history').children.length === 10, 'Historique tronqué');
    });
    frame.style.width = '320px';
    await new Promise((resolve) => frame.contentWindow.requestAnimationFrame(() => frame.contentWindow.requestAnimationFrame(resolve)));
    await check('Largeur 320 px : dix essais consultables sans débordement horizontal', () => {
      assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth, 'Débordement horizontal');
    });
    await check('Après défaite : refus prioritaire et redémarrage entièrement remis à zéro', async () => {
      const before = api.getState();
      const history = node('history').innerHTML;
      assert(before.status === 'lost', 'Précondition de défaite absente');
      const refused = await api.submitGuess(null);
      assert(refused.lastError.code === 'game-finished', 'Mauvaise priorité après défaite');
      assert(JSON.stringify({ ...refused, lastError: null }) === JSON.stringify(before) && node('history').innerHTML === history, 'Une proposition après défaite modifie la partie');
      const state = await api.startGame({ secret: duplicate });
      assert(state.status === 'playing' && state.attempts === 0 && state.history.length === 0 && state.lastGuess === null && state.lastResult === null && state.lastError === null, 'État non remis à zéro');
      assert(node('counter').textContent === '0 / 10 essais' && node('history').children.length === 0 && node('error').textContent === '', 'Écran non remis à zéro');
      assert([...doc.querySelectorAll('select')].every((select) => select.value === '') && !node('submit').disabled && !node('code-fields').disabled, 'Saisie non réinitialisée');
    });
    await check('Rechargement mode test : aucun secret ni état conservé', async () => {
      await load('../?test=1');
      assert(frame.contentWindow.codeSecretTest.getState().status === 'not-started', 'État conservé');
    });
    await check('API absente avec test=0 et test=true', async () => {
      for (const url of ['../?autre=conserve&test=0', '../?test=true']) {
        await load(url);
        assert(!('codeSecretTest' in frame.contentWindow), 'API exposée pour une valeur différente de 1');
        assert(!frame.contentDocument.getElementById('submit').disabled, 'Partie normale non démarrée');
      }
    });
    await check('Mode normal : API absente et partie prête', async () => {
      await load('../');
      assert(!('codeSecretTest' in frame.contentWindow), 'API exposée hors mode test');
      assert(!frame.contentDocument.getElementById('submit').disabled, 'Partie normale non démarrée');
    });
    report.textContent += `\n${passed} vérifications réussies ; 0 échec.\nVersion testée : ${report.dataset.version}\nApplication : ${report.dataset.application}\n`;
  } catch (error) {
    report.textContent += `\nÉCHEC après ${passed} réussites : ${error.message}\n`;
  } finally { button.disabled = false; }
});
