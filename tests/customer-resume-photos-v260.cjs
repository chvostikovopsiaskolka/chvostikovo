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
 new vm.Script(fs.readFileSync('dual-dog-overview-v246.js','utf8')).runInContext(ctx);
 for(const count of [1,2]){
  run(`state.session={user:{id:'photo-owner'},access_token:'fixture'};state.selectedDogId=1;state.data={dogs:Array.from({length:${count}},(_,i)=>({id:i+1,owner_id:7,name:'Dog '+i,photo_path:'photo-'+i,photo_updated_at:'2026-10-01',photo_url:'https://fixture.invalid/photo-'+i+'?token=old'})),notifications:[],passes:[],pass_requests:[],vaccinations:[],vaccination_proofs:[],reservations:[],requests:[],messages:[],availability:{days:[]},profile:{}};renderAll();`);
  await new Promise(r=>setTimeout(r,50));
  const selectors=['#bookingDogAvatar img','#dogProfilePhoto .dog-avatar img','#dogDetailsPhotoPreview img',...(count===2?['[data-dog-panel="1"] img','[data-dog-panel="2"] img']:[])];
  const before=selectors.map(x=>w.document.querySelector(x));assert(before.every(Boolean));
  let preloads=0;w.Image=class{constructor(){preloads++}decode(){return Promise.resolve()}};
  const srcChanges=[];const ob=new w.MutationObserver(records=>srcChanges.push(...records.filter(r=>r.attributeName==='src'&&before.includes(r.target))));ob.observe(w.document.body,{attributes:true,subtree:true});
  run(`startCustomerLive=()=>{};api=async()=>({...state.data,profile:{updated:'changed'},dogs:state.data.dogs.map(d=>({...d,name:d.name+' updated',sex:'female',photo_url:d.photo_url.replace('old','new')}))});lastResumeRefresh=0;customerUpdateLastCheck=Date.now();`);
  await run('refreshOnResume()');await new Promise(r=>setTimeout(r,130));
  assert(selectors.every((x,i)=>w.document.querySelector(x)===before[i]),'same photo nodes after resume and label updates');
  assert.equal(preloads,0,'no redundant Image preload');assert.equal(srcChanges.length,0,'no src changes');
  // A changed path updates only that dog; a changed owner must not reuse its image.
  run(`state.data.dogs[0].photo_path='changed-photo';state.data.dogs[0].photo_url='https://fixture.invalid/changed';renderAll()`);await new Promise(r=>setTimeout(r,50));assert.notEqual(w.document.querySelector(selectors[0]),before[0]);
  if(count===2)assert.equal(w.document.querySelector(selectors[4]),before[4]);
  ob.disconnect();
  console.log('PASS '+count+' dog: resume, metadata/signature changes preserve all photos, no preload/src reset; actual photo change refreshes target only');
 }
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
