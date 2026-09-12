import { icon } from "./icons.js";
import { DEFAULT_WORK_MODE, WORK_MODES, getWorkMode } from "../core/work-modes.js";

const APP_VERSION = "V1";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

const countLessonItems = (lesson) => {
  const stages = lesson?.stages ?? [];
  const slides = stages.flatMap((stage) => stage.slides ?? []);
  return {
    stages: stages.length,
    slides: slides.length,
    interactions: slides.reduce((total, slide) => total + (slide.interactions?.length ?? 0), 0)
  };
};

const stepClass = (value, previousValue) => value ? "complete" : previousValue ? "active" : "pending";

export function renderControlPanel(container, { catalog, curriculum, state, lesson = null }) {
  const grades = catalog.grades ?? [];
  const selectedGrade = state.selection.gradeId ?? grades[0]?.id ?? "";
  const grade = grades.find((item) => item.id === selectedGrade);
  const units = curriculum?.units ?? [];
  const selectedUnit = units.find((item) => item.id === state.selection.unitId) ?? units[0] ?? null;
  const topics = selectedUnit?.topics ?? [];
  const selectedTopic = topics.find((item) => item.id === state.selection.topicId) ?? topics[0] ?? null;
  const metadata = selectedTopic?.metadata ?? { coreTopics: [], extraTopics: [], verified: false, lastVerifiedAt: null };
  const coreTopics = metadata.coreTopics ?? [];
  const extraTopics = metadata.extraTopics ?? [];
  const counts = countLessonItems(lesson);
  const selectedWorkMode = state.selection.workMode ?? DEFAULT_WORK_MODE;
  const workMode = getWorkMode(selectedWorkMode);
  const hasGrade = Boolean(grade);
  const hasUnit = Boolean(selectedUnit);
  const hasTopic = Boolean(selectedTopic);
  const hasWorkMode = Boolean(selectedWorkMode);
  const lastVerified = metadata.lastVerifiedAt
    ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(metadata.lastVerifiedAt))
    : "—";

  container.innerHTML = `
    <section class="dashboard-layout">
      <button class="mobile-sidebar-backdrop" id="mobile-sidebar-backdrop" type="button" aria-label="Ders seçimini kapat" hidden></button>
      <aside class="selection-sidebar" id="selection-sidebar" aria-label="Ders seçimi">
        <div class="sidebar-heading"><span>Kontrol Paneli</span><h1>Dersini hazırla</h1><p>Tahtaya başlamadan önce ders rotasını belirle.</p></div>
        <form id="lesson-picker" class="lesson-picker">
          <label><span><i>1</i> Sınıf</span><select name="gradeId">${grades.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedGrade ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
          <label><span><i>2</i> Ünite</span><select name="unitId" ${units.length ? "" : "disabled"}>${units.length ? units.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedUnit?.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("") : "<option>Ünite seçilmedi</option>"}</select></label>
          <label><span><i>3</i> Konu</span><select name="topicId" ${topics.length ? "" : "disabled"}>${topics.length ? topics.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedTopic?.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("") : "<option>Konu seçilmedi</option>"}</select></label>
          <label><span><i>4</i> Çalışma Modu</span><select name="workMode">${Object.values(WORK_MODES).map((mode) => `<option value="${mode.id}" ${mode.id === selectedWorkMode ? "selected" : ""}>${mode.label}</option>`).join("")}</select></label>
          <button class="start-lesson" type="submit"><span aria-hidden="true">${icon("play", 20)}</span><span><strong>${workMode.startLabel}</strong><small>${workMode.label} modunu aç</small></span></button>
        </form>
        <div class="offline-ready"><span aria-hidden="true">${icon("check", 17)}</span><div><strong>Sistem hazır</strong><small>Çevrimdışı kullanım etkin</small></div></div>
      </aside>

      <div class="dashboard-content">
        <div class="content-heading"><div><span class="page-kicker">${escapeHtml((grade?.label ?? "Sınıf").toLocaleUpperCase("tr-TR"))} · FEN BİLİMLERİ</span><h2>Ders çalışma alanı</h2></div><span class="v1-badge">TEKNİK ${APP_VERSION}</span></div>
        <section class="dashboard-card curriculum-map-card">
          <div class="card-heading"><div class="card-icon blue" aria-hidden="true">${icon("list")}</div><div><h3>Müfredat Haritası</h3><p>Ders paketlerinin aşama ve slayt yapısı</p></div><span class="status-pill waiting">İçerik bekleniyor</span></div>
          <div class="curriculum-map">
            <div class="map-step ${stepClass(hasGrade, false)}"><span>${hasGrade ? icon("check", 18) : "1"}</span><div><strong>1 Sınıf</strong><small>${escapeHtml(grade?.label ?? "Seçilmedi")}</small></div></div><i></i>
            <div class="map-step ${stepClass(hasUnit, hasGrade)}"><span>${hasUnit ? icon("check", 18) : "2"}</span><div><strong>2 Ünite</strong><small>${hasUnit ? escapeHtml(selectedUnit.label) : "İçerik bekleniyor"}</small></div></div><i></i>
            <div class="map-step ${stepClass(hasTopic, hasUnit)}"><span>${hasTopic ? icon("check", 18) : "3"}</span><div><strong>3 Konu</strong><small>${hasTopic ? escapeHtml(selectedTopic.label) : "Henüz seçilmedi"}</small></div></div><i></i>
            <div class="map-step ${stepClass(hasWorkMode, hasTopic)}"><span>${hasWorkMode ? icon("check", 18) : "4"}</span><div><strong>4 Çalışma Modu</strong><small>${escapeHtml(workMode.label)}</small></div></div>
          </div>
        </section>

        <section class="dashboard-card lesson-preview-card">
          <div class="card-heading"><div class="card-icon orange" aria-hidden="true">${icon("play")}</div><div><h3>Ders Önizlemesi</h3><p>Seçilen dersin sunum hazırlık özeti</p></div></div>
          <div class="preview-canvas">
            <div class="preview-illustration" aria-hidden="true"><span>${icon("zap", 52)}</span><i></i><b></b></div>
            <div class="preview-copy"><strong>${lesson?.title ? escapeHtml(lesson.title) : "Sunum motoru hazır"}</strong><p>${lesson ? "Seçilen dersin aşama, slayt ve etkileşim sayıları hazır." : "Gerçek ders içeriği eklendiğinde aşamalar, slaytlar ve etkileşimler burada özetlenecek."}</p></div>
            <div class="preview-stats"><span><strong>${counts.stages}</strong><small>Aşama</small></span><span><strong>${counts.slides}</strong><small>Slayt</small></span><span><strong>${counts.interactions}</strong><small>Etkileşim</small></span></div>
          </div>
        </section>
      </div>

      <aside class="validation-panel" id="validation-panel" aria-label="Müfredat bilgisi paneli">
        <button class="validation-toggle" id="validation-toggle" type="button" aria-expanded="true" aria-label="Müfredat bilgisi panelini daralt">${icon("chevron-right")}</button>
        <div class="validation-content">
          <span class="page-kicker">MÜFREDAT METADATA</span><h2>Müfredat Bilgisi</h2><p>Seçili konu için kapsam ve doğrulama bilgileri.</p>
          <dl>
            <div><dt>Sınıf</dt><dd>${escapeHtml(grade?.label ?? "—")}</dd></div>
            <div><dt>Ünite</dt><dd>${escapeHtml(selectedUnit?.label ?? "—")}</dd></div>
            <div><dt>Konu</dt><dd>${escapeHtml(selectedTopic?.label ?? "—")}</dd></div>
            <div><dt>Son kontrol tarihi</dt><dd>${escapeHtml(lastVerified)}</dd></div>
          </dl>
          <div class="curriculum-topic-group"><h3>Ana Kapsam</h3><ul>${coreTopics.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          <div class="curriculum-topic-group"><h3>Ekstra Bilgi</h3><ul>${extraTopics.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          <div class="validation-note ${metadata.verified ? "is-verified" : ""}"><span aria-hidden="true">${icon(metadata.verified ? "check" : "help-circle", 14)}</span><p>${metadata.verified ? "Müfredat ile doğrulandı" : "Müfredat doğrulaması bekleniyor"}</p></div>
        </div>
      </aside>
    </section>`;

  return {
    form: container.querySelector("#lesson-picker"),
    sidebar: container.querySelector("#selection-sidebar"),
    sidebarBackdrop: container.querySelector("#mobile-sidebar-backdrop"),
    validationPanel: container.querySelector("#validation-panel"),
    validationToggle: container.querySelector("#validation-toggle")
  };
}
