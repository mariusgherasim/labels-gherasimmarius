(function () {
  var KEY = 'cookie-consent';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;
  var v = null;
  try { v = localStorage.getItem(KEY); } catch (e) {}
  if (v === 'denied' && typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'denied' });
  if (v) return;
  banner.hidden = false;
  function set(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
    if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: val === 'granted' ? 'granted' : 'denied' });
    banner.hidden = true;
  }
  document.getElementById('cookie-accept').addEventListener('click', function () { set('granted'); });
  document.getElementById('cookie-decline').addEventListener('click', function () { set('denied'); });
})();
