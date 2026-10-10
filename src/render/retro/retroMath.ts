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

const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

/**
 * The low-Resolve haar grade of one sRGB colour, `mono` 0 (untouched) to 1 (full): a cold, harder grey, except where
 * the colour is plainly red (blood, danger), which keeps it, deepened. retroPipeline.ts does the same sum per pixel.
 */
export function haarGrade(r: number, g: number, b: number, mono: number): [number, number, number] {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const haar = [luma * 0.94, luma, luma].map((v) => (v - 0.5) * 1.2 + 0.5) as [number, number, number];
  const gb = Math.max(g, b);
  const red = smoothstep(0.16, 0.3, r - gb) * smoothstep(0.1, 0.25, r) * (1 - smoothstep(0.26, 0.38, gb / Math.max(r, 1e-3))) * (1 - smoothstep(0.05, 0.14, g - b));
  const tinted = [r * 1.2, g * 0.5, b * 0.45];
  const rgb = [r, g, b];
  return [0, 1, 2].map((i) => mix(rgb[i]!, mix(haar[i]!, mix(haar[i]!, tinted[i]!, 0.92), red), mono)) as [number, number, number];
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
