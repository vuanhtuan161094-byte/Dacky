import { LEGACY_DUEL_FACTS } from './legacy-duel-facts.js';
import { LEGACY_PROGRESSION_FACTS } from './legacy-progression-facts.js';
const rows=LEGACY_DUEL_FACTS.tables.pvptribunalinfo.rows;
const byId=new Map(rows.map(r=>[r.id,r]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const norm=s=>String(s??'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const attrs={20:'attack',21:'magic',22:'defense',23:'resistance'};
const reactive={10:'double',11:'guard',12:'counter',13:'guardCounter',14:'dodge'};
export function compileLegacyDuel(id){
 const row=byId.get(id);if(!row)return null;
 const ops=[],unknown=[];
 for(const i of [1,2]){
  const code=row['effectobject'+i],n=row['effectnum'+i],base=row['effectbasenum'+i];
  if(!code)continue;
  if(row.kind===2&&attrs[code]){
   // Code 22 conflicts with description on ID 50; refuse to silently resolve that conflict.
   if(id===50&&i===2){unknown.push({code,reason:'DESCRIPTION_CODE_CONFLICT'});continue}
   ops.push({kind:'statPassive',stat:attrs[code],ratio:n/100});
  }else if(row.kind===2&&code===15)ops.push({kind:'revive',chance:base/100,hpRatio:n/100});
  else if(row.kind===2&&[16,17,18,19].includes(code)&&reactive[base])ops.push({kind:'reactionChance',reaction:reactive[base],ratio:n/100});
  else if(row.kind===0&&reactive[code])ops.push({kind:'reaction',reaction:reactive[code],ratio:n/100,base:base/100});
  else if(row.kind===1){
   const type=({1:'manaBurst',2:'damage',3:'manaDrain',4:'lifeDrain',5:id===93?'nextGuard':'nextSkip',6:'damage',7:'damage',8:'nextGuard',9:'heal'})[code];
   if(type)ops.push({kind:type,ratio:id===10?.20:n/100,base:base/100,sourceAttributeCode:row['effectfromobject'+i]});
   else unknown.push({code});
  }else unknown.push({code});
 }
 return {id,name:row.name,kind:row.kind,mana:row.mana,raw:row,ops,unknown,status:unknown.length?(ops.length?'PARTIAL':'UNKNOWN'):'MAPPED',sourceEvidence:'VERIFIED_LEGACY',executionEvidence:'SIMULATED'};
}
export function legacyDuelCoverage(){return rows.map(r=>compileLegacyDuel(r.id))}
export function legacyHeroLinks(name){return LEGACY_DUEL_FACTS.tables.pvpgeneralproperskill.rows.filter(r=>r.ShowName===name).map(r=>({...r,skill:compileLegacyDuel(r.SkillID)}))}
export function legacySpecialEffects(name){return LEGACY_DUEL_FACTS.tables.specialeffectgeneralinfo.rows.filter(r=>r.Flage===name).map(r=>({...r,mechanics:'UNKNOWN_CODE_SEMANTICS'}))}
export function quoteStrategicSpell(id,energy){
 const row=LEGACY_PROGRESSION_FACTS.tables.theurgy.rows.find(r=>r.ID===id);
 return row?{ok:false,reason:energy<row.enegyNeed?'ENERGY':'WORLD_EFFECT_UNMAPPED',row,durationUnit:'UNKNOWN'}:{ok:false,reason:'UNKNOWN_ID'};
}
export function resolveLegacyDuel({fighters,seed=1,maxRounds=6,activeSkillIds=[2,3,4,5,6,7,8,9,10,93]}){
 if(!Array.isArray(fighters)||fighters.length!==2||fighters[0].id===fighters[1].id||!Number.isInteger(maxRounds)||maxRounds<1||maxRounds>100)throw Error('Invalid duel');
 let x=Number(seed)>>>0;const rng=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296};
 const events=[],rounds=[];let round=0;
 const log=(type,i,d={})=>events.push({seq:events.length+1,round,type,side:i,...d});
 const f=fighters.map(a=>{
  const stats={...a.stats};for(const k of ['attack','magic','defense','resistance','speed','maxHp','maxMana'])if(!Number.isFinite(stats[k])||stats[k]<0||k==='maxHp'&&stats[k]<1)throw Error('Invalid stat '+k);
  const passiveIds=[...new Set(a.passiveIds??[])],passives=passiveIds.map(compileLegacyDuel);
  if(passives.some(s=>!s||s.kind!==2))throw Error('Invalid passive');
  const reactions={double:.2,guard:.2,counter:.2,guardCounter:.2,dodge:.2};
  let revive=null;for(const p of passives)for(const o of p.ops){
   if(o.kind==='statPassive')stats[o.stat]*=1+o.ratio;
   if(o.kind==='reactionChance')reactions[o.reaction]+=o.ratio;
   if(o.kind==='revive')revive=o;
  }
  return {id:a.id,stats,hp:stats.maxHp,mana:stats.maxMana,passives:passiveIds,reactions,revive,revived:false,skip:0,guard:0};
 });
 const hit=(i,j,n,magic=false,react=true)=>{
  const a=f[i],b=f[j];if(a.hp<=0||b.hp<=0)return 0;
  let d=n*100/(100+b.stats[magic?'resistance':'defense']);
  if(b.guard>0){d*=1-b.guard;b.guard=0;log('guard',j)}
  let counter=0;
  // Probabilities use normalized weights; source intervals are retained but trigger model is simulated.
  if(react){const entries=Object.entries(b.reactions);let roll=rng()*entries.reduce((n,[,v])=>n+v,0);let choice=entries.find(([,v])=>(roll-=v)<0)?.[0];
   if(choice==='dodge'){d=0;log('dodge',j)}
   if(choice==='guard'){d*=.65;log('guard',j)}
   if(choice==='counter')counter=.5;
   if(choice==='guardCounter'){d*=.5;counter=.5}
  }
  const actual=Math.min(b.hp,Math.max(0,d));b.hp-=actual;log('damage',i,{target:j,amount:actual});
  if(b.hp<=0&&b.revive&&!b.revived){b.revived=true;if(rng()<b.revive.chance){b.hp=Math.max(1,b.stats.maxHp*b.revive.hpRatio);log('revive',j,{hp:b.hp})}}
  if(counter&&b.hp>0&&a.hp>0){log('counter',j);hit(j,i,b.stats.attack*counter,false,false)}
  return actual;
 };
 const heal=(i,n)=>{const a=f[i],v=Math.min(a.stats.maxHp-a.hp,Math.max(0,n));a.hp+=v;log('heal',i,{amount:v})};
 for(round=1;round<=maxRounds&&f.every(a=>a.hp>0);round++){
  const start=events.length;
  const order=[0,1].sort((a,b)=>f[b].stats.speed-f[a].stats.speed||a-b);
  for(const i of order){const a=f[i],j=1-i,b=f[j];if(a.hp<=0||b.hp<=0)continue;
   if(a.skip){a.skip--;log('skip',i);continue}
   const available=[...new Set(activeSkillIds)].map(compileLegacyDuel).filter(s=>s?.kind===1&&s.status==='MAPPED'&&s.mana<=a.mana&&s.id!==1);
   const score=s=>s.ops.reduce((n,o)=>n+(o.kind==='heal'?(1-a.hp/a.stats.maxHp)*3:o.kind==='manaDrain'?(1-a.mana/Math.max(1,a.stats.maxMana))*2:o.kind==='nextGuard'?(1-a.hp/a.stats.maxHp)*1.5:o.kind==='nextSkip'?.7:o.ratio||.5),0)-s.mana/Math.max(1,a.stats.maxMana)*.2;
   const s=available.sort((a,b)=>score(b)-score(a)||a.id-b.id)[0];
   if(s&&score(s)>.25){a.mana-=s.mana;log('cast',i,{skillId:s.id,name:s.name,mana:s.mana,evidence:'MIXED'});
    for(const o of s.ops){
     if(o.kind==='heal')heal(i,a.stats.maxHp*o.ratio);
     else if(o.kind==='manaDrain'){const n=Math.min(b.mana,a.stats.maxMana-a.mana,a.stats.magic*o.ratio);b.mana-=n;a.mana+=n;log('manaDrain',i,{target:j,amount:n})}
     else if(o.kind==='lifeDrain')heal(i,hit(i,j,a.stats.magic*o.ratio,true));
     else if(o.kind==='nextSkip')b.skip=1;
     else if(o.kind==='nextGuard')a.guard=s.id===93?1:clamp(o.ratio,0,1);
     else if(o.kind==='damage')hit(i,j,a.stats.magic*o.ratio,true);
    }
   }else{const double=rng()<clamp(a.reactions.double,0,1);if(double){log('double',i);hit(i,j,a.stats.attack*.7);hit(i,j,a.stats.attack*.7)}else hit(i,j,a.stats.attack)}
  }
  rounds.push({round,events:events.slice(start),fighters:f.map(a=>({id:a.id,hp:a.hp,mana:a.mana}))});
 }
 const ratios=f.map(a=>a.hp/a.stats.maxHp);return {winner:ratios[0]===ratios[1]?null:ratios[0]>ratios[1]?0:1,rounds,events,fighters:f.map(a=>({id:a.id,hp:a.hp,mana:a.mana,stats:a.stats})),evidence:'MIXED',formulaEvidence:'SIMULATED'};
}
