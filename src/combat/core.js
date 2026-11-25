// Dacky Combat Core V0.1 — pure deterministic simulation; no save/UI mutation.
// Source attributes are factual inputs; formulas and timing remain SIMULATED.
export function createCombatCore(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), finite=(v,f=0)=>Number.isFinite(v)?v:f;
  const norm=v=>String(v??'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const value=v=>{if(typeof v==='number')return finite(v);let s=String(v??'').trim();if(/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');return /^-?\d+(?:\.\d+)?$/.test(s)?finite(Number(s)):null;};
  const rng=seed=>{let x=Number(seed)>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;}};
  const alive=a=>a.hp>0, evidence='SIMULATED', statsKeys=['attack','magic','defense','resistance','speed'];
  function readMobileStats(def){
    const rows=Array.isArray(def?.mobileBaseStats)?def.mobileBaseStats:[];
    const read=(...names)=>{const row=rows.find(x=>names.includes(norm(x.label)));const v=value(row?.value);return v===null?null:Math.max(0,v)};
    return {physical:read('dung vu','vu luc'),arcane:read('dao phap'),strategy:read('muu luoc'),vitality:read('the luc'),spirit:read('tinh luc')};
  }
  function deriveHeroStats(def,save={}){
    const base=readMobileStats(def),level=clamp(Math.floor(finite(save.level,1)),1,1000),growth=1+(level-1)*.085;
    const p=base.physical??Math.max(1,finite(def.attack,10)),m=base.arcane??Math.max(1,finite(def.wisdom,10)),s=base.strategy??Math.max(1,finite(def.wisdom,10)),v=base.vitality??Math.max(1,finite(def.defense,10)),sp=base.spirit??Math.max(1,finite(def.wisdom,10));
    const n=x=>Math.max(1,Math.round(x));
    return {attack:n((10+p)*growth),magic:n((10+m)*growth),defense:n((5+v*.6+s*.25)*growth),resistance:n((5+sp*.5+s*.3)*growth),speed:n(10+s*.4+level*.2),maxHp:n((80+v*8)*growth),maxMana:n(20+sp*2+level*3),sourceStats:base,evidence};
  }
  function validateEffect(e){
    if(!e||!['damage','heal','shield','modifier','status','cleanse','mana','periodic'].includes(e.kind)||!Number.isFinite(e.amount??0)||Math.abs(e.amount??0)>1e7)throw Error('Invalid effect');
    if(['damage','heal','shield','modifier','mana','periodic'].includes(e.kind)&&!Number.isFinite(e.amount))throw Error('Missing magnitude');
    if(e.kind==='modifier'&&(!statsKeys.includes(e.stat)||Math.abs(e.amount)>.9))throw Error('Invalid modifier');
    if(['modifier','status','periodic','shield'].includes(e.kind)&&(!Number.isInteger(e.duration)||e.duration<1||e.duration>100))throw Error('Invalid duration');
    if(e.kind==='status'&&!['silence','stun','sealArtifact'].includes(e.status))throw Error('Invalid status');
    if(e.kind==='periodic'&&!['damage','heal'].includes(e.tickKind))throw Error('Invalid periodic');
    if(!['self','enemy','ally','allEnemies','allAllies'].includes(e.target??'enemy'))throw Error('Invalid target');
    if(e.scale&&!['attack','magic','maxHp','maxMana','flat'].includes(e.scale))throw Error('Invalid scale');
    if(['damage','heal','shield','periodic'].includes(e.kind)&&e.amount<0)throw Error('Negative magnitude');
    return true;
  }
  function compileArtifact(item){
    const text=String(item?.mobileAbilityText??'').trim(),m=norm(text).replace(/[.!。]+$/,'').trim().match(/^(tang|giam)\s+(\d+(?:[.,]\d+)?)\s*%\s+(cong kich|tan cong|phong thu)\s+(?:cua\s+)?(ban than|than tien|quan ta|quan dich|doi phuong)$/);
    const unknown={id:String(item?.id??''),status:'UNKNOWN',text,effects:[],reason:'Requires explicit semantic mapping'};
    if(!m)return unknown;
    const amount=Number(m[2].replace(',','.'))/100;if(!(amount>0&&amount<=.9))return unknown;
    const enemy=['quan dich','doi phuong'].includes(m[4]),all=['quan ta','quan dich'].includes(m[4]);
    return {id:String(item.id),name:item.name,status:'PARTIAL',text,sourceId:item.mobileSourceId??null,valueEvidence:item.fieldEvidence?.mobileAbilityText??'UNKNOWN',timingEvidence:evidence,requiresScope:all?'army':'duel',effects:[{kind:'modifier',stat:m[3]==='phong thu'?'defense':'attack',amount:(m[1]==='giam'?-1:1)*amount,duration:1,target:all?(enemy?'allEnemies':'allAllies'):(enemy?'enemy':'self'),evidence}],manaCost:Number.isFinite(item.mobileManaCost)?Math.max(0,item.mobileManaCost):null,reason:'Magnitude from text; duration and timing simulated, explicit rule required'};
  }
  function createHeroCombatant(def,save={},options={}){
    if(!def?.id)throw Error('Missing hero definition');
    const stats=deriveHeroStats(def,save);
    const sourceAbilities=(def.mobileAbilities||[]).map((a,i)=>({id:`${def.id}:source:${i}`,name:a.name,description:a.description,rank:a.rank,status:'UNKNOWN'}));
    const rules=options.skillRules??{};
    const skills=sourceAbilities.filter(a=>Object.hasOwn(rules,a.id)).map(a=>({...rules[a.id],id:a.id,name:a.name,kind:'skill'}));
    const artifactAudit=options.artifact?compileArtifact(options.artifact):null;
    if(options.artifactRule&&options.artifact?.id)skills.push({...options.artifactRule,id:`artifact:${options.artifact.id}`,name:options.artifact.name,kind:'artifact'});
    if(!skills.some(s=>s.kind==='skill')){
      const {physical,arcane,strategy}=stats.sourceStats;
      const p=physical??stats.attack,m=arcane??stats.magic,s=strategy??0,role=s>Math.max(p,m)?'support':m>p?'magic':'attack';
      skills.push({id:`${def.id}:fallback:${role}`,name:role==='magic'?'Đạo pháp (mô phỏng)':role==='support'?'Hộ trận (mô phỏng)':'Dũng kích (mô phỏng)',kind:'skill',manaCost:8,cooldown:2,evidence,effects:[role==='support'?{kind:'shield',target:'ally',amount:.3,scale:'magic',duration:2}:{kind:'damage',target:'enemy',amount:1.25,scale:role==='magic'?'magic':'attack'}]});
    }
    return {id:String(options.instanceId??save.id??def.id),name:def.name??def.id,stats,skills,sourceAbilities,artifactAudit,evidence};
  }
  function resolveCombat({teams,seed=1,maxRounds=6,mode='duel'}){
    if(!['duel','army'].includes(mode)||!Array.isArray(teams)||teams.length!==2||teams.some(t=>!Array.isArray(t)||!t.length||t.length>64)||!Number.isInteger(maxRounds)||maxRounds<1||maxRounds>100)throw Error('Invalid battle');
    const ids=new Set(),actors=teams.flatMap((team,side)=>team.map(x=>{
      if(!x?.id||ids.has(String(x.id)))throw Error('Duplicate or missing combatant ID');ids.add(String(x.id));
      const stats={};for(const k of [...statsKeys,'maxHp','maxMana']){const v=x.stats?.[k];if(!Number.isFinite(v)||v<0||v>1e12||(k==='maxHp'&&v<1))throw Error('Invalid stat '+k);stats[k]=v}
      const skillIds=new Set(),skills=(x.skills??[]).map(s=>{if(!s.id||skillIds.has(s.id)||!Array.isArray(s.effects)||!s.effects.length||!Number.isFinite(s.manaCost)||s.manaCost<0||!Number.isInteger(s.cooldown)||s.cooldown<0||s.cooldown>100)throw Error('Invalid skill');skillIds.add(s.id);s.effects.forEach(validateEffect);return s});
      return {id:String(x.id),name:x.name??x.id,side,stats,hp:stats.maxHp,mana:stats.maxMana,skills,cooldowns:new Map(),effects:[],count:Math.max(1,Math.floor(finite(x.count,1)))};
    }));
    const random=rng(seed),events=[],rounds=[];let round=0,seq=0;
    const log=(type,actor,target,detail={})=>events.push({seq:++seq,round,type,actorId:actor?.id??null,targetId:target?.id??null,...detail});
    const stat=(a,k)=>Math.max(0,a.stats[k]*(1+clamp(a.effects.filter(e=>e.kind==='modifier'&&e.stat===k).reduce((n,e)=>n+e.amount,0),-.85,3)));
    const has=(a,s)=>a.effects.some(e=>e.kind==='status'&&e.status===s),members=side=>actors.filter(a=>a.side===side&&alive(a));
    const choose=list=>list.slice().sort((a,b)=>a.hp/a.stats.maxHp-b.hp/b.stats.maxHp||a.id.localeCompare(b.id))[0];
    const targets=(a,t)=>t==='self'?[a]:t==='allEnemies'?members(1-a.side):t==='allAllies'?members(a.side):[choose(members(t==='ally'?a.side:1-a.side))].filter(Boolean);
    const scaled=(a,e)=>Math.max(0,(e.amount??0)*(!e.scale||e.scale==='flat'?1:e.scale==='maxHp'||e.scale==='maxMana'?a.stats[e.scale]:stat(a,e.scale)));
    function damage(a,t,amount,damageType='physical',ignoreDefense=false){
      if(!alive(t))return;let pending=Math.max(0,amount*(ignoreDefense?1:100/(100+stat(t,damageType==='magic'?'resistance':'defense'))));const raw=pending;
      for(const s of t.effects.filter(e=>e.kind==='shield')){const n=Math.min(pending,s.remaining);pending-=n;s.remaining-=n;if(n)log('absorb',a,t,{amount:n})}
      t.effects=t.effects.filter(e=>e.kind!=='shield'||e.remaining>0);
      const actual=Math.min(t.hp,pending);t.hp-=actual;log('damage',a,t,{amount:actual,raw,damageType});if(!alive(t))log('fall',a,t);
    }
    function heal(a,t,amount){if(!alive(t))return;const n=Math.min(t.stats.maxHp-t.hp,amount);t.hp+=n;log('heal',a,t,{amount:n})}
    function apply(a,t,e,s){
      if(!alive(t))return;const amount=scaled(a,e);
      if(e.kind==='damage')damage(a,t,amount,e.damageType??(e.scale==='magic'?'magic':'physical'));
      else if(e.kind==='heal')heal(a,t,amount);
      else if(e.kind==='mana'){const before=t.mana;t.mana=clamp(before+e.amount,0,t.stats.maxMana);log('mana',a,t,{amount:t.mana-before})}
      else if(e.kind==='cleanse'){const before=t.effects.length;t.effects=t.effects.filter(v=>!(v.kind==='status'||v.kind==='periodic'&&v.tickKind==='damage'||v.kind==='modifier'&&v.amount<0));log('cleanse',a,t,{count:before-t.effects.length})}
      else {
        const key=JSON.stringify([a.id,s.id,e.kind,e.stat??e.status??e.tickKind??'']),old=t.effects.find(v=>v.key===key);
        const next={...e,key,sourceId:a.id,expires:round+e.duration,remaining:e.kind==='shield'?amount:undefined,tickAmount:e.kind==='periodic'?amount:undefined};
        if(old)Object.assign(old,next);else t.effects.push(next);
        log('effect',a,t,{kind:e.kind,stat:e.stat,status:e.status,amount:e.kind==='modifier'?e.amount:amount,duration:e.duration,skillId:s.id});
      }
    }
    for(round=1;round<=maxRounds&&members(0).length&&members(1).length;round++){
      const start=events.length;
      for(const a of actors.filter(alive)){a.effects=a.effects.filter(e=>round<e.expires);for(const e of a.effects.filter(e=>e.kind==='periodic')){const src=actors.find(x=>x.id===e.sourceId);if(e.tickKind==='heal')heal(src,a,e.tickAmount);else damage(src,a,e.tickAmount,'magic',true)}}
      const order=actors.filter(alive).sort((a,b)=>stat(b,'speed')-stat(a,'speed')||a.id.localeCompare(b.id));
      for(const a of order){
        if(!alive(a)||!members(1-a.side).length)continue;
        if(has(a,'stun')){log('skip',a,null,{reason:'stun'});continue}
        const s=a.skills.find(s=>a.mana>=s.manaCost&&(a.cooldowns.get(s.id)??0)<=round&&!has(a,'silence')&&!(s.kind==='artifact'&&has(a,'sealArtifact')));
        if(s){a.mana-=s.manaCost;a.cooldowns.set(s.id,round+s.cooldown+1);log('cast',a,null,{skillId:s.id,name:s.name,manaCost:s.manaCost,evidence:s.evidence??'UNKNOWN'});for(const e of s.effects)for(const t of targets(a,e.target??'enemy'))apply(a,t,e,s)}
        else{const t=choose(members(1-a.side));if(t)damage(a,t,stat(a,'attack')*(.9+random()*.2))}
      }
      rounds.push({round,events:events.slice(start),teams:[0,1].map(side=>actors.filter(a=>a.side===side).map(a=>({id:a.id,hp:a.hp,mana:a.mana,alive:alive(a)})))});
    }
    const totals=[0,1].map(side=>{const a=actors.filter(x=>x.side===side);return a.reduce((n,x)=>n+x.hp,0)/a.reduce((n,x)=>n+x.stats.maxHp,0)});
    const winner=totals[0]===totals[1]?null:totals[0]>totals[1]?0:1;
    const units=actors.map(a=>({id:a.id,side:a.side,hp:a.hp,maxHp:a.stats.maxHp,mana:a.mana,count:a.count,survivors:mode==='army'?Math.min(a.count,Math.ceil(a.hp/a.stats.maxHp*a.count)):alive(a)?1:0}));
    return {mode,seed,winner,victory:winner===0,rounds,events,units,evidence,termination:members(0).length&&members(1).length?'ROUND_LIMIT':'ELIMINATION'};
  }
  return {readMobileStats,deriveHeroStats,compileArtifact,createHeroCombatant,validateEffect,resolveCombat};
}
const core = createCombatCore();
export const readMobileStats = core.readMobileStats;
export const deriveHeroStats = core.deriveHeroStats;
export const compileArtifact = core.compileArtifact;
export const createHeroCombatant = core.createHeroCombatant;
export const validateEffect = core.validateEffect;
export const resolveCombat = core.resolveCombat;
