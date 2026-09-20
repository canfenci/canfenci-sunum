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

const registerLocalInteraction = (activeInteractions, reset, destroy = () => {}) => {
  activeInteractions?.push({ reset, destroy });
};

const climateHeader = (title, notebook = false) => `
  <header class="climate-slide-header${notebook ? " climate-notebook-header" : ""}">
    <h1 class="climate-slide-title">${escapeHtml(title)}</h1>
    ${notebook ? '<span class="climate-notebook-badge" aria-label="Defter özeti">📓</span>' : ""}
  </header>
`;

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

    case "climate_tool_match": {
      const tools = slide.tools ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-tool-match climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "METEOROLOJİ VE ÖLÇÜM ARAÇLARI")}
        <p class="climate-instruction">Bir ölçüm aracı seç, ardından ölçtüğü büyüklüğe dokun.</p>
        <section class="climate-tool-match-stage">
          <div class="climate-match-tools" aria-label="Ölçüm araçları">
            ${tools.map((tool, index) => `<button type="button" class="climate-match-tool" data-index="${index}"><img src="${escapeHtml(tool.image)}" alt="${escapeHtml(tool.title)}"/><strong>${escapeHtml(tool.title)}</strong></button>`).join("")}
          </div>
          <div class="climate-match-measures" aria-label="Ölçülen büyüklükler">
            ${[...tools].reverse().map((tool) => `<button type="button" class="climate-match-measure" data-measure="${escapeHtml(tool.measure)}">${escapeHtml(tool.measure)}</button>`).join("")}
          </div>
        </section>
        <p class="climate-feedback" aria-live="polite">Eşleştirmeye başlamak için bir araç seç.</p>
      `;
      let selected = null;
      const toolButtons = [...slideArticle.querySelectorAll(".climate-match-tool")];
      const measureButtons = [...slideArticle.querySelectorAll(".climate-match-measure")];
      const feedback = slideArticle.querySelector(".climate-feedback");
      toolButtons.forEach((button) => button.addEventListener("click", () => {
        if (button.classList.contains("is-correct")) return;
        toolButtons.forEach((item) => item.classList.remove("is-selected", "is-wrong"));
        selected = Number(button.dataset.index);
        button.classList.add("is-selected");
        feedback.textContent = `${tools[selected].title} neyi ölçer?`;
      }));
      measureButtons.forEach((button) => button.addEventListener("click", () => {
        if (selected === null || button.classList.contains("is-correct")) return;
        const toolButton = toolButtons[selected];
        if (button.dataset.measure === tools[selected].measure) {
          toolButton.classList.remove("is-selected");
          toolButton.classList.add("is-correct");
          button.classList.add("is-correct");
          feedback.textContent = `Doğru: ${tools[selected].title} → ${tools[selected].measure}`;
          selected = null;
        } else {
          toolButton.classList.add("is-wrong");
          button.classList.add("is-wrong");
          feedback.textContent = "Bir kez daha düşün.";
          setTimeout(() => button.classList.remove("is-wrong"), 320);
        }
      }));
      const reset = () => {
        selected = null;
        [...toolButtons, ...measureButtons].forEach((item) => item.classList.remove("is-selected", "is-correct", "is-wrong"));
        feedback.textContent = "Eşleştirmeye başlamak için bir araç seç.";
      };
      registerLocalInteraction(activeInteractions, reset);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_notebook": {
      const sections = slide.sections ?? [];
      const columns = slide.columns ?? [];
      const precipitationTypes = slide.precipitationTypes ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-notebook";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "ÖZET", true)}
        ${columns.length ? `<section class="climate-notebook-columns">${columns.map((column) => `<article><h2>${escapeHtml(column.title)}</h2><ul>${column.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></article>`).join("")}</section>` : ""}
        ${sections.length ? `<section class="climate-notebook-sections">${sections.map((section) => `<article><h2>${escapeHtml(section.title)}</h2>${section.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</article>`).join("")}</section>` : ""}
        ${precipitationTypes.length ? `<section class="climate-notebook-precipitation">${precipitationTypes.map((item) => `<article class="climate-note-${escapeHtml(item.tone)}"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.text)}</p></article>`).join("")}</section>` : ""}
        ${slide.note ? `<aside class="climate-notebook-note">${escapeHtml(slide.note)}</aside>` : ""}
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_pressure_notebook": {
      const cards = slide.cards ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-pressure-notebook";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "BASINÇ OLUŞUMU", true)}
        <section class="climate-pressure-notebook-grid" aria-label="Basınç oluşumu özeti">
          ${cards.map((card) => `
            <article class="climate-pressure-notebook-card climate-pressure-note-${escapeHtml(card.tone ?? "slate")}">
              <h2>${escapeHtml(card.title ?? "")}</h2>
              <div>${(card.lines ?? []).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_pressure_reveal": {
      const scenes = slide.scenes ?? [];
      const steps = slide.steps ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-pressure-reveal climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "BASINÇ NASIL OLUŞUR?")}
        <section class="climate-pressure-scene-pair">${scenes.map((scene) => `<figure class="climate-process-scene climate-process-${escapeHtml(scene.tone)}"><img src="${escapeHtml(scene.image)}" alt="${escapeHtml(scene.title)}"/><figcaption>${escapeHtml(scene.title)}</figcaption></figure>`).join("")}</section>
        <section class="climate-progress-track">${steps.map((step, index) => `<div class="climate-progress-step" data-step="${index}"><span>${index + 1}</span><p>${escapeHtml(step)}</p></div>`).join("")}</section>
        <button type="button" class="climate-reveal-next">Sonraki adım</button>
      `;
      const stepEls = [...slideArticle.querySelectorAll(".climate-progress-step")];
      const next = slideArticle.querySelector(".climate-reveal-next");
      let current = 0;
      const render = () => {
        stepEls.forEach((item, index) => item.classList.toggle("is-revealed", index < current));
        next.textContent = current >= steps.length ? "Süreç tamamlandı" : "Sonraki adım";
        next.disabled = current >= steps.length;
      };
      next.addEventListener("click", () => { current = Math.min(steps.length, current + 1); render(); });
      registerLocalInteraction(activeInteractions, () => { current = 0; render(); });
      render();
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_pressure_toggle":
    case "climate_breeze_toggle": {
      const modes = slide.modes ?? [];
      const isBreeze = slide.layout === "climate_breeze_toggle";
      const slideArticle = document.createElement("article");
      slideArticle.className = `board-slide climate-interactive-slide ${isBreeze ? "slide-climate-breeze-toggle" : "slide-climate-pressure-toggle"}`;
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "KARŞILAŞTIR")}
        <div class="climate-segmented-control">${modes.map((mode, index) => `<button type="button" data-index="${index}">${escapeHtml(isBreeze ? mode.period : mode.title)}</button>`).join("")}</div>
        <section class="climate-toggle-scene" aria-live="polite">
          <figure><img alt=""/></figure>
          <div class="climate-toggle-copy"><span></span><h2></h2><strong class="climate-toggle-direction"></strong><div class="climate-toggle-facts"></div></div>
        </section>
      `;
      const buttons = [...slideArticle.querySelectorAll(".climate-segmented-control button")];
      const scene = slideArticle.querySelector(".climate-toggle-scene");
      const render = (index) => {
        const mode = modes[index];
        buttons.forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === index));
        scene.className = `climate-toggle-scene climate-toggle-${escapeHtml(mode.tone ?? (index ? "night" : "day"))}`;
        scene.querySelector("img").src = mode.image;
        scene.querySelector("img").alt = `${mode.title} bilimsel şeması`;
        scene.querySelector("span").textContent = mode.period ?? "";
        scene.querySelector("h2").textContent = mode.title;
        scene.querySelector(".climate-toggle-direction").textContent = mode.direction ?? "";
        const facts = mode.facts ?? mode.details ?? [];
        scene.querySelector(".climate-toggle-facts").innerHTML = facts.map((fact) => `<p>${escapeHtml(fact)}</p>`).join("");
      };
      buttons.forEach((button) => button.addEventListener("click", () => render(Number(button.dataset.index))));
      registerLocalInteraction(activeInteractions, () => render(0));
      render(0);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_wind_predict": {
      const reveals = slide.reveals ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-wind-predict climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "RÜZGÂR HANGİ YÖNDE ESER?")}
        <section class="climate-wind-predict-stage">
          <figure><img src="${escapeHtml(slide.image)}" alt="Yüksek ve alçak basınç bölgeleri"/></figure>
          <div class="climate-wind-hidden-arrow"><span>YÜKSEK BASINÇ</span><b>→</b><span>ALÇAK BASINÇ</span></div>
        </section>
        <div class="climate-wind-predict-reveals">${reveals.map((text, index) => `<p data-step="${index}">${escapeHtml(text)}</p>`).join("")}</div>
        <button type="button" class="climate-reveal-next">Cevabı göster</button>
      `;
      const items = [...slideArticle.querySelectorAll(".climate-wind-predict-reveals p")];
      const arrow = slideArticle.querySelector(".climate-wind-hidden-arrow");
      const next = slideArticle.querySelector(".climate-reveal-next");
      let current = 0;
      const render = () => {
        arrow.classList.toggle("is-revealed", current >= 1);
        items.forEach((item, index) => item.classList.toggle("is-revealed", index < current));
        next.textContent = current === 0 ? "Cevabı göster" : current === 1 ? "İkinci bilgiyi göster" : "Tamamlandı";
        next.disabled = current >= reveals.length;
      };
      next.addEventListener("click", () => { current = Math.min(reveals.length, current + 1); render(); });
      registerLocalInteraction(activeInteractions, () => { current = 0; render(); });
      render();
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_precipitation_classify": {
      const items = slide.items ?? [];
      const categories = slide.categories ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-precipitation-classify climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "YAĞIŞLARI SINIFLANDIR")}
        <p class="climate-instruction">Bir yağış türü seç, ardından oluştuğu yere dokun.</p>
        <div class="climate-classify-items">${items.map((item, index) => `<button type="button" data-index="${index}">${escapeHtml(item.label)}</button>`).join("")}</div>
        <section class="climate-classify-targets">${categories.map((category) => `<button type="button" data-category="${escapeHtml(category.id)}"><h2>${escapeHtml(category.title)}</h2><div></div></button>`).join("")}</section>
        <p class="climate-feedback" aria-live="polite">Sınıflandırmaya başlamak için bir tür seç.</p>
      `;
      const itemButtons = [...slideArticle.querySelectorAll(".climate-classify-items button")];
      const targets = [...slideArticle.querySelectorAll(".climate-classify-targets > button")];
      const feedback = slideArticle.querySelector(".climate-feedback");
      let selected = null;
      itemButtons.forEach((button) => button.addEventListener("click", () => {
        if (button.classList.contains("is-placed")) return;
        itemButtons.forEach((item) => item.classList.remove("is-selected"));
        selected = Number(button.dataset.index);
        button.classList.add("is-selected");
        feedback.textContent = `${items[selected].label} nerede oluşur?`;
      }));
      targets.forEach((target) => target.addEventListener("click", () => {
        if (selected === null) return;
        if (target.dataset.category === items[selected].category) {
          const button = itemButtons[selected];
          button.classList.remove("is-selected");
          button.classList.add("is-placed");
          target.querySelector("div").insertAdjacentHTML("beforeend", `<span>${escapeHtml(items[selected].label)}</span>`);
          feedback.textContent = "Doğru sınıflandırma.";
          selected = null;
        } else {
          target.classList.add("is-wrong");
          feedback.textContent = "Bu oluşum yerini yeniden düşün.";
          setTimeout(() => target.classList.remove("is-wrong"), 320);
        }
      }));
      const reset = () => {
        selected = null;
        itemButtons.forEach((item) => item.classList.remove("is-selected", "is-placed"));
        targets.forEach((target) => { target.classList.remove("is-wrong"); target.querySelector("div").innerHTML = ""; });
        feedback.textContent = "Sınıflandırmaya başlamak için bir tür seç.";
      };
      registerLocalInteraction(activeInteractions, reset);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_climate_hero": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-hero";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "İKLİM NEDİR?")}
        <section class="climate-hero-layout">
          <div class="climate-hero-copy"><p>${escapeHtml(slide.definition)}</p><div>${(slide.concepts ?? []).map((concept) => `<span>${escapeHtml(concept)}</span>`).join("")}</div></div>
          <figure><img src="${escapeHtml(slide.image)}" alt="Dünya, atmosfer ve iklim görseli"/></figure>
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_type_selector": {
      const climateTypes = slide.climateTypes ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-type-selector climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "TÜRKİYE'DE İKLİM TİPLERİ")}
        <div class="climate-region-selector">${climateTypes.map((item, index) => `<button type="button" data-index="${index}" class="climate-region-${escapeHtml(item.tone)}">${escapeHtml(item.title)}</button>`).join("")}</div>
        <section class="climate-region-stage"><div class="climate-turkey-silhouette" aria-hidden="true">TÜRKİYE</div><article><h2>Bir iklim tipi seç</h2><div></div></article></section>
      `;
      const buttons = [...slideArticle.querySelectorAll(".climate-region-selector button")];
      const detail = slideArticle.querySelector(".climate-region-stage article");
      const render = (index) => {
        const item = climateTypes[index];
        buttons.forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === index));
        detail.innerHTML = `<h2>${escapeHtml(item.title)} İKLİMİ</h2><div>${item.details.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
      };
      buttons.forEach((button) => button.addEventListener("click", () => render(Number(button.dataset.index))));
      const reset = () => { buttons.forEach((button) => button.classList.remove("is-active")); detail.innerHTML = "<h2>Bir iklim tipi seç</h2><div></div>"; };
      registerLocalInteraction(activeInteractions, reset);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_weather_quiz": {
      const items = slide.items ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-weather-quiz climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "HAVA OLAYI MI, İKLİM Mİ?")}
        <div class="climate-quiz-legend"><span>H = Hava Olayı</span><span>İ = İklim</span></div>
        <section class="climate-weather-quiz-grid">${items.map((item, index) => `<article data-index="${index}"><p><b>${index + 1}.</b> ${escapeHtml(item.text)}</p><div><button type="button" data-answer="H">H</button><button type="button" data-answer="İ">İ</button></div></article>`).join("")}</section>
      `;
      const rows = [...slideArticle.querySelectorAll(".climate-weather-quiz-grid article")];
      rows.forEach((row) => row.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
        const item = items[Number(row.dataset.index)];
        row.querySelectorAll("button").forEach((candidate) => candidate.classList.remove("is-correct", "is-wrong"));
        button.classList.add(button.dataset.answer === item.answer ? "is-correct" : "is-wrong");
      })));
      registerLocalInteraction(activeInteractions, () => rows.forEach((row) => row.querySelectorAll("button").forEach((button) => button.classList.remove("is-correct", "is-wrong"))));
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_greenhouse_reveal": {
      const steps = slide.steps ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-greenhouse climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "SERA ETKİSİ")}
        <section class="climate-greenhouse-layout">
          <div class="climate-greenhouse-scene" aria-label="Dünya ve atmosferde sera etkisi şeması"><div class="climate-sun">GÜNEŞ</div><div class="climate-ray climate-ray-in">↓</div><div class="climate-earth">DÜNYA</div><div class="climate-atmosphere-ring"></div><div class="climate-ray climate-ray-out">↑</div><div class="climate-heat-trap">ISI TUTULUR</div></div>
          <ol>${steps.map((step, index) => `<li data-step="${index}"><span>${index + 1}</span>${escapeHtml(step)}</li>`).join("")}</ol>
        </section>
        <button type="button" class="climate-reveal-next">Süreci başlat</button>
      `;
      const items = [...slideArticle.querySelectorAll("ol li")];
      const scene = slideArticle.querySelector(".climate-greenhouse-scene");
      const next = slideArticle.querySelector(".climate-reveal-next");
      let current = 0;
      const render = () => {
        items.forEach((item, index) => item.classList.toggle("is-revealed", index < current));
        scene.dataset.step = String(current);
        next.textContent = current >= steps.length ? "Süreç tamamlandı" : current ? "Sonraki adım" : "Süreci başlat";
        next.disabled = current >= steps.length;
      };
      next.addEventListener("click", () => { current = Math.min(steps.length, current + 1); render(); });
      registerLocalInteraction(activeInteractions, () => { current = 0; render(); });
      render();
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_chain_reveal": {
      const groups = slide.groups ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-chain climate-interactive-slide";
      slideArticle.innerHTML = `
        ${climateHeader(slide.title ?? "KÜRESEL İKLİM DEĞİŞİKLİĞİ")}
        <section class="climate-chain-flow">${groups.map((group, index) => `<article class="climate-chain-${escapeHtml(group.tone)}" data-step="${index}"><h2>${escapeHtml(group.title)}</h2><ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>${index < groups.length - 1 ? '<span class="climate-chain-arrow">→</span>' : ""}`).join("")}</section>
        <button type="button" class="climate-reveal-next">Nedenleri göster</button>
      `;
      const cards = [...slideArticle.querySelectorAll(".climate-chain-flow article")];
      const arrows = [...slideArticle.querySelectorAll(".climate-chain-arrow")];
      const next = slideArticle.querySelector(".climate-reveal-next");
      let current = 0;
      const labels = ["Nedenleri göster", "Sonuçları göster", "Önlemleri göster", "Akış tamamlandı"];
      const render = () => {
        cards.forEach((card, index) => card.classList.toggle("is-revealed", index < current));
        arrows.forEach((arrow, index) => arrow.classList.toggle("is-revealed", index < current - 1));
        next.textContent = labels[current];
        next.disabled = current >= groups.length;
      };
      next.addEventListener("click", () => { current = Math.min(groups.length, current + 1); render(); });
      registerLocalInteraction(activeInteractions, () => { current = 0; render(); });
      render();
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

    case "climate_wind_formation": {
      const media = slide.media?.[0];
      const areas = slide.areas ?? [];
      const notes = slide.notes ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-wind-formation";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "RÜZGÂR NASIL OLUŞUR?")}</h1>
        </header>
        <p class="climate-wind-definition">${escapeHtml(slide.definition ?? "")}</p>
        <section class="climate-wind-diagram" aria-label="Rüzgârın oluşum şeması">
          <article class="climate-card climate-wind-area climate-wind-${escapeHtml(areas[0]?.tone ?? "cool")}">
            <h2>${escapeHtml(areas[0]?.title ?? "YÜKSEK BASINÇ")}</h2>
            ${(areas[0]?.points ?? []).map((point) => `<p>${escapeHtml(point)}</p>`).join("")}
          </article>
          <div class="climate-wind-flow">
            <strong>${escapeHtml(slide.windDirection ?? "YÜKSEK BASINÇ → ALÇAK BASINÇ")}</strong>
            <span aria-hidden="true">→</span>
            <b>${escapeHtml(slide.windLabel ?? "RÜZGÂR")}</b>
          </div>
          <article class="climate-card climate-wind-area climate-wind-${escapeHtml(areas[1]?.tone ?? "warm")}">
            <h2>${escapeHtml(areas[1]?.title ?? "ALÇAK BASINÇ")}</h2>
            ${(areas[1]?.points ?? []).map((point) => `<p>${escapeHtml(point)}</p>`).join("")}
          </article>
        </section>
        <figure class="climate-wind-visual">
          <img src="${escapeHtml(media?.src ?? "")}" alt="${escapeHtml(media?.alt ?? "Rüzgâr şeması")}" />
        </figure>
        <section class="climate-wind-notes" aria-label="Rüzgâr bilgileri">
          ${notes.map((note) => `<div class="climate-card climate-wind-note"><p>${escapeHtml(note)}</p></div>`).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_wind_application": {
      const media = slide.media?.[0];
      const slideInteractions = slide.interactions ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-wind-application";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "BASINÇ VE RÜZGÂR UYGULAMASI")}</h1>
        </header>
        <figure class="climate-wind-application-visual">
          <img src="${escapeHtml(media?.src ?? "")}" alt="${escapeHtml(media?.alt ?? "K ve L basınç uygulaması")}" />
        </figure>
        <section class="climate-wind-application-columns" aria-label="K ve L uygulaması çıkarımları">
          <div class="climate-wind-application-column">
            ${slideInteractions.slice(0, 5).map((item, index) => `<div class="climate-wind-reveal-row" data-interaction-index="${index}"></div>`).join("")}
          </div>
          <div class="climate-wind-application-column">
            ${slideInteractions.slice(5, 10).map((item, index) => `<div class="climate-wind-reveal-row" data-interaction-index="${index + 5}"></div>`).join("")}
          </div>
        </section>
      `;
      const slots = slideArticle.querySelectorAll(".climate-wind-reveal-row");
      slots.forEach((slot) => {
        const interaction = slideInteractions[Number(slot.dataset.interactionIndex)];
        if (interaction) mountInteraction(interaction, slot, interactions, activeInteractions);
      });
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_breeze_comparison":
    case "climate_valley_breeze_comparison": {
      const areas = slide.areas ?? [];
      const isValleyBreeze = slide.layout === "climate_valley_breeze_comparison";
      const slideArticle = document.createElement("article");
      slideArticle.className = `board-slide slide-climate-breeze-comparison${isValleyBreeze ? " slide-climate-valley-comparison" : ""}`;
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "DENİZ VE KARA MELTEMİ")}</h1>
        </header>
        <section class="climate-breeze-cards" aria-label="Gündüz ve gece meltemleri karşılaştırması">
          ${areas.map((area) => `
            <article class="climate-card climate-breeze-card climate-breeze-${escapeHtml(area.tone ?? "sea")}">
              <header class="climate-breeze-card-header">
                <span class="climate-breeze-period">${escapeHtml(area.period ?? "")}</span>
                <h2>${escapeHtml(area.title ?? "")}</h2>
              </header>
              <figure class="climate-breeze-visual">
                <img src="${escapeHtml(area.image ?? "")}" alt="${escapeHtml(area.alt ?? "Deniz ve kara meltemi şeması")}" />
              </figure>
              <div class="climate-breeze-copy">
                <p class="climate-breeze-temperature">${escapeHtml(area.temperature ?? "")}</p>
                <div class="climate-breeze-pressure-list">
                  ${(area.pressure ?? []).map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
                </div>
                <p class="climate-breeze-wind">${escapeHtml(area.wind ?? "")}</p>
              </div>
            </article>
          `).join("")}
        </section>
        <div class="climate-card climate-breeze-bottom-info">
          <p>${escapeHtml(slide.bottomInfo ?? "Kara, denize göre daha hızlı ısınır ve daha hızlı soğur.")}</p>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_precipitation_classification": {
      const rows = slide.rows ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-precipitation-classification";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "YAĞIŞLAR")}</h1>
        </header>
        <section class="climate-precipitation-table" aria-label="Yağışların oluşum yerine göre sınıflandırılması">
          ${rows.map((row) => `
            <article class="climate-card climate-precipitation-row climate-precipitation-${escapeHtml(row.tone ?? "blue")}" role="row">
              <h2>${escapeHtml(row.title ?? "")}</h2>
              <p>${escapeHtml(row.items ?? "")}</p>
            </article>
          `).join("")}
        </section>
        <div class="climate-card climate-precipitation-bottom-info">
          <p>${escapeHtml(slide.bottomInfo ?? "Yağışlar oluşum yerlerine göre iki grupta incelenir.")}</p>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_precipitation_types": {
      const precipitationTypes = slide.types ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-precipitation-types";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "YAĞIŞ TÜRLERİ")}</h1>
        </header>
        <section class="climate-precipitation-type-grid" aria-label="Yağış türleri">
          ${precipitationTypes.map((type) => `
            <article class="climate-card climate-precipitation-type climate-precipitation-type-${escapeHtml(type.tone ?? "rain")}">
              <h2>${escapeHtml(type.title ?? "")}</h2>
              <p>${escapeHtml(type.text ?? "")}</p>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_definition_concepts": {
      const concepts = slide.concepts ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-definition-concepts";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "İKLİM NEDİR?")}</h1>
        </header>
        <section class="climate-definition-main">
          <p>${escapeHtml(slide.definition ?? "")}</p>
        </section>
        <section class="climate-concept-cards" aria-label="İklim bilimi kavramları">
          ${concepts.map((concept) => `
            <article class="climate-card climate-concept-definition climate-concept-${escapeHtml(concept.tone ?? "blue")}">
              <h2>${escapeHtml(concept.title ?? "")}</h2>
              <p>${escapeHtml(concept.text ?? "")}</p>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_factors": {
      const factors = slide.factors ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-factors";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "İKLİMİ BELİRLEYEN ETMENLER")}</h1>
        </header>
        <section class="climate-factor-grid" aria-label="İklimi belirleyen etmenler">
          ${factors.map((factor, index) => `<article class="climate-card climate-factor-card climate-factor-${index % 3}"><p>${escapeHtml(factor)}</p></article>`).join("")}
        </section>
        <div class="climate-card climate-factor-bottom-info"><p>${escapeHtml(slide.bottomInfo ?? "")}</p></div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_turkey_types": {
      const climateTypes = slide.types ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-turkey-types";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "TÜRKİYE'DE İKLİM TİPLERİ")}</h1>
        </header>
        <section class="climate-type-cards" aria-label="Türkiye'de görülen iklim tipleri">
          ${climateTypes.map((climateType) => `
            <article class="climate-card climate-type-card climate-type-${escapeHtml(climateType.tone ?? "blue")}">
              <h2>${escapeHtml(climateType.title ?? "")}</h2>
              <div>${(climateType.details ?? []).map((detail) => `<p>${escapeHtml(detail)}</p>`).join("")}</div>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_weather_climate_comparison": {
      const columns = slide.columns ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-weather-climate-comparison";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "HAVA OLAYLARI ve İKLİM")}</h1>
        </header>
        <section class="climate-weather-climate-columns" aria-label="Hava olayları ve iklim karşılaştırması">
          ${columns.map((column) => `
            <article class="climate-card climate-weather-climate-column climate-weather-climate-${escapeHtml(column.tone ?? "blue")}">
              <h2>${escapeHtml(column.title ?? "")}</h2>
              <ul>${(column.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_global_change": {
      const cards = slide.cards ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-global-change";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "KÜRESEL İKLİM DEĞİŞİKLİĞİ")}</h1>
        </header>
        <section class="climate-global-change-cards" aria-label="Küresel iklim değişikliği kavramları">
          ${cards.map((card) => `
            <article class="climate-card climate-global-change-card climate-global-change-${escapeHtml(card.tone ?? "blue")}">
              <h2>${escapeHtml(card.title ?? "")}</h2>
              <p>${escapeHtml(card.text ?? "")}</p>
            </article>
          `).join("")}
        </section>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "climate_global_actions": {
      const columns = slide.columns ?? [];
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-climate-global-actions";
      slideArticle.innerHTML = `
        <header class="climate-slide-header">
          <h1 class="climate-slide-title">${escapeHtml(slide.title ?? "NEDENLER / SONUÇLAR / ÖNLEMLER")}</h1>
        </header>
        <section class="climate-global-action-columns" aria-label="Küresel iklim değişikliği nedenleri, sonuçları ve önlemleri">
          ${columns.map((column) => `
            <article class="climate-card climate-global-action-column climate-global-action-${escapeHtml(column.tone ?? "blue")}">
              <h2>${escapeHtml(column.title ?? "")}</h2>
              <ul>${(column.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </article>
          `).join("")}
        </section>
        <aside class="climate-card climate-kyoto-note"><p>${escapeHtml(slide.kyotoNote ?? "")}</p></aside>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
