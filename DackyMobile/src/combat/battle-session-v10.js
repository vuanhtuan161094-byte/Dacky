// Immutable turn-command session. Recompute deterministic prefix, never settle before completion.
import { resolveLegacyDuel } from './legacy-duel.js';
import { createSourceDuelHero } from './hero-progression.js';
export const SESSION_STANCES=Object.freeze(['auto','balanced','assault','guard','siege']);
const clone=x=>structuredClone(x);
export function createBattleSession(runtime,input){
 if(!input.battleId||!Array.isArray(input.sides)||input.sides.length!==2)throw Error('Invalid battle session');
 const base=clone(input),maxRounds=base.policy?.maxRounds??12;
 if(!Number.isInteger(maxRounds)||maxRounds<1||maxRounds>100)throw Error('Invalid round cap');
 let commands=[],result=null,finished=false;
 function snapshot(){return {battleId:base.battleId,round:commands.length,maxRounds,finished,commands:clone(commands),result:result?clone(result):null};}
 function step(command={}){
  if(finished)throw Error('Battle already finished');
  const c=clone(command);if(c.stance!==undefined&&!SESSION_STANCES.includes(c.stance))throw Error('Invalid stance');
  if(c.artifactId!==undefined&&c.artifactId!==null&&typeof c.artifactId!=='string')throw Error('Invalid artifact');
  if(c.switchTo!==undefined&&typeof c.switchTo!=='string')throw Error('Invalid commander');
  if(c.challenge!==undefined&&typeof c.challenge!=='boolean')throw Error('Invalid challenge');
  const next=[...commands,c],sides=clone(base.sides),a=sides[0];
  a.commanderMode='manual';a.switchPlan={...(a.switchPlan??{})};a.roundCommands={...(a.roundCommands??{})};
  for(let i=0;i<next.length;i++){const x=next[i],round=i+1;a.roundCommands[round]=x;if(x.switchTo!==undefined)a.switchPlan[round]=x.switchTo;}
  const out=runtime.army({...base,sides,policy:{...base.policy,enableTacticsV8:true,enableTacticsV10:true,maxRounds:next.length}});
  if(out.rounds.length!==next.length)throw Error('Unexpected session prefix');
  if(result&&JSON.stringify(out.rounds.slice(0,-1))!==JSON.stringify(result.rounds))throw Error('Battle history diverged');
  commands=next;result=out;finished=commands.length>=maxRounds||out.sides.some(s=>s.troops===0)||['RETREAT','SQUAD_END'].includes(out.termination);
  return snapshot();
 }
 return {snapshot,step};
}
export function commanderDuel({index,sides,seed,round}){
 const f=sides.map((s,i)=>{const h=createSourceDuelHero(index.heroes[s.heroId],{level:s.level??index.heroes[s.heroId].baseLevel},{instanceId:'duel-'+i});return {id:h.id,stats:h.stats,hp:Math.min(h.stats.maxHp,s.vitality),mana:Math.min(h.stats.maxMana,s.mana),passiveIds:s.legacyDuelPassiveIds??[]};});
 const duel=resolveLegacyDuel({fighters:f,seed:(Number(seed)+round*7919)>>>0,maxRounds:3,enableManaBurst:true});
 const resources=duel.fighters.map((x,i)=>({vitality:Math.max(0,Math.min(sides[i].vitality,Math.ceil(x.hp))),mana:Math.max(0,Math.min(sides[i].mana,Math.floor(x.mana)))}));
 return {winner:duel.winner,resources,events:duel.events,rounds:duel.rounds,evidence:'SIMULATED'};
}
