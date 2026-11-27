import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, HEROES, MOBILE_SOURCE_DATABASE, TECHNOLOGIES, TROOPS, WORLD_NODES } from '../src/catalog.js';
import { createNewGame, quoteBuilding, quoteResearch, quoteTraining, storageCapacity } from '../src/engine.js';
import { createProductCombat } from '../src/combat/product-v13.js';

const now=1_800_000_000_000;

test('each identity-linked Mobile hero, troop, technology, building and city reaches a runtime gameplay path',()=>{
  const state=createNewGame('Runtime coverage',now),combat=createProductCombat({storageCapacity});
  for(const building of BUILDINGS)state.levels[building.id]=building.maxLevel||30;
  for(const technology of TECHNOLOGIES)state.technologies[technology.id]=technology.maxLevel||30;

  const heroes=HEROES.filter(row=>row.mobileSourceId);
  assert.equal(heroes.length,482);
  for(const definition of heroes){
    const commander=combat.commander({id:definition.id,level:100,xp:0,skillLevel:10,affinity:100,equipment:{},potential:{attack:1,magic:1,defense:1}},state);
    assert.ok([commander.commandAttack,commander.commandDefense,commander.maxMana,commander.maxVitality].every(Number.isFinite),definition.name+' combat profile');
  }

  const troops=TROOPS.filter(row=>row.mobileSourceId);
  assert.equal(troops.length,25);
  for(const troop of troops)assert.equal(quoteTraining(state,troop.id,1).locked,false,troop.name+' training gates');

  const buildings=BUILDINGS.filter(row=>row.mobileSourceId),technologies=TECHNOLOGIES.filter(row=>row.mobileSourceId);
  assert.equal(buildings.length,21);assert.equal(technologies.length,19);
  for(const row of buildings)assert.ok(quoteBuilding(state,row.id),row.name+' building quote');
  for(const row of technologies)assert.ok(quoteResearch(state,row.id),row.name+' research quote');

  const cities=MOBILE_SOURCE_DATABASE.categories['danh-thanh'];
  assert.equal(cities.length,73);
  for(const city of cities){
    const node=WORLD_NODES.find(row=>String(row.mobileCityId)===String(city.id));
    assert.ok(node?.enemy?.formation?.length,city.name+' city battle');
  }
});
