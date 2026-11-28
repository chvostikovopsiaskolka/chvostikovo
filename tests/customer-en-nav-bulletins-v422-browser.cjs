const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {expect}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/test');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
 const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 try{
  for(const width of [320,390]){
   const {page,context,errors}=await fixture(browser,1,width,engine.name());
   await page.clock.setFixedTime(new Date('2026-11-24T10:00:00Z'));
   await page.evaluate(()=>{
    const today=new Date().toISOString().slice(0,10),monday=new Date(today+'T12:00:00Z'),weekday=monday.getUTCDay();
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
   await expect(page.locator('#navBooking')).toHaveText(/Overview/);
   await expect(page.locator('#navBookAddV220')).toHaveText(/Book a place/);
   await expect(page.locator('#customerMessagesV363')).toHaveText(/Messages/);
   await expect(page.locator('#customerShopV414')).toHaveText(/Shop/);
   await page.locator('#navBookAddV220').click();
   await page.waitForFunction(()=>document.querySelector('#bookingPickerV37')&&!document.querySelector('#bookingPickerV37').classList.contains('hidden'));
   await expect(page.locator('#bookingPickerTitleV37')).toHaveText(/Bookings|Choose a day/);
   assert.equal(await page.locator('#bookingPickerV37 #designReservationNotice,#bookingPickerV37 #designWeekDeadline').count(),0);
   assert.equal(await page.locator('.booking-picker-week-label-v127').first().textContent(),'');
   await expect(page.locator('#designNearest #designWeekDeadline')).toContainText(/Missed the Sunday booking deadline/);
   // Late-contact days remain clickable but open their own contact flow after
   // the 19:00 deadline. This test exercises the ordinary booking/taxi form.
   const available=page.locator('.booking-day-v37:not(:disabled):not([data-contact="true"])').first();
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
   assert.match(await page.locator('#bookingPickerTaxiByDayV91').innerText(),/Round trip/);
   await page.evaluate(()=>window.ChvostikovoLocale.setLanguage('sk'));
   await page.waitForFunction(()=>document.querySelector('#navBooking')?.textContent?.includes('Prehľad'));
   assert.match(await page.locator('#bookingPickerTaxiByDayV91').innerText(),/Tam aj späť/);
   await page.locator('#bookingPickerCloseV37').click();
   // The customer rollout may precede the additive admin migration.
   await page.evaluate(()=>{
     const originalFetch=window.fetch;
     window.__noticeFetchOriginalV451=originalFetch;
     window.__noticeFixture=[{id:12347,active:true,title:'Legacy title',body:'Legacy full body',valid_from:'2026-01-01',show_in_overview:true}];
     window.__noticeReads=[];
     window.fetch=async(url,opts)=>{
       if(String(url).includes('portal_announcements?')&&String(url).includes('overview_text')){
         return {ok:false,status:400,json:async()=>({code:'42703',message:'column portal_announcements.overview_text does not exist'})};
       }
       return originalFetch(url,opts);
     };
     return loadAnnouncements(true);
   });
   const legacy=page.locator('#customerNoticeOverviewV376 [data-announcement-id="12347"]');
   await expect(legacy).toBeVisible();
   assert.equal(await legacy.locator('.customer-notice-excerpt-v363').count(),0);
   assert(!(await legacy.textContent()).includes('Legacy full body'));
   await page.evaluate(()=>{window.fetch=window.__noticeFetchOriginalV451;delete window.__noticeFetchOriginalV451});
   await page.clock.setFixedTime(new Date('2026-11-24T10:06:00Z'));
   await page.route('**/storage/v1/object/public/chvostikovo-bulletin-public/**',route=>route.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=','base64'),contentType:'image/png'}));
   await page.evaluate(()=>{
     window.__noticeFixture=[{id:12346,active:true,title:'Featured title',body:'Full article body, not the teaser.',overview_text:'Short teaser.',valid_from:'2026-01-01',valid_until:null,show_in_overview:true,image_path:'fixture/notice.png'}];
     window.__noticeReads=[];
     return loadAnnouncements(true);
   });
   const featured=page.locator('#customerNoticeOverviewV376 [data-announcement-id="12346"]');
   await expect(featured).toBeVisible();
   assert.equal(await featured.locator('.customer-notice-excerpt-v363').textContent(),'Short teaser.');
   assert(!(await featured.textContent()).includes('Full article body'));
   assert.equal(await featured.locator('.customer-notice-panel-v383').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
   const thumb=featured.locator('img');
   await expect(thumb).toHaveCSS('border-top-width','1px');
   await expect(thumb).toHaveCSS('border-top-color','rgba(0, 0, 0, 0.24)');
   assert.equal(await featured.locator('.customer-notice-panel-v383').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   assert.equal(await page.evaluate(()=>window.__noticeReads.length),0,'preview does not mark read');
   await featured.click();
   await expect(page.locator('#customerBulletinArticleV229 .customer-bulletin-article-v229')).toHaveText('Full article body, not the teaser.');
   await page.waitForFunction(()=>window.__noticeReads.includes(12346));
   await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();
   // Rich body is an optional bounded tree, not HTML. Keep the existing teaser and read receipt.
   await page.evaluate(()=>{
     const row=window.__noticeFixture[0];row.body='Tučné a kurzíva\n• Bod';row.body_format={v:1,plain:row.body,nodes:[{tag:'p',align:'center',children:[{tag:'b',children:['Tučné']},' a ',{tag:'i',children:['kurzíva']}]},{tag:'ul',children:[{tag:'li',children:['Bod']}]}]};
     return loadAnnouncements(true)
   });
   await expect(featured.locator('.customer-notice-excerpt-v363')).toHaveText('Short teaser.');
   await featured.click();
   const rich=page.locator('#customerBulletinArticleV229 .customer-bulletin-article-v229');
   await expect(rich.locator('b')).toHaveText('Tučné');
   await expect(rich.locator('i')).toHaveText('kurzíva');
   await expect(rich.locator('p')).toHaveCSS('text-align','center');
   await expect(rich.locator('li')).toHaveText('Bod');
   await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();
   // Only formatting changed, so the existing overview card must open the new tree.
   await page.evaluate(()=>{window.__noticeFixture[0].body_format.nodes[0].align='right';return loadAnnouncements(true)});
   await featured.click();
   await expect(rich.locator('p')).toHaveCSS('text-align','right');
   await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();
   // Unsupported elements and stale plain snapshots must fall back to text, never raw HTML.
   await page.evaluate(()=>{const row=window.__noticeFixture[0];row.body_format.nodes=[{tag:'img',children:[]}];return loadAnnouncements(true)});
   await featured.click();
   await expect(rich).toHaveText('Tučné a kurzíva • Bod');
   assert.equal(await rich.locator('img,script,iframe').count(),0);
   await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();

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
  console.log('PASS v422 EN/SK dock, 2-week calendar, selected dates & taxi; archived unread My dog badge and clear-on-read '+engine.name());
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
