import test from 'node:test';
import assert from 'node:assert/strict';
import { activeQuest, advance, armyPower, createNewGame as createProductionGame, doAction, heroBaseRating, heroPower, marchTroopCapacity, migrateSave, productionPerHour, questProgress, quoteBuilding, quoteResearch, quoteScouting, quoteTraining, SAVE_VERSION, storageCapacity, unlockedChapter } from '../src/engine.js';
import { HEROES, HERO_QUALITY_MULTIPLIERS, HERO_SKILLS, IMMORTAL_MOUNTAINS, ITEMS, LEGACY_REFERENCE_COUNTS, QUESTS, TECHNOLOGIES, TROOPS, TOWER_FLOORS, WORLD_NODES } from '../src/catalog.js';
import { LEGACY_TROOP_REQUIREMENT_SOURCE } from '../src/legacy-troop-requirement-catalog.js';

// These regressions cover the legacy engine, including existing queued marches.
function createNewGame(...args) {
  const state = createProductionGame(...args);
  state.settings.combatV13 = false;
  Object.assign(state.levels, {government:0, housing:0, hostel:0});
  return state;
}

test('simulated Fengshen Tower cap is independent of legacy elfland floor count', () => {
  assert.equal(TOWER_FLOORS,9999);
  assert.equal(LEGACY_REFERENCE_COUNTS.elflandFloors,8992);
  assert.notEqual(TOWER_FLOORS,LEGACY_REFERENCE_COUNTS.elflandFloors);
  const state=createNewGame('Triều Ca',1_800_000_000_000);
  state.world.towerFloor=20_000;
  state.world.storyStage=8992;
  const migrated=migrateSave(state,1_800_000_000_001);
  assert.equal(migrated.world.towerFloor,TOWER_FLOORS);
  assert.equal(migrated.world.storyStage,24);
});

test('new save has a bounded, offline-first settlement', () => {
  const now = 1_800_000_000_000;
  const state = createNewGame('Tây Kỳ',now);
  const result = advance(state,now+10*60*60*1000);
  assert.equal(result.offlineCapped,true);
  assert.equal(result.elapsedSeconds,8*60*60);
  assert.ok(result.state.resources.food>=0);
  assert.ok(result.state.resources.food<=storageCapacity(result.state));
  assert.ok(productionPerHour(result.state).food>0);
  assert.equal(state.taxPolicy,'balanced');
});

test('Mobile building prerequisites enforce mapped rules and surface unresolved rules', () => {
  const now=1_800_000_000_000;
  const state=createNewGame('Triều Ca',now);
  const barracks=quoteBuilding(state,'barracks');
  assert.equal(barracks.requirementText,'Diễn võ trường 1');
  assert.equal(barracks.requirementStatus,'LOCKED');
  assert.deepEqual(barracks.unmetRequirements,['Diễn võ trường 1']);
  assert.throws(()=>doAction(state,{type:'upgrade',buildingId:'barracks'},now+1),/Diễn võ trường 1/);

  const trained=structuredClone(state);
  trained.levels.training=1;
  assert.equal(quoteBuilding(trained,'barracks').requirementStatus,'SATISFIED');
  assert.equal(quoteBuilding(state,'market').requirementStatus,'SATISFIED','the sourced population requirement uses the settlement population');

  const academy=quoteBuilding(state,'academy');
  assert.equal(academy.requirementStatus,'PARTIAL_UNKNOWN');
  assert.deepEqual(academy.unknownRequirements,['Phủ quan 2']);
  assert.equal(academy.locked,false,'unmapped source buildings stay permissive and visible as UNKNOWN');
  assert.equal(quoteBuilding(state,'clinic').maxLevelEvidence,'SIMULATED','Mobile has no verified level cap for building 200');
});

test('legacy base troop training times fill only shared Mobile IDs with provenance', () => {
  const now=1_800_000_000_000;
  const shared=TROOPS.filter(t=>t.trainTimeEvidence==='VERIFIED_LEGACY');
  assert.equal(shared.length,24);
  const spear=TROOPS.find(t=>t.mobileSourceId==='1000');
  const chariot=TROOPS.find(t=>t.mobileSourceId==='1003');
  assert.equal(spear.trainSeconds,10);
  assert.equal(chariot.trainSeconds,75,'source minutes and seconds are converted to total seconds');
  assert.equal(chariot.fieldProvenance.trainSeconds.evidence,'VERIFIED_LEGACY');
  assert.equal(chariot.fieldProvenance.trainSeconds.sourceTable,'147-soldierinfo');
  assert.equal(quoteTraining(createNewGame('Triều Ca',now),chariot.id,2).seconds,150);

  const mobileOnly=TROOPS.find(t=>t.mobileSourceId==='1051');
  assert.equal(mobileOnly.trainTimeEvidence,'SIMULATED','no legacy time is inferred when the source ID is absent');
});

test('verified legacy troop costs and mapped prerequisites drive Mobile training', () => {
  const now=1_800_000_000_000;
  assert.equal(LEGACY_TROOP_REQUIREMENT_SOURCE.mappedTroops,16);
  assert.equal(LEGACY_TROOP_REQUIREMENT_SOURCE.importedRequirementRows,126);
  assert.equal(LEGACY_TROOP_REQUIREMENT_SOURCE.comparison.valueConflicts,0);
  const starter=TROOPS.find(troop=>troop.mobileSourceId==='1000');
  assert.equal(starter.trainingCostEvidence,'VERIFIED_LEGACY');
  assert.deepEqual(starter.cost,{gold:10,food:75,timber:75,stone:0,iron:50});
  assert.equal(starter.fieldProvenance.cost.sourceTable,'147-soldierrequireinfo');
  assert.equal(starter.fieldProvenance.trainingRequirements.evidence,'VERIFIED_LEGACY');

  const state=createNewGame('Triều Ca',now);
  const quote=quoteTraining(state,starter.id,2);
  assert.deepEqual(quote.cost,{gold:20,food:150,timber:150,stone:0,iron:100});
  assert.equal(quote.costEvidence,'VERIFIED_LEGACY');
  const trained=doAction(state,{type:'train',troopId:starter.id,count:2},now+1);
  assert.deepEqual(trained.queues.training.cost,quote.cost);
  assert.ok(Math.abs(trained.resources.gold-(950-20))<0.001);
  assert.ok(Math.abs(trained.resources.food-(1600-150))<0.001);

  const tierTwo=TROOPS.find(troop=>troop.mobileSourceId==='1001');
  let locked=createNewGame('Triều Ca',now);
  assert.equal(quoteTraining(locked,tierTwo.id,1).locked,true);
  assert.ok(quoteTraining(locked,tierTwo.id,1).unmetRequirements.includes('Trại lính cấp 5'));
  assert.ok(quoteTraining(locked,tierTwo.id,1).unmetRequirements.includes('Chinh binh thuật cấp 1'));
  locked.levels.citadel=0;
  locked.levels.barracks=5;
  locked.technologies['tech-09']=1;
  assert.equal(quoteTraining(locked,tierTwo.id,1).locked,false,'mapped barracks and research conditions replace the simulated citadel gate');

  const workshopUnit=TROOPS.find(troop=>troop.mobileSourceId==='1002');
  const partial=createNewGame('Triều Ca',now);
  partial.levels.citadel=0;
  partial.levels.barracks=10;
  partial.technologies['tech-09']=5;
  const partialQuote=quoteTraining(partial,workshopUnit.id,1);
  assert.equal(partialQuote.locked,false,'an unmapped source building stays permissive rather than invented');
  assert.ok(partialQuote.unknownRequirements.some(value=>value.startsWith('WorkShop cấp 1')));
  assert.equal(workshopUnit.trainingCostEvidence,'VERIFIED_LEGACY');

  const unavailable=TROOPS.find(troop=>troop.mobileSourceId==='1040');
  assert.equal(unavailable.trainingCostEvidence,'SIMULATED','legacy rows do not cover this Mobile ID');
  assert.equal(unavailable.trainingRequirements,undefined);
  assert.equal(quoteTraining(partial,unavailable.id,1).locked,true,'the remaining training gate stays explicitly simulated');
});

test('new hero recruitment is limited to the verified Mobile roster and keeps legacy definitions available to saves', () => {
  const now=1_800_000_000_000;
  const mobileHeroes=HEROES.filter(hero=>hero.mobileSourceId);
  const simulatedHero=HEROES.find(hero=>!hero.mobileSourceId);
  assert.equal(mobileHeroes.length,482);
  assert.ok(simulatedHero);
  const state=createNewGame('Triều Ca',now);
  state.levels.altar=1;
  state.levels.manor=1;
  state.resources.gold=1_000_000;
  state.resources.jade=1_000;
  const initialHeroCount=state.heroes.length;
  assert.throws(()=>doAction(state,{type:'recruit',heroId:simulatedHero.id},now+1),/Mobile/);
  assert.equal(state.heroes.length,initialHeroCount,'a rejected recruit leaves the current save unchanged');
  assert.ok(!state.heroes.some(hero=>hero.id===simulatedHero.id));
  assert.ok(HEROES.some(hero=>hero.id===simulatedHero.id),'the old definition remains available for migrated saves');
  const recruited=doAction(state,{type:'recruit',heroId:mobileHeroes.at(-1).id},now+2);
  assert.equal(recruited.heroes.length,initialHeroCount+1);
  assert.ok(recruited.heroes.some(hero=>hero.id===mobileHeroes.at(-1).id));
});

test('new training uses Mobile troops while retaining simulated definitions for existing saves and NPCs', () => {
  const now=1_800_000_000_000;
  const starter=TROOPS.find(troop=>troop.mobileSourceId==='1000');
  const simulated=TROOPS.find(troop=>!troop.mobileSourceId);
  const state=createNewGame('Triều Ca',now);
  assert.ok(starter&&simulated);
  assert.equal(state.army[starter.id],18);
  assert.equal(state.army[simulated.id],undefined);
  assert.ok(TROOPS.some(troop=>troop.id===simulated.id),'retained definitions continue to support older saves and simulated NPCs');
  const initialResources=structuredClone(state.resources);
  assert.throws(()=>doAction(state,{type:'train',troopId:simulated.id,count:1},now+1),/Mobile/);
  assert.equal(state.queues.training,null);
  assert.deepEqual(state.resources,initialResources);
  const training=doAction(state,{type:'train',troopId:starter.id,count:1},now+2);
  assert.equal(training.queues.training.troopId,starter.id);
});

test('tax policy balances gold income, morale and population growth', () => {
  const now=1_800_000_000_000;
  const state=createNewGame('Triều Ca',now);
  const balancedGold=productionPerHour(state).gold;
  const heavy=doAction(state,{type:'setTaxPolicy',policy:'heavy'},now+1);
  assert.ok(productionPerHour(heavy).gold>balancedGold);
  const heavyRest=advance(heavy,now+8*60*60*1000).state;
  assert.ok(heavyRest.morale<state.morale);
  const relief=doAction(state,{type:'setTaxPolicy',policy:'relief'},now+1);
  assert.ok(productionPerHour(relief).gold<balancedGold);
  const reliefRest=advance(relief,now+8*60*60*1000).state;
  assert.ok(reliefRest.morale>state.morale);
  assert.ok(reliefRest.population>state.population);
  assert.throws(()=>doAction(state,{type:'setTaxPolicy',policy:'free-money'},now+1),/chính sách thuế/);
});

test('completed academy research changes the linked economy', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.levels.academy=1;
  const goldBefore=productionPerHour(state).gold;
  state=doAction(state,{type:'research',techId:'tech-05'},now+1);
  const finish=state.queues.research.finishAt;
  state=advance(state,finish+1).state;
  assert.equal(state.technologies['tech-05'],1);
  assert.ok(productionPerHour(state).gold>goldBefore);
  assert.equal(state.queues.research,null);
  assert.equal(TECHNOLOGIES.length,19);
  const noTaxBase=createNewGame('Triều Ca',now);noTaxBase.population=0;noTaxBase.levels.market=8;
  const marketIncome=productionPerHour(noTaxBase).gold;
  noTaxBase.technologies['tech-05']=20;
  assert.equal(productionPerHour(noTaxBase).gold,marketIncome,'tax research must not increase market income');
  for(const [techId,resource] of [['tech-01','food'],['tech-02','timber'],['tech-03','stone'],['tech-04','iron']]){
    const isolated=createNewGame('Triều Ca',now);
    const before=productionPerHour(isolated)[resource];
    isolated.technologies[techId]=1;
    assert.ok(productionPerHour(isolated)[resource]>before,`${techId} must improve ${resource}`);
  }
  const warehouse=createNewGame('Triều Ca',now),capacityBefore=storageCapacity(warehouse);
  warehouse.technologies['tech-06']=1;
  assert.ok(storageCapacity(warehouse)>capacityBefore);
  const transport=createNewGame('Triều Ca',now),foodBefore=productionPerHour(transport).food;
  transport.technologies['tech-07']=1;
  assert.equal(productionPerHour(transport).food,foodBefore,'transport research must not change food output');
});

test('new-player tutorial unlocks only after its seven gameplay milestones', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  assert.equal(state.tutorialStep,0);
  state=doAction(state,{type:'upgrade',buildingId:'lumber'},now+1);
  assert.equal(state.tutorialStep,0);
  state=advance(state,state.queues.construction.finishAt+1).state;
  assert.equal(state.tutorialStep,1);
  state=doAction(state,{type:'research',techId:'tech-01'},state.lastTickAt+1);
  state=advance(state,state.queues.research.finishAt+1).state;
  assert.equal(state.tutorialStep,2);
  state=doAction(state,{type:'upgrade',buildingId:'altar'},state.lastTickAt+1);
  state=advance(state,state.queues.construction.finishAt+1).state;
  assert.equal(state.tutorialStep,3);
  state=doAction(state,{type:'recruit',heroId:'hero-02'},state.lastTickAt+1);
  assert.equal(state.tutorialStep,4);
  state=doAction(state,{type:'equip',heroId:'hero-01',itemId:'item-01'},state.lastTickAt+1);
  assert.equal(state.tutorialStep,5);
  state=doAction(state,{type:'train',troopId:'troop-03',count:1},state.lastTickAt+1);
  state=advance(state,state.queues.training.finishAt+1).state;
  assert.equal(state.tutorialStep,6);
  const count=state.army['troop-03'];
  state=doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-03',count},state.lastTickAt+1);
  state=advance(state,state.queues.march.finishAt+1).state;
  assert.equal(state.stats.victories,1);
  assert.equal(state.tutorialStep,7);
});

test('all mapped research follows Mobile meanings and preserves unknown runtime effects', () => {
  const now=1_800_000_000_000;
  const base=createNewGame('Triều Ca',now);
  const troopId=TROOPS.find(t=>t.role==='kỵ binh').id;
  const troopState=structuredClone(base);
  troopState.army={[troopId]:1000};
  const troopPower=armyPower(troopState);
  troopState.technologies['tech-12']=10;
  assert.equal(armyPower(troopState),troopPower,'Sĩ khí changes troop health, not attack power');
  const capacityBefore=marchTroopCapacity(base),capacityState=structuredClone(base);
  capacityState.technologies['tech-13']=10;
  assert.ok(marchTroopCapacity(capacityState)>capacityBefore);
  const overCapacity=marchTroopCapacity(capacityState)+1;
  capacityState.army={'troop-01':overCapacity};
  assert.throws(()=>doAction(capacityState,{type:'march',nodeId:'node-001',troopId:'troop-01',count:overCapacity},now+1),/giới hạn lĩnh binh/);
  const generalArmy=structuredClone(base);generalArmy.army={[troopId]:1000};const noGeneral=armyPower(generalArmy);
  generalArmy.technologies['tech-10']=10;
  assert.ok(armyPower(generalArmy)>noGeneral);
  const heroBaseline=heroPower(base.heroes[0],base);
  const heroResearch=structuredClone(base);
  heroResearch.technologies['tech-17']=10;
  assert.equal(heroPower(base.heroes[0],heroResearch),heroBaseline,'army scouting must not increase immortal power');

  const makeBattle=(techId,level=0)=>{
    let state=structuredClone(base);
    state.army={'troop-01':1000,'troop-10':100};
    if(techId)state.technologies[techId]=level;
    state=doAction(state,{type:'march',nodeId:'node-001',troops:{'troop-01':500,'troop-10':100}},now+1);
    return advance(state,state.queues.march.finishAt+1).state.reports[0];
  };
  const unresearched=makeBattle(null);
  assert.ok(makeBattle('tech-11',10).rounds[0].enemyDamage<unresearched.rounds[0].enemyDamage);
  const healthBattle=makeBattle('tech-12',10);
  assert.equal(healthBattle.ownPower,unresearched.ownPower);
  assert.ok(healthBattle.rounds[0].ownMorale>unresearched.rounds[0].ownMorale);
  assert.equal(makeBattle('tech-15',10).ownPower,unresearched.ownPower,'resource scouting must not change army combat');
  const immortalBattle=(techId,level)=>{
    const state=structuredClone(base);state.technologies[techId]=level;
    return doAction(state,{type:'duel',mode:'mountain',mountainId:IMMORTAL_MOUNTAINS[0].id},now+123).reports[0];
  };
  const immortalBaseline=immortalBattle('tech-18',0);
  assert.ok(immortalBattle('tech-18',10).rounds[0].enemyDamage<immortalBaseline.rounds[0].enemyDamage);
  assert.equal(immortalBattle('tech-11',10).rounds[0].enemyDamage,immortalBattle('tech-11',0).rounds[0].enemyDamage,'army defense research must not affect immortal duels');

  const heal=(level)=>{
    const state=structuredClone(base);
    state.resources.food=5000;state.resources.gold=5000;
    state.wounded={'troop-01':100};state.technologies['tech-14']=level;
    const before=state.resources.food;
    const result=doAction(state,{type:'heal'},now+1);
    return before-result.resources.food;
  };
  assert.equal(heal(10),heal(0),'immortal scouting must not discount troop healing');
  const sourceNodes={resources:WORLD_NODES.find(node=>node.kind==='Dã địa'),immortals:WORLD_NODES.find(node=>node.kind==='Tiên sơn'),army:WORLD_NODES.find(node=>node.kind==='Danh thành')};
  for(const [kind,techId] of [['resources','tech-15'],['immortals','tech-14'],['army','tech-17']]){
    const before=quoteScouting(base,sourceNodes[kind].id);
    const researched=structuredClone(base);researched.technologies[techId]=10;
    const after=quoteScouting(researched,sourceNodes[kind].id);
    assert.equal(before.type,kind);
    assert.equal(after.chance,before.chance+0.2);
    assert.equal(after.technologyId,techId);
  }

  const trained=(level)=>{
    const state=structuredClone(base);
    state.technologies['tech-09']=level;
    return doAction(state,{type:'train',troopId:'troop-03',count:1},now+1).queues.training.finishAt;
  };
  assert.ok(trained(10)<trained(0));

  const storage=(level)=>{const state=structuredClone(base);state.technologies['tech-06']=level;return storageCapacity(state);};
  assert.ok(storage(10)>storage(0));
  const construction=(level)=>{
    const state=structuredClone(base);state.technologies['tech-08']=level;
    return doAction(state,{type:'upgrade',buildingId:'lumber'},now+1).queues.construction.finishAt;
  };
  assert.ok(construction(10)<construction(0));
  const researchSpeed=(level)=>{
    const state=structuredClone(base);state.levels.academy=1;state.technologies['tech-08']=level;
    return doAction(state,{type:'research',techId:'tech-05'},now+1).queues.research.finishAt;
  };
  assert.equal(researchSpeed(10),researchSpeed(0),'architecture research must not grant an unsupported academy speed bonus');
  const transportTime=(techId,level)=>{
    const state=structuredClone(base);state.army={'troop-01':1000};state.technologies[techId]=level;
    return doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-01',count:500},now+1).queues.march.finishAt;
  };
  assert.ok(transportTime('tech-07',10)<transportTime('tech-07',0));
  const march=(level)=>{
    const state=structuredClone(base);state.army={'troop-01':1000};state.technologies['tech-16']=level;
    return doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-01',count:500},now+1).queues.march.finishAt;
  };
  assert.ok(march(10)<march(0));
  const trade=(level)=>{
    const state=structuredClone(base);state.technologies['tech-19']=level;
    return doAction(state,{type:'trade',from:'food',to:'gold',amount:1000},now+1).resources.gold;
  };
  assert.equal(trade(10),trade(0),'spell-cost research has no trade effect until a spell-cost system exists');
  const lockedResearch=structuredClone(base);
  lockedResearch.technologies['tech-09']=0;
  assert.equal(quoteResearch(lockedResearch,'tech-10').requirementStatus,'LOCKED');
  assert.throws(()=>doAction(lockedResearch,{type:'research',techId:'tech-10'},now+1),/Chinh binh thuật 1/);
  lockedResearch.technologies['tech-09']=1;
  assert.notEqual(quoteResearch(lockedResearch,'tech-10').requirementStatus,'LOCKED');
});

test('troop lanes and matchup counters change the army battle profile', () => {
  assert.ok(TROOPS.every(t=>['front','rear','siege'].includes(t.lane)&&t.range>=1&&t.range<=6));
  assert.equal(TROOPS.find(t=>t.role==='xạ thủ').lane,'rear');
  assert.equal(TROOPS.find(t=>t.role==='công thành').lane,'siege');
  const now=1_800_000_000_000;
  const matchup=t=>{
    let state=createNewGame('Triều Ca',now);
    state.army={[t]:20_000};
    state=doAction(state,{type:'march',nodeId:'node-011',troopId:t,count:10_000},now+1);
    return advance(state,state.queues.march.finishAt+1).state.reports[0].matchup;
  };
  const cavalry=matchup('troop-10');
  const siege=matchup('troop-15');
  assert.equal(cavalry.counterEvidence,'MIXED');
  assert.ok(Number.isFinite(cavalry.ownCounterAdvantage));
  assert.equal(siege.counterEvidence,'SIMULATED');
  assert.ok(Number.isFinite(siege.enemyCounterAdvantage));
  assert.ok(TROOPS.find(t=>t.id==='troop-10').mobileCounterRows.some(row=>row.modifier!==0));
});

test('immortal affinity advances through training and PvE and elemental bonds reinforce combat', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  const hero=state.heroes[0],baseline=heroPower(hero,state);
  state=doAction(state,{type:'trainHero',heroId:hero.id},now+1);
  assert.equal(state.heroes[0].affinity,3);
  state.heroes[0].affinity=100;
  assert.ok(heroPower(state.heroes[0],state)>baseline);
  state.heroes[0].affinity=98;
  state.heroes.push({id:'hero-07',level:3,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:100});
  state.army={'troop-10':100_000};
  state=doAction(state,{type:'march',nodeId:'node-011',troopId:'troop-10',count:50_000},now+2);
  state=advance(state,state.queues.march.finishAt+1).state;
  assert.equal(state.heroes[0].affinity,100);
  const sameElement=state.reports[0].skillBonuses.elementResonance;
  const mixed=createNewGame('Triều Ca',now);
  mixed.heroes[0].affinity=100;
  mixed.heroes.push({id:'hero-02',level:3,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:100});
  mixed.army={'troop-10':100_000};
  const order=doAction(mixed,{type:'march',nodeId:'node-011',troopId:'troop-10',count:50_000},now+2);
  const mixedResult=advance(order,order.queues.march.finishAt+1).state.reports[0];
  assert.ok(sameElement>0.049);
  assert.equal(mixedResult.skillBonuses.elementResonance,0);
  let maxed=createNewGame('Triều Ca',now);
  maxed.heroes[0].level=60;maxed.heroes[0].affinity=97;maxed.levels.storehouse=4;maxed.resources.food=10_000;maxed.resources.gold=10_000;
  maxed=doAction(maxed,{type:'trainHero',heroId:'hero-01'},now+3);
  assert.equal(maxed.heroes[0].level,60);
  assert.equal(maxed.heroes[0].affinity,100);
  assert.throws(()=>doAction(maxed,{type:'trainHero',heroId:'hero-01'},now+4),/linh căn tối đa/);
});

test('active immortal skills cast by round and apply damage, protection and healing', () => {
  const now=1_800_000_000_000;
  const createHero=id=>({id,level:1,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:0});
  const battle=heroIds=>{
    let state=createNewGame('Triều Ca',now);
    state.heroes=[...heroIds.map(createHero)];
    state.army={'troop-01':1};
    state=doAction(state,{type:'march',nodeId:'node-011',troopId:'troop-01',count:1},now+1);
    return advance(state,state.queues.march.finishAt+1).state.reports[0];
  };
  assert.equal(HERO_SKILLS.length,4);
  assert.equal(new Set(HERO_SKILLS.map(skill=>skill.id)).size,4);
  const windFormation=battle(['hero-01','hero-02','hero-03']);
  assert.ok(windFormation.rounds[0].activeSkills.includes('Huyền Thủy Kết Giới'));
  assert.ok(windFormation.rounds[0].activeSkills.includes('Phong Lôi Tiên Kích'));
  assert.ok(windFormation.rounds[0].shieldedDamage>0);
  assert.ok(windFormation.rounds[0].skillDamage>0);
  assert.ok(windFormation.rounds.some(round=>round.activeSkills.includes('Liệt Hỏa Thiên Hàng')&&round.skillDamage>0));
  assert.ok(windFormation.skillBonuses.attack>0&&windFormation.skillBonuses.defense>0&&windFormation.skillBonuses.opening>0);
  assert.ok(windFormation.skillBonuses.activePowerBonus>0);
  const healingFormation=battle(['hero-01','hero-02','hero-04']);
  const healingRound=healingFormation.rounds.find(round=>round.activeSkills.includes('Thất Tinh Hồi Khí'));
  assert.ok(healingRound,'formation healing should cast on round three');
  assert.ok(healingRound.skillHealing>0);
  assert.ok(healingFormation.skillBonuses.formation>0);
});

test('hero quality and five-element counters affect power and campaign damage', () => {
  const now=1_800_000_000_000;
  const state=createNewGame('Triều Ca',now);
  for(const [quality,multiplier] of Object.entries(HERO_QUALITY_MULTIPLIERS)){
    const def=HEROES.find(hero=>hero.quality===quality);
    const save={id:def.id,level:1,skillLevel:1,affinity:0,equipment:{}};
    const base=heroBaseRating(def);
    assert.equal(heroPower(save,state),Math.round(base*multiplier*1.14*1.035));
  }
  assert.ok(HERO_QUALITY_MULTIPLIERS['Thiên']>HERO_QUALITY_MULTIPLIERS['Địa']);
  const target=WORLD_NODES.find(node=>node.chapter===1&&node.enemy.element==='fire');
  assert.ok(target,'campaign nodes expose NPC elemental affinity');
  const fight=heroId=>{
    let battle=createNewGame('Triều Ca',now);
    battle.heroes=[{id:heroId,level:1,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:0}];
    battle.army={'troop-01':100};
    battle=doAction(battle,{type:'march',nodeId:target.id,troopId:'troop-01',count:100},now+1);
    return advance(battle,battle.queues.march.finishAt+1).state.reports[0];
  };
  const favored=fight('hero-01');
  const countered=fight('hero-03');
  assert.equal(favored.enemyElement,'fire');
  assert.ok(favored.matchup.heroElementAdvantage>0);
  assert.ok(favored.rounds[0].elementDamage>0);
  assert.ok(countered.matchup.heroElementAdvantage<0);
  assert.ok(countered.rounds[0].elementDamage<0);
});

test('weapon, armor and artifact bonuses change their matching combat effects', () => {
  const now=1_800_000_000_000;
  const battle=withGear=>{
    let state=createNewGame('Triều Ca',now);
    if(withGear){
      state.items=['item-01','item-04','item-07'];
      for(const [index,itemId] of state.items.entries())state=doAction(state,{type:'equip',heroId:'hero-01',itemId},now+index+1);
    }
    state.army={'troop-01':1};
    state=doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-01',count:1},now+5);
    return advance(state,state.queues.march.finishAt+1).state.reports[0];
  };
  const unarmed=battle(false),equipped=battle(true);
  assert.equal(unarmed.skillBonuses.equipmentAttack,0);
  assert.equal(unarmed.skillBonuses.equipmentDefense,0);
  assert.equal(unarmed.skillBonuses.artifactSkillBonus,0);
  assert.ok(equipped.skillBonuses.equipmentAttack>0);
  assert.ok(equipped.skillBonuses.equipmentDefense>0);
  assert.ok(equipped.skillBonuses.artifactSkillBonus>0);
  assert.ok(equipped.skillBonuses.activePowerBonus>unarmed.skillBonuses.activePowerBonus);
  const unarmedFire=unarmed.rounds.find(round=>round.activeSkills.includes('Liệt Hỏa Thiên Hàng'));
  const equippedFire=equipped.rounds.find(round=>round.activeSkills.includes('Liệt Hỏa Thiên Hàng'));
  assert.ok(equippedFire.skillDamage>unarmedFire.skillDamage);
});

test('equipped Mobile artifact source effects change army combat and retain report evidence', () => {
  const now=1_800_000_000_000;
  const item=ITEMS.find(row=>row.mobileSourceId==='95902');
  assert.ok(item);
  const battle=withArtifact=>{
    let state=createNewGame('Triều Ca',now);
    state.heroes[0].assigned=true;
    state.army={'troop-01':100};
    if(withArtifact){
      state.items=[item.id];
      state=doAction(state,{type:'equip',heroId:'hero-01',itemId:item.id},now+1);
    }
    state=doAction(state,{type:'march',nodeId:'node-002',troopId:'troop-01',count:100},now+2);
    return advance(state,state.queues.march.finishAt+1).state.reports[0];
  };
  const plain=battle(false),equipped=battle(true);
  assert.ok(equipped.skillBonuses.artifactArmyAttack>0.29);
  assert.ok(equipped.skillBonuses.artifactEnemyTroopLoss>0.06);
  assert.ok(equipped.enemyPower<plain.enemyPower);
  assert.ok(equipped.rounds[0].ownDamage>plain.rounds[0].ownDamage);
  assert.equal(equipped.matchup.sourceArtifacts[0].sourceId,'95902');
  assert.equal(equipped.matchup.sourceArtifacts[0].evidence,'VERIFIED_MOBILE');
  assert.equal(equipped.matchup.sourceArtifacts[0].status,'SOURCE_VALUES_SIMULATED_STACKING');
  const unsupported=ITEMS.find(row=>row.mobileSourceId==='5051');
  let unknownState=createNewGame('Triều Ca',now);
  unknownState.heroes[0].level=unsupported.mobileRequiredLevel;
  unknownState.army={'troop-01':100};
  unknownState.items=[unsupported.id];
  unknownState=doAction(unknownState,{type:'equip',heroId:'hero-01',itemId:unsupported.id},now+1);
  unknownState=doAction(unknownState,{type:'march',nodeId:'node-002',troopId:'troop-01',count:100},now+2);
  const unknown=advance(unknownState,unknownState.queues.march.finishAt+1).state.reports[0];
  assert.equal(unknown.matchup.sourceArtifacts[0].status,'UNKNOWN');
  assert.equal(unknown.matchup.sourceArtifacts[0].evidence,'VERIFIED_MOBILE');
  assert.equal(unknown.skillBonuses.artifactArmyAttack,0);
  assert.equal(unknown.skillBonuses.artifactEnemyTroopLoss,0);
});

test('Mobile chests open linked source rewards and source equipment stats affect combat', () => {
  const now=1_800_000_000_000;
  const randomBox=ITEMS.find(row=>row.mobileSourceId==='4608');
  let state=createNewGame('Triều Ca',now);
  state.items=[randomBox.id];
  state=doAction(state,{type:'useItem',itemId:randomBox.id},now+1);
  assert.equal(state.items.includes(randomBox.id),false);
  assert.equal(state.items.length,1);
  const randomReward=ITEMS.find(row=>row.id===state.items[0]);
  assert.ok(['phap-bao','vat-pham'].includes(randomReward.fieldProvenance.mobileSourceId.sourceTable));

  const lockedBox=ITEMS.find(row=>row.mobileSourceId==='6175');
  const key=ITEMS.find(row=>row.name===lockedBox.mobileOpening.requiredKey&&row.fieldProvenance.mobileSourceId.sourceTable==='vat-pham');
  let locked=createNewGame('Triều Ca',now);
  locked.items=[lockedBox.id];
  assert.throws(()=>doAction(locked,{type:'useItem',itemId:lockedBox.id},now+1),/Cần .* để mở rương/);
  locked.items=[lockedBox.id,key.id];
  locked=doAction(locked,{type:'useItem',itemId:lockedBox.id},now+1);
  assert.equal(locked.items.includes(lockedBox.id),false);
  assert.equal(locked.items.includes(key.id),false);
  assert.equal(locked.items.length,2);

  const sourceGear=ITEMS.find(row=>row.mobileSourceId==='7232');
  let equipped=createNewGame('Triều Ca',now);
  equipped.heroes[0].assigned=true;
  equipped.army={'troop-01':100};
  equipped.items=[sourceGear.id];
  assert.throws(()=>doAction(equipped,{type:'equip',heroId:'hero-01',itemId:sourceGear.id},now+1),/yêu cầu thần tiên cấp/);
  equipped.heroes[0].level=sourceGear.mobileRequiredLevel;
  const basePower=heroPower(equipped.heroes[0],equipped);
  equipped=doAction(equipped,{type:'equip',heroId:'hero-01',itemId:sourceGear.id},now+1);
  assert.ok(heroPower(equipped.heroes[0],equipped)>basePower);
  equipped=doAction(equipped,{type:'march',nodeId:'node-002',troopId:'troop-01',count:100},now+2);
  const report=advance(equipped,equipped.queues.march.finishAt+1).state.reports[0];
  assert.ok(report.skillBonuses.equipmentDefense>0.03);
  const restricted=ITEMS.find(row=>row.mobileSourceId==='7140');
  let wrongOccupation=createNewGame('Triều Ca',now);
  wrongOccupation.heroes[0].level=60;
  wrongOccupation.items=[restricted.id];
  assert.throws(()=>doAction(wrongOccupation,{type:'equip',heroId:'hero-01',itemId:restricted.id},now+1),/dành cho nghề Giáp sĩ/);
});

test('construction and training are queued and settle once', () => {
  const base=1_800_000_000_000;
  let state=createNewGame('Triều Ca',base);
  state=doAction(state,{type:'upgrade',buildingId:'lumber'},base+1);
  assert.equal(state.levels.lumber,0);
  const buildDone=state.queues.construction.finishAt;
  state=advance(state,buildDone+2).state;
  assert.equal(state.levels.lumber,1);
  assert.equal(state.queues.construction,null);
  state=doAction(state,{type:'train',troopId:'troop-03',count:5},buildDone+3);
  const trainDone=state.queues.training.finishAt;
  state=advance(state,trainDone+1).state;
  assert.equal(state.army['troop-03'],23);
  state=advance(state,trainDone+10).state;
  assert.equal(state.army['troop-03'],23);
});

test('recruitment, gear, campaign battle and save migration stay connected', () => {
  const base=1_800_000_000_000;
  let state=createNewGame('Triều Ca',base);
  state.levels.altar=1;
  state=doAction(state,{type:'recruit',heroId:'hero-02'},base+1);
  assert.equal(state.heroes.length,2);
  state=doAction(state,{type:'equip',heroId:'hero-01',itemId:'item-01'},base+2);
  assert.equal(state.heroes[0].equipment.weapon,'item-01');
  state=doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-03',count:8},base+3);
  const arrival=state.queues.march.finishAt;
  state=advance(state,arrival+1).state;
  assert.equal(state.stats.battles,1);
  assert.equal(state.reports.length,1);
  assert.ok(state.reports[0].heroSkills.includes('Hỏa Phù Liệt Trận'));
  assert.ok(state.reports[0].skillBonuses.attack>0);
  assert.ok(state.reports[0].rounds[0].ownDamage>0);
  const totalReturned=Object.values(state.army).reduce((n,x)=>n+x,0)+Object.values(state.wounded).reduce((n,x)=>n+x,0);
  assert.ok(totalReturned<=18);
  state=advance(state,arrival+5_000).state;
  assert.equal(state.stats.battles,1);
  const imported=migrateSave(JSON.parse(JSON.stringify(state)),arrival+6_000);
  assert.equal(imported.version,SAVE_VERSION);
  assert.equal(imported.reports.length,1);
});

test('unaffordable actions do not create negative resources', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.resources.food=0;
  assert.throws(()=>doAction(state,{type:'train',troopId:'troop-03',count:10},now+1),/Tài nguyên chưa đủ/);
  assert.equal(state.resources.food,0);
});

test('captured NPC cities become productive offline settlements', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.army['troop-01']=5000;
  const before=productionPerHour(state).food;
  state=doAction(state,{type:'march',nodeId:'node-001',troopId:'troop-01',count:1200},now+1);
  const arrival=state.queues.march.finishAt;
  state=advance(state,arrival+1).state;
  assert.equal(state.stats.citiesCaptured,1);
  assert.equal(state.cities.length,2);
  assert.ok(state.population>180);
  assert.ok(productionPerHour(state).food>=before+25);
});

test('satellite cities upgrade through the construction queue and add production per level', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.cities.push({id:'node-001',nodeId:'node-001',name:'Thanh Khâu Quan',level:1,population:80,isCapital:false});
  const before=productionPerHour(state);
  state=doAction(state,{type:'upgradeCity',cityId:'node-001'},now+1);
  assert.equal(state.queues.construction.cityId,'node-001');
  assert.equal(state.queues.construction.level,2);
  assert.equal(migrateSave(state,now+2).queues.construction.cityId,'node-001');
  state=advance(state,state.queues.construction.finishAt+1).state;
  assert.equal(state.cities.find(city=>city.id==='node-001').level,2);
  assert.equal(state.stats.upgrades,1);
  assert.ok(productionPerHour(state).food>=before.food+25);
  assert.ok(productionPerHour(state).timber>=before.timber+18);
  assert.throws(()=>doAction(state,{type:'upgradeCity',cityId:'capital'},state.lastTickAt+1),/Không tìm thấy thành phụ/);
  const locked=structuredClone(state);locked.levels.citadel=1;
  assert.throws(()=>doAction(locked,{type:'upgradeCity',cityId:'node-001'},state.lastTickAt+1),/Cần Tử Vi Thành cấp 3/);
});

test('save import normalizes malformed inventory and retains named cities', () => {
  const imported=migrateSave({
    version:1,profile:{name:'  Tây Kỳ  '},resources:{food:-100,unknown:999},levels:{citadel:500},
    technologies:{},heroes:[null,{id:'not-a-hero',level:999}],items:['not-an-item'],army:{alien:100},
    settings:{sound:'yes',autosave:0},world:{captures:['not-a-node'],treaties:[],scouted:[]}
  },1_800_000_000_000);
  assert.equal(imported.profile.name,'Tây Kỳ');
  assert.equal(imported.resources.food,0);
  assert.equal(imported.resources.unknown,undefined);
  assert.equal(imported.levels.citadel,30);
  assert.deepEqual(imported.heroes,[]);
  assert.deepEqual(imported.army,{});
  assert.deepEqual(imported.world.captures,[]);
  assert.equal(imported.cities[0].isCapital,true);
  assert.equal(imported.settings.sound,false);
  assert.equal(imported.settings.autosave,true);
});

test('save v1 archives research levels whose meanings changed in the Mobile adapter', () => {
  const now=1_800_000_000_000;
  const old=createNewGame('Triều Ca',now);
  old.version=1;
  old.technologies['tech-01']=4;
  old.technologies['tech-06']=7;
  old.technologies['tech-14']=3;
  old.technologies['tech-19']=2;
  const migrated=migrateSave(old,now+1);
  assert.equal(SAVE_VERSION,3);
  assert.equal(migrated.version,SAVE_VERSION);
  assert.equal(migrated.technologies['tech-01'],4,'unchanged farming research stays active');
  assert.equal(migrated.technologies['tech-06'],0);
  assert.equal(migrated.technologies['tech-14'],0);
  assert.equal(migrated.technologies['tech-19'],0);
  assert.deepEqual(migrated.legacyResearchArchive,{
    'tech-06':{level:7,previousName:'Quản Dân',status:'ARCHIVED_UNMAPPED'},
    'tech-14':{level:3,previousName:'Y Đạo',status:'ARCHIVED_UNMAPPED'},
    'tech-19':{level:2,previousName:'Ngoại Giao',status:'ARCHIVED_UNMAPPED'}
  });
  assert.ok(migrated.notifications[0].includes('12 cấp khoa kỹ cũ'));
  assert.equal(migrateSave(migrated,now+2).legacyResearchArchive['tech-06'].level,7,'reloading must not archive twice');
});

test('NPC alliance improves market fees and all world labels are unique', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.levels.embassy=1;
  const amountBefore=state.resources.gold;
  state=doAction(state,{type:'guild'},now+1);
  assert.equal(state.world.guildLevel,1);
  assert.ok(state.resources.gold<amountBefore);
  assert.equal(new Set(WORLD_NODES.map(node=>node.id)).size,120);
  assert.equal(new Set(WORLD_NODES.filter(node=>node.mobileCityId).map(node=>node.mobileCityId)).size,73);
});

test('combined army orders accept multiple troop roles and settle each stack', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.army['troop-02']=20;
  state.army['troop-10']=20;
  state=doAction(state,{type:'march',nodeId:'node-001',troops:{'troop-02':8,'troop-10':7}},now+1);
  assert.deepEqual(state.queues.march.troops,{'troop-02':8,'troop-10':7});
  assert.equal(state.army['troop-02'],12);
  assert.equal(state.army['troop-10'],13);
  state=advance(state,state.queues.march.finishAt+1).state;
  const total=Object.values(state.army).reduce((n,x)=>n+x,0)+Object.values(state.wounded).reduce((n,x)=>n+x,0);
  assert.ok(total<=58);
});

test('eight-chapter world catalog is balanced and chapters unlock through field victories', () => {
  const chapters=Array.from({length:8},(_,i)=>WORLD_NODES.filter(node=>node.chapter===i+1));
  assert.ok(chapters.every(rows=>rows.length===15));
  assert.equal(WORLD_NODES.filter(node=>node.kind==='Danh thành').length,75);
  assert.equal(WORLD_NODES.filter(node=>node.kind==='Dã địa').length,30);
  assert.equal(WORLD_NODES.filter(node=>node.kind==='Tiên sơn').length,14);
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.army['troop-01']=5000;
  assert.equal(unlockedChapter(state),1);
  assert.throws(()=>doAction(state,{type:'march',nodeId:'node-016',troopId:'troop-01',count:100},now+1),/chương 1 để mở chương 2/);
  state=doAction(state,{type:'march',nodeId:'node-011',troopId:'troop-01',count:3000},now+2);
  state=advance(state,state.queues.march.finishAt+1).state;
  assert.equal(state.world.storyStage,3);
  assert.equal(unlockedChapter(state),2);
  state.army['troop-01']=5000;
  state=doAction(state,{type:'march',nodeId:'node-016',troopId:'troop-01',count:3000},state.lastTickAt+1);
  assert.equal(state.queues.march.nodeId,'node-016');
});

test('NPC world nodes expose distinct formations and scouting persists battle intelligence', () => {
  assert.ok(WORLD_NODES.every(node=>node.enemy?.commander&&node.enemy?.tactic?.id&&node.enemy?.formation?.length>=3));
  assert.ok(WORLD_NODES.every(node=>['fire','water','wood','metal','earth'].includes(node.enemy.element)));
  assert.equal(new Set(WORLD_NODES.map(node=>node.enemy.element)).size,5);
  assert.ok(new Set(WORLD_NODES.map(node=>node.enemy.tactic.id)).size>=4);
  assert.ok(WORLD_NODES.every(node=>node.enemy.formation.every(row=>TROOPS.some(t=>t.id===row.unitId)&&row.count>0)));
  for(const node of WORLD_NODES){
    const preferredTier=Math.ceil(node.chapter*7/8);
    for(const row of node.enemy.formation){
      const troop=TROOPS.find(unit=>unit.id===row.unitId);
      const lowestRoleTier=Math.min(...TROOPS.filter(unit=>unit.role===troop.role).map(unit=>unit.tier));
      assert.ok(troop.tier<=preferredTier||troop.tier===lowestRoleTier,`${node.id} should not field an unnecessarily high tier`);
    }
  }
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.fame=100_000;
  state.resources.gold=10_000;
  let actionAt=now+1;
  const scoutUntilSuccess=nodeId=>{
    for(let attempt=0;attempt<40&&!state.world.scouted.includes(nodeId);attempt++)state=doAction(state,{type:'scout',nodeId},actionAt++);
    assert.ok(state.world.scouted.includes(nodeId),`${nodeId} should succeed at the 90% scouting cap`);
  };
  scoutUntilSuccess('node-001');
  assert.equal(state.world.scoutedKinds['node-001'],'army');
  assert.ok(state.notifications[0].includes(WORLD_NODES[0].enemy.commander));
  scoutUntilSuccess('node-011');
  assert.equal(state.world.scoutedKinds['node-011'],'resources');
  assert.ok(state.notifications[0].includes('ước tính tài nguyên'));
  state.army={'troop-01':100_000,'troop-10':100_000,'troop-23':100_000};
  state=doAction(state,{type:'march',nodeId:'node-011',troops:{'troop-01':10_000,'troop-10':10_000,'troop-23':10_000}},actionAt+1);
  state=advance(state,state.queues.march.finishAt+1).state;
  const battle=state.reports[0];
  assert.equal(battle.enemyCommander,WORLD_NODES[10].enemy.commander);
  assert.equal(battle.enemyElement,WORLD_NODES[10].enemy.element);
  assert.equal(battle.enemyTactic,WORLD_NODES[10].enemy.tactic.name);
  assert.equal(battle.enemyFormation.length,3);
  assert.ok(Object.keys(battle.enemyCasualties).length>0);
  assert.ok(battle.rounds.every(round=>round.enemyMorale>=0&&round.enemyMorale<=100));
});

test('main campaign has eight regional objectives and locks claims behind chapter progress', () => {
  const mainQuests=QUESTS.filter(q=>q.mainStory);
  assert.equal(mainQuests.length,9);
  assert.deepEqual(mainQuests.map(q=>q.chapter),[1,2,3,4,5,6,7,8,8]);
  const now=1_800_000_000_000;
  let locked=createNewGame('Triều Ca',now);
  const chapterTwo=mainQuests.find(q=>q.chapter===2);
  locked.world.chapterProgress['2'].fieldWins=1;
  assert.throws(()=>doAction(locked,{type:'claimQuest',questId:chapterTwo.id},now+1),/Cần mở chương 2/);
  let state=createNewGame('Triều Ca',now);
  const chapterOne=mainQuests.find(q=>q.chapter===1);
  assert.equal(activeQuest(state).id,chapterOne.id);
  state.army['troop-01']=100_000;
  state=doAction(state,{type:'march',nodeId:'node-011',troopId:'troop-01',count:50_000},now+2);
  state=advance(state,state.queues.march.finishAt+1).state;
  assert.equal(questProgress(state,chapterOne),1);
  assert.equal(unlockedChapter(state),2);
  state=doAction(state,{type:'claimQuest',questId:chapterOne.id},state.lastTickAt+1);
  assert.equal(activeQuest(state).id,chapterTwo.id);
});


test('final boss is gated and a first victory records the campaign ending', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  assert.throws(()=>doAction(state,{type:'march',nodeId:'node-120',troopId:'troop-01',count:1},now+1),/20 trận thắng và 7 danh thành/);
  state.stats.victories=20;
  state.stats.citiesCaptured=7;
  state.world.storyStage=21;
  state.world.captures=WORLD_NODES.filter(n=>n.kind==='Danh thành').slice(0,7).map(n=>n.id);
  state.army['troop-01']=6000;
  state=doAction(state,{type:'march',nodeId:'node-120',troopId:'troop-01',count:5000},now+2);
  const arrival=state.queues.march.finishAt;
  state=advance(state,arrival+1).state;
  assert.equal(state.world.campaignComplete,true);
  assert.equal(state.stats.bossesDefeated,1);
  assert.equal(state.world.storyStage,24);
  assert.equal(state.reports[0].campaignEnding,true);
  assert.equal(questProgress(state,QUESTS.at(-1)),1);
  state=doAction(state,{type:'march',nodeId:'node-120',troopId:'troop-01',count:500},arrival+2);
  state=advance(state,state.queues.march.finishAt+1).state;
  assert.equal(state.stats.bossesDefeated,1);
  assert.equal(state.reports[0].campaignEnding,false);
});



test('mixed source and simulated catalogs expose the requested runtime coverage', () => {
  for(const [rows,count] of [[HEROES,540],[ITEMS,4040],[QUESTS,1158],[IMMORTAL_MOUNTAINS,624]]){
    assert.equal(rows.length,count);
    assert.equal(new Set(rows.map(row=>row.id)).size,count);
  }
  const sourcedHeroes=HEROES.filter(row=>row.mobileSourceId);
  assert.equal(sourcedHeroes.length,482);
  assert.equal(HEROES.filter(row=>row.evidence==='SIMULATED').length,58);
  assert.ok(sourcedHeroes.every(row=>row.evidence==='MIXED'&&row.fieldEvidence.mobileImage==='VERIFIED_MOBILE'));
  assert.equal(ITEMS.filter(row=>row.mobileSourceId).length,2036);
  assert.ok(ITEMS.filter(row=>!row.mobileSourceId).every(row=>row.evidence==='SIMULATED'));
  assert.ok(QUESTS.every(row=>row.evidence==='SIMULATED'));
  assert.ok(IMMORTAL_MOUNTAINS.every(row=>row.evidence==='MIXED'
    && row.fieldEvidence.name==='VERIFIED_LEGACY'
    && row.fieldEvidence.power==='SIMULATED'
    && row.fieldEvidence.loot==='SIMULATED'));
});

test('generated consumables apply their recorded effect and Tiên Sơn challenges settle', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  const goldBefore=state.resources.gold,foodBefore=state.resources.food;
  state=doAction(state,{type:'buyItem',itemId:'item-0022'},now+1);
  assert.equal(state.items.filter(id=>id==='item-0022').length,1);
  assert.equal(state.stats.itemPurchases,1);
  assert.ok(Math.abs(state.resources.gold-(goldBefore-360))<0.01);
  assert.ok(Math.abs(state.resources.food-(foodBefore-180))<0.01);
  const foodAfterPurchase=state.resources.food;
  state=doAction(state,{type:'useItem',itemId:'item-0022'},now+2);
  assert.ok(Math.abs(state.resources.food-(foodAfterPurchase+223))<0.01);
  state.heroes[0].level=60;
  state=doAction(state,{type:'duel',mode:'mountain',mountainId:'mountain-001'},now+2);
  assert.equal(state.stats.duels,1);
  assert.equal(state.world.mountainWins.includes('mountain-001'),true);
  assert.match(state.reports[0].target,/Tiên Sơn 1/);
  assert.deepEqual(state.reports[0].heroSkills,['Hỏa Phù Liệt Trận']);
  assert.ok(state.reports[0].rounds.length>=1&&state.reports[0].rounds.length<=6);
  const goldAfterFirstClear=state.resources.gold;
  assert.throws(()=>doAction(state,{type:'duel',mode:'mountain',mountainId:'mountain-001'},now+3),/đã được chinh phục/);
  assert.equal(state.stats.duels,1);
  assert.equal(state.resources.gold,goldAfterFirstClear);
});

test('immortal duels use deterministic rounds and cast battle skills into the report', () => {
  const now=1_800_000_000_000;
  const makeState=()=>{
    const state=createNewGame('Triều Ca',now);
    state.heroes=[
      {id:'hero-02',level:3,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:0},
      {id:'hero-03',level:3,xp:0,assigned:true,equipment:{weapon:null,armor:null,artifact:null},skillLevel:1,affinity:0}
    ];
    return state;
  };
  const first=doAction(makeState(),{type:'duel',mode:'tower'},now+1);
  const second=doAction(makeState(),{type:'duel',mode:'tower'},now+1);
  const report=first.reports[0];
  assert.deepEqual(report.rounds,second.reports[0].rounds);
  assert.ok(report.rounds.length>=1&&report.rounds.length<=6);
  assert.ok(report.duelEnemy.name);
  assert.ok(['fire','water','wood','metal','earth'].includes(report.duelEnemy.element));
  assert.ok(report.rounds[0].activeSkills.includes('Huyền Thủy Kết Giới'));
  assert.ok(report.rounds[0].activeSkills.includes('Phong Lôi Tiên Kích'));
  assert.ok(report.rounds.every(round=>round.ownMorale>=0&&round.ownMorale<=100&&round.enemyMorale>=0&&round.enemyMorale<=100));
  assert.equal(migrateSave(first,now+2).reports[0].duelEnemy.name,report.duelEnemy.name);
});

test('hero experience items trigger level and skill advancement', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.heroes[0].xp=300;
  state=doAction(state,{type:'useItem',itemId:'item-14'},now+1);
  assert.equal(state.heroes[0].level,4);
  assert.equal(state.heroes[0].skillLevel,2);
  assert.equal(state.heroes[0].xp,14);
});

test('NPC consumable merchant enforces inventory and affordability limits', () => {
  const now=1_800_000_000_000;
  let state=createNewGame('Triều Ca',now);
  state.resources.gold=0;
  assert.throws(()=>doAction(state,{type:'buyItem',itemId:'item-0022'},now+1),/Tài nguyên chưa đủ/);
  state=createNewGame('Triều Ca',now);
  state.items=Array(500).fill('item-13');
  assert.throws(()=>doAction(state,{type:'buyItem',itemId:'item-0022'},now+1),/Túi đồ đã đầy/);
  assert.throws(()=>doAction(createNewGame('Triều Ca',now),{type:'buyItem',itemId:'item-01'},now+1),/không bán vật phẩm/);
});
