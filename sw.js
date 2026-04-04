// Service Worker v4 — Radiology Roster
const CACHE = 'roster-v5';
const ASSETS = ['./','./index.html','./manifest.json'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  if(e.request.url.includes('script.google.com')){
    e.respondWith(fetch(e.request).catch(()=>new Response('{"error":"offline"}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{
      const clone=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return res;
    }))
  );
});

// Handle show notification message from page
self.addEventListener('message', e=>{
  if(e.data?.type==='SHOW_NOTIF'){
    self.registration.showNotification(e.data.title,{
      body:e.data.body, icon:'./icon-192.png',
      badge:'./icon-192.png', tag:e.data.tag||'roster',
      renotify:true
    });
  }
});

// Push notification from server (ntfy.sh or FCM)
self.addEventListener('push', e=>{
  const data=e.data?e.data.json():{title:'Roster Update',body:'Check your duty posting.'};
  e.waitUntil(self.registration.showNotification(data.title,{
    body:data.body, icon:'./icon-192.png', badge:'./icon-192.png',
    tag:'roster-push', renotify:true
  }));
});

self.addEventListener('notificationclick', e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(list=>{
    if(list.length) return list[0].focus();
    return clients.openWindow('./');
  }));
});
