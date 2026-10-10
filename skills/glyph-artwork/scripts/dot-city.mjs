import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

const [output='city.svg',caption='AI CITY',...extra]=process.argv.slice(2);
assert(extra.length===0,'Usage: node dot-city.mjs [output.svg] [caption]');
const glyphs=JSON.parse(await readFile(new URL('../assets/glyphs.json',import.meta.url),'utf8'));
const columns=160, cellWidth=6, cellHeight=10, aspect=16/9;
const rows=Math.round(columns*cellWidth/(aspect*cellHeight));
const width=columns*cellWidth, height=rows*cellHeight;
assert(width===960&&height===540);
const marks=[];
const circle=(x,y,r)=> {
  assert(x-r>=0&&x+r<=width&&y-r>=0&&y+r<=height,'Mark exceeds canvas');
  marks.push(`<circle cx="${x}" cy="${y}" r="${Number(r.toFixed(3))}"/>`);
};
const buildings=[[120,210,108,230],[240,150,84,290],[336,250,90,190],[444,90,72,350],[540,185,120,255],[672,235,90,205],[774,160,72,280]];
for (let row=0;row<rows;row++) for (let col=0;col<columns;col++) {
  const x=(col+.5)*cellWidth,y=(row+.5)*cellHeight;
  let tone=0;
  // Sample physical canvas coordinates so rectangular cells retain the scene's aspect.
  if (x>=96&&x<=864&&y>=35&&y<=445) {
    if ((col*17+row*31)%127===0) tone=.2;
    for (const [bx,by,bw,bh] of buildings) if (x>=bx&&x<bx+bw&&y>=by&&y<by+bh) {
      const window=(Math.floor((x-bx)/12)+Math.floor((y-by)/20))%3===0;
      tone=window?.25:.8;
    }
  }
  if (((Math.abs(x-96)<9||Math.abs(x-864)<9||Math.abs(x-480)<6)&&y>=25&&y<=455)
      ||((Math.abs(y-25)<6||Math.abs(y-455)<6)&&x>=90&&x<=870)) tone=1;
  if (tone) circle(x,y,cellWidth*.36*tone);
}
const cell=4, captionWidth=([...caption].length*6-1)*cell;
assert(caption.length>0&&captionWidth<=width-64,'Caption must fit the canvas');
for (const [index,character] of [...caption.toUpperCase()].entries()) {
  const glyph=glyphs[character];
  assert(glyph,`Unsupported glyph: ${character}`);
  assert(glyph.length===7&&glyph.every(row=>/^[01]{5}$/.test(row)),`Invalid glyph: ${character}`);
  for (const [row,bits] of glyph.entries()) for (const [col,bit] of [...bits].entries()) {
    if (bit==='1') circle(32+(index*6+col+.5)*cell,490+(row+.5)*cell,cell*.36);
  }
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="#111">${marks.join('')}</g></svg>\n`;
// Build and validate the entire artifact before replacing an existing output.
await writeFile(output,svg);
console.log(`${columns}×${rows} cells → ${width}×${height}px; ${marks.length} explicit dots; ${output}`);
