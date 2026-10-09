/**
 * Camera A (concept §7): hand-placed high-angle cameras, one per space,
 * that track the player instead of cutting within a space. Pure logic so it
 * can be tested and reused by any renderer.
 */
import type { Box2 } from '../sim/world/types';

export type Vec3 = readonly [number, number, number];

export type CameraRig =
  /** Stays put and turns to follow the player. */
  | { readonly type: 'fixed'; readonly position: Vec3 }
  /** Slides along a straight rail, matching the player's progress along it. */
  | { readonly type: 'rail'; readonly from: Vec3; readonly to: Vec3; readonly lead: number }
  /** Hovers at an offset from the player, clamped to a box. */
  | { readonly type: 'crane'; readonly offset: Vec3; readonly min: Vec3; readonly max: Vec3 };

export interface CameraZone {
  readonly id: string;
  readonly bounds: Box2;
  readonly rig: CameraRig;
  readonly fov: number;
  /** Added to the player's position to get the look-at point. */
  readonly lookOffset: Vec3;
}

export interface CameraPose {
  px: number; py: number; pz: number;
  lx: number; ly: number; lz: number;
  fov: number;
}

function inside(b: Box2, x: number, z: number, grow: number): boolean {
  return x >= b.minX - grow && x <= b.maxX + grow && z >= b.minZ - grow && z <= b.maxZ + grow;
}

/**
 * Picks the zone for a player position. The current zone is kept while the
 * player is within `hysteresis` metres of it, so standing on a boundary never
 * flickers between cameras. Zones earlier in the list win ties.
 */
export function selectZone(zones: readonly CameraZone[], current: number, x: number, z: number, hysteresis = 0.6): number {
  if (current >= 0 && current < zones.length && inside(zones[current]!.bounds, x, z, hysteresis)) {
    // Still allow an earlier (more specific) zone to take over, e.g. stepping indoors.
    for (let i = 0; i < current; i++) if (inside(zones[i]!.bounds, x, z, 0)) return i;
    return current;
  }
  for (let i = 0; i < zones.length; i++) if (inside(zones[i]!.bounds, x, z, 0)) return i;
  return Math.max(0, current);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The target pose for a zone. Writes into `out`; allocation-free. */
export function zonePose(zone: CameraZone, x: number, y: number, z: number, out: CameraPose): CameraPose {
  const rig = zone.rig;
  if (rig.type === 'fixed') {
    out.px = rig.position[0]; out.py = rig.position[1]; out.pz = rig.position[2];
  } else if (rig.type === 'rail') {
    const dx = rig.to[0] - rig.from[0];
    const dz = rig.to[2] - rig.from[2];
    const len2 = dx * dx + dz * dz || 1;
    const k = clamp(((x - rig.from[0]) * dx + (z - rig.from[2]) * dz) / len2 + rig.lead, 0, 1);
    out.px = rig.from[0] + dx * k;
    out.py = rig.from[1] + (rig.to[1] - rig.from[1]) * k;
    out.pz = rig.from[2] + dz * k;
  } else {
    out.px = clamp(x + rig.offset[0], rig.min[0], rig.max[0]);
    out.py = clamp(y + rig.offset[1], rig.min[1], rig.max[1]);
    out.pz = clamp(z + rig.offset[2], rig.min[2], rig.max[2]);
  }
  out.lx = x + zone.lookOffset[0];
  out.ly = y + zone.lookOffset[1];
  out.lz = z + zone.lookOffset[2];
  out.fov = zone.fov;
  return out;
}

/**
 * The yaw that turns movement keys into world directions within a zone: the view direction toward the zone's middle,
 * fixed for the zone. Using the live view instead would make a camera that turns to follow the player bend every
 * straight walk into a curve around it.
 */
export function zoneMoveYaw(zone: CameraZone): number {
  const b = zone.bounds;
  return poseYaw(zonePose(zone, (b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2, { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 0 }));
}

/**
 * Camera-relative movement that survives cuts (concept §7): when the camera
 * cuts while a direction is held, keep the old basis until every movement key
 * is released, so the player never walks back through the door they came in.
 */
export class HeldMoveBasis {
  private frozenYaw: number | null = null;

  /** Returns the yaw to use for turning WASD into world movement. */
  update(cameraYaw: number, cut: boolean, moveHeld: boolean): number {
    if (!moveHeld) this.frozenYaw = null;
    else if (cut && this.frozenYaw === null) this.frozenYaw = this.lastYaw;
    this.lastYaw = this.frozenYaw ?? cameraYaw;
    return this.lastYaw;
  }

  private lastYaw = 0;
}

/** Yaw of the camera's ground-projected view direction (0 looks along +z). */
export function poseYaw(p: CameraPose): number {
  return Math.atan2(p.lx - p.px, p.lz - p.pz);
}
