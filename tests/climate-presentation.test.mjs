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
  assert.equal(cover.label, "CanFenci Akıllı Tahta Sunumu");
  assert.deepEqual(cover.interactions, [], "Kapak slaytında etkileşim olmamalıdır");

  const imagePath = cover.media[0].src.replace(/^\.\//, "");
  await access(imagePath);

  assert.ok(css.includes(".slide-climate-cover"), "Kapak slaytı CSS'i mevcut olmalıdır");
  assert.ok(css.includes("font-size: 56px"), "Ana başlık 56px olmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Yardımcı bilgiler 40px olmalıdır");
  assert.ok(css.includes("font-size: 36px"), "En küçük etiket 36px olmalıdır");
  assert.ok(css.includes("background: #fff3a6"), "Açık sarı vurgu zemini tanımlı olmalıdır");
});
