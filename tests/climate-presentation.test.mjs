import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("8. Sınıf İklim ve Hava Hareketleri kapak slaytı doğrulaması", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);
  const css = await readFile("src/styles/app.css", "utf8");

  assert.equal(lesson.title, "İklim ve Hava Hareketleri");
  assert.equal(slides.length, 1, "Ders şimdilik yalnızca kapak slaytından oluşmalıdır");

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
});
