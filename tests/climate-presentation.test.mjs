import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("8. Sınıf İklim ve Hava Hareketleri kapak ve atmosfer slaytları doğrulaması", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);
  const css = await readFile("src/styles/app.css", "utf8");

  assert.equal(lesson.title, "İklim ve Hava Hareketleri");
  assert.equal(slides.length, 8, "Ders kapak, atmosfer, hava olayları, ölçüm araçları, basınç ve rüzgâr slaytları olmak üzere 8 slayt olmalıdır");

  const cover = slides[0];
  assert.equal(cover.id, "slide_1_kapak");
  assert.equal(cover.type, "cover");
  assert.equal(cover.layout, "climate_cover");
  assert.equal(cover.title, "İklim ve Hava Hareketleri");
  assert.equal(cover.kicker, "8. Sınıf Fen Bilimleri");
  assert.equal(cover.subtitle, "Mevsimler ve İklim Ünitesi");
  assert.equal(cover.label, undefined, "CanFenci alt etiketi kapaktan kaldırılmış olmalıdır");
  assert.deepEqual(cover.interactions, [], "Kapak slaytında etkileşim olmamalıdır");

  const imagePath = cover.media[0].src.replace(/^\.\//, "");
  await access(imagePath);

  assert.ok(css.includes(".slide-climate-cover"), "Kapak slaytı CSS'i mevcut olmalıdır");
  assert.ok(css.includes("font-size: 64px"), "Ana başlık 56-64px aralığında, güçlü 64px olmalıdır");
  assert.ok(css.includes("font-size: 36px"), "Üst bilgi 32-36px aralığında olmalıdır");
  assert.ok(css.includes("font-size: 38px"), "Alt bilgi 34-38px aralığında olmalıdır");
  assert.ok(css.includes("color: #0a2540"), "Başlık koyu lacivert tonla verilmelidir");
  assert.ok(css.includes("rgba(240, 249, 255, 0.9)"), "Sarı vurgu yerine mavi tonlu rozet sistemi kullanılmalıdır");
  assert.ok(!css.includes("background: #fff3a6"), "Sarı vurgu sistemi kaldırılmış olmalıdır");

  const atmosphere = slides[1];
  assert.equal(atmosphere.id, "slide_2_atmosfer");
  assert.equal(atmosphere.type, "content");
  assert.equal(atmosphere.layout, "climate_atmosphere");
  assert.equal(atmosphere.title, "ATMOSFER");
  assert.equal(atmosphere.definitionTitle, undefined, "Atmosfer Nedir? başlığı kaldırılmış olmalıdır");
  assert.equal(atmosphere.definition, "Dünya’nın etrafını saran gaz tabakasına atmosfer denir.");
  assert.deepEqual(atmosphere.duties, [
    "Güneş’ten gelen zararlı ışınların bir bölümünü süzer.",
    "Dünya’nın aşırı ısınıp soğumasını sınırlar."
  ]);
  assert.deepEqual(atmosphere.composition, [
    { value: "%78", label: "AZOT" },
    { value: "%21", label: "OKSİJEN" },
    { value: "%1", label: "DİĞER GAZLAR" }
  ]);
  assert.equal(atmosphere.bottomInfo, "Su buharı ve karbondioksit, hava olaylarının oluşmasında önemli rol oynar.");
  assert.equal(atmosphere.interactions?.length, 1, "Slayt 2'de yalnızca 1 etkileşim olmalıdır");
  assert.equal(atmosphere.interactions[0].type, "reveal_fill");
  assert.equal(atmosphere.interactions[0].template, "Dünya’nın etrafını saran gaz tabakasına {blank1} denir.");
  assert.equal(atmosphere.interactions[0].blanks?.[0]?.answer, "atmosfer");

  const atmosphereImagePath = atmosphere.media[0].src.replace(/^\.\//, "");
  await access(atmosphereImagePath);

  assert.ok(css.includes(".slide-climate-atmosphere"), "Slayt 2 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("grid-template-columns: 55fr 45fr"), "Slayt 2 sol/sağ ana bölge oranı tanımlı olmalıdır");
  assert.ok(css.includes(".climate-card"), "Kart sistemi ana tasarım dili olarak tanımlı olmalıdır");
  assert.ok(css.includes("font-size: 56px"), "Sayfa başlığı 56px olmalıdır");
  assert.ok(css.includes("font-size: 46px"), "Kart başlıkları 46px olmalıdır");
  assert.ok(css.includes("font-size: 44px"), "Tanım 44px olmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Ana öğretim metinleri ve grafik etiketleri 40px olmalıdır");
  assert.ok(css.includes("color: #D8362A"), "Slayt 2 başlıkları kırmızı olmalıdır");
  assert.ok(css.includes("text-decoration: none"), "Klasik underline kullanılmamalıdır");
  assert.ok(css.includes(".climate-slide-title::after"), "Ana başlık için modern kısa alt çizgi olmalıdır");
  assert.ok(css.includes(".climate-composition-card h2::after"), "Havanın Bileşimi başlığı için kısa alt çizgi olmalıdır");
  assert.ok(css.includes("height: 6px"), "Ana başlık alt çizgisi 4-6px aralığında olmalıdır");
  assert.ok(css.includes("height: 5px"), "Kart başlığı alt çizgisi 4-6px aralığında olmalıdır");
  assert.ok(css.includes("margin-top: 10px"), "Başlık ile alt çizgi arasında 8-12px boşluk olmalıdır");
  assert.ok(css.includes(".climate-definition-slot .reveal-fill-sentence"), "Tanım kartı reveal_fill etkileşimini kullanmalıdır");
  assert.ok(css.includes(".climate-definition-slot .blank-slot-answer"), "Reveal cevabı özel tipografi ile görünmelidir");
  assert.ok(css.includes("conic-gradient(#0a3b70 0deg 280.8deg, #38bdf8 280.8deg 356.4deg, #dbe4ec 356.4deg 360deg)"), "Havanın bileşimi donut chart oranları doğru olmalıdır");

  const weather = slides[2];
  assert.equal(weather.id, "slide_3_hava_olaylari");
  assert.equal(weather.type, "content");
  assert.equal(weather.layout, "climate_weather_events");
  assert.equal(weather.title, "HAVA OLAYLARI");
  assert.equal(weather.interactions?.length, 1, "Slayt 3'te yalnızca 1 etkileşim olmalıdır");
  assert.equal(weather.interactions[0].type, "reveal_fill");
  assert.equal(weather.interactions[0].blanks?.[0]?.answer, "hava olayları");
  assert.deepEqual(weather.weatherEvents?.map((item) => item.label), ["YAĞMUR", "KAR", "DOLU", "RÜZGÂR", "SİS", "KIRAĞI"]);
  assert.deepEqual(weather.causeCards?.map((item) => item.title), ["NEM", "SICAKLIK FARKI", "BASINÇ FARKI"]);

  for (const event of weather.weatherEvents ?? []) {
    assert.ok(event.image, `${event.label} için yerel görsel yolu tanımlı olmalıdır`);
    await access(event.image.replace(/^\.\//, ""));
  }

  assert.ok(css.includes(".slide-climate-weather-events"), "Slayt 3 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".climate-weather-definition-slot .reveal-fill-sentence"), "Slayt 3 tanım kartı reveal_fill kullanmalıdır");
  assert.ok(css.includes(".climate-weather-img"), "Slayt 3 hava olayları doğrudan img etiketiyle yüklenmelidir");
  assert.ok(css.includes("grid-template-columns: 43fr 57fr"), "Slayt 3 sol tanım ve sağ görsel oranları tanımlı olmalıdır");
  assert.ok(css.includes("grid-template-columns: repeat(3, 1fr)"), "Slayt 3 görsel matrisi ve neden kartları 3 sütun olmalıdır");
  assert.ok(css.includes("background: #EAF4FF"), "Tanım kartı pastel mavi olmalıdır");
  assert.ok(css.includes("background: #E6F7F5"), "Nem kartı pastel turkuaz olmalıdır");
  assert.ok(css.includes("background: #FFF0E6"), "Sıcaklık farkı kartı pastel şeftali olmalıdır");
  assert.ok(css.includes("background: #F2ECFF"), "Basınç farkı kartı pastel lila olmalıdır");

  const meteorology = slides[3];
  assert.equal(meteorology.id, "slide_4_meteoroloji_ve_olcum_araclari");
  assert.equal(meteorology.layout, "climate_meteorology_tools");
  assert.equal(meteorology.title, "METEOROLOJİ VE ÖLÇÜM ARAÇLARI");
  assert.deepEqual(meteorology.concepts?.map((item) => item.title), ["METEOROLOJİ", "METEOROLOG"]);
  assert.deepEqual(meteorology.tools?.map((item) => item.title), ["TERMOMETRE", "HİGROMETRE", "BAROMETRE", "ANEMOMETRE"]);
  assert.deepEqual(meteorology.interactions, []);
  for (const tool of meteorology.tools ?? []) {
    assert.ok(tool.image, `${tool.title} için yerel görsel yolu tanımlı olmalıdır`);
    await access(tool.image.replace(/^\.\//, ""));
  }
  assert.ok(css.includes(".slide-climate-meteorology-tools"), "Slayt 4 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("grid-template-columns: repeat(2, 1fr)"), "Slayt 4 araç kartları 2x2 grid olmalıdır");
  assert.ok(css.includes("font-size: 42px"), "Slayt 4 araç başlıkları 42px olmalıdır");

  const pressureFormation = slides[4];
  assert.equal(pressureFormation.id, "slide_5_basinc_alanlari");
  assert.equal(pressureFormation.layout, "climate_pressure_formation");
  assert.deepEqual(pressureFormation.process, ["SICAKLIK DEĞİŞİR", "HAVA YOĞUNLUĞU DEĞİŞİR", "BASINÇ ALANI OLUŞUR"]);
  assert.deepEqual(pressureFormation.interactions, []);
  assert.deepEqual(pressureFormation.areas?.map((item) => item.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ"]);
  assert.deepEqual(pressureFormation.comparison?.map((item) => item.text), ["Sıcaklık ↑  →  Basınç ↓", "Sıcaklık ↓  →  Basınç ↑"]);
  for (const area of pressureFormation.areas ?? []) await access(area.image.replace(/^\.\//, ""));

  const pressureComparison = slides[5];
  assert.equal(pressureComparison.id, "slide_6_basinc_karsilastirmasi");
  assert.equal(pressureComparison.layout, "climate_pressure_comparison");
  assert.equal(pressureComparison.interactions?.length, 0);
  assert.equal(pressureComparison.title, "ALÇAK BASINÇ ve YÜKSEK BASINÇ KARŞILAŞTIRMASI");
  assert.deepEqual(pressureComparison.areas?.[0]?.points, [
    "Sıcaktır",
    "Hava yoğunluğu azdır",
    "Nem oranı fazla",
    "Yağış ihtimali fazla",
    "Gökyüzü kapalı ve bulutlu",
    "Yükselici hava hareketi",
    "Çevreden merkeze doğru"
  ]);
  assert.deepEqual(pressureComparison.areas?.[1]?.points, [
    "Soğuktur",
    "Hava yoğunluğu fazladır",
    "Nem oranı az",
    "Yağış ihtimali az",
    "Gökyüzü açık",
    "Alçalıcı hava hareketi",
    "Merkezden çevreye doğru"
  ]);
  for (const area of pressureComparison.areas ?? []) await access(area.image.replace(/^\.\//, ""));
  assert.ok(css.includes(".slide-climate-pressure-formation"), "Slayt 5 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".slide-climate-pressure-comparison"), "Slayt 6 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".climate-pressure-process-arrow"), "Slayt 5 süreç okları mevcut olmalıdır");

  const windFormation = slides[6];
  assert.equal(windFormation.id, "slide_7_ruzgar_nasil_olusur");
  assert.equal(windFormation.layout, "climate_wind_formation");
  assert.equal(windFormation.definition, "Yatay yönde gerçekleşen hava hareketine rüzgâr denir.");
  assert.equal(windFormation.windDirection, "YÜKSEK BASINÇ → ALÇAK BASINÇ");
  assert.deepEqual(windFormation.interactions, []);
  await access(windFormation.media[0].src.replace(/^\.\//, ""));
  assert.ok(css.includes(".slide-climate-wind-formation"), "Slayt 7 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".climate-wind-flow"), "Slayt 7 rüzgâr yönü akışı mevcut olmalıdır");
  assert.ok(css.includes(".climate-wind-area h2"), "Slayt 7 basınç kartı başlıkları mevcut olmalıdır");
  assert.ok(css.includes("grid-template-rows: auto auto 190px minmax(0, 1fr) 112px"), "Slayt 7 üst akış alanı için nefes alanı korunmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Slayt 7 ana tanımı 40px olmalıdır");
  assert.ok(css.includes("font-size: 36px"), "Slayt 7 yardımcı başlık ve yön metinleri 36px olmalıdır");
  assert.ok(css.includes("font-size: 33px"), "Slayt 7 yardımcı kart açıklamaları küçültülmelidir");

  const windApplication = slides[7];
  assert.equal(windApplication.id, "slide_8_basinc_ve_ruzgar_uygulamasi");
  assert.equal(windApplication.layout, "climate_wind_application");
  assert.equal(windApplication.interactions?.length, 10);
  assert.deepEqual(windApplication.interactions.map((item) => item.blanks?.[0]?.answer), ["K", "K", "L", "K", "L", "L", "K", "K", "L", "L"]);
  await access(windApplication.media[0].src.replace(/^\.\//, ""));
  assert.ok(css.includes(".slide-climate-wind-application"), "Slayt 8 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("grid-template-rows: auto 360px minmax(0, 1fr)"), "Slayt 8 görsel alanı tam görünüm için yeterli yüksekliğe sahip olmalıdır");
  assert.ok(css.includes("object-fit: contain"), "Slayt 8 uygulama görseli kırpılmadan görünmelidir");
  assert.ok(css.includes("width: min(720px, 100%)"), "Slayt 8 görseli kutu içinde sabit oranlı ve taşmasız görünmelidir");
  assert.ok(css.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"), "Slayt 8 uygulama sütunları taşmasız eşit genişlikte olmalıdır");
  assert.ok(css.includes(".climate-wind-reveal-row"), "Slayt 8 bağımsız reveal satırları mevcut olmalıdır");
  assert.ok(css.includes("font-size: 34px"), "Slayt 8 uygulama maddeleri 32-36px aralığında olmalıdır");
  assert.ok(css.includes("white-space: normal"), "Slayt 8 uygulama maddeleri kontrollü satır kırabilmelidir");
});
