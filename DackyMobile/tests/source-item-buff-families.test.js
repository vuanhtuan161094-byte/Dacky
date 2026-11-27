import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, marchTroopCapacity, migrateSave, productionPerHour, quoteTraining, storageCapacity } from '../src/engine.js';
import { ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, itemBuff, itemUseRule } from '../src/gameplay-p15.js';
import { createProductCombat } from '../src/combat/product-v13.js';

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
    assert.equal(rule.unsupported[0],'captureChance');
    const before=combat.marchInput(state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:77}).input;
    const next=doAction(state,{type:'useItem',itemId:item.id},now);
    const after=combat.marchInput(next,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:77}).input;
    const plainMarch=doAction(state,{type:'march',nodeId:node.id,troops:state.army},now);
    const buffMarch=doAction(next,{type:'march',nodeId:node.id,troops:next.army},now);
    assert.equal(next.gameplay.itemBuffs.length,4);
    assert.ok(next.gameplay.itemBuffs.every(buff=>buff.evidence==='VERIFIED_MOBILE'&&buff.status==='VERIFIED_MOBILE'));
    assert.equal(next.gameplay.itemBuffs[0].expiresAt,now+seconds*1000);
    assert.equal(cityEffects(next,now).marchSpeed,.25);
    assert.ok(buffMarch.queues.march.finishAt<plainMarch.queues.march.finishAt,'the sourced speed effect shortens an actual march');
    assert.equal(after.sides[0].armyAttack-before.sides[0].armyAttack,.10);
    assert.equal(after.sides[0].armyDefense-before.sides[0].armyDefense,.10);
    assert.match(next.notifications[0],/chưa hỗ trợ: captureChance/);
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
  assert.match(combatNext.notifications[0],/questExchange/);

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
