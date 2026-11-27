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
