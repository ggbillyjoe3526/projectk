import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRAME_TIMING } from '../../config/render';
import { RENDER_BACKEND } from '../../config/renderBackend';
import { NodeBackend, type NodeBackendOptions } from './nodeBackend';

/**
 * The renderer's back end on a real `WebGPURenderer` from `three/webgpu`, with `forceWebGL: true` as a container's
 * browser test runs it. Node has no WebGL, so the renderer's `init` (which asks the browser for a context or device)
 * and the calls that reach the GPU are stood in for; everything else is Three's own.
 */

/** A canvas as much as the renderer's constructor touches. */
function fakeCanvas(): HTMLCanvasElement {
  return { style: {}, width: 300, height: 150, addEventListener: () => undefined, removeEventListener: () => undefined, getContext: () => null } as unknown as HTMLCanvasElement;
}

const WEBGL2: NodeBackendOptions = { antialias: false, forceWebGL: true };

/** `init` without a GPU: resolves, and leaves the back end Three chose (or the one `fallBack` swaps in). */
function stubInit(timestamps = false, fallBack = false): void {
  vi.spyOn(WebGPURenderer.prototype, 'init').mockImplementation(async function (this: WebGPURenderer) {
    if (fallBack) (this as unknown as { backend: object }).backend = { isWebGLBackend: true };
    return this;
  });
  vi.spyOn(WebGPURenderer.prototype, 'hasFeature').mockImplementation((name: string) => timestamps && name === 'timestamp-query');
  // Three's dispose reaches parts init makes: stood in for (a test of dispose itself stubs it again).
  vi.spyOn(WebGPURenderer.prototype, 'dispose').mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.stubGlobal('document', { createElementNS: () => fakeCanvas() });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('making the renderer', () => {
  it('makes WebGPURenderer on its WebGL2 back end when forced, and on WebGPU otherwise', async () => {
    stubInit();
    const gl2 = await NodeBackend.make(WEBGL2);
    expect(gl2.renderer).toBeInstanceOf(WebGPURenderer);
    expect(gl2.kind).toBe('webgl2');
    expect(gl2.renderer.samples).toBe(0);
    const gpu = await NodeBackend.make({ antialias: true, forceWebGL: false });
    expect(gpu.kind).toBe('webgpu');
    expect(gpu.antialiased).toBe(true);
    expect(gpu.timestamps).toBe(false);
  });

  it('refuses a WebGPU renderer Three fell back to WebGL2 with, unasked, and one whose device could not be made', async () => {
    stubInit(false, true);
    const disposed = vi.mocked(WebGPURenderer.prototype.dispose);
    await expect(NodeBackend.make({ antialias: false, forceWebGL: false })).rejects.toThrow(/WebGPU device unavailable/);
    expect(disposed).toHaveBeenCalledTimes(1);
    // A renderer whose init failed isn't disposed (Three's dispose would ask for init again, unhandled): vitest fails
    // the run on any unhandled rejection.
    vi.mocked(WebGPURenderer.prototype.init).mockRejectedValue(new Error('no device'));
    await expect(NodeBackend.make(WEBGL2)).rejects.toThrow('no device');
    expect(disposed).toHaveBeenCalledTimes(1);
  });
});

describe('a lost device', () => {
  it('is told to the game once, never logged as an error, and stops compiling', async () => {
    stubInit();
    const node = await NodeBackend.make(WEBGL2);
    const error = vi.spyOn(console, 'error');
    const told = vi.fn();
    node.onLost(told);
    const compile = vi.spyOn(node.renderer, 'compileAsync').mockResolvedValue(undefined as never);
    node.renderer.onDeviceLost({ api: 'WebGL', message: 'context lost', reason: null, originalEvent: null } as never);
    node.renderer.onDeviceLost({ api: 'WebGL', message: 'again', reason: null, originalEvent: null } as never);
    expect(node.lost).toBe(true);
    expect(told).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    node.compile(new THREE.Scene(), new THREE.PerspectiveCamera());
    expect(compile).not.toHaveBeenCalled();
  });

  it('asks for a replacement a few times, a moment apart, and lets a late one go when the game no longer wants it', async () => {
    vi.useFakeTimers();
    stubInit();
    const node = await NodeBackend.make(WEBGL2);
    const made = await NodeBackend.make(WEBGL2);
    const make = vi.fn<(o: NodeBackendOptions) => Promise<NodeBackend>>().mockRejectedValueOnce(new Error('not yet')).mockResolvedValueOnce(made);
    const asked = node.replacement(() => false, make);
    await vi.advanceTimersByTimeAsync(RENDER_BACKEND.recoverDelayMs * 2);
    expect(await asked).toBe(made);
    expect(make).toHaveBeenCalledTimes(2);
    expect(make).toHaveBeenLastCalledWith(WEBGL2);

    const none = node.replacement(() => false, () => Promise.reject(new Error('never')));
    await vi.advanceTimersByTimeAsync(RENDER_BACKEND.recoverDelayMs * RENDER_BACKEND.recoverTries);
    expect(await none).toBeNull();

    let wanted = true;
    const late = await NodeBackend.make(WEBGL2);
    const dispose = vi.spyOn(late, 'dispose');
    const cancelled = node.replacement(
      () => !wanted,
      () => {
        wanted = false; // the game was closed while the device was being made
        return Promise.resolve(late);
      },
    );
    await vi.advanceTimersByTimeAsync(RENDER_BACKEND.recoverDelayMs * RENDER_BACKEND.recoverTries);
    expect(await cancelled).toBeNull();
    expect(dispose).toHaveBeenCalled();
  });

  it('falls back to the WebGL2 back end when no new WebGPU device can be made, and gives up only when that fails too', async () => {
    vi.useFakeTimers();
    stubInit();
    const gpu = await NodeBackend.make({ antialias: true, forceWebGL: false });
    const webgl2 = await NodeBackend.make(WEBGL2);
    const make = vi.fn((o: NodeBackendOptions) => (o.forceWebGL ? Promise.resolve(webgl2) : Promise.reject(new Error('no device'))));
    const asked = gpu.replacement(() => false, make);
    await vi.advanceTimersByTimeAsync(RENDER_BACKEND.recoverDelayMs * RENDER_BACKEND.recoverTries);
    expect(await asked).toBe(webgl2);
    expect(make).toHaveBeenCalledTimes(RENDER_BACKEND.recoverTries + 1);
    expect(make).toHaveBeenLastCalledWith({ antialias: true, forceWebGL: true });

    // Given no tries (its devices keep being lost), it goes straight to the WebGL2 back end.
    make.mockClear();
    const straight = gpu.replacement(() => false, make, 0);
    await vi.advanceTimersByTimeAsync(0);
    expect(await straight).toBe(webgl2);
    expect(make).toHaveBeenCalledTimes(1);
    expect(make).toHaveBeenCalledWith({ antialias: true, forceWebGL: true });

    // A WebGL2 renderer that loses its context has nothing further to fall back to.
    const none = webgl2.replacement(() => false, () => Promise.reject(new Error('never')));
    await vi.advanceTimersByTimeAsync(RENDER_BACKEND.recoverDelayMs * RENDER_BACKEND.recoverTries);
    expect(await none).toBeNull();
  });
});

describe('the GPU timer from timestamp queries', () => {
  it('writes timestamps only while timing, reads one back every few frames, one at a time, and smooths it', async () => {
    stubInit(true);
    const node = await NodeBackend.make(WEBGL2);
    const backend = node.renderer.backend as unknown as { trackTimestamp: boolean };
    expect(node.timestamps).toBe(true);
    expect(backend.trackTimestamp).toBe(false);
    let answer: (ms: number) => void = () => undefined;
    const resolve = vi.spyOn(node.renderer, 'resolveTimestampsAsync').mockImplementation(() => new Promise((done) => (answer = done)));
    node.frameDone();
    expect(resolve).not.toHaveBeenCalled();
    node.setTiming(true);
    expect(backend.trackTimestamp).toBe(true);
    for (let i = 1; i < RENDER_BACKEND.timestampEvery; i++) node.frameDone();
    expect(resolve).not.toHaveBeenCalled();
    node.frameDone();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith('render');
    // One read on its way at a time.
    for (let i = 0; i < RENDER_BACKEND.timestampEvery * 2; i++) node.frameDone();
    expect(resolve).toHaveBeenCalledTimes(1);
    answer(4);
    await Promise.resolve();
    expect(node.gpuMs).toBe(4);
    for (let i = 0; i < RENDER_BACKEND.timestampEvery; i++) node.frameDone();
    expect(resolve).toHaveBeenCalledTimes(2);
    answer(8);
    await Promise.resolve();
    expect(node.gpuMs).toBeCloseTo(4 + 4 * FRAME_TIMING.smoothing);
    node.setTiming(false);
    expect(backend.trackTimestamp).toBe(false);
    expect(node.gpuMs).toBeNaN();
  });

  it('never switches timestamps on where the adapter offers none', async () => {
    stubInit(false);
    const node = await NodeBackend.make(WEBGL2);
    const resolve = vi.spyOn(node.renderer, 'resolveTimestampsAsync');
    node.setTiming(true);
    expect((node.renderer.backend as unknown as { trackTimestamp: boolean }).trackTimestamp).toBe(false);
    for (let i = 0; i < RENDER_BACKEND.timestampEvery * 3; i++) node.frameDone();
    expect(resolve).not.toHaveBeenCalled();
    expect(node.gpuMs).toBeNaN();
  });
});

describe('compiling ahead and letting go', () => {
  it('compiles a scene ahead of its first frame, without waiting', async () => {
    stubInit();
    const node = await NodeBackend.make(WEBGL2);
    const compiled: string[] = [];
    vi.spyOn(node.renderer, 'compileAsync').mockImplementation(async (scene) => void compiled.push(scene.name));
    node.compile(Object.assign(new THREE.Scene(), { name: 'world' }), new THREE.PerspectiveCamera());
    expect(compiled).toEqual(['world']);
  });

  it('frees the renderer on dispose, with no unhandled rejection if Three refuses', async () => {
    stubInit();
    const node = await NodeBackend.make(WEBGL2);
    const dispose = vi.mocked(WebGPURenderer.prototype.dispose).mockRejectedValue(new Error('already gone'));
    node.dispose();
    await new Promise((done) => setTimeout(done, 0));
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});

describe('the echo of a device loss', () => {
  it('is an OperationError soon after a loss, and nothing else is', async () => {
    const { isDeviceLossEcho } = await import('./nodeBackend');
    const dropped = Object.assign(new Error('Instance dropped in popErrorScope'), { name: 'OperationError' });
    expect(isDeviceLossEcho(dropped, 1000, 1000 + RENDER_BACKEND.lossEchoMs)).toBe(true);
    expect(isDeviceLossEcho(dropped, 1000, 1001 + RENDER_BACKEND.lossEchoMs)).toBe(false);
    expect(isDeviceLossEcho(dropped, Number.NEGATIVE_INFINITY, 1000)).toBe(false);
    expect(isDeviceLossEcho(new TypeError('x is undefined'), 1000, 1000)).toBe(false);
    expect(isDeviceLossEcho('OperationError', 1000, 1000)).toBe(false);
    expect(isDeviceLossEcho(null, 1000, 1000)).toBe(false);
  });
});
