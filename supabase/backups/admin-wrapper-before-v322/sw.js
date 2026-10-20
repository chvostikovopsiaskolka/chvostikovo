const PUSH_WORKER_VERSION='chvostikovo-admin-push-2';
const NOTIFICATION_BADGE='/notification-badge.png?v=20261014-admin-pwa-v111';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={body:event.data?event.data.text():''}}
  event.waitUntil(self.registration.showNotification(data.title||'Chvostíkovo',{
    body:data.body||'',
    badge:NOTIFICATION_BADGE,
    tag:data.tag||PUSH_WORKER_VERSION,
    renotify:true,
    data:data.data||{url:'/'}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const targetUrl=new URL(event.notification.data?.url||'/',self.location.origin).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>{
    const existing=windows.find(client=>client.url.startsWith(self.location.origin));
    if(existing){existing.focus();return existing.navigate(targetUrl)}
    return self.clients.openWindow(targetUrl)
  }));
});
