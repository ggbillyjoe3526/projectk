import { describe, expect, it } from 'vitest';
import { DEPARTURE_SECONDS, DUSK, FERRY_START_TIDE, VOYAGE_SECONDS } from '../../content/crossing/chapter';
import { islandTime } from '../../sim/islandClock';
import { causewayPassable, nextCausewayOpen } from '../../sim/tide';
import { daylight, departurePose, shipToWorld, voyagePose, worldToShip } from './evening';

const pose = () => ({ dx: 0, dz: 0, yaw: 0 });

describe('the evening', () => {
  it('docks a little after four, in the last light, with the causeway shut until half seven or so', () => {
    const docked = FERRY_START_TIDE + VOYAGE_SECONDS;
    expect(islandTime(FERRY_START_TIDE)).toBe('15:36');
    expect(islandTime(docked)).toBe('16:12');
    expect(causewayPassable(docked)).toBe(false);
    expect(islandTime(nextCausewayOpen(docked))).toMatch(/^19:[3-5]\d$/);
  });

  it('loses the light between four and half six, and stays dark', () => {
    expect(daylight(FERRY_START_TIDE)).toBe(1);
    expect(daylight((DUSK.from + DUSK.to) / 2)).toBeCloseTo(0.5);
    expect(daylight(DUSK.to)).toBe(0);
    expect(daylight(0)).toBe(0);
    expect(daylight(600)).toBe(0);
  });

  it('sails the ferry in from the sound and ties it up alongside, square to the pier', () => {
    const start = voyagePose(0, pose());
    expect(start.dz).toBeGreaterThan(50);
    expect(Math.abs(start.yaw)).toBeGreaterThan(0.05);
    const half = voyagePose(VOYAGE_SECONDS / 2, pose());
    expect(half.dz).toBeLessThan(start.dz);
    expect(voyagePose(VOYAGE_SECONDS + 10, pose())).toEqual({ dx: -0, dz: 0, yaw: -0 });
  });

  it('pulls away again, out of sight', () => {
    expect(departurePose(0, pose())).toEqual({ dx: 0, dz: 0, yaw: 0 });
    expect(departurePose(DEPARTURE_SECONDS, pose()).dz).toBeGreaterThan(60);
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
