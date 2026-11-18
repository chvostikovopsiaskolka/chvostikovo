const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('app.js','utf8'),html=fs.readFileSync('index.html','utf8');
const start=source.indexOf('(function installGuideV83()'),end=source.indexOf('/* v75:',start);
(async()=>{
 assert(start>=0&&end>start,'existing installation guide module remains optional');
 assert(!source.includes('login.appendChild(b)'),'no install help mounted into the login form');
 assert(!source.includes("document.getElementById('installHelpLink')?.click()"),'logout and auth errors never reopen install guide');
 assert(!source.includes('setTimeout(openGuide,0)'),'browser install offer must not auto-open modal');
 for(const ua of ['iPhone Safari','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/138']){
   const d=new JSDOM(html,{url:'https://app.chvostikovo.sk',runScripts:'outside-only'}),w=d.window;
   Object.defineProperty(w.navigator,'userAgent',{value:ua});
   w.matchMedia=()=>({matches:false});
   w.eval(source.slice(start,end));
   w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
   assert.equal(w.document.getElementById('installHelpLink'),null,'login has no install link');
   assert(!w.document.querySelector('#installGuideModal:not(.hidden)'),'login does not show install dialog');
   if(ua.includes('iPhone')){
     assert.equal(typeof w.openCustomerInstallGuideV431,'function','manual guide stays available for explicit support');
     w.openCustomerInstallGuideV431();
     assert.equal(w.document.querySelectorAll('#installGuideModal .install-step').length,3);
     assert(w.document.getElementById('installGuideModal').classList.contains('install-guide-ios'));
     assert(w.document.querySelector('.install-steps').textContent.includes('Otvoriť ako webovú apku'));
   }
   w.close();
 }
 const push=source.split('\n').find(line=>line.startsWith('function ensurePushModal()'));
 assert(!push.includes('SMS')&&push.includes('deň vopred')&&push.includes('permanentky'));
 console.log('PASS v431: no auth install link/autopopup; explicit iPhone guide and push copy preserved');
})().catch(e=>{console.error(e);process.exit(1)});
