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
  assert.equal(lessonData.stages.length, 3, "3 ders aşaması bulunmalıdır");

  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  assert.equal(slides.length, 5, "Slayt sayısı tam olarak 5 olmalıdır");

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

  // 4. Kaldırılan öğeler (Kicker, Evet/Hayır ve Uyarı kartı olmamalı)
  assert.equal(slide1.kicker, undefined, "kicker alanı kaldırılmış olmalıdır");
  assert.equal(slide1.bottomQuestion, undefined, "bottomQuestion alanı kaldırılmış olmalıdır");
  assert.equal(slide1.conceptWarning, undefined, "conceptWarning alanı kaldırılmış olmalıdır");

  // Slayt 2 Doğrulaması
  const slide2 = slides[1];
  assert.equal(slide2.id, "slide_2_uzay_neden_yapilir");
  assert.equal(slide2.layout, "space_uzay_neden_yapilir");
  assert.equal(slide2.title, "Uzay Araştırmaları Neden Yapılır?");
  assert.equal(slide2.purposes?.length, 5, "5 adet amaç bulunmalıdır");
  assert.equal(slide2.purposes[0].title, "Gök Cisimlerini Tanımak");
  assert.equal(slide2.purposes[1].title, "Evreni Anlamak");
  assert.equal(slide2.purposes[2].title, "Dünya’yı Gözlemlemek");
  assert.equal(slide2.purposes[3].title, "Yeni Teknolojiler Geliştirmek");
  assert.equal(slide2.purposes[4].title, "Uzayda Yaşam Olanaklarını Araştırmak");

  assert.equal(slide2.interactions?.length, 1);
  const inter2 = slide2.interactions[0];
  assert.equal(inter2.type, "reveal_fill");
  assert.ok(inter2.template.includes("{teknolojiler}"));
  assert.equal(inter2.blanks[0].answer, "teknolojiler");

  // Slayt 3 Doğrulaması
  const slide3 = slides[2];
  assert.equal(slide3.id, "slide_3_uzay_araclari");
  assert.equal(slide3.layout, "space_uzay_araclari");
  assert.equal(slide3.title, "Uzay Araştırmalarında Kullanılan Araçlar");
  assert.equal(slide3.tools?.length, 3, "3 araç bulunmalıdır");
  assert.equal(slide3.tools[0].name, "Uzay Roketi");
  assert.equal(slide3.tools[0].desc, "Uzaya araç, uydu veya yük taşımak için kullanılan güçlü taşıma sistemidir.");
  assert.equal(slide3.tools[1].name, "Uzay Sondası");
  assert.equal(slide3.tools[1].desc, "İnsan taşımadan uzaydaki gök cisimleri hakkında veri toplayan araştırma aracıdır.");
  assert.equal(slide3.tools[2].name, "Uzay Mekiği");
  assert.equal(slide3.tools[2].desc, "İnsan ve yük taşıyabilen, uzaya gidip yeniden Dünya’ya dönebilen uzay aracıdır.");
  assert.equal(slide3.media?.length, 3, "3 adet görsel bulunmalıdır");
  for (const m of slide3.media) {
    const p = m.src.replace(/^\.\//, "");
    await access(p);
    const st = await stat(p);
    assert.ok(st.size > 0, "Görsel dosyası boş olamaz");
  }

  // Slayt 4 Doğrulaması
  const slide4 = slides[3];
  assert.equal(slide4.id, "slide_4_uzay_araclari");
  assert.equal(slide4.layout, "space_uzay_araclari");
  assert.equal(slide4.title, "Uzay Araştırmalarında Kullanılan Araçlar");
  assert.equal(slide4.tools?.length, 2, "2 araç bulunmalıdır");
  assert.equal(slide4.tools[0].name, "Yapay Uydu");
  assert.equal(slide4.tools[0].desc, "Dünya veya başka bir gök cisminin çevresinde belirli bir yörüngede dolanan insan yapımı uzay aracıdır.");
  assert.equal(slide4.tools[1].name, "Uzay İstasyonu");
  assert.equal(slide4.tools[1].desc, "Astronotların uzun süre uzayda yaşayarak bilimsel araştırmalar yaptığı büyük uzay yapısıdır.");
  assert.equal(slide4.media?.length, 2, "2 adet görsel bulunmalıdır");
  for (const m of slide4.media) {
    const p = m.src.replace(/^\.\//, "");
    await access(p);
    const st = await stat(p);
    assert.ok(st.size > 0, "Görsel dosyası boş olamaz");
  }

  // Slayt 5 Doğrulaması (Karşılaştırma Tablosu)
  const slide5 = slides[4];
  assert.equal(slide5.id, "slide_5_uzay_araclari_karsilastirma");
  assert.equal(slide5.layout, "space_araclar_karsilastirma");
  assert.equal(slide5.title, "Uzay Araçlarını Karşılaştıralım");
  assert.equal(slide5.columns?.length, 6, "6 sütun bulunmalıdır (Özellikler + 5 Araç)");
  assert.equal(slide5.rows?.length, 5, "5 satır bulunmalıdır");
  assert.equal(slide5.interactions?.length, 5, "Her satırda 1 adet olmak üzere toplam 5 etkileşim bulunmalıdır");

  // Etkileşim cevap kontrolleri
  const interMap = new Map(slide5.interactions.map((i) => [i.id, i.blanks[0]?.answer]));
  assert.equal(interMap.get(slide5.rows[0].sonda.interactionId), "Keşif ve gözlem");
  assert.equal(interMap.get(slide5.rows[1].mekik.interactionId), "Evet");
  assert.equal(interMap.get(slide5.rows[2].uydu.interactionId), "Evet");
  assert.equal(interMap.get(slide5.rows[3].mekik.interactionId), "Evet");
  assert.equal(interMap.get(slide5.rows[4].istasyon.interactionId), "Evet");

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
    assert.equal(engine.slideCount, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("7. Sınıf Müfredat ve Rota Doğrulaması (Çift Ünite Olmaması Kontrolü)", async () => {
  const catalog = await readJson("data/catalog.json");
  const grade7 = catalog.grades.find((g) => g.id === "grade_7");
  assert.ok(grade7, "7. Sınıf katalogda bulunmalıdır");
  assert.equal(grade7.curriculumProfileId, "maarif_model");

  const maarif = await readJson("data/curricula/maarif_model.json");
  
  // 7. Sınıf seçildiğinde sadece 1 adet ünite filtrelenmeli
  const grade7Units = maarif.units.filter((u) => !u.gradeId || u.gradeId === "grade_7");
  assert.equal(grade7Units.length, 1, "7. Sınıf için tek 1. Ünite listelenmelidir (çift ünite olmamalı)");
  assert.equal(grade7Units[0].id, "space_age");
  assert.equal(grade7Units[0].label, "1. Ünite — Uzay Çağı");

  // 6. Sınıf seçildiğinde sadece solar_system_and_eclipses filtrelenmeli
  const grade6Units = maarif.units.filter((u) => !u.gradeId || u.gradeId === "grade_6");
  assert.equal(grade6Units.length, 1, "6. Sınıf için sadece kendi ünitesi listelenmelidir");
  assert.equal(grade6Units[0].id, "solar_system_and_eclipses");

  const spaceTopic = grade7Units[0].topics.find((t) => t.id === "space_research");
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
  assert.ok(css.includes(".space-visual-frame"), "space-visual-frame stili tanımlı olmalıdır");
});

test("1920x1080 Sabit Tuval Mimarisi ve Ölçekleme CSS Kural Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-workspace {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 1920px;\n  height: 1080px;"), "slide-workspace 1920x1080 px sabit boyutta tanımlı olmalıdır");
  assert.ok(css.includes("transform: translate(-50%, -50%) scale(var(--slide-scale, 1));"), "slide-workspace ortalanmış ve scale ile ölçekleniyor olmalıdır");
  assert.ok(css.includes("transform-origin: center center;"), "transform-origin center center olmalıdır");
});

test("Slayt 1 Tipografi Hiyerarşisi (46px Başlık, 36px Tanım, 30px Konu, 28px Kavramlar) ve Sade Açık Tema Kontrolü", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  // Zorunlu alanların doğrudan 1920x1080 koordinatlarındaki piksel tipografi değerleri
  assert.ok(css.includes(".space-slide-title {\n  margin: 0;\n  font-size: 46px;"), "Başlık 46px olmalıdır");
  assert.ok(css.includes(".space-card-subhead span {\n  font-size: 30px;"), "Uzayda Neler Yer Alır başlığı 30px olmalıdır");
  assert.ok(css.includes(".space-tanim-slot .reveal-fill-sentence {\n  font-size: 36px;"), "Tanım cümlesi 36px olmalıdır");
  assert.ok(css.includes(".space-tanim-slot .blank-slot-answer {\n  font-size: 36px;"), "Boşluk cevabı 36px olmalıdır");
  assert.ok(css.includes(".space-concept-label {\n  font-size: 28px;"), "Kavram etiketi 28px olmalıdır");
  assert.ok(css.includes(".space-def-badge {\n  font-size: 28px;"), "Yardımcı rozet bilgisi 28px olmalıdır");

  // Açık renk / sade eğitim teması kontrolü
  assert.ok(css.includes(".slide-space-uzay-nedir {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  padding: 32px 48px;\n  gap: 24px;\n  box-sizing: border-box;\n  background: linear-gradient(145deg, #f8fafc 0%, #f0f7ff 50%, #e8f2fc 100%);\n  color: #0f172a;"), "Açık sade eğitim arka planı ve koyu metin kullanılmalıdır");
});

test("Slayt 2 (Uzay Araştırmaları Neden Yapılır?) Tipografi ve 2+3 Düzen CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-uzay-neden-yapilir"), "Slayt 2 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-purpose-num"), "Slayt 2 madde numarası sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-purpose-title {\n  margin: 0;\n  font-size: 34px;"), "Amaç kart başlığı 34px (32-36px standardı) olmalıdır");
  assert.ok(css.includes(".space-bottom-slot .reveal-fill-sentence {\n  font-size: 36px;"), "Slayt 2 reveal_fill cümlesi 36px olmalıdır");
  assert.ok(css.includes(".space-bottom-slot .blank-slot-answer {\n  font-size: 36px;"), "Slayt 2 boşluk cevabı 36px olmalıdır");
  assert.ok(css.includes(".space-purposes-grid {\n  display: grid;\n  grid-template-columns: repeat(6, 1fr);"), "2+3 dengeli grid yapısı repeat(6, 1fr) olmalıdır");
});

test("Slayt 3 (Uzay Araştırmalarında Kullanılan Araçlar) Tipografi ve 3 Sütun CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-uzay-araclari"), "Slayt 3 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-tools-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);"), "3 sütunlu grid yapısı tanımlı olmalıdır");
  assert.ok(css.includes(".space-tool-name {\n  margin: 0;\n  font-size: 36px;\n  font-weight: 700;"), "Araç adı 36px bold olmalıdır");
  assert.ok(css.includes(".space-tool-desc {\n  margin: 0;\n  font-size: 36px;\n  font-weight: 400;"), "Açıklama 36px normal olmalıdır");
  assert.ok(css.includes(".space-tool-visual {\n  width: 100%;\n  height: 480px;"), "Görsel alanı 480px yükseklikte olmalıdır");
});

test("Slayt 4 (Uzay Araştırmalarında Kullanılan Araçlar - 2 Araç) 2 Sütun CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-uzay-araclari.is-2col .space-tools-grid {\n  grid-template-columns: repeat(2, 1fr);"), "2 sütunlu grid yapısı tanımlı olmalıdır");
});

test("Slayt 5 (Uzay Araçlarını Karşılaştıralım) Tablo Yapısı ve Tipografi CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-araclar-karsilastirma"), "Slayt 5 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-comparison-table"), "Karşılaştırma tablosu sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".space-table-th {\n  background: #eef6fc;\n  color: #0369a1;\n  font-size: 36px;\n  font-weight: 700;"), "Sütun başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".space-table-feature {\n  font-size: 36px;\n  font-weight: 700;"), "Satır başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".space-table-cell {\n  font-size: 36px;\n  font-weight: 400;"), "Normal tablo hücreleri 36px normal olmalıdır");
  assert.ok(css.includes(".space-table-interactive-cell .blank-slot-answer {\n  font-size: 36px;\n  font-weight: 700;"), "Etkileşimli cevaplar 36px bold olmalıdır");
});
