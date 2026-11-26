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
        assert page.locator(".art01-city .city-building").count()==27
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(800)
        page.screenshot(path=str(out/(label+"-city.png")))
        marker=page.locator('.city-building[data-building="citadel"]')
        marker.click()
        assert page.locator(".art01-inspector").is_visible()
        assert marker.get_attribute("aria-pressed")=="true"
        page.screenshot(path=str(out/(label+"-selected.png")))
        page.locator('[data-action="cityClose"]').click()
        page.locator('[data-action="cityZoom"]').click()
        page.screenshot(path=str(out/(label+"-overview.png")))
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
        assert not errors,errors
        ctx.close()
    browser.close()
print("ART01 technical preview PASS; visual approval remains OWNER HOLD")
