const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('app.js','utf8'),code=source.slice(source.indexOf('async function sharedQuoteResponseV265'),source.indexOf('let customerApiMutationsInFlight'));
async function check(mode,body){
 let calls=0,refreshes=0,deadline;
 const ctx={API:'https://fixture.invalid',SUPABASE_KEY:'public',state:{session:{access_token:'fixture'}},navigator:{onLine:mode!=='offline'},AbortController,setTimeout:fn=>{deadline=fn;return 1},clearTimeout(){},refreshSession:async()=>{refreshes++},fetch:async(url,opts)=>{calls++;if(mode==='timeout')return new Promise((_,reject)=>{opts.signal.addEventListener('abort',()=>reject(Error('aborted')));queueMicrotask(()=>deadline())});if(mode==='offline'||mode==='fail'||(mode==='recover'&&calls===1))throw TypeError('Load failed');return {ok:mode!=='validation',status:mode==='validation'?400:200,text:async()=>JSON.stringify(mode==='validation'?{error:'Kapacita je plná.'}:{data:{quote:[]}})}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const invoke=()=>vm.runInContext('apiCore('+JSON.stringify(body)+')',ctx);
 if(['fail','timeout','offline'].includes(mode)){await assert.rejects(invoke,/Nepodarilo sa spojiť/);assert.equal(calls,mode==='offline'?1:2)}
 else if(mode==='validation'){await assert.rejects(invoke,/Kapacita/);assert.equal(calls,1)}
 else{await invoke();assert.equal(calls,mode==='recover'?2:1)}
 assert.equal(refreshes,0);
}
(async()=>{
 const quote={action:'shared_booking_v257',items:[]};for(const mode of ['recover','fail','timeout','offline','validation'])await check(mode,quote);
 // Writes do not enter automatic transport retry and keep their operation identity.
 await check('ok',{...quote,operation_id:'stable-operation'});
 let calls=0;const ctx={API:'fixture',SUPABASE_KEY:'public',state:{session:{access_token:'fixture'}},fetch:async()=>{calls++;throw TypeError('Load failed')}};vm.createContext(ctx);vm.runInContext(code,ctx);await assert.rejects(vm.runInContext('apiCore({action:"shared_booking_v257",operation_id:"same"})',ctx),/Load failed/);assert.equal(calls,1);
 console.log('PASS read-only quote retries transport once, bounded timeout, offline/validation no retry; booking writes never automatically replay');
})().catch(e=>{console.error(e);process.exitCode=1});
