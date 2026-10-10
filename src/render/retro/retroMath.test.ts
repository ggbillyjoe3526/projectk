import { describe, expect, it } from 'vitest';
import { bayer4, haarGrade, internalResolution, quantizeChannel } from './retroMath';

describe('retro maths', () => {
  it('bayer4 covers 16 distinct thresholds in each 4×4 tile and repeats', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(Math.round(bayer4(x, y) * 16));
    expect(seen.size).toBe(16);
    expect([...seen].every((v) => v >= 0 && v < 16)).toBe(true);
    expect(bayer4(5, 6)).toBe(bayer4(1, 2));
  });

  it('dithered quantisation averages back to the input', () => {
    for (const c of [0.1, 0.33, 0.5, 0.77]) {
      let sum = 0;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) sum += quantizeChannel(c, 8, bayer4(x, y));
      expect(sum / 16).toBeCloseTo(c, 1);
    }
  });

  it('keeps pure black and white', () => {
    expect(quantizeChannel(0, 32, 0.99)).toBe(0);
    expect(quantizeChannel(1, 32, 0)).toBe(1);
  });

  it('sizes the internal target from the window aspect', () => {
    expect(internalResolution(1920, 1080, 270)).toEqual({ width: 480, height: 270 });
    expect(internalResolution(2560, 1080, 270)).toEqual({ width: 640, height: 270 });
    expect(internalResolution(0, 0, 270)).toEqual({ width: 480, height: 270 });
  });

  it('the low-Resolve grade drains everything to grey but red', () => {
    const grey = (c: number[]) => Math.max(...c) - Math.min(...c) < 0.05;
    // Untouched at zero.
    expect(haarGrade(0.2, 0.6, 0.3, 0)).toEqual([0.2, 0.6, 0.3]);
    // Moss, sea, a sodium lamp and skin all go grey.
    for (const c of [[0.2, 0.45, 0.2], [0.15, 0.3, 0.4], [0.95, 0.6, 0.2], [0.8, 0.6, 0.5]] as const) expect(grey(haarGrade(c[0], c[1], c[2], 1))).toBe(true);
    // Blood stays red.
    const [r, g, b] = haarGrade(0.6, 0.08, 0.07, 1);
    expect(r).toBeGreaterThan(0.6);
    expect(Math.max(g, b)).toBeLessThan(0.1);
  });
});
