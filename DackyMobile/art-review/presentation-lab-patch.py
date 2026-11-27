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
