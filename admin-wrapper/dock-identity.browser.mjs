import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium,webkit}=createRequire(import.meta.url)('playwright');const b=await(process.env.BELLARIS_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.platform==='win32'&&process.env.BELLARIS_BROWSER!=='webkit'?{channel:'msedge'}:{})});
try{for(const width of [320,390,430,844,1440]){
 const p=await b.newPage({viewport:{width,height:width===844?390:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://fixture.test/**',r=>{const path=new URL(r.request().url()).pathname;if(path==='/')return r.fulfill({contentType:'text/html',body:'<style>'+readFileSync('admin-wrapper/bellaris-admin.css','utf8')+'</style><div id="bellarisDashboard"></div><script type="module" src="/bellaris-admin.mjs"></script>'});if(path==='/reporting-period.mjs')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/reporting-period.mjs','utf8')});if(path==='/bellaris-admin.mjs')return r.fulfill({contentType:'application/javascript',body:readFileSync('admin-wrapper/bellaris-admin.mjs','utf8')+'\nwindow.__bm={state,render,handleClick};'});return r.abort()});
 await p.route('https://bellaris-client-portal.pages.dev/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg"/>'}));await p.goto('https://fixture.test/');await p.waitForFunction(()=>window.__bm);
 await p.evaluate(()=>{const m=window.__bm;m.state.root=document.getElementById('bellarisDashboard');m.state.user={id:'test-staff'};m.render();window.dock=m.state.root.querySelector('.bm-nav');m.state.root.addEventListener('click',e=>void m.handleClick(e));});
 assert.equal(await p.locator('#bellarisDashboard').evaluate(e=>getComputedStyle(e).position),'relative','app uses the document canvas rather than a fixed viewport layer');
 for(let round=0;round<3;round++)for(const tab of ['projects','inquiries','traffic','menu','overview']){
  await p.locator('[data-bm="'+tab+'"]').first().click();assert.equal(await p.evaluate(()=>window.dock===document.querySelector('.bm-nav')),true,'dock must retain node identity');
  const rect=await p.locator('.bm-nav').boundingBox();assert.equal(Math.abs(rect.y+rect.height-p.viewportSize().height)<1,true);assert.equal(await p.locator('.bm-nav .active').getAttribute('data-bm'),tab);
 }
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await p.close();console.log(width+' repeated actual tab handlers, one dock identity and bottom position PASS');}}
finally{await b.close();}
