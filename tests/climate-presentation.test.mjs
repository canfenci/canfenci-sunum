import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("8. Sınıf İklim ve Hava Hareketleri 25 slaytlık öğretim akışı", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);
  const css = await readFile("src/styles/app.css", "utf8");
  const renderer = await readFile("src/ui/climate-slides.js", "utf8");

  assert.equal(lesson.title, "İklim ve Hava Hareketleri");
  assert.equal(slides.length, 25, "Yeni öğretim akışı 25 slayt olmalıdır");
  assert.deepEqual(slides.slice(0, 3).map((slide) => slide.id), ["slide_1_kapak", "slide_2_atmosfer", "slide_3_hava_olaylari"]);
  assert.deepEqual(slides.slice(0, 3).map((slide) => slide.layout), ["climate_cover", "climate_atmosphere", "climate_weather_events"]);

  const expectedLayouts = [
    "climate_tool_match", "climate_notebook", "climate_pressure_notebook", "climate_notebook",
    "climate_pressure_toggle", "climate_notebook", "climate_wind_predict", "climate_notebook",
    "climate_wind_application", "climate_breeze_toggle", "climate_breeze_toggle", "climate_notebook",
    "climate_precipitation_classify", "climate_notebook", "climate_climate_hero", "climate_notebook",
    "climate_type_selector", "climate_weather_quiz", "climate_notebook", "climate_greenhouse_reveal",
    "climate_chain_reveal", "climate_notebook"
  ];
  assert.deepEqual(slides.slice(3).map((slide) => slide.layout), expectedLayouts);
  assert.deepEqual(lesson.stages.map((stage) => stage.order), Array.from({ length: 25 }, (_, index) => index + 1));

  const notebookNumbers = [5, 7, 9, 11, 15, 17, 19, 22, 25];
  for (const number of notebookNumbers) {
    const slide = slides[number - 1];
    assert.equal(slide.layout, "climate_notebook", `Slayt ${number} notebook özeti olmalıdır`);
    assert.deepEqual(slide.interactions, [], `Slayt ${number} etkileşimsiz olmalıdır`);
  }

  const interactiveTypes = new Map([
    [4, "match"], [8, "toggle"], [10, "progressive_reveal"],
    [13, "toggle"], [14, "toggle"], [16, "classify"], [20, "selector"],
    [21, "binary_classify"], [23, "progressive_reveal"], [24, "progressive_reveal"]
  ]);
  for (const [number, type] of interactiveTypes) {
    assert.equal(slides[number - 1].interactions?.[0]?.type, type, `Slayt ${number} ${type} etkileşimini kullanmalıdır`);
  }

  const toolSlide = slides[3];
  assert.deepEqual(toolSlide.tools.map((tool) => tool.measure), ["Sıcaklık", "Nem", "Basınç", "Rüzgâr"]);
  for (const tool of toolSlide.tools) await access(tool.image.replace(/^\.\//, ""));

  const pressureNotebook = slides[5];
  assert.equal(pressureNotebook.title, "BASINÇ OLUŞUMU");
  assert.deepEqual(pressureNotebook.interactions, []);
  assert.deepEqual(pressureNotebook.cards.map((card) => card.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ", "SICAKLIK / BASINÇ", "HAVA HAREKETİ"]);
  assert.ok(pressureNotebook.cards.every((card) => card.lines.length >= 2));

  const pressureToggle = slides[7];
  assert.deepEqual(pressureToggle.modes.map((mode) => mode.title), ["ALÇAK BASINÇ", "YÜKSEK BASINÇ"]);
  assert.ok(pressureToggle.modes.every((mode) => mode.facts.length === 7));

  const windApplication = slides[11];
  assert.equal(windApplication.interactions.length, 10);
  assert.ok(windApplication.interactions.every((item) => item.type === "reveal_fill"));
  assert.deepEqual(windApplication.interactions.map((item) => item.blanks[0].answer), ["K", "K", "L", "K", "L", "L", "K", "K", "L", "L"]);
  await access(windApplication.media[0].src.replace(/^\.\//, ""));

  assert.deepEqual(slides[12].modes.map((mode) => mode.direction), ["Deniz → Kara", "Kara → Deniz"]);
  assert.deepEqual(slides[13].modes.map((mode) => mode.direction), ["Vadi → Dağ", "Dağ → Vadi"]);
  assert.deepEqual(slides[15].items.filter((item) => item.category === "atmosfer").map((item) => item.label), ["Yağmur", "Kar", "Dolu"]);
  assert.deepEqual(slides[15].items.filter((item) => item.category === "yeryuzu").map((item) => item.label), ["Çiy", "Kırağı", "Sis"]);

  assert.deepEqual(slides[16].precipitationTypes.map((item) => item.title), ["YAĞMUR", "KAR", "DOLU", "KIRAĞI", "ÇİY", "SİS"]);
  assert.equal(slides[16].media, undefined);
  assert.match(slides[17].definition, /uzun yıllar boyunca/);
  assert.deepEqual(slides[19].climateTypes.map((item) => item.title), ["AKDENİZ", "KARADENİZ", "KARASAL"]);

  const weatherQuiz = slides[20];
  assert.equal(weatherQuiz.items.length, 10, "PDF'deki 10 H/İ ifadesi korunmalıdır");
  assert.deepEqual(weatherQuiz.items.map((item) => item.answer), ["H", "İ", "H", "İ", "H", "H", "İ", "İ", "H", "İ"]);
  assert.equal(slides[22].steps.length, 4, "Sera etkisi dört aşamada anlatılmalıdır");
  assert.deepEqual(slides[23].groups.map((group) => group.title), ["NEDENLER", "SONUÇLAR", "ÖNLEMLER"]);
  assert.ok(slides[23].groups.every((group) => group.items.length <= 5));
  assert.match(slides[24].note, /Kyoto Protokolü/);

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
  assert.ok(css.includes("grid-template-rows: repeat(2, minmax(0, 1fr))"), "Slayt 6 iki eşit satır kullanmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Notebook ana metinleri 40px olmalıdır");
  assert.ok(css.includes(".climate-segmented-control"), "Toggle slaytlarında segmented control bulunmalıdır");
  assert.ok(css.includes("transition: 280ms ease"), "Etkileşim animasyonları 200-350ms aralığında olmalıdır");
  assert.ok(css.includes(".climate-weather-quiz-grid"), "H/İ mini etkinliği CSS'i bulunmalıdır");
  assert.ok(renderer.includes("case \"climate_tool_match\""));
  assert.ok(renderer.includes("case \"climate_greenhouse_reveal\""));
  assert.ok(renderer.includes("registerLocalInteraction"), "Yerel etkileşimler sunum reset yaşam döngüsüne bağlanmalıdır");
});
