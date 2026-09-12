const initialState = Object.freeze({
  appMode: "control-panel",
  selection: {
    gradeId: null,
    curriculumProfileId: null,
    unitId: null,
    topicId: null,
    lessonId: null,
    lessonMode: "presentation",
    workMode: "presentation"
  },
  presentation: {
    stageId: null,
    slideId: null,
    slideIndex: 0,
    viewMode: "smartboard"
  },
  classContext: {
    classId: null,
    classLabel: null,
    studentCount: null,
    progressTracking: false
  },
  ui: {
    teacherToolsOpen: false,
    annotationEnabled: false,
    statusMessage: ""
  }
});

const clone = (value) => JSON.parse(JSON.stringify(value));

export class AppState {
  #state = clone(initialState);
  #listeners = new Set();

  get() {
    return clone(this.#state);
  }

  update(updater) {
    const draft = clone(this.#state);
    this.#state = updater(draft) ?? draft;
    const snapshot = this.get();
    this.#listeners.forEach((listener) => listener(snapshot));
    return snapshot;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  reset() {
    this.#state = clone(initialState);
    return this.get();
  }
}
