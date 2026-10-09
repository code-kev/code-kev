import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,cp,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
const root=fileURLToPath(new URL('..',import.meta.url));
test('accepts the published SVGs and 600-frame animations',()=>{
  assert.match(execFileSync(process.execPath,['scripts/check-profile.mjs'],{cwd:root,encoding:'utf8'}),/Verified 60/);
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
  await rm(join(dir,'assets/profile/identity-800-night.svg'));
  reject(dir,/ENOENT.*identity-800-night\.svg/);
});
test('rejects executable or external SVG content',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-800-night.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('</svg>','<script>alert(1)</script></svg>'));
  reject(dir,/SVG must not contain active or external content/);
});
test('rejects an SVG paint attribute that loads an external resource',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-800-night.svg');
  const original=await readFile(file,'utf8');
  for(const fill of ['url(https://example.com/paint.svg#ink)','u&#114;l(https://example.com/paint.svg#ink)']){
    await writeFile(file,original.replace('<g fill="','<g fill="'+fill+'" data-old-fill="'));
    reject(dir,/SVG must not contain active or external content/);
  }
});
test('rejects an SVG exported with the wrong size for its filename',async context=>{
  const dir=await fixture(context),file=join(dir,'assets/profile/identity-288-night.svg');
  await writeFile(file,(await readFile(file,'utf8')).replace('width="288"','width="800"'));
  reject(dir,/SVG width mismatch/);
});
test('rejects a missing mobile day variant even if its reference is removed',async context=>{
  const dir=await fixture(context),file=join(dir,'README.md');
  await writeFile(file,(await readFile(file,'utf8')).replace(/<source\b[^>]*srcset="assets\/profile\/identity-288-day.svg"[^>]*>/,''));
  await rm(join(dir,'assets/profile/identity-288-day.svg'));
  reject(dir,/Profile theme\/size variants missing: identity/);
});
test('rejects replacement artwork with the wrong frame count',async context=>{
  const dir=await fixture(context);
  await sharp({create:{width:1672,height:941,channels:3,background:'#fff'}}).gif().toFile(join(dir,'assets/day.gif'));
  reject(dir,/GIF frame count mismatch/);
});

test('contact images have balanced vertical touch padding',async()=>{
  for(const size of [288,350,800])for(const theme of ['day','night'])for(const name of ['email','linkedin','github']){
    const image=sharp(join(root,`assets/profile/contact-${name}-${size}-${theme}.svg`));
    const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let top=info.height,bottom=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*info.channels+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}
    assert(bottom>=top,'Contact lettering must be visible');
    assert(Math.abs(top-(info.height-bottom-1))<=1,`Unbalanced contact padding: ${name}-${size}-${theme}, top ${top}, bottom ${info.height-bottom-1}`);
  }
});

test('hero prefers WebP for both themes after reduced-motion stills',async()=>{
  const hero=(await readFile(join(root,'README.md'),'utf8')).split('</picture>')[0];
  const sources=[...hero.matchAll(/<source\b[^>]*srcset="([^"]+)"[^>]*>/g)];
  assert.deepEqual(sources.map(s=>s[1]),['assets/night.png','assets/day.png','assets/night.webp','assets/day.webp','assets/night.gif']);
  for(const source of sources.slice(2,4))assert.match(source[0],/type="image\/webp"/);
  assert.match(sources[2][0],/prefers-color-scheme: dark/);
  assert.match(sources[3][0],/prefers-color-scheme: light/);
  assert.match(hero,/<img src="assets\/day.gif"/);
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
