import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_QUESTS, LEGACY_QUEST_SOURCE } from '../src/catalog.js';

test('legacy quest descriptions are bundled with per-field pinned provenance', () => {
  assert.equal(LEGACY_QUESTS.length, 1158);
  assert.equal(new Set(LEGACY_QUESTS.map(row => row.id)).size, 1158);
  assert.deepEqual(LEGACY_QUEST_SOURCE.importedFields, ['id','title','content','brief','target','type']);
  assert.equal(LEGACY_QUEST_SOURCE.sourceTable, 'quest');
  assert.equal(LEGACY_QUEST_SOURCE.evidence, 'VERIFIED_LEGACY');
  assert.equal(LEGACY_QUEST_SOURCE.mechanicsStatus, 'UNKNOWN');
  assert.equal(LEGACY_QUEST_SOURCE.permission.status, 'AUTHORIZED_FOR_RUNTIME');
  assert.equal(LEGACY_QUEST_SOURCE.permission.license, 'PROJECT_OWNER_AUTHORIZATION_ASSERTED_NO_SPDX');
  assert.equal(LEGACY_QUEST_SOURCE.conditionSourceTable, 'questcondition');
  assert.equal(LEGACY_QUEST_SOURCE.conditionCount, 5745);
  assert.equal(LEGACY_QUEST_SOURCE.conditionQuestCount, 1158);
  assert.equal(LEGACY_QUEST_SOURCE.conditionImportedFields.length, 14);
  assert.equal(LEGACY_QUEST_SOURCE.conditionDataFields.length, 10);
  assert.equal(LEGACY_QUEST_SOURCE.conditionMechanicsStatus, 'UNKNOWN_TYPE_AND_DATA_SEMANTICS');
  assert.equal(LEGACY_QUEST_SOURCE.rewardStatus, 'UNKNOWN_NO_REWARD_FIELDS_IN_IMPORTED_TABLES');

  let conditionCount=0;
  for (const row of LEGACY_QUESTS) {
    assert.equal(row.evidence, 'VERIFIED_LEGACY');
    assert.equal(row.mechanicsStatus, 'UNKNOWN');
    for (const field of LEGACY_QUEST_SOURCE.importedFields) {
      const provenance = row.fieldProvenance[field];
      assert.ok(provenance, `${row.id}.${field} provenance`);
      assert.equal(provenance.sourceRecordId, String(row.sourceId));
      assert.equal(provenance.sourceField, field);
      assert.equal(LEGACY_QUEST_SOURCE.fieldSources[field].sourceTable, 'quest');
      assert.match(LEGACY_QUEST_SOURCE.fieldSources[field].dataHash, /^[a-f0-9]{40}$/);
      assert.match(LEGACY_QUEST_SOURCE.fieldSources[field].schemaHash, /^[a-f0-9]{40}$/);
    }
    assert.ok(Array.isArray(row.conditions));
    assert.equal(row.rewardsStatus, 'UNKNOWN_NO_REWARD_FIELDS_IN_IMPORTED_TABLES');
    for (const condition of row.conditions) {
      conditionCount++;
      assert.equal(condition.questSourceId, row.sourceId);
      assert.equal(condition.evidence, 'VERIFIED_LEGACY');
      assert.equal(condition.mechanicsStatus, 'UNKNOWN');
      assert.deepEqual(Object.keys(condition.fieldProvenance), LEGACY_QUEST_SOURCE.conditionImportedFields);
      for (const field of LEGACY_QUEST_SOURCE.conditionImportedFields) {
        assert.equal(condition.fieldProvenance[field].sourceRecordId, String(condition.sourceId));
        assert.equal(condition.fieldProvenance[field].sourceField, field);
      }
      assert.equal(condition.data.length, 10);
    }
  }
  assert.equal(conditionCount, LEGACY_QUEST_SOURCE.conditionCount);
  assert.equal(LEGACY_QUESTS[0].sourceId, 10000);
  assert.equal(LEGACY_QUESTS[0].title, 'Khí thế ngất trời');
  assert.equal('reward' in LEGACY_QUESTS[0], false);
  assert.ok(LEGACY_QUESTS[0].conditions.length>0);
});

test('legacy quest version comparison records known deltas without asserting parity', () => {
  const comparison = LEGACY_QUEST_SOURCE.versionComparison;
  assert.equal(comparison.comparedTable, 'quest_20_11');
  assert.equal(comparison.comparedRecords, 1156);
  assert.equal(comparison.sharedRecordCount, 1156);
  assert.deepEqual(comparison.selectedOnlyIds, [110098, 110099]);
  assert.deepEqual(comparison.comparedOnlyIds, []);
  assert.deepEqual(comparison.changedFieldRecordCounts, { title: 3 });
  assert.equal(comparison.parityClaim, false);
});
