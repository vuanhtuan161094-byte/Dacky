import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'input-private', 'normalized_legacy');
const outputPath = path.join(root, 'src', 'legacy-endgame-catalog.js');
const SNAPSHOT = '13d969fc88c141553535c70943aaa98cf9f86616';
const HASH = /^[a-f0-9]{40}$/i;
const TABLES = {
  strongpoints: {
    name: 'strongpointinfo',
    fields: ['PointID','PosX','PosY','PointName','PointIcon','PointDescribe','RampartLevel','SignalFireLevel','PointItemID','GeneralMinLevel','GeneralMaxLevel','GeneralLeadPopulation','GeneralMinNum','GeneralMaxNum','MaxOwnWeeks']
  },
  strongpointFormations: {
    name: 'strongpointgeneralinfo',
    fields: ['PointID','GeneralName','LeadSoldierID','LeadSoldierNum']
  },
  advancedFields: {
    name: 'advfieldinfo',
    fields: ['AdvFieldID','PosX','PosY','AdvFieldName','AdvFieldIcon','AdvFieldDescribe','FallCfgClass','ExpAdd','SignalFireLevel','AttSoldierMinRate']
  },
  advancedFieldBosses: {
    name: 'advfieldgeneralinfo',
    fields: ['ID','AdvFieldID','GeneralName','LeadSoldierID','LeadSoldierNum','LeftSoldierNum',
      ...Array.from({length:5},(_,i)=>`EquipID${i+1}`),
      ...Array.from({length:5},(_,i)=>`ForgeLevel${i+1}`),
      ...Array.from({length:4},(_,i)=>`Magic${i+1}`)]
  }
};
const EXCLUDED_DYNAMIC_FIELDS = {
  strongpointinfo: ['OwnerGuildID','TakeTime','LastFightTime','RewardGetTime','OwnerChangeTime'],
  advfieldinfo: ['LastRefreshTime']
};

async function loadTable({name,fields}) {
  const table=JSON.parse(await readFile(path.join(inputDir,`${name}.json`),'utf8'));
  if(table.status!=='PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'||!Array.isArray(table.records)||!Array.isArray(table.schema)||table.sourceTable!==name||table.sourceCommit!==SNAPSHOT)
    throw new Error(`Legacy table ${name} is not a pinned normalized research table.`);
  const columns=Object.fromEntries(table.schema.map(column=>[column.name,column.provenance]));
  for(const field of fields){
    const source=columns[field];
    if(!source||source.sourceTable!==name||source.sourceCommit!==table.sourceCommit
      ||!HASH.test(source.dataBlobSha1||'')||!HASH.test(source.schemaBlobSha1||'')||!HASH.test(source.indexBlobSha1||''))
      throw new Error(`Legacy table ${name} lacks pinned provenance for ${field}.`);
  }
  return {...table,columns};
}

function tableMetadata(table,fields){
  return {sourceTable:table.sourceTable,sourceVersion:`Dacky legacy MySQL snapshot ${table.sourceCommit.slice(0,10)}`,
    sourceCommit:table.sourceCommit,recordCount:table.records.length,importedFields:fields,
    fieldSources:Object.fromEntries(fields.map(field=>{
      const source=table.columns[field];
      return [field,{evidence:'VERIFIED_LEGACY',sourceVersion:`Dacky legacy MySQL snapshot ${table.sourceCommit.slice(0,10)}`,
        sourceCommit:table.sourceCommit,sourceTable:table.sourceTable,sourceField:field,
        dataHash:source.dataBlobSha1,schemaHash:source.schemaBlobSha1,indexHash:source.indexBlobSha1}];
    }))};
}

function decorateRows(table,fields){
  return table.records.map((row, index) => {
    const values = Object.fromEntries(fields.map(field => {
      if (!Object.hasOwn(row, field)) throw new Error(`Missing ${table.sourceTable}.${field} in row ${index + 1}`);
      return [field, row[field]];
    }));
    return {...values, sourceTable: table.sourceTable, sourceRowIndex: index + 1, evidence: 'VERIFIED_LEGACY'};
  });
}

export async function importLegacyEndgame(){
  if(SOURCE_REUSE_DECISION.status!=='AUTHORIZED_FOR_RUNTIME')throw new Error('Legacy runtime import requires the recorded owner authorization.');
  const loaded=Object.fromEntries(await Promise.all(Object.entries(TABLES).map(async([key,definition])=>[key,await loadTable(definition)])));
  const sourceCommit=loaded.strongpoints.sourceCommit;
  if(Object.values(loaded).some(table=>table.sourceCommit!==sourceCommit))throw new Error('Endgame source tables must share one pinned legacy snapshot.');

  const points=decorateRows(loaded.strongpoints,TABLES.strongpoints.fields);
  const pointFormations=decorateRows(loaded.strongpointFormations,TABLES.strongpointFormations.fields);
  const fields=decorateRows(loaded.advancedFields,TABLES.advancedFields.fields);
  const bosses=decorateRows(loaded.advancedFieldBosses,TABLES.advancedFieldBosses.fields);
  const pointIds=new Set(points.map(row=>Number(row.PointID)));
  const fieldIds=new Set(fields.map(row=>Number(row.AdvFieldID)));
  if(points.length!==27||pointIds.size!==27||pointFormations.length!==90||fields.length!==5||fieldIds.size!==5||bosses.length!==25)
    throw new Error(`Unexpected endgame source counts: points=${points.length}, point NPCs=${pointFormations.length}, boss sites=${fields.length}, boss NPCs=${bosses.length}.`);
  const bossIds = new Set(bosses.map(row => Number(row.ID)));
  const allIds = [...pointIds, ...fieldIds, ...bossIds];
  if (bossIds.size !== bosses.length || allIds.some(id => !Number.isSafeInteger(id) || id <= 0))
    throw new Error('Invalid site or boss primary key.');
  for (const row of [...pointFormations, ...bosses]) {
    if (![row.LeadSoldierID, row.LeadSoldierNum].every(value => Number.isSafeInteger(Number(value)) && Number(value) > 0))
      throw new Error(`Invalid troop reference in ${row.sourceTable} row ${row.sourceRowIndex}`);
  }
  const formationsByPoint=new Map();
  for(const row of pointFormations){
    const id=Number(row.PointID);
    if(!pointIds.has(id))throw new Error(`Strongpoint NPC row ${row.sourceRowIndex} references missing PointID ${id}.`);
    const indexes=formationsByPoint.get(id)||[];indexes.push(row.sourceRowIndex);formationsByPoint.set(id,indexes);
  }
  const bossesByField=new Map();
  for(const row of bosses){
    const id=Number(row.AdvFieldID);
    if(!fieldIds.has(id))throw new Error(`Endgame boss row ${row.sourceRowIndex} references missing AdvFieldID ${id}.`);
    const indexes=bossesByField.get(id)||[];indexes.push(row.sourceRowIndex);bossesByField.set(id,indexes);
  }
  if([...bossesByField.values()].some(indexes=>indexes.length!==5))throw new Error('Each advanced endgame site must have five pinned NPC configuration rows.');

  if (formationsByPoint.size !== 18 || [...formationsByPoint.values()].some(rows => rows.length !== 5))
    throw new Error('Expected 18 strongpoints with five NPC rows each.');

  const sourceTables=Object.fromEntries(Object.entries(TABLES).map(([key,definition])=>[key,tableMetadata(loaded[key],definition.fields)]));
  const pointRows=points.map(row=>({...row,formationRowIndexes:formationsByPoint.get(Number(row.PointID))||[]}));
  const fieldRows=fields.map(row=>({...row,bossRowIndexes:bossesByField.get(Number(row.AdvFieldID))||[]}));
  const metadata={
    sourceVersion:`Dacky legacy MySQL snapshot ${sourceCommit.slice(0,10)}`,sourceCommit,evidence:'VERIFIED_LEGACY_REFERENCE',
    strongpointCount:points.length,strongpointFormationCount:pointFormations.length,
    advancedFieldCount:fields.length,advancedBossConfigCount:bosses.length,
    importedRecordCount:points.length+pointFormations.length+fields.length+bosses.length,
    importedFieldValueCount:Object.entries(TABLES).reduce((sum,[key,definition])=>sum+loaded[key].records.length*definition.fields.length,0),
    sourceTables,excludedDynamicFields:EXCLUDED_DYNAMIC_FIELDS,
    pointRosterStatus:'REFERENCE_ONLY_SOURCE_NPC_INPUT_READY',
    advancedBossStatus:'REFERENCE_ONLY_SOURCE_NPC_INPUT_READY',
    combatStatus:'REFERENCE_ONLY_CURRENT_FALLBACK_UNCHANGED',activeSourceDamageOrRewards:false,
    pointRewardStatus:'UNKNOWN_POINTITEMID_REFERENCE_ONLY',
    advancedRewardStatus:'UNKNOWN_FALLCFGCLASS_REFERENCE_ONLY',
    bossEquipmentAndMagicStatus:'UNKNOWN_RAW_REFERENCE_ONLY_NO_EFFECT_APPLIED',
    permission:SOURCE_REUSE_DECISION
  };
  const output=[
    '// Generated by scripts/import_legacy_endgame.mjs from pinned, hash-verified static legacy NPC configuration.',
    `export const LEGACY_ENDGAME_SOURCE = Object.freeze(${JSON.stringify(metadata)});`,
    `export const LEGACY_STRONGPOINTS = Object.freeze(${JSON.stringify(pointRows)});`,
    `export const LEGACY_STRONGPOINT_FORMATIONS = Object.freeze(${JSON.stringify(pointFormations)});`,
    `export const LEGACY_ADVANCED_FIELDS = Object.freeze(${JSON.stringify(fieldRows)});`,
    `export const LEGACY_ADVANCED_FIELD_BOSSES = Object.freeze(${JSON.stringify(bosses)});`,''
  ].join('\n');
  const tempPath = `${outputPath}.${process.pid}.tmp`;
  await writeFile(tempPath, output, { flag: 'wx' });
  await rename(tempPath, outputPath);
  console.log(JSON.stringify({sourceCommit:sourceCommit.slice(0,10),strongpointCount:points.length,strongpointFormationCount:pointFormations.length,
    advancedFieldCount:fields.length,advancedBossConfigCount:bosses.length,importedRecordCount:metadata.importedRecordCount,
    importedFieldValueCount:metadata.importedFieldValueCount,combatStatus:metadata.combatStatus,
    excludedDynamicFields:metadata.excludedDynamicFields}));
  return {metadata,points:pointRows,pointFormations,fields:fieldRows,bosses};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await importLegacyEndgame();
