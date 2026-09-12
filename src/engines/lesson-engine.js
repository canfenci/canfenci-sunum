export class LessonEngine {
  #lesson = null;
  #flatSlides = [];
  #index = 0;

  async load(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Ders yüklenemedi (${response.status})`);
    const lesson = await response.json();
    this.#validate(lesson);
    this.#lesson = lesson;
    this.#flatSlides = lesson.stages.flatMap((stage) =>
      stage.slides.map((slide) => ({ ...slide, stageId: stage.id }))
    );
    this.#index = 0;
    return lesson;
  }

  get lesson() { return this.#lesson; }
  get stages() { return this.#lesson?.stages ?? []; }
  get currentSlide() { return this.#flatSlides[this.#index] ?? null; }
  get currentIndex() { return this.#index; }
  get slideCount() { return this.#flatSlides.length; }

  goToSlide(slideId) {
    const index = this.#flatSlides.findIndex((slide) => slide.id === slideId);
    if (index < 0) return null;
    this.#index = index;
    return this.currentSlide;
  }

  next() {
    this.#index = Math.min(this.#index + 1, Math.max(0, this.slideCount - 1));
    return this.currentSlide;
  }

  previous() {
    this.#index = Math.max(this.#index - 1, 0);
    return this.currentSlide;
  }

  #validate(lesson) {
    if (!lesson?.id || !Array.isArray(lesson.stages)) throw new TypeError("Geçersiz ders verisi");
    const ids = new Set();
    for (const stage of lesson.stages) {
      if (!stage.id || !Array.isArray(stage.slides)) throw new TypeError("Geçersiz aşama verisi");
      for (const slide of stage.slides) {
        if (!slide.id || ids.has(slide.id)) throw new TypeError("Slayt kimlikleri benzersiz olmalıdır");
        ids.add(slide.id);
      }
    }
  }
}
