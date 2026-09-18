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
  assert.equal(slides.length, 13, "Slayt sayısı tam olarak 13 olmalıdır");

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

  // Slayt 6 Doğrulaması (Türkiye’nin Haberleşme Uyduları)
  const slide6 = slides[5];
  assert.equal(slide6.id, "slide_6_turkiyenin_haberlesme_uydulari");
  assert.equal(slide6.layout, "space_haberlesme_uydulari");
  assert.equal(slide6.title, "Türkiye’nin Haberleşme Uyduları");
  assert.equal(slide6.activeSatellites?.length, 6, "6 aktif haberleşme uydusu bulunmalıdır");
  assert.equal(slide6.inactiveSatellites?.length, 3, "3 görevini tamamlamış haberleşme uydusu bulunmalıdır");
  const sat6a = slide6.activeSatellites.find((s) => s.id === "turksat_6a");
  assert.ok(sat6a, "TÜRKSAT 6A aktif uydular içinde bulunmalıdır");
  assert.equal(sat6a.highlight, "Türkiye’nin ilk yerli ve millî haberleşme uydusu");
  assert.ok(slide6.media?.[0]?.src, "Görsel tanımlı olmalıdır");
  const media6Path = slide6.media[0].src.replace(/^\.\//, "");
  await access(media6Path);
  const st6 = await stat(media6Path);
  assert.ok(st6.size > 0, "Slayt 6 görsel dosyası boş olamaz");

  // Slayt 7 Doğrulaması (Türkiye’nin Gözlem Uyduları)
  const slide7 = slides[6];
  assert.equal(slide7.id, "slide_7_turkiyenin_gozlem_uydulari");
  assert.equal(slide7.layout, "space_gozlem_uydulari");
  assert.equal(slide7.title, "Türkiye’nin Gözlem Uyduları");
  assert.equal(slide7.activeSatellites?.length, 3, "3 aktif gözlem uydusu (GÖKTÜRK 1, GÖKTÜRK 2, İMECE) bulunmalıdır");
  assert.equal(slide7.inactiveSatellites?.length, 2, "2 görevini tamamlamış gözlem uydusu (BİLSAT, RASAT) bulunmalıdır");
  assert.ok(slide7.media?.[0]?.src, "Görsel tanımlı olmalıdır");
  const media7Path = slide7.media[0].src.replace(/^\.\//, "");
  await access(media7Path);
  const st7 = await stat(media7Path);
  assert.ok(st7.size > 0, "Slayt 7 görsel dosyası boş olamaz");
  assert.equal(slide7.interactions?.length ?? 0, 0, "Slayt 7 erken uzay kirliliği etkileşimi kaldırılmış olmalıdır");

  // Slayt 8 Doğrulaması (Uydular Ne İşe Yarar?)
  const slide8 = slides[7];
  assert.equal(slide8.id, "slide_8_uydular_ne_ise_yarar");
  assert.equal(slide8.layout, "space_uydular_ne_ise_yarar");
  assert.equal(slide8.title, "Uydular Ne İşe Yarar?");
  assert.equal(slide8.leftCard.title, "HABERLEŞME UYDULARI");
  assert.equal(slide8.leftCard.items.length, 3);
  assert.equal(slide8.leftCard.items[0], "Televizyon ve radyo yayınları");
  assert.equal(slide8.leftCard.items[1], "Telefon haberleşmesi");
  assert.equal(slide8.leftCard.items[2], "İnternet ve veri iletişimi");

  assert.equal(slide8.rightCard.title, "GÖZLEM UYDULARI");
  assert.equal(slide8.rightCard.items.length, 4);
  assert.equal(slide8.rightCard.items[0], "Dünya yüzeyinin görüntülenmesi");
  assert.equal(slide8.rightCard.items[1], "Keşif ve gözlem");
  assert.equal(slide8.rightCard.items[2], "Doğal afetlerin izlenmesi");
  assert.equal(slide8.rightCard.items[3], "Tarım ve çevre çalışmalarında görüntüleme");

  assert.equal(slide8.media?.length, 2, "2 adet görsel bulunmalıdır");
  for (const m of slide8.media) {
    const p = m.src.replace(/^\.\//, "");
    await access(p);
    const st = await stat(p);
    assert.ok(st.size > 0, "Slayt 8 görsel dosyası boş olamaz");
  }

  // Slayt 8 Etkileşimi (2 boşluklu reveal_fill)
  assert.equal(slide8.interactions?.length, 1, "Slayt 8 tek reveal_fill etkileşimi içermelidir");
  const inter8 = slide8.interactions[0];
  assert.equal(inter8.type, "reveal_fill");
  assert.ok(inter8.template.includes("{haberlesme}"));
  assert.ok(inter8.template.includes("{gozlem}"));
  assert.equal(inter8.blanks.length, 2);
  const blankHaber = inter8.blanks.find((b) => b.id === "haberlesme");
  const blankGozlem = inter8.blanks.find((b) => b.id === "gozlem");
  assert.equal(blankHaber?.answer, "haberleşme");
  assert.equal(blankGozlem?.answer, "gözlem");

  // Slayt 9 Doğrulaması (Teleskop Nedir?)
  const slide9 = slides[8];
  assert.equal(slide9.id, "slide_9_teleskop_nedir");
  assert.equal(slide9.layout, "space_teleskop_nedir");
  assert.equal(slide9.title, "Teleskop Nedir?");
  assert.ok(slide9.definition.includes("uzaktaki gök cisimlerini"));
  assert.ok(slide9.usage.includes("Gezegenleri, yıldızları"));
  assert.equal(slide9.parts?.length, 5, "Teleskobun 5 temel kısmı tanımlı olmalıdır");
  assert.equal(slide9.parts[0].name, "Objektif / Ayna-Mercek");
  assert.equal(slide9.parts[1].name, "Tüp");
  assert.equal(slide9.parts[2].name, "Göz merceği (oküler)");
  assert.equal(slide9.parts[3].name, "Kurgu / taşıyıcı bölüm");
  assert.equal(slide9.parts[4].name, "Üçayak (tripod)");

  assert.equal(slide9.types?.length, 3, "3 teleskop türü kartı tanımlı olmalıdır");
  assert.equal(slide9.types[0].name, "Optik teleskop");
  assert.equal(slide9.types[1].name, "Radyo teleskop");
  assert.equal(slide9.types[2].name, "Uzay teleskobu");

  assert.equal(slide9.interactions?.length ?? 0, 0, "Slayt 9'da etkileşim bulunmamalıdır");

  // Slayt 9 görsellerinin varlığı
  assert.ok(slide9.media?.[0]?.src, "Ana teleskop görseli tanımlı olmalıdır");
  const mainImgPath = slide9.media[0].src.replace(/^\.\//, "");
  await access(mainImgPath);
  const mainSt = await stat(mainImgPath);
  assert.ok(mainSt.size > 0, "Ana teleskop görseli boş olamaz");

  for (const t of slide9.types) {
    const p = t.image.replace(/^\.\//, "");
    await access(p);
    const st = await stat(p);
    assert.ok(st.size > 0, `${t.name} görsel dosyası boş olamaz`);
  }

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
    assert.equal(engine.slideCount, 13);
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

test("Slayt 6 ve 7 (Türkiye’nin Uyduları) Tipografi ve Düzen CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-haberlesme-uydulari"), "Slayt 6 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".slide-space-gozlem-uydulari"), "Slayt 7 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".sat-section-title {\n  margin: 0 0 16px 0;\n  font-size: 36px;\n  font-weight: 700;"), "Bölüm başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".satellite-pill .sat-name {\n  font-size: 36px;"), "Uydu adları 36px olmalıdır");
  assert.ok(css.includes(".sat-highlight-label {\n  font-size: 30px;"), "Türksat 6A vurgusu 30px olmalıdır");
  assert.ok(css.includes(".sat-task-badge {\n  font-size: 30px;"), "Gözlem uyduları görev etiketi 30px olmalıdır");
});

test("Slayt 8 (Uydular Ne İşe Yarar?) Tipografi ve Düzen CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-uydular-ne-ise-yarar"), "Slayt 8 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".functions-cards-layout"), "Slayt 8 iki kartlı düzen tanımlı olmalıdır");
  assert.ok(css.includes(".function-card.card-blue"), "Mavi haberleşme kartı tanımlı olmalıdır");
  assert.ok(css.includes(".function-card.card-turquoise"), "Turkuaz gözlem kartı tanımlı olmalıdır");
  assert.ok(css.includes(".function-card-title {\n  margin: 0;\n  font-size: 36px;\n  font-weight: 700;"), "Kart başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".function-text {\n  font-size: 36px;\n  font-weight: 400;"), "Madde metinleri 36px normal olmalıdır");
  assert.ok(css.includes(".functions-bottom-interaction .space-bottom-slot .reveal-fill-sentence {\n  font-size: 36px;"), "Etkileşim cümlesi 36px olmalıdır");
  assert.ok(css.includes(".functions-bottom-interaction .space-bottom-slot .blank-slot-answer {\n  font-size: 36px;\n  font-weight: 700;"), "Etkileşim cevabı 36px bold olmalıdır");
});

test("Slayt 9 (Teleskop Nedir?) Tipografi ve Düzen CSS Doğrulaması", async () => {
  const css = await readFile("src/styles/app.css", "utf8");

  assert.ok(css.includes(".slide-space-teleskop-nedir"), "Slayt 9 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".teleskop-main-section"), "Üst ana bölüm grid düzeni tanımlı olmalıdır");
  assert.ok(css.includes(".teleskop-def-p {\n  font-size: 36px;"), "Tanım cümlesi 36px olmalıdır");
  assert.ok(css.includes(".teleskop-usage-p {\n  font-size: 36px;"), "Kullanım amaçları cümlesi 36px olmalıdır");
  assert.ok(css.includes(".teleskop-diagram-box"), "Diyagram kutusu tanımlı olmalıdır");
  assert.ok(css.includes(".part-badge-name {\n  font-size: 30px;"), "Kısım etiketleri 30px (30-32px) olmalıdır");
  assert.ok(css.includes(".teleskop-types-section"), "Alt 3'lü tür bölümü tanımlı olmalıdır");
  assert.ok(css.includes(".type-card-name {\n  font-size: 32px;"), "Teleskop tür adları 32px (30-32px) olmalıdır");
});

test("Slayt 10 (Teleskop Çeşitleri) Sözleşme ve Tipografi CSS Doğrulaması", async () => {
  const lessonData = await readJson("data/lessons/uzay-arastirmalari.json");
  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  const slide10 = slides[9];

  assert.ok(slide10, "Slayt 10 mevcut olmalıdır");
  assert.equal(slide10.id, "slide_10_teleskop_cesitleri");
  assert.equal(slide10.layout, "space_teleskop_cesitleri");
  assert.equal(slide10.title, "Teleskop Çeşitleri");

  // Sol Kart: Uzay Teleskopları
  assert.equal(slide10.leftCard.title, "UZAY TELESKOPLARI");
  assert.equal(slide10.leftCard.desc, "Uzaya yerleştirilen teleskoplardır.");
  assert.equal(slide10.leftCard.detail, "Atmosferin ve ışık kirliliğinin olumsuz etkilerinden daha az etkilenerek daha net ve ayrıntılı görüntüler elde ederler.");
  assert.deepEqual(slide10.leftCard.examples, ["Hubble Uzay Teleskobu", "James Webb Uzay Teleskobu"]);

  // Sağ Kart: Yer Tabanlı Teleskoplar
  assert.equal(slide10.rightCard.title, "YER TABANLI TELESKOPLAR");
  assert.equal(slide10.rightCard.desc, "Yeryüzüne yerleştirilen teleskoplardır.");
  assert.equal(slide10.rightCard.detail, "Bakım ve yenilenmeleri daha kolaydır ancak atmosfer ve ışık kirliliği gözlemleri olumsuz etkileyebilir.");
  assert.equal(slide10.rightCard.comparison, "Bakım ve yenileme daha kolay");

  // Görsellerin varlığı
  await access(slide10.leftCard.image.replace(/^\.\//, ""));
  await access(slide10.rightCard.image.replace(/^\.\//, ""));

  // CSS Kuralları
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-space-teleskop-cesitleri"), "Slayt 10 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".teleskop-cesitleri-grid"), "İki kartlı grid tanımlı olmalıdır");
  assert.ok(css.includes(".karsilastirma-card-title {\n  font-size: 36px;\n  font-weight: 700;"), "Kart başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".karsilastirma-main-desc {\n  font-size: 36px;\n  font-weight: 600;"), "Ana açıklamalar 36px olmalıdır");
  assert.ok(css.includes(".karsilastirma-second-info {\n  font-size: 30px;"), "İkincil bilgiler 30px (30-32px) olmalıdır");
  assert.ok(css.includes(".example-name {\n  font-size: 30px;"), "Örnek teleskop adları 30px (30-32px) olmalıdır");
  assert.ok(css.includes(".comparison-text {\n  font-size: 30px;"), "Karşılaştırma avantajı 30px (30-32px) olmalıdır");
});

test("Slayt 11 (Gözlemevi Nerelere Kurulur?) Sözleşme, MEB Kriterleri ve Etkileşim CSS Doğrulaması", async () => {
  const lessonData = await readJson("data/lessons/uzay-arastirmalari.json");
  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  const slide11 = slides[10];

  assert.ok(slide11, "Slayt 11 mevcut olmalıdır");
  assert.equal(slide11.id, "slide_11_gozlemevi_nerelere_kurulur");
  assert.equal(slide11.layout, "space_gozlemevi_nerelere_kurulur");
  assert.equal(slide11.title, "Gözlemevi Nerelere Kurulur?");
  assert.equal(slide11.definition, "Teleskopların yerleştirildiği kubbe benzeri yapılara gözlemevi (rasathane) denir.");

  // MEB Kriterleri
  const expectedCriteria = [
    "Yerleşim merkezlerinden uzak",
    "Işık kirliliğinin az olduğu",
    "Hava koşullarının uygun olduğu",
    "Yüksek rakımlı",
    "Deprem kuşaklarından uzak",
    "TV ve radyo yayınlarından uzak"
  ];
  assert.deepEqual(slide11.criteria, expectedCriteria, "6 MEB kriteri eksiksiz olmalıdır");

  // Karşılaştırma Etkileşimi
  assert.equal(slide11.comparisonQuestion.question, "Gözlemevi kurmak için hangisi daha uygundur?");
  assert.equal(slide11.comparisonQuestion.correctOption, "B");
  assert.equal(slide11.comparisonQuestion.feedback, "Yüksek, karanlık ve yerleşim merkezlerinden uzak bölgeler gözlem için daha uygundur.");
  assert.equal(slide11.comparisonQuestion.options.length, 2);
  assert.equal(slide11.comparisonQuestion.options[0].id, "A");
  assert.equal(slide11.comparisonQuestion.options[1].id, "B");

  // Görseller
  await access(slide11.observatoryImage.replace(/^\.\//, ""));
  await access(slide11.comparisonQuestion.options[0].image.replace(/^\.\//, ""));
  await access(slide11.comparisonQuestion.options[1].image.replace(/^\.\//, ""));

  // CSS Kuralları
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-space-gozlemevi-nerelere-kurulur"), "Slayt 11 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".gozlemevi-tanim-p {\n  font-size: 36px;"), "Tanım metni 36px olmalıdır");
  assert.ok(css.includes(".criteria-text {\n  font-size: 30px;\n  font-weight: 700;"), "Özellik etiketleri 30px (30-32px) olmalıdır");
  assert.ok(css.includes(".gozlemevi-question-text {\n  font-size: 36px;\n  font-weight: 800;"), "Soru 36px olmalıdır");
  assert.ok(css.includes(".choice-title {\n  font-size: 36px;\n  font-weight: 700;"), "Seçenek başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".gozlemevi-feedback-text {\n  font-size: 32px;\n  font-weight: 700;"), "Geri bildirim 32px (30-32px) olmalıdır");
});

test("Slayt 12 (Uzay Teknolojilerinin Günlük Hayattaki Kullanımı) Sözleşme ve Tipografi CSS Doğrulaması", async () => {
  const lessonData = await readJson("data/lessons/uzay-arastirmalari.json");
  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  const slide12 = slides[11];

  assert.equal(slide12.id, "slide_12_uzay_teknolojileri_gunluk_hayat");
  assert.equal(slide12.layout, "space_uzay_teknolojileri_gunluk_hayat");
  assert.equal(slide12.title, "Uzay Teknolojilerinin Günlük Hayattaki Kullanımı");

  // 6 Alan sırası ve başlıkları
  assert.equal(slide12.areas?.length, 6, "6 adet teknoloji alanı bulunmalıdır");
  const expectedTitles = ["SAĞLIK", "İLETİŞİM", "GIDA", "ENDÜSTRİ", "ULAŞIM", "ENERJİ"];
  for (let i = 0; i < expectedTitles.length; i++) {
    assert.equal(slide12.areas[i].order, i + 1);
    assert.equal(slide12.areas[i].title, expectedTitles[i]);
    assert.ok(slide12.areas[i].desc?.length > 0);
    // Görseller mevcut olmalı
    await access(slide12.areas[i].image.replace(/^\.\//, ""));
    const st = await stat(slide12.areas[i].image.replace(/^\.\//, ""));
    assert.ok(st.size > 0, `${slide12.areas[i].title} görseli boş olamaz`);
  }

  // reveal_fill etkileşimi
  assert.equal(slide12.interactions?.length, 1);
  const inter = slide12.interactions[0];
  assert.equal(inter.type, "reveal_fill");
  assert.ok(inter.template.includes("{alanda}"));
  assert.equal(inter.blanks[0].answer, "alanda");

  // CSS Kuralları
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-space-uzay-teknolojileri-gunluk-hayat"), "Slayt 12 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".tech-card-title {\n  font-size: 36px;\n  font-weight: 800;"), "Kart başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".tech-card-desc {\n  font-size: 36px;"), "Kart açıklamaları 36px olmalıdır");
});

test("Slayt 13 (Işık Kirliliği) Sözleşme, Karşılaştırma ve Tipografi CSS Doğrulaması", async () => {
  const lessonData = await readJson("data/lessons/uzay-arastirmalari.json");
  const slides = lessonData.stages.flatMap((stage) => stage.slides || []);
  const slide13 = slides[12];

  assert.equal(slide13.id, "slide_13_isik_kirliligi");
  assert.equal(slide13.layout, "space_isik_kirliligi");
  assert.equal(slide13.title, "Işık Kirliliği");
  assert.equal(slide13.interactions, undefined, "Slayt 13 etkileşimsiz anlatım slaytı olmalıdır");

  // Tanım
  assert.equal(slide13.definition, "Işık kaynaklarının yanlış yerde, yanlış yönde, yanlış zamanda veya gereğinden fazla kullanılması ışık kirliliğine neden olur.");

  // Karşılaştırma görselleri
  assert.ok(slide13.comparison?.left?.image);
  assert.ok(slide13.comparison?.right?.image);
  await access(slide13.comparison.left.image.replace(/^\.\//, ""));
  await access(slide13.comparison.right.image.replace(/^\.\//, ""));

  // 3 Sonuç maddesi
  assert.equal(slide13.consequences?.length, 3);
  assert.equal(slide13.consequences[0], "Yıldızların görülmesini zorlaştırır.");
  assert.equal(slide13.consequences[1], "Teleskop gözlemlerini olumsuz etkiler.");
  assert.equal(slide13.consequences[2], "Gözlemevlerinin yerleşim yerlerinden uzak kurulmasını gerektirir.");

  // Vurgu
  assert.equal(slide13.highlight, "Işık kirliliği azaldıkça gökyüzü gözlemleri daha net yapılır.");

  // CSS Kuralları
  const css = await readFile("src/styles/app.css", "utf8");
  assert.ok(css.includes(".slide-space-isik-kirliligi"), "Slayt 13 ana sınıfı tanımlı olmalıdır");
  assert.ok(css.includes(".isik-tanim-p {\n  font-size: 36px;"), "Tanım 36px olmalıdır");
  assert.ok(css.includes(".isik-card-title {\n  font-size: 36px;\n  font-weight: 800;"), "Karşılaştırma kart başlıkları 36px bold olmalıdır");
  assert.ok(css.includes(".isik-consequence-text {\n  font-size: 36px;\n  font-weight: 700;"), "Sonuç maddeleri 36px olmalıdır");
  assert.ok(css.includes(".isik-highlight-text {\n  font-size: 36px;\n  font-weight: 800;"), "Vurgu metni 36px bold olmalıdır");
});
