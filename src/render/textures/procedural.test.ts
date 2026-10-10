import { describe, expect, it } from 'vitest';
import { boards, fbm, flagstones, plaster, rubble, rug, slates, valueNoise, voronoi } from './procedural';

describe('procedural textures', () => {
  it('noise tiles: the same at both edges of the square', () => {
    for (const v of [0, 0.31, 0.77]) {
      expect(valueNoise(0, v, 8, 3)).toBeCloseTo(valueNoise(1, v, 8, 3), 9);
      expect(fbm(v, 0, 4, 4, 5)).toBeCloseTo(fbm(v, 1, 4, 4, 5), 9);
      expect(voronoi(0.0001, v, 3, 4, 2).cell).toBe(voronoi(1.0001, v, 3, 4, 2).cell);
    }
  });

  it('noise stays in 0..1 and varies', () => {
    const samples = Array.from({ length: 200 }, (_, i) => fbm((i * 0.137) % 1, (i * 0.071) % 1, 4, 4, 1));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
  });

  it('makes every surface the same way from the same seed, and differently from another', () => {
    for (const make of [flagstones, plaster, rubble, slates, rug, (n: number, s: number) => boards(n, s)]) {
      const a = make(32, 4);
      expect(a.albedo).toHaveLength(32 * 32 * 4);
      expect(make(32, 4).albedo).toEqual(a.albedo);
      expect(make(32, 5).albedo).not.toEqual(a.albedo);
    }
  });

  it('derives unit normals pointing out of the surface', () => {
    const t = flagstones(128, 1);
    for (let i = 0; i < t.normal.length; i += 4 * 37) {
      const [x, y, z] = [t.normal[i]!, t.normal[i + 1]!, t.normal[i + 2]!].map((c) => c / 127.5 - 1);
      expect(Math.hypot(x!, y!, z!)).toBeCloseTo(1, 1);
      expect(z).toBeGreaterThan(0.3);
    }
  });
});
