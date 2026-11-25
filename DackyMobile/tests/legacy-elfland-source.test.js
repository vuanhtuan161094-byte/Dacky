import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMMORTAL_MOUNTAINS,
  LEGACY_ELFLAND_FLOORS,
  LEGACY_ELFLAND_FORMATIONS,
  LEGACY_ELFLAND_LOCATIONS,
  LEGACY_ELFLAND_REWARD_RULES,
  LEGACY_ELFLAND_SOURCE
} from '../src/catalog.js';

test('legacy Tiên Sơn source records are joined by pinned row references and remain combat/reward references', () => {
  assert.equal(LEGACY_ELFLAND_SOURCE.permission.status, 'AUTHORIZED_FOR_RUNTIME');
  assert.equal(LEGACY_ELFLAND_SOURCE.evidence, 'VERIFIED_LEGACY_REFERENCE');
  assert.equal(LEGACY_ELFLAND_SOURCE.locationCount, 624);
  assert.equal(LEGACY_ELFLAND_SOURCE.floorCount, 8992);
  assert.equal(LEGACY_ELFLAND_SOURCE.formationCount, 39670);
  assert.equal(LEGACY_ELFLAND_SOURCE.rewardRuleCount, 1093);
  assert.equal(LEGACY_ELFLAND_SOURCE.importedRecordCount, 50379);
  assert.equal(LEGACY_ELFLAND_SOURCE.importedFieldValueCount, 310750);
  assert.equal(LEGACY_ELFLAND_SOURCE.combatStatus, 'REFERENCE_ONLY_CURRENT_FALLBACK_UNCHANGED');
  assert.equal(LEGACY_ELFLAND_SOURCE.activeSourceDamageOrRewards, false);
  assert.equal(LEGACY_ELFLAND_SOURCE.rewardStatus, 'UNKNOWN_RAW_RANDOM_RULES_REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED');

  const comparison = LEGACY_ELFLAND_SOURCE.versionComparison;
  assert.equal(comparison.locations.sharedKeys, 624);
  assert.equal(comparison.locations.changedValuesByField.ElflandLevel, 94);
  assert.equal(comparison.locations.changedValuesByField.FloorNum, 93);
  assert.equal(comparison.floors.primaryRows, 8992);
  assert.equal(comparison.floors.comparisonRows, 8248);
  assert.equal(comparison.floors.primaryOnlyKeys, 744);
  assert.equal(comparison.floors.changedValuesByField.FloorName, 665);
  assert.equal(comparison.formations.exactSharedRows, 32545);
  assert.equal(comparison.formations.primaryOnlyRows, 7125);
  assert.equal(comparison.formations.comparisonOnlyRows, 2475);
  assert.equal(comparison.comparisonVersions.noCrossVersionRuntimeMixing, true);

  const tableKeys = Object.keys(LEGACY_ELFLAND_SOURCE.sourceTables);
  assert.deepEqual(tableKeys, ['locations','floors','formations','rewards']);
  for (const [tableKey, rows] of [
    ['locations',LEGACY_ELFLAND_LOCATIONS],
    ['floors',LEGACY_ELFLAND_FLOORS],
    ['formations',LEGACY_ELFLAND_FORMATIONS],
    ['rewards',LEGACY_ELFLAND_REWARD_RULES]
  ]) {
    const table = LEGACY_ELFLAND_SOURCE.sourceTables[tableKey];
    assert.equal(rows.length, table.recordCount);
    assert.equal(Object.keys(table.fieldSources).length, table.importedFields.length);
    for (const row of rows) {
      assert.equal(row.evidence, 'VERIFIED_LEGACY');
      assert.equal(row.sourceTable, table.sourceTable);
      assert.ok(Number.isInteger(row.sourceRowIndex));
      for (const field of table.importedFields) {
        const provenance = table.fieldSources[field];
        assert.equal(provenance.sourceField, field);
        assert.equal(provenance.sourceTable, table.sourceTable);
        assert.match(provenance.dataHash, /^[a-f0-9]{40}$/);
        assert.match(provenance.schemaHash, /^[a-f0-9]{40}$/);
        assert.match(provenance.indexHash, /^[a-f0-9]{40}$/);
      }
    }
  }

  for (const location of LEGACY_ELFLAND_LOCATIONS) {
    for (const rowIndex of location.floorRowIndexes) {
      const floor = LEGACY_ELFLAND_FLOORS[rowIndex-1];
      assert.equal(Number(floor.ElflandID), Number(location.ElflandID));
      assert.ok(floor.formationRowIndexes.every(index => LEGACY_ELFLAND_FORMATIONS[index-1]?.ElflandID === floor.ElflandID));
    }
  }
  assert.equal(LEGACY_ELFLAND_REWARD_RULES.every(row => row.RandBaseNum > 0), true);
  assert.equal(IMMORTAL_MOUNTAINS.length, 624);
  const sortedLocations=[...LEGACY_ELFLAND_LOCATIONS].sort((a,b)=>Number(a.ElflandID)-Number(b.ElflandID));
  for (const [index, mountain] of IMMORTAL_MOUNTAINS.entries()) {
    const source = sortedLocations[index];
    assert.equal(mountain.name, source.ElflandName);
    assert.equal(mountain.legacySourceId, source.ElflandID);
    assert.equal(mountain.legacyFloorCount, source.FloorNum);
    assert.equal(mountain.fieldEvidence.name, 'VERIFIED_LEGACY');
    assert.equal(mountain.fieldProvenance.name.sourceTable, 'elflandinfo');
    assert.equal(mountain.fieldProvenance.legacyDescription.sourceField, 'ElflandDescribe');
    assert.equal(mountain.evidence, 'MIXED');
    assert.equal(mountain.legacyEvidence, 'VERIFIED_LEGACY');
    assert.equal(mountain.fieldEvidence.power, 'SIMULATED');
  }
});
