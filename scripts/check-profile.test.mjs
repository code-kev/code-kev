import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,cp,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
const root=fileURLToPath(new URL('..',import.meta.url));
test('accepts the published SVGs and 600-frame animations',()=>{
  assert.match(execFileSync(process.execPath,['scripts/check-profile.mjs'],{cwd:root,encoding:'utf8'}),/Verified 43/);
});
async function fixture(context){
  await mkdir(join(root,'tmp'),{recursive:true});
  const dir=await mkdtemp(join(root,'tmp','profile-check-'));
  context.after(()=>rm(dir,{recursive:true,force:true}));
  await cp(join(root,'assets'),join(dir,'assets'),{recursive:true});
  await copyFile(join(root,'README.md'),join(dir,'README.md'));
  await mkdir(join(dir,'scripts'));
  await copyFile(join(root,'scripts/check-profile.mjs'),join(dir,'scripts/check-profile.mjs'));
  await writeFile(join(dir,'package.json'),'{"type":"module"}\n');
  return dir;
}
function reject(dir,message){
  const result=spawnSync(process.execPath,['scripts/check-profile.mjs'],{cwd:dir,encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,message);
}
test('rejects a README path outside the published asset folders',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  await writeFile(file,(await readFile(file,'utf8')).replace('src="assets/day.gif"','src="../private.gif"'));
  reject(dir,/Unsupported asset path: \.\.\/private\.gif/);
});
test('rejects an image referenced by the README that is missing',async context=>{
  const dir=await fixture(context);
  await rm(join(dir,'assets/profile/identity-800.svg'));
  reject(dir,/ENOENT.*identity-800\.svg/);
});
test('rejects executable or external SVG content',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-800.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('</svg>','<script>alert(1)</script></svg>'));
  reject(dir,/SVG must not contain active or external content/);
});
test('rejects an SVG paint attribute that loads an external resource',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-800.svg');
  const original=await readFile(file,'utf8');
  for(const fill of ['url(https://example.com/paint.svg#ink)','u&#114;l(https://example.com/paint.svg#ink)']){
    await writeFile(file,original.replace('<g fill="','<g fill="'+fill+'" data-old-fill="'));
    reject(dir,/SVG must not contain active or external content/);
  }
});
test('rejects an SVG exported with the wrong size for its filename',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-288.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('width="288"','width="800"'));
  reject(dir,/SVG width mismatch/);
});
test('rejects a missing mobile variant even if its reference is removed',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  await writeFile(file,(await readFile(file,'utf8')).replace(/<source\b[^>]*srcset="assets\/profile\/identity-288.svg"[^>]*>/,''));
  await rm(join(dir,'assets/profile/identity-288.svg'));
  reject(dir,/Profile size variants missing: identity/);
});
test('rejects replacement artwork with the wrong frame count',async context=>{
  const dir=await fixture(context);
  await sharp({create:{width:836,height:471,channels:3,background:'#fff'}}).gif().toFile(join(dir,'assets/day.gif'));
  reject(dir,/GIF frame count mismatch/);
});

test('rejects a hero animation using the retired full-size canvas',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/day.gif');
  const bytes=await readFile(file);
  bytes.writeUInt16LE(1672,6);bytes.writeUInt16LE(941,8);
  await writeFile(file,bytes);
  reject(dir,/Artwork width mismatch/);
});

test('contact images have balanced vertical touch padding',async()=>{
  for(const size of [288,350,550,800])for(const name of ['email','linkedin','github']){
    const image=sharp(join(root,`assets/profile/contact-${name}-${size}.svg`));
    const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let top=info.height,bottom=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*info.channels+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}
    assert(bottom>=top,'Contact lettering must be visible');
    assert(Math.abs(top-(info.height-bottom-1))<=1,`Unbalanced contact padding: ${name}-${size}, top ${top}, bottom ${info.height-bottom-1}`);
  }
});

test('hero prefers WebP for both themes after the reduced-motion still',async()=>{
  const hero=(await readFile(join(root,'README.md'),'utf8')).split('</picture>')[0];
  const sources=[...hero.matchAll(/<source\b[^>]*srcset="([^"]+)"[^>]*>/g)];
  assert.deepEqual(sources.map(s=>s[1]),['assets/still.svg','assets/night.webp','assets/day.webp','assets/night.gif']);
  for(const source of sources.slice(1,3))assert.match(source[0],/type="image\/webp"/);
  assert.match(sources[1][0],/prefers-color-scheme: dark/);
  assert.match(sources[2][0],/prefers-color-scheme: light/);
  assert.match(hero,/<img src="assets\/day.gif"/);
});

test('rejects a still source without the reduced-motion condition',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  const original=await readFile(file,'utf8');
  for(const media of ['', 'media="(prefers-reduced-motion: no-preference)" ']){
    await writeFile(file,original.replace('media="(prefers-reduced-motion: reduce)" ',media));
    reject(dir,/Still source must select reduced motion/);
  }
});

test('rejects a reduced-motion still after an animation source',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  const original=await readFile(file,'utf8');
  const still=original.match(/<source\b[^>]*srcset="assets\/still\.svg"[^>]*>\n/)[0];
  await writeFile(file,original.replace(still,'').replace(/(<source\b[^>]*srcset="assets\/night\.webp"[^>]*>\n)/,'$1'+still));
  reject(dir,/Still source must be first/);
});

test('rejects a still source with the wrong declared format',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  await writeFile(file,(await readFile(file,'utf8')).replace('type="image/svg+xml"','type="image/webp"'));
  reject(dir,/Still source must declare SVG/);
});

test('rejects hero files exceeding the delivery byte budget',async context=>{
  for(const [format,budget] of [['webp',6000000],['gif',8000000]]){
    const dir=await fixture(context),file=join(dir,`assets/day.${format}`);
    const bytes=await readFile(file);
    await writeFile(file,Buffer.concat([bytes,Buffer.alloc(budget-bytes.length+1)]));
    reject(dir,/Hero byte budget exceeded/);
  }
});

test('rejects WebP timing changes even when frame count and duration match',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/day.webp');
  const bytes=await readFile(file),positions=[];
  for(let offset=12;offset<bytes.length;){
    const size=bytes.readUInt32LE(offset+4);
    if(bytes.toString('ascii',offset,offset+4)==='ANMF')positions.push(offset+20);
    offset+=8+size+(size%2);
  }
  const forty=positions.find(p=>bytes.readUIntLE(p,3)===40);
  const fifty=positions.find(p=>bytes.readUIntLE(p,3)===50);
  assert(forty!==undefined&&fifty!==undefined);
  bytes.writeUIntLE(50,forty,3);bytes.writeUIntLE(40,fifty,3);
  await writeFile(file,bytes);
  reject(dir,/WEBP delays must match GIF fallback/);
});

test('theme selectors never combine motion or viewport conditions',async()=>{
  const readme=await readFile(join(root,'README.md'),'utf8');
  for(const source of readme.matchAll(/<source\b[^>]*media="([^"]+)"/g)){
    if(source[1].includes('prefers-color-scheme'))assert(!source[1].includes(' and '),`GitHub rewrites combined theme query: ${source[1]}`);
  }
});

test('rejects CSS directives outside the fixed SVG theme palette',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-800.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('<style>','<style>@import "https://example.com/paint.css";'));
  reject(dir,/SVG theme CSS must contain only palette colors/);
});
test('rejects external content in the reduced-motion SVG',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/still.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('data:image/png;base64,','https://example.com/'));
  reject(dir,/Still SVG must embed only the exact approved PNGs/);
});

test('reduced-motion PNGs exactly match the approved poster frame 204',async()=>{
  for (const theme of ['day','night']) {
    const poster=await sharp(join(root,`assets/${theme}.png`)).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const frame=await sharp(join(root,`assets/${theme}.gif`),{page:204,pages:1}).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(poster.info.width,frame.info.width);assert.equal(poster.info.height,frame.info.height);
    assert(poster.data.equals(frame.data),`${theme} poster pixels differ from frame 204`);
  }
});
