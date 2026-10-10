import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- seeded RNG ----------
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- textures ----------
const loader = new THREE.TextureLoader();
const texCache = new Map();
let maxAniso = 8;
export function setAniso(n) { maxAniso = n; }

function loadTex(file, srgb) {
  if (!texCache.has(file)) {
    texCache.set(file, new Promise((res, rej) => loader.load(`tex/${file}`, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = maxAniso;
      res(t);
    }, undefined, rej)));
  }
  return texCache.get(file);
}

/**
 * A PBR material from a generated texture set.
 * tile: metres covered by one texture repeat (used when meshes get box-projected UVs).
 */
export async function pbr(name, o = {}) {
  const [map, normalMap, rough] = await Promise.all([loadTex(`${name}_albedo.png`, true), loadTex(`${name}_normal.png`, false), loadTex(`${name}_rough.png`, false)]);
  const m = new THREE.MeshStandardMaterial({
    map, normalMap, roughnessMap: rough,
    roughness: o.rough ?? 1, metalness: o.metal ?? 0,
    color: o.color ? new THREE.Color(o.color) : new THREE.Color(1, 1, 1),
    normalScale: new THREE.Vector2(o.normal ?? 1, o.normal ?? 1),
    vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide,
    envMapIntensity: o.env ?? 1,
  });
  if (o.metal) m.metalnessMap = rough;
  if (o.macro !== false) macro(m, o.macroAmt ?? 0.22);
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; }
  m.userData.tile = o.tile ?? 1;
  return m;
}

/** Break up visible texture tiling with a low-frequency world-space variation of albedo and roughness. */
export function macro(m, amt) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMacro = { value: amt };
    sh.vertexShader = 'varying vec3 vMacroW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vMacroW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vMacroW; uniform float uMacro;\n' +
      'float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }\n' +
      'float mn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x),mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x),f.y),mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x),mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x),f.y),f.z); }\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        float mv = mn(vMacroW * 0.35) * 0.6 + mn(vMacroW * 1.1 + 7.0) * 0.4;
        diffuseColor.rgb *= 1.0 - uMacro + uMacro * 2.0 * mv;`);
  };
  m.customProgramCacheKey = () => 'macro' + amt;
}

export function plain(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? 1; }
  if (o.transparent) { m.transparent = true; m.opacity = o.opacity ?? 0.5; m.depthWrite = false; }
  m.userData.tile = o.tile ?? 1;
  return m;
}

/** Library of materials used across scenes, loaded once. */
export async function materials() {
  const M = {};
  const defs = {
    harl: { tile: 1.6 }, plaster: { tile: 2.2 }, flags: { tile: 2.2 }, stonewall: { tile: 1.8 }, boards: { tile: 1.6 },
    pew: { tile: 1.4 }, coffinwood: { tile: 1.0, color: '#9a8070' }, paint_door_blue: { tile: 1.2 }, paint_door_green: { tile: 1.2 },
    paint_frame_white: { tile: 0.8 }, paint_shopfront: { tile: 1.5 }, slate: { tile: 1.2 }, tarmac: { tile: 3.0 },
    concrete: { tile: 2.0 }, shipwhite: { tile: 2.0 }, deck: { tile: 2.0 },
    wool_charcoal: {}, wool_black: {}, wool_brown: {}, wool_navy: {}, tweed: {}, denim: {}, trouser_dark: {},
    oilskin_yellow: { color: '#b8a888' }, hivis: { color: '#b0b0a0' }, linen: { tile: 1.2 }, shirt: {}, scarf_plum: {}, knit_cream: {},
    leather: { tile: 0.6 }, turf: { tile: 2.5 }, rock: { tile: 2.5 }, rug: { tile: 1.6 },
    iron: { tile: 0.8, metal: 1 }, blade: { tile: 0.8, metal: 1 }, brass: { tile: 0.5, metal: 1 },
  };
  await Promise.all(Object.entries(defs).map(async ([k, o]) => { M[k] = await pbr(k, o); }));
  return M;
}

/** Character skin, hair and eyes for one person (tints of the shared textures). */
export async function personMats(o = {}) {
  const skin = await pbr('skin', { color: o.skin ?? '#e9c3ac', vertexColors: true });
  if (o.pale) { skin.color.set(o.pale === true ? '#cfd0cc' : o.pale); }
  const hair = await pbr('hair', { color: o.hair ?? '#2a221c', vertexColors: true });
  skin.roughness = 0.75;
  const eyes = o.glow ? plain('#000000', { emissive: o.glow, emissiveIntensity: 4, rough: 0.2 }) : plain('#d8d0c4', { rough: 0.1 });
  const iris = o.glow ? plain('#000000', { emissive: o.glow, emissiveIntensity: 10, rough: 0.2 }) : plain(o.iris ?? '#2a1f18', { rough: 0.05 });
  return { skin, hair, eyes, iris };
}

// ---------- geometry helpers ----------
/** Box-project UVs in world-size units so textures keep a constant texel density. */
export function boxUV(g, tile = 1) {
  g = g.index ? g.toNonIndexed() : g;
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  // per-face projection so a face never straddles two axes
  for (let i = 0; i < p.count; i += 3) {
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < 3; k++) { nx += n.getX(i + k); ny += n.getY(i + k); nz += n.getZ(i + k); }
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k);
      let u, v;
      if (ax >= ay && ax >= az) { u = z * Math.sign(nx || 1); v = y; } else if (ay >= az) { u = x; v = z; } else { u = -x * Math.sign(nz || 1); v = y; }
      uv[(i + k) * 2] = u / tile; uv[(i + k) * 2 + 1] = v / tile;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** A mesh whose UVs are projected in world units after placing (position/rotation baked). */
export function mesh(geom, mat, o = {}) {
  const g = geom.clone();
  if (o.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...o.rot, 'YXZ')));
  if (o.pos) g.translate(...o.pos);
  const out = new THREE.Mesh(o.keepUV ? g : boxUV(g, (o.tile ?? mat.userData?.tile ?? 1)), mat);
  out.castShadow = o.cast ?? true; out.receiveShadow = o.receive ?? true;
  return out;
}

export function rbox(w, h, d, r = 0.01, seg = 2) { return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)); }

/** Displace a geometry's vertices with a smooth noise (stone, turf, lumpy plaster). */
export function jitter(g, amt, freq = 3, seed = 1) {
  const p = g.attributes.position; const r = rng(seed);
  const o = [r() * 100, r() * 100, r() * 100];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * freq + o[0]) * Math.sin(y * freq * 1.3 + o[1]) * Math.sin(z * freq * 0.9 + o[2]);
    const n2 = Math.sin(x * freq * 2.7 + o[1]) * Math.sin(y * freq * 2.1 + o[2]) * Math.sin(z * freq * 3.1 + o[0]);
    const s = (n + n2 * 0.5) * amt;
    p.setXYZ(i, x + s, y + s * 0.6, z + s);
  }
  g.computeVertexNormals();
  return g;
}

export function merge(list) { return mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)), false); }

// ---------- characters ----------
const charCache = new Map();
async function charData(id) {
  if (!charCache.has(id)) {
    charCache.set(id, Promise.all([fetch(`chars/${id}.json`).then((r) => r.json()), fetch(`chars/${id}.bin`).then((r) => r.arrayBuffer())]));
  }
  return charCache.get(id);
}

/**
 * Load a sculpted character. mats maps the sculptor's material keys to materials.
 * Returns a Group with userData.joint(name) -> Object3D at that joint, for props.
 */
export async function character(id, mats, o = {}) {
  const [meta, buf] = await charData(id);
  const n = meta.verts; const [ov, on, ouv, oao, of] = meta.offsets;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, ov, n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(buf, on, n * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, ouv, n * 2), 2));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(buf, oao, n * 3), 3));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, of, meta.tris * 3), 1));
  const list = [];
  meta.groups.forEach((gr, i) => {
    g.addGroup(gr.start, gr.count, i);
    let m = mats[gr.mat];
    if (!m) { console.warn('no material for', id, gr.mat); m = plain('#ff00ff'); }
    if (!m.vertexColors) { m = m.clone(); m.vertexColors = true; mats[gr.mat] = m; }
    list.push(m);
  });
  const mesh = new THREE.Mesh(g, list);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(mesh);
  if (o.pos) grp.position.set(...o.pos);
  if (o.rotY) grp.rotation.y = o.rotY;
  grp.userData.joint = (name, local = [0, 0, 0]) => {
    const j = meta.joints[name];
    const obj = new THREE.Object3D();
    const R = j.R;
    const m4 = new THREE.Matrix4().set(R[0][0], R[0][1], R[0][2], j.p[0], R[1][0], R[1][1], R[1][2], j.p[1], R[2][0], R[2][1], R[2][2], j.p[2], 0, 0, 0, 1);
    m4.multiply(new THREE.Matrix4().makeTranslation(...local));
    m4.decompose(obj.position, obj.quaternion, obj.scale);
    grp.add(obj);
    return obj;
  };
  grp.userData.meta = meta;
  if (o.head) grp.userData.joint('head').add(await scanHead(o.head));
  return grp;
}

// ---------- environment ----------
export async function hdri(renderer, file) {
  const t = await new HDRLoader().loadAsync(`assets/${file}`);
  t.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(t).texture;
  return { env, bg: t };
}

export function shadowLight(light, size = 2048, area = 10, o = {}) {
  light.castShadow = true;
  light.shadow.mapSize.set(size, size);
  light.shadow.bias = o.bias ?? -0.0004;
  light.shadow.normalBias = o.normalBias ?? 0.02;
  light.shadow.radius = o.radius ?? 6;
  light.shadow.blurSamples = o.blurSamples ?? 16;
  if (light.isDirectionalLight) {
    const c = light.shadow.camera; c.left = -area; c.right = area; c.top = area; c.bottom = -area; c.near = 0.5; c.far = o.far ?? 80;
  } else { light.shadow.camera.near = o.near ?? 0.1; light.shadow.camera.far = o.far ?? 30; }
  return light;
}

// ---------- scanned head ----------
let halo = null;
function haloTex() {
  if (halo) return halo;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  halo = new THREE.CanvasTexture(c); halo.colorSpace = THREE.SRGBColorSpace; return halo;
}
const headData = {};
let headTex = null;
const tl = new THREE.TextureLoader();
async function headAssets(name) {
  if (!headTex) {
    headTex = (async () => {
      const map = await tl.loadAsync('assets/lps/Map-COL.jpg'); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = maxAniso;
      const nrm = await tl.loadAsync('assets/lps/Infinite-Level_02_Tangent_SmoothUV.jpg'); nrm.anisotropy = maxAniso;
      return { map, nrm };
    })();
  }
  if (!headData[name]) {
    headData[name] = (async () => {
      const [meta, buf] = await Promise.all([fetch(`assets/${name}.json`).then((r) => r.json()), fetch(`assets/${name}.bin`).then((r) => r.arrayBuffer())]);
      const { map, nrm } = await headTex;
      return { meta, buf, map, nrm };
    })();
  }
  return headData[name];
}

/**
 * The scanned head in the sculptor's head-joint frame. o.warp reshapes it per character:
 * width, jaw (lower-face width), nose, brow, age (sag), and o.skin tints the photo texture.
 */
export async function scanHead(o = {}) {
  const { meta, buf, map, nrm } = await headAssets(o.closed ? 'head_closed' : 'head');
  const [op, ouv, of, ohp, ohuv, ohf, oha] = meta.offsets;
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(buf.slice(op, op + meta.verts * 12));
  const w = { width: 1, jaw: 1, nose: 1, brow: 1, chin: 1, len: 1, ...(o.warp || {}) };
  for (let i = 0; i < meta.verts; i++) {
    let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    const lower = Math.min(1, Math.max(0, (0.07 - y) / 0.08));
    x *= w.width * (1 + (w.jaw - 1) * lower);
    const nose = Math.exp(-((x / 0.02) ** 2 + ((y - 0.075) / 0.03) ** 2)) * Math.max(0, z - 0.07);
    z += nose * (w.nose - 1) * 1.2;
    const brow = Math.exp(-(((y - 0.118) / 0.015) ** 2)) * Math.max(0, z - 0.05);
    z += brow * (w.brow - 1) * 0.6;
    const chin = Math.exp(-((x / 0.03) ** 2 + ((y + 0.0) / 0.03) ** 2)) * Math.max(0, z - 0.03);
    z += chin * (w.chin - 1) * 0.8;
    y = 0.1 + (y - 0.1) * w.len;
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
  }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, ouv, meta.verts * 2), 2));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, of, meta.tris * 3), 1));
  g.computeVertexNormals();
  const skin = new THREE.MeshStandardMaterial({ map, normalMap: nrm, roughness: o.rough ?? 0.58, color: new THREE.Color(o.skin ?? '#ffffff'), envMapIntensity: 0.8 });
  if (o.pale) skin.color.set(o.pale === true ? '#b9bdb8' : o.pale);
  const grp = new THREE.Group();
  const head = new THREE.Mesh(g, skin); head.castShadow = head.receiveShadow = true; grp.add(head);
  if (o.hair) {
    const hg = new THREE.BufferGeometry();
    const HP = new Float32Array(buf.slice(ohp, ohp + meta.hverts * 12));
    for (let i = 0; i < meta.hverts; i++) {
      const y = HP[i * 3 + 1];
      const lower = Math.min(1, Math.max(0, (0.07 - y) / 0.08));
      HP[i * 3] *= w.width * (1 + (w.jaw - 1) * lower) * (o.hairVol ?? 1);
      HP[i * 3 + 1] = 0.1 + (y - 0.1) * w.len;
      HP[i * 3 + 2] *= o.hairVol ?? 1;
    }
    hg.setAttribute('position', new THREE.BufferAttribute(HP, 3));
    hg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, ohuv, meta.hverts * 2), 2));
    hg.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, ohf, meta.htris * 3), 1));
    hg.computeVertexNormals();
    const ha = new Float32Array(buf, oha, meta.hverts);
    const hc = new Float32Array(meta.hverts * 4);
    for (let i = 0; i < meta.hverts; i++) { hc[i * 4] = hc[i * 4 + 1] = hc[i * 4 + 2] = 0.55 + 0.45 * ha[i]; hc[i * 4 + 3] = ha[i]; }
    hg.setAttribute('color', new THREE.BufferAttribute(hc, 4));
    const hmat = o.hair.clone(); hmat.vertexColors = true; hmat.alphaHash = true; hmat.transparent = false;
    const hm = new THREE.Mesh(hg, hmat); hm.castShadow = hm.receiveShadow = true; grp.add(hm);
  }
  if (o.eyes !== false) {
    const sclera = o.glow ? new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(o.glow), emissiveIntensity: 3 }) : new THREE.MeshStandardMaterial({ color: '#cfc7bb', roughness: 0.12 });
    const irisM = o.glow ? new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(o.glow), emissiveIntensity: 12 }) : new THREE.MeshStandardMaterial({ color: o.iris ?? '#3a2a1e', roughness: 0.05 });
    const pupilM = new THREE.MeshStandardMaterial({ color: '#050403', roughness: 0.05 });
    const look = new THREE.Vector3(...(o.look ?? [0, 0, 1])).normalize();
    for (const e of meta.eyes) {
      const c = new THREE.Vector3(e[0] * w.width, e[1], e[2]);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(meta.eyeR, 32, 24), sclera); eye.position.copy(c); grp.add(eye);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(meta.eyeR * 0.5, 24, 16), irisM);
      ir.position.copy(c).addScaledVector(look, meta.eyeR * 0.9); ir.scale.set(1, 1, 0.35); ir.lookAt(c.clone().addScaledVector(look, 1)); grp.add(ir);
      if (o.glow) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(o.glow).multiplyScalar(2.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
        sp.position.copy(c).addScaledVector(look, 0.02); sp.scale.set(0.1, 0.1, 1); grp.add(sp);
      }
      if (!o.glow) { const pu = new THREE.Mesh(new THREE.SphereGeometry(meta.eyeR * 0.22, 16, 12), pupilM); pu.position.copy(c).addScaledVector(look, meta.eyeR * 0.985); pu.scale.set(1, 1, 0.3); pu.lookAt(c.clone().addScaledVector(look, 1)); grp.add(pu); }
    }
  }
  return grp;
}
