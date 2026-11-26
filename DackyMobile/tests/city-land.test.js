import { TROOPS } from '../src/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, migrateSave, doAction, advance, quoteCityPlot, outerLandCapacity, cityPlotUnlocked, productionPerHour, storageCapacity, extraBuildingLevels, cityPlotRecord, cityPrimarySite, cityPlotChoices, trainingSites, trainingQueue, allTrainingQueues } from '../src/engine.js';
import { populationCapacity } from '../src/gameplay-p15.js';
const T=1700000000000;
function state(){const s=createNewGame('Land QA',T);s.levels.citadel=10;s.levels.storehouse=20;s.levels.government=2;s.levels.training=1;for(const k of Object.keys(s.resources))s.resources[k]=15000;s.resources.jade=5000;return s;}
function build(s,plotId,buildingId){const q=quoteCityPlot(s,plotId,buildingId);assert.ok(q&&!q.locked&&!q.maxed,JSON.stringify(q));let next=doAction(s,{type:'upgradePlot',plotId,buildingId},s.lastTickAt);assert.equal(next.queues.construction.plotId,plotId);const end=next.queues.construction.finishAt;next=advance(next,end).state;assert.equal(next.queues.construction,null);return next;}
test('legacy save migrates without duplicate output; land follows palace level',()=>{const s=createNewGame('Old',T);delete s.cityPlots;const m=migrateSave(s,T);assert.deepEqual(m.cityPlots,{});assert.equal(outerLandCapacity(m),9);assert.equal(cityPlotUnlocked(m,'o3'),true);assert.equal(cityPlotUnlocked(m,'o4'),false);m.levels.citadel=30;assert.equal(outerLandCapacity(m),37);assert.equal(cityPlotUnlocked(m,'o31'),true);});
test('two actual farms have independent levels, debit, output and reload',()=>{let s=state();const original=s.levels.farm;const p=productionPerHour(s).food;const q=quoteCityPlot(s,'o1','farm');const pending=doAction(s,{type:'upgradePlot',plotId:'o1',buildingId:'farm'},T);assert.ok(pending.queues.construction);for(const [key,v] of Object.entries(q.cost))if(v>0)assert.ok(pending.resources[key]<s.resources[key]);s=advance(pending,pending.queues.construction.finishAt).state;s=build(s,'o2','farm');assert.equal(s.levels.farm,original);assert.equal(extraBuildingLevels(s,'farm'),2);assert.ok(productionPerHour(s).food>p);assert.equal(s.cityPlots.o1.level,1);assert.equal(s.cityPlots.o2.level,1);s=build(s,'o1','farm');assert.equal(s.cityPlots.o1.level,2);assert.equal(s.cityPlots.o2.level,1);assert.deepEqual(migrateSave(s,s.lastTickAt).cityPlots,s.cityPlots);assert.equal(quoteCityPlot(s,'o1','grove'),null);});
test('housing and warehouse extra plots increase real capacities',()=>{let s=state();const pop=populationCapacity(s),cap=storageCapacity(s);s=build(s,'i1','housing');s=build(s,'i2','storehouse');assert.ok(populationCapacity(s)>pop);assert.ok(storageCapacity(s)>cap);});
test('locked and incompatible lots reject action, invalid records are removed',()=>{const s=createNewGame('Locked',T);assert.throws(()=>doAction(s,{type:'upgradePlot',plotId:'o31',buildingId:'farm'},T),/chưa mở/i);assert.throws(()=>doAction(s,{type:'upgradePlot',plotId:'i1',buildingId:'farm'},T),/không phù hợp/i);s.cityPlots={o31:{buildingId:'farm',level:1},i1:{buildingId:'farm',level:1},bad:{buildingId:'housing',level:3}};assert.deepEqual(migrateSave(s,T).cityPlots,{});});

test('all empty legacy anchors are free; unique buildings can be built once on any compatible site',()=>{
 let s=state();assert.ok(cityPlotChoices(s,'b-embassy').includes('housing'));s=build(s,'b-embassy','housing');
 assert.equal(cityPlotRecord(s,'b-embassy').buildingId,'housing');assert.equal(s.levels.embassy,0);
 s=build(s,'i4','embassy');assert.equal(s.levels.embassy,1);assert.equal(cityPrimarySite(s,'embassy'),'i4');
 assert.ok(!cityPlotChoices(s,'i5').includes('embassy'));assert.throws(()=>doAction(s,{type:'upgradePlot',plotId:'i5',buildingId:'embassy'},s.lastTickAt),/chỉ có một/);
 const old=s.levels.housing;s=doAction(s,{type:'demolishPlot',plotId:'b-housing'},s.lastTickAt);assert.equal(s.levels.housing,1);assert.equal(cityPrimarySite(s,'housing'),'b-embassy');assert.equal(cityPlotRecord(s,'b-housing'),null);assert.ok(old>=s.levels.housing);
 s=doAction(s,{type:'demolishPlot',plotId:'i4'},s.lastTickAt);assert.equal(s.levels.embassy,0);assert.ok(cityPlotChoices(s,'i4').includes('embassy'));
});
test('two barracks train simultaneously and settle once after reload',()=>{
 let s=state();s=build(s,'i1','barracks');
 const troop=TROOPS.find(t=>t.mobileSourceId==='1000')||TROOPS.find(t=>t.mobileSourceId),before=s.army[troop.id]||0,n=s.stats.troopsTrained;
 const t=s.lastTickAt;s=doAction(s,{type:'train',troopId:troop.id,count:2,barracksId:'primary'},t);
 s=doAction(s,{type:'train',troopId:troop.id,count:3,barracksId:'i1'},t);assert.equal(trainingSites(s).length,2);assert.equal(allTrainingQueues(s).length,2);
 assert.throws(()=>doAction(s,{type:'demolishPlot',plotId:'i1'},t),/Không thể phá/);
 assert.throws(()=>doAction(s,{type:'train',troopId:troop.id,count:1,barracksId:'i1'},t),/đang huấn luyện/);
 s=migrateSave(s,t);const finish=Math.max(...allTrainingQueues(s).map(q=>q.finishAt));
 s=advance(s,finish).state;assert.equal(s.army[troop.id],before+5);assert.equal(s.stats.troopsTrained,n+5);assert.equal(allTrainingQueues(s).length,0);
 s=advance(s,finish+1000).state;assert.equal(s.army[troop.id],before+5);s=doAction(s,{type:'demolishPlot',plotId:'i1'},s.lastTickAt);assert.equal(trainingSites(s).length,1);
});
