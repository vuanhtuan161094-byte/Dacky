import { LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_REWARD_RULES } from '../src/legacy-elfland-catalog.js';
import { getEndgameBattles, getMountainBattles, resolvePveLootItem } from '../src/pve-campaign.js';
import { WORLD_RULE_EVIDENCE } from '../src/simulated-world.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {MOBILE_SOURCE_DATABASE,BUILDINGS,TECHNOLOGIES,HEROES,ITEMS,TROOPS,WORLD_NODES} from '../src/catalog.js';
import {gameplayQuestList,sourceQuestObjectives,sourceQuestReward,itemUseRule,sourceGearGemRule,gearProtectionRule,buzhouPlan} from '../src/gameplay-p15.js';
import {createCombatRuntime} from '../src/combat/runtime-v7.js';
import {PRODUCT_POLICY} from '../src/combat/product-v13.js';
const meta=JSON.parse(await readFile('DATA_COVERAGE.json','utf8')),rt=createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:TROOPS,allowSimulatedLife:true});
const maps={'cong-trinh':BUILDINGS,'khoa-ky':TECHNOLOGIES,'than-tien':HEROES,'phap-bao':ITEMS,'vat-pham':ITEMS,'binh-chung':TROOPS,'danh-thanh':WORLD_NODES};
const questItemIds=new Set();for(const q of gameplayQuestList()){for(const objective of sourceQuestObjectives(q))if(objective.kind==='item')questItemIds.add(objective.id);for(const reward of sourceQuestReward(q).items)questItemIds.add(reward.id);}
const mobile=[];for(const [category,rows] of Object.entries(MOBILE_SOURCE_DATABASE.categories)){for(const r of rows){const matches=maps[category]?.filter(x=>String(category==='danh-thanh'?x.mobileCityId:x.mobileSourceId)===String(r.id))??[];const x=matches[0];let status=x?'PARTIAL_RUNTIME':'HOLD_NO_ID_MAPPING',detail='Source identity mapped; gameplay parity not asserted';if(category==='phap-bao'){const a=rt.index.artifacts[r.id],unknownMana=a?.manaCost===null,conversion=a?.ops?.some(o=>o.kind==='convert');status=a?.status==='MAPPED'&&(!unknownMana||PRODUCT_POLICY.unknownManaCost!==null)&&(!conversion||PRODUCT_POLICY.enableSimulatedConversion)?'EXECUTABLE_SIMULATED_FORMULA':'HOLD_POLICY';detail=unknownMana?'SIMULATED_MANA_COST:'+PRODUCT_POLICY.unknownManaCost:conversion?'SIMULATED_CONVERSION':'VERIFIED_MOBILE_MANA';}if(category==='vat-pham'&&x){const useRule=x.useEffect??itemUseRule(x),gemRule=sourceGearGemRule(x),questUse=questItemIds.has(x.id),gearStone=['95601','95602','95603','95604','95605'].includes(String(x.mobileSourceId));status=x.type!=='vật phẩm'?'EQUIP_RUNTIME':useRule?'USE_RUNTIME':gemRule||gearStone?'EQUIP_RUNTIME':questUse?'QUEST_RUNTIME':'REFERENCE_OR_MATERIAL';detail=x.type!=='vật phẩm'?x.mobileEquipmentSlot??'equipment':useRule?.kind??gemRule?.kind??(gearStone?'sourceGearStarStone':questUse?'SIMULATED_LEGACY_QUEST_CONDITION_OR_REWARD':x.mobileGroup??'UNKNOWN');}mobile.push({category,id:r.id,name:r.name,runtimeId:x?.id??null,status,detail});}}
const exchangeIngredientIds=new Set(ITEMS.flatMap(item=>{const rule=itemUseRule(item);return rule?.kind==='eventExchange'?rule.ingredients.map(row=>String(row.sourceId)):[]}));
for(const row of mobile){
  if(row.category!=='vat-pham'||row.status!=='REFERENCE_OR_MATERIAL')continue;
  const item=ITEMS.find(candidate=>String(candidate.mobileSourceId)===String(row.id)),gem=sourceGearGemRule(item),protection=gearProtectionRule(item);
  if(gem){row.status='EQUIP_RUNTIME';row.detail=gem.kind;}
  else if(protection){row.status='EQUIP_RUNTIME';row.detail=protection.kind+':'+protection.operation;}
  else if(exchangeIngredientIds.has(String(row.id))){row.status='QUEST_RUNTIME';row.detail='eventExchangeIngredient';}
  else if(String(row.id)==='4912'){row.status='QUEST_RUNTIME';row.detail='strategicSpellMaterial';}
  else if(String(row.id)==='8746'){row.status='QUEST_RUNTIME';row.detail='lowRootPromotionMaterial';}
}
const quests=gameplayQuestList().map(q=>{const objectives=sourceQuestObjectives(q),reward=sourceQuestReward(q);return {id:q.id,title:q.title,conditionRows:q.conditions.length,types:q.conditions.reduce((o,c)=>(o[c.typeCode]=(o[c.typeCode]??0)+1,o),{}),objectives,playable:objectives.length>0&&objectives.every(x=>x.kind!=='hold'),rewardUnmapped:reward.unmapped.length};});
const tableGroups=[[/quest/,'quest adapter / raw links'],[/soldier|restraint/,'troop/counter adapter'],[/build|rampart|defence|resourcebuild/,'city/requirements partial'],[/technology/,'research partial'],[/theurgy/,'strategic adapter partial'],[/metempsychosis|gengu|generallevel/,'hero progression partial'],[/buzhou/,'Buzhou source roster/difficulty; rewards HOLD'],[/goods|chest/,'item/loot partial'],[/elfland|strongpoint|field|famouscity/,'world/PvE procedural or partial'],[/official|dukepos|guild/,'administration partial']];
const legacy=Object.entries(meta.sourceInventory.legacy.tables).map(([table,r])=>({table,decoded:r.status==='DECODED',records:r.recordsDecoded,domain:tableGroups.find(([re])=>re.test(table))?.[1]??'UNMAPPED',status:r.status==='DECODED'?'MANIFEST_AUDITED_RUNTIME_PARITY_UNVERIFIED':'HOLD_SOURCE'}));
const counts=arr=>arr.reduce((o,x)=>(o[x.status]=(o[x.status]??0)+1,o),{});
const summary={mobileRecords:mobile.length,mobileStatus:counts(mobile),sourceItems:counts(mobile.filter(x=>x.category==='vat-pham')),legacyTables:legacy.length,decodedTables:legacy.filter(x=>x.decoded).length,quests:quests.length,questConditions:quests.reduce((n,q)=>n+q.conditionRows,0),questPlayable:quests.filter(q=>q.playable).length,objectiveMapped:quests.flatMap(q=>q.objectives).filter(o=>o.kind!=='hold').length,objectiveHold:quests.flatMap(q=>q.objectives).filter(o=>o.kind==='hold').length,buzhouRows:[1,2,3,4,5].reduce((n,i)=>n+buzhouPlan(i).formation.length,0),limitations:'Legacy metadata inventory, not private raw 161331 rows; status is not exact original gameplay parity.'};
const floors = LEGACY_ELFLAND_LOCATIONS.flatMap(row => getMountainBattles(row.ElflandID));
const endgame = getEndgameBattles();
summary.product = {
  sourceBuildings: BUILDINGS.filter(row => row.mobileSourceId).length,
  sourceTechnologies: TECHNOLOGIES.filter(row => row.mobileSourceId).length,
  sourceTechnologyLevels: TECHNOLOGIES.reduce((sum, row) => sum + (row.mobileLevelCosts?.length || 0), 0),
  mobileTroops: TROOPS.filter(row => row.mobileSourceId).length,
  armyEngineActiveInNewSaves: true,
  mountainLocations: LEGACY_ELFLAND_LOCATIONS.length,
  mountainArmyStages: floors.length,
  mountainStagesWithFixedFormation: floors.filter(row => row.formationEvidence === 'VERIFIED_LEGACY').length,
  mountainRewardSourceRows: LEGACY_ELFLAND_REWARD_RULES.length,
  sourceStrongpoints: endgame.filter(row => row.kind === 'Thành trì NPC').length,
  sourceBossFights: endgame.filter(row => row.kind === 'Boss').length,
  sourceArtifactAbilityMapping:{sourceRecords:ITEMS.filter(row=>row.fieldEvidence?.mobileAbilityText==='VERIFIED_MOBILE'&&row.mobileAbilityText).length,uniqueDescriptions:new Set(ITEMS.filter(row=>row.fieldEvidence?.mobileAbilityText==='VERIFIED_MOBILE'&&row.mobileAbilityText).map(row=>row.mobileAbilityText)).size,mapped:ITEMS.filter(row=>row.fieldEvidence?.mobileAbilityText==='VERIFIED_MOBILE'&&row.mobileAbilityText&&rt.index.artifacts[String(row.mobileSourceId)]?.status==='MAPPED').length,unmapped:ITEMS.filter(row=>row.fieldEvidence?.mobileAbilityText==='VERIFIED_MOBILE'&&row.mobileAbilityText&&rt.index.artifacts[String(row.mobileSourceId)]?.status!=='MAPPED').length,execution:'Existing source artifact ops run in army combat; no duplicate text adapter.'},
  localRuleEvidence: WORLD_RULE_EVIDENCE
};
const activeLootRows=new Set(floors.flatMap(row=>row.lootRuleCandidates.map(rule=>rule.sourceRowIndex)));
const lootIds=new Set(floors.flatMap(row=>row.lootRuleCandidates.flatMap(rule=>rule.entries.map(entry=>String(entry.sourceItemId)))));
summary.product.mountainRewardRowsActive=activeLootRows.size;
summary.product.mountainRewardRowsWithoutPlayableFloor=LEGACY_ELFLAND_REWARD_RULES.length-activeLootRows.size;
summary.product.mountainUniqueRewardIds=lootIds.size;
summary.product.mountainRewardIdsJoined=[...lootIds].filter(id=>resolvePveLootItem(id)).length;
summary.product.mountainRewardIdsUnlinked=[...lootIds].filter(id=>!resolvePveLootItem(id)).length;
summary.product.unlinkedRewardFallback='SIMULATED_UNJOINED_SOURCE_ITEM_CONVERSION';
const outputDir = process.argv[2] || 'qa/one-game';
await mkdir(outputDir,{recursive:true});await writeFile(outputDir + '/gameplay-ledger-p31.json',JSON.stringify({summary,mobile,legacy,quests},null,2));console.log('P31_COVERAGE '+JSON.stringify(summary));if(summary.mobileRecords!==2656||summary.decodedTables!==67||summary.questConditions!==5745)process.exitCode=1;
