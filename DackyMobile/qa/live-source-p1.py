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
    battle=browser.new_page(viewport={'width':1280,'height':720})
    battle_errors=[]
    battle.on('pageerror',lambda error:battle_errors.append(str(error)))
    battle.goto('http://127.0.0.1:4173/combat-product.html?squadSmoke=1',wait_until='domcontentloaded',timeout=90000)
    assert battle.locator('body').get_attribute('data-squad-smoke')=='PASS'
    frames=out/'battle-frames';frames.mkdir(exist_ok=True)
    frame=0
    def capture_round(n):
        global frame
        for _ in range(n):
            battle.screenshot(path=str(frames/('frame-%04d.png'%frame)))
            frame+=1
            battle.wait_for_timeout(110)
    capture_round(8)
    for _ in range(8):
        command=battle.locator('[data-action="battleCommand"]')
        if not command.count() or not command.first.is_visible():break
        command.first.click()
        battle.wait_for_timeout(250)
        capture_round(8)
    if battle.locator('[data-action="battleAuto"]').count() and battle.locator('[data-action="battleAuto"]').first.is_visible():
        battle.locator('[data-action="battleAuto"]').first.click()
        battle.wait_for_timeout(400)
    battle.screenshot(path=str(out/'battle-after.png'))
    assert not battle_errors,battle_errors
    battle.close()
    browser.close()
(out/'p1-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))

# Visual evidence small enough for text-only CI inspection (actual runtime, not a mockup).
from PIL import Image, ImageOps, ImageDraw
import base64, io
names=['desktop-city.png','desktop-hero-stats.png','desktop-events-before.png','desktop-collections.png','desktop-world.png','desktop-inventory.png','desktop-hero-formation.png','battle.png']
sheet=Image.new('RGB',(1000,4*300),'#1c2622');draw=ImageDraw.Draw(sheet)
for i,name in enumerate(names):
    file=out/name
    if not file.exists():continue
    im=Image.open(file).convert('RGB');im.thumbnail((490,275))
    x=(i%2)*500;y=(i//2)*300
    sheet.paste(im,(x+(500-im.width)//2,y+20));draw.text((x+8,y+4),name,fill='white')
sheet.save(out/'review-sheet.jpg',quality=75)
# Smaller preview for inline inspection from workflow logs.
thumb=sheet.copy();thumb.thumbnail((760,920));buf=io.BytesIO();thumb.save(buf,format='JPEG',quality=40)
print('DACKY_REVIEW_JPEG_BASE64='+base64.b64encode(buf.getvalue()).decode())
