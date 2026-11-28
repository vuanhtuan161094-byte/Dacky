// P2 artifact round engine. Troop counts are separate from hero vitality/mana.
// Phase ordering and unverified formula choices are provisional simulation policies.
export function createArmyArtifactEngine(){
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const norm=v=>String(v??'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const nonneg=(v,label)=>{if(!Number.isSafeInteger(v)||v<0)throw Error('Invalid '+label);return v};
 function canEquip(artifact,hero,{level,ownedArtifactIds}={}){
  if(!artifact||!hero)return {ok:false,reason:'UNKNOWN_ID'};
  if(artifact.requiredLevel===null||!artifact.occupation)return {ok:false,reason:'UNKNOWN_REQUIREMENTS'};
  const lv=level??hero.baseLevel;
  if(!Number.isInteger(lv)||lv<artifact.requiredLevel)return {ok:false,reason:'LEVEL'};
  if(norm(artifact.occupation)!=='moi nghe'&&norm(artifact.occupation)!==norm(hero.occupation))return {ok:false,reason:'OCCUPATION'};
  if(artifact.ownerIds.length&&!artifact.ownerIds.includes(hero.id))return {ok:false,reason:'EXCLUSIVE_OWNER'};
  if(ownedArtifactIds&&!ownedArtifactIds.includes(artifact.id))return {ok:false,reason:'NOT_OWNED'};
  return {ok:true};
 }
 function resolveArtifactRound({index,sides,round=1,policy={}}){
  if(!index?.artifacts||!index?.heroes||!Array.isArray(sides)||sides.length!==2||!Number.isInteger(round)||round<1)throw Error('Invalid artifact round');
  const opts={conversionFraction:.25,conversionRatio:1,enableSimulatedConversion:false,unknownManaCost:null,modifierMin:-.95,modifierMax:3,...policy};
  if(!Number.isFinite(opts.conversionFraction)||opts.conversionFraction<0||opts.conversionFraction>1||!Number.isFinite(opts.conversionRatio)||opts.conversionRatio<0||opts.conversionRatio>10||!Number.isFinite(opts.modifierMin)||!Number.isFinite(opts.modifierMax)||opts.modifierMin<-.99||opts.modifierMin>0||opts.modifierMax<0||opts.modifierMax>10)throw Error('Invalid policy');
  if(opts.unknownManaCost!==null&&(!Number.isSafeInteger(opts.unknownManaCost)||opts.unknownManaCost<0))throw Error('Invalid simulated mana policy');
  const events=[];const event=(type,side,data={})=>events.push({seq:events.length+1,round,type,side,...data});
  const units=sides.map((s,i)=>{
   const hero=index.heroes[s.heroId];if(!hero)throw Error('Unknown source hero '+s.heroId);
   const troops=nonneg(s.troops,'troops'),initialTroops=nonneg(s.initialTroops,'initial troops'),mana=nonneg(s.mana,'mana'),maxMana=nonneg(s.maxMana,'max mana'),vitality=nonneg(s.vitality,'vitality'),maxVitality=nonneg(s.maxVitality,'max vitality');
   if(troops>initialTroops||mana>maxMana||vitality>maxVitality||maxVitality<1)throw Error('Resource outside cap');
   const equipped=Array.isArray(s.equippedArtifactIds)?s.equippedArtifactIds.map(String):[];
   if(new Set(equipped).size!==equipped.length)throw Error('Duplicate equipped artifact');
   return {side:i,heroId:hero.id,level:s.level??hero.baseLevel,troops,initialTroops,mana,maxMana,vitality,maxVitality,artifactId:s.artifactId==null?null:String(s.artifactId),equippedArtifactIds:equipped,ownedArtifactIds:s.ownedArtifactIds?.map(String),switchLocked:Boolean(s.switchLocked)&&troops>0,modifiers:{attack:0,defense:0},flags:{skipAttack:false,blockAttack:false,reflectLethal:false,floorOne:false,spellSuppressed:false,artifactSuppressed:false,dispelSpells:false,sealedPassives:[]}};
  });
  const initial=units.map(u=>({...u}));
  const plans=units.map((u,i)=>{
   if(!u.artifactId||!u.troops||!u.vitality)return null;
   const item=index.artifacts[u.artifactId];
   const eligible=canEquip(item,index.heroes[u.heroId],{level:u.level,ownedArtifactIds:u.ownedArtifactIds});
   const cost=item?.manaCost??opts.unknownManaCost;
   let reason=!eligible.ok?eligible.reason:!u.equippedArtifactIds.includes(u.artifactId)?'NOT_EQUIPPED':item.status!=='MAPPED'?'UNMAPPED':cost===null?'UNKNOWN_MANA_COST':u.mana<cost?'MANA':null;
   if(reason){event('artifactRejected',i,{artifactId:u.artifactId,reason});return null}
   if(item.ops.some(o=>o.kind==='convert')&&!opts.enableSimulatedConversion){event('artifactRejected',i,{artifactId:item.id,reason:'CONVERSION_POLICY_REQUIRED'});return null}
   u.mana-=cost;event('artifactCast',i,{artifactId:item.id,name:item.name,manaCost:cost,manaEvidence:item.manaCost===null?'SIMULATED':'VERIFIED_MOBILE',evidence:item.evidence});return item;
  });
  // Simultaneous cancellation phase: both spells spend mana; mutually cancelling artifacts both lose their effects.
  const canceled=plans.map((p,i)=>Boolean(p&&plans[1-i]?.ops.some(o=>o.kind==='cancelArtifact')));
  for(let i=0;i<2;i++)if(canceled[i]){units[i].flags.artifactSuppressed=true;event('artifactCanceled',i,{artifactId:plans[i].id,by:plans[1-i].id})}
  const troopDelta=[0,0],setVitality=[null,null];
  for(let i=0;i<2;i++){
   const plan=plans[i],own=units[i],enemy=units[1-i];if(!plan||canceled[i])continue;
   for(const o of plan.ops){
    const target=o.side==='enemy'?enemy:own;
    if(o.condition==='enemyAtLeastTwiceOwn'&&!(initial[i].troops>0&&initial[1-i].troops>=2*initial[i].troops))continue;
    if(o.condition==='equippedCompanion'&&(own.heroId!==o.heroId||!own.equippedArtifactIds.includes(o.artifactId)||!canEquip(index.artifacts[o.artifactId],index.heroes[own.heroId],{level:own.level,ownedArtifactIds:own.ownedArtifactIds}).ok))continue;
    if(o.kind==='modifier'){target.modifiers[o.stat]+=o.ratio;event('modifier',i,{targetSide:target.side,stat:o.stat,ratio:o.ratio,artifactId:plan.id})}
    else if(o.kind==='troopLoss'||o.kind==='troopRecover'){
     const suppression=o.kind==='troopRecover'?Math.min(.30,Math.max(0,Number(sides[1-target.side].troopRecoverySuppression)||0)):0;
     const amount=Math.floor(initial[target.side].troops*o.ratio*(1-suppression)+1e-9);
     if(suppression)event('combatSkillRecoverySuppression',1-target.side,{targetSide:target.side,ratio:suppression,skill:'Truy kích',evidence:'LIVE_UI_RATIO_SIMULATED_ARTIFACT_RECOVERY_BRIDGE'});
     troopDelta[target.side]+=(o.kind==='troopLoss'?-amount:amount);event('troopEffect',i,{targetSide:target.side,requested:o.kind==='troopLoss'?-amount:amount,ratio:o.ratio,artifactId:plan.id});
    }else if(o.kind==='cancelArtifact')event('cancelArtifactIntent',i,{targetSide:enemy.side});
    else if(o.kind==='cancelSpell'||o.kind==='silenceSpell'){enemy.flags.spellSuppressed=true;event(o.kind,i,{targetSide:enemy.side})}
    else if(o.kind==='dispelSpells'){for(const u of units)u.flags.dispelSpells=true;event('dispelSpells',i,{targetSides:[0,1]})}
    else if(o.kind==='lockSwitch'){enemy.switchLocked=true;event('switchLock',i,{targetSide:enemy.side,until:'TROOPS_ZERO'})}
    else if(o.kind==='setVitalityBoth'){setVitality[0]=o.value;setVitality[1]=o.value;event('setVitality',i,{targetSides:[0,1],value:o.value})}
    else if(o.kind==='sealPassive'){enemy.flags.sealedPassives.push(o.name);event('sealPassive',i,{targetSide:enemy.side,name:o.name})}
    else if(['skipAttack','blockAttack','reflectLethal','floorOne'].includes(o.kind)){own.flags[o.kind]=true;event(o.kind,i)}
    else if(o.kind==='durability'||o.kind==='loyalty'){event('settlementIntent',i,{targetSide:target.side,heroId:target.heroId,kind:o.kind,amount:o.amount,artifactId:plan.id,scope:o.kind==='durability'?'ALL_EQUIPPED_GEAR':'ACTIVE_HERO',requiresIdempotentSaveSettlement:true})}
    else if(o.kind==='convert'){
     const from=o.from,to=o.to,cap=to==='mana'?own.maxMana:own.maxVitality,min=from==='vitality'?1:0;
     const spend=Math.min(Math.max(0,own[from]-min),Math.floor(own[from]*opts.conversionFraction),opts.conversionRatio>0?Math.floor((cap-own[to])/opts.conversionRatio):0);
     const gain=Math.floor(spend*opts.conversionRatio);own[from]-=spend;own[to]+=gain;event('convert',i,{from,to,spend,gain,evidence:'SIMULATED'});
    }else throw Error('Unhandled artifact operation '+o.kind);
   }
  }
  for(let i=0;i<2;i++){const u=units[i],before=u.troops;u.troops=clamp(before+troopDelta[i],0,u.initialTroops);if(troopDelta[i])event('troopDelta',i,{requested:troopDelta[i],actual:u.troops-before,remaining:u.troops});if(setVitality[i]!==null)u.vitality=clamp(setVitality[i],0,u.maxVitality);for(const k of ['attack','defense'])u.modifiers[k]=clamp(u.modifiers[k],opts.modifierMin,opts.modifierMax);if(!u.troops)u.switchLocked=false}
  return {round,sides:units,events,evidence:'MIXED',policy:{...opts},phase:'ARTIFACT_RESOLVED'};
 }
 function resolveArtifactStrikes(prepared,losses){
  if(prepared?.phase!=='ARTIFACT_RESOLVED'||!Array.isArray(losses)||losses.length!==2)throw Error('Invalid strike phase');
  const units=prepared.sides.map(u=>({...u,modifiers:{...u.modifiers},flags:{...u.flags}})),events=prepared.events.map(e=>({...e}));
  const log=(type,side,detail={})=>events.push({seq:events.length+1,round:prepared.round,type,side,...detail});
  // losses[i] is incoming ordinary troop loss to side i, computed by the caller AFTER modifiers.
  const raw=losses.map((n,i)=>nonneg(n,'incoming loss '+i));
  const direct=units.map((u,i)=>{if(!u.troops||!units[1-i].troops||units[1-i].flags.skipAttack||u.flags.blockAttack)return 0;const cap=u.flags.floorOne&&u.troops>1?u.troops-1:u.troops;return Math.min(cap,raw[i])});
  const reflected=[0,0];
  for(let i=0;i<2;i++)if(units[i].flags.reflectLethal&&units[i].troops>0&&direct[i]>=units[i].troops){reflected[1-i]+=direct[i];log('reflectLethal',i,{targetSide:1-i,amount:direct[i]})}
  for(let i=0;i<2;i++){const u=units[i],before=u.troops;const cap=u.flags.floorOne&&before>1?before-1:before;const applied=Math.min(cap,direct[i]+reflected[i]);u.troops=before-applied;if(!u.troops)u.switchLocked=false;log('strikeLoss',i,{incoming:raw[i],direct:direct[i],reflected:reflected[i],actual:applied,remaining:u.troops})}
  return {...prepared,sides:units,events,phase:'STRIKES_RESOLVED'};
 }
 return {canEquip,resolveArtifactRound,resolveArtifactStrikes};
}
const api=createArmyArtifactEngine();
export const canEquip=api.canEquip;
export const resolveArtifactRound=api.resolveArtifactRound;
export const resolveArtifactStrikes=api.resolveArtifactStrikes;
