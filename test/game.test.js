import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { COLORS, createGame } from '../src/game.js';

const basic = ['rouge', 'bleu', 'vert', 'jaune'];
const duplicate = ['rouge', 'rouge', 'bleu', 'vert'];
const reds = Array(4).fill('rouge');
const blues = Array(4).fill('bleu');
const initial = { status: 'not-started', attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null };

test('options ordinaires issues d’un autre contexte JavaScript acceptées', async () => {
  const api = createGame();
  const options = runInNewContext('({secret: ["rouge", "rouge", "rouge", "rouge"]})');
  await api.startGame(options);
  assert.equal((await api.submitGuess(reds)).status, 'won');
});

test('configuration exacte et état initial sans solution', () => {
  const api = createGame();
  assert.equal(api.version, '0.2');
  assert.deepEqual(api.getConfig(), { apiVersion: '0.2', rulesVersion: 'code-couleurs-1.0', secretLength: 4, maxAttempts: 10, allowDuplicates: true, colors: [...COLORS] });
  assert.deepEqual(api.getState(), initial);
});

const examples = [
  [basic, ['rouge', 'vert', 'bleu', 'orange'], 1, 2],
  [basic, ['orange', 'violet', 'rouge', 'bleu'], 0, 2],
  [basic, ['bleu', 'rouge', 'jaune', 'vert'], 0, 4],
  [basic, ['rouge', 'bleu', 'jaune', 'vert'], 2, 2],
  [basic, basic, 4, 0],
  [duplicate, reds, 2, 0],
  [duplicate, ['rouge', 'bleu', 'rouge', 'vert'], 2, 2],
  [duplicate, duplicate, 4, 0],
  [duplicate, ['rouge', 'bleu', 'rouge', 'rouge'], 1, 2],
];
examples.forEach(([secret, guess, wellPlaced, misplaced], index) => {
  test(`T${String(index + 1).padStart(2, '0')} : attendu ${wellPlaced}/${misplaced}`, async () => {
    const api = createGame();
    await api.startGame({ secret });
    const result = api.submitGuess(guess);
    assert.ok(result instanceof Promise);
    const state = await result;
    assert.deepEqual(state, {
      status: wellPlaced === 4 ? 'won' : 'playing', attempts: 1,
      history: [{ guess, result: { wellPlaced, misplaced } }],
      lastGuess: guess, lastResult: { wellPlaced, misplaced }, lastError: null,
    });
  });
});

test('avant démarrage : priorité game-not-started, aucun essai', async () => {
  const api = createGame();
  const state = await api.submitGuess(null);
  assert.equal(state.lastError.code, 'game-not-started');
  assert.deepEqual({ ...state, lastError: null }, initial);
});

const invalidGuesses = [
  [null, 'invalid-type'], ['rouge', 'invalid-type'],
  [['rouge', null], 'invalid-type'], [new Array(4), 'invalid-type'],
  [['rouge', undefined, 'vert', 'jaune'], 'invalid-type'],
  [['rouge'], 'invalid-length'], [[], 'invalid-length'],
  [['inconnue'], 'invalid-length'],
  [['rouge', 'bleu', 'vert', 'jaune', 'orange'], 'invalid-length'],
  [['rouge', 'bleu', 'vert', 'Violet'], 'invalid-color'],
  [['rouge', 'bleu', 'vert', 'violet '], 'invalid-color'],
  [['rouge', 'bleu', 'vert', 'purple'], 'invalid-color'],
];
invalidGuesses.forEach(([guess, code], index) => {
  test(`refus ${index + 1} : ${code}, seul lastError change`, async () => {
    const api = createGame();
    await api.startGame({ secret: basic });
    await api.submitGuess(blues);
    const before = api.getState();
    const state = await api.submitGuess(guess);
    assert.equal(state.lastError.code, code);
    assert.ok(state.lastError.message.length > 0);
    assert.deepEqual({ ...state, lastError: null }, before);
    assert.deepEqual(api.getState(), state);
    assert.equal((await api.submitGuess(basic)).lastError, null);
  });
});

const invalidOptions = [
  [null, 'invalid-options'], [[], 'invalid-options'], [true, 'invalid-options'],
  ['secret', 'invalid-options'], [new Date(), 'invalid-options'],
  [{ mode: 'facile', secret: null }, 'invalid-options'],
  [{ secret: reds, [Symbol('extra')]: true }, 'invalid-options'],
  [{ secret: undefined }, 'invalid-type'], [{ secret: null }, 'invalid-type'],
  [{ secret: ['rouge', null] }, 'invalid-type'],
  [{ secret: new Array(4) }, 'invalid-type'],
  [{ secret: ['rouge'] }, 'invalid-length'],
  [{ secret: ['rouge', 'rouge', 'rouge', 'red'] }, 'invalid-color'],
];
invalidOptions.forEach(([options, code], index) => {
  test(`startGame invalide ${index + 1} : rejet ${code}, état et rendu inchangés`, async () => {
    let renders = 0;
    const api = createGame(() => { renders += 1; });
    await api.startGame({ secret: basic });
    await api.submitGuess(null);
    const before = api.getState();
    const count = renders;
    await assert.rejects(api.startGame(options), (error) => error instanceof Error && error.code === code && error.message.length > 0);
    assert.deepEqual(api.getState(), before);
    assert.equal(renders, count);
  });
});

test('victoire au dixième, avec refus au neuvième sans essai consommé', async () => {
  const api = createGame();
  await api.startGame({ secret: reds });
  for (let i = 0; i < 9; i += 1) await api.submitGuess(blues);
  const refused = await api.submitGuess(['rouge']);
  assert.equal(refused.attempts, 9);
  assert.equal(refused.lastError.code, 'invalid-length');
  const won = await api.submitGuess(reds);
  assert.equal(won.status, 'won');
  assert.equal(won.attempts, 10);
  assert.equal(won.history.length, 10);
  assert.equal(won.lastError, null);
});

for (const end of ['won', 'lost']) {
  test(`${end} : fin figée, priorité game-finished et redémarrage`, async () => {
    const api = createGame();
    await api.startGame({ secret: reds });
    if (end === 'won') await api.submitGuess(reds);
    else for (let i = 0; i < 10; i += 1) await api.submitGuess(blues);
    const before = api.getState();
    assert.equal(before.status, end);
    if (end === 'lost') {
      assert.equal(before.attempts, 10);
      assert.deepEqual(before.lastResult, { wellPlaced: 0, misplaced: 0 });
    }
    const after = await api.submitGuess(null);
    assert.equal(after.lastError.code, 'game-finished');
    assert.deepEqual({ ...after, lastError: null }, before);
    assert.deepEqual(await api.startGame({ secret: basic }), { ...initial, status: 'playing' });
  });
}

test('entrées, états et configurations sont des copies indépendantes', async () => {
  const api = createGame();
  const secret = [...duplicate];
  const started = await api.startGame({ secret });
  secret.fill('jaune');
  started.status = 'lost';
  const guess = [...duplicate];
  const response = await api.submitGuess(guess);
  guess.fill('orange');
  response.history[0].guess.fill('violet');
  response.lastResult.wellPlaced = 0;
  api.getState().history.length = 0;
  api.getConfig().colors.fill('red');
  assert.equal(api.getState().status, 'won');
  assert.deepEqual(api.getState().lastGuess, duplicate);
  assert.equal(api.getState().lastResult.wellPlaced, 4);
  assert.deepEqual(api.getConfig().colors, [...COLORS]);
  assert.doesNotThrow(() => JSON.stringify(api.getState()));
  assert.equal('secret' in api.getState(), false);
  assert.equal('solution' in api.getState(), false);
});

test('getters sans effet et rendu terminé avant résolution des mutations', async () => {
  let visible;
  let calls = 0;
  const api = createGame((state) => { visible = state; calls += 1; });
  assert.deepEqual(await api.startGame({ secret: basic }), visible);
  assert.deepEqual(await api.submitGuess(blues), visible);
  assert.deepEqual(await api.submitGuess([]), visible);
  const count = calls;
  const before = api.getState();
  api.getConfig(); api.getState();
  assert.equal(calls, count);
  assert.deepEqual(api.getState(), before);
  visible.history.length = 0;
  assert.equal(api.getState().history.length, 1);
});

test('chaque démarrage sans secret tire quatre couleurs, avec répétitions possibles', async () => {
  let calls = 0;
  let value = 0;
  const api = createGame(() => {}, () => { calls += 1; return value; });
  for (const options of [undefined, {}, undefined, {}]) {
    const started = await api.startGame(options);
    assert.equal(started.attempts, 0);
    assert.deepEqual(started.history, []);
    const guess = Array(4).fill(value === 0 ? 'rouge' : 'violet');
    assert.equal((await api.submitGuess(guess)).status, 'won');
    value = 0.999999;
  }
  assert.equal(calls, 16);
});

test('un secret imposé ne consomme aucun tirage et le démarrage suivant redevient aléatoire', async () => {
  let calls = 0;
  const api = createGame(() => {}, () => { calls += 1; return 0.999999; });
  await api.startGame({ secret: blues });
  assert.equal((await api.submitGuess(blues)).status, 'won');
  assert.equal(calls, 0);
  await api.startGame();
  assert.equal(calls, 4);
  assert.equal((await api.submitGuess(Array(4).fill('violet'))).status, 'won');
});

test('les six couleurs sont accessibles et le secret tiré reste fixe pendant une partie', async () => {
  for (let index = 0; index < COLORS.length; index += 1) {
    let calls = 0;
    const api = createGame(() => {}, () => { calls += 1; return (index + 0.5) / COLORS.length; });
    await api.startGame();
    await api.submitGuess(Array(4).fill(COLORS[(index + 1) % COLORS.length]));
    assert.equal((await api.submitGuess(Array(4).fill(COLORS[index]))).status, 'won');
    assert.equal(calls, 4);
  }
});
