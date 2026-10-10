import { filter, gain, noiseBuffer } from './islandHum';

/**
 * The ferry's sounds (chapter 1), synthesised like the island's: the engine's drone under the deck, which fades as
 * William walks away from it, and the horn as it comes in. Played into the island's mix.
 */
export class FerrySounds {
  private readonly engine: GainNode;

  constructor(private readonly ctx: AudioContext, private readonly bus: AudioNode) {
    this.engine = gain(ctx, 0);
    this.engine.connect(bus);
    const rumble = ctx.createBufferSource();
    rumble.buffer = noiseBuffer(ctx, 3);
    rumble.loop = true;
    rumble.connect(filter(ctx, 'lowpass', 110, 1.4)).connect(gain(ctx, 0.5)).connect(this.engine);
    rumble.start();
    for (const [f, a] of [[47, 0.35], [94, 0.12]] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(gain(ctx, a)).connect(this.engine);
      o.start();
    }
  }

  /** The engine's loudness here, 0..1 (under way and aboard is 1; tied up, or heard from the pier, less). */
  setEngine(level: number): void {
    this.engine.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.45, this.ctx.currentTime, 0.4);
  }

  /** The ship's horn: two low notes together, a long blast. */
  horn(): void {
    const t = this.ctx.currentTime;
    const env = gain(this.ctx, 0);
    env.connect(filter(this.ctx, 'lowpass', 900, 0.8)).connect(this.bus);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.32, t + 0.25);
    env.gain.setValueAtTime(0.32, t + 2.2);
    env.gain.linearRampToValueAtTime(0, t + 3.0);
    for (const f of [110, 138.6]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(env);
      o.start(t);
      o.stop(t + 3.1);
    }
  }
}
