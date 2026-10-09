import type { Box2 } from './world/types';

/** Push a circle out of every box it overlaps. Mutates `pos`; no allocation. */
export function resolveCircleVsBoxes(pos: { x: number; z: number }, radius: number, boxes: readonly Box2[]): void {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]!;
    const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-10) {
      const d = Math.sqrt(d2);
      pos.x = cx + (dx / d) * radius;
      pos.z = cz + (dz / d) * radius;
    } else {
      // Centre is inside the box: leave by the nearest face.
      const left = pos.x - b.minX, right = b.maxX - pos.x, top = pos.z - b.minZ, bottom = b.maxZ - pos.z;
      const m = Math.min(left, right, top, bottom);
      if (m === left) pos.x = b.minX - radius;
      else if (m === right) pos.x = b.maxX + radius;
      else if (m === top) pos.z = b.minZ - radius;
      else pos.z = b.maxZ + radius;
    }
  }
}
