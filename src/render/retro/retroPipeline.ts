import { RenderPipeline, type Camera, type Scene, type WebGPURenderer } from 'three/webgpu';
import { Fn, atan, dot, float, floor, fract, max, mix, pass, renderOutput, screenCoordinate, screenUV, sin, smoothstep, uniform, vec3, vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import { RETRO_LOOK } from '../../config/render';

/**
 * The PS1/PS2 look as a TSL render pipeline (concept §8): the scene renders at
 * a tiny internal resolution (the canvas itself is that size and the browser
 * upscales it with hard pixels), then each channel is quantised with a 4×4
 * ordered dither. Mirrors retroMath.ts exactly.
 *
 * Listening (William, 2026-10-10; made subtler the same day): while the player kneels to feel the island, the
 * screen's edges move faintly like water, a gentle swell at low tide and an unsteady one at high water, with the beat.
 */

type N = Node<'vec2'>;

const bayer2 = (a: N) => {
  const f = floor(a);
  return fract(f.x.mul(0.5).add(f.y.mul(f.y).mul(0.75)));
};
const bayer4 = (a: N) => bayer2(a.mul(0.5)).mul(0.25).add(bayer2(a));

export interface RetroControls {
  /** Colour steps per channel (32 ≈ 15-bit colour). */
  readonly levels: { value: number };
  /** 0 = plain quantisation (banding), 1 = full ordered dither. */
  readonly dither: { value: number };
  /** 0..1: low Resolve closing the view in: darkened edges, and the haar grade where only red keeps its colour. */
  readonly squeeze: { value: number };
  /** 0..1: how far into listening (eased in and out by `updateListenCue`). */
  readonly listen: { value: number };
  /** 0..1: the hum's strength, the tide's unrest; the edge wave is calm at 0 and unstable at 1. */
  readonly unrest: { value: number };
  /** 0..1: the beat's pulse this frame. */
  readonly pulse: { value: number };
  /** Seconds, for the wave's motion. */
  readonly time: { value: number };
}

/** Per frame: ease the listening cue in or out, and feed it the hum's strength and beat. */
export function updateListenCue(c: RetroControls, listening: boolean, strength: number, beat: number, dt: number, nowSeconds: number): void {
  const target = listening ? 1 : 0;
  const rate = listening ? 2.5 : 4;
  c.listen.value += Math.max(-rate * dt, Math.min(rate * dt, target - c.listen.value));
  c.unrest.value = Math.min(1, Math.max(0, strength));
  c.pulse.value = beat;
  c.time.value = nowSeconds;
}

export function createRetroPipeline(renderer: WebGPURenderer, scene: Scene, camera: Camera): { pipeline: RenderPipeline; controls: RetroControls } {
  const levels = uniform(RETRO_LOOK.colourLevels);
  const dither = uniform(1);
  const squeeze = uniform(0);
  const listen = uniform(0);
  const unrest = uniform(0);
  const pulse = uniform(0);
  const time = uniform(0);

  const scenePass = pass(scene, camera);
  const sceneTexture = scenePass.getTextureNode();

  const output = Fn(() => {
    // The listening wave: the picture's edges pushed in and out along rings, more and faster as the tide rises, with
    // a shudder round the rim near high water. Nothing moves at the centre, or while not listening.
    const fromCentre = screenUV.sub(0.5);
    const r = fromCentre.length();
    const angle = atan(fromCentre.y, fromCentre.x);
    const rim = smoothstep(0.3, 0.68, r).mul(listen);
    const swell = sin(r.mul(mix(9, 22, unrest)).sub(time.mul(mix(1.1, 3.2, unrest))));
    const shudder = sin(angle.mul(9).add(time.mul(7.3))).mul(sin(time.mul(23.0).add(angle.mul(3)))).mul(unrest.mul(unrest));
    const amount = mix(0.004, 0.012, unrest).mul(pulse.mul(0.6).add(0.4));
    const warped = screenUV.add(fromCentre.normalize().mul(swell.add(shudder.mul(1.4)).mul(amount).mul(rim)));
    // Tone-map and convert to sRGB first, so quantisation steps are perceptual.
    const color = renderOutput(sceneTexture.sample(warped));
    const steps = levels.sub(1);
    const threshold = bayer4(screenCoordinate.xy).sub(0.5).mul(dither).add(0.5);
    // Low Resolve: the haar grade (art direction round 3), the world drained to a cold grey with only red (blood,
    // danger) keeping its colour, and the edges closing in. retroMath.ts haarGrade is the same sum, tested.
    const c = color.rgb;
    const luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    const haar = vec3(luma).mul(vec3(0.94, 1, 1)).sub(0.5).mul(1.2).add(0.5);
    const gb = max(c.g, c.b);
    const red = smoothstep(0.16, 0.3, c.r.sub(gb))
      .mul(smoothstep(0.1, 0.25, c.r))
      .mul(smoothstep(0.26, 0.38, gb.div(max(c.r, float(1e-3)))).oneMinus())
      .mul(smoothstep(0.05, 0.14, c.g.sub(c.b)).oneMinus());
    const keepRed = mix(haar, c.mul(vec3(1.2, 0.5, 0.45)), 0.92);
    const edge = smoothstep(0.25, 0.75, screenUV.sub(0.5).length().mul(1.3));
    const squeezed = mix(c, mix(haar, keepRed, red), squeeze).mul(edge.mul(squeeze).oneMinus());
    // A cold sheen on the moving edge, brighter on the beat.
    const crest = smoothstep(0.55, 0.95, swell.add(shudder.mul(0.8)));
    const sheen = rim.mul(crest.mul(0.75).add(0.25)).mul(mix(0.035, 0.075, unrest)).mul(pulse.mul(0.6).add(0.4));
    const listened = squeezed.mul(rim.mul(0.1).oneMinus()).add(vec3(0.5, 0.72, 0.9).mul(sheen));
    const q = floor(listened.mul(steps).add(threshold)).div(steps);
    return vec4(q.clamp(0, 1), 1);
  })();

  const pipeline = new RenderPipeline(renderer, output);
  pipeline.outputColorTransform = false;
  return { pipeline, controls: { levels, dither, squeeze, listen, unrest, pulse, time } };
}
