import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const coverage=JSON.parse(readFileSync(path.join(root,'DATA_COVERAGE.json'),'utf8'));

test('legacy and Mobile hero names are compared without asserting IDs, stats, or mechanic parity',()=>{
  const comparison=coverage.mobileLegacyComparison.heroes;
  assert.equal(comparison.legacyRows,540);
  assert.equal(comparison.mobileRows,482);
  assert.equal(comparison.legacyUniqueNames,540);
  assert.equal(comparison.mobileUniqueNames,481);
  assert.equal(comparison.sharedUniqueNames,411);
  assert.equal(comparison.legacyOnlyUniqueNames,129);
  assert.equal(comparison.mobileOnlyUniqueNames,70);
  assert.equal(comparison.ambiguousSharedNameKeys,1);
  assert.match(comparison.sourceProvenance.legacyNameField.dataHash,/^[a-f0-9]{40}$/);
  assert.match(comparison.sourceProvenance.legacyNameField.schemaHash,/^[a-f0-9]{40}$/);
  assert.match(comparison.sourceProvenance.mobileNameField.dataHash,/^[a-f0-9]{64}$/);
  assert.match(comparison.sourceProvenance.mobileNameField.schemaHash,/^[a-f0-9]{64}$/);
  assert.equal(comparison.identityParity,'NOT_ASSERTED_NAME_LABELS_ONLY');
  assert.equal(comparison.statOrFormulaComparison,'NOT_COMPARED');
  assert.equal(comparison.parityClaim,false);
});
