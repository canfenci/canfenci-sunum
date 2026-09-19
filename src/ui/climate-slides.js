const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

export function renderClimateSlide(slide, view) {
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

    default:
      return false;
  }
}
