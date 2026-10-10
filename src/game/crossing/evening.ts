import { DEPARTURE_SECONDS, VOYAGE_SECONDS } from '../../content/crossing/chapter';
import { FERRY_CENTRE } from '../../content/levels/ferry';

/**
 * Where the ferry is drawn while it sails in and pulls away again, pure. The ferry's deck lies alongside the pier in the
 * simulation; out at sea the set, the player on it and the camera are drawn through `ShipPose`, turned about the deck's
 * middle and moved by an offset. It never swings near the pier: it comes in straight up the pier's side, and leaves by
 * standing off sideways first, turning only once it's clear.
 */

const smooth = (k: number): number => {
  const c = Math.min(1, Math.max(0, k));
  return c * c * (3 - 2 * c);
};

/** Where the ferry is drawn: moved by `dx`, `dz` from where it ties up, turned by `yaw` about the deck's middle. */
export interface ShipPose {
  dx: number;
  dz: number;
  yaw: number;
}

/** Where the voyage starts, from where the ferry ties up: out in the sound to the south, a little east (away from the pier). */
const AT_SEA = { dx: 6, dz: 72 } as const;
/**
 * Leaving: it stands off east until its ends can swing clear of the pier (the deck is 28 m long, the pier's edge 6.5 m
 * from its middle), turns about for the sound, and goes.
 */
const AWAY = { standOff: 12, dz: 90, drift: 10, turn: Math.PI } as const;

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

/** The ferry `seconds` after it starts pulling away: standing off the pier, turning for the sound, and away. */
export function departurePose(seconds: number, out: ShipPose): ShipPose {
  const k = Math.min(1, Math.max(0, seconds / DEPARTURE_SECONDS));
  const off = smooth(k / 0.3);
  const turn = smooth((k - 0.25) / 0.4);
  const go = smooth((k - 0.45) / 0.55);
  out.dx = AWAY.standOff * off + AWAY.drift * go;
  out.dz = 6 * turn + (AWAY.dz - 6) * go * go;
  out.yaw = AWAY.turn * turn;
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
