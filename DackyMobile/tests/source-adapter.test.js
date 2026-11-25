import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { applyApprovedSourceFields } from '../src/source-adapter.js';
import { APPROVED_SOURCE_FACTS, SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';
import { BUILDINGS, HEROES, ITEMS, MOBILE_SOURCE_DATABASE, TECHNOLOGIES, TROOPS } from '../src/catalog.js';

const rows = [{ id: 'building-1', name: 'Authored name', evidence: 'SIMULATED' }];
const decision = {
  status: 'AUTHORIZED_FOR_RUNTIME',
  license: 'Owner grant 2026-01',
  permissionEvidence: 'permission-record:gameplay-fields-v1'
};
const provenance = {
  evidence: 'VERIFIED_LEGACY', sourceVersion: 'legacy-test-v1', sourceTable: 'buildinfo',
  sourceField: 'Name', dataHash: 'a'.repeat(40), schemaHash: 'b'.repeat(40),
  sourceCommit: 'c'.repeat(40),
  license: decision.license, permissionEvidence: decision.permissionEvidence
};
const fact = (value) => ({ value, targetType: typeof value, provenance });

test('empty approval set leaves current simulated catalogs unchanged', () => {
  assert.strictEqual(applyApprovedSourceFields(rows, {}, SOURCE_REUSE_DECISION), rows);
  assert.equal(rows[0].evidence, 'SIMULATED');
});

test('owner authorization imports field-scoped Mobile tables into gameplay catalogs', () => {
  const total=Object.values(MOBILE_SOURCE_DATABASE.categories).reduce((sum,category)=>sum+category.length,0);
  assert.equal(total,2656);
  assert.equal(SOURCE_REUSE_DECISION.status,'AUTHORIZED_FOR_RUNTIME');
  const farm=BUILDINGS.find(row=>row.id==='farm');
  assert.equal(farm.name,'Ruộng lúa');
  assert.equal(farm.mobileLevelCosts[0].cost.food,90);
  assert.equal(farm.fieldProvenance.mobileLevelCosts.sourceTable,'cong-trinh');
  assert.equal(farm.fieldEvidence.mobileLevelCosts,'VERIFIED_MOBILE');
  const troop=TROOPS.find(row=>row.id==='troop-02');
  assert.equal(troop.mobileSourceId,'1001');
  assert.equal(troop.attack,12);
  assert.equal(troop.mobileCounterRows.length,3);
  const tech=TECHNOLOGIES.find(row=>row.id==='tech-01');
  assert.equal(tech.mobileLevelCosts[0].effect,'+2%');
});

test('the full Mobile hero roster is playable with per-field provenance and source stats', () => {
  const mobileHeroes=HEROES.filter(hero=>hero.mobileSourceId);
  assert.equal(mobileHeroes.length,482);
  assert.equal(new Set(mobileHeroes.map(hero=>hero.mobileSourceId)).size,482);
  assert.ok(mobileHeroes.every(hero=>hero.mobileBaseStats.length>0&&hero.mobileImage.startsWith('./assets/mobile-source/')));
  assert.ok(mobileHeroes.every(hero=>hero.fieldEvidence.name==='VERIFIED_MOBILE'&&hero.fieldEvidence.mobileBaseStats==='VERIFIED_MOBILE'));
  assert.ok(mobileHeroes.every(hero=>hero.fieldProvenance.mobileBaseStats.sourceTable==='than-tien'));
  assert.equal(HEROES.filter(hero=>hero.evidence==='SIMULATED').length,58);
});

test('Mobile artifact records preserve source identity, effects, artwork, and field provenance', () => {
  const artifacts=ITEMS.filter(item=>item.fieldProvenance?.mobileSourceId?.sourceTable==='phap-bao');
  assert.equal(artifacts.length,151);
  assert.equal(new Set(artifacts.map(item=>item.mobileSourceId)).size,151);
  assert.ok(artifacts.every(item=>item.type==='pháp bảo'&&item.mobileImage.startsWith('./assets/mobile-source/')));
  assert.ok(artifacts.every(item=>item.mobileAbilityText===item.effect&&item.fieldEvidence.mobileAbilityText==='VERIFIED_MOBILE'));
  assert.ok(artifacts.every(item=>item.fieldProvenance.mobileAbilityText.sourceTable==='phap-bao'));
  const blades=artifacts.find(item=>item.mobileSourceId==='95902');
  assert.equal(blades.name,'Trảm Kình Song Kiếm');
  assert.equal(blades.mobileAbilityText,'Tăng 30% công kích phe ta, giảm 7% số lính địch');
  assert.equal(blades.bonus,0);
});

test('Mobile goods map chest openings, acquisition, source stats and merchant availability', () => {
  const goods=ITEMS.filter(item=>item.fieldProvenance?.mobileSourceId?.sourceTable==='vat-pham');
  assert.equal(goods.length,1885);
  assert.equal(ITEMS.filter(item=>item.mobileSourceId).length,2036);
  assert.ok(goods.every(item=>item.fieldEvidence.name==='VERIFIED_MOBILE'&&item.fieldEvidence.mobileStats==='VERIFIED_MOBILE'));
  assert.ok(goods.every(item=>item.fieldProvenance.mobileOpening.sourceTable==='vat-pham'));
  const chest=goods.find(item=>item.mobileSourceId==='4608');
  assert.equal(chest.name,'Hộp Ngự Thiên Đình');
  assert.equal(chest.useEffect.kind,'mobileChest');
  assert.equal(chest.mobileOpening.mode,'random');
  assert.equal(chest.mobileOpening.rewards.length,32);
  const gear=goods.find(item=>item.mobileSourceId==='7232');
  assert.equal(gear.type,'giáp');
  assert.equal(gear.mobileEquipmentSlot,'Mũ');
  assert.deepEqual(gear.mobileStats.slice(0,2),[['Công kích','+70'],['Phòng thủ','+35']]);
  assert.equal(gear.mobileAvailableAtMerchant,false);
  const storeChest=goods.find(item=>item.mobileSourceId==='6392');
  assert.equal(storeChest.mobileAvailableAtMerchant,true);
  assert.equal(storeChest.fieldEvidence.mobileAvailableAtMerchant,'VERIFIED_MOBILE');
  assert.equal(storeChest.fieldProvenance.mobileAvailableAtMerchant.sourceRecordId,'7232');
  assert.equal(storeChest.useEffect.kind,'mobileChest');
  const foodPack=goods.find(item=>item.mobileSourceId==='6315');
  assert.deepEqual(foodPack.useEffect,{kind:'resource',resource:'food',amount:10000000});
});

test('Mobile source artwork is local, checksummed, and bundled for offline use', () => {
  const manifest=JSON.parse(readFileSync(new URL('../assets/mobile-source-manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.count,2209);
  assert.equal(manifest.totalBytes,13173749);
  assert.ok(manifest.assets.every(asset=>/^[a-f0-9]{64}$/i.test(asset.sha256)&&existsSync(new URL(`../${asset.path}`,import.meta.url))));
  const rows=Object.values(MOBILE_SOURCE_DATABASE.categories).flat();
  assert.ok(rows.filter(row=>row.image).every(row=>row.localImage?.startsWith('./assets/mobile-source/')));
});

test('source facts cannot enter runtime without documented reuse permission', () => {
  assert.throws(() => applyApprovedSourceFields(rows, {
    'building-1': { name: fact('Source value') }
  }, SOURCE_REUSE_DECISION), /permission/);
});

test('approved field imports retain individual provenance', () => {
  const result = applyApprovedSourceFields(rows, {
    'building-1': { name: fact('Permitted name') }
  }, decision);
  assert.equal(result[0].name, 'Permitted name');
  assert.equal(result[0].evidence, 'MIXED');
  assert.equal(result[0].fieldEvidence.name, 'VERIFIED_LEGACY');
  assert.deepEqual(result[0].fieldProvenance.name, provenance);
  assert.equal(rows[0].name, 'Authored name');
});

test('adapter rejects a field hash mismatch or an identifier overwrite', () => {
  assert.throws(() => applyApprovedSourceFields(rows, {
    'building-1': { name: { ...fact('Source value'), provenance: { ...provenance, dataHash: 'bad' } } }
  }, decision), /field.*provenance/);
  assert.throws(() => applyApprovedSourceFields(rows, {
    'building-1': { id: fact('changed') }
  }, decision), /cannot replace field/);
  assert.throws(() => applyApprovedSourceFields(rows, {
    'building-1': { name: { ...fact('wrong type'), targetType: 'number' } }
  }, decision), /value type/);
});
