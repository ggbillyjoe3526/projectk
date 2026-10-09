import type { CombatEvent } from '../sim/combat/encounter';
import { filter, gain, noiseBuffer } from './islandHum';

/**
 * The fight's sounds, synthesised until recordings replace them (concept v0.6 section 9): the whoosh of a swing, the
 * dull blow on dead flesh, the bright ring of old iron on a perfect deflect, a duller clank on a guard, the groan of a
 * wind-up (the ear's telegraph, as the raised arm is the eye's), the swell of the dead rising, and the Rite's low
 * chord. Each event plays once; nothing loops.
 */
export class CombatSounds {
  private readonly noise: AudioBuffer;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {
    this.noise = noiseBuffer(ctx, 1);
  }

  play(e: CombatEvent): void {
    switch (e.kind) {
      case 'swing':
        return this.whoosh(e.heavy ? 0.32 : 0.18, e.heavy ? 0.5 : 0.3);
      case 'charged':
        return this.tone(330, 660, 0.25, 0.08, 'triangle');
      case 'hit':
        this.thump(e.heavy ? 70 : 95, e.heavy ? 0.7 : 0.45);
        return this.crack(e.weapon === 'knife' ? 3200 : 1800, 0.12, 0.25);
      case 'perfectDeflect':
        return this.ring(520, 1.6, 0.5);
      case 'guard':
        return this.ring(310, 0.35, 0.3);
      case 'hurt':
        this.thump(60, 0.8);
        return this.crack(900, 0.2, 0.2);
      case 'step':
        return this.whoosh(0.14, 0.12, 700);
      case 'enemyNotice':
        return this.groan(0.6, 0.18, 220);
      case 'enemyWindup':
        return this.groan(0.45, 0.22, 330);
      case 'feint':
        return this.groan(0.25, 0.12, 180);
      case 'enemyBroken':
        return this.crack(600, 0.5, 0.35);
      case 'enemyDown':
        return this.thump(50, 0.6);
      case 'enemyRise':
        return this.swell(55, 2.2, 0.35);
      case 'riteBegin':
        return this.chord([110, 164.8, 220], 1.4, 0.12);
      case 'rested':
        return this.chord(e.rite ? [220, 277.2, 329.6, 440] : [196, 246.9, 293.7], 3.2, 0.14);
      case 'playerBroken':
        return this.swell(40, 1.5, 0.4);
      case 'playerRecovered':
        return this.tone(220, 330, 0.6, 0.06, 'sine');
      case 'playerDead':
        return this.swell(35, 3, 0.5);
    }
  }

  private envelope(peak: number, attack: number, length: number): GainNode {
    const t = this.ctx.currentTime;
    const g = gain(this.ctx, 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    g.connect(this.out);
    return g;
  }

  private burst(length: number): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.start(this.ctx.currentTime, Math.random() * 0.5, length);
    return src;
  }

  private osc(type: OscillatorType, f: number, length: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start();
    o.stop(this.ctx.currentTime + length + 0.05);
    return o;
  }

  private whoosh(length: number, peak: number, from = 400): void {
    const t = this.ctx.currentTime;
    const bp = filter(this.ctx, 'bandpass', from, 1.2);
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(from * 6, t + length);
    this.burst(length).connect(bp).connect(this.envelope(peak, length * 0.4, length));
  }

  private thump(f: number, peak: number): void {
    const t = this.ctx.currentTime;
    const o = this.osc('sine', f * 2, 0.35);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3);
    o.connect(this.envelope(peak, 0.004, 0.35));
  }

  private crack(f: number, length: number, peak: number): void {
    this.burst(length).connect(filter(this.ctx, 'bandpass', f, 0.8)).connect(this.envelope(peak, 0.002, length));
  }

  /** Struck iron: inharmonic partials that ring and fade. */
  private ring(f: number, length: number, peak: number): void {
    const partials = [
      [1, 1],
      [2.76, 0.5],
      [5.4, 0.25],
      [8.93, 0.12],
    ] as const;
    for (const [k, a] of partials) this.osc('sine', f * k, length).connect(this.envelope(peak * a, 0.002, length / Math.sqrt(k)));
    this.crack(4000, 0.05, peak * 0.4);
  }

  /** A breathy groan: noise through a vowel-like band. */
  private groan(length: number, peak: number, f: number): void {
    const t = this.ctx.currentTime;
    const bp = filter(this.ctx, 'bandpass', f, 5);
    bp.frequency.setValueAtTime(f, t);
    bp.frequency.linearRampToValueAtTime(f * 1.6, t + length);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.start(t);
    src.stop(t + length + 0.05);
    src.connect(bp).connect(this.envelope(peak, length * 0.3, length));
  }

  private swell(f: number, length: number, peak: number): void {
    const t = this.ctx.currentTime;
    const g = gain(this.ctx, 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + length * 0.7);
    g.gain.linearRampToValueAtTime(0, t + length);
    g.connect(this.out);
    for (const k of [1, 1.5, 2.02]) this.osc('sawtooth', f * k, length).connect(filter(this.ctx, 'lowpass', 300, 0.7)).connect(g);
  }

  private chord(fs: readonly number[], length: number, peak: number): void {
    const t = this.ctx.currentTime;
    const g = gain(this.ctx, 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + length * 0.35);
    g.gain.linearRampToValueAtTime(0, t + length);
    g.connect(this.out);
    for (const f of fs) this.osc('sine', f, length).connect(g);
  }

  private tone(from: number, to: number, length: number, peak: number, type: OscillatorType): void {
    const o = this.osc(type, from, length);
    o.frequency.exponentialRampToValueAtTime(to, this.ctx.currentTime + length);
    o.connect(this.envelope(peak, 0.01, length));
  }
}
