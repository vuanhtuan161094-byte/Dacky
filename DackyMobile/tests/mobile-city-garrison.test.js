import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD_NODES } from '../src/catalog.js';

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
