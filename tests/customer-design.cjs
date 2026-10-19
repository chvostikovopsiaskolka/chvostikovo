const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const sw=fs.readFileSync('sw.js','utf8'),headers=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const swCsp=JSON.parse(sw.match(/^const PORTAL_CSP=(.+);$/m)[1]);
assert.equal(swCsp,headers.headers.find(h=>h.source==='/').headers.find(h=>h.key==='Content-Security-Policy').value,'navigation responses from the service worker must allow the same backend as Vercel');
if(fs.existsSync('stage-config.js')){assert(swCsp.includes('jgzabminzgbfhsrgqedt.supabase.co'));assert(!swCsp.includes('tlhcqwsluyqpywymjoxn'));}
assert(sw.includes(JSON.parse(fs.readFileSync('version.json','utf8')).build));
console.log('PASS server/service-worker backend allowlist and release cache coherence');
async function scenario(count){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://design.fixture',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c);
 Object.assign(w,{fetch:async()=>({ok:true,status:200,json:async()=>[],text:async()=>'[]',headers:{get:()=>''}}),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},confirm:()=>true,ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
 for(const file of ['terms-pdf.js','app.js','dual-dog-overview-v246.js','customer-design.js'])new vm.Script(fs.readFileSync(file,'utf8')).runInContext(c);
 await new Promise(r=>setTimeout(r,600));
 try{
  run(`bratislavaClockV95=()=>({date:'2099-01-01'});bratislavaToday=()=> '2099-01-01';queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'design-fixture'},access_token:'fixture'};state.selectedDogId=1;state.data={profile:{status:'active'},dogs:Array.from({length:${count}},(_,i)=>({id:i+1,name:['Bella','Iris'][i],sex:i?'male':'female',default_entry_type:'pass',legacy_total_visits:12,photo_path:'fixture/'+i,photo_url:'https://fixture.invalid/'+i+'.jpg'})),vaccinations:Array.from({length:${count}},(_,i)=>['rabies','infectious','kennel_cough',...(i?['lepto_l4']:[])].map(type=>({dog_id:i+1,vaccination_type:type,valid_until:'2099-02-01'}))).flat(),vaccination_proofs:Array.from({length:${count}},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'proof'+i})),passes:[{id:1,dog_id:1,dog_ids:[1,2],total_entries:${count===2?20:10},used_entries:6,status:'active',valid_until:'2099-03-01'}],requests:[{id:70,reservation_id:700,projected_entry_number:7,projected_pass_total:10,dog_id:1,reservation_date:'2099-01-05',status:'approved',can_manage:true}],reservations:[],pass_requests:[],visits:[],monthly_totals:[],availability:{days:Array.from({length:15},(_,i)=>({date:'2099-01-'+String(5+i).padStart(2,'0'),available:8,capacity:8,occupied:2,bookings_open:true,anonymous_dogs:2,dogs:[{dog_id:8,name:'Kala',sex:'male',photo_url:'https://fixture.invalid/kala.jpg'}]}))}};renderPassSummary();renderDog();renderUpcoming();renderDays();`);
  run("overviewClock=()=>({date:'2099-01-01',minutes:600});renderDog()");
  assert.equal(w.document.querySelectorAll('.design-paws>span').length,count===2?20:10);
  assert.equal(w.document.querySelectorAll('.design-paws .used').length,6);
  assert.equal(w.document.querySelector('.design-visits-title h2').textContent,'Najbližšia návšteva');
  assert.equal(w.document.querySelector('#designDogName > span'),null,'no redundant pencil');
  assert.match(w.document.querySelector('.design-validity').textContent,/Platnosť do/);
  const photo=w.document.querySelector('.design-friend-strip img');assert(photo);
  const edit=w.document.querySelector('.design-visit-edit');assert(edit);edit.click();
  assert(!w.document.getElementById('bookingPickerV37').classList.contains('hidden'));
  assert.match(w.document.getElementById('weekDays').textContent,/Vstup z permanentky 7 z 10/);
  const addTaxi=w.document.querySelector('#weekDays [data-taxi-request]');assert(addTaxi);addTaxi.click();
  assert(w.document.getElementById('bookingTaxiEditV201').classList.contains('design-inline-taxi'));
  w.document.getElementById('taxiEditCloseV201').click();run('window.closeBookingPickerV305()');
  run('renderDog();renderPassSummary()');assert.equal(w.document.querySelector('.design-friend-strip img'),photo,'unrelated render preserves friend image');
  const vax=w.document.querySelector(count===1?'#bookingVaccinationStatus':'[data-dog-open-v254="2"].dual-dog-status-v254');vax.click();
  assert.equal(w.document.querySelectorAll('.design-vaccine-row').length,count===1?3:4);
  assert.match(w.document.getElementById('customerDesignModalBody').textContent,/Platné ešte/);
  w.document.getElementById('designOpenVaccines').click();assert(!w.document.getElementById('dogDetailsModal').classList.contains('hidden'));assert.equal(w.document.getElementById('dogId').value,String(count===1?1:2));
  run('closeDogDetails(true)');w.document.querySelector('.design-friends-button').click();
  assert.match(w.document.getElementById('customerDesignModalBody').textContent,/Kala/);
  assert.match(w.document.getElementById('customerDesignModalBody').textContent,/Prihlásený škôlkar/);
  const modalPhoto=w.document.querySelector('.design-roster-row img');run('renderDog()');assert.equal(w.document.querySelector('.design-roster-row img'),modalPhoto);
  w.document.querySelector('.design-modal-close').click();
  const calendarLinks=w.document.querySelectorAll('#weekDays .design-carousel-friends');assert.equal(calendarLinks.length,1);
  calendarLinks[0].click();assert.equal(w.document.getElementById('customerDesignModalTitle').textContent,'Kamaráti v škôlke');w.document.querySelector('.design-modal-close').click();
  run("state.data.requests.push({id:71,dog_id:1,reservation_date:'2099-01-06',status:'pending'},{id:72,dog_id:1,reservation_date:'2099-01-07',status:'approved'},{id:73,dog_id:2,reservation_date:'2099-01-07',status:'approved'},{id:74,dog_id:1,reservation_date:'2099-02-01',status:'approved'});renderDog()");
  assert.equal(w.document.querySelectorAll('.design-visit-card').length,3,'one carousel card per date in next two weeks');
  assert.equal(w.document.querySelectorAll('.design-visit-card[data-status=pending] img').length,0,'pending visit reveals no friends');
  assert.equal(w.document.querySelector('.design-friend-strip img'),photo,'adding another visit preserves existing decoded photo');
  w.document.querySelectorAll('.design-friends-button')[1].click();assert.match(w.document.getElementById('customerDesignModalSubtitle').textContent,/7\. 1\./);w.document.querySelector('.design-modal-close').click();
  run("state.data.requests=state.data.requests.slice(0,1);state.data.requests[0].status='pending';renderDays();renderDog()");assert.equal(w.document.querySelectorAll('#weekDays .design-carousel-friends').length,0);assert.match(w.document.getElementById('designNearest').textContent,/Čaká na schválenie/);
  run("state.data.requests=[];state.data.passes=[];renderPassSummary();renderDays();renderDog()");assert.match(w.document.getElementById('designTicket').textContent,/Jednorazový/);assert.match(w.document.getElementById('designNearest').textContent,/Rezervovať miesto/);
  run("state.data.availability.days[2].available=0");w.document.querySelector('#designNearest button').click();assert.equal(w.document.querySelectorAll('.booking-day-v37').length,10);
  const dateButton=w.document.querySelector('.booking-day-v37:not(:disabled)[data-contact="false"]');assert(dateButton);dateButton.click();
  assert.equal(w.document.querySelectorAll('#bookingPickerDaysV37 [data-taxi-toggle]').length,0);
  const taxi=w.document.querySelector('#bookingPickerTaxiByDayV91 [data-taxi-toggle]');assert(taxi);taxi.click();
  assert.equal(w.document.querySelectorAll('#bookingPickerTaxiByDayV91 [data-taxi-mode]').length,count===2?4:2);
  w.document.querySelector('#bookingPickerTaxiByDayV91 [data-taxi-mode="pickup"]').click();assert.match(w.document.getElementById('bookingPickerTaxiByDayV91').textContent,/Vybrané/);
  assert.equal(w.document.getElementById('bookingPickerSubmitV37').disabled,false);
  assert(w.document.getElementById('designCapacityLegend'));
  assert.equal(w.document.querySelectorAll('#designMyBookings img').length,0);
  assert.match(w.document.querySelector('.design-empty-booking-cta').textContent,/do nedele 20:00/);
  // Test late/full-day chat without sending anything: selected days and picker survive close.
  if(count===1){
   const picker=w.document.getElementById('bookingPickerV37');picker.scrollTop=120;
   w.document.querySelector('.booking-day-v37[data-full="true"]').click();
   assert(!picker.classList.contains('hidden'),'full-day chat keeps reservation page mounted');
   assert.equal(picker.inert,true);
   assert(!w.document.getElementById('supportChatModalV52').classList.contains('hidden'));
   w.document.getElementById('supportChatCloseV52').click();
   assert.equal(picker.inert,false);assert.equal(picker.scrollTop,120);
   assert.equal(w.document.getElementById('bookingPickerSubmitV37').disabled,false,'selected days retained');
  }
  run("state.data.requests=[{id:90,dog_id:1,reservation_date:'2099-01-08',status:'rejected'}];renderDog()");
  assert(w.document.querySelector('.design-visit-status.rejected'));assert.equal(w.document.querySelectorAll('.design-visit-card img').length,0);

  assert.deepEqual(errors,[]);
  console.log('PASS design '+count+' dog(s): 10/20 used paws, stable photos, optional L4, original editor, consent roster/shared entry, pending privacy, single ticket, empty CTA, 10 dates, optional per-dog taxi');
 }finally{w.close()}
}
(async()=>{await scenario(1);await scenario(2)})().catch(e=>{console.error(e);process.exitCode=1});
