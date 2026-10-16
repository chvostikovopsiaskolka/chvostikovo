const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=require('../tools/build-admin-crm-v263.cjs')();
let events=[],rpc=[],reloads=0,failConvert=false,handler;
const input={value:''},message={textContent:'',innerHTML:''},buttons=[{disabled:false}];
const state={introPairV250:{sourceId:101,busy:false},introVisits:[],webSubmissions:[{id:101}]};
const ctx=vm.createContext({state,$:id=>id==='introVisitMessage'?message:id==='introVisitForm'?{querySelectorAll:()=>buttons}:input,readPairIntroV250:()=>({date:'2026-10-19',time:'10:00',owner:'Customer',phone:'+421912345678',dogs:[{dog_name:'Bella'},{dog_name:'Iris'}]}),withJwtRetry:fn=>fn(),supabase:{rpc:async(name,p)=>{rpc.push(name);return name==='save_web_intro_two_v250'?{data:{visit:{id:3,source_submission_id:101},created:true}}:failConvert?{error:Error('Failed registration')}:{data:{dog_ids:[87,88]}}}},sendMetaCrmStage:async(id,stage)=>{events.push(stage);return {ok:false}},loadData:async()=>{},sessionStorage:{removeItem(){}},renderIntroVisits(){},renderWeek(){},closeDogCreate(){},switchTab(){},queueAdminLive(){}});
new vm.Script(html.slice(html.indexOf('async function savePairIntroV250('),html.indexOf('\nasync function prefillSubmissionIntroVisit('))).runInContext(ctx);
(async()=>{
 await ctx.savePairIntroV250(null,false);assert.deepEqual(events,['qualified']);assert.equal(state.introPairV250.busy,false);
 events=[];await ctx.savePairIntroV250(null,true);assert.deepEqual(events,['qualified','converted']);assert.equal(state.introPairV250.busy,false);
 events=[];failConvert=true;await ctx.savePairIntroV250(null,true);assert.equal(events.length,0);assert.match(message.textContent,/Failed registration/);failConvert=false;
 const start=html.indexOf("  action.addEventListener('click',async function(){",html.indexOf('var bothDone=response.data.every'));
 const end=html.indexOf('  });',start)+6;
 const direct=vm.createContext({action:{addEventListener:(_,f)=>handler=f},confirm:()=>true,c:{rpc:async()=>({data:{dog_ids:[87,88]}})},id:101,sendMetaCrmStage:async(_,stage)=>{events.push(stage);return {ok:false}},alert(){},location:{reload:()=>{events.push('reload');reloads++}}});
 new vm.Script(html.slice(start,end)).runInContext(direct);events=[];await handler();assert.deepEqual(events,['converted','reload']);assert.equal(reloads,1);
 console.log('PASS actual pair intro/register handlers send qualified then converted on success, no false converted on DB failure, direct pair sends before reload, CAPI outage cannot undo successful registration; durable retry covered separately');
})().catch(e=>{console.error(e);process.exitCode=1});
