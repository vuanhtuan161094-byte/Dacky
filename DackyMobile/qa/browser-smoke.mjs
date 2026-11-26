import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const baseUrl = process.env.DACKY_REVIEW_URL || 'http://127.0.0.1:4173/';
const baseOrigin = new URL(baseUrl).origin;
const landscapeOnly = process.env.DACKY_LANDSCAPE_ONLY === '1';
const outDir = path.resolve(process.env.DACKY_SCREENSHOT_DIR || 'qa/screenshots');
const recordGameplay = process.env.DACKY_RECORD_GAMEPLAY === '1';
const videoPath = path.resolve(process.env.DACKY_VIDEO_PATH || 'qa/one-game/gameplay-visual-remake.mp4');
await mkdir(outDir,{recursive:true});
const profile = await mkdtemp(path.join(os.tmpdir(),'dacky-chromium-'));
const browser = spawn('/usr/bin/chromium',[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-background-networking',
  '--disable-extensions','--disable-default-apps','--no-first-run','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'--window-size=1440,1000',baseUrl
],{stdio:'ignore'});
let socket;
let recorder;
let frameCapture;
let recordingActive=false;
let recordingStartedAt=0;
const pending=new Map();
const errors=[];
const externalRequests=new Set();
let nextId=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=condition=>{if(!condition)throw new Error('QA assertion failed');};

async function endpoint() {
  for(let n=0;n<100;n++) {
    try {
      const active=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');
      const port=active.split(/\r?\n/)[0].trim();
      const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
      const page=pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
      if(page)return page.webSocketDebuggerUrl;
    } catch {}
    if(browser.exitCode!==null)throw new Error('Chromium exited before DevTools became ready.');
    await delay(100);
  }
  throw new Error('DevTools endpoint did not become ready.');
}

function cdp(method,params={}) {
  const id=++nextId;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},10000);
    pending.set(id,{resolve,reject,timer});
    socket.send(JSON.stringify({id,method,params}));
  });
}

async function evaluate(expression) {
  const reply=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(reply.exceptionDetails)throw new Error(reply.exceptionDetails.text||'Browser evaluation failed');
  return reply.result?.value;
}

async function waitFor(expression,timeout=8000) {
  const start=Date.now();
  while(Date.now()-start<timeout) {
    const value=await evaluate(expression);
    if(value)return value;
    await delay(150);
  }
  const visible=await evaluate('document.querySelector("#scene")?.innerText||""');
  throw new Error('Browser condition timed out: '+expression+'; visible scene: '+JSON.stringify(visible.slice(-700)));
}

async function click(selector) {
  const found=await evaluate('(function(){var x=document.querySelector('+JSON.stringify(selector)+');if(!x||x.disabled)return false;x.click();return true})()');
  check(found);
}

async function shot(name) {
  const result=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile(path.join(outDir,name+'.png'),Buffer.from(result.data,'base64'));
}

try {
  socket=new WebSocket(await endpoint());
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.id&&pending.has(message.id)) {
      const item=pending.get(message.id);pending.delete(message.id);clearTimeout(item.timer);
      if(message.error)item.reject(new Error(message.error.message));else item.resolve(message.result||{});
    }
    if(message.method==='Network.responseReceived'&&message.params.response?.status>=400) {
      errors.push(`HTTP ${message.params.response.status} ${message.params.response.url}`);
    }
    if(message.method==='Network.requestWillBeSent') {
      const requested=message.params.request?.url||'';
      if(/^https?:/i.test(requested)&&new URL(requested).origin!==baseOrigin)externalRequests.add(requested);
    }
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails?.text||'Runtime exception');
    if(message.method==='Log.entryAdded'&&message.params.entry?.level==='error')errors.push(message.params.entry.text);
    if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')errors.push(message.params.args?.map(x=>x.value||x.description).join(' '));
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Log.enable');
  await cdp('Network.enable');
  await cdp('Page.setLifecycleEventsEnabled',{enabled:true});
  await waitFor('document.readyState==="complete"&&!!document.querySelector("#scene")');
  await waitFor('document.querySelector("#scene").innerText.includes("Khai mở cơ đồ")');
  check((await evaluate('document.title')).includes('Đắc Kỷ'));
  check((await evaluate('document.querySelector("#scene").innerText')).includes('Khai mở cơ đồ'));
  if(recordGameplay){
    recorder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate','4','-vcodec','mjpeg','-i','pipe:0','-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720','-an','-c:v','libx264','-preset','ultrafast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',videoPath],{stdio:['pipe','ignore','pipe']});
    recordingStartedAt=Date.now();
    recordingActive=true;
    frameCapture=(async()=>{while(recordingActive&&recorder?.stdin.writable){const began=Date.now();try{const frame=await cdp('Page.captureScreenshot',{format:'jpeg',quality:68,fromSurface:true});if(!recorder.stdin.write(Buffer.from(frame.data,'base64')))await new Promise(resolve=>recorder.stdin.once('drain',resolve));}catch{break;}await delay(Math.max(15,250-(Date.now()-began)));}})();
  }
  const recordingHold=ms=>recordGameplay?delay(ms):Promise.resolve();
  if(landscapeOnly){
    await evaluate('(function(){var i=document.querySelector("#new-city-name");i.value="Tây Kỳ";document.querySelector("form[data-form=new-game]").requestSubmit();return true})()');
    await waitFor('document.querySelector("#page-heading h1")?.innerText==="Thành trì"');
    await cdp('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
    await delay(180);
    const landscape=await evaluate('({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,nav:getComputedStyle(document.querySelector("#primary-nav")).display})');
    check(landscape.width===844&&landscape.nav!=='none'&&landscape.scroll<=landscape.width);
    await shot('15-city-mobile-landscape-844');
    console.log('PASS 844px mobile landscape: '+JSON.stringify(landscape));
  } else {
  await shot('01-start-desktop');
  console.log('PASS startup screen and original art rendered in Chromium.');

  await evaluate('(function(){var i=document.querySelector("#new-city-name");i.value="Tây Kỳ";document.querySelector("form[data-form=new-game]").requestSubmit();return true})()');
  await waitFor('document.querySelector("#page-heading h1")?.innerText==="Thành trì"');
  await waitFor('document.querySelectorAll(".city-building").length===27');
  await waitFor('document.querySelector(".resource-pill")!==null');
  check((await evaluate('document.querySelector(".tutorial-panel")?.textContent')).includes('Mở rộng sản xuất'));
  check(await evaluate('!!document.querySelector(".tutorial-panel [data-action=upgrade][data-building=lumber]")'));
  console.log('PASS new save with 21 Mobile buildings and 6 runtime support buildings.');

  const screens=['city','heroes','inventory','army','world','pve','tech','quests','market','reports','settings','library'];
  let index=2;
  for(const view of screens) {
    await click('#primary-nav [data-view='+JSON.stringify(view)+']');
    await waitFor('location.hash==="#'+view+'"');
    await waitFor('document.querySelector("#scene").innerText.length>40');
    if(view==='world'){
      check(await evaluate('Array.from(document.querySelectorAll("#world-chapter option")).find(x=>x.value==="2")?.disabled===true'));
      check(await evaluate('Number(document.querySelector("#march-count")?.max)>0&&document.querySelector(".target-card")?.innerText.includes("Số quân điều động")'));
      await waitFor('document.querySelector(".map-routes path")?.getAttribute("d")?.length>20');
      check(await evaluate('document.querySelector(".map-side")?.innerText.match(/provenance|snapshot legacy|VERIFIED_MOBILE|VERIFIED_LEGACY|ID binh chủng/i)===null'));
      await click('.map-node[data-node="node-011"]');
      check(await evaluate('document.querySelector(".target-card")?.innerText.includes("Trinh sát tài nguyên")'));
      await click('.map-node[data-node="node-014"]');
      check(await evaluate('document.querySelector(".target-card")?.innerText.includes("Trinh sát tiên pháp")'));
      await click('.map-node[data-node="node-001"]');
      await waitFor('Array.from(document.querySelectorAll(".map-node img")).some(x=>x.complete&&x.naturalWidth>0)');
    }
    if(view==='tech'){
      check(await evaluate('document.querySelectorAll(".tech-card").length===19&&document.querySelector("#scene")?.innerText.includes("UNKNOWN")&&document.querySelector("#scene")?.innerText.includes("570 cấp tối đa")'));
      check(await evaluate('document.querySelectorAll(".tech-card [data-action=research]").length===19&&Array.from(document.querySelectorAll(".tech-card")).every(card=>card.querySelector(".progress-note")&&card.querySelector(".tech-card-top h3"))'));
    }
    if(view==='library')await waitFor('Array.from(document.querySelectorAll(".source-entry img")).some(x=>x.complete&&x.naturalWidth>0)');
    await shot(String(index++).padStart(2,'0')+'-'+view+'-desktop');
    await recordingHold(6500);
  }
  console.log('PASS all 12 primary menu screens render with source artwork.');

  await click('#primary-nav [data-view="library"]');
  await evaluate('(function(){var s=document.querySelector("[data-source-category]");s.value="legacy-quest";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await waitFor('document.querySelector(".source-entry h3")?.innerText==="Khí thế ngất trời"');
  const legacyQuestCard=await evaluate('document.querySelector(".source-entry")?.innerText||""');
  check(legacyQuestCard.includes('Mở [lễ hộp]')&&legacyQuestCard.includes('UNKNOWN')&&legacyQuestCard.includes('VERIFIED_LEGACY'));
  await click('.source-provenance summary');
  check(await evaluate('document.querySelector(".source-provenance")?.innerText.includes("13d969fc88c141553535c70943aaa98cf9f86616")'));
  console.log('PASS legacy quest reference shows source text, UNKNOWN mechanics, and pinned provenance.');

  await evaluate('(function(){var s=document.querySelector("[data-source-category]");s.value="legacy-city-garrison";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await waitFor('document.querySelector(".source-entry .tag")?.innerText==="VERIFIED_LEGACY"');
  check(await evaluate('document.querySelector(".source-entry-list")?.innerText.includes("VERIFIED_LEGACY")&&document.querySelector(".hint")?.innerText.includes("375 kết quả")&&document.querySelector(".hint")?.innerText.includes("2 thành legacy-only")'));
  await evaluate('(function(){var i=document.querySelector("#source-query");i.value="Legacy-only";document.querySelector("form[data-form=source-search]").requestSubmit();return true})()');
  await waitFor('document.querySelectorAll(".source-entry").length===10');
  check(await evaluate('Array.from(document.querySelectorAll(".source-entry")).every(x=>x.innerText.includes("Legacy-only"))'));
  console.log('PASS legacy city NPC library exposes all 375 rows and searchable legacy-only references.');

  await click('#primary-nav [data-view="market"]');
  await evaluate('(function(){var f=document.querySelector("form[data-form=trade]");f.querySelector("#trade-from").value="food";f.querySelector("#trade-to").value="gold";f.querySelector("#trade-amount").value="800";f.requestSubmit();return true})()');
  await waitFor('document.querySelectorAll(".resource-pill")[4]?.innerText.includes("1.233")');
  await delay(400);
  await evaluate('(function(){var f=document.querySelector("form[data-form=trade]");f.querySelector("#trade-from").value="stone";f.querySelector("#trade-to").value="gold";f.querySelector("#trade-amount").value="400";f.requestSubmit();return true})()');
  await waitFor('document.querySelectorAll(".resource-pill")[4]?.innerText.includes("1.417")');
  await delay(400);
  await evaluate('(function(){var f=document.querySelector("form[data-form=trade]");f.querySelector("#trade-from").value="iron";f.querySelector("#trade-to").value="gold";f.querySelector("#trade-amount").value="400";f.requestSubmit();return true})()');
  await waitFor('document.querySelectorAll(".resource-pill")[4]?.innerText.includes("1.636")');
  await delay(400);
  for(let page=0;page<16&&!(await evaluate('!!document.querySelector(`[data-action="buyArtifact"][data-item="item-1749"]`)'));page++){
    const hasNext=await evaluate('!!Array.from(document.querySelectorAll(`[data-page-key="artifactPage"][data-page]`)).find(x=>x.innerText.includes("Tiếp")&&!x.disabled)');
    if(!hasNext)break;
    await click('[data-page-key="artifactPage"][data-page]');
  }
  check(await evaluate('!!document.querySelector(`[data-action="buyArtifact"][data-item="item-1749"]`)'));
  await click('[data-action="buyArtifact"][data-item="item-1749"]');
  await waitFor('!document.querySelector(`[data-action="buyArtifact"][data-item="item-1749"]`)');
  await delay(400);
  await click('[data-action="setTaxPolicy"][data-policy="heavy"]');
  await waitFor('document.querySelector("[data-action=setTaxPolicy][data-policy=heavy]")?.disabled===true');
  await delay(200);
  await click('[data-action="setTaxPolicy"][data-policy="balanced"]');
  await waitFor('document.querySelector("[data-action=setTaxPolicy][data-policy=balanced]")?.disabled===true');
  console.log('PASS tax policy changes are saved into the economy state.');

  await click('#primary-nav [data-view="heroes"]');
  await waitFor('document.querySelectorAll("[data-page-key=heroPage]").length===2');
  await click('[data-page-key="heroPage"][data-page="1"]');
  await waitFor('document.querySelector(".catalog-pages span")?.innerText.includes("Trang 2")');
  check((await evaluate('Array.from(document.querySelectorAll(".panel")).find(x=>x.querySelector(".panel-title")?.innerText.includes("Lời mời nhập phủ"))?.querySelectorAll(".inventory-item").length'))===24);
  await click('[data-page-key="heroPage"][data-page="0"]');

  await click('#primary-nav [data-view="inventory"]');
  await waitFor('document.querySelectorAll("[data-page-key=consumablePage]").length===2');
  await click('[data-page-key="consumablePage"][data-page="1"]');
  await waitFor('Array.from(document.querySelectorAll(".catalog-pages span")).some(x=>x.innerText.includes("Trang 2")&&x.innerText.includes("vật phẩm tiêu hao"))');
  check(await evaluate('Array.from(document.querySelectorAll(".panel")).find(x=>x.querySelector(".panel-title")?.innerText.includes("Thương nhân vật phẩm"))?.querySelectorAll(".inventory-item").length')===24);
  await click('[data-page-key="consumablePage"][data-page="0"]');
  await click('[data-action="buyItem"][data-item="item-0022"]');
  await waitFor('Array.from(document.querySelectorAll(".panel")).find(x=>x.querySelector(".panel-title")?.innerText.includes("Thương nhân vật phẩm"))?.innerText.includes("Trong túi: 1")');
  await click('[data-page-key="forgePage"][data-page="1"]');
  await waitFor('Array.from(document.querySelectorAll(".panel")).find(x=>x.querySelector(".panel-title")?.innerText.includes("Lò luyện pháp bảo"))?.querySelector(".catalog-pages span")?.innerText.includes("Trang 2")');
  await click('[data-page-key="forgePage"][data-page="0"]');

  await click('#primary-nav [data-view="quests"]');
  await click('[data-page-key="questPage"][data-page="1"]');
  await waitFor('document.querySelector(".catalog-pages span")?.innerText.includes("Trang 2")');
  await click('[data-page-key="questPage"][data-page="0"]');

  await click('#primary-nav [data-view="pve"]');
  const pveRuntime=await evaluate('({elflandLocations:document.querySelectorAll("#elfland-source-select option").length,buzhouControl:Array.from(document.querySelectorAll("[data-action=pveMarch]")).some(x=>x.dataset.node==="buzhou:1"),elflandBattle:Array.from(document.querySelectorAll("[data-action=pveMarch]")).some(x=>x.dataset.node?.startsWith("elfland:"))})');
  check(pveRuntime.elflandLocations===624&&pveRuntime.buzhouControl&&pveRuntime.elflandBattle);
  check(await evaluate('document.querySelectorAll(".buzhou-door-row").length===5&&Array.from(document.querySelectorAll(".buzhou-door-row")).some(x=>x.innerText.includes("Cửa 5"))'));
  await click('#primary-nav [data-view="library"]');
  const buzhouReference=await evaluate('({floorCount:document.querySelectorAll(".buzhou-source-floor").length,formationName:Array.from(document.querySelectorAll(".buzhou-source-floor")).map(x=>x.textContent).join(" ").includes("Mục Kiền Liên"),inactive:document.body.innerText.includes("chưa được xem là xác suất đã xác minh")})');
  check(buzhouReference.floorCount===5&&buzhouReference.formationName&&buzhouReference.inactive);
  await evaluate('(function(){var s=document.querySelector("#elfland-source-select");s.value="4";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await waitFor('document.querySelector("#elfland-source-select")?.value==="4"&&document.querySelectorAll(".elfland-source-floor").length===30');
  const elflandReference=await evaluate('({locations:document.querySelectorAll("#elfland-source-select option").length,selected:document.querySelector("#elfland-source-select")?.value,floors:document.querySelectorAll(".elfland-source-floor").length,sourceRoster:document.querySelector(".elfland-source-floor ul")?.textContent||"",hasElflandPanel:Array.from(document.querySelectorAll(".panel-title")).some(x=>x.innerText.includes("Tiên Sơn · dữ liệu NPC legacy"))})');
  check(elflandReference.locations===624&&elflandReference.selected==="4"&&elflandReference.floors===30);
  check(elflandReference.sourceRoster.includes("ID binh chủng legacy")&&elflandReference.hasElflandPanel);
  await evaluate('(function(){var s=document.querySelector("#elfland-source-select");s.value="5";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await waitFor('document.querySelector("#elfland-source-select")?.value==="5"&&document.querySelectorAll(".elfland-source-floor").length===15');
  check(await evaluate('document.querySelector("#elfland-source-select")?.closest(".panel")?.querySelector(".panel-body p b")?.innerText==="Linh Thạch Tịnh Đài"'));
  await evaluate('(function(){var s=document.querySelector("#elfland-source-select");s.value="4";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await waitFor('document.querySelector("#elfland-source-select")?.value==="4"&&document.querySelectorAll(".elfland-source-floor").length===30');
  check(await evaluate('Array.from(document.querySelectorAll(".elfland-source-floor")).some(x=>x.textContent.includes("ID binh chủng legacy"))'));
  console.log('PASS paginated hero, shop and quest screens; Tiên Sơn and Bất Chu source rosters remain searchable references.');

  await click('#primary-nav [data-view="city"]');
  await click('[data-action="upgrade"][data-building="altar"]');
  await waitFor('document.querySelector(".city-builder-queue")?.innerText.includes("Nhà chiêu mộ đang tu sửa")',5000);
  await waitFor('document.querySelector(".city-builder-queue")?.innerText.includes("Thợ xây đang nghỉ")',20000);
  console.log('PASS source-named recruitment building completes through its construction queue.');

  await click('#primary-nav [data-view="heroes"]');
  await waitFor('Array.from(document.querySelectorAll(".portrait img")).some(x=>x.complete&&x.naturalWidth>0)');
  const recruitHeading=await evaluate('Array.from(document.querySelectorAll(".panel-title")).find(x=>x.innerText.includes("Lời mời nhập phủ"))?.innerText||""');
  check(recruitHeading.includes('ứng viên'));
  check(await evaluate('document.querySelector("#scene").innerText.includes("Lời mời mới xuất hiện theo tiến trình thành trì")'));
  await click('[data-action="recruit"][data-hero="hero-02"]');
  await waitFor('document.querySelector("#scene").innerText.includes("Na Tra")');
  await click('#primary-nav [data-view="inventory"]');
  await evaluate('(function(){var s=document.querySelector("[data-equip-select=item-01]");if(s)s.value="hero-02";return true})()');
  await click('[data-action="equip"][data-item="item-01"]');
  await waitFor('document.querySelector("#scene").innerText.includes("Bạch Ngọc Kiếm")');
  await click('#primary-nav [data-view="inventory"]');
  await evaluate('(function(){var s=document.querySelector("[data-equip-select=item-1749]");if(s)s.value="hero-01";return true})()');
  await click('[data-action="equip"][data-item="item-1749"]');
  await waitFor('document.querySelector("#scene").innerText.includes("Phạm Hoang Trần")');
  console.log('PASS recruitment and equipment linked to hero state.');

  await click('#primary-nav [data-view="army"]');
  const troopRecruitment=await evaluate('({options:document.querySelectorAll("#train-unit option").length,internalLabels:Array.from(document.querySelectorAll("#train-unit option")).filter(x=>/VERIFIED|SIMULATED|UNKNOWN|Mobile \d+/.test(x.textContent)).length})');
  check(troopRecruitment.options===25&&troopRecruitment.internalLabels===0);
  const trainingTroopName=await evaluate('(function(){var s=document.querySelector("#train-unit"),o=Array.from(s.options).find(x=>x.textContent.startsWith("Trường Kích Binh"));if(!o)return "";s.value=o.value;s.dispatchEvent(new Event("change",{bubbles:true}));return o.textContent.split(" · ")[0]})()');
  check(trainingTroopName.length>0);
  await evaluate('(function(){document.querySelector("#train-count").value="1";return true})()');
  await click('[data-action="train"]');
  const trainingQueue=`Array.from(document.querySelectorAll(".queue-card")).some(x=>x.innerText.includes(${JSON.stringify(trainingTroopName)}))`;
  await delay(350);
  await waitFor(trainingQueue,5000);
  await waitFor(`!${trainingQueue}`,14000);
  await click('#primary-nav [data-view="world"]');
  if(recordGameplay)await evaluate('(function(){var s=document.querySelector("#combat-mode");s.value="manual";s.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
  await evaluate('(function(){document.querySelector("#march-count").value="18";return true})()');
  await click('[data-action="march"]');
  await waitFor('Array.from(document.querySelectorAll(".queue-card")).some(x=>x.innerText.includes("Tây Kì"))',5000);
  if(recordGameplay){
    await waitFor('document.querySelector("#battle-artifact")!==null',15000);
    await waitFor('document.querySelector(".manual-battle-panel .friendly-army .battle-unit")&&document.querySelector(".manual-battle-panel .hostile-army .battle-unit")&&getComputedStyle(document.querySelector(".manual-battle-panel")).visibility==="visible"',5000);
    await waitFor('Array.from(document.querySelectorAll(".manual-battle-panel .battle-unit img")).filter(x=>x.complete&&x.naturalWidth>0).length>=2&&document.querySelector(".manual-battle-panel .battle-fortification img")?.naturalWidth>0',5000);
    check(await evaluate('document.querySelector(".manual-battle-panel .battle-result-ribbon")&&document.querySelector(".manual-battle-panel .battle-control-deck")&&document.querySelector(".manual-battle-panel .battle-fortification")'));
    await shot('16-manual-army-battle');
    await click('.battle-artifact-choice[data-value="5045"]');
    await click('.battle-order[data-value="assault"]');
    const artifactCommand=await evaluate('document.querySelector("#battle-artifact")?.selectedOptions[0]?.textContent||""');
    check(artifactCommand.includes('Phạm Hoang Trần'));
    await click('[data-action="battleCommand"]');
    await waitFor('document.querySelector(".manual-battle-panel .battle-header small")?.innerText.includes("HIỆP 2")',5000);
    await recordingHold(6000);
    await click('[data-action="battleAuto"]');
  }
  await waitFor('!Array.from(document.querySelectorAll(".queue-card")).some(x=>x.innerText.includes("Tây Kì"))',15000);
  await click('#primary-nav [data-view="reports"]');
  await waitFor('document.querySelector(".report-card")!==null');
  if(recordGameplay)await shot('17-settled-battle-report');
  check((await evaluate('document.querySelector(".report-card").innerText')).includes('Chiến lợi phẩm'));
  if(recordGameplay)check((await evaluate('document.querySelector(".report-card").textContent')).includes('Phạm Hoang Trần'));
  await recordingHold(9000);
  console.log('PASS troop training, march settlement, loot and battle report.');
  await click('#primary-nav [data-view="city"]');
  await waitFor('Array.from(document.querySelectorAll(".panel-title")).some(x=>x.textContent.includes("Quản lý thành phụ"))');
  if(recordGameplay)await shot('18-developed-city');
  await recordingHold(8000);
  check(await evaluate('!!document.querySelector("[data-action=upgradeCity][data-city=node-001]")'));
  check(await evaluate('Array.from(document.querySelectorAll(".panel-title")).some(x=>x.textContent.includes("Quản lý thành phụ"))'));
  console.log('PASS captured satellite city appears in the city manager with its upgrade action.');

  await click('#primary-nav [data-view="settings"]');
  await click('[data-action="export"]');
  await delay(300);
  const saved=await evaluate('new Promise(function(resolve){var q=indexedDB.open("dacky-mobile-local",1);q.onsuccess=function(){var r=q.result.transaction("saves").objectStore("saves").get("campaign");r.onsuccess=function(){resolve(!!r.result?.payload)}};q.onerror=function(){resolve(false)}})');
  check(saved===true);
  await cdp('Page.reload',{ignoreCache:true});
  await waitFor('document.querySelector("#page-heading h1")?.innerText==="Thiết lập"');
  await waitFor('document.querySelector("#realm-title")?.innerText==="Tây Kỳ"');
  console.log('PASS IndexedDB save survives reload.');

  if(recordGameplay){
    const route=['city','heroes','inventory','army','world','pve','quests','market','reports','city'];let index=0;
    while(Date.now()-recordingStartedAt<190000){
      const view=route[index++%route.length];await click('#primary-nav [data-view='+JSON.stringify(view)+']');await waitFor('location.hash==="#'+view+'"');await recordingHold(4500);
    }
  }

  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await click('#primary-nav [data-view="city"]');
  await waitFor('document.querySelector("#page-heading h1")?.innerText==="Thành trì"');
  const mobile=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,nav:getComputedStyle(document.querySelector("#primary-nav")).display,buildings:document.querySelectorAll(".city-building").length})');
  check(mobile.width===390&&mobile.nav!=='none'&&mobile.buildings===27);
  await shot('13-city-mobile-390');
  await click('#primary-nav [data-view="world"]');
  await shot('14-world-mobile-390');
  console.log('PASS 390px mobile layout: '+JSON.stringify(mobile));
  await cdp('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
  await click('#primary-nav [data-view="city"]');
  const landscape=await evaluate('({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,nav:getComputedStyle(document.querySelector("#primary-nav")).display})');
  check(landscape.width===844&&landscape.height===390&&landscape.nav!=='none'&&landscape.scroll<=landscape.width);
  await shot('15-city-mobile-landscape-844');
  console.log('PASS 844x390 Android-landscape layout: '+JSON.stringify(landscape));
  }

  if(errors.length)throw new Error('Browser console/runtime errors: '+errors.join(' | '));
  if(new URL(baseUrl).pathname.endsWith('/offline.html'))check(externalRequests.size===0);
  if(new URL(baseUrl).pathname.endsWith('/offline.html'))console.log('PASS single-file page made no cross-origin HTTP requests.');
  console.log('PASS zero browser runtime/console errors.');
} finally {
  if(recorder){
    recordingActive=false;
    await frameCapture;
    recorder.stdin.end();
    const exitCode=recorder.exitCode??await new Promise(resolve=>recorder.once('exit',resolve));
    if(exitCode!==0)throw new Error('Gameplay video encoder exited with code '+exitCode);
  }
  try { socket?.close(); } catch {}
  browser.kill('SIGTERM');
  await delay(300);
  await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
