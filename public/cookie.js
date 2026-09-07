// Cookie consent
(function () {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  const KEY = 'ls_cookie_consent';
  const stored = localStorage.getItem(KEY);
  if (stored) { banner.hidden = true; return; }

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(KEY, 'accepted');
    banner.hidden = true;
    // Enable GA
    window.gtag && gtag('consent', 'update', { analytics_storage: 'granted' });
  });

  document.getElementById('cookie-decline').addEventListener('click', () => {
    localStorage.setItem(KEY, 'declined');
    banner.hidden = true;
    window.gtag && gtag('consent', 'update', { analytics_storage: 'denied' });
  });
})();
