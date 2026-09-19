const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

const mountInteraction = (interaction, container, interactions, activeInteractions) => {
  if (!interaction || !container || !interactions) return;
  const slot = document.createElement("div");
  slot.className = "interaction-slot climate-definition-slot";
  const instance = interactions.mount(interaction, slot);
  if (instance) activeInteractions?.push(instance);
  container.appendChild(slot);
};

export function renderClimateSlide(slide, view, { interactions, activeInteractions } = {}) {
  switch (slide.layout) {
    case "climate_cover": {
      const media = slide.media?.[0];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-cover";
      slideArticle.innerHTML = `
        <div class="climate-cover-layout">
          <section class="climate-cover-copy" aria-label="Kapak bilgileri">
            <p class="climate-cover-grade">${escapeHtml(slide.kicker ?? "8. Sınıf Fen Bilimleri")}</p>
            <h1 class="climate-cover-title">${escapeHtml(slide.title ?? "İklim ve Hava Hareketleri")}</h1>
            <p class="climate-cover-unit">${escapeHtml(slide.subtitle ?? "Mevsimler ve İklim Ünitesi")}</p>
            ${slide.label ? `<p class="climate-cover-label">${escapeHtml(slide.label)}</p>` : ""}
          </section>
          <figure class="climate-cover-visual">
            <img src="${escapeHtml(media?.src ?? "./assets/images/iklim-ve-hava-hareketleri/01-kapak-iklim-ve-hava-hareketleri.png")}" alt="${escapeHtml(media?.alt ?? "İklim, atmosfer ve hava hareketleri görseli")}" class="climate-cover-img" />
          </figure>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_atmosphere": {
      const media = slide.media?.[0];
      const composition = slide.composition ?? [
        { value: "%78", label: "AZOT" },
        { value: "%21", label: "OKSİJEN" },
        { value: "%1", label: "DİĞER GAZLAR" }
      ];
      const duties = slide.duties ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-atmosphere";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "ATMOSFER")}</h1>
        </header>
        <div class="climate-atmosphere-main">
          <section class="climate-atmosphere-left">
            <div class="climate-card climate-definition-card">
              <div class="climate-definition-copy">
                <div class="climate-definition-interaction"></div>
              </div>
              <figure class="climate-atmosphere-visual">
                <img src="${escapeHtml(media?.src ?? "./assets/images/iklim-ve-hava-hareketleri/01-kapak-iklim-ve-hava-hareketleri.png")}" alt="${escapeHtml(media?.alt ?? "Atmosfer görseli")}" />
              </figure>
            </div>
            <div class="climate-duty-grid">
              ${duties.map((duty) => `<div class="climate-card climate-duty-card"><p>${escapeHtml(duty)}</p></div>`).join("")}
            </div>
          </section>
          <section class="climate-atmosphere-right">
            <div class="climate-card climate-composition-card">
              <h2>${escapeHtml(slide.compositionTitle ?? "Havanın Bileşimi")}</h2>
              <div class="climate-donut-wrap" aria-label="Havanın bileşimi halka grafiği">
                <div class="climate-donut-chart">
                  <div class="climate-donut-center">
                    <strong>HAVA</strong>
                  </div>
                </div>
              </div>
              <div class="climate-composition-grid">
                ${composition.map((item) => `
                  <div class="climate-mini-card">
                    <strong>${escapeHtml(item.value)}</strong>
                    <span>${escapeHtml(item.label)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </section>
        </div>
        <div class="climate-card climate-bottom-info">
          <p>${escapeHtml(slide.bottomInfo ?? "Su buharı ve karbondioksit, hava olaylarının oluşmasında önemli rol oynar.")}</p>
        </div>
      `;
      const definitionSlot = slideArticle.querySelector(".climate-definition-interaction");
      const definitionInteraction = slide.interactions?.find((item) => item.id === "interaction_slide_2_atmosfer_tanim") ?? slide.interactions?.[0];
      if (definitionInteraction) {
        mountInteraction(definitionInteraction, definitionSlot, interactions, activeInteractions);
      } else if (definitionSlot) {
        definitionSlot.innerHTML = `<p>${escapeHtml(slide.definition ?? "Dünya’nın etrafını saran gaz tabakasına atmosfer denir.")}</p>`;
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_weather_events": {
      const events = slide.weatherEvents ?? [];
      const causeCards = slide.causeCards ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-weather-events";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "HAVA OLAYLARI")}</h1>
        </header>
        <div class="climate-weather-main">
          <section class="climate-card climate-weather-definition-card">
            <div class="climate-weather-definition-slot"></div>
          </section>
          <section class="climate-weather-visual-grid" aria-label="Hava olayları görsel matrisi">
            ${events.map((event) => `
              <figure class="climate-weather-item">
                <img src="${escapeHtml(event.image ?? "")}" alt="${escapeHtml(event.label)} hava olayı görseli" class="climate-weather-img" />
                <figcaption>${escapeHtml(event.label)}</figcaption>
              </figure>
            `).join("")}
          </section>
        </div>
        <section class="climate-weather-causes" aria-label="Hava olaylarının oluşum nedenleri">
          ${causeCards.map((card) => `
            <article class="climate-card climate-cause-card climate-cause-${escapeHtml(card.tone ?? "")}">
              <h2>${escapeHtml(card.title)}</h2>
              <p>${escapeHtml(card.desc)}</p>
            </article>
          `).join("")}
        </section>
      `;
      const definitionSlot = slideArticle.querySelector(".climate-weather-definition-slot");
      const definitionInteraction = slide.interactions?.find((item) => item.id === "interaction_slide_3_hava_olaylari_tanim") ?? slide.interactions?.[0];
      if (definitionInteraction) {
        mountInteraction(definitionInteraction, definitionSlot, interactions, activeInteractions);
      } else if (definitionSlot) {
        definitionSlot.innerHTML = `<p>${escapeHtml(slide.definition ?? "")}</p>`;
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_meteorology_tools": {
      const concepts = slide.concepts ?? [];
      const tools = slide.tools ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-meteorology-tools";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "METEOROLOJİ VE ÖLÇÜM ARAÇLARI")}</h1>
        </header>
        <section class="climate-meteorology-concepts" aria-label="Meteoroloji ve meteorolog kavramları">
          ${concepts.map((concept) => `
            <article class="climate-card climate-concept-card climate-concept-${escapeHtml(concept.tone ?? "blue")}">
              <h2>${escapeHtml(concept.title)}</h2>
              <p>${escapeHtml(concept.description)}</p>
            </article>
          `).join("")}
        </section>
        <section class="climate-meteorology-tools-grid" aria-label="Meteorolojik ölçüm araçları">
          ${tools.map((tool) => `
            <article class="climate-card climate-tool-card climate-tool-${escapeHtml(tool.tone ?? "slate")}">
              <figure class="climate-tool-visual">
                <img src="${escapeHtml(tool.image ?? "")}" alt="${escapeHtml(tool.alt ?? `${tool.title} görseli`)}" />
              </figure>
              <div class="climate-tool-copy">
                <h2>${escapeHtml(tool.title)}</h2>
                <p>${escapeHtml(tool.description)}</p>
              </div>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_pressure_formation":
    case "climate_pressure_comparison": {
      const isFormation = slide.layout === "climate_pressure_formation";
      const areas = slide.areas ?? [];
      const comparison = slide.comparison ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = `board-slide ${isFormation ? "slide-climate-pressure-formation" : "slide-climate-pressure-comparison"}`;
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "BASINÇ ALANLARI")}</h1>
        </header>
        ${isFormation ? `
          <section class="climate-pressure-process" aria-label="Basınç alanlarının oluşum süreci">
            ${slide.process?.map((step, index) => `
              <div class="climate-pressure-process-step"><strong>${escapeHtml(step)}</strong></div>
              ${index < slide.process.length - 1 ? `<span class="climate-pressure-process-arrow" aria-hidden="true">→</span>` : ""}
            `).join("") ?? ""}
          </section>
        ` : ""}
        <section class="climate-pressure-areas" aria-label="Basınç alanları karşılaştırması">
          ${areas.map((area) => `
            <article class="climate-card climate-pressure-area climate-pressure-${escapeHtml(area.tone ?? "cool")}">
              <figure class="climate-pressure-visual">
                <img src="${escapeHtml(area.image ?? "")}" alt="${escapeHtml(area.alt ?? `${area.title} diyagramı`)}" />
              </figure>
              <div class="climate-pressure-copy">
                <h2>${escapeHtml(area.title)}</h2>
                <div class="climate-pressure-points">
                  ${(area.points ?? []).map((point) => `<p>${escapeHtml(point)}</p>`).join("")}
                </div>
              </div>
            </article>
          `).join("")}
        </section>
        <section class="climate-pressure-comparison" aria-label="Basınç alanları hızlı hatırlama">
          ${comparison.map((item) => `<div class="climate-card climate-pressure-summary climate-pressure-${escapeHtml(item.tone ?? "cool")}"><p>${escapeHtml(item.text)}</p></div>`).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
