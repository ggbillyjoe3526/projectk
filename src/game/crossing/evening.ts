import { DEPARTURE_SECONDS, DUSK, VOYAGE_SECONDS } from '../../content/crossing/chapter';
import { FERRY_CENTRE } from '../../content/levels/ferry';

/**
 * The evening's two clocks, pure: how much daylight is left at a tide clock, and where the ferry is drawn while it
 * sails in and pulls away again. The ferry's deck lies alongside the pier in the simulation; out at sea the set, the
 * player on it and the camera are drawn through `ShipPose`, turned about the deck's middle and moved by an offset.
 */

const smooth = (k: number): number => {
  const c = Math.min(1, Math.max(0, k));
  return c * c * (3 - 2 * c);
};

/** 1 in the last of the afternoon light, 0 in full night (and for the rest of the night). */
export function daylight(tideClock: number): number {
  return 1 - smooth((tideClock - DUSK.from) / (DUSK.to - DUSK.from));
}

/** Where the ferry is drawn: moved by `dx`, `dz` from where it ties up, turned by `yaw` about the deck's middle. */
export interface ShipPose {
  dx: number;
  dz: number;
  yaw: number;
}

/** Where the voyage starts, from where the ferry ties up: out in the sound to the south, a little west. */
const AT_SEA = { dx: -14, dz: 72 } as const;
/** Where it pulls away to, and how far it turns, before it's lost in the dark. */
const AWAY = { dx: 24, dz: 84, turn: Math.PI * 0.85 } as const;

/** The ferry `seconds` into the voyage: in from the sound, slowing as it comes alongside, then tied up. */
export function voyagePose(seconds: number, out: ShipPose): ShipPose {
  const k = Math.min(1, Math.max(0, seconds / VOYAGE_SECONDS));
  // Eased out: it slows as it comes in. The westward offset closes late, so it swings in alongside.
  const e = 1 - Math.pow(1 - k, 2);
  const rest = 1 - e;
  out.dx = AT_SEA.dx * rest * rest;
  out.dz = AT_SEA.dz * rest;
  // Heading along its path: from the path's slope, turning straight as it comes alongside.
  const vx = -2 * AT_SEA.dx * rest;
  const vz = -AT_SEA.dz;
  out.yaw = Math.atan2(-vx, -vz);
  return out;
}

/** The ferry `seconds` after it starts pulling away: backing off the pier and turning for the sound. */
export function departurePose(seconds: number, out: ShipPose): ShipPose {
  const k = Math.min(1, Math.max(0, seconds / DEPARTURE_SECONDS));
  const e = k * k;
  out.dx = AWAY.dx * e * e;
  out.dz = AWAY.dz * e;
  out.yaw = AWAY.turn * smooth(k * 1.4);
  return out;
}

/** A point on the deck (simulation) to where it is drawn, written into `out`. */
export function shipToWorld(pose: ShipPose, x: number, z: number, out: { x: number; z: number }): { x: number; z: number } {
  const lx = x - FERRY_CENTRE.x;
  const lz = z - FERRY_CENTRE.z;
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  out.x = FERRY_CENTRE.x + lx * c + lz * s + pose.dx;
  out.z = FERRY_CENTRE.z - lx * s + lz * c + pose.dz;
  return out;
}

/** Where a drawn point lies on the deck (the mouse's aim, out at sea), written into `out`. */
export function worldToShip(pose: ShipPose, x: number, z: number, out: { x: number; z: number }): { x: number; z: number } {
  const lx = x - pose.dx - FERRY_CENTRE.x;
  const lz = z - pose.dz - FERRY_CENTRE.z;
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  out.x = FERRY_CENTRE.x + lx * c - lz * s;
  out.z = FERRY_CENTRE.z + lx * s + lz * c;
  return out;
}
