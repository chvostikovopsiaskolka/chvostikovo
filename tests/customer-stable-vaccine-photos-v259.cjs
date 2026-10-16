const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const source=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,ctx=dom.getInternalVMContext();
let releaseHistory,historyMode='defer';
const history=[{terms_version:'2026-10-03',accepted_at:'2026-10-15T19:39:00Z',body:'Pravidlá test',document_hash:'fixture'}];
w.fetch=async url=>{
 if(String(url).includes('portal_owner_terms_history_v256')){
  if(historyMode==='defer')await new Promise(r=>releaseHistory=r);
  if(historyMode==='fail')return {ok:false};
  return {ok:true,json:async()=>history};
 }
 if(String(url).includes('portal_terms_acceptances'))return {ok:true,json:async()=>[{accepted_at:'2026-10-15T19:39:00Z'}]};
 return {ok:true,status:200,json:async()=>({}),text:async()=>'',headers:{get:()=>''}};
};
Object.assign(w,{matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
new vm.Script(fs.readFileSync("terms-pdf.js","utf8")).runInContext(ctx);
new vm.Script(source).runInContext(ctx);
const run=s=>vm.runInContext(s,ctx),tick=()=>new Promise(r=>setTimeout(r,0));
(async()=>{try{
 await new Promise(r=>setTimeout(r,600));
 run(`state.session={user:{id:'owner'},access_token:'fixture'};state.data={dogs:[{id:1,name:'Iris'}],vaccination_proofs:[1,2,3].map(id=>({id,dog_id:1,storage_path:'proof-'+id,image_url:'https://fixture.invalid/proof-'+id+'?token=old'}))};state.selectedDogId=1;
 v105PrepareProof=async()=>({dataUrl:'data:image/jpeg;base64,fixture'});renderVaccinationProofsV104(1);openVaccProofEditorV244();`);
 const main=w.document.getElementById('vaccProofCurrentV104'),grid=w.document.getElementById('vaccProofEditGridV244');
 const beforeMain=[...main.querySelectorAll('img')],beforeEdit=[...grid.querySelectorAll('img')],add=grid.lastElementChild;
 const srcWrites=[];const observer=new w.MutationObserver(records=>srcWrites.push(...records.filter(r=>r.type==='attributes'&&r.attributeName==='src')));observer.observe(w.document.body,{subtree:true,attributes:true});
 let finishUpload;w.fixtureUpload=()=>new Promise(r=>finishUpload=r);run(`api=async payload=>{window.payload=payload;return window.fixtureUpload()}`);
 const uploading=run(`uploadSingleVaccProofV244({name:'new.jpg'},2)`);await tick();
 assert.equal(grid.querySelectorAll('img')[0],beforeEdit[0]);assert.equal(grid.querySelectorAll('img')[1],beforeEdit[1]);assert(grid.querySelector('[data-vacc-replace="1"]').disabled);
 const proofs=[{id:4,dog_id:1,storage_path:'proof-4',image_url:'https://fixture.invalid/proof-4?token=new'},...[1,3].map(id=>({id,dog_id:1,storage_path:'proof-'+id,image_url:'https://fixture.invalid/proof-'+id+'?token=new'}))];
 finishUpload({data:{proofs}});await uploading;await tick();
 assert.equal(w.payload.replace_proof_id,2);assert.equal(w.payload.images.length,1);
 for(const root of [main,grid])assert.deepEqual([...root.querySelectorAll('img')].map(img=>img.dataset.proofImage),['proof-1','proof-4','proof-3']);
 assert.equal(main.querySelectorAll('img')[0],beforeMain[0]);assert.equal(main.querySelectorAll('img')[2],beforeMain[2]);
 assert.equal(grid.querySelectorAll('img')[0],beforeEdit[0]);assert.equal(grid.querySelectorAll('img')[2],beforeEdit[2]);assert.equal(grid.lastElementChild,add);
 assert(!beforeMain[1].isConnected&&!beforeEdit[1].isConnected);
 assert.equal(beforeMain[0].getAttribute('src'),'https://fixture.invalid/proof-1?token=old');
 assert.equal(srcWrites.filter(r=>[...beforeMain,...beforeEdit].includes(r.target)).length,0);
 // Viewer uses the refreshed signed URL without replacing the thumbnail source.
 run(`openVaccinationProofViewerV104=url=>{window.viewed=url}`);grid.querySelector('[data-vacc-preview="1"]').click();assert.equal(w.viewed,'https://fixture.invalid/proof-1?token=new');
 const stable=[...grid.querySelectorAll('img')];run(`api=async()=>{throw new Error('Upload failed')}`);await run(`uploadSingleVaccProofV244({name:'bad.jpg'},1)`);
 assert([...grid.querySelectorAll('img')].every((img,i)=>img===stable[i]));assert(!grid.querySelector('[data-vacc-replace="1"]').disabled);
 // Append keeps every existing thumbnail and adds only the fourth node.
 run(`api=async()=>({data:{proofs:[...state.data.vaccination_proofs,{id:5,dog_id:1,storage_path:'proof-5',image_url:'https://fixture.invalid/proof-5'}]}})`);await run(`uploadSingleVaccProofV244({name:'add.jpg'},0)`);
 assert.equal(grid.querySelectorAll('img').length,4);assert([...grid.querySelectorAll('img')].slice(0,3).every((img,i)=>img===stable[i]));
 // Dog/account changes clear old nodes even if proof IDs happen to match.
 run(`state.session.user.id='other';renderVaccinationProofsV104(1);renderVaccProofEditorV244()`);assert(!stable[0].isConnected);assert(!beforeMain[0].isConnected);
 assert.deepEqual(errors,[]);console.log('PASS actual single upload: one payload image; unchanged DOM/src in main + editor; stable replacement slot; fresh viewer URL; busy/error recovery; append; account isolation');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
