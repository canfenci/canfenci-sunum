export class TeacherTools {
  constructor({ events }) {
    this.events = events;
    this.timerId = null;
    this.remainingSeconds = 0;
  }

  startTimer(seconds) {
    this.stopTimer();
    this.remainingSeconds = Math.max(0, Number(seconds) || 0);
    this.events.emit("teacher:timer", this.remainingSeconds);
    this.timerId = window.setInterval(() => {
      this.remainingSeconds -= 1;
      this.events.emit("teacher:timer", Math.max(0, this.remainingSeconds));
      if (this.remainingSeconds <= 0) this.stopTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = null;
  }

  toggleCurtain() { this.events.emit("teacher:curtain:toggle"); }
  requestFullscreen() { this.events.emit("teacher:fullscreen:request"); }
  print() { window.print(); }
  destroy() { this.stopTimer(); }
}
