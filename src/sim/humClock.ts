import type { HumParams } from './tide';

/**
 * The island's pulse as a running clock, so the sound, the trembling pebbles,
 * the puddle ripples and the character's hand all beat together. The phase
 * integrates the beat rate, so changing tempo never causes a jump.
 */
export class HumClock {
  phase = 0;

  advance(params: HumParams, dt: number): void {
    this.phase = (this.phase + params.beatHz * dt) % 1;
  }

  /** The thump: sharp attack then decay, 0..1. */
  beat(): number {
    return Math.exp(-7 * this.phase);
  }

  /** Water drawing back between beats, 0..1 (scaled by drawBack). */
  hiss(params: HumParams): number {
    const f = this.phase;
    const k = Math.min(1, Math.max(0, (f - 0.35) / 0.4));
    return params.drawBack * k * (1 - f) * 2;
  }
}

/** How clearly the hum reads where the player is (concept: rock > causeway > wood floors). */
export function listeningClarity(nearPost: boolean, indoors: boolean, groundKind: string): number {
  if (nearPost) return 1;
  if (indoors) return 0.25;
  if (groundKind === 'causeway') return 0.75;
  return 0.55;
}
