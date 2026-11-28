// P1: source rules from research/live-client/database/{hero-growth,events}.json.
// Server-side gaps remain explicit; no invented source IDs or free paid rewards.
export const MATRIX_TIERS=Object.freeze([{name:'Sử Thi',count:12,points:2},{name:'Truyền Thuyết',count:12,points:4},{name:'Thần Thánh',count:13,points:8}]);
export const COMBAT_SKILLS=Object.freeze(['Truy kích','Tử chiến','Mưu lược','Ban phúc','Trùng sinh','Né chiêu']);
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
export function matrixRule(item){
 const name=norm(item?.name),desc=norm([item?.mobileDescription,item?.effect].join(' '));
 if(!name.startsWith('ao hoa')||!desc.includes('ma tran'))return null;
 const text=norm([item.name,item.mobileDescription,item.effect,item.mobileQuality].join(' '));
 const exact=MATRIX_TIERS.find(t=>text.includes(norm(t.name)));
 const mapped=exact??MATRIX_TIERS.find(t=>t.points===({tim:2,cam:4,do:8,kim:8,than:8})[norm(item.mobileQuality)])??MATRIX_TIERS[0];
 return {points:mapped?.points??null,tier:mapped?.name??null,evidence:exact?'LIVE_UI_TIER':'SIMULATED_QUALITY_JOIN'};
}
export function matrixStats(hero,items){
 const ids=[...new Set(hero?.matrices??[])],byId=new Map(items.map(i=>[i.id,i])),counts={},unknown=[];
 let points=0;for(const id of ids){const rule=matrixRule(byId.get(id));if(!rule?.points){unknown.push(id);continue;}
 const tier=MATRIX_TIERS.find(t=>t.name===rule.tier);if((counts[tier.name]??0)>=tier.count){unknown.push(id);continue;}
 counts[tier.name]=(counts[tier.name]??0)+1;points+=tier.points;}
 return {physical:points,arcane:points,strategy:points,counts,unknown};
}
export function ascensionItem(items){return items.find(i=>norm(i.name)==='lenh phi thang'&&i.mobileSourceId!=null);}
export function ascensionQuote(state,hero,items){const item=ascensionItem(items);return {itemId:item?.id??null,gold:100000,available:!!hero&&!hero.ascended&&hero.level>=80&&!hero.assigned&&!state.queues?.march&&state.resources.gold>=100000&&!!item&&state.items.includes(item.id)};}
export function normalizeLiveHero(h){
 h.ascended=h.ascended===true;h.deified=h.ascended&&h.deified===true;h.divineLevel=h.deified?Math.min(10,Math.max(1,Math.floor(Number(h.divineLevel)||1))):0;
 h.ascensionRetained=Object.fromEntries(['physical','arcane','strategy'].flatMap(k=>Number.isFinite(h.ascensionRetained?.[k])&&h.ascensionRetained[k]>=0?[[k,Math.floor(h.ascensionRetained[k])]]:[]));
 h.combatSkillPoints=Math.max(0,Math.floor(Number(h.combatSkillPoints)||0));
 h.combatSkills=Object.fromEntries(COMBAT_SKILLS.flatMap(name=>{const row=h.combatSkills?.[name];return row&&Number.isSafeInteger(row.level)&&row.level>=1?[[name,{level:Math.min(25,row.level),advanced:row.advanced===true}]]:[]}));
 h.activeCombatSkill=Object.hasOwn(h.combatSkills,h.activeCombatSkill)?h.activeCombatSkill:null;
 if(!h.matrices?.includes(h.activeMatrix))h.activeMatrix=null;
}
export function hoanHiBonus(count){return count>=6?.30:count>=4?.15:count>=2?.10:0;}
export function isHoanHi(name){return norm(name).includes('hoan hi');}
export function dropBonusForHeroes(heroes,sets,scope){
 if(!['Dã địa','Tiên Sơn','Thăm dò','Tìm kiếm'].includes(scope))return 0;
 return Math.max(0,...heroes.map(h=>Math.max(0,...sets(h).filter(s=>isHoanHi(s.name)).map(s=>hoanHiBonus(s.count)))));
}
// Event framework: schedule, eligibility, receipt and immutable claim. Reward tables
// must be supplied from verified records or explicit local policy; absent data stays locked.
// Local play policy only: replace individual fields as original evidence arrives.
export const LOCAL_GROWTH=Object.freeze({deifyGold:150000,rebirthBaseGold:80000,rebirthGoldStep:20000,rebirthCap:5,divineGold:30000,divineCap:10,skillLearn:15000,skillAdvanced:25500,skillUpgradeBase:900,skillMax:25,skillBattleWin:600,skillBattleLoss:100,skillTraining:150});
export function growthQuote(s,h,kind){
 const idle=!!h&&!h.assigned&&!s.queues?.march;
 let gold=0,eligible=false;
 if(kind==='deify'){gold=LOCAL_GROWTH.deifyGold;eligible=idle&&h.ascended&&!h.deified;}
 if(kind==='rebirth'){gold=LOCAL_GROWTH.rebirthBaseGold+LOCAL_GROWTH.rebirthGoldStep*(h?.rebirths||0);eligible=idle&&h.ascended&&h.level>=59&&(s.levels?.foundry||0)>=1&&(h.rebirths||0)<LOCAL_GROWTH.rebirthCap;}
 if(kind==='divine'){gold=LOCAL_GROWTH.divineGold*(h?.divineLevel||1);eligible=idle&&h.deified&&(h.divineLevel||0)<LOCAL_GROWTH.divineCap;}
 return {gold,available:eligible&&(s.resources?.gold||0)>=gold,evidence:'SIMULATED_LOCAL_POLICY'};
}
export function skillQuote(h,name,kind){const row=h?.combatSkills?.[name],level=row?.level||0,points=kind==='learn'?LOCAL_GROWTH.skillLearn:kind==='advanced'?LOCAL_GROWTH.skillAdvanced:LOCAL_GROWTH.skillUpgradeBase*(level+1);return {points,available:COMBAT_SKILLS.includes(name)&&(h?.combatSkillPoints||0)>=points&&(kind==='learn'?!row:kind==='advanced'?!!row&&!row.advanced:!!row&&level<LOCAL_GROWTH.skillMax)};}
export function skillBattlePolicy(h){const name=h?.activeCombatSkill,row=h?.combatSkills?.[name];return {name:row?name:null,level:row?.level||0,evidence:'SIMULATED_LOCAL_POLICY'};}
const resource=(key,count)=>({resource:key,count});
const LOCAL_EVENT_RULES=Object.freeze({
 loan_chien:{daily:true,action:'Đạt 3 chiến thắng',stat:'victories',goal:3,rewardTable:[resource('jade',3),resource('gold',1500)]},
 first_topup:{action:'Quà khởi đầu offline',rewardTable:[resource('jade',5),resource('gold',1200)]},
 sale_11_11:{action:'Đổi quà bằng linh ngọc',cost:{jade:8},rewardTable:[resource('gold',5000),resource('food',3000)]},
 black_friday:{daily:true,action:'Gói tiếp tế offline',cost:{jade:2},rewardTable:[resource('gold',1200),resource('iron',600)]},
 hoan_hi_set:{action:'Đổi bộ Hoan Hỉ',cost:{jade:20},special:'hoan_hi',rewardTable:[]},
 loc_dai_mat_tang:{daily:true,action:'Quay miễn phí',random:true,rewardTable:[resource('gold',800),resource('jade',1),resource('food',1800)]},
 tuan_du_than_linh:{daily:true,action:'Tuần du',random:true,rewardTable:[resource('timber',1200),resource('stone',1200),resource('gold',900)]},
 diem_danh_8:{daily:true,action:'Điểm danh',streak:true,rewardTable:[resource('gold',500),resource('jade',1)]},
 qua_moi_ngay:{daily:true,action:'Nhận quà ngày',rewardTable:[resource('food',800),resource('gold',300)]},
 mieu_hoi:{daily:true,action:'Tham gia 1 trận',stat:'battles',goal:1,rewardTable:[resource('jade',1),resource('gold',700)]},
 dua_top:{daily:true,action:'Đạt 5 chiến thắng',stat:'victories',goal:5,rewardTable:[resource('jade',5)]},
 bao_long:{daily:true,action:'Đổi Ảo Hóa',cost:{jade:3},special:'matrix',rewardTable:[]}
});
export const LIVE_EVENTS=Object.freeze([
 ['loan_chien','Loạn Chiến','LIVE_UI'],['first_topup','Quà Lớn Nạp Đầu','LIVE_UI'],['sale_11_11','Sale 11.11','LIVE_UI'],['black_friday','Black Friday','LIVE_UI'],['hoan_hi_set','Gói Hoan Hỉ','LIVE_UI'],['loc_dai_mat_tang','Lộc Đài Mật Tàng','PUBLIC_CLIENT'],['tuan_du_than_linh','Tuần Du Thần Linh','PUBLIC_CLIENT'],['diem_danh_8','Điểm Danh 8 Ngày','PUBLIC_CLIENT'],['qua_moi_ngay','Quà Tặng Mỗi Ngày','PUBLIC_CLIENT'],['mieu_hoi','Miếu Hội','PUBLIC_CLIENT'],['dua_top','Đua Top','PUBLIC_CLIENT'],['bao_long','Bảo Long Doanh Tài','PUBLIC_CLIENT']
].map(([id,name,evidence])=>Object.freeze({id,name,evidence,...LOCAL_EVENT_RULES[id]})));
export function normalizeLiveEvents(s){const old=s.gameplay.liveEvents??{};s.gameplay.liveEvents={receipts:[...new Set((Array.isArray(old.receipts)?old.receipts:[]).filter(x=>typeof x==='string'))],progress:old.progress&&typeof old.progress==='object'&&!Array.isArray(old.progress)?old.progress:{}};return s.gameplay.liveEvents;}
export function eventQuote(s,def,now){
 const day=Math.floor(now/86400000),receipt=def.id+':'+(def.daily?day:'once'),within=(!Number.isFinite(def.startAt)||now>=def.startAt)&&(!Number.isFinite(def.endAt)||now<def.endAt);
 const rewards=def.rewardTable,eligible=(!def.stat||(s.stats?.[def.stat]||0)>=def.goal)&&Object.entries(def.cost||{}).every(([k,v])=>(s.resources?.[k]||0)>=v);
 const claimed=s.gameplay?.liveEvents?.receipts?.includes(receipt);
 return {receipt,available:within&&eligible&&(def.special||Array.isArray(rewards)&&rewards.length>0)&&!claimed,rewards,claimed,day};
}
export function claimLiveEvent(s,def,now,grant){const q=eventQuote(s,def,now);if(!q.available)throw Error('Chưa đủ điều kiện hoặc đã nhận thưởng');const rewards=def.random?[q.rewards[(Math.abs(Math.imul(q.day+1,2654435761))>>>0)%q.rewards.length]]:q.rewards;grant(rewards);normalizeLiveEvents(s).receipts.push(q.receipt);}
