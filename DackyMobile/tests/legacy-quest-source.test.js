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
  }
  assert.equal(LEGACY_QUESTS[0].sourceId, 10000);
  assert.equal(LEGACY_QUESTS[0].title, 'Khí thế ngất trời');
  assert.equal('reward' in LEGACY_QUESTS[0], false);
  assert.equal('conditions' in LEGACY_QUESTS[0], false);
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
