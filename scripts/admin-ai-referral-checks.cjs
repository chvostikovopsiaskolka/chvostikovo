const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/' : '')+'playwright');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const h=fs.readFileSync(process.argv[2],'utf8');
const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await page.route('**/*',r=>r.request().resourceType()==='document'?r.fulfill({status:200,contentType:'text/html',body:h}):r.fulfill({status:200,contentType:'application/json',body:'[]'}));
for(const width of [320,360,390,430,1280,844]){
 await page.setViewportSize({width,height:width===844?390:850});

 await page.goto('https://admin.test',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.chvTraffic266?.web);
 const result=await page.evaluate(()=>{
 const p={traffic:[{report_date:'2026-10-17',page_group:'WEB',source_channel:'ai_referral',landings:1},{report_date:'2026-10-18',page_group:'LEAD',source_channel:'meta_paid',landings:3}],activity:[],contacts:[],ai_landings:[{report_date:'2026-10-17',page_group:'WEB',provider:'chatgpt',path:'/',landings:1}],ai_forms:[]};
 document.getElementById('authScreen')?.classList.add('hidden');document.querySelector('.app')?.classList.remove('hidden');
 const section=document.getElementById('campaignsSection');section.classList.remove('hidden');document.getElementById('campaignOverviewV71').innerHTML='<div class="t266">'+window.chvTraffic266.web(p,'2026-10-01','2026-10-21','ALL')+'</div>';
 const body=section.textContent;
 const empty=window.chvTraffic266.web(p,'2026-10-18','2026-10-21','ALL');
 const scoped=window.chvTraffic266.web(p,'2026-10-01','2026-10-21','LEAD');
 const forms=window.chvTraffic266.web({...p,ai_forms:[{report_date:'2026-10-17',page_group:'WEB',provider:'chatgpt',submissions:2}]},'2026-10-01','2026-10-21','ALL');
 const escaped=window.chvTraffic266.web({...p,ai_landings:[{...p.ai_landings[0],path:'/<img src=x onerror=alert(1)>'}]},'2026-10-01','2026-10-21');
 return {body,empty:empty.includes('nemáme identifikované'),scoped:scoped.includes('nemáme identifikované'),forms:forms.includes('Odoslané záujmy podľa zdroja'),escaped:escaped.includes('&lt;img'),overflow:document.documentElement.scrollWidth>innerWidth,navCount:document.querySelectorAll('#bottomNav').length};
 });
 assert(result.body.includes('AI vyhľadávanie'));assert(result.body.includes('ChatGPT / OpenAI'));assert(result.body.includes('Kliknutia na tlačidlá'));assert(result.body.includes('Formuláre'));assert(result.empty);assert(result.scoped);assert(result.forms);assert(result.escaped);assert(!result.overflow,`overflow ${width}`);assert.equal(result.navCount,1);assert.deepEqual(errors,[]);
 console.log('PASS full assembled admin, filters, forms, XSS, no overflow, one nav at '+width+'px');
}
await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
