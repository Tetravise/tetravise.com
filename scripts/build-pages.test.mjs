import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildPages, createSeo } from './build-pages.mjs';

for (const [input, expected] of [
  ['https://tetravise.com', 'https://tetravise.com/'],
  ['https://tetravise.github.io/tetravise.com', 'https://tetravise.github.io/tetravise.com/'],
  ['https://tetravise.com/', 'https://tetravise.com/'],
]) {
  test(`SEO uses the configured public URL: ${input}`, () => {
    const seo = createSeo(input);
    assert.equal(seo.canonical, expected);
    assert.ok(seo.metadata.includes(`rel="canonical" href="${expected}"`));
    assert.ok(seo.metadata.includes(`${expected}assets/images/social-preview.png`));
    assert.ok(seo.sitemap.includes(`<loc>${expected}</loc>`));
    assert.ok(seo.robots.includes(`Sitemap: ${expected}sitemap.xml`));
    const organization = seo.structuredData['@graph'][0];
    assert.equal(organization.url, expected);
    assert.equal(organization.email, 'info@tetravise.com');
    assert.equal(organization.hasOfferCatalog.itemListElement.length, 4);
    assert.equal(organization.logo.url, `${expected}assets/images/tetravise-light-h.svg`);
  });
}

test('SEO rejects missing, insecure or ambiguous canonical URLs', () => {
  for (const invalid of [undefined, '', 'not a URL', 'http://example.com', 'https://user:secret@example.com', 'https://example.com/?ref=preview', 'https://example.com/#team']) {
    assert.throws(() => createSeo(invalid));
  }
});

test('SEO escapes markup without changing structured URL values', () => {
  const seo = createSeo('https://example.com/research&development/');
  assert.ok(seo.metadata.includes('research&amp;development/'));
  assert.ok(seo.sitemap.includes('research&amp;development/'));
  assert.equal(seo.structuredData['@graph'][0].url, 'https://example.com/research&development/');
});

test('The default build uses the official Tetravise domain', async context => {
  const previousSiteUrl = process.env.SITE_URL;
  delete process.env.SITE_URL;
  context.after(() => {
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
  });
  const outputDirectory = await mkdtemp(join(tmpdir(), 'tetravise-domain-'));
  context.after(() => rm(outputDirectory, { recursive: true, force: true }));
  const result = await buildPages({ outputDirectory });
  assert.equal(result.canonical, 'https://tetravise.com/');
  assert.ok(result.metadata.includes('https://tetravise.com/assets/images/social-preview.png'));
  assert.ok(result.sitemap.includes('<loc>https://tetravise.com/</loc>'));
  assert.ok(result.robots.includes('Sitemap: https://tetravise.com/sitemap.xml'));
});

test('The Pages artifact contains the complete site and valid social image', async context => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'tetravise-pages-'));
  context.after(() => rm(outputDirectory, { recursive: true, force: true }));
  const result = await buildPages({ siteUrl: 'https://example.com/research$&development/', outputDirectory });
  const html = await readFile(join(outputDirectory, 'index.html'), 'utf8');
  assert.ok(html.includes(result.metadata));
  assert.ok(!html.includes('<template id="seo-metadata"></template>'));
  assert.ok(html.includes('<h3>Alex Mengoli</h3>'));
  assert.ok(html.includes('<p class="role">Front-End / Cloud Developer</p>'));
  assert.ok(html.includes('href="https://www.linkedin.com/in/alex-mengoli" target="_blank" rel="noopener noreferrer"'));
  assert.ok(html.includes('<h3>Giovanni Cioli Puviani</h3>'));
  assert.ok(html.includes('<p class="role">Head of Sales</p>'));
  assert.ok(html.includes("<p class=\"bio\">Guido lo sviluppo commerciale della startup unendo una formazione in Finanza Quantitativa all'esperienza nell'analisi dei mercati energetici e commodity per realt\u00e0 multinazionali. Trasformo dati e dinamiche di mercato complesse in dashboard e soluzioni digitali su misura, affiancando le PMI in un percorso continuo di ottimizzazione e crescita.</p>"));
  assert.ok(html.includes('src="assets/images/giovanni-cioli-puviani.webp" alt="Giovanni Cioli Puviani"'));
  assert.ok(html.includes('href="https://www.linkedin.com/in/giovanniciolipuviani/" target="_blank" rel="noopener noreferrer"'));
  assert.ok(html.includes('<h3>Riccardo Siena</h3>'));
  assert.ok(html.includes('<p class="role">Operations &amp; Performance Consultant</p>'));
  assert.ok(html.includes("Analizzo processi, performance e dati aziendali per individuare ciò che rallenta la crescita. Connetto operations e tecnologia per trasformare informazioni in processi e decisioni migliori."));
  assert.ok(html.includes('src="assets/images/riccardo-siena.webp" alt="Riccardo Siena"'));
  assert.ok(html.includes('href="https://www.linkedin.com/in/riccardo-siena-59439b2a1/" target="_blank" rel="noopener noreferrer"'));
  assert.equal(html.split('class="linkedin-link"').length - 1, 4);
  assert.equal(html.split('class="linkedin-link" type="button" disabled').length - 1, 0);
  assert.ok(html.includes('href="https://www.linkedin.com/in/azmihamdi/" target="_blank" rel="noopener noreferrer"'));
  assert.ok(html.includes('<a class="back-to-top" href="#top"'));
  assert.deepEqual((await readdir(outputDirectory)).sort(), ['assets', 'index.html', 'robots.txt', 'sitemap.xml']);
  assert.equal(await readFile(join(outputDirectory, 'robots.txt'), 'utf8'), result.robots);
  assert.equal(await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8'), result.sitemap);
  for (const asset of ['tetravise-light-h.svg', 'tetravise-dark-h.svg', 'social-preview.png', 'alex-mengoli.webp', 'giovanni-cioli-puviani.webp', 'riccardo-siena.webp']) {
    assert.ok((await stat(join(outputDirectory, 'assets', 'images', asset))).size > 0);
  }
  const preview = await readFile(join(outputDirectory, 'assets', 'images', 'social-preview.png'));
  assert.equal(preview.subarray(1, 4).toString(), 'PNG');
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
});
