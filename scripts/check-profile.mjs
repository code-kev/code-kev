import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const readme = await readFile(resolve(root, 'README.md'), 'utf8');
const references = [...new Set([...readme.matchAll(/\b(?:src|srcset)="([^"]+)"/g)].map(match => match[1]))];
const heroes = ['assets/day.gif', 'assets/night.gif', 'assets/day.png', 'assets/night.png'];
const variants = new Map();
assert(references.length > 0, 'README must reference the profile artwork');

for (const reference of references) {
  const profile = reference.match(/^assets\/profile\/([a-z-]+)-(288|350|800)-(day|night)\.svg$/);
  assert(heroes.includes(reference) || profile, `Unsupported asset path: ${reference}`);
  const bytes = await readFile(resolve(root, reference));
  if (profile) {
    const svg = bytes.toString('utf8');
    assert(!/<!DOCTYPE|<!ENTITY|<(?:script|foreignObject|image|style|use|rect)\b|\b(?:[\w:-]*href|on\w+|style)\s*=|url\s*\(|&#/i.test(svg), `SVG must not contain active or external content: ${reference}`);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'svg', `Artwork format mismatch: ${reference}`);
    const expectedWidth = profile[1].startsWith('contact-') ? Math.round(Number(profile[2]) / 3) : Number(profile[2]);
    assert.equal(metadata.width, expectedWidth, `SVG width mismatch: ${reference}`);
    assert(metadata.height > 0 && metadata.height <= 1200, `Invalid SVG height: ${reference}`);
    const group = variants.get(profile[1]) ?? new Set();
    group.add(profile[2] + '-' + profile[3]);
    variants.set(profile[1], group);
  } else {
    // Metadata includes every GIF delay without decoding one tall image of all frames.
    const metadata = await sharp(bytes).metadata();
    const format = reference.endsWith('.gif') ? 'gif' : 'png';
    assert.equal(metadata.format, format, `Artwork format mismatch: ${reference}`);
    assert.equal(metadata.width, 1672, `Artwork width mismatch: ${reference}`);
    assert.equal(metadata.pageHeight ?? metadata.height, 941, `Artwork height mismatch: ${reference}`);
    if (format === 'gif') {
      assert.equal(metadata.pages, 600, `GIF frame count mismatch: ${reference}`);
      assert.equal(metadata.loop, 0, `GIF must loop forever: ${reference}`);
      assert.equal(metadata.delay.length, 600, `GIF delays missing: ${reference}`);
      assert(metadata.delay.every(delay => delay === 40 || delay === 50), `GIF frame timing mismatch: ${reference}`);
      assert.equal(metadata.delay.reduce((sum, delay) => sum + delay, 0), 25000, `GIF duration mismatch: ${reference}`);
    } else {
      assert.equal(metadata.pages ?? 1, 1, `Reduced-motion PNG must be still: ${reference}`);
    }
  }
}
for (const hero of heroes) assert(references.includes(hero), `Hero variant missing: ${hero}`);
for (const [name, group] of variants) assert.equal(group.size, 6, `Profile theme/size variants missing: ${name}`);
assert(variants.size > 0, 'README must reference profile sections');
const files = (await readdir(resolve(root, 'assets'))).filter(name => name !== 'profile').map(name => 'assets/' + name);
files.push(...(await readdir(resolve(root, 'assets/profile'))).map(name => 'assets/profile/' + name));
assert.deepEqual(files.sort(), [...references].sort(), 'Published assets must all be referenced by the README');
console.log(`Verified ${references.length} README image references, ${variants.size} complete profile sections and both 600-frame, 25-second hero loops.`);
