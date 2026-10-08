
const CACHE='chvostikovo-portal-shell-20261008-chat-icon-polish-v177';
const APP_ICON='/icon-192.png';
const NOTIFICATION_BADGE='/notification-badge-v64.png?v=20260918-v64';
const BADGE_STATE_CACHE='chvostikovo-customer-badge-state-v1';
const BADGE_STATE_URL=new URL('/__chvostikovo_customer_badge_count__',self.location.origin).href;

function isIOSBadgeTargetV171(){
  const ua=self.navigator?.userAgent||'';
  return /iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&Number(self.navigator?.maxTouchPoints||0)>1);
}
async function readCustomerBadgeCountV171(){
  try{
    const cache=await caches.open(BADGE_STATE_CACHE);
    const response=await cache.match(BADGE_STATE_URL);
    const value=response?Number(await response.text()):0;
    return Number.isFinite(value)&&value>0?Math.floor(value):0;
  }catch(_){return 0}
}
async function writeCustomerBadgeCountV171(count){
  const safe=Math.max(0,Math.floor(Number(count)||0));
  try{
    const cache=await caches.open(BADGE_STATE_CACHE);
    if(safe>0)await cache.put(BADGE_STATE_URL,new Response(String(safe),{headers:{'Content-Type':'text/plain'}}));
    else await cache.delete(BADGE_STATE_URL);
  }catch(_){}
  if(!isIOSBadgeTargetV171())return safe;
  try{
    if(safe>0&&'setAppBadge' in self.navigator)await self.navigator.setAppBadge(safe);
    else if(safe===0&&'clearAppBadge' in self.navigator)await self.navigator.clearAppBadge();
    else if(safe===0&&'setAppBadge' in self.navigator)await self.navigator.setAppBadge(0);
  }catch(_){}
  return safe;
}
async function incrementCustomerBadgeV171(){
  return writeCustomerBadgeCountV171((await readCustomerBadgeCountV171())+1);
}
async function decrementCustomerBadgeV171(){
  return writeCustomerBadgeCountV171(Math.max(0,(await readCustomerBadgeCountV171())-1));
}

const PORTAL_CSP="default-src 'self'; img-src 'self' data: https://tlhcqwsluyqpywymjoxn.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://tlhcqwsluyqpywymjoxn.supabase.co wss://tlhcqwsluyqpywymjoxn.supabase.co; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
const SHELL=['/','/terms-pdf.js?v=20261008-chat-icon-polish-v177','/terms-pdf-font.js?v=20261008-chat-icon-polish-v177','/styles.css?v=20261008-chat-icon-polish-v177','/app.js?v=20261008-chat-icon-polish-v177','/back-swipe.js?v=20261008-chat-icon-polish-v177'];

function withPortalCsp(response){
  if(!response)return response;
  const headers=new Headers(response.headers);
  headers.set('Content-Security-Policy',PORTAL_CSP);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chvostikovo-portal-shell-')&&key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname==='/version.json'){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if(url.pathname==='/email-confirmed.html'||url.pathname==='/email-confirmed.js'){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const secured=withPortalCsp(response);
          if(response.ok&&['/','/index.html'].includes(url.pathname))caches.open(CACHE).then(cache=>cache.put('/',secured.clone())).catch(()=>{});
          return secured;
        })
        .catch(async()=>{
          const cached=await caches.match('/');
          return cached?withPortalCsp(cached):new Response('Chvostíkovo je momentálne offline.',{
            status:503,
            headers:{'Content-Type':'text/plain; charset=utf-8','Content-Security-Policy':PORTAL_CSP}
          });
        })
    );
    return;
  }
  if(['/app.js','/styles.css','/back-swipe.js','/terms-pdf.js','/terms-pdf-font.js'].includes(url.pathname)){
    event.respondWith((async()=>{
      // Build-stamped assets are immutable: reuse only this release's cache.
      const cache=await caches.open(CACHE);
      if(url.searchParams.has('v')){const cached=await cache.match(event.request);if(cached)return cached}
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)await cache.put(event.request,response.clone()).catch(()=>{});
        return response;
      }catch(_){
        return (await cache.match(event.request))||new Response('Offline',{status:503});
      }
    })());
  }
});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}
  catch(_){data={body:event.data?event.data.text():''}}
  event.waitUntil((async()=>{
    const tasks=[self.registration.showNotification(data.title||'Chvostíkovo',{
      body:data.body||'',
      icon:APP_ICON,
      badge:NOTIFICATION_BADGE,
      tag:data.tag||'chvostikovo',
      renotify:true,
      data:data.data||{url:'/'}
    })];
    if(isIOSBadgeTargetV171())tasks.push(incrementCustomerBadgeV171());
    await Promise.allSettled(tasks);
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/',self.location.origin).href;
  event.waitUntil((async()=>{
    if(isIOSBadgeTargetV171())await decrementCustomerBadgeV171();
    const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=wins.find(client=>client.url.startsWith(self.location.origin));
    if(existing){await existing.focus();return existing.navigate(target)}
    return self.clients.openWindow(target);
  })());
});
self.addEventListener('notificationclose',event=>{
  if(isIOSBadgeTargetV171())event.waitUntil(decrementCustomerBadgeV171());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='SET_CUSTOMER_BADGE_COUNT_V171')return;
  const count=Math.max(0,Math.floor(Number(event.data.count)||0));
  event.waitUntil(writeCustomerBadgeCountV171(count));
});

