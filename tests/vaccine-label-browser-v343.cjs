const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;
if(packed)packed.setGraphicsMode=false;
(async()=>{
for(const count of [1,2])for(const width of [320,360,390,430,844]){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?[...packed.args.filter(x=>!x.includes('in-process-gpu')),'--disable-gpu']:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width,height:width===844?390:844},serviceWorkers:'block',hasTouch:true}),page=await context.newPage();
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=path.join(process.cwd(),u.pathname==='/'?'index.html':u.pathname);if(u.hostname==='fixture.local'&&fs.existsSync(file)){await route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}else await route.fulfill({contentType:'application/json',body:'[]'});});
 await page.addInitScript(()=>{window.fetch=async()=>({ok:true,status:200,text:async()=>'[]',json:async()=>[],headers:{get:()=>''}});window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});});
 await page.goto('http://fixture.local/');await page.waitForTimeout(700);
 await page.evaluate(count=>{
  bratislavaToday=()=> '2099-01-01';overviewClock=()=>({date:'2099-01-01',minutes:600});queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};
  state.session={user:{id:'synthetic-vax'},access_token:'fixture'};state.selectedDogId=1;
  state.data={profile:{status:'active'},dogs:Array.from({length:count},(_,i)=>({id:i+1,name:i?'Iris':'Bella',sex:'female',default_entry_type:'pass'})),vaccinations:Array.from({length:count},(_,i)=>['rabies','infectious','kennel_cough'].map(type=>({dog_id:i+1,vaccination_type:type,valid_until:'2099-03-01'}))).flat(),vaccination_proofs:Array.from({length:count},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),passes:[],requests:[],reservations:[],pass_requests:[],visits:[],monthly_totals:[],notifications:[],availability:{days:[]}};
  showApp();renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays();loading(false);
 },count);
 const selector=count===1?'#bookingVaccinationStatus.valid>span:last-child':'.dual-dog-status-v254.valid>span:last-child';
 const labels=await page.locator(selector).evaluateAll(els=>els.map(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return{text:el.textContent,color:c.color,font:parseFloat(c.fontSize),nowrap:c.whiteSpace,height:r.height,line:parseFloat(c.lineHeight),right:r.right,parentRight:p.right}}));
 assert.equal(labels.length,count);for(const l of labels){assert.equal(l.text,'Platné očkovania');assert.equal(l.color,'rgb(23, 117, 72)');assert(l.font>10);assert.equal(l.nowrap,'nowrap');assert(l.right<=l.parentRight+1,JSON.stringify({width,count,...l}));assert(l.height<=l.line+1,'label is a single line');}
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');
 console.log('PASS full customer rendering: green/larger/one-line validity,',count,'dog(s),',width,'px');await context.close();await browser.close();
}
})().catch(e=>{console.error(e);process.exitCode=1});
