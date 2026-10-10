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
  const source=Buffer.alloc(width*height,200),result=await applyNightLighting(source);
  for(const [x,y] of [[100,70],[140,10],[18,52],[22,30],[26,66],[230,65],[5,30]]) assert.equal(result[at(x,y)],200);
  assert(source.every(value=>value===200),'The approved source must not be mutated');
});

test('does not extend the window-rail highlight across the head or chair',async()=>{
  const {applyNightLighting}=await lighting();
  const result=await applyNightLighting(Buffer.alloc(width*height,200));
  assert(result[at(26,54)]<100,'The rear of the head must receive its shadow tone');
  assert(result[at(22,92)]<=result[at(29,92)],'The chair must not carry a brighter vertical rail stripe');
});

test('shades the rear hair glyphs through the nod without dimming the exposed rail',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.alloc(width*height,200);
  for(const frame of [0,15,45,204,599]) {
    const result=await applyNightLighting(source,frame);
    for(const [x,y] of [[23.5,61.5],[25.5,63.5]]) {
      assert(result[at(x,y)]<=48,`Rear hair retains a halo at ${x},${y}, frame ${frame}`);
    }
    for(const [x,y] of [[18,52],[24,42],[26,66]]) {
      assert.equal(result[at(x,y)],200,`Exposed rail changed at frame ${frame}`);
    }
  }
  assert(!(await applyNightLighting(source,15)).equals(await applyNightLighting(source,45)),'The head footprint must follow the nod');
  assert((await applyNightLighting(source,0)).equals(await applyNightLighting(source,599)),'The lighting footprint must reset with the loop');
});

test('rejects an invalid registered head-motion frame',async()=>{
  const {applyNightLighting}=await lighting();
  for(const frame of [-1,600,.5]) {
    await assert.rejects(()=>applyNightLighting(Buffer.alloc(width*height),frame),/frame.*0.*599/i);
  }
});

test('leaves the exposed background dots beside the nodding head unchanged',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.alloc(width*height,200);
  // These raster positions belong to the fixed rail, immediately outside the hair glyphs.
  for(const [frame,x,y] of [[0,92,148],[15,89,152],[45,89,152],[204,89,152],
    [45,85,159],[50,85,159],[10,78,172],[15,78,172],[20,92,151],[50,92,151]]) {
    const result=await applyNightLighting(source,frame);
    assert.equal(result[y*width+x],200,`Background acquired a moving shadow at frame ${frame}`);
  }
});

test('keeps the registered interior hair glyph shaded without a resize crop',async()=>{
  const {applyNightLighting}=await lighting();
  const result=await applyNightLighting(Buffer.alloc(width*height,200));
  assert(result[162*width+117]<=64,'A cropped coverage layer leaves a bright speck in the hair');
});

test('directs the developer highlight toward the monitor and quiets distant surfaces',async()=>{
  const {applyNightLighting}=await lighting();
  const result=await applyNightLighting(Buffer.alloc(width*height,255));
  assert(result[at(60,52)]>result[at(40,48)],'The monitor-facing head edge must be brighter');
  assert(result[at(40,48)]<160,'The inverse head fill must become a shadow');
  assert(result[at(100,103)]>result[at(210,123)],'The keyboard must outrank the far desk');
  assert(result[at(190,50)]<200,'The city must remain subordinate');
});

test('preserves every occupied pixel and never invents or brightens a mark',async()=>{
  const {applyNightLighting}=await lighting();
  const source=Buffer.from(Array.from({length:width*height},(_,i)=>i%256));
  const result=await applyNightLighting(source);
  for(let i=0;i<source.length;i++) {
    assert.equal(result[i]===0,source[i]===0,`Glyph occupancy changed at ${i}`);
    assert(result[i]<=source[i],`Unexpected light outside the original marks at ${i}`);
  }
  assert(result.equals(await applyNightLighting(source)),'Lighting must be deterministic');
});

test('rejects a frame that does not match the registered delivery canvas',async()=>{
  const {applyNightLighting}=await lighting();
  await assert.rejects(()=>applyNightLighting(new Uint8Array(1)),/836.*471/);
});

test('rejects an unapproved source before creating output',async context=>{
  const dir=await mkdtemp(join(tmpdir(),'night-source-'));
  context.after(()=>rm(dir,{recursive:true,force:true}));
  const result=spawnSync(process.execPath,['scripts/render-night.mjs','assets/day.gif',join(dir,'output')],{encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Expected the approved compact night GIF/);
  assert.deepEqual(await readdir(dir),[]);
});
