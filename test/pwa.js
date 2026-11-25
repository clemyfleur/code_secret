const report = document.getElementById('report');
const button = document.getElementById('run');
const frame = document.getElementById('app');
const assert = (ok, message) => { if (!ok) throw new Error(message); };
button.addEventListener('click', async () => {
  button.disabled = true;
  report.textContent = '';
  let passed = 0;
  const check = async (name, action) => { await action(); passed += 1; report.textContent += `OK ${name}\n`; };
  const load = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chargement trop long')), 15000);
    frame.onload = () => { clearTimeout(timer); resolve(); };
    frame.src = '../#installer';
  });
  try {
    await load();
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const node = (id) => doc.getElementById(id);
    await check('Guide présent, QR affiché, URL publique exacte', async () => {
      assert(node('installer') && node('install-app') && node('install-status'), 'Guide incomplet');
      const qr = doc.querySelector('.install-qr img');
      await qr.decode();
      assert(qr.naturalWidth === 656 && qr.naturalHeight === 656, 'QR non chargé');
      assert(doc.querySelector('.install-qr a').href === 'https://clemyfleur.github.io/code_secret/#installer', 'Mauvaise URL');
      assert(doc.querySelectorAll('.install-guide details').length === 3, 'Guides par appareil absents');
    });
    await check('Manifeste et icônes servis sous le sous-répertoire courant', async () => {
      const response = await fetch(doc.querySelector('link[rel="manifest"]').href);
      assert(response.ok, 'Manifeste inaccessible');
      const manifest = await response.json();
      assert(manifest.name === 'Code secret' && manifest.display === 'standalone', 'Manifeste incorrect');
      assert(new URL(manifest.start_url, response.url).href === new URL('../', location.href).href, 'Démarrage hors du jeu');
      for (const icon of manifest.icons) {
        const img = new Image();
        img.src = new URL(icon.src, response.url).href;
        await img.decode();
        assert(`${img.naturalWidth}x${img.naturalHeight}` === icon.sizes, 'Dimensions icône incorrectes');
      }
    });
    await check('Application normale jouable à 375 px, guide sans débordement', async () => {
      assert(!('codeSecretTest' in win), 'API de test exposée');
      assert(!node('submit').disabled, 'Jeu bloqué');
      const palette = ['rouge', 'bleu', 'vert', 'jaune'];
      [...doc.querySelectorAll('select')].forEach((select, i) => { select.value = palette[i]; select.dispatchEvent(new win.Event('change', { bubbles: true })); });
      node('submit').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert(node('counter').textContent === '1 / 10 essais' && node('history').children.length === 1, 'Coup absent');
      assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth, 'Débordement horizontal');
      for (const details of doc.querySelectorAll('.install-guide details')) details.open = true;
      assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth, 'Guide ouvert déborde');
    });
    await check('Service worker actif dans le bon périmètre et fichiers prêts en cache', async () => {
      const registration = await Promise.race([win.navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker non prêt')), 15000))]);
      assert(registration.scope === new URL('../', location.href).href, 'Mauvais périmètre');
      const prefix = `code-secret:${new URL(registration.scope).pathname}:`;
      const names = (await caches.keys()).filter((name) => name.startsWith(prefix));
      assert(names.length > 0, 'Cache absent');
      const cache = await caches.open(`${prefix}0.2.0`);
      for (const file of ['index.html', 'dist/app.js?v=0.2.0', 'src/pwa.js?v=0.2.0', 'src/styles.css?v=0.2.0', 'manifest.webmanifest', 'assets/qr-code-secret.png']) {
        const response = await cache.match(new URL(file, registration.scope).href);
        assert(response?.ok, `Ressource absente : ${file}`);
      }
      assert(node('offline-status').textContent.includes('hors connexion'), 'État hors ligne absent');
    });
    if ('BarcodeDetector' in window) {
      const formats = await BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        await check('QR décodé par le navigateur : URL exacte', async () => {
          const img = await createImageBitmap(await (await fetch('../assets/qr-code-secret.png')).blob());
          const codes = await new BarcodeDetector({ formats: ['qr_code'] }).detect(img);
          assert(codes.some((code) => code.rawValue === 'https://clemyfleur.github.io/code_secret/#installer'), 'Décodage QR incorrect');
          img.close();
        });
      } else report.textContent += 'NON VÉRIFIÉ : décodeur QR indisponible dans ce navigateur.\n';
    } else report.textContent += 'NON VÉRIFIÉ : décodeur QR indisponible dans ce navigateur.\n';
    report.textContent += `\n${passed} contrôles PWA réussis ; 0 échec.\nVersion : ${node('version').textContent}\nApplication : ${frame.src}\nInstallation réelle et mode avion : à confirmer sur appareil.\n`;
  } catch (error) { report.textContent += `ÉCHEC après ${passed} réussites : ${error.message}\n`; }
  finally { button.disabled = false; }
});
