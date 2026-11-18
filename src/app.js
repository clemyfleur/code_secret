import { APP_VERSION, COLORS, createGame } from './game.js';

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
