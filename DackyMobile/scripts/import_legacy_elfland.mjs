import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'input-private', 'normalized_legacy');
const outputPath = path.join(root, 'src', 'legacy-elfland-catalog.js');
const HASH = /^[a-f0-9]{40}$/i;
const TABLES = {
  locations: { name: 'elflandinfo', fields: ['ElflandID','PosX','PosY','ElflandType','ElflandName','ElflandLevel','FloorNum','ElflandDescribe'] },
  floors: { name: 'elflandfloorinfo', fields: ['ElflandID','FloorID','FloorName','FloorDescribe','IsFight','GeneralMinLevel','GeneralMaxLevel','GeneralLeadPopulation','GeneralMinNum','GeneralMaxNum'] },
  formations: { name: 'elflandfloorgeneralinfo', fields: ['ElflandID','FloorID','GeneralName','LeadSoldierID','LeadSoldierNum'] },
  rewards: { name: 'elflandfightgetgoodscfginfo', fields: ['CfgClass','ElflandLevel','ElflandFloor','RandBaseNum','OpenMinNum','OpenMaxNum', ...Array.from({ length: 10 }, (_, i) => `RdmInfo${i + 1}`)] }
};
const COMPARISONS = {
  locations: { name: 'elflandinfo_45', fields: TABLES.locations.fields, keys: ['ElflandID'] },
  floors: { name: 'elflandfloorinfo_45', fields: TABLES.floors.fields, keys: ['ElflandID','FloorID'] },
  formations: { name: 'elflandfloorgeneralinfo_45', fields: TABLES.formations.fields, keys: ['ElflandID','FloorID','GeneralName','LeadSoldierID'] }
};

async function loadTable({ name, fields }) {
  const table = JSON.parse(await readFile(path.join(inputDir, `${name}.json`), 'utf8'));
  if (table.status !== 'PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'
      || !Array.isArray(table.records) || !Array.isArray(table.schema)
      || !HASH.test(table.sourceCommit || '')) {
    throw new Error(`Legacy table ${name} is not a pinned normalized research table.`);
  }
  const columns = Object.fromEntries(table.schema.map(column => [column.name, column.provenance]));
  for (const field of fields) {
    const provenance = columns[field];
    if (!provenance || provenance.sourceTable !== name || provenance.sourceCommit !== table.sourceCommit
        || !HASH.test(provenance.dataBlobSha1 || '') || !HASH.test(provenance.schemaBlobSha1 || '')
        || !HASH.test(provenance.indexBlobSha1 || '')) {
      throw new Error(`Legacy table ${name} has no pinned provenance for ${field}.`);
    }
  }
  return { ...table, columns };
}

function tableMetadata(table, fields, recordCount) {
  return {
    sourceTable: table.sourceTable,
    sourceVersion: `Dacky legacy MySQL snapshot ${table.sourceCommit.slice(0, 10)}`,
    sourceCommit: table.sourceCommit,
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

function decorateRows(table, fields) {
  return table.records.map((row, index) => ({
    ...row,
    sourceTable: table.sourceTable,
    sourceRowIndex: index + 1,
    evidence: 'VERIFIED_LEGACY'
  }));
}

function canonical(row, fields) {
  return JSON.stringify(fields.map(field => row[field] ?? null));
}

function compareKeyed(primary, comparison, keys, fields) {
  const keyOf = row => JSON.stringify(keys.map(field => row[field] ?? null));
  const a = new Map(primary.map(row => [keyOf(row), row]));
  const b = new Map(comparison.map(row => [keyOf(row), row]));
  if (a.size !== primary.length || b.size !== comparison.length) {
    throw new Error(`Version comparison key is not unique for ${keys.join(',')}.`);
  }
  const common = [...a.keys()].filter(key => b.has(key));
  return {
    primaryRows: primary.length,
    comparisonRows: comparison.length,
    sharedKeys: common.length,
    primaryOnlyKeys: [...a.keys()].filter(key => !b.has(key)).length,
    comparisonOnlyKeys: [...b.keys()].filter(key => !a.has(key)).length,
    changedValuesByField: Object.fromEntries(fields.filter(field => !keys.includes(field)).map(field => [
      field, common.filter(key => a.get(key)[field] !== b.get(key)[field]).length
    ]))
  };
}

function compareMultiset(primary, comparison, fields) {
  const countRows = rows => {
    const counts = new Map();
    for (const row of rows) {
      const key = canonical(row, fields);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  };
  const a = countRows(primary);
  const b = countRows(comparison);
  let sharedRows = 0;
  let primaryOnlyRows = 0;
  let comparisonOnlyRows = 0;
  for (const [key, count] of a) {
    const common = Math.min(count, b.get(key) || 0);
    sharedRows += common;
    primaryOnlyRows += count - common;
  }
  for (const [key, count] of b) comparisonOnlyRows += count - Math.min(count, a.get(key) || 0);
  return {
    primaryRows: primary.length,
    comparisonRows: comparison.length,
    exactSharedRows: sharedRows,
    primaryOnlyRows,
    comparisonOnlyRows,
    comparisonBasis: 'Exact full-row multiset; no entity identity or behavior parity inferred.'
  };
}

export async function importLegacyElfland() {
  if (SOURCE_REUSE_DECISION.status !== 'AUTHORIZED_FOR_RUNTIME') {
    throw new Error('Legacy runtime import requires the recorded owner authorization.');
  }
  const loaded = {};
  for (const [key, definition] of Object.entries(TABLES)) loaded[key] = await loadTable(definition);
  const comparisons = {};
  for (const [key, definition] of Object.entries(COMPARISONS)) comparisons[key] = await loadTable(definition);
  const sourceCommit = loaded.locations.sourceCommit;
  if (Object.values(loaded).some(table => table.sourceCommit !== sourceCommit)
      || Object.values(comparisons).some(table => table.sourceCommit !== sourceCommit)) {
    throw new Error('Tiên Sơn tables must share the same pinned legacy snapshot commit.');
  }

  const locations = decorateRows(loaded.locations, TABLES.locations.fields);
  const floorRows = decorateRows(loaded.floors, TABLES.floors.fields);
  const formations = decorateRows(loaded.formations, TABLES.formations.fields);
  const rewards = decorateRows(loaded.rewards, TABLES.rewards.fields);
  const locationIds = new Set(locations.map(row => Number(row.ElflandID)));
  const floorKeys = new Set(floorRows.map(row => `${row.ElflandID}:${row.FloorID}`));
  if (locations.length !== 624 || locationIds.size !== locations.length
      || floorRows.length !== 8992 || floorKeys.size !== floorRows.length
      || formations.length !== 39670 || rewards.length !== 1093) {
    throw new Error(`Unexpected Tiên Sơn source counts: locations=${locations.length}, floors=${floorRows.length}, formations=${formations.length}, rewards=${rewards.length}.`);
  }
  for (const row of floorRows) {
    if (!locationIds.has(Number(row.ElflandID))) throw new Error(`Tiên Sơn floor row ${row.sourceRowIndex} references missing location ${row.ElflandID}.`);
  }
  const formationsByFloor = new Map();
  for (const row of formations) {
    const key = `${row.ElflandID}:${row.FloorID}`;
    if (!floorKeys.has(key)) throw new Error(`Tiên Sơn formation row ${row.sourceRowIndex} references missing floor ${key}.`);
    const rows = formationsByFloor.get(key) || [];
    rows.push(row.sourceRowIndex);
    formationsByFloor.set(key, rows);
  }
  const floorsByLocation = new Map();
  const enrichedFloors = floorRows.map(row => {
    const key = `${row.ElflandID}:${row.FloorID}`;
    const floor = { ...row, formationRowIndexes: formationsByFloor.get(key) || [] };
    const rows = floorsByLocation.get(Number(row.ElflandID)) || [];
    rows.push(floor);
    floorsByLocation.set(Number(row.ElflandID), rows);
    return floor;
  });
  const enrichedLocations = locations.map(row => ({
    ...row,
    floorRowIndexes: (floorsByLocation.get(Number(row.ElflandID)) || []).map(floor => floor.sourceRowIndex)
  }));

  const versionComparison = {
    locations: compareKeyed(loaded.locations.records, comparisons.locations.records, COMPARISONS.locations.keys, TABLES.locations.fields),
    floors: compareKeyed(loaded.floors.records, comparisons.floors.records, COMPARISONS.floors.keys, TABLES.floors.fields),
    formations: compareMultiset(loaded.formations.records, comparisons.formations.records, TABLES.formations.fields),
    comparisonVersions: {
      primary: 'elfland* source snapshot',
      comparison: '*_45 source snapshot',
      noCrossVersionRuntimeMixing: true
    }
  };
  const sourceTables = Object.fromEntries(Object.entries(TABLES).map(([key, definition]) => [key,
    tableMetadata(loaded[key], definition.fields, loaded[key].records.length)
  ]));
  const metadata = {
    sourceVersion: `Dacky legacy MySQL snapshot ${sourceCommit.slice(0, 10)}`,
    sourceCommit,
    evidence: 'VERIFIED_LEGACY_REFERENCE',
    locationCount: locations.length,
    floorCount: enrichedFloors.length,
    formationCount: formations.length,
    rewardRuleCount: rewards.length,
    importedRecordCount: locations.length + enrichedFloors.length + formations.length + rewards.length,
    importedFieldValueCount: Object.entries(TABLES).reduce((count, [key, definition]) => count + loaded[key].records.length * definition.fields.length, 0),
    sourceTables,
    versionComparison,
    npcFormationStatus: 'SOURCE_NPC_ROSTER_READY_FOR_COMBAT_ADAPTER',
    combatStatus: 'REFERENCE_ONLY_CURRENT_FALLBACK_UNCHANGED',
    activeSourceDamageOrRewards: false,
    rewardStatus: 'UNKNOWN_RAW_RANDOM_RULES_REFERENCE_ONLY_NO_SOURCE_REWARD_APPLIED',
    permission: SOURCE_REUSE_DECISION
  };
  const generated = [
    '// Generated by scripts/import_legacy_elfland.mjs from pinned, hash-verified legacy Tiên Sơn tables.',
    `import { SOURCE_REUSE_DECISION } from './approved-source-data.js';`,
    `export const LEGACY_ELFLAND_SOURCE = Object.freeze(${JSON.stringify(metadata)});`,
    `export const LEGACY_ELFLAND_LOCATIONS = Object.freeze(${JSON.stringify(enrichedLocations)});`,
    `export const LEGACY_ELFLAND_FLOORS = Object.freeze(${JSON.stringify(enrichedFloors)});`,
    `export const LEGACY_ELFLAND_FORMATIONS = Object.freeze(${JSON.stringify(formations)});`,
    `export const LEGACY_ELFLAND_REWARD_RULES = Object.freeze(${JSON.stringify(rewards)});`,
    ''
  ].join('\n');
  await writeFile(outputPath, generated, 'utf8');
  console.log(JSON.stringify({
    sourceCommit: sourceCommit.slice(0, 10), locationCount: locations.length,
    floorCount: enrichedFloors.length, formationCount: formations.length,
    rewardRuleCount: rewards.length, importedRecordCount: metadata.importedRecordCount,
    importedFieldValueCount: metadata.importedFieldValueCount,
    versionComparison: {
      locations: versionComparison.locations,
      floors: versionComparison.floors,
      formations: versionComparison.formations
    },
    combatStatus: metadata.combatStatus, rewardStatus: metadata.rewardStatus
  }));
  return { metadata, locations: enrichedLocations, floors: enrichedFloors, formations, rewards };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await importLegacyElfland();
}
