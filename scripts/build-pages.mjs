import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const metadataSlot = '<template id="seo-metadata"></template>';

function escapeMarkup(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function createSeo(siteUrl) {
  if (!siteUrl) throw new Error('SITE_URL must contain the public HTTPS base URL of the site.');
  const baseUrl = new URL(siteUrl);
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new Error('SITE_URL must be an HTTPS URL without credentials, query parameters or fragments.');
  }
  if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';

  const canonical = baseUrl.href;
  const organizationId = new URL('#organization', baseUrl).href;
  const websiteId = new URL('#website', baseUrl).href;
  const socialImage = new URL('assets/images/social-preview.png', baseUrl).href;
  const areaServed = { '@type': 'Place', name: 'Bassa Modenese, Emilia-Romagna, Italia' };
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Tetravise',
        url: canonical,
        email: 'info@tetravise.com',
        description: 'Consulenza operativa, sviluppo software, dati e intelligenza artificiale per le PMI.',
        logo: {
          '@type': 'ImageObject',
          url: new URL('assets/images/tetravise-light-h.svg', baseUrl).href,
          width: 850,
          height: 300,
        },
        image: socialImage,
        areaServed,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Servizi Tetravise',
          itemListElement: ['Analisi dei processi', 'Software su misura', 'Dati e KPI', 'Intelligenza artificiale'].map(name => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name,
              provider: { '@id': organizationId },
              areaServed,
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: canonical,
        name: 'Tetravise',
        inLanguage: 'it-IT',
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': new URL('#webpage', baseUrl).href,
        url: canonical,
        name: 'Tetravise | Consulenza e software nella Bassa Modenese',
        inLanguage: 'it-IT',
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
      },
    ],
  };
  const serializedSchema = JSON.stringify(structuredData).replaceAll('<', String.raw`\u003c`);
  const metadata = [
    `<link rel="canonical" href="${escapeMarkup(canonical)}">`,
    `<meta property="og:url" content="${escapeMarkup(canonical)}">`,
    `<meta property="og:image" content="${escapeMarkup(socialImage)}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Tetravise: consulenza operativa e soluzioni digitali nella Bassa Modenese">',
    `<meta name="twitter:image" content="${escapeMarkup(socialImage)}">`,
    '<meta name="twitter:image:alt" content="Tetravise: consulenza operativa e soluzioni digitali nella Bassa Modenese">',
    `<script type="application/ld+json">${serializedSchema}</script>`,
  ].join('\n  ');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapeMarkup(canonical)}</loc></url>\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', baseUrl).href}\n`;
  return { canonical, metadata, structuredData, sitemap, robots };
}

export async function buildPages({ siteUrl = process.env.SITE_URL, outputDirectory = join(projectDirectory, '_site') } = {}) {
  const seo = createSeo(siteUrl);
  const source = await readFile(join(projectDirectory, 'index.html'), 'utf8');
  if (!source.includes(metadataSlot) || source.indexOf(metadataSlot) !== source.lastIndexOf(metadataSlot)) {
    throw new Error('index.html must contain exactly one SEO metadata template.');
  }

  await mkdir(outputDirectory, { recursive: true });
  await cp(join(projectDirectory, 'assets'), join(outputDirectory, 'assets'), { recursive: true });
  await Promise.all([
    writeFile(join(outputDirectory, 'index.html'), source.replace(metadataSlot, () => seo.metadata)),
    writeFile(join(outputDirectory, 'sitemap.xml'), seo.sitemap),
    writeFile(join(outputDirectory, 'robots.txt'), seo.robots),
  ]);
  return { outputDirectory, ...seo };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildPages();
  console.log(`Static site prepared in ${result.outputDirectory} for ${result.canonical}`);
}