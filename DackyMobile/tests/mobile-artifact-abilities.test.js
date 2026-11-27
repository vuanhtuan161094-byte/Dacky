import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, storageCapacity } from '../src/engine.js';
import { ITEMS, MOBILE_SOURCE_DATABASE, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { createCombatRuntime } from '../src/combat/runtime-v7.js';
import { createProductCombat } from '../src/combat/product-v13.js';

const runtime=createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:TROOPS,allowSimulatedLife:true});
const service=createProductCombat({storageCapacity,runtime});
const node=WORLD_NODES.find(row=>row.kind==='Dã địa');
function battleWith(itemId){
  const state=createNewGame('Artifact test',1000),hero=state.heroes[0];hero.assigned=true;hero.equipment.artifact=itemId;
  const troopId=Object.keys(state.army)[0];
  const input=service.marchInput(state,{nodeId:node.id,troops:{[troopId]:500},commanderIds:[hero.id],startAt:1000,seed:7}).input;
  input.sides[0].stacks[0].initialCount=550;input.sides[0].stacks[0].count=500;
  return service.runtime.army(input);
}

test('all source-described Mobile artifacts in the runtime index have mapped operations',()=>{
  const rows=ITEMS.filter(row=>row.fieldEvidence?.mobileAbilityText==='VERIFIED_MOBILE'&&row.mobileAbilityText);
  assert.equal(rows.length,151);
  assert.ok(rows.every(row=>runtime.index.artifacts[String(row.mobileSourceId)]?.status==='MAPPED'));
});

test('equipped Mobile army artifact casts through the existing engine with its sourced initial troop cap',()=>{
  const item=ITEMS.find(row=>String(row.mobileSourceId)==='6553'),artifact=runtime.index.artifacts['6553'];
  assert.deepEqual(artifact.ops.map(row=>[row.kind,row.ratio]),[['troopRecover',.09],['modifier',.18]]);
  const result=battleWith('item-1993'),cast=result.events.find(row=>row.type==='artifactCast'&&row.artifactId==='6553');
  assert.ok(cast);assert.ok(result.events.some(row=>row.type==='troopEffect'&&row.side===0&&row.requested===45));
  assert.ok(result.events.some(row=>row.type==='troopDelta'&&row.side===0&&row.actual===0&&row.remaining===500));
  assert.ok(result.events.some(row=>row.type==='modifier'&&row.side===0&&row.artifactId==='6553'&&row.ratio===.18));
});

test('Mobile enemy troop loss and conditional artifact effects remain source-indexed',()=>{
  const dog=runtime.index.artifacts['5112'];assert.equal(dog.status,'MAPPED');
  assert.ok(dog.ops.some(row=>row.kind==='troopLoss'&&row.side==='enemy'&&row.ratio===.08));
  assert.ok(dog.ops.some(row=>row.kind==='modifier'&&row.side==='enemy'&&row.stat==='defense'&&row.ratio===-.18));
  const rod=runtime.index.artifacts['8821'],pearl=runtime.index.artifacts['8822'];
  assert.ok(rod.ops.some(row=>row.condition==='equippedCompanion'&&row.artifactId==='8822'&&row.heroId==='trieu-cong-minh'));
  assert.ok(pearl.ops.some(row=>row.condition==='equippedCompanion'&&row.artifactId==='8821'&&row.heroId==='trieu-cong-minh'));
});
