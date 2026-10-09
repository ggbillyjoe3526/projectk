/** The tide's tuning (sim/tide.ts reads it; concept v0.6 section 3.1). */

export interface TideConfig {
  /** Real seconds for one full low → high → low cycle (concept §3.1: ~25 min). */
  readonly cycleSeconds: number;
  /** Water level at low water, in metres. */
  readonly lowLevel: number;
  /** Water level at high water, in metres. */
  readonly highLevel: number;
  /** Height of the causeway's walking surface. */
  readonly causewayTop: number;
  /** Deepest water a person can still wade through. */
  readonly maxWadeDepth: number;
  /** Fraction of the cycle either side of high/low water treated as slack. */
  readonly slackFraction: number;
}

export const DEFAULT_TIDE: TideConfig = {
  cycleSeconds: 1500,
  lowLevel: -0.4,
  highLevel: 2.6,
  causewayTop: 0.15,
  maxWadeDepth: 0.45,
  slackFraction: 0.06,
};
