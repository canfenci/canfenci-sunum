import { icon } from "./icons.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

const mountInteraction = (interaction, container, interactions, activeInteractions) => {
  if (!interaction || !container) return;
  const slot = document.createElement("div");
  slot.className = "interaction-slot";
  const instance = interactions.mount(interaction, slot);
  if (instance) activeInteractions.push(instance);
  container.appendChild(slot);
};

export function renderSpaceSlide(slide, view, { interactions, activeInteractions }) {
  switch (slide.layout) {
    case "space_uzay_nedir": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-uzay-nedir";

      const concepts = slide.concepts ?? [];
      const conceptsHtml = concepts.map((c) => `
        <div class="space-concept-pill">
          <span class="space-concept-icon" aria-hidden="true">${escapeHtml(c.icon ?? "✦")}</span>
          <span class="space-concept-label">${escapeHtml(c.label)}</span>
        </div>
      `).join("");

      const media = slide.media?.[0];
      const imgSrc = media?.src ?? "./assets/images/uzay-arastirmalari/01-dunya-ve-uzay.png";
      const imgAlt = media?.alt ?? "Dünya ve uzay görseli";

      const bottomQ = slide.bottomQuestion ?? {};
      const options = bottomQ.options ?? [
        { id: "opt_evet", text: "Evet", isCorrect: false },
        { id: "opt_hayir", text: "Hayır", isCorrect: true }
      ];

      const warning = slide.conceptWarning ?? {};

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <div class="space-header-meta">
            ${slide.kicker ? `<span class="space-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
            <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Nedir?")}</h1>
          </div>
          ${slide.question ? `
            <div class="space-hero-question-banner">
              <span class="space-question-icon">❓</span>
              <p class="space-hero-question-text">“${escapeHtml(slide.question)}”</p>
            </div>
          ` : ""}
        </header>

        <div class="space-slide-stage">
          <!-- SOL BÖLÜM: Tanım + Ana Kavramlar -->
          <div class="space-left-col">
            <!-- 1. Etkileşimli Tanım Kartı -->
            <div class="space-definition-card">
              <div class="space-def-header">
                <span class="space-def-badge">ETKİLEŞİMLİ TANIM</span>
              </div>
              <div class="space-tanim-slot"></div>
            </div>

            <!-- 2. Ana Kavramlar Kartı -->
            <div class="space-concepts-card">
              <div class="space-card-subhead">
                <span>ANA KAVRAMLAR</span>
                <small>Uzayda Neler Yer Alır?</small>
              </div>
              <div class="space-concepts-grid">
                ${conceptsHtml}
              </div>
            </div>
          </div>

          <!-- SAĞ BÖLÜM: Görsel -->
          <div class="space-right-col">
            <div class="space-visual-frame">
              <img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" class="space-visual-img" />
              <div class="space-visual-badge">
                <span class="space-dot"></span>
                <span>Dünya Atmosferi & Uzay</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ALT BÖLÜM: Soru & Mini Kavram Uyarısı -->
        <footer class="space-slide-footer">
          <!-- 4. Alt Etkileşim: Uzay tamamen boş mudur? -->
          <div class="space-quiz-card">
            <div class="space-quiz-header">
              <span class="space-quiz-icon">🤔</span>
              <strong class="space-quiz-prompt">${escapeHtml(bottomQ.prompt ?? "Uzay tamamen boş mudur?")}</strong>
            </div>
            <div class="space-quiz-actions">
              ${options.map((opt) => `
                <button type="button" class="space-choice-btn" data-choice-id="${escapeHtml(opt.id)}" data-correct="${opt.isCorrect ? "true" : "false"}">
                  ${escapeHtml(opt.text)}
                </button>
              `).join("")}
            </div>
            <div class="space-quiz-feedback" hidden aria-live="polite"></div>
          </div>

          <!-- 5. Mini Kavram Uyarısı: Tıkla -> Göster -->
          <div class="space-warning-card">
            <button type="button" class="space-warning-toggle" aria-expanded="false">
              <span class="space-warning-icon">💡</span>
              <span class="space-warning-title">${escapeHtml(warning.title ?? "Uzay ve evren aynı kavram değildir.")}</span>
              <span class="space-warning-badge">${escapeHtml(warning.buttonText ?? "Tıkla → Göster")}</span>
            </button>
            <div class="space-warning-content" hidden>
              <p>${warning.explanation ?? ""}</p>
            </div>
          </div>
        </footer>
      `;

      // 1. Reveal fill etkileşimini bağla
      const tanimSlot = slideArticle.querySelector(".space-tanim-slot");
      if (slide.interactions?.[0] && tanimSlot) {
        mountInteraction(slide.interactions[0], tanimSlot, interactions, activeInteractions);
      }

      // 4. Evet / Hayır Etkileşimi
      const choiceButtons = slideArticle.querySelectorAll(".space-choice-btn");
      const feedbackBox = slideArticle.querySelector(".space-quiz-feedback");

      choiceButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const isCorrect = btn.dataset.correct === "true";
          choiceButtons.forEach((b) => {
            b.classList.remove("is-selected-correct", "is-selected-wrong");
          });

          if (isCorrect) {
            btn.classList.add("is-selected-correct");
            feedbackBox.className = "space-quiz-feedback is-correct";
            feedbackBox.innerHTML = `<strong>Doğru!</strong> ${escapeHtml(bottomQ.correctFeedback ?? "Uzay yalnızca boşluk değildir; gaz, toz ve farklı türlerde enerji de içerir.")}`;
            feedbackBox.hidden = false;
          } else {
            btn.classList.add("is-selected-wrong");
            feedbackBox.className = "space-quiz-feedback is-wrong";
            feedbackBox.innerHTML = `<strong>Düşünelim!</strong> ${escapeHtml(bottomQ.incorrectFeedback ?? "Uzay tamamen boş değildir; gaz, toz ve enerji de bulunur.")}`;
            feedbackBox.hidden = false;
          }
        });
      });

      // 5. Mini Kavram Uyarısı (Tıkla -> Göster)
      const warningToggle = slideArticle.querySelector(".space-warning-toggle");
      const warningContent = slideArticle.querySelector(".space-warning-content");
      if (warningToggle && warningContent) {
        warningToggle.addEventListener("click", () => {
          const isOpen = warningToggle.getAttribute("aria-expanded") === "true";
          const nextState = !isOpen;
          warningToggle.setAttribute("aria-expanded", String(nextState));
          warningContent.hidden = !nextState;
          warningToggle.classList.toggle("is-open", nextState);
          const badge = warningToggle.querySelector(".space-warning-badge");
          if (badge) {
            badge.textContent = nextState ? "Gizle ✕" : (warning.buttonText ?? "Tıkla → Göster");
          }
        });
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
