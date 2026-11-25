// Généré par node scripts/build.js. Modifier src/, puis régénérer.
(async () => {
'use strict';
const COLORS = Object.freeze(['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet']);
const APP_VERSION = '0.2.0';
const CONFIG = Object.freeze({
  apiVersion: '0.2', rulesVersion: 'code-couleurs-1.0',
  secretLength: 4, maxAttempts: 10, allowDuplicates: true, colors: COLORS,
});
const messages = {
  'invalid-options': 'Les options doivent être un objet contenant uniquement la clé secret, ou être absentes.',
  'invalid-type': 'Fournissez un tableau complet de noms de couleurs, sans élément absent.',
  'invalid-length': 'Choisissez exactement quatre couleurs.',
  'invalid-color': 'Utilisez uniquement rouge, bleu, vert, jaune, orange ou violet, en minuscules.',
  'game-not-started': 'Démarrez une nouvelle partie avant de proposer un code.',
  'game-finished': 'Cette partie est terminée. Démarrez une nouvelle partie.',
};
const refusal = (code) => ({ code, message: messages[code] });

function isOrdinaryObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  // Le prototype Object d'un iframe est différent de celui de la page courante.
  return proto === null || (Object.getPrototypeOf(proto) === null
    && Object.hasOwn(proto, 'constructor') && typeof proto.constructor === 'function'
    && Function.prototype.toString.call(proto.constructor) === Function.prototype.toString.call(Object));
}

function validateCode(value) {
  if (!Array.isArray(value)) return 'invalid-type';
  for (let i = 0; i < value.length; i += 1) {
    if (!Object.hasOwn(value, i) || typeof value[i] !== 'string') return 'invalid-type';
  }
  if (value.length !== CONFIG.secretLength) return 'invalid-length';
  if (value.some((color) => !COLORS.includes(color))) return 'invalid-color';
  return null;
}

// Les correspondances exactes sont retirées avant le comptage des autres occurrences.
function score(secret, guess) {
  let wellPlaced = 0;
  const remainingSecret = [];
  const remainingGuess = [];
  secret.forEach((color, i) => {
    if (color === guess[i]) wellPlaced += 1;
    else { remainingSecret.push(color); remainingGuess.push(guess[i]); }
  });
  let misplaced = 0;
  for (const color of remainingGuess) {
    const index = remainingSecret.indexOf(color);
    if (index !== -1) { misplaced += 1; remainingSecret.splice(index, 1); }
  }
  return { wellPlaced, misplaced };
}

const initialState = (status = 'not-started') => ({
  status, attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null,
});

// Une instance par page : l'interface et l'API reçoivent exactement les mêmes commandes.
function createGame(render = () => {}, random = Math.random) {
  let state = initialState();
  let secret = null;
  const getState = () => structuredClone(state);
  const publish = (action) => {
    render(getState(), action);
    return getState();
  };
  return Object.freeze({
    version: CONFIG.apiVersion,
    getConfig: () => structuredClone(CONFIG),
    getState,
    async startGame(options = {}) {
      let error = !isOrdinaryObject(options) || Reflect.ownKeys(options).some((key) => key !== 'secret')
        ? 'invalid-options' : null;
      if (!error && Object.hasOwn(options, 'secret')) error = validateCode(options.secret);
      if (error) throw Object.assign(new Error(messages[error]), { code: error });
      const nextSecret = Object.hasOwn(options, 'secret')
        ? [...options.secret]
        : Array.from({ length: CONFIG.secretLength }, () => COLORS[Math.floor(random() * COLORS.length)]);
      secret = nextSecret;
      state = initialState('playing');
      return publish('start');
    },
    async submitGuess(guess) {
      const error = state.status === 'not-started' ? 'game-not-started'
        : state.status !== 'playing' ? 'game-finished' : validateCode(guess);
      if (error) {
        state.lastError = refusal(error);
        return publish('refusal');
      }
      const result = score(secret, guess);
      state.attempts += 1;
      state.history.push({ guess: [...guess], result });
      state.lastGuess = [...guess];
      state.lastResult = result;
      state.lastError = null;
      state.status = result.wellPlaced === CONFIG.secretLength ? 'won'
        : state.attempts === CONFIG.maxAttempts ? 'lost' : 'playing';
      return publish('guess');
    },
  });
}



const $ = (id) => document.getElementById(id);
const form = $('guess-form');
const selects = COLORS.slice(0, 4).map((_, index) => {
  const label = document.createElement('label');
  label.className = 'slot';
  const text = document.createElement('span');
  text.textContent = `Position ${index + 1}`;
  const dot = document.createElement('span');
  dot.className = 'swatch';
  dot.setAttribute('aria-hidden', 'true');
  const select = document.createElement('select');
  select.name = `position-${index + 1}`;
  select.setAttribute('aria-describedby', 'error');
  select.add(new Option('Choisir…', ''));
  COLORS.forEach((color) => select.add(new Option(color, color)));
  select.addEventListener('change', () => { dot.dataset.color = select.value; });
  label.append(text, dot, select);
  $('slots').append(label);
  return select;
});

function render(state, action) {
  if (action === 'start') {
    form.reset();
    document.querySelectorAll('.slot .swatch').forEach((dot) => { dot.dataset.color = ''; });
  }
  const active = state.status === 'playing';
  $('code-fields').disabled = !active;
  $('submit').disabled = !active;
  $('counter').textContent = `${state.attempts} / 10 essais`;
  $('error').textContent = state.lastError?.message ?? '';
  const feedback = state.lastResult
    ? `Dernier indice : ${state.lastResult.wellPlaced} bien placée(s), ${state.lastResult.misplaced} mal placée(s). ` : '';
  $('status').textContent = {
    'not-started': 'Prêt à relever le défi ? Démarrez une nouvelle partie.',
    playing: `${feedback}Il vous reste ${10 - state.attempts} essai(s).`,
    won: `Bravo ! Code trouvé en ${state.attempts} essai(s).`,
    lost: 'Les dix essais sont écoulés. Relancez le défi !',
  }[state.status];
  $('empty').hidden = state.history.length > 0;
  const rows = state.history.map(({ guess, result }, index) => {
    const row = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'attempt';
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-label', `Essai ${index + 1}`);
    const pegs = document.createElement('div');
    pegs.className = 'pegs';
    guess.forEach((color) => {
      const peg = document.createElement('span');
      peg.className = 'peg';
      const dot = document.createElement('span');
      dot.className = 'swatch';
      dot.dataset.color = color;
      dot.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.textContent = color;
      peg.append(dot, name);
      pegs.append(peg);
    });
    const hints = document.createElement('div');
    hints.className = 'hints';
    hints.textContent = `${result.wellPlaced} bien placée(s) · ${result.misplaced} mal placée(s)`;
    row.append(number, pegs, hints);
    return row;
  });
  $('history').replaceChildren(...rows);
}

const game = createGame(render);
$('run-example').addEventListener('click', async () => {
  const example = createGame();
  await example.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] });
  const { lastResult, attempts } = await example.submitGuess(Array(4).fill('rouge'));
  $('example-result').textContent = `${lastResult.wellPlaced} bien placées, ${lastResult.misplaced} mal placée, ${attempts} essai utilisé.`;
  $('example-explanation').hidden = false;
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Une position non choisie n'est pas une couleur : le moteur signale une saisie incomplète.
  const guess = selects.map((select) => select.value).filter((color) => color !== '');
  await game.submitGuess(guess);
});
$('restart').addEventListener('click', async () => {
  await game.startGame();
  selects[0].focus();
});
$('version').textContent = `v${APP_VERSION}`;
render(game.getState());
if (new URLSearchParams(window.location.search).get('test') === '1') {
  window.codeSecretTest = game;
} else {
  await game.startGame();
}

})().catch((error) => {
  console.error(error);
  document.getElementById("status").textContent = "Impossible de démarrer le jeu. Rechargez la page ou ouvrez-la avec le serveur local.";
});
