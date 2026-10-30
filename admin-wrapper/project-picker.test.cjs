const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('admin-wrapper/index.html','utf8');
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
assert(originalScript.includes("import('/bellaris-admin.mjs?v=20261030-v1')"));
assert(css.includes('#bellarisDashboard'));
assert(moduleSource.includes(".from('bp_staff')"),'Server RLS staff check required');
assert(moduleSource.includes(".eq('is_test',false)"),'Test CRM entries excluded');
assert(!/\.from\('bp_(inquiries|projects|milestones)'\)\.update\(/.test(moduleSource),'Bellaris phone MVP must remain read-only');
assert(!moduleSource.includes('tlhcqwsluyqpywymjoxn'),'Bellaris must not use Chvostikovo Supabase');

async function simulate(href) {
  let fetched=0, registered=0, navigated='', written='', openedBellaris=0;
  let back=null;
  const elements=Object.fromEntries(
    ['projectPicker','boot','bellarisSplash','bellarisDashboard','chooseChvostikovo','chooseBellaris','bootText'].map(id=>[
      id,{hidden:id==='bellarisSplash'||id==='bellarisDashboard',listeners:{},
        classList:{removed:[],remove(x){this.removed.push(x)}},
        addEventListener(evt,fn){this.listeners[evt]=fn},
        textContent:'',innerHTML:''}
    ])
  );
  const doc={
    getElementById(id){return elements[id]},
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
    "await import('/bellaris-admin.mjs?v=20261030-v1')",
    'await window.testImportBellaris()'
  );
  assert.notEqual(testScript,originalScript,'Test import mock inserted');
  vm.runInNewContext(testScript,{document:doc,navigator,window,URL,fetch:async (url,options)=>{
    fetched++;
    assert(url.endsWith('/chvostikovo-frontend?v=20261014-admin-pwa-v111'));
    assert.equal(options.cache,'no-store');
    return {ok:true,text:async()=>'<html>Chvostíkovo admin unchanged</html>'};
  }},{timeout:1500});
  await Promise.resolve();
  return {
    elements,
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
  first.clickChvo();
  await first.flush();
  assert.equal(first.fetched,1);
  assert.equal(first.elements.projectPicker.hidden,true);
  assert.deepEqual(first.elements.boot.classList.removed,['hidden']);
  assert(first.written.includes('Chvostíkovo'));
  first.clickChvo();
  assert.equal(first.fetched,1,'Double-tap cannot start second boot');

  const bellaris=await simulate('https://chvostikovo-app.vercel.app/');
  await bellaris.clickBellaris();
  assert.equal(bellaris.fetched,0,'Bellaris must never fetch Chvostikovo backend');
  assert.equal(bellaris.navigated,'','No Safari navigation');
  assert.equal(bellaris.openedBellaris,1);
  assert.equal(bellaris.elements.bellarisDashboard.hidden,false,'Dashboard inside admin PWA');
  assert.equal(bellaris.elements.bellarisSplash.hidden,true);
  assert(bellaris.elements.bellarisDashboard.innerHTML.includes('Bellaris staff dashboard'));
  bellaris.back();
  assert.equal(bellaris.elements.projectPicker.hidden,false,'Return to project selection');
  assert.equal(bellaris.elements.bellarisDashboard.hidden,true);
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
  console.log('PASS: inline Bellaris dashboard, Chvo spinner, push routes, RLS guard, escaped fields, no writes');
})().catch(err=>{console.error(err);process.exitCode=1});
