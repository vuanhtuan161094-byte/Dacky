"""Capture actual isolated game runtime with real player actions, not mockups."""
import json, os, pathlib, subprocess, time
from playwright.sync_api import sync_playwright
from PIL import Image
OUT=pathlib.Path(os.environ['LAB_OUT']);OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:4173/'
audit=[];errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['CHROME_BIN'],args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1280,'height':720},record_video_dir=str(OUT/'video-raw'),record_video_size={'width':1280,'height':720})
    page=ctx.new_page();page.set_default_timeout(30000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    def ready(page):
        page.evaluate("""async()=>{await document.fonts.ready;const imgs=[...document.images].filter(i=>{const b=i.getBoundingClientRect();return b.width>0&&b.height>0&&b.bottom>=0&&b.top<=innerHeight});await Promise.race([Promise.allSettled(imgs.map(i=>i.decode())),new Promise(r=>setTimeout(r,5000))]);}""")
        page.wait_for_timeout(250)
    def capture(name,page=page):
        ready(page);page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=87)
        audit.append({'screen':name,**page.evaluate("""()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().width>0).length,navIcon:getComputedStyle(document.querySelector('.nav-glyph')||document.body).backgroundImage!=='none'})""")})
    def view(name):page.locator('#primary-nav [data-view="'+name+'"]').click();page.locator('#scene').wait_for()
    page.goto(URL,wait_until='domcontentloaded',timeout=60000)
    page.locator('[data-form="new-game"] button').click()
    capture('01-city')
    page.locator('.art06-zone-tabs [data-zone="outer"]').click();capture('02-outer')
    for i,name in enumerate(['heroes','inventory','army','world','pve','tech','quests','market','library','settings'],3):
        view(name);capture(f'{i:02}-{name}')
    view('world')
    page.locator('[data-node="node-011"]').first.click()
    page.locator('#combat-mode').select_option('manual')
    page.locator('#march-count').fill('18')
    page.locator('[data-action="march"]').first.click()
    page.locator('.manual-battle-panel .battle-sprite-frame').first.wait_for(timeout=60000)
    capture('13-live-battle')
    page.wait_for_timeout(1200)
    if page.locator('[data-battle-choice="stance"][data-value="assault"]').count():
        page.locator('[data-battle-choice="stance"][data-value="assault"]').click()
    page.locator('.manual-battle-panel [data-action="battleCommand"]').click()
    page.wait_for_timeout(1300)
    capture('14-battle-impact')
    # Record actual VFX styling when a gameplay event emits an effect.
    fx=page.locator('.battle-vfx-sheet')
    audit.append({'battleEffects':fx.count(),'effectCSS':fx.first.evaluate("(e)=>({size:getComputedStyle(e).backgroundSize,animation:getComputedStyle(e).animationName})") if fx.count() else None})
    if page.locator('.manual-battle-panel [data-action="battleAuto"]').count():
        page.locator('.manual-battle-panel [data-action="battleAuto"]').click()
    view('reports')
    page.locator('[data-action="battleReplay"]').first.wait_for(timeout=30000)
    capture('15-settled-report')
    page.locator('[data-action="battleReplay"]').first.click()
    page.locator('.battle-replay').wait_for()
    capture('16-replay');page.wait_for_timeout(1200)
    for i in range(3):
        b=page.locator('[data-replay-next]')
        if b.count() and b.is_enabled():b.click();page.wait_for_timeout(800)
    video=page.video;ctx.close();raw=video.path()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'actual-gameplay.mp4')],check=True)
    # Same engine and real runtime; developed city is explicitly a QA fixture.
    c=browser.new_context(viewport={'width':1280,'height':720})
    dp=c.new_page();dp.goto(URL,wait_until='domcontentloaded',timeout=60000)
    dp.evaluate("""async()=>{const {createNewGame}=await import('/src/engine.js');const {BUILDINGS}=await import('/src/catalog.js');const {saveGame}=await import('/src/store.js');const s=createNewGame('Triều Ca · QA',Date.now());for(const b of BUILDINGS)s.levels[b.id]=Math.min(8,b.maxLevel);s.cityPlots={i1:{buildingId:'housing',level:5},i2:{buildingId:'barracks',level:4},i3:{buildingId:'storehouse',level:4},o1:{buildingId:'farm',level:5},o2:{buildingId:'farm',level:3},o3:{buildingId:'grove',level:4},o4:{buildingId:'mine',level:4}};await saveGame(s);}""")
    dp.reload(wait_until='domcontentloaded',timeout=60000);dp.locator('.art01-camera').wait_for()
    capture('17-developed-inner',dp)
    dp.locator('.art06-zone-tabs [data-zone="outer"]').click();capture('18-developed-outer',dp);c.close()
    c=browser.new_context(viewport={'width':844,'height':390},has_touch=True);mp=c.new_page();mp.goto(URL,wait_until='domcontentloaded',timeout=60000);mp.locator('[data-form="new-game"] button').click();capture('19-mobile-city',mp);mp.locator('#primary-nav [data-view="inventory"]').click();capture('20-mobile-inventory',mp);c.close()
    browser.close()
(OUT/'audit.json').write_text(json.dumps({'lunaSha':os.environ['LUNA_SHA'],'captures':audit,'pageErrors':errors,'note':'actual runtime; developed city seeded QA fixture, not earned progression'},indent=2))
assert not errors,errors
print('PRESENTATION LAB: gameplay, live battle, settlement, replay and visual captures complete')
