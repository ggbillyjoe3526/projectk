/** Axis-aligned box on the ground plane, with a height for rendering. */
export interface Box2 {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface Wall extends Box2 {
  readonly height: number;
  readonly kind: 'stone' | 'cottage' | 'lighthouse' | 'standingStone' | 'boulder' | 'dyke' | 'house' | 'kirk' | 'gravestone' | 'gate' | 'pew';
  /** Where the wall stands, for one outside the walkable ground (a house front, a boundary dyke); otherwise the ground's height. */
  readonly base?: number;
}

/**
 * What the ground is. The islet is the Brough, where the dead never set foot; `channel` is deep water and never walkable.
 */
export type GroundKind = 'islet' | 'causeway' | 'shore' | 'road' | 'grass' | 'flagstone' | 'channel';

export interface Prop {
  readonly kind: 'pebble' | 'puddle';
  readonly x: number;
  readonly z: number;
  readonly size: number;
}

export interface WorldDef {
  readonly walls: readonly Wall[];
  readonly props: readonly Prop[];
  /** Ground height and kind at a point. `channel` is deep water and never walkable. */
  groundAt(x: number, z: number): { height: number; kind: GroundKind };
  /** Places where listening gives a clear reading (bedrock, standing stones). */
  readonly listeningPosts: readonly { x: number; z: number; radius: number }[];
  readonly spawn: { x: number; z: number; facing: number };
}
