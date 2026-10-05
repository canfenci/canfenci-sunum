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
