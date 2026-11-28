// DEV simulation: commanders share the army but retain individual resources.
import { canEquip } from './army-artifacts.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const TACTICAL_STANCES=Object.freeze({assault:{attack:1.18,defense:.86},balanced:{attack:1,defense:1},guard:{attack:.84,defense:1.22},siege:{attack:.90,defense:1.05}});
const resourceKeys=['heroId','instanceId','level','mana','maxMana','vitality','maxVitality','equippedArtifactIds','ownedArtifactIds','legacyPassiveName','legacyDuelPassiveIds','commandAttack','commandDefense','troopRecoverySuppression','activeCombatSkill','activeCombatSkillLevel'];
export function commanderSnapshot(s){return Object.fromEntries(resourceKeys.filter(k=>s[k]!==undefined).map(k=>[k,Array.isArray(s[k])?[...s[k]]:s[k]]))}
export function prepareCommanders(side,index){
 const roster=[commanderSnapshot(side),...(side.reserves??[]).map(commanderSnapshot)].map(c=>({...c,instanceId:String(c.instanceId??c.heroId),equippedArtifactIds:[...(c.equippedArtifactIds??[])]}));
 if(roster.length>5||new Set(roster.map(c=>c.instanceId)).size!==roster.length)throw Error('Invalid commander roster');
 for(const c of roster){if(!index.heroes[c.heroId])throw Error('Unknown commander');for(const k of ['mana','maxMana','vitality','maxVitality'])if(!Number.isSafeInteger(c[k])||c[k]<0)throw Error('Invalid commander '+k);
  if(c.mana>c.maxMana||c.vitality>c.maxVitality||c.maxVitality<1)throw Error('Commander cap');
 }
 const gear=roster.flatMap(c=>c.equippedArtifactIds);if(new Set(gear).size!==gear.length)throw Error('Artifact allocated twice');
 return roster;
}
export function commanderChoice({side,roster,active,round,index,enemy,plan,mode='ordered'}){
 const current=roster[active],explicit=plan?.[round];
 if(explicit!==undefined){const next=roster.findIndex(c=>c.instanceId===String(explicit));if(next<0)return {next:active,reason:'UNKNOWN_COMMANDER'};if(side.switchLocked&&next!==active)return {next:active,reason:'SWITCH_LOCKED'};if(roster[next].vitality<=0)return {next:active,reason:'COMMANDER_EXHAUSTED'};return {next,reason:'MANUAL'};}
 if(side.switchLocked)return {next:active,reason:'LOCKED'};
 const available=roster.map((c,i)=>({c,i})).filter(x=>x.i!==active&&x.c.vitality>0);
 if(!available.length)return {next:active,reason:'NO_RESERVE'};
 if(current.vitality<=0)return {next:available[0].i,reason:'EXHAUSTED'};
 if(mode==='ordered')return current.mana<=current.maxMana*.20&&available[0].c.mana>current.mana?{next:available[0].i,reason:'ORDERED_RESERVE'}:{next:active,reason:'HOLD'};
 if(mode==='adaptive'){
  const score=c=>{const p=index.heroes[c.heroId],usable=c.equippedArtifactIds.filter(id=>{const a=index.artifacts[id];return a?.status==='MAPPED'&&canEquip(a,p,{level:c.level,ownedArtifactIds:c.ownedArtifactIds}).ok&&a.manaCost!=null&&a.manaCost<=c.mana});
   return c.vitality/Math.max(1,c.maxVitality)*.5+c.mana/Math.max(1,c.maxMana)*.5+(p.physical??0)*.0002+usable.length*.35;
  };
  const best=available.sort((a,b)=>score(b.c)-score(a.c)||a.i-b.i)[0];
  if(score(best.c)>score(current)+.30)return {next:best.i,reason:'AI_RESOURCE_ADVANTAGE'};
 }return {next:active,reason:'HOLD'};
}
export function chooseStance({requested='balanced',own,enemy,tactical,wall,side}){
 if(requested!=='auto'){if(!TACTICAL_STANCES[requested])throw Error('Unknown stance');return requested}
 if(side===0&&wall?.hp>0)return 'siege';
 if(own<enemy*.65||tactical.counter<-.12)return 'guard';
 if(tactical.counter>.12||own>enemy*1.4)return 'assault';
 return 'balanced';
}
export function createWall(siege){
 if(!siege)return null;const hp=siege.hp,armor=siege.armor??0;
 if(!Number.isSafeInteger(hp)||hp<1||!Number.isFinite(armor)||armor<0)throw Error('Invalid siege');
 return {hp,maxHp:hp,armor,evidence:'SIMULATED'};
}
export function hitWall(wall,stacks,dict,stance){
 if(!wall?.hp)return 0;
 const attack=stacks.reduce((n,s)=>n+s.count*s.attack*(dict[s.id].lane==='siege'?3:dict[s.id].lane==='rear'?.45:.65),0);
 return Math.min(wall.hp,Math.max(0,Math.floor(attack*(stance==='siege'?1.35:1)/(12+wall.armor))));
}
export function applyCommanderFatigue(commander,loss,initial){
 const damage=Math.min(commander.vitality,Math.floor(commander.maxVitality*clamp(loss/Math.max(1,initial),0,1)*.7));
 return {...commander,vitality:commander.vitality-damage,damage};
}
