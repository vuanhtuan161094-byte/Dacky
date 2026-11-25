import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS, WORLD_NODES } from '../src/catalog.js';

test('legacy city NPC rosters join Mobile cities by exact coordinates as reference-only data',()=>{
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.legacyCityCount,75);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.legacyGuardRecordCount,375);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.mobileCityCount,73);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.coordinateMatchedMobileCities,73);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.legacyOnlyCityCount,2);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.matchedLegacyGuardRecordCount,365);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.combatEffectActive,false);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.rewardEffectActive,false);
  assert.equal(LEGACY_CITY_GARRISON_SOURCE.rosterParity,'NOT_ASSERTED');

  const matched=LEGACY_CITY_GARRISONS.filter(city=>city.mobileCityId);
  const legacyOnly=LEGACY_CITY_GARRISONS.filter(city=>!city.mobileCityId);
  assert.equal(matched.length,73);
  assert.equal(legacyOnly.length,2);
  for(const city of LEGACY_CITY_GARRISONS){
    assert.equal(city.guards.length,5,city.coordinateKey);
    for(const row of city.guards){
      assert.ok(row.generalName);
      assert.ok(row.leadSoldierName);
      assert.ok(Number.isFinite(row.leadSoldierCount));
      assert.equal(row.evidence,'VERIFIED_LEGACY');
      assert.equal(row.fieldProvenance.leadSoldierCount.evidence,'VERIFIED_LEGACY');
      assert.equal(row.fieldProvenance.leadSoldierCount.sourceTable,'famouscitygeneralinfo');
      assert.equal(row.fieldProvenance.leadSoldierName.sourceTable,'147-soldierinfo');
      assert.match(row.fieldProvenance.leadSoldierCount.dataHash,/^[a-f0-9]{40}$/);
      assert.match(row.fieldProvenance.leadSoldierName.dataHash,/^[a-f0-9]{40}$/);
    }
  }
  for(const city of WORLD_NODES.filter(row=>row.mobileCityId)){
    assert.equal(city.legacyGarrison.length,5,city.mobileCityId);
    assert.equal(city.legacyGarrisonCoordinateKey,city.mobileCoordinates.join(','));
  }
  assert.ok(WORLD_NODES.filter(row=>row.mobileCityId).every(row=>!row.enemy.legacyGarrison));
});
