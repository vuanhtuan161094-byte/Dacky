import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave, quoteGearGemSocket, storageCapacity } from '../src/engine.js';
import { HEROES, ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, itemUseRule } from '../src/gameplay-p15.js';
import { resolvePveLootItem } from '../src/pve-campaign.js';
import { createProductCombat } from '../src/combat/product-v13.js';

const now=1_810_000_000_000;
const sourceItem=id=>ITEMS.find(item=>String(item.mobileSourceId)===String(id));

test('source resource bundles and boxes have bounded, non-wasteful shared handlers',()=>{
  const gold=sourceItem('8721'),goldState=createNewGame('Thử gói vàng',now);
  goldState.resources.gold=storageCapacity(goldState)-100;goldState.items.push(gold.id);
  const openedGold=doAction(goldState,{type:'useItem',itemId:gold.id},now);
  assert.equal(openedGold.resources.gold,storageCapacity(openedGold));
  assert.ok(!openedGold.items.includes(gold.id));

  const box=sourceItem('4511'),stateA=createNewGame('Thử kỳ hộp',now),stateB=createNewGame('Thử kỳ hộp',now);
  stateA.resources=Object.fromEntries(Object.keys(stateA.resources).map(key=>[key,0]));
  stateB.resources=Object.fromEntries(Object.keys(stateB.resources).map(key=>[key,0]));
  stateA.items.push(box.id);stateB.items.push(box.id);
  const a=doAction(stateA,{type:'useItem',itemId:box.id},now),b=doAction(stateB,{type:'useItem',itemId:box.id},now);
  const changed=Object.keys(a.resources).filter(key=>a.resources[key]>0);
  assert.equal(changed.length,1,'the source box grants one resource type');
  assert.ok(a.resources[changed[0]]>0&&a.resources[changed[0]]<=100_000,'the source maximum is a ceiling; current storage limits the credited amount');
  assert.deepEqual(a.resources,b.resources,'the simulated outcome is deterministic for a given save and use count');
  assert.ok(!a.items.includes(box.id));
  assert.equal(itemUseRule(box).runtimeFormula,'SIMULATED_SEEDED_RESOURCE_AND_AMOUNT');
});

test('Thần Phù Khoa Nga demolishes a selected built plot immediately and consumes only on success',()=>{
  const item=sourceItem('4918'),state=createNewGame('Thử phá dỡ',now);
  state.cityPlots.o1={buildingId:'farm',level:2};state.items.push(item.id);
  assert.throws(()=>doAction(state,{type:'useItem',itemId:item.id,plotId:'o9'},now),/Không thể phá dỡ/);
  assert.ok(state.items.includes(item.id));
  const demolished=doAction(state,{type:'useItem',itemId:item.id,plotId:'o1'},now);
  assert.equal(demolished.cityPlots.o1,undefined);
  assert.ok(!demolished.items.includes(item.id));
  assert.equal(demolished.resources.gold,state.resources.gold,'demolition refunds no resources');
  assert.equal(itemUseRule(item).refund,false);
});

test('source root cultivation bottles enforce their root thresholds, consume once and survive save migration',()=>{
  const bottle=sourceItem('8956'),definition=HEROES.find(hero=>hero.mobileSourceId==='thai-thuong-lao-quan');
  assert.ok(bottle&&definition);
  const state=createNewGame('Thử luyện căn cốt',now),hero={...structuredClone(state.heroes[0]),id:definition.id,assigned:false,equipment:{},potential:{attack:0,magic:0,defense:0}};
  state.heroes=[hero];state.items.push(bottle.id);
  assert.throws(()=>doAction(state,{type:'useItem',itemId:bottle.id,heroId:hero.id},now),/Cần căn cốt 55 trở lên/);
  assert.ok(state.items.includes(bottle.id),'a rejected use preserves the item');
  const mature=HEROES.find(row=>row.mobileSourceId==='le-son-lao-mau');
  state.heroes[0].id=mature.id;
  const grown=doAction(state,{type:'useItem',itemId:bottle.id,heroId:mature.id},now);
  assert.ok(grown.heroes[0].mobileRootBonuses['8956']>=1&&grown.heroes[0].mobileRootBonuses['8956']<=5);
  assert.equal(grown.heroes[0].mobileRootBonusEvidence['8956'].runtimeFormula,'SIMULATED_ROOT_CULTIVATION_BRIDGE');
  const loaded=migrateSave(JSON.parse(JSON.stringify(grown)),now+1);
  assert.equal(loaded.heroes[0].mobileRootBonuses['8956'],grown.heroes[0].mobileRootBonuses['8956']);
});

test('Xe Chỉ Nam stores a one-trade simulated throughput bonus and consumes it after settlement',()=>{
  const item=sourceItem('4027'),state=createNewGame('Thử giao dịch',now);
  state.items.push(item.id);
  let next=doAction(state,{type:'useItem',itemId:item.id},now);
  assert.equal(next.gameplay.tradeVouchers,1);
  const ordinary=createNewGame('Giao dịch thường',now);
  ordinary.resources.food=5000;ordinary.resources.timber=0;
  next.resources.food=5000;next.resources.timber=0;
  const normal=doAction(ordinary,{type:'trade',from:'food',to:'timber',amount:3000},now);
  const expedited=doAction(next,{type:'trade',from:'food',to:'timber',amount:3000},now);
  assert.ok(expedited.resources.timber>normal.resources.timber);
  assert.equal(expedited.gameplay.tradeVouchers,0);
  assert.match(expedited.notifications[0],/thông lượng 10% SIMULATED/);
});

test('Tiên Sơn loot joins verified Mobile goods first and known legacy quest goods through an explicit bridge',()=>{
  const mobile=resolvePveLootItem('4501');
  assert.equal(mobile.itemJoinEvidence,'VERIFIED_MOBILE_ID');
  assert.equal(String(mobile.item.mobileSourceId),'4501');
  for(const id of ['9105','9106','9107','9108','9109']){
    const joined=resolvePveLootItem(id);
    assert.equal(joined.itemJoinEvidence,'SIMULATED_LEGACY_GOOD_BRIDGE');
    assert.equal(String(joined.item.legacySourceId),id);
  }
  assert.equal(resolvePveLootItem('unmapped-drop'),null);
});

test('source red-slot gems socket through the hero UI adapter and affect army or commander combat',()=>{
  const combat=createProductCombat({storageCapacity}),gear=ITEMS.find(item=>item.type==='vũ khí'&&item.mobileSourceId),node=WORLD_NODES.find(row=>row.kind==='Dã địa'),troop=TROOPS.find(row=>row.mobileSourceId);
  assert.ok(gear&&node&&troop);
  const prepare=id=>{const state=createNewGame('Thử thần ngọc',now),hero=state.heroes[0],gem=sourceItem(id);state.levels.foundry=1;hero.assigned=true;hero.equipment.weapon=gear.id;state.items.push(gear.id,gem.id);return {state,hero,gem};};
  const commander=prepare('7671'),before=combat.commander(commander.hero,commander.state).commandAttack;
  assert.ok(quoteGearGemSocket(commander.state,commander.hero.id,gear.id,commander.gem.id)?.available);
  const enhanced=doAction(commander.state,{type:'socketGearGem',heroId:commander.hero.id,itemId:gear.id,gemId:commander.gem.id},now);
  assert.ok(!enhanced.items.includes(commander.gem.id));
  assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(enhanced)),now+1).heroes[0].gearEnhancements[gear.id].gems,[commander.gem.id]);
  assert.ok(combat.commander(enhanced.heroes[0],enhanced).commandAttack>before,'Xi Vưu Thần Ngọc reaches the commander profile');

  const army=prepare('7642'),base=combat.marchInput(army.state,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:13}).input;
  const socketed=doAction(army.state,{type:'socketGearGem',heroId:army.hero.id,itemId:gear.id,gemId:army.gem.id},now);
  const buffed=combat.marchInput(socketed,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:13}).input;
  assert.ok(Math.abs(cityEffects(socketed,now).attack-.1)<1e-8);
  assert.ok(Math.abs(buffed.sides[0].armyAttack-base.sides[0].armyAttack-.1)<1e-8,'expected value of the source 10% double-damage proc reaches army combat');
});
