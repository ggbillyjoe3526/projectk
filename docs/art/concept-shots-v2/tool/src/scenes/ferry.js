import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { mesh, rbox, plain, rng, hdri, jitter, shadowLight, pbr } from '../lib.js';
import { glow, beam, point, holdall, bollard, rain } from '../props.js';
import { person } from '../cast.js';

/** An overcast winter sky: layered cloud with a pale, low sun burning through. */
export function skyDome(scene, o = {}) {
  const g = new THREE.SphereGeometry(900, 48, 24);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      sunDir: { value: (o.sunDir ?? new THREE.Vector3(0.6, 0.12, -0.8)).clone().normalize() },
      top: { value: new THREE.Color(o.top ?? '#4a5462') }, hor: { value: new THREE.Color(o.hor ?? '#a8a69c') },
      cloud: { value: new THREE.Color(o.cloud ?? '#6a6e72') }, sun: { value: new THREE.Color(o.sun ?? '#fff0d0') }, bright: { value: o.bright ?? 1.0 },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `uniform vec3 sunDir, top, hor, cloud, sun; uniform float bright; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ s += a * n(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vD);
        float y = max(d.y, 0.0);
        vec3 c = mix(hor, top, pow(y, 0.55));
        vec2 uv = d.xz / (d.y + 0.12) * 1.6;
        float cl = fbm(uv + vec2(0.0, 3.0));
        float cl2 = fbm(uv * 2.7 + 9.0);
        float cover = smoothstep(0.35, 0.75, cl * 0.75 + cl2 * 0.35);
        float sd = max(dot(d, sunDir), 0.0);
        vec3 cc = mix(cloud * 1.15, cloud * 0.62, smoothstep(0.4, 0.9, cl2));
        cc += sun * pow(sd, 12.0) * 0.5 * (1.0 - cover * 0.6);
        c = mix(c, cc, cover * smoothstep(-0.02, 0.15, d.y));
        c += sun * (pow(sd, 400.0) * 3.0 + pow(sd, 30.0) * 0.35) * (1.0 - cover * 0.8);
        c = mix(c, hor * 0.9, smoothstep(0.08, -0.05, d.y));
        gl_FragColor = vec4(c * bright, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(g, m); sky.renderOrder = -1; sky.userData.noAO = true; scene.add(sky); return sky;
}

function terrain(M, w, d, seg, heightFn, o = {}) {
  const g = new THREE.PlaneGeometry(w, d, seg, Math.round(seg * d / w)); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightFn(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const n = g.attributes.normal; const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const steep = 1 - n.getY(i);
    const rock = Math.min(1, Math.max(0, (steep - 0.25) * 3.0));
    const low = Math.min(1, Math.max(0, 1 - p.getY(i) / 1.5));
    const c = new THREE.Color('#ffffff').lerp(new THREE.Color('#77766e'), rock).lerp(new THREE.Color('#3a3630'), low * 0.7);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = M.turf.clone(); m.vertexColors = true; m.onBeforeCompile = M.turf.onBeforeCompile;
  const t = mesh(g, m, { tile: o.tile ?? 6, cast: false });
  return t;
}

function noise2(seed) {
  const r = rng(seed); const P = Array.from({ length: 8 }, () => [r() * 6.28, 0.5 + r() * 1.5, r() * 6.28]);
  return (x, z) => P.reduce((s, [a, f, b], i) => s + Math.sin(x * f * 0.05 * (i + 1) + a) * Math.cos(z * f * 0.043 * (i + 1) + b) / (i + 1), 0);
}

/** The crossing: the forward deck of a small island ferry, Haugsay ahead under a winter sky. */
export async function ferry({ renderer, M }) {
  const scene = new THREE.Scene();
  const { env } = await hdri(renderer, 'blouberg_sunrise_2_1k.hdr');
  scene.environment = env; scene.environmentIntensity = 0.45;
  const sunDir = new THREE.Vector3(0.75, 0.1, -0.65).normalize();
  skyDome(scene, { sunDir, top: '#3e4856', hor: '#a9a598', cloud: '#7a7c7c', sun: '#ffe4b8' });
  scene.fog = new THREE.FogExp2('#8e9290', 0.0055);
  const r = rng(9);

  // the sea
  const tl = new THREE.TextureLoader();
  const wn = await tl.loadAsync('assets/waternormals.jpg'); wn.wrapS = wn.wrapT = THREE.RepeatWrapping;
  const water = new Water(new THREE.PlaneGeometry(3000, 3000), {
    textureWidth: 1024, textureHeight: 1024, waterNormals: wn, sunDirection: sunDir, sunColor: 0xffe8c8,
    waterColor: 0x0e1c22, distortionScale: 3.2, fog: true, alpha: 1.0,
  });
  water.rotation.x = -Math.PI / 2; water.position.y = -3.2;
  water.material.uniforms.size.value = 6.0;
  water.material.uniforms.time.value = 17.3;
  scene.add(water);

  // Haugsay ahead: low green hills, dark cliffs dropping to the sea
  const n1 = noise2(3);
  const isl = terrain(M, 420, 160, 210, (x, z) => {
    const zz = z + 0; // local z: -80 (far) .. 80 (near shore)
    const shore = 60 + n1(x * 0.4, 0) * 10;
    const inland = Math.max(0, (shore - zz) / 60);
    let h = Math.min(1, inland) * (7 + n1(x * 0.35, zz * 0.35) * 4) + Math.max(0, inland - 1) * 3;
    h += n1(x * 1.6, zz * 1.6) * 0.6 * Math.min(1, inland);
    const cliff = Math.min(1, Math.max(0, (shore - zz) / 3));
    return -6 + h * cliff + cliff * 6;
  }, { tile: 5 });
  isl.position.set(-10, -3.2, -175); scene.add(isl);
  // the Brough: a small tidal islet with the white tower and the cottage, off the near point
  const n2 = noise2(8);
  const brough = terrain(M, 40, 28, 60, (x, z) => { const d = Math.hypot(x / 16, z / 11); return Math.max(-2, (1 - d) * 7 + n2(x * 4, z * 4) * 0.9) - 0.5; }, { tile: 3 });
  brough.position.set(-26, -3.2, -82); scene.add(brough);
  const tower = new THREE.Group(); tower.position.set(-28, 2.6, -84); scene.add(tower);
  const tprof = [[0, 0], [1.6, 0], [1.6, 0.4], [1.3, 0.6], [1.0, 8.5], [1.3, 8.6], [1.3, 8.8], [0, 8.8]].map(([x, y]) => new THREE.Vector2(x, y));
  tower.add(mesh(new THREE.LatheGeometry(tprof, 24), M.harl, { tile: 2.5 }));
  tower.add(mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#fff2c8'), emissiveIntensity: 4 }), { pos: [0, 9.45, 0], keepUV: true }));
  tower.add(mesh(new THREE.ConeGeometry(0.95, 0.9, 16), plain('#1a1c1c', { rough: 0.5, metal: 0.5 }), { pos: [0, 10.55, 0], keepUV: true }));
  glow(tower, '#fff0c8', 9, [0, 9.45, 0.5], 0.8);
  beam(tower, '#fff4d8', new THREE.Vector3(0, 9.45, 0), new THREE.Vector3(34, 7.0, 40), 0.6, 5.0, 0.07);
  const cot = new THREE.Group(); cot.position.set(-22.5, 1.6, -81); cot.rotation.y = 0.3; scene.add(cot);
  cot.add(mesh(rbox(5, 2.4, 3.2, 0.05), M.harl, { pos: [0, 1.2, 0], tile: 2.5 }));
  for (const s of [-1, 1]) cot.add(mesh(rbox(5.3, 0.12, 2.2, 0.02), M.slate, { pos: [0, 3.0, s * 0.85], rot: [s * 0.75, 0, 0], tile: 1.6 }));
  cot.add(mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 1.5 }), { pos: [1.2, 1.3, 1.61], keepUV: true }));
  // the village strung along the shore, a few lights already on
  for (let i = 0; i < 16; i++) {
    const hx = -2 + i * 3.6 + r() * 1.2, hz = -118 + (i % 3) * 2.5 + r() * 2;
    const g = new THREE.Group(); g.position.set(hx, 0.3 + r() * 1.5, hz); g.rotation.y = (r() - 0.5) * 0.3; scene.add(g);
    const hw = 3 + r() * 2;
    g.add(mesh(rbox(hw, 2.2, 2.6, 0.04), M.harl, { pos: [0, 1.1, 0], tile: 2.5 }));
    for (const s of [-1, 1]) g.add(mesh(rbox(hw + 0.3, 0.1, 1.8, 0.02), M.slate, { pos: [0, 2.75, s * 0.7], rot: [s * 0.75, 0, 0], tile: 1.6 }));
    if (i % 3 === 0) { g.add(mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 1.8 }), { pos: [-hw / 4, 1.2, 1.31], keepUV: true })); }
  }
  // gulls
  for (let i = 0; i < 9; i++) {
    const gx = -8 + r() * 18, gy = 4 + r() * 6, gz = -14 - r() * 22;
    const gull = new THREE.Group(); gull.position.set(gx, gy, gz); gull.rotation.y = r() * 6; scene.add(gull);
    for (const s of [-1, 1]) { const wng = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.09), plain('#e4e4e0', { rough: 0.6 })); wng.position.x = s * 0.2; wng.rotation.z = s * (0.25 + r() * 0.3); gull.add(wng); }
    gull.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.15, 4, 8).rotateX(Math.PI / 2), plain('#e8e8e4')));
  }

  // the ferry's forward deck: painted steel, bulwarks, rails, the winch
  const deck = new THREE.Group(); scene.add(deck);
  const pts = [[-4.2, 6], [-4.2, -2], [-2.6, -7.5], [0, -9.5], [2.6, -7.5], [4.2, -2], [4.2, 6]];
  const shape = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  const dg = new THREE.ShapeGeometry(shape); dg.rotateX(-Math.PI / 2);
  deck.add(mesh(dg, M.deck, { tile: 2.0, cast: false }));
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    const seg = new THREE.Group(); seg.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); seg.rotation.y = -ang; deck.add(seg);
    seg.add(mesh(rbox(len + 0.12, 1.05, 0.12, 0.03), M.shipwhite, { pos: [0, 0.52, 0], tile: 2.0 }));
    seg.add(mesh(rbox(len + 0.2, 0.08, 0.22, 0.03), M.shipwhite, { pos: [0, 1.08, 0], tile: 2.0 }));
    seg.add(mesh(rbox(len + 0.12, 3.2, 0.2, 0.03), M.paint_door_blue, { pos: [0, -1.65, 0.05], tile: 2.5 }));
    const rail = mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 12), M.iron, { pos: [0, 1.38, 0], rot: [0, 0, Math.PI / 2], tile: 0.5 }); seg.add(rail);
    for (let k = 0; k <= Math.floor(len / 1.2); k++) { const t = k / Math.max(1, Math.floor(len / 1.2)) - 0.5; seg.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8), M.iron, { pos: [t * len, 1.24, 0], tile: 0.5 })); }
    // freeing ports and rust weeping from the scuppers
    for (let k = 0; k < Math.floor(len / 2); k++) seg.add(mesh(rbox(0.3, 0.14, 0.14, 0.02), plain('#0a0c0e'), { pos: [(k - Math.floor(len / 2) / 2 + 0.5) * 2, 0.08, 0], keepUV: true }));
  }
  // superstructure face behind the shoulder: windows, a door, the wheelhouse above
  deck.add(mesh(rbox(8.4, 2.6, 0.3, 0.05), M.shipwhite, { pos: [0, 1.3, 6], tile: 2.0 }));
  for (let x = -3.3; x <= 3.3; x += 1.1) deck.add(mesh(rbox(0.8, 0.7, 0.05, 0.08), new THREE.MeshStandardMaterial({ color: '#0e1418', roughness: 0.05, metalness: 0.8 }), { pos: [x, 1.9, 5.84], keepUV: true }));
  deck.add(mesh(rbox(0.9, 1.9, 0.06, 0.04), M.paint_frame_white, { pos: [2.6, 0.95, 5.83] }));
  // winch, bollards, liferaft canisters, lifebuoy, rope, chain
  deck.add(mesh(rbox(1.4, 0.7, 0.9, 0.06), M.paint_door_green, { pos: [1.5, 0.35, -5.0] }));
  deck.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.7, 24), M.iron, { pos: [1.5, 0.78, -5.0], rot: [0, 0, Math.PI / 2], tile: 0.6 }));
  for (const s of [-1, 1]) { deck.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24), M.iron, { pos: [1.5 + s * 0.86, 0.78, -5.0], rot: [0, 0, Math.PI / 2], tile: 0.6 })); }
  for (const [x, z] of [[-2.6, -4.6], [2.6, -4.6], [-3.3, 2.5], [3.3, 2.5]]) deck.add(bollard(M, [x, 0, z]));
  for (let i = 0; i < 3; i++) {
    const can = new THREE.Group(); can.position.set(-3.4, 0, 3.6 - i * 0.9); deck.add(can);
    can.add(mesh(rbox(0.7, 0.14, 0.75, 0.02), M.iron, { pos: [0, 0.07, 0], tile: 0.6 }));
    can.add(mesh(new THREE.CapsuleGeometry(0.3, 0.7, 6, 18), plain('#e6e2d6', { rough: 0.35 }), { pos: [0, 0.48, 0], rot: [Math.PI / 2, 0, 0], keepUV: true }));
    for (const dz of [-0.2, 0.2]) can.add(mesh(new THREE.TorusGeometry(0.305, 0.012, 6, 32), plain('#2a2a2a'), { pos: [0, 0.48, dz], keepUV: true }));
  }
  const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.085, 16, 32), plain('#c8561a', { rough: 0.5 })); buoy.position.set(4.05, 0.72, 1.2); buoy.rotation.y = Math.PI / 2; buoy.castShadow = true; deck.add(buoy);
  for (let k = 0; k < 4; k++) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12), plain('#e8e4d8')); band.position.set(4.05, 0.72 + Math.sin(k * 1.57) * 0.32, 1.2 + Math.cos(k * 1.57) * 0.32); band.rotation.set(0, Math.PI / 2, k * 1.57); deck.add(band); }
  for (let k = 0; k < 5; k++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28 - k * 0.012, 0.035, 8, 32), M.leather); coil.rotation.x = Math.PI / 2; coil.position.set(2.6, 0.035 + k * 0.05, -3.4); coil.castShadow = true; deck.add(coil); }
  for (let k = 0; k < 14; k++) { const link = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), M.iron); link.position.set(-0.3 + Math.sin(k * 0.4) * 0.2, 0.03, -7.2 - k * 0.1); link.rotation.set(Math.PI / 2, 0, k % 2 ? Math.PI / 2 : 0); link.scale.set(1, 1.6, 1); deck.add(link); }
  deck.add(mesh(rbox(1.8, 0.06, 0.45, 0.02), M.pew, { pos: [0.6, 0.45, 5.4], tile: 1 }));
  deck.add(mesh(rbox(1.8, 0.45, 0.06, 0.02), M.pew, { pos: [0.6, 0.72, 5.65], tile: 1 }));

  // William at the bow rail, holdall at his feet, looking at the island
  const w = await person('w_ferry', M); w.position.set(-1.05, 0, -7.75); w.rotation.y = Math.PI + 0.45; deck.add(w);
  deck.add(holdall(M, [-0.45, 0, -7.3], 0.5));
  // the deckhand by the winch, watching him rather than the island
  const crew = await person('crew', M); crew.position.set(2.9, 0, -3.6); crew.rotation.y = -2.0; deck.add(crew);

  // light: the low winter sun behind thin cloud off to the right, cold sky fill
  const sun = shadowLight(new THREE.DirectionalLight('#ffe2bc', 2.4), 2048, 12, { far: 120 });
  sun.position.copy(sunDir).multiplyScalar(60); sun.target.position.set(0, 0, -2);
  scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.HemisphereLight('#9aa6b4', '#30383e', 0.9));
  // spray coming over the bow
  rain(scene, new THREE.Vector3(0, 2, -9), new THREE.Vector3(10, 4, 5), 160, new THREE.Vector3(0.1, -0.4, 1), 0.16, 0xc8d0d4, 0.25, 12);

  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 2000);
  camera.position.set(1.4, 2.9, -1.2);
  camera.lookAt(-2.2, 1.3, -16.0);
  return { scene, camera, look: { exposure: 1.0, aoRadius: 0.5 }, ui: { caption: ['MV Selkie', 'The crossing  -  15:12'] } };
}
