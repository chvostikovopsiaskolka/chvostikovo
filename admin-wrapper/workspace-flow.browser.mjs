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
  if(u.origin==='https://fixture.test'&&u.pathname==='/viewport-diagnostics.mjs')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/viewport-diagnostics.mjs','utf8')});
  if(u.origin==='https://fixture.test'&&u.pathname==='/admin-pair-v409.js')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/admin-pair-v409.js','utf8')});
  if(u.origin==='https://fixture.test'&&u.pathname==='/admin-shared-pass-v410.js')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/admin-shared-pass-v410.js','utf8')});
  if(u.origin==='https://fixture.test'&&u.pathname==='/admin-ux-v424.js')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/admin-ux-v424.js','utf8')});
  if(u.origin==='https://fixture.test'&&u.pathname==='/admin-ux-v424.css')return r.fulfill({contentType:'text/css',body:readFileSync('admin-wrapper/admin-ux-v424.css','utf8')});
  if(u.pathname.endsWith('/chvostikovo-frontend')){frontendCalls++;await new Promise(resolve=>setTimeout(resolve,300));if(failures-->0)return r.fulfill({status:503,body:'Synthetic unavailable'});return r.fulfill({contentType:'text/html',body:snapshot});}
  if(/\.(?:png|webp|svg)$/.test(u.pathname))return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"/>'});
  if(/\/rest\/v1\//.test(u.pathname))return r.fulfill({contentType:'application/json',body:'[]'});
  return r.abort();});
 await p.goto('https://fixture.test/');assert.equal(await p.locator('#projectPicker').count(),0,'No workspace chooser in shell');await p.waitForFunction(()=>!document.getElementById('boot')?.classList.contains('hidden'));assert.equal(await p.locator('#boot').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 250, 245)');const bounds=await p.locator('#boot').boundingBox();assert.equal(await p.locator('#boot').evaluate(el=>getComputedStyle(el).position),'fixed');assert.equal(Math.abs(bounds.y+bounds.height-p.viewportSize().height)<1,true,'wrapper loader covers viewport');
 const originalViewport=p.viewportSize();await p.setViewportSize({width:originalViewport.width,height:originalViewport.height-85});const shortBoot=await p.locator('#boot').boundingBox();assert(Math.abs(shortBoot.y)<1&&Math.abs(shortBoot.y+shortBoot.height-p.viewportSize().height)<1,'Loader follows iOS viewport height changes');await p.setViewportSize(originalViewport);
 await p.locator('#chvoLoadRetry').waitFor();const retryBounds=await p.locator('#chvoLoadRetry').boundingBox();assert(retryBounds.y+retryBounds.height<=p.viewportSize().height,'retry stays visible in landscape');await p.evaluate(()=>{const b=document.getElementById('chvoLoadRetry');b.click();b.click();});await p.locator('#loginView:not(.hidden)').waitFor();assert.equal(frontendCalls,2,'one explicit retry only');assert.equal(await p.locator('#appBoot').count(),0);assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(245, 246, 248)');assert.equal(await p.locator('#adminSettingsModal').evaluate(e=>e.classList.contains('hidden')),true);
 assert.equal(await p.locator('#chvoMenuToggleV424').count(),1,'Native admin has new drawer entry');
 assert.equal(await p.locator('#chvoAttentionV424').count(),1,'Priority board renders without replacing existing cards');
 assert.equal(await p.locator('#chvoWeekSummaryV424').count(),1,'Five-day week summary renders');
 assert.equal(await p.locator('#chvoDrawerV424').count(),1,'Secondary navigation remains accessible');
 assert.equal(await p.locator('#chvo-boot-continuity-v424').count(),1,'Inner admin boot covers viewport during handoff');
 assert.equal(await p.locator('#adminSwitchWorkspace').count(),0,'obsolete workspace row removed from assembled admin');
 assert.equal(await p.locator('#adminSettingsPhotoV72').count(),1,'profile photo retained');
 assert.equal(await p.locator('#pushSetupCard').count(),1,'notification preference retained');
 const reopened=p.waitForRequest(req=>req.url().includes('/chvostikovo-frontend'));
 await p.evaluate(()=>{sessionStorage.setItem('chvostikovo_supabase_session','SYNTHETIC-CHVO');sessionStorage.setItem('bellaris-staff-session-v1','SYNTHETIC-BELLARIS');});
 await p.reload();await reopened;await p.locator('#loginView:not(.hidden)').waitFor();
 assert.equal(frontendCalls,3,'Reload still launches Chvostikovo directly');assert.deepEqual(await p.evaluate(()=>[sessionStorage.getItem('chvostikovo_supabase_session'),sessionStorage.getItem('bellaris-staff-session-v1')]),[null,'SYNTHETIC-BELLARIS'],'Invalid synthetic Chvo auth is cleared on boot, unrelated Bellaris storage is untouched');assert.equal(await p.locator('#projectPicker').count(),0);assert.deepEqual(errors,[]);await c.close();console.log(width+' direct Chvostikovo boot→retry→assembled login→relaunch without switch; settings, loader bounds, storage retention PASS (synthetic auth)');}}
finally{await browser.close();}
