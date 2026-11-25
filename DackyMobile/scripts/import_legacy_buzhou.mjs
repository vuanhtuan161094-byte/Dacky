import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'input-private', 'normalized_legacy');
const outputPath = path.join(root, 'src', 'legacy-buzhou-catalog.js');
const HASH = /^[a-f0-9]{40}$/i;
const TABLES = {
  mountain: { name: 'buzhoumountainconfig', fields: ['MountainID','FloorCnt','Describe'] },
  floors: { name: 'buzhoumountainfloorconfig', fields: ['MountainID','FloorID','FloorName','FloorDescribe','IsFight','GeneralMinLevel','GeneralMaxLevel','GeneralLeadPopulation','GeneralMinNum','GeneralMaxNum'] },
  formations: { name: 'buzhoumountaingeneralconfig', fields: ['MountainID','FloorID','GeneralName','LeadSoldierID','LeadSoldierNum'] },
  rewards: { name: 'buzhoumountainfightgetgoodscfginfo', fields: ['CfgClass','buzhouMountainFloor','goodsId'] },
  equipment: { name: 'buzhoumountainfightgetzhuangbeicfginfo', fields: ['CfgClass','buzhouMountainFloor','RandBaseNum','OpenMinNum','OpenMaxNum', ...Array.from({ length: 10 }, (_, i) => `RdmInfo${i + 1}`)] }
};

async function loadTable({ name, fields }) {
  const table = JSON.parse(await readFile(path.join(inputDir, `${name}.json`), 'utf8'));
  if (table.status !== 'PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'
      || !Array.isArray(table.records) || !Array.isArray(table.schema)) {
    throw new Error(`Legacy table ${name} is not a normalized research table.`);
  }
  const columns = Object.fromEntries(table.schema.map(column => [column.name, column.provenance]));
  for (const field of fields) {
    const provenance = columns[field];
    if (!provenance || !HASH.test(provenance.dataBlobSha1 || '')
        || !HASH.test(provenance.schemaBlobSha1 || '') || !HASH.test(provenance.indexBlobSha1 || '')) {
      throw new Error(`Legacy table ${name} has no pinned provenance for ${field}.`);
    }
  }
  return { ...table, columns };
}

function decorateRows(table, fields) {
  return table.records.map((row, index) => {
    const sourceRowIndex = index + 1;
    return {
      ...row,
      sourceRowIndex,
      evidence: 'VERIFIED_LEGACY',
      fieldProvenance: Object.fromEntries(fields.map(sourceField => [sourceField, {
        sourceTable: table.sourceTable,
        sourceRowIndex,
        sourceField
      }]))
    };
  });
}

function tableMetadata(table, fields, recordCount) {
  return {
    sourceTable: table.sourceTable,
    recordCount,
    importedFields: fields,
    fieldSources: Object.fromEntries(fields.map(field => {
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
    }))
  };
}

export async function importLegacyBuzhou() {
  if (SOURCE_REUSE_DECISION.status !== 'AUTHORIZED_FOR_RUNTIME') {
    throw new Error('Legacy runtime import requires the recorded owner authorization.');
  }
  const loaded = Object.fromEntries(await Promise.all(
    Object.entries(TABLES).map(async ([key, definition]) => [key, await loadTable(definition)])
  ));
  const sourceCommit = loaded.mountain.sourceCommit;
  if (!HASH.test(sourceCommit || '') || Object.values(loaded).some(table => table.sourceCommit !== sourceCommit)) {
    throw new Error('Buzhou source tables must share the same pinned legacy commit.');
  }

  const mountain = decorateRows(loaded.mountain, TABLES.mountain.fields);
  const floorRows = decorateRows(loaded.floors, TABLES.floors.fields);
  const formations = decorateRows(loaded.formations, TABLES.formations.fields);
  const rewards = decorateRows(loaded.rewards, TABLES.rewards.fields);
  const equipmentRules = decorateRows(loaded.equipment, TABLES.equipment.fields);
  const floorIds = floorRows.map(row => Number(row.FloorID));
  const floorIdSet = new Set(floorIds);
  if (floorRows.length !== 5 || floorIdSet.size !== 5 || [...floorIdSet].sort((a,b)=>a-b).some((id,index)=>id!==index+1)) {
    throw new Error(`Unexpected Buzhou floor set: ${JSON.stringify(floorIds)}.`);
  }
  if (mountain.length !== 5 || new Set(mountain.map(row => Number(row.FloorCnt))).size !== 5
      || formations.length !== 90 || rewards.length !== 10 || equipmentRules.length !== 27) {
    throw new Error(`Unexpected Buzhou source counts: config=${mountain.length}, formations=${formations.length}, rewards=${rewards.length}, equipment=${equipmentRules.length}.`);
  }
  for (const [label, rows] of [['formation', formations], ['reward', rewards], ['equipment rule', equipmentRules]]) {
    for (const row of rows) {
      const floorId = Number(row.FloorID ?? row.buzhouMountainFloor);
      if (!floorIdSet.has(floorId)) throw new Error(`Buzhou ${label} source row ${row.sourceRowIndex} references missing floor ${floorId}.`);
    }
  }

  const floors = floorRows.map(row => ({
    floorId: Number(row.FloorID),
    sourceRowIndex: row.sourceRowIndex,
    name: row.FloorName,
    description: row.FloorDescribe,
    isFight: Number(row.IsFight) === 1,
    generalMinLevel: Number(row.GeneralMinLevel),
    generalMaxLevel: Number(row.GeneralMaxLevel),
    generalLeadPopulation: Number(row.GeneralLeadPopulation),
    generalMinNum: Number(row.GeneralMinNum),
    generalMaxNum: Number(row.GeneralMaxNum),
    fieldProvenance: row.fieldProvenance,
    formationRowIndexes: formations.filter(general => Number(general.FloorID) === Number(row.FloorID)).map(general => general.sourceRowIndex),
    rewardRowIndexes: rewards.filter(reward => Number(reward.buzhouMountainFloor) === Number(row.FloorID)).map(reward => reward.sourceRowIndex),
    equipmentRuleRowIndexes: equipmentRules.filter(rule => Number(rule.buzhouMountainFloor) === Number(row.FloorID)).map(rule => rule.sourceRowIndex),
    derivedProvenance: {
      formationRowIndexes: { evidence: 'VERIFIED_LEGACY', sourceTable: loaded.formations.sourceTable, joinFields: ['MountainID','FloorID'] },
      rewardRowIndexes: { evidence: 'VERIFIED_LEGACY', sourceTable: loaded.rewards.sourceTable, joinFields: ['buzhouMountainFloor'] },
      equipmentRuleRowIndexes: { evidence: 'VERIFIED_LEGACY', sourceTable: loaded.equipment.sourceTable, joinFields: ['buzhouMountainFloor'] }
    },
    evidence: 'VERIFIED_LEGACY',
    combatStatus: 'REFERENCE_ONLY_FALLBACK_UNCHANGED',
    rewardStatus: 'REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED'
  }));
  const metadata = {
    sourceVersion: `Dacky legacy MySQL snapshot ${sourceCommit.slice(0, 10)}`,
    sourceCommit,
    evidence: 'VERIFIED_LEGACY_REFERENCE',
    floorCount: floors.length,
    formationCount: formations.length,
    formationFloorIds: [...new Set(formations.map(row => Number(row.FloorID)))].sort((a,b)=>a-b),
    rewardReferenceCount: rewards.length,
    equipmentRuleCount: equipmentRules.length,
    importedRecordCount: mountain.length + floorRows.length + formations.length + rewards.length + equipmentRules.length,
    importedFieldValueCount: Object.entries(TABLES).reduce((count, [key, definition]) => count + loaded[key].records.length * definition.fields.length, 0),
    sourceTables: Object.fromEntries(Object.entries(TABLES).map(([key, definition]) => [key,
      tableMetadata(loaded[key], definition.fields, loaded[key].records.length)
    ])),
    formationStatus: 'SOURCE_NPC_ROSTER_READY_FOR_COMBAT_ADAPTER',
    combatStatus: 'REFERENCE_ONLY_CURRENT_FALLBACK_UNCHANGED',
    activeSourceDamageOrRewards: false,
    rewardStatus: 'UNKNOWN_REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED',
    equipmentRuleStatus: 'UNKNOWN_RAW_RANDOM_RULES_REFERENCE_ONLY',
    permission: SOURCE_REUSE_DECISION
  };
  const generated = [
    '// Generated by scripts/import_legacy_buzhou.mjs from pinned, hash-verified legacy Buzhou tables.',
    "import { SOURCE_REUSE_DECISION } from './approved-source-data.js';",
    `export const LEGACY_BUZHOU_SOURCE = Object.freeze(${JSON.stringify(metadata)});`,
    `export const LEGACY_BUZHOU_MOUNTAIN_CONFIG = Object.freeze(${JSON.stringify(mountain)});`,
    `export const LEGACY_BUZHOU_FLOOR_CONFIG = Object.freeze(${JSON.stringify(floorRows)});`,
    `export const LEGACY_BUZHOU_FLOORS = Object.freeze(${JSON.stringify(floors)});`,
    `export const LEGACY_BUZHOU_FORMATIONS = Object.freeze(${JSON.stringify(formations)});`,
    `export const LEGACY_BUZHOU_REWARDS = Object.freeze(${JSON.stringify(rewards)});`,
    `export const LEGACY_BUZHOU_EQUIPMENT_RULES = Object.freeze(${JSON.stringify(equipmentRules)});`,
    ''
  ].join('\n');
  await writeFile(outputPath, generated, 'utf8');
  console.log(JSON.stringify({
    sourceCommit: sourceCommit.slice(0, 10), floorCount: floors.length,
    formationCount: formations.length, rewardReferenceCount: rewards.length,
    equipmentRuleCount: equipmentRules.length,
    importedRecordCount: metadata.importedRecordCount,
    importedFieldValueCount: metadata.importedFieldValueCount,
    combatStatus: metadata.combatStatus,
    rewardStatus: metadata.rewardStatus
  }));
  return { metadata, mountain, floors, formations, rewards, equipmentRules };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await importLegacyBuzhou();
}
