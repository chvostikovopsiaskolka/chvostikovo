const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('admin-wrapper/index.html','utf8');
const fsIcon=fs.readFileSync('admin-wrapper/apple-touch-icon.png');
assert.equal(fsIcon.subarray(1,4).toString(),'PNG','Home screen icon must be a PNG');
assert.equal(fsIcon.readUInt32BE(16),180,'iOS icon width must be 180');
assert.equal(fsIcon.readUInt32BE(20),180,'iOS icon height must be 180');
const adminManifest=JSON.parse(fs.readFileSync('admin-wrapper/manifest.webmanifest','utf8'));
const vercelConfig=JSON.parse(fs.readFileSync('admin-wrapper/vercel.json','utf8'));
assert(html.includes('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20261031-admin-both-v2"'));
assert(adminManifest.icons.every(x=>x.src.startsWith('/admin-icon-') && x.src.includes('admin-both-v2')),'All Android launch icons must be admin-specific');
assert(!vercelConfig.rewrites.some(x=>x.source==='/apple-touch-icon.png'),'iOS apple-touch-icon must be served locally, not from customer PWA');
assert(vercelConfig.rewrites.filter(x=>x.source.startsWith('/icon-')).every(x=>x.destination.startsWith('/admin-icon-')),'Legacy launch icon routes must resolve to admin-specific artwork');

const moduleSource = fs.readFileSync('admin-wrapper/bellaris-admin.mjs','utf8');
const css = fs.readFileSync('admin-wrapper/bellaris-admin.css','utf8');
const originalScript = html.match(/<script id="admin-workspace-controller-v1">([\s\S]*?)<\/script>/)?.[1];
assert(originalScript,'Original admin boot controller must exist');
assert(html.includes('id="chooseChvostikovo"'));
assert(html.includes('id="chooseBellaris"'));
assert(html.includes('id="bellarisDashboard"'));
assert(html.includes('class="app-boot loading-screen loading-concept hidden"'));
assert(html.includes('20261014-admin-pwa-v111'));
assert(!originalScript.includes('location.assign('),'Bellaris must not redirect to Safari');
assert(originalScript.includes("import('/bellaris-admin.mjs?v=20261101-viewport-diag-v1')"));
assert(css.includes('#bellarisDashboard'));
assert(html.includes('html:has(#boot:not(.hidden))'),'Hidden loader must not leave a cream iOS underlay');
assert(html.includes('html:has(#bellarisDashboard:not([hidden]))'),'Bellaris safe-area should match its screen');
assert(html.includes('html:has(#bellarisSplash:not([hidden]))'),'Bellaris splash should use a white underlay');
assert(html.includes('<meta name="theme-color" content="#ffffff">'),'Launcher theme should be white');
assert(originalScript.includes('const oldBootCanvas'),'Legacy Chvo login underlay needs scoped CSS fix');
assert(moduleSource.includes(".from('bp_staff')"),'Server RLS staff check required');
assert(moduleSource.includes(".eq('is_test',false)"),'Test CRM entries excluded');
assert(!/\.from\('bp_(inquiries|projects|milestones)'\)\.update\(/.test(moduleSource),'Bellaris phone MVP must remain read-only');
assert(!moduleSource.includes('tlhcqwsluyqpywymjoxn'),'Bellaris must not use Chvostikovo Supabase');
assert(moduleSource.includes('bellaris-staff-session-v1'),'Bellaris remembered login must use a separate storage key');
assert(moduleSource.includes('bellarisSessionStorage()'),'Session selection must be opt-in');
assert(moduleSource.includes("state.remember=form.get('remember')==='on'"),'Remember-me choice honored');
assert(!moduleSource.includes('Interná administrácia'),'Remove extra header label');
assert(!moduleSource.includes('netestovacích'),'Do not show internal test filtering in public admin copy');
assert(!moduleSource.includes('Mimo testovacích'),'Do not show internal filters on cards');
assert(moduleSource.includes("nav('menu','Menu')"),'Settings menu must be in bottom navigation');
assert(moduleSource.includes("nav('traffic','Návštevnosť')"),'Traffic must have a dashboard tab');
assert(moduleSource.includes('← Výber projektu'),'Project chooser belongs inside login form');
assert(moduleSource.includes('Odoslané záujmy'),'Traffic analytics must distinguish forms from page views');
assert(!moduleSource.includes('<button class="bm-mini" data-bm="logout"'),'Logout should not be in header');

assert(css.includes('display:grid;grid-template-rows:minmax(0,1fr) auto'),'One viewport grid owns scrolling content and sibling dock');
assert(!css.includes('bottom:auto;overflow:hidden;display:flex'),'No competing vh/flex viewport declaration');
assert(css.includes('.bm-scrollport{min-height:0'),'Inner scrollport may shrink');
assert(moduleSource.includes("state.root.innerHTML = '<div class=\"bm-scrollport\"><div class=\"bm-shell\"><header"),
  'Frame must create a dedicated scrolling container');
assert(moduleSource.includes("'</main></div></div>'"),
  'Frame must close the scrolling container before drawing the dock');
assert(moduleSource.includes('class="bm-axis-y"'),
  'Traffic SVG must show numeric values on the Y axis');
assert(moduleSource.includes('trafficFunnel(data)'),
  'Existing measured form events must be visible without inventing sessions');
assert(css.includes('min-width:420px'),
  'Narrow mobile plot must horizontally scroll instead of hiding Y labels');
assert(css.includes('.bm-login-form label.bm-remember{'),
  'Remember-login label must override the generic grid label with flex row');
assert(css.includes('.bm-login-form label.bm-remember input{'),
  'Checkbox width and height must not inherit full-width text input rules');
assert(moduleSource.includes('>Zapamätať prihlásenie</span>'),
  'Remember-me copy should fit one line, without promising password storage');
assert(moduleSource.includes('trafficSourceDonut(data.bySource)'),
  'Overview must show the existing measured traffic sources');
assert(moduleSource.includes('Podiel zobrazení podľa nameraného zdroja'),
  'Pie chart must not suggest unique visitors or precise attribution');
assert(moduleSource.includes('if(!total)return'),
  'Zero-measurement source chart must not invent traffic');
assert(!moduleSource.includes('Web Push API'), 'Push is outside this isolated visual correction');


async function simulate(href) {
  let fetched=0, registered=0, navigated='', written='', openedBellaris=0;
  let back=null;
  const elements=Object.fromEntries(
    ['projectPicker','boot','bellarisSplash','bellarisDashboard','chooseChvostikovo','chooseBellaris','bootText'].map(id=>[
      id,{hidden:id==='bellarisSplash'||id==='bellarisDashboard',listeners:{},
        classList:{removed:[],added:[],remove(...x){this.removed.push(...x)},add(...x){this.added.push(...x)}},
        addEventListener(evt,fn){this.listeners[evt]=fn},
        textContent:'',innerHTML:''}
    ])
  );
  const theme={value:'#ffffff',setAttribute(name,value){assert.equal(name,'content');this.value=value;}};
  const doc={
    getElementById(id){return elements[id]},
    querySelector(selector){return selector==='meta[name="theme-color"]'?theme:null;},
    createElement(tag){
      assert.equal(tag,'link');
      return {onload:null,onerror:null};
    },
    head:{appendChild(link){elements.bellarisMobileStyle=link;queueMicrotask(()=>link.onload?.())}},
    open(){},write(x){written=x},close(){}
  };
  const navigator={serviceWorker:{register(){registered++;return Promise.resolve()}}};
  const window={
    location:{href,assign(url){navigated=url}},
    testImportBellaris:async()=>({
      async openBellarisMobile(root,onBack){
        openedBellaris++;
        root.hidden=false;
        root.innerHTML='<main>Bellaris staff dashboard</main>';
        back=onBack;
      }
    })
  };
  const testScript=originalScript.replace(
    "await import('/bellaris-admin.mjs?v=20261101-viewport-diag-v1')",
    'await window.testImportBellaris()'
  );
  assert.notEqual(testScript,originalScript,'Test import mock inserted');
  vm.runInNewContext(testScript,{document:doc,navigator,window,URL,fetch:async (url,options)=>{
    fetched++;
    assert(url.endsWith('/chvostikovo-frontend?v=20261014-admin-pwa-v111'));
    assert.equal(options.cache,'no-store');
    return {ok:true,text:async()=>'<html><style>html:has(#appBoot),body:has(#appBoot){background:#fff!important}</style>Chvostíkovo admin unchanged</html>'};
  }},{timeout:1500});
  await Promise.resolve();
  return {
    elements,
    get theme(){return theme.value;},
    clickChvo(){return elements.chooseChvostikovo.listeners.click()},
    clickBellaris(){return elements.chooseBellaris.listeners.click()},
    back(){back?.()},
    get fetched(){return fetched},get registered(){return registered},
    get navigated(){return navigated},get written(){return written},
    get openedBellaris(){return openedBellaris},
    async flush(){await new Promise(setImmediate)}
  };
}
(async()=>{
  const first=await simulate('https://chvostikovo-app.vercel.app/');
  assert.equal(first.fetched,0,'No Chvostikovo database request on picker');
  assert.equal(first.registered,1);
  assert.equal(first.elements.projectPicker.hidden,false);
  assert.equal(first.elements.boot.classList.removed.length,0);
  assert.equal(first.theme,'#ffffff');
  first.clickChvo();
  assert.equal(first.theme,'#fffaf5','Chvostikovo loader should keep its cream theme');
  await first.flush();
  assert.equal(first.fetched,1);
  assert.equal(first.elements.projectPicker.hidden,true);
  assert.deepEqual(first.elements.boot.classList.removed,['hidden','load-failed']);
  assert(first.written.includes('Chvostíkovo'));
  assert(first.written.includes('html:has(#appBoot:not(.hidden))'),
    'Chvostikovo login safe-area should stop painting boot-white after boot hides');
  assert(!first.written.includes('html:has(#appBoot),body:has(#appBoot)'),
    'Legacy permanent white underlay should be scoped, without changing any other HTML');
  first.clickChvo();
  assert.equal(first.fetched,1,'Double-tap cannot start second boot');

  const bellaris=await simulate('https://chvostikovo-app.vercel.app/');
  await bellaris.clickBellaris();
  assert.equal(bellaris.fetched,0,'Bellaris must never fetch Chvostikovo backend');
  assert.equal(bellaris.navigated,'','No Safari navigation');
  assert.equal(bellaris.openedBellaris,1);
  assert.equal(bellaris.elements.bellarisDashboard.hidden,false,'Dashboard inside admin PWA');
  assert.equal(bellaris.elements.bellarisSplash.hidden,true);
  assert.equal(bellaris.theme,'#f4f7f7','Bellaris mobile surface must have matching iOS theme');
  assert(bellaris.elements.bellarisDashboard.innerHTML.includes('Bellaris staff dashboard'));
  bellaris.back();
  assert.equal(bellaris.elements.projectPicker.hidden,false,'Return to project selection');
  assert.equal(bellaris.elements.bellarisDashboard.hidden,true);
  assert.equal(bellaris.theme,'#ffffff','Returning to the project picker restores white iOS theme');
  bellaris.clickChvo();
  await bellaris.flush();
  assert.equal(bellaris.fetched,1,'Switching to Chvostikovo still works');

  for(const url of [
    'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',
    'https://chvostikovo-app.vercel.app/?tab=chat',
    'https://chvostikovo-app.vercel.app/#push'
  ]){
    const d=await simulate(url);
    await d.flush();
    assert.equal(d.fetched,1,'Notification and legacy deep link bypass launcher');
  }
  const sw=fs.readFileSync('admin-wrapper/sw.js','utf8');
  const listeners={};let opened='';
  const selfMock={
    location:{origin:'https://chvostikovo-app.vercel.app'},
    addEventListener(name,fn){listeners[name]=fn},
    clients:{matchAll:async()=>[],openWindow:async(url)=>{opened=url}}
  };
  vm.runInNewContext(sw,{self:selfMock,URL},{timeout:1000});
  async function clickPush(url){
    let pending;
    listeners.notificationclick({notification:{data:{url},close(){}},waitUntil(p){pending=p}});
    await pending;
    return opened;
  }
  assert.equal(await clickPush('/'),'https://chvostikovo-app.vercel.app/?workspace=chvostikovo');
  assert.equal(await clickPush('/?tab=reservations'),'https://chvostikovo-app.vercel.app/?tab=reservations');

  const pure=await import('./bellaris-admin.mjs');
  assert.equal(pure.escapeText('<script>"a"'),'&lt;script&gt;&quot;a&quot;');
  assert.deepEqual(pure.getSummary([{status:'new'},{status:'approved'}],
    [{state:'brief'},{state:'review'},{state:'delivered'}],
    [{completed:true},{completed:false}]),
    {inquiries:2,newInquiries:1,activeProjects:2,reviewProjects:1,completedSteps:1});
  assert.equal(pure.projectProgress('one',[
    {project_id:'one',weight:2,completed:true},{project_id:'one',weight:2,completed:false},
    {project_id:'two',weight:9,completed:true}]),50);
  assert.equal(pure.projectProgress('missing',[]),0);
  const summary=pure.trafficSummary([
    {day:new Date().toISOString().slice(0,10),event_type:'page_view',path:'/',source_channel:'direct',total:10},
    {day:new Date().toISOString().slice(0,10),event_type:'cta_click',path:'/',source_channel:'direct',total:3},
    {day:new Date().toISOString().slice(0,10),event_type:'lead_submit',path:'/',source_channel:'direct',total:1}
  ],7);
  assert.equal(summary.total,10);
  assert.equal(summary.ctas,3);
  assert.equal(summary.forms,1);
  assert.equal(summary.formOpens,0);
  assert.equal(summary.eventCounts.page_view,10);
  assert.equal(summary.eventCounts.lead_submit,1);

  const breakdown=pure.trafficSummary([
    {day:new Date().toISOString().slice(0,10),event_type:'cta_click',event_label:'Zistiť viac',path:'/lead',source_channel:'meta_paid',total:3},
    {day:new Date().toISOString().slice(0,10),event_type:'cta_click',event_label:'Zistiť viac',path:'/lead',source_channel:'google_organic',total:2},
    {day:new Date().toISOString().slice(0,10),event_type:'cta_click',event_label:'Zistiť viac',path:'/',source_channel:'direct',total:1}
  ],7);
  assert.equal(breakdown.ctas,6);
  assert.equal(breakdown.byCta[0][1],6);
  assert.equal(breakdown.byCtaOrigin.length,3);
  assert.deepEqual(breakdown.byCtaOrigin.map(x=>x.total),[3,2,1]);
  assert(moduleSource.includes('data-bm="cta-detail"'),'Tapping CTA should open provenance detail');
  assert(moduleSource.includes("event_label,total"),'Daily CTA labels must be requested in traffic query');
  console.log('PASS: inline Bellaris dashboard, Chvo spinner, push routes, RLS guard, escaped fields, no writes');
})().catch(err=>{console.error(err);process.exitCode=1});
