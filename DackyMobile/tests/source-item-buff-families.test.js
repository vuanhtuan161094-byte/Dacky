import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, allConstructionQueues, constructionQueueCapacity, createNewGame, doAction, heroPower, marchTroopCapacity, migrateSave, productionPerHour, quoteBuilding, quoteGearStar, quoteItemPurchase, quoteTraining, storageCapacity } from '../src/engine.js';
import { BUILDINGS, HEROES, ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, itemBuff, itemUseRule } from '../src/gameplay-p15.js';
import { createProductCombat } from '../src/combat/product-v13.js';
import { experienceForLevel } from '../src/simulated-world.js';

const now=1_800_000_000_000,day=86_400_000,daySeconds=86_400;
const sourceItem=id=>ITEMS.find(item=>String(item.mobileSourceId)===String(id));
const withItem=id=>{const item=sourceItem(id),state=createNewGame('Triều Ca',now);assert.ok(item);state.items.push(item.id);return {item,state};};

test('Mobile imperial decree activates sourced production and warehouse buff family',()=>{
  const {item,state}=withItem('4503');
  const baselineProduction=productionPerHour(state),baselineCapacity=storageCapacity(state);
  const next=doAction(state,{type:'useItem',itemId:item.id},now);
  assert.ok(!next.items.includes(item.id));
  assert.equal(next.gameplay.itemBuffs.length,2);
  assert.equal(next.gameplay.itemBuffs.find(buff=>buff.key==='production').ratio,.25);
  assert.equal(next.gameplay.itemBuffs.find(buff=>buff.key==='storageCapacity').ratio,1);
  assert.equal(next.gameplay.itemBuffs[0].evidence,'VERIFIED_MOBILE');
  assert.equal(next.gameplay.itemBuffs[0].stackingEvidence,'SIMULATED');
  for(const resource of ['food','timber','stone','iron','gold','jade'])assert.ok(Math.abs(productionPerHour(next)[resource]-baselineProduction[resource]*1.25)<1e-8,`${resource} production buff`);
  assert.equal(storageCapacity(next),baselineCapacity*2);
  const reloaded=migrateSave(JSON.parse(JSON.stringify(next)),now+1);
  assert.equal(reloaded.gameplay.itemBuffs.find(buff=>buff.key==='production').sourceTable,'vat-pham');
  assert.equal(reloaded.gameplay.itemBuffs.find(buff=>buff.key==='production').status,'VERIFIED_MOBILE');
  const expired={...next,lastTickAt:now+31*day};
  assert.equal(productionPerHour(expired).food,baselineProduction.food);
  assert.equal(storageCapacity(expired),baselineCapacity);
});

test('Mobile Xuanyuan decree buffs affect XP, march speed and actual army attack/defense input',()=>{
  const combat=createProductCombat({storageCapacity});
  const node=WORLD_NODES.find(row=>row.kind==='Dã địa');
  const troop=TROOPS.find(row=>row.mobileSourceId);
  assert.ok(node&&troop);
  for(const [sourceId,seconds] of [['4505',7*86400],['4506',30*86400]]){
    const {item,state}=withItem(sourceId),rule=itemUseRule(item);
    assert.equal(rule.kind,'timedBuffSet');
    assert.equal(rule.evidence,'VERIFIED_MOBILE');
    assert.equal(rule.effects.find(effect=>effect.key==='captureChance')?.ratio,.05);
    const before=combat.marchInput(state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:77}).input;
    const next=doAction(state,{type:'useItem',itemId:item.id},now);
    const after=combat.marchInput(next,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:77}).input;
    const plainMarch=doAction(state,{type:'march',nodeId:node.id,troops:state.army},now);
    const buffMarch=doAction(next,{type:'march',nodeId:node.id,troops:next.army},now);
    assert.equal(next.gameplay.itemBuffs.length,5);
    assert.ok(next.gameplay.itemBuffs.every(buff=>buff.evidence==='VERIFIED_MOBILE'&&buff.status==='VERIFIED_MOBILE'));
    assert.equal(next.gameplay.itemBuffs[0].expiresAt,now+seconds*1000);
    assert.equal(cityEffects(next,now).marchSpeed,.25);
    assert.ok(buffMarch.queues.march.finishAt<plainMarch.queues.march.finishAt,'the sourced speed effect shortens an actual march');
    assert.equal(after.sides[0].armyAttack-before.sides[0].armyAttack,.10);
    assert.equal(after.sides[0].armyDefense-before.sides[0].armyDefense,.10);
    assert.equal(itemBuff(next,'captureChance',now),.05);
    assert.match(next.notifications[0],/tỷ lệ bắt giữ SIMULATED/);
  }
});

test('reusing a Mobile decree extends its duration without multiplying the sourced rate',()=>{
  const {item,state}=withItem('4506');
  let next=doAction(state,{type:'useItem',itemId:item.id},now);
  next.items.push(item.id);
  next=doAction(next,{type:'useItem',itemId:item.id},now+day);
  const attack=next.gameplay.itemBuffs.find(buff=>buff.key==='attack');
  assert.equal(attack.ratio,.10);
  assert.equal(attack.expiresAt,now+60*day);
  assert.equal(attack.stackingEvidence,'SIMULATED');
  assert.equal(cityEffects(next,now+day).attack,.10);
});

test('additional verified Mobile consumables execute through the shared timed-buff adapter',()=>{
  const combat=createProductCombat({storageCapacity});
  for(const [id,key,ratio,seconds] of [
    ['6303','heroXp',.15,daySeconds],['4922','marchSpeed',.30,7*daySeconds],['4954','heroXp',1,8*3600],
    ['95702','heroXp',2,daySeconds],['6534','production',.25,30*daySeconds],['6535','heroXp',.25,30*daySeconds],
    ['6536','trainingTimeReduction',.25,30*daySeconds],['8920','defense',1.2,3600],['4913','marchCapacity',.10,daySeconds]
  ]){
    const {item,state}=withItem(id),rule=itemUseRule(item);
    assert.equal(rule.kind,'timedBuffSet',`${id} has a runtime rule`);
    assert.equal(rule.evidence,'VERIFIED_MOBILE');
    assert.equal(rule.effects.find(effect=>effect.key===key)?.ratio,ratio,`${id} mapped field`);
    const next=doAction(state,{type:'useItem',itemId:item.id},now);
    assert.ok(!next.items.includes(item.id));
    assert.equal(itemBuff(next,key,now),ratio);
    assert.equal(next.gameplay.itemBuffs.find(effect=>effect.key===key).expiresAt,now+seconds*1000);
    assert.equal(next.gameplay.itemBuffs.find(effect=>effect.key===key).evidence,'VERIFIED_MOBILE');
  }

  const xpState=createNewGame('Triều Ca',now),double=sourceItem('4954'),triple=sourceItem('95702');
  xpState.items.push(double.id,triple.id);
  const both=doAction(doAction(xpState,{type:'useItem',itemId:double.id},now),{type:'useItem',itemId:triple.id},now);
  assert.equal(itemBuff(both,'heroXp',now),2,'X3 and X2 effects use the sourced maximum, not multiplication');

  const combatState=withItem('8920'),combatNext=doAction(combatState.state,{type:'useItem',itemId:combatState.item.id},now);
  const troop=TROOPS.find(row=>row.mobileSourceId),node=WORLD_NODES.find(row=>row.kind==='Dã địa');
  const input=combat.marchInput(combatNext,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:17}).input;
  assert.equal(input.sides[0].armyDefense,1.2);
  assert.equal(itemUseRule(combatState.item).exchangeTroopSourceId,'1043');

  const leadership=withItem('4913'),capacityBefore=marchTroopCapacity(leadership.state);
  const leadershipNext=doAction(leadership.state,{type:'useItem',itemId:leadership.item.id},now);
  assert.equal(marchTroopCapacity(leadershipNext),Math.floor(capacityBefore*1.1));
  assert.match(leadershipNext.notifications[0],/phạm vi sức chứa SIMULATED/);

  const trainer=withItem('6536'),eligible=TROOPS.find(row=>row.mobileSourceId&&!quoteTraining(trainer.state,row.id,1).locked);
  assert.ok(eligible);
  const baseSeconds=quoteTraining(trainer.state,eligible.id,1).seconds;
  const trained=doAction(trainer.state,{type:'useItem',itemId:trainer.item.id},now);
  assert.ok(Math.abs(quoteTraining(trained,eligible.id,1).seconds-baseSeconds*.75)<.01);
  const baseQueue=doAction(trainer.state,{type:'train',troopId:eligible.id,count:1},now);
  const boostedQueue=doAction(trained,{type:'train',troopId:eligible.id,count:1},now);
  assert.ok(Math.abs((boostedQueue.queues.training.finishAt-now)-(baseQueue.queues.training.finishAt-now)*.75)<.01);
});

test('VIP production packages add concurrent build queues and verified purchase categories receive a labeled simulated rate',()=>{
  const sourceIds=['8740','8950','6534'];
  for(const sourceId of sourceIds){
    const {item,state}=withItem(sourceId);state.resources={food:1_000_000,timber:1_000_000,stone:1_000_000,iron:1_000_000,gold:1_000_000,jade:100};
    const activated=doAction(state,{type:'useItem',itemId:item.id},now);
    assert.equal(constructionQueueCapacity(activated,now),5,sourceId);
    assert.equal(activated.gameplay.itemBuffs.find(buff=>buff.key==='constructionQueueCapacity').sourceId,sourceId);
  }
  const production=withItem('8950'),active=doAction(production.state,{type:'useItem',itemId:production.item.id},now);
  const candidates=BUILDINGS.filter(row=>!quoteBuilding(active,row.id).locked&&!quoteBuilding(active,row.id).maxed);
  assert.ok(candidates.length>=2);
  let queued=doAction(active,{type:'upgrade',buildingId:candidates[0].id},now);
  queued=doAction(queued,{type:'upgrade',buildingId:candidates[1].id},now);
  assert.equal(allConstructionQueues(queued).length,2);
  const advanced=advance(queued,Math.max(...allConstructionQueues(queued).map(row=>row.queue.finishAt))+1);
  assert.equal(allConstructionQueues(advanced.state).length,0);

  const experience=withItem('8952'),discounted=doAction(experience.state,{type:'useItem',itemId:experience.item.id},now);
  const questGood=ITEMS.find(row=>row.legacySourceId&&row.mobileGroup==='Nhiệm vụ');
  assert.ok(questGood);
  const before=quoteItemPurchase(experience.state,questGood.id,2),after=quoteItemPurchase(discounted,questGood.id,2);
  assert.equal(after.discountEvidence,'SIMULATED_20_PERCENT_MEMBER_RATE');
  assert.ok(after.cost.gold<before.cost.gold&&after.cost.food<before.cost.food);
});

test('Thần Lệnh Đế Vương has both source-described choices and Quân Kỳ cannot waste a duplicate while active',()=>{
  const token=withItem('8920');token.state.items.push(token.item.id);
  let state=doAction(token.state,{type:'useItem',itemId:token.item.id},now);
  assert.equal(itemBuff(state,'defense',now),1.2);
  const cavalry=TROOPS.find(row=>String(row.mobileSourceId)==='1043');
  assert.ok(cavalry);
  const before=state.army[cavalry.id]||0;
  state=doAction(state,{type:'exchangeItem',itemId:token.item.id},now+1);
  assert.equal(state.army[cavalry.id],before+1);
  assert.ok(!state.items.includes(token.item.id));
  assert.match(state.notifications[0],/số lượng đổi SIMULATED/);

  const banner=withItem('4913');banner.state.items.push(banner.item.id);
  const active=doAction(banner.state,{type:'useItem',itemId:banner.item.id},now);
  assert.throws(()=>doAction(active,{type:'useItem',itemId:banner.item.id},now+1),/Quân Kỳ đang có hiệu lực/);
  assert.equal(active.items.filter(id=>id===banner.item.id).length,1,'a rejected refresh does not consume the second banner');
});

test('timed hero stat awards, resource recovery, population tickets and the older Hổ Phù family reach gameplay state',()=>{
  const combat=createProductCombat({storageCapacity}),node=WORLD_NODES.find(row=>row.kind==='Dã địa'),troop=TROOPS.find(row=>row.mobileSourceId);
  const award=withItem('4401'),hero=award.state.heroes[0];
  const before=combat.marchInput(award.state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:7}).input.sides[0].commandAttack;
  let boosted=doAction(award.state,{type:'useItem',itemId:award.item.id,heroId:hero.id},now);
  const after=combat.marchInput(boosted,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:7}).input.sides[0].commandAttack;
  assert.ok(after>before);
  assert.equal(itemBuff(boosted,'hero:'+hero.id+':heroArcane',now),.10);

  const statPack=withItem('8931'),statBoost=doAction(statPack.state,{type:'useItem',itemId:statPack.item.id},now);
  assert.equal(itemBuff(statBoost,'heroVitality',now),.05);
  assert.ok(combat.marchInput(statPack.state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:7}).input.sides[0].commandAttack<combat.marchInput(statBoost,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:7}).input.sides[0].commandAttack);

  const recovery=withItem('4221'),recoveryHero=recovery.state.heroes[0];recoveryHero.combatMana=1;
  const restored=doAction(recovery.state,{type:'useItem',itemId:recovery.item.id,heroId:recoveryHero.id},now);
  assert.ok(restored.heroes[0].combatMana>1);
  const population=withItem('4903'),populationBefore=population.state.population;
  const populated=doAction(population.state,{type:'useItem',itemId:population.item.id},now);
  assert.ok(populated.population>populationBefore);

  const choice=withItem('8916'),choiceItem=choice.item,choiceTroop=TROOPS.find(row=>String(row.mobileSourceId)==='1012');
  assert.equal(itemUseRule(choiceItem).exchangeTroopSourceId,'1012');
  const exchanged=doAction(choice.state,{type:'exchangeItem',itemId:choiceItem.id},now);
  assert.equal(exchanged.army[choiceTroop.id],(choice.state.army[choiceTroop.id]||0)+1);
});

test('verified capture-rate buff resolves once on a winning eligible field battle and is saved in the report',()=>{
  const {item,state}=withItem('4504'),troop=TROOPS.find(row=>row.id==='troop-02'),node=WORLD_NODES.find(row=>row.id==='node-011'),start=1_800_000_003_000;
  state.army[troop.id]=100_000;
  state.items.push(item.id);
  let next=doAction(state,{type:'useItem',itemId:item.id},start);
  assert.equal(itemBuff(next,'captureChance',start),.05);
  next=doAction(next,{type:'march',nodeId:node.id,troops:{[troop.id]:100_000}},start);
  next=advance(next,next.queues.march.finishAt+1).state;
  assert.equal(next.reports.at(-1).victory,true);
  assert.equal(next.reports.at(-1).capturedHero,'hero-380');
  assert.ok(next.heroes.some(hero=>hero.id==='hero-380'));
  assert.equal(next.stats.heroesRecruited,1);
});

test('verified Thánh Dược Nhiên Đăng targets Lý Tịnh and changes later combat growth',()=>{
  const item=sourceItem('4961'),rule=itemUseRule(item),definition=HEROES.find(row=>row.mobileSourceId==='ly-tinh');
  assert.ok(item&&definition);
  assert.equal(rule.kind,'heroRootBoost');
  assert.equal(rule.targetHeroSourceId,'ly-tinh');
  assert.equal(rule.amount,21);
  let state=createNewGame('Triều Ca',now);state.items.push(item.id);
  assert.throws(()=>doAction(state,{type:'useItem',itemId:item.id},now),/Cần chiêu mộ Lý Tịnh/);
  assert.ok(state.items.includes(item.id),'an ineligible use keeps the source item');
  const hero={...structuredClone(state.heroes[0]),id:definition.id,level:150,assigned:true,equipment:{},potential:{attack:0,magic:0,defense:0}};
  state.heroes=[hero];
  const combat=createProductCombat({storageCapacity}),node=WORLD_NODES.find(row=>row.kind==='Dã địa'),troop=TROOPS.find(row=>row.mobileSourceId);
  const before=combat.marchInput(state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:31}).input;
  let next=doAction(state,{type:'useItem',itemId:item.id},now);
  assert.ok(!next.items.includes(item.id));
  assert.equal(next.heroes[0].sourceRootBonus,21);
  assert.equal(next.heroes[0].sourceRootBonusEvidence,'VERIFIED_MOBILE');
  assert.equal(next.heroes[0].sourceRootBonusSourceTable,'vat-pham');
  assert.equal(next.heroes[0].sourceRootBonusSourceField,'Description');
  assert.equal(next.heroes[0].sourceRootBonusSourceId,'4961');
  assert.equal(next.heroes[0].sourceRootBonusStackingEvidence,'SIMULATED');
  const after=combat.marchInput(next,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:31}).input;
  assert.ok(after.sides[0].commandAttack>before.sides[0].commandAttack,'the root increase changes commander combat growth');
  next=migrateSave(JSON.parse(JSON.stringify(next)),now+1);
  assert.equal(next.heroes[0].sourceRootBonus,21);
  next.items.push(item.id);
  assert.throws(()=>doAction(next,{type:'useItem',itemId:item.id},now+2),/đã nhận tối đa/);
});

test('source-described flat hero orders and recovery goods modify all-hero combat values and exact resource pools',()=>{
  const combat=createProductCombat({storageCapacity}),state=createNewGame('Triều Ca',now),hero=state.heroes[0];
  const base=combat.commander(hero,state).commandAttack,order=sourceItem('4812');state.items.push(order.id);
  const ordered=doAction(state,{type:'useItem',itemId:order.id},now);
  assert.equal(itemBuff(ordered,'heroFlatPhysical',now),10);
  assert.ok(combat.commander(ordered.heroes[0],ordered).commandAttack>base);
  assert.equal(ordered.gameplay.itemBuffs[0].expiresAt,now+2*3600*1000);
  const recovery=sourceItem('6422'),recoveryState=createNewGame('Triều Ca',now);recoveryState.items.push(recovery.id);recoveryState.heroes[0].combatMana=1;
  const restored=doAction(recoveryState,{type:'useItem',itemId:recovery.id,heroId:recoveryState.heroes[0].id},now);
  assert.equal(restored.heroes[0].combatMana,combat.commander(recoveryState.heroes[0],recoveryState).maxMana);
  assert.ok(!restored.items.includes(recovery.id));
  const flat=sourceItem('4815'),flatState=createNewGame('Triều Ca',now);flatState.items.push(flat.id);flatState.heroes[0].combatVitality=1;
  const healed=doAction(flatState,{type:'useItem',itemId:flat.id,heroId:flatState.heroes[0].id},now);
  assert.equal(healed.heroes[0].combatVitality,101);
});

test('source growth gifts preserve hero restrictions, add allocatable potential and survive migration',()=>{
  const definition=HEROES.find(row=>row.mobileSourceId==='loi-chan-tu'),gift=sourceItem('4955'),state=createNewGame('Triều Ca',now);
  state.heroes=[{...structuredClone(state.heroes[0]),id:definition.id,level:40,assigned:false,equipment:{},potential:{attack:80,magic:0,defense:0}}];state.items.push(gift.id);
  const rejected=structuredClone(state);rejected.heroes[0].id='hero-01';
  assert.throws(()=>doAction(rejected,{type:'useItem',itemId:gift.id,heroId:'hero-01'},now),/chỉ dùng được/);
  assert.ok(rejected.items.includes(gift.id));
  const grown=doAction(state,{type:'useItem',itemId:gift.id,heroId:definition.id},now);
  assert.ok(grown.heroes[0].mobileRootBonuses['4955']>=0&&grown.heroes[0].mobileRootBonuses['4955']<=2);
  assert.equal(grown.heroes[0].mobileRootBonusEvidence['4955'].evidence,'VERIFIED_MOBILE');
  const fixedGift=sourceItem('8011'),fixedDefinition=HEROES.find(row=>row.mobileSourceId==='ti-ba-tinh'),fixedState=createNewGame('Triều Ca',now);fixedState.heroes=[{...structuredClone(fixedState.heroes[0]),id:fixedDefinition.id,level:30,assigned:true,equipment:{},potential:{attack:0,magic:0,defense:0}}];fixedState.items.push(fixedGift.id);
  const combat=createProductCombat({storageCapacity}),before=combat.commander(fixedState.heroes[0],fixedState).maxVitality;
  const fixedGrown=doAction(fixedState,{type:'useItem',itemId:fixedGift.id,heroId:fixedDefinition.id},now),after=combat.commander(fixedGrown.heroes[0],fixedGrown).maxVitality;
  assert.equal(fixedGrown.heroes[0].mobileRootBonuses['8011'],10);assert.ok(after>before,'source root growth reaches the commander combat profile');
  const potential=sourceItem('8957');grown.items.push(potential.id);
  const gifted=doAction(grown,{type:'useItem',itemId:potential.id,heroId:definition.id},now+1),points=gifted.heroes[0].mobilePotentialBonuses.reduce((n,row)=>n+row.points,0);
  assert.ok(points>=1&&points<=3);
  let allocated=gifted;for(let i=0;i<points;i++)allocated=doAction(allocated,{type:'allocatePotential',heroId:definition.id,stat:'attack'},now+2+i);
  assert.equal(allocated.heroes[0].potential.attack,80+points);
  assert.ok(combat.commander(allocated.heroes[0],allocated).commandAttack>combat.commander(gifted.heroes[0],gifted).commandAttack,'gifted potential affects the combat profile after allocation');
  assert.throws(()=>doAction(allocated,{type:'allocatePotential',heroId:definition.id,stat:'attack'},now+9),/Hết điểm tiềm năng/);
  const reloaded=migrateSave(JSON.parse(JSON.stringify(gifted)),now+2);
  assert.deepEqual(reloaded.heroes[0].mobilePotentialBonuses,gifted.heroes[0].mobilePotentialBonuses);
});

test('verified Mobile star stones are consumed in their source tier and stars raise equipment combat value',()=>{
  const state=createNewGame('Triều Ca',now),hero=state.heroes[0],weapon=ITEMS.find(row=>row.type==='vũ khí'&&row.mobileSourceId),stone=sourceItem('95601');
  assert.ok(weapon&&stone);state.levels.foundry=1;hero.equipment={...hero.equipment,weapon:weapon.id};state.items.push(stone.id);
  const combat=createProductCombat({storageCapacity}),node=WORLD_NODES.find(row=>row.kind==='Dã địa'),troop=TROOPS.find(row=>row.mobileSourceId),baseline=heroPower(hero,state),beforeAttack=combat.marchInput(state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:47}).input.sides[0].commandAttack,quote=quoteGearStar(state,hero.id,weapon.id);
  assert.equal(quote.stoneSourceId,'95601');assert.equal(quote.available,true);
  const starred=doAction(state,{type:'starUpGear',heroId:hero.id,itemId:weapon.id},now);
  assert.equal(starred.heroes[0].gearEnhancements[weapon.id].stars,1);
  assert.ok(!starred.items.includes(stone.id));assert.ok(heroPower(starred.heroes[0],starred)>baseline);
  assert.ok(combat.marchInput(starred,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:47}).input.sides[0].commandAttack>beforeAttack);
  const invalid=structuredClone(state);invalid.items.splice(invalid.items.indexOf(stone.id),1);
  assert.throws(()=>doAction(invalid,{type:'starUpGear',heroId:hero.id,itemId:weapon.id},now),/đá tăng sao/);
  const migrated=migrateSave(JSON.parse(JSON.stringify(starred)),now+1);
  assert.equal(migrated.heroes[0].gearEnhancements[weapon.id].stars,1);
});

test('artifact and mount star-up use their dedicated source stones and affect equipped battle profiles',()=>{
  const combat=createProductCombat({storageCapacity}),artifact=sourceItem('95901'),artifactStone=sourceItem('95604'),horse=sourceItem('7513'),horseStone=sourceItem('95605');
  assert.ok(artifact&&artifactStone&&horse&&horseStone);
  const state=createNewGame('Triều Ca',now),definition=HEROES.find(row=>row.mobileSourceId==='ba-trung'),hero={...structuredClone(state.heroes[0]),id:definition.id,level:150,equipment:{weapon:null,armor:null,artifact:artifact.id,mount:horse.id},gearEnhancements:{[artifact.id]:{stars:0,rank:0,gems:[]},[horse.id]:{stars:0,rank:0,gems:[]}}};
  state.heroes=[hero];hero.assigned=true;state.levels.foundry=1;state.items.push(artifactStone.id,horseStone.id);
  const before=combat.commander(hero,state).commandAttack,artifactQuote=quoteGearStar(state,hero.id,artifact.id),horseQuote=quoteGearStar(state,hero.id,horse.id);
  assert.equal(artifactQuote.stoneSourceId,'95604');assert.equal(horseQuote.stoneSourceId,'95605');
  const first=doAction(state,{type:'starUpGear',heroId:hero.id,itemId:artifact.id},now),second=doAction(first,{type:'starUpGear',heroId:hero.id,itemId:horse.id},now+1);
  assert.ok(!second.items.includes(artifactStone.id)&&!second.items.includes(horseStone.id));
  assert.ok(combat.commander(second.heroes[0],second).commandAttack>before,'artifact stars feed an explicitly simulated command-stat bridge');
});

test('source hero recovery and respec items have bounded, consumable gameplay effects',()=>{
  const meal=sourceItem('95701'),mealState=createNewGame('Triều Ca',now);mealState.items.push(meal.id);mealState.heroes[0].combatVitality=1;
  const rested=doAction(mealState,{type:'useItem',itemId:meal.id,heroId:mealState.heroes[0].id},now);
  assert.equal(rested.heroes[0].combatVitality,createProductCombat({storageCapacity}).commander(mealState.heroes[0],mealState).maxVitality);
  const wash=sourceItem('4911'),washState=createNewGame('Triều Ca',now),washHero=washState.heroes[0];washHero.level=12;washHero.potential={attack:8,magic:4,defense:2};washState.items.push(wash.id,wash.id);
  const reset=doAction(washState,{type:'useItem',itemId:wash.id,heroId:washHero.id},now);
  assert.deepEqual(reset.heroes[0].potential,{attack:0,magic:0,defense:0});assert.equal(reset.items.filter(id=>id===wash.id).length,0);
  const insufficient=structuredClone(washState);insufficient.items.pop();assert.throws(()=>doAction(insufficient,{type:'useItem',itemId:wash.id,heroId:washHero.id},now+1),/Cần 2/);
  const full=sourceItem('4920'),fullState=createNewGame('Triều Ca',now),fullHero=fullState.heroes[0];fullHero.level=21;fullHero.xp=45;fullState.items.push(full.id,full.id,full.id);
  const expectedXp=45+Array.from({length:20},(_,i)=>experienceForLevel(i+1)).reduce((a,b)=>a+b,0),rewound=doAction(fullState,{type:'useItem',itemId:full.id,heroId:fullHero.id},now);
  assert.equal(rewound.heroes[0].level,1);assert.equal(rewound.heroes[0].xp,expectedXp);assert.equal(rewound.heroes[0].skillLevel,1);assert.equal(rewound.items.filter(id=>id===full.id).length,0);
  const step=sourceItem('8741'),stepState=createNewGame('Triều Ca',now),stepHero=stepState.heroes[0];stepHero.level=4;stepHero.xp=12;stepHero.skillLevel=2;stepState.items.push(step.id);
  const lowered=doAction(stepState,{type:'useItem',itemId:step.id,heroId:stepHero.id},now);
  assert.equal(lowered.heroes[0].level,3);assert.equal(lowered.heroes[0].xp,12+experienceForLevel(3));assert.equal(lowered.heroes[0].skillLevel,1);
});
