const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const owner='12345678-1234-1234-1234-123456789012';
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium,browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});try{
 for(const mode of ['success','no-native','wrong-account','server-failure','unsubscribe-failure','account-change','no-subscription','login','ordinary-pwa']){
  const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,1,390,type.name(),mode==='ordinary-pwa'?'':'#push-migration='+owner);
  if(type===webkit){assert.equal(await page.locator('#pushMigrationV397').count(),0,'iOS unaffected');await context.close();continue;}
  await page.evaluate(({owner,mode})=>{
   state.session.user.id=mode==='wrong-account'?'87654321-4321-4321-4321-210987654321':owner;
   if(mode==='login'){state.session=null;showAuth('login');loading(false);}
   window.__migrationCalls=[];window.__unsubscribed=0;window.__hasSub=mode!=='no-subscription';window.__nativeActive=mode!=='no-native';
   const sub={endpoint:'https://push.fixture/this-browser',toJSON:()=>({endpoint:'https://push.fixture/this-browser',keys:{}}),unsubscribe:async()=>{window.__unsubscribed++;if(mode==='unsubscribe-failure')throw Error('retry');window.__hasSub=false;return true}};
   Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>window.__hasSub?sub:null}}),getRegistration:async()=>({pushManager:{getSubscription:async()=>window.__hasSub?sub:null}})}});
   window.Notification={permission:'granted'};
   const original=window.fetch;window.fetch=async(url,opts={})=>{
    if(String(url).includes('customer-native-push')){window.__migrationCalls.push({url,body:JSON.parse(opts.body)});if(mode==='account-change')state.session=null;return {ok:true,json:async()=>({native_active:window.__nativeActive})};}
    if(String(url)===PUSH_API){window.__migrationCalls.push({url,body:JSON.parse(opts.body)});return {ok:mode!=='server-failure'};}
    return original(url,opts);
   };
   runCustomerHooks('afterBootstrap');
  },{owner,mode});
  if(mode==='ordinary-pwa'){assert.equal(await page.locator('#pushMigrationV397').count(),0);await context.close();continue;}
  if(mode==='login'){assert(await page.locator('#pushMigrationLoginV397').isVisible());assert.equal(await page.evaluate(()=>__unsubscribed),0);await context.close();continue;}
  await page.locator('#pushMigrationV397').waitFor({state:'visible'});
  if(mode==='wrong-account'){assert(await page.locator('#pushMigrationConfirmV397').isDisabled());assert.equal(await page.evaluate(()=>__unsubscribed),0);await context.close();continue;}
  await page.locator('#pushMigrationConfirmV397').click();
  await page.waitForFunction(()=>!document.querySelector('#pushMigrationCloseV397').disabled);
  const result=await page.evaluate(()=>({calls:__migrationCalls,unsubscribed:__unsubscribed,disabled:localStorage.getItem('chvo-web-push-migrated'),enabled:localStorage.getItem('chvostikovo_push_enabled'),text:document.querySelector('#pushMigrationStatusV397').textContent}));
  if(['success','no-subscription'].includes(mode)){
   assert.equal(result.disabled,'1');assert.equal(result.enabled,'0');assert.match(result.text,/Hotovo/);
   assert.equal(result.unsubscribed,mode==='success'?1:0);
   if(mode==='success')assert.deepEqual(result.calls.at(-1).body,{audience:'customer',action:'unsubscribe',endpoint:'https://push.fixture/this-browser'});
   const before=result.calls.length;await page.evaluate(async()=>{await ensurePushState(true);await syncPushSubscriptionV75({endpoint:'https://push.fixture/other',toJSON:()=>({})});window.dispatchEvent(new Event('focus'));});await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>__migrationCalls.length),before,'resume/healing cannot re-enable migrated push');
  }else if(mode==='unsubscribe-failure'){assert.equal(result.disabled,'1','failed browser unsubscribe must not heal server subscription');assert.doesNotMatch(result.text,/Hotovo/);}
  else{assert.equal(result.disabled,null);assert.equal(result.unsubscribed,0);assert(!result.calls.some(c=>c.body.action==='unsubscribe'&&mode!=='server-failure'));assert.doesNotMatch(result.text,/Hotovo/);}
  assert.deepEqual(errors,[]);await context.close();console.log('PASS browser migration',mode);
 }
 const native=await require('./liquid-v3-fixture.cjs')(browser,1,390,type.name());
 await native.page.evaluate(()=>{window.__nativeMigrationOpens=0;window.ChvoNative={active:true,canMigratePush:()=>false,openPushMigration:async()=>{window.__nativeMigrationOpens++}};window.__customerOnboardingCompleteV75=true;document.dispatchEvent(new Event('customer-onboarding-ready-v358'));});
 assert.equal(await native.page.locator('#pushMigrationOpenV397').count(),0,'no prompt before confirmed native push');
 await native.page.evaluate(()=>{window.ChvoNative.canMigratePush=()=>true;document.dispatchEvent(new Event('customer-onboarding-ready-v358'));});
 assert(await native.page.locator('#pushMigrationV397').isVisible());await native.page.locator('#pushMigrationConfirmV397').click();assert.equal(await native.page.evaluate(()=>__nativeMigrationOpens),1);
 await native.page.evaluate(()=>document.dispatchEvent(new Event('customer-onboarding-ready-v358')));assert(!await native.page.locator('#pushMigrationV397').isVisible(),'one automatic offer per account');assert.equal(await native.page.locator('#pushMigrationOpenV397').count(),1,'manual retry remains available');await native.context.close();console.log('PASS native handoff offer gating and retry');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
