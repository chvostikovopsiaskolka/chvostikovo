const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('async()=>{\n      if(checkingRenewalV157||submittingV37)return;'),end=app.indexOf('    }));',start);
async function test(contact,full,decision=true,fail=false){
 const dom=new JSDOM('<div id="bookingPickerV37"></div>',{runScripts:'outside-only'}),w=dom.window,order=[],errors=[];let resolveOffer;
 Object.assign(w,{dog:{id:77,name:'Bella'},state:{selectedDogId:77},btn:{dataset:{date:'2026-10-09',contact:String(contact),full:String(full)}},checkingRenewalV157:false,submittingV37:false,pickerEpochV157:0,renewalCheckedDogV157:null,selectedDatesV37:new Set(),selectedTaxiByDateV91:new Map(),$:id=>w.document.getElementById(id),offerRecentPassRenewalV157:()=>{order.push('offer');return new Promise((resolve,reject)=>resolveOffer=()=>fail?reject(new Error('Network error')):resolve(decision))},closePickerV37:()=>order.push('close'),skDay:()=> 'piatok',skDate:()=> '9. 10. 2026',openCustomerLateBookingMessage:(dogId,date,body,messageOnly)=>order.push({dogId,date,body,messageOnly}),renderPickerV37:()=>order.push('render'),pickerErrorV95:e=>errors.push(e)});
 w.eval('window.handle='+app.slice(start,end)+'}');
 const result=w.handle();assert.deepEqual(order,['offer']);assert.equal(w.selectedDatesV37.size,0);await w.handle();assert.deepEqual(order,['offer']);resolveOffer();await result;
 if(fail){assert.deepEqual(errors,['Network error']);assert.deepEqual(order,['offer'])}
 else if(!decision){assert.deepEqual(order,['offer']);assert.equal(w.selectedDatesV37.size,0)}
 else if(contact){assert.equal(order[1],'close');assert.equal(order[2].dogId,77);assert.equal(order[2].date,'2026-10-09');assert.equal(order[2].messageOnly,full);assert.equal(w.selectedDatesV37.size,0)}
 else{assert(w.selectedDatesV37.has('2026-10-09'));assert.equal(order[1],'render')}
 assert.equal(w.checkingRenewalV157,false);w.close();
}
(async()=>{
 await test(true,false);await test(true,true);await test(false,false);await test(true,false,false);await test(true,false,true,true);
 const helper=app.slice(app.indexOf('async function offerRecentPassRenewalV157('),app.indexOf('function renderProfile('));assert(helper.includes('/rpc/portal_pass_renewal_eligible'));assert(!helper.includes('pass_requests'));
 console.log('PASS: renewal precedes late/full contact and normal selection; Back/network failure stop; duplicate click blocked; server checks cancelled interest afresh');
})().catch(e=>{console.error(e);process.exit(1)});
