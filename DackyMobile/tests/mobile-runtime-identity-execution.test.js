import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, HEROES, TECHNOLOGIES, TROOPS } from '../src/catalog.js';
import { createNewGame, quoteBuilding, quoteResearch, quoteTraining, storageCapacity } from '../src/engine.js';
import { createProductCombat } from '../src/combat/product-v13.js';

test('all 547 non-city source identities enter live building, research, training, or commander runtime paths',()=>{
  const state=createNewGame('Kiểm tra runtime Mobile',1_810_000_000_000),combat=createProductCombat({storageCapacity});
  const buildings=BUILDINGS.filter(row=>row.mobileSourceId),technologies=TECHNOLOGIES.filter(row=>row.mobileSourceId),troops=TROOPS.filter(row=>row.mobileSourceId),heroes=HEROES.filter(row=>row.mobileSourceId);
  assert.equal(buildings.length,21);assert.equal(technologies.length,19);assert.equal(troops.length,25);assert.equal(heroes.length,482);
  for(const row of buildings){
    const quote=quoteBuilding(state,row.id);
    assert.ok(quote&&Number.isFinite(quote.seconds)&&Object.keys(quote.cost).length,`building ${row.mobileSourceId}`);
  }
  for(const row of technologies){
    assert.equal(row.mobileLevelCosts.length,30,`technology ${row.mobileSourceId}`);
    const quote=quoteResearch(state,row.id);
    assert.ok(quote&&Number.isFinite(quote.seconds)&&Object.keys(quote.cost).length,`technology ${row.mobileSourceId}`);
  }
  for(const row of troops){
    const quote=quoteTraining(state,row.id,1);
    assert.ok(quote&&Number.isFinite(quote.seconds)&&Object.keys(quote.cost).length,`troop ${row.mobileSourceId}`);
  }
  for(const row of heroes){
    assert.ok(combat.runtime.index.heroes[String(row.mobileSourceId)],`hero source profile ${row.mobileSourceId}`);
    const instance={...state.heroes[0],id:row.id,level:1,equipment:{},gearEnhancements:{}};
    const commander=combat.commander(instance,state);
    assert.equal(commander.heroId,String(row.mobileSourceId),`hero ${row.mobileSourceId}`);
    assert.ok(commander.maxVitality>0,`hero ${row.mobileSourceId} has playable vitality`);
  }
});
