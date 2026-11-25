import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { APP_VERSION } from '../src/game.js';

const root = new URL('../', import.meta.url);
const workerSource = await readFile(new URL('sw.js', root), 'utf8');
const pwaSource = await readFile(new URL('src/pwa.js', root), 'utf8');
const origin = 'https://example.test';
const base = `${origin}/code_secret/`;

async function worker({ failInstall = false } = {}) {
  const handlers = {};
  const stores = new Map([['another-app', new Map()], ['code-secret:/other/:old', new Map()], ['code-secret:/code_secret/:old', new Map()]]);
  let networkCalls = 0;
  let claims = 0;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (key) => stores.delete(key),
    open: async (key) => {
      if (!stores.has(key)) stores.set(key, new Map());
      const store = stores.get(key);
      return {
        addAll: async (requests) => {
          if (failInstall) throw new Error('network unavailable');
          const entries = await Promise.all(requests.map(async (request) => {
            assert.equal(request.cache, 'reload');
            const file = new URL(request.url).pathname.slice('/code_secret/'.length);
            return [request.url, new Response(await readFile(new URL(file, root)))];
          }));
          for (const [key, value] of entries) store.set(key, value);
        },
        match: async (key) => store.get(key)?.clone(),
      };
    },
  };
  runInNewContext(workerSource, {
    URL, Request, caches,
    self: { location: { href: `${base}sw.js` }, clients: { claim: async () => { claims += 1; } }, addEventListener: (type, listener) => { handlers[type] = listener; } },
    fetch: async () => { networkCalls += 1; throw new TypeError('offline'); },
  });
  const lifecycle = (type) => {
    let pending;
    handlers[type]({ waitUntil: (promise) => { pending = promise; } });
    return pending;
  };
  const request = (url, mode = 'navigate', method = 'GET') => {
    let response;
    handlers.fetch({ request: { url, mode, method }, respondWith: (promise) => { response = promise; } });
    return response;
  };
  return { lifecycle, request, stores, networkCalls: () => networkCalls, claims: () => claims };
}

test('manifeste : identité, démarrage et icônes valides sous /code_secret/', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root)));
  assert.equal(manifest.name, 'Code secret');
  assert.equal(manifest.display, 'standalone');
  for (const key of ['id', 'scope', 'start_url']) assert.equal(new URL(manifest[key], base).href, base);
  for (const icon of manifest.icons) {
    assert.equal(new URL(icon.src, base).origin, origin);
    const png = await readFile(new URL(icon.src, root));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
});

test('précache cohérent et versionné : tous les fichiers existent et le moteur correspond', async () => {
  assert.ok(workerSource.includes(`const VERSION = '${APP_VERSION}'`));
  const w = await worker();
  await w.lifecycle('install');
  const store = w.stores.get(`code-secret:/code_secret/:${APP_VERSION}`);
  assert.ok(store.size >= 10);
  const html = await store.get(`${base}index.html`).text();
  for (const url of [...html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)].map((match) => new URL(match[1], base).href)) {
    assert.ok(store.has(url), `Ressource HTML absente du précache : ${url}`);
  }
});

test('hors ligne simulé : accueil, paramètres et fichiers du jeu répondent sans réseau', async () => {
  const w = await worker();
  await w.lifecycle('install');
  await w.lifecycle('activate');
  for (const url of [base, `${base}?source=qr`, `${base}index.html`]) {
    const response = await w.request(url);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /id="guess-form"/);
  }
  for (const url of w.stores.get(`code-secret:/code_secret/:${APP_VERSION}`).keys()) {
    assert.equal((await w.request(url, 'same-origin')).status, 200);
  }
  assert.equal(w.networkCalls(), 0);
});

test('cache : ne supprime pas les données des autres applications et dossiers', async () => {
  const w = await worker();
  await w.lifecycle('install');
  await w.lifecycle('activate');
  assert.ok(w.stores.has('another-app'));
  assert.ok(w.stores.has('code-secret:/other/:old'));
  assert.equal(w.stores.has('code-secret:/code_secret/:old'), false);
  assert.equal(w.claims(), 1);
});

test('requêtes de test, autres chemins, autres domaines et écritures non interceptés', async () => {
  const w = await worker();
  for (const [url, mode, method] of [
    [`${base}?test=1`, 'navigate', 'GET'], [`${base}test/browser.html`, 'navigate', 'GET'],
    [`${origin}/another/`, 'navigate', 'GET'], ['https://other.test/', 'navigate', 'GET'],
    [base, 'navigate', 'POST'], [`${base}README.md`, 'same-origin', 'GET'],
  ]) assert.equal(w.request(url, mode, method), undefined);
});

test('installation du cache échouée : ancien cache conservé, pas de prise de contrôle', async () => {
  const w = await worker({ failInstall: true });
  await assert.rejects(w.lifecycle('install'), /network unavailable/);
  assert.ok(w.stores.has('code-secret:/code_secret/:old'));
  assert.equal(w.claims(), 0);
});

function installUI({ standalone = false, testMode = false, file = false, registerError = false } = {}) {
  const nodes = Object.fromEntries(['install-app', 'install-status', 'offline-status'].map((id) => [id, { hidden: id === 'install-app', textContent: '', addEventListener(type, handler) { this[type] = handler; } }]));
  const handlers = {};
  const registration = { addEventListener() {}, waiting: null };
  let registrations = 0;
  const nav = { serviceWorker: { register: async (path, options) => { registrations += 1; assert.equal(path, './sw.js'); assert.equal(options.scope, './'); if (registerError) throw new Error('registration failed'); return registration; }, ready: Promise.resolve(registration) } };
  runInNewContext(pwaSource, {
    document: { getElementById: (id) => nodes[id] }, navigator: nav, URLSearchParams,
    window: { location: { search: testMode ? '?test=1' : '', protocol: file ? 'file:' : 'https:' }, isSecureContext: true, matchMedia: () => ({ matches: standalone, addEventListener() {} }), addEventListener: (type, handler) => { handlers[type] = handler; } },
  });
  return { nodes, handlers, registrations: () => registrations };
}

test('installation : bouton affiché uniquement après événement, acceptation et annulation', async () => {
  for (const outcome of ['accepted', 'dismissed']) {
    const ui = installUI();
    assert.equal(ui.nodes['install-app'].hidden, true);
    let prevented = false;
    let prompts = 0;
    ui.handlers.beforeinstallprompt({ preventDefault: () => { prevented = true; }, prompt: async () => { prompts += 1; return { outcome }; } });
    assert.equal(prevented, true);
    assert.equal(ui.nodes['install-app'].hidden, false);
    await ui.nodes['install-app'].click();
    await ui.nodes['install-app'].click();
    assert.equal(prompts, 1);
    assert.equal(ui.nodes['install-app'].hidden, true);
    assert.match(ui.nodes['install-status'].textContent, outcome === 'accepted' ? /acceptée/ : /annulée/);
  }
});

test('installation : erreur de dialogue et événement appinstalled expliqués', async () => {
  const ui = installUI();
  ui.handlers.beforeinstallprompt({ preventDefault() {}, prompt: async () => { throw new Error('unavailable'); } });
  await ui.nodes['install-app'].click();
  assert.match(ui.nodes['install-status'].textContent, /menu du navigateur/);
  ui.handlers.appinstalled();
  assert.match(ui.nodes['install-status'].textContent, /est installé/);
});

test('mode installé : pas de nouvelle invitation ; test et file sans enregistrement', () => {
  const installed = installUI({ standalone: true });
  installed.handlers.beforeinstallprompt({ preventDefault() {} });
  assert.equal(installed.nodes['install-app'].hidden, true);
  for (const options of [{ testMode: true }, { file: true }]) {
    const ui = installUI(options);
    assert.equal(ui.handlers.load, undefined);
    assert.equal(ui.registrations(), 0);
    assert.ok(ui.nodes['offline-status'].textContent.length > 0);
  }
});

test('préparation hors ligne : succès et erreur annoncés sans dépendance au moteur', async () => {
  for (const registerError of [false, true]) {
    const ui = installUI({ registerError });
    await ui.handlers.load();
    assert.equal(ui.registrations(), 1);
    assert.match(ui.nodes['offline-status'].textContent, registerError ? /reste utilisable en ligne/ : /prêt hors connexion/);
  }
});
