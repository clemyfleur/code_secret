// Petit assemblage sans dépendance : un script classique fonctionne aussi en file://.
// Les sources restent séparées et importables par les tests Node.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const engine = await readFile(new URL('src/game.js', root), 'utf8');
const ui = await readFile(new URL('src/app.js', root), 'utf8');
const importLine = "import { APP_VERSION, COLORS, createGame } from './game.js';";
if (!ui.startsWith(importLine)) throw new Error('Import de l’interface modifié : adapter le script build.');
const body = engine.replace(/^export (?=const |function )/gm, '') + '\n' + ui.slice(importLine.length);
const bundle = '// Généré par node scripts/build.js. Modifier src/, puis régénérer.\n'
  + '(async () => {\n\'use strict\';\n' + body + '\n})().catch((error) => {\n'
  + '  console.error(error);\n'
  + '  document.getElementById("status").textContent = "Impossible de démarrer le jeu. Rechargez la page ou ouvrez-la avec le serveur local.";\n'
  + '});\n';
const target = new URL('dist/app.js', root);
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bundle) throw new Error('Le script dist/app.js doit être régénéré : node scripts/build.js');
  console.log('Script généré à jour.');
} else {
  await mkdir(new URL('dist/', root), { recursive: true });
  await writeFile(target, bundle, 'utf8');
  console.log('dist/app.js généré ; compatible HTTP et ouverture directe.');
}
