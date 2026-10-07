const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8');
async function test(rows,failSecond=false){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window,calls=[],local=[],notices=[],renewals=[];let closed=0,error='';
 Object.assign(w,{selectedDog:()=>({id:77}),selectedDatesV37:new Set(rows.map((_,i)=>'2026-10-'+(12+i))),selectedTaxiByDateV91:new Map(),submittingV37:false,checkingRenewalV157:false,bookingDeadlineClosedV95:()=>false,pickerErrorV95:text=>error=text,renderPickerV37:()=>{},queueCustomerSync:()=>{},closePickerV37:()=>closed++,toast:text=>notices.push(text),skDate:x=>x,applyLocalBooking:r=>local.push(r),showPassRenewalAfterBookingV94:(...args)=>renewals.push(args),api:async request=>{const i=calls.length;calls.push(request);if(failSecond&&i===1)throw new Error('Capacity changed');return{data:rows[i]}}});
 w.eval(app.slice(app.indexOf('  async function submitPickerV37(){'),app.indexOf('  function bookingRosterV37(')));
 await w.submitPickerV37();await new Promise(resolve=>setTimeout(resolve,160));
 assert.equal(calls.length,rows.length);assert.equal(local.length,failSecond?1:rows.length);assert(!w.document.querySelector('.legal-modal'));assert.equal(closed,failSecond?0:1);assert.equal(notices.length,failSecond?0:1);
 if(failSecond)assert(error.includes('Capacity changed'));w.close();return renewals;
}
(async()=>{
 assert(!app.includes('showBookingEntrySummaryV148'));assert(!app.includes('Prehľad rezervovaných vstupov'));
 assert.equal((await test([{projected_entry_number:1,projected_pass_total:10,planned_pass_request_id:100}])).length,0);
 assert.equal((await test([{projected_entry_number:5,projected_pass_total:10},{projected_entry_number:6,projected_pass_total:10}])).length,0);
 assert.equal((await test([{projected_entry_number:10,projected_pass_total:10}])).length,1);
 await test([{},{}],true);
 assert(app.includes('showPassInterestConfirmation()'));assert(app.includes('Plánovaný vstup ${planned}/${plannedTotal} z novej permanentky'));
 console.log('PASS: one/multiple bookings without summary modal; new-pass interest and card preserved; last-entry renewal once; partial failures stay actionable');
})().catch(error=>{console.error(error);process.exit(1)});
