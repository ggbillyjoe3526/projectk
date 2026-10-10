import type { CameraZone } from '../camera/authoredCamera';
import { PLAYER_TUNING } from '../config/player';
import { buildWorld, type GroundRegion, inBox, type WorldData } from '../sim/world/ground';
import type { Box2, Prop, Wall, WorldDef } from '../sim/world/types';

/**
 * A level as authored data: the ground, walls and props the simulation walks on, the cameras that frame each space,
 * where things and the dead are placed, and set dressing that only the renderer draws. New spaces are added by
 * writing data here, not code; `validateLevel` catches authoring mistakes in the unit tests.
 */

export interface Point {
  readonly x: number;
  readonly z: number;
}

export interface Placement extends Point {
  readonly facing: number;
}

/** A camera zone, and whether it frames an interior (rain stops and the hum is muffled). */
export interface LevelCamera extends CameraZone {
  readonly indoors?: boolean;
}

export type DressingMaterial = 'cliff' | 'moor' | 'floor' | 'stone';

/** Things the renderer draws that the simulation never touches. Heights are in world metres. */
export type Dressing =
  | { readonly kind: 'block'; readonly box: Box2; readonly bottom: number; readonly top: number; readonly material: DressingMaterial; readonly castShadow?: boolean }
  | { readonly kind: 'light'; readonly x: number; readonly y: number; readonly z: number; readonly color: number; readonly intensity: number; readonly distance: number; readonly decay: number }
  /** A lighthouse's slow sweep of light, turning about this point. */
  | { readonly kind: 'beam'; readonly x: number; readonly y: number; readonly z: number };

/**
 * An indoor space: the dark doesn't drain Resolve here. A refuge (the cottage, the kirk vestry) is one the dead won't
 * follow you into.
 */
export interface Interior extends Box2 {
  readonly refuge?: boolean;
}

/** Where the slice's things are: the hearth, the note, the old sword (on a slab `top` high) and the dead. */
export interface LevelPlaces {
  readonly hearth: Point;
  readonly note: Point;
  readonly sword: Point & { readonly top: number };
  readonly dead: readonly Placement[];
}

export interface LevelDef {
  readonly id: string;
  readonly world: WorldData;
  readonly interiors: readonly Interior[];
  /** Camera zones, most specific first (an earlier zone wins where two overlap). */
  readonly cameras: readonly LevelCamera[];
  readonly places: LevelPlaces;
  readonly dressing: readonly Dressing[];
}

/** A level ready to play: its data, and the simulation's view of it. */
export interface Level extends LevelDef {
  readonly sim: WorldDef;
}

export function loadLevel(def: LevelDef): Level {
  return { ...def, sim: buildWorld(def.world) };
}

const within = (b: Box2, x: number, z: number) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;

export function isIndoors(level: LevelDef, x: number, z: number): boolean {
  return level.interiors.some((b) => within(b, x, z));
}

export function inRefuge(level: LevelDef, x: number, z: number): boolean {
  return level.interiors.some((b) => b.refuge === true && within(b, x, z));
}

/**
 * One area of a level (the Brough, the village, the kirk), authored on its own. Areas are joined in order: ground
 * regions and camera zones keep their order within an area, so put the more specific ones first.
 */
export interface LevelArea {
  readonly ground: readonly GroundRegion[];
  readonly walls?: readonly Wall[];
  readonly props?: readonly Prop[];
  readonly listeningPosts?: WorldData['listeningPosts'];
  readonly interiors?: readonly Interior[];
  readonly cameras: readonly LevelCamera[];
  readonly dead?: readonly Placement[];
  readonly dressing?: readonly Dressing[];
}

export interface LevelFrame {
  readonly id: string;
  readonly channelFloor: number;
  readonly spawn: WorldData['spawn'];
  readonly places: Omit<LevelPlaces, 'dead'>;
}

export function composeLevel(frame: LevelFrame, areas: readonly LevelArea[]): LevelDef {
  const all = <T>(pick: (a: LevelArea) => readonly T[] | undefined): T[] => areas.flatMap((a) => pick(a) ?? []);
  return {
    id: frame.id,
    world: {
      channelFloor: frame.channelFloor,
      ground: all((a) => a.ground),
      walls: all((a) => a.walls),
      props: all((a) => a.props),
      listeningPosts: all((a) => a.listeningPosts),
      spawn: frame.spawn,
    },
    interiors: all((a) => a.interiors),
    cameras: all((a) => a.cameras),
    places: { ...frame.places, dead: all((a) => a.dead) },
    dressing: all((a) => a.dressing),
  };
}

/** Spacing of the grid that checks every walkable spot has a camera. */
const CAMERA_CHECK_STEP = 0.5;
/** Spacing of the grid that checks the player can walk to every place. */
const REACH_STEP = 0.25;
/** A place counts as reached from this close (a little under the reach for using it). */
const PLACE_REACH = 1.5;

/**
 * Where the player can walk from the spawn at low water: a flood fill over a grid, through spots where the ground is
 * walkable, the player's body clears every wall, and no step up is too high. Returns a test for "can stand near here".
 */
export function reachability(def: LevelDef): (x: number, z: number, within: number) => boolean {
  const world = buildWorld(def.world);
  const r = PLAYER_TUNING.radius;
  const walls = def.world.walls;
  const minX = Math.min(...def.world.ground.map((g) => g.minX));
  const minZ = Math.min(...def.world.ground.map((g) => g.minZ));
  const cols = Math.ceil((Math.max(...def.world.ground.map((g) => g.maxX)) - minX) / REACH_STEP) + 1;
  const rows = Math.ceil((Math.max(...def.world.ground.map((g) => g.maxZ)) - minZ) / REACH_STEP) + 1;
  const clear = (x: number, z: number) =>
    walls.every((w) => {
      const dx = x - Math.max(w.minX, Math.min(x, w.maxX));
      const dz = z - Math.max(w.minZ, Math.min(z, w.maxZ));
      return dx * dx + dz * dz >= r * r;
    });
  const reached = new Uint8Array(cols * rows);
  const cell = (x: number, z: number) => [Math.round((x - minX) / REACH_STEP), Math.round((z - minZ) / REACH_STEP)] as const;
  const [sc, sr] = cell(def.world.spawn.x, def.world.spawn.z);
  const queue = [sr * cols + sc];
  reached[queue[0]!] = 1;
  while (queue.length > 0) {
    const i = queue.pop()!;
    const c = i % cols;
    const row = (i - c) / cols;
    const from = world.groundAt(minX + c * REACH_STEP, minZ + row * REACH_STEP).height;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc;
      const nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || reached[nr * cols + nc]) continue;
      const x = minX + nc * REACH_STEP;
      const z = minZ + nr * REACH_STEP;
      const g = world.groundAt(x, z);
      if (g.kind === 'channel' || g.height - from > PLAYER_TUNING.maxStepUp || !clear(x, z)) continue;
      reached[nr * cols + nc] = 1;
      queue.push(nr * cols + nc);
    }
  }
  return (x, z, within) => {
    const [c0, r0] = cell(x - within, z - within);
    const [c1, r1] = cell(x + within, z + within);
    for (let row = Math.max(0, r0); row <= Math.min(rows - 1, r1); row++) {
      for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++) {
        if (reached[row * cols + c] && Math.hypot(minX + c * REACH_STEP - x, minZ + row * REACH_STEP - z) <= within) return true;
      }
    }
    return false;
  };
}

/** Authoring mistakes in a level, as readable lines (none: it's sound). */
export function validateLevel(def: LevelDef): string[] {
  const problems: string[] = [];
  const world = buildWorld(def.world);
  const walkable = (p: Point) => world.groundAt(p.x, p.z).kind !== 'channel';
  const inWall = (p: Point) => def.world.walls.some((w) => inBox(w, p.x, p.z));
  const where = (p: Point) => `(${p.x}, ${p.z})`;

  const ids = new Set<string>();
  for (const c of def.cameras) {
    if (ids.has(c.id)) problems.push(`Camera zone "${c.id}" is defined twice.`);
    ids.add(c.id);
  }

  const spawn = def.world.spawn;
  if (!walkable(spawn)) problems.push(`The spawn ${where(spawn)} is in deep water.`);
  if (inWall(spawn)) problems.push(`The spawn ${where(spawn)} is inside a wall.`);
  const { hearth, note, sword, dead } = def.places;
  for (const [name, p] of [['hearth', hearth], ['note', note], ['sword', sword]] as const) {
    if (!walkable(p)) problems.push(`The ${name} ${where(p)} is in deep water.`);
  }
  for (const d of dead) {
    if (!walkable(d)) problems.push(`A dead spawn ${where(d)} is in deep water.`);
    if (inWall(d)) problems.push(`A dead spawn ${where(d)} is inside a wall.`);
  }
  for (const post of def.world.listeningPosts) if (!walkable(post)) problems.push(`The listening post ${where(post)} is in deep water.`);
  for (const w of def.world.walls) {
    const centre = { x: (w.minX + w.maxX) / 2, z: (w.minZ + w.maxZ) / 2 };
    if (w.base === undefined && !walkable(centre)) problems.push(`The ${w.kind} wall at ${where(centre)} stands in deep water with no base height.`);
  }

  // The player must be able to walk to every place from the spawn.
  const canReach = reachability(def);
  for (const [name, p] of [['hearth', hearth], ['note', note], ['sword', sword]] as const) {
    if (walkable(p) && !canReach(p.x, p.z, PLACE_REACH)) problems.push(`The ${name} ${where(p)} can't be reached from the spawn.`);
  }

  // Every walkable spot needs a camera, or walking there would leave the last one stuck in place.
  let uncovered = 0;
  let example = '';
  for (const r of def.world.ground) {
    for (let x = r.minX; x <= r.maxX; x += CAMERA_CHECK_STEP) {
      for (let z = r.minZ; z <= r.maxZ; z += CAMERA_CHECK_STEP) {
        if (def.cameras.some((c) => inBox(c.bounds, x, z))) continue;
        if (uncovered++ === 0) example = where({ x, z });
      }
    }
  }
  if (uncovered > 0) problems.push(`${uncovered} walkable spots have no camera zone, for example ${example}.`);
  return problems;
}
