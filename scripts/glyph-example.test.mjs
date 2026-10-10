import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('the standalone skill example is deterministic, aspect-correct and rejects unknown captions before writing',async context=>{
  const dir=await mkdtemp(join(tmpdir(),'glyph-example-'));
  context.after(()=>rm(dir,{recursive:true,force:true}));
  const script=fileURLToPath(new URL('../skills/glyph-artwork/scripts/dot-city.mjs',import.meta.url));
  const output=join(dir,'city.svg');
  execFileSync(process.execPath,[script,output,'AI CITY']);
  const first=await readFile(output,'utf8');
  execFileSync(process.execPath,[script,output,'AI CITY']);
  assert.equal(await readFile(output,'utf8'),first);
  assert.match(first,/width="960" height="540" viewBox="0 0 960 540"/);
  assert(!/<rect|<image|<script|href=|url\(/.test(first));
  const marks=[...first.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)];
  assert(marks.length>1000);
  for (const [,cx,cy,r] of marks) {
    const x=Number(cx),y=Number(cy),radius=Number(r);
    assert(x-radius>=0&&x+radius<=960&&y-radius>=0&&y+radius<=540);
  }
  const invalid=spawnSync(process.execPath,[script,output,'Ω'],{encoding:'utf8'});
  assert.equal(invalid.status,1);assert.match(invalid.stderr,/Unsupported glyph: Ω/);
  assert.equal(await readFile(output,'utf8'),first,'Invalid copy must not overwrite the valid example');
});
