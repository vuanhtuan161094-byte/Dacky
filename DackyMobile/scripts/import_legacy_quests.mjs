import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'input-private', 'normalized_legacy');
const outputPath = path.join(root, 'src', 'legacy-quest-catalog.js');
const fields = ['id', 'title', 'content', 'brief', 'target', 'type'];
const conditionFields = ['id', 'questId', 'title', 'type', ...Array.from({ length: 10 }, (_, i) => `data${i}`)];
const conditionDataFields = Array.from({ length: 10 }, (_, i) => `data${i}`);
const HASH = /^[a-f0-9]{40}$/i;

async function loadTable(name, requiredFields = fields) {
  const table = JSON.parse(await readFile(path.join(inputDir, `${name}.json`), 'utf8'));
  if (table.status !== 'PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'
      || !Array.isArray(table.records) || !Array.isArray(table.schema)) {
    throw new Error(`Legacy table ${name} is not a normalized research table.`);
  }
  const columns = Object.fromEntries(table.schema.map(column => [column.name, column.provenance]));
  for (const field of requiredFields) {
    const provenance = columns[field];
    if (!provenance || !HASH.test(provenance.dataBlobSha1 || '')
        || !HASH.test(provenance.schemaBlobSha1 || '') || !HASH.test(provenance.indexBlobSha1 || '')) {
      throw new Error(`Legacy table ${name} has no pinned provenance for ${field}.`);
    }
  }
  return { ...table, columns };
}

function comparison(selected, alternate) {
  const selectedById = new Map(selected.records.map(row => [row.id, row]));
  const alternateById = new Map(alternate.records.map(row => [row.id, row]));
  const sharedIds = [...selectedById.keys()].filter(id => alternateById.has(id));
  const changedFields = {};
  for (const id of sharedIds) {
    const current = selectedById.get(id);
    const other = alternateById.get(id);
    for (const field of fields) {
      if (current[field] !== other[field]) changedFields[field] = (changedFields[field] || 0) + 1;
    }
  }
  return {
    comparedTable: alternate.sourceTable,
    comparedRecords: alternate.records.length,
    selectedRecords: selected.records.length,
    sharedRecordCount: sharedIds.length,
    selectedOnlyIds: [...selectedById.keys()].filter(id => !alternateById.has(id)).sort((a, b) => a - b),
    comparedOnlyIds: [...alternateById.keys()].filter(id => !selectedById.has(id)).sort((a, b) => a - b),
    changedFieldRecordCounts: changedFields,
    parityClaim: false
  };
}

function tableFieldSources(table, requiredFields) {
  return Object.fromEntries(requiredFields.map(field => {
    const descriptor = table.columns[field];
    return [field, {
      evidence: 'VERIFIED_LEGACY',
      sourceVersion: `Dacky legacy MySQL snapshot ${table.sourceCommit.slice(0, 10)}`,
      sourceCommit: table.sourceCommit,
      sourceTable: table.sourceTable,
      sourceField: field,
      dataHash: descriptor.dataBlobSha1,
      schemaHash: descriptor.schemaBlobSha1,
      indexHash: descriptor.indexBlobSha1
    }];
  }));
}

export async function importLegacyQuests() {
  if (SOURCE_REUSE_DECISION.status !== 'AUTHORIZED_FOR_RUNTIME') {
    throw new Error('Legacy runtime import requires the recorded owner authorization.');
  }
  const selected = await loadTable('quest');
  const alternate = await loadTable('quest_20_11');
  const conditionTable = await loadTable('questcondition', conditionFields);
  const sourceCommit = selected.sourceCommit;
  if (!/^[a-f0-9]{40}$/i.test(sourceCommit || '')) throw new Error('Legacy source commit is invalid.');
  if (conditionTable.sourceCommit !== sourceCommit) throw new Error('Quest descriptions and conditions must use the same pinned legacy snapshot.');
  const selectedQuestIds = new Set(selected.records.map(row => row.id));
  const conditionRowsByQuest = new Map();
  const conditionIds = new Set();
  const conditionTypeCounts = {};
  for (const row of conditionTable.records) {
    if (!selectedQuestIds.has(row.questId)) {
      throw new Error(`Quest condition ${row.id} points to missing quest ID ${row.questId}.`);
    }
    if (conditionIds.has(row.id)) throw new Error(`Duplicate legacy quest condition ID ${row.id}.`);
    conditionIds.add(row.id);
    conditionTypeCounts[row.type] = (conditionTypeCounts[row.type] || 0) + 1;
    const rows = conditionRowsByQuest.get(row.questId) || [];
    rows.push({
      sourceId: row.id,
      questSourceId: row.questId,
      title: row.title,
      typeCode: row.type,
      data: conditionDataFields.map(field => row[field]),
      evidence: 'VERIFIED_LEGACY',
      mechanicsStatus: 'UNKNOWN',
      fieldProvenance: Object.fromEntries(conditionFields.map(sourceField => [sourceField, {
        sourceRecordId: String(row.id),
        sourceField
      }]))
    });
    conditionRowsByQuest.set(row.questId, rows);
  }
  if (conditionRowsByQuest.size !== selectedQuestIds.size || conditionTable.records.length !== 5745) {
    throw new Error(`Unexpected quest condition coverage: ${conditionTable.records.length} rows across ${conditionRowsByQuest.size}/${selectedQuestIds.size} quest IDs.`);
  }
  const records = selected.records.map(row => ({
    id: `legacy-quest-${row.id}`,
    sourceId: row.id,
    title: row.title,
    content: row.content,
    brief: row.brief,
    target: row.target,
    typeCode: row.type,
    mechanicsStatus: 'UNKNOWN',
    evidence: 'VERIFIED_LEGACY',
    conditions: conditionRowsByQuest.get(row.id) || [],
    rewardsStatus: 'UNKNOWN_NO_REWARD_FIELDS_IN_IMPORTED_TABLES',
    fieldProvenance: Object.fromEntries(fields.map(field => [field, {
      sourceField: field,
      sourceRecordId: String(row.id)
    }]))
  }));
  if (records.length !== 1158 || new Set(records.map(row => row.id)).size !== records.length) {
    throw new Error(`Unexpected legacy quest row set: ${records.length}.`);
  }
  const metadata = {
    sourceVersion: `Dacky legacy MySQL snapshot ${sourceCommit.slice(0, 10)}`,
    sourceCommit,
    sourceTable: selected.sourceTable,
    recordCount: records.length,
    evidence: 'VERIFIED_LEGACY',
    mechanicsStatus: 'UNKNOWN',
    importedFields: fields,
    fieldSources: tableFieldSources(selected, fields),
    conditionCount: conditionTable.records.length,
    conditionQuestCount: conditionRowsByQuest.size,
    conditionSourceTable: conditionTable.sourceTable,
    conditionImportedFields: conditionFields,
    conditionDataFields,
    conditionTypeCounts,
    conditionFieldSources: tableFieldSources(conditionTable, conditionFields),
    conditionMechanicsStatus: 'UNKNOWN_TYPE_AND_DATA_SEMANTICS',
    rewardStatus: 'UNKNOWN_NO_REWARD_FIELDS_IN_IMPORTED_TABLES',
    permission: SOURCE_REUSE_DECISION,
    versionComparison: comparison(selected, alternate)
  };
  const generated = [
    '// Generated by scripts/import_legacy_quests.mjs from pinned, hash-verified quest and questcondition fields.',
    "import { SOURCE_REUSE_DECISION } from './approved-source-data.js';",
    `export const LEGACY_QUEST_SOURCE = Object.freeze(${JSON.stringify(metadata)});`,
    `export const LEGACY_QUESTS = Object.freeze(${JSON.stringify(records)});`,
    ''
  ].join('\n');
  await writeFile(outputPath, generated, 'utf8');
  console.log(JSON.stringify({ records: records.length, importedFields: fields, comparison: metadata.versionComparison }));
  return { metadata, records };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await importLegacyQuests();
}
