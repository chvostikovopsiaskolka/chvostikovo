const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('app.js','utf8'),html=fs.readFileSync('index.html','utf8');
const start=source.indexOf('(function installGuideV83()'),end=source.indexOf('/* v75:',start);
(async()=>{
 const d=new JSDOM(html,{url:'https://app.chvostikovo.sk',runScripts:'outside-only'}),w=d.window;
 Object.defineProperty(w.navigator,'userAgent',{value:'iPhone Safari'});w.matchMedia=()=>({matches:false});w.eval(source.slice(start,end));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.document.getElementById('installHelpLink').click();assert.equal(w.document.querySelectorAll('#installGuideModal .install-step').length,3);assert(w.document.getElementById('installGuideModal').classList.contains('install-guide-ios'));assert(w.document.querySelector('.install-steps').textContent.includes('Zobraziť viac'));assert(w.document.querySelector('.install-steps').textContent.includes('Otvoriť ako webovú apku'));w.close();
 const text=source.split('\n').find(line=>line.startsWith('function ensurePushModal()'));
 assert(!text.includes('SMS'));assert(text.includes('deň vopred'));assert(text.includes('permanentky'));
 const css=fs.readFileSync('styles.css','utf8');assert(css.includes('.install-guide-modal.install-guide-ios{place-items:start center}'));
 console.log('PASS: compact three-step iPhone guide at top; customer push copy has day-before and pass expiry without SMS');
})().catch(e=>{console.error(e);process.exit(1)});
