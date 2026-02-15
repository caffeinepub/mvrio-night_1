let isRegistering = false;
let hasRegistered = false;

export function registerServiceWorker() {
  // Prevent duplicate registrations
  if (hasRegistered || isRegistering || !('serviceWorker' in navigator)) {
    return;
  }

  isRegistering = true;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        hasRegistered = true;
        isRegistering = false;
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
        isRegistering = false;
      });
  }, { once: true });
}
