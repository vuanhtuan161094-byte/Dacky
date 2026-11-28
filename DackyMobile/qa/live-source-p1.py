import json, pathlib
from playwright.sync_api import sync_playwright
out=pathlib.Path('qa/total-finalization');out.mkdir(parents=True,exist_ok=True)
audit=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for label,w,h in [('desktop',1440,900),('mobile-landscape',844,390)]:
        page=browser.new_page(viewport={'width':w,'height':h})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto('http://127.0.0.1:4173/',wait_until='domcontentloaded',timeout=60000)
        page.locator('[data-form="new-game"] button').click(timeout=60000)
        page.locator('#primary-nav [data-view="heroes"]').click()
        for key in ('stats','growth','skills','formation'):
            page.locator('[data-live-hero-tab="'+key+'"]').click()
            assert page.locator('[data-live-hero-panel="'+key+'"]:not([hidden])').count()>0
            assert page.locator('[data-live-hero-tab="'+key+'"]').get_attribute('aria-pressed')=='true'
            page.evaluate('document.fonts.ready')
            page.screenshot(path=str(out/(label+'-hero-'+key+'.png')))
        page.locator('#primary-nav [data-view="events"]').click()
        assert page.locator('.p2-event-card').count()>=4
        page.screenshot(path=str(out/(label+'-events-before.png')))
        page.locator('[data-action="spinPrize"]').click()
        assert '1/6' in page.locator('.p2-event-card').first.inner_text()
        page.locator('[data-event-tab="collection"]').click()
        assert page.locator('.p2-collection-row').count()==4
        page.screenshot(path=str(out/(label+'-collections.png')))
        page.locator('[data-event-tab="offers"]').click()
        page.screenshot(path=str(out/(label+'-offers.png')))
        page.locator('[data-event-tab="ranking"]').click()
        page.screenshot(path=str(out/(label+'-ranking.png')))
        for view in ('city','army','inventory','world','pve','tech','quests','market','reports','settings','library'):
            page.locator('#primary-nav [data-view="'+view+'"]').click()
            page.evaluate('document.fonts.ready')
            page.screenshot(path=str(out/(label+'-'+view+'.png')))
        audit.append({'viewport':label,'pageErrors':errors})
        assert not errors,errors
        page.close()
    browser.close()
(out/'p1-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
