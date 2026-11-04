// Date structurate (JSON-LD, schema.org), conform ghidurilor Google Search Central:
// - developers.google.com/search/docs/appearance/structured-data/sd-policies (doar conținut vizibil, reprezentare fidelă)
// - developers.google.com/search/docs/appearance/structured-data/product-snippet: markup-ul Product e doar pentru pagini
//   despre UN produs, NU pentru pagini de categorie/listare → pe listări punem doar CollectionPage + BreadcrumbList.
// Fără rating-uri, recenzii sau prețuri vechi.
import { SITE } from './site';

const abs = (href: string) => new URL(href, SITE.url).href;

export function breadcrumb(crumbs: { href?: string; label: string }[], currentUrl: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.href ? abs(c.href) : currentUrl,
    })),
  };
}

export function collectionPage(o: { name: string; description: string; url: string; crumbs: { href?: string; label: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: o.name,
    description: o.description,
    url: o.url,
    inLanguage: 'ro-RO',
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    breadcrumb: breadcrumb(o.crumbs, o.url),
  };
}

export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': SITE.url + '/#org',
        name: SITE.name,
        url: SITE.url,
        logo: SITE.url + '/favicon.svg',
        description: SITE.description,
      },
      {
        '@type': 'WebSite',
        '@id': SITE.url + '/#website',
        name: SITE.name,
        url: SITE.url,
        inLanguage: 'ro-RO',
        publisher: { '@id': SITE.url + '/#org' },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: SITE.url + '/cautare?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

// articol de blog: titlu, dată, autor, editor
export function blogPosting(o: { title: string; description: string; url: string; date: string; image?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: o.title,
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    datePublished: o.date,
    dateModified: o.date,
    inLanguage: 'ro-RO',
    image: o.image || SITE.url + '/og-image.png',
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: SITE.url + '/favicon.svg' } },
  };
}
