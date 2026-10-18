import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LessonEngine } from "../src/engines/lesson-engine.js";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("Müfredat ve Rota Bağlantıları Doğrulaması (6. Sınıf ve 8. Sınıf)", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const cleanPath = String(url).replace(/^\.\//, "").replace(/^file:\/\//, "");
    const content = await readFile(cleanPath, "utf8");
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(content)
    };
  };

  try {
  const catalog = await readJson("data/catalog.json");
  const maarifCurriculum = await readJson("data/curricula/maarif_model.json");
  const legacyCurriculum = await readJson("data/curricula/legacy_2018_lgs.json");

  // 1. Catalog kontrolü
  const grade6 = catalog.grades.find((g) => g.id === "grade_6");
  assert.ok(grade6, "6. Sınıf katalogda bulunamadı");
  assert.equal(grade6.curriculumProfileId, "maarif_model");

  const grade8 = catalog.grades.find((g) => g.id === "grade_8");
  assert.ok(grade8, "8. Sınıf katalogda bulunamadı");
  assert.equal(grade8.curriculumProfileId, "legacy_2018_lgs");

  // 2. 6. Sınıf Güneş Sistemi rotası
  const grade6Unit = maarifCurriculum.units.find((u) => u.id === "solar_system_and_eclipses");
  assert.ok(grade6Unit, "solar_system_and_eclipses ünitesi bulunamadı");

  const grade6Topic = grade6Unit.topics.find((t) => t.id === "solar_system");
  assert.ok(grade6Topic, "solar_system konusu bulunamadı");
  assert.equal(grade6Topic.workModes.presentation.status, "available");
  assert.equal(grade6Topic.workModes.presentation.source, "./data/lessons/gunes-sistemi.json");
  assert.equal(grade6Topic.workModes.activity.status, "planned");
  assert.equal(grade6Topic.workModes.test.status, "planned");

  const grade6EclipseTopic = grade6Unit.topics.find((t) => t.id === "solar_and_lunar_eclipses");
  assert.ok(grade6EclipseTopic, "solar_and_lunar_eclipses konusu bulunamadı");
  assert.equal(grade6EclipseTopic.workModes.presentation.status, "available");
  assert.equal(grade6EclipseTopic.workModes.presentation.source, "./data/lessons/gunes-ve-ay-tutulmalari.json");

  // 2. Ünite Bileşke Kuvvet rotası
  const forceUnitIndex = maarifCurriculum.units.findIndex((u) => u.id === "force_effect_motion");
  assert.equal(forceUnitIndex, 1, "Bileşke Kuvvet ünitesi 6. sınıfta 2. ünite olmalıdır");
  const forceUnit = maarifCurriculum.units[forceUnitIndex];
  assert.equal(forceUnit.gradeId, "grade_6");
  const resultantTopic = forceUnit.topics.find((t) => t.id === "resultant_force");
  assert.ok(resultantTopic, "Bileşke Kuvvet konusu bulunamadı");
  assert.equal(resultantTopic.workModes.presentation.source, "./data/lessons/bileske-kuvvet.json");

  // 3. 8. Sınıf Mevsimlerin Oluşumu rotası
  const grade8Unit = legacyCurriculum.units.find((u) => u.id === "seasons_and_climate");
  assert.ok(grade8Unit, "seasons_and_climate ünitesi bulunamadı");

  const grade8Topic = grade8Unit.topics.find((t) => t.id === "formation_of_seasons");
  assert.ok(grade8Topic, "formation_of_seasons konusu bulunamadı");
  assert.equal(grade8Topic.workModes.presentation.status, "available");
  assert.equal(grade8Topic.workModes.presentation.source, "./data/lessons/mevsimlerin-olusumu.json");

  const dnaUnit = legacyCurriculum.units.find((u) => u.id === "dna_and_genetic_code");
  assert.deepEqual(dnaUnit.topics.map((topic) => topic.label), ["1. DNA ve Genetik Kod", "2. Kalıtım"]);
  const heredityTopic = dnaUnit.topics.find((topic) => topic.id === "heredity_topic");
  assert.equal(heredityTopic.workModes.presentation.source, "./data/lessons/kalitim.json");

  const heredityEngine = new LessonEngine();
  const heredityLesson = await heredityEngine.load("data/lessons/kalitim.json");
  assert.equal(heredityLesson.id, "lesson_kalitim_1");
  assert.equal(heredityEngine.slideCount, 21);
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/01-kapak.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_character_interactive");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/02-karakter.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/03-kalitim-mendel.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/04-temel-kavramlar.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/05-baskin-cekinik-gen.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/06-saf-ve-melez.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/07-fenotip-genotip.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_activity_one_interactive");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/08-etkinlik-1.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_activity_two_interactive");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/09-etkinlik-2.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "dna_cover");
  assert.equal(heredityEngine.currentSlide.media[0].src, "./assets/images/kalitim/10-caprazlama.png");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_crossing_example_one_auto");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Soru-1");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_crossing_example_two");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Soru-2");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_crossing_example_three");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Soru-3");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_crossing_example_four");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Soru-4");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_crossing_example_five");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Soru-5");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "mendel_single_trait_experiment");
  assert.equal(heredityEngine.currentSlide.title, "Mendel’in Tek Karakter Çaprazlama Deneyi");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "mendel_experiment_results");
  assert.equal(heredityEngine.currentSlide.title, "Mendel Deneyinin Sonuçları");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "sex_determination");
  assert.equal(heredityEngine.currentSlide.title, "Cinsiyetin Belirlenmesi");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "consanguineous_marriage");
  assert.equal(heredityEngine.currentSlide.title, "Akraba Evlilikleri ve Sakıncaları");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "pedigree_chart");
  assert.equal(heredityEngine.currentSlide.title, "Soyağacı");
  heredityEngine.next();
  assert.equal(heredityEngine.currentSlide.layout, "heredity_drag_drop_crossing");
  assert.equal(heredityEngine.currentSlide.title, "Örnek Etkileşimli");

  const grade7Unit = maarifCurriculum.units.find((u) => u.id === "space_age");
  assert.ok(grade7Unit, "space_age ünitesi bulunamadı");
  const spaceObjectsTopic = grade7Unit.topics.find((t) => t.id === "space_objects");
  assert.ok(spaceObjectsTopic, "space_objects konusu bulunmalıdır");
  assert.equal(spaceObjectsTopic.workModes.presentation.source, "./data/lessons/uzayda-neler-var.json");

  const grade8ClimateTopic = grade8Unit.topics.find((t) => t.id === "climate_and_air_movements");
  assert.ok(grade8ClimateTopic, "climate_and_air_movements konusu bulunamadı");
  assert.equal(grade8ClimateTopic.workModes.presentation.status, "available");
  assert.equal(grade8ClimateTopic.workModes.presentation.source, "./data/lessons/iklim-ve-hava-hareketleri.json");

  // 4. LessonEngine ile 6. sınıf ders yüklemesi
  const engine6 = new LessonEngine();
  const lesson6 = await engine6.load("data/lessons/gunes-sistemi.json");
  assert.equal(lesson6.id, "lesson_gunes_sistemi_1");
  assert.equal(engine6.slideCount, 26, "6. Sınıf dersi 26 slayt olmalıdır");
  assert.equal(engine6.stages.length, 5, "6. Sınıf dersi 5 aşama olmalıdır");

  const eclipseEngine = new LessonEngine();
  const eclipseLesson = await eclipseEngine.load("data/lessons/gunes-ve-ay-tutulmalari.json");
  assert.equal(eclipseLesson.id, "lesson_gunes_ve_ay_tutulmalari_1");
  assert.equal(eclipseEngine.slideCount, 10, "Güneş ve Ay Tutulmaları dersi 10 slayt olmalıdır");
  assert.equal(eclipseEngine.currentSlide.layout, "eclipse_image_slide");
  eclipseEngine.next();
  assert.equal(eclipseEngine.currentSlide.layout, "eclipse_concept_slide");

  const forceEngine = new LessonEngine();
  const forceLesson = await forceEngine.load("data/lessons/bileske-kuvvet.json");
  assert.equal(forceLesson.id, "lesson_bileske_kuvvet_1");
  assert.equal(forceEngine.slideCount, 10);
  assert.equal(forceEngine.currentSlide.layout, "dna_cover");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/01-kapak.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "force_recall");
  assert.deepEqual(forceEngine.currentSlide.interactions.map((item) => item.answer), ["Kuvvet", "F", "Dinamometre", "Newton"]);
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/02-kuvveti-hatirlayalim.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "force_direction");
  assert.deepEqual(forceEngine.currentSlide.interactions.slice(0, 6).map((item) => item.answer), ["Batı", "Doğu-Batı", "Kuzey", "Kuzey-Güney", "Güney", "Kuzey-Güney"]);
  assert.deepEqual(forceEngine.currentSlide.interactions.slice(-3).map((item) => item.answer), ["5 N", "4 N", "6 N"]);
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/03-yon-dogrultu-buyukluk.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "dna_cover");
  assert.equal(forceEngine.currentSlide.title, "Kuvveti Gösteren Ok");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/04-uygulama-noktasi.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "force_video_fullscreen");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/05-video.mp4");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "resultant_force_activity");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "resultant_force_image_fullscreen");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/06-bileske-kuvvet.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "resultant_force_examples_image");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/09-bileske-kuvvet-ornekleri.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "balanced_forces_image_fullscreen");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/07-dengelenmis-kuvvetler.png");
  forceEngine.next();
  assert.equal(forceEngine.currentSlide.layout, "unbalanced_forces_image_fullscreen");
  assert.equal(forceEngine.currentSlide.media[0].src, "./assets/images/bileske-kuvvet/08-dengelenmemis-kuvvetler.png");

  // 5. LessonEngine ile 8. sınıf ders yüklemesi (regresyon)
  const engine8 = new LessonEngine();
  const lesson8 = await engine8.load("data/lessons/mevsimlerin-olusumu.json");
  assert.equal(lesson8.id, "lesson_mevsimlerin_olusumu_1");
  assert.equal(engine8.slideCount, 25, "8. Sınıf dersi 25 slayt olarak korunmalıdır");
  assert.equal(engine8.stages.length, 7, "8. Sınıf dersi 7 aşama olmalıdır");

  const spaceObjectsEngine = new LessonEngine();
  const spaceObjectsLesson = await spaceObjectsEngine.load("data/lessons/uzayda-neler-var.json");
  assert.equal(spaceObjectsLesson.id, "lesson_uzayda_neler_var_1");
  assert.equal(spaceObjectsEngine.slideCount, 16, "Uzayda Neler Var? dersi 16 slayt olmalıdır");

  // 6. Yeni 8. sınıf İklim ve Hava Hareketleri dersi
  const climateEngine = new LessonEngine();
  const climateLesson = await climateEngine.load("data/lessons/iklim-ve-hava-hareketleri.json");
  assert.equal(climateLesson.id, "lesson_iklim_ve_hava_hareketleri_1");
  assert.equal(climateEngine.slideCount, 24, "İklim ve Hava Hareketleri dersi 24 slayt olmalıdır");
  assert.equal(climateEngine.currentSlide.layout, "climate_cover");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("8. Sınıf Kalıtım Slayt 11 saf sarı ve saf yeşil bezelyelerin otomatik çaprazlamasını gösterir", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_crossing_example_one_auto"');
  const rendererEnd = app.indexOf('slide.layout === "heredity_crossing_example_two"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);
  ["Örnek Soru-1", "Dokununca çözüm başlar", "1. bezelye: saf sarı → SS", "2. bezelye: saf yeşil → ss", "SS <i>×</i> ss", "Saf sarı: SS", "Saf yeşil: ss", "<th>S</th><th>S</th>", "<th>s</th><td><b>Ss</b>", "4 adet Ss", "%100 Ss", "%100 melez döl", "%100 sarı tohumlu", "Bu çaprazlamada oluşan yavruların tamamı sarı tohumlu olur.", "pea-seed-yellow", "pea-seed-green", "pointerdown", "pointerup", "schedule(16400, 6)", "clearTimeout"].forEach((token) => {
    assert.ok(renderer.includes(token), `Slayt 11 renderer'ında ${token} bulunmalı`);
  });
  assert.ok(css.includes(".heredity-crossing-example-one-auto-slide"), "Slayt 11 sarı/yeşil ebeveyn stilleri ile ayrıştırılmalı");
  assert.ok(css.includes("crossing-four-cell-fill"), "Punnett hücreleri yumuşak vurguyla görünmeli");
});

test("8. Sınıf Kalıtım Slayt 12 ilk dokunuştan sonra otomatik çaprazlama çözümü gösterir", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_crossing_example_two"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  ["Melez döl sarı tohumlu", "Saf döl yeşil tohumlu", "Dokununca çözüm başlar", "Çözüm analiz ediliyor", "Karakter belirleniyor: Tohum rengi", "Baskın alel: S", "Çekinik alel: s", "Ss <i>×</i> ss", "<th>S</th><th>s</th>", "<th>s</th><td><b>Ss</b>", "2 adet Ss", "2 adet ss", "%50 Ss, %50 ss", "%50 sarı tohumlu", "%50 yeşil tohumlu", "pea-seed-yellow", "pea-seed-green", "pointerdown", "pointerup", "schedule(7650, 6)", "clearTimeout"].forEach((token) => {
    assert.ok(renderer.includes(token), `Slayt 12 renderer'ında ${token} bulunmalı`);
  });
  assert.ok(css.includes(".heredity-crossing-example-two-slide"), "Slayt 12 scoped CSS ile stillenmeli");
  assert.ok(css.includes("crossing-two-analysis-line"), "Çözüm analizi satır satır görünmeli");
  assert.ok(css.includes("data-solution-phase=\"4\""), "Punnett karesi ayrı bir otomatik aşamada görünmeli");
});

test("8. Sınıf Kalıtım Slayt 13 iki melez bezelyenin yavaş otomatik çaprazlamasını gösterir", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_crossing_example_three"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  ["Örnek Soru-3", "Dokununca çözüm başlar", "Karakter: tohum rengi", "Ss <i>×</i> Ss", "1. ebeveyn: Ss", "2. ebeveyn: Ss", "<th>S</th><th>s</th>", "<th>S</th><td><b>SS</b>", "1 adet SS", "2 adet Ss", "1 adet ss", "1 SS : 2 Ss : 1 ss", "3 adet sarı tohumlu", "1 adet yeşil tohumlu", "3 sarı : 1 yeşil", "Yavruların %75’i sarı, %25’i yeşil olur.", "pea-seed-yellow", "pea-seed-green", "pointerdown", "pointerup", "schedule(12900, 7)", "clearTimeout"].forEach((token) => {
    assert.ok(renderer.includes(token), `Slayt 13 renderer'ında ${token} bulunmalı`);
  });
  assert.ok(css.includes(".heredity-crossing-example-three-slide"), "Slayt 13 scoped CSS ile stillenmeli");
  assert.ok(css.includes("crossing-three-cell-fill"), "Punnett hücreleri yavaşça görünmeli");
  assert.ok(css.includes("data-solution-phase=\"7\""), "Özet kartı son otomatik aşamada görünmeli");
});

test("8. Sınıf Kalıtım Slayt 14 saf ve melez sarı bezelyelerin daha yavaş otomatik çaprazlamasını gösterir", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_crossing_example_four"');
  const rendererEnd = app.indexOf('slide.layout === "heredity_crossing_example_five"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  ["Örnek Soru-4", "Dokununca çözüm başlar", "Saf döl sarı tohumlu → SS", "Melez döl sarı tohumlu → Ss", "SS <i>×</i> Ss", "Saf döl: SS", "Melez döl: Ss", "<th>S</th><th>S</th>", "<th>S</th><td><b>SS</b>", "2 adet SS", "2 adet Ss", "%50 SS, %50 Ss", "%100 sarı tohumlu", "Bu çaprazlamada yeşil tohumlu yavru oluşmaz.", "pea-seed-yellow", "pointerdown", "pointerup", "schedule(16400, 6)", "clearTimeout"].forEach((token) => {
    assert.ok(renderer.includes(token), `Slayt 14 renderer'ında ${token} bulunmalı`);
  });
  assert.ok(!renderer.includes("pea-seed-green"), "Slayt 14 sonuçlarında yeşil tohum görseli olmamalı");
  assert.ok(css.includes(".heredity-crossing-example-four-slide"), "Slayt 14 scoped CSS ile stillenmeli");
  assert.ok(css.includes("crossing-four-cell-fill"), "Punnett hücreleri vurgulu ve yavaşça görünmeli");
});

test("8. Sınıf Kalıtım Slayt 15 iki yeşil bezelyenin otomatik çaprazlamasını gösterir", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_crossing_example_five"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  ["Örnek Soru-5", "Dokununca çözüm başlar", "1. bezelye: yeşil tohumlu → ss", "2. bezelye: yeşil tohumlu → ss", "ss <i>×</i> ss", "1. ebeveyn: ss", "2. ebeveyn: ss", "<th>s</th><th>s</th>", "<th>s</th><td><b>ss</b>", "4 adet ss", "%100 ss", "%100 saf döl çekinik", "%100 yeşil tohumlu", "Bu çaprazlamada yavruların tamamı yeşil tohumlu olur.", "pea-seed-green", "pointerdown", "pointerup", "schedule(16400, 6)", "clearTimeout"].forEach((token) => {
    assert.ok(renderer.includes(token), `Slayt 15 renderer'ında ${token} bulunmalı`);
  });
  assert.ok(!renderer.includes("pea-seed-yellow"), "Slayt 15'te sarı tohum görseli olmamalı");
  assert.ok(css.includes(".heredity-crossing-example-five-slide"), "Slayt 15 scoped CSS ile stillenmeli");
  assert.ok(css.includes("crossing-five-cell-fill"), "Punnett hücreleri vurgulu ve yavaşça görünmeli");
});

test("8. Sınıf Kalıtım Slayt 16-17 Mendel’in tek karakter deneyini kısa ve görsel anlatır", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const slide16Start = app.indexOf('slide.layout === "mendel_single_trait_experiment"');
  const slide17Start = app.indexOf('slide.layout === "mendel_experiment_results"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', slide17Start);
  const slide16 = app.slice(slide16Start, slide17Start);
  const slide17 = app.slice(slide17Start, rendererEnd);

  ["P KUŞAĞI", "Saf mor", "Saf beyaz", "MM × mm", "1. KUŞAK", "%100 Mm", "%100 melez", "%100 mor çiçekli", "Mm × Mm", "2. KUŞAK", "1 MM : 2 Mm : 1 mm", "3 mor : 1 beyaz", "%75 mor · %25 beyaz"].forEach((token) => {
    assert.ok(slide16.includes(token), `Slayt 16'da ${token} bulunmalı`);
  });
  ["Kalıtsal özellikleri belirleyen aleller", "1. kuşaktaki yavrular melez olur ve baskın özellik görülür.", "Çekinik özellik", "Mor çiçek aleli, beyaz çiçek aleline baskındır.", "%100 mor", "3 mor : 1 beyaz"].forEach((token) => {
    assert.ok(slide17.includes(token), `Slayt 17'de ${token} bulunmalı`);
  });
  assert.ok(css.includes(".mendel-single-trait-slide"), "Slayt 16 scoped CSS ile stillenmeli");
  assert.ok(css.includes(".mendel-results-slide"), "Slayt 17 scoped CSS ile stillenmeli");
  assert.ok(css.includes(".mendel-flower"), "Mendel slaytlarında native çiçek görselleri bulunmalı");
  assert.ok(slide16.includes("mendel-diagram-connector"), "Slayt 16 ebeveynleri ve kuşakları çizgi/ok şemasıyla bağlamalı");
  assert.ok(slide16.includes("mendel-diagram-selected-pair"), "Slayt 16 ikinci çaprazlama için Mm × Mm çiftini göstermeli");
  assert.ok(css.includes(".mendel-single-trait-slide .mendel-diagram"), "Slayt 16 dikey kuşak şeması için scoped CSS kullanmalı");
});

test("8. Sınıf Kalıtım Slayt 18-20 cinsiyet, çekinik risk ve soyağacını doğru açıklar", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const slide18Start = app.indexOf('slide.layout === "sex_determination"');
  const slide19Start = app.indexOf('slide.layout === "consanguineous_marriage"');
  const slide20Start = app.indexOf('slide.layout === "pedigree_chart"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', slide20Start);
  const slide18 = app.slice(slide18Start, slide19Start);
  const slide19 = app.slice(slide19Start, slide20Start);
  const slide20 = app.slice(slide20Start, rendererEnd);

  ["XX <i>×</i> XY", "Anne gametleri", "Baba gametleri", "%50 XX", "%50 XY", "Bebeğin cinsiyetini belirleyen kromozom babadan gelir."].forEach((token) => assert.ok(slide18.includes(token), `Slayt 18'de ${token} bulunmalı`));
  ["Aa</b><i>×</i><b>Aa", "%25 AA", "%50 Aa", "%25 aa", "Akraba evliliği doğrudan hastalık oluşturmaz", "çekinik hastalığın görülme olasılığı artabilir"].forEach((token) => assert.ok(slide19.includes(token), `Slayt 19'da ${token} bulunmalı`));
  ["Kare → Erkek", "Daire → Kadın", "Boyalı → Özelliği gösteren birey", "Yatay çizgi → Eşler", "Aşağı bağlantı → Çocuklar"].forEach((token) => assert.ok(slide20.includes(token), `Slayt 20'de ${token} bulunmalı`));
  [".sex-determination-slide", ".consanguineous-marriage-slide", ".pedigree-chart-slide"].forEach((token) => assert.ok(css.includes(token), `${token} scoped CSS ile stillenmeli`));
});

test("8. Sınıf Kalıtım Slayt 21 Uu × uu sürükle-bırak çaprazlamasını doğrular", async () => {
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const rendererStart = app.indexOf('slide.layout === "heredity_drag_drop_crossing"');
  const rendererEnd = app.indexOf('slide.layout === "resultant_force_examples_image"', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  [
    "Melez uzun gövdeli bir bezelye ile kısa gövdeli bezelyeyi çaprazlayalım.",
    'data-slot="parent-long" data-answer="Uu"',
    'data-slot="parent-short" data-answer="uu"',
    'data-slot="gamete-1a" data-answer="U"',
    'data-slot="gamete-1b" data-answer="u"',
    'data-slot="gamete-2a" data-answer="u"',
    'data-slot="gamete-2b" data-answer="u"',
    'data-slot="punnett-1" data-answer="Uu"',
    'data-slot="punnett-2" data-answer="uu"',
    'data-slot="punnett-3" data-answer="Uu"',
    'data-slot="punnett-4" data-answer="uu"',
    'data-slot="genotype-1" data-answer="2 Uu"',
    'data-slot="genotype-2" data-answer="2 uu"',
    'data-slot="phenotype-1" data-answer="2 Uzun"',
    'data-slot="phenotype-2" data-answer="2 Kısa"',
    "Sadeleştirilmiş oran: <b>1 Uu : 1 uu</b>", "%50 Uu · %50 uu", "Sadeleştirilmiş oran: <b>1 Uzun : 1 Kısa</b>", "%50 Uzun · %50 Kısa", "data-answer=\"2 Uu\"", "data-answer=\"2 uu\"", "data-answer=\"2 Uzun\"", "data-answer=\"2 Kısa\"", "answers = new Map()", "pointerdown", "pointermove", "pointerup", "pointercancel", "getBoundingClientRect", "is-verified", "Tebrikler! Çaprazlamayı doğru tamamladın.", "Bazı alanları tekrar gözden geçir.", "Kontrol Et", "Sıfırla", "İpucu", "activeInteractions.push"
  ].forEach((token) => assert.ok(renderer.includes(token), `Slayt 21 renderer'ında ${token} bulunmalı`));
  [".heredity-drag-drop-crossing-slide", ".heredity-dnd-slot", ".heredity-dnd-simplified", ".heredity-dnd-drag-clone"].forEach((token) => assert.ok(css.includes(token), `${token} scoped CSS ile stillenmeli`));
});
