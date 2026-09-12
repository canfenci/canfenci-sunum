import { icon } from "./icons.js";

const toolButton = (action, iconName, label, iconClass = "") => `
  <button class="teacher-tool" type="button" data-tool-action="${action}">
    ${icon(iconName, 20, iconClass)}<span>${label}</span>
  </button>`;

export function renderShell(root) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <button class="mobile-menu-button" id="mobile-menu-button" type="button" aria-label="Ders seçimini aç" aria-expanded="false">${icon("list")}</button>
        <a class="brand" href="#/" aria-label="CanFenci ana sayfa">
          <span class="brand-mark" aria-hidden="true"><img src="./assets/images/canfenci-logo.png" alt=""></span>
          <span><strong>CanFenci</strong><small>Akıllı Tahta Ders Sistemi</small></span>
        </a>
        <div class="lesson-path" id="lesson-path" aria-label="Aktif ders yolu">
          <span>8. Sınıf</span><i>${icon("chevron-right", 14)}</i><span>Ünite seçilmedi</span><i>${icon("chevron-right", 14)}</i><strong>Konu seçilmedi</strong>
        </div>
        <div class="header-actions">
          <button class="info-button" id="curriculum-info-button" type="button" aria-label="Müfredat bilgisi" aria-expanded="false">${icon("help-circle")}</button>
          <button class="tools-trigger" id="teacher-tools-button" type="button" aria-expanded="false">${icon("wrench")} Araçlar</button>
          <div class="live-clock" aria-label="Güncel saat">
            <div><strong id="clock-hours">--:--</strong><span id="clock-seconds">--</span></div>
            <small id="clock-date">—</small>
          </div>
        </div>
      </header>
      <div class="source-info" id="source-info" hidden>
        <span><strong>Sınıf:</strong> 8. Sınıf</span>
        <span><strong>Doğrulama:</strong> Müfredat ile doğrulandı</span>
        <span class="connection-status" id="connection-status"></span>
      </div>
      <main id="app-main" tabindex="-1"></main>

      <aside class="teacher-drawer" id="teacher-drawer" aria-label="Öğretmen araçları" hidden>
        <div class="drawer-header">
          <div><span class="drawer-kicker">CANFENCİ</span><h2>Öğretmen Araçları</h2></div>
          <button class="icon-button" id="close-tools" type="button" aria-label="Araçları kapat">${icon("x")}</button>
        </div>
        <section class="drawer-section">
          <h3>Çizim araçları</h3>
          <div class="tool-grid tool-grid-drawing">
            ${toolButton("pen", "pencil", "Kalem")}
            ${toolButton("highlighter", "pencil", "Fosforlu", "icon-highlighter")}
            ${toolButton("eraser", "eraser", "Silgi")}
            ${toolButton("laser", "zap", "Lazer işaretçi")}
          </div>
          <div class="drawing-settings">
            <label>Renk <input id="annotation-color" type="color" value="#ff3b30" aria-label="Çizim rengi"></label>
            <label>Kalınlık <input id="annotation-width" type="range" min="2" max="18" value="4" aria-label="Çizim kalınlığı"></label>
          </div>
          <div class="tool-grid tool-grid-compact">
            ${toolButton("undo", "rotate-ccw", "Geri al")}
            ${toolButton("redo", "rotate-ccw", "Yinele", "icon-mirrored")}
            ${toolButton("clear", "x", "Temizle")}
          </div>
        </section>
        <section class="drawer-section">
          <h3>Sınıf araçları</h3>
          <div class="tool-grid">
            ${toolButton("focus", "settings", "Dikkat odağı")}
            ${toolButton("curtain", "eye-off", "Ekranı karart")}
            ${toolButton("timer", "timer", "Zamanlayıcı")}
            ${toolButton("hint", "help-circle", "İpucu")}
            ${toolButton("answer", "check", "Cevabı göster")}
            ${toolButton("note", "notebook", "Öğretmen notu")}
          </div>
          <output id="timer-output" class="timer-output" aria-live="assertive"></output>
          <div class="teacher-note" id="teacher-note" hidden>
            <label for="teacher-note-input">Öğretmen notu</label>
            <textarea id="teacher-note-input" rows="4" placeholder="Bu oturuma özel kısa not…"></textarea>
          </div>
        </section>
      </aside>
      <div class="focus-overlay" id="focus-overlay" hidden><div aria-hidden="true"></div><button type="button" id="close-focus">Odağı kapat</button></div>
      <div class="curtain" id="curtain" hidden><div><span>CANFENCİ</span><strong>Ekran karartıldı</strong><button id="open-curtain" type="button">Ekranı aç</button></div></div>
      <div class="toast" id="toast" role="status" hidden></div>
    </div>`;

  return {
    main: root.querySelector("#app-main"), lessonPath: root.querySelector("#lesson-path"),
    mobileMenuButton: root.querySelector("#mobile-menu-button"),
    toolsButton: root.querySelector("#teacher-tools-button"), toolsDrawer: root.querySelector("#teacher-drawer"),
    closeTools: root.querySelector("#close-tools"), infoButton: root.querySelector("#curriculum-info-button"),
    sourceInfo: root.querySelector("#source-info"), connection: root.querySelector("#connection-status"),
    clockHours: root.querySelector("#clock-hours"), clockSeconds: root.querySelector("#clock-seconds"),
    clockDate: root.querySelector("#clock-date"), timerOutput: root.querySelector("#timer-output"),
    teacherNote: root.querySelector("#teacher-note"), focusOverlay: root.querySelector("#focus-overlay"),
    curtain: root.querySelector("#curtain"), toast: root.querySelector("#toast")
  };
}
