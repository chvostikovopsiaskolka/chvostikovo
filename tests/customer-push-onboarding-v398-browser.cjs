const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium,browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});try{
 for(const mode of ['new-before-assignment','existing-pwa','existing-native','native-answered']){
  const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,1,390,type.name());
  await page.evaluate(mode=>{
   if(mode==='new-before-assignment'){state.data.dogs=[];state.data.profile.push_prompt_answered_at=null;}
   if(mode==='existing-native'||mode==='native-answered'){
    window.__pushChoice=mode==='native-answered';
    window.ChvoNative={active:true,ensurePush:async()=>false,needsPushPrompt:()=>!window.__pushChoice,markPushPromptAnswered:account=>{if(account===state.session.user.id)window.__pushChoice=true}};
   }
   runCustomerHooks('afterBootstrap');
  },mode);
  if(mode==='new-before-assignment'||mode==='existing-native'){
   await page.locator('#pushOnboardingModalV75').waitFor({state:'visible'});
   assert(!await page.locator('#waitingDogAssignmentModalV75').isVisible(),'new user is offered push before the assignment wait');
   await page.locator('#pushOnboardingSkipV75').click();
   await page.locator('#pushOnboardingModalV75').waitFor({state:'hidden'});
   if(mode==='new-before-assignment')await page.locator('#waitingDogAssignmentModalV75').waitFor({state:'visible'});
   else{assert(await page.evaluate(()=>__pushChoice));await page.evaluate(()=>runCustomerHooks('afterBootstrap'));await page.waitForTimeout(150);assert(!await page.locator('#pushOnboardingModalV75').isVisible(),'existing native account choice is respected');}
  }else{await page.waitForTimeout(200);assert(!await page.locator('#pushOnboardingModalV75').isVisible(),'existing PWA/iOS/native choice unchanged');}
  assert.equal(await page.locator('#pushMigrationV397,#pushMigrationOpenV397').count(),0,'no Chrome tutorial or link');
  assert.deepEqual(errors,[]);await context.close();console.log('PASS push onboarding',type.name(),mode);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
