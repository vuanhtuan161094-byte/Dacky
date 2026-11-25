import { sourceGrowth } from './hero-progression.js';
import { LEGACY_PROGRESSION_FACTS } from './legacy-progression-facts.js';
const int=(n,label,min=0)=>{if(!Number.isSafeInteger(n)||n<min)throw Error('Invalid '+label);return n};
export const PROGRESSION_POLICY=Object.freeze({maxLevel:150,maxRebirths:5,minRebirthLevel:60,rootGain:1,rebirthGold:1670000,evidence:'SIMULATED'});
export function xpForNextLevel(level){int(level,'level',1);return 100+34*level*level}
export function normalizeProgress(profile,save={},policy=PROGRESSION_POLICY){
 const base=int(profile.baseLevel,'baseLevel',1),level=int(save.level??base,'level',1);
 return {...save,level,xp:int(save.xp??0,'xp'),rebirths:int(save.rebirths??0,'rebirths'),root:int(save.root??profile.root,'root'),baseLevel:base,belowSourceBase:level<base,evidence:'MIXED',progressionEvidence:policy.evidence};
}
export function grantHeroXp(profile,save,amount,policy=PROGRESSION_POLICY){
 int(amount,'xp amount');const s=normalizeProgress(profile,save,policy),cap=Math.max(profile.baseLevel,int(policy.maxLevel,'maxLevel',1));let gained=0;
 if(s.level<cap){s.xp=int(s.xp+amount,'xp total');while(s.level<cap&&s.xp>=xpForNextLevel(s.level)){s.xp-=xpForNextLevel(s.level);s.level++;gained++}}
 if(s.level>=cap)s.xp=0;
 return {hero:s,levelsGained:gained,stats:sourceGrowth({...profile,root:s.root},s.level),evidence:'SIMULATED'};
}
export function quoteRebirth(profile,save,policy=PROGRESSION_POLICY){
 const s=normalizeProgress(profile,save,policy),reasons=[];
 if(s.level<policy.minRebirthLevel)reasons.push('LEVEL');if(s.rebirths>=policy.maxRebirths)reasons.push('REBIRTH_CAP');if(s.assigned||s.busy)reasons.push('BUSY');
 const rootRef=LEGACY_PROGRESSION_FACTS.tables.specialgengugeneralinfo.rows.find(r=>r.Name===profile.name)??null;
 return {ok:!reasons.length,reasons,gold:policy.rebirthGold,rootGain:policy.rootGain,resultLevel:profile.baseLevel,evidence:'SIMULATED',rootReference:rootRef};
}
export function rebirthHero(profile,save,gold,policy=PROGRESSION_POLICY){
 int(gold,'gold');const s=normalizeProgress(profile,save,policy),q=quoteRebirth(profile,s,policy);
 if(!q.ok||gold<q.gold)return {ok:false,reason:q.reasons[0]??'GOLD',hero:s,gold};
 return {ok:true,hero:{...s,level:q.resultLevel,xp:0,rebirths:s.rebirths+1,root:s.root+q.rootGain,belowSourceBase:false},gold:gold-q.gold,evidence:'SIMULATED'};
}
