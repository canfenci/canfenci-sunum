const DEFAULT_OPTIONS = {
  tool: "pen",
  color: "#ef4444",
  width: 4
};

export class AnnotationEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.history = [];
    this.redoStack = [];
    this.activeStroke = null;
    this.laserPoint = null;
    this.enabled = false;
    this.#bindEvents();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.canvas.hidden = !enabled;
    this.canvas.style.pointerEvents = enabled ? "auto" : "none";
  }

  setTool(tool) {
    if (!["pen", "highlighter", "eraser", "laser"].includes(tool)) return;
    this.options.tool = tool;
    this.canvas.dataset.tool = tool;
  }

  setColor(color) { this.options.color = color; }
  setWidth(width) { this.options.width = Number(width); }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(rect.width * scale));
    this.canvas.height = Math.max(1, Math.round(rect.height * scale));
    this.context.setTransform(scale, 0, 0, scale, 0, 0);
    this.render();
  }

  undo() {
    const stroke = this.history.pop();
    if (stroke) this.redoStack.push(stroke);
    this.render();
  }

  redo() {
    const stroke = this.redoStack.pop();
    if (stroke) this.history.push(stroke);
    this.render();
  }

  clear() {
    if (this.history.length) this.redoStack.push(...this.history.splice(0));
    this.render();
  }

  destroy() {
    this.abortController.abort();
  }

  #bindEvents() {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.canvas.addEventListener("pointerdown", (event) => this.#start(event), { signal });
    this.canvas.addEventListener("pointermove", (event) => this.#move(event), { signal });
    this.canvas.addEventListener("pointerup", () => this.#end(), { signal });
    this.canvas.addEventListener("pointercancel", () => this.#end(), { signal });
    this.canvas.addEventListener("pointerleave", () => {
      if (this.options.tool === "laser") { this.laserPoint = null; this.render(); }
    }, { signal });
  }

  #point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  #start(event) {
    if (!this.enabled) return;
    this.canvas.setPointerCapture(event.pointerId);
    const point = this.#point(event);
    if (this.options.tool === "laser") { this.laserPoint = point; this.render(); return; }
    this.activeStroke = { ...this.options, points: [point] };
  }

  #move(event) {
    if (!this.enabled) return;
    const point = this.#point(event);
    if (this.options.tool === "laser") { this.laserPoint = point; this.render(); return; }
    if (!this.activeStroke) return;
    this.activeStroke.points.push(point);
    this.render(this.activeStroke);
  }

  #end() {
    if (this.activeStroke) {
      this.history.push(this.activeStroke);
      this.redoStack.length = 0;
      this.activeStroke = null;
    }
    if (this.options.tool === "laser") this.laserPoint = null;
    this.render();
  }

  render(preview = null) {
    const rect = this.canvas.getBoundingClientRect();
    this.context.clearRect(0, 0, rect.width, rect.height);
    [...this.history, ...(preview ? [preview] : [])].forEach((stroke) => this.#drawStroke(stroke));
    if (this.laserPoint) {
      this.context.save();
      this.context.fillStyle = "rgba(239, 68, 68, .9)";
      this.context.shadowColor = "#ef4444";
      this.context.shadowBlur = 16;
      this.context.beginPath();
      this.context.arc(this.laserPoint.x, this.laserPoint.y, 8, 0, Math.PI * 2);
      this.context.fill();
      this.context.restore();
    }
  }

  #drawStroke(stroke) {
    if (stroke.points.length < 2) return;
    const ctx = this.context;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.color;
    if (stroke.tool === "highlighter") {
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = stroke.width * 3;
    }
    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.width * 4;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
    ctx.restore();
  }
}
