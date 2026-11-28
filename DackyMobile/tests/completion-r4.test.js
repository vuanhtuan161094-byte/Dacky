import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGame,doAction,migrateSave,advance} from '../src/engine.js';
import {WORLD_NODES,TROOPS,LEGACY_QUESTS} from '../src/catalog.js';
import {sourceQuestObjectives} from '../src/gameplay-p15.js';
import {titleBonus,vipLevel,addForegroundTime} from '../src/completion-r4.js';
const now=Date.UTC(2026,10,28,0,0,0);
test('R4 titles and VIP are earned, usable and claimed once',()=>{
 let s=createNewGame('R4',now);
 s.stats.upgrades=30;
 assert.ok(vipLevel(s)>=1);
 s=doAction(s,{type:'claimTitle',titleId:'builder'},now);
 assert.equal(titleBonus(s).defense,3);
 assert.throws(()=>doAction(s,{type:'claimTitle',titleId:'builder'},now));
 s=doAction(s,{type:'claimVipGift'},now);
 assert.throws(()=>doAction(s,{type:'claimVipGift'},now));
 assert.equal(migrateSave(s,now).gameplay.r4.activeTitle,'builder');
});
test('R4 foreground time excludes offline progress; rewards reset at day boundary',()=>{
 let s=createNewGame('R4',now);
 s=advance(s,now+3600000).state;
 assert.equal(s.gameplay.r4.onlineSeconds,0);
 for(let i=0;i<60;i++)addForegroundTime(s,5);
 s=doAction(s,{type:'claimOnlineGift',minutes:5},now+3600000);
 assert.throws(()=>doAction(s,{type:'claimOnlineGift',minutes:5},now+3600000));
 s=migrateSave(s,now+86400000);
 assert.equal(s.gameplay.r4.onlineSeconds,0);
 assert.equal(s.gameplay.r4.onlineClaims.length,0);
});
test('R4 weekly and guild tasks require actual progress',()=>{
 let s=createNewGame('R4',now);
 s.stats.victories=20;s.world.guildLevel=1;
 s=doAction(s,{type:'claimWeekly',mission:'battle'},now);
 s=doAction(s,{type:'claimMonthly'},now);
 s=doAction(s,{type:'claimGuildMission'},now);
 assert.equal(s.gameplay.r4.contribution,10);
 assert.throws(()=>doAction(s,{type:'claimGuildMission'},now));
 assert.throws(()=>doAction(s,{type:'claimWeekly',mission:'battle'},now));
});
test('R4 garrison transfers preserve troops, survive migration, and return exactly once',()=>{
 let s=createNewGame('R4',now),id=Object.keys(s.army)[0],count=s.army[id];
 const node=WORLD_NODES.find(n=>n.kind==='Danh thành');
 s.cities.push({id:node.id,nodeId:node.id,name:node.name,level:1,population:80,isCapital:false});
 s.world.captures.push(node.id);
 s=doAction(s,{type:'setGarrison',cityId:node.id,troopId:id,count:5},now);
 assert.equal(s.army[id],count-5);assert.equal(s.gameplay.r4.garrisons[node.id][id],5);
 s=migrateSave(s,now);
 s=doAction(s,{type:'recallGarrison',cityId:node.id},now);
 assert.equal(s.army[id],count);
 s=doAction(s,{type:'recallGarrison',cityId:node.id},now);
 assert.equal(s.army[id],count);
});
test('R4 unmapped legacy objectives have playable offline fallback without changing raw source',()=>{
 let rows=0;for(const q of LEGACY_QUESTS){const o=sourceQuestObjectives(q);assert.ok(o.length);assert.ok(o.every(x=>x.kind!=='hold'));rows+=o.filter(x=>x.evidence==='SIMULATED_LOCAL_OBJECTIVE').length;}
 const fallback=sourceQuestObjectives({id:'r4-test-unknown',title:'Tu luyện thử nghiệm',conditions:[{sourceId:99999,typeCode:1,title:'Tu luyện thử nghiệm',data:[0,999,999,1,0]}]});
 assert.equal(fallback[0].kind,'action');assert.equal(fallback[0].id,'trainHero');assert.equal(fallback[0].evidence,'SIMULATED_LOCAL_OBJECTIVE');
});
test('R4 replenishment preference and saved squad plan persist',()=>{
 let s=createNewGame('R4',now),id=s.heroes[0].id,unit=Object.keys(s.army)[0];
 s=doAction(s,{type:'setReplenish',heroId:id,value:true},now);
 s.gameplay.r4.lastSquads={[id]:{[unit]:10}};
 s=migrateSave(s,now);
 assert.equal(s.gameplay.r4.replenish[id],true);
 assert.equal(s.gameplay.r4.lastSquads[id][unit],10);
});
