// Offline product rules, not asserted as source formulas.
const DAY=86400000, WEEK=7*DAY;
const int=(v,max=1e9)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
const uniq=(v)=>[...new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'):[])];
export const TITLES=Object.freeze([
 ['builder','Kiến Quốc', 'upgrades',10,'defense',3],['recruiter','Tụ Tiên','heroesRecruited',5,'magic',4],['general','Bách Chiến','victories',20,'attack',5],['conqueror','Chinh Thiên','citiesCaptured',5,'all',3],['duelist','Đấu Pháp Vương','duels',20,'magic',6],['trainer','Thống Lĩnh','troopsTrained',1000,'defense',5],['boss','Phong Thần','bossesDefeated',1,'all',8]
]);
export const ONLINE_MINUTES=Object.freeze([5,15,30,60]);
export const WEEKLY=Object.freeze([['build','Kiến thiết','upgrades',5],['battle','Chinh phạt','victories',5],['train','Luyện binh','troopsTrained',100],['duel','Đấu pháp','duels',5],['trade','Giao thương','tradeCount',3]]);
export const VIP_THRESHOLDS=Object.freeze([0,50,150,350,700,1200,2000,3200,5000,8000,12000]);
export const R4_ACTIONS=Object.freeze(['claimTitle','equipTitle','claimOnlineGift','claimVipGift','claimWeekly','claimGuildMission','setGarrison','recallGarrison','setReplenish','claimMonthly']);
export function refreshR4(s,now,troops=[]){
 const g=s.gameplay??(s.gameplay={}),o=g.r4??{},day=Math.floor(now/DAY),week=Math.floor(now/WEEK),month=new Date(now).toISOString().slice(0,7);
 const validCities=new Set((s.cities||[]).map(c=>c.id)),validTroops=new Set(troops.map(t=>t.id));
 const garrisons={};
 for(const [id,rows] of Object.entries(o.garrisons||{})){if(!validCities.has(id)||id==='capital')continue;garrisons[id]=Object.fromEntries(Object.entries(rows||{}).filter(([k,n])=>validTroops.has(k)&&int(n)>0).map(([k,n])=>[k,int(n)]));}
 const x={day,week,month,onlineSeconds:o.day===day?int(o.onlineSeconds,86400):0,onlineClaims:o.day===day?uniq(o.onlineClaims):[],vipClaim:o.day===day?int(o.vipClaim,10):-1,weeklyClaims:o.week===week?uniq(o.weeklyClaims):[],weeklyBase:o.week===week?{...o.weeklyBase}:{...s.stats},monthlyClaims:o.month===month?uniq(o.monthlyClaims):[],monthlyBase:o.month===month?{...o.monthlyBase}:{...s.stats},guildClaim:o.day===day?o.guildClaim===true:false,guildBase:o.day===day?int(o.guildBase):int(s.stats?.victories),titleClaims:uniq(o.titleClaims).filter(id=>TITLES.some(t=>t[0]===id)),activeTitle:null,garrisons,contribution:int(o.contribution),lastSquads:Object.fromEntries(Object.entries(o.lastSquads||{}).filter(([id])=>s.heroes.some(h=>h.id===id)).map(([id,rows])=>[id,Object.fromEntries(Object.entries(rows||{}).filter(([k,n])=>validTroops.has(k)&&int(n)>0).map(([k,n])=>[k,int(n)]))])),replenish:o.replenish&&typeof o.replenish==='object'?Object.fromEntries(Object.entries(o.replenish).filter(([id])=>s.heroes.some(h=>h.id===id)).map(([id,v])=>[id,v===true])):{}};
 x.activeTitle=x.titleClaims.includes(o.activeTitle)?o.activeTitle:null;g.r4=x;return x;
}
export function vipScore(s){return Math.floor((s.fame||0)/5)+(s.stats?.victories||0)*4+(s.stats?.upgrades||0)*2+(s.stats?.heroesRecruited||0)*10;}
export function vipLevel(s){let n=0;VIP_THRESHOLDS.forEach((v,i)=>{if(vipScore(s)>=v)n=i;});return n;}
export function titleBonus(s){const id=s.gameplay?.r4?.activeTitle,t=TITLES.find(x=>x[0]===id),b={attack:0,magic:0,defense:0};if(t)for(const k of Object.keys(b))if(t[4]===k||t[4]==='all')b[k]+=t[5];return b;}
export function objectiveCount(s,stat,period='weekly'){const b=s.gameplay?.r4?.[period+'Base']||{};return Math.max(0,(s.stats?.[stat]||0)-(b[stat]||0));}
export function addForegroundTime(s,seconds){const x=s.gameplay?.r4;if(x)x.onlineSeconds=Math.min(86400,x.onlineSeconds+int(seconds,5));}
export function r4Action(s,a,now,{troops,credit,debit}){
 const x=refreshR4(s,now,troops),city=()=>{const c=s.cities.find(c=>c.id===a.cityId&&!c.isCapital);if(!c)throw Error('Chọn thành phụ đã chiếm');return c;};
 const guard=()=>{if(s.queues.march)throw Error('Không đổi bố trí khi đang hành quân');};
 switch(a.type){
 case 'claimTitle':{const t=TITLES.find(t=>t[0]===a.titleId);if(!t||x.titleClaims.includes(t[0])||(s.stats[t[2]]||0)<t[3])throw Error('Chưa đạt thành tựu hoặc đã nhận');x.titleClaims.push(t[0]);if(!x.activeTitle)x.activeTitle=t[0];credit({jade:2});break;}
 case 'equipTitle':if(!x.titleClaims.includes(a.titleId))throw Error('Chưa mở danh hiệu');x.activeTitle=a.titleId;break;
 case 'claimOnlineGift':{const n=Number(a.minutes);if(!ONLINE_MINUTES.includes(n)||x.onlineSeconds<n*60||x.onlineClaims.includes(String(n)))throw Error('Chưa đủ thời gian hoặc đã nhận');credit({gold:n*20,jade:n>=30?2:1});x.onlineClaims.push(String(n));break;}
 case 'claimVipGift':{const lv=vipLevel(s);if(lv<1||x.vipClaim>=1)throw Error('Chưa đạt VIP hoặc đã nhận hôm nay');credit({jade:lv,gold:lv*250});x.vipClaim=lv;break;}
 case 'claimWeekly':{const t=WEEKLY.find(t=>t[0]===a.mission);if(!t||x.weeklyClaims.includes(t[0])||objectiveCount(s,t[2])<t[3])throw Error('Chưa hoàn thành tuần');credit({gold:1000,jade:3});x.weeklyClaims.push(t[0]);break;}
 case 'claimMonthly':if(x.monthlyClaims.includes('conquest')||objectiveCount(s,'victories','monthly')<20)throw Error('Cần 20 chiến thắng trong tháng hoặc đã nhận');credit({jade:15,gold:5000});x.monthlyClaims.push('conquest');break;
 case 'claimGuildMission':if(!s.world.guildLevel||x.guildClaim||(s.stats.victories||0)-x.guildBase<1)throw Error('Cần gia nhập minh hội và thắng một trận hôm nay');x.guildClaim=true;x.contribution+=10;s.gameplay.guildDonation=(s.gameplay.guildDonation||0)+10;credit({gold:500,jade:1});break;
 case 'setGarrison':{guard();const c=city(),n=Number(a.count),id=a.troopId;if(!troops.some(t=>t.id===id)||!Number.isSafeInteger(n)||n<1||n>(s.army[id]||0))throw Error('Quân dự bị không đủ');const rows=x.garrisons[c.id]??(x.garrisons[c.id]={});if(Object.values(rows).reduce((a,b)=>a+b,0)+n>c.level*10000)throw Error('Vượt sức chứa đồn trú');s.army[id]-=n;rows[id]=(rows[id]||0)+n;break;}
 case 'recallGarrison':{guard();const c=city(),rows=x.garrisons[c.id]||{};for(const [id,n] of Object.entries(rows))s.army[id]=(s.army[id]||0)+n;delete x.garrisons[c.id];break;}
 case 'setReplenish':{guard();if(!s.heroes.some(h=>h.id===a.heroId))throw Error('Không tìm thấy thần tiên');x.replenish[a.heroId]=a.value===true;break;}
 default:throw Error('Mệnh lệnh R4 không hợp lệ');
 }return x;
}
