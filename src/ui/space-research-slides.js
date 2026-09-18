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
      const is2Col = slide.tools?.length === 2;
      const slideArticle = document.createElement("article");
      slideArticle.className = `board-slide slide-space-uzay-araclari ${is2Col ? "is-2col" : "is-3col"}`;

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

    case "space_araclar_karsilastirma": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-araclar-karsilastirma";

      const columns = slide.columns ?? [];
      const theadHtml = `
        <thead>
          <tr>
            ${columns.map((col, idx) => `
              <th class="space-table-th space-col-${idx}">${escapeHtml(col.label)}</th>
            `).join("")}
          </tr>
        </thead>
      `;

      const rows = slide.rows ?? [];
      const tbodyHtml = `
        <tbody>
          ${rows.map((row, rIdx) => {
            const cellsHtml = columns.map((col, cIdx) => {
              if (cIdx === 0) {
                return `<td class="space-table-td space-table-feature">${escapeHtml(row.feature ?? "")}</td>`;
              }
              const cellData = row[col.id];
              if (cellData && typeof cellData === "object" && cellData.interactionId) {
                return `
                  <td class="space-table-td space-table-interactive-cell">
                    <div class="space-table-slot" data-interaction-id="${escapeHtml(cellData.interactionId)}"></div>
                  </td>
                `;
              }
              return `<td class="space-table-td space-table-cell">${escapeHtml(cellData ?? "—")}</td>`;
            }).join("");

            return `<tr class="space-table-row space-row-${rIdx + 1}">${cellsHtml}</tr>`;
          }).join("")}
        </tbody>
      `;

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Araçlarını Karşılaştıralım")}</h1>
        </header>

        <div class="space-table-wrapper">
          <table class="space-comparison-table">
            ${theadHtml}
            ${tbodyHtml}
          </table>
        </div>
      `;

      // Etkileşimleri bağla
      for (const interaction of slide.interactions ?? []) {
        const slot = slideArticle.querySelector(`.space-table-slot[data-interaction-id="${interaction.id}"]`);
        if (slot) {
          mountInteraction(interaction, slot, interactions, activeInteractions);
        }
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_haberlesme_uydulari": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-haberlesme-uydulari";

      const activeSats = slide.activeSatellites ?? [];
      const activeListHtml = activeSats.map((sat) => {
        const hasHighlight = Boolean(sat.highlight);
        return `
          <div class="satellite-pill active-pill ${hasHighlight ? "is-highlight" : ""}">
            <div class="sat-main-info">
              <span class="sat-badge-dot"></span>
              <span class="sat-name">${escapeHtml(sat.name)}</span>
            </div>
            ${hasHighlight ? `<span class="sat-highlight-label">${escapeHtml(sat.highlight)}</span>` : ""}
          </div>
        `;
      }).join("");

      const inactiveSats = slide.inactiveSatellites ?? [];
      const inactiveListHtml = inactiveSats.map((sat) => `
        <div class="satellite-pill inactive-pill">
          <span class="sat-inactive-dot"></span>
          <span class="sat-name">${escapeHtml(sat.name)}</span>
        </div>
      `).join("");

      const media = slide.media?.[0];
      const imgSrc = media?.src ?? "./assets/images/uzay-arastirmalari/06-haberlesme-uydusu.jpg";
      const imgAlt = media?.alt ?? "Türkiye’nin Haberleşme Uydusu";

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Türkiye’nin Haberleşme Uyduları")}</h1>
        </header>

        <div class="satellites-layout">
          <!-- Sol Sütun: Aktif ve Pasif Uydular -->
          <div class="satellites-col-left">
            <!-- 1. Aktif Uydular Kartı -->
            <section class="sat-section-card sat-card-active">
              <h2 class="sat-section-title">${escapeHtml(slide.activeSectionTitle ?? "Aktif Haberleşme Uyduları")}</h2>
              <div class="satellites-grid grid-active-haberlesme">
                ${activeListHtml}
              </div>
            </section>

            <!-- 2. Görevini Tamamlamış Uydular Kartı -->
            <section class="sat-section-card sat-card-inactive">
              <h2 class="sat-section-title">${escapeHtml(slide.inactiveSectionTitle ?? "Görevini Tamamlamış Haberleşme Uyduları")}</h2>
              <div class="satellites-grid grid-inactive-haberlesme">
                ${inactiveListHtml}
              </div>
            </section>
          </div>

          <!-- Sağ Sütun: Görsel -->
          <div class="satellites-col-right">
            <div class="sat-visual-frame">
              <img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" class="sat-visual-img" />
              <div class="sat-visual-badge">
                <span class="space-dot"></span>
                <span>TÜRKSAT Haberleşme Uydusu</span>
              </div>
            </div>
          </div>
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_gozlem_uydulari": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-gozlem-uydulari";

      const activeSats = slide.activeSatellites ?? [];
      const activeListHtml = activeSats.map((sat) => `
        <div class="satellite-pill active-pill sat-gozlem-pill">
          <div class="sat-main-info">
            <span class="sat-badge-dot"></span>
            <span class="sat-name">${escapeHtml(sat.name)}</span>
          </div>
          ${sat.task ? `<span class="sat-task-badge">${escapeHtml(sat.task)}</span>` : ""}
        </div>
      `).join("");

      const inactiveSats = slide.inactiveSatellites ?? [];
      const inactiveListHtml = inactiveSats.map((sat) => `
        <div class="satellite-pill inactive-pill sat-gozlem-pill">
          <span class="sat-inactive-dot"></span>
          <span class="sat-name">${escapeHtml(sat.name)}</span>
        </div>
      `).join("");

      const media = slide.media?.[0];
      const imgSrc = media?.src ?? "./assets/images/uzay-arastirmalari/07-gozlem-uydusu.jpg";
      const imgAlt = media?.alt ?? "Türkiye’nin Gözlem Uydusu";

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Türkiye’nin Gözlem Uyduları")}</h1>
        </header>

        <div class="satellites-layout">
          <!-- Sol Sütun: Aktif ve Pasif Gözlem Uyduları -->
          <div class="satellites-col-left">
            <!-- 1. Aktif Gözlem Uyduları Kartı -->
            <section class="sat-section-card sat-card-active">
              <h2 class="sat-section-title">${escapeHtml(slide.activeSectionTitle ?? "Aktif Gözlem Uyduları")}</h2>
              <div class="satellites-grid grid-active-gozlem">
                ${activeListHtml}
              </div>
            </section>

            <!-- 2. Görevini Tamamlamış Gözlem Uyduları Kartı -->
            <section class="sat-section-card sat-card-inactive">
              <h2 class="sat-section-title">${escapeHtml(slide.inactiveSectionTitle ?? "Görevini Tamamlamış Gözlem Uyduları")}</h2>
              <div class="satellites-grid grid-inactive-gozlem">
                ${inactiveListHtml}
              </div>
            </section>
          </div>

          <!-- Sağ Sütun: Görsel -->
          <div class="satellites-col-right">
            <div class="sat-visual-frame">
              <img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" class="sat-visual-img" />
              <div class="sat-visual-badge">
                <span class="space-dot"></span>
                <span>Yer Gözlem ve Keşif Uydusu</span>
              </div>
            </div>
          </div>
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_uydular_ne_ise_yarar": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-uydular-ne-ise-yarar";

      const left = slide.leftCard ?? {};
      const right = slide.rightCard ?? {};

      const leftItemsHtml = (left.items ?? []).map((item) => `
        <li class="function-item">
          <span class="function-bullet bullet-blue" aria-hidden="true">✦</span>
          <span class="function-text">${escapeHtml(item)}</span>
        </li>
      `).join("");

      const rightItemsHtml = (right.items ?? []).map((item) => `
        <li class="function-item">
          <span class="function-bullet bullet-turquoise" aria-hidden="true">✦</span>
          <span class="function-text">${escapeHtml(item)}</span>
        </li>
      `).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uydular Ne İşe Yarar?")}</h1>
        </header>

        <div class="functions-cards-layout">
          <!-- Sol Kart: Haberleşme Uyduları (Mavi Tema) -->
          <div class="function-card card-blue">
            <div class="function-card-header">
              <h2 class="function-card-title title-blue">${escapeHtml(left.title ?? "HABERLEŞME UYDULARI")}</h2>
            </div>
            <div class="function-card-visual">
              <img src="${escapeHtml(left.image ?? "./assets/images/uzay-arastirmalari/08-haberlesme-gorev.jpg")}" alt="${escapeHtml(left.title ?? "Haberleşme Uyduları")}" class="function-card-img" />
            </div>
            <ul class="function-items-list">
              ${leftItemsHtml}
            </ul>
          </div>

          <!-- Sağ Kart: Gözlem Uyduları (Turkuaz Tema) -->
          <div class="function-card card-turquoise">
            <div class="function-card-header">
              <h2 class="function-card-title title-turquoise">${escapeHtml(right.title ?? "GÖZLEM UYDULARI")}</h2>
            </div>
            <div class="function-card-visual">
              <img src="${escapeHtml(right.image ?? "./assets/images/uzay-arastirmalari/08-gozlem-gorev.jpg")}" alt="${escapeHtml(right.title ?? "Gözlem Uyduları")}" class="function-card-img" />
            </div>
            <ul class="function-items-list">
              ${rightItemsHtml}
            </ul>
          </div>
        </div>

        <!-- Alt Kısım: 2 Boşluklu reveal_fill Etkileşimi -->
        <div class="space-bottom-interaction-card functions-bottom-interaction">
          <div class="space-bottom-slot"></div>
        </div>
      `;

      // Etkileşimi bağla
      const bottomSlot = slideArticle.querySelector(".space-bottom-slot");
      if (slide.interactions?.[0] && bottomSlot) {
        mountInteraction(slide.interactions[0], bottomSlot, interactions, activeInteractions);
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_teleskop_nedir": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-teleskop-nedir";

      const parts = slide.parts ?? [];
      const partsHtml = parts.map((part) => `
        <div class="teleskop-part-badge" style="left: ${part.x}%; top: ${part.y}%;">
          <span class="part-badge-dot" aria-hidden="true"></span>
          <span class="part-badge-name">${escapeHtml(part.name)}</span>
        </div>
      `).join("");

      const types = slide.types ?? [];
      const typesHtml = types.map((t) => `
        <div class="teleskop-type-card">
          <div class="type-card-visual">
            <img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.name)}" class="type-card-img" />
          </div>
          <div class="type-card-footer">
            <span class="type-card-name">${escapeHtml(t.name)}</span>
          </div>
        </div>
      `).join("");

      const media = slide.media?.[0];
      const mainImgSrc = media?.src ?? "./assets/images/uzay-arastirmalari/09-teleskop-ana.jpg";
      const mainImgAlt = media?.alt ?? "Teleskobun yapısı ve kısımları";

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Teleskop Nedir?")}</h1>
        </header>

        <div class="teleskop-layout">
          <!-- Üst / Ana Bölüm: Sol Bilgi Metinleri + Sağ Etiketli Görsel -->
          <div class="teleskop-main-section">
            <div class="teleskop-info-box">
              <div class="teleskop-info-lead">
                <p class="teleskop-def-p">${escapeHtml(slide.definition ?? "")}</p>
              </div>
              <div class="teleskop-info-detail">
                <p class="teleskop-usage-p">${escapeHtml(slide.usage ?? "")}</p>
              </div>
            </div>

            <div class="teleskop-diagram-box">
              <div class="teleskop-diagram-canvas">
                <img src="${escapeHtml(mainImgSrc)}" alt="${escapeHtml(mainImgAlt)}" class="teleskop-main-img" />
                <div class="teleskop-parts-overlay">
                  ${partsHtml}
                </div>
              </div>
            </div>
          </div>

          <!-- Alt Bölüm: 3 Tür Kartı -->
          <div class="teleskop-types-section">
            ${typesHtml}
          </div>
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_teleskop_cesitleri": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-teleskop-cesitleri";

      const leftCard = slide.leftCard ?? {};
      const rightCard = slide.rightCard ?? {};

      const leftExamplesHtml = (leftCard.examples ?? []).map((ex) => `
        <div class="karsilastirma-example-item">
          <span class="example-dot" aria-hidden="true"></span>
          <span class="example-name">${escapeHtml(ex)}</span>
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Teleskop Çeşitleri")}</h1>
        </header>

        <div class="teleskop-cesitleri-grid">
          <!-- SOL KART: UZAY TELESKOPLARI -->
          <div class="teleskop-karsilastirma-card uzay-teleskop-card">
            <div class="karsilastirma-visual-box">
              <img src="${escapeHtml(leftCard.image ?? "")}" alt="${escapeHtml(leftCard.title ?? "")}" class="karsilastirma-card-img" />
              <div class="karsilastirma-card-badge">
                <span class="card-badge-dot"></span>
                <span>Uzay Tabanlı</span>
              </div>
            </div>
            <div class="karsilastirma-card-content">
              <h2 class="karsilastirma-card-title">${escapeHtml(leftCard.title ?? "UZAY TELESKOPLARI")}</h2>
              <p class="karsilastirma-main-desc">${escapeHtml(leftCard.desc ?? "")}</p>
              <div class="karsilastirma-detail-box">
                <p class="karsilastirma-second-info">${escapeHtml(leftCard.detail ?? "")}</p>
              </div>
              <div class="karsilastirma-bottom-section">
                <span class="karsilastirma-bottom-label">Önemli Örnekler:</span>
                <div class="karsilastirma-examples-list">
                  ${leftExamplesHtml}
                </div>
              </div>
            </div>
          </div>

          <!-- SAĞ KART: YER TABANLI TELESKOPLAR -->
          <div class="teleskop-karsilastirma-card yer-teleskop-card">
            <div class="karsilastirma-visual-box">
              <img src="${escapeHtml(rightCard.image ?? "")}" alt="${escapeHtml(rightCard.title ?? "")}" class="karsilastirma-card-img" />
              <div class="karsilastirma-card-badge yer-badge">
                <span class="card-badge-dot yer-dot"></span>
                <span>Yer Tabanlı</span>
              </div>
            </div>
            <div class="karsilastirma-card-content">
              <h2 class="karsilastirma-card-title">${escapeHtml(rightCard.title ?? "YER TABANLI TELESKOPLAR")}</h2>
              <p class="karsilastirma-main-desc">${escapeHtml(rightCard.desc ?? "")}</p>
              <div class="karsilastirma-detail-box yer-detail-box">
                <p class="karsilastirma-second-info">${escapeHtml(rightCard.detail ?? "")}</p>
              </div>
              <div class="karsilastirma-bottom-section">
                <span class="karsilastirma-bottom-label">Temel Avantaj:</span>
                <div class="karsilastirma-comparison-pill">
                  <span class="comparison-check" aria-hidden="true">✓</span>
                  <span class="comparison-text">${escapeHtml(rightCard.comparison ?? "Bakım ve yenileme daha kolay")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_gozlemevi_nerelere_kurulur": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-gozlemevi-nerelere-kurulur";

      const criteria = slide.criteria ?? [];
      const criteriaHtml = criteria.map((item) => `
        <div class="gozlemevi-criteria-pill">
          <span class="criteria-bullet" aria-hidden="true">●</span>
          <span class="criteria-text">${escapeHtml(item)}</span>
        </div>
      `).join("");

      const compQ = slide.comparisonQuestion ?? {};
      const options = compQ.options ?? [];
      const optA = options[0] ?? {};
      const optB = options[1] ?? {};

      const optAFeatures = (optA.features ?? []).map((f) => `<span class="choice-feature-tag">${escapeHtml(f)}</span>`).join("");
      const optBFeatures = (optB.features ?? []).map((f) => `<span class="choice-feature-tag">${escapeHtml(f)}</span>`).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Gözlemevi Nerelere Kurulur?")}</h1>
        </header>

        <div class="gozlemevi-page-layout">
          <!-- Üst Tanım Çubuğu -->
          <div class="gozlemevi-tanim-card">
            <span class="gozlemevi-tanim-badge">TANIM</span>
            <p class="gozlemevi-tanim-p">${escapeHtml(slide.definition ?? "")}</p>
          </div>

          <!-- Orta Bölüm: Büyük Dağ Gözlemevi Görseli + 6 Kriter Etiketi -->
          <div class="gozlemevi-main-row">
            <div class="gozlemevi-hero-visual">
              <img src="${escapeHtml(slide.observatoryImage ?? "./assets/images/uzay-arastirmalari/11-dag-gozlemevi.jpg")}" alt="Dağ Gözlemevi" class="gozlemevi-hero-img" />
              <div class="gozlemevi-hero-badge">
                <span class="hero-badge-dot"></span>
                <span>Optik Gözlemevi (Rasathane)</span>
              </div>
            </div>

            <div class="gozlemevi-criteria-section">
              <div class="criteria-section-header">
                <span class="criteria-section-title">Kurulum İçin Aranan Şartlar (MEB)</span>
              </div>
              <div class="gozlemevi-criteria-grid">
                ${criteriaHtml}
              </div>
            </div>
          </div>

          <!-- Alt Bölüm: A / B Karşılaştırma Etkileşimi -->
          <div class="gozlemevi-interactive-section">
            <div class="gozlemevi-question-bar">
              <span class="gozlemevi-q-badge">SORU</span>
              <span class="gozlemevi-question-text">${escapeHtml(compQ.question ?? "Gözlemevi kurmak için hangisi daha uygundur?")}</span>
            </div>

            <div class="gozlemevi-choices-row">
              <!-- A Seçeneği: Şehir Merkezi -->
              <div class="gozlemevi-choice-card choice-opt-a" role="button" tabindex="0" data-choice="A" aria-label="A seçeneği: Şehir merkezi">
                <div class="choice-card-head">
                  <span class="choice-letter">A</span>
                  <span class="choice-title">${escapeHtml(optA.title ?? "Şehir Merkezi")}</span>
                </div>
                <div class="choice-card-content">
                  <div class="choice-thumbnail-frame">
                    <img src="${escapeHtml(optA.image ?? "")}" alt="Şehir Merkezi" class="choice-thumbnail-img" />
                  </div>
                  <div class="choice-features-tags">
                    ${optAFeatures}
                  </div>
                </div>
              </div>

              <!-- B Seçeneği: Yüksek ve Karanlık Dağlık Bölge (Doğru) -->
              <div class="gozlemevi-choice-card choice-opt-b" role="button" tabindex="0" data-choice="B" aria-label="B seçeneği: Yüksek ve karanlık dağlık bölge">
                <div class="choice-card-head">
                  <span class="choice-letter">B</span>
                  <span class="choice-title">${escapeHtml(optB.title ?? "Yüksek ve Karanlık Dağlık Bölge")}</span>
                </div>
                <div class="choice-card-content">
                  <div class="choice-thumbnail-frame">
                    <img src="${escapeHtml(optB.image ?? "")}" alt="Yüksek ve Karanlık Dağlık Bölge" class="choice-thumbnail-img" />
                  </div>
                  <div class="choice-features-tags">
                    ${optBFeatures}
                  </div>
                </div>
              </div>
            </div>

            <!-- Doğru Cevap Sonrası Geri Bildirim -->
            <div class="gozlemevi-feedback-box is-hidden" id="gozlemeviFeedbackBox" aria-live="polite">
              <span class="feedback-indicator">DOĞRU SEÇİM</span>
              <p class="gozlemevi-feedback-text">${escapeHtml(compQ.feedback ?? "")}</p>
            </div>
          </div>
        </div>
      `;

      // Etkileşim kontrolü: A ve B tıklamaları
      const cardA = slideArticle.querySelector(".choice-opt-a");
      const cardB = slideArticle.querySelector(".choice-opt-b");
      const feedbackBox = slideArticle.querySelector("#gozlemeviFeedbackBox");

      const selectOption = (opt) => {
        if (opt === "B") {
          cardB?.classList.add("is-correct");
          cardB?.classList.remove("is-dimmed");
          cardA?.classList.add("is-dimmed");
          cardA?.classList.remove("is-incorrect");
          if (feedbackBox) feedbackBox.classList.remove("is-hidden");
        } else {
          cardA?.classList.add("is-incorrect");
          cardA?.classList.remove("is-dimmed");
          cardB?.classList.remove("is-dimmed");
        }
      };

      cardA?.addEventListener("click", () => selectOption("A"));
      cardA?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectOption("A");
        }
      });

      cardB?.addEventListener("click", () => selectOption("B"));
      cardB?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectOption("B");
        }
      });

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_uzay_teknolojileri_gunluk_hayat": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-uzay-teknolojileri-gunluk-hayat";

      const areas = slide.areas ?? [];
      const cardsHtml = areas.map((area) => `
        <div class="tech-area-card card-theme-${escapeHtml(area.theme ?? "blue")}">
          <div class="tech-card-header">
            <span class="tech-order-badge">${escapeHtml(String(area.order ?? ""))}</span>
            <h2 class="tech-card-title">${escapeHtml(area.title ?? "")}</h2>
          </div>
          <div class="tech-card-body">
            <div class="tech-thumb-frame">
              <img src="${escapeHtml(area.image ?? "")}" alt="${escapeHtml(area.title ?? "")}" class="tech-thumb-img" />
            </div>
            <p class="tech-card-desc">${escapeHtml(area.desc ?? "")}</p>
          </div>
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Uzay Teknolojilerinin Günlük Hayattaki Kullanımı")}</h1>
        </header>

        <div class="tech-areas-grid">
          ${cardsHtml}
        </div>

        <div class="space-bottom-interaction-card tech-bottom-interaction">
          <div class="space-bottom-slot"></div>
        </div>
      `;

      const bottomSlot = slideArticle.querySelector(".space-bottom-slot");
      if (slide.interactions?.[0] && bottomSlot) {
        mountInteraction(slide.interactions[0], bottomSlot, interactions, activeInteractions);
      }

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "space_isik_kirliligi": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-space-isik-kirliligi";

      const comp = slide.comparison ?? {};
      const left = comp.left ?? {};
      const right = comp.right ?? {};
      const consequences = slide.consequences ?? [];

      const consequencesHtml = consequences.map((c) => `
        <div class="isik-consequence-item">
          <span class="isik-bullet" aria-hidden="true">●</span>
          <span class="isik-consequence-text">${escapeHtml(c)}</span>
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="space-slide-header">
          <h1 class="space-slide-title">${escapeHtml(slide.title ?? "Işık Kirliliği")}</h1>
        </header>

        <div class="isik-layout">
          <!-- Üst Tanım Çubuğu (36px) -->
          <div class="isik-tanim-card">
            <span class="isik-tanim-badge">TANIM</span>
            <p class="isik-tanim-p">${escapeHtml(slide.definition ?? "")}</p>
          </div>

          <!-- İki Büyük Karşılaştırma Görsel Kartı -->
          <div class="isik-comparison-row">
            <!-- Sol Kart: Yoğun Işıklı Şehir -->
            <div class="isik-card card-city">
              <div class="isik-card-head">
                <span class="isik-card-badge badge-warning">${escapeHtml(left.badge ?? "IŞIK KİRLİLİĞİ FAZLA")}</span>
                <h2 class="isik-card-title">${escapeHtml(left.title ?? "Yoğun Işıklı Şehir")}</h2>
              </div>
              <div class="isik-visual-frame">
                <img src="${escapeHtml(left.image ?? "./assets/images/uzay-arastirmalari/13-sehir-isik-kirliligi.jpg")}" alt="${escapeHtml(left.title ?? "")}" class="isik-visual-img" />
              </div>
              <div class="isik-card-caption">
                <span class="caption-text">${escapeHtml(left.desc ?? "Yıldızların zor görüldüğü gökyüzü")}</span>
              </div>
            </div>

            <!-- Sağ Kart: Karanlık ve Doğal Gökyüzü -->
            <div class="isik-card card-dark">
              <div class="isik-card-head">
                <span class="isik-card-badge badge-success">${escapeHtml(right.badge ?? "IŞIK KİRLİLİĞİ AZ")}</span>
                <h2 class="isik-card-title">${escapeHtml(right.title ?? "Karanlık ve Doğal Gökyüzü")}</h2>
              </div>
              <div class="isik-visual-frame">
                <img src="${escapeHtml(right.image ?? "./assets/images/uzay-arastirmalari/13-karanlik-gokyuzu.jpg")}" alt="${escapeHtml(right.title ?? "")}" class="isik-visual-img" />
              </div>
              <div class="isik-card-caption">
                <span class="caption-text">${escapeHtml(right.desc ?? "Yıldızların net görüldüğü görünüm")}</span>
              </div>
            </div>
          </div>

          <!-- Alt Bölüm: 3 Maddelik Sonuç Kartı -->
          <div class="isik-consequences-card">
            <div class="isik-consequences-header">
              <span class="isik-consequences-title">Işık Kirliliğinin Gözlemlere Etkileri</span>
            </div>
            <div class="isik-consequences-grid">
              ${consequencesHtml}
            </div>
          </div>

          <!-- En Altta Vurgu Cümlesi -->
          <div class="isik-highlight-bar">
            <span class="isik-highlight-icon" aria-hidden="true">★</span>
            <p class="isik-highlight-text">${escapeHtml(slide.highlight ?? "Işık kirliliği azaldıkça gökyüzü gözlemleri daha net yapılır.")}</p>
          </div>
        </div>
      `;

      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
