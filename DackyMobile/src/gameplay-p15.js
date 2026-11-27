import { BUILDINGS, HEROES, ITEMS, TROOPS, TECHNOLOGIES, LEGACY_QUESTS, MOBILE_SOURCE_DATABASE } from './catalog.js';
import { LEGACY_TROOP_REQUIREMENT_FACTS } from './legacy-troop-requirement-catalog.js';
import { LEGACY_BUZHOU_FLOORS, LEGACY_BUZHOU_FORMATIONS } from './legacy-buzhou-catalog.js';
import { LEGACY_PROGRESSION_FACTS } from './combat/legacy-progression-facts.js';
import { castStrategic, strategicCatalog, strategicEffects } from './combat/strategic-v6.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),num=n=>Math.max(0,Math.floor(Number(n)||0));
const norm=x=>String(x??'').normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().trim();
const byBuilding=new Map(BUILDINGS.filter(x=>x.mobileSourceId).map(x=>[Number(x.mobileSourceId),x]));
const byTech=new Map(TECHNOLOGIES.filter(x=>x.mobileSourceId).map(x=>[Number(x.mobileSourceId),x]));
const byItem=new Map(ITEMS.filter(x=>x.mobileSourceId).map(x=>[Number(x.mobileSourceId),x]));
const byGoods=new Map(ITEMS.filter(x=>x.fieldProvenance?.mobileSourceId?.sourceTable==='vat-pham').map(x=>[String(x.mobileSourceId),x]));
const byLegacyQuestGood=new Map(ITEMS.filter(x=>x.legacySourceId).map(x=>[String(x.legacySourceId),x]));
const goodsByName=new Map();for(const item of byGoods.values()){const key=norm(item.name),rows=goodsByName.get(key)??[];rows.push(item);goodsByName.set(key,rows);}
const heroesByName=new Map(HEROES.filter(x=>x.mobileSourceId).map(x=>[norm(x.name),x]));
const byTroop=new Map(TROOPS.filter(x=>x.mobileSourceId).map(x=>[Number(x.mobileSourceId),x]));
import { QUEST_CONDITIONS } from './quest-conditions-p16.js';
const quests=new Map(LEGACY_QUESTS.map(x=>[x.id,{...x,conditions:(QUEST_CONDITIONS[x.id]??[]).map(([sourceId,title,typeCode,data])=>({sourceId,title,typeCode,data}))}]));
const consumingQuestItems=new Map();
for(const q of quests.values())for(const c of q.conditions){if(c.typeCode!==1||c.data?.[1]!==5||c.data?.[2]!==0||c.data?.[0]!==1)continue;const item=byGoods.get(String(c.data[3]))||byLegacyQuestGood.get(String(c.data[3]));if(!item)continue;const list=consumingQuestItems.get(item.id)??[];list.push({questId:q.id,need:c.data[4]||1});consumingQuestItems.set(item.id,list);}
export function reservedQuestItemCount(s,itemId){const uses=consumingQuestItems.get(itemId)??[],day=Math.floor((Number(s.lastTickAt)||0)/86400000),claims=s.gameplay??{};let reserved=0;for(const use of uses){const q=quests.get(use.questId);if(!q)continue;const repeatable=/moi ngay|hang ngay|daily|每日|每天/.test(norm([q.title,q.target,q.brief,q.content].join(' ')));const claimed=repeatable?claims.questClaimDays?.[q.id]===day:(claims.questClaims??[]).includes(q.id);if(!claimed)reserved=Math.max(reserved,num(use.need));}return reserved;}
function goodsFromTitle(title){const match=norm(title).match(/^(.*?)\s+(\d+)\s*(?:cai|vien|quyen|con|bong|bo|qua|mam|canh|chai)$/);if(!match)return null;const rows=goodsByName.get(match[1])??[];return rows.length===1?{item:rows[0],count:Number(match[2])}:null;}
// Housing and the capital's civic level open a broad late-game population
// curve; the exact Mobile formula was absent, so this cap/growth adapter is
// intentionally marked SIMULATED in the dependency ledger.
export function populationCapacity(s){return Math.min(250000,Math.max(180,180+(num(s.levels.housing)+Object.values(s.cityPlots||{}).reduce((n,p)=>n+(p?.buildingId==='housing'?num(p.level):0),0))*1400+num(s.levels.citadel)*700+(Math.max(0,(s.cities?.length||1)-1))*350));}
export function trainingSourceQuote(s,t,count){const f=LEGACY_TROOP_REQUIREMENT_FACTS[t.id];if(!f)return null;const gates=f.trainingRequirements.value,unmet=[];for(const g of gates.buildings??[]){const id=g.runtimeBuildingId??(String(g.sourceNamedId)==='22'?'workshop':null);if(id&&(s.levels[id]??0)<g.level)unmet.push((BUILDINGS.find(b=>b.id===id)?.name??id)+' '+g.level);}
 for(const g of gates.technologies??[]){const id=g.runtimeTechnologyId;if(id&&(s.technologies[id]??0)<g.level)unmet.push(id+' '+g.level);}
 return {cost:Object.fromEntries(Object.entries(f.cost.value).map(([k,v])=>[k,v*count])),unmet,evidence:'VERIFIED_LEGACY'};}
export function sourceQuestObjectives(q){const sourceConditions=q.conditions??quests.get(q.id)?.conditions??[],primary=sourceConditions.filter(c=>c.typeCode===1);if(!primary.length){const rows=[];for(const c of sourceConditions.filter(x=>x.typeCode===0)){const [,kind,arg,n]=c.data||[];if(kind===7)rows.push({sourceId:c.sourceId,title:c.title,kind:'action',id:'dailyReward',need:1,evidence:'SIMULATED_LEGACY_TIMER'});else if(kind===3){const b=byBuilding.get(arg);if(b)rows.push({sourceId:c.sourceId,title:c.title,kind:'building',id:b.id,need:n,evidence:'SIMULATED_LEGACY_CONDITION_ADAPTER'});}else if(kind===11&&arg===10){const item=byItem.get(n);if(item)rows.push({sourceId:c.sourceId,title:c.title,kind:'action',id:`useItem:${item.id}`,need:1,evidence:'SIMULATED_LEGACY_CONDITION_ADAPTER'});}else if(kind===4)rows.push({sourceId:c.sourceId,title:c.title,kind:'official',need:arg,evidence:'SIMULATED_LEGACY_CONDITION_ADAPTER'});}const unique=[...new Map(rows.map(row=>[`${row.kind}:${row.id??row.need}`,row])).values()];return unique.length?unique:[{sourceId:`${q.id}:simulated`,title:q.target||q.title,kind:'action',id:'dailyReward',need:1,evidence:'SIMULATED_EMPTY_REQUIREMENT_ADAPTER'}];}return primary.map(c=>{const [consume,kind,arg,n,amount]=c.data;const base={sourceId:c.sourceId,title:c.title,evidence:'MIXED',consume:false};
 if(kind===3){const b=byBuilding.get(arg)??(arg===18?BUILDINGS.find(x=>x.id==='storehouse'):null);if(b)return {...base,kind:'building',id:b.id,need:n};}
 if(kind===14){const t=byTech.get(arg);if(t)return {...base,kind:'tech',id:t.id,need:n};}
 if(kind===9&&arg===0)return {...base,kind:'fame',need:n};
 if(kind===5&&arg===0){const item=byGoods.get(String(n));if(item)return {...base,kind:'item',id:item.id,need:amount,consume:consume===1,evidence:'VERIFIED_MOBILE_ID',titleEvidence:norm(c.title).includes(norm(item.name))?'NAME_MATCH':'SOURCE_ID_MATCH_NAME_VARIANT'};const simulated=byLegacyQuestGood.get(String(n));if(simulated)return {...base,kind:'item',id:simulated.id,need:amount||1,consume:consume===1,evidence:'SIMULATED_LEGACY_GOOD_BRIDGE'};const fallback=goodsFromTitle(c.title);if(fallback)return {...base,kind:'item',id:fallback.item.id,need:amount||fallback.count,consume:consume===1,evidence:'SIMULATED_EXACT_NAME_LINK'};}
 if(kind===5&&arg===1){const t=byTroop.get(n);if(t)return {...base,kind:'troop',id:t.id,need:amount,consume:consume===1};}
 if(kind===2){const res=['gold','food','timber','stone','iron'][arg];if(res&&n>0)return {...base,kind:'resource',id:res,need:n,consume:consume===1};if(res&&amount>0)return {...base,kind:'production',id:res,need:amount};if(arg===5)return {...base,kind:'populationCapacity',need:amount||n};}
 if(kind===4)return {...base,kind:'official',need:arg};
 if(kind===6&&arg===2)return {...base,kind:'cities',need:n};
 if(kind===6&&arg===4)return {...base,kind:'guild',need:n};
 if(kind===6&&arg===5)return {...base,kind:'captures',need:n};
 if(kind===6&&arg===7)return {...base,kind:'guildDonation',need:n,consume:false};
 if(kind===12&&[2,3,4,5].includes(arg))return {...base,kind:arg===4?'scoutRank':arg===5?'mountainRank':arg===3?'fieldOccupationRank':'fieldRank',need:n};
 if(kind===11){if(arg===4)return {...base,kind:'taxRate',need:n};if(arg===5)return {...base,kind:'laborRate',need:n};const actions={0:'settlePopulation',1:'bless',2:'sacrifice',3:'settlePopulation',11:'assignHero',14:'worldChat',15:'rename',16:'changeFlag',18:'recruit',21:'march',22:'trainHero',23:'allocatePotential',24:'march',25:'capture',26:'scout',28:'duel',29:'mountainMeeting',30:'leaveMountain',31:'scout',32:'march'};if(arg===33){const policy={1:'disciplineLabor',2:'relieveLabor',3:'collectLaborTaxes'}[n];if(policy)return {...base,kind:'action',id:policy,need:1,evidence:'SIMULATED_LEGACY_POLICY'};}if(arg===10){const item=byItem.get(n);if(item)return {...base,kind:'action',id:'useItem:'+item.id,need:1};}if(actions[arg])return {...base,kind:'action',id:actions[arg],need:1,evidence:'SIMULATED_LEGACY_ACTION_BRIDGE'};}
 if(kind===0){const title=norm(c.title),allZero=(c.data||[]).every(value=>Number(value)===0);if(/\b(online|dang nhap|len mang)\b|上线|登陆/.test(title))return {...base,kind:'action',id:'dailyReward',need:1,evidence:'SIMULATED_TITLE_ADAPTER'};const rank=[['遂师',1],['遂大夫',2],['下大夫',3],['中大夫',4],['上大夫',5],['司寇',6],['司士',7],['司空',8],['泰守',9],['thái thú',9]].find(([name])=>String(c.title).includes(name));if(rank)return {...base,kind:'official',need:rank[1],evidence:'SIMULATED_TITLE_ADAPTER'};if(title.includes('cuu te nan nhan bi thien tai'))return {...base,kind:'action',id:'settlePopulation',need:1,evidence:'SIMULATED_TITLE_ADAPTER'};const summon=String(c.title).replace(/^(triệu hồi|召唤|召回)\s*/i,'');const hero=heroesByName.get(norm(summon));if(hero)return {...base,kind:'hero',id:hero.id,need:1,evidence:'SIMULATED_EXACT_NAME_LINK'};const fallback=goodsFromTitle(c.title);if(fallback)return {...base,kind:'item',id:fallback.item.id,need:fallback.count,consume:false,evidence:'SIMULATED_EXACT_NAME_LINK'};if(allZero)return {...base,kind:'action',id:'dailyReward',need:1,evidence:'SIMULATED_ZERO_CONDITION_ADAPTER'};}
 return {...base,kind:'hold',need:1,evidence:'UNKNOWN'};});}
export function sourceQuestReward(q){const out={resources:{},fame:0,population:0,official:0,vouchers:0,morale:0,items:[],troops:{},unmapped:[],simulated:[]};for(const c of q.conditions??[]){if(c.typeCode!==2)continue;const [,kind,arg,n,amount]=c.data;const res=['gold','food','timber','stone','iron'][arg];if(kind===2&&res&&n>0)out.resources[res]=(out.resources[res]??0)+n;else if(kind===2&&arg===5&&n>0)out.population+=n;else if(kind===9&&arg===0)out.fame+=n;else if(kind===4&&arg>0)out.official=Math.max(out.official,arg);else if(kind===8&&arg>0){out.vouchers+=arg;out.simulated.push({sourceId:c.sourceId,kind:'SIMULATED_LEGACY_VOUCHER'});}else if(kind===6&&arg===11)out.morale+=n;else if(kind===0){const text=String(c.title||''),match=text.match(/民心(增加|减少)(\d+)/);const delta=match?Number(match[2])*(match[1]==='减少'?-1:1):0;if(delta)out.morale+=delta;else{out.resources.gold=(out.resources.gold||0)+100;out.simulated.push({sourceId:c.sourceId,kind:'SIMULATED_EVENT_REWARD'});}}else if(kind===5&&arg===0){const item=byGoods.get(String(n))||byLegacyQuestGood.get(String(n));if(item)out.items.push({id:item.id,count:amount||1,evidence:item.mobileSourceId?'VERIFIED_MOBILE_ID':'SIMULATED_LEGACY_GOOD_BRIDGE'});else out.unmapped.push(c.sourceId);}else if(kind===5&&arg===1){const troop=byTroop.get(n)||(/kỵ|ky|战车|戰車/i.test(String(c.title))?TROOPS.find(row=>row.id==='troop-10'):null);if(troop){out.troops[troop.id]=(out.troops[troop.id]??0)+amount;if(!byTroop.has(n))out.simulated.push({sourceId:c.sourceId,kind:'SIMULATED_CROSS_VERSION_CAVALRY_BRIDGE'});}else out.unmapped.push(c.sourceId);}else out.unmapped.push(c.sourceId);}return out;}
export function questQuote(s,id,production){
 const q=quests.get(id);if(!q)return null;
 const objectives=sourceQuestObjectives(q),m=s.gameplay??{},repeatable=/moi ngay|hang ngay|daily|每日|每天|每天/.test(norm([q.title,q.target,q.brief,q.content].join(' '))),day=Math.floor((Number(s.lastTickAt)||0)/86400000);
 const read=o=>{switch(o.kind){case 'building':return Math.max(s.levels[o.id]??0,...Object.values(s.cityPlots||{}).filter(p=>p.buildingId===o.id).map(p=>p.level));case 'tech':return s.technologies[o.id]??0;case 'hero':return s.heroes.some(h=>h.id===o.id)?1:0;case 'fame':return s.fame;case 'item':return s.items.filter(x=>x===o.id).length;case 'troop':return s.army[o.id]??0;case 'resource':return Math.floor(s.resources[o.id]??0);case 'production':return Math.floor(production(s)[o.id]??0);case 'populationCapacity':return populationCapacity(s);case 'taxRate':return m.taxRate===o.need?o.need:0;case 'laborRate':return m.laborRate===o.need?o.need:0;case 'official':return m.official??0;case 'cities':return s.cities.length;case 'guild':return s.world.guildLevel;case 'captures':return s.world.captures.length;case 'guildDonation':return m.guildDonation??0;case 'scoutRank':return m.scoutRank??0;case 'fieldRank':return m.fieldRank??0;case 'fieldOccupationRank':return m.fieldOccupationRank??0;case 'mountainRank':return m.mountainRank??0;case 'action':return m.actions?.[o.id]??0;default:return 0;}};
 const rows=objectives.map(o=>({...o,current:read(o)})),hold=!rows.length||rows.some(o=>o.kind==='hold'),detail=sourceQuestReward(q),hasSourceReward=Object.keys(detail.resources).length>0||detail.items.length>0||Object.keys(detail.troops).length>0||detail.fame>0||detail.population>0||detail.official>0||detail.vouchers>0||detail.morale!==0;
 return {id,title:q.title,target:q.target,rows,hold,repeatable,claimed:repeatable?m.questClaimDays?.[id]===day:(m.questClaims??[]).includes(id),ready:!hold&&rows.every(o=>o.current>=o.need),reward:hasSourceReward?{...detail.resources,...(detail.vouchers?{questVouchers:detail.vouchers}:{}),...(detail.population?{population:detail.population}:{}),...(detail.official?{official:detail.official}:{}),...(detail.morale?{morale:detail.morale}:{})}:{gold:repeatable?120:80+rows.length*30,food:repeatable?120:50+rows.length*20},rewardDetail:detail,rewardEvidence:'MIXED_SIMULATED_INTERPRETATION',sourceConditions:q.conditions?.length??0};
}
export function claimSourceQuest(s,id,production){
 const q=questQuote(s,id,production);if(!q||q.claimed||!q.ready)throw Error('Nhiệm vụ chưa đủ điều kiện hoặc đang HOLD.');
 const resource={},items={},troops={};for(const o of q.rows.filter(x=>x.consume)){const dst=o.kind==='resource'?resource:o.kind==='item'?items:troops;dst[o.id]=(dst[o.id]??0)+o.need;}
 for(const [k,n] of Object.entries(resource))if(s.resources[k]<n)throw Error('Thiếu tài nguyên dâng nộp');
 for(const [k,n] of Object.entries(items))if(s.items.filter(x=>x===k).length<n)throw Error('Thiếu vật phẩm dâng nộp');
 for(const [k,n] of Object.entries(troops))if((s.army[k]??0)<n)throw Error('Thiếu quân dâng nộp');
 const rewardSlots=q.rewardDetail.items.reduce((n,r)=>n+r.count,0);if(s.items.length-Object.values(items).reduce((n,v)=>n+v,0)+rewardSlots>500)throw Error('Túi đồ chưa đủ chỗ nhận thưởng nhiệm vụ.');
 for(const [k,n] of Object.entries(resource))s.resources[k]-=n;for(const [k,n] of Object.entries(items))for(let i=0;i<n;i++)s.items.splice(s.items.indexOf(k),1);for(const [k,n] of Object.entries(troops))s.army[k]-=n;
 if(q.repeatable){s.gameplay.questClaimDays={...(s.gameplay.questClaimDays||{}),[id]:Math.floor((Number(s.lastTickAt)||0)/86400000)};}else if(!s.gameplay.questClaims.includes(id))s.gameplay.questClaims.push(id);
 s.fame+=q.rewardDetail.fame;s.population=Math.min(populationCapacity(s),s.population+q.rewardDetail.population);s.gameplay.official=Math.max(s.gameplay.official,Math.min(19,q.rewardDetail.official));s.gameplay.questVouchers=num(s.gameplay.questVouchers)+q.rewardDetail.vouchers;s.morale=clamp(s.morale+q.rewardDetail.morale,0,100);for(const r of q.rewardDetail.items)for(let i=0;i<r.count;i++)s.items.push(r.id);for(const [id,count] of Object.entries(q.rewardDetail.troops))s.army[id]=(s.army[id]??0)+count;return q.reward;
}
const speedups={'4001':['construction',900],'4002':['construction',3600],'4003':['construction',9000],'4004':['construction',28800],'4005':['construction',108000],'4011':['research',900],'4012':['research',3600],'4013':['research',10800],'4014':['research',36000],'4015':['research',129600],'4021':['training',.30],'4022':['training',.50],'4024':['construction',.35,'wall'],'4933':['march',.35]};
const prodItems={'4101':['food',86400],'4102':['food',604800],'4111':['timber',86400],'4112':['timber',604800],'4121':['stone',86400],'4122':['stone',604800],'4131':['iron',86400],'4132':['iron',604800],'4141':['gold',86400],'4142':['gold',604800]};
export function itemBuff(s,key,now){return (s.gameplay?.itemBuffs??[]).filter(x=>x.key===key&&x.expiresAt>now).reduce((n,x)=>Math.max(n,x.ratio),0);}
export function pendingBattleBuff(s,key){return (s.gameplay?.nextBattleBuffs??[]).filter(x=>x.key===key).reduce((n,x)=>Math.max(n,Number(x.ratio)||0),0);}
export function equipmentSlot(item){const slots={'Mũ':'helmet','Giáp':'armor','Đai':'belt','Giày':'boots','Tay':'gloves','Vũ Khí':'weapon','Cổ Khí':'relic','Cấm Khí':'relic2','Ngựa':'mount'};return slots[item?.mobileEquipmentSlot]??(item?.type==='vũ khí'?'weapon':item?.type==='giáp'?'armor':'artifact');}
const setBySource=new Map(MOBILE_SOURCE_DATABASE.categories['vat-pham'].filter(x=>x.details.some(d=>d.k==='kn'&&String(d.t).startsWith('Bộ '))).map(x=>{const b=x.details.find(d=>d.k==='kn'&&String(d.t).startsWith('Bộ '));return [String(x.id),{name:b.ds?.[0]?.t??b.t,thresholds:b.ds?.[0]?.n??[]}];}));
export function equipmentSets(h){const counts=new Map();for(const id of new Set(Object.values(h.equipment??{}).filter(Boolean))){if((h.combatDurability?.[id]??100)<=0)continue;const it=ITEMS.find(x=>x.id===id),s=setBySource.get(String(it?.mobileSourceId));if(s){const v=counts.get(s.name)??{...s,count:0};v.count++;counts.set(s.name,v)}}return [...counts.values()].map(s=>({...s,active:s.thresholds.filter(x=>Number(String(x).match(/^\d+/)?.[0]??Infinity)<=s.count)}));}
const sourceTimedBuffs=new Map([
  ['4405',{seconds:86400,effects:[{key:'heroXp',ratio:.25}],unsupported:[],simulated:['SIMULATED_IDLE_CULTIVATION_TO_HERO_XP_BOOST']}],
  ['4905',{seconds:72*3600,effects:[{key:'tradeThroughput',ratio:.05}],unsupported:[],simulated:['SIMULATED_SCHEDULED_CONVOY_TO_LOCAL_MARKET_THROUGHPUT']}],
  ['4501',{seconds:86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1}],unsupported:[]}],
  ['4502',{seconds:7*86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1}],unsupported:[]}],
  ['4503',{seconds:30*86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1}],unsupported:[]}],
  ['4504',{seconds:86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'captureChance',ratio:.05}],unsupported:[]}],
  ['4505',{seconds:7*86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'captureChance',ratio:.05}],unsupported:[]}],
  ['4506',{seconds:30*86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'captureChance',ratio:.05}],unsupported:[]}],
  ['4201',{seconds:86400,effects:[{key:'attack',ratio:.10}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4202',{seconds:72*3600,effects:[{key:'attack',ratio:.10}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4211',{seconds:86400,effects:[{key:'defense',ratio:.10}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4212',{seconds:72*3600,effects:[{key:'defense',ratio:.10}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8911',{seconds:8*3600,effects:[{key:'attack',ratio:.12}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8913',{seconds:8*3600,effects:[{key:'heroXp',ratio:.15}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4921',{seconds:72*3600,effects:[{key:'marchSpeed',ratio:.30}],unsupported:[]}],
  ['6302',{seconds:24*3600,effects:[{key:'marchCapacity',ratio:.05}],unsupported:[],runtimeScopeEvidence:'SIMULATED_ACCOUNT_CAPACITY'}],
  ['6420',{seconds:24*3600,effects:[{key:'marchCapacity',ratio:.05}],unsupported:[],runtimeScopeEvidence:'SIMULATED_ACCOUNT_CAPACITY'}],
  ['6421',{seconds:24*3600,effects:[{key:'heroXp',ratio:.15}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['6623',{seconds:24*3600,effects:[{key:'heroXp',ratio:.20}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8922',{seconds:3600,effects:[{key:'marchCapacity',ratio:.30}],unsupported:[],runtimeScopeEvidence:'SIMULATED_ACCOUNT_CAPACITY'}],
  ['6303',{seconds:24*3600,effects:[{key:'heroXp',ratio:.15}],unsupported:[]}],
  ['4922',{seconds:7*86400,effects:[{key:'marchSpeed',ratio:.30}],unsupported:[]}],
  ['4954',{seconds:8*3600,effects:[{key:'heroXp',ratio:1}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4953',{seconds:3600,effects:[{key:'heroXp',ratio:1}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['95702',{seconds:24*3600,effects:[{key:'heroXp',ratio:2}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  // Mobile describes three additional concurrent construction queues for
  // every owned city (five total in the UI) for 72 hours. The source specifies
  // that consecutive uses extend time; the runtime exposes the same five-slot
  // account limit through constructionQueueCapacity.
  ['4901',{seconds:3*86400,effects:[{key:'constructionQueueCapacity',ratio:5}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['6534',{seconds:30*86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1},{key:'constructionQueueCapacity',ratio:5},{key:'memberDiscount:acceleration',ratio:.20},{key:'memberDiscount:production',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['6535',{seconds:30*86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'captureChance',ratio:.05},{key:'memberDiscount:chest',ratio:.20},{key:'memberDiscount:quest',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['6536',{seconds:30*86400,effects:[{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'trainingTimeReduction',ratio:.25},{key:'memberDiscount:treasure',ratio:.20},{key:'memberDiscount:material',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8914',{seconds:3600,effects:[{key:'defense',ratio:.02}],exchangeTroopSourceId:'1002',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8915',{seconds:3600,effects:[{key:'defense',ratio:.04}],exchangeTroopSourceId:'1022',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8916',{seconds:3600,effects:[{key:'defense',ratio:.08}],exchangeTroopSourceId:'1012',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8917',{seconds:3600,effects:[{key:'defense',ratio:.16}],exchangeTroopSourceId:'1032',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8918',{seconds:3600,effects:[{key:'defense',ratio:.32}],exchangeTroopSourceId:'1033',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8919',{seconds:3600,effects:[{key:'defense',ratio:.60}],exchangeTroopSourceId:'1033',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8920',{seconds:3600,effects:[{key:'defense',ratio:1.2}],exchangeTroopSourceId:'1043',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['8921',{seconds:3600,effects:[{key:'defense',ratio:.80}],exchangeTroopSourceId:'1043',unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}],
  ['4913',{seconds:24*3600,effects:[{key:'marchCapacity',ratio:.10}],unsupported:[],runtimeScopeEvidence:'SIMULATED_ACCOUNT_CAPACITY',stackingEvidence:'SIMULATED_NO_REFRESH'}],
  ['8740',{seconds:7*86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1},{key:'constructionQueueCapacity',ratio:5},{key:'memberDiscount:acceleration',ratio:.20},{key:'memberDiscount:production',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8950',{seconds:86400,effects:[{key:'production',ratio:.25},{key:'storageCapacity',ratio:1},{key:'constructionQueueCapacity',ratio:5},{key:'memberDiscount:acceleration',ratio:.20},{key:'memberDiscount:production',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8951',{seconds:86400,effects:[{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'trainingTimeReduction',ratio:.25},{key:'memberDiscount:treasure',ratio:.20},{key:'memberDiscount:material',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8952',{seconds:86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'captureChance',ratio:.05},{key:'memberDiscount:chest',ratio:.20},{key:'memberDiscount:quest',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8738',{seconds:7*86400,effects:[{key:'heroXp',ratio:.25},{key:'marchSpeed',ratio:.25},{key:'captureChance',ratio:.05},{key:'memberDiscount:chest',ratio:.20},{key:'memberDiscount:quest',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8739',{seconds:7*86400,effects:[{key:'attack',ratio:.10},{key:'defense',ratio:.10},{key:'trainingTimeReduction',ratio:.25},{key:'memberDiscount:treasure',ratio:.20},{key:'memberDiscount:material',ratio:.20}],unsupported:[],simulated:['memberDiscount:20%']}],
  ['8931',{seconds:3600,effects:[{key:'heroVitality',ratio:.05},{key:'heroMana',ratio:.05},{key:'heroPhysical',ratio:.05},{key:'heroArcane',ratio:.05},{key:'heroStrategy',ratio:.05}],unsupported:[],stackingEvidence:'VERIFIED_MOBILE'}]
]);
const sourceBattleBuffs=new Map([
  ['4820',{effects:[{key:'attack',ratio:.15}],simulated:['PVP_ONLY_SOURCE_EFFECT_ADAPTED_TO_NEXT_ARMY_BATTLE']}],
  ['4821',{effects:[{key:'marchCapacity',ratio:.10}],simulated:['OUTPOST_DEPLOYMENT_ADAPTED_TO_NEXT_MARCH_CAPACITY']}],
  ['4822',{effects:[{key:'attack',ratio:.05}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4823',{effects:[{key:'defense',ratio:.05}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4824',{effects:[{key:'enemyAttackReduction',ratio:.05}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4825',{effects:[{key:'enemyDefenseReduction',ratio:.05}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4826',{effects:[{key:'artifactPower',ratio:.10}],simulated:['ARTIFACT_POWER_ADAPTED_TO_COMMANDER_BONUS']}],
  ['4827',{effects:[{key:'enemyArtifactPowerReduction',ratio:.10}],simulated:['ENEMY_ARTIFACT_POWER_ADAPTED_TO_COMMANDER_BONUS']}],
  ['4828',{effects:[{key:'enemyTroopLoss',ratio:.02}],simulated:['PER_ROUND_ATTRITION_ADAPTED_TO_BOUNDED_BATTLE_DAMAGE']}],
  ['4829',{effects:[{key:'enemyArtifactBlock',ratio:1}],simulated:['ARTIFACT_SEAL_APPLIES_TO_NEXT_ARMY_BATTLE']}],
  ['4830',{effects:[{key:'enemyTroopLoss',ratio:.10}],simulated:['PER_ROUND_ATTRITION_ADAPTED_TO_BOUNDED_BATTLE_DAMAGE']}],
  ['4831',{effects:[{key:'attack',ratio:.10}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4832',{effects:[{key:'defense',ratio:.10}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4833',{effects:[{key:'enemyAttackReduction',ratio:.10}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}],
  ['4834',{effects:[{key:'enemyDefenseReduction',ratio:.10}],simulated:['APPLIES_TO_NEXT_AVAILABLE_ARMY_BATTLE']}]
]);
const sourceHeroFlatBuffs=new Map([
  ['4812',{key:'heroFlatPhysical',amount:10,seconds:2*3600}],['4813',{key:'heroFlatArcane',amount:10,seconds:2*3600}],['4814',{key:'heroFlatStrategy',amount:10,seconds:2*3600}],
  ['4817',{key:'heroFlatPhysical',amount:30,seconds:8*3600}],['4818',{key:'heroFlatArcane',amount:30,seconds:8*3600}],['4819',{key:'heroFlatStrategy',amount:30,seconds:8*3600}]
]);
const sourceRootGifts=new Map([
  ['4955',{targetHeroSourceIds:['loi-chan-tu'],minimum:0,maximum:2,rootCap:45}],
  ['8011',{targetHeroSourceIds:['ti-ba-tinh'],minimum:10,maximum:10,rootCap:41}],
  ['8012',{targetHeroSourceIds:['cuu-dau-tri-ke-tinh'],minimum:10,maximum:10,rootCap:41}],
  ['8954',{minimum:1,maximum:3,rootCap:45,requiresRebirth:true}],
  ['95911',{targetHeroSourceIds:['ba-trung','ba-trieu','hung-dao-vuong','thanh-giong','ho-xuan-huong'],minimum:0,maximum:2,rootCap:50}]
]);
const sourceHeroRestores=new Map([
  ['4810',{resource:'vitality',amount:20}],['4815',{resource:'vitality',amount:100}],['4811',{resource:'mana',amount:20}],['4816',{resource:'mana',amount:100}],['95701',{resource:'vitality',full:true}],
  ['8912',{resource:'mana',amount:200}],['6422',{resource:'mana',full:true}]
]);
const sourceHeroResetItems=new Map([
  ['4911',{kind:'heroPotentialReset',itemsPerTenLevels:true}],['4920',{kind:'heroFullReset',itemsPerTenLevels:true}],
  ['8742',{kind:'heroFullReset',itemsPerTenLevels:true,requiresRebirth:true}],
  ['4951',{kind:'heroLevelStepReset',clear:'potential'}],['8741',{kind:'heroLevelStepReset',clear:'skill'}]
]);
const sourceGearProtections=new Map([
  ['4710',{operation:'enhance',failure:'downgradeOne',minimumRank:1,maximumRank:7}],
  ['4711',{operation:'enhance',failure:'preventDestroy',minimumRank:8}],
  ['4714',{operation:'socket',failure:'guarantee'}],
  ['4715',{operation:'socket',failure:'retainGem'}]
]);
export function gearProtectionRule(item){
 const sourceId=String(item?.mobileSourceId??'');
 const rule=sourceGearProtections.get(sourceId);
 return rule&&item?.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE'
  ?{...rule,kind:'gearProtection',sourceId,evidence:'VERIFIED_MOBILE',runtimeFormula:'SIMULATED_GEAR_FAILURE_POLICY'}
  :null;
}
const sourceRootCultivation=new Map([
 ['8955',{minimumRoot:50,minimum:1,maximum:5}],['8956',{minimumRoot:55,minimum:1,maximum:5}]
]);
const sourceOfficialSeals=new Map(Array.from({length:9},(_,index)=>{const sourceId=String(6225+index),minimumRank=index*2+1;return [sourceId,{minimumRank,maximumRank:minimumRank+1,quantityPerPromotion:1}]}));
const sourceTowerBooks=new Map([
 ['8700',{stats:{maxHp:.03},runtimeEffect:'SIMULATED_TOWER_HEALING_BRIDGE'}],
 ['8701',{stats:{attack:.15}}],['8702',{stats:{defense:.10}}],['8703',{stats:{magic:.15}}],['8704',{stats:{resistance:.10}}],
 ['8705',{reviveChance:.10,reviveHp:.20,runtimeEffect:'SIMULATED_TOWER_REVIVE'}],
 ['8706',{stats:{speed:.15},runtimeEffect:'SIMULATED_TOWER_DODGE_AS_SPEED'}],['8707',{stats:{defense:.15},runtimeEffect:'SIMULATED_TOWER_GUARD_AS_DEFENSE'}],
 ['8708',{stats:{attack:.15},runtimeEffect:'SIMULATED_TOWER_COUNTER_AS_ATTACK'}],['8709',{stats:{attack:.15},runtimeEffect:'SIMULATED_TOWER_CHAIN_AS_ATTACK'}],
 ['8710',{stats:{attack:.10,defense:.10}}],['8711',{stats:{magic:.10,resistance:.10}}],['8712',{stats:{attack:.10,resistance:.10}}],['8713',{stats:{magic:.10,defense:.10}}]
]);
const sourceHeroStatGems=new Map([
 ['7650',{stat:'defense',ratio:.03}],['7651',{stat:'defense',ratio:.09}],['7652',{stat:'defense',ratio:.20}],
 ['7662',{stat:'resistance',ratio:.03}],['7663',{stat:'resistance',ratio:.09}],['7664',{stat:'resistance',ratio:.20}],
 ['7665',{stat:'attack',ratio:.03}],['7666',{stat:'attack',ratio:.09}],['7667',{stat:'attack',ratio:.20}],
 ['7668',{stat:'magic',ratio:.03}],['7669',{stat:'magic',ratio:.09}],['7670',{stat:'magic',ratio:.20}],
 ['7671',{stat:'attack',amount:100,ratio:.08,socketColor:'red'}],['7672',{stat:'defense',amount:100,ratio:.10,socketColor:'red'}],['7673',{stat:'magic',amount:100,ratio:.08,socketColor:'red'}]
]);
const sourceHeroCombatGems=new Map([
 ['7653',{trait:'followUpAttack',chance:.01}],['7654',{trait:'followUpAttack',chance:.03}],['7655',{trait:'followUpAttack',chance:.05}],
 ['7656',{trait:'counterAttack',chance:.01}],['7657',{trait:'counterAttack',chance:.03}],['7658',{trait:'counterAttack',chance:.05}],
 ['7659',{trait:'dodge',chance:.01}],['7660',{trait:'dodge',chance:.03}],['7661',{trait:'dodge',chance:.05}],
 ['7674',{trait:'lifeSteal',ratio:.08}],['7675',{trait:'lifeSteal',ratio:.18}]
]);
const sourceEquipmentGems=new Map([
 ['7639',{kind:'equipmentStatGem',stats:{magic:.50}}],
 ['7641',{kind:'equipmentStatGem',stats:{attack:.15,magic:.15,defense:.15,resistance:.15}}],
 ['7643',{kind:'mountSpeedGem',ratio:.25,requiredSlot:'mount',socketColor:'blue'}],
 ['7647',{kind:'equipmentStatGem',stats:{attack:.03,magic:.03,defense:.03,resistance:.03}}],
 ['7649',{kind:'mountSpeedGem',ratio:.25,requiredSlot:'mount',socketColor:'blue'}]
]);
const sourceArmyCombatGems=new Map([
 ['7614',{effect:'counterBonus',sourceClass:'spear',targetClass:'cavalry',ratio:.05}],['7615',{effect:'counterBonus',sourceClass:'archer',targetClass:'spear',ratio:.05}],['7616',{effect:'counterBonus',sourceClass:'shield',targetClass:'archer',ratio:.05}],['7617',{effect:'counterBonus',sourceClass:'cavalry',targetClass:'shield',ratio:.05}],
 ['7618',{effect:'counterBonus',sourceClass:'spear',targetClass:'cavalry',ratio:.10}],['7619',{effect:'counterBonus',sourceClass:'archer',targetClass:'spear',ratio:.10}],['7620',{effect:'counterBonus',sourceClass:'shield',targetClass:'archer',ratio:.10}],['7621',{effect:'counterBonus',sourceClass:'cavalry',targetClass:'shield',ratio:.10}],
 ['7622',{effect:'criticalBonus',sourceClass:'spear',targetClass:'cavalry',ratio:.05}],['7623',{effect:'criticalBonus',sourceClass:'archer',targetClass:'spear',ratio:.05}],['7624',{effect:'criticalBonus',sourceClass:'shield',targetClass:'archer',ratio:.05}],['7625',{effect:'criticalBonus',sourceClass:'cavalry',targetClass:'shield',ratio:.05}],
 ['7626',{effect:'criticalBonus',sourceClass:'spear',targetClass:'cavalry',ratio:.10}],['7627',{effect:'criticalBonus',sourceClass:'archer',targetClass:'spear',ratio:.10}],['7628',{effect:'criticalBonus',sourceClass:'shield',targetClass:'archer',ratio:.10}],['7629',{effect:'criticalBonus',sourceClass:'cavalry',targetClass:'shield',ratio:.10}],
 ['7630',{effect:'firstRoundGuard',sourceClass:'shield',ratio:.05}],['7631',{effect:'firstRoundGuard',sourceClass:'shield',ratio:.10}],['7632',{effect:'firstRoundAttack',sourceClass:'archer',ratio:.05}],['7633',{effect:'firstRoundAttack',sourceClass:'archer',ratio:.10}],['7634',{effect:'classAttack',sourceClass:'cavalry',ratio:.05}],['7635',{effect:'classAttack',sourceClass:'cavalry',ratio:.10}],['7636',{effect:'firstRoundGuard',sourceClass:'shield',ratio:.25}],
 ['7642',{effect:'doubleDamageProc',ratio:.10,socketColor:'red'}]
]);
export function sourceGearGemRule(item){
 if(!item||String(item.mobileGroup||'')!=='Nguyên liệu')return null;
 const rule=sourceHeroStatGems.get(String(item.mobileSourceId));
 if(rule)return {kind:'heroStatGem',...rule,evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_HERO_STAT_GEM_ADAPTER',socketColorEvidence:rule.socketColor?'VERIFIED_'+rule.socketColor.toUpperCase()+'_SOCKET':'UNKNOWN_COLORLESS_RUNTIME_SOCKET'};
 const combat=sourceHeroCombatGems.get(String(item.mobileSourceId));
 if(combat){const socketColor=String(item.mobileSourceId)==='7674'?'blue':String(item.mobileSourceId)==='7675'?'red':null;return {kind:'heroCombatGem',...combat,sourceId:String(item.mobileSourceId),evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:combat.trait==='lifeSteal'?'SIMULATED_NORMAL_HIT_LIFESTEAL_ADAPTER':'SIMULATED_EXPECTED_DUEL_TRAIT_ADAPTER',socketColorEvidence:socketColor?'VERIFIED_'+socketColor.toUpperCase()+'_SOCKET':'UNKNOWN_COLORLESS_RUNTIME_SOCKET'};}
 const equipment=sourceEquipmentGems.get(String(item.mobileSourceId));
 if(equipment)return {...equipment,evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:equipment.kind==='mountSpeedGem'?'SIMULATED_MOUNT_GEM_MARCH_SPEED':'SIMULATED_EQUIPMENT_STAT_GEM',socketColorEvidence:equipment.socketColor?'VERIFIED_'+equipment.socketColor.toUpperCase()+'_SOCKET':'UNKNOWN_COLORLESS_RUNTIME_SOCKET'};
 const army=sourceArmyCombatGems.get(String(item.mobileSourceId));
 return army?{kind:'armyCombatGem',...army,sourceId:String(item.mobileSourceId),evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:army.effect==='doubleDamageProc'?'SIMULATED_EXPECTED_ARMY_DOUBLE_DAMAGE_ADAPTER':'SIMULATED_WEIGHTED_ARMY_GEM_ADAPTER',socketColorEvidence:army.socketColor?'VERIFIED_'+army.socketColor.toUpperCase()+'_SOCKET':'UNKNOWN_COLORLESS_RUNTIME_SOCKET'}:null;
}
export function itemUseRule(item){
 if(!item||item.type!=='vật phẩm')return null;
 const name=norm(item.name),d=norm(item.mobileDescription??''),sid=String(item.mobileSourceId);
 const legacySpell=Number(sid),spell=strategicCatalog().find(row=>row.row.ID===legacySpell&&row.rule&&item.mobileGroup==='Bảo vật');
 if(spell&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE'){
  const cooldown=norm(item.mobileDescription).match(/(\d+(?:[.,]\d+)?)\s*(?:gio|h)\s*(?:hoi chieu|cooldown)/);
  return {kind:'strategicScroll',spellId:legacySpell,scope:spell.rule[0],cooldownSeconds:Math.max(0,Math.floor((Number(cooldown?.[1]?.replace(',','.'))||0)*3600)),evidence:'MIXED',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_LEGACY_THEURGY_ADAPTER'};
 }
 if(sid==='4917')return {kind:'renameVoucher',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4916')return {kind:'flagVoucher',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4569')return {kind:'dispelStrategicCurse',spellId:4568,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_LOCAL_CURSE_DISPEL'};
 if(sourceOfficialSeals.has(sid))return {kind:'officialSeal',...sourceOfficialSeals.get(sid),evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_OFFICIAL_SEAL_PROMOTION'};
 if(sid==='6036')return {kind:'eventExchange',ingredients:[{sourceId:'6036',count:1},{sourceId:'6037',count:1},{sourceId:'6043',count:1},{sourceId:'6044',count:1}],rewardSourceId:'6039',evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_EVENT_EXCHANGE_QUANTITY'};
 if(sid==='4408')return {kind:'mountainRefresh',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeScopeEvidence:'SIMULATED_SELECTED_MOUNTAIN_DAILY_RESET'};
 if(sid==='4910')return {kind:'recruitmentRefresh',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4904')return {kind:'moraleReset',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',unsupported:['city unrest has no runtime field']};
 if(sid==='4404')return {kind:'fieldTripTicket',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_EXTRA_FIELD_VISIT'};
 if(sourceTowerBooks.has(sid))return {kind:'towerBook',sourceId:sid,towerEffects:{...sourceTowerBooks.get(sid)},evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description'};
 if(item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE'&&d.includes('mo khoa')&&d.includes('hinh dai dien')){
  if(d.includes('khung'))return {kind:'cosmeticUnlock',slot:'frame',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
  if(d.includes('bong bong'))return {kind:'cosmeticUnlock',slot:'chatBubble',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 }
 if(speedups[sid]){const [queue,amount,building]=speedups[sid];return {kind:'queueSpeedup',queue,amount,building,once:amount<1,evidence:'MIXED'};}
 if(prodItems[sid]){const [key,seconds]=prodItems[sid];return {kind:'timedBuff',key,seconds,ratio:.25,evidence:'MIXED'};}
 if(['4151','4152','4153'].includes(sid))return {kind:'timedBuff',key:'buildCost',seconds:86400,ratio:.30,levelCap:{4151:5,4152:8,4153:20}[sid],evidence:'MIXED'};
 if(['4507','4508','4509','4510'].includes(sid))return {kind:'resourcePack',amount:{4507:1000,4508:5000,4509:10000,4510:100000}[sid],evidence:'MIXED'};
 if(sid==='4400')return {kind:'timedBuff',key:'heroXp',seconds:604800,ratio:1,evidence:'MIXED'};
 if(['4401','4402','4403','8994'].includes(sid))return {kind:'heroTimedBuff',key:{4401:'heroArcane',4402:'heroPhysical',4403:'heroStrategy',8994:'heroPhysical'}[sid],ratio:{4401:.10,4402:.10,4403:.10,8994:.15}[sid],seconds:sid==='8994'?3600:72*3600,evidence:'VERIFIED_MOBILE',sourceId:sid};
 if(['4221','4223'].includes(sid))return {kind:'heroRestore',resource:sid==='4221'?'mana':'vitality',ratio:.30,evidence:'VERIFIED_MOBILE',sourceId:sid};
 if(sid==='4222')return {kind:'heroRestore',resource:'mana',full:true,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4224')return {kind:'heroRestore',resource:'vitality',full:true,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4225')return {kind:'heroRestore',resource:'mana',ratio:.50,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4903')return {kind:'populationPack',ratio:.20,minimum:100,evidence:'VERIFIED_MOBILE',sourceId:sid};
 if(sid==='8721'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'resourcePackFixed',resources:{gold:50_000},evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description'};
 if(sid==='4511'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'resourcePackChoice',resources:['food','timber','stone','iron','gold'],minimum:10_000,maximum:100_000,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_SEEDED_RESOURCE_AND_AMOUNT'};
 if(sid==='4918'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'demolishPlot',evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',refund:false};
 if(sid==='4027'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'tradeVoucher',throughputBonus:.10,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_NEXT_TRADE_THROUGHPUT'};
 const flatBuff=sourceHeroFlatBuffs.get(sid);
 if(flatBuff&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'timedBuffSet',effects:[{...flatBuff}],seconds:flatBuff.seconds,unsupported:[],evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',stackingEvidence:'VERIFIED_MOBILE'};
 const restore=sourceHeroRestores.get(sid);
 if(restore&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'heroRestore',...restore,evidence:'VERIFIED_MOBILE',sourceId:sid};
 const reset=sourceHeroResetItems.get(sid);
 if(reset&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {...reset,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',consumptionFormula:reset.itemsPerTenLevels?'SIMULATED_CEILING_LEVEL_PER_TEN':'VERIFIED_ONE_STEP'};
 const rootCultivation=sourceRootCultivation.get(sid);
 if(rootCultivation&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'heroRootGift',...rootCultivation,rootCap:150,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_ROOT_CULTIVATION_BRIDGE'};
 const rootGift=sourceRootGifts.get(sid);
 if(rootGift&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'heroRootGift',...rootGift,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_SEEDED_RANGE'};
 if(sid==='8957'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'heroPotentialGift',minimum:1,maximum:3,evidence:'VERIFIED_MOBILE',sourceId:sid,sourceTable:'vat-pham',sourceField:'Description',runtimeFormula:'SIMULATED_SEEDED_RANGE'};
 if(sid==='4961'&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {kind:'heroRootBoost',targetHeroSourceId:'ly-tinh',amount:21,evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',sourceRecordId:sid,stackingEvidence:'SIMULATED'};
 const sourcedBuff=sourceTimedBuffs.get(sid);
 if(sourcedBuff&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {...sourcedBuff,kind:'timedBuffSet',effects:sourcedBuff.effects.map(effect=>({...effect})),unsupported:[...(sourcedBuff.unsupported??[])],simulated:[...(sourcedBuff.simulated??[])],evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',stackingEvidence:sourcedBuff.stackingEvidence??'SIMULATED'};
 const battleBuff=sourceBattleBuffs.get(sid);
 if(battleBuff&&item.fieldEvidence?.mobileDescription==='VERIFIED_MOBILE')return {...battleBuff,kind:'nextBattleBuffSet',effects:battleBuff.effects.map(effect=>({...effect})),evidence:'VERIFIED_MOBILE',sourceTable:'vat-pham',sourceField:'Description',stackingEvidence:'SIMULATED_MAX_PER_EFFECT'};
 if(name.startsWith('ao hoa')&&d.includes('ma tran'))return {kind:'matrix',evidence:'MIXED'};
 if(/tang kinh nghiem|kinh nghiem than tien/.test(d)&&/\d/.test(d)){const n=d.match(/(?:tang|nhan)\s+([\d.,]+)\s+(?:diem\s+)?kinh nghiem/);if(n)return {kind:'heroXp',amount:num(n[1].replace(/[.,]/g,'')),evidence:'MIXED'};}
 if(item.mobileGroup==='Bảo rương'&&!item.mobileOpening?.rewards?.length)return {kind:'simulatedChest',evidence:'SIMULATED_MISSING_SOURCE_REWARD'};
 return null;
}
export function buzhouPlan(floor){const row=LEGACY_BUZHOU_FLOORS.find(x=>x.floorId===floor);if(!row)return null;const formation=LEGACY_BUZHOU_FORMATIONS.filter(x=>Number(x.FloorID)===floor).map(x=>({name:x.GeneralName,troopSourceId:String(x.LeadSoldierID),count:x.LeadSoldierNum,troopId:byTroop.get(Number(x.LeadSoldierID))?.id??null}));return {floor,minLevel:row.generalMinLevel,maxLevel:row.generalMaxLevel,minCount:row.generalMinNum,maxCount:row.generalMaxNum,lead:row.generalLeadPopulation,formation,evidence:'VERIFIED_LEGACY_REFERENCE'};}
function normalizeAssaults(value){return Object.fromEntries(Object.entries(value&&typeof value==='object'?value:{}).filter(([id,row])=>/^buzhou:[45]$/.test(id)&&row&&typeof row==='object'&&row.remaining&&typeof row.remaining==='object').map(([id,row])=>[id,{remaining:Object.fromEntries(Object.entries(row.remaining).filter(([unitId,count])=>/^legacy-npc-\d+$/.test(unitId)&&Number.isFinite(Number(count))&&Number(count)>0).map(([unitId,count])=>[unitId,Math.min(9_999_999,Math.floor(Number(count)))])),total:clamp(num(row.total),0,20_000_000)}]).filter(([,row])=>Object.keys(row.remaining).length));}
export function normalizeGameplay(s){const g=s.gameplay&&typeof s.gameplay==='object'?s.gameplay:{};s.gameplay={...g,questClaims:[...new Set((Array.isArray(g.questClaims)?g.questClaims:[]).filter(x=>quests.has(x)))],questClaimDays:Object.fromEntries(Object.entries(g.questClaimDays||{}).filter(([id,day])=>quests.has(id)&&Number.isSafeInteger(day))),questVouchers:num(g.questVouchers),tradeVouchers:clamp(num(g.tradeVouchers),0,100),fieldTripBonus:clamp(Math.floor(num(g.fieldTripBonus)),0,99),fieldTrips:g.fieldTrips&&Number.isSafeInteger(g.fieldTrips.day)&&Number.isSafeInteger(g.fieldTrips.used)?{day:clamp(g.fieldTrips.day,0,Number.MAX_SAFE_INTEGER),used:clamp(g.fieldTrips.used,0,100)}:null,endgameAssaults:normalizeAssaults(g.endgameAssaults),actions:g.actions&&typeof g.actions==='object'?g.actions:{},official:clamp(num(g.official),0,19),guildDonation:num(g.guildDonation),scoutRank:num(g.scoutRank),fieldRank:num(g.fieldRank),fieldOccupationRank:num(g.fieldOccupationRank),mountainRank:num(g.mountainRank),taxRate:clamp(num(g.taxRate??20),0,50),laborRate:clamp(num(g.laborRate??100),0,100),flag:String(g.flag??'周').slice(0,4),itemBuffs:(Array.isArray(g.itemBuffs)?g.itemBuffs:[]).filter(x=>x&&typeof x.key==='string'&&Number.isFinite(x.expiresAt)&&Number.isFinite(x.ratio)),nextBattleBuffs:(Array.isArray(g.nextBattleBuffs)?g.nextBattleBuffs:[]).filter(x=>x&&typeof x.key==='string'&&typeof x.sourceId==='string'&&Number.isFinite(x.ratio)).map(x=>({...x,ratio:clamp(x.ratio,0,1)})),itemCooldowns:Object.fromEntries(Object.entries(g.itemCooldowns||{}).filter(([id,until])=>/^\d+$/.test(id)&&Number.isFinite(until)&&until>0).map(([id,until])=>[id,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(until))])),strategic:{effects:Array.isArray(g.strategic?.effects)?g.strategic.effects:[],npc:g.strategic?.npc&&typeof g.strategic.npc==='object'?g.strategic.npc:{},receipts:Array.isArray(g.strategic?.receipts)?g.strategic.receipts:[]}};return s.gameplay;}
export function trackAction(s,action){const a=s.gameplay.actions;const inc=k=>a[k]=num(a[k])+1;inc(action.type);if(action.type==='useItem')inc('useItem:'+action.itemId);}
export function gameplayQuestList(){return [...quests.values()];}
export function strategicQuote(){return strategicCatalog();}
export function cityEffects(s,now){
 const out=strategicEffects({effects:s.gameplay?.strategic?.effects??[]},Math.floor(now/1000));
 for(const key of ['attack','defense','wallDefense','marchSpeed']){const bonus=itemBuff(s,key,now);if(bonus)out[key]=clamp((out[key]??0)+bonus,-.8,2);}
 return out;
}
export function npcEffects(s,id,now){return strategicEffects({effects:s.gameplay?.strategic?.npc?.[id]?.effects??[]},Math.floor(now/1000));}
export function castWorldSpell(s,{spellId,heroId,nodeId,now,combat}){
 const h=s.heroes.find(x=>x.id===heroId);
 if(!h||s.queues.march)throw Error('Thần tiên không sẵn sàng');
 const c=combat.commander(h,s),row=strategicCatalog().find(x=>x.row.ID===Number(spellId));
 if(!row?.rule)throw Error('Pháp thuật HOLD');
 const pouch=ITEMS.find(item=>String(item.mobileSourceId)==='4912'),pouchIndex=pouch?s.items.indexOf(pouch.id):-1;
 if(pouchIndex<0)throw Error('Thi triển pháp thuật cần Túi Gấm (4912); hãy mua tại Triều Ca Thị.');
 const own=row.rule[0]==='own',target=own?'capital':nodeId;
 if(!target||(!own&&s.world.captures.includes(target)))throw Error('Mục tiêu không hợp lệ');
 const g=s.gameplay.strategic,npc=g.npc?.[target]??{morale:80,loyalty:100,troops:{},effects:[]};
 const world={casters:{h:{cityId:'capital',ownerId:'p',energy:c.mana,spellTier:Math.min(10,Math.max(1,Math.floor(h.level/10)+1))}},cities:{capital:{ownerId:'p',morale:s.morale,loyalty:100,troops:s.army,effects:g.effects??[]},...(!own?{[target]:{ownerId:'npc',...npc}}:{})},receipts:g.receipts??[]};
 const castId='spell:'+s.profile.createdAt+':'+(++s.combatSequence),r=castStrategic({world,casterId:'h',targetId:target,spellId:Number(spellId),castId,now:Math.floor(now/1000)});
 if(!r.ok)throw Error(r.reason);
 s.items.splice(pouchIndex,1);
 h.combatMana=r.world.casters.h.energy;h.combatUpdatedAt=now;g.effects=r.world.cities.capital.effects??[];s.morale=r.world.cities.capital.morale;g.receipts=r.world.receipts;
 if(!own)g.npc[target]={...r.world.cities[target]};
 return r.events;
}
