import { describe, expect, it } from 'vitest';
import { createPlayer, stepPlayer, type PlayerCommand } from './player';
import { composeLevel, loadLevel } from '../content/level';
import { PIER, PIER_AREA } from '../content/levels/pier';
import { CAUSEWAY } from '../content/levels/brough';
import { HAUGSAY } from '../content/levels/haugsay';
import { resolveCircleVsBoxes } from './collision';
import { DEFAULT_TIDE as T } from '../config/tide';

const world = loadLevel(HAUGSAY).sim;

const idle = (): PlayerCommand => ({ moveX: 0, moveZ: 0, aimX: null, aimZ: null, listen: false, speedScale: 1, turn: true });

function walkEast(waterLevel: number, seconds: number, startX: number) {
  const p = createPlayer(world);
  p.x = startX; p.z = 0; p.y = world.groundAt(p.x, p.z).height;
  const cmd = { ...idle(), moveX: 1 };
  for (let i = 0; i < seconds * 60; i++) stepPlayer(p, cmd, world, waterLevel, 1 / 60);
  return p;
}

describe('player movement', () => {
  it('crosses the causeway at low water', () => {
    const p = walkEast(T.lowLevel, 20, -15);
    expect(p.x).toBeGreaterThan(CAUSEWAY.maxX);
  });

  it('is turned back by deep water over the causeway at high water', () => {
    const p = walkEast(T.highLevel, 20, -15);
    expect(p.x).toBeLessThan(CAUSEWAY.minX + CAUSEWAY.rampLength);
  });

  it('never walks into the channel', () => {
    const p = createPlayer(world);
    p.x = 0; p.z = 0; p.y = CAUSEWAY.top;
    for (let i = 0; i < 600; i++) stepPlayer(p, { ...idle(), moveZ: 1 }, world, T.lowLevel, 1 / 60);
    expect(Math.abs(p.z)).toBeLessThanOrEqual(CAUSEWAY.halfWidth);
  });

  it('is never shoved off a pier by a bollard at its edge', () => {
    const pier = loadLevel(composeLevel({ id: 'pier-test', channelFloor: -3, spawn: { x: 32.7, z: 28, facing: Math.PI } }, [PIER_AREA])).sim;
    const p = createPlayer(pier);
    p.x = PIER.maxX - 0.1; p.z = 28;
    for (let i = 0; i < 120; i++) stepPlayer(p, { ...idle(), moveZ: -1 }, pier, T.lowLevel, 1 / 60);
    expect(p.x).toBeLessThanOrEqual(PIER.maxX);
    expect(pier.groundAt(p.x, p.z).kind).toBe('road');
  });

  it('stands still while listening', () => {
    const p = createPlayer(world);
    const x0 = p.x;
    for (let i = 0; i < 60; i++) stepPlayer(p, { ...idle(), moveX: 1, listen: true }, world, T.lowLevel, 1 / 60);
    expect(p.x).toBe(x0);
    expect(p.listening).toBe(true);
  });

  it('turns quickly, not instantly, to face the aim point', () => {
    const p = createPlayer(world);
    p.facing = 0;
    stepPlayer(p, { ...idle(), aimX: p.x + 5, aimZ: p.z }, world, T.lowLevel, 1 / 60);
    expect(p.facing).toBeGreaterThan(0);
    expect(p.facing).toBeLessThan(Math.PI / 2);
    for (let i = 0; i < 10; i++) stepPlayer(p, { ...idle(), aimX: p.x + 5, aimZ: p.z }, world, T.lowLevel, 1 / 60);
    expect(p.facing).toBeCloseTo(Math.PI / 2, 5);
  });

  it('ignores an aim point right at its feet', () => {
    const p = createPlayer(world);
    p.facing = 0;
    stepPlayer(p, { ...idle(), aimX: p.x + 0.3, aimZ: p.z }, world, T.lowLevel, 1 / 60);
    expect(p.facing).toBe(0);
  });
});

describe('collision', () => {
  it('pushes a circle out of a box', () => {
    const pos = { x: 0.2, z: 0 };
    resolveCircleVsBoxes(pos, 0.5, [{ minX: -1, maxX: 0, minZ: -1, maxZ: 1 }]);
    expect(pos.x).toBeCloseTo(0.5, 6);
  });
  it('handles a centre inside the box', () => {
    const pos = { x: -0.1, z: 0 };
    resolveCircleVsBoxes(pos, 0.5, [{ minX: -1, maxX: 0, minZ: -1, maxZ: 1 }]);
    expect(pos.x).toBeCloseTo(0.5, 6);
  });
});
