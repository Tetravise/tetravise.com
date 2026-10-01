import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildPages, createSeo } from './build-pages.mjs';

for (const [input, expected] of [
  ['https://example.github.io', 'https://example.github.io/'],
  ['https://example.github.io/tetravise', 'https://example.github.io/tetravise/'],
  ['https://www.example.com/', 'https://www.example.com/'],
]) {
  test(`SEO uses the deployment base URL: ${input}`, () => {
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
  assert.equal(html.split('class="linkedin-link"').length - 1, 4);
  assert.equal(html.split('class="linkedin-link" type="button" disabled').length - 1, 3);
  assert.ok(html.includes('<a class="back-to-top" href="#top"'));
  assert.deepEqual((await readdir(outputDirectory)).sort(), ['assets', 'index.html', 'robots.txt', 'sitemap.xml']);
  assert.equal(await readFile(join(outputDirectory, 'robots.txt'), 'utf8'), result.robots);
  assert.equal(await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8'), result.sitemap);
  for (const asset of ['tetravise-light-h.svg', 'tetravise-dark-h.svg', 'favicon.svg', 'social-preview.png', 'alex-mengoli.jpg']) {
    assert.ok((await stat(join(outputDirectory, 'assets', 'images', asset))).size > 0);
  }
  const preview = await readFile(join(outputDirectory, 'assets', 'images', 'social-preview.png'));
  assert.equal(preview.subarray(1, 4).toString(), 'PNG');
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
});