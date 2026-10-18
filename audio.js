import { timing } from "./core.js";
export class MorseAudio {
  constructor() {
    this.epoch = 0;
    this.context = null;
    this.nodes = [];
    this.timers = [];
    this.finish = null;
    this.live = null;
  }
  async init() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("This browser does not support audio. Try an up-to-date Chrome, Edge, Firefox, or Safari.");
    if (!this.context) this.context = new Audio();
    await this.context.resume();
    if (this.context.state !== "running") throw new Error("Audio is blocked. Tap Play again to enable sound.");
    return this.context;
  }
  stop() {
    this.epoch++;
    this.nodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    this.nodes = [];
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.finish) {
      this.finish(false);
      this.finish = null;
    }
  }
  tone(context, start, duration, settings) {
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = settings.tone;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(settings.volume, start + 0.004);
    gain.gain.setValueAtTime(settings.volume, start + Math.max(0.004, duration - 0.006));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    this.nodes.push(oscillator);
  }
  async play(text, settings, onMark = () => {}) {
    this.stop();
    const epoch = this.epoch;
    const ctx = await this.init();
    if (epoch !== this.epoch) return false;
    const schedule = timing(text, settings.wpm, settings.gap);
    const base = ctx.currentTime + 0.06;
    return new Promise((resolve) => {
      this.finish = resolve;
      schedule.events.forEach((ev, i) => {
        this.tone(ctx, base + ev.start, ev.duration, settings);
        this.timers.push(
          setTimeout(() => onMark(i, true, ev), 60 + ev.start * 1000),
          setTimeout(() => onMark(i, false, ev), 60 + (ev.start + ev.duration) * 1000),
        );
      });
      this.timers.push(
        setTimeout(
          () => {
            this.finish = null;
            this.nodes = [];
            this.timers = [];
            resolve(true);
          },
          80 + schedule.duration * 1000,
        ),
      );
    });
  }
  async keyDown(settings) {
    if (this.live) return;
    const ctx = await this.init();
    if (this.live) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.frequency.value = settings.tone;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(settings.volume, ctx.currentTime + 0.005);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    this.live = { oscillator, gain };
    this.liveTimer = setTimeout(() => this.keyUp(), 3000);
  }
  keyUp() {
    clearTimeout(this.liveTimer);
    if (!this.live) return;
    const { oscillator, gain } = this.live;
    this.live = null;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.005);
    oscillator.stop(now + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
