// Serveur statique local de développement uniquement, lié à l'interface loopback.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const base = process.env.BASE_PATH || '/';
const port = Number(process.env.PORT || 4173);
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('BASE_PATH doit être un chemin tel que /code_secret/.');
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) { res.writeHead(404).end('Fichier introuvable'); return; }
    const name = `/${pathname.slice(base.length)}`;
    const target = path.resolve(root, `.${name.endsWith('/') ? `${name}index.html` : name}`);
    const relative = path.relative(root, target);
    const allowed = ['index.html', 'manifest.webmanifest', 'sw.js'].includes(relative) || relative.startsWith(`src${path.sep}`) || relative.startsWith(`assets${path.sep}`) || relative === `dist${path.sep}app.js`
      || ['test/browser.html', 'test/browser.js', 'test/pwa.html', 'test/pwa.js', 'examples/morpion/index.html'].some((entry) => relative === entry.replaceAll('/', path.sep));
    if (!allowed || relative.startsWith('..') || !(await stat(target)).isFile()) {
      res.writeHead(404).end('Fichier introuvable'); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(target));
  } catch { res.writeHead(404).end('Fichier introuvable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Code secret : http://127.0.0.1:${port}${base}`));
