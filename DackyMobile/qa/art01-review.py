import os, pathlib, json
from playwright.sync_api import sync_playwright
out=pathlib.Path("qa/art01-review");out.mkdir(parents=True,exist_ok=True)
ui_audit=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),args=["--no-sandbox"])
    for label,w,h in [("desktop",1280,720),("landscape",844,390),("portrait",390,844)]:
        ctx=browser.new_context(viewport={"width":w,"height":h},has_touch=label!="desktop")
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:4173/",wait_until="domcontentloaded",timeout=60000)
        page.locator('[data-form="new-game"] button').click(timeout=60000)
        camera=page.locator(".art01-camera")
        camera.wait_for()
        # Capture actual runtime before any potentially failing HUD assertion.
        page.evaluate("document.fonts.ready")
        page.locator('.art01-terrain').evaluate("(im)=>im.decode()")
        page.wait_for_function("Array.from(document.querySelectorAll('.city-building-art img')).every(i=>i.complete&&i.naturalWidth>0)",timeout=30000)
        page.screenshot(path=str(out/(label+"-initial-city.png")))
        page.locator('.art06-zone-tabs [data-zone="outer"]').click()
        page.locator('.art01-terrain').evaluate("(im)=>im.decode()")
        page.wait_for_function("Array.from(document.querySelectorAll('.city-building-art img')).every(i=>i.complete&&i.naturalWidth>0)",timeout=30000)
        page.screenshot(path=str(out/(label+"-initial-outer.png")))
        assert page.locator('.city-extra-plot[data-unlocked=true]').count()==9
        page.locator('.city-extra-plot[data-plot="o1"]').click()
        assert page.locator('.art10-plot-inspector').is_visible()
        assert page.locator('.art10-plot-choice').count()>=4
        assert page.locator('.art10-plot-choice button[data-building="farm"]').count()==1
        page.screenshot(path=str(out/(label+"-free-outer-plot.png")))
        page.locator('[data-action="cityClose"]').click()
        page.locator('.art06-zone-tabs [data-zone="inner"]').click()
        assert page.locator('.city-extra-plot[data-unlocked=true]').count()==28
        page.locator('.city-extra-plot[data-plot="i1"]').click()
        assert page.locator('.art10-plot-choice').count()>=7
        page.screenshot(path=str(out/(label+"-free-inner-plot.png")))
        page.locator('[data-action="cityClose"]').click()
        # A separate browser context contains a QA-only developed-city fixture,
        # rendered by the actual runtime and never published to player storage.
        if label=="desktop":
            developed=browser.new_context(viewport={"width":1648,"height":928})
            dp=developed.new_page()
            dp.goto("http://127.0.0.1:4173/",wait_until="domcontentloaded",timeout=60000)
            dp.evaluate("""async()=>{const {createNewGame}=await import('/src/engine.js');const {BUILDINGS}=await import('/src/catalog.js');const {saveGame}=await import('/src/store.js');const s=createNewGame('Triều Ca · QA thành phát triển',Date.now());for(const b of BUILDINGS)s.levels[b.id]=Math.min(8,b.maxLevel);s.cityPlots={i1:{buildingId:'housing',level:5},i2:{buildingId:'barracks',level:4},i3:{buildingId:'storehouse',level:4},o1:{buildingId:'farm',level:5},o2:{buildingId:'farm',level:3},o3:{buildingId:'grove',level:4},o4:{buildingId:'mine',level:4}};await saveGame(s);}""")
            dp.reload(wait_until="domcontentloaded",timeout=60000)
            dp.locator('.art01-camera').wait_for()
            dp.locator('.art01-terrain').evaluate("(im)=>im.decode()")
            dp.wait_for_function("Array.from(document.querySelectorAll('.city-building-art img')).every(i=>i.complete&&i.naturalWidth>0)",timeout=30000)
            dp.screenshot(path=str(out/"desktop-developed-city.png"))
            dp.locator('.art06-zone-tabs [data-zone="outer"]').click()
            dp.locator('.art01-terrain').evaluate("(im)=>im.decode()")
            dp.wait_for_function("Array.from(document.querySelectorAll('.city-building-art img')).every(i=>i.complete&&i.naturalWidth>0)",timeout=30000)
            dp.screenshot(path=str(out/"desktop-developed-outer.png"))
            developed.close()
        assert page.locator('.art07-toolbar').is_visible()
        assert page.locator('.art07-commands').is_visible()
        # R8 overlays controls rather than reserving a fixed right column.
        assert camera.bounding_box()['width']>=w-2
        scene=page.locator('#scene')
        normal_height=scene.bounding_box()['height']
        page.locator('.hud-open').click()
        page.locator('[data-hud-key="top"]').first.click()
        assert not page.locator('.topbar').is_visible()
        assert scene.bounding_box()['height']>normal_height
        page.locator('[data-hud-key="top"]').first.click()
        page.locator('[data-hud-key="nav"]').first.click()
        assert not page.locator('#primary-nav').is_visible(),page.locator('#primary-nav').evaluate("(el)=>({display:getComputedStyle(el).display,body:document.body.className})")
        page.locator('[data-hud-key="nav"]').first.click()
        page.locator('#hud-menu [data-hud-key="cityCommands"]').click()
        assert not page.locator('.art07-commands').is_visible()
        page.locator('#hud-menu [data-hud-key="cityCommands"]').click()
        page.locator('.hud-focus-button').click()
        assert not page.locator('.topbar').is_visible()
        assert not page.locator('#primary-nav').is_visible()
        assert not page.locator('.art07-toolbar').is_visible()
        assert page.locator('.hud-restore').is_visible()
        page.screenshot(path=str(out/(label+"-focus.png")))
        assert camera.bounding_box()['height']>=h-2,{'camera':camera.bounding_box(),'viewport':(w,h)}
        page.locator('.hud-restore').click()
        assert page.locator('.art07-toolbar').is_visible()
        assert page.locator('#primary-nav').is_visible()
        assert page.locator(".art01-city .city-building").count()==30
        assert page.locator(".art06-zone-tabs [data-zone=inner]").get_attribute("aria-pressed")=="true"
        page.evaluate("document.fonts.ready")
        page.wait_for_function("Array.from(document.querySelectorAll('.city-building-art img')).every(i=>i.complete&&i.naturalWidth>0)")
        assert page.locator('.art09-city').count()==1
        assert page.locator('.city-building[data-building=citadel] img').get_attribute('src').endswith('art09-buildings/citadel.webp')
        page.wait_for_timeout(800)
        page.screenshot(path=str(out/(label+"-city.png")))
        marker=page.locator('.city-building[data-building="citadel"]')
        marker.click()
        assert page.locator(".art01-inspector").is_visible()
        assert marker.get_attribute("aria-pressed")=="true"
        page.screenshot(path=str(out/(label+"-selected.png")))
        page.locator('[data-action="cityClose"]').click()
        page.locator('.art06-zone-tabs [data-zone="outer"]').click()
        assert page.locator(".art01-city .city-building").count()==37
        page.screenshot(path=str(out/(label+"-outer.png")))
        page.locator('.art06-zone-tabs [data-zone="inner"]').click()
        assert page.locator(".art01-city .city-building").count()==30
        assert page.locator('.art01-guide').is_visible()
        assert page.locator('.art01-queue').is_visible()
        page.locator('.art07-command-head [data-action="cityDirectory"]').click()
        assert page.locator('.art01-directory-item').count()==27
        page.locator('.art01-directory-item[data-building="lumber"]').click()
        assert page.locator('.art01-inspector').is_visible()
        assert page.locator('.city-building[data-plot="b-lumber"]').get_attribute("aria-pressed")=="true"
        assert page.locator(".art06-zone-tabs [data-zone=outer]").get_attribute("aria-pressed")=="true"
        page.screenshot(path=str(out/(label+"-directory-selection.png")))
        assert page.locator('.art07-command-content .art01-inspector').is_visible()
        page.keyboard.press('Escape')
        assert page.locator('.art01-inspector').count()==0
        page.locator('[data-action="cityZoom"]').click()
        assert not page.locator('.art01-overview').count()
        page.locator('[data-action="cityZoom"]').click()
        assert page.locator('.art01-overview').count()==1
        page.screenshot(path=str(out/(label+"-overview.png")))
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
        # All screens share the same shell and restore control.
        if label=='desktop':
            for view in ('heroes','army','inventory','world','pve','tech','quests','market','reports','settings','library'):
                page.locator('#primary-nav [data-view="'+view+'"]').click()
                page.screenshot(path=str(out/('normal-'+view+'.png')))
                ui_audit.append({'viewport':label,'screen':view,**page.evaluate('''()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,sceneWidth:document.querySelector("#scene")?.scrollWidth||0,visibleBrokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().width>0).length})''')})
                page.keyboard.press('F2')
                assert not page.locator('.topbar').is_visible()
                assert not page.locator('#primary-nav').is_visible()
                assert page.locator('.hud-restore').is_visible()
                page.screenshot(path=str(out/('focus-'+view+'.png')))
                page.locator('.hud-restore').click()
                assert page.locator('#primary-nav').is_visible()
        assert not errors,errors
        ctx.close()
    flow=browser.new_context(viewport={"width":1280,"height":720})
    fp=flow.new_page()
    flow_errors=[]
    fp.on("pageerror",lambda error: flow_errors.append(str(error)))
    fp.goto("http://127.0.0.1:4173/",wait_until="domcontentloaded",timeout=60000)
    fp.locator('[data-form="new-game"] button').click()
    fp.locator(".art01-camera").wait_for()
    fp.screenshot(path=str(out/"new-save-before-building.png"))
    fp.locator('.city-extra-plot[data-plot="b-altar"]').click()
    build=fp.locator('[data-action="upgradePlot"][data-plot="b-altar"][data-building="altar"]')
    assert build.is_enabled()
    build.click()
    fp.wait_for_function("document.querySelector('.city-extra-plot[data-plot=\"b-altar\"]')?.dataset.buildingState==='building'",timeout=5000)
    assert not any("Cannot access" in toast for toast in fp.locator("#toast-stack .toast").all_text_contents())
    fp.wait_for_function("document.querySelector('.city-extra-plot[data-plot=\"b-altar\"]')?.dataset.buildingState==='built'",timeout=30000)
    assert not flow_errors,flow_errors
    fp.screenshot(path=str(out/"new-save-building-complete.png"))
    fp.locator('#primary-nav [data-view="heroes"]').click()
    fp.locator('[data-open-hero-support]').click()
    recruit=fp.locator('[data-action="recruit"]:visible:not([disabled])').first
    assert recruit.count()==1, "finished source-cost building should unlock ordinary hero recruitment"
    before=fp.evaluate("async()=>{const {loadGame}=await import('./src/store.js');return (await loadGame()).heroes.length}")
    recruit.click()
    fp.wait_for_function("async()=>{const {loadGame}=await import('./src/store.js');return (await loadGame()).heroes.length>1}",timeout=10000)
    assert not flow_errors,flow_errors
    fp.screenshot(path=str(out/"new-save-hero-recruited.png"))
    assert fp.evaluate("async()=>{const {loadGame}=await import('./src/store.js');return (await loadGame()).heroes.length}")>before
    fp.reload(wait_until="domcontentloaded",timeout=60000)
    fp.locator('#primary-nav [data-view="heroes"]').wait_for()
    restored=fp.evaluate("async()=>{const {loadGame}=await import('./src/store.js');const s=await loadGame();return {heroes:s.heroes.length,altar:s.levels.altar}}")
    assert restored["heroes"]>before and restored["altar"]>=1,restored
    assert not flow_errors,flow_errors
    fp.screenshot(path=str(out/"new-save-after-reload.png"))
    flow.close()
    browser.close()
(out/"ui-audit.json").write_text(json.dumps(ui_audit,indent=2))
print("ART01 technical preview PASS; visual approval remains OWNER HOLD")
