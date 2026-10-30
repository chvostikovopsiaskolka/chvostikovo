const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('admin-wrapper/index.html', 'utf8');
const script = html.match(/<script id="admin-workspace-controller-v1">([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Workspace controller must be present');
assert(html.includes('id="chooseChvostikovo"'));
assert(html.includes('id="chooseBellaris"'));
assert(html.includes('id="projectPicker"'));
assert(html.includes('id="bellarisSplash"'));
assert(html.includes('class="app-boot loading-screen loading-concept hidden"'));
assert(html.includes("20261014-admin-pwa-v111"), 'Existing push PWA version retained');
assert(html.includes('https://bellaris-client-portal.pages.dev/'), 'Separate portal target');

async function simulate(href) {
  let fetched = 0, registered = 0, navigated = '';
  let written = '';
  const elements = Object.fromEntries(['projectPicker','boot','bellarisSplash','chooseChvostikovo','chooseBellaris','bootText']
    .map(id => [id, {hidden: id === 'bellarisSplash', listeners: {},
      classList: {removed: [],remove(x){this.removed.push(x)}},
      addEventListener(e, fn){this.listeners[e]=fn}, textContent:''}]));
  const doc = {
    getElementById(id){return elements[id]},
    open(){}, write(s){written=s}, close(){},
  };
  const loc = {href, assign(url){navigated=url}};
  const nav = {serviceWorker:{register(){registered++;return Promise.resolve()}}};
  const ctx = {document:doc,navigator:nav,window:{location:loc},URL,
    fetch: async (url,options) => {
      fetched++;
      assert(url.endsWith('/chvostikovo-frontend?v=20261014-admin-pwa-v111'));
      assert.equal(options.cache,'no-store');
      return {ok:true,text:async()=>'<html>Chvostíkovo admin unchanged</html>'};
    }};
  vm.runInNewContext(script,ctx,{timeout:1000});
  await Promise.resolve();
  return {
    elements, actions:{
      chvostikovo(){elements.chooseChvostikovo.listeners.click()},
      bellaris(){elements.chooseBellaris.listeners.click()},
    },
    get fetched(){return fetched},
    get registered(){return registered},
    get navigated(){return navigated},
    get written(){return written},
    async flush(){await new Promise(setImmediate)}
  };
}
(async()=>{
  const first=await simulate('https://chvostikovo-app.vercel.app/');
  assert.equal(first.fetched,0,'First screen must not start Chvostikovo backend');
  assert.equal(first.registered,1,'Existing service worker preserved');
  assert.equal(first.elements.projectPicker.hidden,false);
  assert.equal(first.elements.boot.classList.removed.length,0,'Original loading screen must wait for click');
  first.actions.chvostikovo();
  assert.equal(first.elements.projectPicker.hidden,true);
  assert.deepEqual(first.elements.boot.classList.removed,['hidden']);
  await first.flush();
  assert.equal(first.fetched,1);
  assert(first.written.includes('Chvostíkovo'));
  first.actions.chvostikovo();
  assert.equal(first.fetched,1,'Double tap must not double-fetch');

  const bellaris=await simulate('https://chvostikovo-app.vercel.app/');
  bellaris.actions.bellaris();
  assert.equal(bellaris.fetched,0,'No Chvostikovo request when Bellaris chosen');
  assert.equal(bellaris.elements.bellarisSplash.hidden,false);
  assert.equal(bellaris.navigated,'https://bellaris-client-portal.pages.dev/');

  for(const url of [
    'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',
    'https://chvostikovo-app.vercel.app/?tab=chat',
    'https://chvostikovo-app.vercel.app/#push'
  ]) {
    const d=await simulate(url);
    await d.flush();
    assert.equal(d.fetched,1,'Deep links and explicit admin links must bypass chooser');
    assert.equal(d.elements.projectPicker.hidden,true);
  }

  console.log('PASS: chooser first, spinner only after choice, Bellaris redirect, push deep links, single fetch, SW unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});