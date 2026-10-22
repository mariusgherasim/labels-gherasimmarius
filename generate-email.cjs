#!/usr/bin/env node
// Generator email zilnic pe categorie — Casa Atelier
// ---------------------------------------------------------------
// Utilizare:
//   dublu-click pe generate-email.bat   → alegi categoria dintr-un meniu
//   node generate-email.cjs                         (meniu interactiv)
//   node generate-email.cjs gradina-agricultura     (direct o categorie)
//   node generate-email.cjs gradina-agricultura/drujbe   (o subcategorie)
//   node generate-email.cjs mix                     (cele mai bune din toate)
//   node generate-email.cjs promotii 16             (al doilea parametru = nr. produse, implicit 12)
// Rezultat: email-output.html — deschide-l în browser: ai subiecte, preheader,
// butonul „Copiază HTML” și previzualizarea. HTML-ul se lipește într-un bloc
// Custom HTML în MailerLite.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = __dirname;
const SITE_URL = 'https://labels.gherasimmarius.com';
const SITE_NAME = 'Casa Atelier';
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/products.json'), 'utf8'));
const CATS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/categories.json'), 'utf8'));
const hidden = new Set(CATS.flatMap(c => c.subs.filter(s => s.hidden).map(s => `${c.slug}/${s.slug}`)));

const today = new Date();
const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
const fmt = (n) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const disc = (p) => (p.old_price && p.old_price > p.price ? Math.round(100 - (p.price / p.old_price) * 100) : 0);
const score = (p) => disc(p) + Math.min(((p.old_price || p.price) - p.price) / 100, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// amestec determinist pe zi: aceeași categorie dă alte produse în zile diferite
function seeded(seed) { let s = seed >>> 0; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0) / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function dailyShuffle(arr, key) { const r = seeded(hashStr(ymd + key)); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function diverse(list, n, perMerchant) {
  const out = [], used = {}, seenT = new Set();
  for (const p of list) {
    if ((used[p.merchant] || 0) >= perMerchant) continue;
    const tk = p.title.toLowerCase().slice(0, 22);
    if (seenT.has(tk)) continue;
    seenT.add(tk); used[p.merchant] = (used[p.merchant] || 0) + 1; out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

function pickProducts(scope, n) {
  let pool, label, icon, link, accent = '#E63329';
  if (scope === 'mix' || scope === 'promotii') {
    pool = products.filter(p => !hidden.has(`${p.cat}/${p.sub}`));
    label = scope === 'mix' ? 'Selecția zilei din toate categoriile' : 'Cele mai mari reduceri';
    icon = scope === 'mix' ? '⭐' : '🔥'; link = scope === 'mix' ? '/' : '/promotii';
  } else {
    const [cs, ss] = scope.split('/');
    const cat = CATS.find(c => c.slug === cs);
    if (!cat) throw new Error(`Categoria „${cs}” nu există. Variante: ${CATS.map(c => c.slug).join(', ')}`);
    accent = cat.accent; icon = cat.icon;
    if (ss) {
      const sub = cat.subs.find(s => s.slug === ss);
      if (!sub) throw new Error(`Subcategoria „${ss}” nu există în ${cs}. Variante: ${cat.subs.map(s => s.slug).join(', ')}`);
      pool = products.filter(p => p.cat === cs && p.sub === ss); label = sub.name; link = `/${cs}/${ss}`;
    } else {
      pool = products.filter(p => p.cat === cs && !hidden.has(`${p.cat}/${p.sub}`)); label = cat.name; link = `/${cs}`;
    }
  }
  pool = pool.filter(p => p.price >= 20); // fără mărunțișuri de câțiva lei în email
  const discounted = pool.filter(p => disc(p) > 0).sort((a, b) => score(b) - score(a));
  let chosen;
  if (scope === 'mix') {
    // 2 produse din fiecare categorie, cele mai bune reduceri ale zilei
    chosen = [];
    for (const c of CATS) {
      const inCat = discounted.filter(p => p.cat === c.slug);
      const src = inCat.length ? inCat : pool.filter(p => p.cat === c.slug);
      chosen.push(...diverse(dailyShuffle(src.slice(0, 30), c.slug), 2, 2));
    }
    chosen = chosen.slice(0, n);
  } else {
    const top = dailyShuffle(discounted.slice(0, Math.max(n * 4, 40)), scope);
    chosen = diverse(top, n, Math.max(3, Math.ceil(n / 3)));
    if (chosen.length < n) { // completează cu produse fără reducere
      const rest = dailyShuffle(pool.filter(p => !chosen.includes(p)), scope + 'x');
      chosen.push(...diverse(rest, n - chosen.length, n));
    }
  }
  chosen.sort((a, b) => disc(b) - disc(a));
  return { chosen, pool, discounted, label, icon, link, accent };
}

function buildEmail(scope, n) {
  const { chosen, pool, discounted, label, icon, link, accent } = pickProducts(scope, n);
  if (!chosen.length) throw new Error('Nu am găsit produse pentru selecția asta.');
  const utm = (u) => `${SITE_URL}${u}${u.includes('?') ? '&' : '?'}utm_source=mailerlite&utm_medium=email&utm_campaign=oferte-${scope.replace(/\//g, '-')}-${ymd}`;
  const maxD = Math.max(0, ...chosen.map(disc));
  const maxSaved = Math.max(0, ...chosen.map(p => (p.old_price || p.price) - p.price));
  const minPrice = Math.min(...chosen.map(p => p.price));
  const brands = [...new Set(chosen.map(p => p.brand).filter(Boolean))].slice(0, 3);
  const lc = /^[A-ZĂÂÎȘȚ][a-zăâîșț]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;

  // Regula hook: cifre concrete + întrebări retorice + detalii
  const subjects = maxD > 0 ? [
    `${icon} ${chosen.length} reduceri la ${lc} — până la -${maxD}%`,
    `Cât plătești azi pentru ${lc}? Până la ${fmt(Math.round(maxSaved))} lei mai puțin`,
    `De la ${fmt(minPrice)} lei: ${lc}${brands.length ? ` ${brands.join(', ')}` : ''}. Mai aștepți Black Friday?`,
  ] : [
    `${icon} ${chosen.length} produse alese azi: ${lc}`,
    `Cauți ${lc}? Am ales ${chosen.length} din ${pool.length.toLocaleString('ro-RO')}`,
    `De la ${fmt(minPrice)} lei: ${lc}${brands.length ? ` ${brands.join(', ')}` : ''}`,
  ];
  const preheader = discounted.length
    ? `${pool.length.toLocaleString('ro-RO')} produse în ${lc}, ${discounted.length.toLocaleString('ro-RO')} la reducere. Le-am ales pe cele mai bune ${chosen.length}.`
    : `Am ales ${chosen.length} produse din ${pool.length.toLocaleString('ro-RO')} în ${lc}.`;
  const intro = maxD > 0
    ? `Am trecut prin ${pool.length.toLocaleString('ro-RO')} de produse din ${lc} și am păstrat ${chosen.length} cu cele mai bune reduceri de azi — până la <strong>-${maxD}%</strong>. Prețurile sunt cele din magazinele partenere și se pot schimba oricând.`
    : `Am ales ${chosen.length} produse din ${pool.length.toLocaleString('ro-RO')} disponibile în ${lc}.`;

  const cell = (p) => {
    const d = disc(p);
    return `<td width="50%" valign="top" style="padding:8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E6E1D8;border-radius:12px;">
    <tr><td align="center" style="padding:12px 12px 0;position:relative;">
      <a href="${esc(p.url)}" target="_blank" style="text-decoration:none;"><img src="${esc(p.image)}" width="220" alt="${esc(p.title)}" style="display:block;width:100%;max-width:220px;height:auto;max-height:220px;object-fit:contain;border:0;"></a>
    </td></tr>
    <tr><td style="padding:10px 14px 14px;font-family:Arial,Helvetica,sans-serif;">
      ${d ? `<span style="display:inline-block;background:#E63329;color:#ffffff;font-weight:bold;font-size:12px;padding:2px 8px;border-radius:6px;">-${d}%</span>` : ''}
      ${p.brand ? `<div style="font-size:11px;color:#6A6F78;text-transform:uppercase;letter-spacing:.05em;margin-top:6px;">${esc(p.brand)}</div>` : ''}
      <a href="${esc(p.url)}" target="_blank" style="display:block;color:#23262B;text-decoration:none;font-size:14px;line-height:19px;margin:4px 0 8px;height:57px;overflow:hidden;">${esc(p.title)}</a>
      <div style="font-size:18px;font-weight:bold;color:${d ? '#E63329' : '#1D1F23'};">${fmt(p.price)} lei ${d ? `<span style="font-size:13px;color:#6A6F78;text-decoration:line-through;font-weight:normal;">${fmt(p.old_price)} lei</span>` : ''}</div>
      <a href="${esc(p.url)}" target="_blank" style="display:block;margin-top:10px;background:#1D1F23;color:#ffffff;text-align:center;text-decoration:none;font-weight:bold;font-size:14px;padding:10px;border-radius:8px;">Vezi oferta →</a>
      <div style="font-size:11px;color:#6A6F78;text-align:center;margin-top:6px;">la ${esc(p.merchant)}</div>
    </td></tr>
  </table>
</td>`;
  };
  const rows = [];
  for (let i = 0; i < chosen.length; i += 2) rows.push(`<tr>${cell(chosen[i])}${chosen[i + 1] ? cell(chosen[i + 1]) : '<td width="50%"></td>'}</tr>`);

  const html = `<!-- ${SITE_NAME} · ${label} · ${today.toISOString().slice(0, 10)} -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
  <tr><td style="background:#1D1F23;border-radius:14px 14px 0 0;padding:22px 24px;border-bottom:4px solid ${accent};font-family:Arial,Helvetica,sans-serif;">
    <a href="${utm('/')}" style="text-decoration:none;font-size:22px;color:#ffffff;">casa<strong style="color:#E63329;">atelier</strong></a>
    <div style="color:#FFC629;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-top:14px;font-weight:bold;">Ofertele zilei</div>
    <div style="color:#ffffff;font-size:26px;line-height:32px;font-weight:bold;margin-top:6px;">${icon} ${esc(label)}</div>
    <div style="color:rgba(255,255,255,.75);font-size:15px;line-height:22px;margin-top:10px;">${intro}</div>
  </td></tr>
  <tr><td style="padding:8px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('\n')}</table>
  </td></tr>
  <tr><td align="center" style="padding:10px 24px 26px;font-family:Arial,Helvetica,sans-serif;">
    <a href="${utm(link)}" style="display:inline-block;background:#E63329;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:10px;">Vezi toate ${pool.length.toLocaleString('ro-RO')} de produse →</a>
    <div style="margin-top:14px;"><a href="${utm('/promotii')}" style="color:#C42820;font-weight:bold;font-size:14px;">sau toate promoțiile de pe site</a></div>
  </td></tr>
  <tr><td style="padding:0 24px 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#6A6F78;text-align:center;">
    Prețurile și reducerile sunt preluate din feedurile magazinelor partenere și se pot modifica. Produsele sunt vândute și livrate de magazinele partenere.
    ${SITE_NAME} folosește linkuri de afiliere 2Performant.
  </td></tr>
</table>
</td></tr>
</table>`;
  return { html, subjects, preheader, label, chosen };
}

function writeOutput(scope, n) {
  const { html, subjects, preheader, label, chosen } = buildEmail(scope, n);
  const page = `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Email ${esc(label)} — ${today.toLocaleDateString('ro-RO')}</title>
<style>body{font-family:Arial,sans-serif;background:#eee;margin:0;padding:24px}.box{max-width:900px;margin:0 auto 20px;background:#fff;border-radius:12px;padding:20px}
h1{font-size:20px;margin:0 0 12px}.s{padding:8px 10px;background:#FFF5D6;border-radius:8px;margin:6px 0;display:flex;justify-content:space-between;gap:10px}
button{background:#1D1F23;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:bold;cursor:pointer}textarea{width:100%;height:140px;font-family:monospace;font-size:12px}</style></head><body>
<div class="box"><h1>📧 ${esc(label)} — ${chosen.length} produse — ${today.toLocaleDateString('ro-RO')}</h1>
<p><strong>Subiect</strong> (alege unul):</p>${subjects.map(s => `<div class="s"><span>${esc(s)}</span><button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent);this.textContent='Copiat ✓'">Copiază</button></div>`).join('')}
<p><strong>Preheader:</strong></p><div class="s"><span>${esc(preheader)}</span><button onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent);this.textContent='Copiat ✓'">Copiază</button></div>
<p><strong>HTML pentru MailerLite</strong> (bloc Custom HTML):</p><textarea id="h">${esc(html)}</textarea>
<p><button onclick="navigator.clipboard.writeText(document.getElementById('h').value);this.textContent='HTML copiat ✓'">Copiază HTML</button></p>
<p style="font-size:12px;color:#666">Regula hook pentru subiect: cifre concrete + întrebări retorice + detalii (cine, când, unde). Ajustează subiectul înainte de trimitere dacă vrei mai mult context.</p></div>
<div class="box" style="padding:0;overflow:hidden">${html}</div></body></html>`;
  const out = path.join(ROOT, 'email-output.html');
  fs.writeFileSync(out, page);
  console.log(`\n✓ Email generat: ${label} (${chosen.length} produse)\n  → ${out}\n\nSubiecte:\n${subjects.map(s => '  • ' + s).join('\n')}\nPreheader:\n  ${preheader}\n`);
}

async function menu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  const lines = [], waiters = [];
  rl.on('line', (l) => { const w = waiters.shift(); w ? w(l.trim()) : lines.push(l.trim()); });
  rl.on('close', () => { while (waiters.length) waiters.shift()(''); });
  const ask = (q) => { process.stdout.write(q); return lines.length ? Promise.resolve(lines.shift()) : new Promise(r => waiters.push(r)); };
  const count = (cs, ss) => products.filter(p => p.cat === cs && (ss ? p.sub === ss : !hidden.has(`${p.cat}/${p.sub}`))).length;
  console.log(`\n=== Generator email ${SITE_NAME} — ${today.toLocaleDateString('ro-RO')} ===\n`);
  console.log('  0. ⭐ Mix — cele mai bune din toate categoriile');
  console.log('  P. 🔥 Promoții — cele mai mari reduceri de pe site');
  CATS.forEach((c, i) => console.log(`  ${i + 1}. ${c.icon} ${c.name} (${count(c.slug).toLocaleString('ro-RO')})`));
  const a = (await ask('\nAlege categoria (număr): ')).toLowerCase();
  let scope;
  if (a === '0' || a === '') scope = 'mix';
  else if (a === 'p') scope = 'promotii';
  else {
    const cat = CATS[parseInt(a, 10) - 1];
    if (!cat) { console.log('Opțiune invalidă.'); rl.close(); return; }
    console.log(`\n  0. Toată categoria ${cat.name}`);
    cat.subs.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (${count(cat.slug, s.slug).toLocaleString('ro-RO')})`));
    const b = await ask('\nAlege subcategoria (Enter = toată categoria): ');
    const sub = cat.subs[parseInt(b, 10) - 1];
    scope = sub ? `${cat.slug}/${sub.slug}` : cat.slug;
  }
  const nAns = await ask('Câte produse? (Enter = 12): ');
  rl.close();
  writeOutput(scope, parseInt(nAns, 10) || 12);
}

try {
  const [scopeArg, nArg] = process.argv.slice(2);
  if (scopeArg) writeOutput(scopeArg, parseInt(nArg, 10) || 12);
  else menu();
} catch (e) { console.error('✗ ' + e.message); process.exit(1); }
