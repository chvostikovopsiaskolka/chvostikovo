const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 try{
  const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,1,390,type.name());
  const result=await page.evaluate(async()=>{
   const assert=(ok,message)=>{if(!ok)throw new Error(message||'Browser assertion failed');};
   assert.equal=(a,b,message)=>assert(Object.is(a,b),message||('Expected '+String(b)+' but got '+String(a)));
   const calls=[];
   const native={
    active:true,pending:null,
    attach(host){this.host=host;calls.push('attach');},
    prepareLaunch:async()=>{calls.push('launch');return false;},
    async ensurePush(){calls.push('ensure');this.host.setPush(false);return false;},
    async enablePush(){calls.push('native-enable');await this.host.completePushPrompt();this.host.setPush(true);return true;},
    async togglePush(){calls.push('native-toggle');this.host.setPush(!state.pushEnabled);},
    takeNotification(){const q=this.pending;this.pending=null;return q;},
    logout:async()=>{calls.push('native-logout');}
   };
   window.ChvoNative=native;
   assert.equal(window.customerAttachNativePushV426(),true);
   assert.equal(window.customerAttachNativePushV426(),true,'bridge attach idempotent');
   assert.equal(calls.filter(x=>x==='attach').length,1);
   const pushStatus=await ensurePushState(true);
   assert.equal(pushStatus,false);
   assert.equal(state.pushChecked,true);
   // No ServiceWorker/PushManager in the fixture: native still enables via FCM.
   assert.equal(navigator.serviceWorker,undefined);
   await enablePushForCurrentUserV75();
   assert.equal(state.pushEnabled,true);
   assert(!!state.data.profile.push_prompt_answered_at);
   await togglePush();
   assert.equal(state.pushEnabled,false);
   assert(calls.includes('native-enable')&&calls.includes('native-toggle'));
   assert(!calls.includes('web-subscribe')&&!calls.includes('unsupported'));
   // Settings' secondary toggle must also invoke native, not duplicate Web Push.
   const before=calls.filter(x=>x==='native-toggle').length;
   const trigger=document.getElementById('settingsPushToggleV37');
   if(trigger){trigger.click();await new Promise(resolve=>setTimeout(resolve,120));}
   if(trigger)assert(calls.filter(x=>x==='native-toggle').length>before);
   // Account-scoped notification URLs only, no cross-owner navigation.
   native.pending='open=messages&conversation=7&recipient=99999999-9999-9999-9999-999999999999';
   window.__customerOnboardingCompleteV75=true;
   native.host.openNotification();
   assert(!location.search.includes('99999999'),'recipient mismatch ignored');
   return {calls,enabled:state.pushEnabled,settings:!!trigger};
  });
  assert(result.calls.includes('native-enable'));
  assert.deepEqual(errors,[]);
  console.log('PASS native Capacitor push is selected without Web Push, owner-scoped, '+type.name(),result);
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
