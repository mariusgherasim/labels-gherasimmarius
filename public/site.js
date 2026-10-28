/* Casa Atelier — meniu mobil, tracking afiliere, stickere */
(function () {
  'use strict';

  // ---- înălțimea headerului (pentru bara de subcategorii sticky) ----
  const header = document.querySelector('.site-header');
  const setH = () => header && document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  setH(); window.addEventListener('resize', setH);

  // ---- meniu mobil ----
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const closeBtn = document.getElementById('drawer-close');
  function openDrawer(open) {
    if (!drawer) return;
    drawer.hidden = !open; backdrop.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    toggle && toggle.setAttribute('aria-expanded', String(open));
  }
  toggle && toggle.addEventListener('click', () => openDrawer(true));
  closeBtn && closeBtn.addEventListener('click', () => openDrawer(false));
  backdrop && backdrop.addEventListener('click', () => openDrawer(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openDrawer(false); });

  // ---- tracking click afiliere (GA4) ----
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a.aff');
    if (!a || typeof gtag !== 'function') return;
    gtag('event', 'affiliate_click', {
      item_name: a.dataset.name || a.textContent.trim().slice(0, 100),
      category: a.dataset.cat || document.body.dataset.scope || '',
      link_url: a.href,
    });
  });

  // ---- stickere: interval de date + categorie; închiderea ține doar pe pagina curentă ----
  const today = new Date().toISOString().slice(0, 10);
  const scope = document.body.dataset.scope || '';
  document.querySelectorAll('[data-sticker]').forEach((el) => {
    const s = el.dataset.start, en = el.dataset.end, sc = el.dataset.scope || 'all';
    const inDate = (!s || today >= s) && (!en || today <= en);
    const inScope = sc === 'all' || sc.split(',').map(x => x.trim()).includes(scope);
    el.hidden = !(inDate && inScope);
    const x = el.querySelector('.sticker-close');
    x && x.addEventListener('click', (ev) => { ev.preventDefault(); el.hidden = true; });
  });
  document.querySelectorAll('[data-sticker-rail]').forEach((rail) => {
    rail.hidden = !rail.querySelector('[data-sticker]:not([hidden])');
  });
  // mai multe stickere în același colț de sus → se afișează câte unul, ales la întâmplare la fiecare pagină
  ['.sticker-top-right', '.sticker-top-left'].forEach((sel) => {
    const vis = [...document.querySelectorAll(sel + ':not([hidden])')];
    if (vis.length > 1) { const keep = Math.floor(Math.random() * vis.length); vis.forEach((el, i) => { if (i !== keep) el.hidden = true; }); }
  });
  // stickere plutitoare sus (top-right / top-left): mereu imediat sub meniu (și sub bara de subcategorii, când e lipită sus)
  const tops = document.querySelectorAll('.sticker-top-right:not([hidden]), .sticker-top-left:not([hidden])');
  if (tops.length) {
    const pills = document.querySelector('.sub-pills-wrap');
    const place = () => {
      let y = header ? header.getBoundingClientRect().bottom : 0;
      if (pills) { const r = pills.getBoundingClientRect(); if (r.top <= y + 1 && r.bottom > y) y = r.bottom; }
      const off = { 'top-right': 0, 'top-left': 0 };
      tops.forEach((el) => {
        const k = el.classList.contains('sticker-top-left') ? 'top-left' : 'top-right';
        el.style.top = Math.round(Math.max(y, 0) + 14 + off[k]) + 'px';
        off[k] += el.offsetHeight + 12;
      });
    };
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
  }

  // două stickere în același colț: le așezăm unul peste altul
  ['bottom-left', 'bottom-right'].forEach((pos) => {
    let off = 0;
    document.querySelectorAll('.sticker-' + pos + ':not([hidden])').forEach((el) => {
      el.style.bottom = (18 + off) + 'px'; off += el.offsetHeight + 12;
    });
  });
})();
