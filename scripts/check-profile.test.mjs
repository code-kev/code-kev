import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,cp,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
const root=fileURLToPath(new URL('..',import.meta.url));
test('accepts the published SVGs and 600-frame animations',()=>{
  assert.match(execFileSync(process.execPath,['scripts/check-profile.mjs'],{cwd:root,encoding:'utf8'}),/Verified 58/);
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
