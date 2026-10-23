const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;if(packed)packed.setGraphicsMode=false;
(async()=>{
 let browser;
 try{for(const count of [1,2])for(const width of [320,360,390,430,844,1280]){
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?[...packed.args.filter(x=>!x.includes('in-process-gpu')),'--disable-gpu']:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width,height:width===844?390:844},serviceWorkers:'block',hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url()),f=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);if(url.hostname==='guide.fixture'&&fs.existsSync(f))await route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});else await route.fulfill({body:'[]',contentType:'application/json'});});
  await page.addInitScript(()=>{sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');Object.defineProperty(navigator,'serviceWorker',{value:undefined});window.fetch=async(url,opts={})=>({ok:true,status:200,json:async()=>String(url).includes('portal_record_guide')?true:[],text:async()=>'[]',headers:{get:()=>''}});});
  await page.goto('https://guide.fixture/');await page.waitForTimeout(500);
  await page.evaluate(count=>{
   state.session={user:{id:'synthetic-browser'},access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600};state.selectedDogId=1;
   state.data={profile:{status:'active',intro_guide_eligible:true,privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:Array.from({length:count},(_,i)=>({id:i+1,name:i?'Iris':'Bella',sex:'female',default_entry_type:'pass',photo_path:'fixture/dog',share_name_photo_at:'2026-01-01'})),vaccinations:Array.from({length:count},(_,i)=>['rabies','infectious','kennel_cough'].map(type=>({dog_id:i+1,vaccination_type:type,valid_until:'2099-12-31'}))).flat(),vaccination_proofs:Array.from({length:count},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),dog_onboarding:Array.from({length:count},(_,i)=>({dog_id:i+1,details_prompt_answered_at:'2026-01-01'})),passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}};
   showApp();renderAll();loading(false);return window.runCustomerOnboardingV75();
  },count);
  await page.waitForTimeout(1300);
  if(!await page.locator('#customerGuideV358').isVisible())console.log('NOT READY',await page.evaluate(()=>({ready:window.__customerOnboardingCompleteV75,modals:[...document.querySelectorAll('[role="dialog"]')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.id),loading:document.getElementById('loading').className,errors:typeof window.customerGuideAbortV358})),errors);
  await page.locator('#customerGuideV358').waitFor({state:'visible',timeout:10000});
  const welcome=await page.locator('.guide-card').boundingBox(),next=await page.locator('#guideNextV358').boundingBox(),skip=await page.locator('#guideSkipV358').boundingBox();
  assert.equal(await page.locator('#guideProgressV358').textContent(),'');
  assert(skip.y>=next.y+next.height,'welcome skip below primary action');assert(skip.height>=44);
  assert.equal(await page.locator('#guideSkipV358').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  assert(welcome.y>=0&&welcome.y+welcome.height<=(width===844?390:844)+1);
  if(width===390&&count===1)await page.screenshot({path:'/tmp/guide-v359-welcome.png'});
  const nav=await page.locator('.bottom-nav').boundingBox();
  await page.locator('#guideNextV358').click();
  for(let i=0;i<5;i++){
   await page.waitForFunction(n=>document.getElementById('guideProgressV358').textContent===(n+1)+' z 5'&&!document.getElementById('guideNextV358').disabled,i);
   const card=await page.locator('.guide-card').boundingBox(),spot=await page.locator('.guide-spot').boundingBox();
   assert(card.x>=0&&card.x+card.width<=width+1&&card.y>=0&&card.y+card.height<=(width===844?390:844)+1,JSON.stringify({width,count,i,card}));
   assert(spot&&spot.width>40&&spot.height>20,JSON.stringify({width,count,i,spot}));
   assert(await page.locator('#guideNextV358').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===390&&count===1)await page.screenshot({path:'/tmp/guide-v358-step-'+(i+1)+'.png'});
   await page.locator('#guideNextV358').click();
  }
  await page.locator('#customerGuideV358').waitFor({state:'hidden'});
  const restored=await page.locator('.bottom-nav').boundingBox();assert.equal(restored.x,nav.x);assert.equal(restored.y,nav.y);assert.equal(restored.width,nav.width);assert.equal(restored.height,nav.height);
  assert.equal(await page.locator('#guideDemoReservationV358').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS browser five steps/spotlight/card/nav/cleanup',count,width);await context.close();await browser.close();
 }}finally{await browser?.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
