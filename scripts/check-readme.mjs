import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const readme = await readFile(resolve(root, 'README.md'), 'utf8');
const references = [...readme.matchAll(/\b(?:src|srcset)="([^"]+)"/g)].map(match => match[1]);
assert(references.length > 0, 'README must reference the profile artwork');

for (const reference of references) {
  const file = resolve(root, reference);
  assert(file.startsWith(resolve(root) + sep), `Artwork path escapes the repository: ${reference}`);
  const format = extname(file).slice(1);
  assert(['png', 'gif'].includes(format), `Unsupported artwork format: ${reference}`);
  const metadata = await sharp(await readFile(file), { animated: true }).metadata();
  assert.equal(metadata.format, format, `Artwork format mismatch: ${reference}`);
  assert.equal(metadata.width, 1672, `Artwork width mismatch: ${reference}`);
  assert.equal(metadata.pageHeight ?? metadata.height, 941, `Artwork height mismatch: ${reference}`);
  if (format === 'gif') {
    assert.equal(metadata.pages, 24, `GIF frame count mismatch: ${reference}`);
    assert.equal(metadata.loop, 0, `GIF must loop forever: ${reference}`);
    assert.equal(metadata.delay.reduce((sum, delay) => sum + delay, 0), 2000, `GIF duration mismatch: ${reference}`);
  }
}

console.log(`Verified ${references.length} README image references and published artwork metadata.`);
