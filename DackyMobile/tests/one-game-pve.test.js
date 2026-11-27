import test from 'node:test';
import assert from 'node:assert/strict';
import {advance, createNewGame, doAction, migrateSave, quoteBuilding, quoteResearch} from '../src/engine.js';
import {LEGACY_ELFLAND_LOCATIONS} from '../src/legacy-elfland-catalog.js';
import {LEGACY_STRONGPOINTS, LEGACY_ADVANCED_FIELDS} from '../src/legacy-endgame-catalog.js';
import {getEndgameBattles, getMountainBattles, pveAssaultProgress, pveLock, rollPveLoot} from '../src/pve-campaign.js';

const start = 1_800_000_000_000;

test('legal official promotion opens source level-21 building and research gates',()=>{
  const state=createNewGame('Thăng quan',start);
  state.gameplay.official=16;state.fame=28_900;state.resources.gold=1_700;
  state.levels.citadel=30;state.levels.government=2;state.levels.training=1;
  state.levels.academy=20;state.levels.barracks=20;state.technologies['tech-09']=20;
  assert.deepEqual(quoteBuilding(state,'academy').unmetRequirements,['Quan chức 17']);
  assert.deepEqual(quoteBuilding(state,'barracks').unmetRequirements,['Quan chức 17']);
  const promoted=doAction(state,{type:'officialPromote'},start);
  assert.equal(promoted.gameplay.official,17);
  assert.equal(promoted.resources.gold,0);
  assert.equal(quoteBuilding(promoted,'academy').locked,false);
  assert.equal(quoteBuilding(promoted,'barracks').locked,false);
  promoted.levels.academy=21;promoted.levels.barracks=21;
  assert.equal(quoteResearch(promoted,'tech-09').requirementSatisfied,true);
});

test('all linked source floors, strongpoints and bosses resolve to valid army opponents', () => {
  const floors = LEGACY_ELFLAND_LOCATIONS.flatMap(place => getMountainBattles(place.ElflandID));
  assert.equal(floors.length, 8992);
  const endgame = getEndgameBattles();
  assert.equal(endgame.length, 57);
  assert.equal(endgame.filter(row => row.kind === 'Bất Chu').length, 5);
  assert.equal(endgame.filter(row => row.kind === 'Boss').length, 25);
  for (const row of [...floors, ...endgame]) assert.ok(row.enemy.formation.length > 0);
  for (const row of LEGACY_STRONGPOINTS) assert.equal(Object.hasOwn(row, 'OwnerGuildID'), false);
  for (const row of LEGACY_ADVANCED_FIELDS) assert.equal(Object.hasOwn(row, 'LastRefreshTime'), false);
});

test('Bất Chu source doors settle through the army engine and persist their one-time progress',()=>{
  let state=createNewGame('Thử Bất Chu',start);const troopId=Object.keys(state.army)[0];
  state.world.storyStage=24;state.stats.victories=20;state.stats.citiesCaptured=7;state.army[troopId]=100_000;
  const sent=doAction(state,{type:'march',nodeId:'buzhou:1',troops:{[troopId]:100_000}},start);
  state=advance(migrateSave(JSON.parse(JSON.stringify(sent)),start),sent.queues.march.finishAt+1).state;
  assert.equal(state.stats.battles,1);assert.equal(state.world.buzhouFloor,1);assert.equal(state.world.pveWins['buzhou:1'],true);
  assert.equal(state.army[troopId]+state.wounded[troopId]+state.reports[0].dead[troopId],100_000);
  assert.equal(advance(state,sent.queues.march.finishAt+2).state.stats.battles,1);
});

test('Bất Chu doors 4–5 retain source roster counts and expose multi-sortie readiness',()=>{
  const state=createNewGame('Vây Bất Chu',start),door4=getEndgameBattles().find(row=>row.id==='buzhou:4'),door5=getEndgameBattles().find(row=>row.id==='buzhou:5'),troopId=Object.keys(state.army)[0];
  state.world.storyStage=24;state.world.pveWins={'buzhou:1':true,'buzhou:2':true,'buzhou:3':true};state.world.buzhouFloor=3;state.army[troopId]=25_000;
  const progress=pveAssaultProgress(state,door4,100_000);
  assert.equal(progress.total,3_450_000);assert.equal(progress.remaining,3_450_000);assert.equal(progress.sortieSize,25_000);assert.equal(progress.sortiesRemaining,138);
  assert.equal(progress.wave.reduce((sum,row)=>sum+row.count,0),25_000);assert.equal(pveLock(state,door4,8),'');
  state.world.pveWins['buzhou:4']=true;assert.match(pveLock(state,door5,8),/Cần ít nhất 100\.000 quân/);state.army[troopId]=100_000;
  assert.equal(pveAssaultProgress(state,door5,300_000).total,10_700_000);assert.equal(pveLock(state,door5,8),'');
  assert.equal(door4.enemy.formation.reduce((sum,row)=>sum+row.count,0),3_450_000);assert.equal(door5.enemy.formation.reduce((sum,row)=>sum+row.count,0),10_700_000);
});

test('Bất Chu siege entry thresholds do not block a resumed, source-sized assault',()=>{
  const state=createNewGame('Tập hợp Bất Chu',start),door4=getEndgameBattles().find(row=>row.id==='buzhou:4'),door5=getEndgameBattles().find(row=>row.id==='buzhou:5'),troopId=Object.keys(state.army)[0];
  state.world.storyStage=24;state.world.pveWins={'buzhou:1':true,'buzhou:2':true,'buzhou:3':true};state.world.buzhouFloor=3;
  state.army[troopId]=24_999;assert.match(pveLock(state,door4,8),/Cần ít nhất 25\.000 quân/);
  const source4=door4.enemy.formation.reduce((out,row)=>{out[row.unitId]=(out[row.unitId]||0)+row.count;return out;},{}),damaged4={...source4};
  damaged4[Object.keys(damaged4)[0]]-=1;state.gameplay.endgameAssaults={'buzhou:4':{total:3_450_000,remaining:damaged4}};
  assert.equal(pveAssaultProgress(state,door4).cleared,1);assert.equal(pveLock(state,door4,8),'');
  const resumed=doAction(state,{type:'march',nodeId:'buzhou:4',troops:{[troopId]:24_999}},start);
  assert.equal(resumed.queues.march.nodeId,'buzhou:4');assert.equal(Object.values(resumed.queues.march.pveAssault.wave).reduce((sum,count)=>sum+count,0),24_999);
  state.world.pveWins['buzhou:4']=true;state.world.buzhouFloor=4;state.army[troopId]=99_999;assert.match(pveLock(state,door5,8),/Cần ít nhất 100\.000 quân/);
  const source5=door5.enemy.formation.reduce((out,row)=>{out[row.unitId]=(out[row.unitId]||0)+row.count;return out;},{}),damaged5={...source5};
  damaged5[Object.keys(damaged5)[0]]-=1;state.gameplay.endgameAssaults['buzhou:5']={total:10_700_000,remaining:damaged5};
  assert.equal(pveAssaultProgress(state,door5).cleared,1);assert.equal(pveLock(state,door5,8),'');
});

test('Bất Chu door 4 resolves a real source-sized wave, clamps edited save progress and defers full-clear rewards',()=>{
  let state=createNewGame('Vây Cửa Tư',start);state.world.storyStage=24;state.world.buzhouFloor=3;state.world.pveWins={'buzhou:1':true,'buzhou:2':true,'buzhou:3':true};state.army['troop-14']=100_000;
  state.gameplay={endgameAssaults:{'buzhou:4':{total:1,remaining:{'legacy-npc-1000':0,'legacy-npc-999999':0}}}};
  const queued=doAction(state,{type:'march',nodeId:'buzhou:4',troops:{'troop-14':100_000}},start);
  assert.equal(queued.queues.march.pveAssault.total,3_450_000);
  assert.equal(Object.values(queued.queues.march.pveAssault.remainingBefore).reduce((sum,count)=>sum+count,0),3_450_000);
  assert.equal(queued.queues.march.pveAssault.total,3_450_000);assert.equal(Object.values(queued.queues.march.pveAssault.wave).reduce((sum,count)=>sum+count,0),100_000);
  state=advance(migrateSave(JSON.parse(JSON.stringify(queued)),start),queued.queues.march.finishAt+1).state;
  assert.equal(state.reports[0].victory,true);assert.equal(state.reports[0].assault.evidence,'SIMULATED_MULTI_SORTIE_SOURCE_ROSTER');assert.equal(state.reports[0].assault.cleared,100_000);assert.equal(state.reports[0].assault.remaining,3_350_000);
  assert.equal(state.world.pveWins['buzhou:4'],undefined);assert.equal(state.world.buzhouFloor,3);assert.deepEqual(state.reports[0].loot,{});assert.equal(state.combatReceipts.length,1);
  state=advance(state,queued.queues.march.finishAt+2).state;assert.equal(state.combatReceipts.length,1);assert.equal(state.reports[0].assault.remaining,3_350_000);
});

test('Tiên Sơn loot rules drive deterministic source-linked drops and daily farming',()=>{
  const node=LEGACY_ELFLAND_LOCATIONS.flatMap(place=>getMountainBattles(place.ElflandID)).find(row=>row.lootRuleCandidates?.length);
  assert.ok(node);const a=rollPveLoot(node,12345),b=rollPveLoot(node,12345);assert.deepEqual(a,b);assert.equal(a.evidence,'SIMULATED_LEGACY_INTERVAL_INTERPRETATION');
  let state=createNewGame('Tiên Sơn',start);const troopId=Object.keys(state.army)[0];state.world.storyStage=24;state.stats.victories=20;state.stats.citiesCaptured=7;state.army[troopId]=100_000;
  const sent=doAction(state,{type:'march',nodeId:node.id,troops:{[troopId]:100_000},seed:1},start);state=advance(sent,sent.queues.march.finishAt+1).state;
  assert.equal(state.world.pveWins[node.id],true);assert.equal(state.reports[0].sourceLoot?.evidence,'SIMULATED_LEGACY_INTERVAL_INTERPRETATION');assert.equal(state.reports[0].itemDrop,null);assert.equal(state.reports[0].genericItemDropSuppressed,'SOURCE_FLOOR_RULE');assert.equal(pveLock(state,node,8),'Đã nhận thưởng hôm nay');
  const nextDay=(state.world.pveLastClearDay[node.id]+1)*86400000;assert.equal(pveLock(advance(state,nextDay).state,node,8),'');
  const battleCount=state.stats.battles;state=advance(state,sent.queues.march.finishAt+2).state;assert.equal(state.stats.battles,battleCount);
});

test('Boss source equipment and spells alter an actual army fight and appear in its receipt',()=>{
  let state=createNewGame('Thử Boss',start);
  state.settings.combatV13=true;state.world.storyStage=24;state.stats.victories=20;state.stats.citiesCaptured=7;
  state.army['troop-02']=100_000;
  const queued=doAction(state,{type:'march',nodeId:'advanced:1',troopId:'troop-02',count:100_000},start);
  state=advance(queued,queued.queues.march.finishAt+1).state;
  const report=state.reports[0];
  assert.equal(report.bossLoadout.sourceTable,'advfieldgeneralinfo');
  assert.equal(report.bossLoadout.equipment.length,4);
  assert.ok(report.enemyEquipmentSourceIds.length>=4);
  assert.ok(report.enemyCommandBonuses.attack>0);
  assert.ok(report.events.some(event=>event.type==='artifactCast'&&event.side===1));
  assert.equal(state.combatReceipts.length,1);
});

test('normal march owns settlement after reload and conserves the sent army', () => {
  const fresh = createNewGame('Tân chủ', start);
  const [troopId, count] = Object.entries(fresh.army)[0];
  const queued = doAction(fresh, {type:'march', nodeId:'node-011', troopId, count}, start);
  const finish = Math.ceil(queued.queues.march.finishAt);
  const loaded = migrateSave(JSON.parse(JSON.stringify(queued)), start);
  const settled = advance(loaded, finish).state;
  const battle = settled.reports[0];
  assert.ok(battle.victory);
  assert.ok(battle.events.length > 0);
  assert.equal((settled.army[troopId] || 0) + (battle.wounded[troopId] || 0) + (battle.dead[troopId] || 0), count);
  assert.equal(settled.combatReceipts.length, 1);
  assert.equal(advance(settled, finish + 1000).state.stats.battles, 1);
});

test('daily reward is limited by day across repeated save imports', () => {
  let save = createNewGame('Tân chủ', start);
  save = doAction(save, {type:'dailyReward'}, start);
  const loaded = migrateSave(JSON.parse(JSON.stringify(save)), start);
  assert.throws(() => doAction(loaded, {type:'dailyReward'}, start), /đã hoàn thành/);
  assert.doesNotThrow(() => doAction(loaded, {type:'dailyReward'}, start + 86400000));
});
