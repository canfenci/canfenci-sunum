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

  // 3. 8. Sınıf Mevsimlerin Oluşumu rotası
  const grade8Unit = legacyCurriculum.units.find((u) => u.id === "seasons_and_climate");
  assert.ok(grade8Unit, "seasons_and_climate ünitesi bulunamadı");

  const grade8Topic = grade8Unit.topics.find((t) => t.id === "formation_of_seasons");
  assert.ok(grade8Topic, "formation_of_seasons konusu bulunamadı");
  assert.equal(grade8Topic.workModes.presentation.status, "available");
  assert.equal(grade8Topic.workModes.presentation.source, "./data/lessons/mevsimlerin-olusumu.json");

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

  // 5. LessonEngine ile 8. sınıf ders yüklemesi (regresyon)
  const engine8 = new LessonEngine();
  const lesson8 = await engine8.load("data/lessons/mevsimlerin-olusumu.json");
  assert.equal(lesson8.id, "lesson_mevsimlerin_olusumu_1");
  assert.equal(engine8.slideCount, 25, "8. Sınıf dersi 25 slayt olarak korunmalıdır");
  assert.equal(engine8.stages.length, 7, "8. Sınıf dersi 7 aşama olmalıdır");

  // 6. Yeni 8. sınıf İklim ve Hava Hareketleri dersi
  const climateEngine = new LessonEngine();
  const climateLesson = await climateEngine.load("data/lessons/iklim-ve-hava-hareketleri.json");
  assert.equal(climateLesson.id, "lesson_iklim_ve_hava_hareketleri_1");
  assert.equal(climateEngine.slideCount, 18, "İklim ve Hava Hareketleri dersi 18 slayt olmalıdır");
  assert.equal(climateEngine.currentSlide.layout, "climate_cover");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
