import { resolveCircleVsBoxes } from './collision';
import { PLAYER_TUNING } from '../config/player';
import type { WorldDef } from './world/types';

export interface PlayerState {
  x: number;
  z: number;
  /** Ground height under the player. */
  y: number;
  /** Radians; 0 faces +z, π/2 faces +x. */
  facing: number;
  listening: boolean;
  /** Water depth at the player's feet. */
  depth: number;
}

export interface PlayerCommand {
  /** Desired movement in world space; length ≤ 1. */
  moveX: number;
  moveZ: number;
  /** World point the mouse aims at, if any. */
  aimX: number | null;
  aimZ: number | null;
  listen: boolean;
  /** Multiplies the walking speed: combat slows or stops the player, the evasive step dashes. */
  speedScale: number;
  /** Whether the aim turns the player this tick (not mid-swing). */
  turn: boolean;
}


export function createPlayer(world: WorldDef): PlayerState {
  const g = world.groundAt(world.spawn.x, world.spawn.z);
  return { x: world.spawn.x, z: world.spawn.z, y: g.height, facing: world.spawn.facing, listening: false, depth: 0 };
}

const probe = { x: 0, z: 0 };

/** Can a person stand here at this water level? */
export function walkable(world: WorldDef, x: number, z: number, waterLevel: number, fromY: number): boolean {
  const g = world.groundAt(x, z);
  if (g.kind === 'channel') return false;
  if (g.height - fromY > PLAYER_TUNING.maxStepUp) return false;
  return waterLevel - g.height <= PLAYER_TUNING.maxWadeDepth;
}

/** One fixed simulation tick. Mutates `s`; allocation-free. */
export function stepPlayer(s: PlayerState, cmd: PlayerCommand, world: WorldDef, waterLevel: number, dt: number): void {
  s.listening = cmd.listen;

  if (cmd.turn && cmd.aimX !== null && cmd.aimZ !== null) {
    const ax = cmd.aimX - s.x;
    const az = cmd.aimZ - s.z;
    if (Math.hypot(ax, az) > PLAYER_TUNING.aimDeadZone) {
      const turn = Math.atan2(ax, az) - s.facing;
      const by = Math.atan2(Math.sin(turn), Math.cos(turn));
      const most = PLAYER_TUNING.turnSpeed * dt;
      s.facing += Math.max(-most, Math.min(most, by));
      s.facing = Math.atan2(Math.sin(s.facing), Math.cos(s.facing));
    }
  }

  const fromX = s.x;
  const fromZ = s.z;
  if (!s.listening) {
    let speed = PLAYER_TUNING.walkSpeed * cmd.speedScale;
    if (s.depth > PLAYER_TUNING.wadeDepth) speed *= PLAYER_TUNING.wadeSpeedFactor;
    const dx = cmd.moveX * speed * dt;
    const dz = cmd.moveZ * speed * dt;
    // Axis-separated so the player slides along the water's edge.
    if (dx !== 0 && walkable(world, s.x + dx + Math.sign(dx) * PLAYER_TUNING.radius * 0.5, s.z, waterLevel, s.y)) s.x += dx;
    if (dz !== 0 && walkable(world, s.x, s.z + dz + Math.sign(dz) * PLAYER_TUNING.radius * 0.5, waterLevel, s.y)) s.z += dz;
  }

  probe.x = s.x;
  probe.z = s.z;
  resolveCircleVsBoxes(probe, PLAYER_TUNING.radius, world.walls);
  // A wall at the water's edge (a bollard on a pier) can shove the player off it: stay where they were instead.
  if (walkable(world, probe.x, probe.z, waterLevel, s.y)) {
    s.x = probe.x;
    s.z = probe.z;
  } else {
    s.x = fromX;
    s.z = fromZ;
  }

  const g = world.groundAt(s.x, s.z);
  s.y = g.height;
  s.depth = Math.max(0, waterLevel - g.height);
}
