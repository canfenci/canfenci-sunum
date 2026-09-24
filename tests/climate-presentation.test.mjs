import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("8. Sınıf İklim ve Hava Hareketleri 24 slaytlık öğretim akışı", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);
  const css = await readFile("src/styles/app.css", "utf8");
  const renderer = await readFile("src/ui/climate-slides.js", "utf8");

  assert.equal(lesson.title, "İklim ve Hava Hareketleri");
  assert.equal(slides.length, 24, "Slayt 9 kaldırıldıktan sonra akış 24 slayt olmalıdır");
  assert.deepEqual(slides.slice(0, 3).map((slide) => slide.id), ["slide_1_kapak", "slide_2_atmosfer", "slide_3_hava_olaylari"]);
  assert.deepEqual(slides.slice(0, 3).map((slide) => slide.layout), ["climate_cover", "climate_atmosphere", "climate_weather_events"]);
  assert.ok(!slides.some((slide) => slide.id.includes("basinc_karsilastirmasi_ozeti")), "Tekrar eden basınç karşılaştırması slaytı kaldırılmış olmalıdır");

  const expectedLayouts = [
    "climate_tool_match", "climate_notebook_cards", "climate_pressure_notebook", "climate_notebook_cards",
    "climate_pressure_toggle", "climate_wind_predict", "climate_notebook_cards",
    "climate_wind_application", "climate_breeze_toggle", "climate_breeze_toggle", "climate_notebook_cards",
    "climate_precipitation_classify", "climate_notebook", "climate_climate_types", "climate_notebook_cards",
    "climate_turkey_map", "climate_weather_quiz", "climate_weather_climate_table", "climate_greenhouse_reveal",
    "climate_chain_reveal", "climate_global_visual_summary"
  ];
  assert.deepEqual(slides.slice(3).map((slide) => slide.layout), expectedLayouts);
  assert.deepEqual(lesson.stages.map((stage) => stage.order), Array.from({ length: 24 }, (_, index) => index + 1));

  const notebookNumbers = [10, 14, 16, 18];
  for (const number of notebookNumbers) {
    const slide = slides[number - 1];
    assert.ok(["climate_notebook", "climate_notebook_cards"].includes(slide.layout), `Slayt ${number} notebook özeti olmalıdır`);
    assert.deepEqual(slide.interactions, [], `Slayt ${number} etkileşimsiz olmalıdır`);
  }

  const interactiveTypes = new Map([
    [4, "match"], [8, "toggle"], [9, "progressive_reveal"],
    [12, "toggle"], [13, "toggle"], [15, "classify"],
    [20, "binary_classify"], [22, "progressive_reveal"], [23, "progressive_reveal"]
  ]);
  for (const [number, type] of interactiveTypes) {
    assert.equal(slides[number - 1].interactions?.[0]?.type, type, `Slayt ${number} ${type} etkileşimini kullanmalıdır`);
  }

  const toolSlide = slides[3];
  assert.deepEqual(toolSlide.tools.map((tool) => tool.measure), ["Sıcaklık", "Nem", "Basınç", "Rüzgâr"]);
  for (const tool of toolSlide.tools) await access(tool.image.replace(/^\.\//, ""));

  const meteorologyNotebook = slides[4];
  assert.equal(meteorologyNotebook.layout, "climate_notebook_cards");
  assert.equal(meteorologyNotebook.title, "METEOROLOJİ VE ÖLÇÜM ARAÇLARI");
  assert.deepEqual(meteorologyNotebook.interactions, []);
  assert.deepEqual(meteorologyNotebook.cards.map((card) => card.title), ["METEOROLOJİ", "METEOROLOG", "SICAKLIK / NEM", "BASINÇ / RÜZGÂR"]);
  assert.deepEqual(meteorologyNotebook.cards.flatMap((card) => card.lines), [
    "Hava olaylarını inceleyen bilim dalıdır.",
    "Hava olaylarıyla ilgilenen bilim insanıdır.",
    "Termometre → Sıcaklık",
    "Higrometre → Nem",
    "Barometre → Basınç",
    "Anemometre → Rüzgâr"
  ]);

  const pressureNotebook = slides[5];
  assert.equal(pressureNotebook.title, "BASINÇ OLUŞUMU");
  assert.deepEqual(pressureNotebook.interactions, []);
  assert.deepEqual(pressureNotebook.cards.map((card) => card.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ", "SICAKLIK / BASINÇ", "HAVA HAREKETİ"]);
  assert.ok(pressureNotebook.cards.every((card) => card.lines.length >= 2));

  const pressureComparisonNotebook = slides[6];
  assert.equal(pressureComparisonNotebook.layout, "climate_notebook_cards");
  assert.equal(pressureComparisonNotebook.title, "ALÇAK BASINÇ VE YÜKSEK BASINÇ");
  assert.deepEqual(pressureComparisonNotebook.interactions, []);
  assert.deepEqual(pressureComparisonNotebook.cards.map((card) => card.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ"]);
  assert.ok(pressureComparisonNotebook.cards.every((card) => card.lines.length === 7));
  assert.ok(!JSON.stringify(pressureComparisonNotebook).includes("HIZLI HATIRLAMA"));

  const pressureToggle = slides[7];
  assert.deepEqual(pressureToggle.modes.map((mode) => mode.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ"]);
  assert.ok(pressureToggle.modes.every((mode) => mode.facts.length === 7));

  const windSummary = slides[9];
  assert.equal(windSummary.layout, "climate_notebook_cards");
  assert.deepEqual(windSummary.cards.map((card) => card.title), ["RÜZGÂR NEDİR?", "RÜZGÂRIN YÖNÜ", "RÜZGÂRIN HIZI"]);
  assert.ok(JSON.stringify(windSummary).includes("Basınç farkı arttıkça rüzgârın hızı artar."));

  const windApplication = slides[10];
  assert.equal(windApplication.interactions.length, 10);
  assert.ok(windApplication.interactions.every((item) => item.type === "reveal_fill"));
  assert.deepEqual(windApplication.interactions.map((item) => item.blanks[0].answer), ["K", "K", "L", "K", "L", "L", "K", "K", "L", "L"]);
  await access(windApplication.media[0].src.replace(/^\.\//, ""));

  assert.deepEqual(slides[11].modes.map((mode) => mode.direction), ["Deniz → Kara", "Kara → Deniz"]);
  assert.deepEqual(slides[12].modes.map((mode) => mode.direction), ["Vadi → Dağ", "Dağ → Vadi"]);

  const breezeSummary = slides[13];
  assert.equal(breezeSummary.layout, "climate_notebook_cards");
  assert.deepEqual(breezeSummary.cards.map((card) => card.title), ["DENİZ MELTEMİ", "KARA MELTEMİ", "VADİ MELTEMİ", "DAĞ MELTEMİ"]);
  assert.ok(!JSON.stringify(breezeSummary).includes("→"), "Meltem özeti yönleri ok yerine yazıyla vermelidir");

  assert.deepEqual(slides[14].items.filter((item) => item.category === "atmosfer").map((item) => item.label), ["Yağmur", "Kar", "Dolu"]);
  assert.deepEqual(slides[14].items.filter((item) => item.category === "yeryuzu").map((item) => item.label), ["Çiy", "Kırağı", "Sis"]);

  assert.deepEqual(slides[15].precipitationTypes.map((item) => item.title), ["YAĞMUR", "KAR", "DOLU", "KIRAĞI", "ÇİY", "SİS"]);
  assert.equal(slides[15].media, undefined);

  const climateTypes = slides[16];
  assert.equal(climateTypes.layout, "climate_climate_types");
  assert.deepEqual(climateTypes.climateCards.map((item) => item.title), ["Kutup iklimi", "Çöl iklimi", "Akdeniz iklimi", "Karadeniz iklimi", "Karasal iklim"]);
  assert.equal(climateTypes.definition, undefined);
  assert.equal(climateTypes.concepts, undefined);
  assert.equal(climateTypes.image, undefined);

  const climateSummary = slides[17];
  assert.equal(climateSummary.layout, "climate_notebook_cards");
  assert.deepEqual(climateSummary.cards.map((card) => card.title), ["İKLİMİN TANIMI", "BİLİM DALI VE UZMANI", "İKLİMİ BELİRLEYEN ETMENLER"]);
  const turkeyClimate = slides[18];
  assert.equal(turkeyClimate.layout, "climate_turkey_map");
  assert.equal(turkeyClimate.image, "./assets/images/iklim-ve-hava-hareketleri/20-turkiye-iklim-haritasi.png");
  assert.deepEqual(turkeyClimate.cards.map((item) => item.title), ["Akdeniz iklimi", "Karadeniz iklimi", "Karasal iklim"]);
  assert.deepEqual(turkeyClimate.interactions, []);

  const weatherQuiz = slides[19];
  assert.equal(weatherQuiz.items.length, 10, "PDF'deki 10 H/İ ifadesi korunmalıdır");
  assert.deepEqual(weatherQuiz.items.map((item) => item.answer), ["H", "İ", "H", "İ", "H", "H", "İ", "İ", "H", "İ"]);

  const weatherClimateTable = slides[20];
  assert.equal(weatherClimateTable.layout, "climate_weather_climate_table");
  assert.deepEqual(weatherClimateTable.headers, ["Özellik", "Hava Olayları", "İklim"]);
  assert.deepEqual(weatherClimateTable.rows.map((row) => row.feature), ["Süre", "Etki alanı", "Değişim", "İnceleyen bilim dalı", "Uzman"]);

  assert.equal(slides[21].steps.length, 4, "Sera etkisi dört aşamada anlatılmalıdır");
  assert.deepEqual(slides[22].groups.map((group) => group.title), ["NEDENLER", "SONUÇLAR", "ÖNLEMLER"]);
  assert.ok(slides[22].groups.every((group) => group.items.length <= 5));
  assert.match(slides[23].note, /Kyoto Protokolü/);
  assert.equal(slides[23].layout, "climate_global_visual_summary");
  assert.deepEqual(slides[23].visualCards.map((card) => card.title), ["Kuraklık", "Çölleşme", "İklim etkileri"]);

  const localImages = slides.flatMap((slide) => [
    ...(slide.media ?? []).map((item) => item.src),
    ...(slide.tools ?? []).map((item) => item.image),
    ...(slide.scenes ?? []).map((item) => item.image),
    ...(slide.modes ?? []).map((item) => item.image),
    slide.image
  ]).filter(Boolean);
  for (const image of localImages) {
    assert.ok(!/^https?:/i.test(image), "Sunum dış URL kullanmamalıdır");
    await access(image.replace(/^\.\//, ""));
  }

  assert.ok(css.includes(".climate-notebook-badge"), "Notebook slaytlarında ortak badge bulunmalıdır");
  assert.ok(css.includes(".climate-pressure-notebook-grid"), "Slayt 6 özel 2x2 notebook gridi bulunmalıdır");
  assert.ok(css.includes(".climate-notebook-card-grid"), "Slayt 5 ve 7 defter kart gridi bulunmalıdır");
  assert.ok(css.includes(".slide-climate-notebook-cards.is-compare"), "Slayt 7 karşılaştırma düzeni bulunmalıdır");
  assert.ok(css.includes(".climate-types-overview-grid"), "İklim tipleri 5 kartlı görsel grid kullanmalıdır");
  assert.ok(css.includes(".climate-turkey-map-layout"), "Türkiye iklim slaytı harita ve kart düzeni kullanmalıdır");
  assert.ok(css.includes(".climate-comparison-table"), "Hava olayları/iklim slaytı tablo düzeni kullanmalıdır");
  assert.ok(css.includes(".climate-global-visual-grid"), "Küresel özet slaytı üç görsel alan kullanmalıdır");
  assert.ok(css.includes("grid-template-rows: repeat(2, minmax(0, 1fr))"), "Slayt 6 iki eşit satır kullanmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Notebook ana metinleri 40px olmalıdır");
  assert.ok(css.includes(".climate-segmented-control"), "Toggle slaytlarında segmented control bulunmalıdır");
  assert.ok(css.includes("transition: 280ms ease"), "Etkileşim animasyonları 200-350ms aralığında olmalıdır");
  assert.ok(css.includes(".climate-weather-quiz-grid"), "H/İ mini etkinliği CSS'i bulunmalıdır");
  assert.ok(renderer.includes("case \"climate_tool_match\""));
  assert.ok(renderer.includes("case \"climate_notebook_cards\""));
  assert.ok(renderer.includes("case \"climate_climate_types\""));
  assert.ok(renderer.includes("case \"climate_turkey_map\""));
  assert.ok(renderer.includes("case \"climate_weather_climate_table\""));
  assert.ok(renderer.includes("case \"climate_global_visual_summary\""));
  assert.ok(renderer.includes("case \"climate_greenhouse_reveal\""));
  assert.ok(renderer.includes("registerLocalInteraction"), "Yerel etkileşimler sunum reset yaşam döngüsüne bağlanmalıdır");
});
