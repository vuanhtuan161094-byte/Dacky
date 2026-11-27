"""Presentation lab: patch only isolated Luna checkout; source images only."""
from pathlib import Path
import sys
root=Path(sys.argv[1]);review=Path(sys.argv[2])
ui=root/'src/ui.js';s=ui.read_text()
old='background-size:${fx.width*fx.frames*scale}px ${fx.height*scale}px;--sprite-frames:${fx.frames};--sprite-duration:${fx.durationMs}ms'
new='background-size:100% 100%;animation:none;--sprite-frames:1;--sprite-duration:${fx.durationMs}ms'
assert old in s;s=s.replace(old,new)
old=': `<span class="unit-glyph">${esc(item.glyph)}</span>`;'
new=': `<span class="unit-glyph lab-item-fallback">${esc(({"vũ khí":"VK","giáp":"GI","pháp bảo":"PB","vật phẩm":"VP"})[item.type]||"VT")}</span>`;'
assert old in s;s=s.replace(old,new,1)
ui.write_text(s)
installer=root/'scripts/install-art13.py'
install=installer.read_text()
assert 'if not base.endswith(patch):' in install
# Accept the exact ART13 CSS anywhere in the scratch stylesheet, while keeping all asset hashes and conflicting-patch safeguards.
installer.write_text(install.replace('if not base.endswith(patch):','if patch not in base:',1))
css=root/'styles.css'
patch=(review/'integration-ready/ui-icon-reuse.proposed.css').read_text()
css.write_text(css.read_text()+'\n'+patch+'''
/* Lab only: reuse source illustration; no geometry or art replacement. */
body.hud-ready:not(.startup-mode):not(.art01-city-mode){background:#182c29}
body.hud-ready:not(.startup-mode):not(.art01-city-mode) .topbar{background:linear-gradient(#36514b,#193833);border-color:#c49d56}
body.hud-ready:not(.startup-mode) .lab-item-fallback{font-size:12px;font-weight:700;color:#e8cf96;display:inline-grid;place-items:center}
body.hud-ready:not(.startup-mode) .inventory-item .item-source-art{width:48px;height:48px;object-fit:contain;float:left;margin:0 9px 6px 0}
body.hud-ready:not(.startup-mode) .inventory-item .lab-item-fallback{width:48px;height:48px;float:left;margin:0 9px 6px 0;border:1px solid #ad965c;background:#213a34}
body.hud-ready:not(.startup-mode) .inventory-item .field{clear:both}
body.hud-ready:not(.startup-mode) .inventory-item b{font-size:14px}
body.hud-ready:not(.startup-mode) .hero-dossier .hero-card-info{min-width:0}
body.hud-ready:not(.startup-mode) .hero-dossier .hero-stat{padding:6px}
body.hud-ready:not(.startup-mode) .battle-vfx-sheet{background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important;animation:none!important}
.art01-city .city-building-info{max-width:120px}
.art01-city .city-building-info b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.art01-city .city-building:hover .city-building-info,.art01-city .city-building[aria-pressed=true] .city-building-info{max-width:160px}
@media(max-height:480px){.art01-city .city-building-info{max-width:76px}}
''')
print('LAB patched: native WebP playback, existing HUD icons, readable inventory fallback and labels; no engine changes.')


# PREMIUM-R1: presentation only, based on actual before captures.
s=ui.read_text()
def replace_exact(a,b):
    global s
    assert a in s, a[:90]
    s=s.replace(a,b,1)
# Verified visual-only surrogate for two starter weapons; never alter source ID/stats.
replace_exact('const itemArt = item => item.mobileImage', '''const labWeaponArt = {'item-01':'./assets/mobile-source/assets/items/n_item_95334.jpg','item-02':'./assets/mobile-source/assets/items/n_item_95337.jpg'};
const itemArt = item => (item.mobileImage||labWeaponArt[item.id])''')
replace_exact('assetUrl(item.mobileImage))}" alt="" loading="lazy" decoding="async">','assetUrl(item.mobileImage||labWeaponArt[item.id]))}" alt="" loading="lazy" decoding="async">')
# Avoid unsupported glyphs in costs, map nodes and tactical controls.
replace_exact("const resourceGlyph = key => RESOURCE_INFO[key]?.glyph || ({questVouchers:'券',population:'民',official:'官',morale:'心'}[key]||'?');","const resourceGlyph = key => ({food:'Lương',wood:'Gỗ',stone:'Đá',iron:'Sắt',gold:'Đồng',jade:'Ngọc',questVouchers:'Thẻ',population:'Dân',official:'Quan',morale:'Tâm'}[key]||RESOURCE_INFO[key]?.name||key);")
replace_exact("n.isBoss?'王':n.kind==='Dã địa'?'野':n.kind==='Tiên sơn'?'仙':'塔'","n.isBoss?'Boss':n.kind==='Dã địa'?'Dã':n.kind==='Tiên sơn'?'Sơn':'Tháp'")
replace_exact("[['auto','應','Tùy cơ'],['assault','戰','Tiến công'],['balanced','平','Cân bằng'],['guard','盾','Phòng thủ'],['siege','攻','Công thành']]","[['auto','AUTO','Tùy cơ'],['assault','ATK','Tiến công'],['balanced','BAL','Cân bằng'],['guard','DEF','Phòng thủ'],['siege','SGE','Công thành']]")
# Keep native sprite scale consistent and arrange stacks in compact two-row groups.
replace_exact('left:${8+(j%4)*22}%;top:${Math.floor(j/4)*45+((j%2)*6)}%','left:${20+(j%3)*29+(Math.floor(j/3)%2)*5}%;top:${Math.floor(j/3)*28+((j%2)*5)}%')
replace_exact('spriteMarkup(frame,1.5)','spriteMarkup(frame,1.12)')
# Display only actual source fortress for wall encounters; field battle should not have a giant city in the middle.
replace_exact('<div class="battle-fortification"><img src="${esc(assetUrl(\'./assets/mobile-source/assets/map-ng/thanh/map00401.webp\'))}" alt="Thành lũy chiến trường" decoding="async"></div>','<div class="battle-fortification" ${node?.kind===\'Danh thành\'?\'\':\'hidden\'}><img src="${esc(assetUrl(\'./assets/mobile-source/assets/map-ng/thanh/map00401.webp\'))}" alt="Thành lũy chiến trường" decoding="async"></div>')
ui.write_text(s)
css.write_text(css.read_text()+'''
/* PREMIUM-R1: fix blocked action, preserve HUD access and source artwork. */
body.hud-ready.battle-mode:not(.startup-mode) .hud-controller{top:8px;bottom:auto;right:8px}
body.hud-ready.battle-mode:not(.startup-mode) .hud-menu{top:42px;bottom:auto}
body.battle-mode .battle-header{padding-right:112px}
.battle-theater .battle-fortification[hidden]{display:none!important}
.battle-theater .battle-fortification{top:13%;width:min(22%,300px);height:45%;opacity:.85}
.battle-theater .battle-lane{top:38%;bottom:7%;width:47%}
.battle-theater .battle-command-unit{min-width:68px;max-width:82px}
.battle-theater .battle-unit{height:clamp(100px,19vh,150px)}
.battle-theater .battle-unit-ranks{inset:12px 5px 22px}
.battle-theater .battle-order b{font:700 12px system-ui;color:#e8cf94}
.battle-theater .battle-order small{font-size:10px}
.battle-theater .battle-order.active{background:linear-gradient(#796038,#483c24);border-color:#ecd197}
.battle-theater .battle-issue{min-height:38px;background:linear-gradient(#ae8748,#75532c);font-weight:700}
.battle-theater .battle-result-ribbon{font-size:11px}
.battle-theater .battle-vfx-sheet{z-index:10;pointer-events:none}
@media(max-height:480px){body.battle-mode .battle-header{padding-right:90px}body.hud-ready.battle-mode:not(.startup-mode) .hud-controller{top:2px}.battle-theater .battle-unit{height:76px}.battle-theater .battle-command-unit{min-width:48px;max-width:58px}}
/* Inventory: source icon as focal point, compact actions; keep all controls. */
body.hud-ready:not(.startup-mode) .inventory-item{background:linear-gradient(140deg,#273b34,#192c29);border-color:#a88a5266;border-radius:5px;padding:10px}
body.hud-ready:not(.startup-mode) .inventory-item .item-source-art,body.hud-ready:not(.startup-mode) .inventory-item .lab-item-fallback{float:none;display:grid;margin:0 auto 8px;width:62px;height:62px;border:1px solid #b79b60;border-radius:5px}
body.hud-ready:not(.startup-mode) .inventory-item b{display:block;line-height:1.3;color:#f7e6bc}
body.hud-ready:not(.startup-mode) .inventory-item small{font-size:11px;line-height:1.35}
body.hud-ready:not(.startup-mode) .inventory-item .input{font-size:12px;width:100%}
body.hud-ready:not(.startup-mode) .inventory-item .button{margin-top:5px;min-height:30px}
body.hud-ready:not(.startup-mode):not(.art01-city-mode) .panel,body.hud-ready:not(.startup-mode):not(.art01-city-mode) .overview-card{background:linear-gradient(140deg,#263a34,#1c2c29);border-color:#9c88565c}
body.hud-ready:not(.startup-mode):not(.art01-city-mode) .panel-title{color:#f4dfae;border-bottom-color:#a98b5570}
body.hud-ready:not(.startup-mode):not(.art01-city-mode) .input{background:#142a26;color:#f2e6c5;border-color:#8c7c54}
.hero-detailed-stage .hero-portrait-stage{min-height:0;padding:5px 8px}
.hero-portrait-stage>.hero-dossier{min-height:0;gap:7px;padding:4px 9px;align-items:start}
.hero-dossier>.portrait{height:min(38vh,300px);align-self:start;margin-top:4px}
.hero-dossier>.hero-card-info{align-self:start;padding:6px 9px}
.hero-dossier .hero-stats{margin:5px 0}
.hero-dossier .hero-equipment-slot{grid-template-rows:auto 32px auto;background:#243830;border-color:#9d8451}
.hero-dossier .hero-equipment-slot>img{width:30px;height:30px}
.hero-dossier .hero-equipment-slot>small,.hero-dossier .hero-equipment-slot>b{font-size:10px;color:#e8d2a2}
.hero-roster-window{grid-template-columns:minmax(175px,19%) minmax(0,1fr)}
/* Map markers are UI labels, not invented scenery. */
.map-node .map-location-seal{font:700 11px system-ui;border-radius:9px;width:42px;height:28px;box-shadow:0 2px 6px #1c211b88}
.map-node .map-node-name{font-size:10px}
.map-node.selected .map-node-name{outline:1px solid #eacb80}
.map-node:hover,.map-node.selected{z-index:9}
.art01-city.art09-city .city-building[data-building-state="built"] .city-building-info{width:max-content;max-width:100%;bottom:-5px;background:#182e27da;padding:2px 4px}
.art01-city.art09-city .city-building[data-building-state="built"] .city-building-info b{font-size:clamp(8px,.75vw,11px);font-weight:600}
.art01-city.art09-city .city-building[data-building-state="built"]:is(:hover,:focus-visible,[aria-pressed=true]) .city-building-info{max-width:180%;z-index:10}
.art01-city.art09-city .city-building[data-building-state="built"]:is(:hover,:focus-visible,[aria-pressed=true]) .city-building-info b{white-space:normal}
@media(max-width:680px){.hero-roster-window{grid-template-columns:1fr}.hero-dossier>.portrait{height:200px}.hero-portrait-stage>.hero-dossier{grid-template-columns:minmax(90px,30%) minmax(0,1fr)}}
''')
print('Premium R1: HUD action clearance, compact ranks, source weapon previews, Vietnamese UI labels and ART13 label refinement.')

# Shared combat rendering: source anchor metadata, no combat engine edits.
import json
s=ui.read_text()
source=json.loads((root/'assets/visual-art-manifest.json').read_text())['assets']
anchors={a['path']:a['anchor'] for a in source if '/battle-ng/' in a['path'] and a.get('anchor')}
helper="function sharedBattleStage({sides,events=[],wall=null,title='',enemyName='',anchors={},effects=true}) {\n  const loss=[0,0],hits=[false,false],attacks=[false,false];\n  for(const e of events){if(e.type==='strikeLoss'&&[0,1].includes(e.side)&&e.actual>0){loss[e.side]+=e.actual;hits[e.side]=true;attacks[1-e.side]=true;}if(e.type==='wallHit'&&e.amount>0)attacks[0]=true;}\n  const active=attacks.some(Boolean)||hits.some(Boolean);\n  const sprite=(frame,scale,side,kind)=>{\n    const a=anchors[frame.path.replace(/^\\.\\//,'')]||{x:.5,y:.85};\n    const w=frame.width*scale,h=frame.height*scale,ax=(side?1-a.x:a.x)*w;\n    return `<span class=\"combat-source-sprite phase-${kind}\" style=\"width:${w}px;height:${h}px;left:${-ax}px;top:${-a.y*h}px;--strip-end:${-(frame.frames-1)*w}px;--strip-steps:${Math.max(1,frame.frames-1)};--clip-ms:${frame.durationMs}ms;background-image:url('${esc(assetUrl(frame.path))}');background-size:${w*frame.frames}px ${h}px;${side?'transform:scaleX(-1);':''}\" aria-hidden=\"true\"></span>`;\n  };\n  const locations=[[],[]];\n  const groups=sides.map((row,side)=>{\n    const stacks=(row?.stacks||[]).filter(t=>Number(t.count)>0).slice(0,5);\n    const hero=HEROES.find(x=>x.id===row?.heroId);\n    const portrait=hero?.mobileImage?`<img src=\"${esc(assetUrl(hero.mobileImage))}\" alt=\"\">`:'';\n    const commander=`<aside class=\"combat-commander side-${side}\">${portrait}<div><b>${esc(hero?.name||(side?enemyName:'Chủ soái')||(side?'Quân địch':'Quân ta'))}</b><small>${fmt(row?.troops??stacks.reduce((n,t)=>n+t.count,0))} quân${row?.mana!=null?' · '+fmt(row.mana)+' pháp lực':''}</small></div></aside>`;\n    const units=stacks.map((t,i)=>{\n      const troop=TROOPS.find(x=>x.id===t.id)||PVE_TROOPS.find(x=>x.id===t.id)||{id:t.id,name:t.id,role:'bộ binh'};\n      const ranged=/xạ|cung|nỏ/i.test(String(troop.role)+' '+String(troop.name));\n      const col=i%2, rowIndex=Math.floor(i/2),x=side?67+col*9:33-col*9,y=64+rowIndex*10+(col?4:0);\n      const advance=ranged?2:Math.max(5,Math.abs(50-x)-5);\n      const scale=1.20+rowIndex*.10;\n      locations[side].push({x,y,advance,ranged});\n      const n=Math.min(6,Math.max(1,Math.ceil(Math.log2(t.count+1))));\n      const ranks=Array.from({length:n},(_,j)=>{\n        const dx=(j%3-1)*26,dy=Math.floor(j/3)*19+(j%2)*4;\n        return `<i class=\"combat-rank\" style=\"--dx:${dx}px;--dy:${dy}px;--delay:${j*22}ms\"><span class=\"combat-contact\"></span>${sprite(battleTroopFrame(troop,'stand'),scale,side,'idle')}${active?sprite(battleTroopFrame(troop,'run'),scale,side,'run')+sprite(battleTroopFrame(troop,'attack'),scale,side,'attack')+(hits[side]&&j===0?sprite(battleTroopFrame(troop,'injured1'),scale,side,'hit'):''):''}</i>`;\n      }).join('');\n      return `<div class=\"combat-stack side-${side} ${active&&attacks[side]?'is-advancing':''} ${hits[side]?'is-hit':''} ${ranged?'is-ranged':''}\" data-stack-id=\"${esc(t.id)}\" data-side=\"${side}\" style=\"left:${x}%;top:${y}%;--advance:${(side?-1:1)*advance}cqw;z-index:${10+rowIndex*10+col}\"><div class=\"combat-ranks\">${ranks}</div><div class=\"combat-stack-label\"><b>${fmt(t.count)}</b><small>${esc(troop.name||t.id)}</small></div></div>`;\n    }).join('');\n    return commander+units;\n  }).join('');\n  const fx=effects?events.filter(e=>((e.type==='strikeLoss'||e.type==='wallHit')&&Number(e.actual??e.amount)>0)||['artifactCast','commanderDuel','wallBreached','troopDelta'].includes(e.type)).slice(0,5).map((e,i)=>{\n    const side=e.type==='wallHit'||e.type==='wallBreached'?1:e.type==='artifactCast'||e.type==='commanderDuel'?1-(e.side??0):e.side??1;\n    const pos=locations[side][0]||{x:side?67:33,y:64,advance:0};\n    const x=e.type==='wallHit'||e.type==='wallBreached'?75:pos.x+(attacks[side]?(side?-1:1)*pos.advance:0);\n    const kind=e.type==='artifactCast'?'artifact':e.type==='commanderDuel'?'skill':e.type==='wallBreached'?'critical':e.type==='troopDelta'?'magic':'normal';\n    const f=BATTLE_EFFECT_FRAMES[kind]||BATTLE_EFFECT_FRAMES.normal;\n    const amount=e.type==='strikeLoss'?`<b class=\"combat-loss\">−${fmt(e.actual)} quân</b>`:'';\n    return `<div class=\"combat-impact\" data-target-side=\"${side}\" style=\"left:${x}%;top:${pos.y}%;--impact-delay:${430+i*65}ms;--impact-duration:${Math.min(1100,f.durationMs)}ms\"><img src=\"${esc(assetUrl(f.path))}\" alt=\"\" style=\"width:${Math.min(120,f.width*.28)}px;height:auto\">${amount}</div>`;\n  }).join(''):'';\n  const fortress=wall?`<div class=\"combat-fortress\"><img src=\"${esc(assetUrl('./assets/mobile-source/assets/map-ng/thanh/map00401.webp'))}\" alt=\"\"><small>Thành lũy ${fmt(wall.hp??0)}/${fmt(wall.maxHp??0)}</small></div>`:'';\n  return `<div class=\"battlefield-landscape combat-shared-stage\" data-renderer=\"shared-combat\" data-active=\"${active}\" data-stacks=\"${locations[0].length+locations[1].length}\"><img class=\"combat-scenery\" src=\"${esc(assetUrl('./assets/visual/assets/battle/nen-thung-lung.jpg'))}\" alt=\"\"><div class=\"combat-ground-tint\"></div>${fortress}${groups}${fx}<div class=\"combat-stage-status\">${active?'Hai quân giao phong':'Bày trận'}</div></div>`;\n}"
helper=helper.replace('anchors={},','anchors=COMBAT_SOURCE_ANCHORS,')
start=s.index('function manualBattlePanel(')
s=s[:start]+'const COMBAT_SOURCE_ANCHORS='+json.dumps(anchors,separators=(',',':'))+';\n'+helper+'\n'+s[start:]
start=s.index('function manualBattlePanel(')
a=s.index('<div class="battlefield-landscape">',start)
b=s.index('<div class="battle-result-ribbon">',a)
s=s[:a]+''' ${sharedBattleStage({sides:[{...(ownState||{}),heroId:heroData?.id||activeHero?.id,stacks:ownStacks.map(([id,count])=>({id,count}))},{...(enemyState||{}),heroId:enemyData?.id||enemyState?.heroId,stacks:enemyStacks.map(t=>({id:t.id||t.unitId,count:t.count}))}],events:latestEvents,wall:lastRound?.wall||(node?.kind==='Danh thành'?{hp:node?.enemy?.wallHp??0,maxHp:node?.enemy?.wallHp??0}:null),title:node?.name,enemyName:node?.enemy?.commander||enemyHero})}'''+s[b:]
start=s.index('export function showBattleReplay(')
a=s.index('<div class="battlefield-landscape replay-landscape">',start)
b=s.index('<div class="battle-result-ribbon">',a)
s=s[:a]+'''${sharedBattleStage({sides:round.sides,events:round.events||[],wall:round.wall,title:report.target,enemyName:report.enemyCommander,effects})}'''+s[b:]
s=s.replace('Math.max(350,1100/speed)','Math.max(450,1850/speed)')
ui.write_text(s)
css.write_text(css.read_text()+"\n/* COMBAT REWORK: common live/replay scene, original source sprites, anchored feet. */\n.combat-shared-stage{container-type:inline-size;background:#253a30;isolation:isolate;overflow:hidden}\n.combat-shared-stage:before{display:none}\n.combat-scenery{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;z-index:-3}\n.combat-ground-tint{position:absolute;inset:0;z-index:-2;pointer-events:none;background:linear-gradient(180deg,#0c192b30 0%,transparent 45%,#25382722 62%,#192b23a0 100%)}\n.combat-stack{position:absolute;width:0;height:0;pointer-events:none;--cycle:calc(1.7s / var(--battle-speed,1))}\n.combat-ranks{position:absolute;left:0;top:0}\n.combat-rank{position:absolute;left:var(--dx);top:var(--dy);width:0;height:0;font-style:normal}\n.combat-contact{position:absolute;left:-20px;top:-4px;width:40px;height:9px;background:radial-gradient(ellipse,#111d13a0 0%,#15261b75 44%,transparent 74%);filter:blur(1px)}\n.combat-source-sprite{position:absolute;display:block;background-repeat:no-repeat;animation:combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite;image-rendering:auto;filter:drop-shadow(0 1px 1px #14231680)}\n@keyframes combat-strip{from{background-position:0 0}to{background-position:var(--strip-end) 0}}\n.combat-stack-label{position:absolute;left:0;top:26px;transform:translateX(-50%);white-space:nowrap;display:flex;align-items:center;gap:4px;padding:2px 5px;background:#192c24dc;border:1px solid #b9a26a80;color:#f4e4bb;font:10px system-ui;border-radius:3px;z-index:50}\n.combat-stack-label b{font-size:12px;color:#ffe3a0}.combat-stack-label small{font-size:10px}\n.combat-stack.side-1 .combat-stack-label{border-color:#c48061;color:#f2ba9e}\n.combat-stack .phase-run,.combat-stack .phase-attack,.combat-stack .phase-hit{visibility:hidden}\n.combat-stack.is-advancing{animation:combat-charge var(--cycle) ease-in-out both}\n.combat-stack.is-advancing .phase-idle{animation:combat-idle var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}\n.combat-stack.is-advancing .phase-run{animation:combat-run var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}\n.combat-stack.is-advancing .phase-attack{animation:combat-attack var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}\n.combat-stack.is-hit .phase-hit{animation:combat-hit var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite;z-index:2}\n.combat-stack.is-ranged .phase-run{visibility:hidden}\n@keyframes combat-charge{0%{translate:0 0}27%,62%{translate:var(--advance) 0}92%,100%{translate:0 0}}\n@keyframes combat-idle{0%,88%{visibility:visible}1%,87%{visibility:hidden}}\n@keyframes combat-run{0%,26%,63%,88%{visibility:hidden}1%,64%{visibility:visible}}\n@keyframes combat-attack{0%,27%,63%{visibility:hidden}28%{visibility:visible}}\n@keyframes combat-hit{0%,35%,62%{visibility:hidden}36%{visibility:visible}}\n.combat-impact{position:absolute;z-index:90;pointer-events:none;transform:translate(-50%,-75%);opacity:0;animation:combat-impact var(--impact-duration) ease-out var(--impact-delay) both}\n.combat-impact img{display:block;max-width:125px;filter:drop-shadow(0 0 8px #e2b96b70)}\n.combat-loss{position:absolute;top:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;font:800 19px system-ui;color:#ffd19d;text-shadow:0 1px 4px #24140f,0 1px 2px #000}\n@keyframes combat-impact{0%{opacity:0;transform:translate(-50%,-55%) scale(.75)}12%,55%{opacity:1;transform:translate(-50%,-75%) scale(1)}100%{opacity:0;transform:translate(-50%,-100%) scale(.95)}}\n.combat-commander{position:absolute;top:14px;display:flex;align-items:center;gap:9px;max-width:38%;padding:5px 10px 5px 5px;background:#182b24ed;border:1px solid #bd9d61;color:#f7e6c5;border-radius:4px;z-index:95}\n.combat-commander.side-0{left:12px}.combat-commander.side-1{right:12px;flex-direction:row-reverse;text-align:right;border-color:#c38d73}\n.combat-commander img{width:48px;height:54px;object-fit:cover;border:1px solid #b39864}\n.combat-commander b,.combat-commander small{display:block}.combat-commander b{font:600 14px system-ui}.combat-commander small{font:11px system-ui;color:#d4c5a3;margin-top:3px}\n.combat-stage-status{position:absolute;top:19%;left:50%;transform:translateX(-50%);padding:4px 11px;border:1px solid #af976766;background:#21332ddd;color:#f3e1bd;font:12px system-ui}\n.combat-fortress{position:absolute;top:32%;left:75%;width:18%;transform:translateX(-50%);z-index:4;text-align:center}.combat-fortress img{width:100%;max-height:145px;object-fit:contain}.combat-fortress small{display:block;color:#f4e6b8;text-shadow:0 1px 3px #000}\n.replay-theater:has(.combat-shared-stage){grid-template-rows:55px minmax(220px,1fr) 42px 72px}\n.replay-theater .replay-controls{align-items:center}.replay-theater .replay-controls .button{height:40px;min-width:100px}\n@media(max-height:480px){.combat-commander{top:4px;padding:3px}.combat-commander img{width:31px;height:35px}.combat-commander b{font-size:11px}.combat-commander small{font-size:9px}.combat-ranks{scale:.70;transform-origin:0 0}.combat-stack-label{top:17px;font-size:8px}.combat-stack-label b,.combat-stack-label small{font-size:8px}.combat-stage-status{top:10%;font-size:9px}.replay-theater:has(.combat-shared-stage){grid-template-rows:39px minmax(120px,1fr) 29px 48px}.replay-theater .replay-controls .button{height:30px;min-width:65px}}\n@media(prefers-reduced-motion:reduce){.combat-stack.is-advancing{animation:none}.combat-source-sprite{animation:none}.combat-stack .phase-idle{visibility:visible!important}.combat-stack .phase-run,.combat-stack .phase-attack,.combat-stack .phase-hit{visibility:hidden!important}}\n")
print('Shared anchored live and replay battle renderer installed.')

# COMBAT-R2 — source-only foreground composition and precise effect crop.
import re,io,base64,subprocess
from PIL import Image
root=root.resolve()
subprocess.run([sys.executable,str(root/'scripts/install-art13.py')],cwd=root,check=True)
lab=root/'assets/lab-combat';lab.mkdir(parents=True,exist_ok=True)
# Crop, do not draw: take uninterrupted grass pixels from locked ART13 outdoor art.
payload=re.search(r'data:image/webp;base64,([A-Za-z0-9+/=]+)',(root/'assets/art01-outer-ground.svg').read_text()).group(1)
with Image.open(io.BytesIO(base64.b64decode(payload))) as src:
    w,h=src.size
    grass=src.crop((round(w*.48),round(h*.332),round(w*.875),round(h*.464))).convert('RGB')
    grass.save(lab/'field-grass.webp','WEBP',quality=94,method=6)
# Animated WebP has large transparent margins; crop to the union of actual visible pixels.
fxmeta={}
for a in source:
    if '/battle-fx/' not in a['path']:continue
    with Image.open(root/a['path']) as im:
        frames=[];delays=[]
        for i in range(im.n_frames):
            im.seek(i);f=im.convert('RGBA');frames.append(f.copy());delays.append(im.info.get('duration',0))
    n=len(frames);assert n==a['frames'],a['path']
    boxes=[f.getbbox() for f in frames if f.getbbox()]
    box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
    w,h=box[2]-box[0],box[3]-box[1]
    atlas=Image.new('RGBA',(w*n,h))
    for i,f in enumerate(frames):atlas.paste(f.crop(box),(i*w,0))
    name=Path(a['path']).stem
    atlas.save(lab/(name+'.webp'),'WEBP',lossless=True,method=6)
    if any(not d or d<=0 for d in delays):delays=[a['durationMs']/n]*n
    # Preserve source relative frame timings; presentation may speed up the whole clip.
    total=sum(delays);elapsed=0;rules=[]
    for i,d in enumerate(delays):
        rules.append(f'{elapsed/total*100:.6f}%{{background-position:{0 if n==1 else 100*i/(n-1):.6f}% 0}}')
        elapsed+=d
    rules.append('100%{background-position:100% 0}')
    fxmeta[a['path']]=dict(path='./assets/lab-combat/'+name+'.webp',w=w,h=h,n=n,ms=total,anim='source-fx-'+name,sourceCrop=list(box))
    css.write_text(css.read_text()+'\n@keyframes source-fx-'+name+'{'+''.join(rules)+'}\n')
# Keep the original manifests untouched; include only new derived, source-pixel assets in offline mapping.
build=root/'scripts/build.mjs'
b=build.read_text()
needle='const sourceAssetUrls = new Map();'
assert needle in b
names=['lab-combat/field-grass.webp']+['lab-combat/'+Path(x['path']).stem+'.webp' for x in source if '/battle-fx/' in x['path']]
b=b.replace(needle,needle+'\nfor(const name of '+json.dumps(names)+'){sourceAssetUrls.set("./assets/"+name,await dataUrl(name));}',1)
# CSS offline inliner removes paths it does not know; include ground crop in inlineImages too.
b=b.replace("['art01-city-ground.svg','art01-outer-ground.svg'","['lab-combat/field-grass.webp','art01-city-ground.svg','art01-outer-ground.svg'",1)
build.write_text(b)
s=ui.read_text()
def rr(a,b):
    global s
    assert a in s,a[:100]
    s=s.replace(a,b,1)
rr('function sharedBattleStage(', 'const COMBAT_FX_CROPS='+json.dumps(fxmeta,separators=(',',':'))+';\nfunction sharedBattleStage(')
rr('const hero=HEROES.find(x=>x.id===row?.heroId);','const hero=HEROES.find(x=>x.id===row?.instanceId)||HEROES.find(x=>x.id===row?.heroId)||HEROES.find(x=>x.mobileSourceId!=null&&String(x.mobileSourceId)===String(row?.heroId));')
rr('const col=i%2, rowIndex=Math.floor(i/2),x=side?67+col*9:33-col*9,y=64+rowIndex*10+(col?4:0);','const slots=[[34,68,46],[25,86,40],[20,57,39],[13,75,32],[11,91,28]],slot=slots[i],col=i%2,rowIndex=Math.floor(i/2),x=side?100-slot[0]:slot[0],y=slot[1];')
rr('const advance=ranged?2:Math.max(5,Math.abs(50-x)-5);','const advance=ranged?0:slot[2]-slot[0];')
rr('const scale=1.20+rowIndex*.10;','const scale=1.44+(y-57)*.009;')
rr('const dx=(j%3-1)*26,dy=Math.floor(j/3)*19+(j%2)*4;','const dx=(j%3-1)*33,dy=Math.floor(j/3)*17+(j%2)*5;')
rr('--strip-end:${-(frame.frames-1)*w}px;--strip-steps:${Math.max(1,frame.frames-1)}','--strip-end:${-frame.frames*w}px;--strip-steps:${Math.max(1,frame.frames)}')
rr('const f=BATTLE_EFFECT_FRAMES[kind]||BATTLE_EFFECT_FRAMES.normal;','const f=BATTLE_EFFECT_FRAMES[kind]||BATTLE_EFFECT_FRAMES.normal, crop=COMBAT_FX_CROPS[f.path.replace(/^\\.\\//,"")], size=Math.min(132,crop.w*.55), height=size*crop.h/crop.w;')
rr('<img src="${esc(assetUrl(f.path))}" alt="" style="width:${Math.min(120,f.width*.28)}px;height:auto">','<span class="combat-fx-art" style="width:${size}px;height:${height}px;background-image:url(\\\'${esc(assetUrl(crop.path))}\\\');background-size:${size*crop.n}px ${height}px;--fx-anim:${crop.anim};--fx-time:${Math.min(1150,crop.ms)}ms" aria-hidden="true"></span>')
rr('<div class="combat-ground-tint"></div>${fortress}','<div class="combat-ground-tint"></div><div class="combat-field-plane"></div>${fortress}')
# Raw event types aren't player-facing captions.
rr("troopDelta:'Pháp bảo đổi quân'}[e.type]","troopDelta:'Pháp bảo đổi quân',stance:'Thế trận',commanderFatigue:'Hao tổn thể lực'}[e.type]")
rr("damage:'Giao phong',casualty:'Thương vong'}[e.type]","damage:'Giao phong',casualty:'Thương vong',strikeLoss:'Trúng đòn',stance:'Thế trận',commanderFatigue:'Hao tổn thể lực'}[e.type]")
ui.write_text(s)
css.write_text(css.read_text()+'''
/* R2: source crop foreground, separate contact slots, native source frames at impact. */
.combat-shared-stage .combat-scenery{object-position:center 28%}
.combat-shared-stage .combat-ground-tint{background:linear-gradient(180deg,#10232b18,transparent 42%,#243b2826 58%,#2135265c 100%)}
.combat-field-plane{position:absolute;inset:42% 0 0;z-index:-1;background:linear-gradient(0deg,#182f24a0,#2a472540 50%,#6d8c4135),url('./assets/lab-combat/field-grass.webp') center center/100% 100% no-repeat;mask-image:linear-gradient(180deg,transparent 0%,#000 30%);pointer-events:none}
.combat-stack{--cycle:calc(1.9s / var(--battle-speed,1))}
.combat-stack-label{top:28px;font-size:11px;padding:2px 6px;box-shadow:0 2px 3px #10251980}
.combat-contact{width:52px;height:13px;left:-26px;top:-5px;background:radial-gradient(ellipse,#14241bd9,#15261b60 50%,transparent 75%)}
.combat-stack.is-ranged.is-advancing{animation:none}
.combat-stack.is-ranged.is-advancing .phase-idle{animation:combat-ranged-idle var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}
.combat-stack.is-ranged.is-advancing .phase-run{animation:none;visibility:hidden}
@keyframes combat-ranged-idle{0%,27%,65%,100%{visibility:visible}28%,64%{visibility:hidden}}
.combat-stack.is-hit.is-advancing .combat-rank:first-child .phase-attack{animation:combat-hit-attack var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}
@keyframes combat-hit-attack{0%,27%,36%,63%,100%{visibility:hidden}28%,35%,62%{visibility:visible}}
.combat-stack.is-hit:not(.is-advancing) .combat-rank:first-child .phase-idle{animation:combat-hit-idle var(--cycle) steps(1,end) both,combat-strip var(--clip-ms) steps(var(--strip-steps),end) infinite}
@keyframes combat-hit-idle{0%,35%,63%,100%{visibility:visible}36%,62%{visibility:hidden}}
.combat-impact{transform:translate(-50%,-85%);animation-duration:calc(var(--impact-duration) / var(--battle-speed,1));animation-delay:calc(var(--impact-delay) / var(--battle-speed,1))}
.combat-fx-art{display:block;background-repeat:no-repeat;animation-name:var(--fx-anim);animation-duration:calc(var(--fx-time) / var(--battle-speed,1));animation-timing-function:steps(1,end);animation-delay:calc(var(--impact-delay) / var(--battle-speed,1));animation-fill-mode:both;filter:drop-shadow(0 0 8px #eadc8e60)}
.combat-loss{top:-12px}
@keyframes combat-impact{0%{opacity:0;transform:translate(-50%,-78%) scale(.9)}12%,65%{opacity:1;transform:translate(-50%,-90%) scale(1)}100%{opacity:0;transform:translate(-50%,-110%) scale(.96)}}
body.hud-ready:has(.replay-theater) .hud-controller{top:6px;bottom:auto;right:8px}
body:has(.replay-theater) .replay-theater .battle-header{padding-right:110px}
body.hud-ready:has(.replay-theater) .hud-menu{top:42px;bottom:auto}
@media(max-height:480px){.combat-ranks{scale:.68}.combat-stack-label{top:17px;font-size:8px;padding:2px 3px}.combat-impact{scale:.75;transform-origin:50% 100%}.combat-commander{max-width:42%}.combat-stage-status{top:16%}.battle-theater .battle-header-tools{margin-right:7px}}
''')
print('Combat R2: actual source grass crop and alpha-trimmed source VFX atlases; original art lock unchanged.')

# R3 — eliminate phase gaps and keep labels inside mobile scene.
s=ui.read_text()
rr('data-stack-id="${esc(t.id)}" data-side="${side}"','data-stack-id="${esc(t.id)}" data-side="${side}" data-slot="${i}"')
rr('const commander=`<aside class="combat-commander','const commander=`<aside class="combat-commander')
ui.write_text(s)
css.write_text(css.read_text()+'''
/* All phase timelines share exact boundaries. No hidden/duplicate rank at transitions. */
@keyframes combat-idle{0%{visibility:hidden}88%,100%{visibility:visible}}
@keyframes combat-run{0%{visibility:visible}28%{visibility:hidden}64%{visibility:visible}88%,100%{visibility:hidden}}
@keyframes combat-attack{0%{visibility:hidden}28%{visibility:visible}64%,100%{visibility:hidden}}
@keyframes combat-hit{0%{visibility:hidden}36%{visibility:visible}62%,100%{visibility:hidden}}
@keyframes combat-hit-attack{0%{visibility:hidden}28%{visibility:visible}36%{visibility:hidden}62%{visibility:visible}64%,100%{visibility:hidden}}
@keyframes combat-ranged-idle{0%{visibility:visible}28%{visibility:hidden}64%,100%{visibility:visible}}
@keyframes combat-hit-idle{0%{visibility:visible}36%{visibility:hidden}62%,100%{visibility:visible}}
.combat-stack-label{max-width:155px;gap:3px}
.combat-stack-label small{overflow:hidden;text-overflow:ellipsis;max-width:120px}
.combat-stack.side-1[data-slot="0"] .combat-stack-label{top:43px}
.combat-loss{font-size:16px}
@media(max-height:480px){
  body.hud-ready.battle-mode:not(.startup-mode) .battle-header{padding-right:112px}
  .combat-stack[data-slot="1"]{top:79%!important}
  .combat-stack[data-slot="4"]{top:86%!important}
  .combat-stack.side-1[data-slot="0"] .combat-stack-label{top:29px}
  .combat-stack-label{max-width:105px}.combat-stack-label small{max-width:76px}
  .combat-loss{font-size:13px}
}
''')
print('R3 phase continuity and mobile label corrections installed.')
