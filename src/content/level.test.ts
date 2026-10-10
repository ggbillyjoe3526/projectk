import { describe, expect, it } from 'vitest';
import { regionHeight } from '../sim/world/ground';
import { inRefuge, isIndoors, type LevelDef, loadLevel, reachability, validateLevel } from './level';
import { CAUSEWAY, ISLET, SHORE } from './levels/brough';
import { HAUGSAY } from './levels/haugsay';
import { KIRKYARD_TOP } from './levels/village';

describe('levels as data', () => {
  it('Haugsay is authored soundly', () => {
    expect(validateLevel(HAUGSAY)).toEqual([]);
  });

  it('answers the ground from its regions, with the channel everywhere else', () => {
    const world = loadLevel(HAUGSAY).sim;
    expect(world.groundAt(-20, 8)).toEqual({ height: ISLET.top, kind: 'islet' });
    expect(world.groundAt(20, 0)).toEqual({ height: SHORE.top, kind: 'shore' });
    expect(world.groundAt(0, 0)).toEqual({ height: CAUSEWAY.top, kind: 'causeway' });
    expect(world.groundAt(0, CAUSEWAY.halfWidth + 0.1).kind).toBe('channel');
    expect(world.groundAt(0, 5).height).toBe(HAUGSAY.world.channelFloor);
  });

  it('ramps the causeway down off the islet and up onto the shore', () => {
    const world = loadLevel(HAUGSAY).sim;
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

  it('knows which spaces are indoors, and which of those the dead won\'t follow you into', () => {
    expect(isIndoors(HAUGSAY, -24, 0)).toBe(true);
    expect(inRefuge(HAUGSAY, -24, 0)).toBe(true);
    expect(isIndoors(HAUGSAY, -16, 0)).toBe(false);
    // The kirk is indoors but no refuge; its vestry is.
    expect(isIndoors(HAUGSAY, 60, -28)).toBe(true);
    expect(inRefuge(HAUGSAY, 60, -28)).toBe(false);
    expect(inRefuge(HAUGSAY, 68, -32)).toBe(true);
    expect(inRefuge(HAUGSAY, 55, 8)).toBe(false);
  });

  it('climbs the lane from the street to the kirkyard on its mound', () => {
    const world = loadLevel(HAUGSAY).sim;
    expect(world.groundAt(64, -5).height).toBeCloseTo(SHORE.top);
    expect(world.groundAt(64, -12).height).toBeCloseTo(KIRKYARD_TOP);
    expect(world.groundAt(64, -20)).toEqual({ height: KIRKYARD_TOP, kind: 'grass' });
    expect(world.groundAt(62, -30).kind).toBe('flagstone');
  });

  it('lets the player walk from the cottage to the sword and into the vestry', () => {
    const canReach = reachability(HAUGSAY);
    expect(canReach(62, -33.2, 1.5)).toBe(true);
    expect(canReach(68, -32, 0.3)).toBe(true);
  });
});

describe('level validation', () => {
  const broken = (change: (d: LevelDef) => LevelDef) => validateLevel(change(HAUGSAY));

  it('catches a spawn in deep water or inside a wall', () => {
    expect(broken((d) => ({ ...d, world: { ...d.world, spawn: { x: 0, z: 6, facing: 0 } } }))).toContainEqual(expect.stringContaining('spawn (0, 6) is in deep water'));
    expect(broken((d) => ({ ...d, world: { ...d.world, spawn: { x: 18, z: -4, facing: 0 } } }))).toContainEqual(expect.stringContaining('spawn (18, -4) is inside a wall'));
  });

  it('catches a place the player can never walk to', () => {
    // A wall across the lychgate shuts the kirk, and the sword in it, off from the village.
    const shut = broken((d) => ({ ...d, world: { ...d.world, walls: [...d.world.walls, { minX: 60, maxX: 68, minZ: -9, maxZ: -8.5, height: 2, kind: 'gate' }] } }));
    expect(shut).toContainEqual(expect.stringContaining('The sword "sword" (62, -33.2) can\'t be reached'));
  });

  it('catches a wall standing in the sea with nowhere to stand on', () => {
    const problems = broken((d) => ({ ...d, world: { ...d.world, walls: [...d.world.walls, { minX: 0, maxX: 1, minZ: 8, maxZ: 9, height: 1, kind: 'boulder' }] } }));
    expect(problems).toEqual([expect.stringContaining('boulder wall at (0.5, 8.5) stands in deep water')]);
  });

  it('catches the dead placed in the sea or in a wall', () => {
    const problems = broken((d) => ({ ...d, dead: [{ x: 0, z: 8, facing: 0 }, { x: 22.5, z: 5.5, facing: 0 }] }));
    expect(problems).toEqual([expect.stringContaining('(0, 8) is in deep water'), expect.stringContaining('(22.5, 5.5) is inside a wall')]);
  });

  it('catches walkable ground with no camera', () => {
    const problems = broken((d) => ({ ...d, cameras: d.cameras.filter((c) => c.id !== 'causeway') }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/walkable spots have no camera zone/);
  });

  it('catches a gate with no wall to open, and things defined twice', () => {
    const gate = HAUGSAY.things.find((t) => t.kind === 'gate')!;
    const problems = broken((d) => ({ ...d, things: [...d.things, { ...gate, wall: 'nowhere' }] }));
    expect(problems).toEqual(['Thing "kirk-back-gate" is defined twice.', 'Gate "kirk-back-gate" opens a wall "nowhere" that doesn\'t exist.']);
  });

  it('catches a camera zone defined twice', () => {
    expect(broken((d) => ({ ...d, cameras: [...d.cameras, d.cameras[0]!] }))).toEqual(['Camera zone "bedroom" is defined twice.']);
  });
});
