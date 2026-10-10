import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * Direction B, "Lamplight", rebuilt for realism: HDR linear render with MSAA, ground-truth AO,
 * physically-based bloom, then a filmic grade with grain, halation, vignette and slight lens
 * fringing. `mono` is the low-Resolve state: the world drains to the haar grey and only red survives.
 */
export const LOOK = {
  w: 1280, h: 720,
  exposure: 1.0, sat: 0.86, contrast: 1.08, lift: 0.006, tint: [1.035, 1.0, 0.94],
  bloom: 0.35, bloomRadius: 0.55, bloomThreshold: 0.9, grain: 0.055, vignette: 0.5, fringe: 0.00025,
};

const gradeFS = `uniform sampler2D tDiffuse; uniform vec2 res;
uniform float exposure, sat, contrast, lift, grain, vignette, mono, seed, fringe;
uniform vec3 tint; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec2 q = vUv - 0.5;
  // lens fringing, stronger towards the corners
  vec2 off = q * dot(q, q) * fringe * 40.0;
  vec3 c;
  c.r = texture2D(tDiffuse, vUv - off).r;
  c.g = texture2D(tDiffuse, vUv).g;
  c.b = texture2D(tDiffuse, vUv + off).b;
  c = aces(c * exposure);
  c = toSRGB(c);
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  // keep red (blood, danger) when everything else drains
  float red = smoothstep(0.16, 0.3, c.r - max(c.g, c.b)) * smoothstep(0.1, 0.25, c.r) * smoothstep(0.38, 0.26, max(c.g, c.b) / max(c.r, 1e-3)) * (1.0 - smoothstep(0.05, 0.14, c.g - c.b));
  vec3 graded = mix(vec3(l), c, sat) * tint;
  vec3 haar = vec3(l) * vec3(0.94, 1.0, 1.0);
  haar = (haar - 0.5) * 1.2 + 0.5;
  vec3 keepRed = mix(haar, c * vec3(1.2, 0.5, 0.45), 0.92);
  c = mix(graded, mix(haar, keepRed, red), mono);
  c = (c - 0.5) * contrast + 0.5 + lift;
  c *= 1.0 - (vignette + mono * 0.2) * smoothstep(0.25, 0.9, length(q * vec2(1.0, 0.8)) * 1.3);
  // film grain: stronger in the mids and shadows
  float g = hash(gl_FragCoord.xy) + hash(gl_FragCoord.xy + 17.3) - 1.0;
  c += g * grain * (1.0 - l * 0.6);
  // dither against banding
  c += (hash(gl_FragCoord.yx + 3.1) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export function createPipeline(renderer, scene, camera, o = {}) {
  const L = { ...LOOK, ...o };
  const { w, h } = L;
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  if (L.ao !== false) {
    const ao = new GTAOPass(scene, camera, w, h);
    ao.updateGtaoMaterial({ radius: L.aoRadius ?? 0.5, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    ao.blendIntensity = L.aoIntensity ?? 1.0;
    // keep sprites, light shafts, glass and the sky out of the AO normal/depth pass
    ao._overrideVisibility = function () {
      const cache = this._visibilityCache;
      this.scene.traverse((o) => {
        const m = o.material;
        const skip = o.isPoints || o.isLine || o.isLine2 || o.isSprite || o.userData.noAO || (m && !Array.isArray(m) && (m.transparent || m.blending === THREE.AdditiveBlending));
        if (skip && o.visible) { o.visible = false; cache.push(o); }
      });
    };
    composer.addPass(ao);
  }
  if (L.bloom > 0) composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), L.bloom, L.bloomRadius, L.bloomThreshold));
  const grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, res: { value: new THREE.Vector2(w, h) }, exposure: { value: L.exposure }, sat: { value: L.sat },
      contrast: { value: L.contrast }, lift: { value: L.lift }, grain: { value: L.grain }, vignette: { value: L.vignette },
      mono: { value: L.mono ?? 0 }, seed: { value: 1.7 }, fringe: { value: L.fringe }, tint: { value: new THREE.Vector3(...L.tint) },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: gradeFS,
  });
  composer.addPass(grade);
  return { composer, render: () => composer.render(), L };
}
