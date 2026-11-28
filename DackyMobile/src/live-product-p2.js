// Offline reconstruction. Source observations: research/live-client/database/{events,collections}.json.
// Local parameters are deliberately isolated from the original economy and source IDs.
export const DAY=86400000;
const integer=(n,max=1e9)=>Math.min(max,Math.max(0,Math.floor(Number(n)||0)));
export const POOLS=Object.freeze([
 {id:'resource',name:'Kho tài nguyên',rewards:[{gold:800},{food:1800},{iron:900},{timber:1500}]},
 {id:'jade',name:'Kho linh ngọc',rewards:[{jade:1},{jade:2},{jade:3},{gold:1600}]},
 {id:'treasure',name:'Kho bảo vật',rewards:[{gold:1200},{jade:2},{token:2},{treasure:1}]}
]);
export const COLLECTIONS=Object.freeze([
 {id:'heroes',name:'Phong Thần Lục',steps:[3,8,15,30,60],stat:'attack',per:2},
 {id:'artifacts',name:'Vạn Bảo Các',steps:[3,8,15,30,60],stat:'magic',per:2},
 {id:'matrices',name:'Ma Trận Đồ',steps:[2,6,12,24,37],stat:'defense',per:2},
 {id:'campaign',name:'Thiên Hạ Chí',steps:[3,10,25,50,73],stat:'all',per:1}
]);
export const FESTIVAL=Object.freeze([
 ['pray','Cầu Nguyện','free',1],['dig','Đào Ba Tấc Đất','scout',1],['weapon','Vũ Khí Tuyệt Thế','itemsEquipped',1],['duel','Tỉ Thí','duels',1],['war','Chiến Lệnh','battles',1],['shop','Tiệm Tầm Bảo','exchange',0],['login','Điểm Danh','free',1],['accum','Quà Tích Lũy','victories',3]
]);
const dayOf=now=>Math.floor(now/DAY);
const seed=(a,b)=>((Math.imul(a+1,1664525)+Math.imul(b+1,1013904223))>>>0);
export function productState(s){
 const g=s.gameplay??(s.gameplay={}),p=g.liveProduct??{};
 const o=p&&typeof p==='object'&&!Array.isArray(p)?p:{};
 return g.liveProduct={day:Number.isSafeInteger(o.day)?o.day:-1,baseline:o.baseline&&typeof o.baseline==='object'?o.baseline:{},pool:POOLS.some(x=>x.id===o.pool)?o.pool:'resource',spins:integer(o.spins,6),totalSpins:integer(o.totalSpins),spinClaims:[...new Set((Array.isArray(o.spinClaims)?o.spinClaims:[]).filter(n=>[5,10,20].includes(n)))],position:integer(o.position,11),travelUsed:integer(o.travelUsed,1),travelDue:integer(o.travelDue,Number.MAX_SAFE_INTEGER),lastRoll:integer(o.lastRoll,6),tokens:integer(o.tokens),festivalClaims:[...new Set((Array.isArray(o.festivalClaims)?o.festivalClaims:[]).filter(id=>FESTIVAL.some(x=>x[0]===id)))],collectionClaims:[...new Set((Array.isArray(o.collectionClaims)?o.collectionClaims:[]).filter(k=>COLLECTIONS.some(c=>c.steps.some(n=>k===c.id+':'+n))))],artifactArchive:[...new Set((Array.isArray(o.artifactArchive)?o.artifactArchive:[]).filter(x=>typeof x==='string'))].slice(0,1000),registered:o.registered===true,warBase:integer(o.warBase),warClaimed:o.warClaimed===true,rankClaims:[...new Set((Array.isArray(o.rankClaims)?o.rankClaims:[]).filter(x=>typeof x==='string'))].slice(0,60),choice:['hero','treasure'].includes(o.choice)?o.choice:null,starterDay:integer(o.starterDay,3),starterLast:Number.isSafeInteger(o.starterLast)?o.starterLast:-1};
}
export function refreshProduct(s,now,items=[]){
 const p=productState(s),day=dayOf(now);
 if(p.day!==day){p.day=day;p.spins=0;p.travelUsed=0;p.festivalClaims=[];p.baseline={...s.stats,scout:s.gameplay?.actions?.scout||0};p.registered=false;p.warClaimed=false;p.warBase=s.stats?.victories||0;}
 const artifacts=new Set(items.filter(i=>i.type==='pháp bảo').map(i=>i.id));
 p.artifactArchive=[...new Set([...p.artifactArchive,...(s.items||[]),...(s.heroes||[]).flatMap(h=>Object.values(h.equipment||{}))].filter(id=>artifacts.has(id)))];
 return p;
}
export function collectionCounts(s){const p=s.gameplay?.liveProduct??{};return {heroes:s.heroes?.length||0,artifacts:p.artifactArchive?.length||0,matrices:new Set((s.heroes||[]).flatMap(h=>h.matrices||[])).size,campaign:s.world?.captures?.length||0};}
export function collectionBonus(s){const p=s.gameplay?.liveProduct??{},bonus={attack:0,magic:0,defense:0};for(const c of COLLECTIONS)for(const n of c.steps)if(p.collectionClaims?.includes(c.id+':'+n)){for(const k of Object.keys(bonus))if(c.stat===k||c.stat==='all')bonus[k]+=c.per;}return bonus;}
export function progressFor(s,key){const p=s.gameplay?.liveProduct??{},n=key==='scout'?(s.gameplay?.actions?.scout||0):s.stats?.[key]||0;return Math.max(0,n-(p.baseline?.[key]||0));}
export const RANKS=Object.freeze([{id:'power',name:'Đua Chiến Lực',steps:[3,10,25,50]},{id:'official',name:'Đua Quan Chức',steps:[1,5,10,19]},{id:'heroes',name:'Đua Thần Tiên',steps:[3,8,15,30]}]);
export function rankCount(s,id){return id==='power'?s.stats?.victories||0:id==='official'?s.gameplay?.official||0:s.heroes?.length||0;}
export function productAction(s,a,now,{items=[],grant,debit,grantChoice}){
 const p=refreshProduct(s,now,items),day=p.day;
 switch(a.type){
 case 'selectPrizePool':if(p.spins||!POOLS.some(x=>x.id===a.pool))throw Error('Kho thưởng đã khóa trong ngày.');p.pool=a.pool;break;
 case 'spinPrize':{if(p.spins>=6)throw Error('Hết lượt hôm nay');if(p.spins)debit({jade:2});const pool=POOLS.find(x=>x.id===p.pool);grant(pool.rewards[seed(day,p.spins)%pool.rewards.length]);p.spins++;p.totalSpins++;break;}
 case 'claimSpinMilestone':{const n=Number(a.milestone);if(![5,10,20].includes(n)||p.totalSpins<n||p.spinClaims.includes(n))throw Error('Chưa đạt mốc hoặc đã nhận');grant({jade:n,token:Math.ceil(n/5)});p.spinClaims.push(n);break;}
 case 'travelDice':{if(p.travelUsed||p.travelDue)throw Error('Chưa thể tuần du');const roll=1+seed(day,p.position)%6;p.lastRoll=roll;p.position=(p.position+roll)%12;p.travelUsed=1;if(p.position%4===0)p.travelDue=now+600000;else grant({gold:500+p.position*50,token:1});break;}
 case 'claimTravel':if(!p.travelDue||now<p.travelDue)throw Error('Thần tiên chưa trở về');grant({gold:2400,jade:2,token:2});p.travelDue=0;break;
 case 'claimFestival':{const f=FESTIVAL.find(x=>x[0]===a.festivalId);if(!f||f[2]==='exchange'||p.festivalClaims.includes(f[0])||(f[2]!=='free'&&progressFor(s,f[2])<f[3]))throw Error('Chưa hoàn thành hoạt động hoặc đã nhận');grant({token:2,gold:350});p.festivalClaims.push(f[0]);break;}
 case 'festivalExchange':{const n=Number(a.quantity||1);if(!Number.isSafeInteger(n)||n<1||n>20||p.tokens<n*3)throw Error('Cần 3 tín vật mỗi lượt');grant({jade:n,food:n*500});p.tokens-=n*3;break;}
 case 'registerWar':if(p.registered)throw Error('Đã đăng ký');p.registered=true;p.warBase=s.stats.victories||0;break;
 case 'claimWar':{const wins=(s.stats.victories||0)-p.warBase;if(!p.registered||p.warClaimed||wins<1)throw Error('Cần đăng ký và thắng ít nhất một trận NPC');grant({jade:Math.min(wins,5)*2,token:Math.min(wins,5)});p.warClaimed=true;break;}
 case 'claimRank':{const rank=RANKS.find(x=>x.id===a.rank),n=Number(a.milestone),key=a.rank+':'+n;if(!rank||!rank.steps.includes(n)||rankCount(s,a.rank)<n||p.rankClaims.includes(key))throw Error('Chưa đạt mốc hoặc đã nhận');grant({jade:Math.max(1,Math.ceil(n/3)),token:2});p.rankClaims.push(key);break;}
 case 'claimCollection':{const c=COLLECTIONS.find(x=>x.id===a.collection),n=Number(a.milestone),key=a.collection+':'+n;if(!c||!c.steps.includes(n)||collectionCounts(s)[c.id]<n||p.collectionClaims.includes(key))throw Error('Chưa đủ bộ sưu tập hoặc đã nhận');p.collectionClaims.push(key);break;}
 case 'chooseEventReward':if(!p.choice)throw Error('Không có rương lựa chọn');grantChoice(p.choice,a.choiceId);p.choice=null;break;
 case 'claimStarterDay':if(p.starterDay>=3||p.starterLast===day)throw Error('Đã nhận hôm nay');grant({gold:900*(p.starterDay+1),jade:2,token:1});p.starterDay++;p.starterLast=day;if(p.starterDay===3&&!p.choice)p.choice='hero';break;
 default:throw Error('Hành động sự kiện không hợp lệ');
 }
 return p;
}
export const PRODUCT_ACTIONS=Object.freeze(['selectPrizePool','spinPrize','claimSpinMilestone','travelDice','claimTravel','claimFestival','festivalExchange','registerWar','claimWar','claimRank','claimCollection','chooseEventReward','claimStarterDay']);
