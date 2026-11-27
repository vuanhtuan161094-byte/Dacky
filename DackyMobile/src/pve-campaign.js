import { LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_REWARD_RULES } from './legacy-elfland-catalog.js';
import { LEGACY_ADVANCED_FIELDS, LEGACY_ADVANCED_FIELD_BOSSES, LEGACY_STRONGPOINTS, LEGACY_STRONGPOINT_FORMATIONS } from './legacy-endgame-catalog.js';
import { LEGACY_PVE_TROOPS } from './legacy-pve-troops.js';
import { LEGACY_BUZHOU_FLOORS, LEGACY_BUZHOU_FORMATIONS } from './legacy-buzhou-catalog.js';
import { ITEMS } from './catalog.js';

const legacyId = id => `legacy-npc-${id}`;
export const PVE_TROOPS = [
  ...LEGACY_PVE_TROOPS.filter(row => row.life > 0).map(row => ({...row, id: legacyId(row.id)})),
  {id: legacyId(1051), name:'Quân hộ vệ', life:40, attack:32, defense:22, speed:100, population:2, evidence:'SIMULATED'}
];
const troopById = new Map(PVE_TROOPS.map(row => [row.id, row]));
const encounters = new Map();
const locationFloors = new Map();
const rewardRulesByFloor = new Map();
for (const rule of LEGACY_ELFLAND_REWARD_RULES) {
  const key=`${rule.ElflandLevel}:${rule.ElflandFloor}`;
  const rows=rewardRulesByFloor.get(key)??[];
  const entries=[];
  for(let i=1;i<=10;i++){
    const match=String(rule[`RdmInfo${i}`]??'').match(/^(\d+)=(\d+),(\d+)$/);
    if(!match)continue;
    const [,sourceItemId,from,to]=match.map(Number);
    // The table encodes roll intervals, but six legacy rows overlap or run
    // backward. Keep those raw rows in the source catalog and omit malformed
    // intervals from the runtime interpretation.
    if(from<1||to<from||to>Number(rule.RandBaseNum))continue;
    entries.push({sourceItemId,from,to,sourceField:`RdmInfo${i}`});
  }
  rows.push({sourceTable:rule.sourceTable,sourceRowIndex:rule.sourceRowIndex,cfgClass:rule.CfgClass,
    randBase:Number(rule.RandBaseNum)||1000,openMin:Number(rule.OpenMinNum)||1,openMax:Number(rule.OpenMaxNum)||1,entries});
  rewardRulesByFloor.set(key,rows);
}

export function rollPveLoot(node,seed=1){
  const candidates=node?.lootRuleCandidates??[];
  if(!candidates.length)return null;
  let x=Number(seed)>>>0;
  const random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
  const rule=candidates[Math.floor(random()*candidates.length)];
  const roll=1+Math.floor(random()*Math.max(1,rule.randBase));
  const hit=rule.entries.find(row=>roll>=row.from&&roll<=row.to);
  if(!hit)return {sourceTable:rule.sourceTable,sourceRowIndex:rule.sourceRowIndex,cfgClass:rule.cfgClass,roll,randBase:rule.randBase,itemSourceId:null,count:0,evidence:'SIMULATED_LEGACY_INTERVAL_INTERPRETATION'};
  const count=rule.openMin+Math.floor(random()*(Math.max(rule.openMin,rule.openMax)-rule.openMin+1));
  return {sourceTable:rule.sourceTable,sourceRowIndex:rule.sourceRowIndex,cfgClass:rule.cfgClass,roll,randBase:rule.randBase,itemSourceId:String(hit.sourceItemId),sourceField:hit.sourceField,count,evidence:'SIMULATED_LEGACY_INTERVAL_INTERPRETATION'};
}

export function resolvePveLootItem(sourceItemId){
  if(sourceItemId===null||sourceItemId===undefined)return null;
  const id=String(sourceItemId);
  const mobile=ITEMS.find(item=>String(item.mobileSourceId??'')===id);
  if(mobile)return {item:mobile,itemJoinEvidence:'VERIFIED_MOBILE_ID'};
  const legacy=ITEMS.find(item=>String(item.legacySourceId??'')===id);
  if(legacy)return {item:legacy,itemJoinEvidence:'SIMULATED_LEGACY_GOOD_BRIDGE'};
  return null;
}

// Every successful source-rule roll must resolve to a concrete gameplay award.
// Unknown legacy IDs and a full bag use an explicitly simulated resource bridge;
// source identity and the original count stay in the receipt for provenance.
export function resolvePveLootAward(drop,node,{inventoryCount=0,inventoryCapacity=500}={}){
  if(!drop||!drop.itemSourceId)return null;
  const count=Math.max(0,Math.floor(Number(drop.count)||0));
  if(!count)return {kind:'none',granted:0,reason:'ZERO_SOURCE_COUNT',fallbackResources:null,fallbackEvidence:null};
  const join=resolvePveLootItem(drop.itemSourceId),item=join?.item??null;
  if(item&&Math.max(0,Number(inventoryCount)||0)+count<=Math.max(0,Number(inventoryCapacity)||0)){
    return {kind:'item',item,join,granted:count,reason:null,fallbackResources:null,fallbackEvidence:null};
  }
  const reason=item?'INVENTORY_FULL':'SOURCE_ITEM_NOT_IN_MOBILE_CATALOG';
  const tier=Math.max(1,Math.floor((Number(node?.level)||1)/10)+1);
  return {kind:'resources',item:null,join,granted:0,reason,
    fallbackResources:{food:count*40*tier,gold:count*25*tier},
    fallbackEvidence:'SIMULATED_UNJOINED_SOURCE_ITEM_CONVERSION'};
}

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

function add(id, name, kind, level, formation, row, previousId = null, simulatedFormation = false, lootRuleCandidates = []) {
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
    lootRuleCandidates,
    lootRuleEvidence:lootRuleCandidates.length?'VERIFIED_LEGACY_REFERENCE_SIMULATED_INTERVAL_INTERPRETATION':'SIMULATED_FALLBACK',
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

const formationCounts=formation=>formation.reduce((out,row)=>{out[row.unitId]=(out[row.unitId]||0)+Math.max(0,Number(row.count)||0);return out;},{});
const countArmy=state=>Object.values(state?.army||{}).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);
function proportionalWave(remaining,budget){
  const rows=Object.entries(remaining).filter(([,count])=>count>0),total=rows.reduce((sum,[,count])=>sum+count,0),target=Math.min(total,Math.max(0,Math.floor(budget)));
  if(!target||!total)return [];
  const parts=rows.map(([unitId,count])=>{const exact=count*target/total,base=Math.min(count,Math.floor(exact));return {unitId,count:base,fraction:exact-base,available:count-base};});
  let left=target-parts.reduce((sum,row)=>sum+row.count,0);
  for(const row of [...parts].sort((a,b)=>b.fraction-a.fraction))while(left>0&&row.available>0){row.count++;row.available--;left--;}
  return parts.filter(row=>row.count>0).map(({unitId,count})=>({unitId,count}));
}

// The last two Buzhou rosters exceed the documented 100k-per-commander march
// limit by an order of magnitude. Preserve every source soldier and make these
// two source formations multi-sortie sieges instead of truncating their rosters.
export function pveAssaultProgress(state,node,maxForce=0){
  if(!node?.buzhouFloor||node.buzhouFloor<4)return null;
  const stored=state?.gameplay?.endgameAssaults?.[node.id],source=formationCounts(node.enemy.formation);
  // Save data is user editable. Cap every persisted remainder to its original
  // NPC stack and discard unknown stacks so a save cannot grant progress or
  // reduce the source roster below the published formation.
  const remaining=Object.fromEntries(Object.entries(source).map(([id,original])=>{
    const value=Number(stored?.remaining?.[id]);
    return [id,stored&&Number.isFinite(value)?Math.max(0,Math.min(original,Math.floor(value))):original];
  }));
  const total=Object.values(source).reduce((sum,count)=>sum+count,0),left=Object.values(remaining).reduce((sum,count)=>sum+count,0);
  const budget=Math.min(left,Math.max(1,Math.min(300_000,Math.floor(Number(maxForce)||100_000),countArmy(state))));
  const wave=proportionalWave(remaining,budget);
  return {nodeId:node.id,total,remaining:left,cleared:total-left,sortiesRemaining:budget?Math.ceil(left/budget):0,sortieSize:budget,wave,remainingByTroop:remaining};
}

function buildEncounters() {
  for (const location of LEGACY_ELFLAND_LOCATIONS) {
    const floors = location.floorRowIndexes.map(i => LEGACY_ELFLAND_FLOORS[i - 1]).filter(row => row.IsFight).sort((a,b) => a.FloorID-b.FloorID);
    const levels = [];
    for (const floor of floors) {
      const roster = fixedFormation(floor.formationRowIndexes.map(i => LEGACY_ELFLAND_FORMATIONS[i - 1]));
      // The location level is only an area label. Each playable floor has its
      // own commander level band and must drive the fight's difficulty.
      const level = Math.max(1, Math.round(((floor.GeneralMinLevel || location.ElflandLevel) + (floor.GeneralMaxLevel || location.ElflandLevel)) / 2));
      levels.push(add(`elfland:${location.ElflandID}:${floor.FloorID}`, `${location.ElflandName} · Tầng ${floor.FloorID}`, 'Tiên Sơn',
        level, roster.length ? roster : generatedFormation(floor, level, location.ElflandID + floor.FloorID),
        floor, levels.at(-1)?.id, !roster.length,rewardRulesByFloor.get(`${location.ElflandLevel}:${floor.FloorID}`)??[]));
    }
    locationFloors.set(location.ElflandID, levels);
  }
  for (const point of LEGACY_STRONGPOINTS) {
    const roster = fixedFormation(point.formationRowIndexes.map(i => LEGACY_STRONGPOINT_FORMATIONS[i - 1]));
    const level = Math.max(1, point.GeneralMinLevel || point.RampartLevel || 1);
    add(`strongpoint:${point.PointID}`, point.PointName, 'Thành trì NPC', level,
      roster.length ? roster : generatedFormation(point, level, point.PointID), point, null, !roster.length);
  }
  let previousBuzhou=null;
  for(const source of LEGACY_BUZHOU_FLOORS.filter(row=>row.isFight).sort((a,b)=>a.floorId-b.floorId)){
    const level=source.generalMaxLevel||Math.min(150,80+(source.floorId-3)*35);
    const adapter={...source,GeneralMinLevel:source.generalMinLevel||level,GeneralMaxLevel:source.generalMaxLevel||level,
      GeneralMinNum:source.generalMinNum||source.floorId*10,GeneralMaxNum:source.generalMaxNum||source.floorId*10,
      GeneralLeadPopulation:source.generalLeadPopulation||150000*source.floorId,RampartLevel:0,sourceTable:'buzhoumountainfloorconfig'};
    const rows=LEGACY_BUZHOU_FORMATIONS.filter(row=>Number(row.FloorID)===source.floorId);
    const roster=fixedFormation(rows),formation=roster.length?roster:generatedFormation(adapter,level,500+source.floorId);
    const node=add(`buzhou:${source.floorId}`,`Bất Chu Sơn · Cửa ${source.floorId}`,'Bất Chu',level,formation,adapter,previousBuzhou,!roster.length);
    node.buzhouFloor=source.floorId;node.sourceTable='buzhoumountainfloorconfig';node.sourceRowIndex=source.sourceRowIndex;
    node.formationEvidence=roster.length?'VERIFIED_LEGACY':'SIMULATED_FROM_SOURCE_BANDS';node.rewardEvidence='SIMULATED';
    previousBuzhou=node.id;
  }
  for (const site of LEGACY_ADVANCED_FIELDS) {
    let previousId;
    for (const index of site.bossRowIndexes) {
      const boss = LEGACY_ADVANCED_FIELD_BOSSES[index - 1];
      const level = Math.min(150, 32 + site.AdvFieldID * 8 + Math.max(0,boss.ID-(site.AdvFieldID-1)*5-1)*2);
      const node = add(`advanced:${boss.ID}`, `${site.AdvFieldName} · ${boss.GeneralName}`, 'Boss', level, fixedFormation([boss]), boss, previousId);
      node.bossLoadout={sourceTable:boss.sourceTable,sourceRowIndex:boss.sourceRowIndex,evidence:boss.evidence,equipment:[1,2,3,4,5].map(i=>({id:boss[`EquipID${i}`]||0,forgeLevel:boss[`ForgeLevel${i}`]||0})).filter(x=>x.id>0),spells:[1,2,3,4].map(i=>boss[`Magic${i}`]||0).filter(Boolean),adapterEvidence:'SIMULATED_FROM_VERIFIED_LEGACY_IDS'};
      previousId = node.id;
    }
  }
}

export function pveLock(state, node, chapter) {
  if (state.world.pveWins?.[node.id]) {
    const lastClear=state.world.pveLastClearDay?.[node.id];
    const currentDay=Math.floor((Number(state.lastTickAt)||0)/86400000);
    if(Number.isInteger(lastClear)&&lastClear>=currentDay)return 'Đã nhận thưởng hôm nay';
  }
  if (chapter < node.chapter) return `Cần mở chương ${node.chapter}`;
  if (node.previousId && !state.world.pveWins?.[node.previousId]) return 'Cần thắng trận trước';
  // The roster threshold gates the first sortie. Once a source-sized siege has
  // made real progress, let the player regroup and resume with the recovered
  // force instead of requiring the original entry strength for every sortie.
  const assault=node.buzhouFloor>=4?pveAssaultProgress(state,node):null;
  const resuming=!!assault&&assault.cleared>0&&assault.remaining>0;
  if(node.buzhouFloor===4&&!resuming){const ready=countArmy(state);if(ready<25_000)return `Cần ít nhất 25.000 quân sẵn sàng · hiện có ${ready.toLocaleString('vi-VN')}`;}
  if(node.buzhouFloor===5&&!resuming){const ready=countArmy(state);if(ready<100_000)return `Cần ít nhất 100.000 quân sẵn sàng · hiện có ${ready.toLocaleString('vi-VN')}`;}
  return '';
}
