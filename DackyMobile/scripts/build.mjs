import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { exportDatabase } = await import('./export-database.mjs');
await exportDatabase();
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html','styles.css','manifest.webmanifest','sw.js','src','assets','docs','data']) {
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
  const mime = ext === '.jpg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/svg+xml';
  return `data:${mime};base64,${(await readFile(path.join(root,'assets',name))).toString('base64')}`;
};
const inlineImages = await Promise.all(['crest.svg','city-panorama.jpg','heroes-atlas.svg','portraits/jiang-zia.webp','portraits/na-tra.webp','buildings/tuvithanh.webp'].map(async name=>[name,await dataUrl(name)]));
const imageUrls = Object.fromEntries(inlineImages);
css = css.replace(/url\(['"]?\.\/assets\/([^)'"\s]+)['"]?\)/g, (_,name) => `url('${imageUrls[name] || ''}')`);
for (const [name,url] of inlineImages) bundle = bundle.replaceAll(`./assets/${name}`,url);
for (const [name,url] of inlineImages) html = html.replaceAll(`./assets/${name}`,url);
const sourceAssetManifest = JSON.parse(await readFile(path.join(root,'assets/mobile-source-manifest.json'),'utf8'));
const sourceAssetUrls = new Map();
for (const asset of sourceAssetManifest.assets) {
  const ext = path.extname(asset.path).toLowerCase();
  const mime = ({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.avif':'image/avif'})[ext] || 'application/octet-stream';
  const dataUrl = `data:${mime};base64,${(await readFile(path.join(root,asset.path))).toString('base64')}`;
  sourceAssetUrls.set(`./${asset.path}`,dataUrl);
}
const embeddedSourceAssetMap = JSON.stringify(Object.fromEntries(sourceAssetUrls));
html = html.replace('<link rel="manifest" href="./manifest.webmanifest">','');
html = html.replace('<link rel="stylesheet" href="./styles.css">',`<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="./src/main.js"></script>',`<script>globalThis.__DACKY_EMBEDDED_ASSETS__=${embeddedSourceAssetMap};</script>\n<script>\n${bundle}\n</script>`);
await writeFile(path.join(dist,'offline.html'),html);
console.log(`Web assets copied to ${dist}`);
console.log(`Single-file offline build: ${path.join(dist,'offline.html')}`);
console.log(`Bundled ${modules.size} source modules; ${bundle.length.toLocaleString()} JavaScript characters.`);
