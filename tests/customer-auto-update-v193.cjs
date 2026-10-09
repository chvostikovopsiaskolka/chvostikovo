const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(process.argv[2]||__dirname+'/../app.js','utf8');
const code=app.slice(app.indexOf('/* Check a static release marker'),app.indexOf('async function pushSubscription()',app.indexOf('/* Check a static release marker')));
function fixture(storage=new Map()){
 let now=1000000,reloads=0,requests=0,responseBuild='current',failure=false,deferred=null;
 const listeners={},elements=new Map(),dirtyInput={value:'',defaultValue:'',type:'text',isConnected:true,matches:()=>true,getClientRects:()=>[{}]};
 const doc={visibilityState:'visible',activeElement:null,querySelectorAll:()=>[],addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)};
 const ctx={APP_BUILD:'current',state:{},document:doc,navigator:{onLine:true},window:{location:{reload:()=>reloads++}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:{now:()=>now},AbortController,setTimeout,clearTimeout,getComputedStyle:()=>({visibility:'visible'}),$:id=>elements.get(id),customerApiMutationsInFlight:0,bootstrapInFlight:null,customerSyncInFlight:null,dogSaveInFlightV145:false,vaccinationProofUploadInFlightV143:null,fetch:async(url,opts)=>{requests++;assert.equal(url,'/version.json');assert.equal(opts.cache,'no-store');if(deferred)await deferred;if(failure)throw Error('offline');return {ok:true,json:async()=>({build:responseBuild})}}};vm.createContext(ctx);vm.runInContext(code,ctx);
 return {ctx,doc,storage,listeners,dirtyInput,elements,check:()=>ctx.checkCustomerRelease(),apply:()=>ctx.applyPendingCustomerUpdate(),metrics:()=>({requests,reloads}),advance:()=>now+=300001,build:v=>responseBuild=v,fail:()=>failure=true,defer:p=>deferred=p};
}
(async()=>{
 const same=fixture();await same.check();await Promise.all(Array.from({length:20},()=>same.check()));assert.deepEqual(same.metrics(),{requests:1,reloads:0});same.advance();await same.check();assert.equal(same.metrics().requests,2);
 const hidden=fixture();hidden.doc.visibilityState='hidden';await hidden.check();assert.equal(hidden.metrics().requests,0);hidden.doc.visibilityState='visible';hidden.ctx.navigator.onLine=false;await hidden.check();assert.equal(hidden.metrics().requests,0);
 const concurrent=fixture();let resolve;concurrent.defer(new Promise(r=>resolve=r));const work=Array.from({length:20},()=>concurrent.check());resolve();await Promise.all(work);assert.equal(concurrent.metrics().requests,1);
 const change=fixture();change.build('release-2');await change.check();assert.equal(change.metrics().reloads,1);await change.check();assert.equal(change.metrics().reloads,1);
 const stale=fixture(change.storage);stale.build('release-2');stale.advance();await stale.check();assert.equal(stale.metrics().reloads,0);stale.build('release-3');stale.advance();await stale.check();assert.equal(stale.metrics().reloads,1);
 const draft=fixture();draft.build('release-2');draft.listeners.focusin[0]({target:draft.dirtyInput});draft.dirtyInput.value='Rozpísaný formulár';draft.listeners.input[0]({target:draft.dirtyInput});await draft.check();assert.equal(draft.metrics().reloads,0);draft.dirtyInput.value='';draft.listeners.input[0]({target:draft.dirtyInput});assert(draft.apply());assert.equal(draft.metrics().requests,1);
 for(const flag of ['customerApiMutationsInFlight','bootstrapInFlight','customerSyncInFlight','dogSaveInFlightV145','vaccinationProofUploadInFlightV143']){const busy=fixture();busy.build('release-2');busy.ctx[flag]=1;await busy.check();assert.equal(busy.metrics().reloads,0);busy.ctx[flag]=0;assert(busy.apply())}
 const photo=fixture();photo.build('release-2');photo.ctx.window.__customerPhotoPickerV88=true;await photo.check();assert.equal(photo.metrics().reloads,0);photo.ctx.window.__customerPhotoPickerV88=false;assert(photo.apply());
 const message=fixture();message.build('release-2');message.elements.set('supportMessageBodyV52',{value:'Draft even in closed chat'});await message.check();assert.equal(message.metrics().reloads,0);
 const modal=fixture();modal.build('release-2');modal.doc.querySelectorAll=()=>[{getClientRects:()=>[{}]}];await modal.check();assert.equal(modal.metrics().reloads,0);modal.doc.querySelectorAll=()=>[];assert(modal.apply());
 const outage=fixture();outage.fail();await outage.check();await outage.check();assert.deepEqual(outage.metrics(),{requests:1,reloads:0});
 const invalid=fixture();invalid.build('<invalid build>');await invalid.check();assert.equal(invalid.metrics().reloads,0);
 const noStorage=fixture();noStorage.build('release-2');noStorage.ctx.sessionStorage.setItem=()=>{throw Error('denied')};await noStorage.check();assert.equal(noStorage.metrics().reloads,0);
 console.log('PASS: foreground only, five-minute throttle, single concurrent request, unchanged release, one reload per target, stale HTML loop guard, later release, form/message/modal/upload/mutation deferral, offline/error/invalid marker/storage failure');
})().catch(e=>{console.error(e);process.exit(1)});
