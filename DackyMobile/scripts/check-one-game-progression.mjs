import {advance,allConstructionQueues,armyCount,armyPower,cityPlotIds,cityPlotRecord,createNewGame,doAction,foodUpkeepPerHour,marchTroopCapacity,migrateSave,outerLandCapacity,productionPerHour,quoteBuilding,quoteCityPlot,quoteGearStar,quoteItemSale,quoteResearch,quoteTraining,storageCapacity,trainingQueue,trainingSites,unlockedChapter} from '../src/engine.js';
import {BUILDINGS,HEROES,ITEMS,TECHNOLOGIES,TROOPS,WORLD_NODES} from '../src/catalog.js';
import {gameplayQuestList,questQuote,itemBuff,itemUseRule} from '../src/gameplay-p15.js';
import {getEndgameBattles,getMountainBattles,pveAssaultProgress,pveLock} from '../src/pve-campaign.js';
import {LEGACY_ELFLAND_LOCATIONS} from '../src/legacy-elfland-catalog.js';
import {worldOffer} from '../src/simulated-world.js';

const start=1_800_000_000_000,hour=3_600_000,days=(process.env.DACKY_ENDGAME_DAYS||'1,7,30,90,180').split(',').map(Number).filter(Number.isSafeInteger).sort((a,b)=>a-b);
const basePolicies=[
  {id:'economy',build:['farm','grove','lumber','mine','quarry','foundryfield','market','granary','storehouse','citadel','housing','academy','barracks','training','altar','manor'],tech:['tech-01','tech-02','tech-03','tech-04','tech-05','tech-06','tech-08','tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-07','tech-15','tech-18','tech-14','tech-17','tech-19'],marchEvery:12,trainTarget:12000,heroTarget:4},
  {id:'military',build:['barracks','training','academy','citadel','farm','grove','lumber','mine','quarry','foundryfield','storehouse','market','altar','manor'],tech:['tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-15','tech-08','tech-01','tech-02','tech-03','tech-04','tech-05','tech-06','tech-14','tech-17','tech-18','tech-07','tech-19'],marchEvery:4,trainTarget:40000,heroTarget:4},
  {id:'immortals',build:['altar','manor','hostel','academy','citadel','farm','grove','lumber','mine','quarry','storehouse','market','barracks','training'],tech:['tech-18','tech-17','tech-19','tech-08','tech-01','tech-05','tech-06','tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-02','tech-03','tech-04','tech-14','tech-15','tech-07'],marchEvery:10,trainTarget:6000,heroTarget:9},
  {id:'balanced',build:['citadel','farm','barracks','academy','grove','lumber','mine','quarry','foundryfield','training','altar','manor','storehouse','market','housing','hostel'],tech:['tech-01','tech-09','tech-10','tech-11','tech-12','tech-13','tech-08','tech-02','tech-03','tech-04','tech-05','tech-06','tech-16','tech-15','tech-18','tech-17','tech-14','tech-07','tech-19'],marchEvery:7,trainTarget:22000,heroTarget:6}
];
const endgamePolicy={id:'endgame',build:['citadel','farm','barracks','academy','grove','lumber','mine','quarry','foundryfield','training','clinic','altar','manor','storehouse','market','housing','hostel','stable','skirmisher','workshop','caravan','granary'],tech:['tech-09','tech-10','tech-11','tech-12','tech-13','tech-16','tech-15','tech-08','tech-01','tech-02','tech-03','tech-04','tech-05','tech-06','tech-14','tech-17','tech-18','tech-07','tech-19'],marchEvery:7,trainTarget:1_000_000,trainingSiteTarget:8,heroTarget:12};
const policies=process.env.DACKY_ENDGAME_ONLY==='1'?[endgamePolicy]:basePolicies;
const allQuests=gameplayQuestList(),sourceTroops=TROOPS.filter(x=>x.mobileSourceId),sourceHeroes=HEROES.filter(x=>x.mobileSourceId),gearCatalog=ITEMS.filter(x=>x.type!=='vật phẩm');
const mountainBattles=LEGACY_ELFLAND_LOCATIONS.flatMap(place=>getMountainBattles(place.ElflandID));
const endgameBattles=getEndgameBattles();
const failures={};
function run(policy){
 let state=createNewGame('Triều Ca',start),now=start;const attempted={},troopTypes=new Set(),recruited=new Set(),equipped=new Set(),battleMix={mixed:0,single:0},history=[];
 const localFailures={};let questCursor=0,itemsSold=0;const buffsUsed=[];const fail=(kind,error)=>{const k=kind+': '+String(error?.message||error);localFailures[k]=(localFailures[k]||0)+1;failures[k]=(failures[k]||0)+1;};
 const act=(type,data={})=>{try{state=doAction(state,{type,...data},now);return true;}catch(error){fail(type,error);return false;}};
 const affordable=cost=>Object.entries(cost||{}).every(([key,value])=>(state.resources[key]||0)>=value);
 const affordableHealCount=injured=>{
   const foodFactor=Math.max(.35,1-Math.min(.45,(state.levels.clinic||0)*.015)),goldFactor=Math.max(.45,1-Math.min(.35,(state.levels.clinic||0)*.01));
   let low=0,high=Math.max(0,Math.floor(injured));
   while(low<high){const mid=Math.ceil((low+high)/2),food=Math.max(1,Math.floor(mid*8*foodFactor)),gold=Math.max(1,Math.floor(mid*2*goldFactor));if(food<=(state.resources.food||0)&&gold<=(state.resources.gold||0))low=mid;else high=mid-1;}
   return low;
 };
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
 const populationCapacityForPolicy=s=>(s.levels.housing||0)*1400+(s.levels.citadel||0)*700+Math.max(0,s.cities.length-1)*350+180;
 const endgameEconomyNeeds=()=>{
   if(policy.id!=='endgame')return [];
   const needs=[];
   if(state.resources.iron<5000&&(state.levels.foundryfield||0)<20)needs.push('foundryfield');
   if((state.levels.training||0)<1)needs.push('training');
   if(state.resources.gold<30000&&(state.levels.market||0)<10)needs.push('market');
   if(state.resources.food<Math.max(8000,foodUpkeepPerHour(state)*24*4)&&(state.levels.farm||0)<25)needs.push('farm','granary');
   if(state.population>=populationCapacityForPolicy(state)*.9&&(state.levels.housing||0)<15)needs.push('housing');
   return needs;
 };
 const buildingOrder=()=>[
   ...researchBuildingNeeds(),
   ...((state.levels.government||0)<2?['government']:[]),
   ...((state.levels.manor||0)<2?['manor']:[]),
   ...((state.levels.altar||0)<1?['altar']:[]),
   ...((state.levels.manor||0)>=2&&(state.levels.academy||0)<2?['academy']:[]),
   ...((state.levels.foundry||0)<1?['foundry']:[]),
   ...(policy.id==='endgame'?['barracks','workshop','academy']:[]),
   ...policy.build,...BUILDINGS.map(x=>x.id)
 ];
 const techOrder=[...policy.tech,...TECHNOLOGIES.map(x=>x.id)];
 const troopOrder=[...sourceTroops].sort((a,b)=>{
   if(policy.id==='endgame'){
     // The prior specialist run ranked by raw power and then trained one
     // expensive top tier troop when it could not afford a useful batch.
     // Rank by power per weighted resource/upkeep instead, so this measures
     // a legal economy path rather than a max-stat shopping list.
     const efficiency=t=>{
       const cost=t.cost||{},weighted=(cost.food||0)*.25+(cost.timber||0)*1.2+(cost.stone||0)*1.2+(cost.iron||0)*1.5+(cost.gold||0)*2.5;
       return (t.attack+t.defense*.85+t.morale*.08)/Math.max(1,weighted+(t.mobileUpkeep||2)*3+(t.trainSeconds||0)*.015);
     };
     return efficiency(b)-efficiency(a)||a.id.localeCompare(b.id);
   }
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
     for(const itemId of occupied){const star=quoteGearStar(state,h.id,itemId);if(star?.available&&act('starUpGear',{heroId:h.id,itemId}))return;}
     const item=ownedGear.find(x=>!occupied.has(x.id)&&!equipped.has(x.id)&&(x.mobileRequiredLevel||0)<=h.level&&(!x.mobileOccupation||x.mobileOccupation==='Mọi nghề'||x.mobileOccupation===HEROES.find(def=>def.id===h.id)?.mobileOccupation));
     if(item&&act('equip',{heroId:h.id,itemId:item.id})){equipped.add(item.id);return;}
   }
 };
 const questSweep=()=>{
   // Sweep eight unique quest records per simulated day. Each 180-day policy
   // visits the full 1,158-row catalog once while keeping the economy run lean.
   // Use the live NPC buyback to clear surplus duplicate rewards before claims;
   // the quote protects quest-reserved items and equipped gear.
   gearOne();
   for(let released=0;state.items.length>440&&released<100;released++){
     const counts=new Map();for(const id of state.items)counts.set(id,(counts.get(id)||0)+1);
     const candidate=[...counts].filter(([id,count])=>count>1&&quoteItemSale(state,id)).map(([id])=>ITEMS.find(item=>item.id===id)).filter(Boolean).sort((a,b)=>(a.tier||1)-(b.tier||1))[0];
     let item=candidate;
     if(!item){
       // Keep crafting materials, quest objects, unopened chests and usable
       // consumables. Sell only legal, unequipped low-tier equipment or
       // reference treasure when the legal market quote protects its quest use.
       item=state.items.map(id=>ITEMS.find(row=>row.id===id)).filter(row=>row&&quoteItemSale(state,row.id)&&(row.type!=='vật phẩm'||!['Nguyên liệu','Nhiệm vụ','Bảo rương','Châu báu','Tăng tốc'].includes(row.mobileGroup)&&!row.useEffect&&!itemUseRule(row)))
         .sort((a,b)=>(a.tier||1)-(b.tier||1)||String(a.id).localeCompare(String(b.id)))[0];
     }
     if(!item||!act('sellItem',{itemId:item.id}))break;itemsSold++;
   }
   for(let i=0;i<8&&allQuests.length;i++){
     const q=allQuests[questCursor];questCursor=(questCursor+1)%allQuests.length;
     const quote=questQuote(state,q.id,productionPerHour);if(quote?.ready&&!quote.claimed)act('claimSourceQuest',{questId:q.id});
   }
   for(let i=0;i<state.items.length;i++){
     const item=ITEMS.find(x=>x.id===state.items[i]);if(item?.type==='vật phẩm'&&(item.useEffect||itemUseRule(item))){
       const rule=item.useEffect||itemUseRule(item);if(rule?.kind==='resource'&&state.resources[rule.resource]<1500){act('useItem',{itemId:item.id,index:i});break;}
     }
   }
 };
 const activateAvailableBuffs=()=>{
   if(!state.world.campaignComplete)return;
   let used=0;
   for(const key of ['trainingTimeReduction','production','attack','defense','marchSpeed','heroXp']){
     if(used>=3||itemBuff(state,key,now)>0)continue;
     const index=state.items.findIndex(id=>{
       const item=ITEMS.find(row=>row.id===id),rule=item?.useEffect||itemUseRule(item);
       return rule?.kind==='timedBuff'&&rule.key===key||rule?.kind==='timedBuffSet'&&rule.effects?.some(effect=>effect.key===key);
     });
     if(index<0)continue;
     const item=ITEMS.find(row=>row.id===state.items[index]);
     if(act('useItem',{itemId:item.id,index})){used++;buffsUsed.push({day:Math.max(1,Math.floor((now-start)/86400000)),sourceId:item.mobileSourceId??item.id,key});}
   }
 };
 const startBuild=()=>{
   if(allConstructionQueues(state).length)return;
   const order=[...endgameEconomyNeeds(),...buildingOrder()];
   const id=order.filter((x,i,a)=>a.indexOf(x)===i).find(id=>{const q=quoteBuilding(state,id);return !q.maxed&&!q.locked&&q.requirementStatus!=='LOCKED'&&affordable(q.cost);});
   if(id)act('upgrade',{buildingId:id});
 };
 const addTrainingSite=()=>{
   if(policy.id!=='endgame'||trainingSites(state).length>=policy.trainingSiteTarget||allConstructionQueues(state).length)return;
   const site=cityPlotIds('inner').find(id=>{
     if(cityPlotRecord(state,id))return false;
     const quote=quoteCityPlot(state,id,'barracks');return quote&&!quote.locked&&!quote.maxed&&quote.requirementStatus!=='LOCKED'&&!quote.landLocked&&affordable(quote.cost);
   });
   if(site)act('upgradePlot',{buildingId:'barracks',plotId:site});
 };
 const addFoodSite=()=>{
   if(policy.id!=='endgame'||trainingSites(state).length<3||allConstructionQueues(state).length||productionPerHour(state).food>=foodUpkeepPerHour(state)*1.75)return;
   const site=cityPlotIds('outer').find(id=>{
     if(cityPlotRecord(state,id))return false;
     const quote=quoteCityPlot(state,id,'farm');return quote&&!quote.locked&&!quote.maxed&&!quote.landLocked&&quote.requirementStatus!=='LOCKED'&&affordable(quote.cost);
   });
   if(site){act('upgradePlot',{buildingId:'farm',plotId:site});return;}
   if(outerLandCapacity(state)<37){const q=quoteBuilding(state,'citadel');if(q&&!q.locked&&!q.maxed&&affordable(q.cost))act('upgrade',{buildingId:'citadel'});}
 };
 const startResearch=()=>{
   if(state.queues.research)return;
   const ids=techOrder.filter((x,i,a)=>a.indexOf(x)===i);
   const id=ids.find(id=>{const q=quoteResearch(state,id);return !q.maxed&&q.requirementSatisfied&&affordable(q.cost);});
   if(id)act('research',{techId:id});
 };
 const startTraining=day=>{
   const order=day<15?troopOrder.slice(0,5):troopOrder;
   const queuedTroops=new Set();
   const laneCount=lane=>sourceTroops.filter(t=>t.lane===lane).reduce((n,t)=>n+(state.army[t.id]||0),0);
   const laneTarget=policy.id==='endgame'?Math.ceil(policy.trainTarget/2):policy.trainTarget;
   const typeTarget=policy.id==='endgame'?Math.ceil(laneTarget/4):Math.ceil(policy.trainTarget/Math.max(1,sourceTroops.length));
   for(const site of trainingSites(state).filter(row=>!trainingQueue(state,row.id))){
     const eligible=order.filter(t=>{
       const total=state.army[t.id]||0,q=quoteTraining(state,t.id,1,site.id),perTypeTarget=typeTarget;
       return !q.locked&&!queuedTroops.has(t.id)&&total<Math.max(40,perTypeTarget+(day%4===0?90:0))&&affordable(q.cost);
     });
     const candidate=policy.id==='endgame'?eligible.filter(t=>laneCount(t.lane)<laneTarget).sort((a,b)=>laneCount(a.lane)-laneCount(b.lane)||order.indexOf(a)-order.indexOf(b))[0]:eligible[0];
     if(!candidate)continue;
     if(policy.id==='endgame')queuedTroops.add(candidate.id);
     const desired=Math.min(500,candidate.id===Object.keys(state.army)[0]?Math.max(120,policy.trainTarget):Math.max(6,Math.floor(policy.trainTarget/Math.max(2,sourceTroops.length))));
     let low=0,high=desired;
     while(low<high){const middle=Math.ceil((low+high)/2),quote=quoteTraining(state,candidate.id,middle,site.id);if(!quote.locked&&affordable(quote.cost))low=middle;else high=middle-1;}
     const count=low||((desired>0&&affordable(quoteTraining(state,candidate.id,1,site.id).cost))?1:0);
     if(count&&act('train',{troopId:candidate.id,count,barracksId:site.id}))troopTypes.add(candidate.id);
   }
 };
 const balanceForTrainingOnce=()=>{
   if(policy.id!=='endgame')return false;
   const reserve={food:1000,timber:1000,stone:1000,iron:1000,gold:12000};
   const resourceRate={food:1,timber:1.15,stone:1.3,iron:1.55,gold:2.2,jade:16};
   let to=null,goal=0;
   // Reserve resources for real source progression gates before growing the
   // army further. This is a player trade policy: every exchange still goes
   // through quote/runtime rules and never injects resources.
   for(const techId of ['tech-09','tech-10','tech-12','tech-13','tech-11','tech-16']){
     const quote=quoteResearch(state,techId);if(!quote||quote.maxed)continue;
     let target=quote.requirementSatisfied?quote.cost:null;
     if(!target){
       for(const requirement of quote.unmetRequirements){
         const match=requirement.match(/^(.+?)\s+(\d+)$/),building=match&&BUILDINGS.find(row=>row.name===match[1]);
         if(!building)continue;
         const buildingQuote=quoteBuilding(state,building.id);
         if(buildingQuote&&!buildingQuote.maxed&&!buildingQuote.locked&&!affordable(buildingQuote.cost)){target=buildingQuote.cost;break;}
         if(buildingQuote&&!buildingQuote.maxed&&!buildingQuote.locked&&affordable(buildingQuote.cost)){target=null;break;}
       }
     }
     if(!target)continue;
     const shortage=Object.entries(target).filter(([key,value])=>(state.resources[key]||0)<value).sort((a,b)=>(b[1]-(state.resources[b[0]]||0))-(a[1]-(state.resources[a[0]]||0)))[0];
     if(shortage){to=shortage[0];goal=shortage[1]+(shortage[0]==='gold'?500:250);break;}
   }
   if(trainingSites(state).length<policy.trainingSiteTarget&&(state.levels.training||0)>0){
     const site=cityPlotIds('inner').find(id=>!cityPlotRecord(state,id));
     const quote=site&&quoteCityPlot(state,site,'barracks');
     if(!to&&quote&&!quote.locked&&!quote.maxed&&!quote.landLocked){
       for(const key of ['food','timber','stone','iron','gold'])if(state.resources[key]<(quote.cost[key]||0)){to=key;goal=(quote.cost[key]||0)+100;break;}
     }
   }
   if(!to&&state.resources.food<Math.min(storageCapacity(state),Math.max(8000,foodUpkeepPerHour(state)*12))){to='food';goal=Math.min(storageCapacity(state),Math.max(8000,foodUpkeepPerHour(state)*12));}
   if(!to&&state.resources.iron<5000){to='iron';goal=5000;}
   if(!to&&state.resources.gold<12000){to='gold';goal=12000;}
   if(!to)return false;
   const fee=Math.max(.02,.22-(state.levels.caravan||0)*.012-(state.levels.embassy||0)*.006-(state.world.guildLevel||0)*.005);
   const deficit=Math.max(0,goal-state.resources[to]);
   for(const from of ['gold','stone','timber','food','iron','jade']){
     if(from===to)continue;
     const surplus=Math.floor(state.resources[from]-(reserve[from]||0));
     const wanted=Math.ceil(deficit*resourceRate[to]/(resourceRate[from]*(1-fee)));
     const amount=Math.min(50000,surplus,Math.max(100,wanted));
     if(amount<100)continue;
     if(act('trade',{from,to,amount}))return true;
   }
   return false;
 };
 // A human may make several independent trades while advancing a developed
 // realm. Let this policy finish three legal quotes per day so cheap troop
 // queues cannot starve the real high-tier technology prerequisites.
 const balanceForTraining=()=>{for(let trade=0;trade<3;trade++)if(!balanceForTrainingOnce())break;};
 const chooseArmy=()=>{
   const counts=Object.entries(state.army).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
   const cap=marchTroopCapacity(state);let left=cap;const selected={};
   for(const [id,total] of counts){if(!left)break;const n=Math.min(left,total,Math.max(8,Math.floor(cap/(counts.length>1?Math.min(3,counts.length):1))));if(n>0){selected[id]=n;left-=n;}}
   return selected;
 };
 const march=day=>{
   const cadence=policy.id==='endgame'&&state.world.campaignComplete?1:policy.marchEvery;
   if(state.queues.march||day%cadence!==0)return;
   const chapter=unlockedChapter(state),army=chooseArmy(),total=Object.values(army).reduce((n,x)=>n+x,0);if(total<18)return;
   let node=null;
   const fields=WORLD_NODES.filter(x=>x.kind==='Dã địa'&&x.chapter<=chapter&&!state.world.captures.includes(x.id)&&!attempted[x.id]);
   const cities=WORLD_NODES.filter(x=>x.kind==='Danh thành'&&x.chapter<=chapter&&!state.world.captures.includes(x.id)&&!attempted[x.id]);
   if(chapter>=8&&state.stats.victories>=20&&state.stats.citiesCaptured>=7&&!state.world.campaignComplete)node=WORLD_NODES.find(x=>x.isBoss);
   else if(state.world.campaignComplete&&policy.id==='endgame'){
     const nextFloor=(state.world.buzhouFloor||0)+1,candidate=endgameBattles.find(x=>x.id===`buzhou:${nextFloor}`),minimum={1:20000,2:35000,3:55000,4:25000,5:100000}[nextFloor]||Infinity;
     const resumedAssault=!!candidate&&pveAssaultProgress(state,candidate,marchTroopCapacity(state))?.cleared>0;
     if(candidate&&total<minimum&&!resumedAssault)return;
     // Preserve the source entry bands for doors 1–3. On door 4, regroup to a
     // 50k sortie force instead of spending soldiers on tiny waves; door 5
     // keeps its 100k source entry band. These are policy choices, not NPC edits.
     const sortieTarget=nextFloor===4?Math.max(minimum,Math.min(50_000,marchTroopCapacity(state))):minimum;
     if(candidate&&total<sortieTarget)return;
     if(candidate&&(total>=minimum||resumedAssault)&&!pveLock(state,candidate,chapter))node=candidate;
     else if(candidate&&resumedAssault)return;
     else if(!candidate)node=endgameBattles.find(x=>!attempted[x.id]&&!pveLock(state,x,chapter)&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*1.5);
   }
   else if(state.world.campaignComplete)node=endgameBattles.find(x=>!attempted[x.id]&&!pveLock(state,x,chapter)&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*1.5);
   else if(!state.stats.victories)node=WORLD_NODES.find(x=>x.id==='node-011');
   else if(state.stats.citiesCaptured<7&&day%3===0)node=cities[0]||fields[0];
   else node=fields.find(x=>x.chapter===chapter)||fields[0]||cities[0];
   if(!node&&chapter>=8&&state.stats.victories>=20&&state.stats.citiesCaptured>=7&&!state.world.campaignComplete)node=WORLD_NODES.find(x=>x.isBoss);
   if(node){battleMix[Object.keys(army).length>1?'mixed':'single']++;if(act('march',{nodeId:node.id,troops:army,combatMode:'auto'}))attempted[node.id]=(attempted[node.id]||0)+1;return;}
   const mountain=mountainBattles.find(x=>!attempted[x.id]&&!pveLock(state,x,chapter)&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*.65);
   if(mountain){battleMix[Object.keys(army).length>1?'mixed':'single']++;if(act('march',{nodeId:mountain.id,troops:army,combatMode:'auto'}))attempted[mountain.id]=1;return;}
   const boss=endgameBattles.find(x=>x.kind==='Bất Chu'&&!attempted[x.id]&&!pveLock(state,x,chapter)&&x.enemy.formation.reduce((n,r)=>n+r.count,0)<=total*1.5);
   if(boss){battleMix[Object.keys(army).length>1?'mixed':'single']++;if(act('march',{nodeId:boss.id,troops:army,combatMode:'auto'}))attempted[boss.id]=1;}
 };
 for(let day=1;day<=Math.max(...days);day++){
   // Preserve three legal eight-hour clock advances (the engine caps offline
   // production at eight hours), while making one deliberate strategy choice
   // per day instead of repeating every catalog scan three times.
   for(let slot=0;slot<3;slot++){now+=8*hour;state=advance(state,now).state;}
   const daily=worldOffer(state,now,'daily');if(daily.available&&affordable(daily.cost))act('dailyReward');
   const field=worldOffer(state,now,'field');if(state.world.storyStage>=3&&field.available&&affordable(field.cost))act('fieldEvent');
   if(policy.id==='endgame'&&state.morale>45){const tax=state.resources.gold<12_000?'heavy':'balanced';if(state.taxPolicy!==tax)act('setTaxPolicy',{policy:tax});}
   recruitNext();assignOpenSlots();
   if(day%2===0)for(const h of state.heroes.filter(x=>x.assigned))if(state.resources.food>=65*h.level&&state.resources.gold>=85*h.level)act('trainHero',{heroId:h.id});
   questSweep();activateAvailableBuffs();if(day%14===0)act('duel',{mode:'tower'});
   balanceForTraining();addTrainingSite();addFoodSite();startBuild();startResearch();gearOne();startTraining(day);
   const wounded=Object.values(state.wounded).reduce((n,v)=>n+v,0),healCount=affordableHealCount(wounded);if(healCount>0)act('heal',{count:healCount});
   march(day);
   if(days.includes(day)){
     state=migrateSave(JSON.parse(JSON.stringify(state)),now);
     const research=Object.values(state.technologies).reduce((a,b)=>a+b,0),eligible=TECHNOLOGIES.filter(t=>{const q=quoteResearch(state,t.id);return !q.maxed&&q.requirementSatisfied;}).length;
     const affordableResearch=TECHNOLOGIES.filter(t=>{const q=quoteResearch(state,t.id);return !q.maxed&&q.requirementSatisfied&&affordable(q.cost);}).length;
     const techRows=TECHNOLOGIES.map(t=>{const q=quoteResearch(state,t.id);return {id:t.id,level:state.technologies[t.id],maxed:q.maxed,status:q.requirementStatus,unmet:q.unmetRequirements,shortfall:Object.entries(q.cost).filter(([k,n])=>state.resources[k]<n).map(([k,n])=>[k,n,state.resources[k]])};});const troopUnlocks=sourceTroops.map(t=>{const q=quoteTraining(state,t.id,1);return {id:t.id,locked:q.locked,unmet:q.unmetRequirements};});const pendingMarch=state.queues.march, marchingRoster=pendingMarch?.troops||{}, marchingArmy=Object.values(marchingRoster).reduce((n,x)=>n+x,0),pendingTraining=[...(state.queues.training?[{id:'primary',...state.queues.training}]:[]),...Object.entries(state.queues.extraTraining||{}).map(([id,q])=>({id,...q}))];history.push({day,chapter:unlockedChapter(state),population:Math.floor(state.population),populationCapacity:state.levels.housing*1400+state.levels.citadel*700+Math.max(0,state.cities.length-1)*350+180,foodUpkeepPerDay:Math.round(foodUpkeepPerHour(state)*24),foodProductionPerDay:Math.round(productionPerHour(state).food*24),buildings:state.stats.upgrades,research,researchMax:570,researchEligible:eligible,researchAffordable:affordableResearch,researchRows:techRows,researchBuildings:Object.fromEntries(['government','manor','altar','academy','farm','grove','mine','foundryfield','barracks','training','skirmisher','stable','caravan','storehouse','market','granary','housing'].map(id=>[id,state.levels[id]])),resources:state.resources,troopUnlocks,trained:state.stats.troopsTrained,trainedTypes:troopTypes.size,trainingSites:trainingSites(state).length,pendingTraining:pendingTraining.map(({id,troopId,count,finishAt})=>({id,troopId,count,finishInHours:Math.max(0,Math.round((finishAt-now)/hour))})),tradeCount:state.stats.tradeCount,armyLanes:Object.fromEntries(['front','mid','rear','siege'].map(lane=>[lane,sourceTroops.filter(t=>t.lane===lane).reduce((n,t)=>n+(state.army[t.id]||0),0)])),armyTypes:Object.keys(state.army).length,armyRoster:Object.fromEntries(Object.entries(state.army).filter(([,n])=>n>0)),readyArmy:armyCount(state),marchingArmy,marchingNode:pendingMarch?.nodeId||null,marchingRoster,armyCommitted:armyCount(state)+marchingArmy,woundedArmy:Object.values(state.wounded).reduce((n,x)=>n+x,0),marchCapacity:marchTroopCapacity(state),armyPower:armyPower(state),heroes:state.heroes.length,activeHeroes:state.heroes.filter(h=>h.assigned).length,maxHeroLevel:Math.max(...state.heroes.map(h=>h.level)),recruits:state.stats.heroesRecruited,itemsEquipped:state.stats.itemsEquipped,sourceArtifacts:state.items.map(id=>ITEMS.find(item=>item.id===id)).filter(item=>item?.mobileSourceId&&item.type==='pháp bảo').map(item=>({id:item.id,name:item.name,source:item.mobileSourceId})),uniqueGear:equipped.size,battles:state.stats.battles,wins:state.stats.victories,cities:state.stats.citiesCaptured,tower:state.world.towerFloor,buzhou:state.world.buzhouFloor,pveWins:Object.keys(state.world.pveWins).length,assaults:{'buzhou:4':state.gameplay.endgameAssaults?.['buzhou:4']?{total:state.gameplay.endgameAssaults['buzhou:4'].total,remaining:Object.values(state.gameplay.endgameAssaults['buzhou:4'].remaining||{}).reduce((n,x)=>n+x,0)}:null,'buzhou:5':state.gameplay.endgameAssaults?.['buzhou:5']?{total:state.gameplay.endgameAssaults['buzhou:5'].total,remaining:Object.values(state.gameplay.endgameAssaults['buzhou:5'].remaining||{}).reduce((n,x)=>n+x,0)}:null},sourceQuests:state.gameplay.questClaims.length,campaignComplete:state.world.campaignComplete,lastBattle:(state.reports||[]).find(r=>r.type==='army')?((r=>({target:r.target,victory:r.victory,ownPower:r.ownPower,enemyPower:r.enemyPower,dead:r.dead,wounded:r.wounded,troopsSent:r.troopsSent,enemyEquipmentSourceIds:r.enemyEquipmentSourceIds,assault:r.assault}))(state.reports.find(r=>r.type==='army'))):null,itemsInBag:state.items.length,itemsSold,buffsUsed:buffsUsed.length,receipts:state.combatReceipts.length,mixedMarches:battleMix.mixed});
   }
 }
 return {strategy:policy.id,history,attempted,failures:localFailures,troopTypes:[...troopTypes],recruited:[...recruited],mixedBattles:battleMix,itemsSold,buffsUsed};
}
const results=policies.map(run);
console.log(JSON.stringify({milestones:days,strategies:results,failures,limits:{sourceTroops:sourceTroops.length,mobileHeroes:sourceHeroes.length,sourceTechnologies:570,quests:allQuests.length}},null,2));
