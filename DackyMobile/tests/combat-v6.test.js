import test from 'node:test';
import assert from 'node:assert/strict';
import { counterPair,tacticalProfile,classifyCasualties,specialPassiveModifiers } from '../src/combat/tactics-v6.js';
import { castStrategic,strategicCatalog,strategicEffects } from '../src/combat/strategic-v6.js';
import { claimBattleReceipt } from '../src/combat/runtime-v7.js';
test('source counter exception and fallback',()=>{const a={mobileCounterRows:[{target:'Kỵ binh (trừ Long Kỵ)',modifier:.3}],counter:'kỵ binh'};assert.equal(counterPair(a,{mobileClass:'Kỵ binh',name:'Long Kỵ'}).ratio,0);assert.equal(counterPair(a,{mobileClass:'Kỵ binh',name:'Thiết Kỵ'}).ratio,.3);assert.equal(counterPair(a,{role:'kỵ binh'}).ratio,.2)});
test('weighted formation and counter',()=>{const dict={a:{counter:'r',lane:'front'},b:{lane:'rear'},c:{role:'r'}};const out=tacticalProfile([{id:'a',count:50},{id:'b',count:50}],[{id:'c',count:100}],dict);assert.equal(out.counter,.1);assert.equal(out.formation,.06)});
test('passives are opt-in, code 17 stays hold',()=>{const args={name:'Đắc Kỷ',stacks:[{id:'a',count:100}],dict:{a:{mobileSourceId:'1010'}}};assert.equal(specialPassiveModifiers(args).attack,0);assert.equal(specialPassiveModifiers({...args,enabled:true}).attack,.1);assert.equal(specialPassiveModifiers({...args,name:'Thạch Ki Nương Nương',enabled:true}).pending.length,1)});
test('settlement conservation and receipt guard',()=>{const s=classifyCasualties([{id:'a',count:100}],[{id:'a',count:60}]);assert.equal(s.dead.a+s.wounded.a+s.remaining.a,100);const r=claimBattleReceipt({},'x');assert.equal(claimBattleReceipt(r.save,'x').ok,false)});
const world={casters:{h:{cityId:'a',ownerId:'p',energy:1000,spellTier:2}},cities:{a:{ownerId:'p',morale:80,troops:{a:100}},b:{ownerId:'q',morale:80,troops:{a:100}}}};
test('strategic catalog 18, timed cast, duplicate and expiration',()=>{assert.equal(strategicCatalog().length,18);const a={world,casterId:'h',targetId:'a',spellId:4551,castId:'x',now:0};const r=castStrategic(a);assert.ok(r.ok);assert.equal(r.world.casters.h.energy,950);assert.equal(world.casters.h.energy,1000);assert.equal(strategicEffects(r.world.cities.a,0).production,.05);assert.equal(strategicEffects(r.world.cities.a,14400).production,undefined);assert.equal(castStrategic({...a,world:r.world}).reason,'DUPLICATE_CAST');assert.equal(castStrategic({...a,targetId:'b'}).reason,'TARGET_SCOPE');assert.equal(castStrategic({...a,spellId:4567}).reason,'UNKNOWN_OR_HOLD')});
test('strategic troop reduction and seal',()=>{const a={world,casterId:'h',targetId:'b',spellId:4557,castId:'x',now:0};const r=castStrategic(a);assert.equal(r.world.cities.b.troops.a,99);const sealed=structuredClone(world);sealed.cities.a.effects=[{key:'blockMagic',kind:'flag',expiresAt:10}];assert.equal(castStrategic({...a,world:sealed}).reason,'SEALED')});

import { MOBILE_SOURCE_DATABASE,TROOPS } from '../src/catalog.js';
import { createCombatRuntime } from '../src/combat/runtime-v7.js';
test('full production catalog through P7 runtime; replay and conservation',()=>{
 const rt=createCombatRuntime({database:MOBILE_SOURCE_DATABASE,troopRows:TROOPS,allowSimulatedLife:true});
 const ids=Object.keys(rt.troops);assert.ok(ids.length>0);
 const sides=['na-tra','ba-trung'].map((heroId,i)=>({heroId,level:150,stacks:[{id:ids[i],count:300}],vitality:1000,maxVitality:1000,mana:1000,maxMana:1000,equippedArtifactIds:[]}));
 const input={battleId:'test-real-catalog',sides,seed:17};
 const r=rt.army(input);assert.deepEqual(r,rt.army(input));assert.ok(r.rounds.length);assert.ok(r.rounds[0].tactical);
 for(let i=0;i<2;i++){const id=ids[i],s=r.settlement[i];assert.equal(s.dead[id]+s.wounded[id]+s.remaining[id],300)}
});
test('all 17 DEV strategic rules execute with proper world fields',()=>{
 for(const s of strategicCatalog().filter(x=>x.rule)){
  const w=structuredClone(world);w.cities.a.loyalty=80;w.cities.b.loyalty=80;
  const r=castStrategic({world:w,casterId:'h',targetId:s.rule[0]==='own'?'a':'b',spellId:s.row.ID,castId:'test-'+s.row.ID,now:0});
  assert.ok(r.ok,s.row.name+': '+r.reason);
  assert.equal(r.world.casters.h.energy,1000-s.row.enegyNeed);
 }
});
