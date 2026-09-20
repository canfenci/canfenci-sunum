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

export function renderSolarSlide(slide, view, { interactions, activeInteractions }) {
  switch (slide.layout) {
    case "solar_kapak": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-solar-kapak";
      slideArticle.innerHTML = `
        <div class="solar-kapak-stage">
          <div class="solar-kapak-content">
            <div class="solar-badge-pill">
              <span class="solar-badge-dot"></span>
              <span>${escapeHtml(slide.kicker ?? "6. SINIF FEN BİLİMLERİ")}</span>
            </div>
            <h1 class="solar-hero-title">${escapeHtml(slide.title ?? "Güneş Sistemi ve Gezegenler")}</h1>
            <p class="solar-hero-subtitle">${escapeHtml(slide.subtitle ?? "1. Ünite — Güneş Sistemi ve Tutulmalar")}</p>
            <div class="solar-cover-features">
              <span class="solar-feat-tag">🪐 8 Gezegen</span>
              <span class="solar-feat-tag">☄️ Asteroit Kuşağı</span>
              <span class="solar-feat-tag">🌠 Meteor ve Meteorit</span>
            </div>
          </div>
          <div class="solar-kapak-visual">
            <div class="solar-visual-glow"></div>
            <img src="${slide.media?.[0]?.src ?? "./assets/images/gunes-sistemi/01-kapak-gunes-sistemi.png"}" alt="${escapeHtml(slide.media?.[0]?.alt ?? "Güneş Sistemi")}" class="solar-hero-img" />
          </div>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_merak_et": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-solar-merak-et";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "MERAK ETTİKLERİMİZİ YAZALIM")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "Merak Ettiklerimizi Yazalım")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-merak-stage">
          <div class="solar-merak-notes-col">
            <div class="solar-note-card">
              <div class="solar-note-num">1</div>
              <div class="solar-note-body">
                <label class="solar-note-label">1. Merak Konusu</label>
                <div class="solar-note-lines" contenteditable="true" spellcheck="false" data-placeholder="Bu ünitede öğrenmek istediğin 1. konuyu buraya not al..."></div>
              </div>
            </div>
            <div class="solar-note-card">
              <div class="solar-note-num">2</div>
              <div class="solar-note-body">
                <label class="solar-note-label">2. Merak Konusu</label>
                <div class="solar-note-lines" contenteditable="true" spellcheck="false" data-placeholder="Bu ünitede öğrenmek istediğin 2. konuyu buraya not al..."></div>
              </div>
            </div>
          </div>
          <div class="solar-merak-visual-col">
            <img src="${slide.media?.[0]?.src ?? "./assets/images/gunes-sistemi/02-merak-ettiklerimiz.png"}" alt="${escapeHtml(slide.media?.[0]?.alt ?? "")}" class="solar-merak-img" />
          </div>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_on_bilgiler": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-on-bilgiler";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "ÖN BİLGİLER")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "Ön Bilgileri Değerlendirelim")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-questions-grid">
        </div>
      `;
      const grid = slideArticle.querySelector(".solar-questions-grid");
      for (let i = 0; i < (slide.questions ?? []).length; i++) {
        const q = slide.questions[i];
        const qCard = document.createElement("div");
        qCard.className = "solar-question-card";
        qCard.innerHTML = `
          <div class="solar-q-top">
            <span class="solar-q-badge">Soru ${i + 1}</span>
          </div>
          <h2 class="solar-q-text">${escapeHtml(q.text)}</h2>
          <div class="solar-q-interaction-slot"></div>
        `;
        const slot = qCard.querySelector(".solar-q-interaction-slot");
        const interaction = slide.interactions?.find(item => item.id === q.interactionId) ?? slide.interactions?.[i];
        if (interaction) mountInteraction(interaction, slot, interactions, activeInteractions);
        grid.appendChild(qCard);
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_gunes_sistemi_tanim": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-gunes-sistemi-tanim";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "1. GÜNEŞ SİSTEMİ")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "1. Güneş Sistemi")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-overview-stage">
          <div class="solar-overview-visual">
            <img src="${slide.media?.[0]?.src ?? "./assets/images/gunes-sistemi/04-gunes-sistemi-genel.png"}" alt="Güneş Sistemi" class="solar-overview-img" />
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_yakinlik_siralamasi": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-yakinlik-siralamasi";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "DİZİLİM")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "Gezegenlerin Güneş’e Yakınlık Sıralaması")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-yakinlik-stage">
          <div class="solar-lineup-visual">
            <img src="${slide.media?.[0]?.src ?? "./assets/images/gunes-sistemi/05-gunese-yakinlik-sirasi.png"}" alt="Gezegenler Sıralaması" class="solar-lineup-img" />
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_gezegen_nedir": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-gezegen-nedir";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "TEMEL KAVRAM")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "Gezegen Nedir?")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-gezegen-nedir-stage">
          <div class="solar-concept-cards">
            <div class="solar-definition-card solar-definition-card-tanim">
              <span class="solar-card-icon">🪐</span>
              <div class="solar-card-content">
                <h3>Gezegen Tanımı</h3>
                <div class="solar-tanim-slot"></div>
              </div>
            </div>
            <div class="solar-definition-card solar-definition-card-durum">
              <span class="solar-card-icon">☀️</span>
              <div class="solar-card-content">
                <h3>Isı ve Işık Durumu</h3>
                <p class="solar-durum-main">Gezegenler ısı ve ışık kaynağı <strong>değildirler</strong>.</p>
                <p class="solar-durum-sub">Güneş’ten aldıkları ışığı yansıtırlar.</p>
              </div>
            </div>
          </div>
          <div class="solar-gezegen-interactions">
            <div class="solar-interaction-box slot-1"></div>
            <div class="solar-interaction-box slot-2"></div>
          </div>
        </div>
      `;
      const tanimSlot = slideArticle.querySelector(".solar-tanim-slot");
      const slot1 = slideArticle.querySelector(".slot-1");
      const slot2 = slideArticle.querySelector(".slot-2");

      const tanimInteraction = slide.interactions?.find(i => i.id === "interaction_slide_6_tanim")
        ?? slide.interactions?.find(i => i.template?.includes("denir"));
      const sicaklikInteraction = slide.interactions?.find(i => i.id === "interaction_slide_6_sicaklik")
        ?? slide.interactions?.find(i => i.template?.includes("sıcak değil"));
      const gruplarInteraction = slide.interactions?.find(i => i.id === "interaction_slide_6_gruplar")
        ?? slide.interactions?.find(i => i.template?.includes("gruba ayrılır"));

      if (tanimInteraction && tanimSlot) {
        mountInteraction(tanimInteraction, tanimSlot, interactions, activeInteractions);
      } else if (tanimSlot) {
        tanimSlot.innerHTML = `<p class="solar-tanim-fallback">Bir yıldız etrafında belirli yörüngelerde dolanan, küresel yapılı, büyük gök cisimlerine <strong>gezegen</strong> denir.</p>`;
      }

      if (sicaklikInteraction && slot1) {
        mountInteraction(sicaklikInteraction, slot1, interactions, activeInteractions);
      }
      if (gruplarInteraction && slot2) {
        mountInteraction(gruplarInteraction, slot2, interactions, activeInteractions);
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_karasal_ve_gazsal": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-solar-karasal-ve-gazsal";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "İÇ VE DIŞ GEZEGENLER")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? "Karasal ve Gazsal Gezegenler")}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-karasal-gazsal-stage">
          <div class="solar-dual-cards-row">
            <div class="solar-class-card karasal">
              <div class="solar-class-badge">İç Gezegenler</div>
              <h2>1. Karasal Gezegenler</h2>
              <p class="solar-class-desc">Kayalık ve katı yüzeylere sahiptirler. Yoğunlukları gazsal gezegenlere göre daha fazladır.</p>
              <div class="solar-class-planets">
                <span class="planet-tag">Merkür</span>
                <span class="planet-tag">Venüs</span>
                <span class="planet-tag">Dünya</span>
                <span class="planet-tag">Mars</span>
              </div>
            </div>
            <div class="solar-class-card gazsal">
              <div class="solar-class-badge">Dış Gezegenler</div>
              <h2>2. Gazsal Gezegenler</h2>
              <p class="solar-class-desc">Gazlardan oluşan yüzeylere sahiptirler (gaz devleri). Hacimce devasa gezegenlerdir.</p>
              <div class="solar-class-planets">
                <span class="planet-tag">Jüpiter</span>
                <span class="planet-tag">Satürn</span>
                <span class="planet-tag">Uranüs</span>
                <span class="planet-tag">Neptün</span>
              </div>
            </div>
          </div>
          <div class="solar-karasal-visual-bar">
            <img src="${slide.media?.[0]?.src ?? "./assets/images/gunes-sistemi/07-karasal-gazsal-karsilastirma.png"}" alt="Karasal ve Gazsal Gezegenler" class="solar-karasal-img" />
          </div>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_planet_card": {
      const slideArticle = document.createElement("article");
      const planetSlug = (slide.planet ?? "planet").toLowerCase()
        .replace(/ü/g, "u").replace(/ı/g, "i").replace(/i̇/g, "i").replace(/ö/g, "o");
      slideArticle.className = `board-slide board-slide-interactive slide-solar-planet-card planet-${planetSlug}`;
      const coreFacts = slide.coreFacts ?? [];
      const highlights = slide.highlights ?? [];
      const extraFacts = slide.extraFacts ?? slide.facts ?? [];

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <div class="solar-planet-meta">
            <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "GEZEGEN")}</span>
            <span class="solar-planet-category">${escapeHtml(slide.category ?? "")}</span>
          </div>
          <h1 class="solar-slide-title">${escapeHtml(slide.title ?? slide.planet)}</h1>
          <span class="solar-planet-notebook-badge" aria-label="Defter özeti">📓</span>
        </header>
        <div class="solar-planet-teaching-layout">
          <section class="solar-planet-core-panel" aria-label="${escapeHtml(slide.planet ?? "Gezegen")} temel bilgileri">
            <h2>TEMEL BİLGİLER</h2>
            <div class="solar-planet-core-grid">
              ${coreFacts.map((fact) => `
                <article class="solar-planet-core-card">
                  <h3>${escapeHtml(fact.label)}</h3>
                  <div class="solar-planet-core-slot" data-interaction-id="${escapeHtml(fact.interactionId ?? "")}"></div>
                </article>
              `).join("")}
            </div>
            <div class="solar-planet-highlights">
              ${highlights.map((highlight) => `<p>${escapeHtml(highlight)}</p>`).join("")}
            </div>
          </section>
          <figure class="solar-planet-visual-panel">
            <div class="solar-planet-glow"></div>
            <img src="${slide.media?.[0]?.src ?? ""}" alt="${escapeHtml(slide.media?.[0]?.alt ?? slide.planet ?? "")}" class="solar-planet-img" />
          </figure>
        </div>
        <section class="solar-planet-extra-section" aria-label="Ek bilgiler">
          <h2>EK BİLGİ</h2>
          <div class="solar-planet-extra-grid">
            ${extraFacts.map((fact) => `<article><p>${escapeHtml(fact)}</p></article>`).join("")}
          </div>
        </section>
      `;

      slideArticle.querySelectorAll(".solar-planet-core-slot").forEach((slot, index) => {
        const interactionId = slot.dataset.interactionId;
        const interaction = slide.interactions?.find((item) => item.id === interactionId) ?? slide.interactions?.[index];
        if (interaction) mountInteraction(interaction, slot, interactions, activeInteractions);
      });
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_karsilastirma_genel": {
      const slideArticle = document.createElement("article");
      const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
      slideArticle.className = `board-slide board-slide-interactive slide-solar-karsilastirma-genel ${slideIdClass}`.trim();
      if (slide.id) {
        slideArticle.dataset.slideId = slide.id;
      }
      const comp = slide.comparison ?? {};
      const leftList = (comp.leftItems ?? []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
      const rightList = (comp.rightItems ?? []).map(item => `<li>${escapeHtml(item)}</li>`).join("");

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "KARŞILAŞTIRMA")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-comp-stage">
          <div class="solar-comp-diagram">
            <img src="${slide.media?.[0]?.src ?? ""}" alt="${escapeHtml(slide.title)}" class="solar-comp-img" />
          </div>
          <div class="solar-comp-cards">
            <div class="solar-comp-card left-card">
              <div class="solar-comp-head">
                <h3>${escapeHtml(comp.leftTitle ?? "")}</h3>
                ${comp.leftSubtitle ? `<small>${escapeHtml(comp.leftSubtitle)}</small>` : ""}
              </div>
              <ul>${leftList}</ul>
            </div>
            <div class="solar-comp-card right-card">
              <div class="solar-comp-head">
                <h3>${escapeHtml(comp.rightTitle ?? "")}</h3>
                ${comp.rightSubtitle ? `<small>${escapeHtml(comp.rightSubtitle)}</small>` : ""}
              </div>
              <ul>${rightList}</ul>
            </div>
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_karsilastirma_siralama": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-karsilastirma-siralama";

      const itemsHtml = (slide.ranking ?? []).map(r => `
        <div class="solar-rank-pill">
          <span class="solar-rank-order">${r.order}</span>
          <span class="solar-rank-name">${escapeHtml(r.name)}</span>
          ${r.type ? `<small class="solar-rank-type">${escapeHtml(r.type)}</small>` : ""}
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          <span class="solar-slide-kicker">${escapeHtml(slide.kicker ?? "SIRALAMA")}</span>
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-siralama-stage">
          <div class="solar-siralama-diagram">
            <img src="${slide.media?.[0]?.src ?? ""}" alt="${escapeHtml(slide.title)}" class="solar-siralama-img" />
          </div>
          ${slide.mnemonic ? `
            <div class="solar-mnemonic-box">
              <span class="solar-mnemonic-badge">💡 Akılda Tutma Kuralı</span>
              <strong class="solar-mnemonic-text">${escapeHtml(slide.mnemonic)}</strong>
            </div>
          ` : ""}
          <div class="solar-ranking-strip">
            ${itemsHtml}
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_aklimizda_bulunsun": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-solar-aklimizda-bulunsun";

      const iconSvg = (name) => {
        const iconMap = {
          eye: icon("eye", 24),
          telescope: icon("search", 24),
          star: icon("star", 24),
          thermometer: icon("zap", 24),
          globe: icon("globe", 24),
          "rotate-cw": icon("refresh-cw", 24)
        };
        return iconMap[name] ?? icon("check-circle", 24);
      };

      const notesHtml = (slide.notes ?? []).map((n, i) => `
        <div class="solar-note-box">
          <div class="solar-note-icon">${iconSvg(n.icon)}</div>
          <div class="solar-note-content">
            <span class="solar-note-tag">Not ${i + 1}</span>
            <p class="solar-note-text">${escapeHtml(n.text)}</p>
          </div>
        </div>
      `).join("");

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-notes-grid">
          ${notesHtml}
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_karsilastirma_tablosu": {
      const slideArticle = document.createElement("article");
      const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
      slideArticle.className = `board-slide slide-solar-karsilastirma-tablosu ${slideIdClass}`.trim();
      if (slide.id) {
        slideArticle.dataset.slideId = slide.id;
      }

      const rowsHtml = (slide.tableData ?? []).map(row => `
        <tr class="solar-table-row">
          <td class="solar-table-planet font-bold">${escapeHtml(row.planet)}</td>
          <td class="solar-table-cell ${row.satellite === "Yok" ? "val-none" : "val-yes"}">${escapeHtml(row.satellite)}</td>
          <td class="solar-table-cell ${row.ring === "Yok" ? "val-none" : "val-yes"}">${escapeHtml(row.ring)}</td>
          <td class="solar-table-cell val-symbol ${row.terrestrial === "✓" ? "val-yes" : "val-none"}">${escapeHtml(row.terrestrial)}</td>
          <td class="solar-table-cell val-symbol ${row.gas === "✓" ? "val-yes" : "val-none"}">${escapeHtml(row.gas)}</td>
          <td class="solar-table-cell font-bold text-blue">${row.nearRank}</td>
          <td class="solar-table-cell font-bold text-orange">${row.sizeRank}</td>
        </tr>
      `).join("");

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-table-wrapper">
          <table class="solar-full-table">
            <thead>
              <tr>
                <th>Gezegen</th>
                <th>Uydusu Olanlar</th>
                <th>Halkası Olanlar</th>
                <th>Karasal Gezegenler</th>
                <th>Gazsal Gezegenler</th>
                <th>Güneş’e Yakınlık</th>
                <th>Hacimsel Büyüklük</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_asteroit_kusak": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-asteroit-kusak";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-asteroit-stage">
          <div class="solar-asteroit-visual">
            <img src="${slide.media?.[0]?.src ?? ""}" alt="Asteroit Kuşağı" class="solar-asteroit-img" />
          </div>
          <div class="solar-asteroit-interactions">
            <div class="solar-asteroit-slot slot-1"></div>
            <div class="solar-asteroit-slot slot-2"></div>
          </div>
        </div>
      `;
      const slot1 = slideArticle.querySelector(".slot-1");
      const slot2 = slideArticle.querySelector(".slot-2");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slot1, interactions, activeInteractions);
      if (slide.interactions?.[1]) mountInteraction(slide.interactions[1], slot2, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_goktasi_tanimlar": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide slide-solar-goktasi-tanimlar";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-concept-grid">
        </div>
      `;
      const conceptVisual = (defId) => {
        const visualMap = {
          def_goktasi: "🪨",
          def_meteor: "🌠",
          def_meteorit: "☄️",
          def_cukur: "🕳️"
        };
        return visualMap[defId] ?? "☄️";
      };
      const conceptGrid = slideArticle.querySelector(".solar-concept-grid");
      for (const def of slide.definitions ?? []) {
        const cCard = document.createElement("div");
        cCard.className = "solar-concept-card";
        cCard.innerHTML = `
          <div class="solar-concept-visual" role="img" aria-label="${escapeHtml(def.title)}"><span class="solar-concept-emoji">${conceptVisual(def.id)}</span></div>
          <div class="solar-concept-label">${escapeHtml(def.title)}</div>
        `;
        conceptGrid.appendChild(cCard);
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_atmosfer_semasi": {
      const slideArticle = document.createElement("article");
      slideArticle.className = "board-slide board-slide-interactive slide-solar-atmosfer-semasi";
      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-atmosfer-stage">
          <div class="solar-atmosfer-visual">
            <img src="${slide.media?.[0]?.src ?? ""}" alt="Atmosfer Geçiş Şeması" class="solar-atmosfer-img" />
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    case "solar_olusum_sureci": {
      const slideArticle = document.createElement("article");
      const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
      slideArticle.className = `board-slide board-slide-interactive slide-solar-olusum-sureci ${slideIdClass}`.trim();
      if (slide.id) {
        slideArticle.dataset.slideId = slide.id;
      }

      const stepsHtml = (slide.steps ?? []).map(st => `
        <div class="solar-flow-step">
          <div class="solar-step-num">${st.num}</div>
          <div class="solar-step-content">
            <h3 class="solar-step-title">${escapeHtml(st.title)}</h3>
            <p class="solar-step-desc">${escapeHtml(st.desc)}</p>
          </div>
        </div>
      `).join("<div class=\"solar-step-arrow\">➔</div>");

      slideArticle.innerHTML = `
        <header class="solar-slide-header">
          ${slide.kicker ? `<span class="solar-slide-kicker">${escapeHtml(slide.kicker)}</span>` : ""}
          <h1 class="solar-slide-title">${escapeHtml(slide.title)}</h1>
          ${slide.lead ? `<p class="solar-slide-lead">${escapeHtml(slide.lead)}</p>` : ""}
        </header>
        <div class="solar-surec-stage">
          <div class="solar-flow-diagram">
            <img src="${slide.media?.[0]?.src ?? ""}" alt="Oluşum Süreci" class="solar-flow-img" />
          </div>
          <div class="solar-flow-steps">
            ${stepsHtml}
          </div>
          <div class="solar-bottom-interaction-bar">
            <div class="solar-interaction-slot-container"></div>
          </div>
        </div>
      `;
      const slotCont = slideArticle.querySelector(".solar-interaction-slot-container");
      if (slide.interactions?.[0]) mountInteraction(slide.interactions[0], slotCont, interactions, activeInteractions);
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

    default:
      return false;
  }
}
