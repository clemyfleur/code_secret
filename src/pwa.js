// Amélioration progressive : aucune dépendance au moteur ou à la partie.
(() => {
  'use strict';
  const button = document.getElementById('install-app');
  const status = document.getElementById('install-status');
  const offline = document.getElementById('offline-status');
  const standalone = window.matchMedia('(display-mode: standalone)');
  let pendingPrompt = null;

  const installed = () => standalone.matches || navigator.standalone === true;
  const showInstalled = () => {
    pendingPrompt = null;
    button.hidden = true;
    status.textContent = installed()
      ? 'Code secret est ouvert comme une application. Bonne partie !'
      : 'Code secret est installé. Ouvrez-le depuis son icône sur votre appareil.';
  };
  if (installed()) showInstalled();
  standalone.addEventListener?.('change', () => { if (installed()) showInstalled(); });
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    if (installed()) return;
    pendingPrompt = event;
    button.hidden = false;
    status.textContent = 'Votre navigateur propose l’installation. Vous pouvez aussi continuer à jouer ici.';
  });
  window.addEventListener('appinstalled', showInstalled);
  button.addEventListener('click', async () => {
    if (!pendingPrompt) return;
    const prompt = pendingPrompt;
    pendingPrompt = null;
    button.hidden = true;
    try {
      const choice = await prompt.prompt();
      status.textContent = choice.outcome === 'accepted'
        ? 'Demande acceptée. Votre navigateur termine l’installation.'
        : 'Installation annulée. Vous pouvez continuer à jouer et réessayer depuis le menu du navigateur.';
    } catch {
      status.textContent = 'Utilisez le menu du navigateur ou les étapes ci-dessous pour installer le jeu.';
    }
  });

  const testMode = new URLSearchParams(window.location.search).get('test') === '1';
  if (testMode) {
    offline.textContent = 'Mode test : la préparation du jeu hors connexion est désactivée.';
    return;
  }
  if (!['http:', 'https:'].includes(window.location.protocol) || !window.isSecureContext || !('serviceWorker' in navigator)) {
    offline.textContent = 'Pour installer le jeu et préparer le mode hors connexion, ouvrez son adresse publique avec Internet.';
    return;
  }
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      offline.textContent = 'Jeu prêt hors connexion sur cet appareil. Recharger ou rouvrir démarre une nouvelle partie.';
      const showUpdate = () => {
        offline.textContent = 'Une mise à jour est prête. Elle sera appliquée après fermeture de toutes les fenêtres du jeu et réouverture. Votre partie en cours reste disponible.';
      };
      if (registration.waiting) showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
        });
      });
    } catch {
      offline.textContent = 'Le jeu reste utilisable en ligne. Le mode hors connexion n’a pas pu être préparé ; réessayez lors d’une prochaine ouverture avec Internet.';
    }
  }, { once: true });
})();
