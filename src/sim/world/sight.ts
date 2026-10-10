import type { Box2 } from './types';

/**
 * Whether the straight line from (ax, az) to (bx, bz) is clear of every box (seen from above: walls block sight
 * whatever their height). Used for keeping something in view, such as the coffin on the vigil night.
 */
export function clearSight(boxes: readonly Box2[], ax: number, az: number, bx: number, bz: number): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  for (const b of boxes) {
    // Slab test: where the segment enters and leaves the box along each axis, as fractions of its length.
    let t0 = 0;
    let t1 = 1;
    for (const [d, a, lo, hi] of [[dx, ax, b.minX, b.maxX], [dz, az, b.minZ, b.maxZ]] as const) {
      if (Math.abs(d) < 1e-9) {
        if (a <= lo || a >= hi) t1 = -1;
        continue;
      }
      let ta = (lo - a) / d;
      let tb = (hi - a) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
    }
    if (t0 < t1) return false;
  }
  return true;
}
