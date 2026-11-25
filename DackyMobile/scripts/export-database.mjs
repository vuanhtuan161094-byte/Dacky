import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BUZHOU_FLOORS, BUILDINGS, CONTENT_EVIDENCE, HEROES, HERO_QUALITY_MULTIPLIERS, HERO_SKILLS, IMMORTAL_MOUNTAINS, ITEMS,
  LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS,
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
const tables = { buildings: BUILDINGS, technologies: TECHNOLOGIES, troops: TROOPS, heroes: HEROES, heroSkills: HERO_SKILLS, items: ITEMS, quests: QUESTS, legacyQuestReference: LEGACY_QUESTS, legacyBuzhouReference: legacyBuzhouRows, legacyCityGarrisonReference: legacyCityGarrisonRows, worldNodes: WORLD_NODES, immortalMountains: IMMORTAL_MOUNTAINS };

export async function exportDatabase(outputPath = path.join(root, 'data', 'dacky-game-data.runtime.v1.json')) {
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
    schemaVersion: 1,
    dataVersion: CONTENT_EVIDENCE.version,
    updated: CONTENT_EVIDENCE.updated,
    evidenceStatus: Object.values(tableStats).every(table => table.evidence === 'SIMULATED') ? 'SIMULATED' : 'MIXED',
    evidenceNote: 'Trường sourced giữ provenance riêng theo field; trường SIMULATED/UNKNOWN là cơ chế hoặc giá trị chưa có ánh xạ nguồn được xác minh.',
    sourceAccess: 'PUBLIC_GET_SUCCEEDED_2026-11-25',
    sourceMetadata: { legacyBuzhou: LEGACY_BUZHOU_SOURCE, legacyCityGarrisons: LEGACY_CITY_GARRISON_SOURCE },
    referenceCounts: LEGACY_REFERENCE_COUNTS,
    tableStats: { totalRecords, tables: tableStats },
    tables,
    proceduralSystems: {
      fengshenTower: { evidence: 'SIMULATED', floorCount: TOWER_FLOORS, floorCountBasis: 'Local design cap; legacy elfland floor counts are unrelated and Fengshen Tower source count is unknown', generatedAtRuntime: true, runtime: 'src/engine.js' },
      buzhouMountain: { evidence: 'MIXED', challengeCount: BUZHOU_FLOORS, sourceFloorCount: LEGACY_BUZHOU_SOURCE.floorCount, sourceFormationCount: LEGACY_BUZHOU_SOURCE.formationCount, generatedAtRuntime: true, runtime: 'src/engine.js', legacyReferenceNpcCount: LEGACY_REFERENCE_COUNTS.buzhouFixedNpcs, combatStatus: LEGACY_BUZHOU_SOURCE.combatStatus, rewardStatus: LEGACY_BUZHOU_SOURCE.rewardStatus },
      cityNpcGarrisons: { evidence: 'MIXED', mobileCityCount: LEGACY_CITY_GARRISON_SOURCE.mobileCityCount, legacyCityCount: LEGACY_CITY_GARRISON_SOURCE.legacyCityCount, legacyGuardRecords: LEGACY_CITY_GARRISON_SOURCE.legacyGuardRecordCount, coordinateMatchedMobileCities: LEGACY_CITY_GARRISON_SOURCE.coordinateMatchedMobileCities, legacyOnlyCityCount: LEGACY_CITY_GARRISON_SOURCE.legacyOnlyCityCount, mobileCountSemantics: LEGACY_CITY_GARRISON_SOURCE.mobileGarrisonCountSemantics, rosterParity: LEGACY_CITY_GARRISON_SOURCE.rosterParity, combatEffectActive: false, rewardEffectActive: false },
      immortalMountainChallenges: { evidence: 'SIMULATED', challengeCount: IMMORTAL_MOUNTAINS.length, repeatable: true, runtime: 'src/engine.js + src/ui.js' },
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
      { name: 'legacyBuzhouCombatAndRewards', importedReferenceRecords: legacyBuzhouRows.length, reason: 'Five floor configs, fixed NPC formations, goods IDs and raw equipment rules are included with field provenance. Source damage/rewards remain inactive until the combat and reward adapters are integrated.' },
      { name: 'legacyCityGarrisonCombat', importedReferenceRecords: legacyCityGarrisonRows.length, reason: '375 legacy NPC stacks are coordinate-linked to 73 Mobile city profiles for comparison only. Legacy counts remain separate from server-dependent Mobile rosters and do not change combat settlement.' },
      { name: 'immortalMountains', targetRecords: LEGACY_REFERENCE_COUNTS.elflands, reason: 'Source rows remain in private research; runtime challenges are an independent simulation.' }
    ]
  };
  const formatJson=(value,depth=0)=>{
    const indent='  '.repeat(depth);
    if(Array.isArray(value)){
      if(!value.length)return '[]';
      if(value.length>20&&value.every(row=>row&&typeof row==='object'&&!Array.isArray(row))){
        return '[\n'+value.map(row=>indent+'  '+JSON.stringify(row)).join(',\n')+'\n'+indent+']';
      }
      return '[\n'+value.map(row=>indent+'  '+formatJson(row,depth+1)).join(',\n')+'\n'+indent+']';
    }
    if(value&&typeof value==='object'){
      const entries=Object.entries(value);
      if(!entries.length)return '{}';
      return '{\n'+entries.map(([key,item])=>indent+'  '+JSON.stringify(key)+': '+formatJson(item,depth+1)).join(',\n')+'\n'+indent+'}';
    }
    return JSON.stringify(value);
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, formatJson(database) + '\n');
  console.log('JSON database exported: '+outputPath+' ('+totalRecords+' records; field evidence retained).');
  return database;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await exportDatabase();
