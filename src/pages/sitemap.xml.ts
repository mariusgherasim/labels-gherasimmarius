import type { APIRoute } from 'astro';
import products from '../data/products.json';

const BASE = 'https://labels.gherasimmarius.com';
const PER_PAGE = 24;

function pageUrls(slug: string, count: number) {
  const pages = Math.ceil(count / PER_PAGE);
  const urls = [`${BASE}/${slug}`];
  for (let i = 2; i <= pages; i++) urls.push(`${BASE}/${slug}/${i}`);
  return urls;
}

export const GET: APIRoute = () => {
  const cats = ['etichete', 'echipamente', 'ambalare', 'consumabile'] as const;
  const staticPages = [BASE, `${BASE}/confidentialitate`];
  
  const catPages = cats.flatMap(c => {
    const count = products.filter(p => p.category === c).length;
    return pageUrls(c, count);
  });

  const allUrls = [...staticPages, ...catPages];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === BASE ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
