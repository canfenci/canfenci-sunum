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

test("6. Sınıf Slayt 16-18 Karşılaştırma Slaytları Yapısı ve Okunabilirlik Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);

  const slide16 = slides.find((s) => s.id === "slide_16_yapilarina_gore");
  assert.ok(slide16, "Slayt 16 bulunamadı");
  assert.equal(slide16.layout, "solar_karsilastirma_genel");
  assert.equal(slide16.comparison.leftTitle, "Karasal (İç) Gezegenler");
  assert.equal(slide16.comparison.rightTitle, "Gazsal (Dış) Gezegenler");
  assert.equal(slide16.comparison.leftItems.length, 4);
  assert.equal(slide16.comparison.rightItems.length, 4);
  assert.ok(slide16.interactions?.length > 0);

  const slide17 = slides.find((s) => s.id === "slide_17_halkalarina_gore");
  assert.ok(slide17, "Slayt 17 bulunamadı");
  assert.equal(slide17.layout, "solar_karsilastirma_genel");
  assert.equal(slide17.comparison.leftTitle, "Halkası Olmayanlar");
  assert.equal(slide17.comparison.rightTitle, "Halkası Olanlar");
  assert.equal(slide17.comparison.leftItems.length, 4);
  assert.equal(slide17.comparison.rightItems.length, 4);
  assert.ok(slide17.interactions?.length > 0);

  const slide18 = slides.find((s) => s.id === "slide_18_uydularina_gore");
  assert.ok(slide18, "Slayt 18 bulunamadı");
  assert.equal(slide18.layout, "solar_karsilastirma_genel");
  assert.equal(slide18.comparison.leftTitle, "Uydusu Olmayanlar");
  assert.equal(slide18.comparison.rightTitle, "Uydusu Olanlar");
  assert.equal(slide18.comparison.leftItems.length, 2);
  assert.equal(slide18.comparison.rightItems.length, 6);
  assert.ok(slide18.interactions?.length > 0);

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".solar-comp-head h3"), ".solar-comp-head h3 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(23px, 1.65cqi, 31px)"), "Grup başlıkları okunabilirlik font-size tanımlı olmalıdır");
  assert.ok(css.includes(".solar-comp-card ul"), ".solar-comp-card ul CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(21px, 1.5cqi, 28px)"), "Statik liste metinleri okunabilirlik font-size tanımlı olmalıdır");
});

test("6. Sınıf Slayt 21 Aklımızda Bulunsun Okunabilirlik ve Slayt 20/22 Regresyon Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);

  // Slayt 20 regresyon kontrolü
  const slide20 = slides.find((s) => s.id === "slide_20_gunese_yakinliklarina_gore");
  assert.ok(slide20, "Slayt 20 mevcut olmalıdır");
  assert.equal(slide20.layout, "solar_karsilastirma_siralama");

  // Slayt 21 yapısı kontrolü
  const slide21 = slides.find((s) => s.id === "slide_21_aklimizda_bulunsun");
  assert.ok(slide21, "Slayt 21 mevcut olmalıdır");
  assert.equal(slide21.layout, "solar_aklimizda_bulunsun");
  assert.equal(slide21.notes.length, 6, "Tam olarak 6 kural notu bulunmalıdır");

  // Slayt 22 regresyon kontrolü
  const slide22 = slides.find((s) => s.id === "slide_22_gezegen_karsilastirma_tablosu");
  assert.ok(slide22, "Slayt 22 mevcut olmalıdır");
  assert.equal(slide22.layout, "solar_karsilastirma_tablosu");

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".solar-note-tag"), ".solar-note-tag CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(16px, 1.1cqi, 22px)"), "Kural etiketleri font-size tanımlı olmalıdır");
  assert.ok(css.includes(".solar-note-text"), ".solar-note-text CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(20px, 1.45cqi, 28px)"), "Kural açıklamaları font-size tanımlı olmalıdır");
});

test("6. Sınıf Slayt 22 Gezegen Karşılaştırma Tablosu Okunabilirlik ve Slayt 21/23 Regresyon Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);

  // Slayt 21 regresyon kontrolü
  const slide21 = slides.find((s) => s.id === "slide_21_aklimizda_bulunsun");
  assert.ok(slide21, "Slayt 21 mevcut olmalıdır");
  assert.equal(slide21.notes.length, 6);

  // Slayt 22 yapısı kontrolü
  const slide22 = slides.find((s) => s.id === "slide_22_gezegen_karsilastirma_tablosu");
  assert.ok(slide22, "Slayt 22 mevcut olmalıdır");
  assert.equal(slide22.layout, "solar_karsilastirma_tablosu");
  assert.equal(slide22.title, "Gezegen Karşılaştırma Tablosu");
  assert.equal(slide22.kicker, undefined, "ÖZET KARŞILAŞTIRMA kicker metni kaldırılmış olmalıdır");
  assert.equal(slide22.lead, undefined, "Açıklama cümlesi kaldırılmış olmalıdır");
  assert.equal(slide22.tableData?.length, 8, "Tablo 8 gezegeni içermelidir");

  // Slayt 23 regresyon kontrolü
  const slide23 = slides.find((s) => s.id === "slide_23_asteroit_ve_kusagi");
  assert.ok(slide23, "Slayt 23 mevcut olmalıdır");
  assert.equal(slide23.layout, "solar_asteroit_kusak");

  // CSS okunabilirlik kontrolleri
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-solar-karsilastirma-tablosu"), "Slayt 22'ye özel CSS kuralları mevcut olmalıdır");
  assert.ok(css.includes("clamp(17px, 1.45cqi, 28px)"), "Sütun başlıkları font-size tanımlı olmalıdır");
  assert.ok(css.includes("clamp(19px, 1.5cqi, 28px)"), "Tablo hücreleri font-size tanımlı olmalıdır");
  assert.ok(css.includes("clamp(22px, 1.68cqi, 31px)"), "İşaretler (symbol) font-size tanımlı olmalıdır");
});


