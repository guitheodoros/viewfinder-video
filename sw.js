// Viewfinder Video: guarda a página, as fontes e o motor/modelos da IA pra
// o app abrir sem internet depois do primeiro uso. Trocar VERSION limpa o
// cache antigo.
const VERSION = 'vfv-4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './media/demo.mp4', './media/demo-poster.jpg'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k !== VERSION).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // a página: rede primeiro (pega a versão nova), cache só sem internet
  if(req.mode === 'navigate'){
    // no-cache: sempre confere com o servidor (o GitHub Pages deixa o
    // navegador guardar a página por 10 min e o app abriria a versão velha)
    e.respondWith(fetch(req, { cache:'no-cache' }).then(res=>{
      const copy = res.clone();
      caches.open(VERSION).then(c=>c.put('./index.html', copy));
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  // arquivos do app, fontes e IA (endereços com versão fixa): cache primeiro
  const ok = url.origin === location.origin || /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|storage\.googleapis\.com)$/.test(url.hostname);
  if(!ok) return;
  e.respondWith(caches.match(req).then(hit=>hit || fetch(req).then(res=>{
    if(res.ok){ const copy = res.clone(); caches.open(VERSION).then(c=>c.put(req, copy)); }
    return res;
  })));
});
