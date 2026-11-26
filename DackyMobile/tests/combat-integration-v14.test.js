import test from 'node:test';import assert from 'node:assert/strict';
import {createNewGame,doAction,advance,migrateSave} from '../src/engine.js';
import {WORLD_NODES,IMMORTAL_MOUNTAINS} from '../src/catalog.js';
const create=()=>doAction(createNewGame('Tân chủ',1000),{type:'setting',key:'combatV13',value:true},1000);
test('real engine march dispatch settles once after save reload',()=>{let s=create(),id=Object.keys(s.army)[0],node=WORLD_NODES.find(n=>n.kind==='Dã địa');s=doAction(s,{type:'march',nodeId:node.id,troopId:id,count:18},1000);assert.equal(s.queues.march.combatV13,true);assert.equal(s.army[id]??0,0);assert.throws(()=>doAction(s,{type:'setting',key:'combatV13',value:false},1001),/đang hành quân/);const now=Math.ceil(s.queues.march.finishAt);s=advance(migrateSave(JSON.parse(JSON.stringify(s)),1000),now).state;assert.equal(s.stats.battles,1);assert.equal(s.combatReceipts.length,1);assert.equal(s.queues.march,null);assert.equal(s.army[id]+s.wounded[id]+s.reports[0].dead[id],18);assert.equal(advance(s,now+1).state.stats.battles,1);});
test('manual march persists round choices across reload and settles one time',()=>{let s=create(),id=Object.keys(s.army)[0];s=doAction(s,{type:'march',nodeId:'node-001',troopId:id,count:18,combatMode:'manual'},1000);const arrival=Math.ceil(s.queues.march.finishAt);s=advance(s,arrival).state;assert.equal(s.stats.battles,0);assert.ok(s.queues.march.arrivedAt);s=doAction(s,{type:'battleCommand',round:1,stance:'guard',artifactId:null},arrival+1);assert.equal(s.queues.march.battleCommands.length,1);s=migrateSave(JSON.parse(JSON.stringify(s)),arrival+2);s=doAction(s,{type:'battleAuto'},arrival+3);assert.equal(s.queues.march,null);assert.equal(s.stats.battles,1);assert.equal(s.combatReceipts.length,1);assert.equal(s.reports[0].battleCommands.length,s.reports[0].rounds.length);assert.equal(advance(s,arrival+4).state.stats.battles,1);});
test('real duel dispatch all modes and recovery across reload',()=>{let s=create();for(const mode of ['tower','mountain']){const at=s.lastTickAt+1200000;s=doAction(s,{type:'duel',mode,mountainId:IMMORTAL_MOUNTAINS[0].id},at);assert.equal(s.reports[0].mode,mode);assert.ok(s.reports[0].combatBattleId);s=migrateSave(JSON.parse(JSON.stringify(s)),at);}assert.equal(s.stats.duels,2);assert.equal(new Set(s.combatReceipts).size,2);});
test('fresh and migrated saves dispatch combat by default while pending old marches stay legacy', () => {
  const fresh = createNewGame('old', 1000);
  assert.equal(fresh.settings.combatV13, true);
  fresh.settings.combatV13 = false;
  fresh.version = 2;
  const id = Object.keys(fresh.army)[0];
  const old = doAction({...fresh, version:3}, {type:'march', nodeId:'node-011', troopId:id, count:18}, 1000);
  const migrated = migrateSave({...old, version:2}, 1000);
  assert.equal(migrated.settings.combatV13, true);
  assert.equal(migrated.queues.march.combatV13, undefined);
  const settled = advance(migrated, migrated.queues.march.finishAt).state;
  assert.equal(settled.stats.battles, 1);
  assert.equal(settled.combatReceipts.length, 0);
});

test('equipment and research survive actual dispatch',()=>{let s=create();const id=s.heroes[0].id;s=doAction(s,{type:'equip',heroId:id,itemId:'item-01'},1000);assert.equal(s.heroes[0].equipment.weapon,'item-01');s=doAction(s,{type:'march',nodeId:'node-001',troopId:Object.keys(s.army)[0],count:18},1000);assert.throws(()=>doAction(s,{type:'trainHero',heroId:id},1001),/đang hành quân/);s=advance(s,Math.ceil(s.queues.march.finishAt)).state;assert.equal(s.stats.battles,1);assert.ok(s.reports[0].rounds.every(r=>Number.isFinite(r.ownDamage)&&Number.isFinite(r.enemyDamage)));});
