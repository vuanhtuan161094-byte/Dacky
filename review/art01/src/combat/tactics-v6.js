import { LEGACY_DUEL_FACTS } from './legacy-duel-facts.js';
const norm=v=>String(v??'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function troopDictionary(rows,{allowSimulatedLife=false}={}){
 const out={};
 for(const t of rows){const id=String(t.id);if(Object.hasOwn(out,id))throw Error('Duplicate troop '+id);
  const life=t.mobileLife??t.life??(allowSimulatedLife?Math.max(1,t.defense*2):null);
  if(!Number.isFinite(life)||life<1)continue;
  out[id]={...t,life,lifeEvidence:t.mobileLife!=null?'VERIFIED_MOBILE':t.life!=null?'CALLER':'SIMULATED'};
 }return out;
}
export function counterPair(a,b,{fallback=.2}={}){
 const rows=a.mobileCounterRows??[],cls=norm(b.mobileClass),name=norm(b.name);
 if(rows.length&&cls){
  for(const row of rows){const target=String(row.target??''),key=norm(target.split('(')[0]),ex=target.match(/\(\s*trừ\s+(.+?)\s*\)/iu)?.[1];
   if(ex&&name.includes(norm(ex)))continue;
   if(key&&(cls===key||cls.includes(key)||key.includes(cls))&&Number.isFinite(Number(row.modifier)))return {ratio:clamp(Number(row.modifier),-.8,2),evidence:'VERIFIED_MOBILE',matched:target};
  }return {ratio:0,evidence:'SOURCE_NO_MATCH'};
 }return {ratio:a.counter&&a.counter===b.role?fallback:0,evidence:'SIMULATED'};
}
export function tacticalProfile(own,enemy,dict,{fallback=.2}={}){
 const total=own.reduce((n,s)=>n+s.count,0),other=enemy.reduce((n,s)=>n+s.count,0);
 let weighted=0,sourceCoverage=0;const pairs=[];
 for(const a of own)for(const b of enemy){if(!a.count||!b.count)continue;
  const w=a.count/Math.max(1,total)*b.count/Math.max(1,other),p=counterPair(dict[a.id],dict[b.id],{fallback});
  weighted+=w*p.ratio;if(p.evidence!=='SIMULATED')sourceCoverage+=w;
  if(p.ratio)pairs.push({attacker:a.id,defender:b.id,weight:w,...p});
 }
 const front=own.some(s=>s.count&&dict[s.id].lane==='front'),rear=own.some(s=>s.count&&['rear','siege'].includes(dict[s.id].lane));
 return {counter:weighted,sourceCoverage,formation:front&&rear?.06:0,pairs,evidence:'MIXED'};
}
// Raw code meanings are unverified. Explicitly opt in to a DEV mapping, never name-match a hero across versions automatically.
export function specialPassiveRows(name){return LEGACY_DUEL_FACTS.tables.specialeffectgeneralinfo.rows.filter(r=>r.Flage===name);}
export function specialPassiveModifiers({name,stacks,dict,enabled=false,sealed=false}){
 const rows=specialPassiveRows(name),pending=[],applied=[];let attack=0,defense=0;
 const total=stacks.reduce((n,s)=>n+s.count,0);
 for(const row of rows){
  if(!enabled||sealed||row.EffectKind!==0||![0,1].includes(row.EffectType)){pending.push(row.ID);continue}
  const count=stacks.filter(s=>String(dict[s.id].mobileSourceId)===String(row.EffectObject)).reduce((n,s)=>n+s.count,0);
  if(!count)continue;
  const ratio=row.EffectNum/100*count/Math.max(1,total),stat=row.EffectType===0?'attack':'defense';
  if(stat==='attack')attack+=ratio;else defense+=ratio;
  applied.push({id:row.ID,stat,ratio,evidence:'SIMULATED'});
 }return {attack,defense,applied,pending,evidence:'SIMULATED'};
}
export function classifyCasualties(initial,final,woundedRatio=.35){
 if(!Number.isFinite(woundedRatio)||woundedRatio<0||woundedRatio>1)throw Error('Invalid wounded ratio');
 const remaining={},dead={},wounded={};
 for(const s of initial){const n=final.find(x=>x.id===s.id)?.count??0;if(!Number.isSafeInteger(n)||n<0||n>s.count)throw Error('Invalid survivor count');
  remaining[s.id]=n;const lost=s.count-n;wounded[s.id]=Math.floor(lost*woundedRatio);dead[s.id]=lost-wounded[s.id];
 }return {remaining,dead,wounded,evidence:'SIMULATED'};
}
