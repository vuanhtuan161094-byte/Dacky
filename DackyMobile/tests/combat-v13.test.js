import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame,storageCapacity,migrateSave } from '../src/engine.js';
import { createProductCombat } from '../src/combat/product-v13.js';
import { WORLD_NODES,IMMORTAL_MOUNTAINS,TOWER_FLOORS,BUZHOU_FLOORS } from '../src/catalog.js';
const service=createProductCombat({storageCapacity});
test('march adapter uses already debited troops, atomic settlement and save reload',()=>{
 const s=createNewGame('test',1000),id=Object.keys(s.army)[0],node=WORLD_NODES.find(n=>n.kind==='Dã địa');
 s.army[id]=0;s.queues.march={nodeId:node.id,troops:{[id]:18},startAt:1000,finishAt:2000,seed:17,battleId:'m1'};
 const before=JSON.stringify(s);assert.throws(()=>service.finishMarch(s,{now:1500}),/NOT_ARRIVED/);
 const r=service.finishMarch(s,{now:2000});assert.equal(JSON.stringify(s),before);assert.equal(r.state.queues.march,null);assert.equal(r.state.army[id]+r.state.wounded[id]+r.battle.dead[id],18);assert.equal(r.state.stats.battles,1);assert.ok(r.state.combatReceipts.includes('m1'));
 assert.throws(()=>service.finishMarch(r.state,{now:2000}),/NO_PENDING/);
 const loaded=migrateSave(JSON.parse(JSON.stringify(r.state)),2000);assert.ok(loaded.combatReceipts.includes('m1'));
});
test('all map formations resolve and every mountain and tower boundary quotes',()=>{
 const s=createNewGame('test',1000),id=Object.keys(s.army)[0];
 for(const n of WORLD_NODES){const q={nodeId:n.id,troops:{[id]:18},startAt:0,seed:17};assert.ok(service.marchInput(s,q).input.sides[1].stacks.length);}
 for(const m of IMMORTAL_MOUNTAINS)assert.equal(service.quoteDuel(s,'mountain',m.id).mountainId,m.id);
 s.world.towerFloor=TOWER_FLOORS-1;assert.equal(service.quoteDuel(s,'tower').floor,TOWER_FLOORS);s.world.towerFloor++;assert.throws(()=>service.quoteDuel(s,'tower'),/CAP/);
 s.world.buzhouFloor=BUZHOU_FLOORS;assert.throws(()=>service.quoteDuel(s,'buzhou'),/CAP/);
});
test('duel receipts persist, no duplicate reward, no troop deduction',()=>{
 for(const mode of ['tower','buzhou','mountain']){const s=createNewGame('test',1000),args={battleId:'d:'+mode,mode,mountainId:IMMORTAL_MOUNTAINS[0].id,seed:17,now:1000};const r=service.runDuel(s,args);assert.equal(r.state.stats.duels,1);assert.deepEqual(r.state.army,s.army);assert.throws(()=>service.runDuel(r.state,args),/ALREADY_SETTLED/);assert.deepEqual(s.combatReceipts,undefined);}
});
