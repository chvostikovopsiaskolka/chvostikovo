const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 try{
  for(const width of [320,390]){
   const {page,context,errors}=await fixture(browser,1,width,engine.name());
   await page.evaluate(()=>{
    const today=bratislavaClockV95().date,monday=new Date(today+'T12:00:00Z'),weekday=monday.getUTCDay();
    monday.setUTCDate(monday.getUTCDate()-(weekday===0?6:weekday-1));
    state.data.availability.days=Array.from({length:10},(_,i)=>{
      const d=new Date(monday);d.setUTCDate(monday.getUTCDate()+Math.floor(i/5)*7+i%5);
      return {date:d.toISOString().slice(0,10),available:8,occupied:2,capacity:10,bookings_open:true};
    });
    state.data.requests=[];state.data.reservations=[];state.data.booking_history=[];
    renderAll();
    window.ChvostikovoLocale.setLanguage('en');
   });
   await page.waitForFunction(()=>document.querySelector('#navBooking')?.textContent?.includes('Overview'));
   assert.match(await page.locator('#navBooking').innerText(),/Overview/);
   assert.match(await page.locator('#navBookAddV220').innerText(),/Book a place/);
   assert.match(await page.locator('#customerMessagesV363').innerText(),/Messages/);
   assert.match(await page.locator('#customerShopV414').innerText(),/Shop/);
   await page.locator('#navBookAddV220').click();
   await page.waitForFunction(()=>document.querySelector('#bookingPickerV37')&&!document.querySelector('#bookingPickerV37').classList.contains('hidden'));
   await page.waitForFunction(()=>document.querySelector('.booking-picker-week-label-v127')?.textContent?.includes('This week'));
   assert.match(await page.locator('#bookingPickerTitleV37').innerText(),/Bookings|Choose a day/);
   assert.match(await page.locator('.booking-picker-week-label-v127').first().innerText(),/This week/);
   assert.match(await page.locator('.booking-picker-week-label-v127').last().innerText(),/Next week/);
   const available=page.locator('.booking-day-v37:not(:disabled)').first();
   assert.match(await available.getAttribute('title'),/Occupied:\s*2 of 10 places/);
   assert.match(await available.locator('small').textContent(),/Mon|Tue|Wed|Thu|Fri/);
   await available.click();await page.waitForTimeout(120);
   const selected=page.locator('#bookingPickerTaxiByDayV91 .design-selected-day');
   assert(await selected.count()>0,'selected date appears');
   assert.match(await selected.first().locator('strong').innerText(),/Monday|Tuesday|Wednesday|Thursday|Friday/);
   assert.match(await selected.first().locator('.design-taxi-disclosure').innerText(),/Need transport\?/);
   assert.match(await page.locator('#designSelectedDaysTitle').innerText(),/Selected days/);
   await selected.first().locator('.design-taxi-disclosure').click();
   await page.waitForTimeout(120);
   assert.match(await page.locator('#bookingPickerTaxiByDayV91').innerText(),/Pickup and drop-off/);
   await page.evaluate(()=>window.ChvostikovoLocale.setLanguage('sk'));
   await page.waitForFunction(()=>document.querySelector('#navBooking')?.textContent?.includes('Prehľad'));
   assert.match(await page.locator('#bookingPickerTaxiByDayV91').innerText(),/Vyzdvihnutie aj dovoz/);
   await page.locator('#bookingPickerCloseV37').click();
   await page.evaluate(()=>{
     window.__noticeFixture=[{id:12345,active:true,title:'Súkromný titul oznamu',body:'Zostáva v slovenčine',
       valid_from:'2026-01-01',valid_until:null,show_in_overview:false,created_at:'2026-01-01',image_path:null}];
     window.__noticeReads=[];
     return loadAnnouncements(true);
   });
   await page.waitForFunction(()=>document.querySelector('#customerAnnouncementsCountV363')?.textContent==='1');
   assert.equal(await page.locator('#customerNoticeOverviewV376').count(),0,
     'archive-only announcement must not appear in featured Overview');
   assert.equal(await page.locator('#menuDogGroup > summary .customer-dog-unread-v421').innerText(),'1',
     'My dog must show the unread badge for archive-only announcement');
   await page.locator('#navDog').click();
   assert(await page.locator('#menuDogGroup > summary .customer-dog-unread-v421').isVisible());
   await page.evaluate(()=>window.ChvostikovoLocale.setLanguage('en'));
   assert.match(await page.locator('#menuDogGroup > summary').getAttribute('aria-label'),/My dog, 1 unread announcement/);
   await page.locator('#menuDogGroup > summary').click();
   assert.equal(await page.locator('#menuBulletinV229 #customerAnnouncementsCountV363').innerText(),'1');
   await page.locator('#menuBulletinV229').click();
   await page.waitForFunction(()=>document.querySelectorAll('.customer-bulletin-history-row-v229').length>0);
   await page.locator('[data-announcement-id="12345"]').click();
   await page.waitForFunction(()=>document.querySelector('#customerAnnouncementsCountV363')?.classList.contains('hidden'));
   assert(await page.locator('#menuDogGroup > summary .customer-dog-unread-v421').evaluate(el=>el.classList.contains('hidden')),
    'My dog unread marker clears only when announcement is read');
   assert.equal(errors.length,0,'browser JS errors at '+width+': '+errors.join(' | '));
   await context.close();
  }
  console.log('PASS v421 EN/SK dock, 2-week calendar, selected dates & taxi; archived unread My dog badge and clear-on-read '+engine.name());
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
