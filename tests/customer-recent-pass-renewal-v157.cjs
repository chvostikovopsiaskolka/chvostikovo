const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8');
async function setup(eligible=true,pending=false){
 const dom=new JSDOM('<body></body>',{url:'https://app.chvostikovo.sk/',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.state={selectedDogId:77,session:{access_token:'test'},data:{pass_requests:pending?[{dog_id:77,status:'pending'}]:[]}};
 w.SUPABASE_URL='https://test.invalid';w.SUPABASE_KEY='public';
 w.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return{ok:true,json:async()=>eligible}};
 let succeed=true,confirmed=0;w.requestPass=async(total,opts)=>{calls.push({total,...opts});return succeed?{id:1}:null};w.showPassInterestConfirmation=()=>confirmed++;
 w.eval(app.slice(app.indexOf('async function offerRecentPassRenewalV157('),app.indexOf('function renderProfile(')));
 return{dom,w,calls,setFailure:()=>succeed=false,confirmed:()=>confirmed};
}
(async()=>{
 const layers=new JSDOM('<style>'+fs.readFileSync('styles.css','utf8')+'</style><div class="booking-picker-v37"></div><div id="recentPassRenewalV157" class="legal-modal"></div><div id="passInterestConfirmationV44" class="legal-modal"></div>');for(const id of ['recentPassRenewalV157','passInterestConfirmationV44'])assert(Number(layers.window.getComputedStyle(layers.window.document.getElementById(id)).zIndex)>Number(layers.window.getComputedStyle(layers.window.document.querySelector('.booking-picker-v37')).zIndex));layers.window.close();
 const stale=await setup();assert.equal(await stale.w.offerRecentPassRenewalV157(77,()=>false),false);assert(!stale.w.document.querySelector('#recentPassRenewalV157'));stale.dom.window.close();
 for(const [eligible,pending] of [[false,false],[true,true]]){const t=await setup(eligible,pending);assert.equal(await t.w.offerRecentPassRenewalV157(77),true);assert(!t.w.document.querySelector('#recentPassRenewalV157'));assert.equal(t.calls.length,pending?0:1);t.dom.window.close()}
 for(const choice of ['yes','single','cancel']){const t=await setup();const result=t.w.offerRecentPassRenewalV157(77);await new Promise(setImmediate);assert(t.w.document.querySelector('#recentPassRenewalV157'));t.w.document.querySelector('[data-renewal="'+choice+'"]').click();assert.equal(await result,choice!=='cancel');assert.equal(t.calls.length,choice==='yes'?2:1);assert.equal(t.confirmed(),choice==='yes'?1:0);if(choice==='yes')assert.equal(t.calls[1].dogId,77);t.dom.window.close()}
 const t=await setup();t.setFailure();const result=t.w.offerRecentPassRenewalV157(77);await new Promise(setImmediate);t.w.document.querySelector('[data-renewal="yes"]').click();await new Promise(setImmediate);assert(t.w.document.querySelector('#recentPassRenewalV157'));assert(!t.w.document.querySelector('[data-renewal="yes"]').disabled);assert.equal(t.confirmed(),0);t.w.document.querySelector('[data-renewal="cancel"]').click();assert.equal(await result,false);t.dom.window.close();
 assert(app.includes('newPass:Boolean(bookingRow?.planned_pass_request_id)'));assert(app.includes('checkingRenewalV157||submittingV37'));assert(app.includes('renewalCheckedDogV157=null;pickerErrorV95'));
 console.log('PASS: eligible renewal / ineligible and existing interest; yes / single / back; failed request cannot unlock renewal; dog binding and click guard; planned new-pass summary');
})().catch(e=>{console.error(e);process.exit(1)});
