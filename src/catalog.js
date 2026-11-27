/* Verified Mobile source facts and explicit simulations share a provenance-aware catalog. */
import { APPROVED_SOURCE_FACTS, SOURCE_REUSE_DECISION } from './approved-source-data.js';
import { applyApprovedSourceFields } from './source-adapter.js';
import { MOBILE_SOURCE_DATABASE } from './mobile-source-catalog.js';
import { LEGACY_QUEST_SOURCE, LEGACY_QUESTS } from './legacy-quest-catalog.js';
import { LEGACY_BUZHOU_SOURCE, LEGACY_BUZHOU_MOUNTAIN_CONFIG, LEGACY_BUZHOU_FLOOR_CONFIG, LEGACY_BUZHOU_FLOORS, LEGACY_BUZHOU_FORMATIONS, LEGACY_BUZHOU_REWARDS, LEGACY_BUZHOU_EQUIPMENT_RULES } from './legacy-buzhou-catalog.js';
import { LEGACY_TROOP_TIME_FACTS } from './legacy-troop-time-catalog.js';
import { LEGACY_TROOP_REQUIREMENT_FACTS, LEGACY_TROOP_REQUIREMENT_SOURCE } from './legacy-troop-requirement-catalog.js';
import { LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS } from './legacy-city-garrison-catalog.js';
import { LEGACY_ELFLAND_SOURCE, LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_REWARD_RULES } from './legacy-elfland-catalog.js';

export { LEGACY_QUEST_SOURCE, LEGACY_QUESTS, LEGACY_BUZHOU_SOURCE, LEGACY_BUZHOU_MOUNTAIN_CONFIG, LEGACY_BUZHOU_FLOOR_CONFIG, LEGACY_BUZHOU_FLOORS, LEGACY_BUZHOU_FORMATIONS, LEGACY_BUZHOU_REWARDS, LEGACY_BUZHOU_EQUIPMENT_RULES, LEGACY_TROOP_REQUIREMENT_SOURCE, LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS, LEGACY_ELFLAND_SOURCE, LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_REWARD_RULES, MOBILE_SOURCE_DATABASE };

const adaptSourceFacts = (domain, rows) => applyApprovedSourceFields(
  rows,
  APPROVED_SOURCE_FACTS[domain] || {},
  SOURCE_REUSE_DECISION
);

export const CONTENT_EVIDENCE = Object.freeze({
  status: 'MIXED',
  source: 'Mobile catalog v5d78c226cb plus verified legacy quest, city, Buzhou, Tiên Sơn, troop-time and training-requirement facts are bundled with field provenance; unmapped mechanics remain SIMULATED or UNKNOWN',
  version: 'dacky-mobile-source-mixed-v2',
  updated: '2026-11-25'
});

export const RESOURCE_INFO = Object.freeze({
  food: { name: 'Lương thực', short: 'Lương', glyph: '糧' },
  timber: { name: 'Gỗ', short: 'Gỗ', glyph: '木' },
  stone: { name: 'Đá', short: 'Đá', glyph: '石' },
  iron: { name: 'Sắt', short: 'Sắt', glyph: '鐵' },
  gold: { name: 'Đồng', short: 'Đồng', glyph: '金' },
  jade: { name: 'Linh ngọc', short: 'Ngọc', glyph: '玉' }
});

const buildingRows = [
  ['citadel','Tử Vi Thành','nội thành','城', 'gold', 8, 80, 60, 25],
  ['barracks','Thần Binh Doanh','quân sự','兵', 'troops', 0, 90, 55, 30],
  ['granary','Linh Thương','kinh tế','倉', 'food', 0, 55, 15, 15],
  ['lumber','Phong Mộc Trường','kinh tế','林', 'timber', 0, 65, 10, 15],
  ['quarry','Thạch Tủy Phường','kinh tế','山', 'stone', 0, 75, 25, 15],
  ['foundry','Huyền Thiết Lò','kinh tế','爐', 'iron', 0, 90, 35, 20],
  ['market','Triều Ca Thị','kinh tế','市', 'gold', 0, 70, 25, 25],
  ['academy','Thái Học Viện','nghiên cứu','學', 'research', 0, 100, 80, 35],
  ['altar','Phong Thần Đàn','thần tiên','壇', 'jade', 0, 80, 80, 45],
  ['manor','Tiên Gia Phủ','thần tiên','府', 'heroes', 0, 95, 85, 40],
  ['training','Bách Chiến Đài','quân sự','戰', 'training', 0, 70, 65, 20],
  ['clinic','Hồi Xuân Đường','quân sự','醫', 'healing', 0, 55, 55, 20],
  ['wall','Huyền Vũ Thành','phòng thủ','垣', 'defense', 0, 120, 100, 55],
  ['watch','Thiên Lý Đài','phòng thủ','望', 'scout', 0, 85, 55, 40],
  ['storehouse','Càn Khôn Khố','nội thành','庫', 'storage', 0, 80, 45, 25],
  ['farm','Ngũ Cốc Viên','ngoại thành','田', 'food', 0, 50, 20, 10],
  ['grove','Thanh Long Lâm','ngoại thành','林', 'timber', 0, 55, 20, 10],
  ['mine','Địa Mạch Khoáng','ngoại thành','礦', 'stone', 0, 75, 35, 15],
  ['foundryfield','Xích Kim Quặng','ngoại thành','金', 'iron', 0, 80, 40, 15],
  ['embassy','Bát Phương Quán','ngoại thành','盟', 'diplomacy', 0, 75, 65, 30],
  ['caravan','Vạn Lý Trạm','ngoại thành','驛', 'trade', 0, 65, 50, 20]
];

const oldBuildings = adaptSourceFacts('buildings', buildingRows.map(([id,name,zone,glyph,effect,food,timber,stone,iron], index) => ({
  id, name, zone, glyph, effect, index,
  baseCost: { food: food * 3, timber: timber * 3, stone: stone * 2, iron: iron * 2, gold: 40 + index * 7 },
  seconds: 12 + index % 4 * 3,
  maxLevel: 30,
  evidence: 'SIMULATED', mobileSourceId: null, mobileZone: null, mobileDescription: null,
    mobileImage: '', mobileLevelCosts: [], sourceFieldStatus: 'UNKNOWN'
})));
const additionalBuildings={'13':['government','administration'],'15':['housing','population'],'17':['hostel','recruitment'],'22':['workshop','siege'],'24':['skirmisher','scout'],'26':['stable','cavalry']};
// Mobile research rows can require a building rank beyond that building's
// published cap. Preserve the source cap, but derive the smallest explicit
// runtime bridge needed to keep the full source research tree reachable.
function researchBuildingRequirementCaps(){
  const sourceBuildings=MOBILE_SOURCE_DATABASE.categories?.['cong-trinh']||[];
  const names=new Map(sourceBuildings.map(row=>[String(row.name||'').trim(),String(row.id)]));
  const caps=new Map();
  for(const tech of MOBILE_SOURCE_DATABASE.categories?.['khoa-ky']||[]){
    const table=tech.details?.find(row=>row.k==='bang');
    for(const row of table?.dong||[]){
      const raw=String(row[2]||'');
      for(const term of raw.split(/\s*[·,]\s*/)){
        const match=term.trim().match(/^(.+?)\s+(\d+)$/);if(!match)continue;
        const sourceId=names.get(match[1].trim());if(!sourceId)continue;
        caps.set(sourceId,Math.max(caps.get(sourceId)||0,Number(match[2])));
      }
    }
  }
  return caps;
}
const researchBuildingCaps=researchBuildingRequirementCaps();
const extraBuildings=MOBILE_SOURCE_DATABASE.categories['cong-trinh'].filter(r=>additionalBuildings[r.id]).map(r=>{
  const [id,effect]=additionalBuildings[r.id],block=r.details.find(x=>x.k==='bang'),info=r.details.find(x=>x.k==='cs');
  const levels=(block?.dong??[]).map(v=>({level:Number(v[0]),requirement:String(v[1]??''),cost:{food:Number(v[2])||0,timber:Number(v[3])||0,stone:Number(v[4])||0,iron:Number(v[5])||0,gold:Number(v[6])||0}}));
  const sourceMaxLevel=Number(info?.ds?.find(x=>x[0]==='Cấp tối đa')?.[1])||30;
  const runtimeMaxLevel=Math.max(sourceMaxLevel,researchBuildingCaps.get(String(r.id))||0);
  const prerequisiteBridge=runtimeMaxLevel>sourceMaxLevel;
  const bridgeBase={food:300,timber:180,stone:120,iron:60,gold:150};
  const simulatedLevelCosts=Array.from({length:runtimeMaxLevel-sourceMaxLevel},(_,i)=>{
    const level=sourceMaxLevel+i+1,scale=Math.pow(Math.max(1,level-sourceMaxLevel),1.25);
    return {level,requirement:'—',cost:Object.fromEntries(Object.entries(bridgeBase).map(([key,value])=>[key,Math.ceil(value*scale)]))};
  });
  return {id,name:r.name,zone:'nội thành',glyph:'城',effect,index:oldBuildings.length+Object.keys(additionalBuildings).indexOf(r.id),baseCost:levels[0]?.cost??{},seconds:20,maxLevel:runtimeMaxLevel,sourceMaxLevel,runtimeMaxEvidence:prerequisiteBridge?'SIMULATED_PREREQUISITE_BRIDGE':undefined,simulatedLevelCosts,evidence:'MIXED',mobileSourceId:r.id,mobileZone:'Nội thành',mobileDescription:r.description,mobileImage:r.image?'./assets/mobile-source/'+r.image.replace(/^https?:\/\/[^/]+\//,''):'',mobileLevelCosts:levels,sourceFieldStatus:'VERIFIED_MOBILE',fieldEvidence:{mobileLevelCosts:'VERIFIED_MOBILE'},fieldProvenance:r.fieldProvenance};
});
export const BUILDINGS=Object.freeze([...oldBuildings,...extraBuildings]);

const troopNames = [
  ['Dân binh','bộ binh','平'], ['Đao thuẫn thủ','bộ binh','盾'], ['Trường thương quân','bộ binh','槍'],
  ['Thiết giáp vệ','bộ binh','鎧'], ['Huyền giáp quân','bộ binh','玄'], ['Thần Cơ nỏ thủ','xạ thủ','弩'],
  ['Liên nỗ binh','xạ thủ','連'], ['Thanh Vũ cung thủ','xạ thủ','羽'], ['Hỏa tiễn thủ','xạ thủ','火'],
  ['Du kỵ binh','kỵ binh','騎'], ['Thiết kỵ doanh','kỵ binh','鐵'], ['Phi Vân kỵ','kỵ binh','雲'],
  ['Hổ Báo kỵ','kỵ binh','虎'], ['Trọng kỵ Thiên Sách','kỵ binh','策'], ['Công thành xa','công thành','車'],
  ['Phá thành chùy','công thành','破'], ['Liệt Hỏa nỏ xa','công thành','弩'], ['Vân Thê quân','công thành','梯'],
  ['Thần Hỏa pháo','công thành','炮'], ['Trinh sát ưng vệ','trinh sát','鷹'], ['Dạ hành thám kỵ','trinh sát','夜'],
  ['Bạch Hạc đạo binh','đạo binh','鶴'], ['Lôi Phù tiên binh','đạo binh','雷'], ['Huyền Thủy vệ','đạo binh','水'],
  ['Xích Diệm chiến sĩ','đạo binh','焰'], ['Thanh Mộc linh quân','đạo binh','木'], ['Thạch Tượng vệ','đạo binh','石'],
  ['Kim Giáp lực sĩ','đạo binh','金'], ['Phi Thiên vệ','đạo binh','天'], ['Trấn Sơn thần tốt','đạo binh','山'],
  ['Long Kỵ vệ','kỵ binh','龍'], ['Phượng Vũ cung cơ','xạ thủ','鳳'], ['Côn Ngô đao sĩ','bộ binh','吳'],
  ['Bắc Đẩu trận binh','đạo binh','斗'], ['Thất Tinh kiếm vệ','đạo binh','星'], ['Cửu U âm tốt','đạo binh','幽'],
  ['Thiên Cương hộ quân','đạo binh','剛'], ['Địa Sát phục binh','trinh sát','伏'], ['Phong Thần cấm vệ','đạo binh','神']
];
const counterByRole=Object.freeze({'bộ binh':'kỵ binh','kỵ binh':'xạ thủ','xạ thủ':'bộ binh','công thành':'bộ binh','trinh sát':'công thành','đạo binh':'trinh sát'});
const laneByRole=Object.freeze({'bộ binh':'front','kỵ binh':'front','xạ thủ':'rear','công thành':'siege','trinh sát':'rear','đạo binh':'front'});
const rangeByRole=Object.freeze({'bộ binh':1,'kỵ binh':2,'xạ thủ':5,'công thành':6,'trinh sát':4,'đạo binh':3});
const mobileTroopRows = adaptSourceFacts('troops', troopNames.map(([name,role,glyph], i) => {
  const tier = Math.floor(i / 6) + 1;
  const scale = 1 + tier * 0.42;
  const counter=counterByRole[role];
  return {
    id: `troop-${String(i + 1).padStart(2,'0')}`, name, role, glyph, tier,
    attack: Math.round((7 + i % 5 * 2) * scale), defense: Math.round((6 + (i + 2) % 5 * 2) * scale),
    speed: Math.round((5 + (i * 3) % 7) * scale), morale: 70 + i % 4 * 5, counter,
    lane:laneByRole[role],range:rangeByRole[role],
    cost: { food: 18 * tier, timber: role === 'công thành' ? 20 * tier : 4 * tier, iron: 9 * tier, gold: 8 * tier },
    trainSeconds: 5 + tier * 2, unlockCity: Math.min(30, tier * 2), evidence: 'SIMULATED',
    mobileSourceId: null, mobileImage: '', mobileClass: null, mobileFaction: null, mobileLife: null,
    mobileCarry: null, mobileUpkeep: null, mobileCounterRows: [], sourceFieldStatus: 'UNKNOWN'
  };
}));
const troopsWithLegacyTimes = applyApprovedSourceFields(
  mobileTroopRows,
  LEGACY_TROOP_TIME_FACTS,
  SOURCE_REUSE_DECISION
).map(row => ({ ...row, trainTimeEvidence: row.fieldEvidence?.trainSeconds || 'SIMULATED' }));
export const TROOPS = Object.freeze(applyApprovedSourceFields(
  troopsWithLegacyTimes,
  LEGACY_TROOP_REQUIREMENT_FACTS,
  SOURCE_REUSE_DECISION
).map(row => ({
  ...row,
  trainTimeEvidence: row.fieldEvidence?.trainSeconds || 'SIMULATED',
  trainingCostEvidence: row.fieldEvidence?.cost || 'SIMULATED',
  trainingRequirementEvidence: row.fieldEvidence?.trainingRequirements || 'SIMULATED'
})));

const heroRows = [
  ['Khương Tử Nha','quân sư','water','太師'], ['Na Tra','tiên phong','fire','乾坤'], ['Dương Tiễn','hộ vệ','metal','天眼'],
  ['Hoàng Phi Hổ','thống soái','earth','鎮國'], ['Lôi Chấn Tử','đột kích','wind','雷翼'], ['Đặng Thiền Ngọc','xạ thủ','earth','五光'],
  ['Long Cát Công Chúa','trị liệu','water','甘露'], ['Vi Na','quân sư','wood','靈符'], ['Hàn Độc Long','phòng thủ','water','玄甲'],
  ['Tô Hộ','thống soái','fire','忠烈'], ['Bạch Hạc Đồng Tử','hỗ trợ','wind','仙鶴'], ['Ân Giao','đột kích','metal','番天'],
  ['Tân Hoàn','xạ thủ','fire','火羽'], ['Triệu Công Minh','thống soái','metal','定海'], ['Văn Trọng','quân sư','thống soái','聞仲'],
  ['Thân Công Báo','quân sư','water','黑虎'], ['Cơ Phát','thống soái','wood','天命'], ['Thạch Cơ','phòng thủ','earth','白骨']
];
const heroFamilies=['Ân','Bàng','Bào','Bình','Cao','Cố','Cung','Diệp','Đoàn','Đào','Đổng','Dư','Đường','Hạ','Hàn','Hồ','Hoa','Hoàng','Hứa','Khâu','Kha','Lâm','Lưu','Mã','Mạnh','Ngụy','Phùng','Tạ','Tần'];
const heroGivenNames=['Minh Uy','Trọng Quang','Văn Lâm','Thế Kiệt','Tử Dương','Huyền Đức','Thanh Trúc','Long Hổ','Cảnh Hành','Xuân San','Trường Khanh','Vĩnh An','Mộc Lan','Hạo Nhiên','Đan Phong','Tử Ngọ','Chiêu Minh','Thừa Ân'];
const heroRoles=['quân sư','tiên phong','hộ vệ','thống soái','đột kích','xạ thủ','trị liệu','hỗ trợ','đạo sĩ'];
const heroElements=['fire','water','earth','metal','wood','wind'];
const heroSignatures=['Xích Viêm','Huyền Hà','Bát Quái','Thanh Long','Bạch Hổ','Tử Vi','Phục Ma','Lôi Vân','Cửu Cung'];
for(let i=0;i<522;i++) heroRows.push([`${heroFamilies[Math.floor(i/heroGivenNames.length)]} ${heroGivenNames[i%heroGivenNames.length]}`,heroRoles[i%heroRoles.length],heroElements[i%heroElements.length],heroSignatures[i%heroSignatures.length]]);
export const HEROES = Object.freeze(adaptSourceFacts('heroes', heroRows.map(([name,role,element,signature], i) => {
  const generatedQuality = i < 18 ? (i < 4 ? 'Thiên' : i < 11 ? 'Địa' : 'Nhân') : ((i * 37) % 100 < 8 ? 'Thiên' : (i * 37) % 100 < 38 ? 'Địa' : 'Nhân');
  return {
    id: `hero-${String(i + 1).padStart(2,'0')}`, name, role, element, signature, quality:generatedQuality,
    attack: 18 + (i * 7) % 16, defense: 16 + (i * 5) % 18, wisdom: 18 + (i * 11) % 20,
    skill: ['Hỏa Phù Liệt Trận','Huyền Thủy Hộ Thể','Phong Lôi Kích','Thất Tinh Trợ Chiến'][i % 4],
    skillText: ['gây sát thương diện rộng','giảm thương cho quân ta','đánh nhanh tuyến trước','tăng sĩ khí đội hình'][i % 4],
    evidence: 'SIMULATED', mobileSourceId: null, mobileQuality: null, mobileImage: '', mobileDescription: '', mobileFaction: '', mobileOccupation: '',
    mobileBaseStats: null, mobileAbilities: [], mobileSignature: '', sourceFieldStatus: 'UNKNOWN'
  };
})));

export const HERO_QUALITY_MULTIPLIERS=Object.freeze({'Nhân':1,'Địa':1.12,'Thiên':1.28});

export const HERO_SKILLS=Object.freeze(adaptSourceFacts('heroSkills', [
  {id:'skill-fire',name:'Hỏa Phù Liệt Trận',passive:'Tăng sát thương đội hình',activeName:'Liệt Hỏa Thiên Hàng',active:'damage',triggerRound:2,baseCoefficient:0.04,perMastery:0.012,evidence:'SIMULATED'},
  {id:'skill-water',name:'Huyền Thủy Hộ Thể',passive:'Giảm sát thương nhận vào',activeName:'Huyền Thủy Kết Giới',active:'shield',triggerRound:1,baseCoefficient:0.05,perMastery:0.012,evidence:'SIMULATED'},
  {id:'skill-wind',name:'Phong Lôi Kích',passive:'Tăng sức mạnh đòn mở đầu',activeName:'Phong Lôi Tiên Kích',active:'damage',triggerRound:1,baseCoefficient:0.04,perMastery:0.014,evidence:'SIMULATED'},
  {id:'skill-formation',name:'Thất Tinh Trợ Chiến',passive:'Tăng sức bền đội hình',activeName:'Thất Tinh Hồi Khí',active:'heal',triggerRound:3,baseCoefficient:0.03,perMastery:0.012,evidence:'SIMULATED'}
]));

const gearNames = [
  ['Bạch Ngọc Kiếm','vũ khí','玉劍'], ['Trấn Sơn Đao','vũ khí','鎮刀'], ['Phục Ma Cung','vũ khí','伏弓'],
  ['Huyền Thiết Giáp','giáp','玄甲'], ['Lưu Vân Bào','giáp','雲袍'], ['Bách Thú Khôi','giáp','獸盔'],
  ['Thất Tinh Bội','pháp bảo','七星'], ['Càn Khôn Xích','pháp bảo','乾坤'], ['Hỏa Tiêm Thương','pháp bảo','火尖'],
  ['Tụ Tiên Kỳ','pháp bảo','聚仙'], ['Bình Ngọc Tịnh','pháp bảo','玉淨'], ['Định Hải Châu','pháp bảo','定海'],
  ['Linh Chi Ngàn Năm','vật phẩm','靈芝'], ['Tụ Khí Đan','vật phẩm','丹'], ['Quân Lệnh Phù','vật phẩm','令'],
  ['Bản Đồ Cổ','vật phẩm','圖'], ['Lệnh Bài Triều Ca','vật phẩm','令牌'], ['Hồn Ngọc','vật phẩm','魂']
];
const itemRoots=['Thanh Hư','Huyền Thiên','Xích Tiêu','Cửu U','Tử Vi','Bạch Hổ','Thanh Long','Phục Ma','Thái Hư','Côn Ngô','Lưu Vân','Vạn Tượng','Hỏa Vân','Bắc Minh','Tử Dương','Kim Quang','Trấn Nguyên','Hỗn Độn','Vô Cực','Thiên Cương','Địa Sát','Thất Tinh','Lưỡng Nghi','Ngũ Hành','Hàn Nguyệt','Liệt Nhật','Phi Vân','Tụ Tiên','Trường Sinh','Phá Quân'];
const itemMaterials=['Huyền Thiết','Xích Kim','Bạch Ngọc','Tử Sa','Côn Ngô','Thanh Đồng','Tinh Vân','Hàn Ngọc','Long Cốt','Phượng Vũ','Hắc Diệu','Lưu Ly'];
const itemRefinements=['Hạ Phẩm','Trung Phẩm','Thượng Phẩm','Địa Phẩm','Thiên Phẩm','Cổ Phẩm','Huyền Phẩm','Vô Song'];
const itemForms={
  'vũ khí':['Kiếm','Đao','Thương','Cung','Phủ','Kích','Song Câu','Trường Tiên','Phi Đao','Đoản Kiếm'],
  'giáp':['Giáp','Chiến Bào','Hộ Tâm Kính','Mão','Ủng','Hộ Thủ','Yên Giáp','Pháp Y','Bào','Huyền Khôi'],
  'pháp bảo':['Bảo Châu','Tiên Kỳ','Kim Chung','Ngọc Xích','Linh Hồ','Phiên','Tháp','Bình','Ấn','Phù'],
  'vật phẩm':['Linh Đan','Tán','Huyết Thảo','Tiên Lộ','Hộ Mệnh Phù','Tụ Linh Hương','Dưỡng Hồn Đan','Bùa Lương','Linh Thạch','Tiên Quả']
};
const itemTypes=['vũ khí','giáp','pháp bảo','vật phẩm'];
const useEffects=[
  i=>({kind:'resource',resource:'food',amount:220+i%780}),
  i=>({kind:'heroXp',amount:80+i%920}),
  i=>({kind:'resource',resource:'gold',amount:60+i%640}),
  i=>({kind:'morale',amount:4+i%17})
];
const mobileQualityTiers=Object.freeze({'Phàm':1,'Lục':2,'Lam':3,'Tím':4,'Cam':5,'Đỏ':6,'Kim':7,'Thần':8});
const mobileGoods=MOBILE_SOURCE_DATABASE.categories['vat-pham'].map(row=>{
  const info=Object.fromEntries(row.details.find(block=>block.k==='cs'&&block.t==='Thông tin')?.ds||[]);
  const sourceStats=(row.details.find(block=>block.k==='cs'&&block.t==='Chỉ số')?.ds||[]).map(([label,value])=>[String(label),String(value)]);
  const group=String(info['Nhóm']||row.section||'UNKNOWN');
  const equipmentSlot=String(info['Bộ vị']||'');
  const type=group==='Trang bị'?(/vũ khí|binh khí/i.test(equipmentSlot)?'vũ khí':/pháp bảo/i.test(equipmentSlot)?'pháp bảo':'giáp'):'vật phẩm';
  const quality=String(info['Phẩm chất']||row.filters?.pham||'');
  return {id:`mobile-good-${row.id}`,name:row.name,type,glyph:'物',tier:mobileQualityTiers[quality]||1,bonus:0,
    effect:row.description||group,useEffect:null,evidence:'SIMULATED',bonusEvidence:'SIMULATED',
    mobileSourceId:null,mobileImage:'',mobileGroup:'',mobileQuality:'',mobileEquipmentSlot:'',mobileOccupation:'',
    mobileRequiredLevel:null,mobileStats:[],mobileDescription:'',mobileAcquisition:[],mobileOpening:null,
    mobileAvailableAtMerchant:false,mobileSaleGold:null};
});
const adaptedItemRows = adaptSourceFacts('items', [
  ...gearNames.map(([name,type,glyph], i) => ({
    id:`item-${String(i+1).padStart(2,'0')}`,name,type,glyph,tier:1+i%5,
    bonus:type==='vật phẩm'?0:3+(i*7)%15,
    effect:type==='vật phẩm'?['Hồi 120 lương thực','Tăng 10% kinh nghiệm','Mở rương chiến lợi phẩm'][i%3]:`+${3+(i*7)%15} ${i%2?'phòng thủ':'công kích'}`,
    useEffect:type==='vật phẩm'?(i===12?{kind:'resource',resource:'food',amount:420}:i===13?{kind:'heroXp',amount:120}:i===14?{kind:'resource',resource:'gold',amount:140}:{kind:'resource',resource:'jade',amount:1}):null,
    evidence:'SIMULATED'
  })),
  ...Array.from({length:2137},(_,i)=>{
    const type=itemTypes[i%itemTypes.length];
    const tier=1+i%10;
    const name=`${itemRefinements[Math.floor(i/360)%itemRefinements.length]} ${itemMaterials[Math.floor(i/30)%itemMaterials.length]} ${itemForms[type][i%10]} · ${itemRoots[i%itemRoots.length]}`;
    const effect=type==='vật phẩm'?['Bổ sung lương thực','Bồi dưỡng kinh nghiệm','Tăng ngân lượng','Ổn định dân tâm'][i%4]:`+${5+(i*13)%41} ${i%2?'phòng thủ':'công kích'}`;
    return {id:`item-${String(i+19).padStart(4,'0')}`,name,type,glyph:['玉','符','劍','甲','丹','珠'][i%6],tier,bonus:type==='vật phẩm'?0:5+(i*13)%41,effect,
      useEffect:type==='vật phẩm'?useEffects[(i/4|0)%useEffects.length](i):null,evidence:'SIMULATED',bonusEvidence:'SIMULATED',
      mobileSourceId:null,mobileImage:'',mobileQuality:'',mobileOccupation:'',mobileRequiredLevel:null,mobileManaCost:null,
      mobileAbilityText:'',mobileDescription:'',mobileOwner:'',mobileAcquisition:[]};
  }),
  ...mobileGoods
]);
const legacyQuestGoods=new Map();
for(const quest of LEGACY_QUESTS)for(const condition of quest.conditions||[]){
  const data=condition.data||[];
  if(![1,2].includes(condition.typeCode)||data[1]!==5||data[2]!==0||!(Number(data[3])>0))continue;
  const sourceId=String(data[3]);
  if(MOBILE_SOURCE_DATABASE.categories['vat-pham'].some(row=>String(row.id)===sourceId))continue;
  const row=legacyQuestGoods.get(sourceId)||{sourceId,sourceRecordIds:[],suggestedCount:1};
  row.sourceRecordIds.push(String(condition.sourceId));row.suggestedCount=Math.max(row.suggestedCount,Number(data[4])||1);legacyQuestGoods.set(sourceId,row);
}
const simulatedQuestGoods=[...legacyQuestGoods.values()].map(row=>({
  id:`legacy-quest-good-${row.sourceId}`,name:`Tín vật nhiệm vụ #${row.sourceId}`,type:'vật phẩm',glyph:'信',tier:1,bonus:0,
  effect:'Vật phẩm yêu cầu bởi nhiệm vụ legacy · dữ liệu Mobile không có',useEffect:null,evidence:'SIMULATED',simulationKey:'SIMULATED_LEGACY_QUEST_GOOD',bonusEvidence:'SIMULATED',
  mobileSourceId:null,mobileImage:'',mobileGroup:'Nhiệm vụ',mobileQuality:'UNKNOWN',mobileOccupation:'',mobileRequiredLevel:null,mobileStats:[],mobileDescription:'Tạo token runtime từ ID vật phẩm trong điều kiện nhiệm vụ legacy. Tên, hình ảnh, giá và nguồn kiếm chưa được xác minh.',mobileAcquisition:[],
  mobileAvailableAtMerchant:false,mobileSaleGold:null,legacySourceId:row.sourceId,legacySourceRecords:row.sourceRecordIds,legacySuggestedCount:row.suggestedCount,sourceFieldStatus:'SIMULATED'
}));
export const ITEMS = Object.freeze([
  ...adaptedItemRows.map(item => item.mobileSourceId ? { ...item, bonus: 0, bonusEvidence: 'SIMULATED' } : item),
  ...simulatedQuestGoods
]);

const techNames = [
  ['Canh tác thuật','food','SUPPORTED_SOURCE_MAPPING'], ['Đốn mộc thuật','timber','SUPPORTED_SOURCE_MAPPING'],
  ['Khai thạch thuật','stone','SUPPORTED_SOURCE_MAPPING'], ['Luyện kim thuật','iron','SUPPORTED_SOURCE_MAPPING'],
  ['Thuế khoá thuật','gold','SUPPORTED_SOURCE_MAPPING'], ['Thương khố thuật','storage','SUPPORTED_SOURCE_MAPPING'],
  ['Vận chuyển thuật','transport','PARTIAL_SIMULATED_BASE'], ['Kiến trúc thuật','build','SUPPORTED_SOURCE_MAPPING'],
  ['Chinh binh thuật','training','SUPPORTED_SOURCE_MAPPING'], ['Quân công thuật','attack','SUPPORTED_SOURCE_MAPPING'],
  ['Quân phòng thuật','defense','PARTIAL_SIMULATED_BASE'], ['Sĩ khí thuật','troopHealth','SUPPORTED_SOURCE_MAPPING'],
  ['Lĩnh binh thuật','leadCapacity','PARTIAL_SIMULATED_BASE'], ['Trinh sát tiên pháp','scoutImmortals','PARTIAL_SIMULATED_BASE'],
  ['Trinh sát tài nguyên','scoutResources','PARTIAL_SIMULATED_BASE'], ['Hành quân thuật','march','SUPPORTED_SOURCE_MAPPING'],
  ['Trinh sát quân đội','scoutArmy','PARTIAL_SIMULATED_BASE'], ['Thần phòng thuật','heroDefense','PARTIAL_SIMULATED_BASE'],
  ['Tiết pháp thuật','manaCost','UNKNOWN']
];
const mobileTechnologyOrder=new Map(MOBILE_SOURCE_DATABASE.categories['khoa-ky'].map((row,index)=>[row.id,index]));
const adaptedTechnologyRows=adaptSourceFacts('technologies', techNames.map(([name,effect], i) => ({
  id: `tech-${String(i + 1).padStart(2,'0')}`, name, effect, maxLevel: 30,
  baseCost: { food: 45 + i * 6, gold: 35 + i * 5, jade: effect === 'hero' ? 1 : 0 }, seconds: 18 + i % 4 * 4,
  evidence: 'SIMULATED', runtimeEffectStatus: techNames[i][2], mobileSourceId: null, mobileDescription: null, mobileImage: '',
  mobileLevelCosts: [], sourceFieldStatus: 'UNKNOWN'
})));
export const TECHNOLOGIES = Object.freeze(adaptedTechnologyRows.sort((a,b)=>(mobileTechnologyOrder.get(a.mobileSourceId)??Number.MAX_SAFE_INTEGER)-(mobileTechnologyOrder.get(b.mobileSourceId)??Number.MAX_SAFE_INTEGER)||a.id.localeCompare(b.id)));

const questTitles = [
  ['Nâng Tử Vi Thành','upgrade','citadel',3], ['Tích lương luyện binh','train','troop',8], ['Tìm hiền sĩ trợ trận','recruit','hero',1],
  ['Rèn binh khí đầu tiên','equip','item',1], ['Mở đường qua dã địa','win','field',1], ['Kết minh cùng NPC','guild','guild',1], ['Phong Thần khởi sự','tower','tower',3],
  ['Thu phục danh thành','capture','city',1], ['Khảo nghiệm Bất Chu','buzhou','floor',1], ['Nâng cao quốc lực','power','power',500]
];
const questTemplates=[...questTitles,['Khám phá Tiên Sơn','mountain','mountains',1]];
const generatedQuestLimits={upgrade:30,train:5000,recruit:60,equip:500,win:5000,guild:5,tower:9999,capture:75,buzhou:5,power:500_000,mountain:624};
const chapterMissionNames=['Tây Kỳ khởi nghĩa','Thanh Khâu huyết chiến','Vân Mộng trừ yêu','Cửu Lê bình loạn','Lạc Thủy hội quân','Bắc Minh hàn kiếp','Phong Lăng đoạt thành','Quy Khư quyết chiến'];
const campaignQuests=Array.from({length:48},(_,i)=>{
  const chapter=Math.floor(i/6)+1;
  const mainStory=i%6===0;
  const [title,type,target,base]=mainStory?['Mở cửa ải chính tuyến','chapterField','chapter',1]:questTemplates[(i-1+questTemplates.length)%questTemplates.length];
  return {id:`quest-${String(i+1).padStart(3,'0')}`,chapter,title:mainStory?`${chapterMissionNames[chapter-1]} · mở đường`:i<questTitles.length?title:`${title} · hồi ${chapter}`,
    type,target,mainStory,goal:Math.min(generatedQuestLimits[type]||1,base+Math.floor(i/9)),
    reward:{food:130+i*30,timber:100+i*22,gold:90+i*18,jade:i%4===0?1:0,xp:80+i*25},evidence:'SIMULATED'};
});
const longTailQuests=Array.from({length:1109},(_,i)=>{
  const [title,type,target,base]=questTemplates[i%questTemplates.length];
  const chapter=Math.min(8,Math.floor(i*8/1109)+1);
  const goal=Math.min(generatedQuestLimits[type],base+Math.floor((i+48)/8));
  return {id:`quest-${String(i+50).padStart(3,'0')}`,chapter,title:`${title} · tuyến ${i+1}`,
    type,target,goal,reward:{food:260+Math.min(i,700)*12,timber:200+Math.min(i,700)*9,gold:180+Math.min(i,700)*8,jade:i%5===0?1:0,xp:150+i*4},evidence:'SIMULATED'};
});
const campaignEndingQuest={id:'quest-049',chapter:8,title:'Phong Thần định cục',type:'boss',target:'node-120',goal:1,
  mainStory:true,reward:{food:12000,timber:10000,stone:8000,iron:6000,gold:12000,jade:24,xp:10000},evidence:'SIMULATED'};
export const QUESTS = Object.freeze(adaptSourceFacts('quests', [...campaignQuests,...longTailQuests,campaignEndingQuest].sort((a,b)=>{
  if(a.type==='boss')return 1;if(b.type==='boss')return -1;
  if(Boolean(a.mainStory)!==Boolean(b.mainStory))return a.mainStory?-1:1;
  return a.chapter-b.chapter||Number(a.id.slice(6))-Number(b.id.slice(6));
})));

const regionPrefixes = ['Thanh Khâu','Vân Mộng','Cửu Lê','Lạc Thủy','Bắc Minh','Tây Kỳ','Phong Lăng','Quy Khư','Hoàng Hà','Thái Hư','Tử Tiêu','Huyền Cơ','Bạch Lộc','Thương Sơn','Côn Ngô'];
const regionSuffixes = ['Quan','Trấn','Đài','Cốc','Sơn','Bến','Lĩnh','Thành'];
const npcOfficerNames=['Ân Thủ Nghĩa','Bào Huyền Chân','Bình Trấn Hải','Cao Cảnh Đức','Cố Trường Phong','Cung Tử An','Đào Như Sơn','Đổng Huyền Minh','Dư Bạch Thạch','Đường Tĩnh Viễn','Hàn Vân Khách','Hồ Ngọc Đường','Hoa Tử Hư','Khâu Trọng Lân','Lâm Tùng Hạc','Mã Thiên Hành','Mạnh Huyền Sách','Ngụy Thanh Sơn','Phùng Dạ Bạch','Tạ Linh Quân','Tần Vô Cữu','Vương Phá Quân','Trịnh Minh Đạo','Chu Hạc Niên'];
const npcTactics=Object.freeze({
  ambush:'Phục kích', fortress:'Thủ thành', charge:'Kỵ trận xung phong', arcane:'Pháp trận', mandate:'Hôn ám triều cương'
});
const npcRoles=Object.freeze({
  'Danh thành':['bộ binh','xạ thủ','công thành'],
  'Dã địa':['kỵ binh','trinh sát','xạ thủ'],
  'Tiên sơn':['đạo binh','bộ binh','xạ thủ'],
  'Boss chiến dịch':['bộ binh','kỵ binh','xạ thủ','đạo binh','công thành']
});
const npcElements=['fire','water','wood','metal','earth'];
const legacyCityGarrisonByMobileId=new Map(LEGACY_CITY_GARRISONS.filter(city=>city.mobileCityId).map(city=>[city.mobileCityId,city]));
function generatedNpcForce(index,chapter,kind,power){
  const targetTier=Math.min(7,Math.ceil(chapter*7/8));
  const roles=npcRoles[kind];
  const targetPower=Math.max(80,power*(1+Math.max(0,chapter-1)*0.035));
  const weights=kind==='Boss chiến dịch'?[0.31,0.23,0.18,0.18,0.1]:kind==='Danh thành'?[0.43,0.34,0.23]:[0.42,0.34,0.24];
  const formation=roles.map((role,slot)=>{
    let choices=TROOPS.filter(unit=>unit.role===role&&unit.tier<=targetTier);
    if(!choices.length){
      const fallbackRole=({ 'công thành':'bộ binh','trinh sát':'kỵ binh','đạo binh':'xạ thủ' })[role]||role;
      choices=TROOPS.filter(unit=>unit.role===fallbackRole);
    }
    if(!choices.length){
      choices=TROOPS.filter(unit=>unit.role==='bộ binh');
    }
    if(choices.length){
      const lowestTier=Math.min(...choices.map(unit=>unit.tier));
      choices=choices.filter(unit=>unit.tier===lowestTier);
    }
    const highestTier=Math.max(...choices.map(unit=>unit.tier));
    choices=choices.filter(unit=>unit.tier===highestTier);
    const unit=choices[(index+slot*5+chapter)%choices.length];
    const unitPower=unit.attack+unit.defense*0.85+unit.morale*0.08;
    return {unitId:unit.id,count:Math.max(1,Math.round(targetPower*weights[slot]/unitPower))};
  });
  const tacticId=kind==='Boss chiến dịch'?'mandate':kind==='Danh thành'?'fortress':kind==='Dã địa'?['ambush','charge','arcane'][index%3]:['arcane','ambush','fortress'][index%3];
  const title=kind==='Danh thành'?'Trấn thủ':kind==='Dã địa'?'Thảo khấu':kind==='Tiên sơn'?'Thủ sơn tiên trưởng':'Đại vương';
  const commander=kind==='Boss chiến dịch'?'Đế Tân · Trụ Vương':`${title} ${npcOfficerNames[(index*7+chapter)%npcOfficerNames.length]}`;
  const element=kind==='Boss chiến dịch'?'fire':npcElements[(index+chapter)%npcElements.length];
  return {commander,element,tactic:{id:tacticId,name:npcTactics[tacticId]},formation};
}
function applyMobileCityGarrison(node){
  const guards=node.mobileGarrison??[];
  if(!node.mobileCityId||guards.length!==5)return node;
  const sourceUnits=guards.map(guard=>({guard,unit:TROOPS.find(row=>row.mobileSourceId&&row.name===guard.troopText)}));
  if(sourceUnits.some(row=>!row.unit))return node;
  const oldTotal=(node.enemy?.formation??[]).reduce((sum,row)=>sum+Math.max(0,Number(row.count)||0),0);
  const total=Math.max(sourceUnits.length,oldTotal),extra=total-sourceUnits.length;
  const weights=sourceUnits.map(({guard})=>Math.max(1,Number(guard.rank)||1)),weightTotal=weights.reduce((sum,row)=>sum+row,0);
  const allocations=sourceUnits.map((entry,index)=>{
    const exact=extra*weights[index]/weightTotal,whole=Math.floor(exact);
    return {...entry,count:1+whole,remainder:exact-whole};
  });
  let left=total-allocations.reduce((sum,row)=>sum+row.count,0);
  for(const row of [...allocations].sort((a,b)=>b.remainder-a.remainder))if(left-->0)row.count++;
  return {...node,enemy:{...node.enemy,commander:guards[0].name,formationEvidence:'VERIFIED_MOBILE_IDENTITIES_SIMULATED_COUNTS',
    formation:allocations.map(({guard,unit,count})=>({unitId:unit.id,count,commander:guard.name,sourceTroopText:guard.troopText,sourceRank:guard.rank,evidence:'MIXED'}))}};
}
export const WORLD_NODES = Object.freeze(adaptSourceFacts('worldNodes', Array.from({ length: 120 }, (_, i) => {
  const chapterIndex=Math.floor(i/15);
  const localIndex=i%15;
  const citiesInChapter=chapterIndex<3?10:9;
  const fieldsInChapter=chapterIndex<3?3:chapterIndex===7?5:4;
  const isCity=localIndex<citiesInChapter;
  const isField=localIndex>=citiesInChapter&&localIndex<citiesInChapter+fieldsInChapter;
  const isBoss = i === 119;
  const chapter = chapterIndex + 1;
  const generatedName = `${regionPrefixes[Math.floor(i / regionSuffixes.length) % regionPrefixes.length]} ${regionSuffixes[i % regionSuffixes.length]}`;
  const name = isBoss ? 'Triều Ca · Trụ Vương' : generatedName;
  const kind=isBoss?'Boss chiến dịch':isCity?'Danh thành':isField?'Dã địa':'Tiên sơn';
  const power=isBoss?8400:80+i*34;
  return { id: `node-${String(i + 1).padStart(3,'0')}`, name, kind, isBoss, chapter,
    level: Math.max(1, Math.floor(i / 4) + 1), x: 9 + (i * 37) % 82, y: 11 + (i * 53) % 76,
    power, enemy:generatedNpcForce(i,chapter,kind,power), loot: { food: isBoss ? 3200 : 80 + i * 12, timber: isBoss ? 2400 : 65 + i * 9, stone: isBoss ? 2000 : 50 + i * 8, gold: isBoss ? 3600 : 45 + i * 8, jade: isBoss ? 8 : i % 7 === 0 ? 1 : 0 },
    evidence: 'SIMULATED', mobileCityId: null, mobileCityType: null, mobileFaction: null,
    mobileImage: '', mobileWallLevel: null, mobileOfficialLevel: null, mobileCoordinates: null, mobileGarrison: [], mobileGarrisonNote: null, sourceFieldStatus: 'UNKNOWN' };
})).map(node=>{
  const reference=legacyCityGarrisonByMobileId.get(node.mobileCityId);
  return applyMobileCityGarrison({...node,legacyGarrison:reference?.guards||[],legacyGarrisonCoordinateKey:reference?.coordinateKey||null});
}));

const mountainPrefixes=['Thanh Vân','Tử Tiêu','Huyền Đô','Thái Hư','Bồng Lai','Phương Trượng','Doanh Châu','Côn Lôn','Ngọc Hư','Linh Đài','Vạn Thọ','Tụ Tiên','Thục Sơn','Nga Mi','Thái Hành','Kinh Hoa','Lạc Già','Bắc Minh','Nam Hoa','Bạch Vân','Thanh Thành','La Phù','Chung Nam','Tiểu Hàn'];
const mountainSuffixes=['Phong','Vân','Hạc','Ngọc','Hỏa','Thủy','Lôi','Tùng','Trúc','Đào','Liên','Hà','Tinh','Nguyệt','Long','Phượng','Tử','Kim','Huyền','Bích','Thạch','Đan','Linh','Thiên','Địa','Thái'];
const simulatedImmortalMountains=adaptSourceFacts('immortalMountains', Array.from({length:624},(_,i)=>({
  id:`mountain-${String(i+1).padStart(3,'0')}`,
  name:`${mountainPrefixes[Math.floor(i/26)]} ${mountainSuffixes[i%26]}`,
  chapter:Math.floor(i/78)+1,rank:1+i%78,power:140+i*17,
  loot:{gold:80+i%640,jade:i%9===0?1:0,food:120+i%900},
  evidence:'SIMULATED'
})));
const elflandLocationsByID=[...LEGACY_ELFLAND_LOCATIONS].sort((a,b)=>Number(a.ElflandID)-Number(b.ElflandID));
const elflandFieldProvenance = (tableKey, field, sourceRowIndex) => ({
  ...LEGACY_ELFLAND_SOURCE.sourceTables[tableKey].fieldSources[field],
  sourceRowIndex
});
export const IMMORTAL_MOUNTAINS=Object.freeze(simulatedImmortalMountains.map((row,index)=>{
  const source=elflandLocationsByID[index];
  if(!source)throw new Error(`Missing legacy Tiên Sơn source row for runtime mountain ${row.id}.`);
  const sourceId=Number(source.ElflandID);
  return {
    ...row,
    name:source.ElflandName,
    legacySourceId:sourceId,
    legacyLevel:Number(source.ElflandLevel),
    legacyFloorCount:Number(source.FloorNum),
    legacyDescription:source.ElflandDescribe||'',
    legacyFloorRowIndexes:source.floorRowIndexes,
    legacyFieldProvenance:Object.freeze({
      sourceId:elflandFieldProvenance('locations','ElflandID',source.sourceRowIndex),
      name:elflandFieldProvenance('locations','ElflandName',source.sourceRowIndex),
      level:elflandFieldProvenance('locations','ElflandLevel',source.sourceRowIndex),
      floorCount:elflandFieldProvenance('locations','FloorNum',source.sourceRowIndex),
      description:elflandFieldProvenance('locations','ElflandDescribe',source.sourceRowIndex)
    }),
    legacyEvidence:'VERIFIED_LEGACY',
    legacyFloorRowIndexes:source.floorRowIndexes,
    fieldProvenance:Object.freeze({
      ...(row.fieldProvenance||{}),
      name:elflandFieldProvenance('locations','ElflandName',source.sourceRowIndex),
      legacySourceId:elflandFieldProvenance('locations','ElflandID',source.sourceRowIndex),
      legacyLevel:elflandFieldProvenance('locations','ElflandLevel',source.sourceRowIndex),
      legacyFloorCount:elflandFieldProvenance('locations','FloorNum',source.sourceRowIndex),
      legacyDescription:elflandFieldProvenance('locations','ElflandDescribe',source.sourceRowIndex)
    }),
    fieldEvidence:Object.freeze({
      id:'SIMULATED',name:'VERIFIED_LEGACY',chapter:'SIMULATED',rank:'SIMULATED',power:'SIMULATED',loot:'SIMULATED',
      legacySourceId:'VERIFIED_LEGACY',legacyLevel:'VERIFIED_LEGACY',legacyFloorCount:'VERIFIED_LEGACY',legacyDescription:'VERIFIED_LEGACY'
    }),
    evidence:'MIXED'
  };
}));

// Legacy config verifies these five Buzhou floors. Combat and reward simulation
// remains local; this source roster is exposed only as an integration reference.
export const TOWER_FLOORS = 9999;
export const BUZHOU_FLOORS = LEGACY_BUZHOU_FLOORS.length;
export const LEGACY_REFERENCE_COUNTS = Object.freeze({
  legacy147Soldiers: 39,
  legacy147Items: 2155,
  alternateItems: 2157,
  unprefixedItems: 2157,
  famousGenerals: 540,
  buildings: 21,
  technologyLevels: 570,
  trainingRequirements: 126,
  quests: 1158,
  famousCities: 75,
  elflands: 624,
  elflandFloors: 8992,
  elflandNpcFormations: LEGACY_ELFLAND_SOURCE.formationCount,
  elflandRewardRules: LEGACY_ELFLAND_SOURCE.rewardRuleCount,
  buzhouFixedNpcs: 90,
  legacyFamousCities: LEGACY_CITY_GARRISON_SOURCE.legacyCityCount,
  legacyFamousCityGarrisons: LEGACY_CITY_GARRISON_SOURCE.legacyGuardRecordCount
});

export const colorForElement = Object.freeze({ fire: '#d85d32', water: '#4385a1', earth: '#c29a55', metal: '#d9bf84', wood: '#5c9472', wind: '#81a98e' });
