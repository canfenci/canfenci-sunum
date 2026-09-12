import { getWorkMode } from "../core/work-modes.js";
import { icon } from "./icons.js";

const MODE_ICONS = Object.freeze({ activity: "zap", test: "check", presentation: "play" });
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

export function renderWorkModePlaceholder(container, { workMode, grade, unit, topic }) {
  const mode = getWorkMode(workMode);
  container.innerHTML = `
    <section class="work-mode-placeholder" data-work-mode="${mode.id}">
      <div class="work-mode-placeholder-card">
        <span class="work-mode-placeholder-icon" aria-hidden="true">${icon(MODE_ICONS[mode.id] ?? "list", 34)}</span>
        <span class="page-kicker">${escapeHtml(mode.label.toLocaleUpperCase("tr-TR"))} MODU</span>
        <h1>${escapeHtml(mode.placeholderTitle ?? "Bu çalışma modu hazırlanıyor")}</h1>
        <p>${escapeHtml(mode.placeholderDescription ?? "İçerik paketi eklendiğinde bu alan otomatik olarak kullanılacak.")}</p>
        <div class="work-mode-context" aria-label="Seçili müfredat yolu">
          <span>${escapeHtml(grade?.label ?? "Sınıf seçilmedi")}</span>
          ${icon("chevron-right", 14)}
          <span>${escapeHtml(unit?.label ?? "Ünite seçilmedi")}</span>
          ${icon("chevron-right", 14)}
          <strong>${escapeHtml(topic?.label ?? "Konu seçilmedi")}</strong>
        </div>
        <button id="work-mode-home" type="button">${icon("chevron-left", 18)}<span>Kontrol Paneline Dön</span></button>
      </div>
    </section>`;

  return { home: container.querySelector("#work-mode-home") };
}
