// 通信できるときは常に最新版を取得し、オフライン時や電波が弱いときは保存済みの版を使います
const VERSION = "nippo-v27";
const FILES = ["./","./index.html","./shijisho.html","./nippo.html","./manifest.json",
  "./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];

const SEALS = ["./中村泰輔.png","./内田麗子.png","./内田洋.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(VERSION).then(async c=>{
    await c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})));
    await Promise.allSettled(SEALS.map(f=>c.add(f)));   // しるし画像(未配置でも本体の保存は止めない)
  }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const u = new URL(e.request.url);
  if(e.request.method!=="GET" || u.origin!==location.origin) return; // 住所検索などは通常通信
  e.respondWith((async()=>{
    const cache = await caches.open(VERSION);
    try{
      const res = await Promise.race([
        fetch(e.request, {cache:"no-cache"}),
        new Promise((_,ng)=>setTimeout(()=>ng(new Error("timeout")), 3000))
      ]);
      if(res && res.ok) cache.put(e.request, res.clone());
      return res;
    }catch(err){
      return (await cache.match(e.request, {ignoreSearch:true})) || (await cache.match("./index.html"));
    }
  })());
});
