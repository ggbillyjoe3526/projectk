import type { HumParams } from '../sim/tide';

/**
 * Synthesised placeholder for the island's soundscape (concept §9):
 * wind and rain beds, and the hum through the rock, layered so it reads on
 * headphones (sub-bass) and on laptop speakers (mid harmonics).
 * Real recordings replace the sources later; the mix logic stays.
 */
export class IslandHum {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly bed: GainNode;
  private readonly bedFilter: BiquadFilterNode;
  private readonly hum: GainNode;
  private readonly grind: GainNode;
  private readonly hiss: GainNode;

  constructor() {
    this.ctx = new AudioContext();
    const ctx = this.ctx;
    this.master = gain(ctx, 0.9);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 12;
    this.master.connect(limiter).connect(ctx.destination);

    const noise = noiseBuffer(ctx, 4);

    // Rain and wind bed.
    this.bed = gain(ctx, 0.5);
    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.value = 9000;
    this.bed.connect(this.bedFilter).connect(this.master);
    const rain = loop(ctx, noise);
    rain.connect(filter(ctx, 'bandpass', 2400, 0.4)).connect(gain(ctx, 0.16)).connect(this.bed);
    const wind = loop(ctx, noise, 0.37);
    const windGain = gain(ctx, 0.22);
    wind.connect(filter(ctx, 'lowpass', 380, 0.9)).connect(windGain).connect(this.bed);
    const gust = ctx.createOscillator();
    gust.frequency.value = 0.07;
    const gustDepth = gain(ctx, 0.12);
    gust.connect(gustDepth).connect(windGain.gain);
    gust.start();

    // The hum: sub-bass fundamental plus harmonics small speakers can play.
    this.hum = gain(ctx, 0);
    this.hum.connect(this.master);
    for (const [f, a, type] of [[44, 0.9, 'sine'], [88, 0.45, 'sine'], [132, 0.22, 'triangle'], [176, 0.12, 'sine']] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(gain(ctx, a)).connect(this.hum);
      o.start();
    }
    // High-water grind: low rumbling noise.
    this.grind = gain(ctx, 0);
    loop(ctx, noise, 0.61).connect(filter(ctx, 'lowpass', 160, 1.2)).connect(this.grind).connect(this.master);
    // The draw-back hiss of water through shingle.
    this.hiss = gain(ctx, 0);
    loop(ctx, noise, 0.83).connect(filter(ctx, 'highpass', 2600, 0.5)).connect(this.hiss).connect(this.master);
  }

  resume(): Promise<void> {
    return this.ctx.resume();
  }

  /**
   * Per frame. `beat` and `hiss` come from HumClock; `clarity` is how well the
   * ground carries the sound here; `listening` brings the hum forward and
   * ducks the weather; `indoors` muffles the rain.
   */
  update(p: HumParams, beat: number, hiss: number, clarity: number, listening: boolean, indoors: boolean): void {
    const t = this.ctx.currentTime;
    const focus = listening ? 1 : 0.22;
    set(this.hum.gain, p.strength * (0.12 + 0.88 * beat) * clarity * focus * 0.9, t, 0.015);
    set(this.grind.gain, p.grind * p.strength * clarity * focus * 0.5, t, 0.1);
    set(this.hiss.gain, hiss * clarity * focus * 0.18, t, 0.05);
    set(this.bed.gain, listening ? 0.12 : 0.5, t, 0.25);
    set(this.bedFilter.frequency, indoors ? 700 : 9000, t, 0.2);
  }
}

function set(param: AudioParam, value: number, t: number, tc: number): void {
  param.setTargetAtTime(value, t, tc);
}
function gain(ctx: AudioContext, v: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}
function filter(ctx: AudioContext, type: BiquadFilterType, f: number, q: number): BiquadFilterNode {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}
function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 22222;
  for (let i = 0; i < d.length; i++) {
    s = (s * 16807) % 2147483647;
    d[i] = (s / 2147483647) * 2 - 1;
  }
  return b;
}
function loop(ctx: AudioContext, buffer: AudioBuffer, offset = 0): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start(0, offset * buffer.duration);
  return src;
}
