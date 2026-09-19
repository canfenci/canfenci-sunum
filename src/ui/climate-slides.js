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

    default:
      return false;
  }
}
