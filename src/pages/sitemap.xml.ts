import type { APIRoute } from 'astro';
import { CATEGORIES, PER_PAGE, productsInCat, productsInSub, deals, SITE } from '../lib/site';

const BASE = SITE.url;

function pageUrls(path: string, count: number) {
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const urls = [`${BASE}${path}`];
  for (let i = 2; i <= pages; i++) urls.push(`${BASE}${path}/${i}`);
  return urls;
}

export const GET: APIRoute = () => {
  const staticPages = [BASE, `${BASE}/confidentialitate`, `${BASE}/blog`, `${BASE}/blog/cum-alegi-imprimanta-termica`];
  const catPages = CATEGORIES.flatMap(c => [
    ...pageUrls(`/${c.slug}`, productsInCat(c.slug).length),
    ...c.subs.flatMap(s => {
      const n = productsInSub(c.slug, s.slug).length;
      return n ? pageUrls(`/${c.slug}/${s.slug}`, n) : [];
    }),
  ]);
  const promo = pageUrls('/promotii', deals().length);
  const allUrls = [...staticPages, ...catPages, ...promo];
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${url === BASE ? '1.0' : /\/\d+$/.test(url) ? '0.5' : '0.8'}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
