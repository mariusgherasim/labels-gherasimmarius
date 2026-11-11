# Casa Atelier (labels-site): ghid de operare

Site afiliat 2Performant pe Astro (static). Rulează pe **https://casaatelier.website** (din 22.10.2026; înainte labels.gherasimmarius.com).
Nume de lucru: **Casa Atelier**. Îl schimbi dintr-un singur loc: `src/lib/site.ts` → `SITE`.

## Magazine (feeduri 2Performant)
mezoni.ro (cel mai mare, ~90.000 produse după comasare) · labelshop.ro · a2t.ro · micul-meserias.ro · mobilalaguna.ro (2 feeduri) · decasamobilaitalia.ro · paa-home.ro · printingmall.ro · patuldeacasa.ro · depozitsolar.ro

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

## Volum și limite (de la adăugarea mezoni.ro)
- ~122.000 de produse în 10 categorii. Covoarele mezoni care diferă doar prin mărime apar o singură dată (cea mai ieftină mărime, cu „de la” și numărul de mărimi).
- Paginile statice sunt limitate (`MAX_PAGES` în `src/lib/site.ts`): 40 pe categorie, 120 pe subcategorie, 80 la Promoții. Paginile de după limită se deschid ca `/categorie/subcategorie?p=200` și se încarcă în browser. Așa site-ul rămâne la ~3.000 de pagini (~280 MB), sub limita de 1 GB a GitHub Pages.
- `products.json` are ~62 MB (GitHub avertizează peste 50 MB, limita e 100 MB). Fișierul e scris cu un produs pe rând, ca git să salveze doar diferențele la fiecare sync.
- Produsele mezoni din Lifestyle (genți, haine, îngrijire personală, sport) nu intră pe site. Apar în `feeds/_neclasificate.txt`.

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

## Petmart → categoria „Animale de companie” (adăugat 03.11.2026)
- **11.11.2026: Petmart SCOS DE TOT.** Scoase din `sync-si-publica.bat` și `sync-feeds.bat` rândurile care descărcau feedul Google Merchant de pe petmart.ro; șters scriptul `scripts/petmart-merchant-to-xml.cjs`. Fișierele `feeds/feed_petmart_merchant.xml`, `feeds/google-merchant.tsv` și `feeds/feed_15b6d6260.xml` se șterg din `feeds/`, iar la următorul sync produsele Petmart dispar de pe site. Regulile `PETMART` din `classify.cjs` au rămas, dar nu mai au ce clasifica. În „Animale de companie” rămân produsele pentru animale de la Mezoni și 6biologico.
- Feed: `feed_15b6d6260.xml` (petmart.ro, ~12.700 produse, ~9.000 active). Link în My feeds: `https://api.2performant.com/feed/15b6d6260.xml`. E trecut și în `sites.json` (folderul DESCARCARE AUTOMATA FEEDURI).
- **07.11.2026: Petmart scos din `sites.json`** (feedul public venea gol, apoi HTTP 404). Sync-ul citește toate fișierele .xml din `feeds/`: cât timp `feed_15b6d6260.xml` vechi rămâne acolo, produsele Petmart rămân pe site cu datele vechi. Pentru a le scoate, șterge fișierul din `feeds/` (și din folderul casa-gherasim al descărcărilor).
- Categoria nouă `animale-companie` (🐾), cu 8 subcategorii: hrană câini, hrană pisici, accesorii câini, pisici (nisip, litiere și joacă), jucării, sănătate/igienă/îngrijire, castroane/culcușuri/transport, acvaristică/păsări/rozătoare/reptile.
- Produsele de fermă și combaterea dăunătorilor de la Petmart merg în **Grădină & Agricultură → Fermă și combatere dăunători** (subcategorie nouă).
- Reguli: `PETMART` + `PET_TITLE` în `scripts/classify.cjs` (după categoria din feed; titlul e plan de rezervă).
- Subcategoria veche `gradina-agricultura/animale-companie` (câteva produse Mezoni) a fost scoasă. Produsele Mezoni pentru câini/pisici merg acum în noua categorie, după titlu.
- Variantele de gramaj (370 g / 12 kg) rămân produse separate. Dacă devin prea multe, le putem comasa ca la covoarele Mezoni (`COLLAPSE` în sync-feeds.cjs).


## 6biologico.ro → doar produsele pentru animale (adăugat 07.11.2026)
- Feed: `feed_20e3de1a9.xml` (~200 produse, ~114 active; campania 2Performant `bd4c71169`, comision 15%). În `sites.json` e trecut și la beautyhealth, și la CasaGherasim: scriptul îl descarcă o dată și îl copiază în ambele foldere.
- Pe Casa Atelier intră **doar cele ~30 de produse din categoria „Animale”** (șampoane, balsamuri, loțiuni, parfumuri pentru câini și pisici) → **Animale de companie → Sănătate și igienă**.
- Cosmeticele pentru oameni (~84) merg pe beauty-healths.com; aici `classify()` le întoarce `null`, așa că apar la sync ca „neclasif.” și în `feeds/_neclasificate.txt` — e normal.
- Regula: în `scripts/classify.cjs`, ramura `6biologico`.
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

## Footer: BusinessLeague + SAL ANPC (09.11.2026)
- În `src/components/Footer.astro`, deasupra rândului ©: insigna **BusinessLeague · Affiliate Marketing Partner** (→ https://businessleague.com/, logo oficial în `public/businessleague-logo.png`) și pictograma oficială **SAL ANPC** (→ https://reclamatiisal.anpc.ro/, `public/anpc-sal.png`, de pe https://www.anpc.ro/download/sal/SAL-PICTOGRAMA.png). Stilurile `.footer-badges`, `.bl-partner`, `.sal-anpc` sunt în `public/style.css` (versiunea din `Base.astro` urcată la `?v=4`, ca browserele să ia CSS-ul nou).
- Linkurile text „ANPC · SAL” din rândul © rămân.
- SOL nu se mai pune: platforma europeană a fost desființată (Ordinul ANPC 270/2026).
