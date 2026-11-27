const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
(async()=>{
 const browser=await engine.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});let refreshes=0,mode='ok';const logouts=[],errors=[];
  const session=token=>({access_token:token,refresh_token:'refresh-'+token,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-browser'}});
  const data={profile:{status:'active',full_name:'Synthetic',intro_guide_eligible:false,privacy_notice_acknowledged_at:'2099-01-01',push_prompt_answered_at:'2099-01-01'},dogs:[{id:1,name:'Synthetic',sex:'female'}],notifications:[],passes:[],requests:[],reservations:[],messages:[],vaccinations:[],vaccination_proofs:[],availability:{days:[]}};
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   const json=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
   if(url.pathname==='/auth/v1/token'){
    refreshes++;await new Promise(r=>setTimeout(r,40));
    if(mode==='offline')return route.abort('internetdisconnected');
    if(mode==='invalid')return json({code:'refresh_token_not_found',msg:'Invalid refresh token'},400);
    return json(session('rotated-'+refreshes));
   }
   if(url.pathname==='/auth/v1/logout'){logouts.push(url.searchParams.get('scope'));return json({});}
   if(url.pathname.endsWith('/customer-portal-api'))return json(data);
   if(url.pathname.includes('portal_terms_documents'))return json([{version:'synthetic',document_hash:'hash'}]);
   if(url.hostname!=='session.fixture')return json([]);
   const file=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});
  });
  await context.addInitScript(()=>{if(!localStorage.getItem('chvostikovo_customer_session'))localStorage.setItem('chvostikovo_customer_session',JSON.stringify({access_token:'expired',refresh_token:'refresh-expired',expires_at:1,user:{id:'synthetic-browser'}}));});
  const a=await context.newPage(),b=await context.newPage();for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
  await Promise.all([a.goto('https://session.fixture/'),b.goto('https://session.fixture/')]);
  for(const p of [a,b])await p.waitForFunction(()=>state.session?.access_token.startsWith('rotated-')&&!!state.data);
  assert.equal(refreshes,1,'two real tabs rotate only once');
  await a.reload();await a.waitForFunction(()=>!!state.data);assert.equal(refreshes,1,'update/reload preserves valid login');
  mode='offline';await a.evaluate(()=>saveSession({...state.session,expires_at:1},true));
  const offline=await a.evaluate(async()=>{try{await refreshSession();return false}catch(e){return e.authRefreshTransient&&!!localStorage.getItem(SESSION_KEY)}});assert(offline);
  mode='ok';await a.evaluate(async()=>{lastResumeRefresh=0;await refreshOnResume()});
  await a.waitForFunction(()=>!customerSessionNeedsRefreshV357());
  assert.equal(await b.evaluate(async()=>{await ensureCustomerSessionV357();return state.session.access_token}),await a.evaluate(()=>state.session.access_token));
  await a.evaluate(()=>document.getElementById('logoutBtn').click());
  await a.waitForFunction(()=>!state.session);await b.evaluate(async()=>{try{await ensureCustomerSessionV357()}catch(_){}});
  assert.equal(await b.evaluate(()=>state.session),null);assert.deepEqual(logouts,['local']);
  mode='invalid';await a.evaluate(()=>saveSession({access_token:'invalid',refresh_token:'invalid',expires_at:1,user:{id:'synthetic-browser'}},true));
  await a.evaluate(async()=>{lastResumeRefresh=0;await refreshOnResume()});assert.equal(await a.evaluate(()=>state.session),null);
  assert.deepEqual(errors,[]);console.log('PASS '+(process.env.V3_ENGINE||'chromium')+': two tabs, reload/update, offline/online, resume, invalid token and intentional local logout; full app.js');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
