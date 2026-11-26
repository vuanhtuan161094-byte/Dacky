import {advance,createNewGame,doAction,marchTroopCapacity,migrateSave,productionPerHour,quoteBuilding,quoteResearch,quoteTraining,unlockedChapter} from '../src/engine.js';
import {BUILDINGS,HEROES,ITEMS,TECHNOLOGIES,TROOPS,WORLD_NODES} from '../src/catalog.js';
import {gameplayQuestList,questQuote,itemUseRule} from '../src/gameplay-p15.js';
import {getEndgameBattles,getMountainBattles,pveLock} from '../src/pve-campaign.js';
import {LEGACY_ELFLAND_LOCATIONS} from '../src/legacy-elfland-catalog.js';

const start=1_800_000_000_000,hour=3_600_000,days=[1,7,30,90,180];
const policies=[
  {id:'economy',build:['farm','grove','lumber','mine','quarry','foundryfield','market','granary','storehouse','citadel','housing','academy','barracks','training','altar','manor'],tech:['tech-01','tech-02','tech-03','tech-04','tech-05','tech-06','tech-08','tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-07','tech-15','tech-18','tech-14','tech-17','tech-19'],marchEvery:12,trainTarget:12000,heroTarget:4},
  {id:'military',build:['barracks','training','academy','citadel','farm','grove','lumber','mine','quarry','foundryfield','storehouse','market','altar','manor'],tech:['tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-15','tech-08','tech-01','tech-02','tech-03','tech-04','tech-05','tech-06','tech-14','tech-17','tech-18','tech-07','tech-19'],marchEvery:4,trainTarget:40000,heroTarget:4},
  {id:'immortals',build:['altar','manor','hostel','academy','citadel','farm','grove','lumber','mine','quarry','storehouse','market','barracks','training'],tech:['tech-18','tech-17','tech-19','tech-08','tech-01','tech-05','tech-06','tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-02','tech-03','tech-04','tech-14','tech-15','tech-07'],marchEvery:10,trainTarget:6000,heroTarget:9},
  {id:'balanced',build:['citadel','farm','barracks','academy','grove','lumber','mine','quarry','foundryfield','training','altar','manor','storehouse','market','housing','hostel'],tech:['tech-01','tech-09','tech-10','tech-11','tech-12','tech-13','tech-08','tech-02','tech-03','tech-04','tech-05','tech-06','tech-16','tech-15','tech-18','tech-17','tech-14','tech-07','tech-19'],marchEvery:7,trainTarget:22000,heroTarget:6}
];
const allQuests=gameplayQuestList(),sourceTroops=TROOPS.filter(x=>x.mobileSourceId),sourceHeroes=HEROES.filter(x=>x.mobileSourceId),gearCatalog=ITEMS.filter(x=>x.type!=='vật phẩm');
const mountainBattles=LEGACY_ELFLAND_LOCATIONS.flatMap(place=>getMountainBattles(place.ElflandID));
const endgameBattles=getEndgameBattles();
const failures={};
function run(policy){
 let state=createNewGame('Triều Ca',start),now=start;const attempted={},troopTypes=new Set(),recruited=new Set(),equipped=new Set(),battleMix={mixed:0,single:0},history=[];
 const localFailures={};let questCursor=0;const fail=(kind,error)=>{const k=kind+': '+String(error?.message||error);localFailures[k]=(localFailures[k]||0)+1;failures[k]=(failures[k]||0)+1;};
 const act=(type,data={})=>{try{state=doAction(state,{type,...data},now);return true;}catch(error){fail(type,error);return false;}};
 const affordable=cost=>Object.entries(cost||{}).every(([key,value])=>(state.resources[key]||0)>=value);
 const researchBuildingNeeds=()=>{
   const required=[];
   for(const tech of TECHNOLOGIES){
     const quote=quoteResearch(state,tech.id);if(!quote||quote.maxed)continue;
     for(const text of quote.unmetRequirements){
       const match=text.match(/^(.+?)\s+(\d+)$/);if(!match)continue;
       const building=BUILDINGS.find(row=>row.name===match[1]);
       if(building&&(state.levels[building.id]||0)<Number(match[2])&&!required.includes(building.id))required.push(building.id);
     }
   }
   return required;
 };
 const buildingOrder=()=>[
   ...researchBuildingNeeds(),
   ...((state.levels.government||0)<2?['government']:[]),
   ...((state.levels.manor||0)<2?['manor']:[]),
   ...((state.levels.altar||0)<1?['altar']:[]),
   ...((state.levels.manor||0)>=2&&(state.levels.academy||0)<2?['academy']:[]),
   ...((state.levels.foundry||0)<1?['foundry']:[]),
   ...policy.build,...BUILDINGS.map(x=>x.id)
 ];
 const techOrder=[...policy.tech,...TECHNOLOGIES.map(x=>x.id)];
 const troopOrder=[...sourceTroops].sort((a,b)=>{
   const laneRank={front:0,mid:1,rear:2,siege:3};return (laneRank[a.lane]??1)-(laneRank[b.lane]??1)||a.id.localeCompare(b.id);
 });
 const recruitNext=()=>{
   const capacity=Math.min(60,3+(state.levels.manor||0)*2);
   if(state.heroes.length>=Math.min(capacity,policy.heroTarget))return;
   const occupations=new Set(state.heroes.map(h=>HEROES.find(x=>x.id===h.id)?.mobileOccupation).filter(Boolean));
   const unowned=sourceHeroes.filter(h=>!state.heroes.some(x=>x.id===h.id)).sort((a,b)=>Number(occupations.has(a.mobileOccupation))-Number(occupations.has(b.mobileOccupation))||({天:0,地:1,人:2}[a.mobileQuality]??3)-({天:0,地:1,人:2}[b.mobileQuality]??3));
   const candidate=unowned[0];if(candidate&&state.levels.altar>0&&state.levels.manor>0&&state.resources.gold>=220+candidate.wisdom*2&&state.resources.jade>=(candidate.quality==='Thiên'?2:1)&&act('recruit',{heroId:candidate.id}))recruited.add(candidate.id);
 };
 const assignOpenSlots=()=>{
   let active=state.heroes.filter(h=>h.assigned).length;
   for(const h of state.heroes.filter(h=>!h.assigned).sort((a,b)=>(b.level-a.level)))if(active<3){if(act('assignHero',{heroId:h.id}))active++;}
 };
 const gearOne=()=>{
   const ownedGear=state.items.map(id=>ITEMS.find(x=>x.id===id)).filter(x=>x&&x.type!=='vật phẩm');
   for(const h of state.heroes.filter(x=>x.assigned)){
     const occupied=new Set(Object.values(h.equipment||{}).filter(Boolean));
     const item=ownedGear.find(x=>!occupied.has(x.id)&&!equipped.has(x.id)&&(x.mobileRequiredLevel||0)<=h.level&&(!x.mobileOccupation||x.mobileOccupation==='Mọi nghề'||x.mobileOccupation===HEROES.find(def=>def.id===h.id)?.mobileOccupation));
     if(item&&act('equip',{heroId:h.id,itemId:item.id})){equipped.add(item.id);return;}
   }
 };
 const questSweep=()=>{
   // Cycle through the complete source quest catalog in bounded batches. This
   // checks all 1,158 records repeatedly across the 180-day run without doing
   // millions of redundant quote calculations at every simulation tick.
   for(let i=0;i<48&&allQuests.length;i++){
     const q=allQuests[questCursor];questCursor=(questCursor+1)%allQuests.length;
     const quote=questQuote(state,q.id,productionPerHour);if(quote?.ready&&!quote.claimed)act('claimSourceQuest',{questId:q.id});
   }
   for(let i=0;i<state.items.length;i++){
     const item=ITEMS.find(x=>x.id===state.items[i]);if(item?.type==='vật phẩm'&&(item.useEffect||itemUseRule(item))){
       const rule=item.useEffect||itemUseRule(item);if(rule?.kind==='resource'&&state.resources[rule.resource]<1500){act('useItem',{itemId:item.id,index:i});break;}
     }
   }
 };
 const startBuild=()=>{
   if(state.queues.construction)return;
   const id=buildingOrder().filter((x,i,a)=>a.indexOf(x)===i).find(id=>{const q=quoteBuilding(state,id);return !q.maxed&&!q.locked&&q.requirementStatus!=='LOCKED'&&affordable(q.cost);});
   if(id)act('upgrade',{buildingId:id});
 };
 const startResearch=()=>{
   if(state.queues.research)return;
   const ids=techOrder.filter((x,i,a)=>a.indexOf(x)===i);
   const id=ids.find(id=>{const q=quoteResearch(state,id);return !q.maxed&&q.requirementSatisfied&&affordable(q.cost);});
   if(id)act('research',{techId:id});
 };
 const startTraining=day=>{
   if(state.queues.training)return;
   const order=day<15?troopOrder.slice(0,5):troopOrder;
   const candidate=order.find(t=>{
     const total=state.army[t.id]||0,q=quoteTraining(state,t.id,1);
     return !q.locked&&total<Math.max(40,Math.ceil(policy.trainTarget/Math.max(1,sourceTroops.length))+(day%4===0?90:0))&&affordable(q.cost);
   });
   if(!candidate)return;
   const desired=Math.min(500,candidate.id===Object.keys(state.army)[0]?Math.max(120,policy.trainTarget):Math.max(6,Math.floor(policy.trainTarget/Math.max(2,sourceTroops.length))));
   const count=[desired,Math.floor(desired/2),20,8,1].find(n=>n>0&&affordable(quoteTraining(state,candidate.id,n).cost)&&!quoteTraining(state,candidate.id,n).locked);
   if(count&&act('train',{troopId:candidate.id,count}))troopTypes.add(candidate.id);
 };
 const chooseArmy=()=>{
   const counts=Object.entries(state.army).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
   const cap=marchTroopCapacity(state);let left=cap;const selected={};
   for(const [id,total] of counts){if(!left)break;const n=Math.min(left,total,Math.max(8,Math.floor(cap/(counts.length>1?Math.min(3,counts.length):1))));if(n>0){selected[id]=n;left-=n;}}
   return selected;
 };
 const march=day=>{
   if(state.queues.march||day%policy.marchEvery!==0)return;
   const chapter=unlockedChapter(state),army=chooseArmy(),total=Object.values(army).reduce((n,x)=>n+x,0);if(total<18)return;
   let node=null;
   const fields=WORLD_NODES.filter(x=>x.kind==='Dã địa'&&x.chapter<=chapter&&!state.world.captures.includes(x.id)&&!attempted[x.id]);
   const cities=WORLD_NODES.filter(x=>x.kind==='Danh thành'&&x.chapter<=chapter&&!state.world.captures.includes(x.id));
   if(chapter>=8&&state.stats.victories>=20&&state.stats.citiesCaptured>=7&&!state.world.campaignComplete)node=WORLD_NODES.find(x=>x.isBoss);
   else if(state.world.campaignComplete)node=endgameBattles.find(x=>!pveLock(state,x,chapter)&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*1.5);
   else if(!state.stats.victories)node=WORLD_NODES.find(x=>x.id==='node-011');
   else if(state.stats.citiesCaptured<7&&day%3===0)node=cities[0]||fields[0];
   else node=fields.find(x=>x.chapter===chapter)||fields[0]||cities[0];
   if(!node&&chapter>=8&&state.stats.victories>=20&&state.stats.citiesCaptured>=7&&!state.world.campaignComplete)node=WORLD_NODES.find(x=>x.isBoss);
   if(node){battleMix[Object.keys(army).length>1?'mixed':'single']++;if(act('march',{nodeId:node.id,troops:army,combatMode:'auto'}))attempted[node.id]=(attempted[node.id]||0)+1;return;}
   const mountain=mountainBattles.find(x=>!pveLock(state,x,chapter)&&!state.world.pveWins[x.id]&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*.65);
   if(mountain){battleMix[Object.keys(army).length>1?'mixed':'single']++;act('march',{nodeId:mountain.id,troops:army,combatMode:'auto'});return;}
   const boss=endgameBattles.find(x=>x.kind==='Bất Chu'&&!pveLock(state,x,chapter));
   if(boss){battleMix[Object.keys(army).length>1?'mixed':'single']++;act('march',{nodeId:boss.id,troops:army,combatMode:'auto'});}
 };
 for(let day=1;day<=180;day++){
   // Preserve three legal eight-hour clock advances (the engine caps offline
   // production at eight hours), while making one deliberate strategy choice
   // per day instead of repeating every catalog scan three times.
   for(let slot=0;slot<3;slot++){now+=8*hour;state=advance(state,now).state;}
   act('dailyReward');if(state.world.storyStage>=3)act('fieldEvent');recruitNext();assignOpenSlots();
   if(day%2===0)for(const h of state.heroes.filter(x=>x.assigned))if(state.resources.food>=65*h.level&&state.resources.gold>=85*h.level)act('trainHero',{heroId:h.id});
   questSweep();if(day%14===0)act('duel',{mode:'tower'});
   startBuild();startResearch();gearOne();startTraining(day);
   const wounded=Object.values(state.wounded).reduce((n,v)=>n+v,0);if(wounded>0&&state.resources.food>wounded*8&&state.resources.gold>wounded*2)act('heal',{count:wounded});
   march(day);
   if(days.includes(day)){
     state=migrateSave(JSON.parse(JSON.stringify(state)),now);
     const research=Object.values(state.technologies).reduce((a,b)=>a+b,0),eligible=TECHNOLOGIES.filter(t=>{const q=quoteResearch(state,t.id);return !q.maxed&&q.requirementSatisfied;}).length;
     const affordableResearch=TECHNOLOGIES.filter(t=>{const q=quoteResearch(state,t.id);return !q.maxed&&q.requirementSatisfied&&affordable(q.cost);}).length;
   const techRows=TECHNOLOGIES.map(t=>{const q=quoteResearch(state,t.id);return {id:t.id,level:state.technologies[t.id],maxed:q.maxed,status:q.requirementStatus,unmet:q.unmetRequirements,shortfall:Object.entries(q.cost).filter(([k,n])=>state.resources[k]<n).map(([k,n])=>[k,n,state.resources[k]])};});const troopUnlocks=sourceTroops.map(t=>{const q=quoteTraining(state,t.id,1);return {id:t.id,locked:q.locked,unmet:q.unmetRequirements};});history.push({day,chapter:unlockedChapter(state),buildings:state.stats.upgrades,research,researchMax:570,researchEligible:eligible,researchAffordable:affordableResearch,researchRows:techRows,researchBuildings:Object.fromEntries(['government','manor','altar','academy','farm','grove','mine','foundryfield','barracks','training','skirmisher','stable','caravan','storehouse'].map(id=>[id,state.levels[id]])),resources:state.resources,troopUnlocks,trained:state.stats.troopsTrained,trainedTypes:troopTypes.size,armyTypes:Object.keys(state.army).length,readyArmy:Object.values(state.army).reduce((a,b)=>a+b,0),heroes:state.heroes.length,activeHeroes:state.heroes.filter(h=>h.assigned).length,maxHeroLevel:Math.max(...state.heroes.map(h=>h.level)),recruits:state.stats.heroesRecruited,itemsEquipped:state.stats.itemsEquipped,uniqueGear:equipped.size,battles:state.stats.battles,wins:state.stats.victories,cities:state.stats.citiesCaptured,tower:state.world.towerFloor,buzhou:state.world.buzhouFloor,pveWins:Object.keys(state.world.pveWins).length,sourceQuests:state.gameplay.questClaims.length,campaignComplete:state.world.campaignComplete,lastBattle:(state.reports||[]).find(r=>r.type==='army')?((r=>({target:r.target,victory:r.victory,ownPower:r.ownPower,enemyPower:r.enemyPower,dead:r.dead,wounded:r.wounded,enemyEquipmentSourceIds:r.enemyEquipmentSourceIds}))(state.reports.find(r=>r.type==='army'))):null,receipts:state.combatReceipts.length,mixedMarches:battleMix.mixed});
   }
 }
 return {strategy:policy.id,history,attempted,failures:localFailures,troopTypes:[...troopTypes],recruited:[...recruited],mixedBattles:battleMix};
}
const results=policies.map(run);
console.log(JSON.stringify({milestones:days,strategies:results,failures,limits:{sourceTroops:sourceTroops.length,mobileHeroes:sourceHeroes.length,sourceTechnologies:570,quests:allQuests.length}},null,2));
