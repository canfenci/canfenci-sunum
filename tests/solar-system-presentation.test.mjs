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

test("6. Sınıf Slayt 6 (Gezegen Nedir?) Etkileşim ve Yapı Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slide6 = lessonData.stages.flatMap((s) => s.slides || []).find((s) => s.id === "slide_6_gezegen_nedir");
  assert.ok(slide6, "slide_6_gezegen_nedir slaytı bulunamadı");
  assert.equal(slide6.layout, "solar_gezegen_nedir");
  assert.equal(slide6.interactions?.length, 3, "Slayt 6'da 3 adet reveal_fill etkileşimi bulunmalıdır");

  const tanim = slide6.interactions.find((i) => i.id === "interaction_slide_6_tanim");
  assert.ok(tanim, "interaction_slide_6_tanim bulunamadı");
  assert.equal(tanim.blanks[0].answer, "gezegen");

  const sicaklik = slide6.interactions.find((i) => i.id === "interaction_slide_6_sicaklik");
  assert.ok(sicaklik, "interaction_slide_6_sicaklik bulunamadı");
  assert.equal(sicaklik.blanks[0].answer, "soğuktur");

  const gruplar = slide6.interactions.find((i) => i.id === "interaction_slide_6_gruplar");
  assert.ok(gruplar, "interaction_slide_6_gruplar bulunamadı");
  assert.equal(gruplar.blanks[0].answer, "karasal");
  assert.equal(gruplar.blanks[1].answer, "gazsal");
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

test("6. Sınıf Slayt 8-15 Gezegen Kartları Yapısı ve Satürn Regresyon Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);
  const planetSlides = slides.filter((s) => s.layout === "solar_planet_card");

  assert.equal(planetSlides.length, 8, "Tam olarak 8 gezegen kartı bulunmalıdır (Slayt 8-15)");

  const expectedPlanets = [
    { id: "slide_8_merkur", name: "Merkür", num: 1 },
    { id: "slide_9_venus", name: "Venüs", num: 2 },
    { id: "slide_10_dunya", name: "Dünya", num: 3 },
    { id: "slide_11_mars", name: "Mars", num: 4 },
    { id: "slide_12_jupiter", name: "Jüpiter", num: 5 },
    { id: "slide_13_saturn", name: "Satürn", num: 6 },
    { id: "slide_14_uranus", name: "Uranüs", num: 7 },
    { id: "slide_15_neptun", name: "Neptün", num: 8 }
  ];

  for (let i = 0; i < expectedPlanets.length; i++) {
    const exp = expectedPlanets[i];
    const slide = planetSlides[i];
    assert.equal(slide.id, exp.id);
    assert.equal(slide.planet, exp.name);
    assert.equal(slide.planetNumber, exp.num);
    assert.ok(Array.isArray(slide.facts) && slide.facts.length >= 3, `${exp.name} en az 3 bilgi maddesi içermelidir`);
    assert.ok(slide.interactions?.length > 0, `${exp.name} etkileşimi eksik olamaz`);
    assert.ok(slide.media?.[0]?.src, `${exp.name} medya görseli tanımlı olmalıdır`);
  }

  // Satürn özel kontrolü (regresyon önleme)
  const saturn = planetSlides.find((s) => s.id === "slide_13_saturn");
  assert.equal(saturn.media[0].src, "./assets/images/gunes-sistemi/photorealistic_saturn_cutout.png");

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".solar-fact-text"), ".solar-fact-text CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(21px, 1.55cqi, 30px)"), "Akıllı tahta okunabilirlik font-size tanımlı olmalıdır");
});

