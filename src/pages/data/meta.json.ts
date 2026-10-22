// /data/meta.json — categoriile și subcategoriile cu numărul de produse (folosit de căutare)
import type { APIRoute } from 'astro';
import { CATEGORIES, countSub } from '../../lib/site';

export const GET: APIRoute = () => {
  const cats = CATEGORIES.map(c => ({
    slug: c.slug, name: c.name, short: c.short, icon: c.icon,
    subs: c.subs.map(s => ({ slug: s.slug, name: s.name, n: countSub(c.slug, s.slug), hidden: !!s.hidden })).filter(s => s.n > 0),
  }));
  return new Response(JSON.stringify({ cats }), { headers: { 'Content-Type': 'application/json' } });
};
