const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char]));

export function renderDnaSlide(slide, view) {
  const article = document.createElement("article");
  if (slide.layout === "dna_pairing_custom") {
    article.className = "board-slide dna-custom-pairing-slide";
    article.innerHTML = `<header class="dna-custom-pairing-header"><p>DNA EŞLENME ETKİNLİĞİ</p><h1>Karşı nükleotitleri bulalım</h1></header><section class="dna-custom-pairing-card"><p class="dna-custom-pairing-instruction">Verilen dizinin karşısına gelecek nükleotitleri bulunuz.</p><div class="dna-custom-pairing-strand dna-custom-given" aria-label="Verilen nükleotit dizisi">${slide.given.map((base) => `<span class="dna-custom-base dna-custom-${base}">${base}</span>`).join("")}</div><div class="dna-custom-pairing-connectors" aria-hidden="true">${slide.given.map(() => "<i></i>").join("")}</div><div class="dna-custom-pairing-strand dna-custom-answer" aria-label="Eksik karşı nükleotitler">${slide.answer.map((answer, index) => `<button type="button" class="dna-custom-blank" data-index="${index}" data-answer="${answer}">?</button>`).join("")}</div><p class="dna-custom-pairing-rule">A ↔ T &nbsp;&nbsp; G ↔ C</p><div class="dna-custom-pairing-actions"><button type="button" class="dna-custom-reveal-all">Tümünü Göster</button><button type="button" class="dna-custom-reset">Sıfırla</button></div></section>`;
    const blanks = [...article.querySelectorAll(".dna-custom-blank")];
    blanks.forEach((blank) => blank.addEventListener("click", () => { blank.textContent = blank.dataset.answer; blank.classList.add("is-revealed"); }));
    article.querySelector(".dna-custom-reveal-all").addEventListener("click", () => blanks.forEach((blank) => { blank.textContent = blank.dataset.answer; blank.classList.add("is-revealed"); }));
    article.querySelector(".dna-custom-reset").addEventListener("click", () => blanks.forEach((blank) => { blank.textContent = "?"; blank.classList.remove("is-revealed"); }));
    view.slideContent.replaceChildren(article);
    return true;
  }
  if (slide.layout === "dna_pairing") {
    article.className = "board-slide dna-pairing-slide";
    article.innerHTML = `<img class="dna-pairing-image" src="${escapeHtml(slide.media[0].src)}" alt="Nükleotitlerin karşılıklı eşleşmesi" /><section class="dna-pairing-panel"><p class="dna-pairing-instruction">Verilen nükleotit dizisinin karşısına gelecek nükleotit dizilimini bulunuz.</p><div class="dna-pairing-sequence" aria-label="Verilen bazlar">${slide.given.map((base) => `<span>${escapeHtml(base)}</span>`).join("")}</div><div class="dna-pairing-blanks" aria-label="Eksik karşı bazlar">${slide.given.map((_, index) => `<button type="button" data-index="${index}">?</button>`).join("")}</div><div class="dna-pairing-controls"><div class="dna-pairing-choices">${slide.choices.map((base) => `<button type="button" data-base="${escapeHtml(base)}">${escapeHtml(base)}</button>`).join("")}</div><button type="button" class="dna-pairing-check">Kontrol Et</button><button type="button" class="dna-pairing-reset">Sıfırla</button><p class="dna-pairing-feedback" aria-live="polite"></p></div></section>`;
    let selected = null;
    const choices = [...article.querySelectorAll(".dna-pairing-choices button")];
    const blanks = [...article.querySelectorAll(".dna-pairing-blanks button")];
    const feedback = article.querySelector(".dna-pairing-feedback");
    choices.forEach((choice) => choice.addEventListener("click", () => { selected = choice.dataset.base; choices.forEach((item) => item.classList.toggle("is-selected", item === choice)); }));
    blanks.forEach((blank) => blank.addEventListener("click", () => { if (!selected) return; blank.textContent = selected; blank.dataset.value = selected; blank.classList.remove("is-correct", "is-wrong"); selected = null; choices.forEach((item) => item.classList.remove("is-selected")); }));
    article.querySelector(".dna-pairing-check").addEventListener("click", () => { let correctCount = 0; blanks.forEach((blank, index) => { const correct = blank.dataset.value === slide.answer[index]; blank.classList.toggle("is-correct", correct); blank.classList.toggle("is-wrong", !correct); if (correct) correctCount += 1; }); feedback.textContent = correctCount === blanks.length ? "Doğru eşleşme! A ↔ T, G ↔ C." : `${correctCount}/${blanks.length} doğru. Baz eşleşmelerini yeniden kontrol et.`; feedback.className = `dna-pairing-feedback ${correctCount === blanks.length ? "is-correct" : "is-wrong"}`; });
    article.querySelector(".dna-pairing-reset").addEventListener("click", () => { blanks.forEach((blank) => { blank.textContent = "?"; delete blank.dataset.value; blank.classList.remove("is-correct", "is-wrong"); }); choices.forEach((item) => item.classList.remove("is-selected")); feedback.textContent = ""; feedback.className = "dna-pairing-feedback"; selected = null; });
    view.slideContent.replaceChildren(article);
    return true;
  }
  if (slide.layout === "dna_drag_fill") {
    article.className = "board-slide dna-drag-fill-slide";
    article.innerHTML = `<img class="dna-drag-fill-image" src="${escapeHtml(slide.media[0].src)}" alt="DNA'nın yapısı tamamlama etkinliği" /><section class="dna-drag-zones" aria-label="DNA boşlukları">${slide.zones.map((zone, index) => `<button type="button" class="dna-drag-zone" data-zone="${index}" style="left:${zone.left}%;top:${zone.top}%" aria-label="Boşluk ${index + 1}"></button>`).join("")}</section><section class="dna-drag-toolbar"><p class="dna-drag-instruction">Harf kartlarını uygun boşluklara sürükleyip bırakınız.</p><div class="dna-drag-items" aria-label="Kaynak harf kartları">${slide.items.map((item, index) => `<button type="button" class="dna-drag-item dna-drag-${item.shape} dna-drag-${item.key}" data-item="${index}" data-value="${item.key}" data-shape="${item.shape}">${escapeHtml(item.label)}</button>`).join("")}</div><div class="dna-drag-actions"><button type="button" class="dna-drag-reset">Sıfırla</button><button type="button" class="dna-drag-check">Kontrol Et</button></div><p class="dna-drag-feedback" aria-live="polite"></p></section>`;
    const zones = [...article.querySelectorAll(".dna-drag-zone")];
    const items = [...article.querySelectorAll(".dna-drag-item")];
    const feedback = article.querySelector(".dna-drag-feedback");
    let active = null;
    let ghost = null;
    const place = (zone, item) => { zone.textContent = item.textContent; zone.dataset.value = item.dataset.value; zone.dataset.shape = item.dataset.shape; zone.className = `dna-drag-zone dna-drag-${item.dataset.shape}`; zone.style.left = `${slide.zones[Number(zone.dataset.zone)].left}%`; zone.style.top = `${slide.zones[Number(zone.dataset.zone)].top}%`; };
    items.forEach((item) => item.addEventListener("pointerdown", (event) => { event.preventDefault(); active = item; ghost = item.cloneNode(true); ghost.className = `dna-drag-ghost dna-drag-${item.dataset.shape}`; document.body.appendChild(ghost); ghost.style.left = `${event.clientX - 29}px`; ghost.style.top = `${event.clientY - 29}px`; item.setPointerCapture?.(event.pointerId); }));
    items.forEach((item) => item.addEventListener("pointermove", (event) => { if (!ghost || active !== item) return; ghost.style.left = `${event.clientX - 36}px`; ghost.style.top = `${event.clientY - 24}px`; }));
    items.forEach((item) => item.addEventListener("pointerup", (event) => { if (!ghost || active !== item) return; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".dna-drag-zone"); if (target) place(target, item); ghost.remove(); ghost = null; active = null; }));
    zones.forEach((zone) => zone.addEventListener("click", () => { const item = items.find((candidate) => !candidate.classList.contains("is-used")); if (item) place(zone, item); }));
    article.querySelector(".dna-drag-check").addEventListener("click", () => { let correct = 0; zones.forEach((zone, index) => { const ok = zone.dataset.value === slide.answer[index]; zone.classList.toggle("is-correct", ok); zone.classList.toggle("is-wrong", !ok); if (ok) correct += 1; }); feedback.textContent = correct === zones.length ? "Tüm parçalar doğru yerleştirildi!" : `${correct}/${zones.length} doğru yerleşim.`; feedback.className = `dna-drag-feedback ${correct === zones.length ? "is-correct" : "is-wrong"}`; });
    article.querySelector(".dna-drag-reset").addEventListener("click", () => { zones.forEach((zone, index) => { zone.textContent = "?"; delete zone.dataset.value; delete zone.dataset.shape; zone.className = "dna-drag-zone"; zone.style.left = `${slide.zones[index].left}%`; zone.style.top = `${slide.zones[index].top}%`; }); feedback.textContent = ""; feedback.className = "dna-drag-feedback"; });
    view.slideContent.replaceChildren(article);
    return true;
  }
  if (slide.layout === "dna_ordering") {
    article.className = "board-slide dna-ordering-slide";
    article.innerHTML = `<img class="dna-ordering-image" src="${escapeHtml(slide.media[0].src)}" alt="DNA ve genetik kod görseli" /><section class="dna-ordering-panel"><p class="dna-ordering-instruction">Kavramları küçükten büyüğe doğru sıralayınız.</p><div class="dna-ordering-options" aria-label="Kavram seçenekleri">${slide.options.map((option) => `<button type="button" data-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div><div class="dna-ordering-slots" aria-label="Küçükten büyüğe sıralama kutuları">${slide.options.map((_, index) => `<button type="button" class="dna-ordering-slot" data-slot="${index}">${index + 1}. <span>Boş</span></button>`).join("")}</div><div class="dna-ordering-actions"><button type="button" class="dna-ordering-check">Kontrol Et</button><button type="button" class="dna-ordering-reset">Sıfırla</button><p class="dna-ordering-feedback" aria-live="polite"></p></div></section>`;
    let selected = null;
    const options = [...article.querySelectorAll(".dna-ordering-options button")];
    const slots = [...article.querySelectorAll(".dna-ordering-slot")];
    const feedback = article.querySelector(".dna-ordering-feedback");
    options.forEach((option) => option.addEventListener("click", () => {
      selected = option.dataset.value;
      options.forEach((item) => item.classList.toggle("is-selected", item === option));
    }));
    slots.forEach((slot) => slot.addEventListener("click", () => {
      if (!selected) return;
      slot.dataset.value = selected;
      slot.querySelector("span").textContent = selected;
      options.find((item) => item.dataset.value === selected)?.classList.add("is-used");
      selected = null;
      options.forEach((item) => item.classList.remove("is-selected"));
    }));
    article.querySelector(".dna-ordering-check").addEventListener("click", () => {
      const answer = slide.answer;
      const values = slots.map((slot) => slot.dataset.value ?? "");
      const correct = values.every((value, index) => value === answer[index]);
      feedback.textContent = correct ? "Doğru sıralama! Küçükten büyüğe doğru ilerledin." : `Henüz doğru değil. Doğru sıra: ${answer.join(" → ")}`;
      feedback.className = `dna-ordering-feedback ${correct ? "is-correct" : "is-wrong"}`;
    });
    article.querySelector(".dna-ordering-reset").addEventListener("click", () => { slots.forEach((slot) => { delete slot.dataset.value; slot.querySelector("span").textContent = "Boş"; }); options.forEach((item) => item.classList.remove("is-selected", "is-used")); feedback.textContent = ""; feedback.className = "dna-ordering-feedback"; selected = null; });
    view.slideContent.replaceChildren(article);
    return true;
  }
  if (slide.layout === "dna_insights") {
    article.className = "board-slide dna-insights-slide";
    const insights = slide.insights;
    article.innerHTML = `<img class="dna-insights-image" src="${escapeHtml(slide.media[0].src)}" alt="DNA'nın yapısı ve çıkarımlar" /><section class="dna-insights-hotspots" aria-label="DNA çıkarımları"><button type="button" class="dna-insight-hotspot dna-insight-a" data-answer="${escapeHtml(insights.baseCounts.A)}">2</button><button type="button" class="dna-insight-hotspot dna-insight-t" data-answer="${escapeHtml(insights.baseCounts.T)}">2</button><button type="button" class="dna-insight-hotspot dna-insight-g" data-answer="${escapeHtml(insights.baseCounts.G)}">3</button><button type="button" class="dna-insight-hotspot dna-insight-c" data-answer="${escapeHtml(insights.baseCounts.C)}">3</button><button type="button" class="dna-insight-hotspot dna-insight-pair-a" data-answer="${escapeHtml(insights.pairings[0])}">Adenin sayısı Timin sayısına eşittir.</button><button type="button" class="dna-insight-hotspot dna-insight-pair-g" data-answer="${escapeHtml(insights.pairings[1])}">Guanin sayısı sitozin sayısına eşittir.</button><button type="button" class="dna-insight-hotspot dna-insight-total-n" data-answer="10">10</button><button type="button" class="dna-insight-hotspot dna-insight-total-p" data-answer="10">10</button><button type="button" class="dna-insight-hotspot dna-insight-total-d" data-answer="10">10</button><button type="button" class="dna-insight-hotspot dna-insight-total-b" data-answer="10">10</button><button type="button" class="dna-insight-hotspot dna-insight-general" data-answer="${escapeHtml(insights.general)}">Dokun ve genel çıkarımı göster.</button><button type="button" class="dna-insight-restart">Baştan Başla</button></section>`;
    article.querySelectorAll(".dna-insight-hotspot").forEach((button) => button.addEventListener("click", () => { button.textContent = button.dataset.answer; button.classList.add("is-revealed"); }));
    article.querySelector(".dna-insight-restart").addEventListener("click", () => article.querySelectorAll(".dna-insight-hotspot").forEach((button) => { button.textContent = button.dataset.answer.startsWith("Adenin") ? "Adenin sayısı Timin sayısına eşittir." : button.dataset.answer.startsWith("Guanin") ? "Guanin sayısı sitozin sayısına eşittir." : button.classList.contains("dna-insight-general") ? "Dokun ve genel çıkarımı göster." : button.dataset.answer.includes("Toplam") ? "10" : button.dataset.answer; button.classList.remove("is-revealed"); }));
    view.slideContent.replaceChildren(article);
    return true;
  }
  if (slide.layout === "dna_sequence_order") {
    article.className = "board-slide dna-sequence-order-slide";
    article.innerHTML = `<img class="dna-sequence-order-image" src="${escapeHtml(slide.media[0].src)}" alt="DNA eşlenmesinin oluşum sırası" /><section class="dna-sequence-order-hotspots" aria-label="Oluşum sırası cevapları">${slide.answer.map((answer, index) => `<button type="button" class="dna-sequence-order-zone dna-sequence-order-zone-${index}" data-answer="${answer}" aria-label="${index + 1}. sıranın cevabı"></button>`).join("")}</section>`;
    article.querySelectorAll(".dna-sequence-order-zone").forEach((zone) => zone.addEventListener("click", () => { zone.textContent = zone.dataset.answer; zone.classList.add("is-revealed"); }));
    view.slideContent.replaceChildren(article);
    return true;
  }
  article.className = "board-slide dna-cover-slide";
  if (slide.media?.[0]?.src) {
    article.innerHTML = `<img class="dna-cover-image" src="${escapeHtml(slide.media[0].src)}" alt="DNA ve Genetik Kod kapak görseli" />`;
    view.slideContent.replaceChildren(article);
    return true;
  }
  article.innerHTML = `
    <div class="dna-cover-copy">
      <p class="dna-unit">${escapeHtml(slide.unit)}</p>
      <p class="dna-grade">${escapeHtml(slide.grade)}</p>
      <h1>${escapeHtml(slide.title)}</h1>
      <p class="dna-subtitle">${escapeHtml(slide.subtitle)}</p>
      <div class="dna-concepts">${slide.concepts.map((concept) => `<span>${escapeHtml(concept)}</span>`).join("")}</div>
      <div class="dna-goals">${slide.goals.map((goal) => `<div>${escapeHtml(goal)}</div>`).join("")}</div>
    </div>
    <div class="dna-hierarchy" aria-label="Hücreden DNA'ya görsel hiyerarşi">
      <div class="dna-cell"><span>Hücre</span><div class="dna-nucleus"><span>Çekirdek</span><div class="dna-chromosome"><span>Kromozom</span><div class="dna-helix"><b></b><b></b><b></b><b></b><b></b></div><em>DNA</em></div></div></div>
      <div class="dna-path-labels"><span>Hücre</span><i>→</i><span>Çekirdek</span><i>→</i><span>Kromozom</span><i>→</i><strong>DNA</strong></div>
    </div>`;
  view.slideContent.replaceChildren(article);
  return true;
}
