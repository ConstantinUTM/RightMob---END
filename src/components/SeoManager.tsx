import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'RightMob';
const SITE_ORIGIN = 'https://rightmob.md';
const SITE_LOGO = `${SITE_ORIGIN}/favicon.png`;
const DEFAULT_TITLE = 'RightMob - Mobilier premium la comanda';
const DEFAULT_DESCRIPTION = 'Mobilier premium la comanda pentru bucatarie, living, dormitor si birou. Proiectare, executie si montaj in Moldova.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/favicon.png`;

type SeoData = {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const ORGANIZATION_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FurnitureStore',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: SITE_LOGO,
  image: DEFAULT_IMAGE,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      areaServed: 'MD',
      availableLanguage: ['ro', 'en', 'ru'],
    },
  ],
};

const WEBSITE_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  inLanguage: ['ro-RO', 'en-US', 'ru-RU'],
};

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  bucatarie: {
    title: 'Mobilier de Bucatarie la Comanda - RightMob',
    description: 'Proiecte de bucatarie la comanda realizate de RightMob: configuratii moderne, materiale premium si executie precisa.',
  },
  living: {
    title: 'Mobilier Living la Comanda - RightMob',
    description: 'Inspira-te din proiectele RightMob pentru living: design personalizat, finisaje elegante si functionalitate optimizata.',
  },
  dormitor: {
    title: 'Mobilier Dormitor la Comanda - RightMob',
    description: 'Dormitoare la comanda RightMob cu spatii bine organizate, estetica moderna si materiale de calitate.',
  },
  baie: {
    title: 'Mobilier Baie la Comanda - RightMob',
    description: 'Mobilier de baie personalizat RightMob, rezistent la umiditate si adaptat perfect spatiului tau.',
  },
  hol: {
    title: 'Mobilier Hol la Comanda - RightMob',
    description: 'Idei de amenajare pentru hol cu mobilier la comanda RightMob, practic si elegant.',
  },
  birou: {
    title: 'Mobilier Birou la Comanda - RightMob',
    description: 'Mobilier de birou personalizat pentru acasa sau spatiu comercial, proiectat de RightMob pentru confort si eficienta.',
  },
  copii: {
    title: 'Mobilier Camera Copii la Comanda - RightMob',
    description: 'Solutii de mobilier pentru camera copiilor: sigure, creative si adaptate varstei, realizate de RightMob.',
  },
  gradina: {
    title: 'Mobilier Gradina la Comanda - RightMob',
    description: 'Proiecte RightMob pentru gradina si terasa, cu accent pe durabilitate, confort si stil.',
  },
};

const getSeoForPath = (pathname: string): SeoData => {
  if (pathname === '/') {
    return {
      title: 'RightMob - Mobilier premium pentru casa',
      description: 'Descopera colectiile RightMob: mobilier premium personalizat, design modern, materiale de calitate si montaj profesionist.',
      type: 'website',
    };
  }
  if (pathname === '/galerie' || pathname.startsWith('/galerie/')) {
    return {
      title: 'Galerie Proiecte - RightMob',
      description: 'Exploreaza proiectele RightMob: mobilier la comanda pentru bucatarie, living, dormitor, hol, baie si birou.',
      type: pathname.startsWith('/galerie/') ? 'product' : 'website',
    };
  }
  if (pathname.startsWith('/mobilier/')) {
    const category = pathname.split('/')[2]?.trim().toLowerCase() || '';
    const categorySeo = CATEGORY_SEO[category];
    if (categorySeo) {
      return {
        ...categorySeo,
        type: 'website',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: categorySeo.title,
            description: categorySeo.description,
            url: `${SITE_ORIGIN}${pathname}`,
            inLanguage: 'ro-RO',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Cat dureaza realizarea mobilierului la comanda?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Durata depinde de complexitate, dar in general proiectele sunt livrate in cateva saptamani, dupa masuratori si confirmarea materialelor.',
                },
              },
              {
                '@type': 'Question',
                name: 'Asigurati montaj pentru mobilier?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Da, RightMob asigura montaj profesionist pentru proiectele realizate.',
                },
              },
            ],
          },
        ],
      };
    }
  }
  if (pathname === '/despre') {
    return {
      title: 'Despre Noi - RightMob',
      description: 'Afla povestea RightMob, procesul nostru de lucru si standardele de calitate pentru mobilier premium la comanda.',
      type: 'website',
    };
  }
  if (pathname === '/contact') {
    return {
      title: 'Contact - RightMob',
      description: 'Contacteaza echipa RightMob pentru oferte personalizate, consultanta si detalii despre comenzi, livrare si montaj.',
      type: 'website',
    };
  }
  if (pathname === '/try-room') {
    return {
      title: 'Try In My Room - RightMob',
      description: 'Testeaza vizual mobilierul RightMob in camera ta si compara stiluri, culori si configuratii.',
      type: 'website',
    };
  }
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
  };
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const toAbsoluteImage = (url: string) => {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${SITE_ORIGIN}${clean}`;
};

const upsertJsonLd = (data?: Record<string, unknown> | Array<Record<string, unknown>>) => {
  const scriptId = 'rightmob-seo-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    document.head.appendChild(script);
  }

  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : data;
  script.text = JSON.stringify(payload);
};

const getDynamicGallerySeo = async (id: string, pathname: string): Promise<SeoData | null> => {
  try {
    const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const item = await res.json();
    const rawTitle = String(item?.description || '').trim();
    if (!rawTitle) return null;

    const rawDescription = String(item?.aboutDescription_ro || item?.aboutDescription || item?.description || '').trim();
    const shortDescription = stripHtml(rawDescription).slice(0, 155) || DEFAULT_DESCRIPTION;
    const image = toAbsoluteImage(String(item?.url || ''));

    return {
      title: `${rawTitle} - Proiect RightMob`,
      description: shortDescription,
      image,
      type: 'product',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: rawTitle,
          description: shortDescription,
          image,
          category: String(item?.category || '').trim() || undefined,
          brand: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
          url: `${SITE_ORIGIN}${pathname}`,
          ...(Array.isArray(item?.reviews) && item.reviews.length > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: Number(
                    (
                      item.reviews.reduce((sum: number, review: { rating?: number }) => sum + (Number(review?.rating) || 5), 0) /
                      item.reviews.length
                    ).toFixed(1)
                  ),
                  reviewCount: item.reviews.length,
                },
              }
            : {}),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Acasa',
              item: SITE_ORIGIN,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Galerie',
              item: `${SITE_ORIGIN}/galerie`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: rawTitle,
              item: `${SITE_ORIGIN}${pathname}`,
            },
          ],
        },
      ],
    };
  } catch {
    return null;
  }
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    document.head.appendChild(meta);
  }
  Object.entries(attrs).forEach(([k, v]) => meta!.setAttribute(k, v));
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const SeoManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
    const pathname = location.pathname || '/';
    let seo = getSeoForPath(pathname);

    if (pathname.startsWith('/galerie/')) {
      const id = pathname.split('/')[2]?.trim();
      if (id) {
        const dynamicSeo = await getDynamicGallerySeo(id, pathname);
        if (dynamicSeo) seo = dynamicSeo;
      }
    }

    if (!mounted) return;
    const canonical = `${SITE_ORIGIN}${pathname}`;
    const jsonLdCollection = [
      ORGANIZATION_SCHEMA,
      ...(pathname === '/' ? [WEBSITE_SCHEMA] : []),
      ...(seo.jsonLd ? (Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd]) : []),
    ];

    document.title = seo.title;

    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: seo.type || 'website' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'ro_RO' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: seo.image || DEFAULT_IMAGE });
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: seo.title });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: seo.image || DEFAULT_IMAGE });

    upsertCanonical(canonical);
    upsertJsonLd(jsonLdCollection);
    };

    run();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  return null;
};

export default SeoManager;
