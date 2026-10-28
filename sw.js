
const CACHE='chvostikovo-portal-shell-v395';
const APP_ICON='/icon-192.png';
const NOTIFICATION_BADGE='/notification-badge-v64.png?v=20260918-v64';
const BADGE_STATE_CACHE='chvostikovo-customer-badge-state-v1';
const BADGE_STATE_URL=new URL('/__chvostikovo_customer_badge_count__',self.location.origin).href;
function isIOSBadgeTargetV171(){
  const ua=self.navigator?.userAgent||'';
  return /iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&Number(self.navigator?.maxTouchPoints||0)>1);
}
async function readCustomerBadgeStateV186(){
  try{
    const cache=await caches.open(BADGE_STATE_CACHE);
    const response=await cache.match(BADGE_STATE_URL);
    if(!response)return {count:0,updatedAt:0};
    const raw=await response.text();
    const data=raw.startsWith('{')?JSON.parse(raw):{count:Number(raw),updatedAt:0};
    return {count:Math.max(0,Math.floor(Number(data.count)||0)),updatedAt:Number(data.updatedAt)||0};
  }catch(_){return {count:0,updatedAt:0}}
}
let customerBadgeWriteV186=Promise.resolve();
function writeCustomerBadgeCountV186(count,updatedAt=Date.now()){
  const safe=Math.max(0,Math.floor(Number(count)||0));
  const stamp=Number(updatedAt)||Date.now();
  const task=customerBadgeWriteV186.catch(()=>{}).then(async()=>{
    const previous=await readCustomerBadgeStateV186();
    if(stamp<previous.updatedAt)return previous.count; // old delayed push must not restore a read badge
    try{
      const cache=await caches.open(BADGE_STATE_CACHE);
      await cache.put(BADGE_STATE_URL,new Response(JSON.stringify({count:safe,updatedAt:stamp}),{headers:{'Content-Type':'application/json'}}));
    }catch(_){}
    if(isIOSBadgeTargetV171()){
      try{
        if(safe>0&&'setAppBadge' in self.navigator)await self.navigator.setAppBadge(safe);
        else if(safe===0&&'clearAppBadge' in self.navigator)await self.navigator.clearAppBadge();
        else if(safe===0&&'setAppBadge' in self.navigator)await self.navigator.setAppBadge(0);
      }catch(_){}
    }
    return safe;
  });
  customerBadgeWriteV186=task;
  return task;
}

const PORTAL_CSP="default-src 'self'; img-src 'self' data: https://tlhcqwsluyqpywymjoxn.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://tlhcqwsluyqpywymjoxn.supabase.co wss://tlhcqwsluyqpywymjoxn.supabase.co; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
const SHELL=['/vendor/liquidlens/reels-noise-v385.png','/customer-liquid-optics.js?v=v395','/vendor/liquidlens/liquid-glass.js','/vendor/simple-liquid-glass/webgl.js','/vendor/liquidlens/chvostikovo-paws.png','/vendor/liquidlens/chvostikovo-paws-soft-v383.png','/customer-guide-v358.js?v=v395','/customer-guide-v358.css?v=v395','/telemetry-v345.js?v=v395','/loading-motion.js?v=v395','/loading-design.css?v=v395','/loading-brand.png','/android-install-choice-v308.js?v=20261019-android-choice-v308','/customer-design.js?v=v395','/customer-design.css?v=v395','/dog-choice-fab-v276.css?v=v395','/dual-dog-overview-v246.js?v=v395','/dual-dog-overview-v246.css?v=v395','/','/terms-pdf.js?v=v395','/terms-pdf-font.js?v=v395','/styles.css?v=v395','/bulletin-photo-v243.css?v=v395','/app.js?v=v395','/back-swipe.js?v=v395'];

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
  if(['/dual-dog-overview-v246.js','/dual-dog-overview-v246.css','/app.js','/styles.css','/bulletin-photo-v243.css','/back-swipe.js','/terms-pdf.js','/terms-pdf-font.js'].includes(url.pathname)){
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
    // Push sender supplies an absolute unread count; legacy pushes never increment history.
    if(isIOSBadgeTargetV171()&&Number.isInteger(data.badgeCount)&&data.badgeCount>=0)
      tasks.push(writeCustomerBadgeCountV186(data.badgeCount,Date.parse(data.badgeComputedAt)||Date.now()));
    await Promise.allSettled(tasks);
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  let target=new URL('/',self.location.origin).href;
  try{const u=new URL(event.notification.data?.url||'/',self.location.origin);if(u.origin===self.location.origin&&['/','/index.html'].includes(u.pathname))target=u.href;}catch(_){}
  event.waitUntil((async()=>{
    const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=wins.find(client=>client.url.startsWith(self.location.origin));
    if(existing){await existing.focus();return existing.navigate(target)}
    return self.clients.openWindow(target);
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='SET_CUSTOMER_BADGE_COUNT_V186')return;
  const count=Math.max(0,Math.floor(Number(event.data.count)||0));
  event.waitUntil(writeCustomerBadgeCountV186(count,event.data.updatedAt));
});





