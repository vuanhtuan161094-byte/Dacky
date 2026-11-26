"""Smoke the final web build in Chromium and capture the player screens."""
import argparse
import pathlib
import tempfile
import subprocess
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4173/')
parser.add_argument('--out', type=pathlib.Path, default=pathlib.Path('qa/one-game'))
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as browser_manager, tempfile.TemporaryDirectory(prefix='dacky-replay-') as frames:
    browser = browser_manager.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()
    page.set_default_timeout(18000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))

    frame_number = 0
    def record(duration=3):
        global frame_number
        for _ in range(duration):
            page.screenshot(path=f'{frames}/{frame_number:03}.jpg', type='jpeg', quality=82)
            frame_number += 1
            page.wait_for_timeout(100)

    page.goto(args.url, wait_until='domcontentloaded')
    page.locator('[data-form="new-game"]').wait_for()
    page.screenshot(path=str(args.out / '00-start.png'))
    page.locator('[data-form="new-game"] button').click()
    page.locator('[data-view="world"]').first.wait_for()
    record(5)
    page.locator('[data-view="world"]').first.click()
    page.locator('#combat-mode').select_option('manual')
    page.locator('[data-node="node-011"]').first.click()
    page.locator('#march-count').fill('18')
    page.locator('[data-action="march"]').first.click()
    page.locator('.manual-battle-panel [data-action="battleCommand"]').wait_for(timeout=30000)
    page.locator('.manual-battle-panel').scroll_into_view_if_needed()
    assert 'Chưa có quân' not in page.locator('.target-card').inner_text()
    assert 'Quân ta tại Vân Mộng Đài' in page.locator('.target-card').inner_text()
    page.screenshot(path=str(args.out / 'manual-battle.png'))
    page.locator('#battle-stance').select_option('assault')
    page.locator('.manual-battle-panel [data-action="battleCommand"]').click()
    if page.locator('.manual-battle-panel [data-action="battleAuto"]').count():
        page.locator('.manual-battle-panel [data-action="battleAuto"]').click()
    page.locator('[data-view="reports"]').first.click()
    page.locator('[data-action="battleReplay"]').wait_for(timeout=20000)
    page.locator('[data-action="battleReplay"]').first.click()
    page.locator('.battle-replay').wait_for()
    page.screenshot(path=str(args.out / '17-replay.png'))
    for _ in range(5):
        record(3)
        if page.locator('[data-replay-next]').is_enabled():
            page.locator('[data-replay-next]').click()
    page.locator('[data-replay-close]').click()
    for view in ('city', 'heroes', 'inventory', 'army', 'world', 'pve', 'tech',
                 'quests', 'market', 'reports', 'settings', 'library'):
        page.locator(f'[data-view="{view}"]').first.click()
        page.locator('#scene').wait_for()
        page.screenshot(path=str(args.out / f'{view}.png'))
    page.locator('[data-view="pve"]').first.click()
    assert page.locator('#elfland-source-select option').count() == 624
    assert page.locator('[data-node^="advanced:"]').count() == 25
    page.locator('[data-action="dailyReward"]').click()
    page.locator('[data-action="dailyReward"]:disabled').wait_for()
    page.evaluate('navigator.serviceWorker.ready')
    context.set_offline(True)
    page.reload(wait_until='domcontentloaded')
    page.locator('[data-view="pve"]').first.wait_for()
    page.locator('[data-action="dailyReward"]:disabled').wait_for()
    page.screenshot(path=str(args.out / 'pwa-offline.png'))
    context.set_offline(False)

    mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    handset = mobile.new_page()
    handset.on('pageerror', lambda error: errors.append(str(error)))
    handset.goto(args.url, wait_until='domcontentloaded')
    handset.locator('[data-form="new-game"] button').click()
    handset.locator('#mobile-nav [data-view="pve"]').first.click()
    handset.locator('#elfland-source-select').wait_for()
    assert handset.evaluate('document.documentElement.scrollWidth <= innerWidth')
    handset.screenshot(path=str(args.out / 'pve-mobile.png'))
    handset.set_viewport_size({'width':844,'height':390})
    handset.screenshot(path=str(args.out / 'pve-landscape.png'))

    standalone = browser.new_context(service_workers='block')
    offline = standalone.new_page()
    offline.on('pageerror', lambda error: errors.append(str(error)))
    external = []
    offline.on('request', lambda request: external.append(request.url) if not request.url.startswith((args.url, 'data:')) else None)
    offline.goto(args.url + 'offline.html', wait_until='domcontentloaded', timeout=45000)
    offline.locator('[data-form="new-game"] button').click()
    offline.locator('[data-view="pve"]').first.click()
    assert offline.locator('#elfland-source-select option').count() == 624
    assert not external, external
    assert not errors, errors
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '4', '-i',
                    f'{frames}/%03d.jpg', '-vf', 'format=yuv420p', '-c:v', 'libx264',
                    str(args.out / 'battle-replay.mp4')], check=True)
    print('Web / real battle and replay / 12 screens / offline PWA and HTML / handset: PASS')
