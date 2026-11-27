"""Focused real-game combat/replay acceptance, source art only."""
import json, os, pathlib, subprocess, time
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(os.environ['LAB_OUT']);OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:4173/'
audit=[];errors=[];videoMarks=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['CHROME_BIN'],args=['--no-sandbox'])
    def ready(page):
        page.evaluate("""async()=>{await document.fonts.ready;await Promise.race([Promise.allSettled([...document.images].filter(i=>i.getBoundingClientRect().width>0).map(i=>i.decode())),new Promise(r=>setTimeout(r,4000))])}""")
    def capture(page,name):
        page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=87)
        audit.append({'screen':name,**page.evaluate("""()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().width>0).length,renderer:document.querySelector('.combat-shared-stage')?.dataset.renderer||null,stacks:document.querySelectorAll('.combat-stack').length})""")})
    def enter(page):
        page.set_default_timeout(30000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(URL,wait_until='domcontentloaded',timeout=60000)
        page.locator('[data-form="new-game"] button').click()
        page.locator('#primary-nav [data-view="world"]').click()
        page.locator('[data-node="node-011"]').first.click()
        page.locator('#combat-mode').select_option('manual')
        page.locator('#march-count').fill('18')
        page.locator('[data-action="march"]').first.click()
        page.locator('.manual-battle-panel [data-renderer="shared-combat"] .combat-source-sprite').first.wait_for(timeout=60000)
        ready(page)
    ctx=browser.new_context(viewport={'width':1280,'height':720},record_video_dir=str(OUT/'video-raw'),record_video_size={'width':1280,'height':720})
    start=time.monotonic();page=ctx.new_page();enter(page)
    capture(page,'combat-01-formation')
    assert page.locator('.combat-stack[data-side="0"]').count()>0 and page.locator('.combat-stack[data-side="1"]').count()>0
    page.wait_for_timeout(900)
    page.locator('[data-battle-choice="stance"][data-value="assault"]').click()
    page.locator('.manual-battle-panel [data-action="battleCommand"]').click()
    page.locator('.combat-shared-stage[data-active="true"]').wait_for()
    mark=time.monotonic()-start;videoMarks.append({'scene':'live-exchange','seconds':mark})
    # Inspect actual computed coordinates and clip visibility during a real exchange.
    samples=[];t=time.monotonic()
    for ms,name in [(120,'approach'),(500,'impact'),(950,'withdraw'),(1800,'rest')]:
        page.wait_for_timeout(max(0,int(ms-(time.monotonic()-t)*1000)))
        info=page.evaluate("""()=>[...document.querySelectorAll('.combat-stack')].map(e=>({id:e.dataset.stackId,side:e.dataset.side,x:e.getBoundingClientRect().x,advance:e.classList.contains('is-advancing'),visible:[...e.querySelectorAll('.combat-rank:first-child .combat-source-sprite')].filter(s=>getComputedStyle(s).visibility==='visible').map(s=>s.className)}))""")
        samples.append({'ms':ms,'stacks':info})
        capture(page,'combat-02-'+name)
    moved=any(abs(a['x']-b['x'])>12 for a in samples[0]['stacks'] for b in samples[-1]['stacks'] if a['id']==b['id'] and a['side']==b['side'])
    assert moved, samples
    fx=page.locator('.combat-impact')
    assert fx.count()>0
    audit.append({'motionVerified':moved,'samples':samples,'effects':fx.count(),'effectTargets':fx.evaluate_all("(xs)=>xs.map(x=>x.dataset.targetSide)")})
    if page.locator('.manual-battle-panel [data-action="battleAuto"]').count():
        page.locator('.manual-battle-panel [data-action="battleAuto"]').click()
    page.locator('#primary-nav [data-view="reports"]').click()
    page.locator('[data-action="battleReplay"]').first.wait_for(timeout=30000)
    capture(page,'combat-03-settlement')
    page.locator('[data-action="battleReplay"]').first.click()
    page.locator('.replay-theater [data-renderer="shared-combat"]').wait_for()
    assert page.locator('.replay-theater .combat-source-sprite').count()>0
    videoMarks.append({'scene':'replay','seconds':time.monotonic()-start})
    page.wait_for_timeout(550);capture(page,'combat-04-replay')
    page.locator('[data-replay-play]').click()
    page.wait_for_timeout(4500)
    capture(page,'combat-05-replay-later')
    page.locator('[data-replay-close]').click()
    video=page.video;ctx.close();raw=video.path()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'actual-gameplay.mp4')],check=True)
    # Extract frames from the encoded video itself for independent visual review.
    for i,m in enumerate(videoMarks):
        for j,delta in enumerate([.15,.55,1.05]):
            subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(max(0,m['seconds']+delta)),'-i',str(OUT/'actual-gameplay.mp4'),'-frames:v','1','-vf','scale=960:-1','-q:v','3',str(OUT/f'video-frame-{i}-{j}.jpg')],check=True)
    c=browser.new_context(viewport={'width':844,'height':390},has_touch=True);mp=c.new_page();enter(mp)
    capture(mp,'combat-06-mobile-formation')
    mp.locator('[data-battle-choice="stance"][data-value="assault"]').click()
    mp.locator('.manual-battle-panel [data-action="battleCommand"]').click()
    mp.locator('.combat-shared-stage[data-active="true"]').wait_for()
    mp.wait_for_timeout(550);capture(mp,'combat-07-mobile-impact');c.close()
    browser.close()
(OUT/'audit.json').write_text(json.dumps({'lunaSha':os.environ['LUNA_SHA'],'captures':audit,'pageErrors':errors,'videoMarks':videoMarks,'note':'Real new-save combat; replay uses the same renderer, recorded stack counts and events. No simulated battle fixture.'},indent=2))
assert not errors,errors
assert all(x['width']==x['docWidth'] and x['broken']==0 for x in audit if 'screen' in x)
print('COMBAT: actual live exchange, motion, settlement, replay, mobile and video output PASS')
