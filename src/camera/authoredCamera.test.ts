import { describe, expect, it } from 'vitest';
import { HeldMoveBasis, poseYaw, selectZone, zoneMoveYaw, zonePose, type CameraPose } from './authoredCamera';
import { BROUGH_ZONES as Z } from './broughZones';

const pose = (): CameraPose => ({ px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 0 });
const id = (i: number) => Z[i]!.id;

describe('authored camera zones', () => {
  it('picks the most specific zone (indoors beats the islet)', () => {
    expect(id(selectZone(Z, -1, -24, 0))).toBe('cottage');
    expect(id(selectZone(Z, -1, -16, 6))).toBe('brough');
    expect(id(selectZone(Z, -1, 0, 0))).toBe('causeway');
    expect(id(selectZone(Z, -1, 20, 0))).toBe('shore');
  });

  it('holds the current zone near a boundary (no flicker)', () => {
    const causeway = Z.findIndex((z) => z.id === 'causeway');
    expect(id(selectZone(Z, causeway, 12.3, 0))).toBe('causeway');
    expect(id(selectZone(Z, causeway, 13.5, 0))).toBe('shore');
  });

  it('tracks along the causeway rail and clamps at its ends', () => {
    const zone = Z.find((z) => z.id === 'causeway')!;
    const a = zonePose(zone, -5, 0, 0, pose()).px;
    const b = zonePose(zone, 5, 0, 0, pose()).px;
    expect(b).toBeGreaterThan(a);
    expect(zonePose(zone, 100, 0, 0, pose()).px).toBeCloseTo(9, 6);
    expect(zonePose(zone, -100, 0, 0, pose()).px).toBeCloseTo(-15, 6);
  });
});

describe('held movement basis across cuts', () => {
  it('keeps the old direction until movement is released', () => {
    const b = new HeldMoveBasis();
    expect(b.update(0, false, true)).toBe(0);
    expect(b.update(Math.PI, true, true)).toBe(0); // cut while holding
    expect(b.update(Math.PI, false, true)).toBe(0); // still holding
    expect(b.update(Math.PI, false, false)).toBe(Math.PI); // released
  });
});

describe('movement basis within a zone', () => {
  it('stays fixed while a turning camera follows the player', () => {
    const cottage = Z[0]!;
    expect(cottage.rig.type).toBe('fixed');
    const yaw = zoneMoveYaw(cottage);
    // The live view swings as the player crosses the room; the movement basis does not.
    const a = poseYaw(zonePose(cottage, -26, 0, 2, pose()));
    const b = poseYaw(zonePose(cottage, -21, 0, 2, pose()));
    expect(Math.abs(a - b)).toBeGreaterThan(0.3);
    expect(zoneMoveYaw(cottage)).toBe(yaw);
  });

  it('matches a crane camera\'s own view direction', () => {
    const brough = Z.find((z) => z.id === 'brough')!;
    expect(zoneMoveYaw(brough)).toBeCloseTo(poseYaw(zonePose(brough, -20, 0, 4, pose())), 1);
  });
});
