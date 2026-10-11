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
  assert.equal(heredityEngine.slideCount, 9);
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
