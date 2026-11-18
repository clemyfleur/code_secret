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
    await check('Rechargement mode test : aucun secret ni état conservé', async () => {
      await load('../?test=1');
      assert(frame.contentWindow.codeSecretTest.getState().status === 'not-started', 'État conservé');
    });
    await check('Mode normal : API absente et partie prête', async () => {
      await load('../');
      assert(!('codeSecretTest' in frame.contentWindow), 'API exposée hors mode test');
      assert(!frame.contentDocument.getElementById('submit').disabled, 'Partie normale non démarrée');
    });
    report.textContent += `\n${passed} vérifications réussies ; 0 échec.\n`;
  } catch (error) {
    report.textContent += `\nÉCHEC après ${passed} réussites : ${error.message}\n`;
  } finally { button.disabled = false; }
});
