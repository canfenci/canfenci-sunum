import { icon } from "./icons.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

const getStageIndex = (lesson, slide) => Math.max(0, (lesson?.stages ?? []).findIndex((stage) => stage.id === slide?.stageId));

const renderPlanItems = (lesson, activeStageIndex) => {
  const stages = lesson?.stages ?? [];
  if (!stages.length) return `<div class="plan-empty"><span></span><div><strong>Ders planı bekleniyor</strong><small>Aşamalar ders JSON paketiyle yüklenecek.</small></div></div>`;
  return stages.map((stage, index) => {
    const status = index < activeStageIndex ? "complete" : index === activeStageIndex ? "active" : "pending";
    const marker = status === "complete" ? icon("check", 16) : "";
    return `<button type="button" class="plan-stage ${status}" data-stage-id="${escapeHtml(stage.id)}"><span>${marker}</span><div><strong>${escapeHtml(stage.label)}</strong><small>${stage.slides?.length ?? 0} slayt</small></div></button>`;
  }).join("");
};

export function renderPresentation(container, { lesson, slide, slideIndex = 0, slideCount = 0 }) {
  const activeStageIndex = getStageIndex(lesson, slide);
  const stageLabel = lesson?.stages?.[activeStageIndex]?.label ?? "Ders başlangıcı";
  const slideTag = slide?.tag ?? slide?.kicker ?? stageLabel;
  const isSame = slideTag.trim().toLocaleLowerCase("tr") === stageLabel.trim().toLocaleLowerCase("tr");
  const topicTitle = lesson?.title ?? "Mevsimlerin Oluşumu";
  const progress = slideCount ? Math.round(((slideIndex + 1) / slideCount) * 100) : 0;
  container.innerHTML = `
    <section class="presentation-view" data-view-mode="smartboard">
      <nav class="presentation-rail" aria-label="Sunum kısa yolları">
        <button id="back-to-panel" type="button" aria-label="Kontrol paneli">${icon("chevron-left")}</button>
        <button id="rail-tools" type="button" aria-label="Öğretmen araçları">${icon("wrench")}</button>
        <button id="rail-plan" type="button" aria-label="Ders planı">${icon("list")}</button>
        <button id="rail-viewmode" type="button" aria-label="Görünüm modu (V)">${icon("maximize")}</button>
        <span></span>
        <button id="rail-help" type="button" aria-label="Yardım">${icon("help-circle")}</button>
      </nav>
      <div class="presentation-stage">
        <header class="stage-header">
          <div class="stage-meta ${isSame ? "is-single" : ""}" id="stage-meta">
            <span class="stage-kicker" id="active-stage-kicker">${escapeHtml(slideTag)}</span>
            <strong id="active-stage-label" ${isSame ? "hidden" : ""}>${escapeHtml(isSame ? "" : stageLabel)}</strong>
          </div>
          <div class="stage-center">
            <div class="stage-progress" aria-label="Ders ilerlemesi"><span id="stage-progress-bar" style="width: ${progress}%"></span></div>
            <small id="stage-slide-status">Slayt ${slideCount ? slideIndex + 1 : 0} / ${slideCount}</small>
          </div>
          <div class="stage-topic">
            <span class="stage-kicker">KONU</span>
            <strong id="stage-topic-label">${escapeHtml(topicTitle)}</strong>
          </div>
        </header>
        <div class="stage-canvas-area" id="stage-canvas-area">
          <div class="slide-workspace" id="slide-workspace">
            <div class="slide-content" id="slide-content">${slide ? `<h1>${escapeHtml(slide.title ?? "")}</h1>` : `<div class="empty-state"><div class="empty-state-icon">${icon("zap", 44)}</div><span>CANFENCİ SUNUM MODU</span><strong>Ders paketi bekleniyor</strong><p>Slaytlar, aşamalar ve etkileşimler JSON ders paketinden yüklenecek.</p></div>`}</div>
            <canvas id="annotation-canvas" aria-label="Çizim katmanı" hidden></canvas>
          </div>
          <button id="clean-mode-exit" class="clean-mode-exit" type="button" aria-label="Görünüm modunu değiştir">${icon("x")}<span>Çıkış</span></button>
        </div>
        <footer class="presentation-controls">
          <button id="show-plan" type="button">${icon("list")}<small>Plan</small></button>
          <button id="previous-slide" type="button" ${slideIndex <= 0 ? "disabled" : ""}>${icon("chevron-left")}<small>Geri</small></button>
          <div class="slide-counter" aria-label="Slayt sayacı"><strong id="slide-counter-current">${slideCount ? slideIndex + 1 : 0}</strong><span>/</span><small id="slide-counter-total">${slideCount}</small></div>
          <button id="next-slide" type="button" ${slideIndex >= slideCount - 1 || !slideCount ? "disabled" : ""}>${icon("chevron-right")}<small>İleri</small></button>
          <button id="presentation-viewmode" type="button">${icon("maximize")}<small>Mod</small></button>
          <button id="presentation-fullscreen" type="button">${icon("maximize")}<small>Tam Ekran</small></button>
          <button id="presentation-reset" type="button">${icon("rotate-ccw")}<small>Sıfırla</small></button>
          <button id="presentation-help" type="button">${icon("help-circle")}<small>Yardım</small></button>
        </footer>
      </div>

      <!-- Minimal Floating Toolbar for Online & Recording Modes -->
      <aside class="presentation-floating-toolbar" id="floating-toolbar" aria-label="Hızlı sunum araçları">
        <button id="floating-prev" type="button" aria-label="Önceki slayt" ${slideIndex <= 0 ? "disabled" : ""}>${icon("chevron-left", 18)}</button>
        <div class="floating-counter"><strong id="floating-counter-current">${slideCount ? slideIndex + 1 : 0}</strong><span>/</span><small id="floating-counter-total">${slideCount}</small></div>
        <button id="floating-next" type="button" aria-label="Sonraki slayt" ${slideIndex >= slideCount - 1 || !slideCount ? "disabled" : ""}>${icon("chevron-right", 18)}</button>
        <span class="floating-divider" aria-hidden="true"></span>
        <button id="floating-pen" type="button" class="floating-tool-btn" aria-label="Çizim kalemi">${icon("pencil", 18)}</button>
        <button id="floating-laser" type="button" class="floating-tool-btn" aria-label="Lazer işaretçi">${icon("zap", 18)}</button>
        <button id="floating-eraser" type="button" class="floating-tool-btn" aria-label="Silgi">${icon("eraser", 18)}</button>
        <button id="floating-clear" type="button" class="floating-tool-btn" aria-label="Çizimleri temizle">${icon("rotate-ccw", 18)}</button>
        <span class="floating-divider" aria-hidden="true"></span>
        <button id="floating-mode" type="button" class="floating-mode-btn" aria-label="Görünüm modu seç">
          <span id="floating-mode-label">Akıllı Tahta</span>
          ${icon("chevron-right", 14)}
        </button>
      </aside>

      <!-- ViewMode Selector Sheet / Dialog -->
      <button class="viewmode-backdrop" id="viewmode-backdrop" type="button" aria-label="Görünüm menüsünü kapat" hidden></button>
      <aside class="viewmode-menu-sheet" id="viewmode-sheet" aria-label="Görünüm modu seçimi" hidden>
        <div class="viewmode-sheet-header">
          <div>
            <span class="stage-kicker">GÖRÜNÜM MİMARİSİ</span>
            <h3>Sunum Modu Seçin</h3>
          </div>
          <button id="close-viewmode" type="button" aria-label="Kapat">${icon("x")}</button>
        </div>
        <div class="viewmode-options">
          <button type="button" class="viewmode-opt is-active" data-view-mode="smartboard">
            <span class="viewmode-icon">🏫</span>
            <div class="viewmode-info">
              <strong>Akıllı Tahta (Smartboard)</strong>
              <small>Üst bar, tüm araçlar ve tam kontrollerle sınıf tahtası için ideal</small>
            </div>
            <span class="viewmode-check">${icon("check", 16)}</span>
          </button>
          <button type="button" class="viewmode-opt" data-view-mode="online">
            <span class="viewmode-icon">💻</span>
            <div class="viewmode-info">
              <strong>Online Ders (Mac / iPad)</strong>
              <small>Maksimum 16:9 tuval alanı + yüzen kompakt çizim ve gezinti çubuğu</small>
            </div>
            <span class="viewmode-check">${icon("check", 16)}</span>
          </button>
          <button type="button" class="viewmode-opt" data-view-mode="recording">
            <span class="viewmode-icon">🔴</span>
            <div class="viewmode-info">
              <strong>Ekran Kaydı (Recording)</strong>
              <small>16:9 saf tuval + fare hareketsizliğinde otomatik gizlenen UI (YouTube & kayıt)</small>
            </div>
            <span class="viewmode-check">${icon("check", 16)}</span>
          </button>
          <button type="button" class="viewmode-opt" data-view-mode="clean">
            <span class="viewmode-icon">🖼️</span>
            <div class="viewmode-info">
              <strong>Temiz Görünüm (Clean)</strong>
              <small>Yalnızca 16:9 ders slaytı, sıfır UI paraziti (ekran görüntüsü için)</small>
            </div>
            <span class="viewmode-check">${icon("check", 16)}</span>
          </button>
        </div>
        <div class="viewmode-hint">
          <small>💡 İpucu: Klavyeden <strong>V</strong> tuşuna basarak modlar arasında hızlıca geçiş yapabilirsiniz.</small>
        </div>
      </aside>

      <button class="plan-backdrop" id="plan-backdrop" type="button" aria-label="Ders planını kapat" hidden></button>
      <aside class="stage-plan-sheet" id="stage-plan-sheet" aria-label="Ders aşama planı" hidden>
        <div class="plan-handle" aria-hidden="true"></div>
        <div class="plan-heading"><div><span class="stage-kicker">DERS AKIŞI</span><h2>Aşama Planı</h2></div><button id="close-plan" type="button" aria-label="Planı kapat">${icon("x")}</button></div>
        <div class="plan-legend"><span class="complete">${icon("check", 14)} Tamamlanan</span><span class="active"><i aria-hidden="true"></i> Aktif</span><span class="pending"><i aria-hidden="true"></i> Bekleyen</span></div>
        <div class="plan-stages" id="plan-stages">${renderPlanItems(lesson, activeStageIndex)}</div>
      </aside>
    </section>`;
  return {
    viewContainer: container.querySelector(".presentation-view"),
    canvas: container.querySelector("#annotation-canvas"),
    workspace: container.querySelector("#slide-workspace"),
    canvasArea: container.querySelector("#stage-canvas-area"),
    slideContent: container.querySelector("#slide-content"),
    stageMeta: container.querySelector("#stage-meta"),
    stageKicker: container.querySelector("#active-stage-kicker"),
    stageLabel: container.querySelector("#active-stage-label"),
    topicLabel: container.querySelector("#stage-topic-label"),
    progressBar: container.querySelector("#stage-progress-bar"), stageStatus: container.querySelector("#stage-slide-status"),
    counterCurrent: container.querySelector("#slide-counter-current"), counterTotal: container.querySelector("#slide-counter-total"),
    previous: container.querySelector("#previous-slide"), next: container.querySelector("#next-slide"),
    back: container.querySelector("#back-to-panel"), tools: container.querySelector("#rail-tools"),
    fullscreen: container.querySelector("#presentation-fullscreen"), reset: container.querySelector("#presentation-reset"),
    help: container.querySelector("#presentation-help"), plan: container.querySelector("#show-plan"),
    railPlan: container.querySelector("#rail-plan"), railHelp: container.querySelector("#rail-help"),
    railViewMode: container.querySelector("#rail-viewmode"),
    presentationViewMode: container.querySelector("#presentation-viewmode"),
    floatingToolbar: container.querySelector("#floating-toolbar"),
    floatingPrev: container.querySelector("#floating-prev"),
    floatingNext: container.querySelector("#floating-next"),
    floatingCounterCurrent: container.querySelector("#floating-counter-current"),
    floatingCounterTotal: container.querySelector("#floating-counter-total"),
    floatingPen: container.querySelector("#floating-pen"),
    floatingLaser: container.querySelector("#floating-laser"),
    floatingEraser: container.querySelector("#floating-eraser"),
    floatingClear: container.querySelector("#floating-clear"),
    floatingMode: container.querySelector("#floating-mode"),
    floatingModeLabel: container.querySelector("#floating-mode-label"),
    cleanModeExit: container.querySelector("#clean-mode-exit"),
    viewModeSheet: container.querySelector("#viewmode-sheet"),
    viewModeBackdrop: container.querySelector("#viewmode-backdrop"),
    closeViewMode: container.querySelector("#close-viewmode"),
    planSheet: container.querySelector("#stage-plan-sheet"), planBackdrop: container.querySelector("#plan-backdrop"),
    closePlan: container.querySelector("#close-plan"), planStages: container.querySelector("#plan-stages")
  };
}

export function renderPlanItemsForState(lesson, slide) {
  return renderPlanItems(lesson, getStageIndex(lesson, slide));
}
