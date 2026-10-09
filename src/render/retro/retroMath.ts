/**
 * Pure maths behind the PS1-style look, mirrored exactly by the TSL nodes in
 * retroPipeline.ts so it can be unit-tested without a GPU. (Port of the ideas
 * in Airsoft's retroFilter: low-res target sizing, 4×4 Bayer threshold,
 * per-channel quantisation.)
 */

/** 2×2 Bayer threshold via the fract() formulation used in the shader. */
export function bayer2(x: number, y: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const v = fx * 0.5 + fy * fy * 0.75;
  return v - Math.floor(v);
}

/** 4×4 Bayer threshold in [0, 1), 16 distinct levels. */
export function bayer4(x: number, y: number): number {
  return bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
}

/** Ordered-dither quantisation of one channel (0..1) to `levels` steps. */
export function quantizeChannel(c: number, levels: number, threshold: number): number {
  const n = levels - 1;
  return Math.min(1, Math.max(0, Math.floor(c * n + threshold) / n));
}

/**
 * Internal render size: a fixed pixel height (the game's "resolution"),
 * width following the window's aspect, rounded to even numbers.
 */
export function internalResolution(viewWidth: number, viewHeight: number, targetHeight: number): { width: number; height: number } {
  const aspect = viewWidth > 0 && viewHeight > 0 ? viewWidth / viewHeight : 16 / 9;
  const height = Math.max(2, Math.round(targetHeight / 2) * 2);
  const width = Math.max(2, Math.round((height * aspect) / 2) * 2);
  return { width, height };
}
