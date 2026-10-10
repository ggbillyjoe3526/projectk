import {
  AdditiveBlending, BoxGeometry, CylinderGeometry, Group, Mesh, MeshBasicNodeMaterial, MeshStandardNodeMaterial, type Object3D,
  PlaneGeometry, PointLight, type Scene,
} from 'three/webgpu';
import { float, uniform, uv } from 'three/tsl';
import { FERRY, FERRY_CENTRE } from '../../content/levels/ferry';
import type { ShipPose } from '../../game/crossing/evening';
import { applyPs1Snap } from '../retro/ps1Snap';

/**
 * The small island ferry William comes in on (chapter 1), in greybox: a dark hull with a white bulwark, a lounge with
 * lit windows amidships, the wheelhouse and funnel above, rails round the deck, the bench at the stern with his bag,
 * deck lights and running lights, and its wake. It's built about the deck's middle and drawn wherever the voyage puts
 * it (game/crossing/evening.ts), rolling a little on the swell. The gangway is drawn apart, at the pier, while it's out.
 */

function mat(color: number, roughness = 0.8, emissive = 0, emissiveIntensity = 1): MeshStandardNodeMaterial {
  return applyPs1Snap(new MeshStandardNodeMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity })) as MeshStandardNodeMaterial;
}

const HULL = mat(0x1c2228, 0.7);
const BOOT = mat(0x6a1e1a, 0.7);
const WHITE = mat(0xc8c8c0, 0.6);
const DECK = mat(0x3a4044, 0.9);
const RAIL = mat(0xb8b8b0, 0.5);
const FUNNEL = mat(0x7a2a22, 0.6);
const DARK = mat(0x15181a, 0.6);
const WINDOW = mat(0x2a2618, 0.3, 0xffc878, 1.4);
const BENCH = mat(0x4a3a2a, 0.9);
const BAG = mat(0x2a3440, 0.9);

export interface FerrySet {
  readonly ship: Group;
  readonly gangway: Group;
  /** The bag on the stern bench, there until William takes it ashore. */
  readonly bag: Object3D;
  /** Draw the ship at `pose`, rolling on the swell (`now`, seconds), its wake as strong as `speed` (0..1), at `sea` level. */
  update(pose: ShipPose, now: number, speed: number, sea: number): void;
}

export function buildFerry(scene: Scene): FerrySet {
  const ship = new Group();
  const hull = new Group();
  ship.add(hull);
  const d = FERRY.deck;
  const top = FERRY.top;
  const cx = FERRY_CENTRE.x;
  const cz = FERRY_CENTRE.z;
  /** A box from world extents on the deck, placed in the ship's own frame. */
  const part = (m: MeshStandardNodeMaterial, minX: number, maxX: number, y0: number, y1: number, minZ: number, maxZ: number, cast = true): Mesh => {
    const mesh = new Mesh(new BoxGeometry(maxX - minX, y1 - y0, maxZ - minZ), m);
    mesh.position.set((minX + maxX) / 2 - cx, (y0 + y1) / 2, (minZ + maxZ) / 2 - cz);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    hull.add(mesh);
    return mesh;
  };

  // The hull: a long box, a pointed bow (a box turned on its corner), a red boot-top at the waterline.
  const half = (d.maxX - d.minX) / 2 + 0.2;
  part(HULL, d.minX - 0.2, d.maxX + 0.2, top - 4.2, top - 0.6, d.minZ + 3, d.maxZ);
  part(BOOT, d.minX - 0.21, d.maxX + 0.21, top - 3.2, top - 2.7, d.minZ + 3, d.maxZ + 0.01, false);
  part(WHITE, d.minX - 0.2, d.maxX + 0.2, top - 0.6, top, d.minZ + 3, d.maxZ);
  const bow = new Mesh(new BoxGeometry(half * Math.SQRT2, 4.2, half * Math.SQRT2), HULL);
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, top - 2.1, d.minZ + 3 - cz);
  bow.castShadow = true;
  hull.add(bow);
  // The deck, and the rails round it (a top bar on posts), open at the gangway.
  part(DECK, d.minX, d.maxX, top - 0.05, top, d.minZ, d.maxZ, false);
  const t = FERRY.rail;
  const g = FERRY.gangway;
  const railRuns: [number, number, number, number][] = [
    [d.minX, d.minX + t, d.minZ, g.minZ],
    [d.minX, d.minX + t, g.maxZ, d.maxZ],
    [d.maxX - t, d.maxX, d.minZ, d.maxZ],
    [d.minX, d.maxX, d.maxZ - t, d.maxZ],
    [d.minX, d.maxX, d.minZ, d.minZ + t],
  ];
  for (const [x0, x1, z0, z1] of railRuns) {
    part(RAIL, x0, x1, top + 1.0, top + 1.06, z0, z1, false);
    part(RAIL, x0, x1, top + 0.5, top + 0.53, z0, z1, false);
    const along = x1 - x0 > z1 - z0;
    const len = along ? x1 - x0 : z1 - z0;
    for (let k = 0; k <= len; k += 1.4) {
      const px = along ? x0 + k : (x0 + x1) / 2;
      const pz = along ? (z0 + z1) / 2 : z0 + k;
      part(RAIL, px - 0.03, px + 0.03, top, top + 1.0, pz - 0.03, pz + 0.03, false);
    }
  }
  // The lounge amidships, its windows lit, the wheelhouse above it, the funnel and a mast.
  const l = FERRY.lounge;
  part(WHITE, l.minX, l.maxX, top, top + 2.6, l.minZ, l.maxZ);
  for (const side of [l.minX - 0.01, l.maxX - 0.02]) part(WINDOW, side, side + 0.03, top + 1.2, top + 1.9, l.minZ + 0.6, l.maxZ - 0.6, false);
  part(WINDOW, l.minX + 0.4, l.maxX - 0.4, top + 1.2, top + 1.9, l.maxZ - 0.01, l.maxZ + 0.02, false);
  part(DARK, l.minX + 1.6, l.minX + 2.4, top, top + 2.0, l.maxZ, l.maxZ + 0.04, false);
  part(WHITE, l.minX + 0.5, l.maxX - 0.5, top + 2.6, top + 4.4, l.minZ + 0.4, l.minZ + 4.4);
  part(WINDOW, l.minX + 0.5, l.maxX - 0.5, top + 3.4, top + 4.0, l.minZ + 0.38, l.minZ + 0.42, false);
  part(DARK, l.minX + 0.3, l.maxX - 0.3, top + 4.4, top + 4.55, l.minZ + 0.2, l.minZ + 4.6);
  const funnel = new Mesh(new CylinderGeometry(0.55, 0.65, 2.4, 10), FUNNEL);
  funnel.position.set((l.minX + l.maxX) / 2 - cx, top + 3.8, l.maxZ - 2.6 - cz);
  funnel.castShadow = true;
  hull.add(funnel);
  part(DARK, (l.minX + l.maxX) / 2 - 0.58, (l.minX + l.maxX) / 2 + 0.58, top + 4.9, top + 5.1, l.maxZ - 3.2, l.maxZ - 2.0, false);
  part(RAIL, (l.minX + l.maxX) / 2 - 0.05, (l.minX + l.maxX) / 2 + 0.05, top + 4.4, top + 7.4, l.minZ + 2.2, l.minZ + 2.3, false);
  // The stern bench, and William's bag on it.
  part(BENCH, 38, 41, top + 0.38, top + 0.45, 43.4, 44.1);
  for (const x of [38.2, 40.8]) part(BENCH, x - 0.05, x + 0.05, top, top + 0.38, 43.5, 44.0, false);
  const bag = part(BAG, 39.25, 39.8, top + 0.45, top + 0.75, 43.55, 43.95);
  // Running lights (red to port, green to starboard), a mast-head light, and the deck lights.
  const lamp = (color: number, x: number, y: number, z: number): void => {
    const m = new Mesh(new BoxGeometry(0.12, 0.12, 0.12), mat(color, 0.4, color, 3));
    m.position.set(x - cx, y, z - cz);
    hull.add(m);
  };
  lamp(0xff2a1a, l.minX + 0.4, top + 4.0, l.minZ + 0.6);
  lamp(0x2aff5a, l.maxX - 0.4, top + 4.0, l.minZ + 0.6);
  lamp(0xfff4e0, (l.minX + l.maxX) / 2, top + 7.45, l.minZ + 2.25);
  for (const [x, y, z] of [[cx, top + 2.4, l.maxZ + 0.6], [cx, top + 2.0, d.maxZ - 3.5], [cx, top + 1.8, d.minZ + 2.2]] as const) {
    const light = new PointLight(0xffd8a0, 5, 11, 1.5);
    light.position.set(x - cx, y, z - cz);
    hull.add(light);
  }
  // The wake: churned white under the stern, fading out behind it.
  const wakeStrength = uniform(0);
  const wakeMat = new MeshBasicNodeMaterial({ color: 0xc8d4d8, transparent: true, blending: AdditiveBlending, depthWrite: false });
  wakeMat.opacityNode = wakeStrength.mul(uv().y.pow(2.5)).mul(float(1).sub(uv().x.sub(0.5).abs().mul(2)));
  const wake = new Mesh(new PlaneGeometry(5, 26, 1, 1), wakeMat);
  wake.rotation.x = -Math.PI / 2;
  wake.position.set(0, 0, d.maxZ - cz + 13);
  ship.add(wake);
  scene.add(ship);

  // The gangway, from the pier's edge to the deck, with handrails.
  const gangway = new Group();
  const plank = new Mesh(new BoxGeometry(g.maxX - g.minX, 0.08, g.maxZ - g.minZ - 0.2), DECK);
  plank.position.set((g.minX + g.maxX) / 2, top - 0.02, (g.minZ + g.maxZ) / 2);
  gangway.add(plank);
  for (const z of [g.minZ + 0.12, g.maxZ - 0.12]) {
    const handrail = new Mesh(new BoxGeometry(g.maxX - g.minX, 0.04, 0.04), RAIL);
    handrail.position.set((g.minX + g.maxX) / 2, top + 0.95, z);
    gangway.add(handrail);
    for (const x of [g.minX + 0.1, g.maxX - 0.1]) {
      const post = new Mesh(new BoxGeometry(0.04, 0.95, 0.04), RAIL);
      post.position.set(x, top + 0.47, z);
      gangway.add(post);
    }
  }
  scene.add(gangway);

  return {
    ship,
    gangway,
    bag,
    update(pose: ShipPose, now: number, speed: number, sea: number): void {
      ship.position.set(cx + pose.dx, 0, cz + pose.dz);
      ship.rotation.y = pose.yaw;
      // Rolling and pitching on the swell, and riding it up and down; less tied up than under way.
      const swell = 0.35 + 0.65 * speed;
      hull.rotation.z = Math.sin(now * 0.9) * 0.022 * swell;
      hull.rotation.x = Math.sin(now * 0.63 + 1.1) * 0.012 * swell;
      hull.position.y = Math.sin(now * 0.77) * 0.06 * swell;
      wake.position.y = sea + 0.04;
      wakeStrength.value = 0.22 * speed;
      wake.visible = speed > 0.02;
    },
  };
}
