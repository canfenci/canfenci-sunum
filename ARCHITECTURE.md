# CanFenci Sunum — Teknik V1 Mimarisi

## İlkeler

Tek statik kod tabanı USB/Pardus ve web sunumunu hedefler. Motorlar ES modülleridir;
ders ve müfredat verileri `data/` altında JSON olarak tutulur. Yeni bir ders eklemek
motor kodunu değiştirmez. Proje harici font, CDN, framework, build veya Service
Worker gerektirmez.

## Modüller

- **App Shell** (`src/ui`, `src/app.js`): kalıcı başlık, ana görünüm ve araç çekmecesi.
- **Mode Manager** (`src/core/mode-manager.js`): kontrol paneli / sunum geçişi.
- **Curriculum Engine**: katalog ve seçilen müfredat ağacını yükler, temel sözleşmeyi doğrular.
- **Lesson / Slide Engine**: dersi yükler; aşamaları korurken slayt gezinmesini ayrı yönetir.
- **Interaction Engine**: `type` bazlı, takılıp çıkarılabilir etkileşim handler kayıt defteri.
- **Teacher Tools**: sayaç, perde, tam ekran ve yazdırma; ders JSON'undan bağımsızdır.
- **Annotation Engine**: ayrı canvas katmanında kalem, fosforlu kalem, silgi, renk,
  kalınlık, geri al/yinele, temizle ve lazer API'leri.
- **Media Layer**: yerel SVG/PNG/WebP/MP4/WebM ve yalnızca çevrimiçiyken opsiyonel YouTube.
- **Storage Layer**: cihaz ayarları; V2 sınıf ilerlemesi için kasıtlı olarak işlevsiz API uçları.
- **Offline / Web Deployment** (`Başlat.sh`, `scripts/serve.py`): aynı statik dosyaları yerel
  HTTP veya normal web sunucusu üzerinden servis eder.

## Veri akışı

`catalog.json → Curriculum Engine → kullanıcı seçimi → lesson JSON → Lesson Engine →
slide renderer / Interaction Engine → App Shell`. Kullanıcı çizimleri ders verisine
karışmaz; canvas annotation katmanında yaşar. Araçlar EventBus üzerinden kabuğa olay yollar.

## Genişleme noktaları

- Yeni müfredat profili: katalog kaydı ve yeni `data/curricula/*.json` dosyası.
- Yeni ders: müfredat ağacına referans ve `lesson-template.json` sözleşmesine uyan veri.
- Yeni slayt bloğu/etkileşim: ilgili `type` renderer/handler kaydı.
- Yeni öğretmen aracı: `TeacherTools` olayı ve bağımsız UI kontrolü.
- V2 sınıf bağlamı: `AppState.classContext` hazırdır; V1 arayüzü kullanmaz.
- V2 ilerleme: `StorageLayer.saveProgress()` her zaman `false`, `loadProgress()` her
  zaman `null` döner; gerçek adaptör daha sonra eklenir.

## USB/Pardus ve web modeli

USB'de `Başlat.sh`, Python standart kütüphanesiyle yalnızca `127.0.0.1` üzerinde sunucu
açar; ağ ve kurulum gerekmez. Bu yöntem Chromium/Firefox'un `file://` JSON kısıtını
çözer ve Service Worker/PWA olmadan çevrimdışı çalışır. Web'de aynı klasör herhangi bir
statik sunucudan yayınlanır. Göreli URL'ler alt dizin dağıtımını destekler. Dokunmatik
işaretçi olayları, dar ekran kırılımları ve `@media print` temel seviyede tanımlıdır.
