import { spawn } from "node:child_process";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9227",
  "--disable-gpu",
  "--no-sandbox",
  "--window-size=1920,1080",
  "https://sunum.canfenci.com"
]);

await new Promise((r) => setTimeout(r, 1500));

const tabs = await (await fetch("http://localhost:9227/json")).json();
const pageTab = tabs.find(t => t.type === "page" && t.url.includes("sunum.canfenci.com")) || tabs.find(t => t.type === "page") || tabs[0];
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
  console.log("1. Production Ana Sayfa Yükleme...");
  await new Promise((r) => setTimeout(r, 1500));
  const title = await evaluate("document.title");
  console.log("   Title:", title);

  console.log("2. 6. Sınıf Güneş Sistemi Sunum Rotasına Giriş...");
  await evaluate("location.hash = '#/presentation?curriculumProfileId=maarif_model&gradeId=grade_6&unitId=solar_system_and_eclipses&topicId=solar_system'");
  await new Promise((r) => setTimeout(r, 1500));

  const isPlaceholder = await evaluate("Boolean(document.querySelector('.work-mode-placeholder'))");
  const topicLabel = await evaluate("document.getElementById('stage-topic-label')?.textContent");
  const slideStatus = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  const slide1Title = await evaluate("document.querySelector('.solar-slide-title, .solar-hero-title, .board-slide-title')?.textContent?.trim()");

  console.log("   Placeholder var mı:", isPlaceholder);
  console.log("   Konu Etiketi:", topicLabel);
  console.log("   Slayt Durumu:", slideStatus);
  console.log("   İlk Slayt Başlığı:", slide1Title);

  if (isPlaceholder) {
    throw new Error("BAŞARISIZ: Production üzerinde hâlâ placeholder ekranı görünüyor!");
  }
  if (!slideStatus?.includes("/ 26")) {
    throw new Error("BAŞARISIZ: 26 slayt yerine: " + slideStatus);
  }
  if (slide1Title !== "Güneş Sistemi ve Gezegenler") {
    throw new Error("BAŞARISIZ: İlk slayt başlığı beklenenden farklı: " + slide1Title);
  }

  console.log("2b. Kontrol Paneli UI Üzerinden 6. Sınıf Seçimi ve Başlatma...");
  await evaluate("location.hash = '#/'");
  await new Promise((r) => setTimeout(r, 800));
  await evaluate(`(async () => {
    const gradeSelect = document.querySelector('select[name="gradeId"]');
    gradeSelect.value = "grade_6";
    gradeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 500));
  await evaluate("document.querySelector('button.start-lesson')?.click()");
  await new Promise((r) => setTimeout(r, 1000));
  const uiSlideStatus = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  const uiIsPlaceholder = await evaluate("Boolean(document.querySelector('.work-mode-placeholder'))");
  console.log("   UI ile başlatma sonucu - Placeholder:", uiIsPlaceholder, "Durum:", uiSlideStatus);
  if (uiIsPlaceholder || !uiSlideStatus?.includes("/ 26")) {
    throw new Error("Kontrol panelinden başlatıldığında 26 slaytlık sunum açılamadı!");
  }

  console.log("3. İleri-Geri Slayt Gezinme ve Etkileşim Kontrolü (Slayt 2 ve 3)...");
  await evaluate("document.getElementById('next-slide')?.click()");
  await new Promise((r) => setTimeout(r, 300));
  const slide2Status = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  console.log("   Slayt 2 Durumu:", slide2Status);

  await evaluate("document.getElementById('next-slide')?.click()");
  await new Promise((r) => setTimeout(r, 300));
  const slide3Status = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  const slide3Blanks = await evaluate("document.querySelectorAll('.reveal-fill-blank').length");
  console.log("   Slayt 3 Durumu:", slide3Status, "Boşluk Buton Sayısı:", slide3Blanks);
  if (slide3Blanks !== 5) {
    throw new Error("Slayt 3'te beklenen 5 boşluk butonu bulunamadı!");
  }

  console.log("4. 8. Sınıf Regresyon Testi (Mevsimlerin Oluşumu)...");
  await evaluate("location.hash = '#/presentation?curriculumProfileId=legacy_2018_lgs&gradeId=grade_8&unitId=seasons_and_climate&topicId=formation_of_seasons'");
  await new Promise((r) => setTimeout(r, 1500));

  const grade8Topic = await evaluate("document.getElementById('stage-topic-label')?.textContent");
  const grade8Status = await evaluate("document.getElementById('stage-slide-status')?.textContent");
  console.log("   8. Sınıf Konu:", grade8Topic, "Durum:", grade8Status);

  if (!grade8Status?.includes("/ 25")) {
    throw new Error("8. Sınıf 25 slayt olarak açılamadı: " + grade8Status);
  }

  console.log("5. Konsol Hata Kontrolü...");
  if (consoleErrors.length > 0) {
    console.error("   Konsol Hataları:", consoleErrors);
    throw new Error("Production üzerinde konsol hatası tespit edildi!");
  }
  console.log("   Konsol hatası: 0");

  console.log("\n>>> PRODUCTION E2E DOĞRULAMASI TAMAMEN BAŞARILI! <<<");
} finally {
  ws.close();
  chrome.kill();
}
