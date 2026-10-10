import { RenderPipeline, type Camera, type Scene, type WebGPURenderer } from 'three/webgpu';
import { Fn, dot, float, floor, fract, max, mix, pass, renderOutput, screenCoordinate, screenUV, smoothstep, uniform, vec3, vec4 } from 'three/tsl';
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
  /** 0..1: low Resolve closing the view in: darkened edges, and the haar grade where only red keeps its colour. */
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
    const q = floor(squeezed.mul(steps).add(threshold)).div(steps);
    return vec4(q.clamp(0, 1), 1);
  })();

  const pipeline = new RenderPipeline(renderer, output);
  pipeline.outputColorTransform = false;
  return { pipeline, controls: { levels, dither, squeeze } };
}
