/**
 * Procedural surface textures, made in code at load time so nothing in the game is a scanned or licensed image (art
 * direction round 3, William 2026-10-10: everything original). A port of the ideas in the concept tool's texgen.py:
 * tileable fractal noise and Voronoi cells, shaped into stone, lime plaster, boards and slate. Each texture is a height
 * field and a colour; the normal map comes from the height. Pure and deterministic: the same seed gives the same pixels.
 */

/** One generated surface: square, `size` texels a side, tiling in both directions. */
export interface SurfaceTexels {
  readonly size: number;
  /** RGBA, sRGB colour. */
  readonly albedo: Uint8Array;
  /** RGBA, tangent-space normal (x, y, z in 0..255) with roughness in alpha. */
  readonly normal: Uint8Array;
}

/** A small, fast seeded hash of two lattice coordinates to 0..1. */
function hash(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const wrap = (i: number, period: number): number => ((i % period) + period) % period;
const fade = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number): number => fade(clamp01((x - a) / (b - a)));

/** Value noise on a lattice of `period` cells across the unit square, so it tiles at u, v = 0 and 1. */
export function valueNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period;
  const y = v * period;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const x0 = wrap(ix, period);
  const x1 = wrap(ix + 1, period);
  const y0 = wrap(iy, period);
  const y1 = wrap(iy + 1, period);
  return lerp(lerp(hash(x0, y0, seed), hash(x1, y0, seed), fx), lerp(hash(x0, y1, seed), hash(x1, y1, seed), fx), fy);
}

/** Fractal noise: `octaves` of value noise from `period` cells up, each half as strong, normalised to 0..1. */
export function fbm(u: number, v: number, period: number, octaves: number, seed: number, gain = 0.5): number {
  let sum = 0;
  let weight = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(u, v, period << o, seed + o * 101) * weight;
    total += weight;
    weight *= gain;
  }
  return sum / total;
}

/** Tileable Voronoi with one jittered point per cell of a `cellsX` × `cellsY` grid: the nearest cell and edge distance. */
export function voronoi(u: number, v: number, cellsX: number, cellsY: number, seed: number): { cell: number; f1: number; edge: number } {
  const x = u * cellsX;
  const y = v * cellsY;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  let cell = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = wrap(cx + i, cellsX);
      const gy = wrap(cy + j, cellsY);
      const px = cx + i + 0.15 + 0.7 * hash(gx, gy, seed);
      const py = cy + j + 0.15 + 0.7 * hash(gx, gy, seed + 7);
      const d = Math.hypot((px - x) / cellsX, (py - y) / cellsY) * Math.max(cellsX, cellsY);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        cell = gy * cellsX + gx;
      } else if (d < f2) f2 = d;
    }
  }
  return { cell, f1, edge: f2 - f1 };
}

type Rgb = readonly [number, number, number];

export function hexRgb(hex: number): Rgb {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/** Per texel: height (0..1), colour (0..1 sRGB) and roughness (0..1). */
type Painter = (u: number, v: number) => { height: number; color: Rgb; rough: number };

/**
 * Run a painter over the square and derive the normals from its heights. `bumpiness` scales the slopes as they would be
 * at 256 texels a side, so a smaller texture of the same surface is no steeper.
 */
export function paint(size: number, bumpiness: number, painter: Painter): SurfaceTexels {
  const height = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = painter((x + 0.5) / size, (y + 0.5) / size);
      const i = y * size + x;
      height[i] = t.height;
      albedo[i * 4] = Math.round(clamp01(t.color[0]) * 255);
      albedo[i * 4 + 1] = Math.round(clamp01(t.color[1]) * 255);
      albedo[i * 4 + 2] = Math.round(clamp01(t.color[2]) * 255);
      albedo[i * 4 + 3] = 255;
      normal[i * 4 + 3] = Math.round(clamp01(t.rough) * 255);
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = (xx: number, yy: number): number => height[wrap(yy, size) * size + wrap(xx, size)]!;
      const k = (bumpiness * size) / 256;
      const dx = (h(x + 1, y) - h(x - 1, y)) * k;
      const dy = (h(x, y + 1) - h(x, y - 1)) * k;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = Math.round((-dx / l) * 127.5 + 127.5);
      normal[i + 1] = Math.round((dy / l) * 127.5 + 127.5);
      normal[i + 2] = Math.round((1 / l) * 127.5 + 127.5);
    }
  }
  return { size, albedo, normal };
}

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const shade = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];

/** Worn flagstones: irregular slabs with dark, sunken joints, each slab its own tone, gritty and scuffed. */
export function flagstones(size: number, seed: number): SurfaceTexels {
  const base = hexRgb(0x5b5850);
  const warm = hexRgb(0x6a6052);
  const joint = hexRgb(0x1c1a17);
  return paint(size, 5, (u, v) => {
    const c = voronoi(u, v, 3, 4, seed);
    const tone = hash(c.cell, 3, seed);
    const grit = fbm(u, v, 16, 3, seed + 1);
    const wear = fbm(u, v, 4, 3, seed + 2);
    const inJoint = 1 - smooth(0.02, 0.07, c.edge);
    const stone = shade(mixRgb(base, warm, tone), 0.78 + 0.3 * grit + 0.15 * wear);
    return {
      height: (1 - inJoint) * (0.75 + 0.2 * grit + 0.05 * tone),
      color: mixRgb(stone, joint, inJoint),
      rough: 0.82 + 0.15 * inJoint - 0.2 * wear * (1 - inJoint),
    };
  });
}

/** Lime-washed plaster: off-white, uneven, stained low down and round the edges with damp and smoke. */
export function plaster(size: number, seed: number): SurfaceTexels {
  const lime = hexRgb(0xc9c3b2);
  const stain = hexRgb(0x7a6c58);
  return paint(size, 2.5, (u, v) => {
    const lumps = fbm(u, v, 3, 4, seed);
    const grain = fbm(u, v, 32, 2, seed + 3);
    const damp = smooth(0.5, 0.8, fbm(u, v, 2, 4, seed + 5));
    return { height: 0.6 * lumps + 0.4 * grain, color: shade(mixRgb(lime, stain, damp * 0.55), 0.86 + 0.18 * grain), rough: 0.92 };
  });
}

/** Old boards: `planks` across the tile, each a different tone, with grain, knots and dark seams. */
export function boards(size: number, seed: number, planks = 5, light = 0x5a4130, dark = 0x2e2018): SurfaceTexels {
  const a = hexRgb(light);
  const b = hexRgb(dark);
  return paint(size, 3, (u, v) => {
    const p = Math.floor(v * planks);
    const across = v * planks - p;
    const tone = hash(p, 11, seed);
    // Grain: noise stretched along the board, offset per plank.
    const grain = fbm(u + tone, across / planks + p * 0.37, 4, 4, seed + p);
    const streak = 0.5 + 0.5 * Math.sin((grain * 9 + across * 2) * Math.PI);
    const seam = 1 - smooth(0.0, 0.06, Math.min(across, 1 - across));
    const wood = mixRgb(a, b, 0.25 + 0.45 * tone + 0.3 * streak);
    return { height: (1 - seam) * (0.7 + 0.3 * streak), color: mixRgb(wood, shade(b, 0.4), seam), rough: 0.75 + 0.2 * seam };
  });
}

/** Rubble masonry: rounded field stones set in pale lime mortar (the hearth surround, the cottage's outside). */
export function rubble(size: number, seed: number, mortarHex = 0x8e887a): SurfaceTexels {
  const greys = [hexRgb(0x58564f), hexRgb(0x6d685c), hexRgb(0x4a4b47), hexRgb(0x7a7466)];
  const mortar = hexRgb(mortarHex);
  return paint(size, 6, (u, v) => {
    const c = voronoi(u, v, 5, 7, seed);
    const stone = greys[Math.floor(hash(c.cell, 5, seed) * greys.length)]!;
    const grit = fbm(u, v, 16, 3, seed + 9);
    const bulge = smooth(0.0, 0.18, c.edge);
    const inMortar = 1 - smooth(0.03, 0.09, c.edge);
    return {
      height: (1 - inMortar) * (0.5 + 0.5 * bulge) + 0.1 * grit,
      color: mixRgb(shade(stone, 0.8 + 0.35 * grit), shade(mortar, 0.85 + 0.2 * grit), inMortar),
      rough: 0.9,
    };
  });
}

/** Welsh-style slates in staggered rows, dark and slightly blue, each one a little different. */
export function slates(size: number, seed: number, rows = 8, across = 4): SurfaceTexels {
  const slate = hexRgb(0x2f3236);
  const blue = hexRgb(0x2b3340);
  return paint(size, 4, (u, v) => {
    const row = Math.floor(v * rows);
    const shifted = u * across + (row % 2) * 0.5;
    const col = Math.floor(shifted);
    const tone = hash(wrap(col, across), row, seed);
    const inRow = v * rows - row;
    const gap = 1 - smooth(0.0, 0.05, Math.min(shifted - col, 1 - (shifted - col)));
    const lip = smooth(0.85, 1, inRow);
    const grit = fbm(u, v, 16, 2, seed + 4);
    return {
      height: (1 - gap) * (0.4 + 0.6 * inRow) * (1 - 0.6 * lip),
      color: shade(mixRgb(slate, blue, tone), (0.75 + 0.3 * grit) * (1 - 0.6 * gap)),
      rough: 0.55 + 0.3 * grit,
    };
  });
}

/** A coarse wool rug: a faded two-colour check in a visible weave. */
export function rug(size: number, seed: number): SurfaceTexels {
  const red = hexRgb(0x5c2a22);
  const green = hexRgb(0x2c3a2c);
  const cream = hexRgb(0x8a7c62);
  return paint(size, 1.5, (u, v) => {
    const tx = Math.floor(u * 64);
    const ty = Math.floor(v * 64);
    const warp = (tx + ty) % 2 === 0;
    const checkU = Math.floor(u * 4) % 2;
    const checkV = Math.floor(v * 4) % 2;
    const stripe = (Math.floor(u * 16) % 4 === 0 ? 1 : 0) | (Math.floor(v * 16) % 4 === 0 ? 1 : 0);
    const thread = stripe ? cream : checkU === checkV ? red : green;
    const fade = fbm(u, v, 3, 3, seed);
    return { height: warp ? 0.7 : 0.4, color: shade(thread, (warp ? 1 : 0.82) * (0.75 + 0.35 * fade)), rough: 0.95 };
  });
}
