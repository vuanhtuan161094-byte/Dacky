import { experienceForLevel } from '../simulated-world.js';
import { getPveEncounter, PVE_TROOPS } from '../pve-campaign.js';
// Product-facing pure adapter. Caller owns persistence and dispatch, never runs legacy settlement in parallel.
import { MOBILE_SOURCE_DATABASE,TROOPS,HEROES,ITEMS,TECHNOLOGIES,WORLD_NODES,IMMORTAL_MOUNTAINS,TOWER_FLOORS,BUZHOU_FLOORS } from '../catalog.js';
import { createCombatRuntime } from './runtime-v7.js';
import { createSourceDuelHero } from './hero-progression.js';
import { buzhouPlan,cityEffects,npcEffects,equipmentSets,itemBuff,pendingBattleBuff,itemUseRule,sourceGearGemRule } from '../gameplay-p15.js';
import { canEquip } from './army-artifacts.js';
// Three source artifacts omit an energy cost and two use a conversion effect.
// The runtime applies a bounded, explicit fallback policy instead of silently
// leaving those five records inert. Source effect operations remain intact.
export const PRODUCT_POLICY=Object.freeze({maxRounds:12,damageScale:.24,heroCommandScale:.0005,enableTacticsV8:true,enableTacticsV10:true,enableBalanceV12:true,unknownManaCost:120,enableSimulatedConversion:true,unknownManaEvidence:'SIMULATED',conversionEvidence:'SIMULATED'});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=x=>structuredClone(x);
const integer=(n,k,min=0)=>{if(!Number.isSafeInteger(n)||n<min)throw Error('Invalid '+k);return n};
const seeded=seed=>{let x=Number(seed)>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}};
const troopClassFor=id=>{const source=Number(TROOPS.find(row=>row.id===id)?.mobileSourceId);if([1000,1010,1020,1030,1040,1050].includes(source))return 'spear';if([1001,1011,1021,1031,1041,1051].includes(source))return 'shield';if([1002,1012,1022,1032,1042,1052].includes(source))return 'archer';if([1003,1013,1023,1033,1043,1053,1063].includes(source))return 'cavalry';return null;};
const formationAttackPower=(troops,formation,klass=null)=>formation.reduce((sum,row)=>{const id=row.id??row.unitId;if(klass&&troopClassFor(id)!==klass)return sum;return sum+(troops[id]?.attack??0)*row.count;},0);
export function createProductCombat({storageCapacity, runtime=null}={}){
 if(typeof storageCapacity!=='function')throw Error('Production storageCapacity callback required');
 const rt=runtime??createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:[...TROOPS, ...PVE_TROOPS],allowSimulatedLife:true});
 const heroes=Object.values(rt.index.heroes),byHero=new Map(HEROES.map(x=>[x.id,x])),byItem=new Map(ITEMS.map(x=>[x.id,x])),bySourceItem=new Map(ITEMS.filter(x=>x.mobileSourceId!=null).map(x=>[String(x.mobileSourceId),x]));
 function profileFor(save){
  const def=byHero.get(save.id);if(!def)throw Error('Unknown runtime hero '+save.id);
  let p=rt.index.heroes[String(def.mobileSourceId)];
  if(!p){const id='dev:'+def.id; p=rt.index.heroes[id]??{id,name:def.name,occupation:'Giáp sĩ',baseLevel:1,root:0,physical:def.attack*3,arcane:def.wisdom*3,strategy:def.wisdom*2,vitality:Math.max(1,def.defense*15),spirit:Math.max(1,def.wisdom*10),exclusiveArtifactIds:[],evidence:'SIMULATED'};rt.index.heroes[id]=p;}
  return p;
 }
 function gearBonus(save,slot){const id=save.equipment?.[slot],item=byItem.get(id);if(!item||(save.combatDurability?.[id]??100)<=0)return 0;const key=slot==='weapon'?['công','dũng']:['phòng','thể'];const sourced=(item.mobileStats??[]).filter(r=>key.some(k=>String(r[0]).toLowerCase().includes(k))).reduce((n,r)=>n+(Number(String(r[1]).replace(/[^0-9.]/g,''))||0),0),base=clamp(Math.max(Number(item.bonus)||0,sourced),0,300),upgrade=save.gearEnhancements?.[id];return clamp(base*(1+(upgrade?.rank||0)*.04+(upgrade?.stars||0)*.025+(upgrade?.gems?.length||0)*.03),0,300);}
 function duelStats(p,save,state=null,tower=false){
  const now=state?.lastTickAt??0,flat=key=>state?itemBuff(state,key,now):0;
  const stats=createSourceDuelHero({...p,root:p.root+(save.rootBonus??0)+(save.sourceRootBonus??0)+Object.values(save.mobileRootBonuses||{}).reduce((n,v)=>n+(Number(v)||0),0),physical:p.physical+flat('heroFlatPhysical'),arcane:p.arcane+flat('heroFlatArcane'),strategy:p.strategy+flat('heroFlatStrategy')},{level:save.level}).stats;
  if(state){
   const partyGems=new Set(state.heroes.filter(hero=>hero.assigned).flatMap(hero=>Object.values(hero.equipment??{}).filter(id=>id&&(hero.combatDurability?.[id]??100)>0).flatMap(id=>hero.gearEnhancements?.[id]?.gems??[]).map(gemId=>String(byItem.get(gemId)?.mobileSourceId??''))));
   if(partyGems.has('7671'))stats.attack=Math.round((stats.attack+100)*1.08);
   if(partyGems.has('7672'))stats.defense=Math.round((stats.defense+100)*1.10);
   if(partyGems.has('7673'))stats.magic=Math.round((stats.magic+100)*1.08);
   const now=state.lastTickAt??0,bonus=key=>Math.max(itemBuff(state,key,now),itemBuff(state,'hero:'+save.id+':'+key,now));
   const physical=bonus('heroPhysical'),arcane=bonus('heroArcane'),strategy=bonus('heroStrategy'),vitality=bonus('heroVitality'),mana=bonus('heroMana');
   stats.attack=Math.round(stats.attack*(1+physical));stats.magic=Math.round(stats.magic*(1+arcane));
   stats.defense=Math.round(stats.defense*(1+strategy*.3+vitality*.2));stats.resistance=Math.round(stats.resistance*(1+strategy*.3+mana*.2));
   stats.speed=Math.round(stats.speed*(1+strategy*.4));stats.maxHp=Math.round(stats.maxHp*(1+vitality));stats.maxMana=Math.round(stats.maxMana*(1+mana));
  }
  const artifactItem=byItem.get(save.equipment?.artifact),artifactId=artifactItem?.mobileSourceId==null?null:String(artifactItem.mobileSourceId),artifactProfile=artifactId&&rt.index.artifacts[artifactId],artifactStars=artifactItem?.type==='pháp bảo'&&artifactProfile&&canEquip(artifactProfile,p,{level:save.level,ownedArtifactIds:[artifactId]}).ok?clamp(save.gearEnhancements?.[artifactItem.id]?.stars||0,0,15):0;
  // Source text says artifact stars strengthen its battle effect, but gives no
  // scale. Apply a capped, state-local combat-stat bridge; never alter the shared
  // Combat Engine's source artifact operations.
  if(artifactStars){const scale=1+artifactStars*.02;for(const key of ['attack','magic','defense','resistance'])stats[key]=Math.round(stats[key]*scale);}
  const weapon=gearBonus(save,'weapon')+gearBonus(save,'relic')+gearBonus(save,'relic2'),armor=['armor','helmet','belt','boots','gloves','mount'].reduce((n,k)=>n+gearBonus(save,k),0),mastery=1+clamp(Number(save.skillLevel)||1,1,10)*.025+clamp(Number(save.affinity)||0,0,100)*.001,activeSets=equipmentSets(save).reduce((n,s)=>n+s.active.length,0),matrix=1+Math.min(.35,(save.matrices?.length??0)*.015)+Math.min(.20,activeSets*.03);
  const out={...stats,attack:Math.round((stats.attack+weapon+(save.potential?.attack??0))*mastery*matrix),magic:Math.round((stats.magic+weapon*.4+(save.potential?.magic??0))*mastery*matrix),defense:Math.round((stats.defense+armor+(save.potential?.defense??0))*matrix),resistance:stats.resistance+Math.round(armor*.6)};
  const book=tower&&itemUseRule(bySourceItem.get(String(save.towerBookSourceId||'')))?.towerEffects;
  for(const [key,ratio] of Object.entries(book?.stats||{}))if(Number.isFinite(out[key])&&Number.isFinite(ratio))out[key]=Math.round(out[key]*(1+ratio));
  // Keep the source percentage visible after the runtime's integer stat
  // rounding so small but valid gems also affect real duel and commander input.
  if(state){
   const gems=Object.values(save.equipment??{}).filter(id=>id&&(save.combatDurability?.[id]??100)>0).flatMap(id=>save.gearEnhancements?.[id]?.gems??[]).map(id=>sourceGearGemRule(byItem.get(id))).filter(Boolean);
   for(const gem of gems)if(gem.kind==='heroStatGem'&&Number.isFinite(out[gem.stat]))out[gem.stat]*=1+gem.ratio;
   for(const gem of gems)if(gem.kind==='equipmentStatGem')for(const [key,ratio] of Object.entries(gem.stats??{}))if(Number.isFinite(out[key]))out[key]*=1+ratio;
   const expectedExtra=gems.filter(gem=>gem.kind==='heroCombatGem'&&['followUpAttack','counterAttack'].includes(gem.trait)).reduce((sum,gem)=>sum+gem.chance,0),dodge=gems.filter(gem=>gem.kind==='heroCombatGem'&&gem.trait==='dodge').reduce((sum,gem)=>sum+gem.chance,0);
   if(expectedExtra)out.attack*=1+Math.min(.5,expectedExtra);
   if(dodge){const reduction=Math.min(.35,dodge);for(const key of ['defense','resistance'])out[key]=(100+out[key])/(1-reduction)-100;}
  }
  return out;
 }
 function commander(save,state){
  const p=profileFor(save),level=integer(save.level,'hero level',1),stats=duelStats(p,save,state);
  const gear=byItem.get(save.equipment?.artifact),aid=gear?.mobileSourceId==null?null:String(gear.mobileSourceId),artifact=rt.index.artifacts[aid];
  const ids=artifact&&(save.combatDurability?.[gear.id]??100)>0&&canEquip(artifact,p,{level}).ok?[aid]:[];
  return {heroId:p.id,instanceId:save.id,level,mana:clamp(Math.floor(save.combatMana??stats.maxMana),0,stats.maxMana),maxMana:stats.maxMana,vitality:clamp(Math.floor(save.combatVitality??stats.maxHp),0,stats.maxHp),maxVitality:stats.maxHp,equippedArtifactIds:ids,ownedArtifactIds:ids,commandAttack:clamp((stats.attack+stats.magic*.3)*.0005,0,1),commandDefense:clamp(gearBonus(save,'armor')*.001,0,.3),evidence:p.evidence};
 }
 function recover(state,now){if(!Number.isFinite(now))throw Error('INVALID_TIME');const s=copy(state);for(const h of s.heroes){const last=h.combatUpdatedAt;if(!Number.isFinite(last)||now<=last)continue;const c=commander(h,s),ticks=Math.floor((now-last)/60000);if(ticks<=0)continue;h.combatMana=Math.min(c.maxMana,c.mana+Math.ceil(c.maxMana*.05)*ticks);h.combatVitality=Math.min(c.maxVitality,c.vitality+Math.ceil(c.maxVitality*.05)*ticks);h.combatUpdatedAt=last+ticks*60000;}return s;}
 function enemyCommander(n, requestedLevel, name, bossLoadout=null){
  const named=name?heroes.find(row=>row.name===name):null,p=named??heroes[(Math.max(0,n-1)*37)%heroes.length],level=requestedLevel??p.baseLevel,stats=createSourceDuelHero(p,{level}).stats;
  const spells=[...new Set((bossLoadout?.spells??[]).map(String).filter(id=>rt.index.artifacts[id]?.status==='MAPPED'))];
  const gear=(bossLoadout?.equipment??[]).map(row=>({row,item:ITEMS.find(item=>String(item.mobileSourceId)===String(row.id)&&item.fieldProvenance?.mobileSourceId?.sourceTable==='vat-pham')})).filter(x=>x.item);
  const stat=(item,re)=>(item.mobileStats??[]).filter(row=>re.test(String(row[0]).toLowerCase())).reduce((sum,row)=>sum+(Number(String(row[1]).replace(/[^0-9.]/g,''))||0),0);
  // Exact Mobile IDs are reused where available; forge scaling is a clearly
  // labeled local adapter because the legacy equipment formula is unknown.
  const attackGear=gear.reduce((sum,{row,item})=>sum+Math.max(stat(item,/công|đánh|attack/),stat(item,/pháp/))*(1+Math.max(0,row.forgeLevel||0)*.05),0);
  const defenseGear=gear.reduce((sum,{row,item})=>sum+Math.max(stat(item,/thủ|phòng|defen/),stat(item,/thể/))*(1+Math.max(0,row.forgeLevel||0)*.05),0);
  return {heroId:p.id,instanceId:'npc:'+n,name:name||p.name,level,mana:stats.maxMana,maxMana:stats.maxMana,vitality:stats.maxHp,maxVitality:stats.maxHp,equippedArtifactIds:spells,ownedArtifactIds:spells,commandAttack:clamp((stats.attack+attackGear)*PRODUCT_POLICY.heroCommandScale,0,1),commandDefense:clamp(defenseGear*.001,0,.3),equipmentSourceIds:gear.map(x=>x.item.mobileSourceId),loadoutEvidence:bossLoadout?'MIXED':'SIMULATED'};
 }
 function assigned(state){const out=state.heroes.filter(h=>h.assigned).slice(0,3);if(!out.length)throw Error('No assigned commander');return out}
 function ensureNew(state,id){if(typeof id!=='string'||!id)throw Error('Missing battle ID');if((state.combatReceipts??[]).includes(id))throw Error('ALREADY_SETTLED');}
 function marchInput(state,q){
  const node=WORLD_NODES.find(n=>n.id===q.nodeId)??getPveEncounter(q.nodeId);if(!node)throw Error('UNKNOWN_NODE');
  const stacks=Object.entries(q.troops??{}).map(([id,count])=>{if(!rt.troops[id])throw Error('UNKNOWN_TROOP');return {id,count:integer(count,'troop count',1)}});
  if(!stacks.length)throw Error('EMPTY_MARCH');
  const e=new Map();const override=state.gameplay?.strategic?.npc?.[node.id]?.troops;const formation=override?Object.entries(override).filter(([,count])=>count>0).map(([unitId,count])=>({unitId,count})):node.enemy?.formation??[];for(const r of formation){if(!rt.troops[r.unitId])throw Error('UNKNOWN_NPC_TROOP');const count=integer(r.count,'NPC troops',1);e.set(r.unitId,(e.get(r.unitId)??0)+count)}
  if(!e.size)throw Error('EMPTY_NPC');
  const party=q.commanderIds?q.commanderIds.map(id=>{const h=state.heroes.find(x=>x.id===id);if(!h)throw Error('COMMANDER_MISSING');return h}):assigned(state);
  const [a,...reserves]=party.map(h=>commander(h,state));
  if(a.vitality===0&&!reserves.some(x=>x.vitality>0))throw Error('EXHAUSTED');
  const n=Number(node.id.split(/[-:]/).at(-1))||1,enemy=enemyCommander(n,node.commanderLevel,node.enemy.commander??node.enemy.formation?.[0]?.commander,node.bossLoadout),battleBuff=key=>pendingBattleBuff(state,key);
  a.commandAttack=clamp(a.commandAttack*(1+battleBuff('artifactPower')),0,1);
  enemy.commandAttack=clamp(enemy.commandAttack*(1-battleBuff('enemyArtifactPowerReduction')),0,1);
  if(battleBuff('enemyArtifactBlock'))enemy.equippedArtifactIds=[];
  const rate=(id,fallback)=>{const row=TECHNOLOGIES.find(x=>x.id===id)?.mobileLevelCosts?.find(x=>Number(x.level)===1),m=String(row?.effect??'').match(/([+-]?\\d+(?:[.,]\\d+)?)\\s*%/);return m?Number(m[1].replace(',','.'))/100:fallback;};
  const research=(id,fallback)=>clamp((state.technologies?.[id]??0)*rate(id,fallback),0,1);
  const ownMagic=cityEffects(state,state.lastTickAt??0),enemyMagic=npcEffects(state,node.id,state.lastTickAt??0),enemyStacks=[...e].map(([id,count])=>({id,count})),ownPower=formationAttackPower(rt.troops,stacks),enemyPower=formationAttackPower(rt.troops,enemyStacks),armyGems=party.flatMap(hero=>Object.values(hero.equipment??{}).filter(id=>id&&(hero.combatDurability?.[id]??100)>0).flatMap(id=>hero.gearEnhancements?.[id]?.gems??[]).map(id=>sourceGearGemRule(byItem.get(id)))).filter(gem=>gem?.kind==='armyCombatGem');
  // Army core has no per-stack colored-socket events. Keep troop-class effects
  // in this product adapter; first-round effects use a simulated six-round mean.
  let armyGemAttack=0,armyGemDefense=0;for(const gem of armyGems){const sourceShare=ownPower?formationAttackPower(rt.troops,stacks,gem.sourceClass)/ownPower:0;if(!sourceShare)continue;if(gem.effect==='firstRoundGuard')armyGemDefense+=gem.ratio*sourceShare/6;else if(gem.effect==='firstRoundAttack')armyGemAttack+=gem.ratio*sourceShare/6;else {const targetShare=gem.targetClass&&enemyPower?formationAttackPower(rt.troops,enemyStacks,gem.targetClass)/enemyPower:gem.targetClass?0:1;armyGemAttack+=gem.ratio*sourceShare*targetShare;}}
  // The captured wall level is a difficulty input. HP is the local siege curve.
  const cityWallHp = 8 + (node.mobileWallLevel ?? node.level ?? 1) * (1 + node.chapter / 2) + node.power * .025;
  const siege=node.kind==='Thành trì NPC'?{hp:Math.max(1,node.wallLevel*60),armor:12}:node.kind==='Danh thành'?{hp:Math.max(1,Math.round(cityWallHp)),armor:4+node.chapter}:null;
  const attritionAttack=Math.min(.35,battleBuff('enemyTroopLoss')*3);
  return {node,input:{battleId:q.battleId??'march:'+q.nodeId+':'+q.startAt+':'+q.seed,seed:q.seed,sides:[{...a,reserves,stance:'auto',commanderMode:'adaptive',stacks,armyAttack:research('tech-10',.012)+(ownMagic.attack??0)+battleBuff('attack')+attritionAttack+armyGemAttack,armyDefense:research('tech-11',.004)+(ownMagic.defense??0)+(ownMagic.wallDefense??0)+battleBuff('defense')+armyGemDefense,armyLife:research('tech-12',.02),armyMorale:clamp((state.morale??80)/500,0,.2)},{...enemy,stance:'auto',armyAttack:(state.world.treaties.includes(node.id)?-.12:0)-battleBuff('enemyAttackReduction'),armyDefense:(enemyMagic.defense??0)-battleBuff('enemyDefenseReduction'),stacks:enemyStacks}],siege,policy:{...PRODUCT_POLICY}}};
 }
 function credit(s,reward){const cap=storageCapacity(s);if(!Number.isFinite(cap)||cap<0)throw Error('INVALID_CAPACITY');const granted={};for(const [k,v] of Object.entries(reward)){if(!Object.hasOwn(s.resources,k)||!Number.isFinite(v)||v<0)continue;const before=s.resources[k];s.resources[k]=Math.min(k==='jade'?99999:cap,before+v);granted[k]=s.resources[k]-before}return granted;}
 function report(s,entry,now){s.reports.unshift({id:s.nextReportId++,at:now,...entry});s.reports=s.reports.slice(0,100);}
 function note(s,message){s.notifications=[message,...(s.notifications??[])].slice(0,12);}
 function xp(h,amount){if(h.level>=150)return;h.xp=(h.xp??0)+amount;while(h.level<150&&h.xp>=experienceForLevel(h.level)){h.xp-=experienceForLevel(h.level);h.level++;if(h.level%4===0)h.skillLevel=Math.min(10,(h.skillLevel??1)+1)}if(h.level>=150)h.xp=0;}
 function receipt(s,id){s.combatReceipts=[...(s.combatReceipts??[]),id];}
 function finishMarch(state,{now,commands=null}={}){
  const q=state.queues?.march;if(!q)throw Error('NO_PENDING_MARCH');if(!Number.isFinite(now)||now<q.finishAt)throw Error('MARCH_NOT_ARRIVED');
  const {node,input}=marchInput(state,q);ensureNew(state,input.battleId);
  let battle;if(commands){const session=rt.session(input);for(const cmd of commands)session.step(cmd);const snap=session.snapshot();if(!snap.finished)throw Error('BATTLE_NOT_FINISHED');battle=snap.result;}else battle=rt.army(input);
  const consumedBattleBuffs=(state.gameplay?.nextBattleBuffs??[]).map(({sourceId,key,ratio,evidence,simulated})=>({sourceId,key,ratio,evidence,simulated}));
  const s=copy(state);s.queues.march=null;if(s.gameplay)s.gameplay.nextBattleBuffs=[];const settlement=battle.settlement[0];
  for(const [id,n] of Object.entries(q.troops)){const left=settlement.remaining[id],w=settlement.wounded[id],d=settlement.dead[id];if(left+w+d!==n)throw Error('CASUALTY_MISMATCH');s.army[id]=(s.army[id]??0)+left;s.wounded[id]=(s.wounded[id]??0)+w;}
  for(const c of battle.commanders?.[0]??[]){const h=s.heroes.find(x=>x.id===c.instanceId);if(!h)throw Error('COMMANDER_MISSING');h.combatMana=c.mana;h.combatVitality=c.vitality;h.combatUpdatedAt=now;h.affinity=clamp((h.affinity??0)+(battle.victory?2:1),0,100);}
  // Unmapped durability/loyalty must be acknowledged by caller; cannot silently discard.
  const unresolved=battle.settlementIntents.filter(e=>e.targetSide===0);for(const intent of unresolved){const h=s.heroes.find(x=>x.id===battle.commanders?.[0]?.find(c=>c.heroId===intent.heroId)?.instanceId);if(!h)throw Error('INTENT_HERO_MISSING');if(intent.kind==='loyalty')h.combatLoyalty=clamp((h.combatLoyalty??100)+intent.amount,0,100);else if(intent.kind==='durability'){h.combatDurability={...(h.combatDurability??{})};for(const [slot,id] of Object.entries(h.equipment??{}))if(id)h.combatDurability[id]=clamp((h.combatDurability[id]??100)+intent.amount,0,100);}else throw Error('UNMAPPED_SETTLEMENT_INTENT');}
  let loot={},capturedHero=null;s.stats.battles++;
  if(battle.victory){s.stats.victories++;s.fame+=10+node.chapter*3;const chapter=s.world.chapterProgress[String(node.chapter)]??={wins:0,fieldWins:0,citiesCaptured:0};if(!node.pveEncounter)chapter.wins++;
   const captureChance=clamp(itemBuff(s,'captureChance',now),0,.25),enemyHero=HEROES.find(row=>String(row.mobileSourceId)===String(input.sides[1].heroId)),heroLimit=Math.min(60,3+(s.levels.manor||0)*2);
   if(captureChance&&enemyHero&&!s.heroes.some(row=>row.id===enemyHero.id)&&s.heroes.length<heroLimit&&seeded((q.seed^0x85ebca6b)>>>0)()<captureChance){const profile=rt.index.heroes[String(enemyHero.mobileSourceId)];capturedHero=enemyHero.id;s.heroes.push({id:enemyHero.id,level:clamp(profile?.baseLevel??1,1,100),xp:0,assigned:false,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:0});s.stats.heroesRecruited++;s.gameplay.actions.recruit=(s.gameplay.actions.recruit??0)+1;note(s,`Bắt giữ được thần tiên ${enemyHero.name} · tỷ lệ 5% theo lệnh bài; cơ chế bắt giữ có ngưỡng SIMULATED.`);}
   const reward={...node.loot};
   if (node.pveEncounter) {
     s.world.pveWins = {...s.world.pveWins, [node.id]: true};
     if(node.buzhouFloor)s.world.buzhouFloor=Math.max(s.world.buzhouFloor??0,node.buzhouFloor);
   } else if(node.kind==='Danh thành'){if(!s.world.captures.includes(node.id)){s.world.captures.push(node.id);if(s.gameplay)s.gameplay.actions.capture=(s.gameplay.actions.capture??0)+1;s.stats.citiesCaptured++;chapter.citiesCaptured++;s.world.treaties=s.world.treaties.filter(id=>id!==node.id);if(!s.cities.some(c=>c.nodeId===node.id)){const city={id:node.id,nodeId:node.id,name:node.name,level:1,population:70+node.chapter*8,isCapital:false};s.cities.push(city);s.population=Math.min(250000,s.population+city.population);}}}
   else {if(s.gameplay&&node.kind==='Dã địa')s.gameplay.fieldRank=Math.max(s.gameplay.fieldRank??0,node.level??1);chapter.fieldWins++;s.world.storyStage=Math.max(s.world.storyStage,node.chapter*3);}
   if(node.isBoss&&!s.world.campaignComplete){s.world.campaignComplete=true;s.stats.bossesDefeated++;s.world.storyStage=24;s.fame+=1000;for(const [k,v] of Object.entries({food:12000,timber:10000,stone:8000,iron:6000,gold:12000,jade:24}))reward[k]=(reward[k]??0)+v;}
   loot=credit(s,reward);
   for (const commander of battle.commanders?.[0] ?? []) {
     const hero = s.heroes.find(row => row.id === commander.instanceId);
     if (hero) xp(hero, Math.floor((30 + node.level * 5) * (1 + itemBuff(s, 'heroXp', now))));
   }
  }
  let itemDrop=null;const rng=seeded(q.seed^0x9e3779b9);if(battle.victory&&rng()<.3){const pool=ITEMS.filter(i=>i.type!=='vật phẩm'&&i.tier<=Math.min(5,1+Math.floor(node.chapter/2)));const item=pool[Math.floor(rng()*pool.length)];if(item&&s.items.length<500){s.items.push(item.id);itemDrop=item.id;}}
  s.morale=clamp(s.morale+(battle.victory?2:-5),0,100);receipt(s,input.battleId);report(s,{type:'army',target:node.name,targetKind:node.kind,victory:battle.victory,rounds:battle.rounds.map(r=>({...r,ownDamage:r.incoming[1],enemyDamage:r.incoming[0],ownMorale:s.morale,activeSkills:r.events.filter(e=>e.type==='artifactCast').map(e=>e.name)})),ownPower:Object.values(q.troops).reduce((n,v)=>n+v,0),enemyPower:input.sides[1].stacks.reduce((n,t)=>n+t.count,0),enemyCommander:input.sides[1].name||rt.index.heroes[input.sides[1].heroId].name,enemyFormation:input.sides[1].stacks.map(t=>({unitId:t.id,count:t.count})),bossLoadout:node.bossLoadout??null,enemyEquipmentSourceIds:input.sides[1].equipmentSourceIds??[],enemyCommandBonuses:{attack:input.sides[1].commandAttack??0,defense:input.sides[1].commandDefense??0},enemyLoadoutEvidence:input.sides[1].loadoutEvidence??'SIMULATED',battleCommands:q.battleCommands??commands??[],battleItems:consumedBattleBuffs,events:battle.events,dead:settlement.dead,wounded:settlement.wounded,loot,itemDrop,capturedHero,troopsSent:{...q.troops},combatBattleId:input.battleId,evidence:'SIMULATED'},now);note(s,node.name+(battle.victory?' · Thắng trận':' · Rút lui'));return {state:s,battle,loot};
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
  for(let i=0;i<party.length;i++){const h=party[i],c=commander(h,s);if(!c.vitality)continue;const p=rt.index.heroes[c.heroId],stats=duelStats(p,h,s,mode==='tower'),towerBook=mode==='tower'?itemUseRule(bySourceItem.get(String(h.towerBookSourceId||'')))?.towerEffects:null;
   const leechGems=Object.values(h.equipment??{}).filter(id=>id&&(h.combatDurability?.[id]??100)>0).flatMap(id=>h.gearEnhancements?.[id]?.gems??[]).map(id=>sourceGearGemRule(byItem.get(id))).filter(gem=>gem?.kind==='heroCombatGem'&&gem.trait==='lifeSteal');
   const hpRatio=c.maxVitality?c.vitality/c.maxVitality:0,duelInput={fighters:[{id:h.id,stats,hp:Math.min(stats.maxHp,Math.round(stats.maxHp*hpRatio)),mana:c.mana},enemy],seed:(Number(seed)+i*7919)>>>0,maxRounds:12,enableManaBurst:true};
   // The legacy fallback can loop on a zero-cost mana-drain cast. An equipped
   // leech gem uses the normal-hit policy so its described trigger can occur.
   if(leechGems.length)duelInput.activeSkillIds=[2,4,5,6,7,8,9,10,93];
   const r=rt.duel(duelInput);
   if(leechGems.length){const ordinaryHits=r.rounds.reduce((sum,turn)=>{let castByHero=false,damage=0;for(const event of turn.events){if(event.side===0&&event.type==='cast')castByHero=true;else if(event.side===0&&event.type==='damage'&&!castByHero)damage+=event.amount??0;}return sum+damage;},0),ratio=Math.min(.32,leechGems.reduce((sum,gem)=>sum+gem.ratio,0)),healed=Math.min(stats.maxHp-r.fighters[0].hp,Math.floor(ordinaryHits*ratio));if(healed>0){r.fighters[0].hp+=healed;const event={type:'lifeSteal',side:0,amount:healed,sourceId:leechGems[0].sourceId,evidence:'VERIFIED_MOBILE_RATIO+SIMULATED_DUEL_DAMAGE_BRIDGE'};r.events.push(event);if(r.rounds.length){const turn=r.rounds.at(-1);turn.events.push(event);turn.fighters[0].hp=r.fighters[0].hp;}}}
   if(r.fighters[0].hp<=0&&towerBook?.reviveChance&&seeded((Number(seed)^Math.imul(i+1,0x9e3779b1))>>>0)()<towerBook.reviveChance){r.fighters[0].hp=Math.max(1,Math.floor(stats.maxHp*towerBook.reviveHp));r.events.push({type:'towerBookRevive',heroId:h.id,sourceId:h.towerBookSourceId,hp:r.fighters[0].hp,evidence:towerBook.runtimeEffect||'SIMULATED'});}
   h.combatVitality=Math.max(0,Math.ceil(r.fighters[0].hp));h.combatMana=Math.max(0,Math.floor(r.fighters[0].mana));h.combatUpdatedAt=now;enemy={...enemy,hp:r.fighters[1].hp,mana:r.fighters[1].mana};
   rounds.push(...r.rounds.map(x=>({...x,commanderId:h.id})));events.push(...r.events.map((x,j)=>({...x,commanderId:h.id,seq:events.length+j+1})));h.affinity=clamp((h.affinity??0)+1,0,100);
   if(enemy.hp<=0||r.winner===0){victory=true;break;}
  }
  s.stats.duels++;let loot={};if(victory){if(mode==='tower')s.world.towerFloor=q.floor;else if(mode==='buzhou')s.world.buzhouFloor=q.floor;else {s.world.mountainWins.push(q.mountainId);if(s.gameplay)s.gameplay.mountainRank=Math.max(s.gameplay.mountainRank??0,q.floor);}loot=credit(s,q.reward);for(const h of party)xp(h,Math.floor((45+q.floor*8)*(1+itemBuff(s,'heroXp',now))));if((mode==='tower'&&q.floor%3===0)||(mode==='buzhou'&&q.floor===BUZHOU_FLOORS)||(mode==='mountain'&&q.floor%7===0)){const pool=ITEMS.filter(i=>i.type==='pháp bảo'&&i.tier<=10),item=pool[(q.floor+Math.floor(now))%pool.length];if(item&&!s.items.includes(item.id)&&s.items.length<500)s.items.push(item.id);}s.fame+=5+q.floor;}
  receipt(s,battleId);report(s,{type:'duel',mode,target:q.target,victory,rounds:rounds.map((r,i)=>({...r,round:i+1,ownDamage:r.events.filter(e=>e.type==='damage'&&e.side===0).reduce((n,e)=>n+e.amount,0),enemyDamage:r.events.filter(e=>e.type==='damage'&&e.side===1).reduce((n,e)=>n+e.amount,0),ownMorale:s.morale,activeSkills:r.events.filter(e=>e.type==='cast').map(e=>e.name)})),dead:{},wounded:{},loot,combatBattleId:battleId,evidence:'SIMULATED'},now);note(s,q.target+(victory?' · Chiến thắng':' · Thất bại'));return {state:s,battle:{victory,rounds,events},loot,quote:q};
 }
 return {runtime:rt,commander,recover,marchInput,finishMarch,quoteDuel,runDuel};
}
