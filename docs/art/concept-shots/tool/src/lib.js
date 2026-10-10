import * as THREE from 'three';

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

const hex = (c) => new THREE.Color(c);
const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));

// ---------- vertex snap (PS1 wobble), shared uniform ----------
export const SNAP = { value: new THREE.Vector2(240, 135) };

function addSnap(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSnap = SNAP;
    sh.vertexShader = 'uniform vec2 uSnap;\n' + sh.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       if (uSnap.x > 0.0) { vec4 p = gl_Position; p.xy = floor(p.xy / p.w * uSnap + 0.5) / uSnap * p.w; gl_Position = p; }`,
    );
  };
  return mat;
}

// ---------- procedural pixel textures ----------
const texCache = new Map();

/** Paint a w×h texture pixel by pixel. fn(px, r) where px(x,y,[r,g,b]) sets a pixel; wraps. */
export function tex(key, w, h, fn, repeat = [1, 1]) {
  let base = texCache.get(key);
  if (!base) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const buf = new Float32Array(w * h * 3);
    const set = (x, y, col) => {
      x = ((Math.floor(x) % w) + w) % w; y = ((Math.floor(y) % h) + h) % h;
      const i = (y * w + x) * 3; buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2];
    };
    const get = (x, y) => {
      x = ((Math.floor(x) % w) + w) % w; y = ((Math.floor(y) % h) + h) % h;
      const i = (y * w + x) * 3; return [buf[i], buf[i + 1], buf[i + 2]];
    };
    fn({ set, get, w, h, ctx }, rng(hashStr(key)));
    for (let i = 0; i < w * h; i++) {
      img.data[i * 4] = clamp(buf[i * 3]); img.data[i * 4 + 1] = clamp(buf[i * 3 + 1]); img.data[i * 4 + 2] = clamp(buf[i * 3 + 2]); img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.magFilter = THREE.NearestFilter; base.minFilter = THREE.NearestFilter; base.generateMipmaps = false;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    texCache.set(key, base);
  }
  const t = base.clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

function hashStr(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
const rgb = (c) => { const k = hex(c); return [k.r * 255, k.g * 255, k.b * 255]; };
const jit = (col, r, a) => { const d = (r() - 0.5) * a; return [col[0] + d, col[1] + d, col[2] + d]; };
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const T = {
  /** Orkney flagstone: thin horizontal slabs, dark gaps. */
  stone(rep, tone = 0) {
    return tex('stone' + tone, 64, 64, ({ set }, r) => {
      const pal = (tone ? ['#6d6a60', '#7a766a', '#5f5c54', '#86806f', '#6a6d66'] : ['#5d5548', '#6b6253', '#4f493f', '#776c5a', '#5a5f55']).map(rgb);
      let y = 0;
      while (y < 64) {
        const hgt = 3 + Math.floor(r() * 4);
        let x = Math.floor(r() * 20);
        const end = x + 64;
        while (x < end) {
          const len = 7 + Math.floor(r() * 16);
          const c = pal[Math.floor(r() * pal.length)];
          for (let yy = 0; yy < hgt; yy++) for (let xx = 0; xx < len; xx++) {
            const edge = yy === hgt - 1 || xx === len - 1;
            set(x + xx, y + yy, edge ? jit(rgb('#2a2620'), r, 10) : jit(mixc(c, [255, 255, 255], yy === 0 ? 0.08 : 0), r, 18));
          }
          x += len;
        }
        y += hgt;
      }
    }, rep);
  },
  /** Whitewashed harl / plaster with grime. */
  harl(rep, base = '#c9c4b6') {
    return tex('harl' + base, 32, 32, ({ set }, r) => {
      const b = rgb(base);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const grime = y > 22 ? (y - 22) * 3 : 0;
        set(x, y, jit([b[0] - grime, b[1] - grime, b[2] - grime * 1.2], r, 22));
      }
    }, rep);
  },
  /** Planks running along v. */
  planks(rep, base = '#5a4030', key = 'p') {
    return tex('planks' + base + key, 64, 64, ({ set }, r) => {
      const b = rgb(base);
      for (let p = 0; p < 8; p++) {
        const shade = 0.82 + r() * 0.3;
        const off = Math.floor(r() * 64);
        for (let y = 0; y < 64; y++) for (let x = 0; x < 8; x++) {
          const seam = x === 7 || (y + off) % 64 === 0;
          const grain = Math.sin((x * 1.7 + (y + off) * 0.15 + p * 3)) * 6 + (r() - 0.5) * 12;
          const c = seam ? mixc(b, [0, 0, 0], 0.6) : [b[0] * shade + grain, b[1] * shade + grain * 0.8, b[2] * shade + grain * 0.6];
          set(p * 8 + x, y, c);
        }
      }
    }, rep);
  },
  /** Irregular flagstone floor. */
  flags(rep, base = '#5c5a52') {
    return tex('flags' + base, 64, 64, ({ set }, r) => {
      const b = rgb(base);
      const rows = [0, 14, 30, 41, 55, 64];
      for (let i = 0; i < rows.length - 1; i++) {
        let x = Math.floor(r() * 10);
        while (x < 74) {
          const len = 12 + Math.floor(r() * 18); const s = 0.85 + r() * 0.3;
          for (let y = rows[i]; y < rows[i + 1]; y++) for (let xx = 0; xx < len; xx++) {
            const edge = y === rows[i + 1] - 1 || xx === len - 1;
            set(x + xx, y, edge ? jit(mixc(b, [0, 0, 0], 0.55), r, 8) : jit([b[0] * s, b[1] * s, b[2] * s], r, 14));
          }
          x += len;
        }
      }
    }, rep);
  },
  noise(rep, base, amt = 20, key = '') {
    return tex('noise' + base + amt + key, 32, 32, ({ set }, r) => {
      const b = rgb(base);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) set(x, y, jit(b, r, amt));
    }, rep);
  },
  grass(rep) {
    return tex('grass', 32, 32, ({ set }, r) => {
      const pal = ['#3d4a2c', '#46532f', '#36402a', '#525c35', '#4a4a30'].map(rgb);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) set(x, y, jit(pal[Math.floor(r() * pal.length)], r, 10));
    }, rep);
  },
  tarmac(rep) {
    return tex('tarmac', 32, 32, ({ set }, r) => {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) set(x, y, jit(rgb(r() < 0.06 ? '#4a4a48' : '#2f3032'), r, 10));
    }, rep);
  },
  water(rep) {
    return tex('water', 64, 32, ({ set }, r) => {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
        const w = Math.sin(x * 0.4 + Math.sin(y * 0.9) * 2) * 0.5 + 0.5;
        let c = mixc(rgb('#22313a'), rgb('#3a4d56'), w * 0.6 + r() * 0.2);
        if (r() < 0.012) c = rgb('#8a9a9c');
        set(x, y, c);
      }
    }, rep);
  },
  /** Painted wallpaper with a faded small motif. */
  wallpaper(rep, base = '#6e6450', motif = '#5a5040') {
    return tex('wp' + base, 32, 32, ({ set }, r) => {
      const b = rgb(base), m = rgb(motif);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const dx = (x % 16) - 8, dy = (y % 16) - 8 + ((Math.floor(x / 16) % 2) * 8);
        const d = Math.abs(dx) + Math.abs(((dy + 8) % 16) - 8);
        const stain = y > 24 ? 10 : 0;
        set(x, y, jit(d < 3 ? m : b, r, 10).map((v) => v - stain));
      }
    }, rep);
  },
  /** Painted steel with rust streaks. */
  paint(rep, base = '#d9d6cc', rust = 0.4, key = '') {
    return tex('paint' + base + rust + key, 32, 32, ({ set }, r) => {
      const b = rgb(base), rr = rgb('#7a4a2a');
      const streaks = Array.from({ length: 4 }, () => [Math.floor(r() * 32), Math.floor(r() * 20)]);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        let c = jit(b, r, 12);
        for (const [sx, sy] of streaks) if (x === sx && y > sy) c = mixc(c, rr, rust * (1 - (y - sy) / 32));
        if (y === 31 || x === 0) c = mixc(c, [0, 0, 0], 0.25);
        set(x, y, c);
      }
    }, rep);
  },
  slate(rep) {
    return tex('slate', 32, 32, ({ set }, r) => {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const row = Math.floor(y / 4), off = row % 2 ? 4 : 0;
        const edge = y % 4 === 3 || (x + off) % 8 === 7;
        set(x, y, edge ? rgb('#1e2124') : jit(rgb('#3d4448'), r, 14));
      }
    }, rep);
  },
  knit(rep, a, b2) {
    return tex('knit' + a + b2, 16, 16, ({ set }, r) => {
      const A = rgb(a), B = rgb(b2);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const band = y >= 5 && y <= 9;
        const pat = band && ((x + y) % 4 === 0 || (x - y + 16) % 4 === 0);
        set(x, y, jit(pat ? B : A, r, 10));
      }
    }, rep);
  },
};

// ---------- materials ----------
export function mat(color, opts = {}) {
  const m = new THREE.MeshLambertMaterial({ color, ...opts });
  return addSnap(m);
}
export function texMat(map, color = 0xffffff, opts = {}) {
  return addSnap(new THREE.MeshLambertMaterial({ map, color, ...opts }));
}
export function emissive(color, intensity = 1) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), fog: true });
}

// ---------- mesh helpers ----------
export function box(w, h, d, m, x = 0, y = 0, z = 0, parent) {
  const g = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}
/** Box whose texture repeats in world units (uv scaled per face). */
export function wbox(w, h, d, m, x, y, z, parent, unit = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    const su = nx > 0.5 ? d : w, sv = ny > 0.5 ? d : h;
    uv.setXY(i, uv.getX(i) * su / unit, uv.getY(i) * sv / unit);
  }
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}
export function cyl(rt, rb, h, seg, m, parent, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}
export function plane(w, h, m, parent, unit = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  if (unit) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / unit, uv.getY(i) * h / unit); }
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}

// ---------- light helpers ----------
let glowTex;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.2, 'rgba(255,255,255,0.55)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.12)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
export function softTex() { return glowTexture(); }
export function glow(color, size, parent, x = 0, y = 0, z = 0, strength = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(color).multiplyScalar(strength), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(size, size, 1); s.position.set(x, y, z);
  if (parent) parent.add(s);
  return s;
}
/** Visible light shaft: an additive cone from `from` toward `to`. */
export function beam(color, from, to, radius, opacity, parent) {
  const len = from.distanceTo(to);
  const c = document.createElement('canvas'); c.width = 4; c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(c);
  const geo = new THREE.ConeGeometry(radius, len, 16, 1, true);
  geo.translate(0, -len / 2, 0);
  const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(color).multiplyScalar(opacity), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.copy(from);
  const dir = to.clone().sub(from).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  if (parent) parent.add(mesh);
  return mesh;
}
export function point(color, intensity, dist, parent, x, y, z, shadow = false) {
  const l = new THREE.PointLight(color, intensity, dist, 1.6);
  l.position.set(x, y, z);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; l.shadow.radius = 2; }
  parent.add(l);
  return l;
}
export function spot(color, intensity, dist, angle, parent, from, to, shadow = true) {
  const l = new THREE.SpotLight(color, intensity, dist, angle, 0.45, 1.4);
  l.position.copy(from);
  l.target.position.copy(to);
  parent.add(l); parent.add(l.target);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.0015; }
  return l;
}

// ---------- rain ----------
export function rain(parent, center, size, count, slant = new THREE.Vector3(0.25, -1, 0.1), len = 0.35, color = 0x9aa6ad, opacity = 0.45, seed = 3) {
  const r = rng(seed);
  const pos = new Float32Array(count * 6);
  const d = slant.clone().normalize().multiplyScalar(len);
  for (let i = 0; i < count; i++) {
    const x = center.x + (r() - 0.5) * size.x, y = center.y + (r() - 0.5) * size.y, z = center.z + (r() - 0.5) * size.z;
    pos.set([x, y, z, x + d.x, y + d.y, z + d.z], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: true }));
  parent.add(lines);
  return lines;
}

// ---------- humans ----------
/**
 * A low-poly figure (PS1 budget, ~600 tris) facing +z, with pivots for posing.
 * opts: coat, coatLen ('long'|'short'|'none'), shirt, trousers, skin, hair, hairStyle ('short'|'bald'|'long'|'scarf'|'cap'),
 * scale, build, eyes (emissive colour for the possessed), collar, hivis, tie, boots, face.
 */
export function human(opts = {}) {
  const o = { coat: '#2a2d30', coatLen: 'long', shirt: '#d8d4c8', trousers: '#24262a', skin: '#c49c84', hair: '#2a2420', hairStyle: 'short', scale: 1, build: 1, shoes: '#1a1a1a', ...opts };
  const root = new THREE.Group();
  const M = (c) => (typeof c === 'string' || typeof c === 'number' ? mat(c) : c);
  const coatM = M(o.coat), trouserM = M(o.trousers), skinM = M(o.skin), hairM = M(o.hair), shoeM = M(o.shoes);
  const bw = o.build;
  const j = {};
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips); j.hips = hips;
  // pelvis
  cyl(0.15 * bw, 0.16 * bw, 0.16, 6, trouserM, hips, 0, 0.02, 0).scale.z = 0.7;
  const spine = new THREE.Group(); spine.position.y = 0.08; hips.add(spine); j.spine = spine;
  const chest = cyl(0.21 * bw, 0.16 * bw, 0.52, 6, coatM, spine, 0, 0.26, 0); chest.scale.z = 0.62;
  if (o.shirt && o.coatLen !== 'none') {
    // shirt V / collar at the front
    const v = box(0.09, 0.16, 0.02, M(o.shirt), 0, 0.44, 0.115 * bw, spine);
    v.rotation.x = -0.12;
    if (o.tie) box(0.03, 0.14, 0.02, M(o.tie), 0, 0.42, 0.125 * bw, spine);
  }
  if (o.collar) box(0.06, 0.03, 0.02, M(o.collar), 0, 0.56, 0.095, spine);
  if (o.hivis) {
    const hv = cyl(0.215 * bw, 0.17 * bw, 0.3, 6, emissive(o.hivis, 0.55), spine, 0, 0.26, 0); hv.scale.z = 0.66;
    const stripe = cyl(0.218 * bw, 0.2 * bw, 0.04, 6, emissive('#d9e0d8', 1.4), spine, 0, 0.2, 0); stripe.scale.z = 0.67;
  }
  if (o.coatLen === 'long' || o.coatLen === 'short') {
    const L = o.coatLen === 'long' ? 0.55 : 0.22;
    const skirt = cyl(0.17 * bw, (o.coatLen === 'long' ? 0.24 : 0.19) * bw, L, 6, coatM, hips, 0, 0.08 - L / 2, 0); skirt.scale.z = 0.7;
  }
  // neck + head
  const neck = new THREE.Group(); neck.position.y = 0.54; spine.add(neck); j.neck = neck;
  cyl(0.05, 0.06, 0.1, 5, skinM, neck, 0, 0.04, 0);
  const head = new THREE.Group(); head.position.y = 0.09; neck.add(head); j.head = head;
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), skinM); skull.scale.set(0.92, 1.12, 1.0); skull.position.y = 0.11; skull.castShadow = true; head.add(skull);
  // face: brow, nose, eyes
  box(0.02, 0.04, 0.03, skinM, 0, 0.1, 0.105, head);
  const eyeM = o.eyes ? emissive(o.eyes, 2.2) : mat('#18140f');
  box(0.03, 0.015, 0.01, eyeM, -0.04, 0.13, 0.098, head);
  box(0.03, 0.015, 0.01, eyeM, 0.04, 0.13, 0.098, head);
  if (o.eyes) { j.eyeGlowL = glow(o.eyes, 0.12, head, -0.04, 0.13, 0.11, 0.9); j.eyeGlowR = glow(o.eyes, 0.12, head, 0.04, 0.13, 0.11, 0.9); }
  box(0.05, 0.012, 0.012, o.eyes ? skinM : hairM, -0.04, 0.152, 0.1, head); box(0.05, 0.012, 0.012, o.eyes ? skinM : hairM, 0.04, 0.152, 0.1, head); // brows
  box(0.05, 0.01, 0.01, mat('#6a4a44'), 0, 0.055, 0.1, head); // mouth
  if (o.beard) { const b = box(0.15, 0.07, 0.08, M(o.beard), 0, 0.05, 0.07, head); }
  if (o.hairStyle === 'short' || o.hairStyle === 'long') {
    const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.118, 1), hairM); cap.scale.set(0.95, 0.8, 1.02); cap.position.set(0, 0.16, -0.012); cap.castShadow = true; head.add(cap);
    if (o.hairStyle === 'long') { const back = box(0.21, 0.3, 0.08, hairM, 0, 0.02, -0.08, head); }
  } else if (o.hairStyle === 'scarf') {
    const sc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.128, 1), M(o.scarf || '#5a3a3a')); sc.scale.set(0.98, 0.95, 1.04); sc.position.set(0, 0.14, -0.02); head.add(sc);
    box(0.14, 0.12, 0.06, M(o.scarf || '#5a3a3a'), 0, 0.02, -0.07, head);
  } else if (o.hairStyle === 'cap') {
    const c1 = cyl(0.12, 0.125, 0.06, 7, M(o.capColor || '#3a3a36'), head, 0, 0.22, -0.005); c1.scale.z = 1.05;
    box(0.2, 0.015, 0.09, M(o.capColor || '#3a3a36'), 0, 0.2, 0.1, head);
  } else if (o.hairStyle === 'bald') {
    const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.114, 1), hairM); cap.scale.set(0.98, 0.5, 1.0); cap.position.set(0, 0.11, -0.03); head.add(cap);
  }
  if (o.sou) { // sou'wester
    const brim = cyl(0.19, 0.2, 0.02, 8, M(o.sou), head, 0, 0.2, -0.02);
    cyl(0.1, 0.13, 0.1, 8, M(o.sou), head, 0, 0.25, -0.01);
  }
  // arms
  const arm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.2 * bw, 0.48, 0); spine.add(sh);
    cyl(0.055, 0.05, 0.3, 5, coatM, sh, 0, -0.15, 0);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    cyl(0.048, 0.04, 0.27, 5, coatM, el, 0, -0.135, 0);
    const hand = new THREE.Group(); hand.position.y = -0.28; el.add(hand);
    box(0.06, 0.09, 0.04, skinM, 0, -0.03, 0, hand);
    return { sh, el, hand };
  };
  const L = arm(1), R = arm(-1);
  j.lSh = L.sh; j.lEl = L.el; j.lHand = L.hand; j.rSh = R.sh; j.rEl = R.el; j.rHand = R.hand;
  // legs
  const leg = (side) => {
    const hp = new THREE.Group(); hp.position.set(side * 0.09 * bw, -0.02, 0); hips.add(hp);
    cyl(0.075, 0.06, 0.45, 5, trouserM, hp, 0, -0.225, 0);
    const kn = new THREE.Group(); kn.position.y = -0.45; hp.add(kn);
    cyl(0.058, 0.045, 0.44, 5, o.boots ? M(o.boots) : trouserM, kn, 0, -0.22, 0);
    box(0.09, 0.06, 0.22, shoeM, 0, -0.46, 0.04, kn);
    return { hp, kn };
  };
  const LL = leg(1), RL = leg(-1);
  j.lHip = LL.hp; j.lKnee = LL.kn; j.rHip = RL.hp; j.rKnee = RL.kn;
  root.scale.setScalar(o.scale);
  root.userData.j = j;
  return root;
}

/** Pose: map of joint -> [x, y, z] radians. Arms: x<0 raises forward; z>0 on the left arm swings it out. */
export function pose(h, p) {
  const j = h.userData.j;
  for (const [k, v] of Object.entries(p)) {
    if (k === 'y') { h.position.y = v; continue; }
    if (j[k]) j[k].rotation.set(v[0] || 0, v[1] || 0, v[2] || 0, 'YXZ');
  }
  return h;
}

export function place(h, parent, x, y, z, yaw = 0) {
  h.position.set(x, y, z); h.rotation.y = yaw; parent.add(h); return h;
}

// ---------- weapons and items ----------
export function sword(parent, glowAmt = 0) {
  const g = new THREE.Group();
  const steel = mat('#a7adb0');
  if (glowAmt) steel.emissive = new THREE.Color('#ffd9a0').multiplyScalar(glowAmt);
  box(0.035, 0.14, 0.035, mat('#3a2a1e'), 0, 0, 0, g); // grip
  box(0.06, 0.05, 0.06, mat('#6b6a60'), 0, 0.095, 0, g); // pommel
  box(0.2, 0.03, 0.04, mat('#6b6a60'), 0, -0.08, 0, g); // crossguard (Norse, short)
  const blade = box(0.055, 0.82, 0.014, steel, 0, -0.5, 0, g);
  box(0.03, 0.06, 0.012, steel, 0, -0.94, 0, g); // tip
  if (parent) parent.add(g);
  return g;
}
export function phone(parent, lit = true) {
  const g = new THREE.Group();
  box(0.07, 0.14, 0.012, mat('#111'), 0, 0, 0, g);
  if (lit) box(0.06, 0.12, 0.002, emissive('#b9d3ff', 1.1), 0, 0, 0.008, g);
  if (parent) parent.add(g);
  return g;
}

/** The British coffin outline (shoulders wider than head and foot), length along x, head at +x. */
export function coffinShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.95, -0.17); s.lineTo(0.45, -0.29); s.lineTo(0.95, -0.21); s.lineTo(0.95, 0.21); s.lineTo(0.45, 0.29); s.lineTo(-0.95, 0.17); s.closePath();
  return s;
}
export function coffin(parent, wood = '#5a3424', lining = '#cfc8b8') {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.36, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const shell = new THREE.Mesh(geo, mat(wood)); shell.castShadow = true; shell.receiveShadow = true; g.add(shell);
  const lin = new THREE.Mesh(new THREE.ShapeGeometry(coffinShape()), mat(lining)); lin.rotation.x = -Math.PI / 2; lin.scale.set(0.93, 0.86, 1); lin.position.y = 0.3; lin.receiveShadow = true; g.add(lin);
  // inner walls so the empty box reads as a hollow
  const inner = new THREE.Mesh(new THREE.ExtrudeGeometry(coffinShape(), { depth: 0.07, bevelEnabled: false }), mat(lining)); inner.geometry.rotateX(-Math.PI / 2); inner.scale.set(0.93, 1, 0.86); inner.position.y = 0.29; g.add(inner);
  if (parent) parent.add(g);
  return g;
}
