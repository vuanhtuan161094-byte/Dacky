import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVED_SOURCE_FACTS, SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'input-private', 'normalized_legacy');
const outputPath = path.join(root, 'src', 'legacy-troop-requirement-catalog.js');
const sourceTable = '147-soldierrequireinfo';
const comparisonTable = 'soldierrequireinfo';
const HASH = /^[a-f0-9]{40}$/i;
const resourceMap = Object.freeze({
  4: ['gold', 'Gold'],
  5: ['food', 'Food'],
  6: ['timber', 'Wood'],
  7: ['stone', 'Stone'],
  8: ['iron', 'Iron']
});
const buildingMap = Object.freeze({
  22: [null, 'WorkShop'],
  23: ['barracks', 'Barrack']
});
const technologyMap = Object.freeze({
  39: ['tech-09', 'TrainingTech'],
  45: ['tech-13', 'LeadSoldierTech']
});

async function loadTable(name, fields = ['SoldierID', 'RequireType', 'RequireNamedID', 'RequireValue']) {
  const source = JSON.parse(await readFile(path.join(sourceDir, `${name}.json`), 'utf8'));
  if (source.status !== 'PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'
      || source.sourceCommit !== '13d969fc88c141553535c70943aaa98cf9f86616'
      || source.sourceTable !== name || !Array.isArray(source.records) || !Array.isArray(source.schema)) {
    throw new Error(`Legacy table ${name} is not the pinned normalized research input.`);
  }
  const columns = Object.fromEntries(source.schema.map(column => [column.name, column.provenance]));
  const descriptors = fields.map(field => columns[field]);
  for (const descriptor of descriptors) {
    if (!descriptor || descriptor.sourceTable !== name || descriptor.sourceCommit !== source.sourceCommit
        || !HASH.test(descriptor.dataBlobSha1 || '') || !HASH.test(descriptor.schemaBlobSha1 || '')
        || !HASH.test(descriptor.indexBlobSha1 || '')) {
      throw new Error(`Legacy table ${name}.${fields[descriptors.indexOf(descriptor)]} lacks pinned provenance.`);
    }
  }
  for (const hashField of ['dataBlobSha1', 'schemaBlobSha1', 'indexBlobSha1']) {
    if (new Set(descriptors.map(row => row[hashField])).size !== 1) {
      throw new Error(`Legacy table ${name} fields do not share one ${hashField}.`);
    }
  }
  return { source, descriptors: Object.fromEntries(fields.map((field, i) => [field, descriptors[i]])) };
}

function factProvenance(source, descriptors, sourceId, sourceRows, sourceField) {
  const first = descriptors.RequireValue;
  return {
    evidence: 'VERIFIED_LEGACY',
    sourceVersion: `Dacky legacy MySQL snapshot ${source.sourceCommit.slice(0, 10)}`,
    sourceCommit: source.sourceCommit,
    sourceTable: source.sourceTable,
    sourceField,
    dataHash: first.dataBlobSha1,
    schemaHash: first.schemaBlobSha1,
    indexHash: first.indexBlobSha1,
    sourceRecordId: String(sourceId),
    sourceRows: sourceRows.map(row => ({
      sourceField: 'RequireType+RequireNamedID+RequireValue',
      requirementType: row.RequireType,
      requireNamedId: row.RequireNamedID,
      requireValue: row.RequireValue
    })),
    license: SOURCE_REUSE_DECISION.license,
    permissionEvidence: SOURCE_REUSE_DECISION.permissionEvidence
  };
}

function requirementKey(row) {
  return `${row.SoldierID}:${row.RequireType}:${row.RequireNamedID}`;
}

async function importLegacyTroopRequirements() {
  if (SOURCE_REUSE_DECISION.status !== 'AUTHORIZED_FOR_RUNTIME') {
    throw new Error('Legacy troop requirement import requires the recorded owner authorization.');
  }
  const [legacy, comparison, named] = await Promise.all([
    loadTable(sourceTable), loadTable(comparisonTable), loadTable('namedinfo', ['NamedID', 'Name', 'Class'])
  ]);
  const sourceFacts = APPROVED_SOURCE_FACTS.troops || {};
  const targetBySource = new Map(Object.entries(sourceFacts).map(([targetId, fields]) => [
    String(fields.mobileSourceId?.value || ''), targetId
  ]).filter(([sourceId]) => sourceId));
  const mobileSourceIds = new Set(targetBySource.keys());
  const mobileRows = legacy.source.records.filter(row => mobileSourceIds.has(String(row.SoldierID)));
  const grouped = new Map();
  for (const row of mobileRows) {
    const sourceId = String(row.SoldierID);
    const rows = grouped.get(sourceId) || [];
    rows.push(row);
    grouped.set(sourceId, rows);
  }
  if (grouped.size !== 16 || mobileRows.length !== 126) {
    throw new Error(`Expected 126 requirement rows for 16 mapped Mobile troop IDs; found ${mobileRows.length}/${grouped.size}.`);
  }

  const namedById = new Map(named.source.records.map(row => [String(row.NamedID), row]));
  const idsToValidate = new Set([
    ...Object.keys(resourceMap), ...Object.keys(buildingMap), ...Object.keys(technologyMap)
  ]);
  const expectedNames = [
    ...Object.values(resourceMap).map(([, name]) => name),
    ...Object.values(buildingMap).map(([, name]) => name),
    ...Object.values(technologyMap).map(([, name]) => name)
  ];
  for (const [id, name] of [...Object.entries(resourceMap), ...Object.entries(buildingMap), ...Object.entries(technologyMap)]) {
    const row = namedById.get(String(id));
    if (!row || row.Name !== name[1]) throw new Error(`Legacy NamedID ${id} did not match expected source name ${name[1]}.`);
    const expectedClass = resourceMap[id] ? '资源' : buildingMap[id] ? '管理建筑' : '科技';
    if (row.Class !== expectedClass) throw new Error(`Legacy NamedID ${id} has an unexpected class.`);
  }
  if (expectedNames.length !== idsToValidate.size) throw new Error('Legacy source crosswalk contains duplicate NamedIDs.');

  const latestByKey = new Map(comparison.source.records.map(row => [requirementKey(row), row.RequireValue]));
  let comparisonRows = 0;
  for (const row of mobileRows) {
    const value = latestByKey.get(requirementKey(row));
    if (value === undefined || value !== row.RequireValue) {
      throw new Error(`Legacy requirement versions disagree for ${requirementKey(row)}.`);
    }
    comparisonRows++;
  }

  const facts = {};
  const unsupportedRequirementTypes = new Set();
  for (const [sourceId, rows] of grouped) {
    const targetId = targetBySource.get(sourceId);
    if (!targetId) throw new Error(`No approved Mobile troop target for SoldierID ${sourceId}.`);
    const costs = {};
    const costRows = [];
    const buildings = [];
    const technologies = [];
    const unknown = [];
    const seen = new Set();
    for (const row of rows) {
      const key = `${row.RequireType}:${row.RequireNamedID}`;
      if (seen.has(key)) throw new Error(`Duplicate legacy training requirement ${sourceId}:${key}.`);
      seen.add(key);
      if (!Number.isSafeInteger(row.RequireValue) || row.RequireValue < 0) {
        throw new Error(`Invalid requirement value for SoldierID ${sourceId}:${key}.`);
      }
      const named = namedById.get(String(row.RequireNamedID));
      if (!named) throw new Error(`Missing legacy NamedID ${row.RequireNamedID} for SoldierID ${sourceId}.`);
      if (row.RequireType === 2) {
        const mapped = resourceMap[row.RequireNamedID];
        if (!mapped) throw new Error(`Unmapped training resource NamedID ${row.RequireNamedID}.`);
        const [runtimeKey, expectedName] = mapped;
        if (named.Name !== expectedName || named.Class !== '资源') throw new Error(`Resource crosswalk mismatch at NamedID ${row.RequireNamedID}.`);
        costs[runtimeKey] = row.RequireValue;
        costRows.push(row);
      } else if (row.RequireType === 1) {
        const mapped = buildingMap[row.RequireNamedID];
        const expected = mapped?.[1];
        if (!mapped || named.Name !== expected || named.Class !== '管理建筑') throw new Error(`Building requirement crosswalk mismatch at NamedID ${row.RequireNamedID}.`);
        const runtimeBuildingId = mapped[0];
        const rule = {
          sourceNamedId: String(row.RequireNamedID), sourceName: named.Name,
          level: row.RequireValue, runtimeBuildingId,
          status: runtimeBuildingId ? 'VERIFIED_LEGACY' : 'UNKNOWN'
        };
        if (runtimeBuildingId) buildings.push(rule);
        else unknown.push(rule);
      } else if (row.RequireType === 3) {
        const mapped = technologyMap[row.RequireNamedID];
        const expected = mapped?.[1];
        if (!mapped || named.Name !== expected || named.Class !== '科技') throw new Error(`Technology requirement crosswalk mismatch at NamedID ${row.RequireNamedID}.`);
        technologies.push({
          sourceNamedId: String(row.RequireNamedID), sourceName: named.Name,
          level: row.RequireValue, runtimeTechnologyId: mapped[0], status: 'VERIFIED_LEGACY'
        });
      } else {
        unsupportedRequirementTypes.add(row.RequireType);
        unknown.push({
          sourceNamedId: String(row.RequireNamedID), sourceName: named.Name,
          sourceType: row.RequireType, level: row.RequireValue, runtimeBuildingId: null, status: 'UNKNOWN'
        });
      }
    }
    const requiredResourceIds = Object.keys(resourceMap).map(Number);
    if (requiredResourceIds.some(id => !rows.some(row => row.RequireType === 2 && row.RequireNamedID === id))) {
      throw new Error(`SoldierID ${sourceId} has an incomplete source cost vector.`);
    }
    if (!costRows.length) throw new Error(`SoldierID ${sourceId} has no source training cost rows.`);
    const costProvenance = factProvenance(legacy.source, legacy.descriptors, sourceId, costRows,
      'RequireType+RequireNamedID+RequireValue (resource costs)');
    const allProvenance = factProvenance(legacy.source, legacy.descriptors, sourceId, rows,
      'RequireType+RequireNamedID+RequireValue (building/technology requirements)');
    const attachRowProvenance = rule => {
      const row = rows.find(value => String(value.RequireNamedID) === rule.sourceNamedId
        && value.RequireValue === rule.level && (rule.sourceType === undefined || value.RequireType === rule.sourceType));
      if (!row) return rule;
      return { ...rule, provenance: factProvenance(legacy.source, legacy.descriptors, sourceId, [row],
        'RequireType+RequireNamedID+RequireValue') };
    };
    const costFieldProvenance = {
      ...costProvenance,
      sourceRows: costRows.map(row => ({
        targetField: resourceMap[row.RequireNamedID][0], sourceField: 'RequireType+RequireNamedID+RequireValue',
        requirementType: row.RequireType, requireNamedId: row.RequireNamedID, requireValue: row.RequireValue
      }))
    };
    facts[targetId] = {
      cost: { value: costs, targetType: 'object', provenance: costFieldProvenance },
      trainingRequirements: {
        value: {
          buildings: buildings.map(attachRowProvenance),
          technologies: technologies.map(attachRowProvenance),
          unknown: unknown.map(rule => attachRowProvenance({ ...rule, sourceType: rule.sourceType ?? 1 }))
        },
        targetType: 'object', provenance: allProvenance
      }
    };
  }

  const metadata = {
    status: 'VERIFIED_LEGACY_TROOP_REQUIREMENT_ADAPTER',
    sourceVersion: `Dacky legacy MySQL snapshot ${legacy.source.sourceCommit.slice(0, 10)}`,
    sourceCommit: legacy.source.sourceCommit,
    sourceTable,
    sourceFields: ['RequireType', 'RequireNamedID', 'RequireValue'],
    mappedTroops: Object.keys(facts).length,
    mobileTroopsCompared: targetBySource.size,
    importedRequirementRows: mobileRows.length,
    comparison: {
      table: comparisonTable, sharedMobileRequirementRows: comparisonRows,
      valueConflicts: 0
    },
    resourceMap,
    buildingMap,
    technologyMap,
    unsupportedRequirementTypes: [...unsupportedRequirementTypes].sort((a, b) => a - b),
    permission: SOURCE_REUSE_DECISION
  };
  await writeFile(outputPath,
    `// Generated by scripts/import_legacy_troop_requirements.mjs from pinned normalized legacy rows.\nexport const LEGACY_TROOP_REQUIREMENT_SOURCE = Object.freeze(${JSON.stringify(metadata)});\nexport const LEGACY_TROOP_REQUIREMENT_FACTS = Object.freeze(${JSON.stringify(facts)});\n`,
    'utf8');
  return { mappedTroops: Object.keys(facts).length, mobileTroopsCompared: targetBySource.size,
    importedRequirementRows: mobileRows.length, comparisonRows };
}

const result = await importLegacyTroopRequirements();
console.log(JSON.stringify(result));
