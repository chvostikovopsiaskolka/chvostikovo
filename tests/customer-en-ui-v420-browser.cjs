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
        state.data.dogs[0].default_entry_type='pass';
        state.data.passes=[{id:42,dog_id:1,total_entries:10,used_entries:0,valid_until:'2099-12-31',status:'active'}];
        renderPassSummary();
        window.customerDesignRefreshLocaleV420?.();
      });
      assert.equal(await page.locator('#designTicket .design-paws>span').count(),10,'SK has 10 paws at '+width);
      await page.evaluate(()=>window.ChvostikovoLocale.setLanguage('en'));
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#passSummary strong').textContent(),'0 of 10','EN source pass count');
      assert.equal(await page.locator('#designTicket .design-paws>span').count(),10,'EN must not lose paw grid at '+width);
      assert.match(await page.locator('#designTicket .design-ticket-usage').innerText(),/Used\s+0 of 10 visits/);
      assert.match(await page.locator('#designTicket .design-validity').innerText(),/Valid until/);
      const ticket=await page.locator('#designTicket').evaluate(el=>{
        const r=el.getBoundingClientRect(),label=el.querySelector('.design-validity').getBoundingClientRect();
        return {width:r.width,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,badgeRight:label.right,right:r.right};
      });
      assert(ticket.scrollWidth<=ticket.clientWidth+3&&ticket.badgeRight<=ticket.right+2,'EN pass fits at '+width+': '+JSON.stringify(ticket));
      await page.evaluate(()=>{
        state.data.passes[0].total_entries=20;
        renderPassSummary();
        window.customerDesignRefreshLocaleV420?.();
      });
      assert.equal(await page.locator('#designTicket .design-paws>span').count(),20,'EN 20-visit pass still shows all paws');
      await page.evaluate(()=>window.ChvostikovoLocale.setLanguage('sk'));
      await page.waitForTimeout(60);
      assert.equal(await page.locator('#designTicket .design-paws>span').count(),20,'SK restore must retain all paws');

      await page.evaluate(()=>{
        switchTab('menu');document.getElementById('menuDogGroup').open=true;
        const badge=document.getElementById('customerAnnouncementsCountV363');
        badge.textContent='1';badge.classList.remove('hidden');
      });
      const badge=await page.locator('#customerAnnouncementsCountV363').evaluate(el=>{
        const r=el.getBoundingClientRect(),host=el.closest('#menuBulletinV229').getBoundingClientRect();
        return {position:getComputedStyle(el).position,top:r.top,bottom:r.bottom,left:r.left,right:r.right,rowTop:host.top,rowBottom:host.bottom,rowLeft:host.left,rowRight:host.right};
      });
      assert.equal(badge.position,'static','Unread count must not be absolutely positioned over My dog');
      assert(badge.top>=badge.rowTop-2&&badge.bottom<=badge.rowBottom+2&&badge.left>=badge.rowLeft-2&&badge.right<=badge.rowRight+2,'Unread count sits in Announcements row: '+JSON.stringify(badge));
      await page.evaluate(()=>{
        let modal=document.getElementById('dogDetailsOnboardingModalV75');
        if(!modal){modal=document.createElement('div');modal.id='dogDetailsOnboardingModalV75';document.body.appendChild(modal)}
        const body=document.createElement('div');body.className='legal-body';
        body.innerHTML='<p data-v420-onboarding>Základné údaje psíka už máte uložené. Chýbajú len platné očkovania alebo fotografia očkovacieho preukazu. Bez nich zatiaľ nie je možné rezervovať miesto.</p>';
        modal.appendChild(body);
        window.ChvostikovoLocale.setLanguage('en');
      });
      await page.waitForTimeout(100);
      assert.match(await page.locator('[data-v420-onboarding]').textContent(),/Your dog's basic details are saved/,'Modal text is translated, not only heading');

      await page.evaluate(()=>{showAuth('login');loading(false)});
      const resend=page.locator('#resendConfirmationV418');
      assert.equal(await resend.textContent(),'Resend verification link');
      const dimensions=await resend.evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),nowrap:getComputedStyle(el).whiteSpace,client:el.clientWidth,scroll:el.scrollWidth}));
      assert(dimensions.font<=13.1&&dimensions.nowrap==='nowrap'&&dimensions.scroll<=dimensions.client+2,'one-line resend at '+width+': '+JSON.stringify(dimensions));
      assert.equal(errors.length,0,'No browser JS errors at '+width+': '+errors.join('; '));
      await context.close();
    }
    console.log('PASS customer v420 EN/SK 10/20 pass paws, compact card, bulletin count row, onboarding translations, one-line resend 320/390 on '+engine.name());
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
