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

const eclipseNativeContent = {
  slide_2_tutulma_nedir: {
    title: "Tutulma Nedir?",
    groups: [
      { title: "Konum", rows: [["Tutulma; Güneş, Dünya ve Ay’ın belirli konumlarda ", "interaction_slide_2_aynı_dogrultuda", " bulunmasıyla gerçekleşir."], ["Güneş, Ay ve Dünya uygun konumda ve aynı hizada olmalıdır."]] },
      { title: "Gölge olayı", rows: [["Tutulmalar bir ", "interaction_slide_2_golge_olayidir", "."]] },
      { title: "Tutulma çeşitleri", rows: [["Gölge oluştuğunda ", "interaction_slide_2_gunes_tutulmasi", " veya ", "interaction_slide_2_ay_tutulmasi", " meydana gelebilir."]] }
    ],
    note: ["Hatırla: ", "Tutulmalar, gök cisimlerinin oluşturduğu ", "interaction_slide_2_golge", " ile açıklanır."]
  },
  slide_3_gunes_tutulmasi: {
    title: "Güneş Tutulması",
    groups: [
      { title: "Konum", rows: [["Ay, Güneş ile Dünya arasına ", "interaction_slide_3_girer", "."]] },
      { title: "Zaman / Evre", rows: [["", "interaction_slide_3_gunduz", " gözlemlenir."], ["", "interaction_slide_3_yeni_ay", " evresinde gerçekleşebilir."], ["Her ", "interaction_slide_3_yeni_ayda", " gerçekleşmez."]] },
      { title: "Gözlem / Güvenlik", rows: [["Daha ", "interaction_slide_3_dar", " bir alanda gözlemlenir."], ["Çıplak gözle izlenmesi ", "interaction_slide_3_tehlikelidir", "."]] }
    ],
    note: ["Konum sırası: Güneş → ", "interaction_slide_3_ay", " → Dünya"],
    warning: ["Dikkat: Güneş’e çıplak gözle bakmak gözlerimize zarar verebilir."]
  },
  slide_4_ay_tutulmasi: {
    title: "Ay Tutulması",
    groups: [
      { title: "Konum", rows: [["Dünya, Güneş ile Ay arasına ", "interaction_slide_4_girer", "."]] },
      { title: "Zaman / Evre", rows: [["", "interaction_slide_4_gece", " gözlemlenir."], ["", "interaction_slide_4_dolunay", " evresinde gerçekleşebilir."], ["Her ", "interaction_slide_4_dolunayda", " gerçekleşmez."]] },
      { title: "Gözlem / Süre", rows: [["Daha ", "interaction_slide_4_genis", " bir alanda gözlemlenir."], ["Güneş tutulmasına göre daha ", "interaction_slide_4_uzun", " sürer."]] }
    ],
    note: ["Konum sırası: Güneş → Dünya → ", "interaction_slide_4_ay"],
    warning: ["Unutma: Ay tutulmasında ", "interaction_slide_4_dunya", " ortadadır."]
  }
};

const eclipseDiagramSources = {
  slide_3_gunes_tutulmasi: "./assets/images/gunes-ve-ay-tutulmalari/diagrams/03-sema.png",
  slide_4_ay_tutulmasi: "./assets/images/gunes-ve-ay-tutulmalari/diagrams/04-sema.png"
};

const renderEclipseConceptDiagram = () => `
  <div class="eclipse-concept-diagram" aria-label="Güneş, Ay ve Dünya hizalanma şeması">
    <div class="eclipse-diagram-stars"></div>
    <div class="eclipse-ray eclipse-ray-top"></div>
    <div class="eclipse-ray eclipse-ray-bottom"></div>
    <div class="eclipse-shadow-cone"></div>
    <div class="eclipse-orbit eclipse-orbit-sun"></div>
    <div class="eclipse-orbit eclipse-orbit-moon"></div>
    <div class="eclipse-body eclipse-sun"><span></span><strong>Güneş</strong></div>
    <div class="eclipse-body eclipse-moon"><span></span><strong>Ay</strong></div>
    <div class="eclipse-body eclipse-earth"><span></span><strong>Dünya</strong></div>
    <div class="eclipse-diagram-caption">Aynı doğrultuda hizalanan gök cisimleri</div>
  </div>
`;

const mountInlineReveal = (parts, interactionById, row, interactions, activeInteractions) => {
  for (const part of parts) {
    if (part.startsWith("interaction_")) {
      const slot = document.createElement("span");
      slot.className = "eclipse-native-reveal";
      mountInteraction(interactionById.get(part), slot, interactions, activeInteractions);
      row.appendChild(slot);
    } else {
      const text = document.createElement("span");
      text.textContent = part;
      row.appendChild(text);
    }
  }
};

export function renderSolarSlide(slide, view, { interactions, activeInteractions }) {
  switch (slide.layout) {
    case "eclipse_video_slide": {
      const article = document.createElement("article");
      article.className = "board-slide eclipse-video-slide";
      article.innerHTML = `
        <header class="eclipse-video-header"><h1>${escapeHtml(slide.title ?? "Güneş Tutulması Nasıl Gerçekleşir?")}</h1><span></span></header>
        <div class="eclipse-video-frame"><video class="eclipse-video" muted preload="metadata" playsinline src="${escapeHtml(slide.media?.[0]?.src ?? "")}"></video></div>
        <div class="eclipse-video-controls"><button type="button" class="eclipse-video-play">Play</button><button type="button" class="eclipse-video-pause">Pause</button><button type="button" class="eclipse-video-restart">Baştan Oynat</button></div>
      `;
      const video = article.querySelector(".eclipse-video");
      article.querySelector(".eclipse-video-play").addEventListener("click", () => video.play());
      article.querySelector(".eclipse-video-pause").addEventListener("click", () => video.pause());
      article.querySelector(".eclipse-video-restart").addEventListener("click", () => { video.currentTime = 0; video.pause(); });
      view.slideContent.replaceChildren(article);
      return true;
    }
    case "eclipse_sync_animation": {
      const article = document.createElement("article");
      article.className = "board-slide eclipse-sync-slide";
      article.innerHTML = `
        <header class="eclipse-sync-header"><h1>Güneş Tutulması Nasıl Gerçekleşir?</h1><span></span></header>
        <div class="eclipse-sync-panels">
          <section class="eclipse-sync-panel eclipse-sync-space"><h2>Uzaydan görünüş</h2><div class="sync-space-scene"><i class="sync-sun"></i><i class="sync-moon"></i><i class="sync-earth"></i><b class="sync-label sync-label-sun">Güneş</b><b class="sync-label sync-label-moon">Ay</b><b class="sync-label sync-label-earth">Dünya</b><span class="sync-shadow"></span><span class="sync-light-line sync-line-top"></span><span class="sync-light-line sync-line-bottom"></span></div></section>
          <section class="eclipse-sync-panel eclipse-sync-view"><h2>Dünya’dan görünüş</h2><div class="sync-view-scene"><i class="sync-view-sun"></i><i class="sync-view-moon"></i><span class="sync-view-corona"></span><span class="sync-view-horizon"></span><b class="sync-view-status">Başlangıç</b></div></section>
        </div>
        <div class="eclipse-sync-controls"><button type="button" class="sync-play">Play</button><button type="button" class="sync-pause">Pause</button><button type="button" class="sync-restart">Restart</button><div class="sync-progress"><span></span></div><strong class="sync-time">0.0 s</strong></div>
      `;
      const progress = article.querySelector(".sync-progress span");
      const timeLabel = article.querySelector(".sync-time");
      const status = article.querySelector(".sync-view-status");
      let elapsed = 0;
      let running = false;
      let last = 0;
      let raf = 0;
      const duration = 20000;
      const draw = (now = performance.now()) => {
        const p = Math.min(1, elapsed / duration);
        const cover = p < 0.28 ? 0 : p < 0.58 ? ((p - 0.28) / 0.3) * 100 : p < 0.76 ? 100 : Math.max(0, (1 - p) / 0.24 * 100);
        const orbit = p < 0.28 ? p / 0.28 : p < 0.58 ? 1 : p < 0.82 ? (p - 0.58) / 0.24 : 1;
        const spaceMoon = p < 0.28 ? 76 - orbit * 12 : p < 0.58 ? 64 : p < 0.82 ? 64 + orbit * 16 : 80;
        const spaceMoonY = p < 0.28 ? 46 - orbit * 19 : p < 0.58 ? 27 + ((p - 0.28) / 0.3) * 19 : p < 0.82 ? 46 + orbit * 17 : 63;
        const viewMoon = p < 0.28 ? -24 + orbit * 24 : p < 0.58 ? 0 + ((p - 0.28) / 0.3) * 26 : p < 0.82 ? 26 + orbit * 46 : 72;
        article.style.setProperty("--sync-cover", `${Math.max(0, cover)}%`);
        article.style.setProperty("--sync-darkness", `${Math.max(0, cover / 180)}`);
        article.style.setProperty("--sync-space-moon-left", `${spaceMoon}%`);
        article.style.setProperty("--sync-space-moon-top", `${spaceMoonY}%`);
        article.style.setProperty("--sync-view-moon-left", `${viewMoon}%`);
        progress.style.width = `${p * 100}%`;
        timeLabel.textContent = `${(elapsed / 1000).toFixed(1)} s`;
        status.textContent = p >= 0.58 && p <= 0.82 ? "Maksimum örtülme" : p > 0.22 && p < 0.9 ? "Kısmi tutulma" : "Başlangıç";
        if (running) {
          if (last) elapsed += now - last;
          last = now;
          if (elapsed >= duration) { elapsed = duration; running = false; }
          raf = requestAnimationFrame(draw);
        }
      };
      article.querySelector(".sync-play").addEventListener("click", () => { if (elapsed >= duration) elapsed = 0; running = true; last = 0; cancelAnimationFrame(raf); draw(); });
      article.querySelector(".sync-pause").addEventListener("click", () => { running = false; cancelAnimationFrame(raf); draw(); });
      article.querySelector(".sync-restart").addEventListener("click", () => { elapsed = 0; running = false; cancelAnimationFrame(raf); draw(); });
      draw();
      view.slideContent.replaceChildren(article);
      return true;
    }
    case "eclipse_types_slide": {
      const cards = [
        ["Tam Ay Tutulması", "./assets/images/gunes-ve-ay-tutulmalari/varieties/tam-ay.png", "Ay, tamamen gölge içinde kaldığı için bu tutulma türüne “Tam Ay Tutulması” denir.", "eclipse-type-full"],
        ["Kanlı Ay Tutulması", "./assets/images/gunes-ve-ay-tutulmalari/varieties/kanli-ay.png", "Ay’ın kırmızı renkte görünmesi, Dünya atmosferinin süzgeç gibi davranarak kırmızı ışığı Ay’a ulaştırmasından kaynaklanır.", "eclipse-type-blood"],
        ["Süper Kanlı Ay Tutulması", "./assets/images/gunes-ve-ay-tutulmalari/varieties/super-kanli-ay.png", "Ay, Dünya’ya daha yakın olduğu için daha büyük, daha parlak ve kızıl renkte görünür. Bu nedenle “Süper Kanlı Ay Tutulması” olarak adlandırılır.", "eclipse-type-super"]
      ];
      const article = document.createElement("article");
      article.className = "board-slide eclipse-types-slide";
      article.innerHTML = `<header class="eclipse-types-header"><h1>${escapeHtml(slide.title ?? "Ay Tutulması Çeşitleri")}</h1><span></span></header><div class="eclipse-types-grid"></div>`;
      const grid = article.querySelector(".eclipse-types-grid");
      for (const [title, src, summary, tone] of cards) {
        const card = document.createElement("section");
        card.className = `eclipse-type-card ${tone}`;
        card.innerHTML = `<h2>${escapeHtml(title)}</h2><div class="eclipse-type-image"><img src="${src}" alt="${escapeHtml(title)} görseli"></div><p>${escapeHtml(summary)}</p>`;
        grid.appendChild(card);
      }
      view.slideContent.replaceChildren(article);
      return true;
    }
    case "eclipse_concept_slide": {
      const interactionById = new Map((slide.interactions ?? []).map((item) => [item.id, item]));
      const article = document.createElement("article");
      article.className = "board-slide board-slide-interactive eclipse-concept-slide";
      article.innerHTML = `
        <header class="eclipse-concept-header">
          <span class="eclipse-concept-kicker">GÜNEŞ VE AY TUTULMALARI</span>
          <h1>Tutulma Nedir?</h1>
          <span class="eclipse-concept-rule"></span>
        </header>
        <div class="eclipse-concept-middle">
          <section class="eclipse-formation-panel">
            <div class="eclipse-panel-label">Tutulmanın Oluşması</div>
            <div class="eclipse-formation-step"></div>
            <div class="eclipse-formation-step"></div>
          </section>
          <div class="eclipse-concept-visual">${renderEclipseConceptDiagram()}</div>
        </div>
        <div class="eclipse-concept-bottom">
          <section class="eclipse-bottom-card eclipse-types-card">
            <h2>Tutulma Çeşitleri</h2>
            <div class="eclipse-bottom-sentence"></div>
          </section>
          <section class="eclipse-bottom-card eclipse-remember-card">
            <h2>Hatırla</h2>
            <div class="eclipse-bottom-sentence"></div>
          </section>
        </div>
      `;
      const steps = article.querySelectorAll(".eclipse-formation-step");
      mountInlineReveal(["Güneş, Dünya ve Ay belirli konumlarda ", "interaction_slide_2_aynı_dogrultuda", " bulunur."], interactionById, steps[0], interactions, activeInteractions);
      mountInlineReveal(["Bu olay bir ", "interaction_slide_2_golge_olayidir", "."], interactionById, steps[1], interactions, activeInteractions);
      mountInlineReveal(["Gölge oluştuğunda ", "interaction_slide_2_gunes_tutulmasi", " veya ", "interaction_slide_2_ay_tutulmasi", " meydana gelebilir."], interactionById, article.querySelector(".eclipse-types-card .eclipse-bottom-sentence"), interactions, activeInteractions);
      mountInlineReveal(["Tutulmalar, gök cisimlerinin oluşturduğu ", "interaction_slide_2_golge", " ile açıklanır."], interactionById, article.querySelector(".eclipse-remember-card .eclipse-bottom-sentence"), interactions, activeInteractions);
      view.slideContent.replaceChildren(article);
      return true;
    }
    case "eclipse_html_slide": {
      const content = eclipseNativeContent[slide.id];
      const interactionById = new Map((slide.interactions ?? []).map((item) => [item.id, item]));
      const article = document.createElement("article");
      article.className = `board-slide board-slide-interactive eclipse-native-slide eclipse-native-${slide.id}`;
      article.innerHTML = `
        <header class="eclipse-native-header">
          <div class="eclipse-native-kicker">Güneş ve Ay Tutulmaları</div>
          <h1>${escapeHtml(content.title)}</h1>
          <span class="eclipse-native-rule"></span>
        </header>
        <div class="eclipse-native-main">
          <section class="eclipse-native-copy">
            <div class="eclipse-native-groups"></div>
            <div class="eclipse-native-note"></div>
            ${content.warning ? `<div class="eclipse-native-warning"></div>` : ""}
          </section>
          <div class="eclipse-native-visual">
            ${slide.id === "slide_2_tutulma_nedir" ? renderEclipseConceptDiagram() : `<img src="${escapeHtml(eclipseDiagramSources[slide.id] ?? slide.media?.[0]?.src ?? "")}" alt="${escapeHtml(slide.media?.[0]?.alt ?? content.title)}" />`}
          </div>
        </div>
      `;
      const groups = article.querySelector(".eclipse-native-groups");
      for (const group of content.groups) {
        const card = document.createElement("section");
        card.className = "eclipse-native-group";
        card.innerHTML = `<h2>${escapeHtml(group.title)}</h2><div class="eclipse-native-group-body"></div>`;
        const body = card.querySelector(".eclipse-native-group-body");
        for (const parts of group.rows) {
          const row = document.createElement("p");
          mountInlineReveal(parts, interactionById, row, interactions, activeInteractions);
          body.appendChild(row);
        }
        groups.appendChild(card);
      }
      const note = article.querySelector(".eclipse-native-note");
      mountInlineReveal(content.note, interactionById, note, interactions, activeInteractions);
      if (content.warning) {
        const warning = article.querySelector(".eclipse-native-warning");
        mountInlineReveal(content.warning, interactionById, warning, interactions, activeInteractions);
      }
      view.slideContent.replaceChildren(article);
      return true;
    }
    case "eclipse_image_slide": {
      const overlays = slide.overlays ?? [];
      const interactionById = new Map((slide.interactions ?? []).map((item) => [item.id, item]));
      const slideArticle = document.createElement("article");
      slideArticle.className = `board-slide slide-eclipse-image${overlays.length ? " board-slide-interactive" : ""}`;
      slideArticle.innerHTML = `
        <img
          src="${escapeHtml(slide.media?.[0]?.src ?? "")}"
          alt="${escapeHtml(slide.media?.[0]?.alt ?? slide.title ?? "Güneş ve Ay Tutulmaları")}"
          class="eclipse-slide-img"
        />
        <div class="eclipse-overlay-layer" aria-label="${escapeHtml(slide.title ?? "Etkileşimli tutulma slaytı")}"></div>
      `;
      const layer = slideArticle.querySelector(".eclipse-overlay-layer");
      for (const overlay of overlays) {
        const slot = document.createElement("div");
        slot.className = `eclipse-reveal-slot eclipse-mask-${escapeHtml(overlay.tone ?? "blue")}`;
        slot.style.setProperty("--x", `${overlay.x ?? 0}px`);
        slot.style.setProperty("--y", `${overlay.y ?? 0}px`);
        slot.style.setProperty("--w", `${overlay.w ?? 120}px`);
        slot.style.setProperty("--h", `${overlay.h ?? 40}px`);
        slot.style.setProperty("--fs", `${overlay.fontSize ?? 34}px`);
        slot.style.setProperty("--fw", `${overlay.fontWeight ?? 800}`);
        const interaction = interactionById.get(overlay.interactionId);
        if (interaction) mountInteraction(interaction, slot, interactions, activeInteractions);
        layer.appendChild(slot);
      }
      view.slideContent.replaceChildren(slideArticle);
      return true;
    }

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
      const conceptGrid = slideArticle.querySelector(".solar-concept-grid");
      for (const def of slide.definitions ?? []) {
        const cCard = document.createElement("div");
        cCard.className = "solar-concept-card";
        cCard.innerHTML = `
          <div class="solar-concept-visual">
            <img class="solar-concept-image" src="${escapeHtml(def.image ?? "")}" alt="${escapeHtml(def.title)}" />
          </div>
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
