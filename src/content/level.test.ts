import { describe, expect, it } from 'vitest';
import { regionHeight } from '../sim/world/ground';
import { isIndoors, type LevelDef, loadLevel, validateLevel } from './level';
import { BROUGH, CAUSEWAY, ISLET, SHORE } from './levels/brough';

describe('levels as data', () => {
  it('the Brough is authored soundly', () => {
    expect(validateLevel(BROUGH)).toEqual([]);
  });

  it('answers the ground from its regions, with the channel everywhere else', () => {
    const world = loadLevel(BROUGH).sim;
    expect(world.groundAt(-20, 8)).toEqual({ height: ISLET.top, kind: 'islet' });
    expect(world.groundAt(20, 0)).toEqual({ height: SHORE.top, kind: 'shore' });
    expect(world.groundAt(0, 0)).toEqual({ height: CAUSEWAY.top, kind: 'causeway' });
    expect(world.groundAt(0, CAUSEWAY.halfWidth + 0.1).kind).toBe('channel');
    expect(world.groundAt(0, 5).height).toBe(BROUGH.world.channelFloor);
  });

  it('ramps the causeway down off the islet and up onto the shore', () => {
    const world = loadLevel(BROUGH).sim;
    const halfway = CAUSEWAY.minX + CAUSEWAY.rampLength / 2;
    expect(world.groundAt(halfway, 0).height).toBeCloseTo((ISLET.top + CAUSEWAY.top) / 2);
    expect(world.groundAt(CAUSEWAY.maxX - 0.001, 0).height).toBeCloseTo(SHORE.top, 2);
  });

  it('slopes along either axis, clamped to the box', () => {
    const r = { minX: 0, maxX: 2, minZ: 0, maxZ: 4, kind: 'shore', height: { axis: 'z', from: 1, to: 3 } } as const;
    expect(regionHeight(r, 1, 0)).toBe(1);
    expect(regionHeight(r, 1, 2)).toBe(2);
    expect(regionHeight(r, 1, 9)).toBe(3);
  });

  it('knows the cottage is indoors and the islet outside it is not', () => {
    expect(isIndoors(BROUGH, -24, 0)).toBe(true);
    expect(isIndoors(BROUGH, -16, 0)).toBe(false);
  });
});

describe('level validation', () => {
  const broken = (change: (d: LevelDef) => LevelDef) => validateLevel(change(BROUGH));

  it('catches a spawn in deep water or inside a wall', () => {
    expect(broken((d) => ({ ...d, world: { ...d.world, spawn: { x: 0, z: 6, facing: 0 } } }))).toEqual([expect.stringContaining('spawn (0, 6) is in deep water')]);
    expect(broken((d) => ({ ...d, world: { ...d.world, spawn: { x: 18, z: -4, facing: 0 } } }))).toEqual([expect.stringContaining('spawn (18, -4) is inside a wall')]);
  });

  it('catches the dead placed in the sea or in a wall', () => {
    const problems = broken((d) => ({ ...d, places: { ...d.places, dead: [{ x: 0, z: 8, facing: 0 }, { x: 22.5, z: 5.5, facing: 0 }] } }));
    expect(problems).toEqual([expect.stringContaining('(0, 8) is in deep water'), expect.stringContaining('(22.5, 5.5) is inside a wall')]);
  });

  it('catches walkable ground with no camera', () => {
    const problems = broken((d) => ({ ...d, cameras: d.cameras.filter((c) => c.id !== 'causeway') }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/walkable spots have no camera zone/);
  });

  it('catches a camera zone defined twice', () => {
    expect(broken((d) => ({ ...d, cameras: [...d.cameras, d.cameras[0]!] }))).toEqual(['Camera zone "cottage" is defined twice.']);
  });
});
