export const COLORS = Object.freeze(['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet']);
export const APP_VERSION = '0.1.4';
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
export function createGame(render = () => {}, random = Math.random) {
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
