import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const glyphs = JSON.parse(await readFile(new URL('../profile/glyphs.json', import.meta.url), 'utf8'));
for (const [character, rows] of Object.entries(glyphs)) {
  assert(Array.isArray(rows) && rows.length === 7 && rows.every(row => /^[01]{5}$/.test(row)), `Invalid glyph: ${character}`);
}

const number = value => Number(value.toFixed(3));

// The dotted ↗ link arrow recovered from the original artwork: a 7-column north-east mark
// drawn at 0.766x its label cell, set 4.256 cells after the label and vertically centred on it.
const linkArrow = ['0011111','0000011','0000101','0001001','0010000','0100000','1000000'];
const arrowCell = cell => number(cell * 0.7656);
const arrowGap = cell => number(cell * 4.256);
const arrowSvg = cell => linkArrow.flatMap((row, y) => [...row].flatMap((bit, x) => bit === '1'
  ? [`<circle cx="${number((x + .5) * cell)}" cy="${number((y + .5) * cell)}" r="${number(.36 * cell)}"/>`]
  : [])).join('');

export function glyphText(text, cell) {
  assert(Number.isFinite(cell) && cell > 0, 'Cell size must be positive');
  assert(typeof text === 'string' && text.length > 0, 'Text must not be empty');
  const characters = [...text.toUpperCase()];
  const marks = characters.flatMap((character, index) => {
    const rows = glyphs[character];
    assert(rows, `Unsupported glyph: ${character}`);
    return rows.flatMap((row, y) => [...row].flatMap((bit, x) => bit === '1'
      ? [`<circle cx="${number((index * 6 + x + .5) * cell)}" cy="${number((y + .5) * cell)}" r="${number(.36 * cell)}"/>`]
      : []));
  });
  return {width: (characters.length * 6 - 1) * cell, height: 7 * cell, svg: marks.join('')};
}

export function wrapWords(text, maxWidth, cell) {
  assert(Number.isFinite(maxWidth) && maxWidth > 0, 'Column width must be positive');
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    assert(glyphText(word, cell).width <= maxWidth, `Word does not fit: ${word}`);
    const candidate = line ? line + ' ' + word : word;
    if (glyphText(candidate, cell).width <= maxWidth) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

const palette = '.ink-0{color:rgb(0,0,0)}.ink-1{color:rgb(102,102,102)}.ink-2{color:rgb(85,85,85)}.ink-3{color:rgb(170,170,170)}@media(prefers-color-scheme:dark){.ink-0{color:rgb(255,255,255)}.ink-1{color:rgb(150,150,150)}.ink-2{color:rgb(184,184,184)}.ink-3{color:rgb(82,82,82)}}';
const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const hero = `<picture>
<source media="(prefers-reduced-motion: reduce)" type="image/svg+xml" srcset="assets/still.svg">
<source media="(prefers-color-scheme: dark)" type="image/webp" srcset="assets/night.webp">
<source media="(prefers-color-scheme: light)" type="image/webp" srcset="assets/day.webp">
<source media="(prefers-color-scheme: dark)" srcset="assets/night.gif">
<img src="assets/day.gif" width="100%" alt="A developer with headphones types beside a rounded bot while a blimp trails an AGI Soon banner across a futuristic city.">
</picture>`;

function picture(name, alt, width='100%') {
  return `<picture><source media="(max-width: 382px)" srcset="assets/profile/${name}-288.svg"><source media="(max-width: 600px)" srcset="assets/profile/${name}-350.svg"><source media="(max-width: 1200px)" srcset="assets/profile/${name}-550.svg"><img src="assets/profile/${name}-800.svg" width="${width}" alt="${escape(alt)}"></picture>`;
}

export function buildProfile(content) {
  const files = new Map();
  for (const width of [288,350,550,800]) {
    const gutter = {288:20,350:24,550:36,800:56}[width];
    const cell = width===550 ? 2.4 : 2.2;
    const column = width-2*gutter;
    function section(name, draw) {
      const marks = [];
      let y = 28;
      const text = (value,x,top,size,ink=2) => {
        const glyph = glyphText(value,size);
        marks.push(`<g fill="currentColor" class="ink-${ink}" transform="translate(${number(x)} ${number(top)})">${glyph.svg}</g>`);
        return glyph.width;
      };
      const arrow = (cell,x,top) => marks.push(`<g fill="currentColor" class="ink-0" transform="translate(${number(x)} ${number(top)})">${arrowSvg(cell)}</g>`);
      const lines = (value,size=cell,ink=2,x=gutter,maxWidth=column) => {
        for (const line of wrapWords(value,maxWidth,size)) {
          text(line,x,y,size,ink);
          y += 9*size;
        }
      };
      const rule = () => marks.push(`<path class="ink-3" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3" d="M${gutter} 1H${width-gutter}"/>`);
      draw({text,lines,rule,arrow,get y(){return y;},set y(value){y=value;}});
      const height = Math.ceil(y+28);
      files.set(`assets/profile/${name}-${width}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${palette}</style>${marks.join('')}</svg>\n`);
    }
    section('identity',s => {
      s.y = 38;
      const nameCell = width===288 ? 2.75 : width===350 ? 3.2 : 3.5;
      s.lines(content.name,nameCell,0);
      s.y += 8;
      s.lines(content.handle,1.5,1);
      s.y += 14;
      s.lines(content.role,1.75,1);
      if (content.focus) { s.y += 18; s.lines(content.focus); }
    });
    for (const [index,project] of content.projects.entries()) {
      section(index===0?'certkit':'pentagent',s => {
        s.rule();
        const titleTop = s.y, titleCell = 2.65, cell = arrowCell(titleCell);
        s.lines(project.name,titleCell,0);
        if (project.url) s.arrow(cell,gutter+glyphText(project.name,titleCell).width+arrowGap(titleCell),titleTop+3.5*(titleCell-cell));
        s.y += 8;
        s.lines(project.label,1.6,1);
        s.y += 18;
        s.lines(project.description);
        s.y += 8;
        s.lines(project.detail,1.75,1);
      });
    }
    for (const [name,rows] of [['stack',content.stack],['environment',content.environment]]) {
      section(name,s => {
        s.rule();
        s.lines(name,2.4,0);
        s.y += 20;
        for (const row of rows) {
          if (width===800) {
            s.text(row.label,gutter,s.y,1.75,1);
            s.lines(row.value,cell,2,gutter+140,column-140);
          } else {
            s.lines(row.label,1.75,1);
            s.y += 7;
            s.lines(row.value);
          }
          s.y += 16;
        }
        s.y -= 16;
      });
    }
    section('connect',s => { s.rule(); s.lines('Connect',2.4,0); s.y -= 16; });
    for (const contact of content.contacts) {
      const crop = Math.round(width/3), height=56;
      const size = width<=350 ? 1.5 : 1.85;
      const cell = arrowCell(size), gap = arrowGap(size);
      const glyph = glyphText(contact.label,size);
      assert(glyph.width+gap+7*cell<=crop,`Contact does not fit: ${contact.label}`);
      const x=(crop-glyph.width-gap-7*cell)/2, y=(height-glyph.height)/2;
      const marks=`<g fill="currentColor" class="ink-2" transform="translate(${number(x)} ${number(y)})">${glyph.svg}</g><g fill="currentColor" class="ink-2" transform="translate(${number(x+glyph.width+gap)} ${number(y+3.5*(size-cell))})">${arrowSvg(cell)}</g>`;
      files.set(`assets/profile/contact-${contact.label.toLowerCase()}-${width}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${crop}" height="${height}" viewBox="0 0 ${crop} ${height}"><style>${palette}</style>${marks}</svg>\n`);
    }
  }
  const rowsAlt = rows => rows.map(row=>`${row.label}: ${row.value}.`).join(' ');
  const projects = content.projects.map((project,index)=> {
    const image = picture(index===0?'certkit':'pentagent',`${project.name}. ${project.label}. ${project.description} ${project.detail}.`);
    return project.url ? `<a href="${escape(project.url)}">${image}</a>` : image;
  });
  const contacts = content.contacts.map(contact=>`<a href="${escape(contact.url)}" aria-label="${escape(contact.label+' — '+contact.url.replace('mailto:',''))}">${picture('contact-'+contact.label.toLowerCase(),contact.label,'33.333333%')}</a>`).join('');
  const identity = picture('identity',`${content.name}. ${content.handle}. ${content.role}${content.focus?' '+content.focus:''}`);
  files.set('README.md',`${hero}\n\n<div>\n${identity}\n${projects.join('\n')}\n${picture('stack','Stack. '+rowsAlt(content.stack))}\n${picture('environment','Environment. '+rowsAlt(content.environment))}\n${picture('connect','Connect')}\n<br>\n${contacts}\n</div>\n`);
  const nativeProjects=content.projects.map(project=>`### ${project.name}\n\n${project.label}. ${project.description}\n\n${project.detail}.${project.url?`\n\n[Repository and usage examples](${project.url}#readme)`:''}`).join('\n\n');
  const nativeRows=rows=>rows.map(row=>`- **${row.label}:** ${row.value}`).join('\n');
  files.set('docs/profile.md',`# ${content.name}\n\n${content.focus}\n\n${content.role}\n\n<img src="../assets/still.svg" width="100%" alt="A developer and rounded bot overlooking a futuristic city; an AGI Soon blimp passes the window.">\n\nThis reading view uses a still image.\n\n## Selected projects\n\n${nativeProjects}\n\n## Stack\n\n${nativeRows(content.stack)}\n\n## Environment\n\n${nativeRows(content.environment)}\n\n## Connect\n\n${content.contacts.map(contact=>`- [${contact.label}](${contact.url})`).join('\n')}\n\n[Animated profile](../README.md) · [Artwork and reusable skill](README.md)\n`);
  return files;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=fileURLToPath(new URL('..',import.meta.url));
  const content=JSON.parse(await readFile(resolve(root,'profile/content.json'),'utf8'));
  const files=buildProfile(content);
  for (const [name,data] of files) {
    await mkdir(dirname(resolve(root,name)),{recursive:true});
    await writeFile(resolve(root,name),data);
  }
  console.log(`Rendered ${[...files.keys()].filter(name=>name.endsWith('.svg')).length} profile SVGs, README and native profile from profile/content.json.`);
}
