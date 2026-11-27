import test from 'node:test';
import assert from 'node:assert/strict';
import { MOBILE_SOURCE_DATABASE,TROOPS,WORLD_NODES } from '../src/catalog.js';
import { createCombatRuntime } from '../src/combat/runtime-v7.js';
import { createProductCombat } from '../src/combat/product-v13.js';
import { createNewGame,storageCapacity,migrateSave } from '../src/engine.js';
import { distributeSquads,aggregateSquadStacks,validateSquadAllocation } from '../src/combat/squad-ownership.js';
const rt=createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:TROOPS,allowSimulatedLife:true}),ids=Object.keys(rt.troops);
const hero=(heroId,instanceId)=>({heroId,instanceId,level:150,vitality:1000,maxVitality:1000,mana:1000,maxMana:1000,equippedArtifactIds:[]});
const fixture=()=>({battleId:'d2',seed:17,policy:{maxRounds:4,damageScale:.02},sides:[
 {...hero('na-tra','a'),reserves:[hero('ba-trung','r')],stacks:[{id:ids[0],count:1000}],squadStacks:[[{id:ids[0],count:400}],[{id:ids[0],count:600}]]},
 {...hero('ba-trung','b'),stacks:[{id:ids[1],count:500}],squadStacks:[[{id:ids[1],count:500}]]}
]});
test('allocation conserves each troop type, rejects duplicate allocation',()=>{
 const stacks=[{id:'t',count:7},{id:'u',count:2}],groups=distributeSquads(stacks,[{instanceId:'a'},{instanceId:'b'},{instanceId:'c'}]);
 assert.deepEqual(aggregateSquadStacks(groups),stacks);
 assert.deepEqual(validateSquadAllocation(stacks,groups,3),groups);
 assert.throws(()=>validateSquadAllocation(stacks,[[{id:'t',count:8}],[{id:'u',count:2}],[]],3),/mismatch/);
});
test('manual switch activates only owned reserve; prefix and casualty totals conserved',()=>{
 const x=rt.session(fixture()),a=x.step({artifactId:null}),b=x.step({switchTo:'r',artifactId:null});
 assert.equal(a.result.rounds[0].sides[0].activeSquadId,'a');
 assert.equal(a.result.rounds[0].sides[0].squads[1].troops,600);
 assert.deepEqual(b.result.rounds[0],a.result.rounds[0]);
 assert.equal(b.result.rounds[1].sides[0].activeSquadId,'r');
 assert.equal(b.result.rounds[1].sides[0].squads[0].troops,a.result.rounds[0].sides[0].squads[0].troops);
 assert.ok(b.result.rounds[1].sides[0].troops<=600);
 const q=b.result.settlement[0];assert.equal(q.remaining[ids[0]]+q.wounded[ids[0]]+q.dead[ids[0]],1000);
});
test('exhausted squad does not transfer troops; deterministic outcomes',()=>{
 const input=fixture();input.sides[0].vitality=0;
 const a=rt.army(input),b=rt.army(input);assert.deepEqual(a,b);
 assert.equal(a.rounds[0].sides[0].activeSquadId,'r');
 assert.equal(a.rounds[0].sides[0].squads[0].troops,400);
 assert.equal(a.rounds[0].sides[0].squads[0].status,'defeated');
});
test('squad mode ends in draw at round cap when both remain viable',()=>{
 const input=fixture();input.policy={maxRounds:1,damageScale:.00001};
 const a=rt.army(input);assert.equal(a.winner,null);assert.equal(a.termination,'ROUND_LIMIT');
});
test('product adapter uses squad allocation and settles exactly once',()=>{
 const s=createNewGame('D2',1000),id=Object.keys(s.army)[0],node=WORLD_NODES.find(n=>n.kind==='Dã địa');
 const service=createProductCombat({storageCapacity});s.army[id]=0;
 s.queues.march={nodeId:node.id,troops:{[id]:18},startAt:1000,finishAt:2000,seed:17,battleId:'d2-march',squadMode:true};
 const r=service.finishMarch(s,{now:2000});assert.ok(r.battle.squadMode);
 assert.equal((r.state.army[id]||0)+(r.state.wounded[id]||0)+r.battle.dead[id],18);
 assert.ok(r.state.combatReceipts.includes('d2-march'));
 assert.throws(()=>service.finishMarch(r.state,{now:2000}),/NO_PENDING/);
 assert.ok(migrateSave(JSON.parse(JSON.stringify(r.state)),2000).combatReceipts.includes('d2-march'));
});
