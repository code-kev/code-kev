import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const WIDTH = 1672, HEIGHT = 941, FPS = 12, FRAMES = 24;
const FFMPEG = 'ffmpeg';
const FFPROBE = 'ffprobe';
const HEAD_BOX = { left: 148, top: 125, width: 328, height: 317 };
const PIVOT = { x: 360, y: 423 };
const PATCH = 'M140 120 H480 V365 L448 395 L420 423 L360 438 L310 405 L270 388 L140 365 Z';
const THEMES = ['day', 'night'];

function svgFrame(theme, head, frame) {
  const t = frame / FPS;
  const beat = Math.sin(2 * Math.PI * t / 2);
  const angle = (0.9 * beat).toFixed(3);
  const bob = (1.2 * Math.sin(2 * Math.PI * t / 2 - Math.PI / 2)).toFixed(3);
  const x = HEAD_BOX.left + (HEAD_BOX.width - head.width) / 2;
  const y = HEAD_BOX.top + (HEAD_BOX.height - head.height) / 2 + Number(bob);
  const ink = theme === 'day' ? '#000' : '#fff';
  const note = (p, x, y) => {
    if (p < 0 || p > 1) return '';
    const fade = 0.65 * Math.sin(Math.PI * p) ** 1.4;
    const rise = (18 * p).toFixed(2);
    const opacity = Math.max(0, fade).toFixed(2);
    return `<g transform="translate(${x} ${y - rise})" opacity="${opacity}" fill="${ink}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="0" cy="0" rx="4.2" ry="2.8" transform="rotate(-24)"/><path d="M4 -1 V-17 Q13 -13 9 -6" fill="none"/></g>`;
  };
  const notes = note((t % 2) / 1.25, 412, 112) +
    note((((t - 0.65) % 2) + 2) % 2 / 1.25, 452, 137);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <image href="data:image/png;base64,${head.data}" x="${x}" y="${y}" width="${head.width}" height="${head.height}"
      transform="rotate(${angle} ${PIVOT.x} ${PIVOT.y})"/>
    ${notes}
  </svg>`;
}

async function prepare(theme) {
  const asset = (name) => join(ROOT, name ? 'artwork/layers' : 'assets', `${theme}${name}.png`);
  for (const path of [asset(''), asset('-plate'), asset('-head')]) {
    try { await readFile(path); } catch { throw new Error(`Missing layer asset: ${path}`); }
  }
  const original = await readFile(asset(''));
  const plate = await readFile(asset('-plate'));
  const headPng = await readFile(asset('-head'));
  for (const [name, image] of [['scene', original], ['plate', plate]]) {
    const { width, height } = await sharp(image).metadata();
    if (width !== WIDTH || height !== HEIGHT) throw new Error(`${asset(name === 'scene' ? '' : '-plate')} must be ${WIDTH}x${HEIGHT}`);
  }
  const { data, info } = await sharp(headPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let yy = 0; yy < info.height; yy++) for (let xx = 0; xx < info.width; xx++) {
    if (data[(yy * info.width + xx) * info.channels + 3] > 32) {
      left = Math.min(left, xx); top = Math.min(top, yy); right = Math.max(right, xx); bottom = Math.max(bottom, yy);
    }
  }
  if (right < left) throw new Error(`${asset('-head')} has no visible pixels`);
  if (right - left > WIDTH * 0.6 || bottom - top > HEIGHT * 0.6) throw new Error(`${theme}: transparent fringe expanded the head bounds beyond the subject`);
  const cropped = await sharp(headPng).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toBuffer();
  const ratio = Math.min(HEAD_BOX.width / (right - left + 1), HEAD_BOX.height / (bottom - top + 1));
  const resized = await sharp(cropped).resize({ width: Math.round((right - left + 1) * ratio), height: Math.round((bottom - top + 1) * ratio) }).png().toBuffer();
  const meta = await sharp(resized).metadata();
  const plateOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><defs><clipPath id="patch"><path d="${PATCH}"/></clipPath></defs><image href="data:image/png;base64,${plate.toString('base64')}" width="${WIDTH}" height="${HEIGHT}" clip-path="url(#patch)"/></svg>`);
  const scene = await sharp(original).composite([{ input: plateOverlay }]).png().toBuffer();
  return { original, scene, head: { data: resized.toString('base64'), width: meta.width, height: meta.height } };
}

async function render(theme, check) {
  const { original, scene, head } = await prepare(theme);
  const dir = join(ROOT, 'tmp', 'animation-frames', theme);
  const preview = join(ROOT, 'tmp', 'animation-preview');
  await mkdir(dir, { recursive: true }); await mkdir(preview, { recursive: true });
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const overlay = Buffer.from(svgFrame(theme, head, i));
    const png = await sharp(scene).composite([{ input: overlay }]).png().toBuffer();
    const path = join(dir, `frame-${String(i).padStart(3, '0')}.png`);
    await writeFile(path, png);
    if (check) frames.push(png);
    if (i === 18) await writeFile(join(preview, `${theme}-sample.png`), png);
  }
  const palette = join(dir, 'palette.png');
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(dir, 'frame-%03d.png'), '-frames:v', String(FRAMES), '-vf', 'palettegen=max_colors=64:stats_mode=full', palette]);
  const output = join(ROOT, 'assets', `${theme}.gif`);
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(dir, 'frame-%03d.png'), '-i', palette, '-lavfi', 'paletteuse=dither=none', '-frames:v', String(FRAMES), '-gifflags', '+offsetting+transdiff', '-loop', '0', output]);
  if (check) await verify(theme, output, original, frames);
}

async function verify(theme, gif, original, frames) {
  const probe = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'json', gif], { encoding: 'utf8' }));
  const stream = probe.streams?.[0];
  if (!stream || stream.width !== WIDTH || stream.height !== HEIGHT || Number(stream.nb_read_frames) !== FRAMES) throw new Error(`${theme}: GIF dimensions/frame count failed`);
  const bytes = await readFile(gif);
  if (!bytes.includes(Buffer.from('NETSCAPE2.0')) || !bytes.includes(Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]))) throw new Error(`${theme}: GIF does not loop forever`);
  const shelf = { left: 1115, top: 0, width: WIDTH - 1115, height: HEIGHT };
  const pixels = await Promise.all([0, Math.floor(FRAMES / 4), Math.floor(FRAMES / 2)].map(async (i) => sharp(frames[i]).extract(shelf).removeAlpha().raw().toBuffer()));
  const sourcePixel = await sharp(original).extract(shelf).removeAlpha().raw().toBuffer();
  if (pixels.some(pixel => !pixel.equals(sourcePixel))) throw new Error(`${theme}: stationary bookshelf changed`);
  const decoded = await Promise.all([0, Math.floor(FRAMES / 4), Math.floor(FRAMES / 2)].map(page => sharp(gif, { page, pages: 1 }).extract(shelf).removeAlpha().raw().toBuffer()));
  if (decoded.some(pixel => !pixel.equals(decoded[0]))) throw new Error(`${theme}: encoded GIF bookshelf flickers`);
  const headFrames = await Promise.all([0, 18].map(i => sharp(frames[i]).extract({ left: 150, top: 160, width: 240, height: 200 }).raw().toBuffer()));
  const differs = Buffer.compare(headFrames[0], headFrames[1]) !== 0;
  if (!differs) throw new Error(`${theme}: expected head/note motion was not rendered`);
  console.log(`${theme}: ${stream.width}x${stream.height}, ${stream.nb_read_frames} frames, looping, motion and stationary bookshelf verified`);
}

const args = process.argv.slice(2);
const themeArg = args.find(arg => arg.startsWith('--theme='))?.slice(8);
const themeIndex = args.indexOf('--theme');
const theme = themeArg ?? (themeIndex >= 0 ? args[themeIndex + 1] : undefined);
const check = args.includes('--check');
if (theme && !THEMES.includes(theme)) throw new Error('--theme must be day or night');
for (const item of theme ? [theme] : THEMES) await render(item, check);
