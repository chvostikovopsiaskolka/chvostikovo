const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),cssTree=require('css-tree');
const html=fs.readFileSync('admin-snapshot/stable-v10-clean.html','utf8');
(async()=>{
 const page=new JSDOM(html);let scripts=0;
 for(const script of page.window.document.querySelectorAll('script:not([src])')){if(script.type==='application/json')continue;new vm.Script(script.textContent);scripts++;}
 for(const style of page.window.document.querySelectorAll('style'))cssTree.parse(style.textContent);
 page.window.close();
 const source=html.slice(html.indexOf('  function prepareWeekCard('),html.indexOf('  function week(root)'));
 async function cycles(code){
  const dom=new JSDOM('<div class="card"><div class="day-head"><div class="day-toggle" data-date="2026-10-05"><strong>pondelok 5. 10.</strong><span class="pill">1 pes</span></div><div class="day-actions"><button class="day-add"></button><button class="v40-close-day"></button></div></div><div class="day-body hidden"></div></div>',{runScripts:'outside-only'}),w=dom.window;
  w.weekLabel=()=> 'pondelok 5. 10.';w.weekOpen=new Set();w.eval(code);const t=w.document.querySelector('.day-toggle');let count=0;
  const observer=new w.MutationObserver(()=>{count++;if(count>=10){observer.disconnect();return}w.prepareWeekCard(t)});observer.observe(w.document.body,{childList:true,subtree:true});w.prepareWeekCard(t);
  await new Promise(setImmediate);observer.disconnect();w.close();return count;
 }
 const old=source.replace("    const label=weekLabel(date);\n    if(strong.textContent!==label)strong.textContent=label;","    strong.textContent=weekLabel(date);");
 assert.equal(await cycles(old),10);assert.equal(await cycles(source),0);
 console.log('PASS: '+scripts+' inline scripts/CSS parsed; reproduced old repeated observer cycle (10 rounds), fixed version settles without mutations');
})().catch(error=>{console.error(error);process.exit(1)});
