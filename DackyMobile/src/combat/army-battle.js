import { canEquip, resolveArtifactRound, resolveArtifactStrikes } from './army-artifacts.js';
import { tacticalProfile, specialPassiveModifiers } from './tactics-v6.js';
import { prepareCommanders, commanderSnapshot, commanderChoice, chooseStance, TACTICAL_STANCES, createWall, hitWall, applyCommanderFatigue } from './command-v8.js';
import { commanderDuel } from './battle-session-v10.js';
import { aggregateSquadStacks, validateSquadAllocation, squadView } from './squad-ownership.js';
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
  if(o.condition==='equippedCompanion'&&(side.heroId!==o.heroId||!side.equippedArtifactIds.includes(o.artifactId)||!canEquip(index.artifacts[o.artifactId],hero,{level:side.level,ownedArtifactIds:side.ownedArtifactIds}).ok))return n;
  if(o.kind==='troopRecover')return n+Math.min(side.initialTroops-side.troops,side.troops*o.ratio)/Math.max(1,side.initialTroops)*5;
  if(o.kind==='troopLoss')return n+o.ratio*3;
  if(o.kind==='modifier')return n+Math.abs(o.ratio)*1.5*(policy.enableTacticsV10&&o.stat==='defense'&&side.troops<enemy.troops?1.3:1);
  if(o.kind==='cancelArtifact'){const threat=(enemy.equippedArtifactIds||[]).some(id=>{const x=index.artifacts[id];return x?.status==='MAPPED'&&canEquip(x,index.heroes[enemy.heroId],{level:enemy.level,ownedArtifactIds:enemy.ownedArtifactIds}).ok&&(x.manaCost??policy.unknownManaCost??Infinity)<=enemy.mana;});return n+(threat?.8:.05);}
  if(o.kind==='blockAttack'||o.kind==='floorOne')return n+(side.troops<enemy.troops*.5?1:.08);
  if(o.kind==='reflectLethal')return n+(side.troops<enemy.troops*.3?.9:-1);
  if(o.kind==='convert')return n-.4;if(o.kind==='skipAttack')return n-.3;
  if(o.kind==='setVitalityBoth')return n+(side.vitality<enemy.vitality*.5?.5:-.5);
  return n+.05;
 },0)-((a.manaCost??policy.unknownManaCost??0)/Math.max(1,side.maxMana))*.3;
 const ranked=choices.map(a=>({id:a.id,score:score(a)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return ranked[0]?.score>0?ranked[0].id:null;
}
export function resolveArmyBattle({index,troops,sides,seed=1,policy={},siege=null}){
 const cfg={...ARMY_POLICY,...policy};
 if(!Array.isArray(sides)||sides.length!==2||!Number.isInteger(cfg.maxRounds)||cfg.maxRounds<1||cfg.maxRounds>100||!Number.isFinite(cfg.damageScale)||cfg.damageScale<=0||cfg.damageScale>10||!Number.isFinite(cfg.heroCommandScale)||cfg.heroCommandScale<0||cfg.heroCommandScale>1)throw Error('Invalid army policy');
 let army=sides.map(s=>({...s,equippedArtifactIds:[...(s.equippedArtifactIds||[])],stacks:normalizeArmyStacks(s.stacks,troops)}));
 const squadMode=sides.some(s=>s.squadStacks!==undefined);
 const advanced=squadMode||cfg.enableTacticsV10===true||cfg.enableTacticsV8===true||Boolean(siege)||sides.some(s=>s.reserves?.length||s.switchPlan||s.stance);
 const rosters=advanced?sides.map(s=>prepareCommanders(s,index)):null,active=[0,0],wall=createWall(siege);
 const groups=squadMode?sides.map((s,i)=>validateSquadAllocation(s.stacks,s.squadStacks,rosters[i].length).map(g=>g.length?normalizeArmyStacks(g,troops):[])):null;
 const viable=(i,j)=>rosters[i][j].vitality>0&&sum(groups[i][j])>0;
 const selectSquad=(i,j)=>{const c=rosters[i][j];army[i]={...army[i],legacyPassiveName:null,legacyDuelPassiveIds:[],ownedArtifactIds:undefined,switchLocked:false,...c,stacks:groups[i][j]};active[i]=j;};
 if(squadMode)for(let i=0;i<2;i++){const j=rosters[i].findIndex((_,k)=>viable(i,k));selectSquad(i,j<0?0:j);}
 const allStacks=i=>squadMode?aggregateSquadStacks(groups[i]):army[i].stacks;
 const total=i=>sum(allStacks(i));
 const challengeUsed=[false,false];
 const passiveNames=sides.map(s=>s.legacyPassiveName??null);
 const initial=army.map((s,i)=>total(i)),random=rngFor(seed),rounds=[],events=[];
 const summary=s=>({...s,troops:sum(s.stacks),initialTroops:s.stacks.reduce((n,t)=>n+t.initialCount,0)});
 const power=(side,other,mods,tactical,passive,enemyPassive,stances=['balanced','balanced'])=>{
  const own=side.stacks,enemy=other.stacks,total=sum(own),enemyTotal=sum(enemy);
  const avgDef=enemy.reduce((n,t)=>n+t.defense*t.count,0)/Math.max(1,enemyTotal),avgLife=enemy.reduce((n,t)=>n+t.life*t.count,0)/Math.max(1,enemyTotal);
  const hero=index.heroes[side.heroId],command=1+clamp(side.commandAttack??(hero?.physical??0)*cfg.heroCommandScale,0,1);
  const defense=Math.max(0,avgDef*(1+mods[1].defense+enemyPassive.defense+clamp(other.commandDefense??0,0,.3)+clamp(other.armyDefense??0,0,1))*TACTICAL_STANCES[stances[1]].defense),attack=own.reduce((n,t)=>n+t.attack*t.count,0)*Math.max(.05,1+mods[0].attack+passive.attack)*command*Math.max(.05,1+clamp(side.armyAttack??0,-.5,1)+clamp(side.armyMorale??0,0,.2))*Math.max(.05,1+tactical.counter+tactical.formation)*TACTICAL_STANCES[stances[0]].attack;
  return total&&enemyTotal?Math.min(enemyTotal,Math.max(cfg.enableBalanceV12&&attack>0?1:0,Math.floor(attack/(Math.max(1,avgLife*(1+clamp(other.armyLife??0,0,1)))+defense)*cfg.damageScale*(.9+random()*.2)))):0;
 };
 for(let round=1;round<=cfg.maxRounds&&(squadMode?rosters.every((r,i)=>r.some((_,j)=>viable(i,j))):army.every(s=>sum(s.stacks)>0));round++){
  const roundEvents=[],log=(type,side,data={})=>roundEvents.push({round,type,side,...data});
  if(advanced)for(let i=0;i<2;i++){
   const s=army[i],candidateRoster=squadMode?rosters[i].map((c,j)=>viable(i,j)?c:{...c,vitality:0}):rosters[i];
   const forced=squadMode&&!viable(i,active[i])?candidateRoster.findIndex(c=>c.vitality>0):-1;
   const c=forced>=0?{next:forced,reason:'SQUAD_DEFEATED'}:commanderChoice({side:s,roster:candidateRoster,active:active[i],round,index,enemy:army[1-i],plan:sides[i].switchPlan,mode:sides[i].commanderMode??'ordered'});
   if(c.next!==active[i]){const old=rosters[i][active[i]];active[i]=c.next;const next=rosters[i][active[i]];if(squadMode)selectSquad(i,c.next);else army[i]={...s,legacyPassiveName:null,legacyDuelPassiveIds:[],ownedArtifactIds:undefined,...next};log('commanderSwitch',i,{from:old.heroId,to:next.heroId,instanceId:next.instanceId,reason:c.reason,...(squadMode?{fromSquadId:old.instanceId,toSquadId:next.instanceId}:{})});}
   else if(sides[i].switchPlan?.[round]!==undefined&&c.reason!=='MANUAL')log('switchRejected',i,{reason:c.reason});
  }
  const before=army.map(s=>sum(s.stacks));
  const commands=sides.map(s=>s.roundCommands?.[round]??{});
  const inputs=army.map(summary);for(let i=0;i<2;i++){
   const c=commands[i];inputs[i].artifactId=Object.hasOwn(c,'artifactId')?c.artifactId:chooseArmyArtifact(index,inputs[i],inputs[1-i],cfg);
   if(cfg.enableTacticsV10&&c.challenge&&!challengeUsed[i])inputs[i].artifactId=null;
  }
  const prep=resolveArtifactRound({index,sides:inputs,round,policy:cfg});
  army=army.map((s,i)=>({...s,...prep.sides[i],stacks:allocateTroopDelta(s.stacks,prep.sides[i].troops-sum(s.stacks))}));
  if(cfg.enableTacticsV10){
   const challenger=commands.findIndex((c,i)=>c.challenge&&!challengeUsed[i]);
   if(challenger>=0){
    if(army.some(s=>!s.vitality||!sum(s.stacks))||prep.sides.some(s=>s.flags.spellSuppressed||s.flags.dispelSpells))log('duelRejected',challenger,{reason:'EXHAUSTED_OR_SPELL_SUPPRESSED'});
    else {challengeUsed[challenger]=true;const d=commanderDuel({index,sides:army,seed,round});
     for(let i=0;i<2;i++){Object.assign(army[i],d.resources[i]);Object.assign(prep.sides[i],d.resources[i]);}
     log('commanderDuel',challenger,{winner:d.winner,events:d.events,resources:d.resources,evidence:d.evidence});
    }
   }
  }
  const tactical=army.map((s,i)=>tacticalProfile(s.stacks,army[1-i].stacks,troops));
  const passives=army.map((s,i)=>specialPassiveModifiers({name:advanced?rosters[i][active[i]].legacyPassiveName:passiveNames[i],stacks:s.stacks,dict:troops,enabled:cfg.enableSimulatedLegacyPassives===true}));
  const stances=army.map((s,i)=>advanced?chooseStance({requested:commands[i].stance??sides[i].stance??'auto',own:sum(s.stacks),enemy:sum(army[1-i].stacks),tactical:tactical[i],wall,side:i}):'balanced');
  if(advanced)for(let i=0;i<2;i++)log('stance',i,{stance:stances[i]});
  const incoming=[power(army[1],army[0],[prep.sides[1].modifiers,prep.sides[0].modifiers],tactical[1],passives[1],passives[0],[stances[1],stances[0]]),power(army[0],army[1],[prep.sides[0].modifiers,prep.sides[1].modifiers],tactical[0],passives[0],passives[1],stances)];
  if(wall?.hp>0){const damage=prep.sides[0].flags.skipAttack||!army[0].vitality?0:hitWall(wall,army[0].stacks,troops,stances[0]);wall.hp-=damage;incoming[1]=0;log('wallHit',0,{amount:damage,hp:wall.hp,maxHp:wall.maxHp});if(!wall.hp)log('wallBreached',0);}
  if(advanced)for(let i=0;i<2;i++)if(!army[i].vitality){incoming[1-i]=0;log('commanderExhausted',i);}
  const settled=resolveArtifactStrikes(prep,incoming);
  army=army.map((s,i)=>({...s,...settled.sides[i],stacks:allocateTroopDelta(s.stacks,settled.sides[i].troops-sum(s.stacks))}));
  if(advanced)for(let i=0;i<2;i++){
   const c={...rosters[i][active[i]],...commanderSnapshot(army[i])},f=applyCommanderFatigue(c,Math.max(0,before[i]-sum(army[i].stacks)),(squadMode?army[i].stacks.reduce((n,t)=>n+t.initialCount,0):initial[i]));
   const {damage,...snapshot}=f;rosters[i][active[i]]=snapshot;army[i].vitality=snapshot.vitality;if(damage)log('commanderFatigue',i,{amount:damage,vitality:snapshot.vitality});
  }
  if(squadMode)for(let i=0;i<2;i++)groups[i][active[i]]=army[i].stacks;
  const prior=roundEvents.filter(e=>['commanderSwitch','switchRejected'].includes(e.type)),after=roundEvents.filter(e=>!prior.includes(e));
  const ev=[...prior,...settled.events.filter(e=>e.type!=='strikeLoss'),...after.filter(e=>e.type!=='commanderFatigue'),...settled.events.filter(e=>e.type==='strikeLoss'),...after.filter(e=>e.type==='commanderFatigue')].map((e,j)=>({...e,seq:events.length+j+1,...(squadMode&&(e.side===0||e.side===1)?{sideSquadId:rosters[e.side][active[e.side]].instanceId,opposingSquadId:rosters[1-e.side][active[1-e.side]].instanceId}:{})}));events.push(...ev);
  rounds.push({round,incoming,tactical,passives,stances,wall:wall?{...wall}:null,events:ev,sides:army.map(s=>({heroId:s.heroId,instanceId:advanced?rosters[army.indexOf(s)][active[army.indexOf(s)]].instanceId:s.instanceId,troops:sum(s.stacks),mana:s.mana,vitality:s.vitality,stacks:s.stacks.map(t=>({id:t.id,count:t.count})),switchLocked:s.switchLocked,...(squadMode?{squads:squadView(groups[army.indexOf(s)],rosters[army.indexOf(s)],active[army.indexOf(s)]),activeSquadId:rosters[army.indexOf(s)][active[army.indexOf(s)]].instanceId,totalTroops:total(army.indexOf(s))}:{})}))});
 }
 const ratios=army.map((s,i)=>total(i)/Math.max(1,initial[i]));
 const ready=squadMode?rosters.map((r,i)=>r.some((_,j)=>viable(i,j))):null;
 const winner=squadMode?(wall?.hp>0?1:ready[0]===ready[1]?null:ready[0]?0:1):(wall?.hp>0?1:ratios[0]===ratios[1]?null:ratios[0]>ratios[1]?0:1);
 return {winner,victory:winner===0,wall,commanders:rosters,activeCommanderIndices:advanced?active:null,rounds,events,sides:army.map((s,i)=>squadMode?{...summary(s),troops:total(i),initialTroops:initial[i],stacks:allStacks(i),squads:squadView(groups[i],rosters[i],active[i]),activeSquadId:rosters[i][active[i]].instanceId}:summary(s)),losses:army.map((s,i)=>initial[i]-total(i)),...(squadMode?{squadMode:true,termination:ready.every(Boolean)?'ROUND_LIMIT':'SQUAD_END'}:{}),evidence:'MIXED',formulaEvidence:'SIMULATED',settlementIntents:events.filter(e=>e.type==='settlementIntent'),challengeUsed};
}
