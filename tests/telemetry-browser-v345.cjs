const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;if(packed)packed.setGraphicsMode=false;
const base='https://tlhcqwsluyqpywymjoxn.supabase.co';
(async()=>{
for(const app of ['customer','admin']){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?[...packed.args.filter(x=>!x.includes('in-process-gpu')),'--disable-gpu']:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='fixture.local')return route.fulfill({status:200,contentType:'application/json',body:'[]'});const file=url.pathname==='/admin'?'/tmp/admin-candidate-v345.html':path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);if(fs.existsSync(file))await route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});else await route.fulfill({status:404,body:''});});
 await page.addInitScript(app=>{
  window.__telemetryPackets=[];window.__normalBodies=[];window.__collectorFail=false;window.__failed=false;
  if(app==='admin')localStorage.setItem('chvostikovo_supabase_session',JSON.stringify({access_token:'TOKEN_SECRET',refresh_token:'REFRESH_SECRET',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-staff'}}));
  window.fetch=async(input,options={})=>{const u=String(input);
   if(u.includes('portal_telemetry_ingest_v345')){window.__telemetryPackets.push({url:u,body:JSON.parse(options.body)});if(window.__collectorFail)throw new TypeError('COLLECTOR_PRIVATE_SECRET');return new Response('true',{status:200});}
   if(u.includes('portal_staff_telemetry_v345'))return new Response(JSON.stringify({enabled:true,days:7,groups:[{app:'customer',build:'20261022-opentelemetry-v345',category:'request.error',operation:'rpc/portal_save_vaccinations_v287',surface:'vaccinations',browser:'Safari/26',platform:'iOS',exception_type:'TypeError',source_file:'app.js',source_line:207,http_status:503,occurrences:2,max_duration_ms:1500,last_seen:'2026-10-22T08:00:00Z'}]}));
   if(u.includes('/rest/v1/staff?'))return new Response(JSON.stringify({user_id:'synthetic-staff',active:true}));
   if(window.__failed&&u.includes('/rest/v1/rpc/portal_save_vaccinations_v287')){window.__normalBodies.push(options.body);return new Response('PRIVATE_NAME',{status:503});}
   if(u.includes('/auth/v1/logout'))return new Response('{}');
   return new Response('[]',{status:200});
  };
 },app);
 await page.goto('http://fixture.local/'+(app==='admin'?'admin':''));await page.waitForTimeout(700);
 if(app==='customer')await page.evaluate(()=>{bratislavaToday=()=> '2099-01-01';overviewClock=()=>({date:'2099-01-01',minutes:600});queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'synthetic-customer'},access_token:'TOKEN_SECRET'};state.selectedDogId=1;state.data={profile:{status:'active'},dogs:[{id:1,name:'PRIVATE_NAME',sex:'female'}],vaccinations:['rabies','infectious','kennel_cough'].map(type=>({dog_id:1,vaccination_type:type,valid_until:'2099-03-01'})),vaccination_proofs:[{id:1,dog_id:1,storage_path:'private.jpg'}],passes:[],requests:[],reservations:[],pass_requests:[],visits:[],monthly_totals:[],notifications:[],availability:{days:[]}};showApp();renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays();loading(false);});
 assert(await page.evaluate(()=>window.ChvoTelemetry.active),app+' actual reporter initialization');
 await page.evaluate(()=>window.ChvoTelemetry.flush());await page.evaluate(()=>{window.__telemetryPackets=[];window.__failed=true;});
 const result=await page.evaluate(async base=>{
  const payload=JSON.stringify({name:'PRIVATE_NAME',email:'private@example.test',token:'TOKEN_SECRET'});
  const response=await fetch(base+'/rest/v1/rpc/portal_save_vaccinations_v287?email=private@example.test',{method:'POST',body:payload});
  const error=new TypeError('PRIVATE_NAME private@example.test TOKEN_SECRET');
  window.dispatchEvent(new ErrorEvent('error',{error,message:error.message,filename:location.origin+'/app.js?token=TOKEN_SECRET',lineno:207,colno:4}));
  window.dispatchEvent(new ErrorEvent('error',{error,message:error.message,filename:location.origin+'/app.js?token=TOKEN_SECRET',lineno:207,colno:4}));
  await window.ChvoTelemetry.flush();return {status:response.status,text:await response.text(),bodies:window.__normalBodies,packets:window.__telemetryPackets};
 },base);
 assert.equal(result.status,503);assert.equal(result.text,'PRIVATE_NAME','original response/body preserved');assert.equal(result.bodies.length,1);
 assert(result.packets.length>0,'SDK exported real sampled spans');const packetText=JSON.stringify(result.packets.map(p=>p.body));for(const secret of ['PRIVATE_NAME','private@example.test','TOKEN_SECRET','REFRESH_SECRET','private.jpg','exception.message','http.url'])assert(!packetText.includes(secret),app+' leaked '+secret);
 const spans=result.packets.flatMap(p=>p.body.p_payload.resourceSpans.flatMap(r=>r.scopeSpans.flatMap(s=>s.spans)));assert.equal(spans.filter(s=>s.name==='javascript.error').length,1,'duplicate same-location error suppressed');assert(spans.some(s=>s.attributes.some(a=>a.key==='operation'&&a.value.stringValue==='rpc/portal_save_vaccinations_v287')));assert(spans.every(s=>/^[0-9a-f]{32}$/.test(s.traceId)));
 if(app==='admin'){
  const opener=page.locator('#menuTelemetryV345');await opener.evaluate(el=>el.click());await page.waitForTimeout(100);assert(await page.locator('#telemetryPanelV345').evaluate(el=>el.open));assert((await page.locator('#telemetryPanelV345').textContent()).includes('rpc/portal_save_vaccinations_v287'));
  for(const width of [320,360,390,430,844]){await page.setViewportSize({width,height:width===844?390:844});assert(await page.locator('#telemetryPanelV345').evaluate(el=>el.scrollWidth<=el.clientWidth),'panel no overflow '+width);}
  await page.locator('[data-telemetry-close]').click();assert(!(await page.locator('#telemetryPanelV345').evaluate(el=>el.open)));
 }
 await page.evaluate(async base=>{window.__collectorFail=true;const r=await fetch(base+'/rest/v1/dogs?email=private@example.test');if(!r.ok)throw new Error('unexpected');window.ChvoTelemetry.capture('operation.error',{operation:'customer-operation'});await window.ChvoTelemetry.flush();},base);
 console.log('PASS actual '+app+' runtime: SDK export, private-field exclusion, duplicate suppression, response integrity, collector failure isolation'+(app==='admin'?', staff report and mobile/landscape dialog':''));
 await browser.close();
}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?[...packed.args.filter(x=>!x.includes('in-process-gpu')),'--disable-gpu']:['--no-sandbox']});
const page=await browser.newPage();await page.goto('about:blank');await page.clock.install();
await page.evaluate(()=>{window.__packets=[];window.fetch=(input,options={})=>String(input).includes('portal_telemetry_ingest')?(window.__packets.push(JSON.parse(options.body)),Promise.resolve(new Response('true'))):new Promise(()=>{});});
await page.addScriptTag({content:fs.readFileSync('telemetry-v345.js','utf8')});
await page.evaluate(base=>{window.ChvoTelemetry.init({app:'customer',build:'20261022-opentelemetry-v347',base,key:'synthetic-public',getToken:()=> 'synthetic-token',isReady:()=>false});window.pendingRequest=fetch(base+'/rest/v1/rpc/portal_save_vaccinations_v287');},base);
await page.clock.fastForward(30001);await page.evaluate(()=>window.ChvoTelemetry.flush());
const watchdogs=await page.evaluate(()=>window.__packets.flatMap(p=>p.p_payload.resourceSpans.flatMap(r=>r.scopeSpans.flatMap(s=>s.spans))));
assert(watchdogs.some(s=>s.attributes.some(a=>a.key==='operation'&&a.value.stringValue==='app-startup')),'startup watchdog');
assert(watchdogs.some(s=>s.attributes.some(a=>a.key==='operation'&&a.value.stringValue==='rpc/portal_save_vaccinations_v287')),'hung request watchdog');
assert(watchdogs.every(s=>s.attributes.some(a=>a.key==='exception.type'&&a.value.stringValue==='TimeoutError')));
console.log('PASS actual SDK watchdogs: 30s unfinished request and blocked startup are reported without cancelling app requests');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
