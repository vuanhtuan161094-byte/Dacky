import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave, quoteGearGemSocket, storageCapacity } from '../src/engine.js';
import { HEROES, IMMORTAL_MOUNTAINS, ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, itemBuff, itemUseRule, sourceGearGemRule } from '../src/gameplay-p15.js';
import { getMountainBattles, pveLock, resolvePveLootItem } from '../src/pve-campaign.js';
import { createProductCombat } from '../src/combat/product-v13.js';
import { recruitmentPromotion } from '../src/simulated-world.js';

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

test('full and half hero restoratives target the selected hero and consume only when they restore a deficit',()=>{
  const combat=createProductCombat({storageCapacity});
  for(const [sourceId,resource,fraction] of [['4222','mana',1],['4224','vitality',1],['4225','mana',.5]]){
    const item=sourceItem(sourceId),state=createNewGame('Thử linh dược',now),hero=state.heroes[0],profile=combat.commander(hero,state),field=resource==='mana'?'combatMana':'combatVitality',maximum=resource==='mana'?profile.maxMana:profile.maxVitality;
    state.items.push(item.id);hero[field]=1;
    const next=doAction(state,{type:'useItem',itemId:item.id,heroId:hero.id},now),restored=next.heroes[0][field]-1;
    assert.equal(itemUseRule(item).kind,'heroRestore');assert.ok(Math.abs(restored/maximum-fraction)<.01,`${sourceId} restores its described fraction`);assert.ok(!next.items.includes(item.id));
    assert.throws(()=>doAction(next,{type:'useItem',itemId:item.id,heroId:hero.id},now+1),/Không thể sử dụng/);
  }
});

test('Phong Thần Tháp book family equips one hero-only passive and changes tower combat',()=>{
  const books=ITEMS.filter(item=>/^87(0[0-9]|1[0-3])$/.test(String(item.mobileSourceId)));
  assert.equal(books.length,14);assert.ok(books.every(item=>itemUseRule(item)?.kind==='towerBook'));
  const combat=createProductCombat({storageCapacity}),book=sourceItem('8701'),state=createNewGame('Thử sách tháp',now),hero=state.heroes[0],baseline=combat.runDuel(state,{battleId:'tower-book-baseline',mode:'tower',seed:613,now});
  state.items.push(book.id);
  const learned=doAction(state,{type:'useItem',itemId:book.id,heroId:hero.id},now+1);
  assert.equal(learned.heroes[0].towerBookSourceId,'8701');assert.ok(!learned.items.includes(book.id));
  assert.equal(migrateSave(JSON.parse(JSON.stringify(learned)),now+2).heroes[0].towerBookSourceId,'8701');
  const enhanced=combat.runDuel(learned,{battleId:'tower-book-enhanced',mode:'tower',seed:613,now:now+3});
  assert.notDeepEqual(enhanced.battle.rounds,baseline.battle.rounds,'the tower book affects the actual tower duel adapter');
  assert.equal(combat.runDuel(learned,{battleId:'tower-book-outside',mode:'buzhou',seed:613,now:now+4}).quote.mode,'buzhou');
});

test('Mobile rename and banner tokens update the profile and consume only after a valid choice',()=>{
  const rename=sourceItem('4917'),banner=sourceItem('4916'),state=createNewGame('Triều Ca',now);
  state.items.push(rename.id,banner.id);
  assert.throws(()=>doAction(state,{type:'useItem',itemId:rename.id,name:'   '},now),/Nhập tên mới/);
  assert.ok(state.items.includes(rename.id));
  let next=doAction(state,{type:'useItem',itemId:rename.id,name:'Tân Triều'},now);
  assert.equal(next.profile.name,'Tân Triều');assert.equal(next.cities[0].name,'Tân Triều');assert.ok(!next.items.includes(rename.id));
  assert.throws(()=>doAction(next,{type:'useItem',itemId:banner.id},now+1),/Chọn cờ hiệu/);
  next=doAction(next,{type:'useItem',itemId:banner.id,flag:'西岐'},now+2);
  assert.equal(next.gameplay.flag,'西岐');assert.ok(!next.items.includes(banner.id));
  assert.equal(migrateSave(JSON.parse(JSON.stringify(next)),now+3).gameplay.flag,'西岐');
});

test('Thời Quang Tỏa refreshes one Tiên Sơn daily reward set without clearing other locations',()=>{
  const item=sourceItem('4408'),mountain=IMMORTAL_MOUNTAINS[0],floor=getMountainBattles(mountain.legacySourceId)[0],otherFloor=getMountainBattles(IMMORTAL_MOUNTAINS[1].legacySourceId)[0],state=createNewGame('Thử làm mới',now),day=Math.floor(now/86400000);
  state.world.pveWins={[floor.id]:true,[otherFloor.id]:true};state.world.pveLastClearDay={[floor.id]:day,[otherFloor.id]:day};state.items.push(item.id);
  assert.match(pveLock(state,floor,floor.chapter),/Đã nhận thưởng hôm nay/);
  const refreshed=doAction(state,{type:'useItem',itemId:item.id,mountainId:mountain.id},now);
  assert.equal(refreshed.world.pveLastClearDay[floor.id],undefined);assert.equal(refreshed.world.pveLastClearDay[otherFloor.id],day);assert.ok(!refreshed.items.includes(item.id));
  assert.equal(pveLock(refreshed,floor,floor.chapter),'');
});

test('recruitment refresh, morale reset and double-XP goods reach shared runtime systems',()=>{
  const refresh=sourceItem('4910'),refreshState=createNewGame('Thử Dẫn Tiên Đài',now);refreshState.levels.hostel=1;refreshState.levels.altar=1;refreshState.items.push(refresh.id);
  const before=recruitmentPromotion(refreshState,now),refreshed=doAction(refreshState,{type:'useItem',itemId:refresh.id},now);
  assert.notEqual(recruitmentPromotion(refreshed,now),before);assert.equal(refreshed.gameplay.recruitmentRefresh,Math.floor(now/86400000));
  const duplicate=sourceItem('4910'),blocked=structuredClone(refreshed);blocked.items.push(duplicate.id);assert.throws(()=>doAction(blocked,{type:'useItem',itemId:duplicate.id},now+1),/đã làm mới hôm nay/);assert.ok(blocked.items.includes(duplicate.id));

  const decree=sourceItem('4904'),civic=createNewGame('Thử an bang',now);civic.morale=27;civic.items.push(decree.id);
  const calm=doAction(civic,{type:'useItem',itemId:decree.id},now);assert.equal(calm.morale,100);assert.ok(!calm.items.includes(decree.id));
  assert.match(calm.notifications[0],/dân oán không được runtime theo dõi/);

  const xp=sourceItem('4953'),xpState=createNewGame('Thử song bội',now);xpState.items.push(xp.id);
  const boosted=doAction(xpState,{type:'useItem',itemId:xp.id},now);assert.equal(itemBuff(boosted,'heroXp',now),1);assert.equal(itemBuff(boosted,'heroXp',now+3_600_001),0);
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

test('12 Mobile stat-gem materials socket, modify their described hero attribute and survive migration',()=>{
  const combat=createProductCombat({storageCapacity}),gear=sourceItem('7232');
  assert.ok(gear&&gear.mobileEquipmentSlot==='Mũ');
  const cases=[['7650','defense',.03],['7651','defense',.09],['7652','defense',.20],['7662','resistance',.03],['7663','resistance',.09],['7664','resistance',.20],['7665','attack',.03],['7666','attack',.09],['7667','attack',.20],['7668','magic',.03],['7669','magic',.09],['7670','magic',.20]];
  for(const [sourceId,stat,ratio] of cases){
    const state=createNewGame('Thử ngọc chỉ số',now),hero=state.heroes[0],gem=sourceItem(sourceId);
    state.levels.foundry=1;hero.assigned=true;hero.equipment.helmet=gear.id;state.items.push(gear.id,gem.id);
    const baseline=combat.runDuel(state,{battleId:`gem-baseline-${sourceId}`,mode:'tower',seed:615,now}),rule=sourceGearGemRule(gem);
    assert.equal(rule?.kind,'heroStatGem',sourceId);assert.equal(rule.stat,stat);assert.equal(rule.ratio,ratio);
    assert.ok(quoteGearGemSocket(state,hero.id,gear.id,gem.id)?.available,`${sourceId} can be socketed through the normal forge path`);
    const enhanced=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),after=combat.runDuel(enhanced,{battleId:`gem-enhanced-${sourceId}`,mode:'tower',seed:615,now});
    assert.ok(!enhanced.items.includes(gem.id),`${sourceId} is consumed once`);
    const damage=(battle,side,target)=>battle.events.filter(event=>event.type==='damage'&&event.side===side&&event.target===target).reduce((sum,event)=>sum+event.amount,0);
    const changesCombat=stat==='attack'||stat==='magic'?damage(after.battle,0,1)>damage(baseline.battle,0,1):damage(after.battle,1,0)<damage(baseline.battle,1,0);
    assert.ok(changesCombat,`${sourceId} changes actual ${stat} used by combat`);
    assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(enhanced)),now+1).heroes[0].gearEnhancements[gear.id].gems,[gem.id],`${sourceId} remains equipped after reload`);
  }
});

test('nine Mobile duel-trait gems change real expected attack or incoming damage and survive migration',()=>{
  const combat=createProductCombat({storageCapacity}),gear=sourceItem('7232'),cases=[['7653','followUpAttack',.01],['7654','followUpAttack',.03],['7655','followUpAttack',.05],['7656','counterAttack',.01],['7657','counterAttack',.03],['7658','counterAttack',.05],['7659','dodge',.01],['7660','dodge',.03],['7661','dodge',.05]];
  for(const [sourceId,trait,chance] of cases){
    const state=createNewGame('Thử ngọc đấu pháp',now),hero=state.heroes[0],gem=sourceItem(sourceId);state.levels.foundry=1;hero.assigned=true;hero.equipment.helmet=gear.id;state.items.push(gear.id,gem.id);
    const baseline=combat.runDuel(state,{battleId:`trait-baseline-${sourceId}`,mode:'tower',seed:616,now}),rule=sourceGearGemRule(gem);
    assert.equal(rule?.kind,'heroCombatGem',sourceId);assert.equal(rule.trait,trait);assert.equal(rule.chance,chance);
    const enhanced=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),after=combat.runDuel(enhanced,{battleId:`trait-enhanced-${sourceId}`,mode:'tower',seed:616,now});
    const damage=(battle,side,target)=>battle.events.filter(event=>event.type==='damage'&&event.side===side&&event.target===target).reduce((sum,event)=>sum+event.amount,0);
    assert.ok(trait==='dodge'?damage(after.battle,1,0)<damage(baseline.battle,1,0):damage(after.battle,0,1)>damage(baseline.battle,0,1),`${sourceId} changes duel results through the product adapter`);
    assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(enhanced)),now+1).heroes[0].gearEnhancements[gear.id].gems,[gem.id],`${sourceId} survives save reload`);
  }
});

test('70 verified frame and chat-bubble goods unlock once, equip by slot and persist through migration',()=>{
  const cosmetics=ITEMS.filter(item=>itemUseRule(item)?.kind==='cosmeticUnlock');
  assert.equal(cosmetics.length,70);
  const frame=cosmetics.find(item=>itemUseRule(item).slot==='frame'),bubble=cosmetics.find(item=>itemUseRule(item).slot==='chatBubble');
  const state=createNewGame('Thử mỹ phẩm',now);state.items.push(frame.id,bubble.id);
  let next=doAction(state,{type:'useItem',itemId:frame.id},now);
  assert.ok(!next.items.includes(frame.id));
  assert.deepEqual(next.profile.cosmeticsUnlocked,[frame.id]);
  assert.equal(next.profile.activeCosmetics.frame,frame.id);
  next=doAction(next,{type:'useItem',itemId:bubble.id},now+1);
  assert.deepEqual(next.profile.cosmeticsUnlocked,[frame.id,bubble.id]);
  assert.equal(next.profile.activeCosmetics.chatBubble,bubble.id);
  assert.throws(()=>doAction(next,{type:'setCosmetic',slot:'frame',itemId:bubble.id},now+2),/chưa được mở khóa hoặc không đúng loại/);
  next=doAction(next,{type:'setCosmetic',slot:'frame',itemId:null},now+2);
  const loaded=migrateSave(JSON.parse(JSON.stringify(next)),now+3);
  assert.deepEqual(loaded.profile.cosmeticsUnlocked,[frame.id,bubble.id]);
  assert.equal(loaded.profile.activeCosmetics.frame,null);
  assert.equal(loaded.profile.activeCosmetics.chatBubble,bubble.id);
});
