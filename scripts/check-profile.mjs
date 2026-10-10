import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const readme = await readFile(resolve(root, 'README.md'), 'utf8');
const stillSource = readme.split('</picture>')[0].match(/<source\b[^>]*>/)?.[0] ?? '';
assert(/\bsrcset="assets\/still\.svg"/.test(stillSource), 'Still source must be first');
assert(/\bmedia="\(prefers-reduced-motion: reduce\)"/.test(stillSource), 'Still source must select reduced motion');
assert(/\btype="image\/svg\+xml"/.test(stillSource), 'Still source must declare SVG');
const references = [...new Set([...readme.matchAll(/\b(?:src|srcset)="([^"]+)"/g)].map(match => match[1]))];
const heroes = ['assets/day.gif', 'assets/night.gif', 'assets/day.png', 'assets/night.png', 'assets/day.webp', 'assets/night.webp', 'assets/still.svg'];
const variants = new Map();
const animations = new Map();
// The static SVG embeds these exact PNGs and inherits GitHub's displayed color scheme.
const pngs = await Promise.all(['day', 'night'].map(theme => readFile(resolve(root, `assets/${theme}.png`))));
const stillStyle = '.night{display:none}@media(prefers-color-scheme:dark){.day{display:none}.night{display:inline}}';
const expectedStill = `<svg xmlns="http://www.w3.org/2000/svg" width="836" height="471" viewBox="0 0 836 471"><style>${stillStyle}</style><image class="day" width="836" height="471" href="data:image/png;base64,${pngs[0].toString('base64')}"/><image class="night" width="836" height="471" href="data:image/png;base64,${pngs[1].toString('base64')}"/></svg>\n`;
assert.equal(await readFile(resolve(root, 'assets/still.svg'), 'utf8'), expectedStill, 'Still SVG must embed only the exact approved PNGs and fixed theme CSS');
references.push('assets/day.png', 'assets/night.png');
assert(references.length > 0, 'README must reference the profile artwork');

for (const reference of references) {
  const profile = reference.match(/^assets\/profile\/([a-z-]+)-(288|350|550|800)\.svg$/);
  assert(heroes.includes(reference) || profile, `Unsupported asset path: ${reference}`);
  const bytes = await readFile(resolve(root, reference));
  if (profile) {
    const svg = bytes.toString('utf8');
    const styles = [...svg.matchAll(/<style>([^<]*)<\/style>/g)];
    const inkRule = String.raw`\.ink-\d+\{color:rgb\(\d{1,3},\d{1,3},\d{1,3}\)\}`;
    assert.equal(styles.length, 1, `SVG must have one fixed theme palette: ${reference}`);
    assert(new RegExp(`^(?:${inkRule})+@media\\(prefers-color-scheme:dark\\)\\{(?:${inkRule})+\\}$`).test(styles[0][1]), `SVG theme CSS must contain only palette colors: ${reference}`);
    const geometry = svg.replace(styles[0][0], '');
    assert(!/<!DOCTYPE|<!ENTITY|<(?:script|foreignObject|image|style|use|rect)\b|\b(?:[\w:-]*href|on\w+|style)\s*=|url\s*\(|&#/i.test(geometry), `SVG must not contain active or external content: ${reference}`);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'svg', `Artwork format mismatch: ${reference}`);
    const expectedWidth = profile[1].startsWith('contact-') ? Math.round(Number(profile[2]) / 3) : Number(profile[2]);
    assert.equal(metadata.width, expectedWidth, `SVG width mismatch: ${reference}`);
    assert(metadata.height > 0 && metadata.height <= 1200, `Invalid SVG height: ${reference}`);
    const group = variants.get(profile[1]) ?? new Set();
    group.add(profile[2]);
    variants.set(profile[1], group);
  } else {
    // Read animation delays without decoding one tall image of all frames.
    const metadata = await sharp(bytes).metadata();
    const format = reference.split('.').at(-1);
    assert.equal(metadata.format, format, `Artwork format mismatch: ${reference}`);
    assert.equal(metadata.width, 836, `Artwork width mismatch: ${reference}`);
    assert.equal(metadata.pageHeight ?? metadata.height, 471, `Artwork height mismatch: ${reference}`);
    if (format === 'gif' || format === 'webp') {
      assert(bytes.length <= (format === 'webp' ? 6000000 : 8000000), `Hero byte budget exceeded: ${reference}`);
      assert.equal(metadata.pages, 600, `${format.toUpperCase()} frame count mismatch: ${reference}`);
      assert.equal(metadata.loop, 0, `${format.toUpperCase()} must loop forever: ${reference}`);
      assert.equal(metadata.delay.length, 600, `${format.toUpperCase()} delays missing: ${reference}`);
      assert(metadata.delay.every(delay => delay === 40 || delay === 50), `${format.toUpperCase()} frame timing mismatch: ${reference}`);
      assert.equal(metadata.delay.reduce((sum, delay) => sum + delay, 0), 25000, `${format.toUpperCase()} duration mismatch: ${reference}`);
      animations.set(reference, { metadata, bytes: bytes.length });
    } else {
      assert.equal(metadata.pages ?? 1, 1, `Reduced-motion artwork must be still: ${reference}`);
    }
  }
}
for (const hero of heroes) assert(references.includes(hero), `Hero variant missing: ${hero}`);
for (const theme of ['day', 'night']) {
  const webp = animations.get(`assets/${theme}.webp`);
  const gif = animations.get(`assets/${theme}.gif`);
  assert(webp.bytes < gif.bytes, `WEBP must be smaller than GIF fallback: ${theme}`);
  assert.deepEqual(webp.metadata.delay, gif.metadata.delay, `WEBP delays must match GIF fallback: ${theme}`);
}
for (const [name, group] of variants) assert.equal(group.size, 4, `Profile size variants missing: ${name}`);
assert(variants.size > 0, 'README must reference profile sections');
const files = (await readdir(resolve(root, 'assets'))).filter(name => name !== 'profile').map(name => 'assets/' + name);
files.push(...(await readdir(resolve(root, 'assets/profile'))).map(name => 'assets/profile/' + name));
assert.deepEqual(files.sort(), [...references].sort(), 'Published assets must all be referenced by the README');
console.log(`Verified ${references.length} artwork references (including embedded PNGs), ${variants.size} complete profile sections and the GIF/WebP 600-frame, 25-second hero loops.`);
