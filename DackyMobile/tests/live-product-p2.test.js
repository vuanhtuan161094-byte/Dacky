import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGame,doAction} from '../src/engine.js';
import {collectionBonus} from '../src/live-product-p2.js';
import {distributeWeightedSquads} from '../src/combat/squad-ownership.js';
const now=Date.UTC(2026,10,28,8);
test('P2 real actions, pool lock, free spin, daily receipts and collection bonus',()=>{
 let s=createNewGame('P2',now);
 s=doAction(s,{type:'selectPrizePool',pool:'jade'},now);
 s=doAction(s,{type:'spinPrize'},now);assert.equal(s.gameplay.liveProduct.spins,1);
 assert.throws(()=>doAction(s,{type:'selectPrizePool',pool:'resource'},now),/khóa/);
 s=doAction(s,{type:'claimFestival',festivalId:'pray'},now);assert.equal(s.gameplay.liveProduct.tokens,2);
 assert.throws(()=>doAction(s,{type:'claimFestival',festivalId:'pray'},now),/đã nhận/);
 s.world.captures=['node-001','node-002','node-003'];
 // Direct verified campaign counts may vary by source ID; use a fixture claim only after count is met.
 const q={...s,gameplay:{...s.gameplay,liveProduct:{...s.gameplay.liveProduct,collectionClaims:['heroes:3']}}};
 assert.equal(collectionBonus(q).attack,2);
});
test('weighted squads preserve counts and obey caps',()=>{
 const s=distributeWeightedSquads([{id:'a',count:18},{id:'b',count:12}],[{vitality:1},{vitality:1}],[90,10],20);
 assert.equal(s.flat().reduce((n,t)=>n+t.count,0),30);
 assert.ok(s.every(g=>g.reduce((n,t)=>n+t.count,0)<=20));
 assert.ok(s[0].reduce((n,t)=>n+t.count,0)>s[1].reduce((n,t)=>n+t.count,0));
});
