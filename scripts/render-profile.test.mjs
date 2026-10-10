import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';

async function renderer() {
  try { return await import('./render-profile.mjs'); }
  catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') assert.fail('Profile renderer is not implemented');
    throw error;
  }
}

test('renders the existing A glyph as explicit marks at the requested cell size', async () => {
  const {glyphText} = await renderer();
  const glyph = glyphText('A', 2);
  assert.equal(glyph.width, 10);
  assert.equal(glyph.height, 14);
  assert.equal([...glyph.svg.matchAll(/<circle\b/g)].length, 18);
  const {data,info} = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="14">${glyph.svg}</svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha = (x,y) => data[(y*info.width+x)*info.channels+3];
  assert.equal(alpha(0,0), 0, 'The upper-left corner of A is empty');
  assert(alpha(4,0) > 0, 'The top bar of A is visible');
  assert(alpha(4,6) > 0, 'The middle bar of A is visible');
  assert.equal(alpha(4,10), 0, 'The lower middle of A stays open');
});

test('wraps whole words at the exact measured width boundary', async () => {
  const {wrapWords} = await renderer();
  assert.deepEqual(wrapWords('AI AI', 58, 2), ['AI AI']);
  assert.deepEqual(wrapWords('AI AI', 57, 2), ['AI','AI']);
  assert.deepEqual(wrapWords(' AI  AI ', 22, 2), ['AI','AI']);
});

test('rejects unsupported glyphs instead of silently omitting them', async () => {
  const {glyphText} = await renderer();
  assert.throws(() => glyphText('AI 💥', 2), /Unsupported glyph/);
});

test('rejects a word that cannot fit the target column', async () => {
  const {wrapWords} = await renderer();
  assert.throws(() => wrapWords('AI', 21, 2), /Word does not fit/);
});

test('rejects invalid rendering dimensions', async () => {
  const {glyphText,wrapWords} = await renderer();
  assert.throws(() => glyphText('AI', 0), /Cell size/);
  assert.throws(() => wrapWords('AI', 0, 2), /Column width/);
});

test('exports every profile layout without ink outside its canvas', async () => {
  const {buildProfile} = await renderer();
  assert.equal(typeof buildProfile, 'function', 'Profile export generation is not implemented');
  const content = JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  const files = buildProfile(content);
  const svgs = [...files].filter(([name]) => name.endsWith('.svg'));
  assert.equal(svgs.length, 36);
  for (const [name,svg] of svgs) {
    const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    assert(box, `Missing local canvas: ${name}`);
    const width = Number(box[1]), height = Number(box[2]);
    const expanded = svg.replace(/width="[^"]+" height="[^"]+" viewBox="[^"]+"/,`width="${width+40}" height="${height+40}" viewBox="-20 -20 ${width+40} ${height+40}"`);
    const {data,info} = await sharp(Buffer.from(expanded)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let ink = 0;
    for (let y=0;y<info.height;y++) for (let x=0;x<info.width;x++) {
      const alpha = data[(y*info.width+x)*info.channels+3];
      if (!alpha) continue;
      ink++;
      assert(x>=20 && x<20+width && y>=20 && y<20+height, `Clipped ink in ${name} at ${x},${y}`);
    }
    assert(ink>0, `Empty export: ${name}`);
  }
});

test('regenerates identical profile bytes from the same reviewed content', async () => {
  const {buildProfile} = await renderer();
  assert.equal(typeof buildProfile, 'function', 'Profile export generation is not implemented');
  const content = JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  assert.deepEqual([...buildProfile(content)], [...buildProfile(content)]);
});

test('published profile files match their reproducible source', async () => {
  const {buildProfile} = await renderer();
  const content = JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  for (const [name,data] of buildProfile(content)) {
    assert((await readFile(new URL('../'+name,import.meta.url),'utf8'))===data,`Run npm run render:profile: ${name}`);
  }
});

test('body marks stay at least 12px tall in the measured narrow columns', async () => {
  const {buildProfile} = await renderer();
  const content = JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  const files = buildProfile(content);
  for (const [size,column] of [[288,238],[350,308],[550,430],[800,846]]) {
    const svg=files.get(`assets/profile/stack-${size}.svg`);
    const body=svg.match(/<g fill="currentColor" class="ink-2"[^>]*>(.*?)<\/g>/)[1];
    const ys=[...body.matchAll(/cy="([\d.]+)"/g)].map(match=>Number(match[1]));
    const radius=Number(body.match(/r="([\d.]+)"/)[1]);
    assert((Math.max(...ys)-Math.min(...ys)+2*radius)*column/size>=12,`Body too small at ${column}px`);
  }
});

test('graphical and native profiles share the same copy and destinations', async () => {
  const {buildProfile}=await renderer();
  const content=JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  const files=buildProfile(content), readme=files.get('README.md'), native=files.get('docs/profile.md');
  assert(native,'A permanent native text/static profile is required');
  for (const text of [content.name,content.role,content.focus,...content.projects.flatMap(p=>[p.name,p.description,p.detail])]) {
    assert(native.includes(text),`Missing native copy: ${text}`);
    assert(readme.includes(text.replaceAll('&','&amp;')),`Missing graphical alternative: ${text}`);
  }
  for (const item of [...content.projects,...content.contacts].filter(item=>item.url)) {
    assert(native.includes(item.url)); assert(readme.includes(item.url));
  }
  assert(native.includes('../assets/still.svg'));
  assert(!/\.gif|\.webp/.test(native),'The static reading route must not load animation');
  assert(readme.indexOf('assets/profile/certkit-')<readme.indexOf('assets/profile/stack-'));
  assert.doesNotMatch(readme,/static profile|Artwork & skill/,'The README must not link the retired docs footer');
});

test('marks the linked project and every contact with the shared dotted arrow', async () => {
  const {buildProfile} = await renderer();
  const content = JSON.parse(await readFile(new URL('../profile/content.json',import.meta.url),'utf8'));
  const files = buildProfile(content);
  const expected = ['0,6','1,5','2,0','2,4','3,0','3,3','4,0','4,2','5,0','5,1','6,0','6,1','6,2','6,3'];
  const arrows = svg => [...svg.matchAll(/<g\b[^>]*>((?:<circle\b[^>]*\/>)+)<\/g>/g)]
    .map(group => [...group[1].matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map(match => [+match[1],+match[2]]))
    .filter(points => {
      if (points.length !== 14) return false;
      const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys), cell = (Math.max(...xs)-minX)/6;
      const pattern = new Set(points.map(([x,y]) => `${Math.round((x-minX)/cell)},${Math.round((y-minY)/cell)}`));
      return pattern.size === 14 && expected.every(point => pattern.has(point));
    });
  const linked = ['assets/profile/certkit-800.svg',...content.contacts.map(contact => `assets/profile/contact-${contact.label.toLowerCase()}-800.svg`)];
  for (const name of linked) assert.equal(arrows(files.get(name)).length,1,`Missing ↗ in ${name}`);
  for (const [name,svg] of files) if (name.endsWith('-800.svg') && !linked.includes(name)) assert.equal(arrows(svg).length,0,`Unexpected ↗ in ${name}`);
});
