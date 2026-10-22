// Clasificare automată produse -> [categorie, subcategorie]
// Regulile se aplică pe textul normalizat (fără diacritice, litere mici).
// Ordinea contează: prima regulă care se potrivește câștigă.
// Ca să muți un tip de produs: adaugă/editează o regulă mai sus în listă.

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&amp;/g, '&');

const R = (re, cat, sub) => ({ re, cat, sub });
const MOB = 'mobila-living', EL = 'electrocasnice-curatenie', GR = 'gradina-agricultura',
  SC = 'scule-utilaje', CL = 'clima-energie', SEC = 'securitate-smart-home',
  ER = 'electric-retea', BIR = 'birou-etichete-ambalare',
  DEC = 'decoratiuni-textile', BUC = 'bucatarie-servire';

// ---------- Mobilă (mobilalaguna, decasamobilaitalia, patuldeacasa) ----------
const FURNITURE_TITLE_FIRST = [
  R(/perne? decorativ|set \d+ perne|\bperna\b|\bperne\b/, DEC, 'perne-decorative'),
  R(/lenjer|cuvertur|patur[ai]|cearsaf/, DEC, 'lenjerii-pat'),
  R(/pilot|saltea|topper/, MOB, 'lenjerii-saltele'),
  R(/panou decorativ|tablie|tablii/, MOB, 'paturi-dormitor'),
  R(/oglind|lampa|veioza|lustra/, MOB, 'lampi-oglinzi'),
  R(/^scaun/, MOB, 'scaune'),
  R(/^(taburet|fotoliu|fotolii|puf)\b/, MOB, 'fotolii-taburete'),
];
const FURNITURE = [
  R(/lenjer|cearsaf|husa (de )?pat|bedding|bed sheet/, DEC, 'lenjerii-pat'),
  R(/saltea|saltele|perna|perne|pilot/, MOB, 'lenjerii-saltele'),
  R(/terasa|gradina/, GR, 'curte-terasa'),
  R(/baie/, MOB, 'mobila-baie'),
  R(/copii|copil/, MOB, 'camera-copiilor'),
  R(/colt(ar|are)|canapea|canapele|sofa|tapiterii/, MOB, 'canapele-coltare'),
  R(/fotoli|taburet|tabureti|puf\b/, MOB, 'fotolii-taburete'),
  R(/dulap|dressing|sifonier/, MOB, 'dulapuri-dressinguri'),
  R(/bucatari/, MOB, 'mobila-bucatarie'),
  R(/birou|hol\b|cuier|pantofar/, MOB, 'birou-hol'),
  R(/\bpat\b|paturi|divan|dormitor|noptier/, MOB, 'paturi-dormitor'),
  R(/lampa|lampi|veioza|lustra|oglind|figurin/, MOB, 'lampi-oglinzi'),
  R(/scaun/, MOB, 'scaune'),
  R(/\bmas[aă]\b|\bmese\b|masut/, MOB, 'mese'),
  R(/comod|vitrin|bibliotec|consol|raft|tv\b/, MOB, 'comode-vitrine'),
  R(/living|sufragerie|corp(uri)?\b|mobilier/, MOB, 'living-sufragerie'),
];
const GENERIC_CAT = /oferte|feed|pachete|fara categorie|online|lichidari|resigilate|^altele$|^produse /;

// ---------- mezoni.ro (text = "categorie > subcategorie" din feed) ----------
const MEZONI = [
  R(/craciun|paste/, DEC, 'craciun'),
  R(/^copii > (jucarii|plimbare|accesorii|imbracaminte)/, MOB, 'camera-copiilor'),
  R(/^copii > (lenjerii|pilote|perne|saltele|covoare|draperii|mobilier)/, MOB, 'camera-copiilor'),
  R(/caini|pisici/, GR, 'animale-companie'),
  R(/^gradina > iluminat/, ER, 'iluminat'),
  R(/^gradina > (aparate de spalat|unelte|masini tuns|motosape)/, GR, 'unelte-gradina'),
  R(/^gradina > gratare/, GR, 'curte-terasa'),
  R(/^gradina/, GR, 'curte-terasa'),
  R(/^covoare|> covor/, DEC, 'covoare'),
  R(/tablouri|rame foto/, DEC, 'tablouri'),
  R(/oglinzi/, MOB, 'lampi-oglinzi'),
  R(/^decoratiuni|lifestyle > accesorii casa/, DEC, 'decoratiuni'),
  R(/^iluminat > becuri/, ER, 'iluminat'),
  R(/^iluminat/, MOB, 'lampi-oglinzi'),
  R(/perne decorative/, DEC, 'perne-decorative'),
  R(/prosoape|halate/, DEC, 'prosoape-baie'),
  R(/draperii|perdele|huse canapele/, DEC, 'draperii-huse'),
  R(/naproane|fete de masa/, BUC, 'textile-masa'),
  R(/lenjeri|cearceaf|fete de perna|cuverturi|^textile/, DEC, 'lenjerii-pat'),
  R(/saltea|saltele|toppere|protectii saltea|spuma|^perne|> perne|pilote/, MOB, 'lenjerii-saltele'),
  R(/^electrocasnice > (aeroterme|aparate filtrare)/, CL, 'climatizare-ventilatie'),
  R(/^electrocasnice > aparate ingrijire/, null, null),
  R(/^electrocasnice/, EL, 'electrocasnice-mici'),
  R(/mopuri|detergenti|stergatoare|echipamente de protectie/, EL, 'curatenie'),
  R(/^accesorii curatenie/, EL, 'organizare-casa'),
  R(/vase pentru (gatit|copt)/, BUC, 'vase-gatit'),
  R(/servire|servicii de masa|boluri/, BUC, 'servire'),
  R(/pahare|cafetiere|cani|ceainice|accesorii bar/, BUC, 'pahare-cani'),
  R(/cutite|tacamuri|tocatoare/, BUC, 'cutite-tacamuri'),
  R(/^bucatarie/, BUC, 'ustensile-organizare'),
  R(/canapele|coltare/, MOB, 'canapele-coltare'),
  R(/fotolii|taburet/, MOB, 'fotolii-taburete'),
  R(/masute|mese/, MOB, 'mese'),
  R(/comode|rafturi|biblioteci/, MOB, 'comode-vitrine'),
  R(/mobilier bucatarie/, MOB, 'mobila-bucatarie'),
  R(/scaune birou|birouri|mobilier hol/, MOB, 'birou-hol'),
  R(/scaune/, MOB, 'scaune'),
  R(/mobilier baie/, MOB, 'mobila-baie'),
  R(/paturi|mobila dormitor/, MOB, 'paturi-dormitor'),
  R(/^mobilier/, MOB, 'living-sufragerie'),
];

// ---------- paa-home.ro ----------
const PAA = [
  R(/purificato/, EL, 'filtre-purificatoare'),
  R(/aspiratoare robot|aspirator robot|robot/, EL, 'accesorii-aspiratoare-robot'),
  R(/vertical/, EL, 'accesorii-aspiratoare-verticale'),
  R(/thermomix|bucatarie|blender|cafea|essentia/, EL, 'accesorii-bucatarie'),
  R(/mop|matur|galet|detergent|leifheit|curat|laveta|sano/, EL, 'curatenie'),
];

// micul-meserias: câteva produse sunt puse greșit în feed — titlul are prioritate pentru astea
const MM_TITLE_FIRST = [
  R(/^furtun/, GR, 'furtunuri'),
  R(/picurare|aspersor|irigat|sprinkler/, GR, 'irigatii'),
];
// ---------- micul-meserias.ro (categorie feed -> sub) ----------
const MM = [
  R(/piese de schimb/, SC, 'piese-schimb'),
  R(/pompe apa/, GR, 'pompe-apa'),
  R(/irigare/, GR, 'irigatii'),
  R(/utilaje constructii/, SC, 'utilaje-constructii'),
  R(/ventilatie|climatizare/, CL, 'climatizare-ventilatie'),
  R(/incalzire/, CL, 'incalzire'),
  R(/uz casnic/, EL, 'utilaje-uz-casnic'),
  R(/bucatarie/, EL, 'aparate-bucatarie-profesionale'),
  R(/zootehnie/, GR, 'zootehnie'),
  R(/drujba/, GR, 'drujbe'),
  R(/motocultor|motosapa/, GR, 'motocultoare'),
  R(/motor uz general/, GR, 'motoare-generatoare'),
  R(/furtun/, GR, 'furtunuri'),
  R(/moara/, GR, 'mori-cereale'),
  R(/motocoasa/, GR, 'motocoase'),
  R(/electrice/, SC, 'scule-electrice'),
  R(/agricultura|gradinarit/, GR, 'unelte-gradina'),
];

// ---------- a2t.ro (categorie feed -> sub) ----------
const A2T = [
  R(/gradin|pergol|^gard$/, GR, 'curte-terasa'),
  R(/aspiratoare profesionale|aspirator smart/, EL, 'utilaje-uz-casnic'),
  R(/milwaukee|scule electrice|insurubat|gaurit|rebel|carote|packout/, SC, 'scule-electrice'),
  R(/clest|surubelnit|truse|scule de mana|cuttere|burghie/, SC, 'scule-mana'),
  R(/uni-t|aparate de masura/, SC, 'aparate-masura'),
  R(/lantern|camping|termos|rucsac|echipamente de protectie/, SC, 'echipament-atelier'),
  R(/fotovoltai|invertoare|fixare acoperis|fixare panouri/, CL, 'fotovoltaice'),
  R(/statii de incarcare|incarcare auto|incarcare masini/, CL, 'statii-incarcare'),
  R(/incendi|antiincendiu|\bfum\b|evacuare vocala|detectori conventionali|sirene conventionale/, SEC, 'antiincendiu'),
  R(/ups|stabilizatoare|acumulatori|baterie|baterii|powerbank/, CL, 'ups-baterii'),
  R(/videointerf|interfon|sonerie/, SEC, 'videointerfoane'),
  R(/control acces|cititoare|cartele|taguri|yala|bolturi|electromagnet|butoane de acces|turnicheti|pontaj|incuietori|inchizatori|hotelier|amortizoare|controllere standalone/, SEC, 'control-acces'),
  R(/automatizari|porti|bariere|bariera|parcare|usi de garaj|usi garaj|culisare|telecomanda|fotocelule|feronerie|semafoare|autoportanta|lampa semnalizare/, SEC, 'automatizari-porti'),
  R(/smart|tuya|shelly|sonoff|aqara|fibaro|casa inteligenta|priza inteligenta|intrerupator|termostat|releu|relee|statii meteo/, SEC, 'smart-home'),
  R(/alarm|centrale si dispozitive|senzori|perimetrare|comunicatoare|sirene|ajax|paradox|\bdsc\b|eldes|elmes|apelare personal/, SEC, 'alarme'),
  R(/nvr|dvr|kit supraveghere|kituri supraveghere|hard dis|monitor supraveghere|solutii stocare|^stocare$/, SEC, 'inregistratoare-kituri'),
  R(/camer|dome|lentila|imou|ezviz|termoviziune|microfon supraveghere|accesorii supraveghere|balun|mufe supraveghere|cabluri supraveghere|tester cctv/, SEC, 'camere-supraveghere'),
  R(/iluminat|proiectoare led|lampi|iluminatoare|iluminare/, ER, 'iluminat'),
  R(/sonoriz|difuzoare|amplificatoare|microfoane|boxe|mixer|audio|karaoke|conferinta|biserica|multimedia|suport tv|monitoare|digital signage|pc si|ssd|card memorie|trotinet/, ER, 'audio-video'),
  R(/retea|retele|switch|router|acces point|sfp|fibra|poe|patchcord|media convertor|telefon|voip|rack|telecomunicatii/, ER, 'retelistica'),
  R(/cabl|conector|hdmi|coaxial|mufe/, ER, 'cabluri-conectori'),
  R(/aparataj|sigurant|doze|tablouri|prelungitoare|cutii/, ER, 'aparataj-electric'),
  R(/alimentat|surse|alimentare/, ER, 'surse-alimentare'),
];

// ---------- fallback pe titlu (orice magazin) ----------
const TITLE = [
  R(/camera (ip|de supraveghere|supraveghere)|camera wi-?fi|\bcamera\b.*\bmp\b/, SEC, 'camere-supraveghere'),
  R(/\bnvr\b|\bdvr\b|\bxvr\b/, SEC, 'inregistratoare-kituri'),
  R(/videointerfon|interfon|sonerie/, SEC, 'videointerfoane'),
  R(/alarma|detector|senzor/, SEC, 'alarme'),
  R(/automatizare|poarta|bariera|motor (pentru )?poart/, SEC, 'automatizari-porti'),
  R(/switch|router|patch ?cord|\bsfp\b|fibra optica|\brack\b/, ER, 'retelistica'),
  R(/\bcablu|conector|mufa/, ER, 'cabluri-conectori'),
  R(/\bups\b|acumulator|baterie|stabilizator/, CL, 'ups-baterii'),
  R(/panou (fotovoltaic|solar)|invertor/, CL, 'fotovoltaice'),
  R(/sursa|alimentator/, ER, 'surse-alimentare'),
  R(/bec|led|proiector|lampa|corp de iluminat/, ER, 'iluminat'),
  R(/boxa|difuzor|amplificator|microfon/, ER, 'audio-video'),
  R(/motocoasa|trimmer/, GR, 'motocoase'),
  R(/drujba|lant drujba/, GR, 'drujbe'),
  R(/motocultor|motosapa/, GR, 'motocultoare'),
  R(/pompa/, GR, 'pompe-apa'),
  R(/furtun/, GR, 'furtunuri'),
  R(/generator|motor/, GR, 'motoare-generatoare'),
  R(/aspirator robot|robot/, EL, 'accesorii-aspiratoare-robot'),
  R(/aspirator/, EL, 'accesorii-aspiratoare'),
  R(/filtru/, EL, 'accesorii-aspiratoare'),
  R(/mop|matura/, EL, 'curatenie'),
  R(/bormasina|polizor|flex|fierastrau|ciocan|surubelnita|autofiletanta|slefuitor|rotopercutor|acumulator m1[28]/, SC, 'scule-electrice'),
  R(/clest|cheie|trusa|cutter|foarfec/, SC, 'scule-mana'),
  R(/multimetru|tester|aparat de masura/, SC, 'aparate-masura'),
  R(/piesa|garnitura|carburator|rulment|ax |bobina|filtru aer/, SC, 'piese-schimb'),
];

// ---------- labelshop.ro ----------
function labelshop(cat, t) {
  if (/etichete/.test(cat)) return [BIR, 'etichete'];
  if (/ambalare/.test(cat)) return [BIR, 'ambalare'];
  if (/consumabile/.test(cat)) return [BIR, 'consumabile-etichetare'];
  if (/echipamente/.test(cat)) return [BIR, 'imprimante-etichete'];
  if (/imprimant|aplicator|dispenser/.test(t)) return [BIR, 'imprimante-etichete'];
  if (/ribon/.test(t)) return [BIR, 'consumabile-etichetare'];
  return [BIR, 'etichete'];
}

// ---------- printingmall.ro ----------
function printingmall(cat, t) {
  if (/shredder|laminator|stapler/.test(cat)) return [BIR, 'distrugatoare-laminatoare'];
  if (/consumables|toner|drum|maintenance|ribbon/.test(cat)) return [BIR, 'tonere-cartuse'];
  return [BIR, 'imprimante-birou'];
}

function first(rules, text) {
  for (const r of rules) if (r.re.test(text)) return [r.cat, r.sub];
  return null;
}

/**
 * @param {string} merchant  campaign_name din feed
 * @param {string} category  categoria din feed
 * @param {string} title
 * @param {string} [subcategory]  subcategoria din feed (folosită la mezoni)
 * @returns {[string,string]|null}
 */
function classify(merchant, category, title, subcategory = '') {
  const m = norm(merchant), c = norm(category), t = norm(title);
  if (m.includes('mezoni')) {
    const r = first(MEZONI, norm(category + (subcategory ? ' > ' + subcategory : '')));
    return r && r[0] ? r : null; // null = produs care nu intră pe site (ex: îngrijire personală, genți)
  }
  if (m.includes('labelshop')) return labelshop(c, t);
  if (m.includes('printingmall')) return printingmall(c, t);
  if (m.includes('depozitsolar')) return [CL, 'fotovoltaice'];
  if (m.includes('patuldeacasa')) return [DEC, 'lenjerii-pat'];
  if (m.includes('mobilalaguna') || m.includes('decasamobila')) {
    const tf = first(FURNITURE_TITLE_FIRST, t); if (tf) return tf;
    if (!GENERIC_CAT.test(c)) { const r = first(FURNITURE, c); if (r) return r; }
    return first(FURNITURE, t) || [MOB, 'living-sufragerie'];
  }
  if (m.includes('paa-home')) {
    return first(PAA, c) || first(PAA, t) || [EL, 'accesorii-aspiratoare'];
  }
  if (m.includes('micul-meserias')) {
    return (/piese de schimb/.test(c) ? null : first(MM_TITLE_FIRST, t)) || first(MM, c) || first(TITLE, t) || [SC, 'utilaje-constructii'];
  }
  if (m.includes('a2t')) {
    return first(A2T, c) || first(TITLE, t) || (/piese/.test(c) ? [SC, 'piese-schimb'] : [ER, 'aparataj-electric']);
  }
  return first(TITLE, t);
}

module.exports = { classify, norm };
