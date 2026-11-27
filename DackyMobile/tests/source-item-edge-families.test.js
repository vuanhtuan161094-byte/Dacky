import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave, quoteGearGemSocket, quoteItemPurchase, storageCapacity } from '../src/engine.js';
import { HEROES, IMMORTAL_MOUNTAINS, ITEMS, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { cityEffects, claimSourceQuest, gameplayQuestList, itemBuff, itemUseRule, reservedQuestItemCount, sourceGearGemRule } from '../src/gameplay-p15.js';
import { getMountainBattles, pveLock, resolvePveLootAward, resolvePveLootItem } from '../src/pve-campaign.js';
import { LEGACY_ELFLAND_REWARD_RULES } from '../src/legacy-elfland-catalog.js';
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

test('source-linked quest goods are consumed once through the ordinary quest claim flow',()=>{
  const quest=gameplayQuestList().find(row=>row.id==='legacy-quest-51026'),state=createNewGame('Thử vật phẩm nhiệm vụ',now),item=sourceItem('7087');
  assert.ok(quest&&item);assert.ok(quest.conditions.some(row=>row.typeCode===1));state.items.push(item.id);
  const q=claimSourceQuest(state,quest.id,()=>({}));assert.ok(q);assert.ok(!state.items.includes(item.id));assert.ok(state.gameplay.questClaims.includes(quest.id));
  assert.throws(()=>claimSourceQuest(state,quest.id,()=>({})),/Nhiệm vụ chưa đủ điều kiện hoặc đang HOLD/);
});

test('nine source Secret Scroll tiers advance matching official seals and preserve valid-use costs',()=>{
  for(let index=0;index<9;index++){
    const rank=index*2+1,state=createNewGame('Thử Quan Ấn nguồn',now),book=sourceItem(6225+index);state.items.push(book.id);state.gameplay.official=rank-1;state.fame=rank*rank*100;state.resources.gold=rank*100;
    const promoted=doAction(state,{type:'useItem',itemId:book.id},now);assert.equal(promoted.gameplay.official,rank);assert.equal(promoted.resources.gold,0);assert.ok(!promoted.items.includes(book.id));
    const upperRank=rank+1;if(upperRank<=18){const second=sourceItem(6225+Math.floor((upperRank-1)/2)),next=structuredClone(promoted);next.items.push(second.id);next.fame=upperRank*upperRank*100;next.resources.gold=upperRank*100;assert.equal(doAction(next,{type:'useItem',itemId:second.id},now).gameplay.official,upperRank);}
    if(index<8){const wrong=sourceItem(6226+index),blocked=createNewGame('Thử quyển sai bậc',now);blocked.items.push(wrong.id);assert.throws(()=>doAction(blocked,{type:'useItem',itemId:wrong.id},now),/chỉ dùng cho Quan Ấn/);assert.ok(blocked.items.includes(wrong.id));}
  }
});

test('Dragon Boat item set exchanges once into its source Bánh Ú chest without spending reserved quest copies',()=>{
  const state=createNewGame('Thử đổi lễ Đoan Ngọ',now),required=['6036','6037','6043','6044'].map(sourceId=>sourceItem(sourceId));
  for(const ingredient of required)for(let count=0;count<1+reservedQuestItemCount(state,ingredient.id);count++)state.items.push(ingredient.id);
  const before=Object.fromEntries(required.map(item=>[item.id,state.items.filter(id=>id===item.id).length]));
  const exchanged=doAction(state,{type:'useItem',itemId:sourceItem('6036').id},now);
  assert.ok(exchanged.items.includes(sourceItem('6039').id));
  for(const ingredient of required)assert.equal(exchanged.items.filter(id=>id===ingredient.id).length,before[ingredient.id]-1);
  const opened=doAction(exchanged,{type:'useItem',itemId:sourceItem('6039').id},now);
  assert.ok(opened.items.includes(sourceItem('6042').id)&&opened.items.includes(sourceItem('6041').id),'the crafted Mobile chest enters its sourced opening table');
  const incomplete=createNewGame('Thử thiếu vật liệu',now);incomplete.items.push(sourceItem('6036').id);
  assert.throws(()=>doAction(incomplete,{type:'useItem',itemId:sourceItem('6036').id},now),/Thiếu vật liệu sự kiện/);assert.ok(incomplete.items.includes(sourceItem('6036').id));
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

test('all unlinked Tiên Sơn loot IDs settle through a bounded, provenance-marked resource award',()=>{
  const ids=new Set();
  for(const row of LEGACY_ELFLAND_REWARD_RULES)for(let slot=1;slot<=10;slot++){
    const match=String(row[`RdmInfo${slot}`]??'').match(/^(\d+)=/);
    if(match)ids.add(match[1]);
  }
  const unlinked=[...ids].filter(id=>!resolvePveLootItem(id));
  assert.equal(ids.size,190,'current playable source catalog has 190 unique reward IDs');
  assert.equal(unlinked.length,174,'current catalog has 174 unique IDs without a Mobile or explicit legacy-good join');
  for(const id of unlinked){
    const award=resolvePveLootAward({itemSourceId:id,count:2},{level:30},{inventoryCount:0,inventoryCapacity:500});
    assert.equal(award.kind,'resources',id);
    assert.equal(award.reason,'SOURCE_ITEM_NOT_IN_MOBILE_CATALOG',id);
    assert.equal(award.fallbackEvidence,'SIMULATED_UNJOINED_SOURCE_ITEM_CONVERSION',id);
    assert.deepEqual(award.fallbackResources,{food:320,gold:200},id);
  }
  const joined=resolvePveLootAward({itemSourceId:'4501',count:2},{level:30},{inventoryCount:499,inventoryCapacity:500});
  assert.equal(joined.kind,'resources');assert.equal(joined.reason,'INVENTORY_FULL');
  assert.equal(joined.fallbackEvidence,'SIMULATED_UNJOINED_SOURCE_ITEM_CONVERSION');
  assert.equal(resolvePveLootAward({itemSourceId:null,count:2},{level:30}),null);
  assert.equal(resolvePveLootAward({itemSourceId:'4501',count:0},{level:30}).kind,'none');
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
  assert.equal(sourceGearGemRule(army.gem)?.kind,'armyCombatGem');
  const socketed=doAction(army.state,{type:'socketGearGem',heroId:army.hero.id,itemId:gear.id,gemId:army.gem.id},now);
  const buffed=combat.marchInput(socketed,{nodeId:node.id,troops:{[troop.id]:10},startAt:now,seed:13}).input;
  assert.equal(cityEffects(socketed,now).attack,undefined,'the army gem is applied once through the army adapter');
  assert.ok(Math.abs(buffed.sides[0].armyAttack-base.sides[0].armyAttack-.1)<1e-8,'expected value of the source 10% double-damage proc reaches army combat');
});

test('all four red Mobile gems expose their verified stat or army effect and require red-slot metadata',()=>{
  for(const id of ['7642','7671','7672','7673']){
    const gem=sourceItem(id),rule=sourceGearGemRule(gem);
    assert.ok(rule,id);assert.equal(rule.evidence,'VERIFIED_MOBILE',id);assert.equal(rule.socketColorEvidence,'VERIFIED_RED_SOCKET',id);
    assert.ok(rule.kind==='armyCombatGem'||rule.kind==='heroStatGem',id);
  }
  assert.deepEqual(itemUseRule(sourceItem('6036')).ingredients.map(row=>row.sourceId),['6036','6037','6043','6044']);
  const combat=createProductCombat({storageCapacity}),gear=sourceItem('7232');
  const damage=(battle,side,target)=>battle.events.filter(event=>event.type==='damage'&&event.side===side&&event.target===target).reduce((sum,event)=>sum+event.amount,0);
  for(const [id,channel] of [['7671','attack'],['7672','defense'],['7673','magic']]){
    const state=createNewGame('Thử ngọc đỏ',now),hero=state.heroes[0],gem=sourceItem(id);state.levels.foundry=1;hero.assigned=true;hero.equipment.helmet=gear.id;state.items.push(gear.id,gem.id);
    const before=combat.runDuel(state,{battleId:'red-before-'+id,mode:'tower',seed:711,now});
    const afterState=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),after=combat.runDuel(afterState,{battleId:'red-after-'+id,mode:'tower',seed:711,now});
    assert.ok(channel==='defense'?damage(after.battle,1,0)<damage(before.battle,1,0):damage(after.battle,0,1)>damage(before.battle,0,1),`${id} changes actual ${channel} combat`);
  }
});

test('Lệnh Phong Thần is consumed only when a low-root hero completes rebirth',()=>{
  const definition=HEROES.find(row=>Number(String(row.mobileBaseStats?.find(stat=>stat.label==='Căn cốt')?.value||'').match(/\d+/)?.[0]||0)<45),state=createNewGame('Thử phong thần',now),hero=state.heroes[0],order=sourceItem('8746');
  assert.ok(definition&&order);hero.id=definition.id;hero.level=60;hero.assigned=false;state.levels.storehouse=18;state.resources.gold=30_000;
  assert.throws(()=>doAction(state,{type:'rebirthHero',heroId:hero.id},now),/Lệnh Phong Thần/);
  assert.equal(state.resources.gold,30_000,'rejected promotion spends nothing');
  const quote=quoteItemPurchase(state,order.id);assert.equal(quote.costEvidence,'SIMULATED_SOURCE_FENGSHEN_ORDER_PRICE');assert.ok(quote.available);
  const prepared=doAction(state,{type:'buyItem',itemId:order.id},now),promoted=doAction(prepared,{type:'rebirthHero',heroId:hero.id},now);
  assert.ok(!promoted.items.includes(order.id));assert.equal(promoted.heroes[0].rebirths,1);
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

test('23 Mobile troop counter, critical and first-round gems affect composition-weighted army battle input',()=>{
  const combat=createProductCombat({storageCapacity}),gear=sourceItem('7232'),node=WORLD_NODES.find(row=>row.enemy?.formation?.length),sourceByClass={spear:'1000',shield:'1001',archer:'1002',cavalry:'1003'},troopClass=troop=>{const id=String(troop.mobileSourceId);if(['1000','1010','1020','1030','1040','1050'].includes(id))return 'spear';if(['1001','1011','1021','1031','1041','1051'].includes(id))return 'shield';if(['1002','1012','1022','1032','1042','1052'].includes(id))return 'archer';if(['1003','1013','1023','1033','1043','1053','1063'].includes(id))return 'cavalry';return null;};
  const cases=[7614,7615,7616,7617,7618,7619,7620,7621,7622,7623,7624,7625,7626,7627,7628,7629,7630,7631,7632,7633,7634,7635,7636];
  for(const sourceId of cases){
    const state=createNewGame('Thử ngọc binh chủng',now),hero=state.heroes[0],gem=sourceItem(sourceId),rule=sourceGearGemRule(gem),ownTroop=TROOPS.find(row=>String(row.mobileSourceId)===sourceByClass[rule.sourceClass]),targetTroop=TROOPS.find(row=>troopClass(row)===rule.targetClass)||TROOPS.find(row=>String(row.mobileSourceId)==='1001');
    assert.equal(rule?.kind,'armyCombatGem',String(sourceId));assert.ok(ownTroop&&targetTroop,`${sourceId} resolves the sourced troop classes`);
    state.levels.foundry=1;hero.assigned=true;hero.equipment.helmet=gear.id;state.items.push(gear.id,gem.id);state.gameplay.strategic.npc[node.id]={morale:80,loyalty:100,troops:{[targetTroop.id]:100},effects:[]};
    const base=combat.marchInput(state,{nodeId:node.id,troops:{[ownTroop.id]:100},startAt:now,seed:812}).input,socketed=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),after=combat.marchInput(socketed,{nodeId:node.id,troops:{[ownTroop.id]:100},startAt:now,seed:812}).input;
    const channel=rule.effect==='firstRoundGuard'?'armyDefense':'armyAttack';assert.ok(after.sides[0][channel]>base.sides[0][channel],`${sourceId} changes ${channel} using the corresponding troop class`);
    assert.ok(!socketed.items.includes(gem.id),`${sourceId} is consumed once on a successful socket`);
  }
});

test('equipment stat and life-steal gem families alter duel inputs, healing and inventory state',()=>{
  const combat=createProductCombat({storageCapacity}),gear=sourceItem('7232');
  for(const sourceId of [7639,7641,7647]){
    const state=createNewGame('Thử ngọc trang bị',now),hero=state.heroes[0],gem=sourceItem(sourceId);hero.assigned=true;hero.equipment.helmet=gear.id;state.levels.foundry=1;state.items.push(gear.id,gem.id);
    const before=combat.commander(hero,state).commandAttack,after=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),command=combat.commander(after.heroes[0],after).commandAttack;
    assert.ok(command>before,`${sourceId} increases the commander input`);assert.ok(!after.items.includes(gem.id));
  }
  const healedBySource={};
  for(const sourceId of [7674,7675]){
    const state=createNewGame('Thử hút máu',now),hero=state.heroes[0],gem=sourceItem(sourceId);hero.assigned=true;hero.equipment.helmet=gear.id;state.levels.foundry=1;state.items.push(gear.id,gem.id);
    const socketed=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:gear.id,gemId:gem.id},now),maxHp=combat.commander(socketed.heroes[0],socketed).maxVitality;
    socketed.heroes[0].combatVitality=Math.floor(maxHp*.5);
    const result=combat.runDuel(socketed,{battleId:'leech-family:'+sourceId,mode:'tower',seed:1,now}),event=result.battle.events.find(row=>row.type==='lifeSteal'&&row.amount>0);
    assert.ok(event,`${sourceId} normal hits produce a real duel healing event`);assert.ok(result.state.reports[0].rounds.flatMap(round=>round.events??[]).some(row=>row.type==='lifeSteal'&&row.amount>0),'the one-time battle report preserves the actual healing');healedBySource[sourceId]=event.amount;
  }
  assert.ok(healedBySource['7675']>healedBySource['7674'],'the 18% source gem heals more than its 8% tier');
});

test('blue mount-speed gems only socket to a mount and shorten actual march time',()=>{
  const mount=sourceItem('7513'),gem=sourceItem('7643'),node=WORLD_NODES.find(row=>row.kind==='Dã địa'&&row.chapter===1);
  const state=createNewGame('Thử ngọc tọa kỵ',now),hero=state.heroes[0];hero.assigned=true;hero.equipment.mount=mount.id;hero.equipment.helmet=sourceItem('7232').id;state.levels.foundry=1;state.items.push(mount.id,gem.id);
  assert.equal(quoteGearGemSocket(state,hero.id,hero.equipment.helmet,gem.id).available,false);
  assert.throws(()=>doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:hero.equipment.helmet,gemId:gem.id},now),/chỉ khảm vào ô mount/);
  assert.ok(state.items.includes(gem.id),'an invalid socket keeps the material');
  const socketed=doAction(state,{type:'socketGearGem',heroId:hero.id,itemId:mount.id,gemId:gem.id},now),plainMarch=doAction(state,{type:'march',nodeId:node.id,count:1},now),gemMarch=doAction(socketed,{type:'march',nodeId:node.id,count:1},now);
  assert.ok(gemMarch.queues.march.finishAt<plainMarch.queues.march.finishAt);
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
