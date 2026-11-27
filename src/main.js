import { cityPlotZone, cityPrimarySite, activeQuest, advance, createNewGame, doAction, TUTORIAL_STEPS } from './engine.js';
import { QUESTS } from './catalog.js';
import { exportSave, importSaveFile, loadGame, saveGame } from './store.js';
import { CITY_OUTER_IDS, NAV, renderScreen, renderShell, renderStartup, showBattleReplay, showDialog, showToast, updateClock } from './ui.js';

let game = null;
let activeView = 'city';
let dirty = false;
let busy = false;
const uiState = { chapter: 1, nodeId: 'node-001', combatMode: 'auto', cityOverview:true };
const HUD_KEYS=['top','nav','heading','status','cityToolbar','cityCommands','cityTools','cityLabels','battleHeader','battleControls'];
const HUD_STORAGE='dacky-hud-v1:'+location.pathname.replace(/index\.html$/,'').replace(/offline\.html$/,'');
let hudPrefs=Object.fromEntries(HUD_KEYS.map(k=>[k,true])),hudFocus=false,hudMenuOpen=false;
try{const saved=JSON.parse(localStorage.getItem(HUD_STORAGE)||'{}');for(const k of HUD_KEYS)if(typeof saved[k]==='boolean')hudPrefs[k]=saved[k];}catch{}
function applyHud(){
  document.body.classList.toggle('hud-ready',Boolean(game));
  document.body.classList.toggle('hud-focus',hudFocus);
  for(const k of HUD_KEYS)document.body.classList.toggle('hud-hide-'+k,hudFocus||!hudPrefs[k]);
  const panel=document.querySelector('#hud-menu'),trigger=document.querySelector('.hud-open');
  if(panel)panel.hidden=!hudMenuOpen;
  trigger?.setAttribute('aria-expanded',String(hudMenuOpen));
  document.querySelectorAll('[data-hud-key]').forEach(el=>el.setAttribute('aria-pressed',String(hudPrefs[el.dataset.hudKey]&&!hudFocus)));
  const focusButton=document.querySelector('.hud-focus-button');
  if(focusButton)focusButton.textContent=hudFocus?'Thoát toàn cảnh · F2':'Toàn cảnh · F2';
}
function setHud(action,key){
  if(action==='menu')hudMenuOpen=!hudMenuOpen;
  else if(action==='focus'){hudFocus=!hudFocus;hudMenuOpen=false;}
  else if(action==='reset'){for(const k of HUD_KEYS)hudPrefs[k]=true;hudFocus=false;hudMenuOpen=false;}
  else if(action==='toggle'&&HUD_KEYS.includes(key)){hudFocus=false;hudPrefs[key]=!hudPrefs[key];}
  try{localStorage.setItem(HUD_STORAGE,JSON.stringify(hudPrefs));}catch{}
  applyHud();
}

const validViews = new Set(NAV.map(x=>x[0]));
const fmtFileDate = () => new Date().toISOString().slice(0,10);
const soundAsset = path => globalThis.__DACKY_EMBEDDED_ASSETS__?.[path] || path;
let uiSound, battleMusic;

function setSaveStatus(text, saved=false) {
  const node = document.querySelector('#save-status');
  if (!node) return;
  node.textContent = text;
  node.parentElement?.classList.toggle('is-saving', !saved);
}

function playChime() {
  if (!game?.settings?.sound) return;
  try {
    uiSound ||= new Audio(soundAsset('./assets/visual/assets/am-thanh/tieng/bam.mp3'));
    uiSound.currentTime = 0;
    uiSound.volume = .45;
    uiSound.play().catch(()=>{});
  } catch { /* Audio is optional and never blocks play. */ }
}

function syncBattleMusic() {
  const battle = Boolean(game?.settings?.sound && game.queues?.march?.combatMode === 'manual' && game.queues?.march?.combatV13 && game.queues?.march?.arrivedAt);
  try {
    if (battle) {
      battleMusic ||= new Audio(soundAsset('./assets/visual/assets/am-thanh/nhac/tran.mp3'));
      battleMusic.loop = true;
      battleMusic.volume = .18;
      if (battleMusic.paused) battleMusic.play().catch(()=>{});
    } else if (battleMusic && !battleMusic.paused) {
      battleMusic.pause();
      battleMusic.currentTime = 0;
    }
  } catch { /* Mobile audio can remain locked until the next user gesture. */ }
}

async function persist(force=false) {
  if (!game || (!dirty && !force)) return;
  if (!force && !game.settings.autosave) { setSaveStatus('Có thay đổi chưa lưu'); return; }
  try {
    await saveGame(game);
    dirty = false;
    lastSave = Date.now();
    setSaveStatus('Đã lưu cục bộ', true);
  } catch (error) {
    setSaveStatus('Bản phụ localStorage đã cập nhật');
    showToast(`IndexedDB chưa lưu được: ${error.message}`, 'warning');
  }
}

function setView(view, updateHash=true) {
  if (!validViews.has(view)) return;
  activeView = view;
  document.body.classList.remove('startup-mode');
  if (updateHash) history.replaceState(null,'',`#${view}`);
  applyHud();
  renderScreen(game, activeView, uiState);
  applyHud();
}

function renderCurrent() {
  if (game) { applyHud();renderScreen(game, activeView, uiState);applyHud();syncBattleMusic(); }
  else {renderStartup();applyHud();}
}

function markChanged(message) {
  dirty = true;
  if (message) showToast(message);
  playChime();
  renderCurrent();
  persist().catch(()=>{});
}

async function perform(action, data={}) {
  if (!game || busy) return;
  busy = true;
  try {
    game = doAction(game, { type:action, ...data }, Date.now());
    dirty = true;
    renderCurrent();
    playChime();
    await persist();
  } catch (error) {
    showToast(error?.message || 'Không thực hiện được mệnh lệnh.', 'warning');
  } finally { busy = false; }
}

function startGame(name) {
  game = createNewGame(name, Date.now());
  activeView = 'city';
  uiState.chapter = 1;
  uiState.nodeId = 'node-001';
  dirty = true;
  document.body.classList.remove('startup-mode');
  history.replaceState(null,'','#city');
  renderCurrent();
  showToast(`Cơ đồ ${game.profile.name} đã khai mở.`);
  persist(true).catch(()=>{});
}

async function initialize() {
  document.body.classList.add('startup-mode');
  try { game = await loadGame(); } catch (error) { showToast(`Không đọc được save: ${error.message}`, 'warning'); }
  if (game) {
    const result = advance(game, Date.now());
    game = result.state;
    activeView = location.hash.slice(1);
    if (!validViews.has(activeView)) activeView = 'city';
    document.body.classList.remove('startup-mode');
    if (result.elapsedSeconds > 1) {
      dirty = true;
      if (result.offlineCapped) showToast('Tiến trình offline đã tính tối đa 8 giờ.', 'normal');
      await persist(true).catch(()=>{});
    }
    renderCurrent();
  } else renderStartup();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      if (reg.waiting) showToast('Có bản game mới sẵn sàng sau khi tải lại.');
    }).catch(error=>console.info('PWA offline cache chưa đăng ký:',error.message));
  }
}

document.body.addEventListener('click', async event => {
  const hudButton=event.target.closest('[data-hud-action],[data-hud-key]');
  if(hudButton){setHud(hudButton.dataset.hudAction||'toggle',hudButton.dataset.hudKey);return;}
  if(hudMenuOpen&&!event.target.closest('#hud-controller')){hudMenuOpen=false;applyHud();}
  if(cityDragSuppress&&event.target.closest('.art01-camera')){event.preventDefault();return;}
  if(event.target.closest('.art01-camera')&&!event.target.closest('button')&&(uiState.cityBuildingId||uiState.cityPlotId)){uiState.cityBuildingId=null;uiState.cityPlotId=null;renderCurrent();return;}
  const heroSupportSummary=event.target.closest('.hero-support-drawer > summary');
  if(heroSupportSummary)uiState.heroSupportOpen=!heroSupportSummary.parentElement.open;
  const heroChoice=event.target.closest('[data-select-hero]');
  if(heroChoice){uiState.selectedHeroId=heroChoice.dataset.selectHero;renderCurrent();return;}
  const recruitPane=event.target.closest('[data-open-hero-support]');
  if(recruitPane){uiState.heroSupportOpen=true;const pane=document.querySelector('.hero-support-drawer');if(pane){pane.open=true;pane.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  const battleChoice=event.target.closest('[data-battle-choice]');
  if(battleChoice){
    const root=battleChoice.closest('.battle-theater'),kind=battleChoice.dataset.battleChoice,value=battleChoice.dataset.value;
    const controls={stance:'#battle-stance',switch:'#battle-switch',artifact:'#battle-artifact'};
    const field=root?.querySelector(controls[kind]);if(field)field.value=value;
    root?.querySelectorAll(`[data-battle-choice="${kind}"]`).forEach(node=>{const selected=node===battleChoice;node.classList.toggle('active',selected);node.setAttribute('aria-pressed',String(selected));});
    return;
  }
  const speedButton=event.target.closest('[data-action="battleSpeed"]');
  if(speedButton){uiState.battleSpeed=uiState.battleSpeed===1?2:1;const stage=speedButton.closest('.battle-theater');stage?.style.setProperty('--battle-speed',uiState.battleSpeed);stage?.querySelectorAll('[data-anim-ms]').forEach(node=>{node.style.animationDuration=`${Number(node.dataset.animMs)/uiState.battleSpeed}ms`;});speedButton.textContent=`${uiState.battleSpeed}× tốc độ`;return;}
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { setView(viewButton.dataset.view); return; }
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action.startsWith('view-')) { setView(action.slice(5)); return; }
  switch(action) {
    case 'catalogPage': {
      const key=button.dataset.pageKey;
      if(['heroPage','forgePage','consumablePage','questPage','mountainPage','sourcePage','legacyGameplayPage','artifactPage'].includes(key)){uiState[key]=Math.max(0,Number(button.dataset.page)||0);renderCurrent();}
      return;
    }
    case 'selectNode':
      uiState.nodeId = button.dataset.node;
      renderCurrent();
      return;
    case 'mapZoomIn': uiState.mapZoom=Math.min(2,(Number(uiState.mapZoom)||1)+.15);renderCurrent();return;
    case 'mapZoomOut': uiState.mapZoom=Math.max(.82,(Number(uiState.mapZoom)||1)-.15);renderCurrent();return;
    case 'mapReset': uiState.mapZoom=1;uiState.mapPanX=0;uiState.mapPanY=0;renderCurrent();return;
    case 'cityPlotSelect': {const id=button.dataset.plot,zone=cityPlotZone(id);if(!zone)return;if((uiState.cityZone||'inner')!==zone){uiState.cityZone=zone;uiState.cityResetCamera=true;}uiState.cityBuildingId=null;uiState.cityPlotId=id;uiState.cityDirectoryOpen=false;renderCurrent();return;}
    case 'citySelect': uiState.cityPlotId=null;uiState.cityBuildingId=button.dataset.building;uiState.cityDirectoryOpen=false;renderCurrent();return;
    case 'cityZone': {const zone=button.dataset.zone==='outer'?'outer':'inner';if(uiState.cityZone===zone)return;uiState.cityZone=zone;uiState.cityBuildingId=null;uiState.cityPlotId=null;uiState.cityDirectoryOpen=false;uiState.cityResetCamera=true;renderCurrent();return;}
    case 'cityLocate': {
      const zone=CITY_OUTER_IDS.includes(button.dataset.building)?'outer':'inner';if((uiState.cityZone||'inner')!==zone){uiState.cityZone=zone;uiState.cityResetCamera=true;}
      const id=button.dataset.building,site=cityPrimarySite(game,id);
      if(!site&&!['citadel','wall'].includes(id)){showToast('Không còn ô đất trống phù hợp.','warning');return;}
      uiState.cityPlotId=site;uiState.cityBuildingId=site?null:id;uiState.cityDirectoryOpen=false;renderCurrent();
      const camera=document.querySelector('.art01-camera'),marker=Array.from(camera?.querySelectorAll('.city-building')||[]).find(el=>site?el.dataset.plot===site:el.dataset.building===id);
      if(camera&&marker){const a=camera.getBoundingClientRect(),b=marker.getBoundingClientRect();camera.scrollLeft+=b.left+b.width/2-a.left-a.width/2;camera.scrollTop+=b.top+b.height/2-a.top-a.height/2;}
      return;
    }
    case 'cityDirectory': uiState.cityDirectoryOpen=!uiState.cityDirectoryOpen;uiState.cityBuildingId=null;uiState.cityPlotId=null;renderCurrent();return;
    case 'cityGuide': {
      const guide=TUTORIAL_STEPS[game.tutorialStep],view={research:'tech',recruit:'heroes',equip:'inventory',train:'army',march:'world'}[guide?.action]||'quests';
      if(guide?.action==='march')uiState.nodeId=guide.data.nodeId;
      setView(view);return;
    }
    case 'cityClose': uiState.cityBuildingId=null;uiState.cityPlotId=null;renderCurrent();return;
    case 'cityZoom': uiState.cityOverview=!uiState.cityOverview;renderCurrent();{const camera=document.querySelector('.art01-camera');if(camera){camera.scrollLeft=(camera.scrollWidth-camera.clientWidth)/2;camera.scrollTop=(camera.scrollHeight-camera.clientHeight)/2;}}return;
    case 'cityCenter': {const camera=document.querySelector('.art01-camera');if(camera){camera.scrollLeft=(camera.scrollWidth-camera.clientWidth)/2;camera.scrollTop=(camera.scrollHeight-camera.clientHeight)/2;}}return;
    case 'demolishPlot': if(window.confirm('Phá dỡ công trình này? Không hoàn trả tài nguyên; sức chứa và sản lượng có thể giảm.'))return perform('demolishPlot',{plotId:button.dataset.plot});return;
    case 'upgradePlot': return perform('upgradePlot',{plotId:button.dataset.plot,buildingId:button.dataset.building});
    case 'upgrade': return perform('upgrade',{buildingId:button.dataset.building});
    case 'upgradeCity': return perform('upgradeCity',{cityId:button.dataset.city});
    case 'setTaxPolicy': return perform('setTaxPolicy',{policy:button.dataset.policy});
    case 'redeemQuestVouchers': return perform('redeemQuestVouchers',{count:button.dataset.count||1});
    case 'setCosmetic': return perform('setCosmetic',{slot:button.dataset.slot,itemId:document.querySelector('[data-cosmetic="'+button.dataset.slot+'"]')?.value||null});
    case 'train': return perform('train',{troopId:document.querySelector('#train-unit')?.value||button.dataset.troop,count:document.querySelector('#train-count')?.value||button.dataset.count,barracksId:document.querySelector('#train-barracks')?.value||undefined});
    case 'trainHero': return perform('trainHero',{heroId:button.dataset.hero});
    case 'recruit': return perform('recruit',{heroId:button.dataset.hero});
    case 'assignHero': return perform('assignHero',{heroId:button.dataset.hero});
    case 'equip': return perform('equip',{itemId:button.dataset.item,heroId:document.querySelector(`[data-equip-select="${button.dataset.item}"]`)?.value||button.dataset.hero});
    case 'useItem': {
      if(button.dataset.kind==='demolishPlot'&&!window.confirm('Phá dỡ công trình này ngay? Vật phẩm sẽ mất và không hoàn trả tài nguyên.'))return;
      return perform('useItem',{itemId:button.dataset.item,index:Number(button.dataset.index),heroId:document.querySelector('[data-item-target="'+button.dataset.item+'"]')?.value,plotId:document.querySelector('[data-item-plot="'+button.dataset.item+'"]')?.value,name:document.querySelector('[data-item-name="'+button.dataset.item+'"]')?.value,flag:document.querySelector('[data-item-flag="'+button.dataset.item+'"]')?.value,mountainId:document.querySelector('[data-item-mountain="'+button.dataset.item+'"]')?.value,nodeId:document.querySelector('[data-item-node="'+button.dataset.item+'"]')?.value});
    }
    case 'exchangeItem': return perform('exchangeItem',{itemId:button.dataset.item});
    case 'buyItem': return perform('buyItem',{itemId:button.dataset.item,count:button.dataset.count||document.querySelector(`[data-buy-count="${button.dataset.item}"]`)?.value||1});
    case 'buyArtifact': return perform('buyArtifact',{itemId:button.dataset.item});
    case 'forge': return perform('forge',{itemId:button.dataset.item});
    case 'enhanceGear': return perform('enhanceGear',{heroId:button.dataset.hero,itemId:button.dataset.item,protectionItemId:document.querySelector('[data-gear-enhance-protection="'+button.dataset.hero+':'+button.dataset.item+'"]')?.value||null});
    case 'starUpGear': return perform('starUpGear',{heroId:button.dataset.hero,itemId:button.dataset.item});
    case 'socketGearGem': return perform('socketGearGem',{heroId:button.dataset.hero,itemId:button.dataset.item,gemId:document.querySelector('[data-gem-select="'+button.dataset.hero+':'+button.dataset.item+'"]')?.value||button.dataset.gem,protectionItemId:document.querySelector('[data-gear-socket-protection="'+button.dataset.hero+':'+button.dataset.item+'"]')?.value||null});
    case 'sellItem': return perform('sellItem',{itemId:button.dataset.item});
    case 'research': return perform('research',{techId:button.dataset.tech});
    case 'scout': return perform('scout',{nodeId:button.dataset.node||uiState.nodeId});
    case 'dailyReward': case 'fieldEvent': case 'refreshRecruitment': return perform(action, {});
    case 'battleReplay': {
      const report = game.reports.find(row => String(row.id) === button.dataset.report);
      if (report) showBattleReplay(report, game.settings.effects && !game.settings.reducedMotion);
      return;
    }
    case 'pveMarch': {
      const troopId=document.querySelector('#pve-unit')?.value,count=Math.max(0,Number(document.querySelector('#pve-count')?.value)||0),troops={};
      if(troopId&&count)troops[troopId]=count;
      document.querySelectorAll('[data-pve-support]').forEach(input=>{const id=input.dataset.pveSupport,n=Math.max(0,Number(input.value)||0);if(id&&id!==troopId&&n)troops[id]=n;});
      return perform('march',{nodeId:button.dataset.node,troops,combatMode:document.querySelector('#combat-mode')?.value||'auto'});
    }
    case 'battleCommand': {
      const artifact=document.querySelector('#battle-artifact')?.value||'auto',switchTo=document.querySelector('#battle-switch')?.value||'';
      return perform('battleCommand',{round:Number(button.dataset.round),stance:document.querySelector('#battle-stance')?.value||'auto',artifactId:artifact==='auto'?undefined:artifact==='none'?null:artifact,switchTo:switchTo||undefined,challenge:Boolean(document.querySelector('#battle-challenge')?.checked)});
    }
    case 'battleAuto': return perform('battleAuto',{});
    case 'march': {
      const troopId=document.querySelector('#march-unit')?.value||button.dataset.troop;
      const troops={};
      const count=Number(document.querySelector('#march-count')?.value||button.dataset.count)||0;
      if(troopId&&count>0)troops[troopId]=count;
      document.querySelectorAll('[data-march-support]').forEach(input=>{
        const amount=Math.max(0,Number(input.value)||0);
        if(input.dataset.marchSupport!==troopId&&amount>0)troops[input.dataset.marchSupport]=amount;
      });
      return perform('march',{nodeId:button.dataset.node||uiState.nodeId,troopId,count,troops,combatMode:document.querySelector('#combat-mode')?.value||'auto'});
    }
    case 'guild': return perform('guild',{});
    case 'diplomacy': return perform('diplomacy',{nodeId:button.dataset.node||uiState.nodeId});
    case 'duel': return perform('duel',{mode:button.dataset.mode,mountainId:button.dataset.mountain});
    case 'claimSourceQuest':return perform(action,{questId:button.dataset.quest});
    case 'allocatePotential':return perform(action,{heroId:button.dataset.hero,stat:button.dataset.stat});
    case 'repairGear':case 'rebirthHero':return perform(action,{heroId:button.dataset.hero});
    case 'setTaxRate':return perform(action,{rate:document.querySelector('#tax-rate')?.value});
    case 'setLaborRate':return perform(action,{rate:document.querySelector('#labor-rate')?.value});
    case 'guildDonate':return perform(action,{amount:document.querySelector('#guild-donate')?.value});
    case 'bless':case 'sacrifice':case 'settlePopulation':case 'officialPromote':case 'worldChat':case 'disciplineLabor':case 'relieveLabor':case 'collectLaborTaxes':case 'leaveMountain':return perform(action,{});
    case 'strategicCast':return perform(action,{heroId:document.querySelector('#spell-hero')?.value,spellId:Number(document.querySelector('#spell-id')?.value),nodeId:document.querySelector('#spell-target')?.value});
    case 'claimQuest': {
      await perform('claimQuest',{questId:button.dataset.quest});
      const current=activeQuest(game);
      const index=QUESTS.findIndex(q=>q.id===current?.id);
      if(index>=0){uiState.questPage=Math.floor(index/24);renderCurrent();}
      return;
    }
    case 'heal': return perform('heal',{});
    case 'export': {
      const blob=exportSave(game), url=URL.createObjectURL(blob), anchor=document.createElement('a');
      anchor.href=url; anchor.download=`dacky-save-${fmtFileDate()}.json`; anchor.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500); showToast('Đã xuất bản lưu JSON.'); return;
    }
    case 'save': await persist(true); showToast('Đã lưu tiến trình hiện tại.'); return;
    case 'rename': return perform('rename',{name:document.querySelector('#rename-city')?.value});
    default: showToast('Mệnh lệnh chưa được nối vào hệ thống.', 'warning');
  }
});

let cityDrag=null,cityDragSuppress=false;
document.body.addEventListener('pointerdown',event=>{
  const camera=event.target.closest('.art01-camera');
  if(!camera||event.pointerType!=='mouse'||event.button!==0)return;
  cityDragSuppress=false;
  cityDrag={id:event.pointerId,camera,x:event.clientX,y:event.clientY,left:camera.scrollLeft,top:camera.scrollTop,moved:false};
});
document.body.addEventListener('pointermove',event=>{
  if(!cityDrag||cityDrag.id!==event.pointerId)return;
  if(!cityDrag.camera.isConnected){cityDrag=null;return;}
  const dx=event.clientX-cityDrag.x,dy=event.clientY-cityDrag.y;
  if(!cityDrag.moved&&Math.hypot(dx,dy)<6)return;
  if(!cityDrag.moved){cityDrag.moved=true;cityDrag.camera.classList.add('is-panning');try{cityDrag.camera.setPointerCapture(event.pointerId);}catch{}}
  event.preventDefault();cityDrag.camera.scrollLeft=cityDrag.left-dx;cityDrag.camera.scrollTop=cityDrag.top-dy;
});
const endCityDrag=event=>{if(!cityDrag||cityDrag.id!==event.pointerId)return;cityDrag.camera.classList.remove('is-panning');if(cityDrag.moved){cityDragSuppress=true;setTimeout(()=>{cityDragSuppress=false;},150);}cityDrag=null;};
document.body.addEventListener('pointerup',endCityDrag);document.body.addEventListener('pointercancel',endCityDrag);
document.body.addEventListener('keydown',event=>{
 if(!game)return;
 if(event.key==='F2'&&!event.repeat){event.preventDefault();setHud('focus');return;}
 if(event.key==='Escape'&&hudMenuOpen){hudMenuOpen=false;applyHud();return;}
 if(event.key==='Escape'&&hudFocus){setHud('focus');return;}
 if(event.key!=='Escape'||activeView!=='city')return;
 const drawer=document.querySelector('.city-management-drawer');
 if(drawer?.open){drawer.open=false;uiState.cityManagementOpen=false;return;}
 if(uiState.cityBuildingId||uiState.cityPlotId||uiState.cityDirectoryOpen){uiState.cityBuildingId=null;uiState.cityPlotId=null;uiState.cityDirectoryOpen=false;renderCurrent();}
});
let worldDrag=null;
document.body.addEventListener('pointerdown',event=>{
  const viewport=event.target.closest('[data-world-map]');
  if(!viewport||event.target.closest('[data-action="selectNode"]'))return;
  worldDrag={pointerId:event.pointerId,viewport,x:event.clientX,y:event.clientY,panX:Number(uiState.mapPanX)||0,panY:Number(uiState.mapPanY)||0};
  viewport.classList.add('is-panning');
  try{viewport.setPointerCapture(event.pointerId);}catch{}
});
document.body.addEventListener('pointermove',event=>{
  if(!worldDrag||event.pointerId!==worldDrag.pointerId)return;
  uiState.mapPanX=worldDrag.panX+event.clientX-worldDrag.x;uiState.mapPanY=worldDrag.panY+event.clientY-worldDrag.y;
  const content=worldDrag.viewport.querySelector('.world-map-content');
  if(content)content.style.transform=`translate(calc(-50% + ${uiState.mapPanX}px),calc(-50% + ${uiState.mapPanY}px)) scale(${Math.max(.82,Math.min(2,Number(uiState.mapZoom)||1))})`;
});
const endWorldDrag=event=>{if(worldDrag&&event.pointerId===worldDrag.pointerId){worldDrag.viewport.classList.remove('is-panning');worldDrag=null;}};
document.body.addEventListener('pointerup',endWorldDrag);
document.body.addEventListener('pointercancel',endWorldDrag);
document.body.addEventListener('wheel',event=>{
  const viewport=event.target.closest('[data-world-map]');if(!viewport)return;
  event.preventDefault();uiState.mapZoom=Math.max(.82,Math.min(2,(Number(uiState.mapZoom)||1)+(event.deltaY<0?.08:-.08)));
  const content=viewport.querySelector('.world-map-content');if(content)content.style.transform=`translate(calc(-50% + ${Number(uiState.mapPanX)||0}px),calc(-50% + ${Number(uiState.mapPanY)||0}px)) scale(${uiState.mapZoom})`;
},{passive:false});

document.body.addEventListener('submit', async event => {
  const form=event.target;
  if (form.dataset.form==='new-game') {
    event.preventDefault();
    const name=new FormData(form).get('name');
    startGame(name);
  } else if (form.dataset.form==='trade') {
    event.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    await perform('trade',{...data,amount:Number(data.amount)});
  } else if (form.dataset.form==='source-search') {
    event.preventDefault();
    uiState.sourceQuery=String(new FormData(form).get('query')||'').trim();
    uiState.sourcePage=0;
    renderCurrent();
  }
});

document.body.addEventListener('change', async event => {
  const target=event.target;
  if (target.id==='combat-mode') {
    uiState.combatMode=target.value==='manual'?'manual':'auto';
  } else if (target.matches('[data-source-category]')) {
    uiState.sourceCategory=target.value;
    uiState.sourcePage=0;
    renderCurrent();
  } else if (target.matches('[data-change="chapter"]')) {
    uiState.chapter=Number(target.value)||1;
    uiState.nodeId=null;
    renderCurrent();
  } else if (target.matches('[data-change="elflandSource"]')) {
    uiState.elflandSourceID=Number(target.value)||0;
    renderCurrent();
  } else if (target.matches('[data-setting]')) {
    await perform('setting',{key:target.dataset.setting,value:target.checked});
    document.body.classList.toggle('effects-off',!game.settings.effects);
    document.body.classList.toggle('reduce-motion',game.settings.reducedMotion);
  } else if (target.id==='import-file' && target.files?.[0]) {
    try {
      const imported=await importSaveFile(target.files[0]);
      showDialog({title:'Thay thế bản lưu?',message:`Tệp hợp lệ cho ${imported.profile.name}; lưu hiện tại sẽ được thay thế trên thiết bị này.`,confirm:'Nhập và thay save',onConfirm:async()=>{
        game=advance(imported,Date.now()).state; activeView='city'; dirty=true; renderCurrent(); await persist(true); showToast('Đã nhập và kiểm tra bản lưu.');
      }});
    } catch(error) { showToast(`Không thể nhập save: ${error.message}`,'warning'); }
    target.value='';
  }
});

window.addEventListener('hashchange',()=>{
  if (game) { const view=location.hash.slice(1); if (validViews.has(view)) setView(view,false); }
});
window.addEventListener('beforeunload',()=>{
  if (!game||!dirty||!game.settings.autosave) return;
  try { localStorage.setItem(globalThis.__DACKY_COMBAT_PREVIEW__?'dacky-combat-integration-save-v1':'dacky-mobile-save-v1',JSON.stringify(game)); } catch { /* IndexedDB checkpoint continues asynchronously. */ }
  saveGame(game).catch(()=>{});
});
document.addEventListener('visibilitychange',()=>{
  if (document.visibilityState!=='visible'||!game) return;
  const oldQueues=JSON.stringify(game.queues);
  const result=advance(game,Date.now()); game=result.state;
  if (JSON.stringify(game.queues)!==oldQueues) { renderCurrent(); dirty=true; persist(true).catch(()=>{}); }
  if (result.offlineCapped) showToast('Tiến trình offline đã tính tối đa 8 giờ.');
});

let lastHud=0, lastSave=0;
setInterval(()=>{
  if (!game) return;
  const before=JSON.stringify(game.queues);
  const result=advance(game,Date.now()); game=result.state;
  const queueChanged=JSON.stringify(game.queues)!==before;
  updateClock(game,Date.now());
  if (queueChanged) {
    dirty=true;
    renderCurrent();
    const latest=game.notifications[0]; if (latest) showToast(latest);
    if(game.queues.march?.combatMode==='manual'&&game.queues.march.arrivedAt)document.querySelector('.manual-battle-panel')?.scrollIntoView({behavior:'smooth',block:'center'});
    persist(true).catch(()=>{});
  }
  if (Date.now()-lastHud>9000) {
    document.querySelector('#realm-title').textContent=game.profile.name;
    document.querySelector('#fame-value').textContent=new Intl.NumberFormat('vi-VN').format(game.fame);
    renderShell(game,activeView);
    lastHud=Date.now();
  }
  if (game.settings.autosave && dirty && Date.now()-lastSave>25000) { lastSave=Date.now(); persist().catch(()=>{}); }
},1000);

if(globalThis.__DACKY_COMBAT_PREVIEW__&&new URLSearchParams(location.search).get('productSmoke')==='1'){
  try{
    const t=Date.now();game=createNewGame('Tân chủ DEV',t);
    game=doAction(game,{type:'equip',heroId:game.heroes[0].id,itemId:'item-01'},t);
    const id=Object.keys(game.army)[0];game=doAction(game,{type:'march',nodeId:'node-001',troopId:id,count:18},t);
    game=advance(game,Math.ceil(game.queues.march.finishAt)).state;
    if(game.stats.battles!==1||game.combatReceipts.length!==1)throw Error('March receipt absent');
    game=doAction(game,{type:'duel',mode:'tower'},game.lastTickAt+1200000);
    if(game.stats.duels!==1||game.combatReceipts.length!==2)throw Error('Tower receipt absent');
    document.body.classList.remove('startup-mode');
    activeView='reports';if(!validViews.has(activeView))activeView='city';renderCurrent();
    document.body.dataset.productSmoke='PASS';
  }catch(error){document.body.dataset.productSmoke='FAIL';document.body.dataset.productError=error.message;}
}else initialize();
