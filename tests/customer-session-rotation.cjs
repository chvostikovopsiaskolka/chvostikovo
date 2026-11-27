const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const code=source.slice(source.indexOf('let sessionRefreshInFlight='),source.indexOf('// A quote is read-only:'));
const key='chvostikovo_customer_session';
const fixture=(token='old')=>({access_token:token,refresh_token:'refresh-'+token,expires_at:1,user:{id:'synthetic-owner'}});
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
function mutex(){let tail=Promise.resolve();return {request:(_,fn)=>{const run=tail.then(fn);tail=run.catch(()=>{});return run}}}
function client({store=storage(),locks,fetch=async()=>({...fixture('new'),expires_at:9999999999})}={}){
 if(!store.getItem(key))store.setItem(key,JSON.stringify(fixture()));
 const ctx={SESSION_KEY:key,localStorage:store,sessionStorage:storage(),navigator:{locks},state:{storage:store,session:JSON.parse(store.getItem(key))},authFetch:fetch,startCustomerLive(){},Date,atob};
 ctx.clearSession=()=>{store.removeItem(key);ctx.state.session=null};ctx.saveSession=s=>{store.setItem(key,JSON.stringify(s));ctx.state.session=s};vm.createContext(ctx);vm.runInContext(code,ctx);
 return {ctx,run:s=>vm.runInContext(s,ctx),store};
}
(async()=>{
 const store=storage(),locks=mutex();let calls=0;
 const fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,10));return {...fixture('new'),expires_at:9999999999}};
 const a=client({store,locks,fetch}),b=client({store,locks,fetch});
 const results=await Promise.all([a.run('ensureCustomerSessionV357()'),a.run('ensureCustomerSessionV357()'),b.run('ensureCustomerSessionV357()')]);
 assert.equal(calls,1);assert(results.every(x=>x.access_token==='new'));
 const suspended=client();suspended.store.setItem(key,JSON.stringify({...fixture('rotated-elsewhere'),expires_at:9999999999}));
 assert.equal((await suspended.run('ensureCustomerSessionV357()')).access_token,'rotated-elsewhere');
 for(const status of [400,401,429,503]){const c=client({fetch:async()=>{throw Object.assign(Error('temporary'),{status,code:'temporary'})}});await assert.rejects(c.run('refreshSession()'),e=>e.authRefreshTransient&&!e.sessionInvalid);assert(c.store.getItem(key));}
 for(const tokenCode of ['refresh_token_not_found','refresh_token_already_used','user_banned']){const c=client({fetch:async()=>{throw Object.assign(Error('invalid'),{status:400,code:tokenCode})}});await assert.rejects(c.run('refreshSession()'),e=>e.sessionInvalid);}
 const offline=client({fetch:async()=>{throw TypeError('offline')}});await assert.rejects(offline.run('refreshSession()'),e=>e.authRefreshTransient);offline.ctx.authFetch=fetch;assert.equal((await offline.run('refreshSession()')).access_token,'new');
 let release;const logout=client({fetch:async()=>{await new Promise(r=>release=r);return fixture('late')}});const pending=logout.run('refreshSession()');logout.run('clearSession()');release();await assert.rejects(pending,e=>e.code==='session_changed');assert.equal(logout.store.getItem(key),null);
 const fallback=client();fallback.store.setItem(key,JSON.stringify({...fixture('fallback'),expires_at:9999999999}));assert.equal((await fallback.run('ensureCustomerSessionV357()')).access_token,'fallback');
 assert(source.includes("'/auth/v1/logout?scope=local'"));assert(!fs.readFileSync('sw.js','utf8').includes('localStorage'));
 console.log('PASS customer: shared rotation, suspended tab, transient vs invalid, offline/online, late logout, legacy fallback, scoped logout and update storage');
})().catch(e=>{console.error(e);process.exitCode=1});
