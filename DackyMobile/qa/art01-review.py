import os, pathlib
from playwright.sync_api import sync_playwright
out=pathlib.Path("qa/art01-review");out.mkdir(parents=True,exist_ok=True)
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
        page.locator('.art06-zone-tabs [data-zone="inner"]').click()
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
        page.locator('[data-hud-key="cityCommands"]').first.click()
        assert not page.locator('.art07-commands').is_visible()
        page.locator('[data-hud-key="cityCommands"]').first.click()
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
        assert page.locator(".art01-city .city-building").count()==21
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
        assert page.locator(".art01-city .city-building").count()==6
        page.screenshot(path=str(out/(label+"-outer.png")))
        page.locator('.art06-zone-tabs [data-zone="inner"]').click()
        assert page.locator(".art01-city .city-building").count()==21
        assert page.locator('.art01-guide').is_visible()
        assert page.locator('.art01-queue').is_visible()
        page.locator('.art07-command-head [data-action="cityDirectory"]').click()
        assert page.locator('.art01-directory-item').count()==27
        page.locator('.art01-directory-item[data-building="lumber"]').click()
        assert page.locator('.art01-inspector').is_visible()
        assert page.locator('.city-building[data-building="lumber"]').get_attribute("aria-pressed")=="true"
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
                page.keyboard.press('F2')
                assert not page.locator('.topbar').is_visible()
                assert not page.locator('#primary-nav').is_visible()
                assert page.locator('.hud-restore').is_visible()
                page.screenshot(path=str(out/('focus-'+view+'.png')))
                page.locator('.hud-restore').click()
                assert page.locator('#primary-nav').is_visible()
        assert not errors,errors
        ctx.close()
    browser.close()
print("ART01 technical preview PASS; visual approval remains OWNER HOLD")
