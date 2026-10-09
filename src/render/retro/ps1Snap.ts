import { Fn, floor, mix, modelViewProjection, uniform, vec2, vec4 } from 'three/tsl';
import type { Node, NodeMaterial } from 'three/webgpu';

/**
 * PS1 vertex snapping: vertices land on a coarse screen grid, which gives the
 * characteristic subtle wobble as things move. One shared uniform set so the
 * settings slider changes every material at once.
 */
export const ps1Snap = {
  /** Grid size in pixels across the screen (usually half the internal resolution). */
  grid: uniform(vec2(240, 135)),
  /** 0 = off, 1 = full snap. */
  strength: uniform(1),
};

export function applyPs1Snap(material: NodeMaterial): NodeMaterial {
  material.vertexNode = Fn(() => {
    // Typed loosely in @types/three; it is the vec4 clip-space position.
    const clip = modelViewProjection as unknown as Node<'vec4'>;
    const ndc = clip.xy.div(clip.w);
    const snapped = floor(ndc.mul(ps1Snap.grid).add(0.5)).div(ps1Snap.grid);
    return vec4(mix(ndc, snapped, ps1Snap.strength).mul(clip.w), clip.z, clip.w);
  })();
  return material;
}
