/* v433 poll regression: synthetic app/auth/API, owner guard, real-API contract, quantity and browser UI. */
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
 assert.equal(version.build,'v433');
 assert.equal(version.version,'2.0.106');
 assert.match(index,/customer-polls-pilot-v432\.js\?v=v433/);
 assert.match(index,/customer-polls-pilot-v432\.css\?v=v433/);
 assert.match(sw,/portal-shell-v433/);
 assert.match(original,/portal_poll_votes_v433/);
 assert.match(original,/ensureCustomerSessionV357/);
 assert.doesNotMatch(original,/localStorage\.setItem|service_role|admin\.rpc/);
 const synthetic='synthetic-customer-school-v433';
 const hash=createHash('sha256').update(synthetic).digest('hex');
 const source=original.replace('288c196a3d8f47da8e96737e2c1753be2db7b1864c406c95e312c7687e0dcd66',hash);
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
  'const SUPABASE_URL="https://synthetic.supabase.co",SUPABASE_KEY="synthetic-anon";',
  'window.__hooks={};window.__lang="sk";window.__calls=[];',
  'window.state={session:{user:{id:new URLSearchParams(location.search).get("account")||"synthetic-customer-school-v433"},access_token:"synthetic-token"},data:{dogs:[]}};',
  'window.addCustomerHook=(name,fn)=>{(window.__hooks[name]??=[]).push(fn)};',
  'window.switchTab=tab=>{window.__selectedTab=tab};',
  'window.ChvostikovoLocale={getLanguage:()=>window.__lang};',
  'window.ensureCustomerSessionV357=async()=>window.state.session;',
  'window.customerReadJsonV391=async(url,id)=>{',
  ' let rows=[];const vote=JSON.parse(localStorage.getItem("__synthetic_server_vote_v433")||"null");',
  ' if(url.includes("/portal_polls_v433?"))rows=[{id:"poll-test",title:"Škôlkarsky kalendár",question:"Mali by ste záujem o kalendár Chvostíkova?",description:"Pripravujeme nápad na kalendár so škôlkarmi. Chceli by sme ním podporiť OZ Zvieratá východu.",price_note:"Predbežná cena je 15 € za kus. Celý výťažok poputuje OZ Zvieratá východu."}];',
  ' if(url.includes("/portal_poll_votes_v433?"))rows=vote?[{id:"vote1",poll_id:"poll-test"}]:[];',
  ' if(url.includes("/portal_poll_options_v433?"))rows=[{id:"yes",label:"Áno, mám záujem",position:1,asks_quantity:true},{id:"no",label:"Nie, nemám záujem",position:2,asks_quantity:false}];',
  ' window.__calls.push({type:"read",url,id});return {response:{ok:true,status:200},rows};',
  '};',
  'window.fetch=async(url,options)=>{if(!String(url).includes("/portal_poll_votes_v433")||options.method!=="POST")throw new Error("Unexpected API call");',
  ' const data=JSON.parse(options.body);window.__calls.push({type:"write",data});',
  ' localStorage.setItem("__synthetic_server_vote_v433",JSON.stringify(data));',
  ' return {ok:true,status:201};};',
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
   await page.goto(url);
   const bubble=page.locator('#customerPollMenuV432');
   await bubble.locator('[data-poll-expand]').waitFor();
   assert.match(await bubble.textContent(),/Nové hlasovanie/);
   assert.equal(await page.locator('#customerPollOverviewV432').count(),0);
   assert.equal(await page.locator('#customerMenuPrimaryV432>.customer-menu-group').count(),4);
   assert.equal(await page.locator('#customerPollNavBadgeV432').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await bubble.locator('[data-poll-expand]').click();
   assert.match(await bubble.textContent(),/Zvieratá východu/);
   assert.match(await bubble.textContent(),/15 € za kus/);
   await bubble.locator('[data-poll-choice="yes"]').click();
   const quantity=bubble.locator('#customerPollQuantityV433');
   await quantity.fill('3');
   await bubble.locator('[data-poll-submit]').click();
   await bubble.locator('.customer-poll-complete-v432').waitFor();
   assert.match(await bubble.textContent(),/Ďakujeme za váš hlas!/);
   const posted=await page.evaluate(()=>window.__calls.filter(v=>v.type==='write'));
   assert.equal(posted.length,1);
   assert.equal(posted[0].data.quantity,3);
   assert.equal(posted[0].data.option_id,'yes');
   assert.equal(await page.locator('#customerPollNavBadgeV432').isVisible(),false);
   await bubble.locator('[data-poll-done]').click();
   await page.waitForFunction(()=>document.querySelector('#customerPollMenuV432')?.hidden===true);
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#customerMenuPrimaryV432')&&document.querySelector('#customerPollMenuV432')?.hidden===true);
   assert.equal(await bubble.isVisible(),false);
   await page.evaluate(()=>{window.state.session.user.id="outsider-v433";window.__hooks.afterBootstrap.forEach(fn=>fn())});
   await bubble.waitFor({state:'detached'});
   assert.equal(await page.locator('#customerMenuPrimaryV432').count(),0);
   assert.equal(await page.locator('#customerPollNavBadgeV432').count(),0);
   const outsider=await context.newPage();
   await outsider.goto(url+'?account=outsider-v433');
   await outsider.waitForTimeout(60);
   assert.equal(await outsider.locator('#customerPollMenuV432').count(),0);
   assert.equal(await outsider.evaluate(()=>window.__calls.length),0);
   await context.close();
   console.log((process.env.V3_ENGINE||'chromium')+' v433 poll '+width+'px PASS');
  }
  const context=await browser.newContext({viewport:{width:390,height:780}});
  const page=await context.newPage();
  await page.goto(url);
  await page.locator('[data-poll-expand]').waitFor();
  await page.evaluate(()=>{window.__lang="en";document.querySelector('[data-customer-locale="en"]').click()});
  await page.waitForFunction(()=>document.querySelector('[data-poll-expand]')?.textContent.includes('I want to vote'));
  await page.locator('[data-poll-expand]').click();
  await page.locator('[data-poll-choice="no"]').click();
  await page.locator('.customer-poll-complete-v432').waitFor();
  const rows=await page.evaluate(()=>window.__calls.filter(x=>x.type==='write'));
  assert.equal(rows.length,1);
  assert.equal(rows[0].data.quantity,null);
  assert.equal(rows[0].data.option_id,'no');
  assert.match(await page.locator('#customerPollMenuV432').textContent(),/Thank you for voting!/);
  await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
