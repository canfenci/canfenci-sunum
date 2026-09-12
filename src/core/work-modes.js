export const DEFAULT_WORK_MODE = "presentation";

export const WORK_MODES = Object.freeze({
  presentation: Object.freeze({
    id: "presentation",
    label: "Sunum",
    startLabel: "Sunumu Başlat",
    surface: "presentation"
  }),
  activity: Object.freeze({
    id: "activity",
    label: "Etkinlik",
    startLabel: "Etkinliği Başlat",
    surface: "placeholder",
    placeholderTitle: "Bu konu için etkinlikler hazırlanıyor",
    placeholderDescription: "Pekiştirme etkinlikleri konuya bağlı bağımsız veri paketleri olarak burada açılacak."
  }),
  test: Object.freeze({
    id: "test",
    label: "Test",
    startLabel: "Testi Başlat",
    surface: "placeholder",
    placeholderTitle: "Bu konu için testler hazırlanıyor",
    placeholderDescription: "Ölçme ve değerlendirme paketleri konuya bağlı bağımsız veriler olarak burada açılacak."
  })
});

export const getWorkMode = (id) => WORK_MODES[id] ?? WORK_MODES[DEFAULT_WORK_MODE];
export const isWorkMode = (id) => Object.prototype.hasOwnProperty.call(WORK_MODES, id);
