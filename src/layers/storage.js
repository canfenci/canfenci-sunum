const SETTINGS_KEY = "canfenci.settings.v1";

export class StorageLayer {
  loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; }
    catch { return {}; }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch { return false; }
  }

  saveProgress(context, progress) {
    void context;
    void progress;
    return false;
  }

  loadProgress(context) {
    void context;
    return null;
  }
}
