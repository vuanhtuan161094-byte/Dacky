import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave, productionPerHour, storageCapacity } from '../src/engine.js';
import { ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, itemUseRule } from '../src/gameplay-p15.js';
import { createProductCombat } from '../src/combat/product-v13.js';

const now=1_800_000_000_000,day=86_400_000;
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
