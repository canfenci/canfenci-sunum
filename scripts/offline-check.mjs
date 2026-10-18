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
  "src/ui/climate-slides.js",
  "src/ui/solar-system-slides.js",
  "src/ui/space-research-slides.js",
  "data/catalog.json",
  "data/curricula/legacy_2018_lgs.json",
  "data/curricula/maarif_model.json",
  "data/lessons/gunes-sistemi.json",
  "data/lessons/gunes-ve-ay-tutulmalari.json",
  "data/lessons/bileske-kuvvet.json",
  "data/lessons/iklim-ve-hava-hareketleri.json",
  "data/lessons/mevsimlerin-olusumu.json",
  "data/lessons/uzay-arastirmalari.json",
  "data/lessons/uzayda-neler-var.json",
  "data/lessons/dna-ve-genetik-kod.json",
  "data/lessons/kalitim.json"
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
    const allImages = [
      ...(slide.media ?? []).map((m) => m.src),
      ...(slide.definitions ?? []).map((definition) => definition.image)
    ].filter(Boolean);
    for (const src of allImages) {
      const p = src.replace(/^\.\//, "");
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
  const eclipse = JSON.parse(await readFile("data/lessons/gunes-ve-ay-tutulmalari.json", "utf8"));
  const eclipseSlides = eclipse.stages.flatMap((s) => s.slides ?? []);
    if (eclipseSlides.length === 10) {
    pass(`6. Sınıf Güneş ve Ay Tutulmaları slayt sayısı doğru: ${eclipseSlides.length} slayt`);
  } else {
      fail(`6. Sınıf Güneş ve Ay Tutulmaları slayt sayısı 10 olmalıydı, bulunan: ${eclipseSlides.length}`);
  }

  let missingMedia = 0;
  for (const slide of eclipseSlides) {
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
    pass("6. Sınıf Güneş ve Ay Tutulmaları slaytlarındaki tüm yerel görseller eksiksiz mevcut");
  }
} catch (err) {
  fail(`gunes-ve-ay-tutulmalari.json doğrulanamadı: ${err.message}`);
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
  const iklim = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const iklimSlides = iklim.stages.flatMap((s) => s.slides ?? []);
  if (iklimSlides.length === 24) {
    pass(`8. Sınıf İklim ve Hava Hareketleri slayt sayısı doğru: ${iklimSlides.length} slayt`);
  } else {
    fail(`8. Sınıf İklim ve Hava Hareketleri slayt sayısı 24 olmalıydı, bulunan: ${iklimSlides.length}`);
  }

  let missingMedia = 0;
  for (const slide of iklimSlides) {
    const allImages = [
      ...(slide.media ?? []).map((m) => m.src),
      ...(slide.weatherEvents ?? []).map((event) => event.image),
      ...(slide.tools ?? []).map((tool) => tool.image),
      ...(slide.areas ?? []).map((area) => area.image)
    ].filter(Boolean);
    for (const src of allImages) {
      const p = src.replace(/^\.\//, "");
      try {
        await access(p);
      } catch {
        missingMedia++;
        fail(`Görsel dosyası eksik: ${p} (${slide.id})`);
      }
    }
  }
  if (missingMedia === 0) {
    pass("8. Sınıf İklim ve Hava Hareketleri slaytlarındaki tüm yerel görseller eksiksiz mevcut");
  }
} catch (err) {
  fail(`iklim-ve-hava-hareketleri.json doğrulanamadı: ${err.message}`);
}

try {
  const uzay = JSON.parse(await readFile("data/lessons/uzay-arastirmalari.json", "utf8"));
  const uzaySlides = uzay.stages.flatMap((s) => s.slides ?? []);
  if (uzaySlides.length === 17) {
    pass(`7. Sınıf Uzay Araştırmaları slayt sayısı korundu: ${uzaySlides.length} slayt`);
  } else {
    fail(`7. Sınıf Uzay Araştırmaları slayt sayısı 17 olmalıydı, bulunan: ${uzaySlides.length}`);
  }

  let missingMedia = 0;
  for (const slide of uzaySlides) {
    const allImages = [
      ...(slide.media ?? []).map((m) => m.src),
      ...(slide.types ?? []).map((t) => t.image),
      ...(slide.tools ?? []).map((t) => t.image),
      ...(slide.areas ?? []).map((a) => a.image),
      ...(slide.institutions ?? []).map((i) => i.logo),
      ...(slide.peopleSection?.people ?? []).map((p) => p.image),
      slide.leftCard?.image,
      slide.rightCard?.image,
      slide.observatoryImage,
      slide.highlightImage,
      slide.image,
      slide.columns?.consequences?.image,
      slide.columns?.solutions?.image,
      slide.comparison?.left?.image,
      slide.comparison?.right?.image,
      ...(slide.comparisonQuestion?.options ?? []).map((o) => o.image)
    ].filter(Boolean);

    for (const src of allImages) {
      const p = src.replace(/^\.\//, "");
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

try {
  const spaceObjects = JSON.parse(await readFile("data/lessons/uzayda-neler-var.json", "utf8"));
  const slides = spaceObjects.stages.flatMap((s) => s.slides ?? []);
  if (slides.length === 16) pass("7. Sınıf Uzayda Neler Var? slayt sayısı doğru: 16 slayt");
  else fail(`7. Sınıf Uzayda Neler Var? slayt sayısı 16 olmalıydı, bulunan: ${slides.length}`);
} catch (err) {
  fail(`uzayda-neler-var.json doğrulanamadı: ${err.message}`);
}

try {
  const bileske = JSON.parse(await readFile("data/lessons/bileske-kuvvet.json", "utf8"));
  const bileskeSlides = bileske.stages.flatMap((s) => s.slides ?? []);
  const bileskeMedia = bileskeSlides.flatMap((slide) => (slide.media ?? []).map((media) => media.src));
  const expectedBileskeLayouts = ["dna_cover", "force_recall", "force_direction", "dna_cover", "force_video_fullscreen", "resultant_force_activity", "resultant_force_image_fullscreen", "resultant_force_examples_image", "balanced_forces_image_fullscreen", "unbalanced_forces_image_fullscreen"];
  const expectedBileskeMedia = [
    "./assets/images/bileske-kuvvet/01-kapak.png",
    "./assets/images/bileske-kuvvet/02-kuvveti-hatirlayalim.png",
    "./assets/images/bileske-kuvvet/03-yon-dogrultu-buyukluk.png",
    "./assets/images/bileske-kuvvet/04-uygulama-noktasi.png",
    "./assets/images/bileske-kuvvet/05-video.mp4",
    "./assets/images/bileske-kuvvet/06-bileske-kuvvet.png",
    "./assets/images/bileske-kuvvet/09-bileske-kuvvet-ornekleri.png",
    "./assets/images/bileske-kuvvet/07-dengelenmis-kuvvetler.png",
    "./assets/images/bileske-kuvvet/08-dengelenmemis-kuvvetler.png"
  ];
  if (bileskeSlides.length === expectedBileskeLayouts.length && bileskeSlides.every((slide, index) => slide.layout === expectedBileskeLayouts[index]) && bileskeMedia.every((src, index) => src === expectedBileskeMedia[index])) {
    pass("6. Sınıf Bileşke Kuvvet Slayt 1-6 rotası/görselleri doğru");
  } else {
    fail("6. Sınıf Bileşke Kuvvet kapak rotası beklenen yapıda değil");
  }
  for (const src of bileskeMedia) {
    try {
      await access(src.replace(/^\.\//, ""));
    } catch {
      fail(`Bileşke Kuvvet görseli eksik: ${src}`);
    }
  }
} catch (err) {
  fail(`bileske-kuvvet.json doğrulanamadı: ${err.message}`);
}

try {
  const dna = JSON.parse(await readFile("data/lessons/dna-ve-genetik-kod.json", "utf8"));
  const slides = dna.stages.flatMap((s) => s.slides ?? []);
  if (slides.length === 22 && slides[12].id === "dna_slide_13_nucleotide_counts" && slides[13].id === "dna_slide_14_activity_one" && slides[14].id === "dna_slide_15_activity_two" && slides[15].id === "dna_slide_16_important_notes" && slides[16].id === "dna_slide_17_replication" && slides[17].id === "dna_slide_18_replication_steps" && slides[18].id === "dna_slide_19_replication_two" && slides[19].id === "dna_slide_20_errors" && slides[20].id === "dna_slide_21_notes" && slides[21].id === "dna_slide_22_question_notes") pass("8. Sınıf DNA ve Genetik Kod: 22 slayt mevcut");
  else fail(`DNA ve Genetik Kod dersinde 22 slayt olmalıydı, bulunan: ${slides.length}`);
} catch (err) {
  fail(`dna-ve-genetik-kod.json doğrulanamadı: ${err.message}`);
}

try {
  const kalitim = JSON.parse(await readFile("data/lessons/kalitim.json", "utf8"));
  const slides = kalitim.stages.flatMap((s) => s.slides ?? []);
  if (kalitim.gradeId === "grade_8" && kalitim.unitId === "dna_and_genetic_code" && kalitim.topicId === "heredity_topic" && slides.length === 21 && slides[0].layout === "dna_cover" && slides[0].media?.[0]?.src === "./assets/images/kalitim/01-kapak.png" && slides[1].layout === "heredity_character_interactive" && slides[1].media?.[0]?.src === "./assets/images/kalitim/02-karakter.png" && slides[2].layout === "dna_cover" && slides[2].media?.[0]?.src === "./assets/images/kalitim/03-kalitim-mendel.png" && slides[3].layout === "dna_cover" && slides[3].media?.[0]?.src === "./assets/images/kalitim/04-temel-kavramlar.png" && slides[4].layout === "dna_cover" && slides[4].media?.[0]?.src === "./assets/images/kalitim/05-baskin-cekinik-gen.png" && slides[5].layout === "dna_cover" && slides[5].media?.[0]?.src === "./assets/images/kalitim/06-saf-ve-melez.png" && slides[6].layout === "dna_cover" && slides[6].media?.[0]?.src === "./assets/images/kalitim/07-fenotip-genotip.png" && slides[7].layout === "heredity_activity_one_interactive" && slides[7].media?.[0]?.src === "./assets/images/kalitim/08-etkinlik-1.png" && slides[8].layout === "heredity_activity_two_interactive" && slides[8].media?.[0]?.src === "./assets/images/kalitim/09-etkinlik-2.png" && slides[9].layout === "dna_cover" && slides[9].media?.[0]?.src === "./assets/images/kalitim/10-caprazlama.png" && slides[10].layout === "heredity_crossing_example_one_auto" && slides[11].layout === "heredity_crossing_example_two" && slides[12].layout === "heredity_crossing_example_three" && slides[13].layout === "heredity_crossing_example_four" && slides[14].layout === "heredity_crossing_example_five" && slides[15].layout === "mendel_single_trait_experiment" && slides[16].layout === "mendel_experiment_results" && slides[17].layout === "sex_determination" && slides[18].layout === "consanguineous_marriage" && slides[19].layout === "pedigree_chart" && slides[20].layout === "heredity_drag_drop_crossing") {
    pass("8. Sınıf Kalıtım rotası ve 21 slaytlık akış doğru");
  } else {
    fail("8. Sınıf Kalıtım lesson yapısı beklenen durumda değil");
  }
  for (const media of slides.flatMap((slide) => slide.media ?? [])) {
    try { await access(media.src.replace(/^\.\//, "")); }
    catch { fail(`Kalıtım görseli eksik: ${media.src}`); }
  }
} catch (err) {
  fail(`kalitim.json doğrulanamadı: ${err.message}`);
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
