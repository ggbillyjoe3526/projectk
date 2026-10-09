import { describe, expect, it } from 'vitest';
import { bayer4, internalResolution, quantizeChannel } from './retroMath';

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
});
