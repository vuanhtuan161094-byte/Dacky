import json, pathlib, traceback, datetime, os
from playwright.sync_api import sync_playwright
out=pathlib.Path('qa/playtest');out.mkdir(exist_ok=True)
fixture=json.loads((out/'advanced.json').read_text())
KEY='dacky-mobile-save-v1'
T=datetime.datetime(2026,11,28,9,tzinfo=datetime.timezone.utc)
records=[]
def rec(name,status,detail=''):
    records.append(dict(name=name,status=status,detail=str(detail)[:1200]))
    print('PLAYTEST',status,name,str(detail)[:300],flush=True)
def state(p):
    return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k)||"null")',KEY)
def wait_state(p, predicate, timeout=6000):
    # Read actual persisted state, not engine calls or mocked outcomes.
    return p.wait_for_function('(k)=>!!localStorage.getItem(k)',KEY,timeout=timeout) if predicate is None else wait_pred(p,predicate,timeout)
def wait_pred(p,predicate,timeout):
    import time
    end=time.monotonic()+timeout/1000
    while time.monotonic()<end:
        s=state(p)
        if s and predicate(s):return s
        p.wait_for_timeout(65)
    raise AssertionError('Persisted result not observed; UI: '+p.locator('body').inner_text()[-450:])
def nav(p,v):
    if p.locator('[data-replay-close]').count():p.locator('[data-replay-close]').click()
    p.locator('#primary-nav [data-view="'+v+'"]').click(timeout=3500)
def click(p,selector,pred=None):
    loc=p.locator(selector).filter(visible=True).first
    loc.click(timeout=3500)
    if pred:return wait_state(p,pred)
def action(p,a,pred=None,extra=''):
    return click(p,'[data-action="'+a+'"]:not([disabled])'+extra,pred)
def tab(p,attr,value):
    click(p,'['+attr+'="'+value+'"]')
def jump(p,ms):
    p.clock.fast_forward(int(ms)+1200)
def finish(p,key,check):
    q=state(p)['queues'][key]
    assert q and q['finishAt']
    jump(p,max(0,q['finishAt']-p.evaluate('Date.now()')))
    return wait_state(p,check)
def act_count(p,a):
    return state(p)['gameplay']['actions'].get(a,0)
def tracked(p,a,extra=''):
    n=act_count(p,a)
    return action(p,a,lambda s:s['gameplay']['actions'].get(a,0)>n,extra)
def case(p,name,fn):
    try:
        fn()
        rec(name,'PASS')
    except Exception as e:
        rec(name,'FAIL',e)
        try:p.screenshot(path=str(out/('fail-%03d.png'%len(records))))
        except:pass
def boot(browser,advanced=False,offline=False):
    ctx=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True,service_workers='block' if offline else 'allow')
    p=ctx.new_page()
    p.clock.install(time=T)
    errors=[]
    p.on('pageerror',lambda e:errors.append(str(e)))
    if advanced:
        p.add_init_script('if(!localStorage.getItem('+json.dumps(KEY)+'))localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(advanced if isinstance(advanced,dict) else fixture))+');')
    p.goto('http://127.0.0.1:4173/'+('offline.html' if offline else ''),wait_until='domcontentloaded',timeout=90000)
    if not advanced:
        p.locator('[data-form="new-game"] button').click(timeout=15000)
    p.locator('#primary-nav [data-view="city"]').wait_for(timeout=15000)
    wait_state(p,lambda s:bool(s['profile']['name']))
    return ctx,p,errors
def city_upgrade(p):
    nav(p,'city')
    click(p,'[data-action="cityDirectory"]')
    loc=p.locator('[data-action="cityLocate"][data-building="citadel"]').first
    loc.click(timeout=3500)
    old=state(p)['levels']['citadel']
    action(p,'upgrade',lambda s:bool(s['queues']['construction']), '[data-building="citadel"]')
    finish(p,'construction',lambda s:s['levels']['citadel']>old and not s['queues']['construction'])
def train(p):
    nav(p,'army');p.locator('#train-count').fill('2')
    old=state(p)['stats']['troopsTrained']
    action(p,'train',lambda s:bool(s['queues']['training']))
    finish(p,'training',lambda s:s['stats']['troopsTrained']>=old+2)
def research(p):
    nav(p,'tech')
    btn=p.locator('[data-action="research"]:not([disabled])').first
    k=btn.get_attribute('data-tech');old=state(p)['technologies'][k]
    btn.click(timeout=3500);wait_state(p,lambda s:bool(s['queues']['research']))
    finish(p,'research',lambda s:s['technologies'][k]>old)
def hero_tab(p,key):
    nav(p,'heroes')
    if p.locator('.hero-support-drawer[open]').count():click(p,'.hero-support-drawer > summary')
    tab(p,'data-live-hero-tab',key)
def equip(p):
    nav(p,'inventory');click(p,'[data-bag-item="item-01"]')
    old=state(p)['stats']['itemsEquipped']
    action(p,'equip',lambda s:s['stats']['itemsEquipped']>old)
def battle(p,mode='squad-auto'):
    nav(p,'world')
    click(p,'[data-action="selectNode"][data-node="node-001"]')
    p.locator('#combat-mode').select_option(mode)
    old=state(p)['stats']['battles']
    p.locator('#march-count').fill('18' if state(p)['army'][p.locator('#march-unit').input_value()]<1000 else '5000')
    action(p,'march',lambda s:bool(s['queues']['march']))
    q=state(p)['queues']['march'];assert q['squadMode'],q
    if mode=='squad':
        jump(p,q['finishAt']-p.evaluate('Date.now()'))
        wait_state(p,lambda s:bool((s['queues']['march'] or {}).get('arrivedAt')))
        action(p,'battleCommand',lambda s:s['stats']['battles']>old or bool((s['queues']['march'] or {}).get('battleCommands')))
        if state(p)['queues']['march']:
            action(p,'battleAuto',lambda s:s['stats']['battles']==old+1)
    else:finish(p,'march',lambda s:s['stats']['battles']==old+1 and not s['queues']['march'])
    assert state(p)['stats']['battles']==old+1
def replay(p):
    nav(p,'reports')
    action(p,'battleReplay')
    assert p.locator('.fidelity-arena').filter(visible=True).count()>0 or p.locator('dialog[open]').count()>0
    if p.locator('[data-replay-next]:not([disabled])').count():p.locator('[data-replay-next]').click()
    p.locator('[data-replay-speed]').click()
    p.locator('[data-replay-close]').click()
def event_tab(p,key):
    nav(p,'events');tab(p,'data-event-tab',key)
def gift(p):
    nav(p,'pve')
    tracked(p,'dailyReward')
    assert p.locator('[data-action="dailyReward"]').first.is_disabled()
def online(p):
    event_tab(p,'honors');jump(p,1000)
    # The actual foreground tick must unlock a gift; fixture is at 299 sec.
    action(p,'claimOnlineGift',lambda s:'5' in s['gameplay']['r4']['onlineClaims'],'[data-minutes="5"]')
def garrison(p):
    nav(p,'world');c=next(x for x in state(p)['cities'] if not x['isCapital'])['id']
    unit=p.locator('[data-garrison-unit="'+c+'"]').input_value()
    before=state(p)['army'][unit]
    p.locator('[data-garrison-count="'+c+'"]').fill('7')
    action(p,'setGarrison',lambda s:s['gameplay']['r4']['garrisons'].get(c,{}).get(unit)==7,'[data-city="'+c+'"]')
    assert state(p)['army'][unit]==before-7
    action(p,'recallGarrison',lambda s:not s['gameplay']['r4']['garrisons'].get(c),'[data-city="'+c+'"]')
    assert state(p)['army'][unit]==before
def growth(p):
    hero_tab(p,'growth')
    action(p,'ascendHero',lambda s:s['heroes'][0]['ascended'])
    assert state(p)['heroes'][0]['level']==1
    action(p,'deifyHero',lambda s:s['heroes'][0]['deified'])
    old=state(p)['heroes'][0]['divineLevel']
    action(p,'trainDivine',lambda s:s['heroes'][0]['divineLevel']>old)
def skills(p):
    hero_tab(p,'skills')
    action(p,'learnCombatSkill',lambda s:len(s['heroes'][0]['combatSkills'])>0)
    action(p,'upgradeCombatSkill',lambda s:any(x['level']>1 for x in s['heroes'][0]['combatSkills'].values()))
    action(p,'advanceCombatSkill',lambda s:any(x['advanced'] for x in s['heroes'][0]['combatSkills'].values()))
def matrix(p):
    hero_tab(p,'skills')
    old=len(state(p)['heroes'][0]['matrices'])
    for d in p.locator('.live-growth details').all():
        if d.locator('[data-action="useMatrix"]:not([disabled])').count():d.locator('summary').click();break
    action(p,'useMatrix',lambda s:len(s['heroes'][0]['matrices'])>old)
    assert state(p)['heroes'][0]['activeMatrix']
def settings(p):
    nav(p,'settings')
    p.locator('#rename-city').fill('QA renamed')
    tracked(p,'rename')
    assert state(p)['profile']['name']=='QA renamed'
    p.locator('[data-setting="effects"]').uncheck()
    wait_state(p,lambda s:not s['settings']['effects'])
    with p.expect_download(timeout=5000) as d:action(p,'export')
    data=json.loads(pathlib.Path(d.value.path()).read_text())
    assert data['format']=='dacky-mobile-save' and data['save']['profile']['name']=='QA renamed'
    p.reload(wait_until='domcontentloaded')
    p.locator('#primary-nav [data-view="settings"]').wait_for()
    assert state(p)['profile']['name']=='QA renamed'
def trade(p):
    nav(p,'market')
    p.locator('#trade-from').select_option('food');p.locator('#trade-to').select_option('gold');p.locator('#trade-amount').fill('10')
    n=state(p)['stats']['tradeCount']
    click(p,'[data-form="trade"] button',lambda s:s['stats']['tradeCount']==n+1)
def claim_event(p,id):
    event_tab(p,'offers');action(p,'claimLiveEvent',lambda s:any(x.startswith(id+':') for x in s['gameplay']['liveEvents']['receipts']),'[data-event="'+id+'"]')
def pve(p,id):
    nav(p,'pve')
    p.locator('#combat-mode').select_option('squad-auto')
    p.locator('#pve-count').fill(str(min(100000,state(p)['army'][p.locator('#pve-unit').input_value()])))
    n=state(p)['stats']['battles']
    action(p,'pveMarch',lambda s:bool(s['queues']['march']),'[data-node="'+id+'"]')
    finish(p,'march',lambda s:s['stats']['battles']==n+1 and not s['queues']['march'])
def run():
 with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx,p,err=boot(browser)
    for name,fn in [
      ('new save',lambda:assert_save(p)),('daily reward',lambda:gift(p)),('city upgrade + accelerated queue',lambda:city_upgrade(p)),('training + accelerated queue',lambda:train(p)),('technology + accelerated queue',lambda:research(p)),('equip starter item',lambda:equip(p)),('hero training',lambda:(hero_tab(p,'growth'),tracked(p,'trainHero'))),('trade',lambda:trade(p)),('new game campaign battle',lambda:battle(p)),('battle replay',lambda:replay(p)),('daily spin',lambda:(event_tab(p,'activities'),action(p,'spinPrize',lambda s:s['gameplay']['liveProduct']['spins']==1))),('daily reset',lambda:(jump(p,86400000),gift(p))),('save/export/reload',lambda:settings(p))]:
        case(p,name,fn)
    rec('new save browser errors','PASS' if not err else 'FAIL',err)
    ctx.close()
    ctx,p,err=boot(browser,True)
    for name,fn in [
      ('advanced title claim',lambda:(event_tab(p,'honors'),tracked(p,'claimTitle','[data-title="builder"]'))),
      ('VIP daily reward',lambda:tracked(p,'claimVipGift')),
      ('foreground gift',lambda:online(p)),
      ('weekly mission',lambda:tracked(p,'claimWeekly','[data-mission="battle"]')),
      ('monthly mission',lambda:tracked(p,'claimMonthly')),
      ('collection claim',lambda:(event_tab(p,'collection'),action(p,'claimCollection',lambda s:len(s['gameplay']['liveProduct']['collectionClaims'])>0,'[data-collection="heroes"]'))),
      ('festival exchange',lambda:(event_tab(p,'activities'),action(p,'festivalExchange',lambda s:s['gameplay']['liveProduct']['tokens']<10))),
      ('travel timer',lambda:(jump(p,600000),action(p,'claimTravel',lambda s:s['gameplay']['liveProduct']['travelDue']==0))),
      ('starter event',lambda:claim_event(p,'first_topup')),
      ('Hoan Hi event',lambda:claim_event(p,'hoan_hi_set')),
      ('ascension / deification / divine growth',lambda:growth(p)),
      ('combat skill learn / upgrade / advanced',lambda:skills(p)),
      ('matrix unlock',lambda:matrix(p)),
      ('squad weighting',lambda:(hero_tab(p,'formation'),p.locator('[data-squad-weight]').fill('72'),tracked(p,'setSquadWeight'))),
      ('replenishment toggle',lambda:tracked(p,'setReplenish')),
      ('garrison / recall',lambda:garrison(p)),
      ('guild daily',lambda:(nav(p,'world'),tracked(p,'claimGuildMission'))),
      ('heal wounded',lambda:(nav(p,'army'),tracked(p,'heal'))),
      ('official promotion',lambda:official(p)),
      ('manual squad combat + settlement',lambda:battle(p,'squad')),
      ('manual replay',lambda:replay(p)),
      ('tower duel',lambda:(nav(p,'pve'),tracked(p,'duel','[data-mode="tower"]'))),
      ('Buzhou gate 1',lambda:pve(p,'buzhou:1')),
      ('legacy quest claim',lambda:(nav(p,'quests'),tracked(p,'claimSourceQuest'))),
      ('source library search',lambda:library(p)),
    ]:case(p,name,fn)
    rec('advanced browser errors','PASS' if not err else 'FAIL',err)
    ctx.close()
    ctx,p,err=boot(browser,False,True)
    ctx.set_offline(True)
    case(p,'single HTML offline real action',lambda:gift(p))
    rec('offline browser errors','PASS' if not err else 'FAIL',err)
    ctx.close();browser.close()
def assert_save(p):
    assert state(p)['profile']['name'] and len(state(p)['heroes'])==1
def official(p):
    nav(p,'city');p.locator('.city-management-drawer summary').click()
    old=state(p)['gameplay']['official']
    action(p,'officialPromote',lambda s:s['gameplay']['official']>old)
def library(p):
    nav(p,'library');p.locator('#source-query').fill('Na Tra')
    click(p,'[data-form="source-search"] button')
    assert p.locator('.source-entry-list').inner_text().strip()

def run_p2():
    meta=json.loads((out/'p2-meta.json').read_text())
    f2=json.loads((out/'advanced-p2.json').read_text())
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx,p,err=boot(browser,f2)
        seen=set()
        def scan():
            seen.update(p.locator('[data-action]').evaluate_all("(els)=>els.map(x=>x.dataset.action)"))
        def run_case(name,fn):
            case(p,'P2 '+name,fn)
            scan()
        def hero():
            return state(p)['heroes'][0]
        def bag(id):
            nav(p,'inventory');tab(p,'data-bag-tab','bag');tab(p,'data-bag-filter','all')
            click(p,'[data-bag-item="'+id+'"]')
        def buy(a):
            btn=p.locator('[data-action="'+a+'"]:not([disabled])').filter(visible=True).first
            id=btn.get_attribute('data-item');old=state(p)['items'].count(id)
            btn.click(timeout=3500);wait_state(p,lambda s:s['items'].count(id)>old)
            return id
        def recruit():
            nav(p,'heroes');click(p,'[data-open-hero-support]')
            btn=p.locator('.hero-recruit-card [data-action="recruit"]:not([disabled])').first
            id=btn.get_attribute('data-hero');gold=state(p)['resources']['gold'];jade=state(p)['resources']['jade']
            btn.click(timeout=3500);s=wait_state(p,lambda s:any(h['id']==id for h in s['heroes']))
            assert s['resources']['gold']<gold and s['resources']['jade']<jade
        def refresh():
            nav(p,'heroes')
            if not p.locator('.hero-support-drawer').get_attribute('open') and not p.locator('.hero-support-drawer').evaluate('(x)=>x.open'):click(p,'[data-open-hero-support]')
            tracked(p,'refreshRecruitment')
        def potential():
            hero_tab(p,'growth')
            before=hero().get('potential',{}).get('attack',0)
            action(p,'allocatePotential',lambda s:s['heroes'][0]['potential']['attack']==before+1,'[data-stat="attack"]')
        def repair():
            hero_tab(p,'stats')
            old=state(p)['resources']['gold']
            action(p,'repairGear',lambda s:s['heroes'][0]['combatDurability']['item-01']==100)
            assert state(p)['resources']['gold']<old
            assert p.locator('[data-action="repairGear"]').first.is_disabled()
        def enhance():
            hero_tab(p,'stats')
            old=state(p)['resources']['gold']
            tracked(p,'enhanceGear','[data-item="item-01"]')
            assert state(p)['resources']['gold']<old
            assert 'item-01' in hero()['gearEnhancements']
        def star():
            hero_tab(p,'stats')
            old=state(p)['items'].count('mobile-good-95601')
            action(p,'starUpGear',lambda s:s['heroes'][0]['gearEnhancements']['item-01']['stars']==1,'[data-item="item-01"]')
            assert state(p)['items'].count('mobile-good-95601')==old-1
        def socket():
            hero_tab(p,'stats')
            select=p.locator('[data-gem-select="'+hero()['id']+':item-01"]')
            select.select_option(meta['gem'])
            old=state(p)['items'].count(meta['gem'])
            action(p,'socketGearGem',lambda s:s['items'].count(meta['gem'])<old,'[data-item="item-01"]')
            # Failure consumes gem per documented rule; retry with spare gem to prove success.
            if meta['gem'] not in hero()['gearEnhancements']['item-01'].get('gems',[]):
                p.locator('[data-gem-select="'+hero()['id']+':item-01"]').select_option(meta['gem'])
                tracked(p,'socketGearGem','[data-item="item-01"]')
            assert meta['gem'] in hero()['gearEnhancements']['item-01']['gems']
        def rebirth():
            hero_tab(p,'growth')
            gold=state(p)['resources']['gold'];root=hero().get('rootBonus',0)
            action(p,'rebirthHero',lambda s:s['heroes'][0].get('rebirths',0)==1)
            assert hero()['level']==1 and hero()['rootBonus']==root+1 and state(p)['resources']['gold']<gold
            assert p.locator('[data-action="rebirthHero"]').first.is_disabled()
        def forge_sell():
            nav(p,'inventory');tab(p,'data-bag-tab','forge');id=buy('forge')
            bag(id);old=state(p)['items'].count(id)
            action(p,'sellItem',lambda s:s['items'].count(id)==old-1)
        def merchant():
            nav(p,'inventory');tab(p,'data-bag-tab','merchant');buy('buyItem')
        def exchange():
            id=meta['exchange'];assert id
            bag(id);old=state(p)['items'].count(id);army=sum(state(p)['army'].values())
            action(p,'exchangeItem',lambda s:s['items'].count(id)==old-1)
            assert sum(state(p)['army'].values())==army+1
        def flag():
            id=meta['flag'];assert id
            bag(id);old=state(p)['items'].count(id)
            p.locator('[data-item-flag="'+id+'"]').select_option('商')
            action(p,'useItem',lambda s:s['gameplay']['flag']=='商' and s['items'].count(id)==old-1)
        def plot():
            nav(p,'city')
            btn=p.locator('[data-action="cityPlotSelect"][data-occupied="false"][data-unlocked="true"]').filter(visible=True).first
            id=btn.get_attribute('data-plot');btn.click(timeout=3500)
            action(p,'upgradePlot',lambda s:bool(s['queues']['construction']),'[data-plot="'+id+'"]')
            finish(p,'construction',lambda s:id in s['cityPlots'])
            click(p,'[data-action="cityPlotSelect"][data-plot="'+id+'"]')
            p.once('dialog',lambda d:d.accept())
            action(p,'demolishPlot',lambda s:id not in s['cityPlots'])
        def city_admin():
            nav(p,'city')
            drawer=p.locator('.city-management-drawer')
            if not drawer.evaluate('(x)=>x.open'):drawer.locator('summary').click()
            p.locator('#tax-rate').select_option('25');action(p,'setTaxRate',lambda s:s['gameplay']['taxRate']==25)
            p.locator('#labor-rate').select_option('75');action(p,'setLaborRate',lambda s:s['gameplay']['laborRate']==75)
        def city_action(a):
            nav(p,'city')
            drawer=p.locator('.city-management-drawer')
            if not drawer.evaluate('(x)=>x.open'):drawer.locator('summary').click()
            tracked(p,a)
        def scout():
            nav(p,'world');click(p,'[data-action="selectNode"][data-node="'+meta['uncaptured']+'"]')
            n=len(state(p)['reports']);action(p,'scout',lambda s:len(s['reports'])>n)
            assert state(p)['reports'][0]['type']=='scout' or state(p)['reports'][-1]['type']=='scout'
        def diplomacy():
            nav(p,'world');click(p,'[data-action="selectNode"][data-node="'+meta['uncaptured']+'"]')
            n=len(state(p)['reports']);action(p,'diplomacy',lambda s:len(s['reports'])>n)
        def strategic():
            nav(p,'world');p.locator('#spell-target').select_option(meta['uncaptured'])
            old=state(p)['items'].count('mobile-good-4912')
            action(p,'strategicCast',lambda s:s['items'].count('mobile-good-4912')<old)
        def city_level():
            nav(p,'city');c=meta['city'];lv=next(x['level'] for x in state(p)['cities'] if x['id']==c)
            drawer=p.locator('.city-management-drawer')
            if not drawer.evaluate('(x)=>x.open'):drawer.locator('summary').click()
            action(p,'upgradeCity',lambda s:bool(s['queues']['construction']),'[data-city="'+c+'"]')
            finish(p,'construction',lambda s:next(x['level'] for x in s['cities'] if x['id']==c)>lv)
        def import_save():
            nav(p,'settings')
            with p.expect_download() as d:action(p,'export')
            data=json.loads(pathlib.Path(d.value.path()).read_text())
            data['save']['profile']['name']='QA imported'
            p.locator('#import-file').set_input_files({'name':'qa-import.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
            click(p,'[data-dialog-confirm]',lambda s:s['profile']['name']=='QA imported')
            p.reload(wait_until='domcontentloaded');p.locator('#primary-nav [data-view="city"]').wait_for()
            assert state(p)['profile']['name']=='QA imported'
        def choose_reward():
            event_tab(p,'offers');action(p,'claimStarterDay',lambda s:s['gameplay']['liveProduct']['choice']=='hero')
            n=len(state(p)['heroes'])
            action(p,'chooseEventReward',lambda s:len(s['heroes'])==n+1 and not s['gameplay']['liveProduct']['choice'])
        def select_pool():
            event_tab(p,'activities');action(p,'selectPrizePool',lambda s:s['gameplay']['liveProduct']['pool']=='jade','[data-pool="jade"]')
        def travel():
            event_tab(p,'activities');action(p,'travelDice',lambda s:s['gameplay']['liveProduct']['travelUsed']==1)
        def mountain():
            nav(p,'pve')
            btn=p.locator('[data-action="pveMarch"][data-node^="elfland:"]:not([disabled])').filter(visible=True).first
            id=btn.get_attribute('data-node');pve(p,id)
        def boss():
            nav(p,'world')
            # Select the chapter containing the final boss using the actual chapter selector.
            sel=p.locator('#world-chapter')
            if sel.count():sel.select_option(sel.locator('option').last.get_attribute('value'))
            click(p,'[data-action="selectNode"][data-node="'+meta['boss']+'"]')
            old=state(p)['stats']['battles']
            p.locator('#march-count').fill(str(min(100000,int(p.locator('#march-count').get_attribute('max')))))
            action(p,'march',lambda s:bool(s['queues']['march']))
            finish(p,'march',lambda s:s['stats']['battles']==old+1)
        for name,fn in [
          ('recruit and payment',recruit),('refresh recruitment',refresh),('allocate potential',potential),
          ('repair and lock after repair',repair),('enhance equipment',enhance),('star stone consumption',star),('compatible gem socket',socket),
          ('forge then sell',forge_sell),('buy consumable',merchant),('buy artifact',lambda:(nav(p,'market'),buy('buyArtifact'))),
          ('exchange item for troop',exchange),('use flag voucher',flag),
          ('build and demolish extra plot',plot),('set tax and labor',city_admin),
          *[(a,lambda a=a:city_action(a)) for a in ['bless','sacrifice','settlePopulation','disciplineLabor','relieveLabor','collectLaborTaxes','worldChat']],
          ('scout report',scout),('NPC diplomacy',diplomacy),('strategic spell and pouch cost',strategic),
          ('guild upgrade',lambda:(nav(p,'world'),tracked(p,'guild'))),('guild donate',lambda:(p.locator('#guild-donate').fill('100'),tracked(p,'guildDonate'))),
          ('upgrade captured city',city_level),('redeem vouchers',lambda:(nav(p,'market'),tracked(p,'redeemQuestVouchers'))),
          ('tax policy',lambda:tracked(p,'setTaxPolicy','[data-policy="relief"]')),
          ('prize pool choice',select_pool),('spin milestone',lambda:action(p,'claimSpinMilestone',lambda s:5 in s['gameplay']['liveProduct']['spinClaims'],'[data-milestone="5"]')),
          ('dice travel',travel),('festival pray',lambda:action(p,'claimFestival',lambda s:'pray' in s['gameplay']['liveProduct']['festivalClaims'],'[data-festival="pray"]')),
          ('war reward',lambda:action(p,'claimWar',lambda s:s['gameplay']['liveProduct']['warClaimed'])),
          ('rank milestone',lambda:(event_tab(p,'ranking'),action(p,'claimRank',lambda s:len(s['gameplay']['liveProduct']['rankClaims'])>0))),
          ('starter reward choice',choose_reward),('rebirth, root and level reset',rebirth),
          ('import exported save',import_save),
          ('mountain battle',mountain),('final boss battle',boss)
        ]:run_case(name,fn)
        rec('P2 browser errors','PASS' if not err else 'FAIL',err)
        (out/'p2-visible-actions.json').write_text(json.dumps(sorted(seen),ensure_ascii=False))
        print('P2_VISIBLE_ACTIONS='+json.dumps(sorted(seen)),flush=True)
        ctx.close();browser.close()

try:run();run_p2()
except Exception as e:rec('test harness','FAIL',traceback.format_exc())
(out/'results.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('PLAYTEST_RESULT='+json.dumps(records,ensure_ascii=False),flush=True)
print('PLAYTEST_SUMMARY='+json.dumps({k:sum(r['status']==k for r in records) for k in ['PASS','FAIL']}),flush=True)
