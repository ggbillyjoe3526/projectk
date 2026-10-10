import type { Box2, GroundKind, Prop, Wall, WorldDef } from './types';

/**
 * Ground as data: a list of regions, each a box with a kind and a height. A region's height is flat, or a slope that
 * runs linearly from `from` at the box's low edge to `to` at its high edge along one axis (a ramp). Regions are matched
 * in order, so an earlier one wins where two overlap; anywhere outside every region is the channel, deep water at
 * `channelFloor` that is never walkable.
 */

export interface Slope {
  readonly axis: 'x' | 'z';
  readonly from: number;
  readonly to: number;
}

export interface GroundRegion extends Box2 {
  readonly kind: Exclude<GroundKind, 'channel'>;
  readonly height: number | Slope;
}

/** Everything the simulation needs to know about a place, as plain data. */
export interface WorldData {
  readonly channelFloor: number;
  readonly ground: readonly GroundRegion[];
  readonly walls: readonly Wall[];
  readonly props: readonly Prop[];
  readonly listeningPosts: WorldDef['listeningPosts'];
  readonly spawn: WorldDef['spawn'];
}

export function inBox(b: Box2, x: number, z: number): boolean {
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

/** A region's height at a point inside it. */
export function regionHeight(r: GroundRegion, x: number, z: number): number {
  const h = r.height;
  if (typeof h === 'number') return h;
  const [v, lo, hi] = h.axis === 'x' ? [x, r.minX, r.maxX] : [z, r.minZ, r.maxZ];
  const k = hi > lo ? Math.min(1, Math.max(0, (v - lo) / (hi - lo))) : 0;
  return h.from + (h.to - h.from) * k;
}

/** The simulation's view of the data: `groundAt` answers from the regions. */
export function buildWorld(data: WorldData): WorldDef {
  const { ground, channelFloor } = data;
  const channel = { height: channelFloor, kind: 'channel' as const };
  return {
    walls: data.walls,
    props: data.props,
    listeningPosts: data.listeningPosts,
    spawn: data.spawn,
    groundAt(x: number, z: number) {
      for (const r of ground) if (inBox(r, x, z)) return { height: regionHeight(r, x, z), kind: r.kind };
      return channel;
    },
  };
}
