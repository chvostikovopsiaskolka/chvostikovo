const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),cssTree=require('css-tree');
const source=fs.readFileSync('app.js','utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
(async()=>{
 new vm.Script(source);cssTree.parse(fs.readFileSync('styles.css','utf8'));
 const ctx={state:{session:{user:{id:'a'},access_token:'token-a'}},SUPABASE_URL:'https://test.invalid',SUPABASE_KEY:'public',Date};vm.createContext(ctx);
 let reads=0,release;ctx.fetch=()=>{reads++;return new Promise(resolve=>release=resolve)};
 vm.runInContext(section('let customerTermsReadV146=', 'const customerHooks='),ctx);
 const first=ctx.readActiveCustomerTermsV146(),second=ctx.readActiveCustomerTermsV146(),forced=ctx.readActiveCustomerTermsV146(true);
 assert.equal(reads,1);release({ok:true,json:async()=>[{version:'test',document_hash:'hash'}]});await Promise.all([first,second,forced]);
 assert.equal((await ctx.readActiveCustomerTermsV146()).document_hash,'hash');assert.equal(reads,1);
 const refresh=ctx.readActiveCustomerTermsV146(true);assert.equal(reads,2);release({ok:false});await assert.rejects(refresh);
 const retry=ctx.readActiveCustomerTermsV146();assert.equal(reads,3);release({ok:true,json:async()=>[{version:'retry'}]});await retry;
 ctx.state.session={user:{id:'b'},access_token:'token-b'};const next=ctx.readActiveCustomerTermsV146();assert.equal(reads,4);release({ok:true,json:async()=>[{version:'b'}]});assert.equal((await next).version,'b');
 ctx.state.session=null;assert.equal(await ctx.readActiveCustomerTermsV146(),null);
 const dom=new JSDOM('<div id="dogTab"></div><div id="dogSettingsContentV36"><details id="customerLegalSectionV23"></details><button id="logoutBtn">Odhlásiť sa</button></div>',{runScripts:'outside-only'}),w=dom.window;
 w.$=id=>w.document.getElementById(id);w.ensureSettings=()=>{};w.eval(section('  function relocateSettings()', '  function openSettings('));
 w.relocateSettings();let changes=0;const observer=new w.MutationObserver(records=>changes+=records.length);observer.observe(w.$('dogSettingsContentV36'),{childList:true,subtree:true});
 for(let i=0;i<10;i++)w.relocateSettings();await new Promise(setImmediate);assert.equal(changes,0);w.close();
 assert(!source.includes('customerVisualV105'));assert(!source.includes('activeTermsCacheV56'));assert.equal((source.match(/portal_terms_documents\?active=eq.true/g)||[]).length,1);
 const events={},entries=new Map(),deleted=[],build=JSON.parse(fs.readFileSync('version.json','utf8')).build;let network=0;
 const sw={URL,Headers,Response,Promise,self:{location:{origin:'https://app.chvostikovo.sk'},addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}},caches:{open:async()=>({match:async request=>entries.get(request.url),put:async(request,response)=>entries.set(request.url,response),add:async()=>{}}),keys:async()=>['unrelated-cache','chvostikovo-portal-shell-old','chvostikovo-portal-shell-'+build],delete:async key=>deleted.push(key)},fetch:async()=>{network++;return new Response('asset')}};
 vm.createContext(sw);vm.runInContext(fs.readFileSync('sw.js','utf8'),sw);
 async function get(path){let response;events.fetch({request:{url:'https://app.chvostikovo.sk'+path,method:'GET'},respondWith:value=>response=value});return response&&await response;}
 await get('/app.js?v=20261004-customer-cleanup-v146');await get('/app.js?v=20261004-customer-cleanup-v146');assert.equal(network,1);
 await get('/app.js?v=next-build');assert.equal(network,2);await get('/version.json');assert.equal(network,3);
 let activation;events.activate({waitUntil:p=>activation=p});await activation;assert.deepEqual(deleted,['chvostikovo-portal-shell-old']);
 console.log('PASS: JS/CSS syntax; terms read deduplication/refresh/retry/account isolation; idempotent settings; versioned asset cache, fresh version checks and scoped old-cache cleanup');
})().catch(error=>{console.error(error);process.exit(1)});
