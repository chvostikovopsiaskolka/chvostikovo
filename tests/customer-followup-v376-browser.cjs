const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 for(const dogs of [1,2])for(const width of [320,360,390,430,844]){
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM).args:["--no-sandbox"]}:{});
 try{const{page,context,errors}=await fixture(browser,dogs,width,type.name());
 await page.evaluate(()=>{state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:0,status:'active',valid_until:'2099-12-31'}];renderPassSummary();renderDog();});
 await page.waitForSelector('#designTicket>.lg-v3-material',{state:'attached'});
 const nav=await page.locator('.bottom-nav').boundingBox();
 if(dogs===1){const aligned=await page.evaluate(()=>{const ids=['bookingVaccinationStatus','bookingVisitCount','bookingGradebook'];return ids.map(id=>{const row=document.getElementById(id),icon=row.querySelector('svg').getBoundingClientRect(),label=row.querySelector(':scope>span:last-child').getBoundingClientRect();return{x:icon.x,width:icon.width,height:icon.height,textX:label.x};});});assert(aligned.every(a=>Math.abs(a.x-aligned[0].x)<1&&a.width===24&&a.height===24&&Math.abs(a.textX-aligned[0].textX)<1),'profile icon and text columns align');}

 const buttons=await page.locator('.bottom-nav>button').evaluateAll(nodes=>nodes.filter(el=>getComputedStyle(el).display!=='none').map(el=>({id:el.id,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
 assert(await page.locator('.booking-action-label-v369').evaluate(el=>el.scrollWidth<=el.clientWidth&&getComputedStyle(el).whiteSpace==='nowrap'));
 assert.equal(buttons.length,5);assert(buttons.every(b=>b.w>=44&&b.h>=44));const centre=buttons.find(b=>b.id==='navBookAddV220');assert(buttons.filter(b=>b!==centre).every(b=>centre.w>b.w));
 await page.evaluate(()=>window.__passMaterial=document.querySelector('#designTicket>.lg-v3-material'));
 await page.evaluate(()=>{for(let i=0;i<12;i++){renderPassSummary();renderUpcoming();renderDog();}state.data.passes[0].used_entries=1;renderPassSummary();renderDog();});
 await page.waitForTimeout(160);
 assert(await page.evaluate(()=>document.querySelector('#designTicket>.lg-v3-material')===window.__passMaterial),'updated pass retains exact optical layer');
 await page.evaluate(()=>{document.querySelector('#designTicket').innerHTML='<h2>Externá obnova obsahu</h2>'});await page.waitForSelector('#designTicket>.lg-v3-material',{state:'attached',timeout:10000});
 assert.equal(await page.locator('#designTicket>.lg-v3-material').count(),1,'optics recovers externally replaced content');
 await page.evaluate(()=>{delete document.querySelector('#designTicket').dataset.presentationKey;renderPassSummary();renderDog();window.__noticeFixture=[{id:51,active:true,show_in_overview:true,title:'Vybraný oznam',body:'Prvý oznam',valid_from:'2020-01-01'},{id:52,active:true,show_in_overview:false,title:'Iba v histórii',body:'Druhý oznam',valid_from:'2020-01-01'},{id:53,active:true,show_in_overview:true,title:'Skončený oznam',valid_until:'2021-01-01',valid_from:'2020-01-01'}];return loadAnnouncements(true);});
 assert.equal(await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').count(),1);
 assert(await page.evaluate(()=>document.getElementById('designNearest').nextElementSibling.id==='customerNoticeOverviewV376'));
 assert.equal(await page.locator('#customerNoticeOverviewV376 .customer-notice-carousel-v376').getAttribute('data-multiple'),'false');assert.equal(await page.locator('.customer-notice-controls-v381').count(),0);
 await page.evaluate(()=>{__noticeFixture.push({id:54,active:true,show_in_overview:true,title:'Ďalší oznam',body:'Pozvánka',valid_from:'2020-01-01'});return loadAnnouncements(true)});
 assert.equal(await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').count(),2);assert.equal(await page.locator('.customer-notice-carousel-v376').getAttribute('data-multiple'),'true');
 await page.locator('[aria-label="Ďalší oznam"]').click();
 await page.waitForFunction(()=>document.querySelector('.customer-notice-position-v381').textContent==='2 / 2');
 assert(await page.locator('[aria-label="Ďalší oznam"]').isDisabled());
 await page.evaluate(()=>document.querySelector('.customer-notice-carousel-v376').scrollTo({left:0,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('.customer-notice-position-v381').textContent==='1 / 2');
 assert(await page.locator('[aria-label="Predchádzajúci oznam"]').isDisabled());
 await page.locator('#customerNoticeOverviewV376').scrollIntoViewIfNeeded();
 await page.locator('#customerNoticeOverviewV376 .customer-notice-content-v363>.lg-v3-material').first().waitFor({state:'attached'});
 assert.equal(await page.locator('#customerNoticeOverviewV376>.lg-v3-material').count(),0,'outer notice remains opaque');
 assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 218, 192)');
 assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts<=2,'inner notice does not allocate extra WebGL contexts');
 const cardStyle=await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').first().evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,radius:s.borderRadius,padding:s.padding,columns:s.gridTemplateColumns}});
 assert.equal(await page.evaluate(()=>__noticeReads.length),0,'carousel does not dismiss notices');
 await page.locator('#customerAnnouncementsV363').click();await page.waitForTimeout(100);
 assert.equal(await page.locator('#customerBulletinHistoryV229 [data-announcement-id]').count(),4);
 await page.locator('#customerBulletinHistoryV229 .customer-notice-content-v363>.lg-v3-material').first().waitFor({state:'attached'});
 assert.equal(await page.locator('#customerBulletinHistoryV229>.lg-v3-material').count(),0,'notice sheet retains opaque outer material');
 assert.deepEqual(await page.locator('#customerBulletinHistoryV229 [data-announcement-id]').first().evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,radius:s.borderRadius,padding:s.padding}}),{background:cardStyle.background,radius:cardStyle.radius,padding:cardStyle.padding},'overview and sheet use the same white card material');
 if(width===390){fs.mkdirSync('/tmp/chvo-v376-screenshots',{recursive:true});await page.screenshot({path:`/tmp/chvo-v376-screenshots/notice-${type.name()}-${dogs}.png`});}
 await page.locator('#customerBulletinHistoryV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(140);
 for(const id of ['navDog','navBooking']){await page.locator('#'+id).click();await page.waitForTimeout(100);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);}
 await page.locator('#navDog').click();await page.waitForTimeout(150);assert(await page.locator('#menuTab .lg-v3-material').count()>0);
 for(const id of ['menuDogGroup','menuSettingsGroup']){const layer=page.locator('#'+id+'>summary>.lg-v3-material');await layer.waitFor({state:'attached'});assert(await layer.isVisible(),'closed details material is painted inside summary');await page.locator('#'+id+'>summary').click();assert(await layer.isVisible());await page.locator('#'+id+'>summary').click();assert(await layer.isVisible());}
 assert(!await page.locator('#menuMessage').isVisible());
 if(width===390)await page.screenshot({path:`/tmp/chvo-v376-screenshots/menu-${type.name()}-${dogs}.png`});
 await page.locator('#navBooking').click();await page.waitForTimeout(150);
 if(width===390)await page.screenshot({path:`/tmp/chvo-v376-screenshots/overview-${type.name()}-${dogs}.png`});
 await page.evaluate(()=>{__noticeFixture.forEach(row=>row.show_in_overview=false);return loadAnnouncements(true)});assert.equal(await page.locator('#customerNoticeOverviewV376').count(),0);
 if(dogs===1&&width===390){
   await page.evaluate(()=>{history.replaceState({},'', '?notice-carousel-preview=1');return loadAnnouncements(true)});
   assert.equal(await page.locator('#customerNoticeOverviewV376 [data-announcement-id]').count(),2);
   await page.locator('#customerNoticeOverviewV376').scrollIntoViewIfNeeded();
   await page.screenshot({path:`/tmp/chvo-v376-screenshots/carousel-preview-${type.name()}.png`});
   const readBefore=await page.evaluate(()=>__noticeReads.length);
   await page.locator('[aria-label="Ďalší oznam"]').click();await page.waitForFunction(()=>document.querySelector('.customer-notice-position-v381').textContent==='2 / 2');
   await page.locator('[data-announcement-id="preview-extra"]').click();await page.waitForSelector('#customerBulletinArticleV229:not(.hidden)');
   assert.equal(await page.evaluate(()=>__noticeReads.length),readBefore,'preview does not write a fake receipt');
   await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(140);
   await page.evaluate(()=>{history.replaceState({},'', '/');return loadAnnouncements(true)});
   assert.equal(await page.locator('#customerNoticeOverviewV376').count(),0,'preview is opt-in and not persisted');
 }
 assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS v376 pass layer persistence/recovery, selected 0/1/2 carousel, shared notice sheet, five-button nav/menu',type.name(),dogs,width);
 await context.close();}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
