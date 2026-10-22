#!/usr/bin/env node
// Sincronizare produse din feedurile XML 2Performant.
// Utilizare: pune fișierele .xml în folderul /feeds și rulează  node scripts/sync-feeds.cjs
// (sau dublu-click pe sync-feeds.bat). Scriptul:
//   1. citește toate feedurile, păstrează doar produsele active, cu preț și imagine
//   2. le clasifică automat în categorii/subcategorii (reguli în scripts/classify.cjs)
//   3. scrie src/data/products.json, public/data/s-<categorie>.json (căutare), public/data/explore.json
//   4. scrie feeds/_neclasificate.txt cu produsele pe care regulile nu le-au prins

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { classify } = require('./classify.cjs');

const ROOT = path.join(__dirname, '..');
const FEEDS = path.join(ROOT, 'feeds');
const CATS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/categories.json'), 'utf8'));
const MIN_DISCOUNT = 5; // sub 5% reducere nu afișăm preț vechi / badge

const subKnown = new Set(CATS.flatMap(c => c.subs.map(s => `${c.slug}/${s.slug}`)));
const hiddenSubs = new Set(CATS.flatMap(c => c.subs.filter(s => s.hidden).map(s => `${c.slug}/${s.slug}`)));

function hash(str) { // hash determinist pentru amestecarea produselor
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const decode = (s) => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();
const merchantShort = (name) => String(name).replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');

const files = fs.existsSync(FEEDS) ? fs.readdirSync(FEEDS).filter(f => f.toLowerCase().endsWith('.xml')) : [];
if (!files.length) { console.error('Nu am găsit niciun .xml în folderul feeds/'); process.exit(1); }

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true, processEntities: false });
const products = [];
const seen = new Set();
const unclassified = [];
const perMerchant = {};

for (const f of files) {
  const xml = fs.readFileSync(path.join(FEEDS, f), 'utf8');
  let items = parser.parse(xml)?.items?.item || [];
  if (!Array.isArray(items)) items = [items];
  for (const it of items) {
    const merchant = merchantShort(it.campaign_name || f);
    const st = (perMerchant[merchant] ||= { total: 0, kept: 0, inactive: 0, noClass: 0 });
    st.total++;
    if (String(it.product_active).toLowerCase() === 'false') { st.inactive++; continue; }
    const title = decode(it.title);
    const price = parseFloat(it.price);
    const url = decode(it.aff_code);
    const image = decode(it.image_urls).split(',').map(s => s.trim()).find(Boolean) || '';
    if (!title || !(price > 0) || !url || !image) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const category = decode(it.category);
    const cls = classify(merchant, category, title);
    if (!cls || !subKnown.has(cls.join('/'))) {
      st.noClass++;
      unclassified.push(`${merchant}\t${category}\t${title}`);
      continue;
    }
    let old = parseFloat(it.old_price);
    if (!(old > price) || Math.round(100 - (price / old) * 100) < MIN_DISCOUNT) old = null;
    let brand = decode(it.brand);
    if (/^(de cas[aă] mobil[aă] italia|mobila laguna|paa[- ]?home|na|n\/a|-|0)$/i.test(brand)) brand = '';
    products.push({
      id: `${merchant.split('.')[0]}-${it.product_id}`,
      title, price, old_price: old, brand, image, url,
      cat: cls[0], sub: cls[1], merchant,
    });
    st.kept++;
  }
  console.log(`✓ ${f}`);
}

// ordine stabilă, amestecată între magazine
products.sort((a, b) => hash(a.id) - hash(b.id));

// ---------- products.json (folosit de Astro la build) ----------
fs.writeFileSync(path.join(ROOT, 'src/data/products.json'), JSON.stringify(products));

// ---------- search.json (căutare + sortare în browser, compact) ----------
const AFF = /^https:\/\/event\.2performant\.com\/events\/click\?ad_type=product_store&unique=([^&]+)&aff_code=676a7e7d9&campaign_unique=([^&]+)$/;
const dict = () => { const list = [], map = new Map(); return { list, id(v) { if (!map.has(v)) { map.set(v, list.length); list.push(v); } return map.get(v); } }; };
fs.mkdirSync(path.join(ROOT, 'public/data'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'public/data'))) if (/^s-.*\.json$|^search\.json$/.test(f)) fs.unlinkSync(path.join(ROOT, 'public/data', f));
// câte un fișier pe categorie (s-<categorie>.json) — browserul încarcă doar ce îi trebuie
for (const c of CATS) {
  const D = { s: dict(), b: dict(), m: dict(), ip: dict(), camp: dict() };
  const items = products.filter(p => p.cat === c.slug).map((p) => {
    const cut = p.image.lastIndexOf('/') + 1;
    const mm = p.url.match(AFF);
    return [
      p.title, p.price, p.old_price || 0,
      D.s.id(p.sub), D.b.id(p.brand), D.m.id(p.merchant),
      D.ip.id(p.image.slice(0, cut)), p.image.slice(cut),
      mm ? mm[1] : p.url, mm ? D.camp.id(mm[2]) : -1,
    ];
  });
  const shard = { v: 1, cat: c.slug, s: D.s.list, b: D.b.list, m: D.m.list, ip: D.ip.list, camp: D.camp.list, items };
  fs.writeFileSync(path.join(ROOT, `public/data/s-${c.slug}.json`), JSON.stringify(shard));
}

// ---------- explore.json (panoul de căutare: tipuri + branduri cu 12 produse) ----------
const mini = (p) => ({ t: p.title, p: p.price, o: p.old_price || 0, i: p.image, u: p.url, b: p.brand });
const pick = (arr, n) => {
  const withDisc = arr.filter(p => p.old_price), rest = arr.filter(p => !p.old_price);
  return [...withDisc.slice(0, Math.ceil(n / 2)), ...rest].slice(0, n).concat(withDisc.slice(Math.ceil(n / 2))).slice(0, n);
};
const bySub = {}, byBrand = {};
for (const p of products) {
  (bySub[`${p.cat}/${p.sub}`] ||= []).push(p);
  if (p.brand && !/^(oem|universal|chiny|taiwan|no brand|generic)$|\.ro$/i.test(p.brand) && !hiddenSubs.has(`${p.cat}/${p.sub}`)) (byBrand[p.brand] ||= []).push(p);
}
const explore = { subs: {}, brands: {} };
for (const [k, arr] of Object.entries(bySub)) {
  if (hiddenSubs.has(k)) continue;
  explore.subs[k] = { n: arr.length, items: pick(arr, 12).map(mini) };
}
const topBrands = Object.entries(byBrand).filter(([, a]) => a.length >= 8).sort((a, z) => z[1].length - a[1].length).slice(0, 80);
for (const [b, arr] of topBrands) {
  const cats = {};
  arr.forEach(p => { cats[p.cat] = (cats[p.cat] || 0) + 1; });
  const cat = Object.entries(cats).sort((a, z) => z[1] - a[1])[0][0];
  explore.brands[b] = { n: arr.length, cat, cats: Object.keys(cats), items: pick(arr, 12).map(mini) };
}
fs.writeFileSync(path.join(ROOT, 'public/data/explore.json'), JSON.stringify(explore));

fs.writeFileSync(path.join(FEEDS, '_neclasificate.txt'), unclassified.join('\n'));

// ---------- raport ----------
console.log('\nMagazin'.padEnd(28), 'total', 'păstrate', 'inactive', 'neclasif.');
for (const [m, s] of Object.entries(perMerchant)) console.log(m.padEnd(27), String(s.total).padStart(5), String(s.kept).padStart(8), String(s.inactive).padStart(8), String(s.noClass).padStart(9));
const perCat = {};
products.forEach(p => { perCat[p.cat] = (perCat[p.cat] || 0) + 1; });
console.log('\nPe categorii:', perCat);
console.log(`\nTOTAL: ${products.length} produse · ${Object.keys(explore.brands).length} branduri în panoul de căutare`);
if (unclassified.length) console.log(`⚠ ${unclassified.length} produse neclasificate → vezi feeds/_neclasificate.txt`);
