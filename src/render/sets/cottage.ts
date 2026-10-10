import {
  type BufferGeometry, CylinderGeometry, Group, LatheGeometry, type Material, Mesh, MeshStandardNodeMaterial, type Object3D, PointLight,
  type Scene, Vector2,
} from 'three/webgpu';
import { type CottageDressing, VIGIL_MESHES } from '../../content/level';
import { applyPs1Snap } from '../retro/ps1Snap';
import type { StaticBatch } from '../staticBatch';
import { surface, tiledBox, tileOf } from '../textures/surfaces';

/**
 * The father's cottage on the Brough, the first space built to the round 3 standard (art direction, approved
 * 2026-10-10): flagstone floor, lime-washed walls, a rubble hearth with a peat fire, the dresser, the table where the
 * notebook turns up, the empty bier where the coffin lay for the vigil, a candle and the plate of salt, under a boarded
 * ceiling and, outside, a slate roof and a chimney. On the vigil night (chapter 1, `vigil`) the coffin is on the bier and
 * the customs' pieces (VIGIL_MESHES) are drawn on their own, for the chapter to show as William does them. Everything is
 * made here or by render/textures: nothing scanned or licensed. Static pieces go into the level's static batch, so the
 * room costs a few draw calls.
 */

const plainCache = new Map<string, MeshStandardNodeMaterial>();

/** An untextured material, shared by colour and finish. */
function plain(color: number, roughness = 0.8, emissive = 0, emissiveIntensity = 1): MeshStandardNodeMaterial {
  const key = `${color}/${roughness}/${emissive}/${emissiveIntensity}`;
  let m = plainCache.get(key);
  if (!m) {
    m = applyPs1Snap(new MeshStandardNodeMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity })) as MeshStandardNodeMaterial;
    plainCache.set(key, m);
  }
  return m;
}

const lathe = (points: [number, number][], segments = 12): LatheGeometry => new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);

export interface CottageSet {
  readonly flames: { light: PointLight; base: number }[];
  readonly thingMeshes: Map<string, Object3D>;
}

export function buildCottage(d: CottageDressing, batch: StaticBatch, scene: Scene): CottageSet {
  const F = d.floor;
  const R = d.room;
  const H = d.height;
  const T = d.wall;
  const flames: { light: PointLight; base: number }[] = [];
  const thingMeshes = new Map<string, Object3D>();

  const wood = surface('boards');
  const darkWood = surface('darkBoards');
  const rubble = surface('rubble');
  const plaster = surface('plaster');
  const brassPlate = plain(0xa8883e, 0.3);

  /** A box from its extents, textured at the material's scale. */
  const box = (m: Material, minX: number, maxX: number, y0: number, y1: number, minZ: number, maxZ: number, cast = true): void => {
    batch.put(tiledBox(maxX - minX, y1 - y0, maxZ - minZ, tileOf(m)), m, (minX + maxX) / 2, (y0 + y1) / 2, (minZ + maxZ) / 2, cast);
  };
  const piece = (g: BufferGeometry, m: Material, x: number, y: number, z: number, cast = true, rotY = 0): void => {
    if (rotY) g.rotateY(rotY);
    batch.put(g, m, x, y, z, cast);
  };

  // --- the room ---
  // Flagstones, and a worn rug under the table.
  box(surface('flagstones'), R.minX, R.maxX, F, F + 0.03, R.minZ, R.maxZ, false);
  box(surface('rug'), d.table.minX - 0.9, d.table.maxX + 0.9, F + 0.03, F + 0.04, d.table.minZ - 0.5, d.table.maxZ + 0.6, false);
  // Lime plaster lining the walls inside (the walls themselves are harled outside), split round the door.
  const lining = 0.03;
  box(plaster, R.minX, R.maxX, F, F + H, R.minZ, R.minZ + lining, false);
  box(plaster, R.minX, R.maxX, F, F + H, R.maxZ - lining, R.maxZ, false);
  // The west wall, round the bedroom's doorway when there is one.
  const westSpans: [number, number][] = d.bedroom ? [[R.minZ, d.bedroom.door[0]], [d.bedroom.door[1], R.maxZ]] : [[R.minZ, R.maxZ]];
  for (const [z0, z1] of westSpans) box(plaster, R.minX, R.minX + lining, F, F + H, z0, z1, false);
  box(plaster, R.maxX - lining, R.maxX, F, F + H, R.minZ, -d.door, false);
  box(plaster, R.maxX - lining, R.maxX, F, F + H, d.door, R.maxZ, false);
  // Skirting.
  box(darkWood, R.minX, R.maxX, F, F + 0.14, R.minZ + lining, R.minZ + lining + 0.025, false);
  for (const [z0, z1] of westSpans) box(darkWood, R.minX + lining, R.minX + lining + 0.025, F, F + 0.14, z0, z1, false);
  // A boarded ceiling on heavy beams, just under the wall heads.
  box(wood, R.minX, R.maxX, F + H - 0.04, F + H, R.minZ, R.maxZ, false);
  for (let x = R.minX + 0.9; x < R.maxX - 0.3; x += 1.6) box(darkWood, x - 0.09, x + 0.09, F + H - 0.24, F + H - 0.04, R.minZ, R.maxZ, false);

  // --- the doorway: a painted frame, the door standing open against the wall ---
  const doorGreen = plain(0x2c3a30, 0.6);
  const frameWhite = plain(0xbfb8a6, 0.6);
  for (const z of [-d.door, d.door]) box(frameWhite, R.maxX - 0.08, R.maxX + T, F, F + 2.05, z - 0.05, z + 0.05);
  box(frameWhite, R.maxX - 0.08, R.maxX + T, F + 2.0, F + 2.1, -d.door, d.door);
  box(frameWhite, R.maxX, R.maxX + T, F + 2.1, F + H, -d.door, d.door);
  const leaf = R.maxX - lining;
  box(doorGreen, leaf - 0.05, leaf, F + 0.02, F + 2.0, d.door + 0.04, d.door + 1.44);
  box(plain(0x8a7a4a, 0.3), leaf - 0.1, leaf - 0.05, F + 1.0, F + 1.06, d.door + 1.28, d.door + 1.34);

  // --- the window in the north wall: sash bars over dark glass, a cold glow from outside ---
  const wx = (d.table.minX + d.table.maxX) / 2 + 1.5;
  const wy0 = F + 1.0;
  const wy1 = F + 1.9;
  const glass = plain(0x0e1620, 0.1, 0x1a2638, 0.6);
  box(glass, wx - 0.5, wx + 0.5, wy0, wy1, R.minZ + lining, R.minZ + lining + 0.01, false);
  for (const x of [wx - 0.5, wx, wx + 0.5]) box(frameWhite, x - 0.03, x + 0.03, wy0, wy1, R.minZ + lining, R.minZ + 0.08, false);
  for (const y of [wy0, (wy0 + wy1) / 2, wy1]) box(frameWhite, wx - 0.53, wx + 0.53, y - 0.03, y + 0.03, R.minZ + lining, R.minZ + 0.08, false);
  box(wood, wx - 0.6, wx + 0.6, wy0 - 0.05, wy0, R.minZ, R.minZ + 0.18);
  if (d.vigil) {
    // The lower sash pushed up: a dark gap to the night under it, and its rail raised.
    const open = new Group();
    const gap = new Mesh(tiledBox(0.94, 0.22, 0.01, 1), plain(0x020304, 1));
    gap.position.set(wx, wy0 + 0.11, R.minZ + lining + 0.012);
    const rail = new Mesh(tiledBox(1.06, 0.06, 0.07, 1), frameWhite);
    rail.position.set(wx, wy0 + 0.25, R.minZ + 0.06);
    open.add(gap, rail);
    open.visible = false;
    scene.add(open);
    thingMeshes.set(VIGIL_MESHES.windowOpen, open);
  }

  // --- the hearth: rubble surround and chimney breast, a timber mantel, the peat fire ---
  const h = d.hearth;
  const hx = (h.minX + h.maxX) / 2;
  const open = 0.45;
  box(rubble, h.minX, hx - open, F, F + 1.3, h.minZ, h.maxZ);
  box(rubble, hx + open, h.maxX, F, F + 1.3, h.minZ, h.maxZ);
  box(rubble, hx - open, hx + open, F + 0.8, F + 1.3, h.minZ, h.maxZ);
  box(rubble, h.minX + 0.15, h.maxX - 0.15, F + 1.3, F + H, h.minZ, h.maxZ - 0.12);
  box(plain(0x0a0807, 1), hx - open, hx + open, F, F + 0.8, h.minZ, h.minZ + 0.1, false);
  box(plain(0x1a1714, 1), hx - open, hx + open, F, F + 0.02, h.minZ, h.maxZ, false);
  box(darkWood, h.minX - 0.08, h.maxX + 0.08, F + 1.3, F + 1.38, h.minZ, h.maxZ + 0.1);
  // Peat: dark bricks, some with the glow in their cracks.
  const embers = plain(0x2a1a12, 0.9, 0xff5a18, 1.6);
  const peat = plain(0x1c120c, 1, 0xff4010, 0.3);
  for (let i = 0; i < 8; i++) {
    const g = tiledBox(0.16, 0.07, 0.1, 1);
    g.rotateZ(((i * 37) % 10) * 0.04 - 0.2);
    piece(g, i % 3 === 0 ? embers : peat, hx - 0.25 + (i % 4) * 0.16, F + 0.06 + Math.floor(i / 4) * 0.06, h.minZ + 0.2 + (i % 2) * 0.08, false, (i * 0.7) % 1.2);
  }
  const fire = new PointLight(0xff8a3c, 7, 9, 1.6);
  fire.position.set(hx, F + 0.55, h.maxZ + 0.35);
  scene.add(fire);
  flames.push({ light: fire, base: fire.intensity });
  // On the mantel: the clock nobody stopped, two photographs.
  piece(tiledBox(0.24, 0.3, 0.14, 1), plain(0x3a2418, 0.5), hx + 0.35, F + 1.53, h.maxZ - 0.05);
  const face = new CylinderGeometry(0.075, 0.075, 0.01, 16);
  face.rotateX(Math.PI / 2);
  piece(face, plain(0xd8d0b8, 0.4), hx + 0.35, F + 1.56, h.maxZ + 0.025);
  for (const [x, ht] of [[-0.45, 0.2], [-0.15, 0.15]] as const) piece(tiledBox(ht * 0.8, ht, 0.02, 1), plain(0x8a7040, 0.35), hx + x, F + 1.38 + ht / 2, h.maxZ - 0.1);
  // His chair by the fire.
  const tweed = plain(0x4a4232, 0.95);
  const cx = hx + 1.5;
  const cz = h.maxZ + 0.9;
  box(tweed, cx - 0.35, cx + 0.35, F + 0.1, F + 0.42, cz - 0.32, cz + 0.32);
  box(tweed, cx - 0.35, cx + 0.35, F + 0.42, F + 1.0, cz + 0.18, cz + 0.34);
  for (const s of [-1, 1]) box(tweed, cx + s * 0.35 - 0.07, cx + s * 0.35 + 0.07, F + 0.1, F + 0.62, cz - 0.32, cz + 0.32);

  // --- the table, the notebook on it once it's been looked for ---
  const t = d.table;
  const top = F + 0.78;
  box(wood, t.minX, t.maxX, top - 0.05, top, t.minZ, t.maxZ);
  for (const [x, z] of [[t.minX + 0.08, t.minZ + 0.08], [t.maxX - 0.08, t.minZ + 0.08], [t.minX + 0.08, t.maxZ - 0.08], [t.maxX - 0.08, t.maxZ - 0.08]] as const) {
    box(darkWood, x - 0.04, x + 0.04, F, top - 0.05, z - 0.04, z + 0.04);
  }
  for (const [x, z, turn] of [[(t.minX + t.maxX) / 2, t.maxZ + 0.4, 0], [t.minX - 0.4, (t.minZ + t.maxZ) / 2, 1]] as const) {
    box(darkWood, x - 0.2, x + 0.2, F + 0.42, F + 0.46, z - 0.2, z + 0.2);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) box(darkWood, x + a * 0.17 - 0.02, x + a * 0.17 + 0.02, F, F + 0.42, z + b * 0.17 - 0.02, z + b * 0.17 + 0.02);
    if (turn) box(darkWood, x - 0.2, x - 0.17, F + 0.46, F + 0.95, z - 0.2, z + 0.2);
    else box(darkWood, x - 0.2, x + 0.2, F + 0.46, F + 0.95, z + 0.17, z + 0.2);
  }
  // A mug and the whisky left from the night.
  piece(lathe([[0, 0], [0.04, 0], [0.042, 0.1], [0.038, 0.1], [0.036, 0.008], [0, 0.008]]), plain(0xd8d2c0, 0.3), t.minX + 0.35, top, t.minZ + 0.35);
  piece(lathe([[0, 0], [0.042, 0], [0.044, 0.18], [0.03, 0.22], [0.014, 0.24], [0.014, 0.3], [0, 0.3]]), plain(0x1e3018, 0.1, 0x050a04), t.maxX - 0.3, top, t.minZ + 0.3);
  const notebook = new Group();
  const cover = new Mesh(tiledBox(0.17, 0.025, 0.23, 1), plain(0x3a2a1c, 0.7));
  const pages = new Mesh(tiledBox(0.16, 0.018, 0.22, 1), plain(0xd8ceb4, 0.9));
  pages.position.set(0.004, 0.012, 0);
  notebook.add(cover, pages);
  notebook.position.set((t.minX + t.maxX) / 2 - 0.1, top + 0.0125, (t.minZ + t.maxZ) / 2 + 0.15);
  notebook.rotation.y = 0.35;
  notebook.visible = false;
  scene.add(notebook);
  thingMeshes.set(d.notebook, notebook);

  // --- the dresser: drawers below (the kitchen knife in one), a rack of plates above ---
  const dr = d.dresser;
  box(wood, dr.minX, dr.maxX, F, F + 0.86, dr.minZ, dr.maxZ);
  box(darkWood, dr.minX - 0.03, dr.maxX + 0.03, F + 0.86, F + 0.9, dr.minZ - 0.04, dr.maxZ);
  for (const x of [dr.minX + (dr.maxX - dr.minX) / 4, dr.maxX - (dr.maxX - dr.minX) / 4]) {
    box(darkWood, x - 0.32, x + 0.32, F + 0.66, F + 0.8, dr.minZ - 0.015, dr.minZ, false);
    box(plain(0x8a7a4a, 0.3), x - 0.05, x + 0.05, F + 0.71, F + 0.75, dr.minZ - 0.04, dr.minZ - 0.015, false);
  }
  box(wood, dr.minX, dr.maxX, F + 0.9, F + 2.0, dr.maxZ - 0.04, dr.maxZ);
  for (const y of [F + 1.3, F + 1.66, F + 2.0]) box(wood, dr.minX, dr.maxX, y - 0.03, y, dr.maxZ - 0.24, dr.maxZ);
  for (const x of [dr.minX, dr.maxX - 0.03]) box(wood, x, x + 0.03, F + 0.9, F + 2.0, dr.maxZ - 0.24, dr.maxZ);
  const willow = plain(0xc8ccd0, 0.25);
  const blue = plain(0x3a5070, 0.3);
  for (const [row, y] of [[0, F + 1.3], [1, F + 1.66]] as const) {
    for (let i = 0; i < 5; i++) {
      const plate = new CylinderGeometry(0.13, 0.13, 0.015, 16);
      plate.rotateX(Math.PI / 2 - 0.2);
      piece(plate, (i + row) % 3 === 0 ? blue : willow, dr.minX + 0.18 + i * 0.3, y + 0.14, dr.maxZ - 0.12, false);
    }
  }
  for (let i = 0; i < 3; i++) piece(lathe([[0, 0], [0.05, 0], [0.06, 0.08], [0.045, 0.14], [0.05, 0.16], [0, 0.16]]), willow, dr.minX + 0.3 + i * 0.5, F + 0.9, dr.minZ + 0.25);

  // --- the bier: two trestles, with the coffin on them for the vigil, or a sheet left folded on them after ---
  const b = d.bier;
  const bz = (b.minZ + b.maxZ) / 2;
  for (const x of [b.minX + 0.35, b.maxX - 0.35]) {
    box(darkWood, x - 0.05, x + 0.05, F + 0.58, F + 0.66, b.minZ, b.maxZ);
    for (const z of [b.minZ + 0.06, b.maxZ - 0.06]) box(darkWood, x - 0.03, x + 0.03, F, F + 0.58, z - 0.03, z + 0.03);
  }
  if (!d.vigil) box(plain(0xd8d4c8, 0.95), b.minX + 0.2, b.minX + 0.75, F + 0.66, F + 0.74, bz - 0.3, bz + 0.3);
  // The vigil night: the coffin on the trestles, plain oak with brass handles and a brass plate on the lid.
  const lid = F + 1.12;
  if (d.vigil) {
    const coffin = new Group();
    const oak = plain(0x6a4a2a, 0.55);
    const shell = new Mesh(tiledBox(1.95, 0.44, 0.58, 1), oak);
    shell.position.set(0, F + 0.88, 0);
    const board = new Mesh(tiledBox(2.01, 0.06, 0.64, 1), oak);
    board.position.set(0, lid - 0.03, 0);
    const plate = new Mesh(tiledBox(0.3, 0.005, 0.12, 1), brassPlate);
    plate.position.set(0.2, lid + 0.003, 0);
    coffin.add(shell, board, plate);
    for (const x of [-0.6, 0, 0.6]) {
      for (const z of [-0.3, 0.3]) {
        const handle = new Mesh(tiledBox(0.18, 0.03, 0.03, 1), brassPlate);
        handle.position.set(x, F + 0.9, z * 1.03);
        coffin.add(handle);
      }
    }
    coffin.position.set((b.minX + b.maxX) / 2, 0, bz);
    coffin.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    scene.add(coffin);
    thingMeshes.set(VIGIL_MESHES.coffin, coffin);
  }
  // The candle at its head, on a stool, and the plate of salt beside it.
  const sx = b.maxX + 0.45;
  const sz = bz;
  piece(new CylinderGeometry(0.2, 0.2, 0.05, 14), darkWood, sx, F + 0.62, sz);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    piece(new CylinderGeometry(0.022, 0.026, 0.6, 6), darkWood, sx + Math.cos(a) * 0.13, F + 0.3, sz + Math.sin(a) * 0.13);
  }
  const brass = plain(0x9a7a3a, 0.35);
  piece(lathe([[0, 0], [0.06, 0], [0.065, 0.008], [0.02, 0.015], [0.018, 0.04], [0.03, 0.045], [0, 0.046]]), brass, sx, F + 0.645, sz);
  piece(new CylinderGeometry(0.018, 0.018, 0.18, 8), plain(0xe8e0c8, 0.6), sx, F + 0.78, sz);
  // On the vigil night it waits to be lit: the flame and its light are one thing mesh.
  const lit = new Group();
  const flame = new Mesh(new CylinderGeometry(0.004, 0.012, 0.035, 6), plain(0xffc070, 1, 0xffb050, 3));
  flame.position.set(sx, F + 0.89, sz);
  const candle = new PointLight(0xffb060, 1.6, 5, 1.8);
  candle.position.set(sx, F + 0.95, sz);
  lit.add(flame, candle);
  scene.add(lit);
  flames.push({ light: candle, base: candle.intensity });
  if (d.vigil) {
    lit.visible = false;
    thingMeshes.set(VIGIL_MESHES.candleFlame, lit);
  }
  // The plate of salt: by the candle, or on the vigil night on the table, waiting to be put where it goes.
  const saucer = (x: number, y: number, z: number): Group => {
    const g = new Group();
    const dish = new Mesh(lathe([[0, 0], [0.09, 0], [0.1, 0.012], [0.095, 0.014], [0.07, 0.006], [0, 0.006]], 16), plain(0xe8e6dc, 0.25));
    const heap = new Mesh(new CylinderGeometry(0, 0.055, 0.035, 12), plain(0xf2f2ee, 0.9));
    heap.position.y = 0.023;
    g.add(dish, heap);
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  };
  if (!d.vigil) {
    piece(lathe([[0, 0], [0.09, 0], [0.1, 0.012], [0.095, 0.014], [0.07, 0.006], [0, 0.006]], 16), plain(0xe8e6dc, 0.25), sx + 0.08, F + 0.645, sz + 0.09);
    const salt = new CylinderGeometry(0, 0.055, 0.035, 12);
    piece(salt, plain(0xf2f2ee, 0.9), sx + 0.08, F + 0.668, sz + 0.09);
  } else {
    thingMeshes.set(VIGIL_MESHES.saltOnTable, saucer((t.minX + t.maxX) / 2, top, t.maxZ - 0.25));
    const onLid = saucer((b.minX + b.maxX) / 2 - 0.25, lid, bz);
    onLid.visible = false;
    thingMeshes.set(VIGIL_MESHES.saltOnCoffin, onLid);
  }

  // --- the west wall: a mirror nobody covered, a shelf of his books ---
  const mirrorZ = (h.maxZ + d.table.minZ) / 2;
  box(plain(0x3a2418, 0.5), R.minX, R.minX + 0.05, F + 1.1, F + 1.9, mirrorZ - 0.32, mirrorZ + 0.32, false);
  box(plain(0x8a9094, 0.08), R.minX + 0.05, R.minX + 0.055, F + 1.16, F + 1.84, mirrorZ - 0.26, mirrorZ + 0.26, false);
  if (d.vigil) {
    // Turned to the wall: its plain wooden back is all that shows.
    const back = new Mesh(tiledBox(0.04, 0.8, 0.64, 1), plain(0x4a3626, 0.9));
    back.position.set(R.minX + 0.075, F + 1.5, mirrorZ);
    back.visible = false;
    scene.add(back);
    thingMeshes.set(VIGIL_MESHES.mirrorTurned, back);
  }
  const shelfZ0 = d.table.minZ + 0.2;
  const shelfZ1 = shelfZ0 + 0.9;
  box(wood, R.minX, R.minX + 0.32, F, F + 0.03, shelfZ0, shelfZ1);
  for (const z of [shelfZ0, shelfZ1 - 0.03]) box(wood, R.minX, R.minX + 0.32, F, F + 1.8, z, z + 0.03);
  const spines = [0x5a2a22, 0x2a3a4a, 0x4a4a2a, 0x6a5a40, 0x2a2a2a, 0x3a2a3a, 0x7a6a50].map((c) => plain(c, 0.7));
  for (let s = 0; s < 4; s++) {
    const y = F + 0.1 + s * 0.44;
    box(wood, R.minX, R.minX + 0.32, y - 0.03, y, shelfZ0, shelfZ1);
    let z = shelfZ0 + 0.05;
    let n = s * 7;
    while (z < shelfZ1 - 0.08) {
      const w = 0.03 + ((n * 13) % 5) * 0.008;
      const ht = 0.22 + ((n * 7) % 6) * 0.025;
      box(spines[n % spines.length]!, R.minX + 0.04, R.minX + 0.26, y, y + ht, z, z + w, false);
      z += w + 0.004;
      n++;
    }
  }

  // --- the bedroom off the west gable: his bed, a chest of drawers, a small window, a lean-to roof ---
  if (d.bedroom) {
    const B = d.bedroom.room;
    const BH = d.bedroom.height;
    const [dz0, dz1] = d.bedroom.door;
    box(surface('boards'), B.minX, R.minX, F, F + 0.03, B.minZ, B.maxZ, false);
    box(plaster, B.minX, B.maxX, F, F + BH, B.minZ, B.minZ + lining, false);
    box(plaster, B.minX, B.maxX, F, F + BH, B.maxZ - lining, B.maxZ, false);
    box(plaster, B.minX, B.minX + lining, F, F + BH, B.minZ, B.maxZ, false);
    for (const [z0, z1] of [[B.minZ, dz0], [dz1, B.maxZ]] as const) box(plaster, B.maxX - lining, B.maxX, F, F + BH, z0, z1, false);
    box(wood, B.minX, R.minX, F + BH - 0.04, F + BH, B.minZ, B.maxZ, false);
    // The doorway: a plain frame through the thickness of the gable.
    for (const z of [dz0, dz1]) box(frameWhite, B.maxX - 0.02, R.minX + 0.02, F, F + 2.0, z - 0.04, z + 0.04);
    box(frameWhite, B.maxX - 0.02, R.minX + 0.02, F + 2.0, F + 2.08, dz0 - 0.04, dz1 + 0.04);
    // The bed: an iron frame, a mattress, a grey blanket turned down, a pillow at the head.
    const bed = d.bedroom.bed;
    const iron = plain(0x2a2a2c, 0.5);
    for (const z of [bed.minZ + 0.03, bed.maxZ - 0.05]) box(iron, bed.minX, bed.maxX, F, F + (z > bed.minZ + 0.5 ? 0.95 : 0.65), z - 0.025, z + 0.025);
    box(plain(0xd8d2c4, 0.9), bed.minX + 0.04, bed.maxX - 0.04, F + 0.3, F + 0.48, bed.minZ + 0.06, bed.maxZ - 0.08);
    box(plain(0x5a5c58, 0.95), bed.minX + 0.02, bed.maxX - 0.02, F + 0.48, F + 0.52, bed.minZ + 0.05, bed.maxZ - 0.55);
    box(plain(0xe8e4da, 0.9), bed.minX + 0.15, bed.maxX - 0.15, F + 0.52, F + 0.62, bed.maxZ - 0.48, bed.maxZ - 0.12);
    // The chest of drawers, a lamp and a photograph on it.
    const dw = d.bedroom.drawers;
    box(wood, dw.minX, dw.maxX, F, F + 0.9, dw.minZ, dw.maxZ);
    for (const y of [F + 0.2, F + 0.48, F + 0.76]) box(darkWood, dw.minX + 0.04, dw.maxX - 0.04, y - 0.1, y + 0.1, dw.maxZ, dw.maxZ + 0.015, false);
    piece(lathe([[0, 0], [0.06, 0], [0.04, 0.02], [0.015, 0.03], [0.015, 0.25], [0.1, 0.26], [0.08, 0.38], [0, 0.38]]), plain(0x6a5a40, 0.5), dw.minX + 0.2, F + 0.9, (dw.minZ + dw.maxZ) / 2);
    piece(tiledBox(0.16, 0.2, 0.02, 1), plain(0x8a7040, 0.35), dw.maxX - 0.25, F + 1.0, dw.minZ + 0.12);
    // A small window in the west wall, dark glass and a white frame.
    const wz = (B.minZ + dw.maxZ) / 2 + 1.2;
    box(glass, B.minX + lining, B.minX + lining + 0.01, F + 1.1, F + 1.75, wz - 0.32, wz + 0.32, false);
    for (const z of [wz - 0.32, wz, wz + 0.32]) box(frameWhite, B.minX + lining, B.minX + 0.07, F + 1.1, F + 1.75, z - 0.025, z + 0.025, false);
    for (const y of [F + 1.1, F + 1.75]) box(frameWhite, B.minX + lining, B.minX + 0.07, y - 0.025, y + 0.025, wz - 0.34, wz + 0.34, false);
    // Outside: a lean-to of slates falling from the gable to the bedroom's west wall.
    const high = F + BH + 0.5;
    const low = F + BH + 0.05;
    const run = R.minX - T - (B.minX - T) + 0.3;
    const lean = tiledBox(Math.hypot(run, high - low), 0.08, B.maxZ - B.minZ + 2 * T + 0.3, tileOf(surface('slates')));
    lean.rotateZ(Math.atan2(high - low, run));
    piece(lean, surface('slates'), (R.minX - T + B.minX - T - 0.3) / 2, (high + low) / 2 + 0.04, (B.minZ + B.maxZ) / 2);
    box(surface('harl'), B.minX - T, R.minX - T, F + BH, low, B.minZ - T, B.maxZ + T);
  }

  // --- by the door: the tide table pinned to the wall ---
  box(plain(0xd8d0b8, 0.9), R.maxX - lining - 0.005, R.maxX - lining, F + 1.25, F + 1.6, -1.95, -1.65, false);

  // --- outside: gables, a slate roof and the chimney ---
  const eaves = F + H;
  const ridge = eaves + 1.7;
  const harl = surface('harl');
  const slates = surface('slates');
  const halfSpan = (R.maxZ - R.minZ) / 2 + T + 0.3;
  const midZ = (R.minZ + R.maxZ) / 2;
  const slope = Math.hypot(halfSpan, ridge - eaves);
  const pitch = Math.atan2(ridge - eaves, halfSpan);
  for (const side of [-1, 1]) {
    const g = tiledBox(R.maxX - R.minX + 2 * T + 0.4, 0.08, slope, tileOf(slates));
    g.rotateX(-side * pitch);
    piece(g, slates, (R.minX + R.maxX) / 2, (eaves + ridge) / 2 + 0.04, midZ - (side * halfSpan) / 2);
  }
  for (const x of [R.minX - T, R.maxX]) {
    // Each gable as stacked courses narrowing to the ridge.
    const courses = 8;
    for (let i = 0; i < courses; i++) {
      const k = 1 - i / courses;
      const half = (halfSpan - 0.3) * k;
      box(harl, x, x + T, eaves + (i * (ridge - eaves)) / courses, eaves + ((i + 1) * (ridge - eaves)) / courses, midZ - half, midZ + half);
    }
  }
  box(rubble, hx - 0.45, hx + 0.45, eaves, ridge + 0.7, R.minZ - T, R.minZ + 0.5);
  for (const x of [hx - 0.18, hx + 0.18]) piece(new CylinderGeometry(0.1, 0.12, 0.35, 8), plain(0x8a5a3a, 0.8), x, ridge + 0.87, R.minZ + 0.1);

  return { flames, thingMeshes };
}
