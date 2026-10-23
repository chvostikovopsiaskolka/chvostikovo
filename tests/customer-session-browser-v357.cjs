const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const packed=require(process.env.PACKED_CHROMIUM);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:packed.args.filter(x=>!x.includes('in-process-gpu'))});
 try{const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='fixture.local')return route.fulfill({status:200,body:'[]',contentType:'application/json'});const file=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);return fs.existsSync(file)?route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'}):route.fulfill({status:404,body:''});});
 await page.addInitScript(()=>{
  window.__calls=[];window.__refreshRelease=null;
  localStorage.setItem('chvostikovo_customer_session',JSON.stringify({access_token:'old',refresh_token:'old-refresh',expires_at:1,user:{id:'synthetic-browser'}}));
  window.fetch=async(url,opts={})=>{url=String(url);window.__calls.push({url,authorization:opts.headers?.Authorization||'',method:opts.method||'GET'});
   if(url.includes('grant_type=refresh_token')){await new Promise(r=>window.__refreshRelease=r);return new Response(JSON.stringify({access_token:'new',refresh_token:'new-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-browser'}}));}
   if(url.endsWith('/customer-portal-api'))return new Response(JSON.stringify({profile:{status:'active',full_name:'Synthetic',privacy_notice_acknowledged_at:'2099-01-01',push_prompt_answered_at:'2099-01-01'},dogs:[{id:1,name:'Synthetic',sex:'female'}],notifications:[],passes:[],requests:[],reservations:[],messages:[],vaccinations:[],vaccination_proofs:[],availability:{days:[]}}));
   if(url.includes('portal_terms_documents'))return new Response(JSON.stringify([{version:'synthetic',document_hash:'hash'}]));
   return new Response('[]');
  };
 });
 await page.goto('https://fixture.local');await page.waitForFunction(()=>!!window.__refreshRelease);
 await page.evaluate(()=>{window.__parallel=Promise.all([readActiveCustomerTermsV146(),syncPushSubscriptionV75({endpoint:'https://push.fixture',toJSON:()=>({endpoint:'https://push.fixture',keys:{}})})]);});
 assert.equal(await page.evaluate(()=>window.__calls.filter(c=>/\/rest\/v1\/|\/functions\/v1\//.test(c.url)).length),0);
 await page.evaluate(()=>window.__refreshRelease());await page.evaluate(()=>window.__parallel);await page.waitForFunction(()=>document.getElementById('loading').classList.contains('hidden'));
 const calls=await page.evaluate(()=>window.__calls);assert.equal(calls.filter(c=>c.url.includes('grant_type=refresh_token')).length,1);assert(calls.filter(c=>/\/rest\/v1\/|\/functions\/v1\//.test(c.url)).every(c=>c.authorization==='Bearer new'));
 for(const width of [320,360,390,430,844]){await page.setViewportSize({width,height:width===844?390:844});await page.evaluate(()=>{document.getElementById('schoolTermsModal')?.classList.add('hidden');document.getElementById('dogDetailsModal')?.classList.add('hidden');switchTab('booking')});const a=await page.locator('.bottom-nav').boundingBox();await page.evaluate(()=>switchTab('menu'));const b=await page.locator('.bottom-nav').boundingBox();assert(a&&b);for(const key of ['x','y','width','height'])assert(Math.abs(a[key]-b[key])<1,'stable nav '+width+' '+key);}
 assert.deepEqual(errors,[]);console.log('PASS real Chromium cold expired session: one refresh, no old-token API/terms/push; Overview/Menu nav geometry stable at320/360/390/430/844');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
