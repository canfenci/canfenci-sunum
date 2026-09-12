# SınavPilotu — Flutter V1 Tasarım Prototipi

Öğretmenlerin açık uçlu ve çoktan seçmeli sınavları tarayıp kontrol etmesini, sınıf sonuçlarını incelemesini ve rapor önizlemesi almasını gösteren etkileşimli mobil prototiptir. Tüm içerik demo veridir; backend, ağ, gerçek kamera/OpenCV, AI API ve dosya üretimi içermez.

## Çalıştırma

```bash
cd sinavpilotu
flutter pub get
flutter run
```

## Paketler

Harici paket kullanılmadı. Prototip yalnızca Flutter SDK ve Material 3 bileşenleriyle çalışır.

## Ekranlar ve akışlar

- Ana Sayfa: iki ana sınav aksiyonu ve son işleme dönüş
- Açık Uçlu: yöntem seçimi, cevap anahtarı, seri ön/arka yüz tarama simülasyonu
- AI Kontrolü: açıklamalı puan önerisi, öğrenci lehine yuvarlama, onay/değiştir
- Çoktan Seçmeli: test bilgileri, A/B/C/D cevap anahtarı, sonuç ve net hesabı
- Sınıflar: demo sınıflar, öğrenci durumları ve kısa öğrenci ekleme formu
- Analizler: nesnel ölçümler, çubuk grafikler, kazanım oranları ve puan tablosu
- Rapor: PDF/Word seçimi, A4 benzeri önizleme ve imza alanı
- Ayarlar: öğretmen, okul, branş ve ders bilgileri

## Tasarım kararları

- Ana ekran dashboard yerine iki büyük ana aksiyona odaklanır.
- Lacivert güven ve resmiyeti, mavi ana aksiyonu, yeşil tamamlanmayı, mercan dikkat gereken sonucu temsil eder.
- Ana dokunma hedefleri en az 48 px'tir; içerik tabletlerde 760 px ile sınırlandırılır.
- Seri taramada öğrenci, yüz ve ilerleme bilgisi sürekli görünür; sonraki öğrenciye geçiş tek dokunuştur.
- AI yalnızca gerekçeli öneri sunar; nihai puan öğretmen onayıyla kaydedilir.
- Analizlerde AI yorumu yerine sade, nesnel grafikler ve tablolar kullanılır.
