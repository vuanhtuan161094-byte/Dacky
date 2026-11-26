import { LEGACY_ENDGAME_SOURCE, LEGACY_STRONGPOINTS, LEGACY_STRONGPOINT_FORMATIONS, LEGACY_ADVANCED_FIELDS, LEGACY_ADVANCED_FIELD_BOSSES } from '../src/legacy-endgame-catalog.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BUZHOU_FLOORS, BUILDINGS, CONTENT_EVIDENCE, HEROES, HERO_QUALITY_MULTIPLIERS, HERO_SKILLS, IMMORTAL_MOUNTAINS, ITEMS,
  LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS,
  LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_REWARD_RULES, LEGACY_ELFLAND_SOURCE,
  LEGACY_BUZHOU_EQUIPMENT_RULES, LEGACY_BUZHOU_FLOOR_CONFIG, LEGACY_BUZHOU_FORMATIONS, LEGACY_BUZHOU_MOUNTAIN_CONFIG, LEGACY_BUZHOU_REWARDS, LEGACY_BUZHOU_SOURCE,
  LEGACY_QUESTS, LEGACY_REFERENCE_COUNTS,
  QUESTS, TECHNOLOGIES, TROOPS, TOWER_FLOORS, WORLD_NODES
} from '../src/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyBuzhouRows = [
  ...LEGACY_BUZHOU_MOUNTAIN_CONFIG.map(row => ({ ...row, id: `buzhou-mountain-config-${row.sourceRowIndex}`, recordType: 'mountain-config' })),
  ...LEGACY_BUZHOU_FLOOR_CONFIG.map(row => ({ ...row, id: `buzhou-floor-config-${row.sourceRowIndex}`, recordType: 'floor-config' })),
  ...LEGACY_BUZHOU_FORMATIONS.map(row => ({ ...row, id: `buzhou-formation-${row.sourceRowIndex}`, recordType: 'fixed-npc-formation' })),
  ...LEGACY_BUZHOU_REWARDS.map(row => ({ ...row, id: `buzhou-reward-${row.sourceRowIndex}`, recordType: 'reward-reference' })),
  ...LEGACY_BUZHOU_EQUIPMENT_RULES.map(row => ({ ...row, id: `buzhou-equipment-rule-${row.sourceRowIndex}`, recordType: 'equipment-rule-reference' }))
];
const legacyCityGarrisonRows=LEGACY_CITY_GARRISONS.flatMap(city=>city.guards.map(guard=>({
  ...guard,coordinate:city.coordinate,coordinateKey:city.coordinateKey,mobileCityId:city.mobileCityId,
  mobileCityName:city.mobileCityName,joinEvidence:city.joinEvidence,recordType:'legacy-city-npc-stack-reference'
})));
const legacyElflandRows = [
  ...LEGACY_ELFLAND_LOCATIONS.map(row => ({ ...row, id: `elfland-location-${row.sourceRowIndex}`, recordType: 'location' })),
  ...LEGACY_ELFLAND_FLOORS.map(row => ({ ...row, id: `elfland-floor-${row.sourceRowIndex}`, recordType: 'floor-config' })),
  ...LEGACY_ELFLAND_FORMATIONS.map(row => ({ ...row, id: `elfland-formation-${row.sourceRowIndex}`, recordType: 'fixed-npc-formation' })),
  ...LEGACY_ELFLAND_REWARD_RULES.map(row => ({ ...row, id: `elfland-reward-rule-${row.sourceRowIndex}`, recordType: 'reward-rule-reference' }))
];
const legacyEndgameRows = [
  ...LEGACY_STRONGPOINTS, ...LEGACY_STRONGPOINT_FORMATIONS, ...LEGACY_ADVANCED_FIELDS, ...LEGACY_ADVANCED_FIELD_BOSSES
].map(row => ({...row, id: `${row.sourceTable}-${row.sourceRowIndex}`}));
const tables = { buildings: BUILDINGS, technologies: TECHNOLOGIES, troops: TROOPS, heroes: HEROES, heroSkills: HERO_SKILLS, items: ITEMS, quests: QUESTS, legacyQuestReference: LEGACY_QUESTS, legacyBuzhouReference: legacyBuzhouRows, legacyCityGarrisonReference: legacyCityGarrisonRows, legacyElflandReference: legacyElflandRows, legacyEndgameReference: legacyEndgameRows, worldNodes: WORLD_NODES, immortalMountains: IMMORTAL_MOUNTAINS };

export async function exportDatabase(outputPath = path.join(root, 'data', 'dacky-game-data.runtime.compact.v2.json')) {
  const tableStats = {};
  let totalRecords = 0;
  for (const [name, rows] of Object.entries(tables)) {
    const ids = new Set(rows.map(row => row.id));
    if (ids.size !== rows.length || rows.some(row => !row.id || !['SIMULATED','MIXED','VERIFIED_MOBILE','VERIFIED_LEGACY'].includes(row.evidence))) {
      throw new Error(`Catalog ${name} has duplicate/missing IDs or unsupported evidence.`);
    }
    const evidenceCounts = Object.fromEntries(['VERIFIED_LEGACY','VERIFIED_MOBILE','MIXED','SIMULATED'].map(status => [status, rows.filter(row => row.evidence === status).length]).filter(([, count]) => count));
    tableStats[name] = { recordCount: rows.length, evidence: Object.keys(evidenceCounts).length === 1 ? Object.keys(evidenceCounts)[0] : 'MIXED', evidenceCounts };
    totalRecords += rows.length;
  }

  const database = {
    schemaVersion: 2,
    provenanceEncoding: 'dictionary-v1',
    dataVersion: CONTENT_EVIDENCE.version,
    updated: CONTENT_EVIDENCE.updated,
    evidenceStatus: Object.values(tableStats).every(table => table.evidence === 'SIMULATED') ? 'SIMULATED' : 'MIXED',
    evidenceNote: 'Trường sourced giữ provenance riêng theo field; trường SIMULATED/UNKNOWN là cơ chế hoặc giá trị chưa có ánh xạ nguồn được xác minh.',
    sourceAccess: 'PUBLIC_GET_SUCCEEDED_2026-11-25',
    sourceMetadata: { legacyBuzhou: LEGACY_BUZHOU_SOURCE, legacyCityGarrisons: LEGACY_CITY_GARRISON_SOURCE, legacyElfland: LEGACY_ELFLAND_SOURCE, legacyEndgame: LEGACY_ENDGAME_SOURCE },
    referenceCounts: LEGACY_REFERENCE_COUNTS,
    tableStats: { totalRecords, tables: tableStats },
    tables,
    proceduralSystems: {
      fengshenTower: { evidence: 'SIMULATED', floorCount: TOWER_FLOORS, floorCountBasis: 'Local design cap; legacy elfland floor counts are unrelated and Fengshen Tower source count is unknown', generatedAtRuntime: true, runtime: 'src/engine.js' },
      buzhouMountain: { evidence: 'MIXED', challengeCount: BUZHOU_FLOORS, sourceFloorCount: LEGACY_BUZHOU_SOURCE.floorCount, sourceFormationCount: LEGACY_BUZHOU_SOURCE.formationCount, generatedAtRuntime: true, runtime: 'src/engine.js', legacyReferenceNpcCount: LEGACY_REFERENCE_COUNTS.buzhouFixedNpcs, combatStatus: 'SOURCE_BANDS_AND_ROSTER_INFORM_DUEL_DIFFICULTY', rewardStatus: 'SIMULATED' },
      cityNpcGarrisons: { evidence: 'MIXED', mobileCityCount: LEGACY_CITY_GARRISON_SOURCE.mobileCityCount, legacyCityCount: LEGACY_CITY_GARRISON_SOURCE.legacyCityCount, legacyGuardRecords: LEGACY_CITY_GARRISON_SOURCE.legacyGuardRecordCount, coordinateMatchedMobileCities: LEGACY_CITY_GARRISON_SOURCE.coordinateMatchedMobileCities, legacyOnlyCityCount: LEGACY_CITY_GARRISON_SOURCE.legacyOnlyCityCount, mobileCountSemantics: LEGACY_CITY_GARRISON_SOURCE.mobileGarrisonCountSemantics, rosterParity: LEGACY_CITY_GARRISON_SOURCE.rosterParity, combatEffectActive: false, rewardEffectActive: false },
      immortalMountainChallenges: { evidence: 'MIXED', challengeCount: IMMORTAL_MOUNTAINS.length, sourceLocations: LEGACY_ELFLAND_SOURCE.locationCount, sourceFloors: LEGACY_ELFLAND_SOURCE.floorCount, sourceFormations: LEGACY_ELFLAND_SOURCE.formationCount, sourceNamesAndDescriptions: 'VERIFIED_LEGACY', challengePowerAndLoot: 'SIMULATED', combatStatus: 'ARMY_ENGINE_SOURCE_FIXED_OR_SIMULATED_BANDS', rewardStatus: 'SIMULATED_FIRST_WIN', repeatable: false, runtime: 'src/engine.js + src/ui.js' },
      economy: { evidence: 'SIMULATED', runtime: 'src/engine.js', note: 'Sản xuất theo giờ, thuế/dân cư, kho, hàng đợi và giới hạn tiến trình offline.' },
      combat: { evidence: 'SIMULATED', runtime: 'src/engine.js', note: 'Tuyến trước/sau/công thành, tầm và chủ động khai chiến, tương khắc theo đội địch, đội hình hỗ trợ, linh căn thần tiên, lực chiến, thương vong, hồi phục và chiến lợi phẩm.' },
      heroAffinity: { evidence: 'SIMULATED', runtime: 'src/engine.js + src/ui.js', range: [0,100], gainSources: ['training','campaign-combat','immortal-duel'], effects: ['hero-power','skill-mastery','same-element-resonance'] },
      heroQuality: { evidence: 'SIMULATED', runtime: 'src/catalog.js + src/engine.js + src/ui.js', powerMultipliers: HERO_QUALITY_MULTIPLIERS },
      equipmentCombat: { evidence: 'SIMULATED', runtime: 'src/engine.js + src/ui.js', slots: { weapon:'Outgoing damage', armor:'Incoming damage reduction', artifact:'Active skill coefficient' } },
      fiveElementCounters: { evidence: 'SIMULATED', runtime: 'src/catalog.js + src/engine.js + src/ui.js', enemyProfiles: WORLD_NODES.length, counters: { fire:'metal', metal:'wood', wood:'earth', earth:'water', water:'fire' }, neutral: ['wind'], report: 'Element matchup changes outgoing and incoming campaign damage' },
      heroSkills: { evidence: 'SIMULATED', runtime: 'src/engine.js + src/ui.js', count: HERO_SKILLS.length, activeCast: 'Automatic trigger by battle round', unlock: 'Skill mastery scales with hero level and affinity' }
    },
    unavailableSourceTables: [
      { name: 'mobileVersionDelta', reason: 'Public static catalog was captured, but it does not establish the original client version or a complete gameplay-version delta.' },
      { name: 'legacyHeroes', targetRecords: LEGACY_REFERENCE_COUNTS.famousGenerals, reason: 'Only normalized display-name overlap counts are published; source stat fields, identity IDs and mechanic mapping remain unverified.' },
      { name: 'legacyItems', targetRecords: LEGACY_REFERENCE_COUNTS.legacy147Items, reason: 'Legacy source rows are retained privately; gameplay field and mechanic mapping remains unverified.' },
      { name: 'legacyQuestMechanics', targetRecords: LEGACY_REFERENCE_COUNTS.quests, importedReferenceRecords: LEGACY_QUESTS.length, reason: 'Quest text and type codes are imported with field provenance; requirements and rewards remain UNKNOWN.' },
      { name: 'legacyBuzhouCombatAndRewards', importedReferenceRecords: legacyBuzhouRows.length, reason: 'Five floor configs, fixed NPC formations, goods IDs and raw equipment rules are included with field provenance. Roster counts and bands inform duel difficulty. Raw source reward rules remain inactive.' },
      { name: 'legacyCityGarrisonCombat', importedReferenceRecords: legacyCityGarrisonRows.length, reason: '375 legacy NPC stacks are coordinate-linked to 73 Mobile city profiles for comparison only. Legacy counts remain separate from server-dependent Mobile rosters and do not change combat settlement.' },
      { name: 'legacyElflandCombatAndLoot', importedReferenceRecords: legacyElflandRows.length, reason: 'Names, descriptions, floor configurations, NPC stacks and raw random-reward rows are source-backed references. Fixed rosters and source bands feed army combat; RdmInfo rewards remain UNKNOWN.' }
    ]
  };
  const provenanceDictionary={};
  const provenanceIds=new Map();
  const compactProvenance=value=>{
    if(Array.isArray(value))return value.map(compactProvenance);
    if(!value||typeof value!=='object')return value;
    const output={};
    for(const [key,item] of Object.entries(value)){
      if(key==='fieldProvenance'&&item&&typeof item==='object'&&!Array.isArray(item)){
        const refs={};
        for(const [field,source] of Object.entries(item)){
          const serialized=JSON.stringify(source);let ref=provenanceIds.get(serialized);
          if(!ref){ref=`p${String(provenanceIds.size+1).padStart(5,'0')}`;provenanceIds.set(serialized,ref);provenanceDictionary[ref]=source;}
          refs[field]=ref;
        }
        output.provenanceRefs=refs;
      }else output[key]=compactProvenance(item);
    }
    return output;
  };
  const compactDatabase={...database,tables:compactProvenance(database.tables),provenanceDictionary};
  await mkdir(path.dirname(outputPath), { recursive: true });
  const output=JSON.stringify(compactDatabase)+'\n';
  await writeFile(outputPath,output);
  await writeFile(outputPath+'.gz',gzipSync(output,{level:9}));
  console.log('Compact JSON database exported: '+outputPath+' ('+totalRecords+' records; '+provenanceIds.size+' unique field-evidence records retained).');
  return database;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await exportDatabase();
