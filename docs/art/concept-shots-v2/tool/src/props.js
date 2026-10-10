import * as THREE from 'three';
import { mesh, rbox, plain, rng, jitter, merge, boxUV } from './lib.js';

// ---------- light helpers ----------
let soft = null;
export function softTex() {
  if (soft) return soft;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  soft = new THREE.CanvasTexture(c); soft.colorSpace = THREE.SRGBColorSpace;
  return soft;
}

/** A soft additive halo (lens bloom around small bright sources, haze around lamps). */
export function glow(parent, color, size, pos, intensity = 1) {
  const m = new THREE.SpriteMaterial({ map: softTex(), color: new THREE.Color(color).multiplyScalar(intensity), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); s.position.set(...pos); parent.add(s); return s;
}

/** A volumetric shaft: an additive cone fading along its length and towards its edges. */
export function beam(parent, color, from, to, r0, r1, intensity = 0.15) {
  const len = from.distanceTo(to);
  const g = new THREE.CylinderGeometry(r0, r1, len, 32, 1, true);
  g.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { col: { value: new THREE.Color(color).multiplyScalar(intensity) }, len: { value: len } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = -position.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 col; uniform float len; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float f = (1.0 - smoothstep(0.0, len, vY)) * smoothstep(0.0, 0.08 * len, vY); gl_FragColor = vec4(col * e * f, 1.0); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const b = new THREE.Mesh(g, m);
  b.position.copy(from);
  b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  b.renderOrder = 10;
  parent.add(b); return b;
}

export function point(parent, color, intensity, distance, pos, shadow = false, o = {}) {
  const l = new THREE.PointLight(color, intensity, distance, 2);
  l.position.set(...pos);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(o.size ?? 1024, o.size ?? 1024); l.shadow.bias = o.bias ?? -0.002; l.shadow.radius = o.radius ?? 5; l.shadow.blurSamples = 12; l.shadow.camera.near = 0.05; l.shadow.camera.far = distance || 20; }
  parent.add(l); return l;
}

export function spot(parent, color, intensity, distance, angle, pos, target, shadow = false, o = {}) {
  const l = new THREE.SpotLight(color, intensity, distance, angle, o.penumbra ?? 0.5, 2);
  l.position.copy(pos); l.target.position.copy(target);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(o.size ?? 1024, o.size ?? 1024); l.shadow.bias = o.bias ?? -0.0015; l.shadow.radius = o.radius ?? 5; l.shadow.blurSamples = 12; l.shadow.camera.near = 0.1; l.shadow.camera.far = distance || 30; }
  parent.add(l); parent.add(l.target); return l;
}

// ---------- props ----------
export function candle(parent, M, pos, h = 0.2, o = {}) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const wax = plain('#e6dfcc', { rough: 0.45, emissive: '#3a2a10', emissiveIntensity: 0.25 });
  const stick = new THREE.LatheGeometry([[0, 0], [0.024, 0], [0.024, h - 0.01], [0.02, h], [0.012, h - 0.004], [0, h - 0.006]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  g.add(mesh(stick, wax, { keepUV: true }));
  // drips
  const r = rng(o.seed ?? 3);
  for (let i = 0; i < 4; i++) { const a = r() * 6.28; const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.02 + r() * 0.04, 4, 8), wax); d.position.set(Math.cos(a) * 0.024, h - 0.03 - r() * 0.04, Math.sin(a) * 0.024); g.add(d); }
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd89a').multiplyScalar(6) }));
  flame.scale.set(1, 2.4, 1); flame.position.y = h + 0.018; g.add(flame);
  glow(g, '#ffb860', o.halo ?? 0.35, [0, h + 0.02, 0], 0.9);
  glow(g, '#ffe0a0', 0.07, [0, h + 0.018, 0], 1.6);
  if (o.light !== false) point(g, '#ffb46a', o.intensity ?? 1.6, o.distance ?? 6, [0, h + 0.05, 0], o.shadow ?? false, { size: 1024, bias: -0.003 });
  return g;
}

/** A sword: tapered blade with bevelled edges, iron guard, wrapped grip, pommel. Origin at the grip centre, blade along +y. */
export function sword(M) {
  const g = new THREE.Group();
  const L = 0.78, W = 0.042;
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0); s.lineTo(-W / 2 * 0.9, L * 0.7); s.quadraticCurveTo(-W * 0.4, L * 0.93, 0, L); s.quadraticCurveTo(W * 0.4, L * 0.93, W / 2 * 0.9, L * 0.7); s.lineTo(W / 2, 0); s.closePath();
  const bg = new THREE.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.009, bevelSegments: 2, curveSegments: 12 });
  bg.translate(0, 0.07, -0.001);
  const blade = mesh(bg, M.blade, { tile: 0.25 }); g.add(blade);
  // fuller: a darker groove line down the middle
  const fuller = mesh(rbox(0.008, L * 0.6, 0.0065, 0.003), plain('#5a5d60', { metal: 1, rough: 0.35 }), { pos: [0, 0.07 + L * 0.32, 0], keepUV: true }); g.add(fuller);
  const guard = mesh(rbox(0.19, 0.022, 0.03, 0.008), M.iron, { pos: [0, 0.06, 0], tile: 0.2 }); g.add(guard);
  for (const sx of [-1, 1]) { const q = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), M.iron); q.position.set(sx * 0.095, 0.06, 0); q.castShadow = true; g.add(q); }
  const grip = mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.15, 16), M.leather, { pos: [0, -0.02, 0], tile: 0.1 }); g.add(grip);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0022, 6, 16), M.leather); t.rotation.x = Math.PI / 2 + 0.25; t.position.y = -0.085 + i * 0.016; g.add(t); }
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), M.iron); pom.scale.set(1, 0.8, 0.7); pom.position.y = -0.108; pom.castShadow = true; g.add(pom);
  return g;
}

/** A coffin: six-sided, bevelled, with a lining and brass handles. Origin at the floor of the box, head towards +x. */
export function coffin(M, o = {}) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-0.95, -0.18); s.lineTo(0.45, -0.29); s.lineTo(0.95, -0.21); s.lineTo(0.95, 0.21); s.lineTo(0.45, 0.29); s.lineTo(-0.95, 0.18); s.closePath();
  const hole = new THREE.Path();
  const k = 0.9;
  hole.moveTo(-0.93 * k, -0.15); hole.lineTo(0.45 * k, -0.255); hole.lineTo(0.92, -0.18); hole.lineTo(0.92, 0.18); hole.lineTo(0.45 * k, 0.255); hole.lineTo(-0.93 * k, 0.15); hole.closePath();
  if (o.open !== false) s.holes.push(hole);
  const box = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
  box.rotateX(-Math.PI / 2);
  g.add(mesh(box, M.coffinwood, { tile: 0.9 }));
  const base = new THREE.ExtrudeGeometry(s.clone(), { depth: 0.03, bevelEnabled: false }); base.rotateX(-Math.PI / 2);
  // the floor of the box (solid shape) and lining
  const solid = new THREE.Shape(s.getPoints()); const fl = new THREE.ShapeGeometry(solid); fl.rotateX(-Math.PI / 2); fl.translate(0, 0.03, 0);
  g.add(mesh(fl, o.lining ?? M.linen, { tile: 0.6 }));
  // plinth moulding
  const pl = new THREE.ExtrudeGeometry(new THREE.Shape(s.getPoints().map((p) => p.clone().multiplyScalar(1.03))), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  pl.rotateX(-Math.PI / 2); g.add(mesh(pl, M.coffinwood, { tile: 0.9 }));
  for (const x of [-0.5, 0.0, 0.5]) for (const sz of [-1, 1]) {
    const zz = sz * (x > 0.3 ? 0.31 : 0.26);
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 16, Math.PI), M.brass); h.position.set(x, 0.17, zz); h.rotation.set(0, 0, Math.PI); g.add(h);
    for (const dx of [-0.035, 0.035]) { const b = mesh(rbox(0.02, 0.03, 0.012, 0.004), M.brass, { pos: [x + dx, 0.18, zz - sz * 0.006], keepUV: true }); g.add(b); }
  }
  return g;
}

export function coffinLid(M) {
  const s = new THREE.Shape();
  s.moveTo(-0.95, -0.18); s.lineTo(0.45, -0.29); s.lineTo(0.95, -0.21); s.lineTo(0.95, 0.21); s.lineTo(0.45, 0.29); s.lineTo(-0.95, 0.18); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
  const g = new THREE.Group();
  g.add(mesh(geo, M.coffinwood, { tile: 0.9 }));
  // brass name plate and a cross of raised moulding
  g.add(mesh(rbox(0.22, 0.09, 0.006, 0.003), M.brass, { pos: [0.2, 0, 0.07], keepUV: true }));
  return g;
}

export function trestle(M, pos, rotY = 0) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY;
  for (const s of [-1, 1]) { const l = mesh(rbox(0.05, 0.68, 0.05, 0.008), M.pew, { tile: 0.8 }); l.position.set(0, 0.31, s * 0.2); l.rotation.x = s * 0.22; g.add(l); }
  g.add(mesh(rbox(0.09, 0.05, 0.6, 0.01), M.pew, { pos: [0, 0.62, 0], tile: 0.8 }));
  g.add(mesh(rbox(0.04, 0.04, 0.42, 0.008), M.pew, { pos: [0, 0.22, 0], tile: 0.8 }));
  return g;
}

/** A phone: black slab with a lit torch LED. */
export function phone() {
  const g = new THREE.Group();
  g.add(mesh(rbox(0.075, 0.155, 0.009, 0.006, 3), plain('#121416', { rough: 0.25, metal: 0.3 }), { keepUV: true }));
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.004, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(8) }));
  led.position.set(0.022, 0.06, -0.0051); led.rotation.y = Math.PI; g.add(led);
  return g;
}

export function holdall(M, pos, rotY = 0) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY;
  const body = new THREE.CylinderGeometry(0.15, 0.15, 0.55, 24, 1); body.rotateZ(Math.PI / 2); body.scale(1, 1, 0.85);
  jitter(body, 0.006, 9, 4);
  g.add(mesh(body, M.wool_navy, { pos: [0, 0.14, 0], tile: 0.4 }));
  for (const sx of [-1, 1]) g.add(mesh(rbox(0.012, 0.3, 0.27, 0.005), M.leather, { pos: [sx * 0.2, 0.15, 0], tile: 0.3 }));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 20, Math.PI), M.leather); handle.position.set(0, 0.27, 0); g.add(handle);
  return g;
}

/** Low-poly-free rope coil, bollards etc. */
export function bollard(M, pos) {
  const g = new THREE.Group(); g.position.set(...pos);
  const prof = [[0, 0], [0.2, 0], [0.2, 0.06], [0.16, 0.08], [0.15, 0.4], [0.2, 0.45], [0.2, 0.5], [0, 0.52]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(prof, 24), M.iron, { tile: 0.4 }));
  return g;
}

/** Rain: thin streaks, lit by whatever is near (additive). */
export function rain(parent, center, size, count, dir, len, color, opacity, seed = 7) {
  const r = rng(seed);
  const pos = new Float32Array(count * 6);
  const d = dir.clone().normalize().multiplyScalar(len);
  for (let i = 0; i < count; i++) {
    const x = center.x + (r() - 0.5) * size.x, y = center.y + (r() - 0.5) * size.y, z = center.z + (r() - 0.5) * size.z;
    const l = 0.6 + r() * 0.8;
    pos.set([x, y, z, x + d.x * l, y + d.y * l, z + d.z * l], i * 6);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const l = new THREE.LineSegments(g, m); parent.add(l); return l;
}

/** Window opening with a painted sash frame and glazing bars. Glass is slightly reflective. */
export function sashWindow(M, w, h, o = {}) {
  const g = new THREE.Group();
  const f = M.paint_frame_white, t = 0.05;
  g.add(mesh(rbox(w, t, 0.08, 0.01), f, { pos: [0, h / 2 - t / 2, 0] }));
  g.add(mesh(rbox(w, t, 0.08, 0.01), f, { pos: [0, -h / 2 + t / 2, 0] }));
  g.add(mesh(rbox(t, h, 0.08, 0.01), f, { pos: [w / 2 - t / 2, 0, 0] }));
  g.add(mesh(rbox(t, h, 0.08, 0.01), f, { pos: [-w / 2 + t / 2, 0, 0] }));
  g.add(mesh(rbox(w, 0.04, 0.1, 0.01), f, { pos: [0, 0, 0.01] })); // meeting rail
  for (const yy of [h / 4, -h / 4]) g.add(mesh(rbox(0.022, h / 2 - 0.05, 0.05, 0.006), f, { pos: [0, yy, 0] }));
  for (const yy of [h / 4, -h / 4]) g.add(mesh(rbox(w - 0.1, 0.02, 0.05, 0.006), f, { pos: [0, yy, 0] }));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), o.lit
    ? new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(o.lit), emissiveIntensity: o.litI ?? 1.2, roughness: 0.1 })
    : new THREE.MeshStandardMaterial({ color: o.glass ?? '#0c1014', roughness: 0.05, metalness: 0.9 }));
  glass.position.z = -0.015; g.add(glass);
  return g;
}
