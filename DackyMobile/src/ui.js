import { recruitmentPromotion, worldOffer } from './simulated-world.js';
import { getPveEncounter, getMountainBattles, getEndgameBattles, pveAssaultProgress, pveLock } from './pve-campaign.js';
import { BUILDINGS, CONTENT_EVIDENCE, HEROES, HERO_QUALITY_MULTIPLIERS, HERO_SKILLS, IMMORTAL_MOUNTAINS, ITEMS, LEGACY_BUZHOU_EQUIPMENT_RULES, LEGACY_BUZHOU_FLOORS, LEGACY_BUZHOU_FORMATIONS, LEGACY_BUZHOU_REWARDS, LEGACY_BUZHOU_SOURCE, LEGACY_CITY_GARRISON_SOURCE, LEGACY_CITY_GARRISONS, LEGACY_ELFLAND_FLOORS, LEGACY_ELFLAND_FORMATIONS, LEGACY_ELFLAND_LOCATIONS, LEGACY_ELFLAND_REWARD_RULES, LEGACY_ELFLAND_SOURCE, LEGACY_QUESTS, LEGACY_QUEST_SOURCE, MOBILE_SOURCE_DATABASE, QUESTS, RESOURCE_INFO, TECHNOLOGIES, TROOPS, WORLD_NODES, BUZHOU_FLOORS, TOWER_FLOORS } from './catalog.js';
import { gameplayQuestList,questQuote,itemUseRule,strategicQuote,populationCapacity,buzhouPlan,equipmentSets } from './gameplay-p15.js';
import { activeQuest, armyCount, armyPower, formatDuration, formatNumber, heroPower, marchTroopCapacity, productionPerHour, questProgress, quoteArtifactPurchase, quoteBuilding, quoteCityUpgrade, quoteGearEnhancement, quoteGearGemSocket, quoteItemPurchase, quoteItemSale, quoteResearch, quoteScouting, quoteTraining, storageCapacity, TAX_POLICIES, TUTORIAL_STEPS, unlockedChapter } from './engine.js';

export const NAV = [
  ['city','城','Thành trì','Nội thành, kinh tế và hàng đợi'],
  ['heroes','仙','Thần tiên','Chiêu mộ, phân công và trang bị'],
  ['inventory','寶','Túi đồ','Trang bị, vật phẩm và rèn pháp bảo'],
  ['army','兵','Binh doanh','Huấn luyện, quân số và hồi phục'],
  ['world','地','Thế giới','Dã địa, danh thành và hành quân'],
  ['pve','塔','Thử thách','Phong Thần Tháp và Bất Chu Sơn'],
  ['tech','學','Khoa kỹ','Nghiên cứu 19 ngành học'],
  ['library','典','Thư tịch','Danh mục Mobile và nhiệm vụ legacy có provenance'],
  ['quests','令','Nhiệm vụ','Chính tuyến và phần thưởng'],
  ['market','市','Thị trường','Đổi tài nguyên với thương nhân NPC'],
  ['reports','報','Chiến báo','Kết quả hành quân và thử thách'],
  ['settings','設','Cài đặt','Lưu trữ, hỗ trợ và tùy chỉnh']
];

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
const assetUrl = value => globalThis.__DACKY_EMBEDDED_ASSETS__?.[value] || value;
const sourceListText = value => Array.isArray(value) ? value.map(entry => typeof entry === 'string' ? entry : entry?.t || entry?.v || '').filter(Boolean).join(' · ') : '';
const sourceStatsText = value => Array.isArray(value) ? value.map(entry=>`${entry[0]} ${entry[1]}`).join(' · ') : '';
const itemArt = item => item.mobileImage
  ? `<img class="item-source-art" src="${esc(assetUrl(item.mobileImage))}" alt="" loading="lazy" decoding="async">`
  : `<span class="unit-glyph">${esc(item.glyph)}</span>`;
const itemSourceDetails = item => item.mobileSourceId
  ? `<details class="source-provenance"><summary>Mobile ${esc(item.mobileQuality||'')} · ${esc(item.mobileGroup||'Pháp bảo')}${item.mobileRequiredLevel?` · cấp ${fmt(item.mobileRequiredLevel)}`:''}${item.mobileManaCost?` · ${fmt(item.mobileManaCost)} pháp lực`:''}</summary>${item.mobileOwner?`<p>Chuyên thuộc: ${esc(item.mobileOwner)}</p>`:''}${item.mobileEquipmentSlot?`<p>Vị trí trang bị: ${esc(item.mobileEquipmentSlot)}${item.mobileOccupation?` · nghề ${esc(item.mobileOccupation)}`:''}</p>`:''}${item.mobileStats?.length?`<p>Chỉ số nguồn: ${esc(sourceStatsText(item.mobileStats))}. Quy đổi lực chiến dùng hệ số SIMULATED.</p>`:''}${item.mobileSaleGold?`<p>Giá bán ghi trong Mobile: ${fmt(item.mobileSaleGold)} vàng.</p>`:''}${item.mobileAvailableAtMerchant?'<p>Rương này có đường mua được ghi trong liên kết danh mục Mobile; giá trong game là SIMULATED.</p>':''}${item.mobileDescription?`<p>${esc(item.mobileDescription)}</p>`:''}${item.mobileOpening?.rewards?.length?`<p>${esc(item.mobileOpening.title)} · ${fmt(item.mobileOpening.rewards.length)} kết quả: ${esc(item.mobileOpening.rewards.slice(0,5).map(reward=>`${reward.name}${reward.weightText?` (${reward.weightText})`:''}`).join(' · '))}${item.mobileOpening.rewards.length>5?' · …':''}</p>`:''}${sourceListText(item.mobileAcquisition)?`<p>Cách nhận: ${esc(sourceListText(item.mobileAcquisition))}</p>`:''}<small>Mobile ${esc(item.mobileSourceId)} · dữ kiện trường nguồn VERIFIED_MOBILE · ${item.useEffect?'hiệu ứng có adapter runtime':'hiệu ứng sử dụng UNKNOWN'}.</small></details>`
  : '';
const fmt = formatNumber;
const resourceGlyph = key => RESOURCE_INFO[key]?.glyph || ({questVouchers:'券',population:'民',official:'官',morale:'心'}[key]||'?');
const ELEMENT_NAMES=Object.freeze({fire:'Hỏa',water:'Thủy',wood:'Mộc',metal:'Kim',earth:'Thổ',wind:'Phong'});
const costText = cost => Object.entries(cost || {}).filter(([,n]) => n > 0).map(([key,n]) => `${resourceGlyph(key)} ${fmt(n)}${RESOURCE_INFO[key]?'':` ${({questVouchers:'thẻ quà',population:'dân số',official:'quan chức',morale:'dân tâm'})[key]||key}`}`).join(' · ') || 'Miễn phí';
const isAffordable = (state, cost) => Object.entries(cost || {}).every(([key,n]) => (state.resources[key] || 0) >= n);
const button = (action, text, disabled = false, cls = 'button', extra = '') => `<button class="${cls}" data-action="${esc(action)}" ${disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
const title = (name, description, aside='') => `<div class="heading-copy"><h1>${name}</h1><p>${description}</p></div><div class="heading-aside">${aside}</div>`;
const panel = (name, body, extra='') => `<section class="panel ${extra}"><div class="panel-title">${name}</div><div class="panel-body">${body}</div></section>`;
const subheading = (name, hint='') => `<div class="panel-title">${name}${hint ? `<small>${hint}</small>` : ''}</div>`;
function pageNavigation(page,total,pageSize,key,label){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const previousAttrs=`data-page-key="${key}" data-page="${page-1}"`;
  const nextAttrs=`data-page-key="${key}" data-page="${page+1}"`;
  return `<nav class="catalog-pages" aria-label="Trang ${esc(label)}">${button('catalogPage','‹ Trước',page<=0,'button ghost small',previousAttrs)}<span>Trang ${page+1} / ${pages} · ${fmt(total)} ${esc(label)}</span>${button('catalogPage','Tiếp ›',page>=pages-1,'button ghost small',nextAttrs)}</nav>`;
}

function navMarkup(active) {
  return NAV.map(([id,glyph,label], i) => `<button class="nav-item ${id === active ? 'active' : ''}" data-view="${id}" aria-current="${id === active ? 'page' : 'false'}"><span class="nav-glyph">${glyph}</span><span class="nav-label">${label}</span>${id === 'quests' ? '<span class="nav-counter" id="quest-counter">!</span>' : ''}</button>`).join('');
}

export function renderShell(state, activeView) {
  document.querySelector('#realm-title').textContent = state.profile.name;
  document.querySelector('#fame-value').textContent = fmt(state.fame);
  const prod = productionPerHour(state);
  document.querySelector('#resource-strip').innerHTML = Object.entries(RESOURCE_INFO).map(([key, resource]) => `<div class="resource-pill" title="${resource.name} · ${fmt(state.resources[key])} · +${fmt(prod[key])}/giờ"><span class="resource-glyph">${resource.glyph}</span><span class="resource-value">${fmt(state.resources[key])}</span><span class="resource-name">${resource.name}</span></div>`).join('');
  document.querySelector('#primary-nav').innerHTML = navMarkup(activeView);
  document.querySelector('#mobile-nav').innerHTML = navMarkup(activeView);
  const quest = activeQuest(state);
  const activeQuestButton = document.querySelectorAll('#primary-nav [data-view="quests"],#mobile-nav [data-view="quests"]');
  activeQuestButton.forEach(el => { const badge = el.querySelector('.nav-counter'); if (badge) badge.textContent = quest ? '!' : '✓'; });
}

function queueCard(label, q, now, lookupName, glyph) {
  if (!q) return `<div class="queue-card"><div class="queue-title"><span>${label}</span><span class="muted">Trống</span></div><div class="queue-meta"><span>Sẵn sàng tiếp nhận mệnh lệnh</span><span>${glyph}</span></div></div>`;
  const total = Math.max(1, q.finishAt - q.startAt);
  const remaining = Math.max(0, q.finishAt - now);
  const progress = Math.max(0, Math.min(100, (1 - remaining / total) * 100));
  return `<div class="queue-card"><div class="queue-title"><span>${label}</span><b>${esc(lookupName(q))}</b></div><div class="queue-progress"><span data-progress="${progress}" style="width:${progress}%"></span></div><div class="queue-meta"><span>${remaining ? `Còn <b data-queue-time="${q.finishAt}">${formatDuration(remaining)}</b>` : 'Đang hoàn tất…'}</span><span>${glyph} ${q.count ? `${q.count} quân` : ''}</span></div></div>`;
}

function queuePanel(state, now) {
  const c = queueCard('Xây dựng', state.queues.construction, now, q => q.cityId?`${state.cities.find(city=>city.id===q.cityId)?.name||'Thành phụ'} · cấp ${q.level}`:`${BUILDINGS.find(b => b.id === q.buildingId)?.name || ''} · cấp ${q.level}`, '營');
  const t = queueCard('Huấn luyện', state.queues.training, now, q => TROOPS.find(x => x.id === q.troopId)?.name || 'Đạo quân', '兵');
  const r = queueCard('Nghiên cứu', state.queues.research, now, q => `${TECHNOLOGIES.find(x => x.id === q.techId)?.name || ''} · cấp ${q.level}`, '學');
  const m = queueCard('Hành quân', state.queues.march, now, q => (WORLD_NODES.find(x => x.id === q.nodeId) ?? getPveEncounter(q.nodeId))?.name || 'Ngoại vực', '騎');
  return `<section class="panel">${subheading('Mệnh lệnh trong thành','Thời gian mô phỏng cục bộ')}<div class="panel-body">${c}${t}${r}${m}</div></section>`;
}

function tutorialPanel(state) {
  const step=TUTORIAL_STEPS[state.tutorialStep];
  if(!step)return `<section class="panel tutorial-panel">${subheading('Chỉ dẫn nhập môn','Đã hoàn tất')}<div class="panel-body"><p>Thành trì, khoa kỹ, thần tiên, quân đội và trận chiến đầu tiên đã liên kết. Tiếp tục chính tuyến hoặc rèn luyện trước khi tới Triều Ca.</p><div class="field-row">${button('view-world','Mở bản đồ',false,'button small')}${button('view-pve','Thử thách endgame',false,'button ghost small')}</div></div></section>`;
  let action='';
  if(step.action==='upgrade'){
    const q=quoteBuilding(state,step.data.buildingId);
    action=button('upgrade','Nâng công trình',!!state.queues.construction||q.maxed||q.locked||!isAffordable(state,q.cost),'button small',`data-building="${step.data.buildingId}"`);
  }else if(step.action==='research'){
    const q=quoteResearch(state,step.data.techId);
    action=button('research','Nghiên cứu Nông Chính',!!state.queues.research||q.maxed||!isAffordable(state,q.cost),'button small',`data-tech="${step.data.techId}"`);
  }else if(step.action==='recruit'){
    const hero=HEROES.find(row=>row.id===step.data.heroId);
    action=button('recruit',`Mời ${hero?.name||'thần tiên'}`,!hero||(state.levels.altar||0)<1||(state.levels.manor||0)<1||state.heroes.length>=Math.min(60,3+(state.levels.manor||0)*2)||state.resources.gold<220+(hero?.wisdom||0)*2||state.resources.jade<(hero?.quality==='Thiên'?2:1),'button small',`data-hero="${step.data.heroId}"`);
  }else if(step.action==='equip'){
    action=button('equip','Trang bị Bạch Ngọc Kiếm',!state.heroes.some(h=>h.id===step.data.heroId)||!state.items.includes(step.data.itemId),'button small',`data-item="${step.data.itemId}" data-hero="${step.data.heroId}"`);
  }else if(step.action==='train'){
    const quote=quoteTraining(state,step.data.troopId,step.data.count);
    const troop=TROOPS.find(row=>row.id===step.data.troopId);
    action=button('train',`Huấn luyện 1 ${troop?.name||'binh chủng Mobile'}`,!!state.queues.training||quote.locked||!isAffordable(state,quote.cost),'button small',`data-troop="${step.data.troopId}" data-count="${step.data.count}"`);
  }else if(step.action==='march'){
    const count=state.army[step.data.troopId]||0;
    action=button('march','Hành quân tới Vân Mộng Đài',!count||!!state.queues.march,'button small',`data-node="${step.data.nodeId}" data-troop="${step.data.troopId}" data-count="${count}"`);
  }
  return `<section class="panel tutorial-panel">${subheading(`Chỉ dẫn nhập môn · ${state.tutorialStep+1}/${TUTORIAL_STEPS.length}`,step.title)}<div class="panel-body"><p>${esc(step.description)}</p>${action}<small class="tiny muted" style="margin-left:9px">Hoàn thành tác vụ để mở bước kế tiếp.</small></div></section>`;
}

function satelliteManagementPanel(state) {
  const satellites=(state.cities||[]).filter(city=>!city.isCapital);
  const rows=satellites.map(city=>{
    const quote=quoteCityUpgrade(state,city.id);
    const lockedLabel=quote.locked?`Cần Tử Vi Thành cấp ${Math.max(2,Math.ceil(quote.level/2)+1)}`:quote.maxed?'Đạt cấp tối đa':`${costText(quote.cost)} · ${formatDuration(quote.seconds*1000)}`;
    const contribution=`+${fmt(city.level*25)} lương · ${fmt(city.level*18)} gỗ · ${fmt(city.level*14)} đá · ${fmt(city.level*12)} sắt · ${fmt(city.level*8)} đồng/giờ`;
    return `<article class="inventory-item"><b>${esc(city.name)} · thành phụ cấp ${city.level}/10</b><small>${contribution}</small><small>Nâng tiếp: ${lockedLabel}</small>${button('upgradeCity','Nâng thành phụ',!!state.queues.construction||quote.maxed||quote.locked||!isAffordable(state,quote.cost),'button small',`data-city="${city.id}"`)}</article>`;
  }).join('');
  return `<section class="panel">${subheading('Quản lý thành phụ',`${satellites.length} / ${WORLD_NODES.filter(node=>node.kind==='Danh thành').length} danh thành NPC`)}<div class="panel-body"><div class="hint" style="margin-bottom:10px">Mỗi cấp thành phụ tăng sản lượng ngũ cốc, gỗ, đá, sắt và đồng. Nâng cấp dùng chung hàng xây dựng và mở khóa theo cấp Tử Vi Thành.</div><div class="inventory-grid">${rows||'<div class="empty-state"><strong>Chưa có thành phụ</strong>Chiếm danh thành NPC trên bản đồ để mở nguồn lực này.</div>'}</div></div></section>`;
}

function cityScreen(state, now) {
  const active = activeQuest(state);
  const prod = productionPerHour(state);
  const capacity = storageCapacity(state);
  const cityOverview = `<div class="city-overview">
    <div class="overview-card"><span class="label">Quân lực · ${armyCount(state)} quân sĩ</span><strong>${fmt(armyPower(state))}</strong><small>Sức mạnh đội hình</small></div>
    <div class="overview-card"><span class="label">Dân tâm</span><strong>${Math.round(state.morale)}%</strong><small>Thuế và sĩ khí</small></div>
    <div class="overview-card"><span class="label">Dân số · ${state.cities?.length||1} thành</span><strong>${fmt(Math.floor(state.population))}</strong><small>Thành phụ góp thêm sản lượng</small></div>
    <div class="overview-card"><span class="label">Dung lượng kho</span><strong>${fmt(capacity)}</strong><small>Tài nguyên mỗi loại</small></div>
  </div>`;
  const cityHero = `<section class="city-hero"><div class="city-hero-content"><span class="city-kicker">VƯƠNG TRIỀU · TÂY KỲ</span><h2>${esc(state.profile.name)}</h2><p>Thành trì tự trị giữa thời loạn. Tích lương, tu thành, cầu hiền và giữ vững đường tiến quân trong một thế giới mô phỏng ngoại tuyến.</p><div class="city-hero-actions">${button('view-world','Mở bản đồ thiên hạ',false,'button')}${button('view-quests','Xem chính tuyến',false,'button ghost')}</div></div></section>`;
  const buildingCards = BUILDINGS.map(b => {
    const level = state.levels[b.id] || 0;
    const quote = quoteBuilding(state, b.id);
    const effects = {
      citadel:`Thuế dân cư +${fmt(Math.floor(state.population*.002))}/giờ · mở khóa cấp thành`,
      barracks:`Tăng tốc huấn luyện ${level*.8}% · mở lệnh tuyển quân`,
      granary:`Lương thực +${fmt(7*level)}/giờ · kho +${fmt(220*level)}`,
      lumber:`Gỗ +${fmt(12*level)}/giờ`, quarry:`Đá +${fmt(10*level)}/giờ`, foundry:`Sắt +${fmt(9*level)}/giờ`,
      market:`Đồng +${fmt(25*level)}/giờ`, academy:`Mở nghiên cứu · tăng tốc ${level}%`,
      altar:`Linh ngọc +${fmt(.12*level)}/giờ · mở chiêu mộ`, manor:`Tăng chỗ roster · ngọc +${fmt(.025*level)}/giờ`,
      training:`Tăng tốc huấn luyện ${level*2.5}%`, clinic:`Giảm chi phí chữa thương ${Math.min(45,level*1.5)}%`,
      wall:`Giảm thương vong hành quân tối đa ${Math.min(4,level*.1)}%`, watch:`Hành quân nhanh ${level*1.5}% · trinh sát rẻ hơn`,
      storehouse:`Dung lượng kho +${fmt(level*1_650)}`, farm:`Lương thực +${fmt(52*level)}/giờ`,
      grove:`Gỗ +${fmt(38*level)}/giờ`, mine:`Đá +${fmt(34*level)}/giờ`, foundryfield:`Sắt +${fmt(28*level)}/giờ`,
      embassy:`Giảm phí đổi NPC ${level*.6}%`, caravan:`Giảm phí đổi NPC ${level*1.2}%`
    };
    const effectName = effects[b.id] || 'Tăng năng lực thành trì';
    const afford = isAffordable(state, quote.cost);
    const locked = quote.locked || quote.maxed;
    const disabled = !!state.queues.construction || !afford || locked;
    const label = quote.maxed ? 'Đã tối đa' : quote.requirementStatus==='LOCKED' ? 'Thiếu điều kiện' : quote.cityLocked ? `Cần Tử Vi ${Math.max(1,Math.ceil(quote.level/2))}` : level ? `Nâng ${formatDuration(quote.seconds * 1000)}` : 'Xây dựng';
    const detail = quote.maxed ? `Đạt giới hạn cấp ${b.maxLevel} · ${quote.maxLevelEvidence}` : `${costText(quote.cost)} · ${formatDuration(quote.seconds * 1000)} · chi phí ${quote.costEvidence} · tối đa C.${b.maxLevel} ${quote.maxLevelEvidence}`;
    const buildingArt = b.mobileImage ? `<img src="${esc(assetUrl(b.mobileImage))}" alt="" aria-hidden="true" loading="lazy">` : b.id === 'citadel' ? '<img src="./assets/buildings/tuvithanh.webp" alt="" aria-hidden="true">' : b.glyph;
    const sourceSummary=b.mobileSourceId?`<br><span class="muted">${esc(b.mobileDescription||'')}${b.mobileDescription?' · ':''}Mobile ${esc(b.mobileSourceId)} · VERIFIED_MOBILE</span>`:'';
    const requirementSummary=quote.requirementText&&quote.requirementText!=='—'?`<br><span class="muted">Điều kiện Mobile: ${esc(quote.requirementText)} · ${quote.requirementStatus==='SATISFIED'?'đạt':quote.requirementStatus==='LOCKED'?`chưa đạt (${esc(quote.unmetRequirements.join(', '))})`:quote.requirementStatus==='PARTIAL_UNKNOWN'?`một phần UNKNOWN (${esc(quote.unknownRequirements.join(', '))})`:'UNKNOWN'}</span>`:'';
    return `<article class="building-card ${locked ? 'is-locked' : ''}"><div class="building-top"><span class="building-seal${b.mobileImage||b.id === 'citadel' ? ' building-seal-art' : ''}">${buildingArt}</span><span class="building-name">${esc(b.name)}</span><span class="building-lv">C.${level}</span></div><div class="building-effect">${effectName}<br><span class="muted">${detail}</span>${sourceSummary}${requirementSummary}</div><button class="button small" data-action="upgrade" data-building="${b.id}" ${disabled ? 'disabled' : ''}>${state.queues.construction && !locked ? 'Đợi thợ xây' : label}</button></article>`;
  }).join('');
  const production = Object.entries(RESOURCE_INFO).map(([key,r]) => `<div class="production-line"><span class="resource-glyph">${r.glyph}</span><span>${r.name}</span><b>+${fmt(prod[key])}/giờ</b></div>`).join('');
  const questBody = active ? `<div class="eyebrow">HỒI ${active.chapter} · NHIỆM VỤ MỞ ĐẦU</div><p class="quest-title">${active.title}</p><p class="tiny muted">${fmt(questProgress(state,active))} / ${fmt(active.goal)} · Thưởng ${costText(active.reward)}</p>${button('view-quests','Mở sổ nhiệm vụ',false,'button small')}` : '<div class="empty-state"><strong>Chính tuyến đã khép lại</strong>Mở rộng các thử thách PvE để tiếp tục.</div>';
  const chronicle = state.notifications.slice(0,5).map(text => `<div class="chronicle-entry"><i></i><span>${esc(text)}</span></div>`).join('') || '<span class="muted tiny">Chưa có biến động.</span>';
  return `${cityHero}${tutorialPanel(state)}${cityOverview}${satelliteManagementPanel(state)}<div class="city-sections"><div><section class="panel">${subheading('Thành nội và ngoại thành','21 công trình Mobile + 6 công trình hỗ trợ · chi phí, giới hạn và nguồn được ghi theo từng tòa')}<div class="panel-body"><div class="building-grid">${buildingCards}</div></div></section></div><aside class="city-side">${queuePanel(state,now)}<section class="panel">${subheading('Lưu chuyển tài nguyên')}<div class="panel-body"><div class="production-list">${production}</div></div></section><section class="panel">${subheading('Tin trong thành')}<div class="panel-body"><div class="chronicle">${chronicle}</div></div></section><section class="panel">${subheading('Chính tuyến')}<div class="panel-body">${questBody}</div></section></aside></div>`;
}

function heroScreen(state, _now, uiState={}) {
  const owned = state.heroes.map(h => ({ data:HEROES.find(def => def.id === h.id), save:h })).filter(h => h.data);
  const slots = [0,1,2].map(index => {
    const h = owned.filter(x => x.save.assigned)[index];
    return `<div class="formation-slot"><b>${h ? HEROES.find(x => x.id === h.save.id).name : `Vị trí ${index+1}`}</b><small>${h ? `Cấp ${h.save.level} · ${fmt(heroPower(h.save,state))} lực chiến · Linh căn ${h.save.affinity}/100` : 'Chưa có thần tiên trong đội'}</small></div>`;
  }).join('');
  const cards = owned.map(({data,save}, i) => {
    const equipped = Object.values(save.equipment || {}).filter(Boolean).map(id => ITEMS.find(x => x.id === id)?.name).filter(Boolean);
    const gem=state.items.map(id=>ITEMS.find(item=>item.id===id)).find(item=>item?.mobileGroup==='Châu báu');
    const gearActions=Object.entries(save.equipment||{}).filter(([,id])=>id).map(([slot,id])=>{const item=ITEMS.find(row=>row.id===id);if(!item)return '';const enhancement=save.gearEnhancements?.[id]||{rank:0,gems:[]},quote=quoteGearEnhancement(state,save.id,id),socket=gem?quoteGearGemSocket(state,save.id,id,gem.id):null;return `<div class="gear-upgrade-row"><small>${esc(item.name)} · +${enhancement.rank||0} · ${enhancement.gems?.length||0}/2 ngọc</small><div class="field-row">${button('enhanceGear',quote?.maxed?'Đã đạt +5':`Cường hóa · ${costText(quote?.cost)}`,!quote?.available,'button ghost small',`data-hero="${save.id}" data-item="${id}"`)}${gem?button('socketGearGem',`Khảm ${esc(gem.name)}`,!socket?.available,'button ghost small',`data-hero="${save.id}" data-item="${id}" data-gem="${gem.id}"`):''}</div></div>`;}).join('');
    const nextXp=save.level>=150?0:100+save.level*save.level*34;
    const combatSkill=HERO_SKILLS.find(skill=>skill.name===data.skill);
    const portrait=data.mobileImage?`<div class="portrait portrait-source" data-hero-id="${esc(data.id)}"><img src="${esc(assetUrl(data.mobileImage))}" alt="Chân dung ${esc(data.name)}" loading="lazy" decoding="async"></div>`:`<div class="portrait portrait-${i%6}" data-hero-id="${esc(data.id)}" role="img" aria-label="Chân dung ${esc(data.name)}"></div>`;
    const sourceStats=(data.mobileBaseStats||[]).slice(0,7).map(stat=>`${esc(stat.label)} ${esc(stat.value)}`).join(' · ');
    const sourceAbility=(data.mobileAbilities||[])[0];
    return `<article class="hero-card">${portrait}<div class="hero-card-info"><h3 class="hero-name">${esc(data.name)}</h3><div class="hero-subtitle">${esc(data.mobileOccupation||data.role)}${data.mobileFaction?` · ${esc(data.mobileFaction)}`:''} · ${data.quality} phẩm · +${Math.round((HERO_QUALITY_MULTIPLIERS[data.quality]-1)*100)}% căn cơ · ${data.element}</div><div class="hero-stats"><div class="hero-stat"><b>${data.attack+save.level*2}</b><small>Đánh</small></div><div class="hero-stat"><b>${data.defense+save.level*2}</b><small>Thủ</small></div><div class="hero-stat"><b>${fmt(heroPower(save,state))}</b><small>Lực chiến</small></div></div>${sourceStats?`<div class="hero-subtitle">Mobile gốc: ${sourceStats} · lực chiến dùng thuộc tính nguồn với hệ số SIMULATED</div>`:''}<div class="hero-subtitle">${esc(data.skill)} · ${esc(data.skillText)} · kỹ năng cấp ${save.skillLevel}</div>${data.mobileSignature?`<div class="hero-subtitle">Danh hiệu Mobile: ${esc(data.mobileSignature)}</div>`:''}${sourceAbility?`<details class="source-provenance"><summary>Pháp bảo chuyên thuộc · ${esc(sourceAbility.name)}</summary><p>${esc(sourceAbility.description)}</p></details>`:''}${data.mobileDescription?`<details class="source-provenance"><summary>Tiểu sử Mobile</summary><p>${esc(data.mobileDescription)}</p></details>`:''}${combatSkill?`<div class="hero-subtitle">Bị động: ${esc(combatSkill.passive)} · Chủ động: ${esc(combatSkill.activeName)} (hiệp ${combatSkill.triggerRound})</div>`:''}<div class="hero-affinity"><div class="hero-affinity-head"><span>Linh căn</span><b>${save.affinity}/100</b></div><progress max="100" value="${save.affinity}"></progress><small>Tu luyện, hành quân và đấu pháp tăng linh căn; linh căn cường hóa lực chiến và pháp môn.</small></div><div class="hero-subtitle">Trang bị: ${equipped.length ? equipped.map(esc).join(' · ') : 'chưa có'} · ${fmt(save.xp)} / ${fmt(nextXp)} XP</div>${gearActions?`<div class="gear-upgrade-list"><small>Cường hóa và khảm ngọc · Huyền Thiết Lò cấp 1 · hiệu quả SIMULATED</small>${gearActions}</div>`:''}</div><div class="hero-footer">${button('assignHero',save.assigned?'Rời đội hình':'Vào đội hình',false,save.assigned?'button ghost small':'button small',`data-hero="${save.id}"`)}${button('trainHero',save.level>=150?'Đạt cấp tối đa':'Tu luyện · + linh căn',state.resources.food<65*save.level||state.resources.gold<85*save.level||(save.level>=150&&save.affinity>=100),'button small',`data-hero="${save.id}"`)}<span class="tag ${data.mobileSourceId?'':'simulated'}">${data.mobileSourceId?'VERIFIED_MOBILE · hệ số chiến đấu SIMULATED':'SIMULATED'}</span></div></article>`;
  }).join('');
  const unowned = HEROES.filter(h => h.mobileSourceId && !state.heroes.some(ownedHero => ownedHero.id === h.id));
  const recruitPageSize=24,recruitPageCount=Math.max(1,Math.ceil(unowned.length/recruitPageSize));
  const recruitPage=Math.min(recruitPageCount-1,Math.max(0,Number(uiState.heroPage)||0));
  const recruitCap=Math.min(60,3+(state.levels.manor||0)*2);
  const canRecruit=(state.levels.altar||0)>=1&&(state.levels.manor||0)>=1&&state.heroes.length<recruitCap;
  const recruitRows=unowned.slice(recruitPage*recruitPageSize,(recruitPage+1)*recruitPageSize);
  const sourcedRecruitCount=HEROES.filter(hero=>hero.mobileSourceId).length;
  const recruit = recruitRows.map(h => {
    const ability=(h.mobileAbilities||[])[0];
    return `<div class="inventory-item"><b>${esc(h.name)}</b><small>${esc(h.mobileOccupation||h.role)}${h.mobileFaction?` · ${esc(h.mobileFaction)}`:''}${h.mobileQuality?` · Mobile phẩm ${h.mobileQuality}`:''} · căn cơ nội bộ ${h.quality} · combat SIMULATED</small>${ability?`<small>Pháp bảo chuyên thuộc: ${esc(ability.name)} · ${esc(ability.description)}</small>`:''}${h.mobileDescription?`<small>${esc(h.mobileDescription)}</small>`:''}<small>Chiêu mộ mô phỏng: ${fmt(220+h.wisdom*2)} đồng · ${h.quality==='Thiên'?2:1} ngọc</small>${button('recruit','Mời nhập phủ',!canRecruit||state.resources.gold<220+h.wisdom*2||state.resources.jade<(h.quality==='Thiên'?2:1),'button small',`data-hero="${h.id}"`)}</div>`;
  }).join('');
  const recruitPager=pageNavigation(recruitPage,unowned.length,recruitPageSize,'heroPage','thần tiên Mobile');
  const gear = state.items.map(id => ITEMS.find(i => i.id === id)).filter(i => i && i.type !== 'vật phẩm').map(item => `<div class="inventory-item"><b>${item.glyph} ${esc(item.name)}</b><small>${item.type} · ${item.effect}</small><label class="sr-only" for="equip-${item.id}">Chọn người nhận ${item.name}</label><select id="equip-${item.id}" class="input" data-equip-select="${item.id}">${owned.map(h=>`<option value="${h.save.id}">${esc(h.data.name)}</option>`).join('')}</select>${button('equip','Trang bị',!owned.length,'button small',`data-item="${item.id}"`)}</div>`).join('');
  const featured = HEROES.filter(row => row.mobileSourceId).slice(4);
  const candidate = featured[recruitmentPromotion(state, _now) % featured.length];
  const refresh = state.levels.hostel && state.levels.altar && candidate
    ? panel('Khách ghé Dịch quán', `<p><b>${esc(candidate.name)}</b> · giảm thêm 10% tiền chiêu mộ hôm nay.</p>
      ${button('refreshRecruitment', 'Làm mới · 50 đồng', state.resources.gold < 50 ||
        state.gameplay?.recruitmentRefresh === Math.floor(_now / 86400000), 'button small')}`) : '';
  return `${refresh}<section class="panel">${subheading('Đội hình hành quân','Tối đa 3 vị trí')}<div class="panel-body"><div class="formation-row">${slots}</div><div class="hint">Phẩm chất Mobile, pháp bảo chuyên thuộc và thuộc tính gốc được ghi theo nguồn; hệ số lực chiến, tu luyện và kỹ năng chiến đấu còn mô phỏng.</div></div></section><div class="divider"></div><section class="panel">${subheading(`Tiên Gia Phủ · ${owned.length} / ${Math.min(60,3+(state.levels.manor||0)*2)} thần tiên`)}<div class="panel-body"><div class="roster-grid">${cards || '<div class="empty-state"><strong>Phủ đang vắng</strong>Dựng Phong Thần Đàn để mời thần tiên.</div>'}</div></div></section><div class="divider"></div><section class="panel">${subheading('Lời mời nhập phủ',`${sourcedRecruitCount} hồ sơ Mobile · ${unowned.length} chưa chiêu mộ · trang ${recruitPage+1}/${recruitPageCount}`)}<div class="panel-body"><div class="inventory-grid">${recruit}</div>${recruitPager}<div class="hint" style="margin-top:10px">Chỉ hồ sơ Mobile có provenance được mở chiêu mộ mới; nhân vật mô phỏng đã nằm trong save vẫn được giữ. Giá và cơ chế chiêu mộ còn SIMULATED.</div></div></section><div class="divider"></div><section class="panel">${subheading(`Trang bị khả dụng · ${gear.split('inventory-item').length-1} món`)}<div class="panel-body"><div class="inventory-grid">${gear || '<div class="empty-state"><strong>Túi pháp bảo trống</strong>Nhận trang bị từ chiến thắng, nhiệm vụ và hoạt động.</div>'}</div></div></section>`;
}

function armyScreen(state) {
  const owned = Object.entries(state.army).map(([id,count]) => ({ troop:TROOPS.find(t=>t.id===id),count })).filter(x=>x.troop&&x.count>0);
  const wounded = Object.values(state.wounded).reduce((a,n)=>a+n,0);
  const recruitableTroops=TROOPS.filter(t=>t.mobileSourceId);
  const selectedId = recruitableTroops.some(t=>t.id===owned[0]?.troop.id) ? owned[0].troop.id : recruitableTroops[0]?.id;
  const mobileTroopCount=recruitableTroops.length;
  const simulatedTroopCount=TROOPS.length-mobileTroopCount;
  const sourcedCostCount=recruitableTroops.filter(t=>t.trainingCostEvidence==='VERIFIED_LEGACY').length;
  const sourcedRequirementCount=recruitableTroops.filter(t=>t.trainingRequirementEvidence==='VERIFIED_LEGACY').length;
  const trainingRequirementsLabel=t=>{
    if(!t.trainingRequirements)return `Tử Vi Thành cấp ${t.unlockCity} · SIMULATED`;
    const entries=[
      ...(t.trainingRequirements.buildings||[]).map(req=>`${BUILDINGS.find(row=>row.id===req.runtimeBuildingId)?.name||req.sourceName} cấp ${req.level}`),
      ...(t.trainingRequirements.technologies||[]).map(req=>`${TECHNOLOGIES.find(row=>row.id===req.runtimeTechnologyId)?.name||req.sourceName} cấp ${req.level}`),
      ...(t.trainingRequirements.unknown||[]).map(req=>`${['WorkShop','Workshop'].includes(req.sourceName)?'Xưởng chế tạo':req.sourceName} cấp ${req.level} · ${['WorkShop','Workshop'].includes(req.sourceName)?'SIMULATED_CROSS_VERSION_BRIDGE':'UNKNOWN'}`)
    ];
    return entries.join(' · ')||'Không có điều kiện đã nhập';
  };
  const trainingRequirementStatus=t=>quoteTraining(state,t.id,1).requirementEvidence;
  const selectOptions = recruitableTroops.map(t=>{
    const quote=quoteTraining(state,t.id,1);
    return `<option value="${t.id}" ${t.id===selectedId?'selected':''} ${quote.locked?'disabled':''}>${esc(t.name)} · ${t.role} · ${t.lane==='front'?'tuyến trước':t.lane==='rear'?'tuyến sau':'công thành'} · tầm ${t.range} · T${t.tier} · ${t.trainSeconds}s ${t.trainTimeEvidence} · Giá ${t.trainingCostEvidence||'SIMULATED'} · ${trainingRequirementStatus(t)} · ${esc(trainingRequirementsLabel(t))}${quote.locked?` · chưa đủ ${esc(quote.unmetRequirements.join(', '))}`:''}</option>`;
  }).join('');
  const unitImage=t=>t.mobileImage?`<img class="unit-source-art" src="${esc(assetUrl(t.mobileImage))}" alt="" loading="lazy" decoding="async">`:`<span class="unit-glyph">${t.glyph}</span>`;
  const armyRows = owned.map(({troop,count})=>`<tr><td>${unitImage(troop)} ${esc(troop.name)}</td><td>${troop.role} · ${troop.lane==='front'?'tuyến trước':troop.lane==='rear'?'tuyến sau':'công thành'} · tầm ${troop.range}</td><td>${troop.tier}</td><td>${fmt(count)}</td><td>${fmt(troop.attack)} / ${fmt(troop.defense)}</td><td>${costText(troop.cost)}<br><span class="tag ${troop.trainingCostEvidence==='VERIFIED_LEGACY'?'':'simulated'}">${troop.trainingCostEvidence||'SIMULATED'}</span></td></tr>`).join('');
  const catalogRows = TROOPS.map(t=>`<tr><td>${unitImage(t)} ${esc(t.name)}</td><td>${esc(t.mobileClass||t.role)} · ${t.lane==='front'?'tuyến trước':t.lane==='rear'?'tuyến sau':'công thành'} · tầm ${t.range}${t.mobileFaction?` · ${esc(t.mobileFaction)}`:''}</td><td>${t.tier}</td><td>${t.attack} / ${t.defense} / ${t.speed}${t.mobileLife!==null?` · HP ${t.mobileLife}`:''}</td><td>${t.mobileCounterRows.length?esc(t.mobileCounterRows.map(row=>`${row.target} ${row.rate}`).join(' · ')):esc(t.counter)}</td><td>${t.trainSeconds}s · ${t.trainTimeEvidence}</td><td>${esc(trainingRequirementsLabel(t))}</td><td><span class="tag ${t.trainingCostEvidence==='VERIFIED_LEGACY'?'':'simulated'}">Giá ${t.trainingCostEvidence||'SIMULATED'}</span> <span class="tag ${trainingRequirementStatus(t)==='VERIFIED_LEGACY'?'':'simulated'}">Điều kiện ${trainingRequirementStatus(t)}</span><br><span class="tag ${t.sourceFieldStatus==='VERIFIED_MOBILE'?'':'simulated'}">${t.sourceFieldStatus==='VERIFIED_MOBILE'?'VERIFIED_MOBILE':'SIMULATED'}</span></td></tr>`).join('');
  return `<div class="city-overview"><div class="overview-card"><span class="label">Quân số sẵn sàng</span><strong>${fmt(armyCount(state))}</strong><small>${fmt(armyPower(state))} lực chiến</small></div><div class="overview-card"><span class="label">Quân bị thương</span><strong>${fmt(wounded)}</strong><small>Hồi Xuân Đường</small></div><div class="overview-card"><span class="label">Binh doanh</span><strong>Cấp ${state.levels.barracks||0}</strong><small>Huấn luyện theo hàng đợi</small></div><div class="overview-card"><span class="label">Sĩ khí thành</span><strong>${Math.round(state.morale)}%</strong><small>Ảnh hưởng chiến trường</small></div></div>
    <div class="world-layout"><section class="panel">${subheading('Chiêu mộ và huấn luyện quân sĩ',`${mobileTroopCount} hồ sơ Mobile · ${simulatedTroopCount} hồ sơ SIMULATED`)}<div class="panel-body"><div class="field-row"><div class="field"><label for="train-unit">Binh chủng</label><select id="train-unit" class="input">${selectOptions}</select></div><div class="field"><label for="train-count">Số lượng · tối đa 500</label><input id="train-count" class="input" type="number" value="5" min="1" max="500" inputmode="numeric"></div><div class="field"><button class="button" data-action="train" data-troop-select="1" ${!!state.queues.training?'disabled':''}>Ra lệnh huấn luyện</button></div></div><p class="tiny muted">Chỉ ${mobileTroopCount} hồ sơ Mobile có thể huấn luyện mới; ${simulatedTroopCount} hồ sơ mô phỏng chỉ giữ cho đội NPC và save cũ. Giá và điều kiện legacy đã đối chiếu cho ${sourcedCostCount}/${mobileTroopCount} quân, dữ liệu huấn luyện còn lại SIMULATED. Có ${sourcedRequirementCount} hồ sơ điều kiện; WorkShop legacy dùng cầu nối SIMULATED sang Xưởng chế tạo Mobile. Thời gian gốc dùng legacy cho 24 ID trùng; hệ số tốc độ runtime vẫn áp dụng.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Binh chủng</th><th>Vai trò / tuyến</th><th>Bậc</th><th>Số lượng</th><th>Công / thủ</th><th>Chi phí / quân · theo nguồn</th></tr></thead><tbody>${armyRows || '<tr><td colspan="6" class="muted">Chưa có quân; huấn luyện ở bảng trên.</td></tr>'}</tbody></table></div></div></section><aside>${queuePanel(state,Date.now())}${panel('Hồi Xuân Đường',`<p class="tiny muted">${wounded ? `${fmt(wounded)} quân sĩ đang bị thương, có thể hồi phục bằng lương thực và đồng.` : 'Không có thương binh. Thương vong chiến trận được giữ riêng.'}</p>${button('heal','Hồi phục quân',!wounded,'button block')}`)}</aside></div>
    <details class="panel" style="margin-top:12px"><summary class="panel-title">Toàn bộ danh mục binh chủng · ${TROOPS.length} loại <small>${mobileTroopCount} Mobile · ${simulatedTroopCount} SIMULATED</small></summary><div class="panel-body table-scroll"><table class="data-table"><thead><tr><th>Binh chủng</th><th>Vai trò / tuyến</th><th>Bậc</th><th>Công / thủ / tốc</th><th>Khắc chế</th><th>Huấn luyện gốc</th><th>Điều kiện mở / nguồn</th><th>Nguồn dữ kiện</th></tr></thead><tbody>${catalogRows}</tbody></table></div></details>`;
}

function inventoryScreen(state, _now, uiState={}) {
  const owned = state.items.map((id,index)=>({item:ITEMS.find(x=>x.id===id),index})).filter(x=>x.item);
  const ownedUnique = new Set(state.items);
  const unownedGear = ITEMS.filter(item=>item.type!=='vật phẩm'&&!item.mobileSourceId&&!ownedUnique.has(item.id)&&!state.heroes.some(h=>Object.values(h.equipment||{}).includes(item.id)));
  const cards = owned.map(({item,index})=>{
    if (item.type==='vật phẩm') {
      if(item.legacySourceId)return `<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>Tín vật SIMULATED · yêu cầu bởi nhiệm vụ legacy</small>${itemSourceDetails(item)}<small>Được nộp và tiêu hao khi nhận nhiệm vụ tương ứng.</small></article>`;
      const sale=quoteItemSale(state,item.id),effect=item.useEffect||(state.settings.combatV13&&itemUseRule(item));return `<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>${esc(item.mobileGroup||'Vật phẩm')} · ${esc(item.effect)}</small>${itemSourceDetails(item)}${button('useItem',item.useEffect?.kind==='mobileChest'||effect?.kind==='simulatedChest'?'Mở rương':'Sử dụng',!effect,'button small','data-item="'+item.id+'" data-index="'+index+'"')}${sale?button('sellItem',`Bán · ${sale.gold} đồng`,false,'button ghost small','data-item="'+item.id+'"'):''}${!effect?'<small>Hiệu ứng sử dụng UNKNOWN.</small>':''}</article>`;
    }
    const slot=item.type==='vũ khí'?'weapon':item.type==='giáp'?'armor':'artifact';
    const heroOptions=state.heroes.map(h=>`<option value="${h.id}">${esc(HEROES.find(x=>x.id===h.id)?.name||h.id)}</option>`).join('');
    const sale=quoteItemSale(state,item.id);return `<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>${item.type} · bậc ${item.tier} · ${esc(item.effect)}</small>${itemSourceDetails(item)}<div class="field" style="margin-top:7px"><label for="bag-equip-${index}">Thần tiên nhận trang bị</label><select class="input" id="bag-equip-${index}" data-equip-select="${item.id}">${heroOptions}</select></div>${button('equip','Trang bị',!state.heroes.length,'button small','data-item="'+item.id+'" data-index="'+index+'"')}${sale?button('sellItem',`Bán · ${sale.gold} đồng`,false,'button ghost small','data-item="'+item.id+'"'):''}</article>`;
  }).join('');
  const forgePageSize=24,forgePageCount=Math.max(1,Math.ceil(unownedGear.length/forgePageSize));
  const forgePage=Math.min(forgePageCount-1,Math.max(0,Number(uiState.forgePage)||0));
  const forgeRows=unownedGear.slice(forgePage*forgePageSize,(forgePage+1)*forgePageSize);
  const forge=forgeRows.map(item=>`<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>${item.type} · bậc ${item.tier} · ${esc(item.effect)}</small>${itemSourceDetails(item)}<small>Rèn: ${24*item.tier} sắt · ${55*item.tier} đồng · ${9*item.tier} đá${item.tier>=4?' · 1 ngọc':''}</small>${button('forge','Rèn pháp bảo',state.levels.foundry<1||state.resources.iron<24*item.tier||state.resources.gold<55*item.tier||state.resources.stone<9*item.tier||item.tier>=4&&state.resources.jade<1,'button small','data-item="'+item.id+'"')}</article>`).join('');
  const forgePager=pageNavigation(forgePage,unownedGear.length,forgePageSize,'forgePage','công thức rèn');
  const consumables=ITEMS.filter(item=>item.type==='vật phẩm'&&(!item.mobileSourceId||item.mobileAvailableAtMerchant&&item.useEffect||item.mobileSourceId==='4906'));
  const consumablePageSize=24,consumablePageCount=Math.max(1,Math.ceil(consumables.length/consumablePageSize));
  const consumablePage=Math.min(consumablePageCount-1,Math.max(0,Number(uiState.consumablePage)||0));
  const consumableRows=consumables.slice(consumablePage*consumablePageSize,(consumablePage+1)*consumablePageSize);
  const merchant=consumableRows.map(item=>{
    const quote=quoteItemPurchase(state,item.id,1);
    const count=state.items.filter(id=>id===item.id).length;
    return `<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>${esc(item.effect)} · bậc ${item.tier}</small>${itemSourceDetails(item)}<small>Giá chuyển đổi SIMULATED / lô 1: ${costText(quote.cost)}</small>${item.legacySourceId?`<label for="buy-count-${esc(item.id)}">Số lượng cần lấy</label><input class="input" type="number" min="1" max="${Math.max(1,500-state.items.length)}" value="${Math.min(item.legacySuggestedCount||1,Math.max(1,500-state.items.length))}" inputmode="numeric" data-buy-count="${esc(item.id)}" id="buy-count-${esc(item.id)}">`:''}<small>Trong túi: ${fmt(count)}</small>${button('buyItem',item.legacySourceId?'Đặt tín vật':'Mua vật phẩm',!quote.available,'button small','data-item="'+item.id+'"')}</article>`;
  }).join('');
  const consumablePager=pageNavigation(consumablePage,consumables.length,consumablePageSize,'consumablePage','vật phẩm tiêu hao');
  const gearCount=owned.filter(x=>x.item.type!=='vật phẩm').length;
  return `<div class="city-overview"><div class="overview-card"><span class="label">Kho đồ</span><strong>${owned.length} món</strong><small>${gearCount} trang bị · ${owned.length-gearCount} vật phẩm</small></div><div class="overview-card"><span class="label">Huyền Thiết Lò</span><strong>Cấp ${state.levels.foundry||0}</strong><small>Mở rèn trang bị</small></div><div class="overview-card"><span class="label">Pháp bảo</span><strong>${state.heroes.reduce((n,h)=>n+Object.values(h.equipment||{}).filter(Boolean).length,0)} đang trang bị</strong><small>Thần tiên trong Tiên Gia Phủ</small></div></div><section class="panel">${subheading('Túi đồ và vật phẩm',`${owned.length} món trong ${fmt(state.items.length)} vật phẩm`)}<div class="panel-body"><div class="inventory-grid">${cards||'<div class="empty-state"><strong>Túi đồ đang trống</strong>Thắng trận, hoàn thành nhiệm vụ hoặc rèn trang bị.</div>'}</div></div></section><div class="divider"></div><section class="panel">${subheading('Thương nhân vật phẩm',`${consumables.filter(item=>item.mobileSourceId).length} hồ sơ Mobile · ${consumables.filter(item=>!item.mobileSourceId).length} mô phỏng · trang ${consumablePage+1}/${consumablePageCount}`)}<div class="panel-body"><div class="hint" style="margin-bottom:10px">Rương Mobile có danh sách mở theo dữ liệu nguồn. Giá chuyển đổi thành lương thực, đồng và linh ngọc vẫn là SIMULATED; tối đa 500 món trong túi.</div><div class="inventory-grid">${merchant}</div>${consumablePager}</div></section><div class="divider"></div><section class="panel">${subheading('Lò luyện pháp bảo',`${unownedGear.length} công thức · trang ${forgePage+1}/${forgePageCount}`)}<div class="panel-body"><div class="hint" style="margin-bottom:10px">Cần Huyền Thiết Lò cấp 1. Mỗi công thức tạo một món duy nhất và trừ tài nguyên ngay khi xác nhận.</div><div class="inventory-grid">${forge||'<div class="empty-state"><strong>Đã có đủ trang bị</strong>Tiếp tục tìm chiến lợi phẩm để nhận vật phẩm khác.</div>'}</div>${forgePager}</div></section><div class="divider"></div><section class="panel">${subheading('Trang bị đang sử dụng')}<div class="panel-body"><div class="inventory-grid">${state.heroes.map(h=>{const hero=HEROES.find(x=>x.id===h.id);return `<div class="inventory-item"><b>${esc(hero?.name||h.id)}</b><small>Cấp ${h.level} · lực chiến ${fmt(heroPower(h,state))}</small>${Object.entries(h.equipment||{}).map(([slot,id])=>`<small>${slot==='weapon'?'Vũ khí':slot==='armor'?'Giáp':'Pháp bảo'}: ${id?esc(ITEMS.find(i=>i.id===id)?.name||id):'Chưa có'}</small>`).join('')}</div>`}).join('')||'<div class="empty-state">Chưa chiêu mộ thần tiên.</div>'}</div></div></section>`;
}

function worldScreen(state, uiState) {
  const unlocked=unlockedChapter(state);
  const chapter = Math.min(unlocked,Math.max(1, Number(uiState.chapter) || 1));
  uiState.chapter=chapter;
  const nodes = WORLD_NODES.filter(n=>n.chapter===chapter);
  const selected = nodes.find(n=>n.id===uiState.nodeId) || nodes[0];
  if (selected && uiState.nodeId !== selected.id) uiState.nodeId = selected.id;
  const scouted=state.world.scouted.includes(selected.id);
  const scoutQuote=quoteScouting(state,selected.id);
  const scoutCost=scoutQuote?.cost||0;
  const scoutKind=state.world.scoutedKinds?.[selected.id]||'army';
  const enemyIntel=scouted&&scoutKind==='resources'
    ? `<section class="recon-intel"><b>Trữ lượng ước tính · SIMULATED</b>${Object.entries(selected.loot).map(([key,value])=>`<span>${esc(RESOURCE_INFO[key]?.name||key)} ${fmt(value)}</span>`).join('')}</section>`
    : scouted&&scoutKind==='immortals'
      ? `<section class="recon-intel"><b>Đấu pháp Tiên Sơn</b><span>${esc(selected.enemy.tactic.name)}</span><span>Ngũ hành: ${ELEMENT_NAMES[selected.enemy.element]||'Trung tính'}</span><small>Danh sách thần tiên đối thủ: UNKNOWN.</small></section>`
      : scouted
        ? `<section class="recon-intel"><b>Chủ soái: ${esc(selected.enemy.commander)}</b><span>Đấu pháp: ${esc(selected.enemy.tactic.name)}</span><span>Ngũ hành: ${ELEMENT_NAMES[selected.enemy.element]||'Trung tính'}</span><span>${selected.enemy.formation.map(row=>`${esc(TROOPS.find(t=>t.id===row.unitId)?.name||row.unitId)} ${fmt(row.count)}`).join(' · ')}</span></section>`
        : '<div class="tiny muted recon-hint">Trinh sát để nhận thông tin theo loại địa điểm; trữ lượng dã địa được ước tính.</div>';
  const cityReference=selected.mobileCityId?`<section class="recon-intel">${selected.mobileImage?`<img class="city-source-art" src="${esc(assetUrl(selected.mobileImage))}" alt="${esc(selected.name)}" loading="lazy" decoding="async">`:''}<b>${esc(selected.mobileCityType||'Danh thành')} · ${esc(selected.mobileFaction||'')}</b><span>Tọa độ Mobile ${esc(selected.mobileCoordinates?.join(', ')||'UNKNOWN')} · Tường cấp ${fmt(selected.mobileWallLevel||0)} · Quan cấp ${fmt(selected.mobileOfficialLevel||0)}</span><span>Đội hình trấn thủ: ${fmt((selected.mobileGarrison||[]).length)} hồ sơ Mobile</span><div class="city-garrison-list">${(selected.mobileGarrison||[]).map(guard=>`<article class="city-guard-card">${guard.localImage?`<img src="${esc(assetUrl(guard.localImage))}" alt="${esc(guard.name)}" loading="lazy" decoding="async">`:''}<div><b>${esc(guard.name)}</b><small>${esc(guard.troopText||'Binh chủng UNKNOWN')}</small></div></article>`).join('')||'<small>UNKNOWN</small>'}</div><small>${esc(selected.mobileGarrisonNote||'Quân số trấn thủ chưa có ghi chú nguồn.')} Danh mục không cố định con số quân; hồ sơ này không đổi trận fallback.</small></section>`:'';
  const legacyCityReference=selected.legacyGarrison?.length?`<section class="recon-intel"><b>Đối chiếu NPC legacy · tọa độ ${esc(selected.legacyGarrisonCoordinateKey)}</b><span>${fmt(selected.legacyGarrison.length)} hàng · ${esc(LEGACY_CITY_GARRISON_SOURCE.sourceVersion)}</span><div class="city-legacy-garrison-list">${selected.legacyGarrison.map(row=>`<article><b>${esc(row.generalName)}</b><small>${esc(row.leadSoldierName)} · ${fmt(row.leadSoldierCount)} quân</small></article>`).join('')}</div><small>Đội hình và quân số từ snapshot legacy; Mobile thay đổi theo máy chủ. Tham khảo theo tọa độ, không tác động combat hoặc phần thưởng.</small></section>`:'';
  const pins = nodes.map((n,i)=>`<button class="map-node ${n.isBoss?'boss':n.kind==='Danh thành'?'':n.kind==='Dã địa'?'field':'mountain'} ${state.world.captures.includes(n.id)?'captured':''} ${selected.id===n.id?'selected':''}" style="left:${n.x}%;top:${n.y}%" data-action="selectNode" data-node="${n.id}" title="${esc(n.name)} · ${esc(n.mobileCityId||n.id)}${n.mobileCoordinates?` · ${esc(n.mobileCoordinates.join(', '))}`:''} · lực lượng ${fmt(n.power)}">${n.mobileImage?`<img src="${esc(assetUrl(n.mobileImage))}" alt="" loading="lazy" decoding="async">`:n.isBoss?'王':n.kind==='Danh thành'?'城':n.kind==='Dã địa'?'野':'仙'}</button>`).join('');
  const armyOptions = Object.entries(state.army).filter(([,n])=>n>0).map(([id,count])=>`<option value="${id}">${esc(TROOPS.find(t=>t.id===id)?.name||id)} · ${fmt(count)} quân</option>`).join('');
  const selectedTroop = state.army[Object.keys(state.army)[0]] || 0;
  const leadCapacity=marchTroopCapacity(state);
  const marchMaximum=Math.min(selectedTroop,leadCapacity);
  const bossLocked = selected.isBoss && !state.world.campaignComplete && (state.stats.victories < 20 || state.stats.citiesCaptured < 7);
  const activeMarch=state.queues.march;
  const activeMarchNode=activeMarch&&(WORLD_NODES.find(n=>n.id===activeMarch.nodeId)??getPveEncounter(activeMarch.nodeId));
  const activeMarchTroops=activeMarch?Object.entries(activeMarch.troops??{}).filter(([,count])=>count>0).map(([id,count])=>`${TROOPS.find(t=>t.id===id)?.name||id} × ${fmt(count)}`).join(' · '):'';
  const marchControls=activeMarch
    ?`<section class="recon-intel"><b>Quân ta tại ${esc(activeMarchNode?.name??activeMarch.nodeId)} · ${fmt(Object.values(activeMarch.troops??{}).reduce((sum,count)=>sum+count,0))} quân</b><span>${esc(activeMarchTroops||'Đội hình đang được quyết toán.')}</span><small>${activeMarch.combatMode==='manual'&&Date.now()>=activeMarch.finishAt?'Đã tới chiến trường · điều khiển từng hiệp ở bảng phía trên.':'Đang hành quân · không thể điều thêm quân cho tới khi trận quyết toán.'}</small></section>`
    :`<div class="field-row"><div class="field"><label for="march-unit">Đạo quân</label><select id="march-unit" class="input">${armyOptions || '<option>Chưa có quân</option>'}</select></div><div class="field"><label for="march-count">Số quân điều động · tối đa ${fmt(marchMaximum)}</label><input id="march-count" class="input" type="number" min="1" max="${marchMaximum}" value="${Math.min(18,marchMaximum)||1}" inputmode="numeric"></div></div><div class="tiny muted">Giới hạn lĩnh binh: ${fmt(leadCapacity)} · nền tảng SIMULATED × ${fmt(state.heroes.filter(hero=>hero.assigned).length)} thần tiên; Lĩnh binh thuật Mobile +2% mỗi cấp.</div><div class="field-row" style="margin-top:8px">${button('scout',scouted?'Trinh sát lại':'Trinh sát',state.resources.gold<scoutCost,'button ghost','data-node="'+selected.id+'"')}${button('march',selected.isBoss&&state.world.campaignComplete?'Tái chiến Triều Ca':'Hành quân',!armyCount(state)||!marchMaximum||Boolean(bossLocked),'button','data-node="'+selected.id+'"')}</div><div class="tiny muted" style="margin-top:7px">Trinh sát ${Math.round((scoutQuote?.chance||0)*100)}% · ${scoutQuote?.technologyId?TECHNOLOGIES.find(row=>row.id===scoutQuote.technologyId)?.name:''} · phí ${fmt(scoutCost)} vàng · nền tảng SIMULATED.${selected.isBoss&&bossLocked?` Tiến trình mở khóa: ${Math.min(20,state.stats.victories)} / 20 thắng · ${Math.min(7,state.stats.citiesCaptured)} / 7 thành.`:''} Thời gian ước tính ${formatDuration(Math.max(2000,(7+selected.chapter*1.7)*1000))}</div>`;
  const target = `<article class="target-card"><span class="target-kind">${selected.kind} · 第 ${selected.chapter} chương · cấp ${selected.level}</span><h2 class="target-name">${esc(selected.name)}</h2><p class="tiny muted">${selected.isBoss ? state.world.campaignComplete ? 'Trụ Vương đã bại trận. Triều Ca vẫn mở để tái chiến và chinh phục endgame.' : 'Đại Boss chiến dịch. Cần 20 trận thắng và 7 danh thành; thắng trận này sẽ mở kết cục Phong Thần.' : selected.mobileCityId?'Danh tính, tọa độ, phe và cấp tường lấy từ Mobile; quân số chiến trường là mô phỏng ngoại tuyến.':'Roster NPC theo snapshot legacy ở nơi có formation; dải thiếu đội cố định dùng adapter SIMULATED. Trận vẫn tiêu quân thật, có thương vong và chiến lợi phẩm.'}</p><div class="target-stats"><div class="target-stat"><small>Lực lượng đối thủ</small><b>${fmt(selected.power)}</b></div><div class="target-stat"><small>Chiến lợi phẩm ước tính</small><b>${costText(selected.loot)}</b></div></div>${cityReference}${legacyCityReference}${enemyIntel}${marchControls}</article>`;
  return `<div class="world-layout"><section class="panel">${subheading('Bản đồ Cửu Châu','73 danh thành Mobile · đội Tiên Sơn và endgame nối roster legacy')}<div class="panel-body"><div class="field-row" style="margin-bottom:10px"><div class="field"><label for="world-chapter">Khu vực thiên hạ</label><select id="world-chapter" class="input" data-change="chapter">${Array.from({length:8},(_,i)=>`<option value="${i+1}" ${chapter===i+1?'selected':''} ${i+1>unlocked?'disabled':''}>Chương ${i+1} · ${['Tây Kỳ','Thanh Khâu','Vân Mộng','Cửu Lê','Lạc Thủy','Bắc Minh','Phong Lăng','Quy Khư'][i]}${i+1>unlocked?' · chưa mở':''}</option>`).join('')}</select></div><div class="field"><label>Tiến trình chính tuyến</label><div class="input">Chặng ${fmt(state.world.storyStage)} · ${state.world.captures.length} danh thành · mở tới chương ${unlocked}</div></div></div><div class="world-map"><div class="map-river"></div><div class="map-mountain"></div><div class="map-mountain m2"></div><span class="map-label" style="left:43%;top:44%">九州山河圖</span><span class="map-label" style="left:8%;top:83%">長河</span>${pins}</div><div class="tiny muted" style="margin-top:8px">Thắng một trận dã địa hoặc Tiên Sơn trong chương hiện tại để mở chương kế tiếp. Danh thành giúp đạt điều kiện Boss; các chương chưa mở không thể trinh sát hoặc hành quân tới.</div></div></section><aside class="map-side">${target}${queuePanel(state,Date.now())}<section class="panel">${subheading('Ngoại giao và liên minh NPC')}<div class="panel-body"><div class="hint">V1.0 ưu tiên chơi đơn ngoại tuyến. Thương nhân, bang hội và đối thủ là NPC mô phỏng; không có người chơi trực tiếp hoặc dịch vụ nhiều người.</div><div class="field-row" style="margin-top:9px">${button('view-market','Giao thương NPC',false,'button small')}${button('view-quests','Chính tuyến',false,'button ghost small')}</div></div></section></aside></div>`;
}

function buzhouSourceReferencePanel(currentFloor) {
  const cards=LEGACY_BUZHOU_FLOORS.map(floor=>{
    const formations=LEGACY_BUZHOU_FORMATIONS.filter(row=>floor.formationRowIndexes.includes(row.sourceRowIndex));
    const rewards=LEGACY_BUZHOU_REWARDS.filter(row=>floor.rewardRowIndexes.includes(row.sourceRowIndex));
    const rules=LEGACY_BUZHOU_EQUIPMENT_RULES.filter(row=>floor.equipmentRuleRowIndexes.includes(row.sourceRowIndex));
    const levelRange=floor.generalMinLevel||floor.generalMaxLevel?`Cấp tướng ${fmt(floor.generalMinLevel)}–${fmt(floor.generalMaxLevel)} · ${fmt(floor.generalMinNum)}–${fmt(floor.generalMaxNum)} tướng · thống lĩnh ${fmt(floor.generalLeadPopulation)} quân`:'Danh sách đội hình cố định; bảng không ghi cấp tướng hoặc số tướng tổng.';
    const roster=formations.length
      ?`<ul class="buzhou-source-roster">${formations.map(row=>{const troop=TROOPS.find(unit=>String(unit.mobileSourceId||'')===String(row.LeadSoldierID));return `<li><b>${esc(row.GeneralName)}</b> · ${esc(troop?.name||`Binh chủng ID ${row.LeadSoldierID}`)} × ${fmt(row.LeadSoldierNum)}</li>`;}).join('')}</ul>`
      :'<p class="tiny muted">Nguồn chỉ công bố khoảng cấp, số tướng và mức thống lĩnh; không có danh sách tên cố định cho tầng này.</p>';
    const rewardIds=rewards.map(row=>row.goodsId).join(' · ');
    const equipmentText=rules.map(row=>{
      const rolls=Array.from({length:10},(_,i)=>row[`RdmInfo${i+1}`]).filter(Boolean).join(' · ');
      return `class ${row.CfgClass} · ${row.OpenMinNum}–${row.OpenMaxNum} món · base ${row.RandBaseNum} · ${esc(rolls||'UNKNOWN')}`;
    }).join('<br>');
    const active=floor.floorId===currentFloor?' · cửa kế tiếp':'';
    return `<details class="source-provenance buzhou-source-floor" ${floor.floorId===currentFloor?'open':''}><summary>Tầng ${floor.floorId} · ${formations.length?`${formations.length} danh tướng cố định`:'đội hình theo khoảng nguồn'}${active}</summary><div><p>${esc(levelRange)}</p><small>Tên tầng gốc: ${esc(floor.name)} · mô tả: ${esc(floor.description)} · ${floor.isFight?'IsFight=1':'IsFight=0'} · VERIFIED_LEGACY</small>${roster}<small>Goods ID nguồn: ${esc(rewardIds||'UNKNOWN')} · cấu hình trang bị: ${rules.length} dòng, quy tắc RdmInfo chưa giải nghĩa và chưa áp dụng.</small><details class="source-provenance buzhou-raw-rules"><summary>Quy tắc trang bị nguyên trạng</summary><small>${equipmentText||'Không có hàng nguồn.'}</small></details></div></details>`;
  }).join('');
  return `<section class="panel"><div class="panel-title">Bất Chu Sơn · cấu hình NPC legacy <small>${LEGACY_BUZHOU_SOURCE.floorCount} tầng · ${LEGACY_BUZHOU_SOURCE.formationCount} đội hình cố định ở tầng ${LEGACY_BUZHOU_SOURCE.formationFloorIds.join(', ')} · snapshot ${esc(LEGACY_BUZHOU_SOURCE.sourceCommit.slice(0,10))}</small></div><div class="panel-body"><div class="hint">Roster cố định được dùng trong combat nơi nguồn cung cấp; tầng chỉ có dải cấp/quân dùng đội hình SIMULATED theo dải. Các dòng trang bị và Goods ID bên dưới là tham chiếu. Phần thưởng đang theo adapter runtime; quy tắc RdmInfo chưa được xem là xác suất đã xác minh.</div>${cards}</div></section>`;
}

function elflandSourceReferencePanel(uiState={}) {
  const locations=[...LEGACY_ELFLAND_LOCATIONS].sort((a,b)=>Number(a.ElflandID)-Number(b.ElflandID));
  const requestedId=Number(uiState.elflandSourceID);
  const location=locations.find(row=>Number(row.ElflandID)===requestedId)||locations[0];
  const floorRows=(location?.floorRowIndexes||[]).map(index=>LEGACY_ELFLAND_FLOORS[index-1]).filter(Boolean);
  const floorCards=floorRows.map(floor=>{
    const roster=(floor.formationRowIndexes||[]).map(index=>LEGACY_ELFLAND_FORMATIONS[index-1]).filter(Boolean);
    const bounds=`${fmt(floor.GeneralMinLevel)}–${fmt(floor.GeneralMaxLevel)} cấp · thống lĩnh ${fmt(floor.GeneralLeadPopulation)} · ${fmt(floor.GeneralMinNum)}–${fmt(floor.GeneralMaxNum)} tướng`;
    const rosterMarkup=roster.length
      ?`<ul class="buzhou-source-roster">${roster.map(row=>`<li><b>${esc(row.GeneralName)}</b> · ID binh chủng legacy ${esc(row.LeadSoldierID)} × ${fmt(row.LeadSoldierNum)}</li>`).join('')}</ul>`
      :'<p class="tiny muted">Không có hàng đội hình cố định; dùng khoảng tướng trong cấu hình tầng.</p>';
    return `<details class="source-provenance elfland-source-floor"><summary>Tầng ${fmt(floor.FloorID)} · ${roster.length?`${fmt(roster.length)} đội NPC cố định`:'đội NPC theo khoảng'} · ${esc(bounds)}</summary><div><small>${esc(floor.FloorName||'')} · ${floor.IsFight?'IsFight=1':'IsFight=0'} · source row ${floor.sourceRowIndex}</small>${floor.FloorDescribe?`<p>${esc(floor.FloorDescribe)}</p>`:''}${rosterMarkup}</div></details>`;
  }).join('');
  const optionRows=locations.map(row=>`<option value="${row.ElflandID}" ${Number(row.ElflandID)===Number(location?.ElflandID)?'selected':''}>${row.ElflandID} · ${esc(row.ElflandName)} · ${fmt(row.FloorNum)} tầng</option>`).join('');
  const summary=`${fmt(LEGACY_ELFLAND_SOURCE.locationCount)} địa điểm · ${fmt(LEGACY_ELFLAND_SOURCE.floorCount)} tầng · ${fmt(LEGACY_ELFLAND_SOURCE.formationCount)} đội NPC · ${fmt(LEGACY_ELFLAND_SOURCE.rewardRuleCount)} dòng cấu hình loot`;
  return `<section class="panel"><div class="panel-title">Tiên Sơn · dữ liệu NPC legacy <small>${summary} · snapshot ${esc(LEGACY_ELFLAND_SOURCE.sourceCommit.slice(0,10))}</small></div><div class="panel-body"><div class="hint">Tên, tầng và roster giữ provenance VERIFIED_LEGACY. Roster cố định và dải nguồn đã nối vào combat; dải thiếu formation dùng đội SIMULATED. 1.093 loot rules đi qua interval adapter SIMULATED, không khẳng định xác suất Mobile/legacy.</div><div class="field" style="max-width:620px;margin:10px 0"><label for="elfland-source-select">Tra cứu địa điểm nguồn</label><select id="elfland-source-select" class="input" data-change="elflandSource">${optionRows}</select></div><p><b>${esc(location?.ElflandName||'')}</b> · ID ${esc(location?.ElflandID)} · cấp nguồn ${fmt(location?.ElflandLevel)} · ${fmt(location?.FloorNum)} tầng</p><p class="tiny muted">${esc(location?.ElflandDescribe||'')}. Vị trí nguồn ${esc(location?.PosX)}, ${esc(location?.PosY)} · loại ${esc(location?.ElflandType||'UNKNOWN')} · ${floorRows.length} hàng tầng liên kết.</p><details class="source-provenance"><summary>So sánh snapshot Tiên Sơn</summary><small>Danh điểm: cùng 624 ID và tên/mô tả/tọa độ không đổi; 94 cấp và 93 số tầng khác nhau. Tầng: 8.992 so với 8.248; 744 chỉ có ở snapshot chính, 665 tên và 188 mô tả tầng khác. Đội NPC: ${fmt(LEGACY_ELFLAND_SOURCE.versionComparison.formations.exactSharedRows)} hàng trùng toàn bộ, ${fmt(LEGACY_ELFLAND_SOURCE.versionComparison.formations.primaryOnlyRows)} chỉ ở snapshot chính, ${fmt(LEGACY_ELFLAND_SOURCE.versionComparison.formations.comparisonOnlyRows)} chỉ ở snapshot _45. Không trộn phiên bản hoặc suy diễn parity.</small></details>${floorCards}</div></section>`;
}

function pveMarchPanel(state, uiState) {
  const locations = LEGACY_ELFLAND_LOCATIONS;
  const selected = locations.find(row => row.ElflandID === uiState.elflandSourceID) || locations[0];
  const locationsHtml = locations.map(row =>
    `<option value="${row.ElflandID}" ${row === selected ? 'selected' : ''}>${esc(row.ElflandName)} · cấp ${row.ElflandLevel}</option>`
  ).join('');
  const army = TROOPS.filter(row => state.army[row.id] > 0);
  const troopOptions = army.map(row => `<option value="${row.id}">${esc(row.name)} · ${fmt(state.army[row.id])}</option>`).join('');
  const limit = marchTroopCapacity(state);
  const chapter = unlockedChapter(state);
  const cards = nodes => nodes.map(node => {
    const lock = pveLock(state, node, chapter);
    const units = node.enemy.formation.reduce((sum, row) => sum + row.count, 0);
    const assault=pveAssaultProgress(state,node,limit),assaultText=assault?`<small>Đội hình nguồn ${fmt(assault.total)} · đã phá ${fmt(assault.cleared)} · còn ${fmt(assault.remaining)} · khoảng ${fmt(assault.sortiesRemaining)} đợt theo quân hiện có · adapter SIMULATED</small>`:'';
    return `<article class="inventory-item"><b>${esc(node.name)}</b><small>Cấp ${node.level} · ${fmt(units)} quân</small>${assaultText}
      ${button('pveMarch', lock || 'Hành quân', !!lock || !army.length || !!state.queues.march, 'button small', `data-node="${esc(node.id)}"`)}</article>`;
  }).join('');
  return panel('Chinh phạt', `<div class="field-row"><label for="elfland-source-select">Tiên Sơn</label>
    <select id="elfland-source-select" class="input" data-change="elflandSource">${locationsHtml}</select></div>
    <div class="field-row"><label for="pve-unit">Binh chủng</label><select class="input" id="pve-unit">${troopOptions}</select>
      <label for="pve-count">Quân số</label><input class="input" id="pve-count" type="number" min="1" max="${limit}"
        value="${Math.min(limit, state.army[army[0]?.id] || 1)}"><label for="combat-mode">Điều khiển trận</label><select class="input" id="combat-mode"><option value="auto" ${uiState.combatMode==='manual'?'':'selected'}>Tự động</option><option value="manual" ${uiState.combatMode==='manual'?'selected':''}>Từng hiệp</option></select></div>
    <div class="inventory-grid">${cards(getMountainBattles(selected.ElflandID))}</div>
    <details><summary>Thành trì NPC và các khu Boss</summary><div class="inventory-grid">${cards(getEndgameBattles())}</div></details>`);
}

function pveScreen(state, _now, uiState={}) {
  const tower=state.world.towerFloor,bz=state.world.buzhouFloor;
  const endingPanel=state.world.campaignComplete
    ? `<section class="panel ending-banner"><span class="eyebrow">ĐẠI KẾT CỤC · HỒI THỨ TÁM</span><h2>Thiên hạ quy Chu</h2><p>Trụ Vương bại trận, Phong Thần nghiệp định. Tiếp tục leo Phong Thần Tháp, vượt Bất Chu Sơn, chinh phục 624 Tiên Sơn và phát triển thành trì.</p></section>`
    : `<section class="panel ending-progress"><span class="eyebrow">CHÍNH TUYẾN · ĐẠI BOSS TRIỀU CA</span><p>Điều kiện mở: ${Math.min(20,state.stats.victories)} / 20 trận thắng · ${Math.min(7,state.stats.citiesCaptured)} / 7 danh thành.</p><small>Boss cuối được mô phỏng; thắng sẽ mở kết cục và thưởng chiến dịch một lần.</small></section>`;
  const daily = worldOffer(state, _now, 'daily');
  const field = worldOffer(state, _now, 'field');
  const activities = panel('Việc trong ngày', `<div class="field-row">
    ${button('dailyReward', daily.available ? daily.name : 'Đã nhận lương bổng', !daily.available, 'button small')}
    ${button('fieldEvent', !field.available ? 'Đã tuần tra hôm nay' : field.name,
      !field.available || state.world.storyStage < 3 || !isAffordable(state, field.cost), 'button small')}
    <small>${state.world.storyStage < 3 ? 'Thắng trận chính tuyến để mở tuần tra' : 'Tuần tra cần ' + fmt(field.cost.food) + ' lương'}</small></div>`);
  return `${endingPanel}${activities}<div class="activity-grid"><article class="activity-card"><div class="activity-crest">封</div><div class="eyebrow">THỬ THÁCH TẦNG</div><h3>Phong Thần Tháp</h3><p>Leo liên tầng, đối thủ tăng sức mạnh theo độ sâu. Giới hạn 9.999 tầng hiện là SIMULATED; chưa tìm thấy bảng nguồn khớp an toàn.</p><div class="overview-card"><span class="label">Thành tích hiện tại</span><strong>${fmt(tower)} / ${fmt(TOWER_FLOORS)}</strong><small>Đội hình: ${state.heroes.filter(h=>h.assigned).length} thần tiên</small></div><div style="margin-top:10px">${button('duel','Khiêu chiến tầng '+(tower+1),!state.heroes.some(h=>h.assigned),'button block','data-mode="tower"')}</div></article><article class="activity-card"><div class="activity-crest">山</div><div class="eyebrow">NGŨ QUAN BẤT CHU</div><h3>Bất Chu Sơn</h3><p>Năm cửa giữ nguyên quân số nguồn. Cửa bốn và năm được đánh theo nhiều đợt; thắng trọn đội hình mới nhận thưởng và mở cửa kế tiếp.</p><div class="overview-card"><div class="label">Cửa ải đã qua</div><strong>${bz} / ${BUZHOU_FLOORS}</strong><small>Chiến thắng bằng quân đội, có thương vong</small></div><div style="margin-top:10px">${button('pveMarch','Điều quân tới cửa '+(bz+1),bz>=BUZHOU_FLOORS||!Object.values(state.army).some(n=>n>0),'button block','data-node="buzhou:'+ (bz+1) +'"')}</div></article><article class="activity-card"><div class="activity-crest">日</div><div class="eyebrow">ENDGAME NPC</div><h3>Thử thách thiên hạ</h3><p>Tiếp tục tu luyện, giao thương và thảo phạt sau khi chiến dịch kết thúc.</p><div class="overview-card"><span class="label">Chiến báo PvE</span><strong>${fmt(state.stats.victories)} thắng</strong><small>${fmt(state.stats.duels)} lần đấu pháp</small></div><div style="margin-top:10px">${button('view-world','Tiếp tục hành trình',false,'button block')}</div></article></div><div class="divider"></div>${pveMarchPanel(state, uiState)}<div class="divider"></div>${panel('Đội hình thần tiên',`<div class="formation-row">${state.heroes.filter(h=>h.assigned).slice(0,3).map(h=>`<div class="formation-slot"><b>${esc(HEROES.find(x=>x.id===h.id)?.name||h.id)}</b><small>Cấp ${h.level} · ${fmt(heroPower(h,state))} lực chiến</small></div>`).join('')||'<div class="empty-state">Chưa có đội hình.</div>'}</div>`)}<div class="divider"></div>${panel('Tiến trình PvE',`<div class="city-overview"><div class="overview-card"><span class="label">Danh thành chiếm được</span><strong>${state.stats.citiesCaptured}</strong><small>Trong ${WORLD_NODES.filter(n=>n.kind==='Danh thành').length} địa điểm mô phỏng</small></div><div class="overview-card"><span class="label">Trận thắng</span><strong>${state.stats.victories}</strong><small>NPC và chiến dịch</small></div><div class="overview-card"><span class="label">Cửa Bất Chu</span><strong>${bz}</strong><small>Thủ lĩnh NPC</small></div></div>`)}`;
}

function techScreen(state) {
  const cards = TECHNOLOGIES.map(t=>{
    const level = state.technologies[t.id]||0;
    const quote = quoteResearch(state,t.id);
    const effectText = ({food:'Tăng sản lượng lương thực',timber:'Tăng sản lượng gỗ',stone:'Tăng sản lượng đá',iron:'Tăng sản lượng sắt',gold:'Tăng thu đồng',population:'Tăng tốc tăng dân số',build:'Rút ngắn thời gian xây dựng',training:'Tăng tốc huấn luyện',attack:'Tăng sức mạnh quân đội',defense:'Giảm sát thương quân đội nhận',cavalry:'Tăng sức mạnh kỵ binh',archer:'Tăng sức mạnh xạ thủ',healing:'Giảm chi phí hồi thương binh',formation:'Tăng hiệu lực tương khắc',march:'Tăng tốc hành quân',hero:'Tăng lực chiến thần tiên',scout:'Giảm phí trinh sát',diplomacy:'Giảm phí và tăng tỷ lệ ngoại giao'}[t.effect]||t.name);
    const rateText=({gold:'· +1,2% mỗi cấp',population:'· +1,2% mỗi cấp',build:'· tăng 2,5% tốc độ mỗi cấp',training:'· tăng 2% tốc độ mỗi cấp',defense:'· giảm 0,4% sát thương mỗi cấp',cavalry:'· +1,2% sức mạnh mỗi cấp',archer:'· +1,2% sức mạnh mỗi cấp',healing:'· giảm 0,6% chi phí mỗi cấp',formation:'· +0,3% cơ bản và theo tương khắc mỗi cấp',march:'· tăng 4% tốc độ mỗi cấp',hero:'· +1,2% lực chiến mỗi cấp',scout:'· giảm 1,2% phí mỗi cấp',diplomacy:'· -0,1% phí giao thương; +0,8% ngoại giao mỗi cấp'}[t.effect]||'· +1,2% mỗi cấp');
    const nextRow=t.mobileLevelCosts?.find(row=>Number(row.level)===quote.level);
    const sourceEffect=nextRow?.effect;
    const runtimeStatus=t.runtimeEffectStatus==='UNKNOWN'?'UNKNOWN · chưa có hệ thống pháp lực':t.runtimeEffectStatus==='PARTIAL_SIMULATED_BASE'?'PARTIAL · hệ số nguồn trên nền tảng SIMULATED':'Đã nối dữ kiện nguồn';
    const art=t.mobileImage?`<img class="tech-source-art" src="${esc(assetUrl(t.mobileImage))}" alt="" loading="lazy" decoding="async">`:'';
    const requirement=quote.requirementText?`<small>Điều kiện Mobile: ${esc(quote.requirementText)} · ${quote.requirementStatus==='SATISFIED'?'đạt':quote.requirementStatus==='LOCKED'?'chưa đạt':`một phần UNKNOWN (${esc(quote.unknownRequirements.join(', '))})`}</small>`:'';
    return `<article class="tech-card"><div class="tech-card-top">${art}<h3>${esc(t.name)}</h3><span class="tag ${t.mobileSourceId?'':'simulated'}">Cấp ${level} / 30</span></div><p class="tiny muted">${t.mobileSourceId?`${esc(t.name)} · Mobile ${esc(sourceEffect||'UNKNOWN')}`:`${effectText} ${rateText} · SIMULATED`}</p><small class="tiny muted">Hiệu ứng runtime: ${esc(runtimeStatus)}${t.runtimeEffectStatus==='UNKNOWN'&&t.mobileDescription?` · ${esc(t.mobileDescription)}`:''}</small><div class="level-dots">${Array.from({length:10},(_,i)=>`<i class="${level>i*3?'on':''}"></i>`).join('')}</div>${requirement}<div class="tech-card-top"><span class="progress-note">Bậc tiếp theo: ${quote.maxed?'tối đa':`C.${quote.level} · ${costText(quote.cost)}`}${t.mobileSourceId?' · chi phí Mobile VERIFIED':''}</span>${button('research','Nghiên cứu',!!state.queues.research||quote.maxed||quote.requirementStatus==='LOCKED'||!isAffordable(state,quote.cost),'button small','data-tech="'+t.id+'"')}</div></article>`;
  }).join('');
  const sourcedCount=TECHNOLOGIES.filter(row=>row.mobileSourceId).length;
  const archivedRows=Object.values(state.legacyResearchArchive||{}).filter(row=>row&&Number(row.level)>0);
  const archivedLevels=archivedRows.reduce((sum,row)=>sum+Number(row.level||0),0);
  const archivePanel=archivedRows.length?`<section class="panel"><div class="panel-title">Khoa kỹ cũ đã lưu</div><div class="panel-body"><div class="hint">${fmt(archivedLevels)} cấp từ ${archivedRows.length} nhánh cũ được giữ trong save để tra cứu; chúng không cộng chỉ số vì chưa có ánh xạ Mobile tương đương.</div><div class="tiny muted" style="margin-top:7px">${archivedRows.map(row=>`${esc(row.previousName||'UNKNOWN')} · cấp ${fmt(row.level)}`).join(' · ')}</div></div></section><div class="divider"></div>`:'';
  return `<div class="hint" style="margin-bottom:10px">${sourcedCount}/19 ngành có tên, 30 bậc chi phí và hiệu ứng lấy từ Mobile; thẻ phân biệt công thức runtime đã nối, phần còn mô phỏng và UNKNOWN. Điều kiện có tên khớp công trình được kiểm tra trước khi nghiên cứu.</div><div class="city-overview"><div class="overview-card"><span class="label">Thái Học Viện</span><strong>Cấp ${state.levels.academy||0}</strong><small>Một hàng nghiên cứu</small></div><div class="overview-card"><span class="label">Ngành đã khai mở</span><strong>${Object.values(state.technologies).filter(x=>x>0).length} / 19</strong><small>${sourcedCount} nhánh có bảng Mobile</small></div><div class="overview-card"><span class="label">Tổng cấp</span><strong>${fmt(Object.values(state.technologies).reduce((a,n)=>a+n,0))}</strong><small>${fmt(TECHNOLOGIES.reduce((sum,row)=>sum+row.maxLevel,0))} cấp tối đa · nguồn theo nhánh</small></div></div>${archivePanel}<div class="tech-grid">${cards}</div><div class="divider"></div>${queuePanel(state,Date.now())}`;
}

function questScreen(state, _now, uiState={}) {
  const pageSize=24,pageCount=Math.max(1,Math.ceil(QUESTS.length/pageSize));
  const page=Math.min(pageCount-1,Math.max(0,Number(uiState.questPage)||0));
  const visibleQuests=QUESTS.slice(page*pageSize,(page+1)*pageSize);
  const list = visibleQuests.map(q=>{
    const progress=questProgress(state,q), done=progress>=q.goal, claimed=state.claims.includes(q.id), locked=q.chapter>unlockedChapter(state), active=activeQuest(state)?.id===q.id;
    return `<article class="quest-card ${active?'quest-active':''}"><div class="quest-mark">${q.chapter}</div><div><div class="quest-title">${esc(q.title)}</div><div class="quest-desc">Chương ${q.chapter} · ${locked?'Cần mở chương · ':''}${esc(q.type==='chapterField'?'Thắng cửa ải tại chương này':q.type==='win'?'Thắng trận PvE':q.type==='capture'?'Chiếm danh thành':q.type==='tower'?'Vượt Phong Thần Tháp':q.type==='buzhou'?'Qua cửa Bất Chu':q.type==='guild'?'Kết minh cùng NPC':q.type==='upgrade'?'Nâng cấp công trình':q.type==='train'?'Huấn luyện quân đội':q.type==='recruit'?'Chiêu mộ thần tiên':q.type==='equip'?'Trang bị vật phẩm':'Tăng sức mạnh đội hình')}</div><div class="quest-progress-track"><span style="width:${Math.min(100,progress/q.goal*100)}%"></span></div><div class="quest-desc">${fmt(progress)} / ${fmt(q.goal)}</div></div><div class="quest-reward">Thưởng<br>${costText(q.reward)}<br>${q.reward.xp} kinh nghiệm</div>${claimed?'<span class="tag">Đã nhận</span>':button('claimQuest',locked?'Chưa mở':done?'Nhận thưởng':'Chưa xong',locked||!done,'button small','data-quest="'+q.id+'"')}</article>`;
  }).join('');
  return `<section class="panel">${subheading(`Sổ nhiệm vụ · ${state.claims.length} / ${QUESTS.length} đã nhận`,`${QUESTS.length} mục tiêu · chương ${visibleQuests[0]?.chapter||1} · trang ${page+1}/${pageCount}`)}<div class="panel-body"><div class="hint" style="margin-bottom:10px">Chính tuyến có tám cửa ải mở theo tiến trình chiến dịch; nhiệm vụ chương chưa mở sẽ không thể nhận thưởng. Nhiệm vụ phụ liên kết kinh tế, chiêu mộ, huấn luyện, hành quân và thử thách. Nội dung hiện là SIMULATED.</div>${pageNavigation(page,QUESTS.length,pageSize,'questPage','nhiệm vụ')}<div class="quest-list">${list}</div>${pageNavigation(page,QUESTS.length,pageSize,'questPage','nhiệm vụ')}</div></section>`;
}

const SOURCE_CATEGORY_LABELS=Object.freeze({
  'than-tien':'Thần tiên','phap-bao':'Pháp bảo','vat-pham':'Vật phẩm','binh-chung':'Binh chủng',
  'cong-trinh':'Công trình','khoa-ky':'Khoa kỹ','danh-thanh':'Danh thành','legacy-quest':'Nhiệm vụ legacy','legacy-city-garrison':'NPC danh thành legacy'
});

function sourceLibraryScreen(_state,_now,uiState={}) {
  const category=Object.hasOwn(SOURCE_CATEGORY_LABELS,uiState.sourceCategory)?uiState.sourceCategory:'than-tien';
  const query=String(uiState.sourceQuery||'').trim().toLocaleLowerCase('vi');
  const legacyQuestCategory=category==='legacy-quest';
  const legacyCityCategory=category==='legacy-city-garrison';
  const legacyCategory=legacyQuestCategory||legacyCityCategory;
  const cityRecords=legacyCityCategory?LEGACY_CITY_GARRISONS.flatMap(city=>city.guards.map(guard=>({
    ...guard,sourceId:String(guard.sourceRowIndex),name:guard.generalName,
    description:`${city.mobileCityName||'Legacy-only city'} · tọa độ ${city.coordinateKey} · ${guard.leadSoldierName} · ${fmt(guard.leadSoldierCount)} quân`,
    tags:[city.mobileCityId?'Khớp tọa độ Mobile':'Legacy-only','NPC danh thành',`ID binh chủng ${guard.leadSoldierId}`],
    details:[{k:'cs',t:'Đội hình legacy',ds:[['Tọa độ',city.coordinateKey],['Danh thành Mobile',city.mobileCityName||'Legacy-only'],['ID binh chủng',guard.leadSoldierId],['Binh chủng',guard.leadSoldierName],['Quân số snapshot',guard.leadSoldierCount]]}]
  }))):[];
  const records=legacyQuestCategory?LEGACY_QUESTS.map(record=>({
    ...record,name:record.title,description:record.content,tags:[`Mã type ${record.typeCode}`],details:[]
  })):legacyCityCategory?cityRecords:(MOBILE_SOURCE_DATABASE.categories[category]||[]);
  const searchable=record=>[record.id,record.sourceId,record.name,record.description,record.brief,record.target,record.typeCode,record.tags,record.filters,record.details]
    .map(value=>typeof value==='string'?value:JSON.stringify(value||''))
    .join(' ').toLocaleLowerCase('vi').includes(query);
  const matched=records.filter(searchable);
  const pageSize=24,pageCount=Math.max(1,Math.ceil(matched.length/pageSize));
  const page=Math.min(pageCount-1,Math.max(0,Number(uiState.sourcePage)||0));
  const metadata=legacyQuestCategory?LEGACY_QUEST_SOURCE:legacyCityCategory?LEGACY_CITY_GARRISON_SOURCE:MOBILE_SOURCE_DATABASE.source.categorySources[category];
  const cards=matched.slice(page*pageSize,(page+1)*pageSize).map(record=>{
    const stats=record.details.filter(block=>block.k==='cs'&&Array.isArray(block.ds)).slice(0,2).map(block=>
      `<div class="source-fact-group"><b>${esc(block.t||'Thông tin')}</b><div>${block.ds.slice(0,8).map(([key,value])=>`<span>${esc(key)} · ${esc(value)}</span>`).join('')}</div></div>`).join('');
    const table=record.details.find(block=>block.k==='bang'&&Array.isArray(block.dong));
    const tablePreview=table?`<details class="source-data-table"><summary>${esc(table.t||'Bảng nguồn')} · ${fmt(table.dong.length)} hàng</summary><div class="table-scroll"><table class="data-table"><thead><tr>${(table.cot||[]).map(cell=>`<th>${esc(cell)}</th>`).join('')}</tr></thead><tbody>${table.dong.slice(0,8).map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`:'';
    const fieldMap=Object.entries(record.fieldProvenance||{}).map(([field,path])=>{
      if(!legacyCategory)return `${field}: ${path}`;
      if(legacyQuestCategory){
        const source=LEGACY_QUEST_SOURCE.fieldSources[field];
        return `${field}: ${path.sourceRecordId}.${path.sourceField} · data ${source.dataHash} · schema ${source.schemaHash}`;
      }
      return `${field}: ${path.sourceTable}#${path.sourceRowIndex}.${path.sourceField} · data ${path.dataHash} · schema ${path.schemaHash} · index ${path.indexHash}`;
    }).join(' · ');
    const image=record.localImage?`<img src="${esc(assetUrl(record.localImage))}" alt="" loading="lazy" decoding="async">`:'<span class="source-art-fallback">典</span>';
    const legacyConditions=legacyQuestCategory&&record.conditions?.length?`<details class="source-data-table"><summary>Điều kiện nguồn · ${fmt(record.conditions.length)} dòng · UNKNOWN</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>ID nguồn</th><th>Type</th><th>Tiêu đề</th><th>data0–data9 · nguyên trạng</th></tr></thead><tbody>${record.conditions.map(condition=>`<tr><td>${esc(condition.sourceId)}</td><td>${esc(condition.typeCode)}</td><td>${esc(condition.title||'—')}</td><td>${condition.data.map((value,index)=>`${esc(LEGACY_QUEST_SOURCE.conditionDataFields[index])}=${esc(value)}`).join(' · ')}</td></tr>`).join('')}</tbody></table></div><small>Provenance từng trường: questcondition ID nguồn và các cột ${esc(LEGACY_QUEST_SOURCE.conditionImportedFields.join(', '))}. Ý nghĩa mã type/data UNKNOWN; các bảng nhập không có trường phần thưởng.</small></details>`:'';
    const legacyText=legacyQuestCategory?`<p class="source-description"><b>Hướng dẫn tóm tắt:</b> ${esc(record.brief||'—')}</p><div class="source-fact-group"><b>Mục tiêu trong nguồn</b><div><span>${esc(record.target||'—')}</span><span>Mã loại ${esc(record.typeCode)} · điều kiện source ${fmt(record.conditions?.length||0)} dòng · điều kiện UNKNOWN; phần thưởng không có trường nguồn</span></div></div>`:'';
    const sourceVersion=legacyQuestCategory?LEGACY_QUEST_SOURCE.sourceVersion:legacyCityCategory?LEGACY_CITY_GARRISON_SOURCE.sourceVersion:MOBILE_SOURCE_DATABASE.source.version;
    const dataHash=legacyQuestCategory?LEGACY_QUEST_SOURCE.fieldSources.title.dataHash:legacyCityCategory?LEGACY_CITY_GARRISON_SOURCE.sourceTables.cities.fieldSources.GeneralName.dataHash:metadata.dataHash;
    return `<article class="source-entry"><div class="source-entry-head"><div class="source-art">${image}</div><div><span class="eyebrow">${esc(SOURCE_CATEGORY_LABELS[category])} · ID ${esc(record.sourceId??record.id)}</span><h3>${esc(record.name)}</h3><div class="source-tags">${(record.tags||[]).slice(0,4).map(tag=>`<span>${esc(tag)}</span>`).join('')}</div></div><span class="tag">${legacyCategory?'VERIFIED_LEGACY':'VERIFIED_MOBILE'}</span></div>${record.description?`<p class="source-description">${esc(record.description)}</p>`:''}${legacyText}${legacyConditions}${stats}${tablePreview}<details class="source-provenance"><summary>Provenance theo trường</summary><p>${esc(fieldMap)}</p><small>Snapshot ${esc(sourceVersion)} · SHA-1 dữ liệu ${esc(dataHash)} · commit ${esc(legacyQuestCategory?LEGACY_QUEST_SOURCE.sourceCommit:legacyCityCategory?LEGACY_CITY_GARRISON_SOURCE.sourceCommit:'Mobile '+MOBILE_SOURCE_DATABASE.source.permission.evidenceDate)} · quyền runtime: chủ dự án xác nhận, không yêu cầu SPDX.</small></details></article>`;
  }).join('')||'<div class="empty-state"><strong>Không có kết quả</strong>Đổi từ khóa hoặc chọn danh mục khác.</div>';
  const options=Object.entries(SOURCE_CATEGORY_LABELS).map(([id,label])=>{
    const count=id==='legacy-quest'?LEGACY_QUEST_SOURCE.recordCount:id==='legacy-city-garrison'?LEGACY_CITY_GARRISON_SOURCE.legacyGuardRecordCount:MOBILE_SOURCE_DATABASE.source.categoryCounts[id];
    return `<option value="${id}" ${id===category?'selected':''}>${label} · ${fmt(count)}</option>`;
  }).join('');
  const heading=legacyQuestCategory?'Nhiệm vụ nguồn legacy':legacyCityCategory?'NPC danh thành legacy':'Thư tịch dữ liệu Mobile';
  const hint=legacyQuestCategory
    ?`Snapshot ${LEGACY_QUEST_SOURCE.sourceVersion} · ${fmt(matched.length)} kết quả trong ${fmt(records.length)} nhiệm vụ, liên kết ${fmt(LEGACY_QUEST_SOURCE.conditionCount)} hàng questcondition. Văn bản/cột đã xác minh; mã type/data chưa giải nghĩa và bảng không có trường phần thưởng. Thư viện này không chi phối tiến trình hiện tại.`
    :legacyCityCategory?`Snapshot ${LEGACY_CITY_GARRISON_SOURCE.sourceVersion} · ${fmt(matched.length)} kết quả trong ${fmt(records.length)} đội NPC, ${fmt(LEGACY_CITY_GARRISON_SOURCE.coordinateMatchedMobileCities)} tọa độ khớp Mobile, ${fmt(LEGACY_CITY_GARRISON_SOURCE.legacyOnlyCityCount)} thành legacy-only. Đội hình và quân số chỉ tham khảo; không tác động combat hoặc phần thưởng.`
    :`Nguồn Mobile ${MOBILE_SOURCE_DATABASE.source.version} · ${fmt(matched.length)} kết quả trong ${fmt(records.length)} bản ghi · mô tả/chỉ số hiển thị theo nguồn; cơ chế runtime chỉ dùng trường có adapter.`;
  return `<section class="panel">${subheading(heading,legacyQuestCategory?'Nhiệm vụ legacy được tách phiên bản với tiến trình chơi hiện tại':legacyCityCategory?'NPC legacy được tách khỏi danh sách Mobile server-dependent':'7 danh mục Mobile · 2.656 hàng · đối chiếu theo snapshot, không trộn phiên bản')}<div class="panel-body"><div class="source-library-toolbar"><label class="field">Danh mục<select class="input" data-source-category>${options}</select></label><form data-form="source-search" class="field"><label for="source-query">Tìm theo tên, ID, thuộc tính</label><div class="field-row"><input id="source-query" class="input" type="search" name="query" value="${esc(uiState.sourceQuery||'')}" placeholder="Ví dụ: Na Tra, Cung Tiễn, Cấp tối đa"><button class="button small">Tìm</button></div></form></div><div class="hint">${hint}</div>${pageNavigation(page,matched.length,pageSize,'sourcePage','bản ghi nguồn')}<div class="source-entry-list">${cards}</div>${pageNavigation(page,matched.length,pageSize,'sourcePage','bản ghi nguồn')}</div></section>${elflandSourceReferencePanel(uiState)}${buzhouSourceReferencePanel(_state.world.buzhouFloor+1)}`;
}

function marketScreen(state,_now,uiState={}) {
  const opts=Object.entries(RESOURCE_INFO).map(([id,r])=>`<option value="${id}">${r.glyph} ${r.name} · có ${fmt(state.resources[id])}</option>`).join('');
  const policies=Object.entries(TAX_POLICIES).map(([id,policy])=>`<div class="setting-row"><span><b>${esc(policy.label)}</b><small class="muted">${fmt(policy.income*100)}% thuế cơ sở · dân tâm ${policy.moralePerHour>0?'+':''}${fmt(policy.moralePerHour)}/giờ</small></span>${button('setTaxPolicy',state.taxPolicy===id?'Đang áp dụng':'Chọn',state.taxPolicy===id,'button ghost small',`data-policy="${id}"`)}</div>`).join('');
  const heroLevel=Math.max(1,...state.heroes.map(hero=>hero.level));
  const allArtifactOffers=ITEMS.filter(item=>item.type==='pháp bảo'&&item.mobileSourceId&&!item.mobileOwner&&(item.mobileRequiredLevel||1)<=heroLevel&&!state.items.includes(item.id)&&!state.heroes.some(hero=>Object.values(hero.equipment||{}).includes(item.id)))
    .sort((a,b)=>(a.tier||1)-(b.tier||1)||(a.mobileRequiredLevel||1)-(b.mobileRequiredLevel||1)||String(a.mobileSourceId).localeCompare(String(b.mobileSourceId)));
  const artifactPage=Math.min(Math.max(0,Number(uiState.artifactPage)||0),Math.max(0,Math.ceil(allArtifactOffers.length/12)-1));
  const artifactOffers=allArtifactOffers.slice(artifactPage*12,(artifactPage+1)*12);
  const offers=artifactOffers.map(item=>{const quote=quoteArtifactPurchase(state,item.id);return `<article class="inventory-item">${itemArt(item)}<b>${esc(item.name)}</b><small>${esc(item.mobileQuality||'Pháp bảo')} · Mobile ${esc(item.mobileSourceId)} · yêu cầu cấp ${fmt(item.mobileRequiredLevel||1)}</small><small>${esc(item.mobileDescription||item.effect)} · giá NPC SIMULATED: ${costText(quote.cost)}</small>${button('buyArtifact','Thỉnh pháp bảo',!quote.available,'button small',`data-item="${esc(item.id)}"`)}</article>`;}).join('');
  return `<div class="world-layout"><section class="panel">${subheading('Thị trường Triều Ca','Giao thương với thương nhân NPC')}<div class="panel-body"><div class="city-hero" style="min-height:175px;background-position:center 60%"><div class="city-hero-content" style="min-height:175px"><span class="city-kicker">VẠN LÝ TRẠM · TÂY KỲ</span><h2 style="font-size:22px">Đường hàng mở lối</h2><p>Đổi tài nguyên theo giá trị tham chiếu. Phí thương mại giảm theo cấp Vạn Lý Trạm.</p></div></div><form data-form="trade" class="panel-body" style="padding-left:0;padding-right:0"><div class="field-row"><div class="field"><label for="trade-from">Giao hàng</label><select id="trade-from" class="input" name="from">${opts}</select></div><div class="field"><label for="trade-to">Nhận về</label><select id="trade-to" class="input" name="to">${opts}</select></div><div class="field"><label for="trade-amount">Số lượng</label><input class="input" type="number" name="amount" id="trade-amount" min="1" max="100000" value="100" inputmode="numeric"></div></div><button class="button" style="margin-top:10px">Xác nhận đổi hàng</button></form><div class="hint">Thị trường là kinh tế đơn người chơi; không kết nối hay giả lập người chơi thật. Tỷ giá và phí NPC được đánh dấu SIMULATED.</div></div></section><aside>${panel('Thuế và dân tâm',`<div class="overview-card"><span class="label">Dân tâm</span><strong>${Math.round(state.morale)}%</strong><small>${esc(TAX_POLICIES[state.taxPolicy].label)} · thu nhập đồng ${fmt(productionPerHour(state).gold)}/giờ</small></div>${policies}<p class="tiny muted">Thuế cao tăng nguồn thu nhưng làm dân tâm giảm dần; chính sách khoan giảm phục hồi dân tâm và giảm thuế.</p>`)}${panel('Thẻ quà nhiệm vụ',`<div class="overview-card"><span class="label">Số dư mô phỏng</span><strong>${fmt(state.gameplay.questVouchers||0)}</strong><small>1.000 thẻ đổi 1 linh ngọc</small></div>${button('redeemQuestVouchers','Đổi 1.000 thẻ',Number(state.gameplay.questVouchers||0)<1000,'button ghost small','data-count="1"')}<p class="tiny muted">Tỷ lệ đổi là SIMULATED; thẻ giữ qua save và migration.</p>`)}${queuePanel(state,Date.now())}</aside></div><section class="panel" style="margin-top:12px">${subheading('Thương hội pháp bảo','151 pháp bảo Mobile · giá NPC và điều kiện mua là SIMULATED')}<div class="panel-body"><div class="hint">Pháp bảo giữ ID, mô tả, phẩm chất và provenance Mobile. Giá mua là chuyển đổi nội bộ của game; vật phẩm có chủ chuyên thuộc chỉ mở khi bạn chiêu mộ đúng thần tiên. Các món đủ điều kiện mua được phân trang.</div>${pageNavigation(artifactPage,artifactOffers.length,12,'artifactPage','pháp bảo') }<div class="inventory-grid">${offers||'<div class="empty-state"><strong>Chưa có hàng phù hợp</strong>Chiêu mộ thêm thần tiên hoặc xem lại sau khi mở khóa cấp cao hơn.</div>'}</div>${pageNavigation(artifactPage,artifactOffers.length,12,'artifactPage','pháp bảo')}</div></section>`;
}

function reportsScreen(state) {
  const items=state.reports.map(r=>{
    const enemyUnits=(rows,key)=>Object.entries(rows||{}).map(([id,n])=>`${esc(TROOPS.find(t=>t.id===id)?.name||id)} ${fmt(n)}`).join(' · ')||'không';
    return `<article class="report-card"><div class="report-head"><b>${esc(r.target||'Chiến dịch')}</b><span class="report-result ${r.victory?'win':'loss'}">${r.victory?'Đại thắng':'Rút lui'}</span></div><div class="report-body">${r.rounds?.some(round => round.sides?.length === 2) ? button('battleReplay', 'Xem lại trận', false, 'button small', `data-report="${esc(r.id)}"`) : ''}<div class="report-tactics"><span class="tag">${r.type==='duel'?'Đấu pháp thần tiên':'Hành quân quân đội'}</span><span class="tag">${r.combatBattleId?'Quy mô ta':'Sức ta'} ${fmt(r.ownPower||0)}</span><span class="tag">Đối thủ ${fmt(r.enemyPower||0)}</span>${r.rounds?.length?`<span class="tag">${r.rounds.length} hiệp</span>`:''}</div>${r.type==='duel'&&r.duelEnemy?`<p>Đối thủ: ${esc(r.duelEnemy.name)} · hệ ${ELEMENT_NAMES[r.duelEnemy.element]||'Trung tính'} · chiến thuật ${esc(r.duelEnemy.tactic)}</p>`:''}${r.type==='duel'&&r.remainingHealth?`<p>Thể lực cuối trận: ta ${r.remainingHealth.own}% · đối thủ ${r.remainingHealth.enemy}%</p>`:''}${r.heroSkills?.length?`<p>Pháp môn đội hình: ${r.heroSkills.map(esc).join(' · ')}</p>`:''}${r.skillBonuses?.affinity?`<p>Linh căn đội hình +${Math.round(r.skillBonuses.affinity*100)}% · cộng hưởng đồng nguyên tố +${Math.round(r.skillBonuses.elementResonance*100)}%</p>`:''}${r.skillBonuses?.equipmentAttack||r.skillBonuses?.equipmentDefense||r.skillBonuses?.artifactSkillBonus?`<p>Trang bị đội hình: vũ khí +${fmt(r.skillBonuses.equipmentAttack*100)}% công · giáp giảm ${fmt(r.skillBonuses.equipmentDefense*100)}% sát thương · pháp bảo +${fmt(r.skillBonuses.artifactSkillBonus*100)}% hệ số kỹ năng.</p>`:''}${r.matchup?.sourceArtifacts?.length?`<p>Pháp bảo Mobile: ${r.matchup.sourceArtifacts.map(a=>`${esc(a.name)} · ${esc(a.status)} (${esc(a.ability)})`).join(' ; ')}. Mô hình chỉ áp dụng các hiệu ứng số đã phân tích; hiệu ứng khác còn UNKNOWN, cộng dồn SIMULATED.</p>`:''}${r.type==='duel'&&r.skillBonuses?.activePowerBonus?`<p>Độ tinh thông chủ động +${Math.round(r.skillBonuses.activePowerBonus*100)}% lực chiến thần tiên.</p>`:''}${r.enemyCommander?`<p>Chủ soái NPC: ${esc(r.enemyCommander)} · chiến thuật ${esc(r.enemyTactic||'dã chiến')}</p>${r.matchup?`<p>Tương khắc: ta +${r.matchup.ownCounterAdvantage}% · địch +${r.matchup.enemyCounterAdvantage}% · đội hình ${r.matchup.ownBalanced?'cân bằng':'chưa cân bằng'} · địch hệ ${ELEMENT_NAMES[r.enemyElement]||'Trung tính'} · ngũ hành ${r.matchup.heroElementAdvantage>0?'+':''}${r.matchup.heroElementAdvantage||0}%</p>`:''}<p>Đội hình địch: ${enemyUnits(Object.fromEntries((r.enemyFormation||[]).map(row=>[row.unitId,row.count])))}</p><p>Tổn thất địch: ${enemyUnits(r.enemyCasualties)}</p>`:''}<p>Quân điều động: ${Object.entries(r.troopsSent||{}).map(([id,n])=>`${esc(TROOPS.find(t=>t.id===id)?.name||id)} ${fmt(n)}`).join(' · ')||'Đội hình thần tiên'}.</p><p>Thương vong: ${enemyUnits(r.dead)}${Object.values(r.wounded||{}).reduce((a,n)=>a+n,0)?` · bị thương ${fmt(Object.values(r.wounded).reduce((a,n)=>a+n,0))}`:''}</p><p>Chiến lợi phẩm: ${r.loot&&Object.keys(r.loot).length?costText(r.loot):'không có'} · ${r.evidence||CONTENT_EVIDENCE.status}</p>${r.rounds?.length?`<details><summary>Diễn biến ${r.rounds.length} hiệp</summary><p>${r.rounds.map(x=>`Hiệp ${x.round}${x.turnOrder?` · ${esc(x.turnOrder)}`:''}: ta gây ${fmt(x.ownDamage)}${x.skillDamage?` · kỹ năng ${fmt(x.skillDamage)}`:''}${x.elementDamage?` · ngũ hành ${x.elementDamage>0?'+':''}${fmt(x.elementDamage)}`:''}, chịu ${fmt(x.enemyDamage)}${x.shieldedDamage?` · hộ thể chặn ${fmt(x.shieldedDamage)}`:''}${x.skillHealing?` · hồi ${fmt(x.skillHealing)}`:''}; sĩ khí ${x.ownMorale}%${x.enemyMorale!==undefined?` · địch ${x.enemyMorale}%`:''}${x.activeSkills?.length?` · thi triển ${x.activeSkills.map(esc).join(' + ')}`:''}.`).join('<br>')}</p></details>`:''}</div></article>`;
  }).join('');
  return `<section class="panel">${subheading(`Chiến báo · ${state.reports.length} báo cáo`,'Phân giải trận đấu mô phỏng, lưu cục bộ')}<div class="panel-body"><div class="hint" style="margin-bottom:10px">Tất cả trận chiến được tính cục bộ và ghi vào save; thương vong, thương binh, thưởng và danh vọng chỉ áp dụng một lần khi hàng đợi hành quân hoàn tất.</div><div class="report-list">${items||'<div class="empty-state"><strong>Chưa có chiến báo</strong>Hành quân tới dã địa hoặc khiêu chiến tháp để bắt đầu.</div>'}</div></div></section>`;
}

function settingsScreen(state) {
  const check=(key,label)=>`<label class="setting-row"><span>${label}</span><input class="toggle" type="checkbox" data-setting="${key}" ${state.settings[key]?'checked':''}></label>`;
  return `<div class="settings-grid"><section class="panel">${subheading('Tùy chỉnh trải nghiệm')}<div class="panel-body">${check('autosave','Tự lưu sau mỗi thao tác')}${check('sound','Âm thanh giao diện')}${check('effects','Hiệu ứng chiến trường')}${check('reducedMotion','Giảm chuyển động')}<div class="divider"></div><div class="field"><label for="rename-city">Tên thành trì</label><div class="field-row"><input class="input" id="rename-city" maxlength="22" value="${esc(state.profile.name)}"><button class="button" data-action="rename">Đổi tên</button></div></div><div style="margin-top:10px">${button('save','Lưu ngay',false,'button ghost')}</div></div></section><section class="panel">${subheading('Sao lưu và chuyển thiết bị')}<div class="panel-body"><p class="tiny muted">Save ${state.version} lưu trong IndexedDB và có bản dự phòng localStorage. Không có dữ liệu người chơi hay tài khoản mạng.</p><div class="field-row"><button class="button" data-action="export">Xuất tệp lưu JSON</button><label class="button ghost" for="import-file">Nhập tệp lưu</label><input class="sr-only" id="import-file" type="file" accept="application/json"></div><div class="divider"></div><p class="tiny muted">Dung lượng kho ${fmt(storageCapacity(state))} mỗi loại · tiến trình offline giới hạn 8 giờ mỗi lần mở lại.</p><div class="hint">Không khôi phục được save gốc từ game Đắc Kỷ Mobile. Tệp nhập chỉ chấp nhận định dạng Dacky Mobile và được kiểm tra trước khi thay save.</div></div></section><section class="panel">${subheading('Kết nối và quyền riêng tư')}<div class="panel-body"><div class="setting-row"><span>Chế độ chơi</span><b>Đơn người chơi · offline-first</b></div><div class="setting-row"><span>Đối thủ thế giới</span><b>NPC mô phỏng</b></div><div class="setting-row"><span>Đồng bộ máy chủ</span><b>Không sử dụng</b></div><div class="setting-row"><span>Nguồn nội dung gameplay</span><b class="tag">MIXED · Mobile + legacy + SIMULATED</b></div><p class="tiny muted">Danh mục nguồn được đóng gói cục bộ; dữ kiện áp dụng theo từng trường. Cơ chế chưa xác minh vẫn được đánh dấu SIMULATED hoặc UNKNOWN. iPhone hỗ trợ PWA khi được host qua HTTPS.</p></div></section><section class="panel">${subheading('Tình trạng bản phát hành')}<div class="panel-body"><div class="setting-row"><span>Web responsive</span><b>Đã tích hợp trong mã nguồn</b></div><div class="setting-row"><span>PWA installable</span><b>Service Worker</b></div><div class="setting-row"><span>Android APK</span><b>Debug đã build · chưa thử trên thiết bị</b></div><div class="setting-row"><span>Capacitor 8.6.2</span><b>Đã ghim trong package.json</b></div><p class="tiny muted">Xem docs/BUILD_GUIDE.md để build lại APK Android từ cùng codebase.</p></div></section></div><div class="divider"></div><section class="panel">${subheading('Ghi nhận phiên bản dữ liệu')}<div class="panel-body"><div class="hint">${esc(CONTENT_EVIDENCE.source)}. Danh mục Mobile và dữ kiện legacy được giữ theo phiên bản và provenance từng trường; cơ chế chưa ánh xạ còn SIMULATED hoặc UNKNOWN. Build không tuyên bố parity gameplay giữa các phiên bản.</div></div></section>`;
}

const screenMap = {
  city: ['Thành trì','Chỉ huy nội thành, tài nguyên và công trình.'],
  heroes: ['Thần tiên','Mời hiền sĩ, chỉnh đội hình và phân phối trang bị.'],
  inventory: ['Túi đồ','Sử dụng vật phẩm, trang bị thần tiên và rèn pháp bảo.'],
  army: ['Binh doanh','Huấn luyện quân đội, quản lý thương vong và đội hình.'],
  world: ['Bản đồ thiên hạ','Trinh sát, hành quân và giao chiến với NPC.'],
  pve: ['Phong Thần','Chinh phục tháp, tiên sơn và thử thách endgame.'],
  tech: ['Khoa kỹ','Nghiên cứu kinh tế, công thành và binh pháp.'],
  library: ['Thư tịch nguồn','Tra cứu danh mục Mobile, chỉ số, chi phí và provenance theo trường.'],
  quests: ['Sổ nhiệm vụ','Theo dõi chính tuyến, mục tiêu và phần thưởng.'],
  market: ['Triều Ca Thị','Đổi tài nguyên với thương nhân NPC.'],
  reports: ['Chiến báo','Xem từng hiệp, thương vong và phần thưởng đã quyết toán.'],
  settings: ['Thiết lập','Lưu game, xuất nhập save và cài đặt offline.']
};

function renderGameplayExpansion(state,view,uiState){
 if(!state.settings.combatV13)return '';
 const g=state.gameplay??{},btn=(action,label,attrs='',disabled=false)=>button(action,label,disabled,'button small',attrs),select=(id,rows)=>'<select class="input" id="'+id+'">'+rows.map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join('')+'</select>';
 const panel=(title,body)=>'<section class="panel" style="margin-top:12px">'+subheading(title,'Dữ liệu nguồn + mô phỏng có ghi nhãn')+'<div class="panel-body">'+body+'</div></section>';
 const sourceQuestObjective=(q,o)=>{const item=o.kind==='item'?ITEMS.find(row=>row.id===o.id):null,missing=Math.max(0,(o.need||0)-(o.current||0)),offer=item?.legacySourceId&&missing?quoteItemPurchase(state,item.id,missing):null,purchase=offer?btn('buyItem','Đặt '+fmt(missing)+' tín vật','data-item="'+esc(item.id)+'" data-count="'+missing+'"',!offer.available):'';return '<div class="quest-objective"><small>'+esc(o.title||'Mục tiêu')+' · '+(o.kind==='hold'?'HOLD':fmt(o.current)+' / '+fmt(o.need))+' · '+esc(o.evidence||'MIXED')+'</small>'+purchase+'</div>';};
 if(view==='city')return panel('Phủ quan · Quản trị thành trì','<p>Dân số tối đa '+fmt(populationCapacity(state))+' · Quan chức '+g.official+' · Cờ '+esc(g.flag)+'</p><div class="field-row">'+select('tax-rate',Array.from({length:11},(_,i)=>[i*5,i*5+'% thuế']))+btn('setTaxRate','Đặt thuế')+select('labor-rate',[[25,'25%'],[50,'50%'],[75,'75%'],[100,'100%']])+btn('setLaborRate','Đặt khai công')+'</div><div class="field-row">'+btn('bless','Cầu phúc')+btn('sacrifice','Tế tự')+btn('settlePopulation','Thêm dân')+btn('officialPromote','Thăng quan')+btn('disciplineLabor','Kỷ luật')+btn('relieveLabor','Cứu tế')+btn('collectLaborTaxes','Trưng thu')+btn('worldChat','Truyền âm')+'</div>');
 if(view==='heroes')return panel('Tu luyện · Tiềm năng · Chuyển sinh',state.heroes.map(h=>{const name=HEROES.find(x=>x.id===h.id)?.name??h.id,used=Object.values(h.potential??{}).reduce((a,b)=>a+b,0),attr='data-hero="'+esc(h.id)+'"';return '<article class="quest-card"><div><b>'+esc(name)+'</b><p>Cấp '+h.level+' · Chuyển sinh '+(h.rebirths??0)+' · Căn cốt bổ sung '+(h.rootBonus??0)+' · Tiềm năng '+Math.max(0,h.level*2+(h.rebirths??0)*10-used)+'</p><p>Ma trận đã mở '+(h.matrices?.length??0)+' · Trung thành '+(h.combatLoyalty??100)+'</p><p>'+equipmentSets(h).map(x=>esc(x.name)+' '+x.count+' món · '+x.active.map(esc).join(' / ')).join('<br>')+'</p><div class="field-row">'+['attack','magic','defense'].map((k,i)=>btn('allocatePotential',['Dũng vũ +','Đạo pháp +','Phòng thủ +'][i],attr+' data-stat="'+k+'"')).join('')+btn('repairGear','Sửa trang bị',attr)+btn('rebirthHero','Chuyển sinh',attr,h.assigned||h.level<60||(h.rebirths??0)>=5)+'</div></div></article>';}).join(''));
 if(view==='quests'){const all=gameplayQuestList(),page=Math.min(Math.ceil(all.length/20)-1,Math.max(0,uiState.legacyGameplayPage??0)),rows=all.slice(page*20,page*20+20).map(q=>questQuote(state,q.id,productionPerHour));return panel('Nhiệm vụ legacy · '+all.length,'<p>Mục tiêu ghép theo ID nguồn; vật phẩm legacy thiếu bản Mobile có thể đặt từ thương nhân NPC với giá SIMULATED. Phần thưởng giữ nhãn provenance và phần chưa ánh xạ không tự cộng.</p><div class="field-row">'+btn('catalogPage','Trang trước','data-page-key="legacyGameplayPage" data-page="'+(page-1)+'"',page===0)+'<span>'+(page+1)+'/'+Math.ceil(all.length/20)+'</span>'+btn('catalogPage','Trang sau','data-page-key="legacyGameplayPage" data-page="'+(page+1)+'"',page>=Math.ceil(all.length/20)-1)+'</div>'+rows.map(q=>'<article class="quest-card"><div><b>'+esc(q.title)+'</b><p>'+esc(q.target)+'</p>'+q.rows.map(o=>sourceQuestObjective(q,o)).join('')+'<p>'+costText(q.reward)+' · '+esc(q.rewardEvidence||'MIXED')+(q.rewardDetail.unmapped.length?' · '+q.rewardDetail.unmapped.length+' dòng chưa ánh xạ':'')+'</p>'+btn('claimSourceQuest',q.claimed?'Đã nhận':q.hold?'HOLD':'Nhận thưởng','data-quest="'+esc(q.id)+'"',q.claimed||!q.ready)+'</div></article>').join(''));}
 if(view==='world'){const spells=strategicQuote().filter(x=>x.rule),nodes=WORLD_NODES.filter(x=>!state.world.captures.includes(x.id));return panel('Pháp thuật chiến lược',select('spell-hero',state.heroes.map(h=>[h.id,HEROES.find(x=>x.id===h.id)?.name??h.id]))+select('spell-id',spells.map(x=>[x.row.ID,x.row.name+' · '+x.row.enegyNeed+' tinh lực']))+select('spell-target',nodes.map(x=>[x.id,x.name]))+btn('strategicCast','Thi triển')+'<div class="field-row"><input class="input" type="number" id="guild-donate" min="1" value="100">'+btn('guildDonate','Đóng góp minh hội')+'</div>');}
 if(view==='pve'){const b=buzhouPlan(state.world.buzhouFloor+1);return b?panel('Bất Chu · chuẩn bị hành quân','<p>Cửa '+b.floor+' · cấp thủ lĩnh '+b.minLevel+'–'+b.maxLevel+' · thống lĩnh nguồn '+fmt(b.lead)+' quân.</p><small>'+ (b.formation.length?`${b.formation.length} đội hình nguồn cố định sẽ được giữ nguyên trong combat.`:'Nguồn chỉ nêu dải cấp/quân số; đội hình đối thủ được sinh theo dải đó bằng adapter SIMULATED.')+' Loot dùng quyết toán runtime có provenance riêng.</small><div class="field-row">'+btn('leaveMountain','Rời Tiên Sơn', '',(g.mountainRank||0)<1)+'</div>'):'';}
 return '';
}

export function renderScreen(state, activeView, uiState = {}) {
  const [name, description] = screenMap[activeView] || screenMap.city;
  const aside = activeView === 'city' ? `TỬ VI THÀNH · CẤP ${state.levels.citadel}` : activeView === 'world' ? `KHU VỰC ${Math.min(unlockedChapter(state),uiState.chapter||1)} · ${state.world.storyStage} CHẶNG` : `DANH VỌNG · ${fmt(state.fame)}`;
  document.querySelector('#page-heading').innerHTML = title(name, description, aside);
  const screen = ({ city:cityScreen, heroes:heroScreen, inventory:inventoryScreen, army:armyScreen, world:worldScreen, pve:pveScreen, tech:techScreen, library:sourceLibraryScreen, quests:questScreen, market:marketScreen, reports:reportsScreen, settings:settingsScreen })[activeView] || cityScreen;
  document.querySelector('#scene').innerHTML = manualBattlePanel(state,Date.now())+screen(state, activeView === 'world' ? uiState : Date.now(), uiState)+renderGameplayExpansion(state,activeView,uiState);
  if(activeView==='world'){
    const side=document.querySelector('.map-side');
    side?.querySelectorAll('.panel').forEach(node=>{if(node.innerText.includes('Ngoại giao và liên minh NPC'))node.remove();});
    side?.insertAdjacentHTML('beforeend',renderSocietyPanel(state,uiState));
    const primary=document.querySelector('#march-unit')?.value;
    const support=Object.entries(state.army||{}).filter(([id,count])=>id!==primary&&count>0).map(([id,count])=>'<label class="march-support-row"><span>'+esc(TROOPS.find(t=>t.id===id)?.name||id)+' · có '+fmt(count)+'</span><input class="input" type="number" min="0" max="'+count+'" value="0" data-march-support="'+id+'" aria-label="Số '+esc(TROOPS.find(t=>t.id===id)?.name||id)+' hỗ trợ"></label>').join('');
    const formRow=document.querySelector('#march-unit')?.closest('.field-row');
    if(support&&formRow)formRow.insertAdjacentHTML('beforebegin','<details class="march-support"><summary>Thêm binh chủng hỗ trợ · '+(Object.keys(state.army).length-1)+'</summary><div class="march-support-list">'+support+'</div><small class="muted">Đạo quân kết hợp tận dụng tương khắc giữa các vai trò.</small></details>');
    if(formRow)formRow.insertAdjacentHTML('afterend',`<div class="field-row"><label for="combat-mode">Điều khiển trận</label><select class="input" id="combat-mode"><option value="auto" ${uiState.combatMode==='manual'?'':'selected'}>Tự động</option><option value="manual" ${uiState.combatMode==='manual'?'selected':''}>Từng hiệp</option></select></div>`);
  }
  renderShell(state, activeView);
}

function manualBattlePanel(state,now){
 const q=state.queues.march;if(!q||q.combatMode!=='manual'||!q.combatV13)return '';
 const node=WORLD_NODES.find(x=>x.id===q.nodeId)??getPveEncounter(q.nodeId),commands=q.battleCommands??[],round=commands.length+1;
 const arrived=now>=q.finishAt,heroes=(q.commanderIds??[]).map(id=>state.heroes.find(h=>h.id===id)).filter(Boolean);
 const latestSwitch=[...commands].reverse().find(c=>c.switchTo)?.switchTo;
 const commanderOptions=heroes.map(h=>`<option value="${esc(h.id)}" ${h.id===latestSwitch?'selected':''}>${esc(HEROES.find(x=>x.id===h.id)?.name??h.id)} · cấp ${h.level}</option>`).join('');
 const artifacts=heroes.flatMap(h=>{const item=ITEMS.find(x=>x.id===h.equipment?.artifact);return item?.mobileSourceId?[[item.mobileSourceId,`${HEROES.find(x=>x.id===h.id)?.name??h.id} · ${item.name}`]]:[];});
 if(!arrived)return `<section class="panel manual-battle-panel"><div class="panel-body">Đội quân đang hành quân tới ${esc(node?.name??q.nodeId)}. Điều khiển từng hiệp sẽ mở khi đến nơi.</div></section>`;
 return `<section class="panel manual-battle-panel"><div class="panel-title">${esc(node?.name??'Chiến trường')} · Điều khiển trận đấu <small>Hiệp ${round} · ${commands.length} hiệp đã ghi</small></div><div class="panel-body"><div class="field-row manual-battle-fields"><label for="battle-stance">Chiến thuật</label><select class="input" id="battle-stance"><option value="auto">Tự thích ứng</option><option value="assault">Tấn công</option><option value="balanced">Cân bằng</option><option value="guard">Phòng thủ</option><option value="siege">Công thành</option></select><label for="battle-switch">Đổi thần tiên</label><select class="input" id="battle-switch"><option value="">Giữ người đang chỉ huy</option>${commanderOptions}</select></div><div class="field-row manual-battle-artifacts"><label for="battle-artifact">Pháp bảo</label><select class="input" id="battle-artifact"><option value="auto">Tự chọn</option><option value="none">Không dùng</option>${artifacts.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select><label><input id="battle-challenge" type="checkbox"> Khiêu chiến đấu pháp</label></div><div class="field-row manual-battle-actions">${button('battleCommand',`Ra lệnh hiệp ${round}`,false,'button','data-round="'+round+'"')}${button('battleAuto','Tự động hoàn tất trận',false,'button ghost')}</div><small class="tiny muted">Mệnh lệnh được lưu theo save. Thương vong và phần thưởng chỉ quyết toán khi trận kết thúc.</small></div></section>`;
}

function renderSocietyPanel(state,uiState) {
  const node=WORLD_NODES.find(x=>x.id===uiState.nodeId);
  const guildLevel=state.world.guildLevel||0;
  const guildCost={gold:200*(guildLevel+1),timber:90*(guildLevel+1)};
  const guildReady=state.levels.embassy>0&&guildLevel<5&&isAffordable(state,guildCost);
  const alreadyTreatied=node&&state.world.treaties.includes(node.id);
  const diplomacyCost=node?120+node.chapter*40:0;
  const canTreaty=!!node&&node.kind==='Danh thành'&&!alreadyTreatied&&!state.world.captures.includes(node.id)&&state.levels.embassy>0&&state.resources.gold>=diplomacyCost;
  const towns=(state.cities||[]).map(city=>'<div class="production-line"><span class="resource-glyph">'+(city.isCapital?'周':'城')+'</span><span>'+esc(city.name)+' · cấp '+city.level+'</span><b>'+(city.isCapital?'Kinh đô':'Thành phụ')+'</b></div>').join('');
  return '<section class="panel">'+subheading('Minh hội và ngoại giao NPC')+'<div class="panel-body"><div class="hint">Đối thủ, thương nhân và minh hội là NPC ngoại tuyến; không có người chơi trực tiếp. Minh ước làm giảm sức một danh thành; thành phụ tăng sản lượng.</div><div class="setting-row"><span>Cấp minh hội NPC</span><b>'+guildLevel+' / 5 · giảm phí đổi '+(guildLevel*.5)+'%</b></div><div class="tiny muted">Kết minh tiếp theo: '+costText(guildCost)+' · cần Bát Phương Quán cấp 1.</div><div style="margin-top:7px">'+button('guild',guildLevel>=5?'Đã tối đa':'Mở rộng minh hội · cấp '+(guildLevel+1),!guildReady,'button small')+'</div><div class="divider"></div><div class="setting-row"><span>Địa điểm chọn</span><b>'+esc(node?.name||'Chưa chọn')+'</b></div><div class="tiny muted">'+(alreadyTreatied?'Minh ước đang có hiệu lực.':node?.kind==='Danh thành'?'Minh ước tốn '+fmt(diplomacyCost)+' đồng; cần Bát Phương Quán.':'Chọn danh thành NPC để đề nghị minh ước.')+'</div><div style="margin-top:7px">'+button('diplomacy',alreadyTreatied?'Đã ký minh ước':'Đề nghị minh ước',!canTreaty||alreadyTreatied,'button ghost small',node?'data-node="'+node.id+'"':'')+'</div><div class="divider"></div><div class="production-list">'+towns+'</div><div class="field-row" style="margin-top:9px">'+button('view-market','Giao thương NPC',false,'button small')+button('view-quests','Chính tuyến',false,'button ghost small')+'</div></div></section>';
}

export function renderStartup() {
  document.querySelector('#realm-title').textContent = 'Tân chủ';
  document.querySelector('#fame-value').textContent = '0';
  document.querySelector('#resource-strip').innerHTML = '';
  document.querySelector('#primary-nav').innerHTML = '';
  document.querySelector('#mobile-nav').innerHTML = '';
  document.querySelector('#offline-status').textContent = 'Thế giới đơn · dữ liệu lưu trên thiết bị';
  document.querySelector('#page-heading').innerHTML = title('Mưu định Phong Thần','Khởi đầu một cơ đồ trong thời loạn.','OFFLINE · MỘT NGƯỜI CHƠI');
  document.querySelector('#scene').innerHTML = `<section class="city-hero startup-hero"><div class="city-hero-content"><span class="city-kicker">THẦN THOẠI · CHIẾN LƯỢC · THÀNH TRÌ</span><h2>Thiên hạ đợi minh chủ</h2><p>Xây thành, tích lũy, chiêu mộ thần tiên, luyện đạo quân và từng bước vượt qua những thử thách của Phong Thần.</p><form data-form="new-game" class="startup-form"><label for="new-city-name">Tên thành trì</label><div class="field-row"><input class="input" id="new-city-name" name="name" maxlength="22" value="Triều Ca" autocomplete="off"><button class="button" type="submit">Khai mở cơ đồ</button></div></form><div class="startup-badges"><span class="tag">Chơi offline</span><span class="tag">Tự lưu trên máy</span><span class="tag simulated">Runtime MIXED · combat SIMULATED</span></div></div></section><div class="startup-cards"><article class="panel"><div class="panel-body"><span class="eyebrow">THÀNH TRÌ</span><h2 class="hero-name">Một nền kinh tế vận hành</h2><p class="tiny muted">Sản xuất theo thời gian, xây 21 công trình Mobile cùng 6 công trình hỗ trợ, mở khóa khoa kỹ và quản trị dân tâm.</p></div></article><article class="panel"><div class="panel-body"><span class="eyebrow">THẦN TIÊN · BINH CHỦNG</span><h2 class="hero-name">Đội hình có chiến lược</h2><p class="tiny muted">Tuyển mộ, trang bị, tương khắc đội quân, hành quân và chữa trị thương binh.</p></div></article><article class="panel"><div class="panel-body"><span class="eyebrow">THẾ GIỚI PVE</span><h2 class="hero-name">Một hành trình dài</h2><p class="tiny muted">120 địa điểm NPC, chính tuyến, Phong Thần Tháp và năm cửa Bất Chu Sơn.</p></div></article></div><div class="hint startup-disclosure">Danh mục Mobile công khai được chụp ngày 2026-11-25. Runtime kết hợp dữ kiện nguồn đã ánh xạ và phần SIMULATED/UNKNOWN; các hệ số chiến đấu và tiến trình chưa có công thức nguồn được ghi riêng.</div>`;
}

export function updateClock(state, now = Date.now()) {
  document.querySelectorAll('[data-queue-time]').forEach(el => {
    const finishAt = Number(el.dataset.queueTime);
    const remaining = finishAt - now;
    el.textContent = remaining > 0 ? formatDuration(remaining) : 'đang hoàn tất…';
    const progress = el.closest('.queue-card')?.querySelector('[data-progress]');
    if (progress) {
      const q = [state.queues.construction,state.queues.training,state.queues.research,state.queues.march].find(x=>x&&x.finishAt===finishAt);
      if (q) progress.style.width = `${Math.max(0,Math.min(100,(1-Math.max(0,remaining)/(q.finishAt-q.startAt))*100))}%`;
    }
  });
}

export function showToast(message, tone='normal') {
  const stack = document.querySelector('#toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  stack.append(toast);
  setTimeout(()=>toast.remove(),4000);
}

export function showBattleReplay(report, effects) {
  const rounds = report.rounds.filter(round => round.sides?.length === 2);
  if (!rounds.length) return;
  const root = document.querySelector('#modal-root');
  let index = 0;
  function draw() {
    const round = rounds[index];
    const total = [report.ownPower || 1, report.enemyPower || 1];
    const labels = ['Quân ta', 'Quân địch'];
    const side = round.sides.map((row, i) => {
      const pct = Math.min(100, Math.max(0, 100 * row.troops / total[i]));
      const loss = round.incoming?.[i] || 0;
      return `<div class="replay-side ${effects && loss ? 'replay-hit' : ''}">
        <b>${labels[i]}</b><progress value="${pct}" max="100" aria-label="${labels[i]}"></progress>
        <span>${fmt(row.troops)} quân</span>${loss ? `<strong>−${fmt(loss)}</strong>` : ''}
        <small>Pháp lực ${fmt(row.mana)}</small></div>`;
    }).join('');
    const eventNames = (round.events || []).flatMap(event => {
      if (event.type === 'commanderSwitch') return ['Đổi tướng'];
      if (event.type === 'wallBreached') return ['Đã phá thành'];
      if (event.type === 'commanderDuel') return ['Tướng đấu pháp'];
      if (event.type === 'artifactCast' && event.name) return [event.name];
      return [];
    }).map(esc);
    root.innerHTML = `<section class="modal-card battle-replay" role="dialog" aria-modal="true" aria-label="Xem lại trận">
      <h2>${esc(report.target)}</h2><p>Hiệp ${index + 1} / ${rounds.length}</p>
      <div class="replay-armies">${side}</div>
      ${round.wall ? `<p>Thành lũy ${fmt(round.wall.hp)} / ${fmt(round.wall.maxHp)}</p>` : ''}
      ${eventNames.length ? `<p>${eventNames.join(' · ')}</p>` : ''}
      <div class="modal-actions"><button class="button ghost" data-replay-close>Đóng</button>
        <button class="button ghost" data-replay-back ${index === 0 ? 'disabled' : ''}>Hiệp trước</button>
        <button class="button" data-replay-next ${index === rounds.length - 1 ? 'disabled' : ''}>Hiệp tiếp</button></div></section>`;
    root.querySelector('[data-replay-close]').onclick = () => { root.innerHTML = ''; };
    root.querySelector('[data-replay-back]').onclick = () => { index--; draw(); };
    root.querySelector('[data-replay-next]').onclick = () => { index++; draw(); };
  }
  draw();
}

export function showDialog({ title:heading, message, confirm='Đồng ý', cancel='Đóng', onConfirm }) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><h2>${esc(heading)}</h2><p>${esc(message)}</p><div class="modal-actions"><button class="button ghost" data-dialog-cancel>${esc(cancel)}</button><button class="button" data-dialog-confirm>${esc(confirm)}</button></div></div>`;
  root.querySelector('[data-dialog-cancel]').addEventListener('click',()=>root.replaceChildren());
  root.querySelector('[data-dialog-confirm]').addEventListener('click',async()=>{root.replaceChildren(); await onConfirm?.();});
}
