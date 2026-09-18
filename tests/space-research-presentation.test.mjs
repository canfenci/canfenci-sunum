import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access, stat } from "node:fs/promises";
import { LessonEngine } from "../src/engines/lesson-engine.js";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("7. Sınıf Uzay Araştırmaları Ders Paketi ve Slayt 1 Sözleşmesi", async () => {
  const lessonData = await readJson("data/lessons/uzay-arastirmalari.json");
  assert.equal(lessonData.schemaVersion, "1.0.0");
  assert.equal(lessonData.id, "lesson_uzay_arastirmalari_1");
  assert.equal(lessonData.gradeId, "grade_7");
  assert.equal(lessonData.curriculumProfileId, "maarif_model");
  assert.equal(lessonData.unitId, "space_age");
  assert.equal(lessonData.topicId, "space_research");
  assert.equal(lessonData.stages.length, 1, "Şimdilik 1 ders aşaması bulunmalıdır");

  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  assert.equal(slides.length, 1, "Slayt sayısı tam olarak 1 olmalıdır");

  const slide1 = slides[0];
  assert.equal(slide1.id, "slide_1_uzay_nedir");
  assert.equal(slide1.layout, "space_uzay_nedir");
  assert.equal(slide1.title, "Uzay Nedir?");
  assert.equal(slide1.question, "Dünya’nın atmosferinin ötesinde ne vardır?");

  // 1. Reveal fill etkileşimi
  assert.equal(slide1.interactions?.length, 1);
  const tanimInter = slide1.interactions[0];
  assert.equal(tanimInter.type, "reveal_fill");
  assert.ok(tanimInter.template.includes("{uzay}"));
  assert.equal(tanimInter.blanks[0].answer, "uzay");

  // 2. 6 Ana kavram
  assert.equal(slide1.concepts?.length, 6, "6 ana kavram kartı bulunmalıdır");
  const expectedLabels = [
    "Yıldızlar",
    "Gezegenler",
    "Uydular",
    "Asteroitler",
    "Kuyruklu yıldızlar",
    "Gaz ve toz bulutları"
  ];
  for (let i = 0; i < expectedLabels.length; i++) {
    assert.equal(slide1.concepts[i].label, expectedLabels[i]);
  }

  // 3. Görsel dosyası
  assert.ok(slide1.media?.[0]?.src, "Görsel dosyası tanımlı olmalıdır");
  const mediaPath = slide1.media[0].src.replace(/^\.\//, "");
  await access(mediaPath);
  const st = await stat(mediaPath);
  assert.ok(st.size > 0, "Görsel dosyası boş olamaz");

  // 4. Alt etkileşim (Evet / Hayır)
  assert.equal(slide1.bottomQuestion?.prompt, "Uzay tamamen boş mudur?");
  assert.equal(slide1.bottomQuestion?.options?.length, 2);
  const optEvet = slide1.bottomQuestion.options.find((o) => o.text === "Evet");
  const optHayir = slide1.bottomQuestion.options.find((o) => o.text === "Hayır");
  assert.equal(optEvet.isCorrect, false);
  assert.equal(optHayir.isCorrect, true);
  assert.ok(slide1.bottomQuestion.correctFeedback?.includes("gaz, toz"));

  // 5. Mini kavram uyarısı
  assert.equal(slide1.conceptWarning?.title, "Uzay ve evren aynı kavram değildir.");
  assert.ok(slide1.conceptWarning.explanation);

  // LessonEngine testi
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
    const engine = new LessonEngine();
    const loaded = await engine.load("data/lessons/uzay-arastirmalari.json");
    assert.equal(loaded.id, "lesson_uzay_arastirmalari_1");
    assert.equal(engine.slideCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("7. Sınıf Müfredat ve Rota Doğrulaması", async () => {
  const catalog = await readJson("data/catalog.json");
  const grade7 = catalog.grades.find((g) => g.id === "grade_7");
  assert.ok(grade7, "7. Sınıf katalogda bulunmalıdır");
  assert.equal(grade7.curriculumProfileId, "maarif_model");

  const maarif = await readJson("data/curricula/maarif_model.json");
  const spaceUnit = maarif.units.find((u) => u.id === "space_age");
  assert.ok(spaceUnit, "space_age ünitesi maarif_model içinde bulunmalıdır");
  assert.equal(spaceUnit.label, "1. Ünite — Uzay Çağı");

  const spaceTopic = spaceUnit.topics.find((t) => t.id === "space_research");
  assert.ok(spaceTopic, "space_research konusu bulunmalıdır");
  assert.equal(spaceTopic.workModes.presentation.status, "available");
  assert.equal(spaceTopic.workModes.presentation.source, "./data/lessons/uzay-arastirmalari.json");
});

test("Yeni Tipografi Standardı CSS Kural Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-space-uzay-nedir"), "Slayt 1 ana CSS sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-slide-title"), "space-slide-title kuralı tanımlı olmalıdır");
  assert.ok(css.includes(".space-tanim-slot .reveal-fill-sentence"), "space-tanim-slot sentence stili tanımlı olmalıdır");
  assert.ok(css.includes(".space-concept-pill"), "space-concept-pill stili tanımlı olmalıdır");
  assert.ok(css.includes(".space-choice-btn"), "space-choice-btn stili tanımlı olmalıdır");
  assert.ok(css.includes(".space-warning-toggle"), "space-warning-toggle stili tanımlı olmalıdır");
});

test("Slayt 1 Tipografi Standartları Minimum 36px Kontrolü", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  // Zorunlu alanların minimum 36px clamp değerleri
  assert.ok(css.includes(".space-slide-title {\n  margin: 0;\n  font-size: clamp(46px"), "Başlık 46-48px olmalıdır");
  assert.ok(css.includes(".space-card-subhead span {\n  font-size: clamp(42px"), "Kart başlığı 42-44px olmalıdır");
  assert.ok(css.includes(".space-tanim-slot .reveal-fill-sentence {\n  font-size: clamp(36px"), "Reveal fill cümlesi en az 36px olmalıdır");
  assert.ok(css.includes(".space-concept-label {\n  font-size: clamp(36px"), "Kavram etiketi en az 36px olmalıdır");
  assert.ok(css.includes(".space-quiz-prompt {\n  font-size: clamp(36px"), "Evet/Hayır soru metni en az 36px olmalıdır");
  assert.ok(css.includes(".space-choice-btn {\n  flex: 1;\n  min-height: clamp(48px, 3.2cqi, 58px);\n  padding: 0 20px;\n  font-size: clamp(36px"), "Evet/Hayır buton yazıları en az 36px olmalıdır");
  assert.ok(css.includes(".space-quiz-feedback {\n  border-radius: 12px;\n  padding: 8px 14px;\n  font-size: clamp(36px"), "Geri bildirim metni en az 36px olmalıdır");
  assert.ok(css.includes(".space-warning-title {\n  flex: 1;\n  font-size: clamp(36px"), "Uyarı kartı başlığı en az 36px olmalıdır");
  assert.ok(css.includes(".space-warning-content p {\n  margin: 0;\n  font-size: clamp(36px"), "Açıklama metni en az 36px olmalıdır");
});
