import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access, stat } from "node:fs/promises";

test("6. Sınıf Güneş Sistemi ve Gezegenler Ders Paketi Sözleşmesi", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  assert.equal(lessonData.schemaVersion, "1.0.0");
  assert.equal(lessonData.id, "lesson_gunes_sistemi_1");
  assert.equal(lessonData.gradeId, "grade_6");
  assert.equal(lessonData.curriculumProfileId, "maarif_model");
  assert.equal(lessonData.unitId, "solar_system_and_eclipses");
  assert.equal(lessonData.topicId, "solar_system");
  assert.equal(lessonData.stages.length, 5, "5 ders aşaması bulunmalıdır");

  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  assert.equal(slides.length, 26, "PDF 26 sayfa = 26 slayt olmalıdır");

  const expectedStages = [
    { id: "stage_derse_giris", slideCount: 3 },
    { id: "stage_gunes_sistemi_ve_gezegen_kavrami", slideCount: 4 },
    { id: "stage_gezegenleri_taniyalim", slideCount: 8 },
    { id: "stage_gezegenleri_karsilastiralim", slideCount: 7 },
    { id: "stage_asteroit_ve_goktaslari", slideCount: 4 }
  ];

  for (let i = 0; i < expectedStages.length; i++) {
    const expected = expectedStages[i];
    const actual = lessonData.stages[i];
    assert.equal(actual.id, expected.id, `Aşama ${i+1} ID uyumsuz`);
    assert.equal(actual.slides.length, expected.slideCount, `${actual.id} slayt sayısı hatalı`);
  }

  // Check unique slide IDs and interaction IDs
  const slideIds = new Set();
  const interactionIds = new Set();
  for (const slide of slides) {
    assert.ok(slide.id, "Slayt ID eksik olamaz");
    assert.ok(!slideIds.has(slide.id), `Tekrarlanan slayt ID: ${slide.id}`);
    slideIds.add(slide.id);

    assert.ok(slide.title, `Slayt ${slide.id} başlığı eksik olamaz`);
    assert.ok(slide.layout?.startsWith("solar_"), `Slayt ${slide.id} geçerli solar layout kullanmalı`);

    for (const m of slide.media || []) {
      const cleanPath = m.src.replace(/^\.\//, "");
      await access(cleanPath);
      const st = await stat(cleanPath);
      assert.ok(st.size > 0, `Medya dosyası boş olamaz: ${cleanPath}`);
    }

    for (const interaction of slide.interactions || []) {
      assert.ok(interaction.id, "Etkileşim ID eksik olamaz");
      assert.ok(!interactionIds.has(interaction.id), `Tekrarlanan etkileşim ID: ${interaction.id}`);
      interactionIds.add(interaction.id);
      assert.equal(interaction.type, "reveal_fill");
      assert.ok(interaction.template.includes("{"), "Şablon en az bir boşluk içermelidir");
      assert.ok(interaction.blanks?.length > 0, "Boşluk listesi tanımlanmalıdır");
      for (const blank of interaction.blanks) {
        assert.ok(blank.id && blank.answer, "Boşluk id ve answer zorunludur");
      }
    }
  }
});

test("Maarif Model Müfredat Bağlantısı Doğrulaması", async () => {
  const maarif = JSON.parse(await readFile("data/curricula/maarif_model.json", "utf8"));
  const solarTopic = maarif.units[0].topics.find((t) => t.id === "solar_system");
  assert.ok(solarTopic, "solar_system konusu bulunamadı");
  assert.equal(solarTopic.workModes.presentation.status, "available");
  assert.equal(solarTopic.workModes.presentation.source, "./data/lessons/gunes-sistemi.json");
  assert.equal(solarTopic.lessons[0].source, "./data/lessons/gunes-sistemi.json");
});

test("8. Sınıf Mevsimlerin Oluşumu Regresyon Doğrulaması", async () => {
  const grade8 = JSON.parse(await readFile("data/lessons/mevsimlerin-olusumu.json", "utf8"));
  assert.equal(grade8.id, "lesson_mevsimlerin_olusumu_1");
  assert.equal(grade8.gradeId, "grade_8");
  const slides = grade8.stages.flatMap((st) => st.slides || []);
  assert.equal(slides.length, 25, "8. sınıf dersi 25 slayt olarak korunmalıdır");
});
