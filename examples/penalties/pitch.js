import { PitchRenderer } from './renderer.js';
import { clamp, trajectoryFromRecord } from './scene.js';

/** ELEVEN's input and animation clock. Only a committed record can start a flight. */
export class Pitch {
  constructor(canvas, changed, shoot) {
    this.canvas = canvas;
    this.renderer = new PitchRenderer(canvas);
    this.changed = changed;
    this.onShoot = shoot;
    this.aim = { x: 0, y: 500 };
    this.power = 650;
    this.phase = 'loading';
    this.verdict = '';
    this.clock = 0;
    this.previous = performance.now();
    this.pointer = null;
    this.keyboard = false;
    this.abort = new AbortController();
    const on = (target, name, fn) => target.addEventListener(name, fn, { signal: this.abort.signal });
    const aim = e => {
      const box = canvas.getBoundingClientRect();
      this.aim = this.renderer.aimFromPoint(e.clientX - box.left, e.clientY - box.top);
      this.sync();
    };
    on(canvas, 'pointermove', e => {
      if (this.pointer !== null && this.pointer !== e.pointerId) return;
      if (['ready', 'charging'].includes(this.phase)) aim(e);
    });
    on(canvas, 'pointerdown', e => {
      canvas.dataset.input = 'pointer';
      if (e.button !== 0 || this.phase !== 'ready') return;
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      this.pointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      aim(e);
      this.charge();
    });
    on(canvas, 'pointerup', e => {
      if (e.pointerId !== this.pointer || this.phase !== 'charging') return;
      aim(e);
      this.shoot();
    });
    for (const event of ['pointercancel', 'lostpointercapture']) on(canvas, event, e => {
      if (e.pointerId === this.pointer) this.cancelCharge();
    });
    on(canvas, 'keydown', e => {
      canvas.dataset.input = 'keyboard';
      if (!['ready', 'charging'].includes(this.phase)) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) e.preventDefault();
      const step = e.shiftKey ? 20 : 65;
      if (e.key === 'ArrowLeft') this.aim.x = clamp(this.aim.x - step, -1200, 1200);
      if (e.key === 'ArrowRight') this.aim.x = clamp(this.aim.x + step, -1200, 1200);
      if (e.key === 'ArrowUp') this.aim.y = clamp(this.aim.y + step, -200, 1200);
      if (e.key === 'ArrowDown') this.aim.y = clamp(this.aim.y - step, -200, 1200);
      if (e.key === ' ' && !e.repeat && this.phase === 'ready') { this.keyboard = true; this.charge(); }
      if (e.key === 'Enter' && !e.repeat) this.shoot();
      this.sync();
    });
    on(canvas, 'keyup', e => {
      if (e.key === ' ' && this.keyboard) { e.preventDefault(); this.shoot(); }
    });
    on(canvas, 'blur', () => this.cancelCharge());
    on(window, 'blur', () => this.cancelCharge());
    on(document, 'visibilitychange', () => {
      this.previous = performance.now();
      if (document.hidden) this.cancelCharge();
    });
    this.frame = requestAnimationFrame(t => this.loop(t));
  }
  sync() {
    this.renderer.aim = this.aim;
    this.renderer.power = this.power / 1000;
    this.renderer.phase = this.phase;
    this.canvas.dataset.phase = this.phase;
    this.changed({ phase: this.phase, aim: { ...this.aim }, power: this.power, verdict: this.phase === 'verdict' ? this.verdict : '' });
  }
  setPhase(phase) { this.phase = phase; this.sync(); }
  ready(finished = false) {
    this.renderer.verdict = '';
    delete this.canvas.dataset.verdict;
    this.renderer.motion = null;
    this.renderer.netHit = null;
    this.aim = { x: 0, y: 500 };
    this.power = 650;
    this.setPhase(finished ? 'complete' : 'ready');
  }
  setAim(x, y) { if (this.phase === 'ready') { this.aim = { x, y }; this.sync(); } }
  setPower(power) { if (this.phase === 'ready') { this.power = power; this.sync(); } }
  charge() { this.chargeAt = this.clock; this.setPhase('charging'); }
  cancelCharge() {
    this.pointer = null;
    this.keyboard = false;
    if (this.phase === 'charging') this.setPhase('ready');
  }
  shoot() {
    if (!['ready', 'charging'].includes(this.phase)) return;
    this.pointer = null;
    this.keyboard = false;
    this.setPhase('waiting');
    this.onShoot({ aimX: this.aim.x, aimY: this.aim.y, power: Math.round(this.power) });
  }
  animate(shot, verdict, replay = false) {
    const motion = trajectoryFromRecord(shot);
    this.renderer.motion = motion;
    this.renderer.motionTime = 0;
    this.renderer.netHit = null;
    this.renderer.shake = 0;
    this.renderer.verdict = '';
    delete this.canvas.dataset.verdict;
    delete this.canvas.dataset.flightTime;
    this.verdict = verdict;
    this.motionAt = this.clock;
    this.speed = replay ? 0.48 : 1;
    this.netPlayed = false;
    const done = new Promise(resolve => { this.resolve = resolve; });
    // Automatic playback respects reduced motion. Replay is an explicit
    // request to watch the committed flight, including its verdict beat.
    if (this.renderer.reduced && !replay) this.showVerdict();
    else {
      this.canvas.dataset.flightTime = '0';
      this.setPhase('flight');
      this.renderer.render(this.clock);
    }
    return done;
  }
  showVerdict() {
    this.renderer.motionTime = this.renderer.motion.duration;
    this.renderer.shake = 0;
    this.renderer.netHit = null;
    this.renderer.verdict = this.verdict;
    this.verdictAt = this.clock;
    this.setPhase('verdict');
    this.renderer.render(this.clock);
  }
  loop(now) {
    const dt = clamp((now - this.previous) / 1000, 0, 0.05);
    this.previous = now;
    if (!document.hidden) this.clock += dt;
    if (this.phase === 'charging') {
      const held = Math.min((this.clock - this.chargeAt) / 1.2, 1);
      this.power = Math.round(100 + 900 * (0.5 - 0.5 * Math.cos(held * Math.PI)));
      this.sync();
    }
    const r = this.renderer;
    if (this.phase === 'flight') {
      r.motionTime = (this.clock - this.motionAt) * this.speed;
      this.canvas.dataset.flightTime = String(r.motionTime);
      const net = r.motion.events.find(event => event.type === 'net');
      if (net && !this.netPlayed && r.motionTime >= net.t) {
        r.netHit = { at: this.clock, x: net.x, y: net.y };
        this.netPlayed = true;
      }
      if (r.motionTime >= r.motion.duration) {
        this.showVerdict();
      }
    }
    if (this.phase === 'verdict' && this.clock - this.verdictAt >= 1.2) {
      r.verdict = '';
      delete this.canvas.dataset.verdict;
      this.setPhase('settled');
      this.resolve?.();
      this.resolve = null;
    }
    if (!document.hidden) r.render(this.clock);
    this.frame = requestAnimationFrame(t => this.loop(t));
  }
  destroy() {
    this.abort.abort();
    cancelAnimationFrame(this.frame);
    this.renderer.destroy();
    this.resolve?.();
  }
}
