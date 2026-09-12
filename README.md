# CanFenci Sunum

CanFenci Akıllı Tahta Ders Sistemi için bağımlılıksız teknik V1 iskeleti.
Gerçek ders veya müfredat içeriği içermez.

## USB / Pardus'ta çalıştırma

1. `Başlat.sh` dosyasına çift tıklayın ve **uçbirimde çalıştır** seçeneğini kullanın.
2. Uygulama varsayılan tarayıcıda açılır.
3. Kapatmak için uçbirim penceresinde `Ctrl+C` tuşlarına basın.

Pardus kurulumunda Python 3 yeterlidir; Node.js, paket kurulumu, internet veya
Service Worker gerekmez. Dosyaları tarayıcıya doğrudan sürüklemek yerine başlatıcıyı
kullanın; tarayıcılar `file://` üzerinden JSON okumayı güvenlik nedeniyle engeller.

Geliştiriciler `npm start` ile aynı sunucuyu açabilir, `npm test` ile veri ve zorunlu
dosya kontrolünü çalıştırabilir. Projede npm bağımlılığı yoktur.

## Web'e alma

Klasörün tamamını statik bir web köküne kopyalamak yeterlidir. Uygulama göreli
yollar kullanır; backend ya da derleme adımı gerektirmez. HTTPS üzerinde çevrimiçi
medya sağlayıcıları opsiyonel olarak çalışabilir.
