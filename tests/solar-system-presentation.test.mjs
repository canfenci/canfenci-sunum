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
    { id: "slide_8_merkur", name: "Merkür", num: 1, answers: ["Karasal", "1.", "Yok", "Yok"] },
    { id: "slide_9_venus", name: "Venüs", num: 2, answers: ["Karasal", "2.", "Yok", "Yok"] },
    { id: "slide_10_dunya", name: "Dünya", num: 3, answers: ["Karasal", "3.", "Var (1: Ay)", "Yok"] },
    { id: "slide_11_mars", name: "Mars", num: 4, answers: ["Karasal", "4.", "Var (2)", "Yok"] },
    { id: "slide_12_jupiter", name: "Jüpiter", num: 5, answers: ["Gazsal", "5.", "Var (95)", "Var"] },
    { id: "slide_13_saturn", name: "Satürn", num: 6, answers: ["Gazsal", "6.", "Var (146)", "Var"] },
    { id: "slide_14_uranus", name: "Uranüs", num: 7, answers: ["Gazsal", "7.", "Var (28)", "Var (ince)"] },
    { id: "slide_15_neptun", name: "Neptün", num: 8, answers: ["Gazsal", "8.", "Var (16)", "Var"] }
  ];

  for (let i = 0; i < expectedPlanets.length; i++) {
    const exp = expectedPlanets[i];
    const slide = planetSlides[i];
    assert.equal(slide.id, exp.id);
    assert.equal(slide.planet, exp.name);
    assert.equal(slide.planetNumber, exp.num);
    assert.deepEqual(slide.coreFacts.map((fact) => fact.label), ["YAPISI", "GÜNEŞ’E YAKINLIK", "UYDU", "HALKA"]);
    assert.equal(slide.interactions?.length, 4, `${exp.name} dört bağımsız temel bilgi etkileşimi içermelidir`);
    assert.ok(slide.interactions.every((interaction) => interaction.type === "reveal_fill"));
    assert.deepEqual(slide.interactions.map((interaction) => interaction.blanks[0].answer), exp.answers);
    assert.ok(slide.coreFacts.every((fact) => slide.interactions.some((interaction) => interaction.id === fact.interactionId)));
    assert.ok(Array.isArray(slide.highlights) && slide.highlights.length >= 1, `${exp.name} kritik ana bilgi içermelidir`);
    assert.ok(Array.isArray(slide.extraFacts) && slide.extraFacts.length >= 1 && slide.extraFacts.length <= 3, `${exp.name} 1-3 ek bilgi kartı içermelidir`);
    assert.ok(slide.media?.[0]?.src, `${exp.name} medya görseli tanımlı olmalıdır`);
  }

  // Satürn özel kontrolü (regresyon önleme)
  const saturn = planetSlides.find((s) => s.id === "slide_13_saturn");
  assert.equal(saturn.media[0].src, "./assets/images/gunes-sistemi/photorealistic_saturn_cutout.png");

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".solar-planet-core-grid"), "Gezegen slaytlarında 2x2 temel bilgi gridi bulunmalıdır");
  assert.ok(css.includes(".solar-planet-core-slot .blank-slot-answer"), "Temel bilgi cevap stili tanımlı olmalıdır");
  assert.match(css, /\.solar-planet-core-slot \.blank-slot-answer \{[\s\S]*?font-size: 40px;/, "Temel bilgi cevapları 40px olmalıdır");
  assert.match(css, /\.solar-planet-highlights p \{[\s\S]*?font-size: 40px;/, "Kritik bilgiler 40px olmalıdır");
  assert.match(css, /\.solar-planet-extra-grid p \{[\s\S]*?font-size: 34px;/, "Ek bilgiler 34px olmalıdır");
  assert.ok(css.includes(".solar-planet-notebook-badge"), "Gezegen slaytlarında notebook badge bulunmalıdır");

  const renderer = await readFile("src/ui/solar-system-slides.js", "utf8");
  assert.ok(renderer.includes("slide.interactions?.find((item) => item.id === interactionId)"), "Dört temel etkileşim kimliğiyle bağımsız bağlanmalıdır");
});

test("6. Sınıf Slayt 16-20 Karşılaştırma Slaytları Yapısı ve Okunabilirlik Doğrulaması", async () => {
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

  const slide19 = slides.find((s) => s.id === "slide_19_buyukluklerine_gore");
  const slide20 = slides.find((s) => s.id === "slide_20_gunese_yakinliklarina_gore");
  assert.equal(slide19.layout, "solar_karsilastirma_siralama");
  assert.equal(slide20.layout, "solar_karsilastirma_siralama");
  assert.equal(slide19.ranking.length, 8);
  assert.equal(slide20.ranking.length, 8);
  assert.ok(slide19.interactions?.length > 0);
  assert.ok(slide20.interactions?.length > 0);

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.match(css, /\.solar-comp-head h3 \{[\s\S]*?font-size: 42px;/, "Grup başlıkları 42px olmalıdır");
  assert.match(css, /\.solar-comp-card ul \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 800;/, "Karşılaştırma listeleri 40px bold olmalıdır");
  assert.match(css, /\.solar-rank-name \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 850;/, "Sıralama adları 40px bold olmalıdır");
  assert.match(css, /\.solar-mnemonic-text \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 800;/, "Akılda tutma metni 40px bold olmalıdır");
  assert.ok(css.includes("grid-template-rows: 236px minmax(0, 1fr) 140px"), "Slayt 16-18 görsel alanı büyütülmüş olmalıdır");
  assert.ok(css.includes("grid-template-rows: 280px minmax(0, 1fr) 126px"), "Slayt 19 görsel alanı 280px olmalıdır");
  assert.ok(css.includes("grid-template-rows: 240px 82px minmax(0, 1fr) 126px"), "Slayt 20 görsel alanı 240px olmalıdır");
  assert.match(css, /\.solar-comp-img \{[\s\S]*?object-fit: contain;/, "Karşılaştırma görselleri kırpılmadan gösterilmelidir");
  assert.match(css, /\.solar-siralama-img \{[\s\S]*?object-fit: contain;/, "Sıralama görselleri kırpılmadan gösterilmelidir");
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
  assert.equal(slide21.notes.length, 6, "Tam olarak 6 not bulunmalıdır");
  assert.equal(slide21.kicker, undefined, "DİKKAT EDELİM kicker metni kaldırılmış olmalıdır");
  assert.equal(slide21.lead, undefined, "Açıklama cümlesi kaldırılmış olmalıdır");

  // Slayt 22 regresyon kontrolü
  const slide22 = slides.find((s) => s.id === "slide_22_gezegen_karsilastirma_tablosu");
  assert.ok(slide22, "Slayt 22 mevcut olmalıdır");
  assert.equal(slide22.layout, "solar_karsilastirma_tablosu");

  // CSS okunabilirlik kontrolü
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-solar-aklimizda-bulunsun .solar-slide-title"), "Slayt 21 başlık CSS kuralı mevcut olmalıdır");
  assert.match(css, /\.slide-solar-aklimizda-bulunsun \.solar-slide-title \{[\s\S]*?font-size: 48px;[\s\S]*?font-weight: 700;/, "Başlık 48px bold olmalıdır");
  assert.match(css, /\.slide-solar-aklimizda-bulunsun \.solar-note-tag \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 700;/, "Not etiketleri 40px bold olmalıdır");
  assert.match(css, /\.slide-solar-aklimizda-bulunsun \.solar-note-text \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 400;/, "Not açıklamaları 40px normal olmalıdır");

  // Renderer kontrolü: Kural yerine Not, kicker fallback'siz koşullu
  const renderer = await readFile("src/ui/solar-system-slides.js", "utf8");
  assert.ok(renderer.includes("Not ${i + 1}"), "Not etiketleri 'Not' olarak basılmalıdır");
  assert.ok(!renderer.includes("Kural ${i + 1}"), "Slayt 21'de 'Kural' etiketi kalmamalıdır");
  assert.ok(!renderer.includes('slide.kicker ?? "DİKKAT EDELİM"'), "DİKKAT EDELİM fallback'i kaldırılmış olmalıdır");
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

test("6. Sınıf Slayt 26 Oluşum Süreci Okunabilirlik ve Regresyon Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);

  const slide26 = slides.find((s) => s.id === "slide_26_olusum_sureci");
  assert.ok(slide26, "Slayt 26 mevcut olmalıdır");
  assert.equal(slide26.layout, "solar_olusum_sureci");
  assert.equal(slide26.title, "Oluşum Süreci");
  assert.equal(slide26.kicker, undefined, "SÜREÇ BASAMAKLARI kicker metni kaldırılmış olmalıdır");
  assert.equal(slide26.lead, undefined, "Açıklama cümlesi kaldırılmış olmalıdır");
  assert.ok(slide26.media?.[0]?.src, "Üstteki süreç görseli korunmalıdır");
  assert.equal(slide26.steps?.length, 5, "5 süreç kartı bulunmalıdır");

  // Alt etkileşim (reveal_fill) doğrulaması
  assert.ok(slide26.interactions?.length > 0, "Alt etkileşim alanı mevcut olmalıdır");
  assert.equal(slide26.interactions[0].type, "reveal_fill");
  assert.equal(slide26.interactions[0].blanks?.length, 3);

  // CSS okunabilirlik kontrolleri
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-solar-olusum-sureci"), "Slayt 26'ya özel CSS kuralları mevcut olmalıdır");
  assert.match(css, /\.slide-solar-olusum-sureci \.solar-step-title \{[\s\S]*?font-size: 40px;/, "Kutu başlıkları 40px olmalıdır");
  assert.match(css, /\.slide-solar-olusum-sureci \.solar-step-desc \{[\s\S]*?font-size: 40px;/, "Açıklama metinleri 40px olmalıdır");
  assert.match(css, /\.slide-solar-olusum-sureci \.reveal-fill-sentence \{[\s\S]*?font-size: 40px;/, "Etkileşim cümlesi 40px olmalıdır");
  assert.ok(css.includes("clamp(22px, 1.5cqi, 32px)"), "Numara rozetleri font-size tanımlı olmalıdır");
});

test("6. Sınıf Slayt 23-25 Revize Doğrulaması (Sadeleşme, 40px Tipografi, 4 Kavram Kartı)", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/gunes-sistemi.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);

  // Slayt 23: yalnızca asteroit odağı
  const slide23 = slides.find((s) => s.id === "slide_23_asteroit_ve_kusagi");
  assert.ok(slide23, "Slayt 23 mevcut olmalıdır");
  assert.equal(slide23.layout, "solar_asteroit_kusak");
  assert.equal(slide23.title, "Asteroit ve Asteroit Kuşağı");
  assert.equal(slide23.kicker, undefined, "Kicker metni kaldırılmış olmalıdır");
  assert.equal(slide23.lead, undefined, "Yardımcı açıklama kaldırılmış olmalıdır");
  assert.ok(slide23.media?.[0]?.src, "Asteroit görseli korunmalıdır");
  assert.equal(slide23.interactions?.length, 2, "2 etkileşimli yazı korunmalıdır");

  // Slayt 24: 4 kavram kartı
  const slide24 = slides.find((s) => s.id === "slide_24_goktasi_meteor_meteorit_cukur");
  assert.ok(slide24, "Slayt 24 mevcut olmalıdır");
  assert.equal(slide24.layout, "solar_goktasi_tanimlar");
  assert.equal(slide24.title, "Göktaşı, Meteor, Meteorit, Meteor Çukuru");
  assert.equal(slide24.kicker, undefined, "Kicker metni kaldırılmış olmalıdır");
  assert.equal(slide24.lead, undefined, "Yardımcı açıklama kaldırılmış olmalıdır");
  assert.deepEqual(slide24.definitions?.map((d) => d.title), ["Göktaşı", "Meteor", "Meteorit", "Meteor Çukuru"]);
  assert.deepEqual(slide24.definitions?.map((d) => d.image), [
    "./assets/images/gunes-sistemi/solitary_asteroid_in_deep_space.png",
    "./assets/images/gunes-sistemi/blazing_meteor_over_earth.png",
    "./assets/images/gunes-sistemi/meteorite_in_the_mountain_wilderness.png",
    "./assets/images/gunes-sistemi/vast_desert_meteor_crater.png"
  ]);

  // Slayt 25: başlık korunur, küçük yazılar temizlenir
  const slide25 = slides.find((s) => s.id === "slide_25_goktasi_meteor_meteorit_sema");
  assert.ok(slide25, "Slayt 25 mevcut olmalıdır");
  assert.equal(slide25.layout, "solar_atmosfer_semasi");
  assert.equal(slide25.title, "Göktaşı → Meteor → Meteorit");
  assert.equal(slide25.kicker, undefined, "Kicker metni kaldırılmış olmalıdır");
  assert.equal(slide25.lead, undefined, "Yardımcı açıklama kaldırılmış olmalıdır");
  assert.ok(slide25.media?.[0]?.src, "Süreç görseli korunmalıdır");
  assert.ok(slide25.interactions?.length > 0, "Etkileşimli yazı korunmalıdır");

  // Renderer kontrolleri
  const renderer = await readFile("src/ui/solar-system-slides.js", "utf8");
  assert.ok(!renderer.includes('slide.kicker ?? "ASTEROİT KAVRAMI"'), "Slayt 23 kicker fallback'i kaldırılmış olmalıdır");
  assert.ok(!renderer.includes('slide.kicker ?? "TANIMLAR"'), "Slayt 24 kicker fallback'i kaldırılmış olmalıdır");
  assert.ok(!renderer.includes('slide.kicker ?? "GEÇİŞ ŞEMASI"'), "Slayt 25 kicker fallback'i kaldırılmış olmalıdır");
  assert.ok(renderer.includes("solar-concept-grid"), "Slayt 24 kavram kart ızgarası basılmalıdır");
  assert.ok(renderer.includes("solar-concept-image"), "Slayt 24 gerçek görsel sınıfı basılmalıdır");
  assert.ok(renderer.includes("solar-concept-label"), "Slayt 24 kavram etiketi basılmalıdır");
  assert.ok(!renderer.includes("solar-concept-emoji"), "Slayt 24 emoji görselleri kaldırılmış olmalıdır");

  // CSS tipografi kontrolleri (40px standardı)
  const css = await readFile("src/styles/app.css", "utf8");
  assert.match(css, /\.slide-solar-asteroit-kusak \.reveal-fill-sentence \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 700;/, "Slayt 23 etkileşimli metni 40px bold olmalıdır");
  assert.match(css, /\.slide-solar-goktasi-tanimlar \.solar-concept-label \{[\s\S]*?font-size: 40px;[\s\S]*?font-weight: 400;/, "Slayt 24 kart yazıları 40px normal olmalıdır");
  assert.match(css, /\.slide-solar-goktasi-tanimlar \.solar-concept-image \{[\s\S]*?object-fit: contain;/, "Slayt 24 görselleri kırpılmadan sığmalıdır");
  assert.match(css, /\.slide-solar-atmosfer-semasi \.reveal-fill-sentence \{[\s\S]*?font-size: 40px;/, "Slayt 25 etkileşimli metni 40px olmalıdır");
});
