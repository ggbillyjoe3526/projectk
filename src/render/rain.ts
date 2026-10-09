import { Sprite, SpriteNodeMaterial, Vector3, type WebGPURenderer } from 'three/webgpu';
import { Fn, cameraPosition, distance, floor, hash, instanceIndex, instancedArray, smoothstep, uniform, vec2, vec3 } from 'three/tsl';

/**
 * Wind-driven rain simulated on the GPU with a compute shader (concept §8).
 * Drops live in a box that follows the camera's focus and wrap around, so the
 * cost is fixed whatever the size of the island. Instanced sprites, not
 * Points (Points are one pixel wide on WebGPU). The drops' buffer belongs to
 * whichever renderer draws them, so a new renderer (after a lost device)
 * scatters them afresh on its first step.
 */
export class Rain {
  readonly object: Sprite;
  readonly center = uniform(new Vector3());
  readonly wind = uniform(new Vector3(-3.2, -12, 1.6));
  private readonly dt = uniform(0);
  private readonly init;
  private readonly update;
  private scatteredFor: WebGPURenderer | null = null;

  constructor(count = 5000) {
    const box = vec3(40, 18, 40);
    const positions = instancedArray(count, 'vec3');

    this.init = Fn(() => {
      const p = positions.element(instanceIndex);
      p.assign(vec3(hash(instanceIndex), hash(instanceIndex.add(1187)), hash(instanceIndex.add(5323))).mul(box));
    })().compute(count);

    this.update = Fn(() => {
      const p = positions.element(instanceIndex);
      const jitter = hash(instanceIndex.add(9001)).mul(0.5).add(0.75);
      const next = p.add(this.wind.mul(this.dt).mul(jitter));
      // Wrap inside the box (floor-based, so negative values wrap correctly on every backend).
      p.assign(next.sub(box.mul(floor(next.div(box)))));
    })().compute(count);

    const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false });
    const world = positions.toAttribute().sub(box.mul(0.5)).add(this.center);
    material.positionNode = world;
    material.colorNode = vec3(0.5, 0.57, 0.62);
    // Faint, and fading out right in front of the lens so no drop becomes a white bar.
    const nearFade = smoothstep(2, 7, distance(world, cameraPosition));
    material.opacityNode = hash(instanceIndex).mul(0.14).add(0.1).mul(nearFade);
    material.scaleNode = vec2(0.02, 0.34);

    this.object = new Sprite(material);
    this.object.count = count;
    this.object.frustumCulled = false;
  }

  step(renderer: WebGPURenderer, dt: number, focus: { x: number; y: number; z: number }): void {
    if (this.scatteredFor !== renderer) {
      renderer.compute(this.init);
      this.scatteredFor = renderer;
    }
    this.dt.value = dt;
    this.center.value.set(focus.x, focus.y + 4, focus.z);
    renderer.compute(this.update);
  }
}
