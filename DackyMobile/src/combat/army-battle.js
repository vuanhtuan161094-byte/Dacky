import { canEquip, resolveArtifactRound, resolveArtifactStrikes } from './army-artifacts.js';
const int=(n,label)=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid '+label);return n};
const sum=s=>s.reduce((n,x)=>n+x.count,0),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rngFor=seed=>{let x=Number(seed)>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}};
export const ARMY_POLICY=Object.freeze({maxRounds:6,damageScale:.20,heroCommandScale:.0005,unknownManaCost:120,enableSimulatedConversion:true,evidence:'SIMULATED'});
export function normalizeArmyStacks(stacks,troops){
 if(!Array.isArray(stacks)||!stacks.length||stacks.length>100)throw Error('Invalid stacks');const ids=new Set();
 return stacks.map(s=>{const id=String(s.id),t=troops[id];if(!t||ids.has(id))throw Error('Unknown or duplicate troop '+id);ids.add(id);
  const initial=int(s.initialCount??s.count,'initial count'),count=int(s.count,'count');
  if(count>initial)throw Error('Count exceeds cap');
  for(const k of ['attack','defense','life','speed'])if(!Number.isFinite(t[k])||t[k]<0||(k==='life'&&t[k]<1))throw Error('Missing troop stat '+id+'.'+k);
  return {id,count,initialCount:initial,attack:t.attack,defense:t.defense,life:t.life,speed:t.speed};
 });
}
export function allocateTroopDelta(stacks,delta){
 if(!Number.isSafeInteger(delta))throw Error('Invalid delta');
 const out=stacks.map(s=>({...s})),sign=Math.sign(delta),weights=out.map(s=>sign<0?s.count:s.initialCount-s.count),cap=weights.reduce((a,b)=>a+b,0),target=Math.min(Math.abs(delta),cap);
 if(!target||!cap)return out;
 const parts=weights.map((w,i)=>({i,n:Math.floor(target*w/cap),fraction:target*w/cap-Math.floor(target*w/cap),id:out[i].id}));
 let remaining=target-parts.reduce((n,p)=>n+p.n,0);
 for(const p of parts.slice().sort((a,b)=>b.fraction-a.fraction||a.id.localeCompare(b.id)))if(remaining>0&&p.n<weights[p.i]){p.n++;remaining--}
 for(const p of parts)out[p.i].count+=sign*p.n;return out;
}
export function chooseArmyArtifact(index,side,enemy,policy=ARMY_POLICY){
 const hero=index.heroes[side.heroId];if(!hero||!side.troops||!enemy.troops)return null;
 const choices=(side.equippedArtifactIds||[]).map(String).map(id=>index.artifacts[id]).filter(a=>a?.status==='MAPPED'&&canEquip(a,hero,{level:side.level,ownedArtifactIds:side.ownedArtifactIds}).ok&&(a.manaCost??policy.unknownManaCost??Infinity)<=side.mana);
 const score=a=>a.ops.reduce((n,o)=>{
  if(o.condition==='enemyAtLeastTwiceOwn'&&enemy.troops<2*side.troops)return n;
  if(o.condition==='equippedCompanion'&&!side.equippedArtifactIds.includes(o.artifactId))return n;
  if(o.kind==='troopRecover')return n+Math.min(side.initialTroops-side.troops,side.troops*o.ratio)/Math.max(1,side.initialTroops)*5;
  if(o.kind==='troopLoss')return n+o.ratio*3;
  if(o.kind==='modifier')return n+Math.abs(o.ratio)*1.5;
  if(o.kind==='cancelArtifact')return n+((enemy.equippedArtifactIds||[]).length?.8:.05);
  if(o.kind==='blockAttack'||o.kind==='floorOne')return n+(side.troops<enemy.troops*.5?1:.08);
  if(o.kind==='reflectLethal')return n+(side.troops<enemy.troops*.3?.9:-1);
  if(o.kind==='convert')return n-.4;if(o.kind==='skipAttack')return n-.3;
  if(o.kind==='setVitalityBoth')return n+(side.vitality<enemy.vitality*.5?.5:-.5);
  return n+.05;
 },0)-((a.manaCost??policy.unknownManaCost??0)/Math.max(1,side.maxMana))*.3;
 const ranked=choices.map(a=>({id:a.id,score:score(a)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return ranked[0]?.score>0?ranked[0].id:null;
}
export function resolveArmyBattle({index,troops,sides,seed=1,policy={}}){
 const cfg={...ARMY_POLICY,...policy};
 if(!Array.isArray(sides)||sides.length!==2||!Number.isInteger(cfg.maxRounds)||cfg.maxRounds<1||cfg.maxRounds>100||!Number.isFinite(cfg.damageScale)||cfg.damageScale<=0||cfg.damageScale>10||!Number.isFinite(cfg.heroCommandScale)||cfg.heroCommandScale<0||cfg.heroCommandScale>1)throw Error('Invalid army policy');
 let army=sides.map(s=>({...s,equippedArtifactIds:[...(s.equippedArtifactIds||[])],stacks:normalizeArmyStacks(s.stacks,troops)}));
 const initial=army.map(s=>sum(s.stacks)),random=rngFor(seed),rounds=[],events=[];
 const summary=s=>({...s,troops:sum(s.stacks),initialTroops:s.stacks.reduce((n,t)=>n+t.initialCount,0)});
 const power=(side,other,mods)=>{
  const own=side.stacks,enemy=other.stacks,total=sum(own),enemyTotal=sum(enemy);
  const avgDef=enemy.reduce((n,t)=>n+t.defense*t.count,0)/Math.max(1,enemyTotal),avgLife=enemy.reduce((n,t)=>n+t.life*t.count,0)/Math.max(1,enemyTotal);
  const hero=index.heroes[side.heroId],command=1+clamp((hero?.physical??0)*cfg.heroCommandScale,0,1);
  const defense=Math.max(0,avgDef*(1+mods[1].defense)),attack=own.reduce((n,t)=>n+t.attack*t.count,0)*(1+mods[0].attack)*command;
  return total&&enemyTotal?Math.max(0,Math.floor(attack/(Math.max(1,avgLife)+defense)*cfg.damageScale*(.9+random()*.2))):0;
 };
 for(let round=1;round<=cfg.maxRounds&&army.every(s=>sum(s.stacks)>0);round++){
  const inputs=army.map(summary);for(let i=0;i<2;i++)inputs[i].artifactId=chooseArmyArtifact(index,inputs[i],inputs[1-i],cfg);
  const prep=resolveArtifactRound({index,sides:inputs,round,policy:cfg});
  army=army.map((s,i)=>({...s,...prep.sides[i],stacks:allocateTroopDelta(s.stacks,prep.sides[i].troops-sum(s.stacks))}));
  const incoming=[power(army[1],army[0],[prep.sides[1].modifiers,prep.sides[0].modifiers]),power(army[0],army[1],[prep.sides[0].modifiers,prep.sides[1].modifiers])];
  const settled=resolveArtifactStrikes(prep,incoming);
  army=army.map((s,i)=>({...s,...settled.sides[i],stacks:allocateTroopDelta(s.stacks,settled.sides[i].troops-sum(s.stacks))}));
  const ev=settled.events.map(e=>({...e,seq:events.length+e.seq}));events.push(...ev);
  rounds.push({round,incoming,events:ev,sides:army.map(s=>({heroId:s.heroId,troops:sum(s.stacks),mana:s.mana,vitality:s.vitality,stacks:s.stacks.map(t=>({id:t.id,count:t.count})),switchLocked:s.switchLocked}))});
 }
 const ratios=army.map((s,i)=>sum(s.stacks)/Math.max(1,initial[i]));const winner=ratios[0]===ratios[1]?null:ratios[0]>ratios[1]?0:1;
 return {winner,victory:winner===0,rounds,events,sides:army.map(summary),losses:army.map((s,i)=>initial[i]-sum(s.stacks)),evidence:'MIXED',formulaEvidence:'SIMULATED',settlementIntents:events.filter(e=>e.type==='settlementIntent')};
}
