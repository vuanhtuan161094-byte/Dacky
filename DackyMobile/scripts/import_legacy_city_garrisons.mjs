#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MOBILE_SOURCE_DATABASE } from '../src/mobile-source-catalog.js';
import { SOURCE_REUSE_DECISION } from '../src/approved-source-data.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputDir=path.join(root,'input-private','normalized_legacy');
const outputPath=path.join(root,'src','legacy-city-garrison-catalog.js');
const HASH=/^[a-f0-9]{40}$/i;
const TABLES={
  cities:{name:'famouscitygeneralinfo',fields:['PosX','PosY','GeneralName','LeadSoldierID','LeadSoldierNum']},
  soldiers:{name:'147-soldierinfo',fields:['SoldierID','Name']}
};

async function loadTable({name,fields}){
  const table=JSON.parse(await readFile(path.join(inputDir,`${name}.json`),'utf8'));
  if(table.status!=='PRIVATE_LEGACY_RESEARCH_NOT_RUNTIME_APPROVED'||!Array.isArray(table.records)||!Array.isArray(table.schema)){
    throw new Error(`Legacy table ${name} is not a normalized research table.`);
  }
  const columns=Object.fromEntries(table.schema.map(column=>[column.name,column.provenance]));
  for(const field of fields){
    const p=columns[field];
    if(!p||!HASH.test(p.dataBlobSha1||'')||!HASH.test(p.schemaBlobSha1||'')||!HASH.test(p.indexBlobSha1||'')){
      throw new Error(`Legacy table ${name} has no pinned provenance for ${field}.`);
    }
  }
  return {...table,columns};
}

function fieldSource(table,sourceField,sourceRowIndex){
  const p=table.columns[sourceField];
  return {
    evidence:'VERIFIED_LEGACY',
    sourceVersion:`Dacky legacy MySQL snapshot ${table.sourceCommit.slice(0,10)}`,
    sourceCommit:table.sourceCommit,
    sourceTable:table.sourceTable,
    sourceRowIndex,
    sourceField,
    dataHash:p.dataBlobSha1,
    schemaHash:p.schemaBlobSha1,
    indexHash:p.indexBlobSha1
  };
}

function mobileCities(){
  const rows=MOBILE_SOURCE_DATABASE.categories['danh-thanh'];
  if(!Array.isArray(rows)||rows.length!==73)throw new Error('Mobile city catalog count changed; review the coordinate join.');
  return rows.map((city,index)=>{
    const info=city.details.find(block=>block.k==='cs'&&block.t==='Thông tin')?.ds||[];
    const raw=info.find(([label])=>label==='Toạ độ'||label==='Tọa độ')?.[1];
    const match=String(raw||'').match(/(\d+)\s*,\s*(\d+)/);
    if(!match)throw new Error(`Mobile city ${city.id} has no parseable source coordinate.`);
    const guards=city.details.find(block=>block.k==='icon'&&block.t==='Quân trấn thủ')?.ds||[];
    if(guards.length!==5)throw new Error(`Mobile city ${city.id} no longer has five source guard profiles.`);
    return {
      city,
      guards,
      coordinate:[Number(match[1]),Number(match[2])],
      coordinateKey:`${Number(match[1])},${Number(match[2])}`,
      sourceField:`muc[${index}].d[k=cs,t=Thông tin].ds[label=Toạ độ]`
    };
  });
}

function normalized(value){return String(value||'').normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();}
function multisetIntersectionCount(left,right){
  const counts=new Map();for(const value of right){const key=normalized(value);counts.set(key,(counts.get(key)||0)+1);}
  let overlap=0;for(const value of left){const key=normalized(value),available=counts.get(key)||0;if(available){overlap++;counts.set(key,available-1);}}
  return overlap;
}
function sameMultiset(left,right){return left.length===right.length&&multisetIntersectionCount(left,right)===left.length;}

export async function importLegacyCityGarrisons(){
  if(SOURCE_REUSE_DECISION.status!=='AUTHORIZED_FOR_RUNTIME')throw new Error('Legacy runtime import requires the recorded owner authorization.');
  const loaded=Object.fromEntries(await Promise.all(Object.entries(TABLES).map(async([key,definition])=>[key,await loadTable(definition)])));
  const sourceCommit=loaded.cities.sourceCommit;
  if(!HASH.test(sourceCommit||'')||Object.values(loaded).some(table=>table.sourceCommit!==sourceCommit))throw new Error('City and troop lookup tables must share one pinned legacy commit.');

  const soldiers=new Map(loaded.soldiers.records.map((row,index)=>[String(row.SoldierID),{row,sourceRowIndex:index+1}]));
  const groups=new Map();
  loaded.cities.records.forEach((row,index)=>{
    const coordinate=[Number(row.PosX),Number(row.PosY)];
    if(coordinate.some(value=>!Number.isFinite(value)))throw new Error(`Legacy city roster row ${index+1} has an invalid coordinate.`);
    const coordinateKey=coordinate.join(',');
    if(!groups.has(coordinateKey))groups.set(coordinateKey,[]);
    const soldier=soldiers.get(String(row.LeadSoldierID));
    if(!soldier)throw new Error(`Legacy city row ${index+1} references unknown 147 troop ${row.LeadSoldierID}.`);
    groups.get(coordinateKey).push({row,sourceRowIndex:index+1,soldier});
  });
  if(loaded.cities.records.length!==375||groups.size!==75||[...groups.values()].some(rows=>rows.length!==5)){
    throw new Error(`Unexpected legacy city rosters: rows=${loaded.cities.records.length}, cities=${groups.size}, counts=${JSON.stringify([...groups.values()].reduce((acc,rows)=>(acc[rows.length]=(acc[rows.length]||0)+1,acc),{}))}.`);
  }
  const mobile=mobileCities();
  const mobileByCoordinate=new Map(mobile.map(city=>[city.coordinateKey,city]));
  if(mobileByCoordinate.size!==mobile.length)throw new Error('Mobile city coordinates are not unique.');
  const records=[...groups.entries()].map(([coordinateKey,rows])=>{
    const mobileCity=mobileByCoordinate.get(coordinateKey)||null;
    const coordinate=coordinateKey.split(',').map(Number);
    const guards=rows.map(({row,sourceRowIndex,soldier},slot)=>({
      id:`legacy-city-${coordinate[0]}-${coordinate[1]}-${slot+1}`,
      slot:slot+1,
      generalName:String(row.GeneralName||''),
      leadSoldierId:Number(row.LeadSoldierID),
      leadSoldierName:String(soldier.row.Name||''),
      leadSoldierCount:Number(row.LeadSoldierNum),
      sourceRowIndex,
      fieldProvenance:{
        PosX:fieldSource(loaded.cities,'PosX',sourceRowIndex),
        PosY:fieldSource(loaded.cities,'PosY',sourceRowIndex),
        generalName:fieldSource(loaded.cities,'GeneralName',sourceRowIndex),
        leadSoldierId:fieldSource(loaded.cities,'LeadSoldierID',sourceRowIndex),
        leadSoldierCount:fieldSource(loaded.cities,'LeadSoldierNum',sourceRowIndex),
        leadSoldierName:fieldSource(loaded.soldiers,'Name',soldier.sourceRowIndex)
      },
      evidence:'VERIFIED_LEGACY'
    }));
    return {
      id:`legacy-city-${coordinate[0]}-${coordinate[1]}`,
      coordinate,
      coordinateKey,
      mobileCityId:mobileCity?.city.id||null,
      mobileCityName:mobileCity?.city.name||null,
      mobileCoordinateSourceField:mobileCity?.sourceField||null,
      joinEvidence:mobileCity?'EXACT_COORDINATE_MATCH_REFERENCE_ONLY':'LEGACY_ONLY_COORDINATE',
      guards,
      evidence:'VERIFIED_LEGACY'
    };
  }).sort((a,b)=>a.coordinate[0]-b.coordinate[0]||a.coordinate[1]-b.coordinate[1]);
  const matched=records.filter(row=>row.mobileCityId);
  const comparison=matched.reduce((result,legacyCity)=>{
    const mobileCity=mobileByCoordinate.get(legacyCity.coordinateKey);
    const legacyNames=legacyCity.guards.map(row=>row.generalName);
    const mobileNames=mobileCity.guards.map(row=>row.t);
    const legacyTroops=legacyCity.guards.map(row=>row.leadSoldierName);
    const mobileTroops=mobileCity.guards.map(row=>row.p);
    result.generalNameOverlapRecords+=multisetIntersectionCount(legacyNames,mobileNames);
    result.troopNameOverlapRecords+=multisetIntersectionCount(legacyTroops,mobileTroops);
    if(sameMultiset(legacyNames,mobileNames))result.exactGeneralNameRosterMatches++;
    if(sameMultiset(legacyTroops,mobileTroops))result.exactTroopNameRosterMatches++;
    return result;
  },{generalNameOverlapRecords:0,troopNameOverlapRecords:0,exactGeneralNameRosterMatches:0,exactTroopNameRosterMatches:0});
  const metadata={
    status:'VERIFIED_LEGACY_REFERENCE_ONLY',
    sourceVersion:`Dacky legacy MySQL snapshot ${sourceCommit.slice(0,10)}`,
    sourceCommit,
    sourceTables:Object.fromEntries(Object.entries(loaded).map(([key,table])=>[key,{
      sourceTable:table.sourceTable,
      recordCount:table.records.length,
      importedFields:TABLES[key].fields,
      fieldSources:Object.fromEntries(TABLES[key].fields.map(field=>[field,{
        evidence:'VERIFIED_LEGACY',sourceVersion:`Dacky legacy MySQL snapshot ${sourceCommit.slice(0,10)}`,
        sourceCommit,sourceTable:table.sourceTable,sourceField:field,
        dataHash:table.columns[field].dataBlobSha1,
        schemaHash:table.columns[field].schemaBlobSha1,
        indexHash:table.columns[field].indexBlobSha1
      }]))
    }])),
    legacyCityCount:records.length,
    legacyGuardRecordCount:records.reduce((sum,city)=>sum+city.guards.length,0),
    mobileCityCount:mobile.length,
    coordinateMatchedMobileCities:matched.length,
    legacyOnlyCityCount:records.length-matched.length,
    matchedLegacyGuardRecordCount:matched.reduce((sum,city)=>sum+city.guards.length,0),
    versionComparison:{...comparison,method:'PER_CITY_MULTISETS; NO SLOT OR COUNT MATCH ASSUMED',parityClaim:false},
    mobileGarrisonCountSemantics:'SERVER_DEPENDENT_UNKNOWN',
    rosterParity:'NOT_ASSERTED',
    combatEffectActive:false,
    rewardEffectActive:false
  };
  if(metadata.coordinateMatchedMobileCities!==73||metadata.legacyOnlyCityCount!==2||metadata.matchedLegacyGuardRecordCount!==365){
    throw new Error(`City coordinate comparison changed: ${JSON.stringify(metadata)}.`);
  }

  const content=`// Generated from pinned legacy city-NPC tables; coordinate matches are reference-only.\nexport const LEGACY_CITY_GARRISON_SOURCE = Object.freeze(${JSON.stringify(metadata)});\nexport const LEGACY_CITY_GARRISONS = Object.freeze(${JSON.stringify(records)});\n`;
  await writeFile(outputPath,content);
  console.log(`Imported ${metadata.legacyGuardRecordCount} legacy city NPC rows: ${matched.length} exact Mobile coordinate matches and ${metadata.legacyOnlyCityCount} legacy-only cities.`);
  return {metadata,records};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await importLegacyCityGarrisons();
