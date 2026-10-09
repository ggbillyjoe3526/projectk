/**
 * Which back end draws the game. There is one renderer, Three's `WebGPURenderer` (`three/webgpu`), with all materials
 * and post-processing written in TSL; it draws on a WebGPU device where the browser gives a hardware adapter, and on its
 * own WebGL2 back end otherwise (concept v0.6 section 10: the automatic fallback). The player's pick (a setting,
 * `renderer`) applies from the next load.
 */

/** The player's pick: Auto (WebGPU on a hardware adapter, else WebGL2), WebGPU (on any adapter), or WebGL2 always. */
export type RendererChoice = 'auto' | 'webgpu' | 'webgl';
export const RENDERER_IDS: readonly RendererChoice[] = ['auto', 'webgpu', 'webgl'];
export const DEFAULT_RENDERER: RendererChoice = 'auto';

/** What draws: `WebGPURenderer` on a WebGPU device, or on its WebGL2 back end. */
export type RenderBackend = 'webgpu' | 'webgl2';

export const RENDER_BACKEND = {
  /** The adapter probe gives up after this long (a browser that never answers is a browser without WebGPU). */
  probeTimeoutMs: 3000,
  /** A lost WebGPU device: a new one is asked for this many times, this far apart, before the WebGL2 back end takes over. */
  recoverTries: 3,
  recoverDelayMs: 1000,
  /** A WebGPU device lost more than this many times in one visit (an unstable driver): the WebGL2 back end takes over. */
  maxWebGpuLosses: 2,
  /** The GPU timer (debug overlay): timestamp queries read back once every this many frames, one read at a time. */
  timestampEvery: 10,
  /**
   * After a device loss, Three's pending GPU promises reject (`OperationError: Instance dropped in popErrorScope`):
   * for this long (ms) after the loss is reported, such a rejection is the loss's echo, not a crash.
   */
  lossEchoMs: 5000,
} as const;

/** True when a visit with this pick asks for a WebGPU adapter first: Auto and WebGPU. Pure. */
export function wantsWebGpu(choice: RendererChoice): boolean {
  return choice !== 'webgl';
}
