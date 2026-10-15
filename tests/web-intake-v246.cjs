const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const html=fs.readFileSync(process.argv[2],'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
for(const script of scripts)new vm.Script(script);
const dom=new JSDOM('<div id="dogDetail"><div id="dogDetailContent"></div></div>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
const dogs=[{dog_order:1,dog_name:'Bella',dog_sex:'female'},{dog_order:2,dog_name:'Iris',dog_sex:'female'}];
let requests=0;
w.supabase={createClient:()=>({from(){requests++;throw Error('Should reuse preloaded data')}})};
w.eval(scripts.find(x=>x.includes('var client=null,lastId=null')));
const main=scripts.find(x=>x.includes('async function openWebSubmission(id)'));
function extract(name,next){return main.slice(main.indexOf(name),main.indexOf(next,main.indexOf(name))).replace('id,s.application_dogs,supabase','id,s.application_dogs,mainSupabase')}
w.eval(`var state={webSubmissions:[{id:83,form_type:'application',dog_name:'Bella',application_dogs:${JSON.stringify(dogs)}}]};var mainSupabase=window.supabase.createClient();var $=id=>document.getElementById(id);var esc=s=>String(s||'');var parseAdminBreedWeight=s=>({breed:s});var webSubmissionDate=()=>'';var webSubmissionSex=s=>s==='female'?'Suka':'Pes';var webSubmissionCareHtml=()=>'';function prefillSubmissionIntroVisit(){}function prefillSubmissionDog(){}function reviewWebSubmission(){}function setWebSubmissionStatus(){}function renderDogs(){};`);
w.eval(extract('async function openWebSubmission(id){','async function saveWebLeadNote'));
w.eval(extract('function showWebSubmissionFollowup(id){','async function prefillSubmissionIntroVisit'));
(async()=>{
 await w.openWebSubmission(83);
 assert.match(w.document.querySelector('#webTwoDogCardV237').textContent,/Bella[\s\S]*Iris/);
 assert.equal(w.document.querySelector('#prefillSubmissionDog').style.display,'none');
 assert.match(w.document.querySelector('#webTwoDogCardV237').textContent,/Suka/);
 w.showWebSubmissionFollowup(83);
 assert.match(w.document.querySelector('#webTwoDogCardV237').textContent,/Iris/);
 assert.equal(w.document.querySelector('#followupDirectDog').style.display,'none');
 assert.equal(requests,0);
 assert.ok(main.includes('application_dogs:web_form_application_dogs_v237(*)'));
 console.log('PASS: all scripts parse; dashboard/direct open and followup show both dogs; authenticated preloaded rows; zero extra reads');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
