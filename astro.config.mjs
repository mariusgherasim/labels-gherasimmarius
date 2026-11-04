import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub Pages servește paginile ca folder/index.html și redirecționează /categorie → /categorie/ (301).
// Google raporta paginile din sitemap ca „Pagină cu redirecționare” și nu le indexa.
// După build, adăugăm „/” la final în toate linkurile interne, ca să ducă direct la adresa canonică.
function trailingSlashLinks() {
  return {
    name: 'trailing-slash-links',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir);
        const re = /href="(\/[^"#?]*?[^"#?/])((?:\?[^"#]*)?(?:#[^"]*)?)"/g;
        let files = 0, links = 0;
        const walk = (d) => {
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.html')) {
              const src = fs.readFileSync(p, 'utf8');
              const out = src.replace(re, (m, url, rest) => {
                if (url.startsWith('//') || /\.[a-z0-9]{2,5}$/i.test(url)) return m; // fișiere (.css, .svg, .png) și linkuri externe rămân
                links++;
                return `href="${url}/${rest}"`;
              });
              if (out !== src) { fs.writeFileSync(p, out); files++; }
            }
          }
        };
        walk(root);
        console.log(`[trailing-slash-links] ${links} linkuri interne corectate în ${files} pagini`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://casaatelier.website',
  output: 'static',
  integrations: [trailingSlashLinks()],
});
