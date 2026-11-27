import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD_NODES } from '../src/catalog.js';
import { createNewGame, storageCapacity } from '../src/engine.js';
import { createProductCombat } from '../src/combat/product-v13.js';
import { TROOPS } from '../src/catalog.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('73 Mobile city records expose five source NPC identities and troop roles with local portrait provenance', () => {
  const cities=WORLD_NODES.filter(city=>city.mobileCityId);
  assert.equal(cities.length,73);
  let guards=0;
  for(const city of cities){
    assert.equal(city.mobileGarrison.length,5,`${city.name} garrison count`);
    const source=city.fieldProvenance.mobileGarrison;
    assert.equal(source.evidence,'VERIFIED_MOBILE');
    assert.equal(source.sourceTable,'danh-thanh');
    assert.equal(source.sourceRecordId,city.mobileCityId);
    assert.match(source.dataHash,/^[a-f0-9]{64}$/);
    assert.match(source.schemaHash,/^[a-f0-9]{64}$/);
    assert.equal(city.mobileGarrisonNote,'Quân số trấn thủ tuỳ máy chủ.');
    assert.equal(city.fieldProvenance.mobileGarrisonNote.evidence,'VERIFIED_MOBILE');
    assert.match(city.fieldProvenance.mobileGarrisonNote.sourceField,/Quân trấn thủ\]\.ghi$/);
    for(const [index,guard] of city.mobileGarrison.entries()){
      guards++;
      assert.ok(guard.name);
      assert.ok(guard.troopText);
      assert.ok(guard.localImage);
      assert.ok(existsSync(path.join(root,guard.localImage)));
      assert.equal('troopCount' in guard,false);
      for(const [field,suffix] of [['name','t'],['image','a'],['rank','m'],['troopText','p']]){
        const provenance=guard.fieldProvenance[field];
        assert.equal(provenance.evidence,'VERIFIED_MOBILE');
        assert.equal(provenance.sourceField,`${source.sourceField}[${index}].${suffix}`);
      }
      const image=guard.fieldProvenance.localImage;
      assert.equal(image.evidence,'VERIFIED_MOBILE_ASSET');
      assert.equal(image.sourceField,`${source.sourceField}[${index}].a`);
      assert.match(image.assetSha256,/^[a-f0-9]{64}$/);
      assert.ok(existsSync(path.join(root,image.assetPath)));
    }
  }
  assert.equal(guards,365);
});

test('all 73 Mobile city garrisons provide their verified troop identities to real battle inputs',()=>{
  const cities=WORLD_NODES.filter(city=>city.mobileCityId),state=createNewGame('Kiểm tra đồn trú Mobile',1_810_000_000_000),combat=createProductCombat({storageCapacity});
  const ownTroop=TROOPS.find(row=>row.mobileSourceId==='1000');assert.ok(ownTroop);
  for(const city of cities){
    assert.equal(city.enemy.formationEvidence,'VERIFIED_MOBILE_IDENTITIES_SIMULATED_COUNTS',city.mobileCityId);
    assert.equal(city.enemy.commander,city.mobileGarrison[0].name,city.mobileCityId);
    assert.equal(city.enemy.formation.length,5,city.mobileCityId);
    const expected=new Set(city.mobileGarrison.map(guard=>TROOPS.find(row=>row.name===guard.troopText)?.id));
    assert.ok(!expected.has(undefined),city.mobileCityId);
    const result=combat.marchInput(state,{nodeId:city.id,troops:{[ownTroop.id]:10},startAt:state.lastTickAt,seed:city.mobileCityId});
    assert.equal(result.input.sides[1].name,city.mobileGarrison[0].name,city.mobileCityId);
    assert.deepEqual(new Set(result.input.sides[1].stacks.map(stack=>stack.id)),expected,city.mobileCityId);
    assert.ok(result.input.sides[1].stacks.every(stack=>stack.count>=1),city.mobileCityId);
  }
});
