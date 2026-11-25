import { LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_LOCATIONS } from './legacy-elfland-catalog.js';
import { LEGACY_ADVANCED_FIELDS, LEGACY_ADVANCED_FIELD_BOSSES, LEGACY_STRONGPOINTS, LEGACY_STRONGPOINT_FORMATIONS } from './legacy-endgame-catalog.js';
import { LEGACY_PVE_TROOPS } from './legacy-pve-troops.js';

const legacyId = id => `legacy-npc-${id}`;
export const PVE_TROOPS = [
  ...LEGACY_PVE_TROOPS.filter(row => row.life > 0).map(row => ({...row, id: legacyId(row.id)})),
  {id: legacyId(1051), name:'Quân hộ vệ', life:40, attack:32, defense:22, speed:100, population:2, evidence:'SIMULATED'}
];
const troopById = new Map(PVE_TROOPS.map(row => [row.id, row]));
const encounters = new Map();
const locationFloors = new Map();

function fixedFormation(rows) {
  return rows.filter(row => row.LeadSoldierNum > 0).map(row => {
    const unitId = legacyId(row.LeadSoldierID);
    if (!troopById.has(unitId)) throw new Error(`Unknown NPC troop ${unitId}`);
    return {unitId, count: row.LeadSoldierNum, commander: row.GeneralName, sourceRowIndex: row.sourceRowIndex};
  });
}

function generatedFormation(row, level, salt) {
  const choices = [1000, 1001, 1011, 1033].map(legacyId).filter(id => troopById.has(id));
  const count = Math.min(8, Math.max(1, row.GeneralMinNum || 1));
  const budget = Math.max(1, row.GeneralLeadPopulation || level * 4);
  return Array.from({length: count}, (_, i) => {
    const unitId = choices[(salt + i) % choices.length];
    return {unitId, count: Math.max(1, Math.floor(budget / count / Math.max(1, troopById.get(unitId).population)))};
  });
}

function add(id, name, kind, level, formation, row, previousId = null, simulatedFormation = false) {
  const chapter = Math.min(8, Math.max(1, Math.ceil(level / 10)));
  const power = formation.reduce((sum, stack) => sum + stack.count * troopById.get(stack.unitId).attack, 0);
  const node = {
    id, name, kind, level, chapter, power, previousId,
    enemy: {formation}, pveEncounter: true,
    sourceTable: row.sourceTable, sourceRowIndex: row.sourceRowIndex,
    formationEvidence: simulatedFormation ? 'SIMULATED_FROM_SOURCE_BANDS' : 'VERIFIED_LEGACY',
    commanderLevel: Math.max(1, Math.round(((row.GeneralMinLevel || level) + (row.GeneralMaxLevel || level)) / 2)),
    loot: {food: 80 + level * 9, gold: 45 + level * 8, jade: level >= 40 ? 1 : 0},
    lootEvidence:'SIMULATED',
    wallLevel: kind === 'Thành trì NPC' ? row.RampartLevel : 0
  };
  if (encounters.has(id)) throw new Error(`Duplicate PvE encounter ${id}`);
  encounters.set(id, node);
  return node;
}

export function getPveEncounter(id) {
  if (!encounters.size) buildEncounters();
  return encounters.get(id);
}
export function getMountainBattles(id) {
  if (!encounters.size) buildEncounters();
  return locationFloors.get(Number(id)) || [];
}
export function getEndgameBattles() {
  if (!encounters.size) buildEncounters();
  return [...encounters.values()].filter(row => row.kind !== 'Tiên Sơn');
}

function buildEncounters() {
  for (const location of LEGACY_ELFLAND_LOCATIONS) {
    const floors = location.floorRowIndexes.map(i => LEGACY_ELFLAND_FLOORS[i - 1]).filter(row => row.IsFight).sort((a,b) => a.FloorID-b.FloorID);
    const levels = [];
    for (const floor of floors) {
      const roster = fixedFormation(floor.formationRowIndexes.map(i => LEGACY_ELFLAND_FORMATIONS[i - 1]));
      const level = Math.max(1, location.ElflandLevel);
      levels.push(add(`elfland:${location.ElflandID}:${floor.FloorID}`, `${location.ElflandName} · Tầng ${floor.FloorID}`, 'Tiên Sơn',
        level, roster.length ? roster : generatedFormation(floor, level, location.ElflandID + floor.FloorID),
        floor, levels.at(-1)?.id, !roster.length));
    }
    locationFloors.set(location.ElflandID, levels);
  }
  for (const point of LEGACY_STRONGPOINTS) {
    const roster = fixedFormation(point.formationRowIndexes.map(i => LEGACY_STRONGPOINT_FORMATIONS[i - 1]));
    const level = Math.max(1, point.GeneralMinLevel || point.RampartLevel || 1);
    add(`strongpoint:${point.PointID}`, point.PointName, 'Thành trì NPC', level,
      roster.length ? roster : generatedFormation(point, level, point.PointID), point, null, !roster.length);
  }
  for (const site of LEGACY_ADVANCED_FIELDS) {
    let previousId;
    for (const index of site.bossRowIndexes) {
      const boss = LEGACY_ADVANCED_FIELD_BOSSES[index - 1];
      const level = Math.min(80, 32 + site.AdvFieldID * 8);
      const node = add(`advanced:${boss.ID}`, `${site.AdvFieldName} · ${boss.GeneralName}`, 'Boss', level, fixedFormation([boss]), boss, previousId);
      previousId = node.id;
    }
  }
}

export function pveLock(state, node, chapter) {
  if (state.world.pveWins?.[node.id]) return 'Đã chinh phục';
  if (chapter < node.chapter) return `Cần mở chương ${node.chapter}`;
  if (node.previousId && !state.world.pveWins?.[node.previousId]) return 'Cần thắng trận trước';
  return '';
}
