// Product-facing pure adapter. Caller owns persistence and dispatch, never runs legacy settlement in parallel.
import { MOBILE_SOURCE_DATABASE,TROOPS,HEROES,ITEMS,TECHNOLOGIES,WORLD_NODES,IMMORTAL_MOUNTAINS,TOWER_FLOORS,BUZHOU_FLOORS } from '../catalog.js';
import { createCombatRuntime } from './runtime-v7.js';
import { createSourceDuelHero } from './hero-progression.js';
import { buzhouPlan,cityEffects,npcEffects,equipmentSets,itemBuff } from '../gameplay-p15.js';
import { canEquip } from './army-artifacts.js';
export const PRODUCT_POLICY=Object.freeze({maxRounds:12,damageScale:.24,heroCommandScale:.0005,enableTacticsV8:true,enableTacticsV10:true,enableBalanceV12:true,unknownManaCost:null,enableSimulatedConversion:false});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=x=>structuredClone(x);
const integer=(n,k,min=0)=>{if(!Number.isSafeInteger(n)||n<min)throw Error('Invalid '+k);return n};
const seeded=seed=>{let x=Number(seed)>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}};
export function createProductCombat({storageCapacity, runtime=null}={}){
 if(typeof storageCapacity!=='function')throw Error('Production storageCapacity callback required');
 const rt=runtime??createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:TROOPS,allowSimulatedLife:true});
 const heroes=Object.values(rt.index.heroes),byHero=new Map(HEROES.map(x=>[x.id,x])),byItem=new Map(ITEMS.map(x=>[x.id,x]));
 function profileFor(save){
  const def=byHero.get(save.id);if(!def)throw Error('Unknown runtime hero '+save.id);
  let p=rt.index.heroes[String(def.mobileSourceId)];
  if(!p){const id='dev:'+def.id; p=rt.index.heroes[id]??{id,name:def.name,occupation:'Giáp sĩ',baseLevel:1,root:0,physical:def.attack*3,arcane:def.wisdom*3,strategy:def.wisdom*2,vitality:Math.max(1,def.defense*15),spirit:Math.max(1,def.wisdom*10),exclusiveArtifactIds:[],evidence:'SIMULATED'};rt.index.heroes[id]=p;}
  return p;
 }
 function gearBonus(save,slot){const id=save.equipment?.[slot],item=byItem.get(id);if(!item||(save.combatDurability?.[id]??100)<=0)return 0;const key=slot==='weapon'?['công','dũng']:['phòng','thể'];const sourced=(item.mobileStats??[]).filter(r=>key.some(k=>String(r[0]).toLowerCase().includes(k))).reduce((n,r)=>n+(Number(String(r[1]).replace(/[^0-9.]/g,''))||0),0);return clamp(Math.max(Number(item.bonus)||0,sourced),0,300);}
 function duelStats(p,save){const stats=createSourceDuelHero({...p,root:p.root+(save.rootBonus??0)},{level:save.level}).stats,weapon=gearBonus(save,'weapon')+gearBonus(save,'relic')+gearBonus(save,'relic2'),armor=['armor','helmet','belt','boots','gloves','mount'].reduce((n,k)=>n+gearBonus(save,k),0),mastery=1+clamp(Number(save.skillLevel)||1,1,10)*.025+clamp(Number(save.affinity)||0,0,100)*.001;const activeSets=equipmentSets(save).reduce((n,s)=>n+s.active.length,0),matrix=1+Math.min(.35,(save.matrices?.length??0)*.015)+Math.min(.20,activeSets*.03);return {...stats,attack:Math.round((stats.attack+weapon+(save.potential?.attack??0))*mastery*matrix),magic:Math.round((stats.magic+weapon*.4+(save.potential?.magic??0))*mastery*matrix),defense:Math.round((stats.defense+armor+(save.potential?.defense??0))*matrix),resistance:stats.resistance+Math.round(armor*.6)};}
 function commander(save,state){
  const p=profileFor(save),level=integer(save.level,'hero level',1),stats=duelStats(p,save);
  const gear=byItem.get(save.equipment?.artifact),aid=gear?.mobileSourceId==null?null:String(gear.mobileSourceId),artifact=rt.index.artifacts[aid];
  const ids=artifact&&(save.combatDurability?.[gear.id]??100)>0&&canEquip(artifact,p,{level}).ok?[aid]:[];
  return {heroId:p.id,instanceId:save.id,level,mana:clamp(Math.floor(save.combatMana??stats.maxMana),0,stats.maxMana),maxMana:stats.maxMana,vitality:clamp(Math.floor(save.combatVitality??stats.maxHp),0,stats.maxHp),maxVitality:stats.maxHp,equippedArtifactIds:ids,ownedArtifactIds:ids,commandAttack:clamp((stats.attack+stats.magic*.3)*.0005,0,1),commandDefense:clamp(gearBonus(save,'armor')*.001,0,.3),evidence:p.evidence};
 }
 function recover(state,now){if(!Number.isFinite(now))throw Error('INVALID_TIME');const s=copy(state);for(const h of s.heroes){const last=h.combatUpdatedAt;if(!Number.isFinite(last)||now<=last)continue;const c=commander(h,s),ticks=Math.floor((now-last)/60000);if(ticks<=0)continue;h.combatMana=Math.min(c.maxMana,c.mana+Math.ceil(c.maxMana*.05)*ticks);h.combatVitality=Math.min(c.maxVitality,c.vitality+Math.ceil(c.maxVitality*.05)*ticks);h.combatUpdatedAt=last+ticks*60000;}return s;}
 function enemyCommander(n){
  const p=heroes[(Math.max(0,n-1)*37)%heroes.length],level=p.baseLevel,stats=createSourceDuelHero(p,{level}).stats;
  return {heroId:p.id,instanceId:'npc:'+n,level,mana:stats.maxMana,maxMana:stats.maxMana,vitality:stats.maxHp,maxVitality:stats.maxHp,equippedArtifactIds:[],ownedArtifactIds:[]};
 }
 function assigned(state){const out=state.heroes.filter(h=>h.assigned).slice(0,3);if(!out.length)throw Error('No assigned commander');return out}
 function ensureNew(state,id){if(typeof id!=='string'||!id)throw Error('Missing battle ID');if((state.combatReceipts??[]).includes(id))throw Error('ALREADY_SETTLED');}
 function marchInput(state,q){
  const node=WORLD_NODES.find(n=>n.id===q.nodeId);if(!node)throw Error('UNKNOWN_NODE');
  const stacks=Object.entries(q.troops??{}).map(([id,count])=>{if(!rt.troops[id])throw Error('UNKNOWN_TROOP');return {id,count:integer(count,'troop count',1)}});
  if(!stacks.length)throw Error('EMPTY_MARCH');
  const e=new Map();const override=state.gameplay?.strategic?.npc?.[node.id]?.troops;const formation=override?Object.entries(override).filter(([,count])=>count>0).map(([unitId,count])=>({unitId,count})):node.enemy?.formation??[];for(const r of formation){if(!rt.troops[r.unitId])throw Error('UNKNOWN_NPC_TROOP');const count=integer(r.count,'NPC troops',1);e.set(r.unitId,(e.get(r.unitId)??0)+count)}
  if(!e.size)throw Error('EMPTY_NPC');
  const party=q.commanderIds?q.commanderIds.map(id=>{const h=state.heroes.find(x=>x.id===id);if(!h)throw Error('COMMANDER_MISSING');return h}):assigned(state);
  const [a,...reserves]=party.map(h=>commander(h,state));
  if(a.vitality===0&&!reserves.some(x=>x.vitality>0))throw Error('EXHAUSTED');
  const n=Number(node.id.split('-').at(-1))||1,enemy=enemyCommander(n);
  const rate=(id,fallback)=>{const row=TECHNOLOGIES.find(x=>x.id===id)?.mobileLevelCosts?.find(x=>Number(x.level)===1),m=String(row?.effect??'').match(/([+-]?\\d+(?:[.,]\\d+)?)\\s*%/);return m?Number(m[1].replace(',','.'))/100:fallback;};
  const research=(id,fallback)=>clamp((state.technologies?.[id]??0)*rate(id,fallback),0,1);
  const ownMagic=cityEffects(state,state.lastTickAt??0),enemyMagic=npcEffects(state,node.id,state.lastTickAt??0);
  const siege=node.kind==='Danh thành'?{hp:Math.max(1,Math.round((node.mobileWallLevel??node.level??1)*20+node.power*.15)),armor:12}:null;
  return {node,input:{battleId:q.battleId??'march:'+q.nodeId+':'+q.startAt+':'+q.seed,seed:q.seed,sides:[{...a,reserves,stance:'auto',commanderMode:'adaptive',stacks,armyAttack:research('tech-10',.012),armyDefense:research('tech-11',.004)+(ownMagic.defense??0)+(ownMagic.wallDefense??0),armyLife:research('tech-12',.02),armyMorale:clamp((state.morale??80)/500,0,.2)},{...enemy,stance:'auto',armyAttack:state.world.treaties.includes(node.id)?-.12:0,armyDefense:enemyMagic.defense??0,stacks:[...e].map(([id,count])=>({id,count}))}],siege,policy:{...PRODUCT_POLICY}}};
 }
 function credit(s,reward){const cap=storageCapacity(s);if(!Number.isFinite(cap)||cap<0)throw Error('INVALID_CAPACITY');const granted={};for(const [k,v] of Object.entries(reward)){if(!Object.hasOwn(s.resources,k)||!Number.isFinite(v)||v<0)continue;const before=s.resources[k];s.resources[k]=Math.min(k==='jade'?99999:cap,before+v);granted[k]=s.resources[k]-before}return granted;}
 function report(s,entry,now){s.reports.unshift({id:s.nextReportId++,at:now,...entry});s.reports=s.reports.slice(0,100);}
 function note(s,message){s.notifications=[message,...(s.notifications??[])].slice(0,12);}
 function xp(h,amount){if(h.level>=60)return;h.xp=(h.xp??0)+amount;while(h.level<60&&h.xp>=100+34*h.level*h.level){h.xp-=100+34*h.level*h.level;h.level++;if(h.level%4===0)h.skillLevel=Math.min(10,(h.skillLevel??1)+1)}if(h.level>=60)h.xp=0;}
 function receipt(s,id){s.combatReceipts=[...(s.combatReceipts??[]),id];}
 function finishMarch(state,{now,commands=null}={}){
  const q=state.queues?.march;if(!q)throw Error('NO_PENDING_MARCH');if(!Number.isFinite(now)||now<q.finishAt)throw Error('MARCH_NOT_ARRIVED');
  const {node,input}=marchInput(state,q);ensureNew(state,input.battleId);
  let battle;if(commands){const session=rt.session(input);for(const cmd of commands)session.step(cmd);const snap=session.snapshot();if(!snap.finished)throw Error('BATTLE_NOT_FINISHED');battle=snap.result;}else battle=rt.army(input);
  const s=copy(state);s.queues.march=null;const settlement=battle.settlement[0];
  for(const [id,n] of Object.entries(q.troops)){const left=settlement.remaining[id],w=settlement.wounded[id],d=settlement.dead[id];if(left+w+d!==n)throw Error('CASUALTY_MISMATCH');s.army[id]=(s.army[id]??0)+left;s.wounded[id]=(s.wounded[id]??0)+w;}
  for(const c of battle.commanders?.[0]??[]){const h=s.heroes.find(x=>x.id===c.instanceId);if(!h)throw Error('COMMANDER_MISSING');h.combatMana=c.mana;h.combatVitality=c.vitality;h.combatUpdatedAt=now;h.affinity=clamp((h.affinity??0)+(battle.victory?2:1),0,100);}
  // Unmapped durability/loyalty must be acknowledged by caller; cannot silently discard.
  const unresolved=battle.settlementIntents.filter(e=>e.targetSide===0);for(const intent of unresolved){const h=s.heroes.find(x=>x.id===battle.commanders?.[0]?.find(c=>c.heroId===intent.heroId)?.instanceId);if(!h)throw Error('INTENT_HERO_MISSING');if(intent.kind==='loyalty')h.combatLoyalty=clamp((h.combatLoyalty??100)+intent.amount,0,100);else if(intent.kind==='durability'){h.combatDurability={...(h.combatDurability??{})};for(const [slot,id] of Object.entries(h.equipment??{}))if(id)h.combatDurability[id]=clamp((h.combatDurability[id]??100)+intent.amount,0,100);}else throw Error('UNMAPPED_SETTLEMENT_INTENT');}
  let loot={};s.stats.battles++;
  if(battle.victory){s.stats.victories++;s.fame+=10+node.chapter*3;const chapter=s.world.chapterProgress[String(node.chapter)]??={wins:0,fieldWins:0,citiesCaptured:0};chapter.wins++;
   const reward={...node.loot};
   if(node.kind==='Danh thành'){if(!s.world.captures.includes(node.id)){s.world.captures.push(node.id);if(s.gameplay)s.gameplay.actions.capture=(s.gameplay.actions.capture??0)+1;s.stats.citiesCaptured++;chapter.citiesCaptured++;s.world.treaties=s.world.treaties.filter(id=>id!==node.id);if(!s.cities.some(c=>c.nodeId===node.id)){const city={id:node.id,nodeId:node.id,name:node.name,level:1,population:70+node.chapter*8,isCapital:false};s.cities.push(city);s.population=Math.min(250000,s.population+city.population);}}}
   else {if(s.gameplay&&node.kind==='Dã địa')s.gameplay.fieldRank=Math.max(s.gameplay.fieldRank??0,node.level??1);chapter.fieldWins++;s.world.storyStage=Math.max(s.world.storyStage,node.chapter*3);}
   if(node.isBoss&&!s.world.campaignComplete){s.world.campaignComplete=true;s.stats.bossesDefeated++;s.world.storyStage=24;s.fame+=1000;for(const [k,v] of Object.entries({food:12000,timber:10000,stone:8000,iron:6000,gold:12000,jade:24}))reward[k]=(reward[k]??0)+v;}
   loot=credit(s,reward);
  }
  let itemDrop=null;const rng=seeded(q.seed^0x9e3779b9);if(battle.victory&&rng()<.3){const pool=ITEMS.filter(i=>i.type!=='vật phẩm'&&i.tier<=Math.min(5,1+Math.floor(node.chapter/2)));const item=pool[Math.floor(rng()*pool.length)];if(item&&s.items.length<500){s.items.push(item.id);itemDrop=item.id;}}
  s.morale=clamp(s.morale+(battle.victory?2:-5),0,100);receipt(s,input.battleId);report(s,{type:'army',target:node.name,targetKind:node.kind,victory:battle.victory,rounds:battle.rounds.map(r=>({...r,ownDamage:r.incoming[1],enemyDamage:r.incoming[0],ownMorale:s.morale,activeSkills:r.events.filter(e=>e.type==='artifactCast').map(e=>e.name)})),ownPower:Object.values(q.troops).reduce((n,v)=>n+v,0),enemyPower:input.sides[1].stacks.reduce((n,t)=>n+t.count,0),enemyCommander:rt.index.heroes[input.sides[1].heroId].name,enemyFormation:input.sides[1].stacks.map(t=>({unitId:t.id,count:t.count})),dead:settlement.dead,wounded:settlement.wounded,loot,itemDrop,troopsSent:{...q.troops},combatBattleId:input.battleId,evidence:'SIMULATED'},now);note(s,node.name+(battle.victory?' · Thắng trận':' · Rút lui'));return {state:s,battle,loot};
 }
 function quoteDuel(state,mode,mountainId){
  if(!['mountain','tower','buzhou'].includes(mode))throw Error('UNKNOWN_MODE');
  const mountain=mode==='mountain'?IMMORTAL_MOUNTAINS.find(x=>x.id===mountainId):null;
  if(mode==='mountain'&&(!mountain||state.world.mountainWins.includes(mountain.id)))throw Error('MOUNTAIN_UNAVAILABLE');
  const floor=mountain?mountain.rank:integer((mode==='tower'?state.world.towerFloor:state.world.buzhouFloor)+1,'floor',1);
  if(!mountain&&floor>(mode==='tower'?TOWER_FLOORS:BUZHOU_FLOORS))throw Error('FLOOR_CAP');
  const sourcePlan=mode==='buzhou'?buzhouPlan(floor):null;
  const difficulty=mountain?mountain.power:sourcePlan?Math.round(sourcePlan.minLevel*2+sourcePlan.lead/2000+sourcePlan.formation.reduce((n,r)=>n+r.count,0)/10000):42+floor*6.3;
  return {mode,mountainId:mountain?.id??null,floor,difficulty,sourcePlan,target:mountain?.name??(mode==='tower'?'Phong Thần Tháp':'Bất Chu Sơn')+' · '+floor,reward:mountain?mountain.loot:{gold:65+floor*9,jade:floor%3===0?1:0,food:40+floor*4},evidence:'SIMULATED'};
 }
 function runDuel(state,{battleId,mode,mountainId,seed=1,now}){
  ensureNew(state,battleId);if(!Number.isFinite(now))throw Error('INVALID_TIME');const q=quoteDuel(state,mode,mountainId),s=copy(state),party=assigned(s);
  // Existing source-based hero stats vs an explicitly simulated NPC difficulty curve.
  const d=q.difficulty,enemyStats={attack:Math.max(1,d*.65),magic:Math.max(1,d*.65),defense:d*.3,resistance:d*.3,speed:10+Math.sqrt(d),maxHp:Math.max(1,d*3),maxMana:Math.max(0,d*2)};
  let enemy={id:'npc',stats:enemyStats,hp:enemyStats.maxHp,mana:enemyStats.maxMana},rounds=[],events=[],victory=false;
  for(let i=0;i<party.length;i++){const h=party[i],c=commander(h,s);if(!c.vitality)continue;const p=rt.index.heroes[c.heroId],stats=duelStats(p,h);
   const r=rt.duel({fighters:[{id:h.id,stats,hp:c.vitality,mana:c.mana},enemy],seed:(Number(seed)+i*7919)>>>0,maxRounds:12,enableManaBurst:true});
   h.combatVitality=Math.max(0,Math.ceil(r.fighters[0].hp));h.combatMana=Math.max(0,Math.floor(r.fighters[0].mana));h.combatUpdatedAt=now;enemy={...enemy,hp:r.fighters[1].hp,mana:r.fighters[1].mana};
   rounds.push(...r.rounds.map(x=>({...x,commanderId:h.id})));events.push(...r.events.map((x,j)=>({...x,commanderId:h.id,seq:events.length+j+1})));h.affinity=clamp((h.affinity??0)+1,0,100);
   if(enemy.hp<=0||r.winner===0){victory=true;break;}
  }
  s.stats.duels++;let loot={};if(victory){if(mode==='tower')s.world.towerFloor=q.floor;else if(mode==='buzhou')s.world.buzhouFloor=q.floor;else {s.world.mountainWins.push(q.mountainId);if(s.gameplay)s.gameplay.mountainRank=Math.max(s.gameplay.mountainRank??0,q.floor);}loot=credit(s,q.reward);for(const h of party)xp(h,Math.floor((45+q.floor*8)*(1+itemBuff(s,'heroXp',now))));if((mode==='tower'&&q.floor%3===0)||(mode==='buzhou'&&q.floor===BUZHOU_FLOORS)||(mode==='mountain'&&q.floor%7===0)){const pool=ITEMS.filter(i=>i.type==='pháp bảo'&&i.tier<=10),item=pool[(q.floor+Math.floor(now))%pool.length];if(item&&!s.items.includes(item.id)&&s.items.length<500)s.items.push(item.id);}s.fame+=5+q.floor;}
  receipt(s,battleId);report(s,{type:'duel',mode,target:q.target,victory,rounds:rounds.map((r,i)=>({...r,round:i+1,ownDamage:r.events.filter(e=>e.type==='damage'&&e.side===0).reduce((n,e)=>n+e.amount,0),enemyDamage:r.events.filter(e=>e.type==='damage'&&e.side===1).reduce((n,e)=>n+e.amount,0),ownMorale:s.morale,activeSkills:r.events.filter(e=>e.type==='cast').map(e=>e.name)})),dead:{},wounded:{},loot,combatBattleId:battleId,evidence:'SIMULATED'},now);note(s,q.target+(victory?' · Chiến thắng':' · Thất bại'));return {state:s,battle:{victory,rounds,events},loot,quote:q};
 }
 return {runtime:rt,commander,recover,marchInput,finishMarch,quoteDuel,runDuel};
}
