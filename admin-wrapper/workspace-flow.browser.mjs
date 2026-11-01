import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium,webkit}=createRequire(import.meta.url)('playwright');const browser=await(process.env.BELLARIS_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.platform==='win32'&&process.env.BELLARIS_BROWSER!=='webkit'?{channel:'msedge'}:{})});
const wrapper=readFileSync('admin-wrapper/index.html','utf8'),snapshot=readFileSync(process.env.ADMIN_SOURCE,'utf8');
try{for(const width of [390,844]){const c=await browser.newContext({viewport:{width,height:width===844?390:844},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));let failures=1,frontendCalls=0;
 await p.addInitScript(()=>{
  const q={select(){return this},eq(){return this},is(){return this},order(){return this},limit:async()=>({data:[],error:null})};
  window.supabase={createClient:()=>({from:()=>q,rpc:async()=>({data:{},error:null}),auth:{
    onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};},
    getSession:async()=>({data:{session:null},error:null}),getUser:async()=>({data:{user:null},error:null})
  }})};
 });
 await p.route('**/*',async r=>{const u=new URL(r.request().url());
  if(u.origin==='https://fixture.test'&&u.pathname==='/')return r.fulfill({contentType:'text/html',body:wrapper});
  if(u.origin==='https://fixture.test'&&u.pathname==='/reporting-period.mjs')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/reporting-period.mjs','utf8')});
  if(u.origin==='https://fixture.test'&&u.pathname.startsWith('/bellaris-admin.'))return r.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'application/javascript',body:readFileSync('admin-wrapper'+u.pathname,'utf8')});
  if(u.pathname.endsWith('/chvostikovo-frontend')){frontendCalls++;await new Promise(resolve=>setTimeout(resolve,300));if(failures-->0)return r.fulfill({status:503,body:'Synthetic unavailable'});return r.fulfill({contentType:'text/html',body:snapshot});}
  if(u.hostname==='bellaris-client-portal.pages.dev'&&u.pathname==='/config.js')return r.fulfill({contentType:'application/javascript',body:'window.BELLARIS_PORTAL_CONFIG={supabaseUrl:"https://cycjpgjftbdcnrqisibw.supabase.co",publishableKey:"sb_publishable_SYNTHETIC"};'});
  if(u.hostname==='esm.sh')return r.fulfill({contentType:'application/javascript',body:'export const createClient=()=>({auth:{getUser:async()=>({data:{user:null},error:null})}});'});
  if(/\.(?:png|webp|svg)$/.test(u.pathname))return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"/>'});
  if(/\/rest\/v1\//.test(u.pathname))return r.fulfill({contentType:'application/json',body:'[]'});
  return r.abort();});
 await p.goto('https://fixture.test/');await p.locator('#chooseBellaris').click();await p.locator('#bellarisAdminLogin').waitFor();await p.locator('[data-bm="back"]').click();assert.equal(await p.locator('#projectPicker').getAttribute('hidden'),null);
 await p.locator('#chooseChvostikovo').click();await p.waitForFunction(()=>!document.getElementById('boot')?.classList.contains('hidden'));assert.equal(await p.locator('#boot').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 250, 245)');const bounds=await p.locator('#boot').boundingBox();assert.equal(Math.abs(bounds.y+bounds.height-p.viewportSize().height)<1,true,'wrapper loader covers viewport');
 await p.locator('#chvoLoadRetry').waitFor();const retryBounds=await p.locator('#chvoLoadRetry').boundingBox();assert(retryBounds.y+retryBounds.height<=p.viewportSize().height,'retry stays visible in landscape');await p.evaluate(()=>{const b=document.getElementById('chvoLoadRetry');b.click();b.click();});await p.locator('#loginView:not(.hidden)').waitFor();assert.equal(frontendCalls,2,'one explicit retry only');assert.equal(await p.locator('#appBoot').count(),0);assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(245, 246, 248)');assert.equal(await p.locator('#adminSettingsModal').evaluate(e=>e.classList.contains('hidden')),true);
 await p.evaluate(()=>{sessionStorage.setItem('chvostikovo_supabase_session','SYNTHETIC-CHVO');sessionStorage.setItem('bellaris-staff-session-v1','SYNTHETIC-BELLARIS');document.getElementById('adminSwitchWorkspace').click();});
 await p.locator('#projectPicker').waitFor();assert.deepEqual(await p.evaluate(()=>[sessionStorage.getItem('chvostikovo_supabase_session'),sessionStorage.getItem('bellaris-staff-session-v1')]),['SYNTHETIC-CHVO','SYNTHETIC-BELLARIS']);assert.equal(await p.locator('#projectPicker').count(),1);assert.deepEqual(errors,[]);await c.close();console.log(width+' real wrapper→Bellaris login→picker→Chvo assembled login→picker; loader bounds, one picker, storage retention PASS (synthetic auth)');}}
finally{await browser.close();}
