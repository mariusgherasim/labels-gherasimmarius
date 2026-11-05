// Petmart: feedul din 2Performant a venit gol, iar Petmart a dat linkul feedului lor Google Merchant (TSV).
// Scriptul:
//   1. descarcă fișierul de la Petmart (prețurile zilei), îl salvează în feeds\google-merchant.tsv
//      (dacă descărcarea nu merge, folosește ultimul fișier descărcat)
//   2. îl transformă în formatul feedurilor 2Performant, cu link de afiliere 2Performant (quicklink) pe fiecare
//      produs, ca să primești comision → feeds\feed_petmart_merchant.xml (îl citește sync-feeds.cjs)
//   3. de la 1 decembrie 2026 se oprește singur și șterge produsele Petmart: programul de afiliere
//      se închide pe 5.12.2026 și Petmart a cerut eliminarea linkurilor până atunci.
// Rulează automat din sync-si-publica.bat și sync-feeds.bat. Manual:  node scripts/petmart-merchant-to-xml.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FEEDS = path.join(ROOT, 'feeds');
const AFF_CODE = '676a7e7d9';            // codul tău de afiliat
const CAMPAIGN_UNIQUE = 'a9ea8a546';     // campania petmart.ro în 2Performant
const FEED_URL = 'https://www.petmart.ro/media/feeds/google-merchant.tsv';
const STOP_DATE = '2026-12-01';          // programul Petmart se închide pe 5.12.2026
const src = path.join(FEEDS, 'google-merchant.tsv');
const out = path.join(FEEDS, 'feed_petmart_merchant.xml');

function download(url, dest, hops = 0) {
  return new Promise((resolve, reject) => {
    const req = require('https').get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (feed sync)' }, timeout: 120000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
        res.resume(); return resolve(download(new URL(res.headers.location, url).href, dest, hops + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const tmp = dest + '.part', file = fs.createWriteStream(tmp);
      res.pipe(file);
      file.on('finish', () => file.close(() => {
        const head = fs.readFileSync(tmp, 'utf8').slice(0, 2000);
        const lines = fs.readFileSync(tmp, 'utf8').split('\n').length;
        if (!/^id\ttitle\t/.test(head) || lines < 1000) { fs.unlinkSync(tmp); return reject(new Error(`fișier incomplet (${lines} rânduri)`)); }
        fs.renameSync(tmp, dest); resolve(lines - 1);
      }));
      file.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function main() {
const d = new Date(), today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
if (today >= STOP_DATE) {
  for (const f of [src, out]) if (fs.existsSync(f)) fs.unlinkSync(f);
  console.log('Petmart: programul de afiliere se închide pe 5.12.2026 → produsele Petmart au fost scoase de pe site.');
  return;
}
fs.mkdirSync(FEEDS, { recursive: true });
try {
  const n = await download(FEED_URL, src);
  console.log(`Petmart: am descărcat feedul zilei (${n} rânduri).`);
} catch (e) {
  if (!fs.existsSync(src)) { console.log(`⚠ Petmart: nu am putut descărca feedul (${e.message}) și nu am o copie veche → Petmart nu intră la această sincronizare.`); return; }
  const age = Math.round((Date.now() - fs.statSync(src).mtimeMs) / 86400000);
  console.log(`⚠ Petmart: nu am putut descărca feedul (${e.message}) → folosesc copia de acum ${age} zile.`);
}

// citire TSV cu ghilimele (câmpurile pot conține tab-uri sau ghilimele dublate)
function parseTSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"' && cell === '') q = true;
    else if (ch === '\t') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (s) => { const v = parseFloat(String(s || '').replace(/[^\d.]/g, '')); return isFinite(v) ? v : 0; };
const quicklink = (url) => `https://event.2performant.com/events/click?ad_type=quicklink&aff_code=${AFF_CODE}&unique=${CAMPAIGN_UNIQUE}&redirect_to=${url.replace(/^https:\/\//, 'https%253A//')}`;

const rows = parseTSV(fs.readFileSync(src, 'utf8'));
const head = rows.shift().map((h) => h.trim());
const col = (r, n) => r[head.indexOf(n)] || '';
let n = 0, inactive = 0, best = 0;
const items = [];
for (const r of rows) {
  if (r.length < 5) continue;
  const title = col(r, 'title').trim();
  const link = col(r, 'link').trim();
  if (!title || !/^https:\/\/www\.petmart\.ro\//.test(link)) continue;
  const regular = money(col(r, 'price'));
  const sale = money(col(r, 'sale_price')) || regular;
  const active = col(r, 'availability').trim() === 'in stock';
  if (!active) inactive++;
  let category = col(r, 'product_type').trim();
  if (/^otc$/i.test(category)) category = 'Farmacie - OTC';          // antiparazitare, suplimente
  const isBest = col(r, 'custom_label_0').trim() === 'best_seller';
  if (isBest) best++;
  items.push(`<item><title>${esc(title)}</title><aff_code>${esc(quicklink(link))}</aff_code><price>${sale.toFixed(2)}</price><old_price>${(regular > sale ? regular : sale).toFixed(2)}</old_price><campaign_name>petmart.ro</campaign_name><image_urls>${esc(col(r, 'image_link').trim())}</image_urls><brand>${esc(col(r, 'brand').trim())}</brand><product_active>${active}</product_active><category>${esc(category)}</category><subcategory></subcategory><product_id>m${esc(col(r, 'id').trim())}</product_id><gtin>${esc(col(r, 'gtin').trim())}</gtin><custom_field1>${isBest ? 'best_seller' : ''}</custom_field1><url>${esc(link)}</url></item>`);
  n++;
}
fs.writeFileSync(out, `<items>${items.join('')}</items>`);
console.log(`Petmart (Google Merchant → 2Performant): ${n} produse scrise în ${path.relative(ROOT, out)} · ${n - inactive} în stoc · ${inactive} epuizate · ${best} best seller`);
}
main().catch((e) => { console.log(`⚠ Petmart: ${e.message} → sincronizarea continuă fără Petmart.`); });
