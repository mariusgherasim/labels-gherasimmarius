import categoriesData from '../data/categories.json';
import allProducts from '../data/products.json';

// Numele site-ului — schimbi aici și se schimbă peste tot (logo, titluri, footer)
export const SITE = {
  name: 'Casa Atelier',
  wordmark: ['casa', 'atelier'],
  domain: 'labels.gherasimmarius.com',
  url: 'https://labels.gherasimmarius.com',
  tagline: 'Tot ce-ți trebuie pentru casă, curte și atelier',
  description: 'Mobilă, scule, grădină, securitate, electrice, birou și etichete — peste 30.000 de produse de la magazine românești verificate, cu prețuri și reduceri actualizate.',
};

export const PER_PAGE = 24;

export interface Product {
  id: string; title: string; price: number; old_price: number | null; brand: string;
  image: string; url: string; cat: string; sub: string; merchant: string;
}
export interface Sub { slug: string; name: string; hidden?: boolean }
export interface Category { slug: string; name: string; short: string; icon: string; accent: string; desc: string; subs: Sub[] }

export const CATEGORIES = categoriesData as Category[];
export const PRODUCTS = allProducts as Product[];

const hiddenKeys = new Set(CATEGORIES.flatMap(c => c.subs.filter(s => s.hidden).map(s => `${c.slug}/${s.slug}`)));
export const isHidden = (p: Product) => hiddenKeys.has(`${p.cat}/${p.sub}`);

export const discount = (p: { price: number; old_price: number | null }) =>
  p.old_price && p.old_price > p.price ? Math.round(100 - (p.price / p.old_price) * 100) : 0;

// scor ofertă: procent reducere + bonus (max 10) pentru suma economisită
export const dealScore = (p: Product) => {
  const pct = discount(p);
  if (!pct) return 0;
  const saved = (p.old_price as number) - p.price;
  return pct + Math.min(saved / 100, 10); // procentul contează cel mai mult, suma economisită departajează
};

const byCat = new Map<string, Product[]>();
const bySub = new Map<string, Product[]>();
for (const p of PRODUCTS) {
  if (!byCat.has(p.cat)) byCat.set(p.cat, []);
  if (!isHidden(p)) byCat.get(p.cat)!.push(p); // piesele de schimb nu apar pe pagina principală a categoriei
  const k = `${p.cat}/${p.sub}`;
  if (!bySub.has(k)) bySub.set(k, []);
  bySub.get(k)!.push(p);
}
export const productsInCat = (cat: string) => byCat.get(cat) || [];
export const productsInSub = (cat: string, sub: string) => bySub.get(`${cat}/${sub}`) || [];
export const countSub = (cat: string, sub: string) => productsInSub(cat, sub).length;
export const countCat = (cat: string) => PRODUCTS.filter(p => p.cat === cat).length;
export const getCat = (slug: string) => CATEGORIES.find(c => c.slug === slug);

let _deals: Product[] | null = null;
export const deals = () => (_deals ||= PRODUCTS.filter(p => !isHidden(p) && discount(p) > 0).sort((a, b) => dealScore(b) - dealScore(a)));

// selecție variată: max `perMerchant` produse de la același magazin
export function diverse(list: Product[], n: number, perMerchant = 2): Product[] {
  const out: Product[] = []; const used: Record<string, number> = {};
  const seenT = new Set<string>();
  for (const p of list) {
    if ((used[p.merchant] || 0) >= perMerchant) continue;
    const tk = p.title.toLowerCase().slice(0, 22); // evită variante de culoare ale aceluiași produs
    if (seenT.has(tk)) continue; seenT.add(tk);
    used[p.merchant] = (used[p.merchant] || 0) + 1; out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

export const MERCHANTS = [...new Set(PRODUCTS.map(p => p.merchant))];
export const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtInt = (n: number) => n.toLocaleString('ro-RO');
