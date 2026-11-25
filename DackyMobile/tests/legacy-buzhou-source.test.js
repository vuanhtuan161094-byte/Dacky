import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUZHOU_FLOORS,
  LEGACY_BUZHOU_EQUIPMENT_RULES,
  LEGACY_BUZHOU_FLOOR_CONFIG,
  LEGACY_BUZHOU_FLOORS,
  LEGACY_BUZHOU_FORMATIONS,
  LEGACY_BUZHOU_MOUNTAIN_CONFIG,
  LEGACY_BUZHOU_REWARDS,
  LEGACY_BUZHOU_SOURCE
} from '../src/catalog.js';

test('legacy Buzhou floor and NPC data preserves pinned field provenance without activating fallback combat or loot', () => {
  assert.equal(LEGACY_BUZHOU_SOURCE.permission.status, 'AUTHORIZED_FOR_RUNTIME');
  assert.equal(LEGACY_BUZHOU_SOURCE.evidence, 'VERIFIED_LEGACY_REFERENCE');
  assert.equal(LEGACY_BUZHOU_SOURCE.floorCount, 5);
  assert.equal(BUZHOU_FLOORS, 5);
  assert.equal(LEGACY_BUZHOU_SOURCE.formationCount, 90);
  assert.deepEqual(LEGACY_BUZHOU_SOURCE.formationFloorIds, [4,5]);
  assert.equal(LEGACY_BUZHOU_SOURCE.rewardReferenceCount, 10);
  assert.equal(LEGACY_BUZHOU_SOURCE.equipmentRuleCount, 27);
  assert.equal(LEGACY_BUZHOU_SOURCE.importedRecordCount, 137);
  assert.equal(LEGACY_BUZHOU_SOURCE.importedFieldValueCount, 950);
  assert.equal(LEGACY_BUZHOU_SOURCE.combatStatus, 'REFERENCE_ONLY_CURRENT_FALLBACK_UNCHANGED');
  assert.equal(LEGACY_BUZHOU_SOURCE.activeSourceDamageOrRewards, false);
  assert.equal(LEGACY_BUZHOU_SOURCE.rewardStatus, 'UNKNOWN_REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED');
  assert.equal(LEGACY_BUZHOU_SOURCE.equipmentRuleStatus, 'UNKNOWN_RAW_RANDOM_RULES_REFERENCE_ONLY');

  const tables = [
    ['mountain', LEGACY_BUZHOU_MOUNTAIN_CONFIG],
    ['floors', LEGACY_BUZHOU_FLOOR_CONFIG],
    ['formations', LEGACY_BUZHOU_FORMATIONS],
    ['rewards', LEGACY_BUZHOU_REWARDS],
    ['equipment', LEGACY_BUZHOU_EQUIPMENT_RULES]
  ];
  for (const [tableKey, rows] of tables) {
    const tableSource = LEGACY_BUZHOU_SOURCE.sourceTables[tableKey];
    assert.equal(rows.length, tableSource.recordCount);
    assert.deepEqual(Object.keys(tableSource.fieldSources), tableSource.importedFields);
    for (const [field, provenance] of Object.entries(tableSource.fieldSources)) {
      assert.equal(provenance.sourceTable, tableSource.sourceTable);
      assert.equal(provenance.sourceField, field);
      assert.match(provenance.dataHash, /^[a-f0-9]{40}$/);
      assert.match(provenance.schemaHash, /^[a-f0-9]{40}$/);
      assert.match(provenance.indexHash, /^[a-f0-9]{40}$/);
    }
    for (const row of rows) {
      assert.equal(row.evidence, 'VERIFIED_LEGACY');
      assert.ok(Number.isInteger(row.sourceRowIndex));
      assert.deepEqual(Object.keys(row.fieldProvenance), tableSource.importedFields);
      for (const field of tableSource.importedFields) {
        assert.equal(row.fieldProvenance[field].sourceTable, tableSource.sourceTable);
        assert.equal(row.fieldProvenance[field].sourceRowIndex, row.sourceRowIndex);
        assert.equal(row.fieldProvenance[field].sourceField, field);
      }
    }
  }

  assert.deepEqual(LEGACY_BUZHOU_FLOORS.map(row => row.floorId), [1,2,3,4,5]);
  assert.deepEqual(LEGACY_BUZHOU_FLOORS.slice(0,3).map(row => row.formationRowIndexes.length), [0,0,0]);
  assert.deepEqual(LEGACY_BUZHOU_FLOORS.slice(0,3).map(row => row.generalMinNum), [10,20,30]);
  assert.equal(LEGACY_BUZHOU_FLOORS[3].formationRowIndexes.length, 40);
  assert.equal(LEGACY_BUZHOU_FLOORS[4].formationRowIndexes.length, 50);
  assert.equal(LEGACY_BUZHOU_FORMATIONS[0].GeneralName, 'Mục Kiền Liên');
  assert.ok(LEGACY_BUZHOU_FLOORS.every(row => row.rewardStatus === 'REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED'));
});
