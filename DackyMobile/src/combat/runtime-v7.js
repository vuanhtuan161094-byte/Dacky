import { resolveArmyBattle } from './army-battle.js';
import { troopDictionary,classifyCasualties } from './tactics-v6.js';
import { buildSourceIndex } from './source-rules.js';
import { resolveLegacyDuel } from './legacy-duel.js';
export function createCombatRuntime({database,troopRows,allowSimulatedLife=false}){
 const index=buildSourceIndex(database),troops=troopDictionary(troopRows,{allowSimulatedLife});
 function army({battleId,sides,seed=1,policy={},woundedRatio=.35,siege=null}){
  if(typeof battleId!=='string'||!battleId)throw Error('Missing battle ID');
  // Snapshot count is the only recoverable cap. Previous wounded are not combat reinforcements.
  const clean=sides.map(s=>({...s,stacks:s.stacks.map(t=>({...t,initialCount:t.count}))}));
  const result=resolveArmyBattle({index,troops,sides:clean,seed,policy,siege});
  const settlement=clean.map((s,i)=>classifyCasualties(s.stacks,result.sides[i].stacks,woundedRatio));
  return {...result,battleId,settlement,dead:settlement[0].dead,wounded:settlement[0].wounded,requiresAtomicSettlement:true};
 }
 function duel(input){return resolveLegacyDuel(input)}
 return {index,troops,army,duel};
}
// This helper is pure. Luna must persist receipt, hero resources, casualties and rewards in one transaction.
export function claimBattleReceipt(save,battleId){
 if(typeof battleId!=='string'||!battleId)throw Error('Missing battle ID');
 if((save.combatReceipts??[]).includes(battleId))return {ok:false,reason:'ALREADY_SETTLED',save};
 return {ok:true,save:{...save,combatReceipts:[...(save.combatReceipts??[]),battleId]}};
}
