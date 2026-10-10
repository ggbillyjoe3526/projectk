import * as THREE from 'three';

/** The three art-direction candidates. Same scenes, same lights; only the image pipeline differs. */
export const DIRECTIONS = {
  A: {
    name: 'Peat & Sodium (PS1)', w: 320, h: 180, ui: [640, 360], snap: [160, 90],
    levels: 12, dither: 1, exposure: 1.0, sat: 1.0, contrast: 1.06, lift: 0.0, tint: [1, 1, 1],
    bloom: 0, grain: 0, vignette: 0.35, mono: 0, fogMul: 1.0,
  },
  B: {
    name: 'Lamplight (PS2)', w: 640, h: 360, ui: [960, 540], snap: [480, 270],
    levels: 48, dither: 0.6, exposure: 1.08, sat: 1.08, contrast: 1.04, lift: 0.012, tint: [1.03, 1.0, 0.95],
    bloom: 0.8, grain: 0.045, vignette: 0.55, mono: 0, fogMul: 1.15,
  },
  C: {
    name: 'Haar (monochrome)', w: 480, h: 270, ui: [960, 540], snap: [240, 135],
    levels: 20, dither: 1, exposure: 1.12, sat: 0.0, contrast: 1.22, lift: 0.0, tint: [0.93, 1.0, 0.98],
    bloom: 0.45, grain: 0.07, vignette: 0.6, mono: 1, fogMul: 1.45,
  },
};

const quadVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const brightFS = `uniform sampler2D tSrc; uniform vec2 texel; varying vec2 vUv;
void main(){
  vec3 c = vec3(0.0);
  for (int i=-1;i<=1;i++) for (int j=-1;j<=1;j++) c += texture2D(tSrc, vUv + vec2(i,j)*texel).rgb;
  c /= 9.0;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(0.55, 1.6, l), 1.0);
}`;

const blurFS = `uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
void main(){
  float w[5]; w[0]=0.227; w[1]=0.195; w[2]=0.122; w[3]=0.054; w[4]=0.016;
  vec3 c = texture2D(tSrc, vUv).rgb * w[0];
  for (int i=1;i<5;i++){ c += texture2D(tSrc, vUv + dir*float(i)).rgb * w[i]; c += texture2D(tSrc, vUv - dir*float(i)).rgb * w[i]; }
  gl_FragColor = vec4(c, 1.0);
}`;

const finalFS = `uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec2 res;
uniform float levels, dither, exposure, sat, contrast, lift, bloom, grain, vignette, mono, seed;
uniform vec3 tint; varying vec2 vUv;
float bayer2(vec2 a){ a = floor(a); return fract(a.x*0.5 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  c += texture2D(tBloom, vUv).rgb * bloom;
  c = aces(c * exposure);
  c = toSRGB(c);
  float l = dot(c, vec3(0.299,0.587,0.114));
  // keep red (blood, danger) when everything else drains
  float red = smoothstep(0.22, 0.4, c.r - c.g) * (1.0 - smoothstep(0.06, 0.16, c.g - c.b)) * smoothstep(0.15, 0.3, c.r);
  vec3 grey = vec3(l) * tint;
  c = mix(mix(grey, c * tint, sat), mix(grey, c*vec3(1.15,0.55,0.5), 0.9), red * mono);
  c = (c - 0.5) * contrast + 0.5 + lift;
  vec2 q = vUv - 0.5;
  c *= 1.0 - vignette * smoothstep(0.3, 0.85, length(q * vec2(1.0, 0.85)) * 1.25);
  c += (hash(gl_FragCoord.xy) - 0.5) * grain;
  float steps = levels - 1.0;
  float t = (bayer4(gl_FragCoord.xy) - 0.5) * dither + 0.5;
  c = floor(clamp(c, 0.0, 1.0) * steps + t) / steps;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export function createPipeline(renderer, dir) {
  const { w, h } = dir;
  const rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  const bw = Math.max(80, w >> 1), bh = Math.max(45, h >> 1);
  const rtA = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
  const rtB = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const qs = new THREE.Scene(); qs.add(quad);
  const bright = new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: brightFS, uniforms: { tSrc: { value: rtScene.texture }, texel: { value: new THREE.Vector2(1 / w, 1 / h) } } });
  const blur = new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader: blurFS, uniforms: { tSrc: { value: null }, dir: { value: new THREE.Vector2() } } });
  const final = new THREE.ShaderMaterial({
    vertexShader: quadVS, fragmentShader: finalFS,
    uniforms: {
      tScene: { value: rtScene.texture }, tBloom: { value: rtA.texture }, res: { value: new THREE.Vector2(w, h) },
      levels: { value: dir.levels }, dither: { value: dir.dither }, exposure: { value: dir.exposure }, sat: { value: dir.sat },
      contrast: { value: dir.contrast }, lift: { value: dir.lift }, bloom: { value: dir.bloom }, grain: { value: dir.grain },
      vignette: { value: dir.vignette }, mono: { value: dir.mono }, seed: { value: 1.7 }, tint: { value: new THREE.Vector3(...dir.tint) },
    },
  });
  const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(qs, cam); };
  return {
    render(scene, camera, exposureMul = 1) {
      final.uniforms.exposure.value = dir.exposure * exposureMul;
      renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
      pass(bright, rtA);
      for (let i = 0; i < 3; i++) {
        blur.uniforms.tSrc.value = rtA.texture; blur.uniforms.dir.value.set((1.5 + i) / bw, 0); pass(blur, rtB);
        blur.uniforms.tSrc.value = rtB.texture; blur.uniforms.dir.value.set(0, (1.5 + i) / bh); pass(blur, rtA);
      }
      pass(final, null);
    },
  };
}
