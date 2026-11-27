// Integration-ready, read-only catalog export against an exact Luna checkout.
// Existing art only. Do not rewrite any game files or overwrite source identity.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [rootArg,outArg,sha]=process.argv.slice(2);
const root=path.resolve(rootArg),out=path.resolve(outArg);
fs.mkdirSync(out,{recursive:true});
const load=p=>import(pathToFileURL(path.join(root,p)).href);
const {TROOPS,HEROES,ITEMS,TECHNOLOGIES,BUILDINGS,RESOURCE_INFO}=await load('src/catalog.js');
const {PVE_TROOPS}=await load('src/pve-campaign.js');
const {battleTroopFrame,battleCommanderFrame,BATTLE_EFFECT_FRAMES}=await load('src/visual-art-catalog.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-art-manifest.json'))).assets;
const mobile=JSON.parse(fs.readFileSync(path.join(root,'assets/mobile-source-manifest.json'))).assets;
const source=new Map([...mobile,...manifest].map(x=>[x.path,x]));
const normalize=p=>String(p||'').replace(/^\.\//,'');
const check=p=>{const key=normalize(p);return key.startsWith('assets/')&&fs.existsSync(path.join(root,key))};
const digest=p=>createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const verified=new Set();
function verify(p){
  const key=normalize(p);assert(check(key),'missing: '+key);
  if(!verified.has(key)){
    const row=source.get(key);if(row?.sha256)assert.equal(digest(key),row.sha256,key);
    verified.add(key);
  }return key;
}
const spriteRows=manifest.filter(x=>x.path.includes('/battle-ng/'));
const spriteIndex=new Map(spriteRows.map(x=>[x.family+'/'+x.state,x]));
function clip(f){
  const m=spriteRows.find(x=>x.path===normalize(f.path));assert(m,'missing manifest '+f.path);
  for(const k of ['width','height','frames','durationMs'])assert.equal(f[k],m[k],m.path+':'+k);
  verify(m.path);
  return {family:m.family,state:m.state,path:'./'+m.path,width:m.width,height:m.height,frames:m.frames,fps:m.fps,durationMs:m.durationMs,anchor:m.anchor,sha256:m.sha256};
}
const troopMap=[...new Map([...TROOPS,...PVE_TROOPS].map(x=>[x.id,x])).values()].map(t=>{
  const states=Object.fromEntries(['stand','run','attack','injured1','dead1'].map(s=>[s,clip(battleTroopFrame(t,s))]));
  return {id:t.id,name:t.name,role:t.role,sourceId:t.mobileSourceId??t.sourceId??null,icon:check(t.mobileImage)?'./'+verify(t.mobileImage):null,family:states.stand.family,mappingEvidence:'EXISTING_RUNTIME_HEURISTIC_NOT_VERIFIED_IDENTITY',states};
});
const heroMap=HEROES.map(h=>({id:h.id,name:h.name,sourceId:h.mobileSourceId??null,portrait:check(h.mobileImage)?'./'+verify(h.mobileImage):null,family:clip(battleCommanderFrame(h.id,'stand')).family,mappingEvidence:'SHARED_GENERIC_COMMANDER_NOT_IDENTITY'}));
const commanderFamilies=Object.fromEntries([...new Set(heroMap.map(h=>h.family))].map(f=>[f,Object.fromEntries(['stand','run','attack','dead1','cheer'].map(s=>{const m=spriteIndex.get(f+'/'+s);assert(m);return [s,clip({...m,path:'./'+m.path})]}))]));
const norm=s=>String(s||'').toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d');
const sourceItems=ITEMS.filter(i=>check(i.mobileImage));
const direct=new Map(sourceItems.map(i=>[norm(i.name)+'|'+i.type,i]));
// Only a visual surrogate. Never set mobileSourceId or source stats from it.
const patterns={
  sword:/\bkiem\b/,blade:/\bdao\b/,spear:/\bthuong\b/,bow:/\bcung\b/,
  armor:/\bgiap\b/,robe:/\bbao\b/,helmet:/\b(khoi|mao)\b/,
  pendant:/\b(boi|ngoc boi)\b/,pill:/\b(dan|hoan)\b/,herb:/\b(chi|thao|sam)\b/,
  token:/\b(phu|lenh|the)\b/,map:/\b(ban do|do)\b/,gem:/\b(ngoc|chau)\b/
};
function category(i){
  const n=norm(i.name);
  const keys=i.type==='vũ khí'?['sword','blade','spear','bow']:i.type==='giáp'?['armor','robe','helmet']:i.type==='pháp bảo'?['pendant','gem']:['pill','herb','token','map','gem'];
  return keys.find(k=>patterns[k].test(n))||null;
}
const candidates=new Map();
for(const i of sourceItems){
  const c=category(i);if(!c)continue;const key=i.type+'|'+c;
  if(!candidates.has(key))candidates.set(key,[]);
  candidates.get(key).push(i);
}
const itemMap=ITEMS.map(i=>{
  let art=null,kind='TEXT_FALLBACK',candidate=null;
  if(check(i.mobileImage)){art='./'+verify(i.mobileImage);kind='EXISTING_RUNTIME_IMAGE';}
  else{
    const exact=direct.get(norm(i.name)+'|'+i.type),c=category(i);
    candidate=exact||(c?candidates.get(i.type+'|'+c)?.[0]:null);
    if(candidate){art='./'+verify(candidate.mobileImage);kind=exact?'NAME_MATCH_VISUAL_ONLY':'CATEGORY_SURROGATE_REQUIRES_VISUAL_REVIEW';}
  }
  return {id:i.id,name:i.name,type:i.type,sourceId:i.mobileSourceId??null,art,kind,candidateId:candidate?.id??null,candidateName:candidate?.name??null,fallback:{'vũ khí':'VK','giáp':'GI','pháp bảo':'PB','vật phẩm':'VP'}[i.type]||'VT'};
});
const fxMap=Object.fromEntries(Object.entries(BATTLE_EFFECT_FRAMES).map(([k,f])=>{
  const m=manifest.find(x=>x.path===normalize(f.path));assert(m);verify(m.path);
  for(const k of ['width','height','frames','durationMs'])assert.equal(f[k],m[k],m.path);
  return [k,{...f,sourceEffect:m.effect,sourcePhase:m.phase,sha256:m.sha256,evidence:'EXISTING_GENERIC_EFFECT_MAPPING'}];
}));
const eventMap={strikeLoss:'normal',wallHit:'normal',wallBreached:'critical',artifactCast:'artifact',commanderDuel:'skill',troopDelta:'magic'};
const uiMap={
  technology:TECHNOLOGIES.map(x=>({id:x.id,name:x.name,art:check(x.mobileImage)?'./'+verify(x.mobileImage):null})),
  buildings:BUILDINGS.map(x=>({id:x.id,name:x.name,sourceArt:check(x.mobileImage)?'./'+verify(x.mobileImage):null,activeArtPolicy:'ART13_LOCK_NO_SUBSTITUTION'})),
  resources:Object.entries(RESOURCE_INFO).map(([id,x])=>({id,name:x.name})),
  sharedUI:manifest.filter(x=>x.path.includes('/blr-ui/')).map(x=>({path:'./'+verify(x.path),sha256:x.sha256}))
};
const summary={lunaSha:sha,troops:troopMap.length,troopFamilies:new Set(troopMap.map(x=>x.family)).size,heroes:heroMap.length,heroPortraits:heroMap.filter(x=>x.portrait).length,items:itemMap.length,itemKinds:Object.fromEntries([...new Set(itemMap.map(x=>x.kind))].map(k=>[k,itemMap.filter(x=>x.kind===k).length])),tech:uiMap.technology.length,techImages:uiMap.technology.filter(x=>x.art).length,fxKeys:Object.keys(fxMap).length,fxUniqueFiles:new Set(Object.values(fxMap).map(x=>x.path)).size,events:Object.keys(eventMap).length,verifiedReferencedFiles:verified.size,missingExactMappingsAreNotSourceParity:true};
const data={summary,troops:troopMap,heroes:heroMap,commanderFamilies,items:itemMap,ui:uiMap,fx:fxMap,events:eventMap};
for(const [k,v] of Object.entries(data))fs.writeFileSync(path.join(out,k+'.json'),JSON.stringify(v,null,2));
// Runtime-ready helpers. Deliberately separate from source facts; no new game engine.
fs.writeFileSync(path.join(out,'asset-integration.mjs'),[
  'export const itemVisuals = '+JSON.stringify(Object.fromEntries(itemMap.map(x=>[x.id,{art:x.art,kind:x.kind,fallback:x.fallback}])) )+';',
  'export const troopVisuals = '+JSON.stringify(Object.fromEntries(troopMap.map(x=>[x.id,x.states])))+';',
  'export const commanderVisuals = '+JSON.stringify(Object.fromEntries(heroMap.map(x=>[x.id,x.family])))+';',
  'export const commanderFamilies = '+JSON.stringify(commanderFamilies)+';',
  'export const effectVisuals = '+JSON.stringify(fxMap)+';',
  'export const eventVisuals = '+JSON.stringify(eventMap)+';',
  'export function resolveItemArt(item,{allowSurrogate=false}={}){const r=itemVisuals[item.id];if(!r)return {art:null,fallback:"VT",kind:"UNKNOWN"};return r.kind==="CATEGORY_SURROGATE_REQUIRES_VISUAL_REVIEW"&&!allowSurrogate?{...r,art:null}:r;}',
  'export function resolveTroopClip(id,state="stand"){const r=troopVisuals[id];return r?.[state]??r?.stand??null;}',
  'export function resolveCommanderClip(id,state="stand"){const r=commanderFamilies[commanderVisuals[id]];return r?.[state]??r?.stand??null;}',
  'export function resolveEventEffect(type){return effectVisuals[eventVisuals[type]]??null;}'
].join('\n'));
const adapter=await import(pathToFileURL(path.join(out,'asset-integration.mjs')).href);
for(const t of troopMap)for(const state of Object.keys(t.states))assert.equal(adapter.resolveTroopClip(t.id,state).path,t.states[state].path);
for(const i of itemMap){const r=adapter.resolveItemArt(i);if(i.kind==='CATEGORY_SURROGATE_REQUIRES_VISUAL_REVIEW')assert.equal(r.art,null);else assert.equal(r.art,i.art);}
for(const [e,k] of Object.entries(eventMap))assert.equal(adapter.resolveEventEffect(e).path,fxMap[k].path);
assert.equal(adapter.resolveEventEffect('unknown'),null);
assert.equal(adapter.resolveTroopClip('unknown'),null);
console.log(JSON.stringify(summary,null,2));
