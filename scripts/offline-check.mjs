import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

let hasErrors = false;

function pass(msg) {
  console.log(`[PASS] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  hasErrors = true;
}

const requiredFiles = [
  "index.html",
  "Başlat.sh",
  "CanFenci.command",
  "VERSION.json",
  "OFFLINE.md",
  "sw.js",
  "scripts/serve.py",
  "src/app.js",
  "src/styles/app.css",
  "src/ui/control-panel.js",
  "src/ui/solar-system-slides.js",
  "src/ui/space-research-slides.js",
  "data/catalog.json",
  "data/curricula/legacy_2018_lgs.json",
  "data/curricula/maarif_model.json",
  "data/lessons/gunes-sistemi.json",
  "data/lessons/mevsimlerin-olusumu.json",
  "data/lessons/uzay-arastirmalari.json"
];

console.log("=== CanFenci Offline Kendini Doğrulama Kontrolü ===");

// 1. Temel dosyaların varlığı
for (const file of requiredFiles) {
  try {
    await access(resolve(file));
    pass(`Dosya mevcut: ${file}`);
  } catch {
    fail(`Gerekli dosya eksik: ${file}`);
  }
}

// 2. index.html içinde harici http/https bağımlılığı olmamalı
try {
  const indexHtml = await readFile("index.html", "utf8");
  const externalMatches = indexHtml.match(/https?:\/\/[^\s"'>]+/gi) || [];
  const externalResources = externalMatches.filter(
    (url) => !url.includes("w3.org") // ignore xmlns
  );
  if (externalResources.length === 0) {
    pass("index.html sıfır harici ağ bağımlılığı içeriyor (CDN/harici font yok)");
  } else {
    fail(`index.html içinde harici kaynak tespit edildi: ${externalResources.join(", ")}`);
  }
} catch (err) {
  fail(`index.html okunamadı: ${err.message}`);
}

// 3. Ders slayt sayıları ve bütünlüğü kontrolü
try {
  const gunes = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const gunesSlides = gunes.stages.flatMap((s) => s.slides ?? []);
  if (gunesSlides.length === 26) {
    pass(`6. Sınıf Güneş Sistemi slayt sayısı korundu: ${gunesSlides.length} slayt`);
  } else {
    fail(`6. Sınıf Güneş Sistemi slayt sayısı 26 olmalıydı, bulunan: ${gunesSlides.length}`);
  }

  // Güneş sistemi görselleri kontrolü
  let missingMedia = 0;
  for (const slide of gunesSlides) {
    for (const m of slide.media ?? []) {
      const p = m.src.replace(/^\.\//, "");
      try {
        await access(p);
      } catch {
        missingMedia++;
        fail(`Görsel dosyası eksik: ${p} (${slide.id})`);
      }
    }
  }
  if (missingMedia === 0) {
    pass("6. Sınıf Güneş Sistemi slaytlarındaki tüm yerel görseller eksiksiz mevcut");
  }
} catch (err) {
  fail(`gunes-sistemi.json doğrulanamadı: ${err.message}`);
}

try {
  const mevsimler = JSON.parse(await readFile("data/lessons/mevsimlerin-olusumu.json", "utf8"));
  const mevsimlerSlides = mevsimler.stages.flatMap((s) => s.slides ?? []);
  if (mevsimlerSlides.length === 25) {
    pass(`8. Sınıf Mevsimlerin Oluşumu slayt sayısı korundu: ${mevsimlerSlides.length} slayt`);
  } else {
    fail(`8. Sınıf Mevsimlerin Oluşumu slayt sayısı 25 olmalıydı, bulunan: ${mevsimlerSlides.length}`);
  }

  // Mevsimler görselleri kontrolü
  let missingMedia = 0;
  for (const slide of mevsimlerSlides) {
    for (const m of slide.media ?? []) {
      const p = m.src.replace(/^\.\//, "");
      try {
        await access(p);
      } catch {
        missingMedia++;
        fail(`Görsel dosyası eksik: ${p} (${slide.id})`);
      }
    }
  }
  if (missingMedia === 0) {
    pass("8. Sınıf Mevsimlerin Oluşumu slaytlarındaki tüm yerel görseller eksiksiz mevcut");
  }
} catch (err) {
  fail(`mevsimlerin-olusumu.json doğrulanamadı: ${err.message}`);
}

try {
  const uzay = JSON.parse(await readFile("data/lessons/uzay-arastirmalari.json", "utf8"));
  const uzaySlides = uzay.stages.flatMap((s) => s.slides ?? []);
  if (uzaySlides.length === 2) {
    pass(`7. Sınıf Uzay Araştırmaları slayt sayısı korundu: ${uzaySlides.length} slayt`);
  } else {
    fail(`7. Sınıf Uzay Araştırmaları slayt sayısı 2 olmalıydı, bulunan: ${uzaySlides.length}`);
  }

  let missingMedia = 0;
  for (const slide of uzaySlides) {
    for (const m of slide.media ?? []) {
      const p = m.src.replace(/^\.\//, "");
      try {
        await access(p);
      } catch {
        missingMedia++;
        fail(`Görsel dosyası eksik: ${p} (${slide.id})`);
      }
    }
  }
  if (missingMedia === 0) {
    pass("7. Sınıf Uzay Araştırmaları slaytlarındaki tüm yerel görseller eksiksiz mevcut");
  }
} catch (err) {
  fail(`uzay-arastirmalari.json doğrulanamadı: ${err.message}`);
}

// 4. VERSION.json kontrolü
try {
  const versionData = JSON.parse(await readFile("VERSION.json", "utf8"));
  if (versionData.name && versionData.version && versionData.mode === "offline") {
    pass(`VERSION.json geçerli: ${versionData.name} v${versionData.version} (${versionData.mode})`);
  } else {
    fail("VERSION.json beklenen alanları içermiyor");
  }
} catch (err) {
  fail(`VERSION.json doğrulanamadı: ${err.message}`);
}

console.log("=================================================");
if (hasErrors) {
  console.error("SONUÇ: FAIL - Offline kontrolde hatalar bulundu!");
  process.exit(1);
} else {
  console.log("SONUÇ: PASS - Tüm offline kontroller başarıyla geçti.");
  process.exit(0);
}
