import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("8. Sınıf Mevsimlerin Oluşumu Slayt 8, 9, 20 ve 23 Okunabilirlik ve Regresyon Doğrulaması", async () => {
  const lessonData = JSON.parse(await readFile("data/lessons/mevsimlerin-olusumu.json", "utf8"));
  const slides = lessonData.stages.flatMap((s) => s.slides || []);
  const css = await readFile("src/styles/app.css", "utf8");

  // Toplam slayt sayısı doğrulaması
  assert.equal(slides.length, 25, "8. Sınıf dersi 25 slayt olmalıdır");

  // SLAYT 8: Eksen Eğikliği Sonuçları (slide_9_eksen_egikligi_sonuclari)
  const slide8 = slides.find((s) => s.id === "slide_9_eksen_egikligi_sonuclari");
  assert.ok(slide8, "Slayt 8 (slide_9_eksen_egikligi_sonuclari) mevcut olmalıdır");
  assert.equal(slide8.layout, "canva_eksen_sonuclari");
  assert.equal(slide8.media?.length, 5, "5 adet sonuç görseli bulunmalıdır");
  assert.ok(css.includes(".slide-canva-eksen-sonuclari"), "Slayt 8 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(165px, 27vh, 285px)"), "Slayt 8 görselleri en az %50 büyütülmüş olmalıdır");
  assert.ok(css.includes("clamp(23px, 1.85cqi, 36px)"), "Slayt 8 metinleri ~%75 büyütülmüş olmalıdır");

  // SLAYT 9: Mevsim Tarihleri Tablosu (slide_10_mevsim_tarihleri_tablosu)
  const slide9 = slides.find((s) => s.id === "slide_10_mevsim_tarihleri_tablosu");
  assert.ok(slide9, "Slayt 9 (slide_10_mevsim_tarihleri_tablosu) mevcut olmalıdır");
  assert.equal(slide9.layout, "canva_tarihler_tablosu");
  assert.ok(slide9.interactions?.length > 0, "Slayt 9 etkileşimleri korunmalıdır");
  assert.ok(css.includes(".slide-canva-tarihler-tablosu"), "Slayt 9 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".canva-interactive-table th"), "İnteraktif tablo th kuralı mevcut olmalıdır");
  assert.ok(css.includes("clamp(22px, 1.8cqi, 36px)"), "Tablo metinleri 30-36px hedefinde clamp tanımlı olmalıdır");

  // SLAYT 20: Kavram Yanılgıları (slide_21_kavram_yanilgilari)
  const slide20 = slides.find((s) => s.id === "slide_21_kavram_yanilgilari");
  assert.ok(slide20, "Slayt 20 (slide_21_kavram_yanilgilari) mevcut olmalıdır");
  assert.equal(slide20.layout, "canva_kavram_yanilgilari");
  assert.equal(slide20.misconceptions?.length, 4, "4 adet kavram yanılgısı maddesi bulunmalıdır");
  assert.ok(css.includes(".slide-canva-kavram-yanilgilari"), "Slayt 20 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".yanilgi-text"), "Yanılgı metin stili mevcut olmalıdır");
  assert.ok(css.includes("clamp(22px, 1.8cqi, 36px)"), "Yanılgı metinleri 30-36px hedefinde clamp tanımlı olmalıdır");

  // SLAYT 23: Mevsim Tarihleri Özeti (slide_24_mevsim_tarihleri_ozet)
  const slide23 = slides.find((s) => s.id === "slide_24_mevsim_tarihleri_ozet");
  assert.ok(slide23, "Slayt 23 (slide_24_mevsim_tarihleri_ozet) mevcut olmalıdır");
  assert.equal(slide23.layout, "canva_mevsim_tarihleri_ozet");
  assert.ok(css.includes(".slide-canva-mevsim-tarihleri-ozet"), "Slayt 23 CSS kuralı mevcut olmalıdır");
  assert.ok(css.includes(".canva-summary-table th"), "Özet tablo th stili mevcut olmalıdır");
  assert.ok(css.includes(".canva-summary-table td"), "Özet tablo td stili mevcut olmalıdır");
});
