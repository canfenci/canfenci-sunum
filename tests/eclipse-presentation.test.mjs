import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("6. Sınıf Güneş ve Ay Tutulmaları Ders Paketi", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/gunes-ve-ay-tutulmalari.json", "utf8"));
  const curriculum = JSON.parse(await readFile("data/curricula/maarif_model.json", "utf8"));
  const renderer = await readFile("src/ui/solar-system-slides.js", "utf8");
  const app = await readFile("src/app.js", "utf8");
  const css = await readFile("src/styles/app.css", "utf8");
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);

  assert.equal(lesson.id, "lesson_gunes_ve_ay_tutulmalari_1");
  assert.equal(lesson.title, "Güneş ve Ay Tutulmaları");
  assert.equal(lesson.gradeId, "grade_6");
  assert.equal(lesson.unitId, "solar_system_and_eclipses");
  assert.equal(lesson.topicId, "solar_and_lunar_eclipses");
  assert.equal(slides.length, 9);
  assert.equal(slides[0].layout, "eclipse_image_slide");
  assert.deepEqual(slides.slice(1, 4).map((slide) => slide.layout), [
    "eclipse_concept_slide",
    "eclipse_html_slide",
    "eclipse_html_slide"
  ]);
  assert.equal(slides[6].layout, "eclipse_types_slide");
  assert.ok([slides[4], slides[5], slides[7]].every((slide) => slide.layout === "eclipse_image_slide"));

  const topic = curriculum.units
    .find((unit) => unit.id === "solar_system_and_eclipses")
    ?.topics.find((item) => item.id === "solar_and_lunar_eclipses");
  assert.ok(topic, "Güneş ve Ay Tutulmaları topic bağlantısı bulunmalıdır");
  assert.equal(topic.workModes.presentation.source, "./data/lessons/gunes-ve-ay-tutulmalari.json");
  assert.equal(topic.lessons[0].id, "lesson_gunes_ve_ay_tutulmalari_1");

  const expectedImages = [
    "01-kapak.png",
    "02-tutulma-nedir.png",
    "03-gunes-tutulmasi.png",
    "04-ay-tutulmasi.png",
    "05-benzerlikler.png",
    "06-farkliliklar.png",
    "07-ay-tutulmasi-cesitleri.png",
    "08-bilim-insanlari.png"
  ].map((name) => `./assets/images/gunes-ve-ay-tutulmalari/${name}`);
  assert.deepEqual(slides.slice(0, 8).map((slide) => slide.media?.[0]?.src), expectedImages);
  for (const image of expectedImages) await access(image.replace(/^\.\//, ""));
  for (const diagram of ["02-sema.png", "03-sema.png", "04-sema.png"]) {
    await access(`assets/images/gunes-ve-ay-tutulmalari/diagrams/${diagram}`);
  }

  assert.deepEqual(slides.map((slide) => slide.interactions?.length ?? 0), [0, 5, 7, 8, 0, 0, 0, 0, 0]);
  assert.equal(slides[8].layout, "eclipse_video_slide");
  assert.equal(slides[8].media[0].src, "./assets/videos/gunes-ve-ay-tutulmalari/gunes-tutulmasi.mp4");
  for (const slide of slides.slice(1, 4)) {
    assert.ok(slide.interactions.every((interaction) => interaction.type === "reveal_fill"));
    assert.equal(slide.overlays.length, slide.interactions.length);
    assert.ok(slide.overlays.every((overlay) => typeof overlay.x === "number" && typeof overlay.y === "number"));
  }

  assert.deepEqual(slides[1].interactions.map((item) => item.blanks[0].answer), [
    "aynı doğrultuda",
    "gölge olayıdır",
    "Güneş tutulması",
    "Ay tutulması",
    "gölge"
  ]);
  assert.deepEqual(slides[2].interactions.map((item) => item.blanks[0].answer), [
    "girer",
    "Gündüz",
    "Yeni ay",
    "yeni ayda",
    "dar",
    "tehlikelidir",
    "Ay"
  ]);
  assert.deepEqual(slides[3].interactions.map((item) => item.blanks[0].answer), [
    "girer",
    "Gece",
    "Dolunay",
    "dolunayda",
    "geniş",
    "uzun",
    "Ay",
    "Dünya"
  ]);

  assert.ok(renderer.includes("case \"eclipse_image_slide\""));
  assert.ok(renderer.includes("case \"eclipse_html_slide\""));
  assert.ok(renderer.includes("case \"eclipse_concept_slide\""));
  assert.ok(renderer.includes("case \"eclipse_video_slide\""));
  assert.ok(renderer.includes("case \"eclipse_types_slide\""));
  assert.ok(renderer.includes("eclipseNativeContent"));
  assert.ok(renderer.includes("eclipseDiagramSources"));
  assert.ok(!renderer.includes("diagrams/02-sema.png"), "Slayt 2 PNG diyagramı kullanmamalıdır");
  assert.ok(renderer.includes("renderEclipseConceptDiagram"));
  assert.ok(app.includes('startsWith("eclipse_")'), "eclipse layout solar renderer'a yönlenmelidir");
  assert.ok(css.includes(".slide-eclipse-image"));
  assert.ok(css.includes(".eclipse-native-slide"));
  assert.ok(css.includes(".eclipse-native-reveal"));
  assert.ok(css.includes(".eclipse-concept-diagram"));
  assert.ok(css.includes(".eclipse-concept-slide"));
  assert.ok(css.includes(".eclipse-video-slide"));
  assert.ok(css.includes("object-fit: contain"));
  assert.ok(css.includes(".eclipse-types-slide"));
  assert.match(css, /\.eclipse-native-header h1[\s\S]*?font-size: 48px;/);
  assert.match(css, /\.eclipse-native-group-body p[\s\S]*?font-size: 42px;/);
  assert.ok(css.includes("grid-template-rows: repeat(3, minmax(0, 1fr))"));
  assert.ok(css.includes("object-fit: contain"));
  assert.ok(css.includes(".eclipse-reveal-slot .blank-slot-answer"));
  assert.match(css, /\.eclipse-reveal-slot \.reveal-fill-sentence \{[\s\S]*?display: inline-flex;[\s\S]*?align-items: baseline;/);
  assert.match(css, /\.eclipse-reveal-slot \.reveal-fill-blank,[\s\S]*?display: inline-flex;[\s\S]*?align-items: baseline;/);
  assert.match(css, /\.eclipse-reveal-slot \.blank-slot-answer \{[\s\S]*?transform: none;[\s\S]*?vertical-align: baseline;/);
});
