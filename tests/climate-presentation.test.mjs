import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("8. Sınıf İklim ve Hava Hareketleri kapak ve atmosfer slaytları doğrulaması", async () => {
  const lesson = JSON.parse(await readFile("data/lessons/iklim-ve-hava-hareketleri.json", "utf8"));
  const slides = lesson.stages.flatMap((stage) => stage.slides ?? []);
  const css = await readFile("src/styles/app.css", "utf8");

  assert.equal(lesson.title, "İklim ve Hava Hareketleri");
  assert.equal(slides.length, 2, "Ders kapak ve atmosfer olmak üzere 2 slayt olmalıdır");

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
  assert.equal(atmosphere.definitionTitle, "Atmosfer Nedir?");
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
  assert.deepEqual(atmosphere.interactions, [], "Slayt 2 etkileşimsiz kavram anlatım slaytı olmalıdır");

  const atmosphereImagePath = atmosphere.media[0].src.replace(/^\.\//, "");
  await access(atmosphereImagePath);

  assert.ok(css.includes(".slide-climate-atmosphere"), "Slayt 2 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("grid-template-columns: 55fr 45fr"), "Slayt 2 sol/sağ ana bölge oranı tanımlı olmalıdır");
  assert.ok(css.includes(".climate-card"), "Kart sistemi ana tasarım dili olarak tanımlı olmalıdır");
  assert.ok(css.includes("font-size: 56px"), "Sayfa başlığı 56px olmalıdır");
  assert.ok(css.includes("font-size: 46px"), "Kart başlıkları 46px olmalıdır");
  assert.ok(css.includes("font-size: 44px"), "Tanım 44px olmalıdır");
  assert.ok(css.includes("font-size: 40px"), "Ana öğretim metinleri ve grafik etiketleri 40px olmalıdır");
  assert.ok(css.includes("conic-gradient(#0a3b70 0deg 280.8deg, #38bdf8 280.8deg 356.4deg, #dbe4ec 356.4deg 360deg)"), "Havanın bileşimi donut chart oranları doğru olmalıdır");
});
