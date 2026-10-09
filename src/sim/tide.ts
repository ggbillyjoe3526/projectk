/**
 * The tide model. Pure and deterministic: every value is a function of the
 * tide clock (seconds of island time), so the simulation, the hum, the water
 * surface and tests all agree on what the sea is doing.
 *
 * The tide is a cosine: low water at t = 0, high water at half a cycle.
 */

import { DEFAULT_TIDE, type TideConfig } from '../config/tide';

export type TidePhase = 'low' | 'rising' | 'high' | 'falling';

/** Position in the cycle, 0..1 (0 = low water, 0.5 = high water). */
export function tideCyclePosition(t: number, cfg: TideConfig = DEFAULT_TIDE): number {
  const p = (t / cfg.cycleSeconds) % 1;
  return p < 0 ? p + 1 : p;
}

/** 0 at low water, 1 at high water. */
export function tideFill(t: number, cfg: TideConfig = DEFAULT_TIDE): number {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * tideCyclePosition(t, cfg));
}

export function tideLevel(t: number, cfg: TideConfig = DEFAULT_TIDE): number {
  return cfg.lowLevel + (cfg.highLevel - cfg.lowLevel) * tideFill(t, cfg);
}

/** Normalised rate of change, -1..1 (positive while rising). */
export function tideRate(t: number, cfg: TideConfig = DEFAULT_TIDE): number {
  return Math.sin(2 * Math.PI * tideCyclePosition(t, cfg));
}

export function tidePhase(t: number, cfg: TideConfig = DEFAULT_TIDE): TidePhase {
  const p = tideCyclePosition(t, cfg);
  const s = cfg.slackFraction;
  if (p < s || p > 1 - s) return 'low';
  if (Math.abs(p - 0.5) < s) return 'high';
  return p < 0.5 ? 'rising' : 'falling';
}

/** Water depth over the causeway (0 when it's dry). */
export function causewayDepth(t: number, cfg: TideConfig = DEFAULT_TIDE): number {
  return Math.max(0, tideLevel(t, cfg) - cfg.causewayTop);
}

export function causewayPassable(t: number, cfg: TideConfig = DEFAULT_TIDE): boolean {
  return causewayDepth(t, cfg) <= cfg.maxWadeDepth;
}

/**
 * What the island's hum feels like (concept §3.1 "Reading the tide").
 * Consumed by the audio hum, the visual tremor and the character's hand.
 */
export interface HumParams {
  /** Beats per second of the swell pulse through the rock. */
  readonly beatHz: number;
  /** Overall intensity of the pulse, 0..1. */
  readonly strength: number;
  /** Heavy grinding pressure near high water, 0..1. */
  readonly grind: number;
  /** The hiss of water drawing back between beats while falling, 0..1. */
  readonly drawBack: number;
}

export function humParams(t: number, cfg: TideConfig = DEFAULT_TIDE): HumParams {
  const fill = tideFill(t, cfg);
  const rate = tideRate(t, cfg);
  const rising = rate > 0;
  const strength = 0.04 + 0.86 * Math.pow(fill, 1.2) * (rising ? 1 : 0.7);
  const beatHz = 0.18 + 0.95 * fill * (rising ? 1 : 0.55);
  const grind = smooth(0.78, 1, fill);
  const drawBack = rising ? 0.1 : 0.35 + 0.65 * -rate;
  return { beatHz, strength, grind, drawBack };
}

function smooth(e0: number, e1: number, x: number): number {
  const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
}
