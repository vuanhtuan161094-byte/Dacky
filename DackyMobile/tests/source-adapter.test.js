import test from 'node:test';
import assert from 'node:assert/strict';
import { applyApprovedSourceFields } from '../src/source-adapter.js';
import { APPROVED_SOURCE_FACTS, SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

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
  assert.strictEqual(applyApprovedSourceFields(rows, APPROVED_SOURCE_FACTS.buildings || {}, SOURCE_REUSE_DECISION), rows);
  assert.equal(rows[0].evidence, 'SIMULATED');
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
