const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
async function scenario(count){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.fixture',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c);
 Object.assign(w,{fetch:async()=>({ok:true,status:200,json:async()=>({}),text:async()=>'',headers:{get:()=>''}}),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},confirm:()=>true,ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
 new vm.Script(fs.readFileSync('terms-pdf.js','utf8')).runInContext(c);new vm.Script(fs.readFileSync('app.js','utf8')).runInContext(c);await new Promise(r=>setTimeout(r,600));
 run(`bratislavaClockV95=()=>({date:'2026-10-17'});bratislavaToday=()=> '2026-10-17';queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'fixture-owner'},access_token:'fixture'};state.data={dogs:Array.from({length:${count}},(_,i)=>({id:i+1,name:'Fixture '+(i+1)})),vaccinations:Array.from({length:${count}},(_,i)=>['rabies','infectious','kennel_cough'].map(type=>({dog_id:i+1,vaccination_type:type,valid_until:'2026-12-31'}))).flat(),vaccination_proofs:Array.from({length:${count}},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'proof-'+i,image_url:'https://fixture.invalid/'+i})),passes:[],customer_booking_requests:[]};state.selectedDogId=1;window.saved=[];api=async payload=>{window.saved.push(payload);return {data:{vaccinations_atomic_v287:true}}};`);
 try{
  assert.match(run(`vaccinationValidityV96('2026-10-16').text`),/skončila/);assert.match(run(`vaccinationValidityV96('2026-10-17').text`),/končí dnes/);
  for(let id=1;id<=count;id++){
   run(`state.selectedDogId=${id};openDogDetails('vaccinations');`);assert.equal(w.document.querySelectorAll('#dogForm').length,1);assert.equal(w.document.getElementById('rabiesUntil').value,'2026-12-31');assert.equal(w.document.getElementById('vaccProofCurrentV104').querySelectorAll('img').length,1);
   // v289: saving the same expiry dates (including after a reverted invalid edit)
   // must not issue a server request, create a review or show false success.
   run("$('rabiesUntil').value='2026-10-16'");
   await run("saveDog({preventDefault(){}})");
   assert.equal(w.saved.length,0);
   assert.equal(w.document.getElementById('vaccineErrorV287').classList.contains('vaccination-error-alert-v289'),true);
   run("$('rabiesUntil').value='2026-12-31'");
   await run("saveDog({preventDefault(){}})");
   assert.equal(w.saved.length,0);
   assert.match(w.document.getElementById('toast').textContent,/zostali nezmenené/);
   run("openDogDetails('vaccinations')");
   for(const date of ['2026-10-16','2026-10-17','2027-01-01']){
    run(`$('rabiesUntil').value='${date}';`);await run(`saveDog({preventDefault(){}})`);
    assert.equal(w.saved.length,0);assert.match(w.document.getElementById('vaccineErrorV287').textContent,date==='2026-10-16'?/Po skutočnom preočkovaní/:/aktuálnu fotografiu/);assert.notEqual(w.document.activeElement.id,'rabiesUntil');
   }
   // Background render must retain draft values.
   run(`fillDogForm(selectedDog())`);assert.equal(w.document.getElementById('rabiesUntil').value,'2027-01-01');
   run(`closeDogDetails(true);openDogDetails('vaccinations')`);assert.equal(w.document.getElementById('rabiesUntil').value,'2027-01-01');
   if(count===2){run(`renderDogSelector();$('dogSelector').value='${id===1?2:1}';$('dogSelector').dispatchEvent(new Event('change',{bubbles:true}));`);assert.equal(w.document.getElementById('dogId').value,String(id===1?2:1));run(`state.selectedDogId=${id};openDogDetails('vaccinations');`);assert.equal(w.document.getElementById('rabiesUntil').value,'2027-01-01')}
   run(`openVaccProofEditorV244();v105PrepareProof=async()=>({dataUrl:'data:image/jpeg;base64,fixture'});api=async()=>{throw Error('Fixture upload failure')}`);
   await run(`uploadSingleVaccProofV244({name:'test.jpg'},${id})`);assert(w.document.getElementById('vaccProofRetryV287'));assert.equal(run(`vaccinationFreshUploadV234.has(vaccineKeyV287(${id}))`),false);
   run(`api=async()=>({data:{proofs:[{id:${id+10},dog_id:${id},storage_path:'new-${id}',image_url:'https://fixture.invalid/new'}]}})`);await run(`uploadSingleVaccProofV244({name:'retry.jpg'},${id})`);assert(run(`vaccinationFreshUploadV234.has(vaccineKeyV287(${id}))`));
   run(`api=async p=>{window.saved.push(p);return {data:{vaccinations_atomic_v287:true}}};$('vaccProofEditorV244').classList.add('hidden');`);await run(`saveDog({preventDefault(){}})`);assert.match(w.document.getElementById('toast').textContent,/Rezervácie sú opäť sprístupnené/);assert.equal(w.saved.length,1);assert.equal(w.saved[0].dog_id,id);assert.equal(w.saved[0].vaccinations[0].valid_until,'2027-01-01');w.saved.length=0;
   run(`openDogDetails('vaccinations')`);assert.equal(w.document.getElementById('rabiesUntil').value,'2027-01-01');run(`closeDogDetails(true)`);
  }
  if(count===2){run(`state.data.vaccinations.find(v=>v.dog_id===2&&v.vaccination_type==='rabies').valid_until='2026-10-16'`);assert(run(`customerVaccinationsCompleteV96(state.data.dogs[0])`));assert.equal(run(`customerVaccinationsCompleteV96(state.data.dogs[1])`),false);run(`state.data.vaccination_proofs=state.data.vaccination_proofs.filter(p=>p.dog_id!==2)`);assert.equal(run(`customerVaccinationsCompleteV96(state.data.dogs[1])`),false)}
  assert.deepEqual(errors,[]);console.log('PASS '+count+' dog(s): yesterday/today/future; inline error; no date focus; old photo rejected; draft close/reopen/foreground; per-dog switch; failed upload/retry; successful save + reopen; unique form IDs');
 }finally{w.close()}
}
(async()=>{await scenario(1);await scenario(2)})().catch(e=>{console.error(e);process.exitCode=1});
