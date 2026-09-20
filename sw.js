
const CACHE='chvostikovo-portal-shell-20260920-preview-brat-test-fixes-v19';
const APP_ICON='/icon-192.png';
const NOTIFICATION_BADGE='/notification-badge-v64.png?v=20260918-v64';
const PORTAL_CSP="default-src 'self'; img-src 'self' data: https://jgzabminzgbfhsrgqedt.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://jgzabminzgbfhsrgqedt.supabase.co wss://jgzabminzgbfhsrgqedt.supabase.co; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
const SHELL=['/','/styles.css?v=20260920-preview-brat-test-fixes-v19','/app.js?v=20260920-preview-brat-test-fixes-v19'];

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
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
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
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const secured=withPortalCsp(response);
          caches.open(CACHE).then(cache=>cache.put('/',secured.clone()));
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
  if(['/app.js','/styles.css'].includes(url.pathname)){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
        return response;
      }catch(_){
        return (await caches.match(event.request))||new Response('Offline',{status:503});
      }
    })());
  }
});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}
  catch(_){data={body:event.data?event.data.text():''}}
  event.waitUntil(self.registration.showNotification(data.title||'Chvostíkovo',{
    body:data.body||'',
    icon:APP_ICON,
    badge:NOTIFICATION_BADGE,
    tag:data.tag||'chvostikovo',
    renotify:true,
    data:data.data||{url:'/'}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/',self.location.origin).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(wins=>{
    const existing=wins.find(client=>client.url.startsWith(self.location.origin));
    if(existing){existing.focus();return existing.navigate(target)}
    return self.clients.openWindow(target);
  }));
});
