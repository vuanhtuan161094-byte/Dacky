import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGame,doAction,advance,migrateSave,foodUpkeepPerHour} from '../src/engine.js';
import {HEROES,TROOPS,ITEMS,WORLD_NODES} from '../src/catalog.js';
import {ARTIFACT_SLOTS,squadCapacity,sourcePlan,heroTitleBonus,HERO_TITLES,bagGroup,eventTargets,settleSourceSquads} from '../src/source-v4.js';
const now=Date.UTC(2026,10,28,9);
test('V4 observed archer divisor and rounding',()=>{
 const heroes=[{id:'a',mobileBaseStats:[{label:'Thống suất',value:'881'}]},{id:'b',mobileBaseStats:[{label:'Thống suất',value:'4.408'}]}],t={id:'bow',name:'Cung Tiễn'};
 assert.equal(squadCapacity({id:'a',level:6},t,heroes),440);
 assert.equal(squadCapacity({id:'b',level:36},t,heroes),2204);
});
test('V4 real fixed assignment, cap, return zero, persistence and upkeep conservation',()=>{
 let s=createNewGame('V4',now),h=s.heroes[0],unit=Object.keys(s.army).find(id=>s.army[id]>0),before=s.army[unit],upkeep=foodUpkeepPerHour(s);
 s=doAction(s,{type:'setSourceTroops',heroId:h.id,troopId:unit,count:5},now);
 assert.equal(s.army[unit],before-5);assert.equal(s.heroes[0].sourceSquad[unit],5);assert.equal(foodUpkeepPerHour(s),upkeep);
 assert.throws(()=>doAction(s,{type:'setSourceTroops',heroId:h.id,troopId:unit,count:9999999},now));
 s=migrateSave(s,now);assert.equal(s.heroes[0].sourceSquad[unit],5);
 s=doAction(s,{type:'setSourceTroops',heroId:h.id,troopId:unit,count:0},now);assert.equal(s.army[unit],before);
});
test('V4 fixed army launches through real combat and conserves troops across settlement',()=>{
 let s=createNewGame('V4',now),h=s.heroes[0],unit=Object.keys(s.army).find(id=>s.army[id]>0),before=s.army[unit],w=s.wounded[unit]||0;
 s=doAction(s,{type:'setSourceTroops',heroId:h.id,troopId:unit,count:8},now);
 assert.equal(sourcePlan(s).total[unit],8);
 s=doAction(s,{type:'march',nodeId:'node-001',sourceOwned:true,combatMode:'squad-auto'},now);
 assert.equal(s.queues.march.sourceOwned,true);assert.equal(s.queues.march.troops[unit],8);assert.equal(s.queues.march.squadAllocation[0][0].count,8);
 s=advance(s,s.queues.march.finishAt+1).state;
 assert.equal(s.queues.march,null);assert.equal(s.stats.battles,1);
 const d=s.reports[0].dead[unit]||0;assert.equal((s.army[unit]||0)+(s.heroes[0].sourceSquad[unit]||0)+(s.wounded[unit]||0)-w+d,before);
});
test('V4 post battle replenishment consumes actual reserves, never creates soldiers',()=>{
 const s={army:{a:10},heroes:[{id:'h',level:6,sourceSquad:{}}],gameplay:{r4:{replenish:{h:true}}}};
 const q={sourceOwned:true,commanderIds:['h'],squadAllocation:[[{id:'a',count:8}]]};
 settleSourceSquads(s,q,{sides:[{squads:[{instanceId:'h',stacks:[{id:'a',count:3}]}]}]},[{id:'a',name:'Cung Tiễn'}],[]);
 assert.equal(s.heroes[0].sourceSquad.a,8);assert.equal(s.army.a,2);
});
test('V4 four artifact slots survive save migration',()=>{
 let s=createNewGame('V4',now);const items=ITEMS.filter(i=>i.type==='pháp bảo').slice(0,4);
 assert.equal(ARTIFACT_SLOTS.length,4);for(const [i,k] of ARTIFACT_SLOTS.entries())s.heroes[0].equipment[k]=items[i].id;
 s=migrateSave(s,now);for(const [i,k] of ARTIFACT_SLOTS.entries())assert.equal(s.heroes[0].equipment[k],items[i].id);
});
test('V4 per-hero titles claim, expire, reject duplicate and have actual bonus',()=>{
 let s=createNewGame('V4',now);s.stats.duels=5;const id=s.heroes[0].id,t=HERO_TITLES[0];
 assert.equal(HERO_TITLES.length,55);
 s=doAction(s,{type:'claimHeroTitle',heroId:id,titleId:t.id},now);
 assert.equal(heroTitleBonus(s.heroes[0],now).attack,1);
 assert.throws(()=>doAction(s,{type:'claimHeroTitle',heroId:id,titleId:t.id},now));
 s=migrateSave(s,now+t.durationMs+1);assert.equal(s.heroes[0].sourceTitle,undefined);
});
test('V4 war/stronghold gates and Buzhou routes are real save actions',()=>{
 let s=createNewGame('V4',now);assert.throws(()=>doAction(s,{type:'selectWarGate',gate:0},now));s.levels.citadel=10;s.world.guildLevel=1;
 s=doAction(s,{type:'selectWarGate',gate:0},now);assert.equal(s.gameplay.v4.war.gate,0);
 s=doAction(s,{type:'registerStronghold'},now);assert.equal(s.gameplay.v4.stronghold.registered,true);
 s=doAction(s,{type:'selectBuzhouRoute',route:'Chiêu hiền'},now);assert.equal(s.gameplay.v4.buzhou.route,'Chiêu hiền');
 assert.equal(eventTargets(WORLD_NODES,'war').length,12);assert.equal(eventTargets(WORLD_NODES,'stronghold').length,27);
 assert.equal(bagGroup({type:'vật phẩm',mobileGroup:'Châu báu'}),'gem');
});
