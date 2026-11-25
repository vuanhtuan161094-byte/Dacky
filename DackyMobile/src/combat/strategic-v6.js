import { LEGACY_PROGRESSION_FACTS } from './legacy-progression-facts.js';
const source=LEGACY_PROGRESSION_FACTS.tables.theurgy.rows;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const specs={
 4551:['own','buff','production',.05],4552:['own','buff','populationGrowth',.01],
 4553:['enemy','delta','morale',-1],4554:['own','delta','morale',1],
 4555:['own','buff','wallDefense',.05],4556:['own','delta','loyalty',3],
 4557:['enemy','troopLoss','troops',.01],4558:['enemy','buff','marchSpeed',-.05],
 4559:['own','buff','antiScout',.10],4560:['enemy','intel','scout',1],
 4561:['own','flag','peace',1],4562:['enemy','buff','marchSpeed',-.25],
 4563:['own','buff','defense',.20],4564:['enemy','flag','blockTraining',1],
 4565:['own','buff','marchSpeed',.20],4566:['enemy','buff','production',-.20],
 4568:['enemy','flag','blockMagic',1]
};
export const STRATEGIC_POLICY=Object.freeze({durationUnitSeconds:3600,evidence:'SIMULATED'});
export function strategicCatalog(){return source.map(row=>({row,rule:specs[row.ID]??null,status:specs[row.ID]?'DEV_MAPPED':'HOLD',evidence:'SIMULATED'}));}
export function strategicEffects(city,now){
 const out={};for(const e of city.effects??[]){if(e.expiresAt<=now)continue;
  if(e.kind==='flag')out[e.key]=1;else out[e.key]=clamp((out[e.key]??0)+e.value,-.8,1);
 }return out;
}
export function castStrategic({world,casterId,targetId,spellId,castId,now,policy=STRATEGIC_POLICY}){
 const fail=reason=>({ok:false,reason,world});const row=source.find(r=>r.ID===spellId),spec=specs[spellId];
 if(!row||!spec)return fail('UNKNOWN_OR_HOLD');
 if(typeof castId!=='string'||!castId||!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(policy.durationUnitSeconds)||policy.durationUnitSeconds<1)return fail('INVALID_REQUEST');
 if((world.receipts??[]).includes(castId))return fail('DUPLICATE_CAST');
 const hero=world.casters[casterId],city=world.cities[targetId];if(!hero||!city)return fail('UNKNOWN_TARGET');
 const origin=world.cities[hero.cityId];if(!origin||origin.ownerId!==hero.ownerId)return fail('INVALID_CASTER_CITY');
 const [scope,kind,key,value]=spec;
 if((scope==='own')!==(hero.ownerId===city.ownerId))return fail('TARGET_SCOPE');
 if(!Number.isFinite(hero.energy)||hero.energy<row.enegyNeed)return fail('ENERGY');
 if(!Number.isInteger(hero.spellTier)||hero.spellTier<row.level)return fail('TIER');
 if(strategicEffects(origin,now).blockMagic)return fail('SEALED');
 if(scope==='enemy'&&strategicEffects(city,now).peace&&kind!=='intel')return fail('PEACE');
 const next=structuredClone(world),h=next.casters[casterId],t=next.cities[targetId];h.energy-=row.enegyNeed;
 const events=[{type:'strategicCast',spellId,castId,targetId,energy:row.enegyNeed,evidence:'MIXED'}];
 if(kind==='delta'){if(!Number.isFinite(t[key]))return fail('MISSING_FIELD');t[key]=clamp(t[key]+value,0,100)}
 else if(kind==='troopLoss'){if(!t.troops)return fail('MISSING_FIELD');for(const [id,count] of Object.entries(t.troops)){if(!Number.isSafeInteger(count)||count<0)return fail('INVALID_TROOPS');t.troops[id]=count-Math.floor(count*value)}}
 else if(kind==='intel'){events.push({type:'scoutReport',targetId,blocked:Boolean(strategicEffects(t,now).antiScout),troops:strategicEffects(t,now).antiScout?null:{...t.troops}})}
 else {t.effects=(t.effects??[]).filter(e=>e.expiresAt>now&&e.spellId!==spellId);t.effects.push({spellId,kind,key,value,expiresAt:now+row.duration*policy.durationUnitSeconds})}
 next.receipts=[...(next.receipts??[]),castId];return {ok:true,world:next,events,evidence:'SIMULATED'};
}
