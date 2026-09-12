import { isWorkMode } from "./work-modes.js";

const isValidMode = (mode) => mode === "control-panel" || isWorkMode(mode);

export class ModeManager {
  constructor({ state, events }) {
    this.state = state;
    this.events = events;
  }

  enter(mode, context = {}) {
    if (!isValidMode(mode)) throw new Error(`Bilinmeyen uygulama modu: ${mode}`);
    const previousMode = this.state.get().appMode;
    this.state.update((draft) => {
      draft.appMode = mode;
      draft.ui.statusMessage = context.statusMessage ?? "";
    });
    this.events.emit("mode:changed", { previousMode, mode, context });
  }

  get current() {
    return this.state.get().appMode;
  }
}
