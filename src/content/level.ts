import type { CameraZone } from '../camera/authoredCamera';
import { buildWorld, inBox, type WorldData } from '../sim/world/ground';
import type { Box2, WorldDef } from '../sim/world/types';

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

/** A camera zone, and whether it frames an interior (rain stops, the hum is muffled, the dark doesn't drain Resolve). */
export interface LevelCamera extends CameraZone {
  readonly indoors?: boolean;
}

export type DressingMaterial = 'cliff' | 'floor' | 'stone';

/** Things the renderer draws that the simulation never touches. Heights are in world metres. */
export type Dressing =
  | { readonly kind: 'block'; readonly box: Box2; readonly bottom: number; readonly top: number; readonly material: DressingMaterial; readonly castShadow?: boolean }
  | { readonly kind: 'light'; readonly x: number; readonly y: number; readonly z: number; readonly color: number; readonly intensity: number; readonly distance: number; readonly decay: number }
  /** A lighthouse's slow sweep of light, turning about this point. */
  | { readonly kind: 'beam'; readonly x: number; readonly y: number; readonly z: number };

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
  /** Indoor spaces: the dead don't drain Resolve through the dark here, and a night here is a refuge. */
  readonly interiors: readonly Box2[];
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

export function isIndoors(level: LevelDef, x: number, z: number): boolean {
  return level.interiors.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
}

/** Spacing of the grid that checks every walkable spot has a camera. */
const CAMERA_CHECK_STEP = 0.5;

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
