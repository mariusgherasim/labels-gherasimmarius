# Casa Atelier (labels-site): ghid de operare

Site afiliat 2Performant pe Astro (static). Rulează pe **https://casaatelier.website** (din 22.10.2026; înainte labels.gherasimmarius.com).
Nume de lucru: **Casa Atelier**. Îl schimbi dintr-un singur loc: `src/lib/site.ts` → `SITE`.

## Magazine (feeduri 2Performant)
labelshop.ro · a2t.ro · micul-meserias.ro · mobilalaguna.ro (2 feeduri) · decasamobilaitalia.ro · paa-home.ro · printingmall.ro · patuldeacasa.ro · depozitsolar.ro

## Prima instalare (o singură dată)
1. Copiezi conținutul arhivei peste folderul `labels-site`. Se suprascriu fișierele cu același nume.
2. Dublu-click pe **cleanup-old-pages.bat**. Șterge paginile vechi `/etichete`, `/echipamente`, `/ambalare`, `/consumabile` și `promotii/index.astro`. Le înlocuiește ruta nouă `src/pages/[cat]/[...rest].astro`. Vechile URL-uri redirecționează automat spre cele noi.
3. `npm install`, apoi `npm run build` ca test.
4. Push:
   ```
   git add -A
   git commit -m "Casa Atelier: 9 magazine, categorii noi, cautare extinsa"
   git push origin main
   ```

## Actualizare produse (zilnic, local, fără GitHub Actions)
1. Descarci feedurile XML din 2Performant și le pui în folderul **`feeds/`** (le înlocuiești pe cele de ieri). Numele fișierelor nu contează.
2. Dublu-click pe **sync-si-publica.bat**: sincronizează, verifică build-ul și face push. Dacă ceva dă eroare, nu publică nimic.
3. Doar sincronizare, fără push: **sync-feeds.bat**.
4. Produsele neclasificate apar în `feeds/_neclasificate.txt`.
Workflow-ul automat „Update feed weekly” e dezactivat (fișierul lui din `.github/workflows` e șters).

Feedurile XML nu se urcă pe GitHub (sunt în `.gitignore`).

Ce face sync-ul:
- păstrează doar produsele **active**, cu preț, imagine și link (la printingmall, micul-meserias, depozitsolar și patuldeacasa „inactiv” = stoc epuizat)
- reducerile **sub 5%** nu primesc preț tăiat și nici badge
- scrie `src/data/products.json` (site), `public/data/s-<categorie>.json` (căutare și sortare) și `public/data/explore.json` (panoul de căutare)

## Categorii și subcategorii
- Lista și numele lor: `src/data/categories.json`. Fiecare categorie are `accent` (culoarea ei), iar fiecare subcategorie are `slug` și `name`.
- O subcategorie cu `"hidden": true` (acum doar **Piese de schimb**, 6.300+ produse) are pagina ei, dar nu apare în pagina principală a categoriei, pe homepage, în Promoții și în panoul de căutare.
- Regulile de clasificare: `scripts/classify.cjs`. Fiecare regulă e de forma `R(/cuvinte/, categorie, subcategorie)`, iar prima regulă potrivită câștigă. Ca să muți un tip de produs, adaugi o regulă mai sus în listă, apoi rulezi din nou sync-ul.

## URL-uri
- `/gradina-agricultura` · `/gradina-agricultura/2` (paginare, 24 de produse pe pagină)
- `/gradina-agricultura/drujbe` · `/gradina-agricultura/drujbe/3`
- `/promotii` (toate reducerile, ordonate după procent, apoi după suma economisită)
- `/cautare?q=...` (pagina de rezultate)
- Paginare: pe desktop se văd până la 19 numere de pagină, pe mobil 5.
- Sortare (Reducere / Preț / Nume): se face în browser, cu linkuri partajabile, de exemplu `?sort=price-asc&p=3`.

## Căutarea extinsă
- La click pe căutare se deschide un panou cu **6 tipuri de produse** și **6 branduri** alese la întâmplare. Pe o pagină de categorie, panoul arată doar tipurile din categoria respectivă.
- La hover (pe telefon, la tap) pe un tip sau brand apar **8 produse** la întâmplare, plus linkul „Vezi toate”.
- „Altele ↻” schimbă selecția.
- Când tastezi, primești rezultate live, numărul de rezultate pe fiecare categorie și butonul „Vezi toate rezultatele”.

## Stickere cu oferte (pe toate paginile)
Le adaugi în `src/data/stickers.json`. Instrucțiunile sunt chiar în fișier. Pe scurt:
- `position`: `bottom-left` / `bottom-right` (plutitor în colț), `top` (bandă sub meniu), `inline` (rândul „Oferte speciale” deasupra footerului)
- `image` (banner 2Performant). Dacă nu pui imagine, stickerul apare în varianta text (`title`, `text`, `cta`, `color`).
- `start` / `end`: apare doar în intervalul ăsta, fără rebuild
- `scope`: `"all"` sau lista de categorii unde apare
- Butonul ✕ ascunde stickerul doar pe pagina curentă. La pagina următoare reapare.

## Email zilnic pe categorie
- Dublu-click pe **generate-email.bat**. Alegi categoria (0 = Mix, P = Promoții, 1–8 = categorii), apoi subcategoria și numărul de produse. Se deschide `email-output.html`.
- Din linia de comandă: `node generate-email.cjs gradina-agricultura/drujbe 12`
- Primești 3 subiecte, preheader-ul, butonul „Copiază HTML” și previzualizarea. HTML-ul îl lipești în MailerLite, într-un **bloc Custom HTML**.
- Selecția: cele mai bune reduceri din categorie, amestecate în funcție de zi (în fiecare zi alte produse), fără produse sub 20 lei, max ~4 produse de la același magazin. Dacă nu sunt destule produse la reducere, completează cu produse fără reducere.
- Linkurile spre site au UTM: `utm_source=mailerlite&utm_medium=email&utm_campaign=oferte-<categorie>-<AAAALLZZ>`
- Regula hook: subiectele au cifre și întrebări retorice. Verifică-le înainte de trimitere.
- Emailurile Etichete merg pe lista de firme. Mobila, grădina etc. sunt B2C, deci vezi pe ce grup MailerLite trimiți.

## Fișiere cheie
| Fișier | Rol |
|---|---|
| `src/lib/site.ts` | numele site-ului, filtre și funcții comune |
| `src/data/categories.json` | categorii + subcategorii |
| `scripts/classify.cjs` | reguli de clasificare |
| `scripts/sync-feeds.cjs` | import feeduri |
| `src/pages/[cat]/[...rest].astro` | toate paginile de categorie și subcategorie + redirecturile vechi |
| `src/components/Listing.astro` | șablonul paginii de listare |
| `public/search.js` | căutare, panou extins, sortare |
| `public/site.js` | meniu mobil, tracking click afiliere (GA4), stickere |
| `public/style.css` | design (roșu #E63329, galben #FFC629, grafit) |
| `generate-email.cjs` | generatorul de email |

## De făcut la schimbarea domeniului
1. `astro.config.mjs` → `site`
2. `src/lib/site.ts` → `SITE.url`, `SITE.domain`
3. `generate-email.cjs` → `SITE_URL`
4. fișierul `CNAME` din `public/` (dacă există)
5. proprietate nouă în Search Console + redirect de pe labels.gherasimmarius.com
