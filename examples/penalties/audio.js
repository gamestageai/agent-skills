export class Sound {
  constructor() {
    this.enabled = false;
    this.context = null;
  }
  activate() {
    if (!this.enabled) return;
    this.context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === "suspended") this.context.resume();
  }
  tone(freq, duration, type = "sine", volume = 0.12, end = freq) {
    if (!this.enabled) return;
    this.activate();
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(1, end),
      c.currentTime + duration,
    );
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + duration);
  }
  play(event) {
    if (event === "kick") this.tone(130, 0.13, "triangle", 0.28, 43);
    if (event === "post" || event === "bar" || event === "frame")
      this.tone(850, 0.4, "sine", 0.2, 750);
    if (event === "saved") this.tone(92, 0.16, "triangle", 0.15, 35);
    if (event === "bounce") this.tone(70, 0.08, "sine", 0.07, 35);
    if (event === "net") this.tone(180, 0.1, "triangle", 0.04, 55);
    if (event === "goal") {
      this.tone(440, 0.18, "sine", 0.055);
      setTimeout(() => this.tone(660, 0.25, "sine", 0.05), 95);
      setTimeout(() => this.tone(880, 0.4, "sine", 0.045), 190);
    }
  }
}
