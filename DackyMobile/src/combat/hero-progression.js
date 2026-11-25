import { createHeroCombatant } from './core.js';
// Source-linked occupation/starting level; all extrapolated growth/duel moves are design simulations.
export function sourceRecruitmentDefaults(profile){
 if(!profile||!Number.isInteger(profile.baseLevel)||profile.baseLevel<1)throw Error('Invalid source base level');
 return {level:profile.baseLevel,baseLevel:profile.baseLevel,root:profile.root,occupation:profile.occupation,evidence:'VERIFIED_MOBILE'};
}
export function sourceGrowth(profile,requestedLevel){
 if(!profile||!Number.isInteger(requestedLevel)||requestedLevel<1||requestedLevel>1000)throw Error('Invalid progression');
 for(const k of ['physical','arcane','strategy','vitality','spirit','baseLevel','root'])if(!Number.isFinite(profile[k])||profile[k]<0)throw Error('Missing source stat '+k);
 const delta=Math.max(0,requestedLevel-profile.baseLevel),factor=1+profile.root/100;
 const rates=profile.occupation==='Giáp sĩ'?[3,1,1,9,4]:profile.occupation==='Đạo sĩ'?[1,3,1,5,8]:[1,1,3,7,6];
 const keys=['physical','arcane','strategy','vitality','spirit'];
 return {requestedLevel,sourceBaseLevel:profile.baseLevel,levelBelowSourceBase:requestedLevel<profile.baseLevel,values:Object.fromEntries(keys.map((k,i)=>[k,Math.round(profile[k]+delta*rates[i]*factor)])),evidence:'MIXED',growthEvidence:'SIMULATED'};
}
export function createSourceDuelHero(profile,save={},options={}){
 const level=save.level??profile.baseLevel,progress=sourceGrowth(profile,level),v=progress.values;
 const stats={attack:Math.max(1,v.physical),magic:Math.max(1,v.arcane),defense:Math.max(1,Math.round(v.vitality*.20+v.strategy*.3)),resistance:Math.max(1,Math.round(v.spirit*.20+v.strategy*.3)),speed:Math.max(1,Math.round(10+v.strategy*.4)),maxHp:Math.max(1,v.vitality),maxMana:Math.max(0,v.spirit)};
 const common={kind:'skill',evidence:'SIMULATED',manaCost:Math.min(stats.maxMana,Math.max(1,Math.round(stats.maxMana*.12))),cooldown:2};
 const role=profile.occupation;
 const roleSkills=role==='Giáp sĩ'?[{...common,id:'sim:guard',name:'Hộ thân (mô phỏng)',effects:[{kind:'shield',target:'self',scale:'maxHp',amount:.18,duration:2}]},{...common,id:'sim:physical',name:'Dũng kích (mô phỏng)',effects:[{kind:'damage',target:'enemy',scale:'attack',amount:1.4}]}]:role==='Đạo sĩ'?[{...common,id:'sim:arcane',name:'Đạo pháp (mô phỏng)',effects:[{kind:'damage',target:'enemy',scale:'magic',amount:1.5}]},{...common,id:'sim:focus',name:'Tụ pháp (mô phỏng)',effects:[{kind:'modifier',target:'self',stat:'magic',amount:.20,duration:2}]}]:[{...common,id:'sim:aid',name:'Trợ trận (mô phỏng)',effects:[{kind:'heal',target:'ally',scale:'maxHp',amount:.18},{kind:'shield',target:'ally',scale:'maxHp',amount:.12,duration:2}]},{...common,id:'sim:strategy',name:'Mưu trận (mô phỏng)',effects:[{kind:'modifier',target:'enemy',stat:'attack',amount:-.20,duration:2},{kind:'damage',target:'enemy',scale:'magic',amount:1.0}]}];
 // Do not turn exclusive artifact references into free personal skills.
 const validatedRules=(options.skills??[]).filter(s=>s?.id&&s.evidence);
 return {id:String(options.instanceId??save.id??profile.id),name:profile.name,stats,skills:validatedRules.length?validatedRules:roleSkills,sourceHeroId:profile.id,exclusiveArtifactIds:[...profile.exclusiveArtifactIds],progress,evidence:'MIXED',skillEvidence:validatedRules.length?'RULE_SCOPED':'SIMULATED'};
}
