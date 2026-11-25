import { BUILDINGS, HEROES, HERO_QUALITY_MULTIPLIERS, HERO_SKILLS, IMMORTAL_MOUNTAINS, ITEMS, QUESTS, RESOURCE_INFO, TECHNOLOGIES, TROOPS, WORLD_NODES, TOWER_FLOORS, BUZHOU_FLOORS } from './catalog.js';

export const SAVE_VERSION = 2;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
const RESOURCE_KEYS = Object.keys(RESOURCE_INFO);
const DEFAULT_SETTINGS = Object.freeze({ sound: false, effects: true, reducedMotion: false, autosave: true });
export const TAX_POLICIES=Object.freeze({
  relief:Object.freeze({label:'Khoan giảm',income:0.75,moralePerHour:0.12}),
  balanced:Object.freeze({label:'Trung dung',income:1,moralePerHour:0}),
  heavy:Object.freeze({label:'Thuế nặng',income:1.3,moralePerHour:-0.24})
});
export const TUTORIAL_STEPS=Object.freeze([
  Object.freeze({title:'Mở rộng sản xuất',description:'Xây Phong Mộc Trường để tạo thêm gỗ mỗi giờ.',action:'upgrade',data:{buildingId:'lumber'},complete:s=>(s.levels.lumber||0)>0}),
  Object.freeze({title:'Khai mở khoa kỹ',description:'Nghiên cứu Nông Chính tại Thái Học Viện.',action:'research',data:{techId:'tech-01'},complete:s=>(s.technologies['tech-01']||0)>0}),
  Object.freeze({title:'Dựng Phong Thần Đàn',description:'Mở nơi chiêu mộ thần tiên trong cơ đồ.',action:'upgrade',data:{buildingId:'altar'},complete:s=>(s.levels.altar||0)>0}),
  Object.freeze({title:'Chiêu mộ đồng hành',description:'Mời một thần tiên nhập phủ.',action:'recruit',data:{heroId:'hero-02'},complete:s=>s.stats.heroesRecruited>0}),
  Object.freeze({title:'Trang bị thần tiên',description:'Trang bị Bạch Ngọc Kiếm cho đội hình.',action:'equip',data:{itemId:'item-01',heroId:'hero-01'},complete:s=>s.stats.itemsEquipped>0}),
  Object.freeze({title:'Bổ sung quân đội',description:'Huấn luyện thêm một Dân binh.',action:'train',data:{troopId:'troop-01',count:1},complete:s=>s.stats.troopsTrained>0}),
  Object.freeze({title:'Mở đường chiến dịch',description:'Hành quân tới Thanh Khâu Quan và thắng trận đầu.',action:'march',data:{nodeId:'node-001',troopId:'troop-01'},complete:s=>s.stats.victories>0})
]);
const clone = value => structuredClone(value);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createNewGame(name = 'Triều Ca', now = Date.now()) {
  const levels = Object.fromEntries(BUILDINGS.map(b => [b.id, 0]));
  Object.assign(levels, { citadel: 2, barracks: 1, granary: 1, farm: 1, manor: 1, storehouse: 1, academy: 1 });
  const hero = HEROES[0];
  const troop = TROOPS[0];
  return {
    version: SAVE_VERSION,
    profile: { name: String(name || 'Triều Ca').slice(0, 22), createdAt: now },
    lastTickAt: now,
    resources: { food: 1600, timber: 1300, stone: 1150, iron: 1200, gold: 950, jade: 6 },
    population: 180,
    morale: 82,
    taxPolicy: 'balanced',
    fame: 0,
    levels,
    technologies: Object.fromEntries(TECHNOLOGIES.map(t => [t.id, 0])),
    legacyResearchArchive: {},
    heroes: [{ id: hero.id, level: 3, xp: 0, assigned: true, equipment: { weapon: null, armor: null, artifact: null }, skillLevel: 1, affinity: 0 }],
    cities: [{ id: 'capital', nodeId: null, name: String(name || 'Triều Ca').slice(0,22), level: 2, population: 180, isCapital: true }],
    items: ['item-01','item-02','item-04','item-07','item-13','item-14','item-15'],
    army: { [troop.id]: 18 },
    wounded: {},
    queues: { construction: null, training: null, research: null, march: null },
    world: { storyStage: 0, towerFloor: 0, buzhouFloor: 0, captures: [], scouted: [], scoutedKinds:{}, treaties: [], guildLevel: 0, marketDay: 1, campaignComplete: false, mountainWins: [], chapterProgress:Object.fromEntries(Array.from({length:8},(_,i)=>[String(i+1),{wins:0,fieldWins:0,citiesCaptured:0}])) },
    stats: { upgrades: 0, troopsTrained: 0, heroesRecruited: 0, itemsEquipped: 0, itemPurchases: 0, battles: 0, victories: 0, citiesCaptured: 0, bossesDefeated: 0, duels: 0, tradeCount: 0 },
    claims: [],
    reports: [],
    notifications: ['西岐烽火已起。先稳固城防，广积粮草，再择贤者同行。'],
    settings: { sound: false, effects: true, reducedMotion: false, autosave: true },
    tutorialStep: 0,
    nextReportId: 1
  };
}

export function migrateSave(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Cấu trúc tệp lưu không hợp lệ.');
  const s = clone(input);
  const sourceVersion=Number(s.version)||0;
  if (!s.version || s.version > SAVE_VERSION) throw new Error('Save đến từ phiên bản mới hơn, không thể nhập an toàn.');
  if (s.version < 1) throw new Error('Không nhận diện được phiên bản save.');
  s.profile = s.profile && typeof s.profile === 'object' ? s.profile : {};
  s.profile.name = String(s.profile.name || 'Triều Ca').trim().slice(0,22) || 'Triều Ca';
  s.profile.createdAt = Number(s.profile.createdAt) || now;
  s.resources = s.resources && typeof s.resources === 'object' ? s.resources : {};
  for(const key of Object.keys(s.resources))if(!RESOURCE_KEYS.includes(key))delete s.resources[key];
  for (const key of RESOURCE_KEYS) s.resources[key] = Math.max(0, Number(s.resources[key]) || 0);
  s.levels = s.levels && typeof s.levels === 'object' ? s.levels : {};
  for (const b of BUILDINGS) s.levels[b.id] = clamp(Number(s.levels?.[b.id]) || 0, 0, b.maxLevel);
  s.technologies = s.technologies && typeof s.technologies === 'object' ? s.technologies : {};
  for (const t of TECHNOLOGIES) s.technologies[t.id] = clamp(Number(s.technologies?.[t.id]) || 0, 0, t.maxLevel);
  s.population = clamp(Number(s.population) || 0, 0, 250_000);
  s.morale = clamp(Number(s.morale) || 0, 0, 100);
  s.taxPolicy=Object.hasOwn(TAX_POLICIES,s.taxPolicy)?s.taxPolicy:'balanced';
  s.fame = clamp(Number(s.fame) || 0, 0, 99_999_999);
  const knownHeroes = new Set();
  s.heroes = (Array.isArray(s.heroes) ? s.heroes : []).filter(h => {
    if (!h || typeof h !== 'object' || !HEROES.some(def => def.id === h.id) || knownHeroes.has(h.id)) return false;
    knownHeroes.add(h.id); return true;
  }).slice(0,60).map(h => {
    h.level = clamp(Number(h.level) || 1,1,60);
    h.xp = clamp(Number(h.xp) || 0,0,10_000_000);
    h.skillLevel = clamp(Number(h.skillLevel) || 1,1,10);
    h.affinity = clamp(Number(h.affinity) || 0,0,100);
    h.assigned = Boolean(h.assigned);
    const gear = h.equipment && typeof h.equipment === 'object' ? h.equipment : {};
    h.equipment = {
      weapon: ITEMS.some(i=>i.id===gear.weapon&&i.type==='vũ khí')?gear.weapon:null,
      armor: ITEMS.some(i=>i.id===gear.armor&&i.type==='giáp')?gear.armor:null,
      artifact: ITEMS.some(i=>i.id===gear.artifact&&i.type==='pháp bảo')?gear.artifact:null
    };
    return h;
  });
  s.items = Array.isArray(s.items) ? s.items.filter(id => ITEMS.some(item => item.id === id)).slice(0, 500) : [];
  s.army = s.army && typeof s.army === 'object' ? s.army : {};
  for (const [id, count] of Object.entries(s.army)) {
    if (!TROOPS.some(t => t.id === id)) delete s.army[id];
    else s.army[id] = clamp(Number(count) || 0, 0, 9_999_999);
  }
  const cap = storageCapacity(s);
  for (const key of RESOURCE_KEYS) s.resources[key] = Math.min(s.resources[key],key==='jade'?99_999:cap);
  const rawQueues = s.queues && typeof s.queues === 'object' ? s.queues : {};
  const safeQueue = q => q && typeof q === 'object' ? {
    ...q,
    startAt: clamp(Number(q.startAt)||now,0,now),
    finishAt: clamp(Number(q.finishAt)||now,0,now+30*24*60*60*1000)
  } : null;
  const construction = safeQueue(rawQueues.construction);
  const training = safeQueue(rawQueues.training);
  const research = safeQueue(rawQueues.research);
  const march = safeQueue(rawQueues.march);
  s.queues = {
    construction: construction&&(BUILDINGS.some(b=>b.id===construction.buildingId)||WORLD_NODES.some(n=>n.id===construction.cityId))?{...construction,level:clamp(Number(construction.level)||1,1,construction.cityId?10:30)}:null,
    training: training&&TROOPS.some(t=>t.id===training.troopId)?{...training,count:clamp(Number(training.count)||1,1,500)}:null,
    research: research&&TECHNOLOGIES.some(t=>t.id===research.techId)?{...research,level:clamp(Number(research.level)||1,1,30)}:null,
    march: march&&WORLD_NODES.some(n=>n.id===march.nodeId)&&march.troops&&typeof march.troops==='object'?{
      ...march,troops:Object.fromEntries(Object.entries(march.troops).filter(([id,n])=>TROOPS.some(t=>t.id===id)&&Number(n)>0).map(([id,n])=>[id,clamp(Number(n),0,9_999_999)])),seed:Number(march.seed)||1
    }:null
  };
  s.wounded = s.wounded && typeof s.wounded === 'object' ? s.wounded : {};
  for(const [id,count] of Object.entries(s.wounded)){
    if(!TROOPS.some(t=>t.id===id))delete s.wounded[id];
    else s.wounded[id]=clamp(Number(count)||0,0,9_999_999);
  }
  s.world = s.world && typeof s.world === 'object' ? s.world : {};
  s.world.storyStage=clamp(Number(s.world.storyStage)||0,0,24);
  s.world.towerFloor=clamp(Number(s.world.towerFloor)||0,0,TOWER_FLOORS);
  s.world.buzhouFloor=clamp(Number(s.world.buzhouFloor)||0,0,BUZHOU_FLOORS);
  s.world.campaignComplete=Boolean(s.world.campaignComplete);
  const mountainIds=new Set(IMMORTAL_MOUNTAINS.map(x=>x.id));
  s.world.mountainWins=Array.isArray(s.world.mountainWins)?[...new Set(s.world.mountainWins.filter(id=>mountainIds.has(id)))]:[];
  const validNodeIds=new Set(WORLD_NODES.map(n=>n.id));
  for(const key of ['captures','scouted','treaties'])s.world[key]=Array.isArray(s.world[key])?s.world[key].filter(id=>validNodeIds.has(id)): [];
  const oldScoutKinds=s.world.scoutedKinds&&typeof s.world.scoutedKinds==='object'?s.world.scoutedKinds:{};
  s.world.scoutedKinds=Object.fromEntries(s.world.scouted.map(id=>[id,['resources','immortals','army'].includes(oldScoutKinds[id])?oldScoutKinds[id]:'army']));
  const oldChapterProgress=s.world.chapterProgress&&typeof s.world.chapterProgress==='object'?s.world.chapterProgress:{};
  s.world.chapterProgress=Object.fromEntries(Array.from({length:8},(_,i)=>{
    const chapter=String(i+1),row=oldChapterProgress[chapter]&&typeof oldChapterProgress[chapter]==='object'?oldChapterProgress[chapter]:{};
    const captured=s.world.captures.filter(id=>WORLD_NODES.find(node=>node.id===id)?.chapter===i+1).length;
    return [chapter,{wins:clamp(Number(row.wins)||0,0,99_999),fieldWins:clamp(Number(row.fieldWins)||0,0,99_999),citiesCaptured:clamp(Number(row.citiesCaptured)||captured,0,99_999)}];
  }));
  s.world.marketDay=Math.max(1,Number(s.world.marketDay)||1);
  s.world.guildLevel=clamp(Number(s.world.guildLevel)||0,0,5);
  const rawCities=Array.isArray(s.cities)?s.cities:[];
  const seenCities=new Set();
  s.cities=rawCities.filter(city=>city&&typeof city==='object'&&(city.id==='capital'||validNodeIds.has(city.nodeId))&&!seenCities.has(city.id)&&(seenCities.add(city.id),true)).slice(0,76).map(city=>({
    id:city.id==='capital'?'capital':city.nodeId,nodeId:city.id==='capital'?null:city.nodeId,
    name:String(city.name||'Thành phụ').slice(0,30),level:clamp(Number(city.level)||1,1,10),
    population:clamp(Number(city.population)||80,1,50_000),isCapital:city.id==='capital'
  }));
  if(!s.cities.some(city=>city.isCapital))s.cities.unshift({id:'capital',nodeId:null,name:s.profile.name,level:s.levels.citadel||1,population:s.population,isCapital:true});
  if(s.queues.construction?.cityId&&!s.cities.some(city=>city.id===s.queues.construction.cityId&&!city.isCapital))s.queues.construction=null;
  const statDefaults={upgrades:0,troopsTrained:0,heroesRecruited:0,itemsEquipped:0,itemPurchases:0,battles:0,victories:0,citiesCaptured:0,bossesDefeated:0,duels:0,tradeCount:0};
  s.stats = s.stats && typeof s.stats === 'object' ? s.stats : {};
  for(const key of Object.keys(statDefaults))s.stats[key]=clamp(Number(s.stats[key])||0,0,99_999_999);
  s.claims = Array.isArray(s.claims) ? s.claims.filter(id=>QUESTS.some(q=>q.id===id)) : [];
  s.reports = Array.isArray(s.reports) ? s.reports.filter(r=>r&&typeof r==='object').slice(0,100) : [];
  s.notifications = Array.isArray(s.notifications) ? s.notifications.filter(x=>typeof x==='string').slice(0,12) : [];
  const retiredMeanings={'tech-06':'Quản Dân','tech-07':'Trị Thủy','tech-12':'Kỵ Thuật','tech-13':'Cung Nỏ','tech-14':'Y Đạo','tech-15':'Trận Đồ','tech-17':'Luyện Khí','tech-18':'Tinh Tượng','tech-19':'Ngoại Giao'};
  const rawResearchArchive=s.legacyResearchArchive&&typeof s.legacyResearchArchive==='object'&&!Array.isArray(s.legacyResearchArchive)?s.legacyResearchArchive:{};
  s.legacyResearchArchive=Object.fromEntries(Object.entries(rawResearchArchive).filter(([id])=>Object.hasOwn(retiredMeanings,id)).map(([id,row])=>[id,{level:clamp(Number(row?.level)||0,0,30),previousName:retiredMeanings[id],status:'ARCHIVED_UNMAPPED'}]).filter(([,row])=>row.level>0));
  if(sourceVersion<2){
    let archivedLevels=0;
    for(const [technologyId,previousName] of Object.entries(retiredMeanings)){
      const level=s.technologies[technologyId]||0;
      if(level<=0)continue;
      s.legacyResearchArchive[technologyId]={level,previousName,status:'ARCHIVED_UNMAPPED'};
      s.technologies[technologyId]=0;
      archivedLevels+=level;
    }
    if(archivedLevels)s.notifications=[`Đã lưu trữ ${archivedLevels} cấp khoa kỹ cũ chưa có ánh xạ Mobile an toàn; các cấp này không cộng chỉ số runtime.`,...s.notifications].slice(0,12);
  }
  s.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
  for(const key of Object.keys(DEFAULT_SETTINGS))if(typeof s.settings[key]!=='boolean')s.settings[key]=DEFAULT_SETTINGS[key];
  s.tutorialStep=clamp(Number(s.tutorialStep)||0,0,TUTORIAL_STEPS.length);
  s.nextReportId=Math.max(Number(s.nextReportId)||1,...s.reports.map(r=>(Number(r.id)||0)+1));
  s.lastTickAt = Math.min(Number(s.lastTickAt) || now, now);
  s.version = SAVE_VERSION;
  return s;
}

export function productionPerHour(state) {
  const lv = state.levels;
  const tech = state.technologies;
  const satelliteLevels=(state.cities||[]).filter(city=>!city.isCapital).reduce((sum,city)=>sum+city.level,0);
  const bonus = effect => 1 + TECHNOLOGIES.filter(t => t.effect === effect).reduce((n, t) => n + (tech[t.id] || 0) * technologyRate(t.id), 0);
  return {
    food: (18 + lv.farm * 52 + lv.granary * 7 + satelliteLevels*25) * bonus('food'),
    timber: (10 + lv.grove * 38 + lv.lumber * 12 + satelliteLevels*18) * bonus('timber'),
    stone: (8 + lv.mine * 34 + lv.quarry * 10 + satelliteLevels*14) * bonus('stone'),
    iron: (5 + lv.foundryfield * 28 + lv.foundry * 9 + satelliteLevels*12) * bonus('iron'),
    gold: (10 + lv.market * 25 + satelliteLevels*8 + Math.floor(state.population * (0.035 + lv.citadel * 0.002)) * bonus('gold')) * TAX_POLICIES[state.taxPolicy||'balanced'].income,
    jade: 0.12 + lv.altar * 0.12 + lv.manor * 0.025
  };
}

export function storageCapacity(state) {
  const base=2400 + (state.levels.storehouse || 0) * 1650 + (state.levels.granary || 0) * 220;
  return Math.floor(base*(1+(state.technologies?.['tech-06']||0)*technologyRate('tech-06',0.04)));
}

export function armyCount(state) { return Object.values(state.army).reduce((a, n) => a + n, 0); }

export function marchTroopCapacity(state) {
  const leaders=state.heroes.filter(hero=>hero.assigned).length;
  const sourcedRate=technologyRate('tech-13',0.02);
  return Math.floor(leaders*100_000*(1+(state.technologies?.['tech-13']||0)*sourcedRate));
}

export function quoteScouting(state,nodeId) {
  const node=WORLD_NODES.find(row=>row.id===nodeId);
  if(!node)return null;
  const type=node.kind==='Dã địa'?'resources':node.kind==='Tiên sơn'?'immortals':'army';
  const technologyId=type==='resources'?'tech-15':type==='immortals'?'tech-14':'tech-17';
  const technologyLevel=state.technologies?.[technologyId]||0;
  const rate=technologyRate(technologyId,0.02);
  const chance=Math.min(0.9,0.5+technologyLevel*rate+(state.levels.watch||0)*0.01+state.fame/20_000);
  const baseCost=Math.max(4,12+node.chapter*3-(state.levels.watch||0));
  return {type,technologyId,chance,cost:Math.max(2,Math.ceil(baseCost)),evidence:technologyLevel?'MIXED':'SIMULATED'};
}

const numericSourceStat = (stats, label) => {
  const value = stats.find(stat => stat.label === label)?.value;
  const match = String(value ?? '').match(/-?\d+(?:[.,]\d+)?/);
  return match ? Math.max(0, Number(match[0].replace(',', '.')) || 0) : 0;
};

// Mobile publishes the base attributes, not this game's duel formula. This
// local rating uses those sourced values with explicit SIMULATED coefficients.
export function heroBaseRating(def) {
  const stats = Array.isArray(def.mobileBaseStats) ? def.mobileBaseStats : [];
  const physical = numericSourceStat(stats, 'Dũng vũ');
  const arcane = numericSourceStat(stats, 'Đạo pháp');
  const strategy = numericSourceStat(stats, 'Mưu lược');
  const vitality = numericSourceStat(stats, 'Thể lực');
  const spirit = numericSourceStat(stats, 'Tinh lực');
  if ([physical, arcane, strategy, vitality, spirit].some(value => value > 0)) {
    return 14 + 3 * Math.log2(1 + physical + arcane + strategy * 0.72)
      + 1.5 * Math.log2(1 + vitality) + Math.log2(1 + spirit);
  }
  return def.attack + def.defense + def.wisdom * 0.72;
}

function mobileItemStat(item,label) {
  const normalize=value=>String(value||'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('vi').trim();
  const row=(item.mobileStats||[]).find(entry=>normalize(entry[0])===normalize(label));
  if(!row)return 0;
  let raw=String(row[1]||'').replace(/[^\d.,-]/g,'');
  if(/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(raw))raw=raw.replace(/\./g,'').replace(',','.');
  else raw=raw.replace(',','.');
  const value=Number(raw);
  return Number.isFinite(value)?value:0;
}

function mobileEquipmentRating(item) {
  return (mobileItemStat(item,'Công kích')+mobileItemStat(item,'Phòng thủ'))*0.15
    +mobileItemStat(item,'Vũ lực')*0.3+mobileItemStat(item,'Đạo pháp')*0.3+mobileItemStat(item,'Mưu lược')*0.15;
}

export function heroPower(hero, state) {
  const def = HEROES.find(h => h.id === hero.id);
  if (!def) return 0;
  const gear = Object.values(hero.equipment || {}).filter(Boolean).reduce((sum, id) => {
    const item=ITEMS.find(row=>row.id===id);
    return sum+(item?.mobileStats?.length?mobileEquipmentRating(item):item?.bonus||0);
  }, 0);
  const affinity=1+clamp(Number(hero.affinity)||0,0,100)*0.0015;
  const quality=HERO_QUALITY_MULTIPLIERS[def.quality]||1;
  return Math.round((heroBaseRating(def) + gear) * quality * (1 + hero.level * 0.14) * (1 + hero.skillLevel * 0.035) * affinity);
}

function awardHeroXp(hero, amount) {
  if(hero.level>=60)return 0;
  hero.xp=Math.max(0,Number(hero.xp)||0)+Math.max(0,Number(amount)||0);
  let levels=0;
  while(hero.level<60){
    const need=100+hero.level*hero.level*34;
    if(hero.xp<need)break;
    hero.xp-=need;
    hero.level++;
    levels++;
    if(hero.level%4===0)hero.skillLevel=Math.min(10,hero.skillLevel+1);
  }
  if(hero.level>=60)hero.xp=0;
  return levels;
}

function awardHeroAffinity(hero, amount) {
  const before=clamp(Number(hero.affinity)||0,0,100);
  hero.affinity=clamp(before+Math.max(0,Number(amount)||0),0,100);
  return hero.affinity-before;
}

function heroCombatProfile(heroList,state,enemyElement) {
  const rows=heroList.map(save=>({save,data:HEROES.find(def=>def.id===save.id)})).filter(row=>row.data);
  const equippedBonus=(row,slot)=>ITEMS.find(item=>item.id===row.save.equipment?.[slot])?.bonus||0;
  const equipmentStat=(row,slot,label)=>{
    const item=ITEMS.find(entry=>entry.id===row.save.equipment?.[slot]);
    return item?.mobileStats?.length?mobileItemStat(item,label)*0.001:equippedBonus(row,slot)*0.001;
  };
  const sourceArtifacts=rows.map(row=>({row,item:ITEMS.find(item=>item.id===row.save.equipment?.artifact)}))
    .filter(entry=>entry.item?.mobileSourceId&&entry.item.fieldEvidence?.mobileAbilityText)
    .map(({row,item})=>({heroId:row.save.id,item,...parseMobileArtifactEffect(item)}));
  const artifactSum=key=>sourceArtifacts.reduce((sum,entry)=>sum+(entry.modifiers[key]||0),0);
  const artifactAttack=clamp(artifactSum('ownAttack'),-0.5,0.6);
  const artifactDefense=clamp(artifactSum('ownDefense'),-0.5,0.6);
  const artifactEnemyAttackReduction=clamp(artifactSum('enemyAttackReduction'),-0.45,0.45);
  const artifactEnemyDefenseReduction=clamp(artifactSum('enemyDefenseReduction'),-0.45,0.45);
  const artifactOwnTroopBonus=clamp(artifactSum('ownTroopBonus'),-0.4,0.4);
  const artifactEnemyTroopLoss=clamp(artifactSum('enemyTroopLoss'),0,0.45);
  const artifactOwnTroopRecovery=clamp(artifactSum('ownTroopRecovery'),0,0.45);
  const equipmentAttack=rows.reduce((sum,row)=>sum+equipmentStat(row,'weapon','Công kích'),0);
  const equipmentDefense=rows.reduce((sum,row)=>sum+equipmentStat(row,'armor','Phòng thủ'),0);
  const artifactSkillBonus=rows.reduce((sum,row)=>sum+equippedBonus(row,'artifact')*0.001,0);
  const has=skill=>rows.filter(row=>row.data.skill===skill).reduce((n,row)=>n+Math.max(1,row.save.skillLevel||1)*(1+clamp(Number(row.save.affinity)||0,0,100)*0.002),0);
  const attack=has('Hỏa Phù Liệt Trận')*0.012+equipmentAttack;
  const defense=has('Huyền Thủy Hộ Thể')*0.012+equipmentDefense;
  const opening=has('Phong Lôi Kích')*0.03;
  const formation=has('Thất Tinh Trợ Chiến')*0.01;
  const averageAffinity=rows.reduce((n,row)=>n+clamp(Number(row.save.affinity)||0,0,100),0)/Math.max(1,rows.length);
  const elementCounts=Object.values(rows.reduce((counts,row)=>{counts[row.data.element]=(counts[row.data.element]||0)+1;return counts;},{}));
  const sameElementPairs=elementCounts.reduce((n,count)=>n+count*(count-1)/2,0);
  const elementResonance=Math.min(0.15,sameElementPairs*averageAffinity/100*0.05);
  const elementCounters={fire:'metal',metal:'wood',wood:'earth',earth:'water',water:'fire'};
  const elementMatchup=clamp(rows.reduce((bonus,row)=>bonus+(elementCounters[row.data.element]===enemyElement?0.025:elementCounters[enemyElement]===row.data.element?-0.025:0),0),-0.075,0.075);
  const affinityBonus=averageAffinity*0.0015;
  const skills=rows.map(row=>{
    const definition=HERO_SKILLS.find(skill=>skill.name===row.data.skill);
    if(!definition)return null;
    const mastery=Math.max(1,row.save.skillLevel||1)*(1+clamp(Number(row.save.affinity)||0,0,100)*0.002);
    const artifactBonus=equippedBonus(row,'artifact');
    return {id:definition.id,name:definition.name,activeName:definition.activeName,active:definition.active,triggerRound:definition.triggerRound,
      coefficient:definition.baseCoefficient+definition.perMastery*mastery+artifactBonus*0.001,mastery,artifactBonus};
  }).filter(Boolean);
  const activePowerBonus=skills.reduce((n,skill)=>n+skill.mastery*0.002+skill.artifactBonus*0.001,0);
  return { names:rows.map(row=>row.data.skill),skills,sourceArtifacts,bonuses:{attack,defense,opening,formation,affinity:affinityBonus,elementResonance,elementMatchup,equipmentAttack,equipmentDefense,artifactSkillBonus,artifactArmyAttack:artifactAttack,artifactArmyDefense:artifactDefense,artifactEnemyAttackReduction,artifactEnemyDefenseReduction,artifactOwnTroopBonus,artifactEnemyTroopLoss,artifactOwnTroopRecovery,activePowerBonus},
    powerMultiplier:1+(attack+defense+opening+formation)*0.35+elementResonance+activePowerBonus };
}

export function armyPower(state, counts = state.army) {
  let total = 0;
  for (const [id, amount] of Object.entries(counts)) {
    const t = TROOPS.find(x => x.id === id);
    if (t) {
      total += amount * (t.attack + t.defense * 0.85 + t.morale * 0.08) * (1 + (state.technologies['tech-10'] || 0) * technologyRate('tech-10'));
    }
  }
  return Math.round(total + state.heroes.filter(h => h.assigned).reduce((sum, h) => sum + heroPower(h, state), 0) * 0.45);
}

export function questProgress(state, quest) {
  switch (quest.type) {
    case 'chapterField': return Number(state.world.chapterProgress?.[String(quest.chapter)]?.fieldWins)||0;
    case 'upgrade': return state.levels[quest.target] || 0;
    case 'train': return state.stats.troopsTrained;
    case 'recruit': return state.stats.heroesRecruited;
    case 'equip': return state.stats.itemsEquipped;
    case 'win': return state.stats.victories;
    case 'tower': return state.world.towerFloor;
    case 'capture': return state.stats.citiesCaptured;
    case 'buzhou': return state.world.buzhouFloor;
    case 'guild': return state.world.guildLevel;
    case 'power': return armyPower(state);
    case 'boss': return state.stats.bossesDefeated;
    case 'mountain': return state.world.mountainWins.length;
    default: return 0;
  }
}

export function activeQuest(state) {
  const chapter=unlockedChapter(state);
  return QUESTS.find(q=>q.mainStory&&!state.claims.includes(q.id)&&q.chapter<=chapter)
    || QUESTS.find(q=>!state.claims.includes(q.id)&&q.chapter<=chapter)||null;
}

export function unlockedChapter(state) {
  return clamp(1+Math.floor((Number(state?.world?.storyStage)||0)/3),1,8);
}

function costFor(baseCost, nextLevel) {
  return Object.fromEntries(Object.entries(baseCost).map(([key, value]) => [key, Math.max(0, Math.ceil(value * Math.pow(nextLevel, 1.35) * 0.42))]));
}

function progressionCost(catalogLevels, baseCost, level) {
  const row = catalogLevels?.find(item => Number(item.level) === Number(level));
  return row?.cost ? { ...row.cost } : costFor(baseCost, level);
}

function technologyRate(technologyId, fallback = 0.012) {
  const firstLevel=TECHNOLOGIES.find(row=>row.id===technologyId)?.mobileLevelCosts?.find(row=>Number(row.level)===1);
  const match=String(firstLevel?.effect||'').match(/([+-]?\d+(?:[.,]\d+)?)\s*%/);
  return match?Number(match[1].replace(',','.'))/100:fallback;
}

export function quoteBuilding(state, buildingId) {
  const b = BUILDINGS.find(x => x.id === buildingId);
  if (!b) return null;
  const level = (state.levels[b.id] || 0) + 1;
  const cost = progressionCost(b.mobileLevelCosts, b.baseCost, level);
  return { level, cost, seconds: b.seconds * Math.pow(level, 1.2), maxed: level > b.maxLevel,
    locked: b.id !== 'citadel' && (state.levels.citadel || 0) < Math.max(1, Math.ceil(level / 2)),
    costEvidence: b.mobileLevelCosts?.some(item => Number(item.level) === level) ? 'VERIFIED_MOBILE' : 'SIMULATED' };
}

export function quoteCityUpgrade(state, cityId) {
  const city=(state.cities||[]).find(row=>row.id===cityId&&!row.isCapital);
  if(!city)return null;
  const level=city.level+1;
  const cost=costFor({food:280,timber:210,stone:150,gold:180},level);
  return {level,cost,seconds:20*Math.pow(level,1.2),maxed:level>10,
    locked:(state.levels.citadel||0)<Math.max(2,Math.ceil(level/2)+1)};
}

export function quoteTraining(state, troopId, count = 1) {
  const t = TROOPS.find(x => x.id === troopId);
  if (!t) return null;
  count = clamp(Math.floor(Number(count) || 1), 1, 500);
  return { count, cost: Object.fromEntries(Object.entries(t.cost).map(([key, value]) => [key, value * count])),
    seconds: Math.max(4, t.trainSeconds * count), locked: (state.levels.citadel || 0) < t.unlockCity };
}

function evaluateResearchRequirements(state, requirementText='') {
  const requirements=String(requirementText||'').split(/\s*[·,]\s*/).map(value=>value.trim()).filter(Boolean);
  const unmet=[],unknown=[];
  for(const requirement of requirements){
    const match=requirement.match(/^(.+?)\s+(\d+)$/);
    if(!match){unknown.push(requirement);continue;}
    const [,name,rawLevel]=match,requiredLevel=Number(rawLevel);
    const building=BUILDINGS.find(row=>row.name===name);
    if(building){if((state.levels[building.id]||0)<requiredLevel)unmet.push(requirement);continue;}
    const technology=TECHNOLOGIES.find(row=>row.name===name);
    if(technology){if((state.technologies[technology.id]||0)<requiredLevel)unmet.push(requirement);continue;}
    unknown.push(requirement);
  }
  return {met:unmet.length===0,status:unmet.length?'LOCKED':unknown.length?'PARTIAL_UNKNOWN':requirements.length?'SATISFIED':'UNKNOWN',unmet,unknown};
}

export function quoteResearch(state, techId) {
  const t = TECHNOLOGIES.find(x => x.id === techId);
  if (!t) return null;
  const level = (state.technologies[t.id] || 0) + 1;
  const nextRow=t.mobileLevelCosts?.find(item=>Number(item.level)===level);
  const requirement=evaluateResearchRequirements(state,nextRow?.requirement||'');
  return { level, cost: progressionCost(t.mobileLevelCosts, t.baseCost, level), seconds: t.seconds * Math.pow(level, 1.12), maxed: level > t.maxLevel,
    costEvidence: nextRow ? 'VERIFIED_MOBILE' : 'SIMULATED', requirementText:nextRow?.requirement||'',
    requirementStatus:requirement.status, requirementSatisfied:requirement.met, unmetRequirements:requirement.unmet, unknownRequirements:requirement.unknown };
}

function canAfford(state, cost) { return Object.entries(cost).every(([key, amount]) => (state.resources[key] || 0) >= amount); }

export function quoteItemPurchase(state, itemId) {
  const item=ITEMS.find(row=>row.id===itemId&&row.type==='vật phẩm');
  if(!item||item.mobileSourceId&&!item.mobileAvailableAtMerchant)return null;
  const cost={gold:90*item.tier,food:45*item.tier};
  if(item.tier>=8)cost.jade=1;
  return {cost,available:state.items.length<500&&canAfford(state,cost),costEvidence:item.mobileSourceId?'SIMULATED_SOURCE_PRICE':'SIMULATED'};
}

function debit(state, cost) {
  if (!canAfford(state, cost)) throw new Error('Tài nguyên chưa đủ. Hãy chờ sản xuất hoặc đổi hàng ở Triều Ca Thị.');
  for (const [key, amount] of Object.entries(cost)) state.resources[key] -= amount;
}

function credit(state, rewards) {
  const cap = storageCapacity(state);
  for (const [key, amount] of Object.entries(rewards)) {
    if (RESOURCE_KEYS.includes(key)) state.resources[key] = Math.min(key === 'jade' ? 99_999 : cap, state.resources[key] + Math.max(0, Number(amount) || 0));
  }
}

function note(state, message) {
  state.notifications.unshift(message);
  state.notifications = state.notifications.slice(0, 12);
}

function updateTutorial(state) {
  let step=0;
  while(step<TUTORIAL_STEPS.length&&TUTORIAL_STEPS[step].complete(state))step++;
  if(step>state.tutorialStep){
    const message=step===TUTORIAL_STEPS.length?'Tân chủ đã hoàn tất chỉ dẫn nhập môn; hãy tiếp tục chính tuyến và chinh phục thiên hạ.':`Chỉ dẫn nhập môn hoàn thành. ${TUTORIAL_STEPS[step].title} là bước tiếp theo.`;
    note(state,message);
  }
  state.tutorialStep=step;
}

function report(state, entry) {
  const id = state.nextReportId++;
  state.reports.unshift({ id, at: Date.now(), ...entry });
  state.reports = state.reports.slice(0, 100);
  return id;
}

function completeQueue(state, key, now) {
  const q = state.queues[key];
  if (!q || q.finishAt > now) return;
  state.queues[key] = null;
  if (key === 'construction') {
    if(q.cityId){
      const city=state.cities.find(row=>row.id===q.cityId&&!row.isCapital);
      if(city){city.level=Math.min(10,q.level);state.stats.upgrades++;note(state,`${city.name} đã hoàn thành nâng cấp thành phụ cấp ${city.level}.`);}
    }else{
      state.levels[q.buildingId] = Math.min(30, (state.levels[q.buildingId] || 0) + 1);
      state.stats.upgrades++;
      note(state, `${BUILDINGS.find(b => b.id === q.buildingId)?.name || 'Công trình'} đã hoàn thành cấp ${state.levels[q.buildingId]}.`);
    }
  } else if (key === 'training') {
    state.army[q.troopId] = (state.army[q.troopId] || 0) + q.count;
    state.stats.troopsTrained += q.count;
    note(state, `Đã huấn luyện ${q.count} ${TROOPS.find(t => t.id === q.troopId)?.name || 'quân sĩ'}.`);
  } else if (key === 'research') {
    state.technologies[q.techId]++;
    note(state, `Khoa kỹ ${TECHNOLOGIES.find(t => t.id === q.techId)?.name || ''} tăng lên cấp ${state.technologies[q.techId]}.`);
  } else if (key === 'march') {
    settleMarch(state, q, now);
  }
}

function seededRandom(seed) {
  let x = seed >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 0x100000000; };
}

function openMobileChest(state,item,now) {
  const opening=item.mobileOpening;
  if(!opening?.rewards?.length)throw new Error('Rương nguồn chưa có danh sách vật phẩm mở ra.');
  const boxIndex=state.items.indexOf(item.id);
  if(boxIndex<0)throw new Error('Không tìm thấy rương trong túi đồ.');
  state.items.splice(boxIndex,1);
  if(opening.requiredKey){
    const key=ITEMS.find(row=>row.name===opening.requiredKey&&row.fieldProvenance?.mobileSourceId?.sourceTable==='vat-pham');
    const keyIndex=key?state.items.indexOf(key.id):-1;
    if(keyIndex<0)throw new Error(`Cần ${opening.requiredKey} để mở rương này.`);
    state.items.splice(keyIndex,1);
  }
  let rewards=opening.rewards;
  if(opening.mode!=='all'){
    const groupCounts=new Map();
    for(const reward of rewards){
      const group=String(reward.weightText||'').match(/^Nhóm\s+(\d+(?:[.,]\d+)?)\s*%/iu);
      if(group){const key=group[0];groupCounts.set(key,(groupCounts.get(key)||0)+1);}
    }
    const weights=rewards.map(reward=>{
      const text=String(reward.weightText||'');
      const group=text.match(/^Nhóm\s+(\d+(?:[.,]\d+)?)\s*%/iu);
      if(group)return (Number(group[1].replace(',','.'))||0)/Math.max(1,groupCounts.get(group[0])||1);
      const percent=text.match(/^(\d+(?:[.,]\d+)?)\s*%/);
      return percent?Number(percent[1].replace(',','.'))||0:null;
    });
    const exactWeights=weights.every(value=>value!==null)&&weights.some(value=>value>0);
    const normalizedWeights=exactWeights?weights:rewards.map(()=>1);
    const total=normalizedWeights.reduce((sum,value)=>sum+value,0);
    const sourceSeed=(Number(now)^Number(item.mobileSourceId||0)^state.stats.itemPurchases^state.reports.length)>>>0;
    let roll=seededRandom(sourceSeed)()*total;
    const selected=rewards.find((reward,index)=>{roll-=normalizedWeights[index];return roll<0;})||rewards.at(-1);
    rewards=[selected];
  }
  const resolved=rewards.map(reward=>{
    const [,category,sourceId]=String(reward.link||'').match(/^(vat-pham|phap-bao)\/(.+)$/)||[];
    const target=category?ITEMS.find(row=>row.mobileSourceId===sourceId&&row.fieldProvenance?.mobileSourceId?.sourceTable===category):null;
    if(!target)throw new Error(`Chưa có adapter runtime cho kết quả ${reward.link||reward.name}.`);
    const quantityText=String(reward.quantityText||'');
    const quantityMatch=quantityText.match(/[x×]\s*(\d+)/iu)||quantityText.match(/^(\d+)$/);
    return {target,count:Math.max(1,Math.min(500,Number(quantityMatch?.[1])||1))};
  });
  const requiredSlots=resolved.reduce((sum,row)=>sum+row.count,0);
  if(state.items.length+requiredSlots>500)throw new Error('Túi đồ chưa đủ chỗ để nhận hết vật phẩm trong rương.');
  for(const {target,count} of resolved)for(let i=0;i<count;i++)state.items.push(target.id);
  note(state,`Đã mở ${item.name}: ${resolved.map(row=>`${row.count>1?`${row.count}× `:''}${row.target.name}`).join(' · ')}.`);
}

const combatLabel = value => String(value||'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('vi').trim();

function parseMobileArtifactEffect(item) {
  const text=String(item.mobileAbilityText||item.effect||'');
  const normalized=combatLabel(text);
  const modifiers={ownAttack:0,ownDefense:0,enemyAttackReduction:0,enemyDefenseReduction:0,ownTroopBonus:0,ownTroopRecovery:0,enemyTroopLoss:0};
  let parsedCount=0;
  const effectPattern=/(tang|giam|hoi)\s+(\d+(?:[.,]\d+)?)\s*%\s*([^,.;]+)/g;
  for(const match of normalized.matchAll(effectPattern)){
    const [,action,rawAmount,clause]=match;
    const amount=(Number(rawAmount.replace(',','.'))||0)/100;
    const enemy=/\b(dich|doi phuong)\b/.test(clause);
    const sign=action==='giam'?-1:1;
    let key=null,value=0;
    if(/cong kich|tan cong/.test(clause)){
      key=enemy?'enemyAttackReduction':'ownAttack';
      value=enemy?-sign*amount:sign*amount;
    }else if(/phong thu/.test(clause)){
      key=enemy?'enemyDefenseReduction':'ownDefense';
      value=enemy?-sign*amount:sign*amount;
    }else if(/so linh|binh luc|binh si|binh linh/.test(clause)){
      if(action==='hoi'&&!enemy)key='ownTroopRecovery';
      else if(enemy){key='enemyTroopLoss';value=-sign*amount;}
      else {key='ownTroopBonus';value=sign*amount;}
    }
    if(key){modifiers[key]+=value;parsedCount++;}
  }
  const unsupported=/vo hieu|khoa|cam than tien|nuot hieu qua|xua tan|tra lai|chan moi don|dua the luc|dot tinh luc|dot the luc|trung thanh|do ben|hiep nay|chi hieu luc|khong cho thay|\bneu\b|\bkhi\b/.test(normalized);
  return {
    modifiers,
    supported:parsedCount>0,
    status:parsedCount===0?'UNKNOWN':unsupported?'PARTIAL_UNKNOWN':'SOURCE_VALUES_SIMULATED_STACKING',
    evidence:item.fieldEvidence?.mobileAbilityText||'UNKNOWN'
  };
}

function sourcedCounterBonus(attackRows, defendRows, fallbackRatio) {
  const attackTotal=attackRows.reduce((sum,row)=>sum+row.count,0);
  const defendTotal=defendRows.reduce((sum,row)=>sum+row.count,0);
  if(!attackTotal||!defendTotal)return {bonus:0,sourceCoverage:0};
  let bonus=0,sourceCoverage=0;
  for(const attacker of attackRows){
    for(const defender of defendRows){
      const weight=(attacker.count/attackTotal)*(defender.count/defendTotal);
      const sourceRows=attacker.unit.mobileCounterRows;
      if(Array.isArray(sourceRows)&&sourceRows.length&&defender.unit.mobileClass){
        sourceCoverage+=weight;
        const defenderClass=combatLabel(defender.unit.mobileClass);
        const defenderName=combatLabel(defender.unit.name);
        for(const counter of sourceRows){
          const target=String(counter.target||'');
          const targetClass=combatLabel(target.split('(')[0]);
          const exception=target.match(/\(\s*trừ\s+(.+?)\s*\)/iu)?.[1];
          if(exception&&defenderName.includes(combatLabel(exception)))continue;
          if(targetClass&&(defenderClass===targetClass||defenderClass.includes(targetClass)||targetClass.includes(defenderClass))){
            bonus+=weight*(Number(counter.modifier)||0);
            break;
          }
        }
      }else if(attacker.unit.counter===defender.unit.role){
        bonus+=weight*fallbackRatio;
      }
    }
  }
  return {bonus,sourceCoverage};
}

function resolveArmyCombat(state, node, troops, seed) {
  const rng = seededRandom(seed);
  const heroList = state.heroes.filter(h => h.assigned).slice(0, 3);
  const heroProfile=heroCombatProfile(heroList,state,node.enemy?.element);
  const troopRows = Object.entries(troops).map(([id, count]) => ({ unit: TROOPS.find(t => t.id === id), count })).filter(x => x.unit && x.count > 0);
  const enemyRows=(node.enemy?.formation||[]).map(row=>({unit:TROOPS.find(t=>t.id===row.unitId),count:row.count})).filter(row=>row.unit&&row.count>0);
  const total = troopRows.reduce((n, row) => n + row.count, 0);
  const roles = troopRows.map(row => row.unit.role);
  const enemyRoles=enemyRows.map(row=>row.unit.role);
  const enemyTotal=enemyRows.reduce((n,row)=>n+row.count,0);
  const ownCounterRatio=troopRows.reduce((n,row)=>n+(enemyRoles.includes(row.unit.counter)?row.count:0),0)/Math.max(1,total);
  const enemyCounterRatio=enemyRows.reduce((n,row)=>n+(roles.includes(row.unit.counter)?row.count:0),0)/Math.max(1,enemyTotal);
  const ownSynergyRatio=troopRows.reduce((n,row)=>n+(roles.includes(row.unit.counter)?row.count:0),0)/Math.max(1,total);
  const enemySynergyRatio=enemyRows.reduce((n,row)=>n+(enemyRoles.includes(row.unit.counter)?row.count:0),0)/Math.max(1,enemyTotal);
  const ownCounterEvidence=sourcedCounterBonus(troopRows,enemyRows,0.2);
  const enemyCounterEvidence=sourcedCounterBonus(enemyRows,troopRows,0.2);
  const laneCount=rows=>Object.fromEntries(['front','rear','siege'].map(lane=>[lane,rows.reduce((n,row)=>n+(row.unit.lane===lane?row.count:0),0)]));
  const ownLanes=laneCount(troopRows),enemyLanes=laneCount(enemyRows);
  const ownBalanced=ownLanes.front>0&&(ownLanes.rear+ownLanes.siege)>0;
  const enemyBalanced=enemyLanes.front>0&&(enemyLanes.rear+enemyLanes.siege)>0;
  const formationBonus=1+Math.min(0.42,ownSynergyRatio*0.14+(ownCounterEvidence.sourceCoverage?0:ownCounterRatio*0.14)+(ownBalanced?0.05:0));
  const heroBonus = heroList.reduce((n, h) => n + heroPower(h, state), 0) * 0.55;
  const ownPower = Math.max(1, armyPower(state, troops) * (1+heroProfile.bonuses.artifactOwnTroopBonus) * formationBonus + heroBonus);
  const treatyBonus=state.world.treaties.includes(node.id)?0.88:1;
  const enemyPower = Math.max(80, node.power * (1 + Math.max(0, node.chapter - 1) * 0.035) * treatyBonus * (1+(enemyCounterEvidence.sourceCoverage?0:enemyCounterRatio*0.14)+enemySynergyRatio*0.06+(enemyBalanced?0.04:0)) * (1-heroProfile.bonuses.artifactEnemyTroopLoss));
  const initiative = troopRows.reduce((n, row) => n + (row.unit.speed+row.unit.range*0.3) * row.count, 0) / Math.max(1, total);
  const enemyInitiative=enemyRows.reduce((n,row)=>n+(row.unit.speed+row.unit.range*0.3)*row.count,0)/Math.max(1,enemyTotal);
  const tactics={
    ambush:{opening:0.2}, fortress:{health:1.18,defense:0.06}, charge:{opening:0.18},
    arcane:{attack:0.09}, mandate:{health:1.14,attack:0.08,defense:0.04}
  };
  const tactic=tactics[node.enemy?.tactic?.id]||{};
  const enemyHealthBase=enemyPower*(tactic.health||1)*(enemyBalanced?1.04:1);
  const rounds = [];
  const troopHealthResearch=(state.technologies['tech-12']||0)*technologyRate('tech-12',0.02);
  const ownHealthBase=ownPower * (1 + state.morale / 500 + troopHealthResearch + heroProfile.bonuses.formation + heroProfile.bonuses.artifactOwnTroopRecovery);
  let ownHealth = ownHealthBase;
  let enemyHealth = enemyHealthBase;
  let round = 0;
  while (ownHealth > 0 && enemyHealth > 0 && round < 6) {
    round++;
    const enemyDefense=Math.min(0.26,enemyCounterRatio*0.08+(tactic.defense||0));
    const ownCounterDamage=ownCounterEvidence.sourceCoverage?ownCounterEvidence.bonus:ownCounterRatio*0.2;
    const enemyCounterDamage=enemyCounterEvidence.sourceCoverage?enemyCounterEvidence.bonus:enemyCounterRatio*0.2;
    const baseOwnDamage = Math.max(1, ownPower * (0.19 + rng() * 0.11) * (1+ownCounterDamage+(ownBalanced?0.06:0)+heroProfile.bonuses.attack+heroProfile.bonuses.artifactArmyAttack+(round===1?heroProfile.bonuses.opening:0)) * (1-enemyDefense) * (1+heroProfile.bonuses.artifactEnemyDefenseReduction) * (round === 1 && initiative > 10 ? 1.13 : 1));
    const ownDamage = Math.max(1,baseOwnDamage*(1+heroProfile.bonuses.elementMatchup));
    const researchDefense=Math.min(0.24,(state.technologies['tech-11']||0)*technologyRate('tech-11',0.004));
    const npcOpening=round===1&&enemyInitiative>initiative?(tactic.opening||0.1):0;
    const enemyDamage = Math.max(1, enemyPower * (0.17 + rng() * 0.12) * (1+enemyCounterDamage+enemySynergyRatio*0.04+(tactic.attack||0)+npcOpening) * (enemyBalanced?1.04:1) * Math.max(0.55,1-heroProfile.bonuses.defense-heroProfile.bonuses.artifactArmyDefense-researchDefense-heroProfile.bonuses.artifactEnemyAttackReduction) * Math.max(0.8,1-heroProfile.bonuses.elementMatchup*0.6) * (round === 1 && initiative < 6 ? 1.12 : 1));
    const activeSkills=heroProfile.skills.filter(skill=>skill.triggerRound===round);
    let skillDamage=0,shieldRatio=0,healing=0;
    for(const skill of activeSkills){
      if(skill.active==='damage')skillDamage+=ownPower*skill.coefficient;
      else if(skill.active==='shield')shieldRatio+=skill.coefficient;
      else if(skill.active==='heal')healing+=ownHealthBase*skill.coefficient;
    }
    const actualEnemyDamage=Math.max(1,enemyDamage*(1-Math.min(0.45,shieldRatio)));
    const shieldedDamage=Math.max(0,enemyDamage-actualEnemyDamage);
    enemyHealth -= ownDamage+skillDamage;
    const damagedOwnHealth=clamp(ownHealth-actualEnemyDamage,0,ownHealthBase);
    const skillHealing=Math.min(ownHealthBase*0.35,healing,ownHealthBase-damagedOwnHealth);
    ownHealth=damagedOwnHealth+skillHealing;
    rounds.push({ round, ownDamage: Math.round(ownDamage),elementDamage:Math.round(ownDamage-baseOwnDamage),skillDamage:Math.round(skillDamage), enemyDamage: Math.round(actualEnemyDamage),
      ownMorale: Math.max(0, Math.round(ownHealth / ownPower * 100)), enemyMorale:Math.max(0,Math.round(enemyHealth/enemyHealthBase*100)),
      shieldedDamage:Math.round(shieldedDamage),skillHealing:Math.round(skillHealing),activeSkills:activeSkills.map(skill=>skill.activeName) });
  }
  const victory = enemyHealth <= 0 || (ownHealth > enemyHealth * 0.72 && ownHealth > 0);
  const casualtyRatio = clamp((victory ? 0.035 + (enemyPower / ownPower) * 0.07 : 0.24 + rng() * 0.2) - Math.min(0.04,(state.levels.wall||0)*0.001), 0.025, 0.62);
  const dead = {}, wounded = {};
  for (const row of troopRows) {
    const lost = Math.min(row.count, Math.floor(row.count * casualtyRatio * (0.78 + rng() * 0.46)));
    const injured = Math.min(row.count - lost, Math.floor(lost * 0.8));
    if (lost) dead[row.unit.id] = lost - injured;
    if (injured) wounded[row.unit.id] = injured;
  }
  const enemyCasualtyRatio=clamp(victory?0.22+ownPower/Math.max(1,enemyPower)*0.13:0.08+rng()*0.05,0.06,0.55);
  const enemyCasualties=Object.fromEntries(enemyRows.map(row=>[row.unit.id,Math.min(row.count,Math.floor(row.count*enemyCasualtyRatio*(0.8+rng()*0.4))) ]).filter(([,count])=>count>0));
  return { victory, ownPower: Math.round(ownPower), enemyPower: Math.round(enemyPower), rounds, dead, wounded, total,
    enemyCommander:node.enemy?.commander||'Đội quân NPC',enemyTactic:node.enemy?.tactic?.name||'Đội hình dã chiến',
    enemyFormation:enemyRows.map(row=>({unitId:row.unit.id,count:row.count})),enemyCasualties,
    enemyElement:node.enemy?.element||null,
    matchup:{ownCounterAdvantage:Math.round((ownCounterEvidence.sourceCoverage?ownCounterEvidence.bonus:ownCounterRatio)*100),enemyCounterAdvantage:Math.round((enemyCounterEvidence.sourceCoverage?enemyCounterEvidence.bonus:enemyCounterRatio)*100),counterEvidence:ownCounterEvidence.sourceCoverage>0?'MIXED':'SIMULATED',heroElementAdvantage:Math.round(heroProfile.bonuses.elementMatchup*10000)/100,ownBalanced,enemyBalanced,sourceArtifacts:heroProfile.sourceArtifacts.map(({heroId,item,modifiers,supported,status,evidence})=>({heroId,itemId:item.id,sourceId:item.mobileSourceId,name:item.name,ability:item.mobileAbilityText,modifiers,supported,status,evidence}))},
    heroNames: heroList.map(h => HEROES.find(def => def.id === h.id)?.name || h.id), heroSkills:heroProfile.names, skillBonuses:heroProfile.bonuses };
}

function resolveImmortalDuel(state, heroes, enemy, ownPower, enemyPower, seed, profile) {
  const rng=seededRandom(seed);
  const ownInitiative=heroes.reduce((sum,hero)=>{
    const data=HEROES.find(row=>row.id===hero.id);
    return sum+(data?data.wisdom+data.attack*.2:0);
  },0)/Math.max(1,heroes.length);
  const enemyInitiative=42+Math.min(24,enemy.rank*.025)+(enemy.tactic.initiative||0);
  const ownHealthBase=Math.max(1,ownPower*(1+state.morale/500+profile.bonuses.formation+profile.bonuses.defense*.25));
  const enemyHealthBase=Math.max(1,enemyPower*(enemy.tactic.health||1));
  const heroDefenseResearch=(state.technologies['tech-18']||0)*technologyRate('tech-18',0.02);
  let ownHealth=ownHealthBase,enemyHealth=enemyHealthBase;
  const rounds=[];

  for(let round=1;round<=6&&ownHealth>0&&enemyHealth>0;round++){
    const activeSkills=profile.skills.filter(skill=>skill.triggerRound===round);
    let skillDamage=0,shieldRatio=0,healing=0;
    for(const skill of activeSkills){
      if(skill.active==='damage')skillDamage+=ownPower*skill.coefficient;
      else if(skill.active==='shield')shieldRatio+=skill.coefficient;
      else if(skill.active==='heal')healing+=ownHealthBase*skill.coefficient;
    }
    const ownDamage=ownPower*(.19+rng()*.11)*Math.max(.65,1+profile.bonuses.attack+(round===1?profile.bonuses.opening:0)+profile.bonuses.elementMatchup-(enemy.tactic.defense||0));
    const rawEnemyDamage=enemyPower*(.17+rng()*.12)*(1+(enemy.tactic.attack||0))*Math.max(.55,1-profile.bonuses.defense-heroDefenseResearch);
    const ownsFirst=ownInitiative+rng()*7>=enemyInitiative+rng()*7;
    let actualOwnDamage=0,actualSkillDamage=0,actualEnemyDamage=0,shieldedDamage=0,skillHealing=0;
    const ownStrike=()=>{
      if(ownHealth<=0||enemyHealth<=0)return;
      const before=enemyHealth;
      enemyHealth=Math.max(0,enemyHealth-ownDamage-skillDamage);
      actualOwnDamage=Math.min(before,ownDamage);
      actualSkillDamage=Math.min(Math.max(0,before-actualOwnDamage),skillDamage);
    };
    const enemyStrike=()=>{
      if(enemyHealth<=0||ownHealth<=0)return;
      const mitigation=Math.min(.45,shieldRatio);
      shieldedDamage=rawEnemyDamage*mitigation;
      const damage=Math.max(0,rawEnemyDamage-shieldedDamage);
      actualEnemyDamage=Math.min(ownHealth,damage);
      ownHealth=Math.max(0,ownHealth-damage);
    };
    const recover=()=>{
      if(ownHealth<=0||healing<=0)return;
      const before=ownHealth;
      ownHealth=Math.min(ownHealthBase,ownHealth+Math.min(ownHealthBase*.35,healing));
      skillHealing=ownHealth-before;
    };
    if(ownsFirst){ownStrike();enemyStrike();recover();}
    else{enemyStrike();recover();ownStrike();}
    rounds.push({
      round,ownDamage:Math.round(actualOwnDamage),skillDamage:Math.round(actualSkillDamage),
      enemyDamage:Math.round(actualEnemyDamage),shieldedDamage:Math.round(shieldedDamage),skillHealing:Math.round(skillHealing),
      ownMorale:Math.max(0,Math.round(ownHealth/ownHealthBase*100)),
      enemyMorale:Math.max(0,Math.round(enemyHealth/enemyHealthBase*100)),
      turnOrder:ownsFirst?'Thần tiên ra chiêu trước':`${enemy.name} ra chiêu trước`,
      activeSkills:activeSkills.map(skill=>skill.activeName)
    });
  }
  const ownRemaining=ownHealth/ownHealthBase,enemyRemaining=enemyHealth/enemyHealthBase;
  return {
    victory:enemyHealth<=0||(ownHealth>0&&ownRemaining>=enemyRemaining),
    ownPower:Math.round(ownPower),enemyPower:Math.round(enemyPower),rounds,
    heroSkills:profile.names,skillBonuses:profile.bonuses,
    duelEnemy:{name:enemy.name,element:enemy.element,tactic:enemy.tactic.name},
    remainingHealth:{own:Math.round(ownRemaining*100),enemy:Math.round(enemyRemaining*100)}
  };
}

function settleMarch(state, q, now) {
  const node = WORLD_NODES.find(n => n.id === q.nodeId);
  if (!node) { credit(state, q.troops); return; }
  const battle = resolveArmyCombat(state, node, q.troops, q.seed);
  for (const [id, count] of Object.entries(q.troops)) {
    const casualties = (battle.dead[id] || 0) + (battle.wounded[id] || 0);
    const survivors = Math.max(0, count - casualties);
    state.army[id] = (state.army[id] || 0) + survivors;
    state.wounded[id] = (state.wounded[id] || 0) + (battle.wounded[id] || 0);
  }
  state.stats.battles++;
  state.heroes.filter(hero=>hero.assigned).forEach(hero=>awardHeroAffinity(hero,battle.victory?Math.min(4,2+Math.floor(node.chapter/3)):1));
  if (battle.victory) {
    state.stats.victories++;
    const chapterProgress=state.world.chapterProgress[String(node.chapter)]||(state.world.chapterProgress[String(node.chapter)]={wins:0,fieldWins:0,citiesCaptured:0});
    chapterProgress.wins++;
    state.fame += 10 + node.chapter * 3;
    credit(state, node.loot);
    if (node.kind === 'Danh thành' && !state.world.captures.includes(node.id)) {
      state.world.captures.push(node.id);
      state.stats.citiesCaptured++;
      chapterProgress.citiesCaptured++;
      state.world.treaties=state.world.treaties.filter(id=>id!==node.id);
      if(!state.cities.some(city=>city.nodeId===node.id)){
        const city={id:node.id,nodeId:node.id,name:node.name,level:1,population:70+node.chapter*8,isCapital:false};
        state.cities.push(city);
        state.population=Math.min(250_000,state.population+city.population);
      }
    }
    if (node.kind !== 'Danh thành') {
      chapterProgress.fieldWins++;
      state.world.storyStage = Math.max(state.world.storyStage, node.chapter * 3);
    }
  }
  const rewardRng = seededRandom(q.seed ^ 0x9e3779b9);
  let itemDrop = null;
  if (battle.victory && rewardRng() < 0.3) {
    const dropPool = ITEMS.filter(item => item.type !== 'vật phẩm' && item.tier <= Math.min(5, 1 + Math.floor(node.chapter / 2)));
    itemDrop = dropPool[Math.floor(rewardRng() * dropPool.length)] || null;
    if (itemDrop) state.items.push(itemDrop.id);
  }
  let endingReward = null;
  if (battle.victory && node.isBoss && !state.world.campaignComplete) {
    endingReward = { food:12000, timber:10000, stone:8000, iron:6000, gold:12000, jade:24 };
    credit(state, endingReward);
    state.world.campaignComplete = true;
    state.stats.bossesDefeated++;
    state.world.storyStage = 24;
    state.fame += 1000;
  }
  const entry = { type: 'army', target: node.name, targetKind: node.kind, victory: battle.victory, ...battle,
    loot: battle.victory ? Object.fromEntries(Object.keys({ ...node.loot, ...(endingReward || {}) }).map(key=>[key,(node.loot[key]||0)+(endingReward?.[key]||0)])) : {}, itemDrop: itemDrop?.id || null, troopsSent: { ...q.troops }, campaignEnding: Boolean(endingReward), evidence: 'SIMULATED' };
  report(state, entry);
  note(state, battle.victory && endingReward ? 'Trụ Vương bại trận. Phong Thần nghiệp định; thiên hạ vẫn có thể tiếp tục chinh phục.' : battle.victory ? `${node.name} chiến thắng, quân đội khải hoàn.` : `Tại ${node.name} gặp trở lực; quân sĩ đã rút lui.`);
  state.morale = clamp(state.morale + (battle.victory ? 2 : -5), 0, 100);
}

export function advance(state, now = Date.now()) {
  const next = migrateSave(state, now);
  const rawElapsed = Math.max(0, (now - next.lastTickAt) / 1000);
  const elapsed = Math.min(rawElapsed, OFFLINE_CAP_SECONDS);
  if (elapsed > 0) {
    const perHour = productionPerHour(next);
    const cap = storageCapacity(next);
    for (const key of RESOURCE_KEYS) {
      const upkeepPerHour = key === 'food' ? armyCount(next) * 0.35 : 0;
      next.resources[key] = clamp(next.resources[key] + (perHour[key] - upkeepPerHour) * elapsed / 3600, 0, key === 'jade' ? 99_999 : cap);
    }
    const hours=elapsed/3600;
    next.population = Math.min(250_000, next.population + hours * (0.1 + next.morale/450 + next.levels.citadel * 0.11));
    next.morale=clamp(next.morale+hours*TAX_POLICIES[next.taxPolicy].moralePerHour,0,100);
    next.world.marketDay += elapsed / 86_400;
  }
  next.lastTickAt = now;
  completeQueue(next, 'construction', now);
  completeQueue(next, 'training', now);
  completeQueue(next, 'research', now);
  completeQueue(next, 'march', now);
  updateTutorial(next);
  return { state: next, elapsedSeconds: elapsed, offlineCapped: rawElapsed > OFFLINE_CAP_SECONDS };
}

export function doAction(state, action, now = Date.now()) {
  let s = advance(state, now).state;
  switch (action.type) {
    case 'rename':
      s.profile.name = String(action.name || '').trim().slice(0, 22) || 'Triều Ca';
      if(s.cities[0]?.isCapital)s.cities[0].name=s.profile.name;
      note(s, `Thành trì đổi tên thành ${s.profile.name}.`);
      break;
    case 'setTaxPolicy': {
      if(!Object.hasOwn(TAX_POLICIES,action.policy))throw new Error('Không nhận diện được chính sách thuế.');
      s.taxPolicy=action.policy;
      note(s,`Chính sách thuế đổi sang ${TAX_POLICIES[s.taxPolicy].label}.`);
      break;
    }
    case 'upgrade': {
      if (s.queues.construction) throw new Error('Hàng đợi xây dựng đang bận.');
      const b = BUILDINGS.find(x => x.id === action.buildingId);
      if (!b) throw new Error('Không tìm thấy công trình.');
      const nextLevel = (s.levels[b.id] || 0) + 1;
      if (nextLevel > b.maxLevel) throw new Error('Công trình đã đạt cấp tối đa.');
      const requiredCitadel = Math.max(1, Math.ceil(nextLevel / 2));
      if ((s.levels.citadel || 0) < requiredCitadel && b.id !== 'citadel') throw new Error(`Cần Tử Vi Thành cấp ${requiredCitadel}.`);
      const cost = progressionCost(b.mobileLevelCosts, b.baseCost, nextLevel);
      debit(s, cost);
      const techSpeed = 1 + (s.technologies['tech-08'] || 0) * technologyRate('tech-08',0.025);
      s.queues.construction = { buildingId: b.id, level: nextLevel, cost, startAt: now, finishAt: now + b.seconds * Math.pow(nextLevel, 1.2) * 1000 / techSpeed };
      note(s, `Thợ xây bắt đầu nâng ${b.name} lên cấp ${nextLevel}.`);
      break;
    }
    case 'upgradeCity': {
      if(s.queues.construction)throw new Error('Hàng đợi xây dựng đang bận.');
      const city=(s.cities||[]).find(row=>row.id===action.cityId&&!row.isCapital);
      if(!city)throw new Error('Không tìm thấy thành phụ đã chiếm đóng.');
      const quote=quoteCityUpgrade(s,city.id);
      if(quote.maxed)throw new Error('Thành phụ đã đạt cấp tối đa.');
      if(quote.locked)throw new Error(`Cần Tử Vi Thành cấp ${Math.max(2,Math.ceil(quote.level/2)+1)} để nâng thành phụ.`);
      debit(s,quote.cost);
      const speed=1+(s.technologies['tech-08']||0)*technologyRate('tech-08',0.025);
      s.queues.construction={cityId:city.id,level:quote.level,cost:quote.cost,startAt:now,finishAt:now+quote.seconds*1000/speed};
      note(s,`Bắt đầu nâng ${city.name} lên thành phụ cấp ${quote.level}.`);
      break;
    }
    case 'train': {
      if (s.queues.training) throw new Error('Doanh trại đang huấn luyện một đạo quân.');
      if ((s.levels.barracks || 0) < 1) throw new Error('Cần Thần Binh Doanh cấp 1 để huấn luyện quân.');
      const t = TROOPS.find(x => x.id === action.troopId);
      const count = clamp(Math.floor(Number(action.count) || 1), 1, 500);
      if (!t) throw new Error('Không tìm thấy binh chủng.');
      const needLevel = Math.min(30, t.unlockCity);
      if ((s.levels.citadel || 0) < needLevel) throw new Error(`Cần Tử Vi Thành cấp ${needLevel} để huấn luyện.`);
      const cost = Object.fromEntries(Object.entries(t.cost).map(([key, value]) => [key, value * count]));
      debit(s, cost);
      const speed = 1 + (s.technologies['tech-09'] || 0) * technologyRate('tech-09',0.02) + (s.levels.training || 0) * 0.025 + (s.levels.barracks || 0) * 0.008;
      s.queues.training = { troopId: t.id, count, cost, startAt: now, finishAt: now + Math.max(4000, t.trainSeconds * count * 1000 / speed) };
      note(s, `Bắt đầu huấn luyện ${count} ${t.name}.`);
      break;
    }
    case 'recruit': {
      if ((s.levels.altar || 0) < 1 || (s.levels.manor || 0) < 1) throw new Error('Cần Phong Thần Đàn và Tiên Gia Phủ cấp 1.');
      if (s.heroes.length >= Math.min(60, 3 + s.levels.manor * 2)) throw new Error('Tiên Gia Phủ chưa đủ chỗ an trí thêm thần tiên.');
      const def = HEROES.find(h => h.id === action.heroId);
      if (!def || s.heroes.some(h => h.id === def.id)) throw new Error('Thần tiên này đã có trong danh sách hoặc không khả dụng.');
      debit(s, { gold: 220 + def.wisdom * 2, jade: def.quality === 'Thiên' ? 2 : 1 });
      s.heroes.push({ id: def.id, level: 1, xp: 0, assigned: s.heroes.filter(h => h.assigned).length < 3, equipment: { weapon: null, armor: null, artifact: null }, skillLevel: 1, affinity: 0 });
      s.stats.heroesRecruited++;
      note(s, `${def.name} đã nhận lời tương trợ.`);
      break;
    }
    case 'equip': {
      const hero = s.heroes.find(h => h.id === action.heroId);
      const itemIndex = s.items.indexOf(action.itemId);
      const item = ITEMS.find(i => i.id === action.itemId);
      if (!hero || itemIndex < 0 || !item) throw new Error('Thần tiên hoặc vật phẩm không hợp lệ.');
      if (item.type === 'vật phẩm') throw new Error('Vật phẩm tiêu hao không thể trang bị.');
      if(item.mobileRequiredLevel>0&&hero.level<item.mobileRequiredLevel)throw new Error(`Pháp bảo yêu cầu thần tiên cấp ${item.mobileRequiredLevel}.`);
      if(item.mobileOccupation&&item.mobileOccupation!=='Mọi nghề'){
        const occupation=HEROES.find(def=>def.id===hero.id)?.mobileOccupation;
        if(!occupation||occupation!==item.mobileOccupation)throw new Error(`Trang bị này dành cho nghề ${item.mobileOccupation}; nghề thần tiên hiện tại ${occupation||'UNKNOWN'}.`);
      }
      const slot = item.type === 'vũ khí' ? 'weapon' : item.type === 'giáp' ? 'armor' : 'artifact';
      if (hero.equipment[slot]) s.items.push(hero.equipment[slot]);
      hero.equipment[slot] = item.id;
      s.items.splice(itemIndex, 1);
      s.stats.itemsEquipped++;
      note(s, `${item.name} đã trang bị cho ${HEROES.find(h => h.id === hero.id)?.name}.`);
      break;
    }
    case 'trainHero': {
      const hero = s.heroes.find(h => h.id === action.heroId);
      if (!hero) throw new Error('Không tìm thấy thần tiên.');
      if ((s.levels.manor || 0) < 1) throw new Error('Cần Tiên Gia Phủ cấp 1.');
      if (hero.level >= 60&&hero.affinity>=100) throw new Error('Thần tiên đã đạt cấp và linh căn tối đa mô phỏng.');
      const cost = { food: 65 * hero.level, gold: 85 * hero.level };
      debit(s, cost);
      const levels=hero.level<60?awardHeroXp(hero,80+hero.level*16):0;
      awardHeroAffinity(hero,3);
      note(s, `${HEROES.find(def => def.id === hero.id)?.name} đã tu luyện${levels?` và tăng ${levels} cấp`:''} · cấp ${hero.level} · linh căn ${hero.affinity}/100${levels&&hero.level%4===0?` · kỹ năng ${hero.skillLevel}`:''}.`);
      break;
    }
    case 'forge': {
      const item = ITEMS.find(i => i.id === action.itemId);
      const owned = s.items.includes(action.itemId) || s.heroes.some(h=>Object.values(h.equipment||{}).includes(action.itemId));
      if (!item || item.type === 'vật phẩm' || item.mobileSourceId || owned) throw new Error('Công thức không hợp lệ hoặc trang bị đã có.');
      if ((s.levels.foundry || 0) < 1) throw new Error('Cần Huyền Thiết Lò cấp 1 để rèn.');
      const cost = { iron: 24 * item.tier, gold: 55 * item.tier, stone: 9 * item.tier };
      if (item.tier >= 4) cost.jade = 1;
      debit(s, cost);
      s.items.push(item.id);
      note(s, `Rèn thành công ${item.name} tại Huyền Thiết Lò.`);
      break;
    }
    case 'buyItem': {
      const item=ITEMS.find(i=>i.id===action.itemId&&i.type==='vật phẩm');
      if(!item||item.mobileSourceId&&!item.mobileAvailableAtMerchant)throw new Error('Thương nhân không bán vật phẩm này.');
      if(s.items.length>=500)throw new Error('Túi đồ đã đầy. Hãy sử dụng hoặc sắp xếp vật phẩm trước.');
      const cost={gold:90*item.tier,food:45*item.tier};
      if(item.tier>=8)cost.jade=1;
      debit(s,cost);
      s.items.push(item.id);
      s.stats.itemPurchases++;
      note(s,`Đã mua ${item.name} từ thương nhân NPC.`);
      break;
    }
    case 'useItem': {
      const itemIndex = s.items.indexOf(action.itemId);
      const item = ITEMS.find(i => i.id === action.itemId);
      if (itemIndex < 0 || !item || item.type !== 'vật phẩm') throw new Error('Không thể sử dụng vật phẩm này.');
      const effect=item.useEffect;
      if(!effect)throw new Error('Hiệu ứng của vật phẩm nguồn chưa được mô hình hóa; xem hồ sơ Mobile để biết dữ kiện đã xác minh.');
      if(effect.kind==='mobileChest')openMobileChest(s,item,now);
      if(effect?.kind==='resource')credit(s,{[effect.resource]:effect.amount});
      else if(effect?.kind==='heroXp'){
        const gained=s.heroes.reduce((n,h)=>n+awardHeroXp(h,effect.amount),0);
        if(gained)note(s,`Linh dược giúp thần tiên tăng ${gained} cấp.`);
      }
      else if(effect?.kind==='morale')s.morale=clamp(s.morale+effect.amount,0,100);
      else if(effect?.kind==='mobileChest'){}
      else if(item.id==='item-13')credit(s,{food:420});
      else if(item.id==='item-14')s.heroes.forEach(h=>{h.xp+=120;});
      else if(item.id==='item-15')credit(s,{gold:140});
      else if(!effect)throw new Error('Hiệu ứng vật phẩm chưa được xác định.');
      if(effect.kind!=='mobileChest')s.items.splice(itemIndex, 1);
      note(s, `Đã sử dụng ${item.name}.`);
      break;
    }
    case 'research': {
      if (s.queues.research) throw new Error('Học viện đang nghiên cứu khoa kỹ.');
      const t = TECHNOLOGIES.find(x => x.id === action.techId);
      if (!t || s.technologies[t.id] >= t.maxLevel) throw new Error('Khoa kỹ đã tối đa hoặc không tồn tại.');
      if ((s.levels.academy || 0) < 1) throw new Error('Cần Thái Học Viện cấp 1.');
      const quote=quoteResearch(s,t.id);
      if(quote.requirementStatus==='LOCKED')throw new Error(`Chưa đạt điều kiện Mobile: ${quote.unmetRequirements.join(', ')}.`);
      const level = s.technologies[t.id] + 1;
      const cost = progressionCost(t.mobileLevelCosts, t.baseCost, level);
      debit(s, cost);
      const speed = 1 + (s.levels.academy || 0) * 0.01;
      s.queues.research = { techId: t.id, level, cost, startAt: now, finishAt: now + t.seconds * Math.pow(level, 1.12) * 1000 / speed };
      note(s, `Học viện bắt đầu nghiên cứu ${t.name}.`);
      break;
    }
    case 'march': {
      if (s.queues.march) throw new Error('Đội quân đang ở ngoài thành.');
      const node = WORLD_NODES.find(n => n.id === action.nodeId);
      if (!node) throw new Error('Không tìm thấy mục tiêu trên bản đồ.');
      if (node.isBoss && !s.world.campaignComplete && (s.stats.victories < 20 || s.stats.citiesCaptured < 7)) throw new Error('Cần ít nhất 20 trận thắng và 7 danh thành để mở chiến dịch cuối tại Triều Ca.');
      if(node.chapter>unlockedChapter(s))throw new Error(`Cần chiến thắng tại dã địa hoặc Tiên Sơn ở chương ${unlockedChapter(s)} để mở chương ${node.chapter}.`);
      const troops = {};
      if(action.troops&&typeof action.troops==='object'){
        for(const [id,amount] of Object.entries(action.troops)){
          if(!TROOPS.some(t=>t.id===id)||!s.army[id])continue;
          const count=Math.min(s.army[id],clamp(Math.floor(Number(amount)||0),0,9_999_999));
          if(count>0)troops[id]=count;
        }
      } else {
        const requested = Math.max(1, Math.floor(Number(action.count) || 1));
        const troopId = action.troopId || Object.keys(s.army).find(id => s.army[id] > 0);
        if (troopId && s.army[troopId]) troops[troopId]=Math.min(requested,s.army[troopId]);
      }
      const count=Object.values(troops).reduce((sum,n)=>sum+n,0);
      if(!count)throw new Error('Chưa có binh sĩ sẵn sàng hành quân.');
      const leadLimit=marchTroopCapacity(s);
      if(count>leadLimit)throw new Error(`Đội quân vượt giới hạn lĩnh binh ${leadLimit.toLocaleString('vi-VN')}; nâng Lĩnh binh thuật hoặc phân công thêm thần tiên.`);
      for(const [id,n] of Object.entries(troops)){s.army[id]-=n;if(!s.army[id])delete s.army[id];}
      const averageSpeed=Object.entries(troops).reduce((sum,[id,n])=>sum+(TROOPS.find(t=>t.id===id)?.speed||0)*n,0)/count;
      const marchSpeed = 1 + averageSpeed*.012
        + (s.technologies['tech-07'] || 0) * technologyRate('tech-07',0.02)
        + (s.technologies['tech-16'] || 0) * technologyRate('tech-16',0.02)
        + (s.levels.watch || 0) * 0.015;
      const seed=Object.entries(troops).reduce((value,[id,n])=>value^n^Number(id.slice(-2)),(now^node.power)>>>0);
      s.queues.march = { nodeId: node.id, troops, startAt: now, finishAt: now + Math.max(2000, (7 + node.chapter * 1.7) * 1000 / marchSpeed), seed:seed>>>0 };
      note(s, `Đội quân rời thành hướng ${node.name}.`);
      break;
    }
    case 'duel': {
      const mode=action.mode==='buzhou'?'buzhou':action.mode==='mountain'?'mountain':'tower';
      const mountain=mode==='mountain'?IMMORTAL_MOUNTAINS.find(x=>x.id===action.mountainId):null;
      if(mode==='mountain'&&!mountain)throw new Error('Không tìm thấy Tiên Sơn này.');
      const floor=mode==='tower'?s.world.towerFloor+1:mode==='buzhou'?s.world.buzhouFloor+1:mountain.rank;
      const cap=mode==='tower'?TOWER_FLOORS:BUZHOU_FLOORS;
      if(mode!=='mountain'&&floor>cap)throw new Error('Đã chinh phục toàn bộ thử thách hiện được mô phỏng.');
      if(mode==='mountain'&&s.world.mountainWins.includes(mountain.id))throw new Error('Tiên Sơn này đã được chinh phục.');
      if(!s.heroes.some(h=>h.assigned))throw new Error('Cần ít nhất một thần tiên được phân công.');
      const assignedHeroes=s.heroes.filter(h=>h.assigned).slice(0,3);
      const elements=['fire','water','wood','metal','earth'];
      const enemyElement=elements[(floor+(mode==='buzhou'?2:mode==='mountain'?1:0))%elements.length];
      const tactics=[
        {name:'Trấn thủ',attack:.025,defense:.09,health:1.12,initiative:-2},
        {name:'Lôi kích',attack:.12,defense:0,health:.96,initiative:6},
        {name:'Huyễn trận',attack:.06,defense:.04,health:1.05,initiative:2}
      ];
      const tactic=tactics[(floor+(mode==='buzhou'?1:mode==='mountain'?2:0))%tactics.length];
      const enemy={name:mountain?`Thủ Sơn · ${mountain.name}`:`${mode==='tower'?'Trấn Tháp':'Thủ Bất Chu'} · ${floor}`,
        element:enemyElement,rank:floor,tactic};
      const heroProfile=heroCombatProfile(assignedHeroes,s,enemyElement);
      const power=(assignedHeroes.reduce((n,h)=>n+heroPower(h,s),0)+(mode==='tower'?0:armyPower(s)*0.08))*heroProfile.powerMultiplier;
      const difficulty=mode==='mountain'?mountain.power:42+floor*(mode==='tower'?6.3:21);
      const heroSeed=assignedHeroes.reduce((sum,hero)=>sum+(Number(hero.id.slice(-2))||0)*131+hero.level*17+hero.skillLevel*31,0);
      const duel=resolveImmortalDuel(s,assignedHeroes,enemy,power,difficulty,
        (Number(now)^Math.imul(floor,0x45d9f3b)^heroSeed)>>>0,heroProfile);
      const victory=duel.victory;
      s.stats.duels++;
      assignedHeroes.forEach(hero=>awardHeroAffinity(hero,victory?2:1));
      const mountainLabel=mountain?`${mountain.name} · Tiên Sơn ${mountain.rank}`:null;
      const target=mode==='tower'?`Phong Thần Tháp · tầng ${floor}`:mode==='buzhou'?`Bất Chu Sơn · tầng ${floor}`:mountainLabel;
      let reward={};
      if(victory){
        if(mode==='tower')s.world.towerFloor=floor;
        else if(mode==='buzhou')s.world.buzhouFloor=floor;
        else if(!s.world.mountainWins.includes(mountain.id))s.world.mountainWins.push(mountain.id);
        reward=mode==='mountain'?mountain.loot:{gold:65+floor*9,jade:floor%3===0?1:0,food:40+floor*4};
        credit(s,reward);
        s.heroes.forEach(h=>{if(h.assigned)awardHeroXp(h,45+floor*8);});
        if((mode==='tower'&&floor%3===0)||(mode==='buzhou'&&floor===BUZHOU_FLOORS)||(mode==='mountain'&&floor%7===0)){
          const artifacts=ITEMS.filter(item=>item.type==='pháp bảo'&&item.tier<=10);
          const artifact=artifacts[(floor+now)%artifacts.length];
          if(artifact&&!s.items.includes(artifact.id))s.items.push(artifact.id);
        }
        s.fame+=5+floor;
        note(s,`Thắng thử thách ${target}.`);
      }else{
        note(s,'Đối thủ quá mạnh; hãy tu luyện, nâng khoa kỹ hoặc trang bị pháp bảo rồi thử lại.');
      }
      report(s,{type:'duel',mode,target,victory,ownPower:duel.ownPower,enemyPower:duel.enemyPower,rounds:duel.rounds,
        dead:{},wounded:{},loot:reward,heroSkills:duel.heroSkills,skillBonuses:duel.skillBonuses,
        duelEnemy:duel.duelEnemy,remainingHealth:duel.remainingHealth,evidence:'SIMULATED'});
      break;
    }
    case 'heal': {
      const injured = Object.values(s.wounded).reduce((n, x) => n + x, 0);
      if (!injured) throw new Error('Không có quân bị thương cần hồi phục.');
      const count = Math.min(injured, clamp(Math.floor(Number(action.count) || injured), 1, injured));
      const cost = { food: Math.max(1,Math.floor(count * 8 * Math.max(0.35,1-Math.min(0.45,(s.levels.clinic||0)*0.015)))), gold: Math.max(1,Math.floor(count * 2 * Math.max(0.45,1-Math.min(0.35,(s.levels.clinic||0)*0.01)))) };
      debit(s, cost);
      let remaining = count;
      for (const [id, n] of Object.entries(s.wounded)) {
        const healed = Math.min(n, remaining);
        s.wounded[id] -= healed;
        s.army[id] = (s.army[id] || 0) + healed;
        remaining -= healed;
        if (!remaining) break;
      }
      s.wounded = Object.fromEntries(Object.entries(s.wounded).filter(([, n]) => n > 0));
      note(s, `Hồi phục ${count} quân sĩ tại Hồi Xuân Đường.`);
      break;
    }
    case 'trade': {
      const from = action.from, to = action.to;
      const amount = clamp(Math.floor(Number(action.amount) || 0), 1, 100_000);
      if (!RESOURCE_KEYS.includes(from) || !RESOURCE_KEYS.includes(to) || from === to) throw new Error('Chọn hai loại tài nguyên khác nhau.');
      if (s.resources[from] < amount) throw new Error('Không đủ hàng hóa để đổi.');
      const rates = { food: 1, timber: 1.15, stone: 1.3, iron: 1.55, gold: 2.2, jade: 16 };
      const fee = Math.max(0.02, 0.22 - (s.levels.caravan || 0) * 0.012 - (s.levels.embassy || 0) * 0.006 - (s.world.guildLevel||0)*0.005);
      const received = Math.floor(amount * rates[from] / rates[to] * (1 - fee));
      if (received < 1) throw new Error('Lô hàng quá nhỏ để đổi có lợi.');
      s.resources[from] -= amount;
      s.resources[to] = Math.min(to === 'jade' ? 99_999 : storageCapacity(s), s.resources[to] + received);
      s.stats.tradeCount++;
      note(s, `Đổi ${amount} ${RESOURCE_INFO[from].short} lấy ${received} ${RESOURCE_INFO[to].short} tại thị trường NPC.`);
      break;
    }
    case 'guild': {
      if((s.levels.embassy||0)<1)throw new Error('Cần Bát Phương Quán cấp 1 để lập minh hội.');
      if(s.world.guildLevel>=5)throw new Error('Minh hội NPC đã đạt cấp tối đa.');
      const level=s.world.guildLevel+1;
      const cost={gold:200*level,timber:90*level};
      debit(s,cost);
      s.world.guildLevel=level;
      note(s,`Quan hệ với minh hội NPC đạt cấp ${level}; phí giao thương tiếp tục giảm.`);
      break;
    }
    case 'diplomacy': {
      const node=WORLD_NODES.find(n=>n.id===action.nodeId);
      if(!node||node.kind!=='Danh thành')throw new Error('Chỉ có thể đề nghị minh ước với danh thành NPC.');
      if(node.chapter>unlockedChapter(s))throw new Error(`Chưa mở chương ${node.chapter} để ngoại giao.`);
      if((s.levels.embassy||0)<1)throw new Error('Cần Bát Phương Quán cấp 1 để ngoại giao.');
      if(s.world.captures.includes(node.id))throw new Error('Danh thành này đã thuộc quyền quản lý của bạn.');
      if(s.world.treaties.includes(node.id))throw new Error('Đã ký minh ước với thành này.');
      debit(s,{gold:120+node.chapter*40});
      const chance=Math.min(.9,.48+(s.levels.embassy||0)*.035+s.fame/20_000);
      const roll=((now>>>5)+node.power+node.chapter*71)%100/100;
      const success=roll<chance;
      if(success){s.world.treaties.push(node.id);note(s,`Minh ước với ${node.name} thành công; sức phòng thủ NPC đã giảm.`);}
      else note(s,`Sứ giả tại ${node.name} chưa đạt thỏa thuận; hãy nâng ngoại giao rồi thử lại.`);
      report(s,{type:'diplomacy',target:`Ngoại giao · ${node.name}`,victory:success,ownPower:Math.round(chance*100),enemyPower:Math.round(roll*100),rounds:[],dead:{},wounded:{},loot:{},evidence:'SIMULATED'});
      break;
    }
    case 'scout': {
      const node = WORLD_NODES.find(n => n.id === action.nodeId);
      if (!node) throw new Error('Không tìm thấy địa điểm.');
      if(node.chapter>unlockedChapter(s))throw new Error(`Chưa mở chương ${node.chapter} để trinh sát.`);
      const quote=quoteScouting(s,node.id);
      debit(s,{gold:quote.cost});
      const roll=seededRandom(((now>>>5)^node.power^Math.imul(node.chapter,71))>>>0)();
      const success=roll<quote.chance;
      if(success){
        if(!s.world.scouted.includes(node.id))s.world.scouted.push(node.id);
        s.world.scoutedKinds=s.world.scoutedKinds&&typeof s.world.scoutedKinds==='object'?s.world.scoutedKinds:{};
        s.world.scoutedKinds[node.id]=quote.type;
        const result=quote.type==='resources'?`ước tính tài nguyên ${Object.entries(node.loot).map(([key,value])=>`${RESOURCE_INFO[key]?.name||key} ${value}`).join(', ')}`:
          quote.type==='immortals'?`đấu pháp ${node.enemy.tactic.name}, ngũ hành ${node.enemy.element}`:
          `${node.enemy.commander}, ${node.enemy.tactic.name} và ${node.enemy.formation.map(row=>`${TROOPS.find(t=>t.id===row.unitId)?.name||row.unitId} ${row.count}`).join(', ')}`;
        note(s,`Trinh sát thành công tại ${node.name}: ${result}.`);
      }else note(s,`Trinh sát thất bại tại ${node.name}; hãy nâng ${TECHNOLOGIES.find(row=>row.id===quote.technologyId)?.name||'khoa kỹ do thám'} rồi thử lại.`);
      report(s,{type:'scout',scoutType:quote.type,target:`Trinh sát · ${node.name}`,victory:success,
        ownPower:Math.round(quote.chance*100),enemyPower:Math.round(roll*100),rounds:[],dead:{},wounded:{},loot:{},
        evidence:s.technologies[quote.technologyId]?'MIXED':'SIMULATED',technologyId:quote.technologyId});
      break;
    }
    case 'claimQuest': {
      const q = QUESTS.find(x => x.id === action.questId);
      if (!q || s.claims.includes(q.id) || questProgress(s, q) < q.goal) throw new Error('Nhiệm vụ chưa hoàn thành.');
      if(q.chapter>unlockedChapter(s))throw new Error(`Cần mở chương ${q.chapter} trước khi nhận thưởng nhiệm vụ.`);
      s.claims.push(q.id);
      credit(s, q.reward);
      s.fame += 4 + q.chapter;
      note(s, `Đã nhận thưởng nhiệm vụ: ${q.title}.`);
      break;
    }
    case 'assignHero': {
      const h = s.heroes.find(x => x.id === action.heroId);
      if (!h) throw new Error('Không tìm thấy thần tiên.');
      const assigned = s.heroes.filter(x => x.assigned).length;
      if (!h.assigned && assigned >= Math.min(3, 1 + Math.floor((s.levels.citadel || 0) / 4))) throw new Error('Tử Vi Thành chưa mở thêm vị trí đội hình.');
      h.assigned = !h.assigned;
      note(s, `${HEROES.find(x => x.id === h.id)?.name} ${h.assigned ? 'đã vào đội hình' : 'đã nghỉ tại Tiên Gia Phủ'}.`);
      break;
    }
    case 'setting':
      if (!(action.key in s.settings)) throw new Error('Tùy chỉnh không hợp lệ.');
      s.settings[action.key] = Boolean(action.value);
      break;
    default: throw new Error('Thao tác không được hỗ trợ.');
  }
  updateTutorial(s);
  return migrateSave(s, now);
}

export function formatNumber(n) {
  const value = Number(n) || 0;
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: value < 10 && value % 1 ? 1 : 0 }).format(value);
}

export function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút ${seconds % 60 ? `${seconds % 60} giây` : ''}`.trim();
  return `${Math.floor(seconds / 3600)} giờ ${Math.floor(seconds % 3600 / 60)} phút`;
}
