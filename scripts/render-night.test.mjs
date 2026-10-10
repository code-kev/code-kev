import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function lighting() {
  try { return await import('./render-night.mjs'); }
  catch(error) {
    if(error.code==='ERR_MODULE_NOT_FOUND') assert.fail('Registered night lighting is not implemented');
    throw error;
  }
}
const width=836,height=471;
const at=(x,y)=>Math.floor(y*height/135)*width+Math.floor(x*width/240);

test('keeps the monitor, banner and window rails at their original tones',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.alloc(width*height,200),result=applyNightLighting(source);
  for(const [x,y] of [[100,70],[140,10],[18,52],[22,30],[26,66],[230,65],[5,30]]) assert.equal(result[at(x,y)],200);
  assert(source.every(value=>value===200),'The approved source must not be mutated');
});

test('does not extend the window-rail highlight across the head or chair',async()=>{
  const {applyNightLighting}=await lighting();
  const result=applyNightLighting(Buffer.alloc(width*height,200));
  assert(result[at(26,54)]<100,'The rear of the head must receive its shadow tone');
  assert(result[at(22,92)]<=result[at(29,92)],'The chair must not carry a brighter vertical rail stripe');
});

test('shades the entire rear hair silhouette through the nod without dimming the exposed rail',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.alloc(width*height,200);
  for(const frame of [0,15,45,204,599]) {
    const result=applyNightLighting(source,frame);
    for(const [x,y] of [[23.5,61.5],[25.5,63.5],[31.5,68.5]]) {
      assert(result[at(x,y)]<=48,`Rear hair retains a halo at ${x},${y}, frame ${frame}`);
    }
    for(const [x,y] of [[18,52],[24,42],[26,66]]) {
      assert.equal(result[at(x,y)],200,`Exposed rail changed at frame ${frame}`);
    }
  }
  assert(!applyNightLighting(source,15).equals(applyNightLighting(source,45)),'The head footprint must follow the nod');
  assert(applyNightLighting(source,0).equals(applyNightLighting(source,599)),'The lighting footprint must reset with the loop');
});

test('rejects an invalid registered head-motion frame',async()=>{
  const {applyNightLighting}=await lighting();
  for(const frame of [-1,600,.5]) {
    assert.throws(()=>applyNightLighting(Buffer.alloc(width*height),frame),/frame.*0.*599/i);
  }
});

test('directs the developer highlight toward the monitor and quiets distant surfaces',async()=>{
  const {applyNightLighting}=await lighting();
  const result=applyNightLighting(Buffer.alloc(width*height,255));
  assert(result[at(60,52)]>result[at(40,48)],'The monitor-facing head edge must be brighter');
  assert(result[at(40,48)]<160,'The inverse head fill must become a shadow');
  assert(result[at(100,103)]>result[at(210,123)],'The keyboard must outrank the far desk');
  assert(result[at(190,50)]<200,'The city must remain subordinate');
});

test('preserves every occupied pixel and never invents or brightens a mark',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.from(Array.from({length:width*height},(_,i)=>i%256));
  const result=applyNightLighting(source);
  for(let i=0;i<source.length;i++) {
    assert.equal(result[i]===0,source[i]===0,`Glyph occupancy changed at ${i}`);
    assert(result[i]<=source[i],`Unexpected light outside the original marks at ${i}`);
  }
  assert(result.equals(applyNightLighting(source)),'Lighting must be deterministic');
});

test('rejects a frame that does not match the registered delivery canvas',async()=>{
  const {applyNightLighting}=await lighting();
  assert.throws(()=>applyNightLighting(new Uint8Array(1)),/836.*471/);
});

test('rejects an unapproved source before creating output',async context=>{
  const dir=await mkdtemp(join(tmpdir(),'night-source-'));
  context.after(()=>rm(dir,{recursive:true,force:true}));
  const result=spawnSync(process.execPath,['scripts/render-night.mjs','assets/day.gif',join(dir,'output')],{encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Expected the approved compact night GIF/);
  assert.deepEqual(await readdir(dir),[]);
});
