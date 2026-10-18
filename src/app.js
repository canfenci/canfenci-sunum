import { AppState } from "./core/app-state.js";
import { EventBus } from "./core/event-bus.js";
import { ModeManager } from "./core/mode-manager.js";
import { CurriculumEngine } from "./engines/curriculum-engine.js";
import { LessonEngine } from "./engines/lesson-engine.js";
import { InteractionEngine } from "./engines/interaction-engine.js";
import { AnnotationEngine } from "./engines/annotation-engine.js";
import { MediaLayer } from "./layers/media-layer.js";
import { StorageLayer } from "./layers/storage.js";
import { TeacherTools } from "./tools/teacher-tools.js";
import { renderShell } from "./ui/app-shell.js";
import { renderSolarSlide } from "./ui/solar-system-slides.js";
import { renderSpaceSlide } from "./ui/space-research-slides.js";
import { renderClimateSlide } from "./ui/climate-slides.js";
import { renderControlPanel } from "./ui/control-panel.js";
import { renderPresentation, renderPlanItemsForState } from "./ui/presentation-view.js";
import { renderWorkModePlaceholder as renderWorkModePlaceholderView } from "./ui/work-mode-placeholder.js";
import { icon } from "./ui/icons.js";
import { getWorkMode, isWorkMode } from "./core/work-modes.js";

const ANNOTATION_TOOLS = new Set(["pen", "highlighter", "eraser", "laser"]);
const getPresentationSource = (topic) => {
  const presentationMode = topic?.workModes?.presentation;
  if (presentationMode) {
    if (presentationMode.status === "available" && presentationMode.source) {
      return presentationMode.source;
    }
    if (presentationMode.status === "planned" || presentationMode.status === "disabled") {
      return null;
    }
  }
  return topic?.lessons?.[0]?.source ?? null;
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
}[char]));

class CanFenciApp {
  constructor(root) {
    this.root = root;
    this.state = new AppState();
    this.events = new EventBus();
    this.modeManager = new ModeManager({ state: this.state, events: this.events });
    this.curriculum = new CurriculumEngine();
    this.lessons = new LessonEngine();
    this.interactions = new InteractionEngine();
    this.activeInteractions = [];
    this.#registerInteractions();
    this.storage = new StorageLayer();
    this.media = new MediaLayer();
    this.teacherTools = new TeacherTools({ events: this.events });
    this.annotationEngine = null;
    this.presentationView = null;
    this.presentationResizeObserver = null;
  }

  async start() {
    this.shell = renderShell(this.root);
    this.#bindShell();
    this.#updateClock();
    window.setInterval(() => this.#updateClock(), 1000);
    this.#updateConnection();
    window.addEventListener("online", () => this.#updateConnection());
    window.addEventListener("offline", () => this.#updateConnection());
    window.addEventListener("hashchange", () => {
      this.#route().catch((err) => console.error("Yönlendirme hatası:", err));
    });
    window.addEventListener("keydown", (event) => this.#handleKeyboard(event));
    window.addEventListener("resize", () => {
      this.#updateSlideScale();
      this.annotationEngine?.resize();
    });
    document.addEventListener("fullscreenchange", () => {
      this.#updateSlideScale();
      this.annotationEngine?.resize();
    });

    try {
      this.catalog = await this.curriculum.loadCatalog();
      await this.#route();
    } catch (error) {
      this.#renderStartupError(error);
    }
  }

  #parseRoute() {
    const searchParams = new URLSearchParams(window.location.search);
    let rawHash = window.location.hash || "";
    if (rawHash.startsWith("#/")) rawHash = rawHash.slice(2);
    else if (rawHash.startsWith("#")) rawHash = rawHash.slice(1);

    let hashPath = rawHash;
    let hashQuery = "";
    const questionIdx = rawHash.indexOf("?");
    if (questionIdx !== -1) {
      hashPath = rawHash.slice(0, questionIdx);
      hashQuery = rawHash.slice(questionIdx + 1);
    }
    const hashParams = new URLSearchParams(hashQuery);

    const getParam = (key) => hashParams.get(key) || searchParams.get(key) || null;

    let curriculumProfileId = getParam("curriculumProfileId");
    let gradeId = getParam("gradeId");
    let unitId = getParam("unitId");
    let topicId = getParam("topicId");
    let lessonId = getParam("lessonId");
    let workMode = getParam("workMode");

    const segments = hashPath.split("/").filter(Boolean);
    if (segments.length === 1) {
      if (isWorkMode(segments[0])) {
        workMode = workMode || segments[0];
      }
    } else if (segments.length === 5) {
      curriculumProfileId = curriculumProfileId || segments[0];
      gradeId = gradeId || segments[1];
      unitId = unitId || segments[2];
      topicId = topicId || segments[3];
      if (isWorkMode(segments[4])) workMode = workMode || segments[4];
    } else if (segments.length === 4) {
      if (isWorkMode(segments[3])) {
        gradeId = gradeId || segments[0];
        unitId = unitId || segments[1];
        topicId = topicId || segments[2];
        workMode = workMode || segments[3];
      }
    } else if (segments.length === 3) {
      if (isWorkMode(segments[2])) {
        unitId = unitId || segments[0];
        topicId = topicId || segments[1];
        workMode = workMode || segments[2];
      }
    }

    const isExplicitControlPanel = hashPath === "control-panel" || segments[0] === "control-panel";

    return {
      curriculumProfileId,
      gradeId,
      unitId,
      topicId,
      lessonId,
      workMode: workMode && isWorkMode(workMode) ? workMode : null,
      isExplicitControlPanel
    };
  }

  async #resolveRouteContext() {
    const routeParams = this.#parseRoute();
    const currentSelection = this.state.get().selection;

    let gradeId = routeParams.gradeId || currentSelection.gradeId;
    let curriculumProfileId = routeParams.curriculumProfileId || currentSelection.curriculumProfileId;

    if (gradeId) {
      const grade = this.curriculum.getGrade(gradeId);
      if (grade?.curriculumProfileId) {
        curriculumProfileId = grade.curriculumProfileId;
      }
    } else if (curriculumProfileId) {
      const profile = this.curriculum.getProfile(curriculumProfileId);
      gradeId = profile?.gradeIds?.[0] ?? null;
    }

    if (!gradeId) {
      const defaultGrade = this.curriculum.getGrades()[0];
      gradeId = defaultGrade?.id ?? null;
      curriculumProfileId = defaultGrade?.curriculumProfileId ?? null;
    }

    if (curriculumProfileId && this.curriculumData?.profileId !== curriculumProfileId) {
      try {
        this.curriculumData = await this.curriculum.loadCurriculum(curriculumProfileId);
      } catch (err) {
        console.error("Müfredat profili yüklenemedi:", err);
      }
    }

    const grade = this.curriculum.getGrade(gradeId);
    const rawUnits = this.curriculumData?.units ?? [];
    const units = rawUnits.filter((u) => !u.gradeId || u.gradeId === gradeId);
    const targetUnitId = routeParams.unitId || currentSelection.unitId;
    const unit = units.find((item) => item.id === targetUnitId) ?? units[0] ?? null;

    const topics = unit?.topics ?? [];
    const targetTopicId = routeParams.topicId || currentSelection.topicId;
    const topic = topics.find((item) => item.id === targetTopicId) ?? topics[0] ?? null;

    const lessons = topic?.lessons ?? [];
    const targetLessonId = routeParams.lessonId || currentSelection.lessonId;
    const lesson = lessons.find((item) => item.id === targetLessonId) ?? lessons[0] ?? null;

    const workMode = routeParams.workMode || currentSelection.workMode || "presentation";

    this.state.update((draft) => {
      draft.selection.gradeId = grade?.id ?? gradeId ?? null;
      draft.selection.curriculumProfileId = curriculumProfileId ?? null;
      draft.selection.unitId = unit?.id ?? null;
      draft.selection.topicId = topic?.id ?? null;
      draft.selection.lessonId = lesson?.id ?? null;
      if (routeParams.workMode) draft.selection.workMode = routeParams.workMode;
    });

    if (this.shell?.sourceInfo) {
      const gradeSpan = this.shell.sourceInfo.querySelector("span:first-child");
      if (gradeSpan && grade) {
        gradeSpan.innerHTML = `<strong>Sınıf:</strong> ${escapeHtml(grade.label)}`;
      }
    }

    return { grade, unit, topic, lesson, workMode, routeParams };
  }

  async #route() {
    const { topic, lesson, workMode, routeParams } = await this.#resolveRouteContext();

    const isControlPanel = routeParams.isExplicitControlPanel || (
      !routeParams.workMode && (
        !location.hash || location.hash === "#/" || location.hash === "#"
      )
    );

    document.body.dataset.mode = isControlPanel ? "control-panel" : workMode;

    if (isControlPanel) {
      this.modeManager.enter("control-panel");
      const presentationSource = getPresentationSource(topic);
      if (presentationSource && (!this.lessons.lesson || this.lessons.lesson.id !== lesson?.id)) {
        try {
          await this.lessons.load(presentationSource);
        } catch (err) {
          console.warn("Önizleme için ders yüklenemedi:", err);
        }
      }
      this.#renderControlPanel();
      return;
    }

    this.state.update((draft) => { draft.selection.workMode = workMode; });
    this.modeManager.enter(workMode);
    const mode = getWorkMode(workMode);

    const presentationSource = getPresentationSource(topic);
    const presentationAvailable = Boolean(presentationSource);

    if (mode.surface === "presentation" && presentationAvailable) {
      if (!this.lessons.lesson || this.lessons.lesson.id !== lesson?.id) {
        try {
          await this.lessons.load(presentationSource);
        } catch (err) {
          console.error("Ders sunumu yüklenemedi:", err);
          this.#renderWorkModePlaceholder(workMode);
          return;
        }
      }
      this.#renderPresentation();
    } else {
      this.#renderWorkModePlaceholder(workMode);
    }
  }

  #getSelectedContext() {
    const { selection } = this.state.get();
    const grade = this.curriculum.getGrade(selection.gradeId);
    const unit = this.curriculumData?.units?.find((item) => item.id === selection.unitId) ?? null;
    const topic = unit?.topics?.find((item) => item.id === selection.topicId) ?? null;
    return { grade, unit, topic };
  }

  #renderWorkModePlaceholder(workMode) {
    this.presentationResizeObserver?.disconnect();
    this.annotationEngine?.destroy();
    this.annotationEngine = null;
    this.presentationView = null;
    this.activeInteractions.forEach((instance) => instance?.destroy?.());
    this.activeInteractions = [];
    this.#setupRecordingAutohide(false);
    delete document.body.dataset.viewMode;

    const context = this.#getSelectedContext();
    const mode = getWorkMode(workMode);
    const view = renderWorkModePlaceholderView(this.shell.main, { workMode, ...context });
    this.shell.lessonPath.innerHTML = `<span></span><i>${icon("chevron-right", 14)}</i><span></span><i>${icon("chevron-right", 14)}</i><strong></strong>`;
    this.shell.lessonPath.querySelectorAll("span")[0].textContent = context.grade?.label ?? "Sınıf seçilmedi";
    this.shell.lessonPath.querySelectorAll("span")[1].textContent = context.topic?.label ?? "Konu seçilmedi";
    this.shell.lessonPath.querySelector("strong").textContent = `${mode.label} Modu`;
    view.home.addEventListener("click", () => { location.hash = "#/"; });
  }

  #renderControlPanel() {
    this.presentationResizeObserver?.disconnect();
    this.annotationEngine?.destroy();
    this.annotationEngine = null;
    this.presentationView = null;
    this.#setupRecordingAutohide(false);
    delete document.body.dataset.viewMode;
    const selectedLesson = this.lessons.lesson?.id === this.state.get().selection.lessonId
      ? this.lessons.lesson
      : null;
    const view = renderControlPanel(this.shell.main, {
      catalog: this.catalog,
      curriculum: this.curriculumData,
      state: this.state.get(),
      lesson: selectedLesson
    });
    const { grade: selectedGrade, unit: selectedUnit, topic: selectedTopic } = this.#getSelectedContext();
    this.shell.lessonPath.innerHTML = `<span></span><i>${icon("chevron-right", 14)}</i><span></span><i>${icon("chevron-right", 14)}</i><strong></strong>`;
    this.shell.lessonPath.querySelectorAll("span")[0].textContent = selectedGrade?.label ?? "Sınıf seçilmedi";
    this.shell.lessonPath.querySelectorAll("span")[1].textContent = selectedUnit?.label ?? "Ünite seçilmedi";
    this.shell.lessonPath.querySelector("strong").textContent = selectedTopic?.label ?? "Konu seçilmedi";
    view.form.addEventListener("change", async (event) => {
      const { name, value } = event.target;
      let lessonSourceToLoad = null;
      if (name === "gradeId") {
        const grade = this.curriculum.getGrade(value);
        this.curriculumData = grade?.curriculumProfileId
          ? await this.curriculum.loadCurriculum(grade.curriculumProfileId)
          : { units: [] };
        const rawUnits = this.curriculumData?.units ?? [];
        const units = rawUnits.filter((u) => !u.gradeId || u.gradeId === value);
        const unit = units[0];
        const topic = unit?.topics?.[0];
        const lesson = topic?.lessons?.[0];
        const presentationSource = getPresentationSource(topic);
        if (presentationSource) {
          try { await this.lessons.load(presentationSource); }
          catch (err) { console.warn("Ders yüklenemedi:", err); }
        }
        this.state.update((draft) => {
          draft.selection.gradeId = grade?.id ?? null;
          draft.selection.curriculumProfileId = grade?.curriculumProfileId ?? null;
          draft.selection.unitId = unit?.id ?? null;
          draft.selection.topicId = topic?.id ?? null;
          draft.selection.lessonId = lesson?.id ?? null;
        });
        this.#renderControlPanel();
        return;
      }
      this.state.update((draft) => {
        if (name === "unitId") {
          const unit = this.curriculumData?.units?.find((item) => item.id === value);
          draft.selection.unitId = value || null;
          const topic = unit?.topics?.[0];
          draft.selection.topicId = topic?.id ?? null;
          const lesson = topic?.lessons?.[0];
          draft.selection.lessonId = lesson?.id ?? null;
          lessonSourceToLoad = getPresentationSource(topic);
        } else if (name === "topicId") {
          draft.selection.topicId = value || null;
          const unit = this.curriculumData?.units?.find((item) => item.id === draft.selection.unitId);
          const topic = unit?.topics?.find((item) => item.id === value);
          const lesson = topic?.lessons?.[0];
          draft.selection.lessonId = lesson?.id ?? null;
          lessonSourceToLoad = getPresentationSource(topic);
        } else if (Object.prototype.hasOwnProperty.call(draft.selection, name)) {
          draft.selection[name] = value || null;
        }
      });
      if (lessonSourceToLoad) {
        try {
          await this.lessons.load(lessonSourceToLoad);
        } catch (err) {
          console.warn("Ders yüklenemedi:", err);
        }
      }
      this.#renderControlPanel();
    });
    view.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const targetMode = this.state.get().selection.workMode || "presentation";
      const targetHash = `#/${targetMode}`;
      if (location.hash === targetHash) {
        this.#route().catch((err) => console.error("Yönlendirme hatası:", err));
      } else {
        location.hash = targetHash;
      }
    });
    view.validationToggle.addEventListener("click", () => {
      const collapsed = view.validationPanel.classList.toggle("is-collapsed");
      view.validationPanel.closest(".dashboard-layout").classList.toggle("validation-collapsed", collapsed);
      view.validationToggle.setAttribute("aria-expanded", String(!collapsed));
      view.validationToggle.setAttribute("aria-label", collapsed ? "Müfredat bilgisi panelini genişlet" : "Müfredat bilgisi panelini daralt");
      view.validationToggle.innerHTML = icon(collapsed ? "chevron-left" : "chevron-right");
    });
    view.sidebarBackdrop.addEventListener("click", () => this.#toggleMobileSidebar(false));
  }

  #renderPresentation() {
    const previousLessonId = this.presentationZoomLessonId;
    if (previousLessonId && previousLessonId !== this.lessons.lesson?.id) {
      this.state.update((draft) => { draft.presentation.userZoom = 1; draft.presentation.panX = 0; draft.presentation.panY = 0; return draft; });
    }
    this.presentationZoomLessonId = this.lessons.lesson?.id;
    const view = renderPresentation(this.shell.main, {
      lesson: this.lessons.lesson,
      slide: this.lessons.currentSlide,
      slideIndex: this.lessons.currentIndex,
      slideCount: this.lessons.slideCount
    });
    this.presentationView = view;
    const initialViewMode = this.state.get().presentation?.viewMode ?? "smartboard";
    this.#syncViewMode(initialViewMode);
    this.#syncPresentationView();
    this.annotationEngine = new AnnotationEngine(view.canvas);
    this.#updateSlideScale(view);
    requestAnimationFrame(() => {
      this.#updateSlideScale(view);
      this.annotationEngine?.resize();
    });
    this.presentationResizeObserver?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      this.presentationResizeObserver = new ResizeObserver(([entry]) => {
        if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          this.#updateSlideScale(view);
        } else {
          this.#updateSlideScale(view);
        }
        this.annotationEngine?.resize();
      });
      this.presentationResizeObserver.observe(view.canvasArea);
    }
    view.back.addEventListener("click", () => { location.hash = "#/"; });
    view.tools.addEventListener("click", () => this.toggleTools(true));
    view.previous.addEventListener("click", () => this.#navigateSlides(-1));
    view.next.addEventListener("click", () => this.#navigateSlides(1));
    view.jumpButton.addEventListener("click", () => this.#jumpToSlide());
    view.jumpInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); this.#jumpToSlide(); } });
    view.fullscreen.addEventListener("click", () => this.teacherTools.requestFullscreen());
    view.reset.addEventListener("click", () => this.#resetPresentation());
    view.zoomOut.addEventListener("click", () => this.#changeZoom(-0.1));
    view.zoomIn.addEventListener("click", () => this.#changeZoom(0.1));
    view.zoomFit.addEventListener("click", () => this.#fitZoom());
    view.panToggle.addEventListener("click", () => this.#togglePan());
    this.#bindPan(view);
    view.help.addEventListener("click", () => this.#toast("Ders paketi eklendiğinde sunum yardımı burada gösterilecek."));
    view.plan.addEventListener("click", () => this.#togglePlan(true));
    view.railPlan.addEventListener("click", () => view.plan.click());
    view.railHelp.addEventListener("click", () => view.help.click());
    view.closePlan.addEventListener("click", () => this.#togglePlan(false));
    view.planBackdrop.addEventListener("click", () => this.#togglePlan(false));
    view.planStages.addEventListener("click", (event) => {
      const stageId = event.target.closest("[data-stage-id]")?.dataset.stageId;
      const stage = this.lessons.stages.find((item) => item.id === stageId);
      if (stage?.slides?.[0]?.id) {
        this.lessons.goToSlide(stage.slides[0].id);
        this.#syncPresentationView();
      }
      this.#togglePlan(false);
    });

    view.railViewMode?.addEventListener("click", () => this.#toggleViewModeSheet(true));
    view.presentationViewMode?.addEventListener("click", () => this.#toggleViewModeSheet(true));
    view.floatingMode?.addEventListener("click", () => this.#toggleViewModeSheet(true));
    view.closeViewMode?.addEventListener("click", () => this.#toggleViewModeSheet(false));
    view.viewModeBackdrop?.addEventListener("click", () => this.#toggleViewModeSheet(false));
    view.cleanModeExit?.addEventListener("click", () => this.#setViewMode("smartboard"));

    view.viewModeSheet?.querySelectorAll(".viewmode-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetMode = btn.dataset.viewMode;
        if (targetMode) this.#setViewMode(targetMode);
      });
    });

    view.floatingPrev?.addEventListener("click", () => this.#navigateSlides(-1));
    view.floatingNext?.addEventListener("click", () => this.#navigateSlides(1));

    const toggleTool = (tool) => {
      const isCurrent = this.state.get().ui.annotationEnabled && this.annotationEngine?.options?.tool === tool;
      if (isCurrent) {
        this.annotationEngine?.setEnabled(false);
        this.state.update((draft) => { draft.ui.annotationEnabled = false; return draft; });
        view.floatingPen?.classList.remove("is-active");
        view.floatingLaser?.classList.remove("is-active");
        view.floatingEraser?.classList.remove("is-active");
      } else {
        this.annotationEngine?.setEnabled(true);
        this.annotationEngine?.setTool(tool);
        this.state.update((draft) => { draft.ui.annotationEnabled = true; return draft; });
        view.floatingPen?.classList.toggle("is-active", tool === "pen");
        view.floatingLaser?.classList.toggle("is-active", tool === "laser");
        view.floatingEraser?.classList.toggle("is-active", tool === "eraser");
      }
    };

    view.floatingPen?.addEventListener("click", () => toggleTool("pen"));
    view.floatingLaser?.addEventListener("click", () => toggleTool("laser"));
    view.floatingEraser?.addEventListener("click", () => toggleTool("eraser"));
    view.floatingClear?.addEventListener("click", () => {
      this.annotationEngine?.clear();
      this.#toast("Çizimler temizlendi.");
    });

    let swipeStartX = null;
    view.workspace.addEventListener("touchstart", (event) => {
      if (!this.state.get().ui.annotationEnabled) swipeStartX = event.changedTouches[0]?.clientX ?? null;
    }, { passive: true });
    view.workspace.addEventListener("touchend", (event) => {
      if (swipeStartX === null || this.state.get().ui.annotationEnabled) return;
      const distance = (event.changedTouches[0]?.clientX ?? swipeStartX) - swipeStartX;
      if (Math.abs(distance) >= 60) this.#navigateSlides(distance < 0 ? 1 : -1);
      swipeStartX = null;
    }, { passive: true });
  }

  #bindShell() {
    this.toggleTools = (open) => {
      this.shell.toolsDrawer.hidden = !open;
      this.shell.toolsButton.setAttribute("aria-expanded", String(open));
      this.state.update((draft) => { draft.ui.teacherToolsOpen = open; });
    };
    this.shell.toolsButton.addEventListener("click", () => this.toggleTools(this.shell.toolsDrawer.hidden));
    this.shell.mobileMenuButton.addEventListener("click", () => {
      const sidebar = this.shell.main.querySelector("#selection-sidebar");
      this.#toggleMobileSidebar(!sidebar?.classList.contains("is-open"));
    });
    this.shell.closeTools.addEventListener("click", () => this.toggleTools(false));
    this.shell.infoButton.addEventListener("click", () => {
      const open = this.shell.sourceInfo.hidden;
      this.shell.sourceInfo.hidden = !open;
      this.shell.infoButton.setAttribute("aria-expanded", String(open));
    });
    this.shell.toolsDrawer.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-tool-action]");
      const action = actionButton?.dataset.toolAction;
      if (!action) return;
      if (ANNOTATION_TOOLS.has(action)) {
        if (!this.annotationEngine) return this.#toast("Çizim araçları sunum modunda kullanılabilir.");
        this.shell.toolsDrawer.querySelectorAll("[data-tool-action]").forEach((button) => {
          if (!ANNOTATION_TOOLS.has(button.dataset.toolAction)) return;
          button.classList.remove("is-active");
          button.setAttribute("aria-pressed", "false");
        });
        this.annotationEngine.setTool(action);
        this.annotationEngine.setEnabled(true);
        this.state.update((draft) => { draft.ui.annotationEnabled = true; });
        actionButton.classList.add("is-active");
        actionButton.setAttribute("aria-pressed", "true");
      }
      if (action === "undo") this.annotationEngine?.undo();
      if (action === "redo") this.annotationEngine?.redo();
      if (action === "clear") this.annotationEngine?.clear();
      if (["undo", "redo", "clear"].includes(action) && !this.annotationEngine) this.#toast("Çizim geçmişi sunum modunda kullanılabilir.");
      if (action === "timer") this.teacherTools.startTimer(300);
      if (action === "curtain") this.teacherTools.toggleCurtain();
      if (action === "focus") this.shell.focusOverlay.hidden = false;
      if (action === "hint") this.#toast("Bu slayt için henüz ipucu eklenmedi.");
      if (action === "answer") this.#toast("Bu slayt için henüz cevap tanımlanmadı.");
      if (action === "note") this.shell.teacherNote.hidden = !this.shell.teacherNote.hidden;
    });
    this.root.querySelector("#annotation-color").addEventListener("input", (event) => this.annotationEngine?.setColor(event.target.value));
    this.root.querySelector("#annotation-width").addEventListener("input", (event) => this.annotationEngine?.setWidth(event.target.value));
    this.root.querySelector("#open-curtain").addEventListener("click", () => this.teacherTools.toggleCurtain());
    this.root.querySelector("#close-focus").addEventListener("click", () => { this.shell.focusOverlay.hidden = true; });
    this.events.on("teacher:timer", (seconds) => {
      const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
      const remainder = String(seconds % 60).padStart(2, "0");
      this.shell.timerOutput.textContent = `Kalan süre: ${minutes}:${remainder}`;
    });
    this.events.on("teacher:curtain:toggle", () => { this.shell.curtain.hidden = !this.shell.curtain.hidden; });
    this.events.on("teacher:fullscreen:request", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch { this.#toast("Tam ekran bu tarayıcıda kullanılamadı."); }
    });
  }

  #updateConnection() {
    const online = navigator.onLine;
    this.shell.connection.textContent = online ? "Çevrimiçi" : "Çevrimdışı";
    this.shell.connection.dataset.online = String(online);
  }

  #toggleMobileSidebar(open) {
    const sidebar = this.shell.main.querySelector("#selection-sidebar");
    const backdrop = this.shell.main.querySelector("#mobile-sidebar-backdrop");
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle("is-open", open);
    backdrop.hidden = !open;
    this.shell.mobileMenuButton.setAttribute("aria-expanded", String(open));
  }

  #togglePlan(open) {
    if (!this.presentationView) return;
    this.presentationView.planSheet.hidden = !open;
    this.presentationView.planBackdrop.hidden = !open;
    this.presentationView.plan.setAttribute("aria-expanded", String(open));
  }

  #navigateSlides(direction) {
    if (!this.lessons.slideCount) return;
    if (direction > 0) this.lessons.next();
    else this.lessons.previous();
    this.#syncPresentationView();
  }

  #jumpToSlide() {
    const input = this.presentationView?.jumpInput;
    const count = this.lessons.slideCount;
    if (!input || !count) return;
    const value = Number.parseInt(input.value, 10);
    if (!Number.isInteger(value)) { input.value = String(this.lessons.currentIndex + 1); input.setCustomValidity("Geçerli bir slayt numarası girin."); input.reportValidity?.(); return; }
    input.setCustomValidity("");
    const target = Math.max(1, Math.min(count, value));
    this.lessons.goToSlide(this.lessons.stages.flatMap((stage) => stage.slides ?? [])[target - 1]?.id);
    this.#syncPresentationView();
    input.value = String(target);
  }

  #resetPresentation() {
    const firstSlide = this.lessons.stages[0]?.slides?.[0];
    if (firstSlide) this.lessons.goToSlide(firstSlide.id);
    this.annotationEngine?.clear();
    this.activeInteractions.forEach((inst) => inst?.reset?.());
    this.#syncPresentationView();
    this.#toast("Sunum görünümü ve cevaplar sıfırlandı.");
  }

  #syncPresentationView() {
    const view = this.presentationView;
    if (!view) return;
    const slide = this.lessons.currentSlide;
    const count = this.lessons.slideCount;
    const index = this.lessons.currentIndex;
    const stage = this.lessons.stages.find((item) => item.id === slide?.stageId);
    const stageLabel = stage?.label ?? "Ders başlangıcı";
    const slideTag = slide?.tag ?? slide?.kicker ?? stageLabel;
    const isSame = slideTag.trim().toLocaleLowerCase("tr") === stageLabel.trim().toLocaleLowerCase("tr");
    const currentNumber = count ? index + 1 : 0;

    if (view.stageKicker) {
      view.stageKicker.textContent = slideTag;
    }
    if (view.stageLabel) {
      view.stageLabel.textContent = isSame ? "" : stageLabel;
      view.stageLabel.hidden = isSame;
    }
    if (view.stageMeta) {
      view.stageMeta.classList.toggle("is-single", isSame);
    }
    if (view.topicLabel) {
      view.topicLabel.textContent = this.lessons.lesson?.title ?? this.#getSelectedContext().topic?.label ?? "Konu";
    }
    view.progressBar.style.width = `${count ? Math.round((currentNumber / count) * 100) : 0}%`;
    view.stageStatus.textContent = `Slayt ${currentNumber} / ${count}`;
    view.counterCurrent.textContent = String(currentNumber);
    view.counterTotal.textContent = String(count);
    if (view.jumpInput) { view.jumpInput.max = String(Math.max(1, count)); view.jumpInput.value = count ? String(currentNumber) : ""; }
    view.previous.disabled = index <= 0 || !count;
    view.next.disabled = index >= count - 1 || !count;
    view.planStages.innerHTML = renderPlanItemsForState(this.lessons.lesson, slide);
    if (slide) {
      this.activeInteractions?.forEach((inst) => inst?.destroy?.());
      this.activeInteractions = [];

      if (!this.#renderCanvaSlide(slide, view)) {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide";

        const header = document.createElement("header");
        header.className = "board-slide-header";
        if (slide.kicker) {
          const kicker = document.createElement("span");
          kicker.className = "board-slide-kicker slide-type-kicker";
          kicker.textContent = slide.kicker;
          header.appendChild(kicker);
        }
        const title = document.createElement("h1");
        title.className = "board-slide-title slide-type-title";
        title.textContent = slide.title ?? "";
        header.appendChild(title);
        slideArticle.appendChild(header);

      const bodyGrid = document.createElement("div");
      bodyGrid.className = "board-slide-body";

      const textCol = document.createElement("div");
      textCol.className = "board-col-text";

      if (slide.lead) {
        const leadP = document.createElement("p");
        leadP.className = "board-lead slide-type-emphasis";
        leadP.textContent = slide.lead;
        textCol.appendChild(leadP);
      }

      if (Array.isArray(slide.blocks)) {
        for (const block of slide.blocks) {
          if (block.type === "question") {
            const qCard = document.createElement("div");
            qCard.className = "board-question-card";

            const badge = document.createElement("span");
            badge.className = "board-badge question slide-type-kicker";
            badge.textContent = "❓ " + (block.title ?? "Düşünelim");
            qCard.appendChild(badge);

            const qText = document.createElement("h2");
            qText.className = "board-question-text slide-type-emphasis";
            qText.textContent = block.content ?? "";
            qCard.appendChild(qText);

            if (block.prompt) {
              const pBox = document.createElement("div");
              pBox.className = "board-prompt-box";
              const pTag = document.createElement("span");
              pTag.className = "prompt-tag slide-type-kicker";
              pTag.textContent = "🤔 TAHMİN ET";
              pBox.appendChild(pTag);
              const pText = document.createElement("p");
              pText.className = "slide-type-card-desc";
              pText.textContent = block.prompt;
              pBox.appendChild(pText);
              qCard.appendChild(pBox);
            }
            textCol.appendChild(qCard);
          } else if (block.type === "callout") {
            const cCard = document.createElement("div");
            cCard.className = `board-callout-card ${block.variant ?? "info"}`;

            const badge = document.createElement("span");
            badge.className = `board-badge ${block.variant ?? "info"} slide-type-kicker`;
            badge.textContent = (block.variant === "danger" ? "⚠️ " : "💡 ") + (block.title ?? "Önemli Not");
            cCard.appendChild(badge);

            const cText = document.createElement("p");
            cText.className = "board-callout-text slide-type-emphasis";
            cText.textContent = block.content ?? "";
            cCard.appendChild(cText);

            textCol.appendChild(cCard);
          } else if (block.type === "key_concept") {
            const kCard = document.createElement("div");
            kCard.className = "board-concept-card";

            const badge = document.createElement("span");
            badge.className = "board-badge concept slide-type-kicker";
            badge.textContent = "🎯 " + (block.title ?? "Temel Faktörler");
            kCard.appendChild(badge);

            if (block.content) {
              const p = document.createElement("p");
              p.className = "board-lead slide-type-emphasis";
              p.textContent = block.content;
              kCard.appendChild(p);
            }

            if (Array.isArray(block.items)) {
              const ul = document.createElement("ul");
              ul.className = "board-concept-list";
              for (const item of block.items) {
                const li = document.createElement("li");
                li.className = "slide-type-bullet";
                li.textContent = item;
                ul.appendChild(li);
              }
              kCard.appendChild(ul);
            }

            textCol.appendChild(kCard);
          } else if (block.type === "list") {
            const lCard = document.createElement("div");
            lCard.className = "board-list-card";

            if (block.title) {
              const h3 = document.createElement("h3");
              h3.className = "board-card-heading slide-type-section";
              h3.textContent = block.title;
              lCard.appendChild(h3);
            }

            if (Array.isArray(block.items)) {
              const ul = document.createElement("ul");
              ul.className = "board-items-list";
              for (const item of block.items) {
                const li = document.createElement("li");
                li.className = "slide-type-bullet";
                li.textContent = item;
                ul.appendChild(li);
              }
              lCard.appendChild(ul);
            }

            textCol.appendChild(lCard);
          }
        }
      }
      bodyGrid.appendChild(textCol);

      const visualCol = document.createElement("div");
      visualCol.className = "board-col-visual";

      const vPanel = document.createElement("div");
      vPanel.className = "board-visual-panel";

      const vCanvas = document.createElement("div");
      vCanvas.className = "board-visual-canvas";

      const vBadge = document.createElement("div");
      vBadge.className = "board-visual-badge";
      const vKicker = document.createElement("span");
      vKicker.className = "board-visual-kicker slide-type-kicker";
      vKicker.textContent = "GÖRSEL İNCELEME ALANI";
      const vTheme = document.createElement("strong");
      vTheme.className = "board-visual-heading slide-type-section";
      vTheme.textContent = slide.visualTheme ?? slide.title ?? "Görsel Alanı";
      vBadge.appendChild(vKicker);
      vBadge.appendChild(vTheme);
      vCanvas.appendChild(vBadge);

      const vCenter = document.createElement("div");
      vCenter.className = "board-visual-centerpiece";
      const vGraphic = document.createElement("div");
      vGraphic.className = "board-visual-graphic";
      vGraphic.innerHTML = `<div class="graphic-icon">${icon("zap", 64)}</div><div class="graphic-label"><strong class="slide-type-card-title">${slide.visualTheme ?? slide.title}</strong><small class="slide-type-card-desc">Akıllı Tahta Görseli (Sonraki adımda PDF görseli bağlanacak)</small></div>`;
      vCenter.appendChild(vGraphic);
      vCanvas.appendChild(vCenter);

      if (Array.isArray(slide.visualHighlights) && slide.visualHighlights.length) {
        const vTags = document.createElement("div");
        vTags.className = "board-visual-tags";
        for (const hl of slide.visualHighlights) {
          const tag = document.createElement("div");
          tag.className = "visual-hl-item";
          tag.innerHTML = `<span class="hl-dot"></span><div><strong class="slide-type-card-title">${hl.title}</strong><small class="slide-type-card-desc">${hl.desc}</small></div>`;
          vTags.appendChild(tag);
        }
        vCanvas.appendChild(vTags);
      }

      vPanel.appendChild(vCanvas);

      const media = slide.media?.[0];
      if (media?.caption) {
        const caption = document.createElement("div");
        caption.className = "board-visual-caption slide-type-card-desc";
        caption.textContent = `📌 ${media.caption}`;
        vPanel.appendChild(caption);
      }

      visualCol.appendChild(vPanel);
      bodyGrid.appendChild(visualCol);

      slideArticle.appendChild(bodyGrid);
      view.slideContent.replaceChildren(slideArticle);
      }
    }
    if (view.floatingCounterCurrent) view.floatingCounterCurrent.textContent = String(currentNumber);
    if (view.floatingCounterTotal) view.floatingCounterTotal.textContent = String(count);
    if (view.floatingPrev) view.floatingPrev.disabled = index <= 0 || !count;
    if (view.floatingNext) view.floatingNext.disabled = index >= count - 1 || !count;

    const { grade } = this.#getSelectedContext();
    this.shell.lessonPath.innerHTML = `<span></span><i>${icon("chevron-right", 14)}</i><span>Sunum Modu</span><i>${icon("chevron-right", 14)}</i><strong></strong>`;
    this.shell.lessonPath.querySelector("span").textContent = grade?.label ?? "Sınıf";
    this.shell.lessonPath.querySelector("strong").textContent = stageLabel;
  }

  #renderCanvaSlide(slide, view) {
    if (slide.layout === "heredity_character_interactive") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-character-interactive-slide";
      const frame = document.createElement("div");
      frame.className = "heredity-character-frame";
      const image = document.createElement("img");
      image.className = "heredity-character-image";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Kalıtım karakter etkinliği";
      frame.appendChild(image);
      const answers = ["Göz rengi", "Saç rengi", "Kulak memesi şekli", "Çil", "Spor yapmak", "Yara izi", "Kaslı olmak", "Dövme"];
      const positions = [
        [22.8, 69.0, 12.8, 9.4], [36.3, 69.0, 12.8, 9.4], [22.8, 79.8, 12.8, 9.4], [36.3, 79.8, 12.8, 9.4],
        [50.8, 69.0, 12.8, 9.4], [64.3, 69.0, 12.8, 9.4], [50.8, 79.8, 12.8, 9.4], [64.3, 79.8, 12.8, 9.4]
      ];
      positions.forEach(([left, top, width, height], index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `heredity-character-hotspot ${index < 4 ? "is-hereditary" : "is-not-hereditary"}`;
        button.style.left = `${left}%`;
        button.style.top = `${top}%`;
        button.style.width = `${width}%`;
        button.style.height = `${height}%`;
        button.setAttribute("aria-label", `${answers[index]} cevabını göster`);
        button.innerHTML = `<span>${answers[index]}</span>`;
        button.addEventListener("click", () => button.classList.toggle("is-revealed"));
        frame.appendChild(button);
      });
      article.appendChild(frame);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_activity_one_interactive") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-activity-one-slide";
      const frame = document.createElement("div");
      frame.className = "heredity-activity-one-frame";
      const image = document.createElement("img");
      image.className = "heredity-activity-one-image";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Kalıtım etkinlik 1";
      frame.appendChild(image);
      const hotspots = [
        { left: 8.77, top: 51.39, width: 18.39, height: 7.91, answer: "MM", label: "Üst satır genotip cevabı" },
        { left: 72.06, top: 51.39, width: 18.27, height: 7.91, answer: "Mor çiçek", label: "Üst satır fenotip söylemi cevabı" },
        { left: 30.53, top: 64.42, width: 18.15, height: 7.91, answer: "Melez döl", label: "Orta satır genotipin okunuşu cevabı" },
        { left: 72.06, top: 64.42, width: 18.27, height: 7.91, answer: "Mor çiçek", label: "Orta satır fenotip söylemi cevabı" },
        { left: 8.83, top: 77.46, width: 18.27, height: 7.91, answer: "mm", label: "Alt satır genotip cevabı" },
        { left: 30.59, top: 77.46, width: 18.15, height: 7.91, answer: "Saf döl çekinik", label: "Alt satır genotipin okunuşu cevabı" },
        { left: 72.06, top: 77.46, width: 18.27, height: 7.91, answer: "Beyaz çiçek", label: "Alt satır fenotip söylemi cevabı" }
      ];
      hotspots.forEach(({ left, top, width, height, answer, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "heredity-activity-one-hotspot";
        button.style.left = `${left}%`;
        button.style.top = `${top}%`;
        button.style.width = `${width}%`;
        button.style.height = `${height}%`;
        button.setAttribute("aria-label", `${label}: ${answer}`);
        button.innerHTML = `<span>${answer}</span>`;
        button.addEventListener("click", () => button.classList.toggle("is-revealed"));
        frame.appendChild(button);
      });
      article.appendChild(frame);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_activity_two_interactive") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-activity-two-slide";
      const frame = document.createElement("div");
      frame.className = "heredity-activity-two-frame";
      const image = document.createElement("img");
      image.className = "heredity-activity-two-image";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Kalıtım etkinlik 2";
      frame.appendChild(image);
      const hotspots = [
        { centerX: 54.6, centerY: 60.7, answer: "Yy", label: "Melez yuvarlak tohumlu cevabı" },
        { centerX: 54.6, centerY: 66.3, answer: "SS", label: "Homozigot sarı tohumlu cevabı" },
        { centerX: 54.6, centerY: 72.0, answer: "mm", label: "Beyaz çiçekli cevabı" },
        { centerX: 54.6, centerY: 77.9, answer: "şş", label: "Homozigot boğumlu tohum cevabı" },
        { centerX: 54.6, centerY: 83.8, answer: "Mm", label: "Heterozigot mor çiçekli cevabı" },
        { centerX: 54.6, centerY: 89.8, answer: "ŞŞ", label: "Saf şişkin tohumlu cevabı" }
      ];
      const hotspotWidth = 19.5;
      const hotspotHeight = 4.8;
      hotspots.forEach(({ centerX, centerY, answer, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "heredity-activity-two-hotspot";
        button.style.left = `${centerX - hotspotWidth / 2}%`;
        button.style.top = `${centerY - hotspotHeight / 2}%`;
        button.style.width = `${hotspotWidth}%`;
        button.style.height = `${hotspotHeight}%`;
        button.setAttribute("aria-label", `${label}: ${answer}`);
        button.innerHTML = `<span>${answer}</span>`;
        button.addEventListener("click", () => button.classList.toggle("is-revealed"));
        frame.appendChild(button);
      });
      article.appendChild(frame);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-slide";
      article.setAttribute("aria-label", "Aşamalı çaprazlama örneği");
      article.innerHTML = `
        <header class="crossing-example-heading">
          <h1>Örnek Soru</h1>
          <p>Homozigot mor çiçekli bir bezelye ile homozigot beyaz çiçekli bir bezelyenin çaprazlamasını yapalım.</p>
        </header>
        <div class="crossing-example-flow" aria-label="Çaprazlama aşamaları">
          <article class="crossing-example-step crossing-example-character" data-step="1">
            <div class="crossing-step-title"><span class="crossing-step-number">1</span><strong>İncelenen karakter</strong></div>
            <p class="crossing-main-label">Çiçek rengi</p>
            <div class="allele-key"><span class="dominant-allele">Mor baskın alel <b>M</b></span><span class="recessive-allele">Beyaz çekinik alel <b>m</b></span></div>
          </article>
          <article class="crossing-example-step crossing-example-parents" data-step="2">
            <div class="crossing-step-title"><span class="crossing-step-number">2</span><strong>Ana ve baba genotipleri</strong></div>
            <div class="parent-genotypes"><span>Homozigot mor <b>MM</b></span><i>×</i><span>Homozigot beyaz <b>mm</b></span></div>
            <p class="crossing-expression">MM <i>×</i> mm</p>
          </article>
          <article class="crossing-example-step crossing-example-gametes" data-step="3">
            <div class="crossing-step-title"><span class="crossing-step-number">3</span><strong>Gametler</strong><small>Homozigot bireyler tek çeşit gamet oluşturur.</small></div>
            <div class="gamete-groups">
              <div><b class="parent-symbol">MM</b><span>→</span><i class="gamete dominant">M</i><i class="gamete dominant">M</i></div>
              <div><b class="parent-symbol">mm</b><span>→</span><i class="gamete recessive">m</i><i class="gamete recessive">m</i></div>
            </div>
          </article>
          <article class="crossing-example-step crossing-example-punnett" data-step="4">
            <div class="crossing-step-title"><span class="crossing-step-number">4</span><strong>Punnett karesi</strong><small>Gametler birleştirilir.</small></div>
            <table aria-label="MM ve mm çaprazlama Punnett karesi"><thead><tr><th></th><th>M</th><th>M</th></tr></thead><tbody><tr><th>m</th><td>Mm</td><td>Mm</td></tr><tr><th>m</th><td>Mm</td><td>Mm</td></tr></tbody></table>
          </article>
          <article class="crossing-example-step crossing-example-offspring" data-step="5">
            <div class="crossing-step-title"><span class="crossing-step-number">5</span><strong>Yavru genotipleri</strong></div>
            <div class="offspring-genotypes" aria-label="Dört yavrunun genotipi"><b>Mm</b><b>Mm</b><b>Mm</b><b>Mm</b></div>
            <small>Tüm yavrular aynı genotipe sahiptir.</small>
          </article>
          <article class="crossing-example-step crossing-example-summary" data-step="6">
            <div class="crossing-step-title"><span class="crossing-step-number">6</span><strong>Sonuç</strong></div>
            <div class="crossing-summary-results"><section><small>Genotip sonucu</small><b>%100 Mm</b><b>%100 melez</b></section><section><small>Fenotip sonucu</small><b>%100 mor çiçekli</b></section></div>
          </article>
        </div>
      `;

      let activePointerId = null;
      let pointerStart = null;
      let revealStep = 0;
      const revealNextStep = () => {
        if (revealStep >= 6) return;
        revealStep += 1;
        article.querySelector(`[data-step="${revealStep}"]`)?.classList.add("is-visible");
      };
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      article.addEventListener("pointerdown", (event) => {
        if (interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) revealNextStep();
      });
      article.addEventListener("pointercancel", () => {
        activePointerId = null;
        pointerStart = null;
      });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example_one_auto") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-one-auto-slide heredity-crossing-example-four-slide is-awaiting-start";
      article.dataset.solutionPhase = "0";
      article.setAttribute("aria-label", "Saf sarı ve saf yeşil tohumlu bezelyelerin çaprazlaması");
      article.innerHTML = `
        <header class="crossing-four-heading"><h1>Örnek Soru-1</h1><p>Saf sarı tohumlu bezelye ile saf yeşil tohumlu bezelyenin çaprazlamasını yapalım.</p></header>
        <aside class="crossing-four-ai-analysis" aria-live="polite" aria-label="Çözüm analizi"><strong>Çözüm analiz ediliyor</strong><span>Karakter: Tohum rengi</span><span>Baskın alel: S</span><span>Çekinik alel: s</span><span>1. bezelye: saf sarı → SS</span><span>2. bezelye: saf yeşil → ss</span></aside>
        <section class="crossing-four-parents" aria-label="Çaprazlanacak ebeveynler"><article class="crossing-four-parent"><div><span>1. Bezelye</span><strong>Saf sarı tohumlu</strong><b>SS</b></div><i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i></article><div class="crossing-four-expression" aria-label="SS çarpı ss">SS <i>×</i> ss</div><article class="crossing-four-parent crossing-one-green-parent"><i class="pea-seed pea-seed-green pea-seed-large" aria-label="Yeşil tohum"></i><div><span>2. Bezelye</span><strong>Saf yeşil tohumlu</strong><b>ss</b></div></article></section>
        <div class="crossing-four-start-hint" aria-hidden="true"><span>✦</span> Dokununca çözüm başlar</div>
        <section class="crossing-four-workspace"><article class="crossing-four-gametes"><h2>Gametler</h2><div class="crossing-four-gamete-row"><b>Saf sarı: SS</b><span>→</span><i class="gamete dominant">S</i><i class="gamete dominant">S</i></div><div class="crossing-four-gamete-row"><b>Saf yeşil: ss</b><span>→</span><i class="gamete recessive">s</i><i class="gamete recessive">s</i></div><p>Saf döl sarı bezelye yalnız S aleli taşır. Saf döl yeşil bezelye yalnız s aleli taşır.</p></article><article class="crossing-four-punnett"><h2>Punnett karesi</h2><table aria-label="SS ve ss çaprazlama Punnett karesi"><thead><tr><th></th><th>S</th><th>S</th></tr></thead><tbody><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td></tr><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td></tr></tbody></table></article></section>
        <section class="crossing-four-results" aria-label="Çaprazlama sonuçları"><article class="crossing-four-result-card crossing-four-genotype-result"><h2>Genotip Sonucu</h2><div><b>4 adet Ss</b></div><p>Genotip oranı: <strong>%100 Ss</strong></p><small>%100 melez döl</small></article><article class="crossing-four-result-card crossing-four-phenotype-result"><h2>Fenotip Sonucu</h2><strong>%100 sarı tohumlu</strong><div class="crossing-four-seed-row"><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></div><p>Bu çaprazlamada oluşan yavruların tamamı sarı tohumlu olur.</p></article></section>
      `;
      let activePointerId = null;
      let pointerStart = null;
      let started = false;
      const timers = [];
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const setPhase = (phase) => { article.dataset.solutionPhase = String(phase); };
      const schedule = (delay, phase) => timers.push(setTimeout(() => setPhase(phase), delay));
      const startSolution = () => {
        if (started) return;
        started = true;
        article.classList.remove("is-awaiting-start");
        article.classList.add("is-solving");
        schedule(1000, 1);
        schedule(5500, 2);
        schedule(7800, 3);
        schedule(10100, 4);
        schedule(14100, 5);
        schedule(16400, 6);
      };
      article.addEventListener("pointerdown", (event) => {
        if (started || interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) startSolution();
      });
      article.addEventListener("pointercancel", () => { activePointerId = null; pointerStart = null; });
      this.activeInteractions.push({ destroy: () => timers.forEach((timer) => clearTimeout(timer)) });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example_two") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-two-slide is-awaiting-start";
      article.dataset.solutionPhase = "0";
      article.setAttribute("aria-label", "Melez sarı ve saf yeşil tohumlu bezelyelerin çaprazlaması");
      article.innerHTML = `
        <header class="crossing-two-heading">
          <h1>Örnek Soru-2</h1>
          <p>Melez döl sarı tohumlu bezelye ile, saf döl yeşil tohumlu bezelyeleri çaprazlayalım.</p>
        </header>
        <aside class="crossing-two-ai-analysis" aria-live="polite" aria-label="Çözüm analizi">
          <strong>Çözüm analiz ediliyor</strong>
          <span>Karakter belirleniyor: Tohum rengi</span>
          <span>Baskın alel: S</span>
          <span>Çekinik alel: s</span>
          <span>1. bezelye: melez döl sarı tohumlu → Ss</span>
          <span>2. bezelye: saf döl yeşil tohumlu → ss</span>
        </aside>
        <section class="crossing-two-parents" aria-label="Çaprazlanacak ebeveynler">
          <article class="crossing-two-parent crossing-two-yellow-parent">
            <div><span>1. Bezelye</span><strong>Melez döl sarı tohumlu</strong><b>Ss</b></div>
            <i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i>
          </article>
          <div class="crossing-two-expression" aria-label="Ss çarpı ss">Ss <i>×</i> ss</div>
          <article class="crossing-two-parent crossing-two-green-parent">
            <i class="pea-seed pea-seed-green pea-seed-large" aria-label="Yeşil tohum"></i>
            <div><span>2. Bezelye</span><strong>Saf döl yeşil tohumlu</strong><b>ss</b></div>
          </article>
        </section>
        <div class="crossing-two-start-hint" aria-hidden="true"><span>✦</span> Dokununca çözüm başlar</div>
        <section class="crossing-two-workspace">
          <article class="crossing-two-gametes">
            <h2>Gametler</h2>
            <div class="crossing-two-gamete-row"><b>Ss</b><span>→</span><i class="gamete dominant">S</i><i class="gamete recessive">s</i></div>
            <div class="crossing-two-gamete-row"><b>ss</b><span>→</span><i class="gamete recessive">s</i><i class="gamete recessive">s</i></div>
          </article>
          <article class="crossing-two-punnett">
            <h2>Punnett karesi</h2>
            <table aria-label="Ss ve ss çaprazlama Punnett karesi"><thead><tr><th></th><th>S</th><th>s</th></tr></thead><tbody><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td></tr><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td></tr></tbody></table>
          </article>
        </section>
        <section class="crossing-two-results" aria-label="Çaprazlama sonuçları">
          <article class="crossing-two-result-card crossing-two-genotype-result"><h2>Genotip Sonucu</h2><div><b>2 adet Ss</b><b>2 adet ss</b></div><p>Genotip oranı: <strong>%50 Ss, %50 ss</strong></p></article>
          <article class="crossing-two-result-card crossing-two-phenotype-result"><h2>Fenotip Sonucu</h2><div class="phenotype-seed-row"><b>%50 sarı tohumlu</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></div><div class="phenotype-seed-row"><b>%50 yeşil tohumlu</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i><i class="pea-seed pea-seed-green" aria-hidden="true"></i></div></article>
        </section>
      `;
      let activePointerId = null;
      let pointerStart = null;
      let started = false;
      const timers = [];
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const setPhase = (phase) => { article.dataset.solutionPhase = String(phase); };
      const schedule = (delay, phase) => timers.push(setTimeout(() => setPhase(phase), delay));
      const startSolution = () => {
        if (started) return;
        started = true;
        article.classList.remove("is-awaiting-start");
        article.classList.add("is-solving");
        setPhase(1);
        schedule(2200, 2);
        schedule(3500, 3);
        schedule(4850, 4);
        schedule(6250, 5);
        schedule(7650, 6);
      };
      article.addEventListener("pointerdown", (event) => {
        if (started || interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) startSolution();
      });
      article.addEventListener("pointercancel", () => {
        activePointerId = null;
        pointerStart = null;
      });
      this.activeInteractions.push({
        destroy: () => timers.forEach((timer) => clearTimeout(timer))
      });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example_three") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-three-slide is-awaiting-start";
      article.dataset.solutionPhase = "0";
      article.setAttribute("aria-label", "İki melez sarı tohumlu bezelyenin çaprazlaması");
      article.innerHTML = `
        <header class="crossing-three-heading">
          <h1>Örnek Soru-3</h1>
          <p>Melez döl sarı tohumlu bezelye ile melez döl sarı tohumlu bezelyeyi çaprazlayalım.</p>
        </header>
        <aside class="crossing-three-ai-analysis" aria-live="polite" aria-label="Çözüm analizi">
          <strong>Çözüm analiz ediliyor</strong>
          <span>Karakter: tohum rengi</span>
          <span>Baskın alel: S</span>
          <span>Çekinik alel: s</span>
          <span>1. bezelye: Ss</span>
          <span>2. bezelye: Ss</span>
        </aside>
        <section class="crossing-three-parents" aria-label="Çaprazlanacak ebeveynler">
          <article class="crossing-three-parent crossing-three-yellow-parent">
            <div><span>1. Bezelye</span><strong>Melez döl sarı tohumlu</strong><b>Ss</b></div>
            <i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i>
          </article>
          <div class="crossing-three-expression" aria-label="Ss çarpı Ss">Ss <i>×</i> Ss</div>
          <article class="crossing-three-parent crossing-three-yellow-parent">
            <i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i>
            <div><span>2. Bezelye</span><strong>Melez döl sarı tohumlu</strong><b>Ss</b></div>
          </article>
        </section>
        <div class="crossing-three-start-hint" aria-hidden="true"><span>✦</span> Dokununca çözüm başlar</div>
        <section class="crossing-three-workspace">
          <article class="crossing-three-gametes">
            <h2>Gametler</h2>
            <div class="crossing-three-gamete-row"><b>1. ebeveyn: Ss</b><span>→</span><i class="gamete dominant">S</i><i class="gamete recessive">s</i></div>
            <div class="crossing-three-gamete-row"><b>2. ebeveyn: Ss</b><span>→</span><i class="gamete dominant">S</i><i class="gamete recessive">s</i></div>
          </article>
          <article class="crossing-three-punnett">
            <h2>Punnett karesi</h2>
            <table aria-label="Ss ve Ss çaprazlama Punnett karesi"><thead><tr><th></th><th>S</th><th>s</th></tr></thead><tbody><tr><th>S</th><td><b>SS</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td></tr><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td></tr></tbody></table>
          </article>
        </section>
        <section class="crossing-three-results" aria-label="Çaprazlama sonuçları">
          <article class="crossing-three-result-card crossing-three-genotype-result"><h2>Genotip Sonucu</h2><div><b>1 adet SS</b><b>2 adet Ss</b><b>1 adet ss</b></div><p>Genotip oranı: <strong>1 SS : 2 Ss : 1 ss</strong></p></article>
          <article class="crossing-three-result-card crossing-three-phenotype-result"><h2>Fenotip Sonucu</h2><div class="crossing-three-seed-row"><b>3 adet sarı tohumlu</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></div><div class="crossing-three-seed-row"><b>1 adet yeşil tohumlu</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></div><p>Fenotip oranı: <strong>3 sarı : 1 yeşil</strong></p></article>
          <article class="crossing-three-result-card crossing-three-summary"><h2>Özet</h2><p>Baskın özellik sarı tohum rengidir.</p><p>Çekinik özellik yeşil tohum rengidir.</p><strong>Yavruların %75’i sarı, %25’i yeşil olur.</strong></article>
        </section>
      `;
      let activePointerId = null;
      let pointerStart = null;
      let started = false;
      const timers = [];
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const setPhase = (phase) => { article.dataset.solutionPhase = String(phase); };
      const schedule = (delay, phase) => timers.push(setTimeout(() => setPhase(phase), delay));
      const startSolution = () => {
        if (started) return;
        started = true;
        article.classList.remove("is-awaiting-start");
        article.classList.add("is-solving");
        setPhase(1);
        schedule(2400, 2);
        schedule(4300, 3);
        schedule(6200, 4);
        schedule(9100, 5);
        schedule(11000, 6);
        schedule(12900, 7);
      };
      article.addEventListener("pointerdown", (event) => {
        if (started || interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) startSolution();
      });
      article.addEventListener("pointercancel", () => {
        activePointerId = null;
        pointerStart = null;
      });
      this.activeInteractions.push({ destroy: () => timers.forEach((timer) => clearTimeout(timer)) });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example_four") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-four-slide is-awaiting-start";
      article.dataset.solutionPhase = "0";
      article.setAttribute("aria-label", "Saf sarı ve melez sarı tohumlu bezelyelerin çaprazlaması");
      article.innerHTML = `
        <header class="crossing-four-heading">
          <h1>Örnek Soru-4</h1>
          <p>Saf döl sarı tohumlu bezelye ile melez döl sarı tohumlu bezelyeyi çaprazlayalım.</p>
        </header>
        <aside class="crossing-four-ai-analysis" aria-live="polite" aria-label="Çözüm analizi">
          <strong>Çözüm analiz ediliyor</strong>
          <span>Karakter: Tohum rengi</span>
          <span>Baskın alel: S</span>
          <span>Çekinik alel: s</span>
          <span>Saf döl sarı tohumlu → SS</span>
          <span>Melez döl sarı tohumlu → Ss</span>
        </aside>
        <section class="crossing-four-parents" aria-label="Çaprazlanacak ebeveynler">
          <article class="crossing-four-parent"><div><span>1. Bezelye</span><strong>Saf döl sarı tohumlu</strong><b>SS</b></div><i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i></article>
          <div class="crossing-four-expression" aria-label="SS çarpı Ss">SS <i>×</i> Ss</div>
          <article class="crossing-four-parent"><i class="pea-seed pea-seed-yellow pea-seed-large" aria-label="Sarı tohum"></i><div><span>2. Bezelye</span><strong>Melez döl sarı tohumlu</strong><b>Ss</b></div></article>
        </section>
        <div class="crossing-four-start-hint" aria-hidden="true"><span>✦</span> Dokununca çözüm başlar</div>
        <section class="crossing-four-workspace">
          <article class="crossing-four-gametes"><h2>Gametler</h2><div class="crossing-four-gamete-row"><b>Saf döl: SS</b><span>→</span><i class="gamete dominant">S</i><i class="gamete dominant">S</i></div><div class="crossing-four-gamete-row"><b>Melez döl: Ss</b><span>→</span><i class="gamete dominant">S</i><i class="gamete recessive">s</i></div><p>Saf döl birey tek çeşit, melez birey iki çeşit gamet oluşturur.</p></article>
          <article class="crossing-four-punnett"><h2>Punnett karesi</h2><table aria-label="SS ve Ss çaprazlama Punnett karesi"><thead><tr><th></th><th>S</th><th>S</th></tr></thead><tbody><tr><th>S</th><td><b>SS</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>SS</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td></tr><tr><th>s</th><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td><td><b>Ss</b><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></td></tr></tbody></table></article>
        </section>
        <section class="crossing-four-results" aria-label="Çaprazlama sonuçları">
          <article class="crossing-four-result-card crossing-four-genotype-result"><h2>Genotip Sonucu</h2><div><b>2 adet SS</b><b>2 adet Ss</b></div><p>Genotip oranı: <strong>%50 SS, %50 Ss</strong></p><small>%50 saf döl baskın · %50 melez döl</small></article>
          <article class="crossing-four-result-card crossing-four-phenotype-result"><h2>Fenotip Sonucu</h2><strong>%100 sarı tohumlu</strong><div class="crossing-four-seed-row"><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i><i class="pea-seed pea-seed-yellow" aria-hidden="true"></i></div><p>Bu çaprazlamada yeşil tohumlu yavru oluşmaz.</p></article>
        </section>
      `;
      let activePointerId = null;
      let pointerStart = null;
      let started = false;
      const timers = [];
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const setPhase = (phase) => { article.dataset.solutionPhase = String(phase); };
      const schedule = (delay, phase) => timers.push(setTimeout(() => setPhase(phase), delay));
      const startSolution = () => {
        if (started) return;
        started = true;
        article.classList.remove("is-awaiting-start");
        article.classList.add("is-solving");
        schedule(1000, 1);
        schedule(5500, 2);
        schedule(7800, 3);
        schedule(10100, 4);
        schedule(14100, 5);
        schedule(16400, 6);
      };
      article.addEventListener("pointerdown", (event) => {
        if (started || interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) startSolution();
      });
      article.addEventListener("pointercancel", () => { activePointerId = null; pointerStart = null; });
      this.activeInteractions.push({ destroy: () => timers.forEach((timer) => clearTimeout(timer)) });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_crossing_example_five") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-crossing-example-five-slide is-awaiting-start";
      article.dataset.solutionPhase = "0";
      article.setAttribute("aria-label", "İki yeşil tohumlu bezelyenin çaprazlaması");
      article.innerHTML = `
        <header class="crossing-five-heading"><h1>Örnek Soru-5</h1><p>Yeşil tohumlu bezelye ile yeşil tohumlu bezelyenin çaprazlamasını yapalım.</p></header>
        <aside class="crossing-five-ai-analysis" aria-live="polite" aria-label="Çözüm analizi"><strong>Çözüm analiz ediliyor</strong><span>Karakter: Tohum rengi</span><span>Baskın alel: S</span><span>Çekinik alel: s</span><span>1. bezelye: yeşil tohumlu → ss</span><span>2. bezelye: yeşil tohumlu → ss</span></aside>
        <section class="crossing-five-parents" aria-label="Çaprazlanacak ebeveynler"><article class="crossing-five-parent"><div><span>1. Bezelye</span><strong>Yeşil tohumlu</strong><b>ss</b></div><i class="pea-seed pea-seed-green pea-seed-large" aria-label="Yeşil tohum"></i></article><div class="crossing-five-expression" aria-label="ss çarpı ss">ss <i>×</i> ss</div><article class="crossing-five-parent"><i class="pea-seed pea-seed-green pea-seed-large" aria-label="Yeşil tohum"></i><div><span>2. Bezelye</span><strong>Yeşil tohumlu</strong><b>ss</b></div></article></section>
        <div class="crossing-five-start-hint" aria-hidden="true"><span>✦</span> Dokununca çözüm başlar</div>
        <section class="crossing-five-workspace"><article class="crossing-five-gametes"><h2>Gametler</h2><div class="crossing-five-gamete-row"><b>1. ebeveyn: ss</b><span>→</span><i class="gamete recessive">s</i><i class="gamete recessive">s</i></div><div class="crossing-five-gamete-row"><b>2. ebeveyn: ss</b><span>→</span><i class="gamete recessive">s</i><i class="gamete recessive">s</i></div><p>Her iki birey de saf döl çekinik olduğu için yalnızca s aleli taşıyan gametler oluşturur.</p></article><article class="crossing-five-punnett"><h2>Punnett karesi</h2><table aria-label="ss ve ss çaprazlama Punnett karesi"><thead><tr><th></th><th>s</th><th>s</th></tr></thead><tbody><tr><th>s</th><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td></tr><tr><th>s</th><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td><td><b>ss</b><i class="pea-seed pea-seed-green" aria-hidden="true"></i></td></tr></tbody></table></article></section>
        <section class="crossing-five-results" aria-label="Çaprazlama sonuçları"><article class="crossing-five-result-card crossing-five-genotype-result"><h2>Genotip Sonucu</h2><div><b>4 adet ss</b></div><p>Genotip oranı: <strong>%100 ss</strong></p><small>%100 saf döl çekinik</small></article><article class="crossing-five-result-card crossing-five-phenotype-result"><h2>Fenotip Sonucu</h2><strong>%100 yeşil tohumlu</strong><div class="crossing-five-seed-row"><i class="pea-seed pea-seed-green" aria-hidden="true"></i><i class="pea-seed pea-seed-green" aria-hidden="true"></i><i class="pea-seed pea-seed-green" aria-hidden="true"></i><i class="pea-seed pea-seed-green" aria-hidden="true"></i></div><p>Bu çaprazlamada yavruların tamamı yeşil tohumlu olur.</p></article></section>
      `;
      let activePointerId = null;
      let pointerStart = null;
      let started = false;
      const timers = [];
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const setPhase = (phase) => { article.dataset.solutionPhase = String(phase); };
      const schedule = (delay, phase) => timers.push(setTimeout(() => setPhase(phase), delay));
      const startSolution = () => {
        if (started) return;
        started = true;
        article.classList.remove("is-awaiting-start");
        article.classList.add("is-solving");
        schedule(1000, 1);
        schedule(5500, 2);
        schedule(7800, 3);
        schedule(10100, 4);
        schedule(14100, 5);
        schedule(16400, 6);
      };
      article.addEventListener("pointerdown", (event) => {
        if (started || interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        activePointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        article.setPointerCapture?.(event.pointerId);
      });
      article.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) return;
        article.releasePointerCapture?.(event.pointerId);
        const moved = !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12;
        activePointerId = null;
        pointerStart = null;
        if (!moved && !interactionBlocked()) startSolution();
      });
      article.addEventListener("pointercancel", () => { activePointerId = null; pointerStart = null; });
      this.activeInteractions.push({ destroy: () => timers.forEach((timer) => clearTimeout(timer)) });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "mendel_single_trait_experiment") {
      const article = document.createElement("article");
      article.className = "board-slide mendel-single-trait-slide";
      article.setAttribute("aria-label", "Mendel’in tek karakter çaprazlama deneyi");
      article.innerHTML = `
        <header class="mendel-heading"><h1>Mendel’in Tek Karakter Çaprazlama Deneyi</h1><p>Saf döl mor çiçekli ve saf döl beyaz çiçekli bezelyelerin çaprazlanması</p></header>
        <section class="mendel-diagram" aria-label="P kuşağından ikinci kuşağa çaprazlama şeması">
          <article class="mendel-diagram-stage mendel-diagram-parent"><div class="mendel-diagram-label">P KUŞAĞI</div><div class="mendel-diagram-parent-row"><div class="mendel-diagram-individual purple"><i class="mendel-flower purple" aria-hidden="true"></i><strong>Saf mor çiçekli</strong><b>MM</b></div><span class="mendel-diagram-cross">×</span><div class="mendel-diagram-individual white"><i class="mendel-flower white" aria-hidden="true"></i><strong>Saf beyaz çiçekli</strong><b>mm</b></div></div><p class="mendel-diagram-expression">MM × mm</p><div class="mendel-diagram-connector parent-to-first" aria-hidden="true"><i></i><i></i><b>↓</b></div></article>
          <article class="mendel-diagram-stage mendel-diagram-first"><div class="mendel-diagram-label">1. KUŞAK</div><div class="mendel-diagram-offspring-row" aria-label="Dört mor çiçekli Mm yavru"><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div></div><div class="mendel-diagram-first-summary"><span>Tüm yavrular melez döl (Mm)</span><span>Tüm yavrular mor çiçeklidir</span><b>%100 Mm · %100 melez · %100 mor çiçekli</b></div><div class="mendel-diagram-selected-pair"><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><span>×</span><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div></div><p class="mendel-diagram-expression mendel-second-cross">Mm × Mm</p><div class="mendel-diagram-connector first-to-second" aria-hidden="true"><i></i><i></i><b>↓</b></div></article>
          <article class="mendel-diagram-stage mendel-diagram-second"><div class="mendel-diagram-label">2. KUŞAK</div><div class="mendel-diagram-offspring-row" aria-label="İkinci kuşak yavrular"><div><i class="mendel-flower purple" aria-hidden="true"></i><b>MM</b></div><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><div><i class="mendel-flower purple" aria-hidden="true"></i><b>Mm</b></div><div><i class="mendel-flower white" aria-hidden="true"></i><b>mm</b></div></div><div class="mendel-diagram-ratios"><section><small>GENOTİP ORANI</small><b>1 MM : 2 Mm : 1 mm</b></section><section><small>FENOTİP ORANI</small><b>3 mor : 1 beyaz</b><span>%75 mor · %25 beyaz</span></section></div></article>
        </section>
      `;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "mendel_experiment_results") {
      const article = document.createElement("article");
      article.className = "board-slide mendel-results-slide";
      article.setAttribute("aria-label", "Mendel deneyinin sonuçları");
      article.innerHTML = `
        <header class="mendel-heading"><h1>Mendel Deneyinin Sonuçları</h1><p>Tek karakter çaprazlamasından çıkarılan temel sonuçlar</p></header>
        <section class="mendel-result-list" aria-label="Mendel deneyinin üç sonucu">
          <article class="mendel-result-card"><span>1</span><i class="mendel-flower purple" aria-hidden="true"></i><p><b>Kalıtsal özellikleri belirleyen aleller</b> nesilden nesile aktarılır.</p></article>
          <article class="mendel-result-card"><span>2</span><i class="mendel-flower purple" aria-hidden="true"></i><p>Saf döl farklı özellikte iki bezelye çaprazlandığında <b>1. kuşaktaki yavrular melez olur ve baskın özellik görülür.</b></p></article>
          <article class="mendel-result-card"><span>3</span><i class="mendel-flower white" aria-hidden="true"></i><p><b>Çekinik özellik</b> 1. kuşakta görünmese bile sonraki kuşakta yeniden ortaya çıkabilir.</p></article>
        </section>
        <aside class="mendel-dominance-callout"><i class="mendel-flower purple" aria-hidden="true"></i><strong>Mor çiçek aleli, beyaz çiçek aleline baskındır.</strong></aside>
        <footer class="mendel-generation-summary"><section><small>1. kuşak</small><b>%100 mor</b><div><i class="mendel-flower purple" aria-hidden="true"></i><i class="mendel-flower purple" aria-hidden="true"></i></div></section><span aria-hidden="true">→</span><section><small>2. kuşak</small><b>3 mor : 1 beyaz</b><div><i class="mendel-flower purple" aria-hidden="true"></i><i class="mendel-flower purple" aria-hidden="true"></i><i class="mendel-flower purple" aria-hidden="true"></i><i class="mendel-flower white" aria-hidden="true"></i></div></section></footer>
      `;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "sex_determination") {
      const article = document.createElement("article");
      article.className = "board-slide sex-determination-slide";
      article.setAttribute("aria-label", "İnsanda cinsiyetin X ve Y kromozomlarıyla belirlenmesi");
      article.innerHTML = `
        <header class="genetics-heading"><h1>Cinsiyetin Belirlenmesi</h1><p>İnsanda cinsiyet, X ve Y kromozomlarının birleşmesiyle belirlenir.</p></header>
        <section class="sex-determination-layout"><article class="sex-parent-card mother"><i class="sex-person female" aria-hidden="true"></i><small>ANNE</small><strong>XX</strong><span>Yalnızca <b>X</b> taşıyan yumurta hücreleri oluşturur.</span><div class="sex-gametes"><b>X</b><b>X</b></div></article><article class="sex-punnett-area"><div class="sex-cross-expression">XX <i>×</i> XY</div><div class="sex-gamete-labels"><span>Anne gametleri: <b>X, X</b></span><span>Baba gametleri: <b>X, Y</b></span></div><table aria-label="XX ve XY cinsiyet kromozomları Punnett karesi"><thead><tr><th></th><th>X</th><th>X</th></tr></thead><tbody><tr><th>X</th><td>XX</td><td>XX</td></tr><tr><th>Y</th><td>XY</td><td>XY</td></tr></tbody></table></article><article class="sex-parent-card father"><i class="sex-person male" aria-hidden="true"></i><small>BABA</small><strong>XY</strong><span><b>X</b> veya <b>Y</b> taşıyan sperm hücreleri oluşturabilir.</span><div class="sex-gametes"><b>X</b><b>Y</b></div></article></section>
        <section class="sex-results"><article><b class="sex-xx">%50 XX</b><span>Kız</span></article><article><b class="sex-xy">%50 XY</b><span>Erkek</span></article><p>Bebeğin cinsiyetini belirleyen kromozom babadan gelir.</p></section>
      `;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "consanguineous_marriage") {
      const article = document.createElement("article");
      article.className = "board-slide consanguineous-marriage-slide";
      article.setAttribute("aria-label", "Akraba evlilikleri ve çekinik kalıtsal hastalık riski");
      article.innerHTML = `
        <header class="genetics-heading"><h1>Akraba Evlilikleri ve Sakıncaları</h1><p>Risk, aynı çekinik hastalık alelinin iki ebeveynde de bulunma olasılığının artmasıyla ilişkilidir.</p></header>
        <section class="consanguineous-layout"><article class="consanguineous-explanation"><p>Aralarında kan bağı bulunan bireylerin evliliğine <b>akraba evliliği</b> denir.</p><div class="consanguineous-key"><i>1</i><span>Yakın akrabalar bazı çekinik hastalık alellerini ortak atalarından almış olabilir.</span></div><div class="consanguineous-key"><i>2</i><span>İki taşıyıcı bireyde aynı çekinik alelin buluşma olasılığı artabilir.</span></div><aside>Akraba evliliği doğrudan hastalık oluşturmaz; <b>çekinik hastalığın görülme olasılığı artabilir.</b></aside></article><article class="consanguineous-cross"><div class="carrier-pair"><span>Taşıyıcı</span><b>Aa</b><i>×</i><b>Aa</b><span>Taşıyıcı</span></div><table aria-label="Aa ve Aa çaprazlama Punnett karesi"><thead><tr><th></th><th>A</th><th>a</th></tr></thead><tbody><tr><th>A</th><td>AA</td><td>Aa</td></tr><tr><th>a</th><td>Aa</td><td class="recessive-outcome">aa</td></tr></tbody></table><div class="consanguineous-outcomes"><b>%25 AA</b><b>%50 Aa</b><b>%25 aa</b></div></article></section>
      `;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "pedigree_chart") {
      const article = document.createElement("article");
      article.className = "board-slide pedigree-chart-slide";
      article.setAttribute("aria-label", "Soyağacı sembolleri ve örnek şema");
      article.innerHTML = `
        <header class="genetics-heading"><h1>Soyağacı</h1><p>Kalıtsal özelliklerin aile bireyleri arasında aktarımını incelemek için kullanılır.</p></header>
        <section class="pedigree-layout"><aside class="pedigree-legend"><h2>Temel semboller</h2><div><i class="pedigree-symbol square"></i><span>Kare → Erkek</span></div><div><i class="pedigree-symbol circle"></i><span>Daire → Kadın</span></div><div><i class="pedigree-symbol square filled"></i><span>Boyalı → Özelliği gösteren birey</span></div><div><i class="pedigree-line horizontal"></i><span>Yatay çizgi → Eşler</span></div><div><i class="pedigree-line vertical"></i><span>Aşağı bağlantı → Çocuklar</span></div></aside><article class="pedigree-example"><h2>Örnek soyağacı</h2><div class="pedigree-tree" aria-label="Birinci kuşakta erkek ve kadın, ikinci kuşakta üç çocuk"><div class="pedigree-generation parents"><i class="pedigree-symbol square"></i><span class="pedigree-partner-line"></span><i class="pedigree-symbol circle"></i></div><span class="pedigree-descent-line"></span><span class="pedigree-sibling-line"></span><div class="pedigree-generation children"><i class="pedigree-symbol square filled"></i><i class="pedigree-symbol circle"></i><i class="pedigree-symbol square"></i></div></div><p><b>1. kuşak</b> → eşler &nbsp;&nbsp; <b>2. kuşak</b> → çocuklar</p></article></section>
      `;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "heredity_drag_drop_crossing") {
      const article = document.createElement("article");
      article.className = "board-slide heredity-drag-drop-crossing-slide";
      article.setAttribute("aria-label", "Uzun ve kısa gövdeli bezelyelerin sürükle bırak çaprazlama etkinliği");
      article.innerHTML = `
        <header class="heredity-dnd-heading"><h1>Örnek Etkileşimli</h1><p>Melez uzun gövdeli bir bezelye ile kısa gövdeli bezelyeyi çaprazlayalım.<br>Fenotip ve genotip oranlarını yazınız.</p></header>
        <section class="heredity-dnd-workspace">
          <article class="heredity-dnd-parents"><h2>1. Ana-baba genotipleri</h2><div class="heredity-dnd-parent-grid"><section><i class="heredity-stem tall" aria-hidden="true"></i><strong>Melez uzun gövdeli bezelye</strong><div class="heredity-dnd-slot" data-slot="parent-long" data-answer="Uu" aria-label="Melez uzun gövdeli genotip bırakma alanı"></div></section><section><i class="heredity-stem short" aria-hidden="true"></i><strong>Kısa gövdeli bezelye</strong><div class="heredity-dnd-slot" data-slot="parent-short" data-answer="uu" aria-label="Kısa gövdeli genotip bırakma alanı"></div></section></div></article>
          <article class="heredity-dnd-gametes"><h2>2. Gametler</h2><div class="heredity-dnd-gamete-grid"><section><strong>1. ebeveyn</strong><div><span class="heredity-dnd-slot small" data-slot="gamete-1a" data-answer="U"></span><span class="heredity-dnd-slot small" data-slot="gamete-1b" data-answer="u"></span></div></section><section><strong>2. ebeveyn</strong><div><span class="heredity-dnd-slot small" data-slot="gamete-2a" data-answer="u"></span><span class="heredity-dnd-slot small" data-slot="gamete-2b" data-answer="u"></span></div></section></div></article>
          <article class="heredity-dnd-punnett"><h2>3. Punnett karesi</h2><table aria-label="Uu ve uu çaprazlama tablosu"><thead><tr><th></th><th>U</th><th>u</th></tr></thead><tbody><tr><th>u</th><td><span class="heredity-dnd-slot cell" data-slot="punnett-1" data-answer="Uu"></span></td><td><span class="heredity-dnd-slot cell" data-slot="punnett-2" data-answer="uu"></span></td></tr><tr><th>u</th><td><span class="heredity-dnd-slot cell" data-slot="punnett-3" data-answer="Uu"></span></td><td><span class="heredity-dnd-slot cell" data-slot="punnett-4" data-answer="uu"></span></td></tr></tbody></table></article>
          <article class="heredity-dnd-ratios"><section><h2>4. Genotip oranı</h2><p><span class="heredity-dnd-slot ratio" data-slot="genotype-1" data-answer="2 Uu"></span><b>:</b><span class="heredity-dnd-slot ratio" data-slot="genotype-2" data-answer="2 uu"></span></p><small class="heredity-dnd-simplified">Sadeleştirilmiş oran: <b>1 Uu : 1 uu</b><br>%50 Uu · %50 uu</small></section><section><h2>5. Fenotip oranı</h2><p><span class="heredity-dnd-slot ratio" data-slot="phenotype-1" data-answer="2 Uzun"></span><b>:</b><span class="heredity-dnd-slot ratio" data-slot="phenotype-2" data-answer="2 Kısa"></span></p><small class="heredity-dnd-simplified">Sadeleştirilmiş oran: <b>1 Uzun : 1 Kısa</b><br>%50 Uzun · %50 Kısa</small></section></article>
        </section>
        <footer class="heredity-dnd-footer"><section class="heredity-dnd-palette" aria-label="Sürüklenebilir cevap kartları"><div><small>Genotip kartları</small><button type="button" data-answer="Uu">Uu</button><button type="button" data-answer="uu">uu</button><button type="button" data-answer="UU">UU</button></div><div><small>Gamet kartları</small><button type="button" data-answer="U">U</button><button type="button" data-answer="u">u</button></div><div><small>Sonuç kartları</small><button type="button" data-answer="2 Uu">2 Uu</button><button type="button" data-answer="2 uu">2 uu</button><button type="button" data-answer="2 Uzun">2 Uzun</button><button type="button" data-answer="2 Kısa">2 Kısa</button><button type="button" data-answer="3 Uzun">3 Uzun</button><button type="button" data-answer="1 Kısa">1 Kısa</button></div></section><section class="heredity-dnd-actions"><output aria-live="polite"></output><button type="button" data-action="hint">İpucu</button><button type="button" data-action="check">Kontrol Et</button><button type="button" data-action="reset">Sıfırla</button></section></footer>
      `;
      const answers = new Map();
      const slots = [...article.querySelectorAll(".heredity-dnd-slot")];
      const sources = [...article.querySelectorAll(".heredity-dnd-palette button[data-answer]")];
      const output = article.querySelector("output");
      let drag = null;
      const interactionBlocked = () => this.state.get().presentation?.panActive || this.state.get().ui?.annotationEnabled;
      const renderSlot = (slot) => {
        const answer = answers.get(slot.dataset.slot);
        slot.replaceChildren();
        slot.classList.remove("is-correct", "is-wrong", "is-missing");
        if (answer) { const card = document.createElement("span"); card.textContent = answer; slot.appendChild(card); slot.classList.add("is-filled"); }
        else slot.classList.remove("is-filled");
      };
      const renderAll = () => slots.forEach(renderSlot);
      const slotAt = (clientX, clientY) => slots.find((slot) => {
        const rect = slot.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      });
      const finishDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const target = slotAt(event.clientX, event.clientY);
        if (target) { answers.set(target.dataset.slot, drag.answer); renderSlot(target); article.classList.remove("is-verified"); output.textContent = ""; }
        drag.clone.remove();
        drag.source.releasePointerCapture?.(event.pointerId);
        drag = null;
      };
      const cancelDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag.clone.remove();
        drag.source.releasePointerCapture?.(event.pointerId);
        drag = null;
      };
      sources.forEach((source) => source.addEventListener("pointerdown", (event) => {
        if (interactionBlocked() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
        event.preventDefault();
        const clone = source.cloneNode(true);
        clone.className = "heredity-dnd-drag-clone";
        clone.removeAttribute("aria-label");
        clone.style.width = `${source.getBoundingClientRect().width}px`;
        document.body.appendChild(clone);
        drag = { source, answer: source.dataset.answer, pointerId: event.pointerId, clone };
        clone.style.left = `${event.clientX}px`;
        clone.style.top = `${event.clientY}px`;
        source.setPointerCapture?.(event.pointerId);
      }));
      article.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        event.preventDefault();
        drag.clone.style.left = `${event.clientX}px`;
        drag.clone.style.top = `${event.clientY}px`;
      });
      article.addEventListener("pointerup", finishDrag);
      article.addEventListener("pointercancel", cancelDrag);
      article.querySelector('[data-action="check"]').addEventListener("click", () => {
        let correct = 0;
        slots.forEach((slot) => {
          const answer = answers.get(slot.dataset.slot);
          slot.classList.remove("is-correct", "is-wrong", "is-missing");
          if (!answer) slot.classList.add("is-missing");
          else if (answer === slot.dataset.answer) { slot.classList.add("is-correct"); correct += 1; }
          else slot.classList.add("is-wrong");
        });
        const completed = correct === slots.length;
        output.textContent = completed ? "Tebrikler! Çaprazlamayı doğru tamamladın." : "Bazı alanları tekrar gözden geçir.";
        output.classList.toggle("is-success", completed);
        article.classList.toggle("is-verified", completed);
      });
      article.querySelector('[data-action="reset"]').addEventListener("click", () => { answers.clear(); renderAll(); article.classList.remove("is-verified"); output.textContent = ""; output.classList.remove("is-success"); });
      article.querySelector('[data-action="hint"]').addEventListener("click", () => { article.classList.remove("is-verified"); output.textContent = "İpucu: Melez uzun gövdeli = Uu, kısa gövdeli = uu"; output.classList.remove("is-success"); });
      this.activeInteractions.push({ destroy: () => { if (drag?.clone) drag.clone.remove(); drag = null; } });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "resultant_force_examples_image") {
      const article = document.createElement("article");
      article.className = "board-slide resultant-force-examples-image-slide";
      const frame = document.createElement("div");
      frame.className = "resultant-force-examples-image-frame";
      const image = document.createElement("img");
      image.className = "resultant-force-examples-image";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Bileşke Kuvvet örnekleri";
      frame.appendChild(image);
      const compass = document.createElement("div");
      compass.className = "resultant-force-direction-hint";
      compass.setAttribute("aria-label", "Yönler: Kuzey, Güney, Doğu, Batı");
      compass.innerHTML = '<span class="compass-north">Kuzey</span><span class="compass-east">Doğu</span><span class="compass-south">Güney</span><span class="compass-west">Batı</span><i aria-hidden="true">✦</i>';
      frame.appendChild(compass);
      const answers = [
        ["30 N", "Doğu"], ["15 N", "Doğu"], ["0 N", "Yok"], ["30 N", "Kuzey"],
        ["0 N", "Yok"], ["30 N", "Doğu"], ["20 N", "Kuzey"], ["14 N", "Batı"]
      ];
      const columns = [1.55, 26.15, 50.3, 75.15];
      const rows = [47.4, 90.0];
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const index = row * 4 + column;
          const resultButton = document.createElement("button");
          resultButton.type = "button";
          resultButton.className = "resultant-force-answer-hotspot resultant-force-answer-value";
          resultButton.style.left = `${columns[column]}%`;
          resultButton.style.top = `${rows[row]}%`;
          resultButton.innerHTML = `<span>${answers[index][0]}</span>`;
          resultButton.setAttribute("aria-label", `Örnek ${index + 1} bileşke kuvvet cevabını göster`);
          const directionButton = document.createElement("button");
          directionButton.type = "button";
          directionButton.className = "resultant-force-answer-hotspot resultant-force-answer-direction";
          directionButton.style.left = `${columns[column] + 12.55}%`;
          directionButton.style.top = `${rows[row]}%`;
          directionButton.innerHTML = `<span>${answers[index][1]}</span>`;
          directionButton.setAttribute("aria-label", `Örnek ${index + 1} yön cevabını göster`);
          [resultButton, directionButton].forEach((button) => button.addEventListener("click", () => button.classList.toggle("is-revealed")));
          frame.append(resultButton, directionButton);
        }
      }
      article.appendChild(frame);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "unbalanced_forces_image_fullscreen") {
      const article = document.createElement("article");
      article.className = "board-slide unbalanced-forces-image-fullscreen-slide";
      const image = document.createElement("img");
      image.className = "unbalanced-forces-image-fullscreen";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Dengelenmemiş Kuvvetler görseli";
      article.appendChild(image);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "balanced_forces_image_fullscreen") {
      const article = document.createElement("article");
      article.className = "board-slide balanced-forces-image-fullscreen-slide";
      const image = document.createElement("img");
      image.className = "balanced-forces-image-fullscreen";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Dengelenmiş Kuvvetler görseli";
      article.appendChild(image);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "resultant_force_image_fullscreen") {
      const article = document.createElement("article");
      article.className = "board-slide resultant-force-image-fullscreen-slide";
      const image = document.createElement("img");
      image.className = "resultant-force-image-fullscreen";
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "Bileşke Kuvvet görseli";
      article.appendChild(image);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "resultant_force_definition_examples") {
      const article = document.createElement("article");
      article.className = "board-slide resultant-force-definition-slide";
      article.innerHTML = `
        <header class="resultant-force-definition-heading"><span>BİLEŞKE KUVVET</span><h1>Bileşke Kuvvet</h1></header>
        <div class="resultant-force-definition-grid">
          <section class="resultant-force-definition-card" aria-labelledby="resultant-force-definition-title">
            <span class="resultant-force-card-kicker">TANIM</span>
            <h2 id="resultant-force-definition-title">Bir cisme etki eden <strong>birden fazla kuvvetin</strong> yaptığı etkiyi <strong>tek kuvvet</strong> olarak yapan kuvvete <strong>bileşke kuvvet</strong> denir.</h2>
            <p class="resultant-force-definition-emphasis">Bileşke kuvvet <strong>R</strong> harfi ile gösterilir.</p>
          </section>
          <section class="resultant-force-example-card same-direction-example" aria-labelledby="same-direction-title">
            <div class="resultant-force-example-heading"><span>AYNI YÖNLÜ KUVVETLER</span><h2 id="same-direction-title">Kuvvetler toplanır</h2></div>
            <div class="resultant-force-diagram">
              <div class="resultant-force-vector east"><span>3 N</span></div><div class="resultant-force-example-box">KUTU</div><div class="resultant-force-vector east large"><span>5 N</span></div>
            </div>
            <div class="resultant-force-equation"><strong>R = 8 N</strong><span class="equation-arrow east"></span></div>
            <p>Aynı yöndeki kuvvetler toplanır.</p>
          </section>
          <section class="resultant-force-example-card opposite-direction-example" aria-labelledby="opposite-direction-title">
            <div class="resultant-force-example-heading"><span>ZIT YÖNLÜ KUVVETLER</span><h2 id="opposite-direction-title">Kuvvetler çıkarılır</h2></div>
            <div class="resultant-force-diagram opposite">
              <div class="resultant-force-vector west small"><span>3 N</span></div><div class="resultant-force-example-box">KUTU</div><div class="resultant-force-vector east large"><span>5 N</span></div>
            </div>
            <div class="resultant-force-equation"><strong>R = 2 N</strong><span class="equation-arrow east"></span></div>
            <p>Zıt yöndeki kuvvetler çıkarılır.<br />Bileşke kuvvet büyük kuvvetin yönündedir.</p>
          </section>
        </div>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "resultant_force_activity") {
      const article = document.createElement("article");
      article.className = "board-slide resultant-force-activity-slide force-lab";
      article.innerHTML = `
        <div class="resultant-force-axis-picker" role="group" aria-label="Kuvvet doğrultusu">
          <button type="button" data-axis="horizontal" class="is-selected">Doğu–Batı</button>
          <button type="button" data-axis="vertical">Kuzey–Güney</button>
        </div>
        <div class="resultant-force-stage force-stage" aria-label="Bileşke kuvvet sahnes">
          <div class="resultant-force-drop-zone drop-zone west" data-drop-direction="west">Batı</div>
          <div class="resultant-force-drop-zone drop-zone east" data-drop-direction="east">Doğu</div>
          <div class="resultant-force-drop-zone drop-zone north" data-drop-direction="north">Kuzey</div>
          <div class="resultant-force-drop-zone drop-zone south" data-drop-direction="south">Güney</div>
          <div class="resultant-force-arrow-layer placed-forces" aria-live="polite"></div>
          <div class="resultant-force-box force-box" aria-label="Hareket eden kutu"><span aria-hidden="true">📦</span></div>
        </div>
        <div class="resultant-force-panel">
          <div class="resultant-force-palette" role="group" aria-label="Kuvvet büyüklüğü">
            <span class="resultant-force-panel-label">Sürükle</span>
            ${[3, 4, 5, 8].map((magnitude) => `<button type="button" class="resultant-force-palette-arrow force-source" data-force="${magnitude}" data-magnitude="${magnitude}" aria-label="${magnitude} Newton oku"><span>${magnitude} N</span></button>`).join("")}
          </div>
          <div class="resultant-force-actions"><button type="button" data-action="apply">Tamam</button><button type="button" data-action="reset">Sıfırla</button></div>
          <output class="resultant-force-result" aria-live="polite"></output>
        </div>`;
      view.slideContent.replaceChildren(article);

      const state = { selectedAxis: "horizontal", placedForces: [], offsetX: 0, offsetY: 0 };
      const axisButtons = [...article.querySelectorAll("[data-axis]")];
      const paletteArrows = [...article.querySelectorAll(".force-source")];
      const dropZones = [...article.querySelectorAll("[data-drop-direction]")];
      const stage = article.querySelector(".resultant-force-stage");
      const box = article.querySelector(".resultant-force-box");
      const arrowLayer = article.querySelector(".resultant-force-arrow-layer");
      const result = article.querySelector(".resultant-force-result");
      const directionByAxis = { horizontal: ["east", "west"], vertical: ["north", "south"] };
      const signByDirection = { east: 1, west: -1, north: 1, south: -1 };

      const renderArrows = () => {
        arrowLayer.replaceChildren();
        state.placedForces.forEach((force, index) => {
          const arrow = document.createElement("div");
          arrow.className = `resultant-force-arrow placed ${force.direction}`;
          arrow.style.setProperty("--arrow-size", `${Math.max(64, force.magnitude * 20)}px`);
          arrow.style.setProperty("--stack-offset", `${index * 28}px`);
          arrow.dataset.forceId = force.id;
          arrow.innerHTML = `<span>${force.magnitude} N</span>`;
          arrowLayer.appendChild(arrow);
        });
      };
      const resetBox = () => { state.offsetX = 0; state.offsetY = 0; box.style.transform = "translate(-50%, -50%)"; };
      const clearForces = (clearResult = true) => { state.placedForces = []; renderArrows(); resetBox(); if (clearResult) result.textContent = ""; };
      const setAxis = (axis) => {
        state.selectedAxis = axis;
        axisButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.axis === axis));
        dropZones.forEach((zone) => zone.classList.toggle("is-active", directionByAxis[axis].includes(zone.dataset.dropDirection)));
        clearForces();
      };
      const calculate = () => state.placedForces.reduce((sum, force) => sum + signByDirection[force.direction] * force.magnitude, 0);
      const applyResult = () => {
        const net = calculate();
        const magnitude = Math.abs(net);
        if (!net) { result.textContent = "Bileşke Kuvvet: 0 N — Dengelenmiş kuvvetler"; return; }
        const direction = state.selectedAxis === "horizontal" ? (net > 0 ? "Doğu" : "Batı") : (net > 0 ? "Kuzey" : "Güney");
        const distance = magnitude * 20;
        const maxX = Math.max(0, (stage.clientWidth - box.offsetWidth) / 2 - 12);
        const maxY = Math.max(0, (stage.clientHeight - box.offsetHeight) / 2 - 12);
        if (state.selectedAxis === "horizontal") state.offsetX = Math.max(-maxX, Math.min(maxX, net > 0 ? distance : -distance));
        else state.offsetY = Math.max(-maxY, Math.min(maxY, net > 0 ? -distance : distance));
        box.style.transform = `translate(calc(-50% + ${state.offsetX}px), calc(-50% + ${state.offsetY}px))`;
        result.textContent = `Bileşke Kuvvet: ${magnitude} N ${direction}`;
      };

      axisButtons.forEach((button) => button.addEventListener("click", () => setAxis(button.dataset.axis)));
      const addForce = (magnitude, direction) => {
        if (!Number.isFinite(magnitude)) return;
        if (!directionByAxis[state.selectedAxis].includes(direction)) return;
        state.placedForces.push({
          id: `force-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          magnitude,
          direction,
          axis: state.selectedAxis
        });
        renderArrows();
      };
      paletteArrows.forEach((source) => {
        source.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          const clone = source.cloneNode(true);
          clone.className = `${source.className} force-drag-clone`;
          clone.removeAttribute("aria-label");
          clone.style.width = `${source.getBoundingClientRect().width}px`;
          clone.style.height = `${source.getBoundingClientRect().height}px`;
          document.body.appendChild(clone);
          const moveClone = (moveEvent) => {
            moveEvent.preventDefault();
            clone.style.left = `${moveEvent.clientX}px`;
            clone.style.top = `${moveEvent.clientY}px`;
          };
          const findDropZoneAt = (clientX, clientY) => dropZones.find((zone) => {
            if (!zone.classList.contains("is-active")) return false;
            const rect = zone.getBoundingClientRect();
            return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
          });
          const finishDrag = (endEvent) => {
            endEvent.preventDefault();
            const target = findDropZoneAt(endEvent.clientX, endEvent.clientY);
            if (target) addForce(Number(source.dataset.force), target.dataset.dropDirection);
            clone.remove();
            source.releasePointerCapture?.(event.pointerId);
            source.removeEventListener("pointermove", moveClone);
            source.removeEventListener("pointerup", finishDrag);
            source.removeEventListener("pointercancel", cancelDrag);
          };
          const cancelDrag = (cancelEvent) => {
            cancelEvent.preventDefault();
            clone.remove();
            source.releasePointerCapture?.(event.pointerId);
            source.removeEventListener("pointermove", moveClone);
            source.removeEventListener("pointerup", finishDrag);
            source.removeEventListener("pointercancel", cancelDrag);
          };
          source.setPointerCapture(event.pointerId);
          clone.style.left = `${event.clientX}px`;
          clone.style.top = `${event.clientY}px`;
          source.addEventListener("pointermove", moveClone);
          source.addEventListener("pointerup", finishDrag, { once: true });
          source.addEventListener("pointercancel", cancelDrag, { once: true });
        });
      });
      dropZones.forEach((zone) => {
        zone.addEventListener("dragover", (event) => { if (directionByAxis[state.selectedAxis].includes(zone.dataset.dropDirection)) { event.preventDefault(); zone.classList.add("is-over"); } });
        zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
        zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("is-over"); addForce(Number(event.dataTransfer?.getData("text/plain")), zone.dataset.dropDirection); });
      });
      article.querySelector('[data-action="apply"]').addEventListener("click", applyResult);
      article.querySelector('[data-action="reset"]').addEventListener("click", () => clearForces());
      setAxis("horizontal");
      return true;
    }
    if (slide.layout === "force_video_fullscreen") {
      const article = document.createElement("article");
      article.className = "board-slide force-video-fullscreen-slide";
      const video = document.createElement("video");
      video.className = "force-video-fullscreen";
      video.src = slide.media?.[0]?.src ?? "";
      video.preload = "metadata";
      video.playsInline = true;
      video.controls = false;
      video.setAttribute("aria-label", slide.media?.[0]?.alt ?? "Bileşke Kuvvet videosu");
      video.addEventListener("click", () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      });
      article.appendChild(video);
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout?.startsWith("solar_") || slide.layout?.startsWith("eclipse_")) {
      return renderSolarSlide(slide, view, {
        interactions: this.interactions,
        activeInteractions: this.activeInteractions
      });
    }
    if (slide.layout?.startsWith("space_")) {
      return renderSpaceSlide(slide, view, {
        interactions: this.interactions,
        activeInteractions: this.activeInteractions
      });
    }
    if (slide.layout?.startsWith("climate_")) {
      return renderClimateSlide(slide, view, {
        interactions: this.interactions,
        activeInteractions: this.activeInteractions
      });
    }
    if (slide.layout === "dna_question_notes") {
      const article = document.createElement("article");
      article.className = "board-slide dna-question-notes-slide";
      article.innerHTML = `<h1>Sorularda Dikkat Edilecek Hususlar</h1><section class="dna-question-notes-card"><ul><li>Eşlenme sırasında DNA çift zinciri açıldığında eski zincirler <strong>kalıp zincir</strong> olarak bilinir.</li><li>Sitoplazmadan gelen yeni zincirler <strong>tamamlayıcı zincir</strong> olarak adlandırılır.</li><li>Yeni oluşan DNA’larda bir tane <strong>eski zincir</strong>, bir tane <strong>yeni zincir</strong> bulunur.</li></ul></section><section class="dna-question-notes-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA eşlenmesi" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_notes") {
      const article = document.createElement("article");
      article.className = "board-slide dna-notes-slide";
      article.innerHTML = `<h1>Notlar</h1><section class="dna-notes-card"><p>DNA kendini eşlerken sitoplazmadaki nükleotit, organik baz, şeker ve fosfat sayısı <button data-dna-notes-answer>azalır</button>.</p><p>DNA kendini eşlerken çekirdekteki nükleotit, organik baz, şeker ve fosfat sayısı <button data-dna-notes-answer>artar</button>.</p></section><section class="dna-notes-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA eşlenmesi grafiği 1" /><img src="${escapeHtml(slide.secondaryVisualAsset ?? "")}" alt="DNA eşlenmesi grafiği 2" /></section>`;
      article.querySelectorAll("[data-dna-notes-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_errors") {
      const article = document.createElement("article");
      article.className = "board-slide dna-errors-slide";
      article.innerHTML = `<h1>DNA Hataları</h1><section class="dna-errors-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA hataları" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_replication_two") {
      const article = document.createElement("article");
      article.className = "board-slide dna-replication-two-slide";
      article.innerHTML = `<h1>DNA Eşlenme Aşamaları</h1><section class="dna-replication-two-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA eşlenme aşamaları" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_replication_steps") {
      const article = document.createElement("article");
      article.className = "board-slide dna-replication-steps-slide";
      article.innerHTML = `<h1>Eşlenme Basamakları</h1><section class="dna-replication-steps-list"><article><b>1</b><p>DNA çift zincirlidir ve bu zincirler birbirine <button data-dna-replication-step-answer>Hidrojen</button> bağları ile bağlıdır.</p></article><article><b>2</b><p>İki zincir arasındaki hidrojen bağları kopmaya başlar.</p></article><article><b>3</b><p>DNA’nın iki zinciri <button data-dna-replication-step-answer>fermuar</button> gibi açılır ve zincirler birbirinden ayrılır.</p></article><article><b>4</b><p>Sitoplazmada üretilen serbest <button data-dna-replication-step-answer>nükleotitler</button> çekirdek içine girer.</p></article><article><b>5</b><p>Ayrılan zincirlerin karşısına sitoplazmadan gelen <button data-dna-replication-step-answer>serbest</button> nükleotitler uygun olanlarla eşleşir.</p></article><article><b>6</b><p>Zincirler arası bağlar <button data-dna-replication-step-answer>yeniden</button> oluşur.</p></article><article><b>7</b><p>Eşlenme tamamlanınca başlangıçtaki DNA’nın tıpatıp aynısı iki DNA molekülü oluşur.</p></article></section>`;
      article.querySelectorAll("[data-dna-replication-step-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_replication") {
      const article = document.createElement("article");
      article.className = "board-slide dna-replication-slide";
      article.innerHTML = `<h1>DNA Eşlenmesi</h1><section class="dna-replication-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA eşlenmesi" /></section><section class="dna-replication-reading"><p>DNA molekülü hücre bölünmesinden önce kendini eşleyerek miktarını <button data-dna-replication-answer>2</button> katına çıkartır.</p><p>DNA’nın kendini eşlemesinin nedeni, hücrenin sahip olduğu kalıtsal bilgilerin bölünme sonucu oluşacak hücrelere aktarılmasıdır.</p></section>`;
      article.querySelector("[data-dna-replication-answer]").addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed"));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_important_notes") {
      const article = document.createElement("article");
      article.className = "board-slide dna-important-notes-slide";
      article.innerHTML = `<h1>Önemli Notlar</h1><section class="dna-important-notes-list"><article><span class="dna-important-note-number">1</span><p>DNA’nın tek zincirinde Adenin nükleotit sayısı Timin nükleotit sayısına, Guanin nükleotit sayısı ise Sitozin nükleotit sayısına eşit olmak zorunda değildir.</p><p>Ancak DNA’nın çift zincirinin tamamı düşünüldüğünde: <strong>Adenin = Timin</strong> &nbsp; <strong>Guanin = Sitozin</strong> olmak zorundadır.</p></article><article><span class="dna-important-note-number">2</span><p>Tüm canlılarda <button data-dna-important-answer>4</button> çeşit nükleotit vardır. Bu, canlılar için ortak bir özelliktir.</p></article><article><span class="dna-important-note-number">3</span><p>Canlıların birbirine benzememesinin nedeni nükleotitlerin sayı ve dizilişlerinin <button data-dna-important-answer>farklı</button> olmasıdır.</p></article><article><span class="dna-important-note-number">4</span><p>Yalnızca tek yumurta ikizlerinin DNA dizilimleri birbirinin aynısıdır.</p></article></section><section class="dna-important-warning" aria-label="Önemli uyarı"><svg viewBox="0 0 300 270" role="img" aria-label="Önemli"><path d="M150 12 288 250H12Z"></path><text x="150" y="205" text-anchor="middle">!</text></svg></section>`;
      article.querySelectorAll("[data-dna-important-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_activity_two") {
      const article = document.createElement("article");
      article.className = "board-slide dna-activity-two-slide";
      const given = ["A", "T", "T", "G", "C", "C", "G", "T"];
      article.innerHTML = `<h1>Etkinlik-2</h1><p class="dna-activity-two-prompt">Verilen DNA zincirinin karşısına gelecek nükleotitleri tamamlayınız.</p><section class="dna-activity-two-panel"><div class="dna-activity-two-column"><h2>1. zincir</h2>${given.map((letter) => `<span class="dna-activity-two-letter">${letter}</span>`).join("")}</div><div class="dna-activity-two-column dna-activity-two-answer-column"><h2>2. zincir</h2>${given.map((_, index) => `<button type="button" data-dna-target="${index}" aria-label="Karşı zincir ${index + 1}. nükleotit"></button>`).join("")}</div><aside class="dna-activity-two-control-column"><div class="dna-activity-two-sources" aria-label="Nükleotit seçenekleri"><p>Nükleotit seç</p>${["A", "T", "G", "C"].map((letter) => `<button type="button" data-dna-source="${letter}">${letter}</button>`).join("")}</div><div class="dna-activity-two-actions"><button type="button" data-dna-check>Kontrol Et</button><button type="button" data-dna-reset>Sıfırla</button><strong data-dna-feedback aria-live="polite"></strong></div></aside></section>`;
      const answer = ["T", "A", "A", "C", "G", "G", "C", "A"];
      let selected = "";
      const sources = article.querySelectorAll("[data-dna-source]");
      const targets = article.querySelectorAll("[data-dna-target]");
      sources.forEach((source) => source.addEventListener("click", () => {
        selected = source.dataset.dnaSource;
        sources.forEach((item) => item.classList.toggle("is-selected", item === source));
      }));
      targets.forEach((target) => target.addEventListener("click", () => {
        if (!selected) return;
        target.textContent = selected;
        target.dataset.value = selected;
        target.classList.remove("is-correct", "is-wrong");
      }));
      article.querySelector("[data-dna-check]").addEventListener("click", () => {
        let complete = true;
        targets.forEach((target, index) => {
          const value = target.dataset.value ?? "";
          target.classList.toggle("is-correct", value === answer[index]);
          target.classList.toggle("is-wrong", Boolean(value) && value !== answer[index]);
          if (!value) complete = false;
        });
        article.querySelector("[data-dna-feedback]").textContent = complete && [...targets].every((target, index) => target.dataset.value === answer[index]) ? "Doğru!" : "Cevaplarını kontrol et.";
      });
      article.querySelector("[data-dna-reset]").addEventListener("click", () => {
        targets.forEach((target) => { target.textContent = ""; delete target.dataset.value; target.classList.remove("is-correct", "is-wrong"); });
        article.querySelector("[data-dna-feedback]").textContent = "";
      });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_activity_one") {
      const article = document.createElement("article");
      article.className = "board-slide dna-activity-one-slide";
      article.innerHTML = `<h1>Etkinlik-1</h1><section class="dna-activity-one-card"><p class="dna-activity-one-lead">3 numara Adenin bazı ise;</p><p>a. 1-2-3: <button data-dna-activity-answer>Adenin Nükleotit</button></p><p>b. 7-8-9: <button data-dna-activity-answer>Timin Nükleotit</button></p><p class="dna-activity-one-lead">10 numara Sitozin bazı ise;</p><p>c. 6 numara: <button data-dna-activity-answer>Guanin Bazı</button></p><p>d. 10-11-12: <button data-dna-activity-answer>Sitozin Nükleotit</button></p></section><section class="dna-activity-one-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Nükleotit etkinliği" /></section>`;
      article.querySelectorAll("[data-dna-activity-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_nucleotide_counts") {
      const article = document.createElement("article");
      article.className = "board-slide dna-counts-slide";
      article.innerHTML = `<h1>Nükleotit Sayıları</h1><section class="dna-counts-number-card"><h2>Görsele Göre Sayıları Bul</h2>${[["Adenin",3],["Timin",3],["Guanin",2],["Sitozin",2],["Fosfat",10],["Şeker",10],["Organik baz",10],["Nükleotit",10]].map(([label, answer]) => `<p><span>${label} sayısı:</span><button data-dna-count-answer>${answer}</button></p>`).join("")}</section><section class="dna-counts-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Nükleotit sayıları" /></section><section class="dna-counts-inferences"><h2>Çıkarımlar</h2><p>DNA molekülünde Adenin sayısı <button data-dna-count-answer>Timin</button> sayısına eşittir.</p><p>Sitozin sayısı <button data-dna-count-answer>Guanin</button> sayısına eşittir.</p><p>Fosfat sayısı, şeker sayısı ve organik baz sayısı toplam <button data-dna-count-answer>Nükleotit</button> sayısına eşittir.</p></section>`;
      article.querySelectorAll("[data-dna-count-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_hydrogen_bonds") {
      const article = document.createElement("article");
      article.className = "board-slide dna-hydrogen-slide";
      article.innerHTML = `<h1>Hidrojen Bağları</h1><section class="dna-hydrogen-card"><p>DNA zincirleri birbirine özel bağlarla bağlanır.</p><p>Bu bağlara zayıf <button data-dna-hydrogen-answer>Hidrojen</button> bağları denir.</p><p>Adenin ile Timin nükleotitleri arasında ikili hidrojen bağı, Guanin ile Sitozin arasında ise üçlü hidrojen bağı bulunur.</p></section><section class="dna-hydrogen-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Hidrojen bağları" /></section>`;
      article.querySelector("[data-dna-hydrogen-answer]").addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed"));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_structure") {
      const article = document.createElement("article");
      article.className = "board-slide dna-structure-slide";
      article.innerHTML = `<h1>DNA’nın Yapısı</h1><section class="dna-structure-card"><p>DNA molekülündeki nükleotitler karşılıklı zincirlere belirli bir kurala göre dizilir.</p><p>Adenin nükleotitinin karşısına <button data-dna-structure-answer>Timin</button> nükleotiti, Guanin nükleotitinin karşısına ise <button data-dna-structure-answer>Sitozin</button> nükleotiti gelir.</p><p>Bu nedenle DNA’nın bir zincirindeki nükleotit sırası biliniyorsa, diğer zincirin nükleotit sırası da bulunabilir.</p></section><section class="dna-structure-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA’nın yapısı" /></section>`;
      article.querySelectorAll("[data-dna-structure-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_recap_two") {
      const article = document.createElement("article");
      article.className = "board-slide dna-recap-two-slide";
      article.innerHTML = `<h1>Aklımızda Kalsın-2</h1><section class="dna-recap-two-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_recap") {
      const article = document.createElement("article");
      article.className = "board-slide dna-recap-slide";
      article.innerHTML = `<h1>Akılda Kalsın</h1><section class="dna-recap-info"><ul><li><strong>Gelişmiş hücre</strong> yapısına sahip canlılarda (insan, hayvan, bitki, amip vb.) DNA <strong>çekirdek</strong> içerisinde bulunur.</li><li><strong>İlkel hücre</strong> yapısına sahip canlılarda (bakteri vb.) DNA <strong>sitoplazma</strong> içerisine dağılmıştır.</li></ul></section><section class="dna-recap-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Gelişmiş hücrede DNA" /><img src="${escapeHtml(slide.secondaryVisualAsset ?? "")}" alt="Bakteride DNA" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_definition") {
      const article = document.createElement("article");
      article.className = "board-slide dna-definition-slide";
      article.innerHTML = `<h1>DNA (Deoksiribo Nükleik Asit)</h1><section class="dna-definition-card"><p>Hücrenin <button data-dna-definition-answer>yönetici</button> molekülüdür.</p><p>Hücre içerisinde gerçekleşen solunum, sindirim, boşaltım gibi yaşamsal faaliyetleri kontrol eder.</p><p>Çift <button data-dna-definition-answer>zincirli</button> ve sarmal şeklindedir.</p></section><section class="dna-definition-visual"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="DNA" /></section>`;
      article.querySelectorAll("[data-dna-definition-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_nucleotide_names") {
      const article = document.createElement("article");
      article.className = "board-slide dna-name-slide";
      article.innerHTML = `<h1>Nükleotitlerin İsimlendirilmesi</h1><section class="dna-name-cards"><article><p>Nükleotitlerin isimlendirilmesi organik baza göre yapılır.</p></article><article><p>Bir nükleotitte fosfat ve şeker sabittir.</p><p>Değişen yapı azotlu organik bazdır.</p></article><article class="is-note"><span>NOT</span><p>Organik baz, nükleotitlere ismini verir.</p><p>Şeker ise DNA'ya ismini verir.</p></article></section><section class="dna-name-visual dna-name-image-stack"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Adenin ve timin" /><img src="${escapeHtml(slide.secondaryVisualAsset ?? "")}" alt="Guanin ve sitozin" /><img src="${escapeHtml(slide.tertiaryVisualAsset ?? "")}" alt="Nükleotitlerin isimlendirilmesi" /></section>`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_nucleotide") {
      const article = document.createElement("article");
      article.className = "board-slide dna-nucleotide-slide";
      article.innerHTML = `<h1>Nükleotit</h1><section class="dna-nucleotide-info"><ul><li>DNA'nın temel yapı birimlerine nükleotit denir.</li><li>Bir nükleotidin yapısında <button data-nucleotide-answer>fosfat</button>, şeker ve <button data-nucleotide-answer>organik baz</button> bulunur.</li><li>Organik bazlar dört çeşittir:<ul><li>Adenin</li><li>Timin</li><li>Guanin</li><li>Sitozin</li></ul></li></ul></section><section class="dna-nucleotide-visual dna-nucleotide-image-stack" aria-label="Nükleotit ve organik bazlar görselleri"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="Nükleotit yapısı" /><img src="${escapeHtml(slide.secondaryVisualAsset ?? "")}" alt="Organik bazlar" /></section>`;
      article.querySelectorAll("[data-nucleotide-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_gene") {
      const article = document.createElement("article");
      article.className = "board-slide dna-gene-slide";
      article.innerHTML = `<h1>Gen Nedir?</h1><section class="dna-gene-reading"><ul><li><strong>Anlamlı DNA parçalarına</strong> <button data-answer="gen" aria-label="Cevabı göster">gen</button> denir.</li><li><strong>Genler, DNA'nın</strong> <button data-answer="görev" aria-label="Cevabı göster">görev</button> birimleridir.</li><li>Genler; saç rengi, kan grubu ve cinsiyet gibi özelliklerin oluşmasında görev alır.</li><li>Genler <button data-answer="nükleotitlerden" aria-label="Cevabı göster">nükleotitlerden</button> oluşur.</li></ul></section><section class="dna-gene-visual" aria-label="DNA üzerinde gen bölgesi"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="" onerror="this.hidden=true" /></section>`;
      article.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed")));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_chromosome_count") {
      const article = document.createElement("article");
      article.className = "board-slide dna-count-slide";
      article.innerHTML = `<h1>Kromozom Sayısı</h1><section class="dna-count-table">${slide.organisms.map(([name, count]) => `<div class="dna-count-row"><strong>${escapeHtml(name)}</strong><b>${escapeHtml(count)}</b></div>`).join("")}</section><section class="dna-count-quiz"><p>İnsanda 46 kromozom bulunur. Üreme hücrelerinde ise <button data-answer="23">____</button> kromozom bulunur.</p><p>Kromozom sayısı canlı gelişmişliği hakkında bilgi vermez.</p><p>Farklı canlıların kromozom sayısı <button data-answer="aynı">____</button> ya da <button data-answer="farklı">____</button> olabilir.</p><p>Kromozom sayısı aynı olan canlılar arasında akrabalık ilişkisi <button data-answer="yoktur">____</button>.</p><div class="dna-count-options">${slide.answers.map((answer) => `<button type="button" data-choice="${escapeHtml(answer)}">${escapeHtml(answer)}</button>`).join("")}</div><div class="dna-count-actions"><button type="button" data-check>Kontrol Et</button><button type="button" data-reset>Sıfırla</button><strong data-feedback aria-live="polite"></strong></div></section>`;
      let selected = null;
      const blanks = [...article.querySelectorAll(".dna-count-quiz p button")];
      const choices = [...article.querySelectorAll("[data-choice]")];
      choices.forEach((choice) => choice.addEventListener("click", () => { selected = choice.dataset.choice; choices.forEach((item) => item.classList.toggle("is-selected", item === choice)); const emptyBlank = blanks.find((blank) => !blank.dataset.value); if (emptyBlank) { emptyBlank.textContent = selected; emptyBlank.dataset.value = selected; emptyBlank.classList.add("is-filled"); selected = null; choices.forEach((item) => item.classList.remove("is-selected")); } }));
      blanks.forEach((blank) => blank.addEventListener("click", () => { if (!selected) return; blank.textContent = selected; blank.dataset.value = selected; blank.classList.add("is-filled"); selected = null; choices.forEach((item) => item.classList.remove("is-selected")); }));
      article.querySelector("[data-check]").addEventListener("click", () => { let correct = 0; blanks.forEach((blank) => { const ok = blank.dataset.value === blank.dataset.answer; blank.classList.toggle("is-correct", ok); blank.classList.toggle("is-wrong", !ok); if (ok) correct += 1; }); article.querySelector("[data-feedback]").textContent = `${correct}/${blanks.length} doğru`; });
      article.querySelector("[data-reset]").addEventListener("click", () => { blanks.forEach((blank) => { blank.textContent = "____"; blank.className = ""; blank.dataset.value = ""; }); article.querySelector("[data-feedback]").textContent = ""; selected = null; choices.forEach((item) => item.classList.remove("is-selected")); });
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_chromosome") {
      const article = document.createElement("article");
      article.className = "board-slide dna-chromosome-slide";
      article.innerHTML = `<h1>Kromozom Nedir?</h1><section class="dna-chromosome-reading"><p>DNA oldukça uzun bir moleküldür. Hücre bölünmeye hazırlanırken bu uzun molekül, özel proteinlerin etrafında düzenli biçimde sarılır ve katlanarak daha kısa, kalın ve yoğun bir yapı hâline gelir. Böylece genetik materyal hücre bölünmesi sırasında daha düzenli taşınabilir.</p></section><section class="dna-chromosome-relation" aria-label="DNA ve protein kılıfın kromozom oluşturması"><div class="dna-relation-card"><span class="dna-relation-dna-art" aria-hidden="true"></span><strong>DNA</strong></div><b class="dna-relation-symbol">+</b><div class="dna-relation-card"><span class="dna-relation-protein-art" aria-hidden="true"></span><strong>Protein Kılıf</strong></div><b class="dna-relation-symbol">=</b><div class="dna-relation-card dna-relation-result"><span class="dna-relation-chromosome-art" aria-hidden="true"></span><strong>Kromozom</strong></div></section><section class="dna-chromosome-note"><p>DNA’nın proteinlerle birlikte düzenlenmiş ve paketlenmiş yapısına <button type="button" aria-label="Boşluğu doldur" data-dna-answer>Kromozom</button> denir.</p></section>`;
      article.querySelector("[data-dna-answer]").addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed"));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_heredity") {
      const article = document.createElement("article");
      article.className = "board-slide dna-heredity-slide";
      article.innerHTML = `<h1>Kalıtsal Bilgi Nerede Bulunur?</h1><section class="dna-heredity-note"><p>Canlıların kalıtsal özelliklerini belirleyen bilgiler, gelişmiş hücrelerde büyük ölçüde çekirdekte bulunur. Çekirdekteki kromozomların yapısında, iki zincirin birbirine dolanmasıyla oluşmuş uzun ve sarmal bir molekül yer alır. Bu molekül, canlıya ait kalıtsal bilgilerin taşınmasını ve nesilden nesile aktarılmasını sağlar.</p></section><section class="dna-heredity-visual dna-heredity-visual-empty" aria-label="Kromozom içinden açılan sarmal molekül görsel alanı"><img src="${escapeHtml(slide.visualAsset ?? "")}" alt="" onerror="this.hidden=true" /></section><section class="dna-lgs-card dna-lgs-summary"><p>Kromozomların yapısında yer alan çift zincirli sarmal molekül olan <button type="button" aria-label="Boşluğu doldur" data-dna-answer>DNA</button>, kalıtsal bilginin temel taşıyıcısıdır.</p></section>`;
      article.querySelector("[data-dna-answer]").addEventListener("click", (event) => event.currentTarget.classList.add("is-revealed"));
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "dna_cover") {
      const article = document.createElement("article");
      article.className = "board-slide dna-png-cover-slide";
      article.innerHTML = `<img src="${escapeHtml(slide.media?.[0]?.src ?? "")}" alt="" />`;
      view.slideContent.replaceChildren(article);
      return true;
    }
    if (slide.layout === "force_recall") {
      const article = document.createElement("article");
      article.className = "board-slide force-recall-slide";
      const image = document.createElement("img");
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "";
      article.appendChild(image);
      const interactionMap = new Map((slide.interactions ?? []).map((item) => [item.id, item]));
      const buttons = [];
      for (const overlay of slide.overlays ?? []) {
        const definition = interactionMap.get(overlay.interactionId);
        if (!definition) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `force-recall-answer force-recall-${overlay.tone ?? "blue"}`;
        button.style.left = `${overlay.x}px`;
        button.style.top = `${overlay.y}px`;
        button.style.width = `${overlay.w}px`;
        button.style.height = `${overlay.h}px`;
        button.setAttribute("aria-label", "Cevabı göster");
        button.setAttribute("aria-expanded", "false");
        button.textContent = definition.answer ?? "";
        button.addEventListener("click", () => {
          button.classList.add("is-revealed");
          button.setAttribute("aria-expanded", "true");
        });
        article.appendChild(button);
        buttons.push(button);
      }
      view.slideContent.replaceChildren(article);
      this.activeInteractions.push({ reset: () => buttons.forEach((button) => button.classList.remove("is-revealed")), destroy: () => {} });
      return true;
    }
    if (slide.layout === "force_direction") {
      const article = document.createElement("article");
      article.className = "board-slide force-direction-slide";
      const image = document.createElement("img");
      image.src = slide.media?.[0]?.src ?? "";
      image.alt = slide.media?.[0]?.alt ?? "";
      article.appendChild(image);
      const interactionMap = new Map((slide.interactions ?? []).map((item) => [item.id, item]));
      const buttons = [];
      for (const overlay of slide.overlays ?? []) {
        const definition = interactionMap.get(overlay.interactionId);
        if (!definition) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "force-direction-answer";
        button.style.left = `${overlay.x}px`;
        button.style.top = `${overlay.y}px`;
        button.style.width = `${overlay.w}px`;
        button.style.height = `${overlay.h}px`;
        button.setAttribute("aria-label", "Cevabı göster");
        button.setAttribute("aria-expanded", "false");
        button.textContent = definition.answer ?? "";
        button.addEventListener("click", () => {
          button.classList.add("is-revealed");
          button.setAttribute("aria-expanded", "true");
        });
        article.appendChild(button);
        buttons.push(button);
      }
      view.slideContent.replaceChildren(article);
      this.activeInteractions.push({ reset: () => buttons.forEach((button) => button.classList.remove("is-revealed")), destroy: () => {} });
      return true;
    }
    switch (slide.layout) {
      case "canva_merak_et":
      case "question_interaction": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-merak-et";

        const mainStage = document.createElement("div");
        mainStage.className = "slide-main-stage canva-merak-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "slide-question-col";

        const questionH1 = document.createElement("h1");
        questionH1.className = "slide-hero-question canva-serif-question";
        questionH1.innerHTML = `<em><strong>Türkiye’de</strong> kışın kar yağarken, aynı anda <strong>Avustralya’da</strong> yaz mevsiminin yaşanmasının sebebi nedir?</em>`;
        leftCol.appendChild(questionH1);
        mainStage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "slide-visual-col";
        const photoFrame = document.createElement("div");
        photoFrame.className = "canva-photo-frame";
        photoFrame.innerHTML = `<img src="./assets/images/mevsimlerin-olusumu/02-turkiye-avustralya.png" alt="Türkiye ve Avustralya zıt mevsim karşılaştırması" class="canva-responsive-img" />`;
        rightCol.appendChild(photoFrame);
        mainStage.appendChild(rightCol);

        slideArticle.appendChild(mainStage);

        if (Array.isArray(slide.interactions) && slide.interactions.length) {
          const bottomArea = document.createElement("div");
          bottomArea.className = "slide-bottom-interaction canva-peach-card";
          for (const interaction of slide.interactions) {
            const slot = document.createElement("div");
            slot.className = "interaction-slot";
            const instance = this.interactions.mount(interaction, slot);
            if (instance) this.activeInteractions.push(instance);
            bottomArea.appendChild(slot);
          }
          slideArticle.appendChild(bottomArea);
        }

        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_iki_hareket": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-iki-hareket";

        const grid = document.createElement("div");
        grid.className = "canva-dual-row-grid";

        const topRow = document.createElement("div");
        topRow.className = "canva-grid-row";

        const topLeft = document.createElement("div");
        topLeft.className = "canva-cell-text";
        topLeft.innerHTML = `
          <div class="canva-speech-bubble">
            <p>Dünya’nın <strong>Günlük Hareket</strong> ve <strong>Yıllık Hareket</strong> şeklinde iki temel hareketi vardır.</p>
          </div>
        `;
        topRow.appendChild(topLeft);

        const topRight = document.createElement("div");
        topRight.className = "canva-cell-visual";
        topRight.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/03-gunluk-rotasyon.png" alt="Dünya'nın dönme hareketi" class="canva-responsive-img contain-img" />
          </div>
        `;
        topRow.appendChild(topRight);
        grid.appendChild(topRow);

        const bottomRow = document.createElement("div");
        bottomRow.className = "canva-grid-row";

        const bottomLeft = document.createElement("div");
        bottomLeft.className = "canva-cell-text";
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot canva-plain-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          bottomLeft.appendChild(slot);
        }
        bottomRow.appendChild(bottomLeft);

        const bottomRight = document.createElement("div");
        bottomRight.className = "canva-cell-visual";
        bottomRight.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/03-yillik-dolanim.png" alt="Dünya'nın Güneş etrafında dolanması" class="canva-responsive-img contain-img" />
          </div>
        `;
        bottomRow.appendChild(bottomRight);
        grid.appendChild(bottomRow);

        slideArticle.appendChild(grid);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_geoit_mesafe": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-geoit-mesafe";

        const grid = document.createElement("div");
        grid.className = "canva-dual-row-grid";

        const topRow = document.createElement("div");
        topRow.className = "canva-grid-row";

        const topLeft = document.createElement("div");
        topLeft.className = "canva-cell-text";
        topLeft.innerHTML = `
          <div class="canva-hero-statement">
            <h2>Dünya’nın Güneş’e olan yakınlığı veya uzaklığı mevsimleri oluşturmaz.</h2>
          </div>
        `;
        topRow.appendChild(topLeft);

        const topRight = document.createElement("div");
        topRight.className = "canva-cell-visual";
        topRight.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/04-uzay-mesafe.png" alt="Dünya ve Güneş arasındaki mesafe" class="canva-responsive-img rounded-img" />
          </div>
        `;
        topRow.appendChild(topRight);
        grid.appendChild(topRow);

        const bottomRow = document.createElement("div");
        bottomRow.className = "canva-grid-row";

        const bottomLeft = document.createElement("div");
        bottomLeft.className = "canva-cell-text";
        const bubble = document.createElement("div");
        bubble.className = "canva-speech-bubble";
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          bubble.appendChild(slot);
        }
        bottomLeft.appendChild(bubble);
        bottomRow.appendChild(bottomLeft);

        const bottomRight = document.createElement("div");
        bottomRight.className = "canva-cell-visual";
        bottomRight.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/04-geoit-kutuplar.png" alt="Geoit şekli: Kutuplardan basık, ekvatordan şişkin" class="canva-responsive-img contain-img" />
          </div>
        `;
        bottomRow.appendChild(bottomRight);
        grid.appendChild(bottomRow);

        slideArticle.appendChild(grid);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_gunluk_hareket": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-gunluk-hareket";

        const mainStage = document.createElement("div");
        mainStage.className = "slide-main-stage canva-gunluk-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "slide-question-col canva-list-col";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "1. Dünya’nın Günlük Hareketi";
        leftCol.appendChild(h1);

        const ul = document.createElement("ul");
        ul.className = "canva-bullet-list";

        const li1 = document.createElement("li");
        li1.textContent = "Dünya kendi ekseni etrafında batıdan doğuya doğru döner.";
        ul.appendChild(li1);

        const li2 = document.createElement("li");
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          li2.appendChild(slot);
        }
        ul.appendChild(li2);

        const li3 = document.createElement("li");
        if (slide.interactions?.[1]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[1], slot);
          if (instance) this.activeInteractions.push(instance);
          li3.appendChild(slot);
        }
        ul.appendChild(li3);

        const li4 = document.createElement("li");
        li4.textContent = "Günlük sıcaklık farkları meydana gelir.";
        ul.appendChild(li4);

        const li5 = document.createElement("li");
        li5.textContent = "Güneş ışınlarının geliş açısı gün içinde değişir.";
        ul.appendChild(li5);

        leftCol.appendChild(ul);
        mainStage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "slide-visual-col canva-globe-col";
        rightCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/05-gunluk-hareket-gece-gunduz.png" alt="Dünya'nın dönme hareketi, gece ve gündüz oluşumu" class="canva-responsive-img contain-img" />
          </div>
        `;
        mainStage.appendChild(rightCol);

        slideArticle.appendChild(mainStage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_golge_boyu": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-golge-boyu";

        const topArea = document.createElement("div");
        topArea.className = "canva-golge-top-statement";
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot canva-center-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          topArea.appendChild(slot);
        }
        slideArticle.appendChild(topArea);

        const visualArea = document.createElement("div");
        visualArea.className = "canva-golge-visual-stage";
        visualArea.innerHTML = `
          <div class="canva-img-container canva-shadow-container">
            <img src="./assets/images/mevsimlerin-olusumu/06-golge-boyu-karsilastirma.png" alt="Sabah, öğle ve akşam gölge boyu karşılaştırması" class="canva-responsive-img" />
          </div>
        `;
        slideArticle.appendChild(visualArea);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_yillik_hareket": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-yillik-hareket";

        const mainStage = document.createElement("div");
        mainStage.className = "slide-main-stage canva-yillik-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "slide-question-col canva-list-col";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "2. Dünya’nın Yıllık Hareketi";
        leftCol.appendChild(h1);

        const ul = document.createElement("ul");
        ul.className = "canva-bullet-list";

        const li1 = document.createElement("li");
        li1.textContent = "Dünya'nın Güneş etrafında dolanmasıdır.";
        ul.appendChild(li1);

        const li2 = document.createElement("li");
        li2.textContent = "Saat yönünün tersine yani batıdan doğuya doğru dolanır.";
        ul.appendChild(li2);

        const li3 = document.createElement("li");
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          li3.appendChild(slot);
        }
        ul.appendChild(li3);

        const li4 = document.createElement("li");
        li4.innerHTML = `Bu hareketin sonucunda <strong>mevsimler</strong> oluşur.`;
        ul.appendChild(li4);

        leftCol.appendChild(ul);
        mainStage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "slide-visual-col canva-orbit-col";
        rightCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/07-yillik-hareket-yorunge.png" alt="Dünya'nın dolanma yörüngesi" class="canva-responsive-img contain-img" />
          </div>
        `;
        mainStage.appendChild(rightCol);

        slideArticle.appendChild(mainStage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_eksen_egikligi": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-eksen-egikligi";

        const mainStage = document.createElement("div");
        mainStage.className = "canva-eksen-main-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "canva-eksen-left-col";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Eksen Eğikliği";
        leftCol.appendChild(h1);

        const ul = document.createElement("ul");
        ul.className = "canva-bullet-list";

        const li1 = document.createElement("li");
        li1.innerHTML = `Dünya'nın ekvator düzlemi ile Güneş etrafında yörünge (dolanma) düzlemine göre <strong>23° 27'</strong> eğiktir.`;
        ul.appendChild(li1);

        const li2 = document.createElement("li");
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          li2.appendChild(slot);
        }
        ul.appendChild(li2);
        leftCol.appendChild(ul);

        mainStage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "canva-eksen-right-col";
        rightCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/08-eksen-egikligi-diyagram.png" alt="Eksen Eğikliği Diyagramı" class="canva-responsive-img contain-img" />
          </div>
        `;
        mainStage.appendChild(rightCol);

        slideArticle.appendChild(mainStage);

        const bottomRow = document.createElement("div");
        bottomRow.className = "canva-eksen-bottom-cards";
        bottomRow.innerHTML = `
          <div class="canva-speech-bubble canva-half-bubble">
            <p>Dünya’nın Güneş çevresinde dolanırken izlediği yörüngenin oluşturduğu hayalî düzleme <strong>dolanma düzlemi</strong> denir.</p>
          </div>
          <div class="canva-speech-bubble canva-half-bubble">
            <p>Kuzey ve Güney kutup noktalarını birleştiren hayali çizgiye <strong>eksen</strong> denir.</p>
          </div>
        `;
        slideArticle.appendChild(bottomRow);

        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_eksen_sonuclari": {
        const slideArticle = document.createElement("article");
        const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
        slideArticle.className = `board-slide slide-canva-eksen-sonuclari ${slideIdClass}`.trim();
        if (slide.id) slideArticle.dataset.slideId = slide.id;

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Eksen Eğikliği Sonuçları";
        slideArticle.appendChild(h1);

        const grid = document.createElement("div");
        grid.className = "canva-sonuclar-grid";

        grid.innerHTML = `
          <div class="canva-sonuc-card canva-card-1">
            <div class="canva-sonuc-img-box">
              <img src="./assets/images/mevsimlerin-olusumu/09-sonuc-mevsimler.png" alt="Mevsimler" class="canva-responsive-img" />
            </div>
            <div class="canva-sonuc-pill">Mevsimler oluşur.</div>
          </div>
          <div class="canva-sonuc-card canva-card-2">
            <div class="canva-sonuc-img-box">
              <img src="./assets/images/mevsimlerin-olusumu/09-sonuc-farkli-mevsim.png" alt="Farklı mevsimler" class="canva-responsive-img" />
            </div>
            <div class="canva-sonuc-pill">Aynı anda farklı yarım kürelerde farklı mevsimler yaşanır.</div>
          </div>
          <div class="canva-sonuc-card canva-card-3">
            <div class="canva-sonuc-img-box">
              <img src="./assets/images/mevsimlerin-olusumu/09-sonuc-sicaklik.png" alt="Sıcaklık farkları" class="canva-responsive-img" />
            </div>
            <div class="canva-sonuc-pill">Yıllık sıcaklık farkları oluşur.</div>
          </div>
          <div class="canva-sonuc-card canva-card-4">
            <div class="canva-sonuc-img-box">
              <img src="./assets/images/mevsimlerin-olusumu/09-sonuc-golge-boyu.png" alt="Gölge boyu" class="canva-responsive-img rounded-img" />
            </div>
            <div class="canva-sonuc-pill">Bir noktadaki gölge boyu yıl boyunca sürekli değişir.</div>
          </div>
          <div class="canva-sonuc-card canva-card-5">
            <div class="canva-sonuc-img-box">
              <img src="./assets/images/mevsimlerin-olusumu/09-sonuc-gece-gunduz.png" alt="Gece ve gündüz" class="canva-responsive-img rounded-img" />
            </div>
            <div class="canva-sonuc-pill">Gece ve gündüz süreleri yıl boyunca değişir.</div>
          </div>
        `;

        slideArticle.appendChild(grid);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_tarihler_tablosu": {
        const slideArticle = document.createElement("article");
        const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
        slideArticle.className = `board-slide slide-canva-tarihler-tablosu ${slideIdClass}`.trim();
        if (slide.id) slideArticle.dataset.slideId = slide.id;

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Mevsim Tarihleri";
        slideArticle.appendChild(h1);

        const tableWrapper = document.createElement("div");
        tableWrapper.className = "canva-table-wrapper";

        tableWrapper.innerHTML = `
          <table class="canva-interactive-table">
            <colgroup>
              <col class="col-date" style="width: 17%;">
              <col class="col-kyk" style="width: 29%;">
              <col class="col-gyk" style="width: 26%;">
              <col class="col-dik" style="width: 28%;">
            </colgroup>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kuzey Yarım Küre</th>
                <th>Güney Yarım Küre</th>
                <th>Dik Geldiği Bölge</th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-date-row" tabindex="0" role="button" aria-label="21 Aralık satırını vurgula">
                <td class="cell-date"><strong>21 Aralık</strong></td>
                <td class="cell-kyk"><span class="table-slot" data-interaction-id="interaction_tablo_aralik_kyk"></span><br><span class="table-subtext">En uzun gece yaşanır.</span></td>
                <td class="cell-gyk">Yaz mevsimi başlar.<br><span class="table-subtext">En uzun gündüz yaşanır.</span></td>
                <td class="cell-dik"><span class="table-slot" data-interaction-id="interaction_tablo_aralik_dik"></span></td>
              </tr>
              <tr class="table-date-row" tabindex="0" role="button" aria-label="21 Mart satırını vurgula">
                <td class="cell-date"><strong>21 Mart</strong></td>
                <td class="cell-kyk">İlkbahar mevsimi başlar.<br><span class="table-slot" data-interaction-id="interaction_tablo_mart_sure"></span></td>
                <td class="cell-gyk">Sonbahar mevsimi başlar.<br><span class="table-subtext">Gece ve gündüz süresi eşittir.</span></td>
                <td class="cell-dik"><span class="table-slot" data-interaction-id="interaction_tablo_mart_dik"></span></td>
              </tr>
              <tr class="table-date-row" tabindex="0" role="button" aria-label="21 Haziran satırını vurgula">
                <td class="cell-date"><strong>21 Haziran</strong></td>
                <td class="cell-kyk"><span class="table-slot" data-interaction-id="interaction_tablo_haziran_kyk"></span><br><span class="table-subtext">En uzun gündüz yaşanır.</span></td>
                <td class="cell-gyk">Kış mevsimi başlar.<br><span class="table-subtext">En uzun gece yaşanır.</span></td>
                <td class="cell-dik"><span class="table-slot" data-interaction-id="interaction_tablo_haziran_dik"></span></td>
              </tr>
              <tr class="table-date-row" tabindex="0" role="button" aria-label="23 Eylül satırını vurgula">
                <td class="cell-date"><strong>23 Eylül</strong></td>
                <td class="cell-kyk">Sonbahar mevsimi başlar.<br><span class="table-slot" data-interaction-id="interaction_tablo_eylul_sure"></span></td>
                <td class="cell-gyk">İlkbahar mevsimi başlar.<br><span class="table-subtext">Gece ve gündüz süresi eşittir.</span></td>
                <td class="cell-dik"><span class="table-slot" data-interaction-id="interaction_tablo_eylul_dik"></span></td>
              </tr>
            </tbody>
          </table>
        `;

        // Mount all reveal_fill interactions into the table slots
        const interactionMap = new Map((slide.interactions ?? []).map((i) => [i.id, i]));
        const slots = tableWrapper.querySelectorAll(".table-slot[data-interaction-id]");
        slots.forEach((slot) => {
          const interactionId = slot.dataset.interactionId;
          const def = interactionMap.get(interactionId);
          if (def) {
            const instance = this.interactions.mount(def, slot);
            if (instance) this.activeInteractions.push(instance);
          }
        });

        const rows = tableWrapper.querySelectorAll(".table-date-row");
        rows.forEach((row) => {
          row.addEventListener("click", (e) => {
            if (e.target.closest(".reveal-fill-blank")) return;
            const wasActive = row.classList.contains("is-row-active");
            rows.forEach((r) => r.classList.remove("is-row-active"));
            if (!wasActive) row.classList.add("is-row-active");
          });
        });

        this.activeInteractions.push({
          reset: () => {
            rows.forEach((r) => r.classList.remove("is-row-active"));
          },
          destroy: () => {}
        });

        slideArticle.appendChild(tableWrapper);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_donenceler_ekvator": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-donenceler-ekvator";

        const wrapper = document.createElement("div");
        wrapper.className = "canva-donenceler-stage";
        wrapper.innerHTML = `
          <div class="canva-img-container canva-donenceler-img-box">
            <img src="./assets/images/mevsimlerin-olusumu/11-donenceler-ve-ekvator-diyagram.png" alt="Yengeç Dönencesi, Ekvator, Oğlak Dönencesi ve Güneş Işınları" class="canva-responsive-img" />
          </div>
        `;
        slideArticle.appendChild(wrapper);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_dort_kritik_tarih": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-dort-kritik-tarih";

        const wrapper = document.createElement("div");
        wrapper.className = "canva-dort-tarih-stage";
        wrapper.innerHTML = `
          <div class="canva-img-container canva-dort-tarih-img-box">
            <img src="./assets/images/mevsimlerin-olusumu/12-dort-kritik-tarih-yorunge.png" alt="21 Mart, 21 Haziran, 23 Eylül, 21 Aralık Kritik Yörünge Konumları" class="canva-responsive-img rounded-img" />
          </div>
        `;
        slideArticle.appendChild(wrapper);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_ekinoks_konumu": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-ekinoks-konumu";

        const wrapper = document.createElement("div");
        wrapper.className = "canva-ekinoks-stage";
        wrapper.innerHTML = `
          <div class="canva-img-container canva-ekinoks-img-box">
            <img src="./assets/images/mevsimlerin-olusumu/13-ekinoks-diyagram.png" alt="21 Mart ve 23 Eylül Ekinoks Konumu" class="canva-responsive-img" />
          </div>
          <p class="canva-pink-caption">Dünya’nın 21 Mart ve 23 Eylül tarihlerindeki konumu</p>
        `;
        slideArticle.appendChild(wrapper);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_tarih_tahmin_1": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-tarih-tahmin slide-tahmin-1";

        const stage = document.createElement("div");
        stage.className = "canva-tahmin-stage layout-text-left";

        const textCol = document.createElement("div");
        textCol.className = "canva-tahmin-text-col";
        textCol.innerHTML = `<h1 class="canva-black-heading">Tarihi Tahmin Edelim</h1>`;

        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot canva-tahmin-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          textCol.appendChild(slot);
        }
        stage.appendChild(textCol);

        const visualCol = document.createElement("div");
        visualCol.className = "canva-tahmin-visual-col";
        visualCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/14-tahmin-haziran-diyagram.png" alt="21 Haziran Güneş Işınları Konumu" class="canva-responsive-img" />
          </div>
        `;
        stage.appendChild(visualCol);

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_tarih_tahmin_2": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-tarih-tahmin slide-tahmin-2";

        const stage = document.createElement("div");
        stage.className = "canva-tahmin-stage layout-text-right";

        const visualCol = document.createElement("div");
        visualCol.className = "canva-tahmin-visual-col";
        visualCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/15-tahmin-aralik-diyagram.png" alt="21 Aralık Güneş Işınları Konumu" class="canva-responsive-img" />
          </div>
        `;
        stage.appendChild(visualCol);

        const textCol = document.createElement("div");
        textCol.className = "canva-tahmin-text-col";
        textCol.innerHTML = `<h1 class="canva-black-heading">Tarihi Tahmin Edelim</h1>`;

        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot canva-tahmin-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          textCol.appendChild(slot);
        }
        stage.appendChild(textCol);

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_dik_isinlar": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-isin-acisi";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading canva-isin-heading";
        h1.textContent = "Güneş'ten gelen eşit miktardaki ısı enerjisi bir yarım kürede dik ve dike yakın açı ile gelirse;";
        slideArticle.appendChild(h1);

        const stage = document.createElement("div");
        stage.className = "canva-isin-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "canva-isin-list-col";

        const ul = document.createElement("ul");
        ul.className = "canva-bullet-list";

        const li1 = document.createElement("li");
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          li1.appendChild(slot);
        }
        ul.appendChild(li1);

        const li2 = document.createElement("li");
        li2.textContent = "Birim yüzeye düşen enerji miktarı fazladır.";
        ul.appendChild(li2);

        const li3 = document.createElement("li");
        li3.textContent = "Birim yüzeyde oluşan sıcaklık miktarı fazladır.";
        ul.appendChild(li3);

        const li4 = document.createElement("li");
        if (slide.interactions?.[1]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[1], slot);
          if (instance) this.activeInteractions.push(instance);
          li4.appendChild(slot);
        }
        ul.appendChild(li4);

        const li5 = document.createElement("li");
        if (slide.interactions?.[2]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[2], slot);
          if (instance) this.activeInteractions.push(instance);
          li5.appendChild(slot);
        }
        ul.appendChild(li5);

        leftCol.appendChild(ul);
        stage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "canva-isin-visual-col";
        rightCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/16-dik-isinlar-diyagram.png" alt="Dik ve dike yakın gelen güneş ışınları" class="canva-responsive-img contain-img" />
          </div>
        `;
        stage.appendChild(rightCol);

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_egik_isinlar": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide board-slide-interactive slide-canva-isin-acisi";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading canva-isin-heading";
        h1.textContent = "Güneş'ten gelen eşit miktardaki ısı enerjisi bir yarım kürede eğik açı ile gelirse;";
        slideArticle.appendChild(h1);

        const stage = document.createElement("div");
        stage.className = "canva-isin-stage";

        const leftCol = document.createElement("div");
        leftCol.className = "canva-isin-list-col";

        const ul = document.createElement("ul");
        ul.className = "canva-bullet-list";

        const li1 = document.createElement("li");
        if (slide.interactions?.[0]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[0], slot);
          if (instance) this.activeInteractions.push(instance);
          li1.appendChild(slot);
        }
        ul.appendChild(li1);

        const li2 = document.createElement("li");
        li2.textContent = "Birim yüzeye düşen enerji miktarı azdır.";
        ul.appendChild(li2);

        const li3 = document.createElement("li");
        li3.textContent = "Birim yüzeyde oluşan sıcaklık miktarı düşüktür.";
        ul.appendChild(li3);

        const li4 = document.createElement("li");
        if (slide.interactions?.[1]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[1], slot);
          if (instance) this.activeInteractions.push(instance);
          li4.appendChild(slot);
        }
        ul.appendChild(li4);

        const li5 = document.createElement("li");
        if (slide.interactions?.[2]) {
          const slot = document.createElement("div");
          slot.className = "interaction-slot inline-slot";
          const instance = this.interactions.mount(slide.interactions[2], slot);
          if (instance) this.activeInteractions.push(instance);
          li5.appendChild(slot);
        }
        ul.appendChild(li5);

        leftCol.appendChild(ul);
        stage.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.className = "canva-isin-visual-col";
        rightCol.innerHTML = `
          <div class="canva-img-container">
            <img src="./assets/images/mevsimlerin-olusumu/17-egik-isinlar-diyagram.png" alt="Eğik açıyla gelen güneş ışınları" class="canva-responsive-img contain-img" />
          </div>
        `;
        stage.appendChild(rightCol);

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_guney_gunduz": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-chart";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Güney Yarım Kürede Gündüz Süresi Değişimi";
        slideArticle.appendChild(h1);

        const chartStage = document.createElement("div");
        chartStage.className = "canva-chart-stage";
        chartStage.innerHTML = this.#createGunduzSuresiSvg("guney");
        slideArticle.appendChild(chartStage);

        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_kuzey_gunduz": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-chart";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Kuzey Yarım Kürede Gündüz Süresi Değişimi";
        slideArticle.appendChild(h1);

        const chartStage = document.createElement("div");
        chartStage.className = "canva-chart-stage";
        chartStage.innerHTML = this.#createGunduzSuresiSvg("kuzey");
        slideArticle.appendChild(chartStage);

        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_ekvator_gunduz": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-chart";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Ekvator Üzerinde Gündüz Süresi Değişimi";
        slideArticle.appendChild(h1);

        const chartStage = document.createElement("div");
        chartStage.className = "canva-chart-stage";
        chartStage.innerHTML = this.#createGunduzSuresiSvg("ekvator");
        slideArticle.appendChild(chartStage);

        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_kavram_yanilgilari": {
        const slideArticle = document.createElement("article");
        const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
        slideArticle.className = `board-slide slide-canva-kavram-yanilgilari ${slideIdClass}`.trim();
        if (slide.id) slideArticle.dataset.slideId = slide.id;

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Kavram Yanılgıları";
        slideArticle.appendChild(h1);

        const listContainer = document.createElement("div");
        listContainer.className = "canva-yanilgi-list";

        const misconceptions = slide.misconceptions ?? [];
        const rows = [];

        misconceptions.forEach((item) => {
          const card = document.createElement("div");
          card.className = "canva-yanilgi-row";
          card.setAttribute("tabindex", "0");
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", "Yanılgı doğrusunu göster");

          card.innerHTML = `
            <div class="yanilgi-col yanilgi-wrong">
              <span class="yanilgi-icon-wrap wrong-icon-wrap" aria-hidden="true">
                <svg class="yanilgi-icon icon-cross" viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
              <p class="yanilgi-text text-wrong">${escapeHtml(item.wrong)}</p>
            </div>

            <div class="yanilgi-col yanilgi-correct">
              <span class="yanilgi-icon-wrap correct-icon-wrap" aria-hidden="true">
                <svg class="yanilgi-icon icon-check" viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <p class="yanilgi-text text-correct">${escapeHtml(item.correct)}</p>
            </div>
            
            <button type="button" class="yanilgi-toggle-btn" aria-label="Cevabı Göster">
              <span>Doğrusu Ne?</span>
            </button>
          `;

          const toggleAction = () => {
            card.classList.toggle("is-revealed");
            const isRevealed = card.classList.contains("is-revealed");
            const btn = card.querySelector(".yanilgi-toggle-btn span");
            if (btn) btn.textContent = isRevealed ? "Gizle" : "Doğrusu Ne?";
          };

          card.addEventListener("click", (e) => {
            if (e.target.closest("button")) {
              e.stopPropagation();
            }
            toggleAction();
          });
          card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleAction();
            }
          });

          rows.push(card);
          listContainer.appendChild(card);
        });

        this.activeInteractions.push({
          reset: () => {
            rows.forEach((card) => {
              card.classList.remove("is-revealed");
              const btn = card.querySelector(".yanilgi-toggle-btn span");
              if (btn) btn.textContent = "Doğrusu Ne?";
            });
          },
          destroy: () => {}
        });

        slideArticle.appendChild(listContainer);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_mevsimlerin_sebebi": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-mevsimlerin-sebebi";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading canva-center-heading";
        h1.textContent = "Mevsimlerin Oluşumu";
        slideArticle.appendChild(h1);

        const stage = document.createElement("div");
        stage.className = "canva-sebepler-stage";
        stage.innerHTML = `
          <div class="canva-sebepler-cols">
            <div class="canva-sebepler-col">
              <h2 class="canva-col-title">Mevsimlerin iki oluşum sebebi vardır.</h2>
              <ul class="canva-bullet-list">
                <li>Dünya’nın eksen eğikliği</li>
                <li>Dünya’nın Güneş etrafında dolanması</li>
                <li>Bu sebeple Güneş ışınlarının geliş açısı yıl boyunca değişir ve mevsimleri oluşturur.</li>
              </ul>
            </div>
            <div class="canva-sebepler-col">
              <h2 class="canva-col-title">Dünya’nın iki temel hareketi vardır;</h2>
              <ul class="canva-bullet-list">
                <li>Günlük hareketin sonucunda <strong>gece ve gündüz</strong> oluşur.</li>
                <li>Yıllık hareketinin sonucunda ise <strong>mevsimler</strong> oluşur.</li>
              </ul>
            </div>
          </div>
          <div class="canva-peach-card canva-mesafe-warning">
            <p>Dünya’nın Güneş’e yaklaşması ve uzaklaşması mevsimlerin oluşumunda etkisi yoktur.</p>
          </div>
        `;

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_eksen_sonuclari_yazi": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-eksen-sonuclari-yazi";

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading";
        h1.textContent = "Eksen Eğikliğinin Sonuçları (23° 27')";
        slideArticle.appendChild(h1);

        const contentBox = document.createElement("div");
        contentBox.className = "canva-eksen-sonuclari-box";
        contentBox.innerHTML = `
          <ul class="canva-bullet-list canva-large-bullets">
            <li>Mevsimler oluşur.</li>
            <li>Aynı anda farklı yarım kürelerde farklı mevsimler yaşanır (KYK kış yaşarken GYK yaz yaşar).</li>
            <li>Yıllık sıcaklık farkları meydana gelir.</li>
            <li>Bir noktadaki gölge boyu ve Güneş ışınlarının geliş açısı yıl boyunca sürekli değişir.</li>
            <li>Gece ve gündüz süreleri yıl boyunca değişiklik gösterir.</li>
          </ul>
        `;

        slideArticle.appendChild(contentBox);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_mevsim_tarihleri_ozet": {
        const slideArticle = document.createElement("article");
        const slideIdClass = slide.id ? `slide-${slide.id.replace(/_/g, "-")}` : "";
        slideArticle.className = `board-slide slide-canva-mevsim-tarihleri-ozet ${slideIdClass}`.trim();
        if (slide.id) slideArticle.dataset.slideId = slide.id;

        const h1 = document.createElement("h1");
        h1.className = "canva-red-heading canva-center-heading";
        h1.textContent = "Mevsim Tarihleri";
        slideArticle.appendChild(h1);

        const tableWrapper = document.createElement("div");
        tableWrapper.className = "canva-table-wrapper";

        tableWrapper.innerHTML = `
          <table class="canva-summary-table">
            <colgroup>
              <col class="col-date" style="width: 17%;">
              <col class="col-kyk" style="width: 28%;">
              <col class="col-gyk" style="width: 28%;">
              <col class="col-dik" style="width: 27%;">
            </colgroup>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kuzey Yarım Küre</th>
                <th>Güney Yarım Küre</th>
                <th>Güneş'in Dik Geldiği Yer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-date"><strong>21 Aralık</strong></td>
                <td>Kış başlar / En uzun gece</td>
                <td>Yaz başlar / En uzun gündüz</td>
                <td class="cell-highlight">Oğlak Dönencesi</td>
              </tr>
              <tr>
                <td class="cell-date"><strong>21 Mart</strong></td>
                <td>İlkbahar başlar / Gece = Gündüz</td>
                <td>Sonbahar başlar / Gece = Gündüz</td>
                <td class="cell-highlight">Ekvator</td>
              </tr>
              <tr>
                <td class="cell-date"><strong>21 Haziran</strong></td>
                <td>Yaz başlar / En uzun gündüz</td>
                <td>Kış başlar / En uzun gece</td>
                <td class="cell-highlight">Yengeç Dönencesi</td>
              </tr>
              <tr>
                <td class="cell-date"><strong>23 Eylül</strong></td>
                <td>Sonbahar başlar / Gece = Gündüz</td>
                <td>İlkbahar başlar / Gece = Gündüz</td>
                <td class="cell-highlight">Ekvator</td>
              </tr>
            </tbody>
          </table>
        `;

        slideArticle.appendChild(tableWrapper);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_birim_enerji": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-birim-enerji";

        const stage = document.createElement("div");
        stage.className = "canva-birim-enerji-stage";

        stage.innerHTML = `
          <div class="canva-birim-col">
            <h2 class="canva-red-col-title">Işınlar Dik veya Dike Yakın Açıyla Gelirse:</h2>
            <ul class="canva-bullet-list">
              <li>Dar bir alanı aydınlatır ve ısıtır.</li>
              <li>Birim yüzeye düşen enerji miktarı ve sıcaklık fazladır.</li>
              <li>Gölge boyu kısa olur.</li>
              <li>Yaz mevsimi yaşanır.</li>
            </ul>
            <div class="canva-birim-img-container">
              <img src="./assets/images/mevsimlerin-olusumu/25-dik-isin-alan.png" alt="Dik veya dike yakın ışınlar, dar alan ve yüksek enerji" class="canva-responsive-img" />
            </div>
          </div>
          <div class="canva-birim-col">
            <h2 class="canva-red-col-title">Işınlar Eğik Açıyla Gelirse:</h2>
            <ul class="canva-bullet-list">
              <li>Geniş bir alanı aydınlatır ve ısıtır.</li>
              <li>Birim yüzeye düşen enerji miktarı ve sıcaklık azdır (düşüktür).</li>
              <li>Gölge boyu uzun olur.</li>
              <li>Kış mevsimi yaşanır.</li>
            </ul>
            <div class="canva-birim-img-container">
              <img src="./assets/images/mevsimlerin-olusumu/25-egik-isin-alan.png" alt="Eğik ışınlar, geniş alan ve düşük enerji" class="canva-responsive-img" />
            </div>
          </div>
        `;

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      case "canva_gece_gunduz_sureleri": {
        const slideArticle = document.createElement("article");
        slideArticle.className = "board-slide slide-canva-gece-gunduz-sureleri";

        const stage = document.createElement("div");
        stage.className = "canva-sureler-stage";

        stage.innerHTML = `
          <div class="canva-sureler-hemispheres">
            <div class="canva-sure-col">
              <h2 class="canva-hemisphere-title text-red">Kuzey Yarım Küre (KYK)</h2>
              <div class="canva-sure-block">
                <p class="canva-sure-dates">21 Aralık <span class="arrow-right">⟶</span> 21 Haziran</p>
                <p class="canva-sure-status status-green">Gündüzler uzar.</p>
              </div>
              <div class="canva-sure-block">
                <p class="canva-sure-dates">21 Haziran <span class="arrow-right">⟶</span> 21 Aralık</p>
                <p class="canva-sure-status status-red">Gündüzler kısalır.</p>
              </div>
            </div>
            <div class="canva-sure-col">
              <h2 class="canva-hemisphere-title text-blue">Güney Yarım Küre (GYK)</h2>
              <div class="canva-sure-block">
                <p class="canva-sure-dates">21 Aralık <span class="arrow-right">⟶</span> 21 Haziran</p>
                <p class="canva-sure-status status-red">Gündüzler kısalır.</p>
              </div>
              <div class="canva-sure-block">
                <p class="canva-sure-dates">21 Haziran <span class="arrow-right">⟶</span> 21 Aralık</p>
                <p class="canva-sure-status status-green">Gündüzler uzar.</p>
              </div>
            </div>
          </div>
          <div class="canva-sure-ekvator">
            <h3 class="canva-ekvator-title">Ekvator</h3>
            <p class="canva-ekvator-desc">Yıl boyunca gece ve gündüz süresi eşittir (12 saat).</p>
          </div>
        `;

        slideArticle.appendChild(stage);
        view.slideContent.replaceChildren(slideArticle);
        return true;
      }

      default:
        return false;
    }
  }

  #createGunduzSuresiSvg(type) {
    const dates = [
      { x: 200, label: "21 Aralık" },
      { x: 470, label: "21 Mart" },
      { x: 740, label: "21 Haziran" },
      { x: 1010, label: "23 Eylül" },
      { x: 1280, label: "21 Aralık" }
    ];

    let pathD = "";
    let strokeColor = "";
    let extraElements = "";

    if (type === "guney") {
      pathD = "M 200 140 L 740 480 L 1280 140";
      strokeColor = "#2563eb";
    } else if (type === "kuzey") {
      pathD = "M 200 480 L 740 140 L 1280 480";
      strokeColor = "#dc2626";
    } else if (type === "ekvator") {
      pathD = "M 100 310 L 1280 310";
      strokeColor = "#d97706";
      extraElements = `
        <text x="75" y="318" text-anchor="end" font-size="26" font-weight="850" fill="#0f172a">12</text>
        <line x1="90" y1="310" x2="105" y2="310" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" />
      `;
    }

    const ticksSvg = dates.map(d => `
      <line x1="${d.x}" y1="472" x2="${d.x}" y2="488" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" />
      <text x="${d.x}" y="535" text-anchor="middle" font-size="24" font-weight="700" fill="#0f172a">${d.label}</text>
    `).join("");

    return `
      <svg viewBox="0 -50 1400 640" class="canva-chart-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gündüz süresi grafiği">
        <defs>
          <marker id="arrow-y" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 11 L 6 1 L 11 11 Z" fill="#0f172a" />
          </marker>
          <marker id="arrow-x" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 1 L 11 6 L 1 11 Z" fill="#0f172a" />
          </marker>
        </defs>

        <!-- Y Axis -->
        <text x="95" y="-10" text-anchor="start" font-size="25" font-weight="700" fill="#0f172a">Gündüz Süresi (saat)</text>
        <line x1="100" y1="480" x2="100" y2="45" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" marker-end="url(#arrow-y)" />

        <!-- X Axis -->
        <line x1="100" y1="480" x2="1340" y2="480" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" marker-end="url(#arrow-x)" />

        <!-- Ticks and Labels -->
        ${ticksSvg}
        ${extraElements}

        <!-- Curve Line -->
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" class="canva-chart-path" />
      </svg>
    `;
  }

  #registerInteractions() {
    const revealFillHandler = {
      mount: (definition, container, context = {}) => {
        container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "reveal-fill-sentence";

        const template = definition.template ?? "";
        const parts = template.split(/\{([a-zA-Z0-9_-]+)\}/g);
        const blankMap = new Map((definition.blanks ?? []).map((b) => [b.id, b]));
        const buttons = [];

        parts.forEach((part, index) => {
          if (index % 2 === 1) {
            const blank = blankMap.get(part);
            if (blank) {
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "reveal-fill-blank";
              btn.dataset.blankId = blank.id;
              btn.setAttribute("aria-label", "Cevabı göster");
              btn.setAttribute("aria-expanded", "false");

              const answerLen = (blank.answer ?? "").length;
              if (answerLen <= 3) btn.classList.add("size-short");
              else if (answerLen <= 8) btn.classList.add("size-medium");
              else btn.classList.add("size-long");

              const answer = document.createElement("span");
              answer.className = "blank-slot-answer";
              answer.textContent = blank.answer;

              btn.appendChild(answer);

              btn.addEventListener("click", () => {
                if (btn.classList.contains("is-revealed")) return;
                btn.classList.add("is-revealed");
                btn.setAttribute("aria-expanded", "true");
                context.onReveal?.(blank);
              });

              buttons.push(btn);
              wrapper.appendChild(btn);
            }
          } else if (part) {
            const textSpan = document.createElement("span");
            textSpan.className = "reveal-fill-text";
            textSpan.textContent = part;
            wrapper.appendChild(textSpan);
          }
        });

        container.appendChild(wrapper);

        return {
          reset: () => {
            buttons.forEach((btn) => {
              btn.classList.remove("is-revealed");
              btn.setAttribute("aria-expanded", "false");
            });
          },
          destroy: () => {
            container.innerHTML = "";
          }
        };
      }
    };

    this.interactions.register("reveal_fill", revealFillHandler);
    this.interactions.register("fill_in_blank", revealFillHandler);
  }

  #setViewMode(mode) {
    const validModes = ["smartboard", "online", "recording", "clean"];
    if (!validModes.includes(mode)) return;
    this.state.update((draft) => {
      draft.presentation.viewMode = mode;
      return draft;
    });
    this.#syncViewMode(mode);
    const modeNames = {
      smartboard: "Akıllı Tahta",
      online: "Online Ders",
      recording: "Ekran Kaydı",
      clean: "Temiz Görünüm"
    };
    this.#toast(`Görünüm Modu: ${modeNames[mode] ?? mode}`);
  }

  #cycleViewMode() {
    const modes = ["smartboard", "online", "recording", "clean"];
    const current = this.state.get().presentation?.viewMode ?? "smartboard";
    const nextIndex = (modes.indexOf(current) + 1) % modes.length;
    this.#setViewMode(modes[nextIndex]);
  }

  #syncViewMode(mode = this.state.get().presentation?.viewMode ?? "smartboard") {
    const view = this.presentationView;
    if (!view) return;
    if (view.viewContainer) view.viewContainer.dataset.viewMode = mode;
    document.body.dataset.viewMode = mode;

    const modeLabels = {
      smartboard: "Akıllı Tahta",
      online: "Online Ders",
      recording: "Ekran Kaydı",
      clean: "Temiz Görünüm"
    };
    if (view.floatingModeLabel) {
      view.floatingModeLabel.textContent = modeLabels[mode] ?? "Akıllı Tahta";
    }

    const options = view.viewModeSheet?.querySelectorAll(".viewmode-opt");
    if (options) {
      options.forEach((opt) => {
        opt.classList.toggle("is-active", opt.dataset.viewMode === mode);
      });
    }

    this.#setupRecordingAutohide(mode === "recording");
    this.#toggleViewModeSheet(false);
    this.#updateSlideScale(view);
    requestAnimationFrame(() => {
      this.#updateSlideScale(view);
      this.annotationEngine?.resize();
    });
  }

  #updateSlideScale(view = this.presentationView) {
    if (!view?.canvasArea || !view?.workspace) return 1;
    const rect = view.canvasArea.getBoundingClientRect();
    const style = typeof window !== "undefined" && window.getComputedStyle ? window.getComputedStyle(view.canvasArea) : null;
    const padX = style ? ((parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)) : 0;
    const padY = style ? ((parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)) : 0;
    let availableWidth = rect.width - padX;
    let availableHeight = rect.height - padY;

    if (availableWidth <= 0 || availableHeight <= 0) {
      if (typeof window !== "undefined") {
        availableWidth = window.innerWidth || 1920;
        availableHeight = window.innerHeight || 1080;
      } else {
        availableWidth = 1920;
        availableHeight = 1080;
      }
    }

    const fitScale = Math.min(availableWidth / 1920, availableHeight / 1080);
    const userZoom = this.state.get().presentation.userZoom ?? 1;
    const finalScale = fitScale * userZoom;
    const { panX, panY } = this.#clampPan(view, finalScale);
    this.state.update((draft) => { draft.presentation.fitScale = fitScale; draft.presentation.panX = panX; draft.presentation.panY = panY; return draft; });
    view.workspace.style.setProperty("--slide-scale", String(finalScale));
    view.workspace.style.setProperty("--pan-x", `${panX}px`);
    view.workspace.style.setProperty("--pan-y", `${panY}px`);
    view.workspace.style.left = `calc(50% + ${panX}px)`;
    view.workspace.style.top = `calc(50% + ${panY}px)`;
    view.canvasArea.style.setProperty("--slide-scale", String(finalScale));
    if (view.zoomLevel) view.zoomLevel.textContent = `%${Math.round(userZoom * 100)}`;
    return finalScale;
  }

  #changeZoom(delta) {
    const current = this.state.get().presentation.userZoom ?? 1;
    const next = Math.min(2, Math.max(.5, Math.round((current + delta) * 10) / 10));
    this.state.update((draft) => { draft.presentation.userZoom = next; return draft; });
    this.#updateSlideScale();
    this.annotationEngine?.resize();
  }

  #fitZoom() {
    this.state.update((draft) => { draft.presentation.userZoom = 1; draft.presentation.panX = 0; draft.presentation.panY = 0; return draft; });
    this.#updateSlideScale();
    this.annotationEngine?.resize();
  }

  #clampPan(view = this.presentationView, scale = null, x = null, y = null) {
    const state = this.state.get().presentation;
    const finalScale = scale ?? (state.fitScale * state.userZoom);
    if (!view?.canvasArea) return { panX: x ?? state.panX ?? 0, panY: y ?? state.panY ?? 0 };
    const rect = view.canvasArea.getBoundingClientRect();
    const style = getComputedStyle(view.canvasArea);
    const availableWidth = rect.width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const availableHeight = rect.height - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
    const limitX = Math.max(0, (1920 * finalScale - availableWidth) / 2);
    const limitY = Math.max(0, (1080 * finalScale - availableHeight) / 2);
    return {
      panX: Math.max(-limitX, Math.min(limitX, x ?? state.panX ?? 0)),
      panY: Math.max(-limitY, Math.min(limitY, y ?? state.panY ?? 0))
    };
  }

  #applyPan(x, y) {
    if (!this.presentationView) return;
    const state = this.state.get().presentation;
    const clamped = this.#clampPan(this.presentationView, state.fitScale * state.userZoom, x, y);
    this.state.update((draft) => { draft.presentation.panX = clamped.panX; draft.presentation.panY = clamped.panY; return draft; });
    this.presentationView.workspace.style.setProperty("--pan-x", `${clamped.panX}px`);
    this.presentationView.workspace.style.setProperty("--pan-y", `${clamped.panY}px`);
    this.presentationView.workspace.style.left = `calc(50% + ${clamped.panX}px)`;
    this.presentationView.workspace.style.top = `calc(50% + ${clamped.panY}px)`;
  }

  #togglePan() {
    const active = !this.state.get().presentation.panActive;
    this.state.update((draft) => { draft.presentation.panActive = active; return draft; });
    this.presentationView?.viewContainer.classList.toggle("is-pan-active", active);
    this.presentationView?.panToggle.classList.toggle("is-active", active);
    this.presentationView?.panToggle.setAttribute("aria-pressed", String(active));
  }

  #bindPan(view) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    view.workspace.addEventListener("pointerdown", (event) => {
      const presentation = this.state.get().presentation;
      if (!presentation.panActive || this.state.get().ui.annotationEnabled) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      originX = presentation.panX;
      originY = presentation.panY;
      view.workspace.classList.add("is-panning");
      view.workspace.setPointerCapture?.(pointerId);
      event.preventDefault();
    });
    view.workspace.addEventListener("pointermove", (event) => {
      if (pointerId !== event.pointerId) return;
      this.#applyPan(originX + event.clientX - startX, originY + event.clientY - startY);
      event.preventDefault();
    });
    const endPan = (event) => {
      if (pointerId !== event.pointerId) return;
      view.workspace.releasePointerCapture?.(pointerId);
      pointerId = null;
      view.workspace.classList.remove("is-panning");
      event.preventDefault();
    };
    view.workspace.addEventListener("pointerup", endPan);
    view.workspace.addEventListener("pointercancel", endPan);
  }

  #toggleViewModeSheet(open) {
    if (!this.presentationView) return;
    const sheet = this.presentationView.viewModeSheet;
    const backdrop = this.presentationView.viewModeBackdrop;
    if (!sheet || !backdrop) return;
    sheet.hidden = !open;
    backdrop.hidden = !open;
  }

  #setupRecordingAutohide(enable) {
    if (this.recordingIdleTimeout) {
      clearTimeout(this.recordingIdleTimeout);
      this.recordingIdleTimeout = null;
    }
    const view = this.presentationView;
    if (!view?.viewContainer) return;

    if (!enable) {
      view.viewContainer.classList.remove("is-idle");
      if (this.recordingMouseMoveHandler) {
        view.viewContainer.removeEventListener("mousemove", this.recordingMouseMoveHandler);
        this.recordingMouseMoveHandler = null;
      }
      return;
    }

    const resetIdleTimer = () => {
      view.viewContainer.classList.remove("is-idle");
      if (this.recordingIdleTimeout) clearTimeout(this.recordingIdleTimeout);
      this.recordingIdleTimeout = setTimeout(() => {
        if (this.state.get().presentation?.viewMode === "recording") {
          view.viewContainer.classList.add("is-idle");
        }
      }, 2500);
    };

    this.recordingMouseMoveHandler = resetIdleTimer;
    view.viewContainer.addEventListener("mousemove", resetIdleTimer);
    resetIdleTimer();
  }

  #handleKeyboard(event) {
    if (event.key === "Escape") {
      if (this.presentationView?.viewModeSheet && !this.presentationView.viewModeSheet.hidden) {
        this.#toggleViewModeSheet(false);
        return;
      }
      const currentMode = this.state.get().presentation?.viewMode;
      if (currentMode === "clean" || currentMode === "recording") {
        this.#setViewMode("smartboard");
        return;
      }
      this.#togglePlan(false);
      this.toggleTools?.(false);
      this.shell.sourceInfo.hidden = true;
      this.shell.infoButton.setAttribute("aria-expanded", "false");
      this.shell.focusOverlay.hidden = true;
      this.#toggleMobileSidebar(false);
      return;
    }
    const targetIsField = event.target instanceof Element && event.target.closest("input, textarea, select");
    if (this.modeManager.current !== "presentation" || targetIsField) return;
    const key = event.key.toLowerCase();
    if (event.key === "ArrowRight" || event.key === " ") this.#navigateSlides(1);
    else if (event.key === "ArrowLeft") this.#navigateSlides(-1);
    else if (key === "f") this.teacherTools.requestFullscreen();
    else if (key === "r") this.#resetPresentation();
    else if (key === "p") this.#togglePlan(this.presentationView?.planSheet.hidden ?? true);
    else if (key === "v") this.#cycleViewMode();
    else if (event.key === "/") this.#changeZoom(0.1);
    else if (event.key === "*") this.#changeZoom(-0.1);
    else if (event.key === "0") this.#fitZoom();
    else if (key === "1") this.#setViewMode("smartboard");
    else if (key === "2") this.#setViewMode("online");
    else if (key === "3") this.#setViewMode("recording");
    else if (key === "4") this.#setViewMode("clean");
    else return;
    event.preventDefault();
  }

  #updateClock() {
    const now = new Date();
    this.shell.clockHours.textContent = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    this.shell.clockSeconds.textContent = new Intl.DateTimeFormat("tr-TR", { second: "2-digit" }).format(now);
    this.shell.clockDate.textContent = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(now);
  }

  #toast(message) {
    this.shell.toast.textContent = message;
    this.shell.toast.hidden = false;
    window.setTimeout(() => { this.shell.toast.hidden = true; }, 2600);
  }

  #renderStartupError(error) {
    console.error(error);
    this.shell.main.innerHTML = `<section class="fatal-error"><h1>Uygulama verileri açılamadı</h1><p>USB sürümünü <code>Başlat.sh</code> ile çalıştırın. Tarayıcıda dosyayı doğrudan açmak JSON güvenlik kısıtlamasına takılır.</p></section>`;
  }
}

const app = new CanFenciApp(document.querySelector("#app"));
app.start();

export { CanFenciApp };
