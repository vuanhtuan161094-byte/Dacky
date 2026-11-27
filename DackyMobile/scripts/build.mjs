import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('python3', [path.join(root,'scripts/install-art13.py'),path.join(root,'assets/art01-city-ground.svg')],{cwd:root,stdio:'inherit'});
execFileSync('python3', [path.join(root,'scripts/install-hog-field.py')],{cwd:root,stdio:'inherit'});
const { exportDatabase } = await import('./export-database.mjs');
await exportDatabase();
const dist = process.env.DACKY_BUILD_OUT
  ? path.resolve(root, process.env.DACKY_BUILD_OUT)
  : path.join(root, 'dist');
await mkdir(dist, { recursive: true });
for (const name of ['index.html','styles.css','manifest.webmanifest','sw.js','src','assets','docs']) {
  await cp(path.join(root, name), path.join(dist, name), { recursive: true });
}

const modules = new Map();
function cleanId(file) { return '/' + path.relative(root, file).split(path.sep).join('/'); }
async function loadModule(file) {
  const id = cleanId(file);
  if (modules.has(id)) return;
  let source = await readFile(file, 'utf8');
  const imports = [...source.matchAll(/import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?/g)];
  for (const match of imports) {
    const dep = path.resolve(path.dirname(file), match[2]);
    await loadModule(dep);
    const binding = match[1].trim().replace(/\s+as\s+/g, ': ');
    const depId = cleanId(dep);
    source = source.replace(match[0], `const { ${binding} } = __require(${JSON.stringify(depId)});`);
  }
  const exported = [];
  source = source.replace(/\bexport\s+(?=(?:async\s+)?(?:function|const|let|class)\b)/g, '');
  const original = await readFile(file, 'utf8');
  for (const match of original.matchAll(/\bexport\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) exported.push(match[1]);
  const exportListBindings = [];
  for (const match of original.matchAll(/\bexport\s*\{([^}]+)\}\s*;?/g)) {
    source = source.replace(match[0], '');
    for (const item of match[1].split(',')) {
      const [local, alias] = item.trim().split(/\s+as\s+/);
      if (local) exportListBindings.push([alias || local, local]);
    }
  }
  const exportBindings = [...new Set(exported)].map(name => [name,name]).concat(exportListBindings);
  if (exportBindings.length) source += `\nObject.assign(__exports,{${exportBindings.map(([name,local])=>`${JSON.stringify(name)}:${local}`).join(',')}});\n`;
  modules.set(id, `function(__require,__exports){\n${source}\nreturn __exports;\n}`);
}

const entry = path.join(root, 'src/main.js');
await loadModule(entry);
let bundle = `(()=>{const __factories={${[...modules].map(([id,body])=>`${JSON.stringify(id)}:${body}`).join(',')}};const __cache={};function __require(id){if(__cache[id])return __cache[id];const out=__cache[id]={};if(!__factories[id])throw Error('Module missing: '+id);return __factories[id](__require,out)}__require(${JSON.stringify(cleanId(entry))})})();`;
let html = await readFile(path.join(root,'index.html'),'utf8');
let css = await readFile(path.join(root,'styles.css'),'utf8');
const dataUrl = async name => {
  const ext = path.extname(name).toLowerCase();
  const mime = ext === '.jpg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : ext === '.mp3' ? 'audio/mpeg' : 'image/svg+xml';
  return `data:${mime};base64,${(await readFile(path.join(root,'assets',name))).toString('base64')}`;
};
const inlineImages = await Promise.all(['art01-city-ground.svg','art01-outer-ground.svg','crest.svg','city-panorama.jpg','heroes-atlas.svg','portraits/jiang-zia.webp','portraits/na-tra.webp','buildings/tuvithanh.webp','mobile-source/assets/map-ng/thanh/map008.webp','mobile-source/assets/map-ng/thanh/map00401.webp'].map(async name=>[name,await dataUrl(name)]));
const imageUrls = Object.fromEntries(inlineImages);
css = css.replace(/url\(['"]?\.\/assets\/([^)'"\s]+)['"]?\)/g, (_,name) => `url('${imageUrls[name] || ''}')`);
for (const [name,url] of inlineImages) bundle = bundle.replaceAll(`./assets/${name}`,url);
for (const [name,url] of inlineImages) html = html.replaceAll(`./assets/${name}`,url);
const sourceAssetManifests = await Promise.all(['mobile-source-manifest.json','visual-art-manifest.json'].map(async file=>JSON.parse(await readFile(path.join(root,'assets',file),'utf8'))));
const sourceAssetUrls = new Map();
const reusePaths = ["./assets/reuse/skeleton/idle.png","./assets/reuse/skeleton/walk.png","./assets/reuse/skeleton/attack.png","./assets/reuse/skeleton/hit.png","./assets/reuse/skeleton/death.png","./assets/reuse/heavy-soldier/idle.png","./assets/reuse/heavy-soldier/walk.png","./assets/reuse/heavy-soldier/attack.png","./assets/reuse/heavy-soldier/hit.png","./assets/reuse/heavy-soldier/death.png","./assets/reuse/vfx/fireball.png","./assets/reuse/vfx/quake.png","./assets/reuse/vfx/thunderstrike.png","./assets/reuse/vfx/shield.png","./assets/reuse/vfx/heal.png","./assets/reuse/vfx/freeze.png","./assets/reuse/vfx/cleave.png","./assets/reuse/battlefield/open-field.webp"];
for (const name of reusePaths) sourceAssetUrls.set(name,await dataUrl(name.slice('./assets/'.length)));
const art09=JSON.parse(await readFile(path.join(root,'assets/art09-buildings/manifest.json'),'utf8'));
for(const id of Object.keys(art09)){const name='art09-buildings/'+id+'.webp';sourceAssetUrls.set('./assets/'+name,await dataUrl(name));}
for (const asset of sourceAssetManifests.flatMap(manifest=>manifest.assets)) {
  const ext = path.extname(asset.path).toLowerCase();
  const mime = ({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.avif':'image/avif','.mp3':'audio/mpeg'})[ext] || 'application/octet-stream';
  const dataUrl = `data:${mime};base64,${(await readFile(path.join(root,asset.path))).toString('base64')}`;
  sourceAssetUrls.set(`./${asset.path}`,dataUrl);
}
for (const [name,url] of sourceAssetUrls) css = css.replaceAll(name,url);
const embeddedSourceAssetMap = JSON.stringify(Object.fromEntries(sourceAssetUrls));
const reuseCredits = (await Promise.all(['reuse/skeleton/LICENSE.txt','reuse/heavy-soldier/LICENSE.txt','reuse/vfx/NOTICE.md','reuse/vfx/CREDITS.txt','reuse/battlefield/NOTICE.md'].map(name=>readFile(path.join(root,'assets',name),'utf8')))).join('\n\n');
const escapeCredits=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
html=html.replace('</body>',`<template id="reuse-asset-credits"><pre>${escapeCredits(reuseCredits)}</pre></template></body>`);
html = html.replace('<link rel="manifest" href="./manifest.webmanifest">','');
html = html.replace('<link rel="stylesheet" href="./styles.css">',`<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="./src/main.js"></script>',`<script>globalThis.__DACKY_EMBEDDED_ASSETS__=${embeddedSourceAssetMap};</script>\n<script>\n${bundle}\n</script>`);
await writeFile(path.join(dist,'offline.html'),html);
if(process.env.DACKY_COMBAT_PREVIEW==='1')await writeFile(path.join(dist,'combat-product.html'),html.replace('<head>','<head><script>globalThis.__DACKY_COMBAT_PREVIEW__=true;</script>'));
console.log(`Web assets copied to ${dist}`);
console.log(`Single-file offline build: ${path.join(dist,'offline.html')}`);
console.log(`Bundled ${modules.size} source modules; ${bundle.length.toLocaleString()} JavaScript characters.`);
