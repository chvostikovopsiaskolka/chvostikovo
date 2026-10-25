const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.fixture',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c);
Object.assign(w,{fetch:async()=>({ok:true,status:200,json:async()=>({}),text:async()=>'',headers:{get:()=>''}}),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},confirm:()=>true,ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
for(const path of ['terms-pdf.js','app.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
(async()=>{try{
 await new Promise(r=>setTimeout(r,600));
 run(`queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'owner'},access_token:'fixture'};state.data={dogs:[{id:1,name:'Fixture'}],vaccinations:[],vaccination_proofs:[1,2].map(id=>({id,dog_id:1,storage_path:'proof-'+id,image_url:'https://fixture.invalid/'+id})),passes:[],customer_booking_requests:[]};state.selectedDogId=1;openDogDetails('vaccinations');openVaccProofEditorV244();`);
 w.document.querySelector('[data-vacc-replace="1"]').click();assert(!w.document.getElementById('vaccProofActionsV392').classList.contains('hidden'));assert.equal(w.document.getElementById('vaccProofEditFileV244').dataset.replaceId,'1');assert(w.document.querySelector('label[for="vaccProofEditFileV244"]'));
 const node=w.document.querySelector('[data-vacc-preview="2"] img');
 run(`api=async()=>{throw Error('Storage failed')}`);await run('deleteVaccProofV392(1)');assert.equal(run('state.data.vaccination_proofs.length'),2);assert.match(w.document.getElementById('vaccProofEditMessageV244').textContent,/Storage failed/);
 w.confirm=()=>false;run(`api=async()=>{throw Error('must not call')}`);await run('deleteVaccProofV392(1)');assert.equal(run('state.data.vaccination_proofs.length'),2);w.confirm=()=>true;
 run(`vaccinationFreshUploadV234.add(vaccineKeyV287(1));api=async p=>{window.payload=p;return {data:{proofs:state.data.vaccination_proofs.filter(x=>x.id!==p.proof_id)}}}`);await run('deleteVaccProofV392(1)');assert.equal(w.payload.action,'delete_vaccination_proof');assert.equal(run('state.data.vaccination_proofs.length'),1);assert.equal(run('vaccinationFreshUploadV234.has(vaccineKeyV287(1))'),false);assert.equal(w.document.querySelector('[data-vacc-preview="2"] img'),node);
 await run('deleteVaccProofV392(2)');assert.equal(run('state.data.vaccination_proofs.length'),0);assert.equal(w.document.querySelectorAll('#vaccProofEditGridV244 img').length,0);
 const text=run(`bookingFailureDetailsV392(Array.from({length:5},(_,i)=>({date:'2026-10-'+(26+i),error:'Po obnovení očkovania nahrajte novú fotografiu očkovacieho preukazu.'})))`);assert.equal((text.match(/Po obnovení/g)||[]).length,1);
 assert.match(run(`bookingFailureDetailsV392([{date:'2026-10-26',error:'Plná kapacita'},{date:'2026-10-27',error:'Plná kapacita'}])`),/26.*27.*Plná kapacita/);
 // A late response from another account cannot replace this account's proof list.
 run(`state.data.vaccination_proofs=[{id:3,dog_id:1,storage_path:'proof-3'}];openVaccProofEditorV244();api=()=>new Promise(r=>window.finishDelete=r)`);const pending=run('deleteVaccProofV392(3)');run(`state.session.user.id='other';state.data.vaccination_proofs=[{id:99,dog_id:1}];window.finishDelete({data:{proofs:[]}})`);await pending;assert.equal(run('state.data.vaccination_proofs[0].id'),99);
 assert.deepEqual(errors,[]);console.log('PASS assembled customer UI: pencil actions/native label, cancel, Storage error retention, delete/last proof, stable other thumbnail, fresh-proof reset, account race, grouped booking errors');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
