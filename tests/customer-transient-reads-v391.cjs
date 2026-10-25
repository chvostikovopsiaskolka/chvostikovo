'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const s=fs.readFileSync('app.js','utf8');
const from=s.indexOf('async function customerReadJsonV391(');
const to=s.indexOf('async function readActiveCustomerTermsV146(',from);
assert(from>=0&&to>from,'v391 implementation must exist');
const impl=s.slice(from,to);
const factory=Function('state','document','navigator','ensureCustomerSessionV357','fetch','SUPABASE_KEY','setTimeout',
  impl+'\nreturn customerReadJsonV391;');
const success={ok:true,status:200,text:async()=>JSON.stringify([{id:9}])};
async function test(mode){
 let calls=0,states={session:{user:{id:'owner-A'},access_token:'A-token'}};
 let doc={visibilityState:'visible'},nav={onLine:true};
 let later=(fn)=>{fn();return 0};
 let fetcher=async(url,options)=>{
   assert.equal(options.method,'GET','only safe reads');
   assert.equal(options.headers.Authorization,'Bearer '+states.session.access_token);
   calls++;
   if(mode==='transient'&&calls===1)throw Object.assign(new Error('network'),{name:'TypeError'});
   if(mode==='permanent')throw Object.assign(new Error('network'),{name:'TypeError'});
   if(mode==='offline'||mode==='hidden')throw Object.assign(new Error('network'),{name:'TypeError'});
   if(mode==='http500')return {ok:false,status:500,text:async()=>JSON.stringify({error:'maintenance'})};
   if(mode==='bad-json')return {ok:true,status:200,text:async()=>'{broken'};
   return success;
 };
 const delay=(fn)=>{
   if(mode==='logout')states.session=null;
   if(mode==='account')states.session={user:{id:'owner-B'},access_token:'B-token'};
   if(mode==='offline')nav.onLine=false;
   if(mode==='hidden')doc.visibilityState='hidden';
   fn();return 0;
 };
 const client=factory(states,doc,nav,async()=>states.session,fetcher,'synthetic',delay);
 if(mode==='logout'||mode==='account'){
   fetcher=async()=>{calls++;throw Object.assign(new Error('network'),{name:'TypeError'})};
   // Fresh function captures the synthetic transport failure.
   const run=factory(states,doc,nav,async()=>states.session,fetcher,'synthetic',delay);
   await assert.rejects(run('https://safe.test/read','owner-A'),e=>e.code==='session_changed');
   assert.equal(calls,1);
   return;
 }
 if(mode==='offline'||mode==='hidden'||mode==='permanent'){
   await assert.rejects(client('https://safe.test/read','owner-A'));
   assert.equal(calls,mode==='permanent'?2:1);return;
 }
 if(mode==='bad-json'){
   await assert.rejects(client('https://safe.test/read','owner-A'),SyntaxError);
   assert.equal(calls,1);return;
 }
 const result=await client('https://safe.test/read','owner-A');
 assert.equal(result.response.status,mode==='http500'?500:200);
 assert.equal(calls,mode==='transient'?2:1);
}
(async()=>{
 for(const mode of ['healthy','transient','permanent','offline','hidden','logout','account','http500','bad-json']){
   await test(mode);console.log('PASS v391 GET',mode)
 }
 assert(s.includes('if(announcementsInFlightV391?.ownerId===ownerId)return announcementsInFlightV391.promise'),
   'announcement requests should be coalesced by owner');
 assert(s.includes("const [ann,dis]=await Promise.all"),'both announcement data reads remain');
 assert(s.includes("if(!ann.response.ok||state.session?.user?.id!==ownerId)return"),
   'old account must never receive announcement DOM updates');
 assert(s.includes("if(!response.ok)throw new Error('Pravidlá sa nepodarilo načítať.')"),
   'HTTP failure remains visible to rules caller');
 assert(s.includes("method:'GET'"),'v391 helper is GET only');
 assert(s.includes("async function customerReadResponseV367("),'original customer-portal-api recovery preserved');
 console.log('PASS v391 isolated read recovery and scope contracts');
})().catch(error=>{console.error(error);process.exitCode=1});
