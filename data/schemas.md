# Veri sözleşmeleri

## Müfredat

`catalog.json`, sınıf ve müfredat profili eşleşmelerini tutar. Her profil ayrı bir
`data/curricula/*.json` dosyasına gider. Ürün hiyerarşisi
`grade → unit → topic → workMode` biçimindedir. Düğüm kimlikleri profil içinde
sabit ve benzersiz olmalıdır.

Konu düğümlerindeki `metadata` alanı ders paketinden bağımsızdır. `coreTopics`,
`extraTopics`, `verified` ve `lastVerifiedAt` alanları Müfredat Bilgisi panelini
besler. `lessons` boş kalabilir; metadata bulunması ders/slayt içeriği bulunduğu
anlamına gelmez.

Her konu, ortak `topicId` altında bağımsız `workModes` kayıtları taşıyabilir:
`presentation`, `activity` ve `test`. Her kayıt `status` ve isteğe bağlı `source`
alanlarını kullanır. Mevcut `lessons` listesi korunur; Sunum modu `presentation.source`
üzerinden aynı ders paketini kullanır ve eski kayıtlar için `lessons[0].source` geri
uyumluluk seçeneği olarak kalır. Etkinlik ve test paketleri sırasıyla
`data/activities/` ve `data/tests/` altında konu kimliğiyle bağlanacaktır.

Üç bağımsız içerik katmanı ortak `topicId` üzerinden ilişkilendirilir:

- Sunum: `data/lessons/<topic>.json`
- Etkinlik: `data/activities/<topic>.json`
- Test: `data/tests/<topic>.json`

`workMode` (`presentation`, `activity`, `test`) ürünün çalışma katmanını seçer.
`presentation.viewMode` (`smartboard`, `online`, `recording`, `clean`) yalnızca
Sunum katmanının görünüm biçimidir; bu iki kavram birbirinden bağımsızdır.

## Ders

Her ders bağımsız bir JSON dosyasıdır. `stages`, pedagojik akışı; her aşamanın
`slides` alanı ekranda ilerleyen slaytları tanımlar. Aşama ile slayt aynı kavram değildir.

Slayt blokları ve etkileşimleri `type` alanıyla ilgili renderer/handler'a yönlendirilir.
Medya kaynakları yerel dosya için `kind`, `type`, `src`, `alt`; çevrimiçi YouTube
için `provider: "youtube"` ve `videoId` alanlarını kullanır.

## Etkinlik

Etkinlik paketleri `data/activities/` altında, ders JSON'larından bağımsız tutulur.
Paket alanları `schemaVersion`, `topicId`, `gradeId`, `unitId`, `title` ve
`activities` dizisidir. Her etkinlik `id`, `type`, `title`, `instruction` ve `order`
ortak alanlarını taşır.

V1 etkinlik türleri:

- `true_false`: `items` dizisindeki her öğe `id`, `statement`, boolean `answer` ve
  `explanation` alanlarını taşır.
- `matching`: `pairs` dizisindeki her eşleşme `id`, `left` ve `right` alanlarını
  taşır. Model, seçim tabanlı veya sürükle-bırak arayüzüne bağımlı değildir.
- `fill_blank`: `items` içindeki `text`, `{{blank1}}` biçiminde yer tutucular
  kullanır. Her yer tutucunun `blanks` dizisinde aynı kimlikli bir `id` ve `answer`
  kaydı bulunmalıdır. İleride `acceptedAnswers` eklenebilir.

Şablon: `data/activities/activity-template.json`.

## Test

Test paketleri `data/tests/` altında, ders ve etkinlik JSON'larından bağımsız
tutulur. Paket alanları `schemaVersion`, `topicId`, `gradeId`, `unitId`, `title`
ve `sections` dizisidir. Her bölüm `id`, `type`, `title` ve `questions` alanlarını
taşır.

İzin verilen bölüm türleri:

- 5, 6 ve 7. sınıf: `topic_test`, `new_generation`
- 8. sınıf: `topic_test`, `new_generation`, `past_exam`

`Hızlı Test` ve ayrı bir `Karma Test` türü yoktur. İleride 20 soruluk Konu
Denemesi, mevcut soru havuzundan seçim yapan bir preset olarak tanımlanabilir;
ayrı bir soru veya bölüm türü gerektirmez.

Tüm sorular aynı çoktan seçmeli temel sözleşmeyi kullanır: `id`, `question`,
`options`, `correctOption`, `explanation`, `subtopic` ve `difficulty`. Zorluk
değeri `easy`, `medium` veya `hard` olmalıdır. Her seçenek kararlı bir `id` ve
`text` taşır; `correctOption`, indeks yerine mevcut seçeneklerden birinin kararlı
kimliğini (örneğin `"B"`) kullanır.

`new_generation` sorularında ortak alanlara ek olarak isteğe bağlı `stimulus` ve
`media` kullanılabilir. `past_exam` yalnızca 8. sınıf paketlerinde bulunabilir ve
her çıkmış soru şu ek metadata alanlarını taşımalıdır:

```json
{
  "sourceType": "past_exam",
  "exam": "LGS",
  "year": 2025,
  "source": "Kaynak kurum veya belge",
  "sourceRef": "İsteğe bağlı sayfa/soru referansı"
}
```

`sourceRef` isteğe bağlıdır; `sourceType`, `exam`, `year` ve `source` zorunludur.
Şablonun `past_exam` bölümü gerçek çıkmış soru içermemek için boş bırakılmıştır.
Şablon: `data/tests/test-template.json`.

Yeni sınıf, ünite veya konu eklenirken motor koduna kimlik veya konu adı
hardcode edilmez; paketler katalogdaki seçili düğümler ve ortak `topicId` ile bulunur.

## Doğrulama metadata alanları

Profil ve ders seviyesinde `authority`, `sourceDocument`, `sourceVersion`,
`lastVerifiedAt`, `verifiedBy`, `status` ve isteğe bağlı `notes` alanları bulunur.
Kazanım bağlantıları dersin `curriculumValidation.outcomeIds` dizisinde tutulur.
