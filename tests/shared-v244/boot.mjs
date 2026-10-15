import {JSDOM,VirtualConsole} from 'jsdom';import fs from 'node:fs';import assert from 'node:assert/strict';
const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://fixture.invalid',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});const w=dom.window;
w.fetch=async()=>({ok:false,status:404,json:async()=>({}),text:async()=>''});w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};
let combined='';
for(const m of fs.readFileSync('index.html','utf8').matchAll(/<script[^>]*src="([^"]+)"/g)){
 const filename=m[1].split('?')[0].replace(/^\//,'');combined+=fs.readFileSync(filename,'utf8')+'\n';
}
w.eval(combined);
await new Promise(r=>setTimeout(r,700));assert.deepEqual(errors,[]);assert.equal(typeof w.passAllowsDogV244,'function');assert.equal(w.sharedEnabledV244,false);
assert(dom.window.document.querySelector('#signupDogNamesHintV244').textContent.includes('personál'));
dom.window.close();process.stdout.write('PASS complete HTML/script boot, rollout disabled and no DOM runtime errors\n');
