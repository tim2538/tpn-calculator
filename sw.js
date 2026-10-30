// network-first: เครื่องที่มีเน็ตได้ไฟล์ล่าสุดเสมอ การแก้สูตรจึงไม่ต้อง bump CACHE
// เพิ่ม ลบ หรือย้ายไฟล์เมื่อไร ต้องแก้ PRECACHE และ bump CACHE
const CACHE = "tpn-v1";
const INDEX = "index.html";
const NETWORK_TIMEOUT = 4000;
const PRECACHE = [
  INDEX,
  "manifest.json",
  "css/styles.css",
  "js/calc.js",
  "js/ui.js",
  "js/export.js",
  "js/manual.js",
  "js/vendor/lucide-1.65.0.min.js",
  "js/vendor/qrcode-1.5.1.min.js",
  "js/vendor/jsQR-1.4.0.js",
  "fonts/sarabun-thai-300-normal.woff2",
  "fonts/sarabun-thai-400-normal.woff2",
  "fonts/sarabun-thai-500-normal.woff2",
  "fonts/sarabun-thai-600-normal.woff2",
  "fonts/sarabun-thai-700-normal.woff2",
  "fonts/sarabun-latin-300-normal.woff2",
  "fonts/sarabun-latin-400-normal.woff2",
  "fonts/sarabun-latin-500-normal.woff2",
  "fonts/sarabun-latin-600-normal.woff2",
  "fonts/sarabun-latin-700-normal.woff2",
  "icons/icon.svg",
  "icons/apple-touch-icon-light.png",
  "icons/apple-touch-icon-dark.png",
  "icons/icon-light-192.png",
  "icons/icon-light-512.png",
  "icons/icon-dark-192.png",
  "icons/icon-dark-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // ทุก navigation เก็บ/อ่านที่ key เดียว ไม่งั้น "/" กับ "/index.html" จะได้สำเนาคนละชุด
  const key = req.mode === "navigate" ? INDEX : req;
  const network = fetchAndCache(req.url, key);
  e.waitUntil(network.catch(() => {}));
  e.respondWith(withFallback(network, key).then(revalidateOnReload));
});

// max-age ของ GitHub Pages ทำให้ reload แท็บเดิมใช้ไฟล์จาก memory cache โดยไม่ผ่าน fetch ด้านบน
function revalidateOnReload(res) {
  const headers = new Headers(res.headers);
  headers.set("cache-control", "no-cache");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function fetchAndCache(url, key) {
  // no-cache: revalidate ข้าม HTTP cache 10 นาทีของ GitHub Pages
  const res = await fetch(url, { cache: "no-cache" });
  // 404/5xx ต้องไม่ทับสำเนาที่ใช้งานได้
  if (!res.ok) throw new Error("HTTP " + res.status);
  const cache = await caches.open(CACHE);
  await cache.put(key, res.clone());
  return res;
}

async function withFallback(network, key) {
  const cached = await caches.match(key, { ignoreSearch: true });
  if (!cached) return network;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT));
  return Promise.race([network.then((res) => res.clone()), timeout]).catch(() => cached);
}
