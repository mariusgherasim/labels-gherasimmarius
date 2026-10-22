/* Casa Atelier — căutare cu panou extins, sortare în listări, pagina /cautare
   Date: /data/meta.json (categorii), /data/explore.json (tipuri + branduri cu produse),
         /data/s-<categorie>.json (toate produsele unei categorii, format compact) */
(function () {
  'use strict';
  const PER_PAGE = 24;
  const AFF = (u, c) => 'https://event.2performant.com/events/click?ad_type=product_store&unique=' + u + '&aff_code=676a7e7d9&campaign_unique=' + c;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(\w)-(\w)/g, '$1$2');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
  const disc = (p) => (p.o && p.o > p.p ? Math.round(100 - (p.p / p.o) * 100) : 0);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const scopeCat = document.body.dataset.scope || '';

  // ---------- încărcare date (cu cache) ----------
  const cache = {};
  const getJSON = (url) => (cache[url] ||= fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); }));
  const meta = () => getJSON('/data/meta.json');
  const explore = () => getJSON('/data/explore.json');
  const shards = {};
  function shard(cat) {
    return (shards[cat] ||= getJSON('/data/s-' + cat + '.json').then((d) => d.items.map((x) => {
      const p = { t: x[0], p: x[1], o: x[2], sub: d.s[x[3]], b: d.b[x[4]], m: d.m[x[5]], i: d.ip[x[6]] + x[7], u: x[9] >= 0 ? AFF(x[8], d.camp[x[9]]) : x[8], cat: d.cat };
      p.n = norm(p.t + ' ' + p.b);
      return p;
    })));
  }
  async function allShards(onEach) {
    const m = await meta();
    const lists = await Promise.all(m.cats.map((c) => shard(c.slug).then((l) => { onEach && onEach(); return l; })));
    return lists.flat();
  }

  // ---------- card produs (identic cu ProductCard.astro) ----------
  function cardHTML(p) {
    const d = disc(p);
    const a = (cls, inner) => '<a href="' + esc(p.u) + '" target="_blank" rel="nofollow noopener sponsored" class="' + cls + ' aff" data-name="' + esc(p.t) + '" data-cat="' + esc(p.cat) + '">' + inner + '</a>';
    return '<article class="product-card">' +
      (d ? '<span class="badge-discount">-' + d + '%</span>' : '') +
      a('card-image-link', '<div class="card-image"><img src="' + esc(p.i) + '" alt="' + esc(p.t) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'/placeholder.svg\'"></div>') +
      '<div class="card-body">' + (p.b ? '<span class="card-brand">' + esc(p.b) + '</span>' : '') +
      '<h3 class="card-title">' + a('', esc(p.t)) + '</h3>' +
      '<div class="card-price"><span class="price-current">' + money(p.p) + '</span>' + (d ? '<span class="price-old">' + money(p.o) + '</span>' : '') + '</div>' +
      a('btn-buy', 'Vezi oferta <span aria-hidden="true">→</span>') +
      (p.m ? '<span class="card-merchant">la ' + esc(p.m) + '</span>' : '') +
      '</div></article>';
  }
  function miniHTML(p) {
    const d = disc(p);
    return '<a class="sp-prod aff" href="' + esc(p.u) + '" target="_blank" rel="nofollow noopener sponsored" data-name="' + esc(p.t) + '" data-cat="search-panel">' +
      (d ? '<i>-' + d + '%</i>' : '') + '<img src="' + esc(p.i) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'/placeholder.svg\'"><span>' + esc(p.t) + '</span><b>' + money(p.p) + '</b></a>';
  }

  // ---------- sortare / potrivire ----------
  const SORTS = {
    discount: (a, b) => disc(b) - disc(a) || (b.o - b.p) - (a.o - a.p),
    'price-asc': (a, b) => a.p - b.p,
    'price-desc': (a, b) => b.p - a.p,
    name: (a, b) => a.t.localeCompare(b.t, 'ro'),
  };
  function match(list, q) {
    const toks = norm(q).split(/[^a-z0-9.]+/).filter((t) => t.length > 0);
    if (!toks.length) return [];
    const out = [];
    for (const p of list) {
      let ok = true, score = 0;
      for (const t of toks) {
        const i = p.n.indexOf(t);
        if (i < 0) { ok = false; break; }
        score += (i === 0 || p.n[i - 1] === ' ') ? 3 : 1;
        if (i === 0) score += 2;
      }
      if (ok) { p._s = score + (disc(p) ? 0.5 : 0) - p.t.length / 400 - (p.sub === 'piese-schimb' ? 4 : 0); out.push(p); }
    }
    return out.sort((a, b) => b._s - a._s);
  }

  // ---------- paginare client (aceeași logică ca Pagination.astro) ----------
  function windowed(cur, total, radius) {
    let s = Math.max(1, cur - radius), e = Math.min(total, cur + radius); const want = radius * 2 + 1;
    if (e - s + 1 < want) { if (s === 1) e = Math.min(total, s + want - 1); else s = Math.max(1, e - want + 1); }
    const out = []; if (s > 1) { out.push(1); if (s > 2) out.push('…'); }
    for (let i = s; i <= e; i++) out.push(i);
    if (e < total) { if (e < total - 1) out.push('…'); out.push(total); } return out;
  }
  function pagerHTML(cur, total) {
    if (total <= 1) return '';
    const nums = (r) => windowed(cur, total, r).map((p) => p === '…' ? '<span class="page-ellipsis">…</span>' : p === cur ? '<span class="page-num active">' + p + '</span>' : '<button type="button" class="page-num" data-p="' + p + '">' + p + '</button>').join('');
    return '<nav class="pagination" aria-label="Paginare">' +
      (cur > 1 ? '<button type="button" class="page-btn" data-p="' + (cur - 1) + '">← <span class="hide-mobile">Anterior</span></button>' : '<span class="page-btn disabled">← <span class="hide-mobile">Anterior</span></span>') +
      '<div class="page-numbers hide-mobile">' + nums(9) + '</div><div class="page-numbers hide-desktop">' + nums(2) + '</div>' +
      (cur < total ? '<button type="button" class="page-btn" data-p="' + (cur + 1) + '"><span class="hide-mobile">Următor</span> →</button>' : '<span class="page-btn disabled"><span class="hide-mobile">Următor</span> →</span>') + '</nav>';
  }

  // ======================================================================
  // 1) PANOUL DE CĂUTARE DIN HEADER
  // ======================================================================
  const input = document.getElementById('search-input');
  const panel = document.getElementById('search-panel');
  const wrap = document.getElementById('header-search');
  let mode = '', debounce = null, kbIndex = -1, lastQ = '';

  function open() { panel.hidden = false; }
  function close() { panel.hidden = true; kbIndex = -1; }

  async function renderExplore(reshuffle) {
    mode = 'explore';
    if (!panel.dataset.ready || reshuffle) panel.innerHTML = '<div class="sp-loading">Se încarcă…</div>';
    open();
    let m, ex;
    try { [m, ex] = await Promise.all([meta(), explore()]); } catch (e) { panel.innerHTML = '<div class="sp-empty">Căutarea nu e disponibilă momentan.</div>'; return; }
    if (mode !== 'explore') return;
    const catName = {}; m.cats.forEach((c) => { catName[c.slug] = c; });
    let subs = [];
    m.cats.forEach((c) => c.subs.forEach((s) => { const k = c.slug + '/' + s.slug; if (ex.subs[k] && (!scopeCat || scopeCat === c.slug)) subs.push({ k, cat: c, s }); }));
    let brands = Object.entries(ex.brands).filter(([, v]) => !scopeCat || v.cats.includes(scopeCat));
    if (brands.length < 6) brands = Object.entries(ex.brands);
    subs = shuffle(subs).slice(0, 6);
    brands = shuffle(brands).slice(0, 6);
    const scopeLabel = scopeCat && catName[scopeCat] ? ' în ' + catName[scopeCat].short : '';
    panel.innerHTML =
      '<div class="sp-grid"><div class="sp-side">' +
      '<div class="sp-label">Tipuri de produse' + esc(scopeLabel) + ' <button type="button" data-reshuffle>Altele ↻</button></div>' +
      '<div class="sp-chips">' + subs.map((x) => '<button type="button" class="sp-chip" data-kind="sub" data-key="' + esc(x.k) + '">' + esc(x.cat.icon + ' ' + x.s.name) + '<em>' + x.s.n.toLocaleString('ro-RO') + '</em></button>').join('') + '</div>' +
      '<div class="sp-label">Branduri</div>' +
      '<div class="sp-brands">' + brands.map(([b]) => '<button type="button" class="sp-brand" data-kind="brand" data-key="' + esc(b) + '">' + esc(b) + '</button>').join('') + '</div>' +
      '</div><div class="sp-main" data-sp-main></div></div>';
    panel.dataset.ready = '1';
    const show = (btn) => {
      panel.querySelectorAll('.sp-chip.on, .sp-brand.on').forEach((x) => x.classList.remove('on'));
      btn.classList.add('on');
      const key = btn.dataset.key, kind = btn.dataset.kind;
      let title, link, n, items;
      if (kind === 'sub') {
        const x = subs.find((s) => s.k === key); const e = ex.subs[key];
        title = x.cat.icon + ' ' + x.s.name; link = '/' + key; n = e.n; items = e.items;
      } else {
        const e = ex.brands[key];
        title = key; link = '/cautare?q=' + encodeURIComponent(key); n = e.n; items = e.items;
      }
      const main = panel.querySelector('[data-sp-main]');
      main.innerHTML = '<div class="sp-main-head"><h4>' + esc(title) + '</h4><a href="' + esc(link) + '">Vezi toate (' + n.toLocaleString('ro-RO') + ') →</a></div>' +
        '<div class="sp-products">' + shuffle(items).slice(0, 8).map((p) => miniHTML({ t: p.t, p: p.p, o: p.o, i: p.i, u: p.u })).join('') + '</div>';
    };
    panel.querySelectorAll('[data-kind]').forEach((btn) => {
      btn.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) show(btn); });
      btn.addEventListener('focus', () => show(btn));
      btn.addEventListener('click', () => show(btn));
    });
    panel.querySelector('[data-reshuffle]').addEventListener('click', () => renderExplore(true));
    const first = panel.querySelector('[data-kind]'); first && show(first);
  }

  async function renderResults(q) {
    mode = 'results'; lastQ = q; kbIndex = -1; open();
    panel.innerHTML = '<div class="sp-loading">Caut „' + esc(q) + '”…</div>';
    const m = await meta();
    let loaded = 0;
    const draw = (list) => {
      if (mode !== 'results' || lastQ !== q) return;
      const res = match(list, q);
      const byCat = {}; res.forEach((p) => { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
      const catLinks = m.cats.filter((c) => byCat[c.slug]).sort((a, b) => byCat[b.slug] - byCat[a.slug])
        .map((c) => '<a href="/cautare?q=' + encodeURIComponent(q) + '&cat=' + c.slug + '">' + c.icon + ' ' + esc(c.short) + ' <em>(' + byCat[c.slug] + ')</em></a>').join('');
      const done = loaded >= m.cats.length;
      if (!res.length) { panel.innerHTML = done ? '<div class="sp-empty">Niciun produs pentru „' + esc(q) + '”. Încearcă un cuvânt mai scurt.</div>' : '<div class="sp-loading">Caut „' + esc(q) + '”…</div>'; return; }
      panel.innerHTML = '<div class="sp-main">' + (catLinks ? '<div class="sp-cats">' + catLinks + '</div>' : '') +
        '<div class="sp-results">' + res.slice(0, 6).map((p) => {
          const d = disc(p);
          return '<a class="sp-row aff" href="' + esc(p.u) + '" target="_blank" rel="nofollow noopener sponsored" data-name="' + esc(p.t) + '" data-cat="' + esc(p.cat) + '"><img src="' + esc(p.i) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'/placeholder.svg\'"><span class="sp-row-t">' + esc(p.t) + '<small>' + esc((p.b ? p.b + ' · ' : '') + 'la ' + p.m) + '</small></span><span class="sp-row-p">' + (d ? '<s>' + money(p.o) + '</s>' : '') + money(p.p) + '</span></a>';
        }).join('') + '</div>' +
        '<a class="sp-all" href="/cautare?q=' + encodeURIComponent(q) + '">Vezi toate rezultatele (' + res.length.toLocaleString('ro-RO') + (done ? '' : '+') + ') →</a></div>';
    };
    // căutăm progresiv: întâi categoria curentă, apoi restul
    const order = m.cats.map((c) => c.slug).sort((a, b) => (b === scopeCat) - (a === scopeCat));
    let acc = [];
    for (const slug of order) {
      shard(slug).then((l) => { loaded++; acc = acc.concat(l); draw(acc); }).catch(() => { loaded++; });
    }
  }

  if (input && panel) {
    input.addEventListener('focus', () => { input.value.trim().length >= 2 ? renderResults(input.value.trim()) : renderExplore(false); });
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = input.value.trim();
      debounce = setTimeout(() => { q.length >= 2 ? renderResults(q) : renderExplore(false); }, 160);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); input.blur(); return; }
      if (mode !== 'results') return;
      const rows = panel.querySelectorAll('.sp-row');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!rows.length) return;
        kbIndex = (kbIndex + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        rows.forEach((r, i) => r.classList.toggle('kb', i === kbIndex));
      } else if (e.key === 'Enter' && kbIndex >= 0 && rows[kbIndex]) { e.preventDefault(); rows[kbIndex].click(); }
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
    document.querySelectorAll('[data-open-search]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); input.focus();
    }));
  }

  // ======================================================================
  // 2) SORTARE ÎN PAGINILE DE CATEGORIE / SUBCATEGORIE / PROMOȚII
  // ======================================================================
  const listing = document.querySelector('[data-listing]');
  if (listing) {
    const sel = listing.querySelector('[data-sort]');
    const grid = listing.querySelector('[data-grid]');
    const pager = listing.querySelector('[data-pager]');
    const count = listing.querySelector('.listing-count');
    const scope = listing.dataset.scope;
    const base = listing.dataset.base;
    let data = null;

    async function getData() {
      if (data) return data;
      const m = await meta();
      const hidden = new Set(); m.cats.forEach((c) => c.subs.forEach((s) => { if (s.hidden) hidden.add(c.slug + '/' + s.slug); }));
      if (scope === 'promo') {
        data = (await allShards()).filter((p) => disc(p) > 0 && !hidden.has(p.cat + '/' + p.sub));
      } else {
        const [cat, sub] = scope.split('/');
        const l = await shard(cat);
        data = sub ? l.filter((p) => p.sub === sub) : l.filter((p) => !hidden.has(p.cat + '/' + p.sub));
      }
      return data;
    }
    async function render(sort, page) {
      grid.classList.add('listing-loading');
      const list = (await getData()).slice().sort(SORTS[sort]);
      const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
      page = Math.min(Math.max(1, page), total);
      grid.innerHTML = list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(cardHTML).join('');
      pager.innerHTML = pagerHTML(page, total);
      count.innerHTML = '<strong>' + list.length.toLocaleString('ro-RO') + '</strong> produse · pagina ' + page + ' din ' + total;
      grid.classList.remove('listing-loading');
      const u = new URL(location.href); u.searchParams.set('sort', sort); page > 1 ? u.searchParams.set('p', page) : u.searchParams.delete('p');
      history.replaceState(null, '', u);
    }
    pager.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b || !sel.value) return;
      render(sel.value, +b.dataset.p).then(() => listing.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
    sel.addEventListener('change', () => {
      if (!sel.value) { location.href = base; return; }
      render(sel.value, 1);
    });
    const params = new URLSearchParams(location.search);
    const s0 = params.get('sort');
    if (s0 && SORTS[s0]) { sel.value = s0; render(s0, +(params.get('p') || 1)); }
  }

  // ======================================================================
  // 3) PAGINA /cautare
  // ======================================================================
  const sp = document.querySelector('[data-search-page]');
  if (sp) {
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    let cat = params.get('cat') || '';
    const sel = sp.querySelector('[data-search-sort]');
    const grid = sp.querySelector('[data-grid]');
    const pager = sp.querySelector('[data-pager]');
    const count = sp.querySelector('[data-search-count]');
    const pills = document.querySelector('[data-search-cats]');
    const cats = JSON.parse(sp.dataset.cats);
    if (input) input.value = q;
    document.querySelector('[data-search-title]').textContent = q ? 'Rezultate pentru „' + q + '”' : 'Căutare';
    if (!q) { count.textContent = 'Scrie ce cauți în bara de sus.'; }
    else {
      sel.value = params.get('sort') || '';
      allShards().then((all) => {
        const res = match(all, q);
        const byCat = {}; res.forEach((p) => { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
        document.querySelector('[data-search-lead]').textContent = res.length ? res.length.toLocaleString('ro-RO') + ' produse găsite în ' + Object.keys(byCat).length + ' categorii.' : 'Niciun produs găsit. Încearcă un cuvânt mai scurt sau altă formulare.';
        const go = (page) => {
          let list = cat ? res.filter((p) => p.cat === cat) : res.slice();
          if (sel.value && SORTS[sel.value]) list.sort(SORTS[sel.value]);
          const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
          page = Math.min(Math.max(1, page), total);
          grid.innerHTML = list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(cardHTML).join('');
          pager.innerHTML = pagerHTML(page, total);
          count.innerHTML = '<strong>' + list.length.toLocaleString('ro-RO') + '</strong> rezultate' + (total > 1 ? ' · pagina ' + page + ' din ' + total : '');
          pills.innerHTML = '<a href="#" class="sub-pill ' + (!cat ? 'active' : '') + '" data-c="">Toate<em>' + res.length + '</em></a>' +
            cats.filter((c) => byCat[c.slug]).map((c) => '<a href="#" class="sub-pill ' + (cat === c.slug ? 'active' : '') + '" data-c="' + c.slug + '">' + c.icon + ' ' + esc(c.name) + '<em>' + byCat[c.slug] + '</em></a>').join('');
          const u = new URL(location.href); cat ? u.searchParams.set('cat', cat) : u.searchParams.delete('cat');
          sel.value ? u.searchParams.set('sort', sel.value) : u.searchParams.delete('sort');
          page > 1 ? u.searchParams.set('p', page) : u.searchParams.delete('p');
          history.replaceState(null, '', u);
        };
        pills.addEventListener('click', (e) => { const a = e.target.closest('[data-c]'); if (!a) return; e.preventDefault(); cat = a.dataset.c; go(1); });
        pager.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (!b) return; go(+b.dataset.p); sp.scrollIntoView({ behavior: 'smooth' }); });
        sel.addEventListener('change', () => go(1));
        go(+(params.get('p') || 1));
      }).catch(() => { count.textContent = 'Căutarea nu e disponibilă momentan.'; });
    }
  }
})();
