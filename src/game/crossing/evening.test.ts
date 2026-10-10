import { describe, expect, it } from 'vitest';
import { DEPARTURE_SECONDS, VOYAGE_SECONDS } from '../../content/crossing/chapter';
import { FERRY, FERRY_CENTRE } from '../../content/levels/ferry';
import { PIER } from '../../content/levels/pier';
import { departurePose, type ShipPose, shipToWorld, voyagePose, worldToShip } from './evening';

const pose = () => ({ dx: 0, dz: 0, yaw: 0 });

/** The deck's west edge, drawn where the ship is, nearest the pier along the pier's length. */
function westEdgeByPier(p: ShipPose): number {
  let least = Infinity;
  const d = FERRY.deck;
  for (const [x, z] of [[d.minX, d.minZ], [d.minX, d.maxZ], [d.maxX, d.minZ], [d.maxX, d.maxZ]] as const) {
    const w = shipToWorld(p, x, z, { x: 0, z: 0 });
    if (w.z > PIER.minZ - 2 && w.z < PIER.maxZ + 2) least = Math.min(least, w.x);
  }
  return least;
}

describe('the ferry', () => {
  it('sails the ferry in from the sound and ties it up alongside, square to the pier', () => {
    const start = voyagePose(0, pose());
    expect(start.dz).toBeGreaterThan(50);
    expect(Math.abs(start.yaw)).toBeGreaterThan(0.02);
    const half = voyagePose(VOYAGE_SECONDS / 2, pose());
    expect(half.dz).toBeLessThan(start.dz);
    const tied = voyagePose(VOYAGE_SECONDS + 10, pose());
    expect(Math.abs(tied.dx) + Math.abs(tied.dz) + Math.abs(tied.yaw)).toBe(0);
  });

  it('pulls away again, out of sight', () => {
    expect(departurePose(0, pose())).toEqual({ dx: 0, dz: 0, yaw: 0 });
    expect(departurePose(DEPARTURE_SECONDS, pose()).dz).toBeGreaterThan(60);
  });

  it('never swings over the pier, coming in or going out (William, 2026-10-10)', () => {
    for (let s = 0; s <= VOYAGE_SECONDS; s += 0.5) expect(westEdgeByPier(voyagePose(s, pose()))).toBeGreaterThan(PIER.maxX + 0.5);
    for (let s = 0; s <= DEPARTURE_SECONDS; s += 0.5) {
      const p = departurePose(s, pose());
      // Once it's turning, its ends sweep a circle about the deck's middle: that circle stays off the pier.
      const reach = Math.hypot((FERRY.deck.maxX - FERRY.deck.minX) / 2, (FERRY.deck.maxZ - FERRY.deck.minZ) / 2);
      if (Math.abs(p.yaw) > 1e-3) expect(FERRY_CENTRE.x + p.dx - reach).toBeGreaterThan(PIER.maxX + 0.5);
      expect(westEdgeByPier(p)).toBeGreaterThan(PIER.maxX + 0.5);
    }
  });

  it('draws the deck where the ship is, and finds the aim back on the deck', () => {
    const p = { dx: 5, dz: 40, yaw: 0.3 };
    const w = shipToWorld(p, 38, 30, { x: 0, z: 0 });
    const back = worldToShip(p, w.x, w.z, { x: 0, z: 0 });
    expect(back.x).toBeCloseTo(38);
    expect(back.z).toBeCloseTo(30);
    expect(shipToWorld({ dx: 0, dz: 0, yaw: 0 }, 38, 30, { x: 0, z: 0 })).toEqual({ x: 38, z: 30 });
  });
});
