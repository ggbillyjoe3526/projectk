import { RenderPipeline, type Camera, type Scene, type WebGPURenderer } from 'three/webgpu';
import { Fn, dot, floor, fract, mix, pass, renderOutput, screenCoordinate, screenUV, smoothstep, uniform, vec3, vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import { RETRO_LOOK } from '../../config/render';

/**
 * The PS1/PS2 look as a TSL render pipeline (concept §8): the scene renders at
 * a tiny internal resolution (the canvas itself is that size and the browser
 * upscales it with hard pixels), then each channel is quantised with a 4×4
 * ordered dither. Mirrors retroMath.ts exactly.
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
  /** 0..1: low Resolve closing the view in (darkened edges, colour drained). */
  readonly squeeze: { value: number };
}

export function createRetroPipeline(renderer: WebGPURenderer, scene: Scene, camera: Camera): { pipeline: RenderPipeline; controls: RetroControls } {
  const levels = uniform(RETRO_LOOK.colourLevels);
  const dither = uniform(1);
  const squeeze = uniform(0);

  // Tone-map and convert to sRGB first, so quantisation steps are perceptual.
  const color = renderOutput(pass(scene, camera));

  const output = Fn(() => {
    const steps = levels.sub(1);
    const threshold = bayer4(screenCoordinate.xy).sub(0.5).mul(dither).add(0.5);
    // Low Resolve: the colour drains and the edges close in.
    const grey = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    const edge = smoothstep(0.25, 0.75, screenUV.sub(0.5).length().mul(1.3));
    const squeezed = mix(color.rgb, grey, squeeze.mul(0.7)).mul(edge.mul(squeeze).oneMinus());
    const q = floor(squeezed.mul(steps).add(threshold)).div(steps);
    return vec4(q.clamp(0, 1), 1);
  })();

  const pipeline = new RenderPipeline(renderer, output);
  pipeline.outputColorTransform = false;
  return { pipeline, controls: { levels, dither, squeeze } };
}
