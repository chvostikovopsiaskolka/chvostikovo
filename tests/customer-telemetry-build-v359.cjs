const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;if(packed)packed.setGraphicsMode=false;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:packed?[...packed.args.filter(x=>!x.includes('in-process-gpu')),'--disable-gpu']:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),f=path.join(process.cwd(),u.pathname==='/'?'index.html':u.pathname);await route.fulfill({body:u.hostname==='fixture.local'&&fs.existsSync(f)?fs.readFileSync(f):'[]',contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':u.pathname==='/'?'text/html':'application/json'});});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'serviceWorker',{value:undefined});window.packets=[];window.failData=true;sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');localStorage.setItem('chvostikovo_customer_session',JSON.stringify({access_token:'SYNTHETIC_TOKEN',refresh_token:'SYNTHETIC_REFRESH',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-owner'}}));window.fetch=async(url,opts={})=>{
  if(String(url).includes('portal_telemetry_ingest')){window.packets.push(JSON.parse(opts.body));return new Response('true');}
  if(String(url).endsWith('/customer-portal-api'))return window.failData?new Response(JSON.stringify({error:'Could not query the database for the schema cache. Retrying.'}),{status:503}):new Response(JSON.stringify({profile:{status:'active',privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:[],requests:[],reservations:[],passes:[],visits:[],notifications:[],messages:[],vaccinations:[],vaccination_proofs:[],availability:{days:[]}}));
  return new Response('[]');};});
 await page.goto('http://fixture.local/');await page.locator('#startupRecoveryV359').waitFor({state:'visible'});
 assert(!await page.locator('#authView').isVisible());assert(await page.evaluate(()=>!!localStorage.getItem('chvostikovo_customer_session')));
 await page.evaluate(()=>window.ChvoTelemetry.flush());const packets=await page.evaluate(()=>window.packets);assert(packets.length);
 const packet=packets.find(p=>p.p_payload.resourceSpans[0].scopeSpans[0].spans.some(s=>s.attributes.some(a=>a.key==='operation'&&a.value.stringValue==='edge/customer-portal-api')));assert(packet,'actual failed bootstrap exported');
 const version=packet.p_payload.resourceSpans[0].resource.attributes.find(a=>a.key==='service.version').value.stringValue;assert.match(version,/^[0-9]{8}-[a-z0-9-]{1,70}$/);assert.match(version,/v359$/);
 for(const secret of ['SYNTHETIC_TOKEN','SYNTHETIC_REFRESH','synthetic-owner','Could not query'])assert(!JSON.stringify(packet).includes(secret));
 fs.writeFileSync('/tmp/customer-v359-telemetry-packet.json',JSON.stringify(packet.p_payload));await page.screenshot({path:'/tmp/customer-v359-recovery.png'});
 await page.evaluate(()=>{window.failData=false});await page.locator('#startupRetryV359').click();await page.locator('#startupRecoveryV359').waitFor({state:'hidden'});assert(!await page.locator('#authView').isVisible());assert.deepEqual(errors,[]);
 console.log('PASS actual customer boot503 → recovery → SDK packet with accepted build/privacy → manual retry without login');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
