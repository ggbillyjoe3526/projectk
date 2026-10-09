import {
  AdditiveBlending, BoxGeometry, CapsuleGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight,
  FogExp2, Group, HemisphereLight, Mesh, MeshBasicNodeMaterial, MeshLambertNodeMaterial, Object3D, PlaneGeometry, PointLight,
  Scene, SpotLight,
} from 'three/webgpu';
import { float, length, mix, sin, uniform, uv, vec3 } from 'three/tsl';
import { CAUSEWAY, CHANNEL_FLOOR, ISLET, SHORE } from '../sim/world/broughGreybox';
import type { Wall, WorldDef } from '../sim/world/types';
import { applyPs1Snap } from './retro/ps1Snap';
import { createSea } from './water';

/** Everything the M0 frame needs to animate. */
export interface GreyboxScene {
  readonly scene: Scene;
  readonly sea: Mesh;
  readonly player: Group;
  readonly playerBody: Mesh;
  readonly hand: Mesh;
  readonly torch: SpotLight;
  readonly pebbles: readonly { mesh: Mesh; baseY: number }[];
  readonly ripple: { amount: { value: number }; phase: { value: number } };
  readonly beam: Object3D;
  readonly fog: FogExp2;
}

const NIGHT = new Color(0x0c1317);

function lambert(color: number): MeshLambertNodeMaterial {
  return applyPs1Snap(new MeshLambertNodeMaterial({ color })) as MeshLambertNodeMaterial;
}

const MAT = {
  grass: lambert(0x2e3a2b),
  causeway: lambert(0x4c4e4a),
  seabed: lambert(0x2a2a24),
  cliff: lambert(0x3a3a35),
  cottage: lambert(0x8d8a80),
  lighthouse: lambert(0xb9b6ac),
  stone: lambert(0x5d5e58),
  standingStone: lambert(0x4a4c49),
  dyke: lambert(0x55554e),
  floor: lambert(0x3b332a),
  roof: lambert(0x2b2d2f),
  player: lambert(0x2c3640),
  skin: lambert(0x9c8a7a),
  pebble: lambert(0x77766d),
};

function add(scene: Scene, geometry: BoxGeometry | CylinderGeometry, material: MeshLambertNodeMaterial, x: number, y: number, z: number, cast = true): Mesh {
  const m = new Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function block(scene: Scene, minX: number, maxX: number, bottom: number, top: number, minZ: number, maxZ: number, material: MeshLambertNodeMaterial, cast = false): Mesh {
  return add(scene, new BoxGeometry(maxX - minX, top - bottom, maxZ - minZ), material, (minX + maxX) / 2, (bottom + top) / 2, (minZ + maxZ) / 2, cast);
}

function wallMaterial(w: Wall): MeshLambertNodeMaterial {
  switch (w.kind) {
    case 'cottage': return MAT.cottage;
    case 'standingStone': return MAT.standingStone;
    case 'dyke': return MAT.dyke;
    default: return MAT.stone;
  }
}

export function buildGreybox(world: WorldDef): GreyboxScene {
  const scene = new Scene();
  scene.background = NIGHT;
  const fog = new FogExp2(NIGHT.getHex(), 0.03);
  scene.fog = fog;

  scene.add(new HemisphereLight(0x5d6f7c, 0x15110d, 1.4));
  const moon = new DirectionalLight(0x8ea4b5, 0.9);
  moon.position.set(-30, 40, 25);
  scene.add(moon);

  // Land: the islet, the main island's edge, and the channel floor beneath the sea.
  block(scene, ISLET.minX, ISLET.maxX, CHANNEL_FLOOR, ISLET.top, ISLET.minZ, ISLET.maxZ, MAT.grass);
  block(scene, SHORE.minX, SHORE.maxX, CHANNEL_FLOOR, SHORE.top, SHORE.minZ, SHORE.maxZ, MAT.grass);
  block(scene, SHORE.maxX, SHORE.maxX + 60, CHANNEL_FLOOR, SHORE.top + 6, -60, 60, MAT.cliff); // rising ground beyond
  const bed = new Mesh(new PlaneGeometry(400, 400), MAT.seabed);
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = CHANNEL_FLOOR;
  scene.add(bed);

  // The causeway: a stone spine whose top follows the walkable height.
  const segs = 48;
  const len = CAUSEWAY.maxX - CAUSEWAY.minX;
  for (let i = 0; i < segs; i++) {
    const x0 = CAUSEWAY.minX + (len * i) / segs;
    const x1 = x0 + len / segs;
    const h = world.groundAt((x0 + x1) / 2, 0).height;
    block(scene, x0, x1, CHANNEL_FLOOR, h, -CAUSEWAY.halfWidth, CAUSEWAY.halfWidth, MAT.causeway);
  }

  // Walls and props.
  for (const w of world.walls) {
    const base = world.groundAt((w.minX + w.maxX) / 2, (w.minZ + w.maxZ) / 2).height;
    if (w.kind === 'lighthouse') {
      add(scene, new CylinderGeometry(1.0, 1.25, w.height, 10), MAT.lighthouse, (w.minX + w.maxX) / 2, base + w.height / 2, (w.minZ + w.maxZ) / 2);
      continue;
    }
    block(scene, w.minX, w.maxX, base, base + w.height, w.minZ, w.maxZ, wallMaterial(w), true);
  }
  // Cottage floor (no roof in M0, so the authored camera can see in).
  block(scene, -28, -20, ISLET.top, ISLET.top + 0.03, -3, 3, MAT.floor);
  const stove = new PointLight(0xff8a3c, 6, 9, 1.6);
  stove.position.set(-27, ISLET.top + 1.1, -2.2);
  scene.add(stove);
  block(scene, -27.7, -26.5, ISLET.top, ISLET.top + 0.9, -2.8, -1.8, MAT.stone, true);

  // Pebbles that tremble with the hum, and puddles that ripple.
  const pebbles: { mesh: Mesh; baseY: number }[] = [];
  const ripple = { amount: uniform(0), phase: uniform(0) };
  const puddleMat = new MeshLambertNodeMaterial({ transparent: true });
  const d = length(uv().sub(0.5)).mul(2);
  const rings = sin(d.mul(26).sub(ripple.phase.mul(6.2832))).mul(0.5).add(0.5).mul(float(1).sub(d));
  puddleMat.colorNode = mix(vec3(0.06, 0.09, 0.1), vec3(0.32, 0.38, 0.4), rings.mul(ripple.amount));
  puddleMat.opacityNode = float(1).sub(d.pow(4));
  for (const p of world.props) {
    const g = world.groundAt(p.x, p.z).height;
    if (p.kind === 'pebble') {
      const m = add(scene, new BoxGeometry(p.size, p.size * 0.7, p.size), MAT.pebble, p.x, g + p.size * 0.35, p.z);
      m.rotation.y = (p.x * 13.7 + p.z * 7.1) % Math.PI;
      pebbles.push({ mesh: m, baseY: m.position.y });
    } else {
      const m = new Mesh(new CircleGeometry(p.size, 16), puddleMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(p.x, g + 0.02, p.z);
      scene.add(m);
    }
  }

  // The lighthouse beam: a slow sweep through the haar.
  const beam = new Group();
  beam.position.set(-30, ISLET.top + 8.6, -8);
  const beamMat = new MeshBasicNodeMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false });
  const cone = new Mesh(new ConeGeometry(4.5, 60, 12, 1, true), beamMat);
  cone.rotation.z = Math.PI / 2;
  cone.position.x = 30;
  beam.add(cone);
  scene.add(beam);

  // The player: greybox figure with a hand torch.
  const player = new Group();
  const playerBody = new Mesh(new CapsuleGeometry(0.26, 1.05, 4, 8), MAT.player);
  playerBody.position.y = 0.8;
  playerBody.castShadow = true;
  player.add(playerBody);
  const head = new Mesh(new BoxGeometry(0.26, 0.28, 0.26), MAT.skin);
  head.position.set(0, 0.78, 0);
  head.castShadow = true;
  playerBody.add(head);
  const hand = new Mesh(new BoxGeometry(0.09, 0.09, 0.26), MAT.roof);
  hand.position.set(-0.3, 1.05, 0.28);
  player.add(hand);
  scene.add(player);

  const torch = new SpotLight(0xfff1d8, 26, 18, Math.PI / 8, 0.5, 1.6);
  torch.castShadow = true;
  torch.shadow.mapSize.set(512, 512);
  torch.shadow.camera.near = 0.2;
  torch.shadow.bias = -0.0004;
  scene.add(torch, torch.target);

  const sea = createSea();
  scene.add(sea);

  return { scene, sea, player, playerBody, hand, torch, pebbles, ripple, beam, fog };
}
