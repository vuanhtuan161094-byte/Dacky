import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, createNewGame } from '../src/engine.js';

test('clinic gradually heals wounded troops from budgeted food and gold over elapsed time',()=>{
  const state=createNewGame('Clinic test',1000);state.levels.clinic=1;state.army={};state.wounded={'troop-01':1000};
  const baseline=structuredClone(state);baseline.wounded={};const at=1000+86400_000;
  const reference=advance(baseline,at).state,result=advance(state,at).state;
  const healed=1000-(result.wounded['troop-01']||0);
  assert.ok(healed>0);assert.ok(healed<=1320);assert.equal(result.army['troop-01'],healed);
  assert.equal((result.army['troop-01']||0)+(result.wounded['troop-01']||0),1000);
  assert.ok(result.resources.food<reference.resources.food);assert.ok(result.resources.gold<reference.resources.gold);
});

test('passive hospital recovery is disabled without a clinic and never creates troops',()=>{
  const state=createNewGame('No clinic',1000);state.levels.clinic=0;state.army={};state.wounded={'troop-01':100};
  const result=advance(state,1000+86400_000).state;
  assert.equal(result.wounded['troop-01'],100);assert.equal(result.army['troop-01']||0,0);
});
