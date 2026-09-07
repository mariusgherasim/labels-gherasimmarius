const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const feedPath = '/mnt/user-data/uploads/feed_341549b6f.xml';
const outPath = path.join(__dirname, '../src/data/products.json');

// Mapping feed categories -> site categories (matching official site)
const CAT_MAP = {
  'Etichete': 'etichete',
  'Echipamente': 'echipamente',
  'Consumabile': 'consumabile',
  'Ambalare si coletare': 'ambalare',
  'Pachete PROMO': 'echipamente',
  'Servicii': 'consumabile',
};

const parser = new XMLParser({ ignoreAttributes: false });
const xml = fs.readFileSync(feedPath, 'utf-8');
const parsed = parser.parse(xml);

const rawItems = parsed.items.item;
const items = Array.isArray(rawItems) ? rawItems : [rawItems];

const products = items
  .filter(it => {
    const price = parseFloat(it.price) || 0;
    const active = it.product_active === true || it.product_active === 'true';
    return active && price > 0 && price < 50000;
  })
  .map(it => ({
    id: String(it.product_id || ''),
    title: String(it.title || '').trim(),
    price: parseFloat(it.price) || 0,
    old_price: it.old_price ? parseFloat(it.old_price) : null,
    brand: String(it.brand || '').trim(),
    category: CAT_MAP[String(it.category || '')] || 'consumabile',
    category_raw: String(it.category || '').trim(),
    url: String(it.aff_code || it.url || '').trim(),
    image: String(it.image_urls || '').split(',')[0].trim(),
    description: String(it.description || '').trim().slice(0, 300),
    available: true,
  }));

fs.writeFileSync(outPath, JSON.stringify(products, null, 2));
console.log(`Importat ${products.length} produse active.`);
const cats = {};
products.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
console.log('Categorii:', cats);
