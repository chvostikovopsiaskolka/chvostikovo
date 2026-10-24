const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 for(const dogs of [1,2])for(const width of [320,360,390,430,844]){
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:require(process.env.PACKED_CHROMIUM).args}:{});
 try{const{page,context,errors}=await fixture(browser,dogs,width,type.name());
 await page.evaluate(()=>{state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:0,status:'active',valid_until:'2099-12-31'}];renderPassSummary();renderDog();});
 await page.waitForSelector('#designTicket>.lg-v3-material',{state:'attached'});
 const nav=await page.locator('.bottom-nav').boundingBox();
 const buttons=await page.locator('.bottom-nav>button').evaluateAll(nodes=>nodes.filter(el=>getComputedStyle(el).display!=='none').map(el=>({id:el.id,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
 assert.equal(buttons.length,5);assert(buttons.every(b=>b.w>=44&&b.h>=44));const centre=buttons.find(b=>b.id==='navBookAddV220');assert(buttons.filter(b=>b!==centre).every(b=>centre.w>b.w));
 await page.evaluate(()=>window.__passMaterial=document.querySelector('#designTicket>.lg-v3-material'));
 await page.evaluate(()=>{for(let i=0;i<12;i++){renderPassSummary();renderUpcoming();renderDog();}state.data.passes[0].used_entries=1;renderPassSummary();renderDog();});
 await page.waitForTimeout(160);
 assert(await page.evaluate(()=>document.querySelector('#designTicket>.lg-v3-material')===window.__passMaterial),'updated pass retains exact optical layer');
 await page.evaluate(()=>{document.querySelector('#designTicket').innerHTML='<h2>Externá obnova obsahu</h2>'});await page.waitForTimeout(160);
 assert.equal(await page.locator('#designTicket>.lg-v3-material').count(),1,'optics recovers externally replaced content');
 await page.evaluate(()=>{delete document.querySelector('#designTicket').dataset.presentationKey;renderPassSummary();renderDog();window.__noticeFixture=[{id:51,active:true,show_in_overview:true,title:'Vybraný oznam',body:'Prvý oznam',valid_from:'2020-01-01'},{id:52,active:true,show_in_overview:false,title:'Iba v histórii',body:'Druhý oznam',valid_from:'2020-01-01'},{id:53,active:true,show_in_overview:true,title:'Skončený oznam',valid_until:'2021-01-01',valid_from:'2020-01-01'}];return loadAnnouncements(true);});
 assert.equal(await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').count(),1);
 assert(await page.evaluate(()=>document.getElementById('designNearest').nextElementSibling.id==='customerNoticeOverviewV376'));
 assert.equal(await page.locator('#customerNoticeOverviewV376 .customer-notice-carousel-v376').getAttribute('data-multiple'),'false');
 await page.evaluate(()=>{__noticeFixture.push({id:54,active:true,show_in_overview:true,title:'Ďalší oznam',body:'Pozvánka',valid_from:'2020-01-01'});return loadAnnouncements(true)});
 assert.equal(await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').count(),2);assert.equal(await page.locator('.customer-notice-carousel-v376').getAttribute('data-multiple'),'true');
 assert.equal(await page.evaluate(()=>__noticeReads.length),0,'carousel does not dismiss notices');
 await page.locator('#customerAnnouncementsV363').click();await page.waitForTimeout(100);
 assert.equal(await page.locator('#customerBulletinHistoryV229 [data-announcement-id]').count(),4);
 await page.waitForSelector('#customerBulletinHistoryV229 .customer-bulletin-dialog-v229>.lg-v3-material',{state:'attached'});
 if(width===390){fs.mkdirSync('/tmp/chvo-v376-screenshots',{recursive:true});await page.screenshot({path:`/tmp/chvo-v376-screenshots/notice-${type.name()}-${dogs}.png`});}
 await page.locator('#customerBulletinHistoryV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(140);
 for(const id of ['navDog','navBooking']){await page.locator('#'+id).click();await page.waitForTimeout(100);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);}
 await page.locator('#navDog').click();await page.waitForTimeout(150);assert(await page.locator('#menuTab .lg-v3-material').count()>0);
 if(width===390)await page.screenshot({path:`/tmp/chvo-v376-screenshots/menu-${type.name()}-${dogs}.png`});
 await page.locator('#navBooking').click();await page.waitForTimeout(150);
 if(width===390)await page.screenshot({path:`/tmp/chvo-v376-screenshots/overview-${type.name()}-${dogs}.png`});
 await page.evaluate(()=>{__noticeFixture.forEach(row=>row.show_in_overview=false);return loadAnnouncements(true)});assert.equal(await page.locator('#customerNoticeOverviewV376').count(),0);
 assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS v376 pass layer persistence/recovery, selected 0/1/2 carousel, shared notice sheet, five-button nav/menu',type.name(),dogs,width);
 await context.close();}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
