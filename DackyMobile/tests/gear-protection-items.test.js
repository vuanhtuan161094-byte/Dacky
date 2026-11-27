import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave } from '../src/engine.js';
import { ITEMS } from '../src/catalog.js';
import { gearProtectionRule, itemUseRule } from '../src/gameplay-p15.js';

const now=1_800_000_000_000;
const sourceItem=id=>ITEMS.find(item=>String(item.mobileSourceId)===String(id));
const equipment=ITEMS.find(item=>item.mobileSourceId&&item.type==='vũ khí');
const gem=ITEMS.find(item=>item.mobileGroup==='Châu báu');

function deterministicRoll(createdAt,name,type,suffix,counter=0){
  let hash=2166136261;
  for(const ch of `${createdAt}|${name}|${type}|${counter}|${suffix}`){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
  let x=hash>>>0;x=(x*1664525+1013904223)>>>0;return x/0x100000000;
}

function seedForFailure(name,type,suffix,chance){
  for(let seed=1;seed<100_000;seed++)if(deterministicRoll(seed,name,type,suffix)<chance)return seed;
  throw new Error('could not find deterministic failure seed');
}

function gearState({name='Bảo hộ',rank=0,items=[],seed=1}={}){
  const state=createNewGame(name,now),hero=state.heroes[0];state.profile.createdAt=seed;hero.equipment.weapon=equipment.id;hero.gearEnhancements={[equipment.id]:{rank,stars:0,gems:[]}};state.levels.foundry=1;
  state.resources={...state.resources,gold:5_000_000,iron:5_000_000,stone:5_000_000};state.items.push(...items);return state;
}

test('gear safeguards map by verified operation and 8742 resets only a reborn immortal',()=>{
  for(const [id,operation] of [['4710','enhance'],['4711','enhance'],['4714','socket'],['4715','socket']]){
    const rule=gearProtectionRule(sourceItem(id));assert.equal(rule.kind,'gearProtection');assert.equal(rule.operation,operation);assert.equal(rule.evidence,'VERIFIED_MOBILE');assert.equal(rule.runtimeFormula,'SIMULATED_GEAR_FAILURE_POLICY');
  }
  const potion=sourceItem('8742'),rule=itemUseRule(potion);assert.equal(rule.kind,'heroFullReset');assert.equal(rule.requiresRebirth,true);
  const state=createNewGame('Phong thần',now),hero=state.heroes[0];hero.rebirths=1;hero.level=21;hero.xp=7;state.items.push(...Array(3).fill(potion.id));
  const reset=doAction(state,{type:'useItem',itemId:potion.id,heroId:hero.id},now);
  assert.equal(reset.heroes[0].level,1);assert.ok(reset.heroes[0].xp>7);assert.equal(reset.items.filter(id=>id===potion.id).length,0);
  const blocked=createNewGame('Chưa phong thần',now);blocked.heroes[0].level=21;blocked.items.push(potion.id,potion.id,potion.id);
  assert.throws(()=>doAction(blocked,{type:'useItem',itemId:potion.id,heroId:blocked.heroes[0].id},now),/đã chuyển sinh/);assert.equal(blocked.items.filter(id=>id===potion.id).length,3);
});

test('the Heaven Secret Sigil guarantees a socket and the Reverse Sigil preserves a gem on failure',()=>{
  const heaven=sourceItem('4714'),reverse=sourceItem('4715');
  const state=gearState({items:[gem.id,heaven.id]});
  const socketed=doAction(state,{type:'socketGearGem',heroId:state.heroes[0].id,itemId:equipment.id,gemId:gem.id,protectionItemId:heaven.id},now);
  assert.deepEqual(socketed.heroes[0].gearEnhancements[equipment.id].gems,[gem.id]);assert.ok(!socketed.items.includes(gem.id));assert.ok(!socketed.items.includes(heaven.id));
  const name='reverse-fail',suffix=`hero-01|${equipment.id}|${gem.id}`,seed=seedForFailure(name,'socketGearGem',suffix,.03),failed=gearState({name,items:[gem.id,reverse.id],seed});
  const guarded=doAction(failed,{type:'socketGearGem',heroId:failed.heroes[0].id,itemId:equipment.id,gemId:gem.id,protectionItemId:reverse.id},now);
  assert.deepEqual(guarded.heroes[0].gearEnhancements[equipment.id].gems,[]);assert.ok(guarded.items.includes(gem.id));assert.ok(!guarded.items.includes(reverse.id));
  assert.equal(migrateSave(JSON.parse(JSON.stringify(guarded)),now+1).items.includes(gem.id),true);
});

test('refinement safeguards downgrade or retain high-rank equipment; unprotected high-rank failure destroys it',()=>{
  const guard=sourceItem('4710'),rebirth=sourceItem('4711'),name='refine-fail',suffix=`hero-01|${equipment.id}|2`,seed=seedForFailure(name,'enhanceGear',suffix,.05);
  const low=gearState({name,rank:2,items:[guard.id],seed}),downgraded=doAction(low,{type:'enhanceGear',heroId:low.heroes[0].id,itemId:equipment.id,protectionItemId:guard.id},now);
  assert.equal(downgraded.heroes[0].gearEnhancements[equipment.id].rank,1);assert.ok(!downgraded.items.includes(guard.id));
  const highName='high-refine-fail',highSuffix=`hero-01|${equipment.id}|8`,highSeed=seedForFailure(highName,'enhanceGear',highSuffix,.05),high=gearState({name:highName,rank:8,items:[rebirth.id],seed:highSeed});
  const retained=doAction(high,{type:'enhanceGear',heroId:high.heroes[0].id,itemId:equipment.id,protectionItemId:rebirth.id},now);
  assert.equal(retained.heroes[0].equipment.weapon,equipment.id);assert.equal(retained.heroes[0].gearEnhancements[equipment.id].rank,7);assert.ok(!retained.items.includes(rebirth.id));
  const exposed=gearState({name:highName,rank:8,seed:highSeed}),broken=doAction(exposed,{type:'enhanceGear',heroId:exposed.heroes[0].id,itemId:equipment.id},now);
  assert.equal(broken.heroes[0].equipment.weapon,null);assert.equal(broken.heroes[0].gearEnhancements[equipment.id],undefined);
  const invalid=gearState({rank:2,items:[rebirth.id]});assert.throws(()=>doAction(invalid,{type:'enhanceGear',heroId:invalid.heroes[0].id,itemId:equipment.id,protectionItemId:rebirth.id},now),/điều kiện/);assert.ok(invalid.items.includes(rebirth.id));
});

test('save migration retains the expanded simulated enhancement ladder',()=>{
  const state=gearState({rank:10}),loaded=migrateSave(JSON.parse(JSON.stringify(state)),now+1);
  assert.equal(loaded.heroes[0].gearEnhancements[equipment.id].rank,10);
});
