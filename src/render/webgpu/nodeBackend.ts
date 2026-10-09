import type * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { FRAME_TIMING } from '../../config/render';
import { RENDER_BACKEND, type RenderBackend } from '../../config/renderBackend';
import { fitBrowser } from './webgpuCompat';

/**
 * The game's one renderer: Three's `WebGPURenderer`, on a WebGPU device or on its own WebGL2 back end
 * (render/rendererStart.ts picks which). What the game needs of it beyond the drawing calls: the device made and
 * initialised before the first frame, a lost device reported (never logged as an error) and a new one made on request,
 * shaders compiled ahead of a scene's first frame, GPU time from timestamp queries, the debug overlay's counts, and
 * everything let go on dispose.
 */

const ignore = (): void => undefined;

export interface NodeBackendOptions {
  /** Multisampled (4×) canvas: fixed for the renderer's life, as a WebGL context's is. */
  antialias: boolean;
  /** The WebGL2 back end without asking for WebGPU. */
  forceWebGL: boolean;
}

/** What one frame drew and what the renderer holds, for the debug overlay. */
export interface DrawStats {
  calls: number;
  triangles: number;
  programs: number;
  geometries: number;
  textures: number;
}

/** The one back-end flag the timer flips: whether each render pass writes timestamps (not in Three's type for Backend). */
interface TimestampSwitch {
  trackTimestamp: boolean;
}

export class NodeBackend {
  /** GPU milliseconds a frame, smoothed (FRAME_TIMING): NaN until a first result, while not timing, or without the feature. */
  gpuMs = Number.NaN;
  /** The device (or the WebGL2 context) is gone: nothing draws until a new renderer takes over (`replacement`). */
  lost = false;
  /** The back end the renderer settled on. */
  readonly kind: RenderBackend;
  /** The adapter offers timestamp queries ('timestamp-query'; EXT_disjoint_timer_query_webgl2 on the WebGL2 back end). */
  readonly timestamps: boolean;
  private timing = false;
  /** Frames since the last timestamp read was asked for, and whether one is still on its way back. */
  private sinceRead = 0;
  private reading = false;
  private lostListener: () => void = () => undefined;
  /** Filled by `stats`: one object, nothing allocated per read. */
  private readonly drawStats: DrawStats = { calls: 0, triangles: 0, programs: 0, geometries: 0, textures: 0 };

  private constructor(
    readonly renderer: WebGPURenderer,
    private readonly options: NodeBackendOptions,
  ) {
    this.kind = (renderer.backend as { isWebGLBackend?: boolean }).isWebGLBackend ? 'webgl2' : 'webgpu';
    this.timestamps = renderer.hasFeature('timestamp-query');
    // Three's own handler logs the loss as an error and stops the renderer for good; the game recovers instead.
    renderer.onDeviceLost = () => {
      if (this.lost) return;
      this.lost = true;
      this.lostListener();
    };
    this.track(false);
  }

  /**
   * A renderer on a canvas of its own, initialised (the device asked for), with the game's output settings set by the
   * caller. Rejects when no device can be made; and when WebGPU was asked for but Three fell back to its WebGL2 back end
   * by itself, so the caller decides (rendererStart asks for the WebGL2 back end explicitly).
   */
  static async make(options: NodeBackendOptions): Promise<NodeBackend> {
    const renderer = new WebGPURenderer({ antialias: options.antialias, powerPreference: 'high-performance', forceWebGL: options.forceWebGL });
    // A renderer whose init failed is left to the collector, not disposed: its dispose() asks for init again and leaves
    // that rejection unhandled inside Three (which the game would take for a crash), and it holds no device to free.
    await renderer.init();
    // Browsers whose WebGPU differs from what Three expects are fitted before the first frame (webgpuCompat.ts).
    await fitBrowser((renderer.backend as { device?: Parameters<typeof fitBrowser>[0] }).device);
    const backend = new NodeBackend(renderer, options);
    if (backend.kind === 'webgl2' && !options.forceWebGL) {
      backend.dispose();
      throw new Error('WebGPU device unavailable');
    }
    return backend;
  }

  /** The canvas is really multisampled. */
  get antialiased(): boolean {
    return this.renderer.samples > 0;
  }

  get maxAnisotropy(): number {
    return this.renderer.getMaxAnisotropy();
  }

  /**
   * This frame's draws and triangles and what the renderer holds. The renderer's `render.calls` counts render() calls
   * (never reset); its draws are `render.drawCalls`. The object is reused.
   */
  get stats(): DrawStats {
    const out = this.drawStats;
    const { render, memory } = this.renderer.info;
    out.calls = render.drawCalls;
    out.triangles = render.triangles;
    out.programs = memory.programs;
    out.geometries = memory.geometries;
    out.textures = memory.textures;
    return out;
  }

  /** `listener` is told once when the device (or the WebGL2 context) is lost. */
  onLost(listener: () => void): void {
    this.lostListener = listener;
  }

  /**
   * A new renderer on a new canvas and device with the same options, after a loss: asked `tries` times,
   * `RENDER_BACKEND.recoverDelayMs` apart, until one is made or `cancelled()`. A WebGPU renderer that can't get a new
   * device (or is given no tries: its devices keep being lost) then falls back to the WebGL2 back end. Null when nothing
   * could be made.
   */
  async replacement(
    cancelled: () => boolean,
    make: (options: NodeBackendOptions) => Promise<NodeBackend> = NodeBackend.make,
    tries: number = RENDER_BACKEND.recoverTries,
  ): Promise<NodeBackend | null> {
    for (let i = 0; i < tries; i++) {
      await new Promise((done) => setTimeout(done, RENDER_BACKEND.recoverDelayMs));
      if (cancelled()) return null;
      const next = await make(this.options).catch(() => null);
      if (next && cancelled()) next.dispose();
      else if (next) return next;
    }
    if (this.options.forceWebGL || cancelled()) return null;
    const webgl2 = await make({ ...this.options, forceWebGL: true }).catch(() => null);
    if (webgl2 && cancelled()) {
      webgl2.dispose();
      return null;
    }
    return webgl2;
  }

  /** GPU timing on or off (the debug overlay): render passes write timestamps only while it is on. */
  setTiming(on: boolean): void {
    if (on === this.timing) return;
    this.timing = on;
    this.track(on);
    this.sinceRead = 0;
    if (!on) this.gpuMs = Number.NaN;
  }

  /**
   * After each frame's draws: every `RENDER_BACKEND.timestampEvery` frames, while timing, reads the GPU time of the last
   * frame whose timestamps are in (one read on its way at a time, never waited for).
   */
  frameDone(): void {
    if (!this.timing || this.reading || !this.timestamps || this.lost) return;
    if (++this.sinceRead < RENDER_BACKEND.timestampEvery) return;
    this.sinceRead = 0;
    this.reading = true;
    this.renderer.resolveTimestampsAsync('render').then(this.timestampRead, this.timestampFailed);
  }

  /**
   * Compiles the pipelines `scene` needs ahead of its first frame, so nothing stalls mid-play. Not waited for: what
   * isn't ready by the first frame compiles as it draws. A failure here also fails that frame's draw, which reports it.
   */
  compile(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.lost) return;
    void this.renderer.compileAsync(scene, camera).catch(ignore);
  }

  /** Frees the renderer, its canvas's context and (on WebGPU) its device. */
  dispose(): void {
    this.lostListener = () => undefined;
    this.timing = false;
    this.renderer.dispose().catch(ignore);
  }

  private track(on: boolean): void {
    (this.renderer.backend as unknown as TimestampSwitch).trackTimestamp = on && this.timestamps;
  }

  private readonly timestampRead = (ms: number | undefined): void => {
    this.reading = false;
    if (!this.timing || typeof ms !== 'number' || !(ms > 0)) return;
    this.gpuMs = Number.isNaN(this.gpuMs) ? ms : this.gpuMs + (ms - this.gpuMs) * FRAME_TIMING.smoothing;
  };

  private readonly timestampFailed = (): void => {
    this.reading = false;
  };
}

/**
 * Whether an unhandled rejection is the echo of a device loss reported at `lostAt` (ms, the same clock as `now`;
 * -Infinity when none was): Three's GPU promises still pending when the device went reject with an OperationError,
 * which must not stop the game on the crash pane while a new device is being made.
 */
export function isDeviceLossEcho(reason: unknown, lostAt: number, now: number): boolean {
  return now - lostAt <= RENDER_BACKEND.lossEchoMs && typeof reason === 'object' && reason !== null && (reason as { name?: unknown }).name === 'OperationError';
}
