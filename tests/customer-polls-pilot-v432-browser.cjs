/* Isolated owner poll browser regression. All browser accounts are synthetic. */
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const original=fs.readFileSync(path.join(root,'customer-polls-pilot-v432.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'customer-polls-pilot-v432.css'),'utf8');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
 assert.equal(version.build,'v432');
 assert.equal(version.version,'2.0.105');
 assert.match(index,/customer-polls-pilot-v432\.js\?v=v432/);
 assert.match(index,/customer-polls-pilot-v432\.css\?v=v432/);
 assert.match(sw,/customer-polls-pilot-v432\.js\?v=v432/);
 assert.match(original,/crypto\.subtle\.digest\('SHA-256'/);
 assert.doesNotMatch(original,/rest\/v1\/|service_role|fetch\(/);
 const mockOwner='synthetic-owner-v432';
 const mockHash=createHash('sha256').update(mockOwner).digest('hex');
 const source=original.replace('c2a6a40c1905b238cdb5e3cd858a3e8d7e14f5ed2937b90f938bc9ae51a87385',mockHash);
 assert.notEqual(source,original);
 const html=[
  '<!doctype html><html class="customer-design"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  '<style>body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:10px;background:#fcefee}',
  '#menuTab .customer-menu-group{display:block;min-height:55px;margin:0 0 10px;background:#fff;border-radius:16px;padding:8px}',
  '.customer-social-v223{padding:12px;background:#fff}',
  '.bottom-nav{position:fixed;bottom:0;left:0;right:0;height:60px;background:#fff;display:flex;align-items:center;justify-content:center}',
  '</style><style>',css,'</style></head><body>',
  '<section id="bookingTab"><div id="upcomingBookings"></div></section>',
  '<section id="menuTab"><h1>Menu</h1><details id="menuDogGroup" class="customer-menu-group">',
  '<summary>Môj psík</summary><button id="menuBulletinV229">Oznamy</button></details>',
  '<button id="menuContact" class="customer-menu-group">Moje kontaktné údaje</button>',
  '<details id="menuSettingsGroup" class="customer-menu-group"><summary>Nastavenia</summary></details>',
  '<button id="menuMessage" class="customer-menu-group">Správy</button>',
  '<div class="customer-social-v223">Sociálne siete</div></section>',
  '<div class="bottom-nav"><button id="navDog">Menu</button></div>',
  '<button data-customer-locale="en">English</button>',
  '<script>',
  'window.__hooks={};window.__noticesOpened=0;window.__selectedTab=null;window.__lang="sk";',
  'window.state={session:{user:{id:new URLSearchParams(location.search).get("account")||"synthetic-owner-v432"}},data:{dogs:[]}};',
  'window.addCustomerHook=(name,fn)=>{(window.__hooks[name]??=[]).push(fn)};',
  'window.switchTab=tab=>{window.__selectedTab=tab};',
  'window.ChvostikovoLocale={getLanguage:()=>window.__lang};',
  'document.getElementById("menuBulletinV229").onclick=()=>{window.__noticesOpened++};',
  '</script><script src="/pilot.js"></script></body></html>'
 ].join('');
 const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/pilot.js')){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});res.end(source);return}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:750}});
   const page=await context.newPage();
   const external=[];
   page.on('request',request=>{if(request.url().includes('supabase.co'))external.push(request.url())});
   await page.goto(url);
   await page.locator('#customerPollMenuV432 .customer-poll-choice-v432').first().waitFor();
   assert.equal(await page.locator('#customerPollMenuV432 .customer-poll-choice-v432').count(),2);
   assert.equal(await page.locator('#customerPollMenuV432 .customer-poll-count-v432').textContent(),'Testovacie hlasy na tomto zariadení: 0');
   assert.equal(await page.locator('#customerPollNavBadgeV432').isVisible(),true);
   assert.equal(await page.locator('#customerMenuPrimaryV432>.customer-menu-group').count(),4);
   assert.equal(await page.locator('#customerPollOverviewV432').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.locator('#customerPollOverviewV432 [data-poll-open]').click();
   assert.equal(await page.evaluate(()=>window.__selectedTab),'menu');
   await page.locator('#customerPollMenuV432 .customer-poll-choice-v432').first().click();
   assert.match(await page.locator('#customerPollMenuV432').textContent(),/Ďakujeme za váš hlas!/);
   assert.match(await page.locator('#customerPollMenuV432 .customer-poll-count-v432').textContent(),/1$/);
   assert.equal(await page.locator('#customerPollNavBadgeV432').isVisible(),false);
   await page.locator('#customerPollMenuV432 [data-poll-notices]').click();
   assert.equal(await page.evaluate(()=>window.__noticesOpened),1);
   await page.reload();
   await page.locator('#customerPollMenuV432 .customer-poll-complete-v432').waitFor();
   assert.equal(await page.locator('#customerPollMenuV432 .customer-poll-choice-v432').count(),0);
   await page.evaluate(()=>{window.__lang='en';document.querySelector('[data-customer-locale="en"]').click()});
   assert.match(await page.locator('#customerPollMenuV432').textContent(),/Thanks for voting!/);
   await page.evaluate(()=>{window.state.session.user.id='another-synthetic-account';window.__hooks.afterBootstrap.forEach(fn=>fn())});
   await page.locator('#customerPollMenuV432').waitFor({state:'detached'});
   assert.equal(await page.locator('#customerPollOverviewV432').count(),0);
   assert.equal(await page.locator('#customerMenuPrimaryV432').count(),0);
   assert.equal(await page.locator('#customerPollNavBadgeV432').count(),0);
   assert.equal(external.length,0);
   const outsider=await context.newPage();
   await outsider.goto(url+'?account=another-synthetic-account');
   await outsider.waitForTimeout(70);
   assert.equal(await outsider.locator('#customerPollMenuV432').count(),0);
   await context.close();
   console.log((process.env.V3_ENGINE||'chromium')+' owner poll '+width+'px PASS');
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
