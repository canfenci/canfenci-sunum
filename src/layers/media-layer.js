const LOCAL_TYPES = new Set(["svg", "png", "webp", "mp4", "webm"]);

export class MediaLayer {
  constructor({ online = navigator.onLine } = {}) {
    this.online = online;
  }

  canRender(source) {
    if (source.provider === "youtube") return this.online && Boolean(source.videoId);
    return source.kind === "local" && LOCAL_TYPES.has(source.type);
  }

  create(source) {
    if (!this.canRender(source)) return this.#fallback("Medya çevrimdışı veya desteklenmiyor.");
    if (source.provider === "youtube") {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}`;
      frame.title = source.alt ?? "YouTube videosu";
      frame.loading = "lazy";
      frame.allowFullscreen = true;
      return frame;
    }
    if (["mp4", "webm"].includes(source.type)) {
      const video = document.createElement("video");
      video.src = source.src;
      video.controls = true;
      video.preload = "metadata";
      return video;
    }
    const image = document.createElement("img");
    image.src = source.src;
    image.alt = source.alt ?? "";
    return image;
  }

  #fallback(message) {
    const element = document.createElement("p");
    element.className = "media-fallback";
    element.textContent = message;
    return element;
  }
}
