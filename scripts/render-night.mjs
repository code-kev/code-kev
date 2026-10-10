import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const width = 836, height = 471, frameSize = width * height;
const sourceSha = 'abb101070d10a7d9e83de40f22ba58d3a4756a720e6d156f8bc815c2119ea06f';
const clamp = value => Math.max(0, Math.min(1, value));
const headSvg = await readFile(new URL('../profile/developer-head.svg', import.meta.url), 'utf8');
const headPixels = [];
const gain = new Float32Array(frameSize);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const gx = (x + .5) * 240 / width, gy = (y + .5) * 135 / height;
  let light = 1;
  if (gx >= 100 && gx <= 224 && gy >= 18 && gy <= 81) light = .65;
  if (gx <= 75 && gy >= 68) {
    light = .35 + .65 * Math.exp(-(((gx - 85) / 50) ** 2) - ((gy - 90) / 30) ** 2);
  }
  if (gx >= 75 && gx <= 227 && gy >= 96) {
    light = .22 + .78 * Math.exp(-(((gx - 104) / 62) ** 2) - ((gy - 103) / 23) ** 2);
  }
  if (gx >= 20 && gx <= 66 && gy >= 34 && gy <= 70 &&
      !(gx >= 25 && gx < 27 && gy >= 65 && gy < 68)) {
    headPixels.push({ index: y * width + x, x: gx, y: gy, light: .18 + .82 * clamp((gx - 27) / 39) ** 2 });
  }
  if (gx >= 148 && gx <= 184 && gy >= 79 && gy <= 104) {
    light = clamp(.45 + .5 * Math.exp(-(((gx - 150) / 22) ** 2)) + .3 * Math.exp(-(((gx - 183) / 3) ** 2)));
  }
  // The left rail ends behind the developer; a full-height strip would also exempt the head and chair.
  const leftRail = gx >= 17 && gx <= 27 && gy < 72 &&
    (gx < 20 || gy < 34 || (gx >= 25 && gy >= 65 && gy <= 68));
  if (gy < 18 || leftRail || (gx >= 227 && gx <= 234) ||
      (gx >= 75 && gx <= 137 && gy >= 49 && gy <= 96)) light = 1;
  gain[y * width + x] = light;
}

const tone = (value, light) => Math.max(1, Math.min(value, Math.round(value * light / 8) * 8));

export async function applyNightLighting(pixels, frame = 0) {
  assert(pixels instanceof Uint8Array && pixels.length === frameSize, 'Expected an 836 × 471 grayscale frame');
  assert(Number.isInteger(frame) && frame >= 0 && frame < 600, 'Invalid head-motion frame: expected 0 to 599');
  const result = Buffer.from(pixels);
  for (let i = 0; i < frameSize; i++) {
    if (pixels[i] && gain[i] < 1) {
      // A small fixed gray palette keeps the lighting pass compressible without dithering.
      result[i] = tone(pixels[i], gain[i]);
    }
  }
  const angle = frame === 0 || frame === 599 ? 0 : .65 * Math.sin(2 * Math.PI * 10 * frame / 599);
  const nativeHead = await sharp(Buffer.from(headSvg.replace('rotate(0 46 70)', `rotate(${angle} 46 70)`))).png().toBuffer();
  // Positive linear weights avoid ringing falsely classifying neighboring background dots as head marks.
  const coverage = await sharp(nativeHead).flatten({ background: '#000' })
    .resize(width, height, { fit: 'fill', kernel: 'linear' }).toColourspace('b-w').raw().toBuffer();
  for (const pixel of headPixels) {
    if (pixels[pixel.index] && coverage[pixel.index]) result[pixel.index] = tone(pixels[pixel.index], pixel.light);
  }
  return result;
}

function launch(command, args) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data; });
  const done = new Promise(resolve => {
    child.once('error', error => resolve({ error }));
    child.once('close', code => resolve({ code, stderr }));
  });
  return { child, done };
}

async function run(command, args) {
  const { child, done } = launch(command, args);
  child.stdout.resume();
  const result = await done;
  if (result.error) throw result.error;
  assert.equal(result.code, 0, `${command}: ${result.stderr}`);
}

async function* frames(input, channels = 1) {
  const { child, done } = launch('ffmpeg', ['-v', 'error', '-i', input, '-map', '0:v:0',
    '-fps_mode', 'passthrough', '-pix_fmt', channels === 1 ? 'gray' : 'rgba', '-f', 'rawvideo', 'pipe:1']);
  const size = frameSize * channels;
  let pending = Buffer.alloc(0);
  try {
    for await (const chunk of child.stdout) {
      pending = Buffer.concat([pending, chunk]);
      while (pending.length >= size) {
        yield pending.subarray(0, size);
        pending = pending.subarray(size);
      }
    }
    const result = await done;
    if (result.error) throw result.error;
    assert.equal(result.code, 0, `ffmpeg: ${result.stderr}`);
    assert.equal(pending.length, 0, 'Incomplete decoded frame');
  } finally {
    if (child.exitCode === null) child.kill();
    await done;
  }
}

async function render(input, output) {
  assert.equal(createHash('sha256').update(await readFile(input)).digest('hex'), sourceSha,
    'Expected the approved compact night GIF built from the polished masters');
  const source = await sharp(input, { animated: true }).metadata();
  assert.equal(source.width, width);
  assert.equal(source.pageHeight, height);
  assert.equal(source.pages, 600);
  assert.equal(source.delay.reduce((sum, value) => sum + value, 0), 25000);
  assert.equal(source.loop, 0);
  assert.notEqual(path.resolve(input), path.resolve(output, 'night.gif'), 'Output must not overwrite the source');
  await mkdir(output); // Require a fresh directory so an earlier candidate is never overwritten.
  const pngDir = path.join(output, 'frames');
  await mkdir(pngDir);
  let count = 0;
  for await (const frame of frames(input)) {
    await sharp(await applyNightLighting(frame, count), { raw: { width, height, channels: 1 } })
      .png().toFile(path.join(pngDir, `${String(count++).padStart(4, '0')}.png`));
  }
  assert.equal(count, 600);
  console.log('Rendered 600 registered lighting frames');
  const gif = path.join(output, 'night.gif'), webp = path.join(output, 'night.webp');
  await run('ffmpeg', ['-v', 'error', '-framerate', '24', '-i', path.join(pngDir, '%04d.png'),
    '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none',
    '-gifflags', '+offsetting+transdiff', '-loop', '0', path.join(output, 'encoded.gif')]);
  await run('gifsicle', ['--conserve-memory', '-O3', '-Okeep-empty', path.join(output, 'encoded.gif'), '-o', gif]);
  await run('gif2webp', ['-min_size', '-q', '75', '-m', '4', '-mt', gif, '-o', webp]);
  const sizes = {};
  for (const [file, limit] of [[gif, 8_000_000], [webp, 6_000_000]]) {
    const metadata = await sharp(file, { animated: true }).metadata();
    assert.equal(metadata.width, width);
    assert.equal(metadata.pageHeight, height);
    assert.equal(metadata.pages, 600);
    assert.equal(metadata.loop, source.loop);
    assert.deepEqual(metadata.delay, source.delay, 'Timing changed');
    sizes[path.basename(file)] = (await readFile(file)).length;
    assert(sizes[path.basename(file)] <= limit, `${file} exceeds its delivery budget`);
  }
  assert(sizes['night.webp'] < sizes['night.gif']);
  console.log('Checking every decoded frame against the registered lighting pass');
  const reference = frames(input)[Symbol.asyncIterator]();
  count = 0;
  try {
    for await (const frame of frames(gif)) {
      const original = await reference.next();
      assert(!original.done && frame.equals(await applyNightLighting(original.value, count)), `Lighting differs at frame ${count}`);
      count++;
    }
    assert((await reference.next()).done);
    assert.equal(count, 600);
  } finally { await reference.return(); }
  const gifFrames = frames(gif, 4)[Symbol.asyncIterator]();
  count = 0;
  try {
    for await (const frame of frames(webp, 4)) {
      const expected = await gifFrames.next();
      assert(!expected.done && frame.equals(expected.value), `WebP differs at frame ${count}`);
      count++;
    }
    assert((await gifFrames.next()).done);
    assert.equal(count, 600);
  } finally { await gifFrames.return(); }
  await sharp(gif, { page: 204, pages: 1 }).toColourspace('b-w').png({ compressionLevel: 9 })
    .toFile(path.join(output, 'night.png'));
  await writeFile(path.join(output, 'verification.json'), JSON.stringify({ sourceSha, width, height,
    frames: count, durationMs: 25000, posterFrame: 204, sizes, mappedGifPixelsExact: true,
    webpPixelsExact: true }, null, 2) + '\n');
  console.log(JSON.stringify({ verified: true, frames: count, sizes }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 4, 'Usage: node scripts/render-night.mjs SOURCE.gif NEW_OUTPUT_DIRECTORY');
    await render(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
