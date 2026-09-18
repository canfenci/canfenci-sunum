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

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Nedir?")}</h1>
        </header>

        <div class="space-slide-stage">
          <!-- SOL BÖLÜM: Tanım + Ana Kavramlar -->
          <div class="space-left-col">
            <!-- 1. Etkileşimli Tanım Kartı -->
            <div class="space-definition-card">
              <div class="space-def-header">
                <span class="space-def-badge">TANIM</span>
              </div>
              <div class="space-tanim-slot"></div>
            </div>

            <!-- 2. Alttaki 6 Ana Kavram Kartı -->
            <div class="space-concepts-card">
              <div class="space-card-subhead">
                <span>Uzayda Neler Yer Alır?</span>
              </div>
              <div class="space-concepts-grid">
                ${conceptsHtml}
              </div>
            </div>
          </div>

          <!-- SAĞ BÖLÜM: Büyük Görsel -->
          <div class="space-right-col">
            <div class="space-visual-frame">
              <img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" class="space-visual-img" />
              <div class="space-visual-badge">
                <span class="space-dot"></span>
                <span>Dünya Atmosferi &amp; Uzay</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Reveal fill etkileşimini bağla
      const tanimSlot = slideArticle.querySelector(".space-tanim-slot");
      if (slide.interactions?.[0] && tanimSlot) {
        mountInteraction(slide.interactions[0], tanimSlot, interactions, activeInteractions);
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_uzay_neden_yapilir": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-uzay-neden-yapilir";

      const purposes = slide.purposes ?? [];
      const purposesHtml = purposes.map((p, idx) => `
        <div class="space-purpose-card space-purpose-item-${idx + 1}">
          <span class="space-purpose-num" aria-hidden="true">${idx + 1}</span>
          <span class="space-purpose-icon" aria-hidden="true">${escapeHtml(p.icon ?? "✦")}</span>
          <h3 class="space-purpose-title">${escapeHtml(p.title)}</h3>
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Araştırmaları Neden Yapılır?")}</h1>
        </header>

        <!-- 5 Amaç Grid (2 + 3 Sade Düzen) -->
        <div class="space-purposes-section">
          <div class="space-purposes-grid">
            ${purposesHtml}
          </div>
        </div>

        <!-- Alt Etkileşim: reveal_fill -->
        <div class="space-bottom-interaction-card">
          <div class="space-bottom-slot"></div>
        </div>
      `;

      // Reveal fill etkileşimini bağla
      const bottomSlot = slideArticle.querySelector(".space-bottom-slot");
      if (slide.interactions?.[0] && bottomSlot) {
        mountInteraction(slide.interactions[0], bottomSlot, interactions, activeInteractions);
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_uzay_araclari": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-uzay-araclari";

      const tools = slide.tools ?? [];
      const toolsHtml = tools.map((tool, idx) => {
        const imgSrc = tool.image ?? slide.media?.[idx]?.src ?? "";
        const imgAlt = tool.name ?? "Uzay aracı";
        return `
          <div class="space-tool-card space-tool-item-${idx + 1}">
            <div class="space-tool-visual">
              <img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" class="space-tool-img" />
            </div>
            <div class="space-tool-info">
              <h2 class="space-tool-name">${escapeHtml(tool.name)}</h2>
              <p class="space-tool-desc">${escapeHtml(tool.desc)}</p>
            </div>
          </div>
        `;
      }).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Araştırmalarında Kullanılan Araçlar")}</h1>
        </header>

        <div class="space-tools-grid">
          ${toolsHtml}
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
