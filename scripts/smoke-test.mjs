import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost:8196");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = join(process.cwd(), pathname);
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(8196);

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9226",
  "--disable-gpu",
  "--no-sandbox",
  "--window-size=1920,1080",
  "http://localhost:8196/index.html"
]);

await new Promise((r) => setTimeout(r, 1200));

const tabs = await (await fetch("http://localhost:9226/json")).json();
const pageTab = tabs.find(t => t.type === "page" && t.url.includes("8196")) || tabs.find(t => t.type === "page") || tabs[0];
console.log("Connected to page URL:", pageTab.url);
const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

await new Promise((resolve) => ws.onopen = resolve);

let msgId = 1;
const pending = new Map();
const consoleErrors = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrors.push(msg.params.exceptionDetails.text);
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
};

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = msgId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await send("Runtime.enable");
await send("Page.enable");

const evaluate = async (expression) => {
  const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    throw new Error("Evaluation error: " + res.exceptionDetails.text);
  }
  return res.result?.value;
};

try {
  console.log("1. App sayfasının yüklenmesi...");
  await new Promise((r) => setTimeout(r, 800));

  const title = await evaluate("document.title");
  console.log("   Title:", title);

  console.log("2. Doğrudan Rota Testi: Maarif Model 6. Sınıf Güneş Sistemi Sunumu...");
  await evaluate("location.hash = '#/presentation?curriculumProfileId=maarif_model&gradeId=grade_6&unitId=solar_system_and_eclipses&topicId=solar_system'");
  await new Promise((r) => setTimeout(r, 1000));

  const isPlaceholder1 = await evaluate("Boolean(document.querySelector('.work-mode-placeholder'))");
  const topicLabel1 = await evaluate("document.getElementById('stage-topic-label')?.textContent");
  const slideStatus1 = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  console.log("   Doğrudan rota sonucu - Placeholder var mı:", isPlaceholder1, "Konu:", topicLabel1, "Durum:", slideStatus1);
  if (isPlaceholder1) throw new Error("Beklenen 6. sınıf Güneş Sistemi sunumu yerine placeholder ekranı açıldı!");
  if (!slideStatus1?.includes("/ 26")) throw new Error("Slayt sayısı 26 olarak görünmüyor: " + slideStatus1);

  console.log("3. Yol Bazlı Rota Testi (#/maarif_model/grade_6/solar_system_and_eclipses/solar_system/presentation)...");
  await evaluate("location.hash = '#/maarif_model/grade_6/solar_system_and_eclipses/solar_system/presentation'");
  await new Promise((r) => setTimeout(r, 800));
  const slideStatusPath = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  console.log("   Yol bazlı rota slayt durumu:", slideStatusPath);
  if (!slideStatusPath?.includes("/ 26")) throw new Error("Yol bazlı rotada 26 slayt yüklenemedi!");

  console.log("4. Hazırlık Modu Placeholder Testi (#/activity)...");
  await evaluate("location.hash = '#/activity'");
  await new Promise((r) => setTimeout(r, 800));
  const isPlaceholderActivity = await evaluate("Boolean(document.querySelector('.work-mode-placeholder'))");
  const placeholderText = await evaluate("document.querySelector('.work-mode-placeholder-card h1')?.textContent");
  console.log("   Etkinlik modunda placeholder var mı:", isPlaceholderActivity, "Metin:", placeholderText);
  if (!isPlaceholderActivity) throw new Error("Etkinlik modunda placeholder ekranı görüntülenmedi!");

  console.log("5. Sunum moduna dönüş...");
  await evaluate("location.hash = '#/presentation'");
  await new Promise((r) => setTimeout(r, 800));

  console.log("6. 26 slayt boyunca ileri geri geçiş testi...");
  const slideTitles = [];
  for (let s = 1; s <= 26; s++) {
    const titleText = await evaluate("document.querySelector('.solar-slide-title, .solar-hero-title, .board-slide-title')?.textContent?.trim()");
    const currentStatus = await evaluate("document.getElementById('stage-slide-status')?.textContent");
    slideTitles.push({ slide: s, status: currentStatus, title: titleText });

    if (s === 3) {
      // Test interactions on slide 3 (Ön Bilgiler)
      console.log("   Slide 3 etkileşim testi: butonlara tıklama...");
      const blanksCount = await evaluate("document.querySelectorAll('.reveal-fill-blank').length");
      console.log("     Bulunan boşluk buton sayısı:", blanksCount);
      const revealResult = await evaluate(`(() => {
        const btns = document.querySelectorAll('.reveal-fill-blank');
        btns.forEach(b => b.click());
        return Array.from(btns).every(b => b.classList.contains("is-revealed"));
      })()`);
      console.log("     Tüm boşluklar açıldı mı:", revealResult);
      if (!revealResult) throw new Error("Boşluk butonları tıklanınca is-revealed sınıfı alamadı!");
    }

    if (s < 26) {
      await evaluate(`document.getElementById("next-slide")?.click()`);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log("   26 Slaytın başlıkları:");
  for (const item of slideTitles) {
    console.log(`     [${item.status}] ${item.title}`);
  }

  console.log("5. Taşma (Zero-scroll) kontrolü...");
  const overflowCheck = await evaluate(`(() => {
    const content = document.getElementById("slide-content");
    const workspace = document.getElementById("slide-workspace");
    return {
      windowHeight: window.innerHeight,
      bodyScrollHeight: document.body.scrollHeight,
      hasBodyScroll: document.body.scrollHeight > window.innerHeight
    };
  })()`);
  console.log("   Body scroll height:", overflowCheck.bodyScrollHeight, "Window height:", overflowCheck.windowHeight, "Has body scroll:", overflowCheck.hasBodyScroll);

  console.log("6. 8. Sınıf Regresyon Testi (Kontrol paneline dön ve 8. Sınıf aç)...");
  await evaluate("location.hash = '#/'");
  await new Promise((r) => setTimeout(r, 500));
  await evaluate(`(async () => {
    const gradeSelect = document.querySelector('select[name="gradeId"]');
    gradeSelect.value = "grade_8";
    gradeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 500));
  await evaluate("location.hash = '#/presentation'");
  await new Promise((r) => setTimeout(r, 800));

  const grade8Topic = await evaluate("document.getElementById('stage-topic-label')?.textContent");
  const grade8Status = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  console.log("   8. Sınıf konu:", grade8Topic, "Durum:", grade8Status);

  if (!grade8Status?.includes("/ 25")) {
    throw new Error("8. Sınıf 25 slayt olarak yüklenemedi: " + grade8Status);
  }

  console.log("7. Konsol Hata Kontrolü...");
  if (consoleErrors.length > 0) {
    console.error("   Konsol Hataları Bulundu:", consoleErrors);
    throw new Error("Konsol hataları tespit edildi!");
  } else {
    console.log("   Konsol hatası: 0 (Sıfır hata ile geçti)");
  }

  console.log("\n>>> BROWSER SMOKE TESTİ BAŞARIYLA TAMAMLANDI! <<<");
} finally {
  ws.close();
  chrome.kill();
  server.close();
}
