import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
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


let html=await readFile(path.join(root,'combat-review.html'),'utf8');
const tag=/<script type="module">([\s\S]*?)<\/script>/;
const match=html.match(tag);if(!match)throw Error('Review module missing');
let entry=match[1];
for(const imp of [...entry.matchAll(/import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?/g)]){
 const dep=path.resolve(root,imp[2]);await loadModule(dep);
 const binding=imp[1].trim().replace(/\s+as\s+/g,': ');
 entry=entry.replace(imp[0],'const { '+binding+' } = __require('+JSON.stringify(cleanId(dep))+');');
}
const bundle='(()=>{const __factories={'+[...modules].map(([id,body])=>JSON.stringify(id)+':'+body).join(',')+'};const __cache={};function __require(id){if(__cache[id])return __cache[id];const out=__cache[id]={};if(!__factories[id])throw Error("Module missing: "+id);return __factories[id](__require,out)}\n'+entry+'\n})();';
html=html.replace(tag,()=>'<script>'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>');
const out=path.join(root,'combat-review-dist');await mkdir(out,{recursive:true});await writeFile(path.join(out,'offline.html'),html);console.log('Review modules: '+modules.size);
