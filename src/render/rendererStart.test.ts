import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_RENDERER } from '../config/renderBackend';
import { startingRenderer } from './rendererStart';
import type { NodeBackend, NodeBackendOptions } from './webgpu/nodeBackend';
import { noWebGpu, probeWebGpu, type WebGpuProbe } from './webgpuProbe';

/** Stand-in renderers: the options each was made with tell which back end it is. */
function maker(failWebGpu = false) {
  return vi.fn((options: NodeBackendOptions): Promise<NodeBackend> => {
    if (failWebGpu && !options.forceWebGL) return Promise.reject(new Error('WebGPU device unavailable'));
    return Promise.resolve({ kind: options.forceWebGL ? 'webgl2' : 'webgpu' } as NodeBackend);
  });
}
const found = (available: boolean) => vi.fn((): Promise<WebGpuProbe> => Promise.resolve({ ...noWebGpu(), available, name: available ? 'test gpu' : '' }));

describe('the renderer a visit starts with', () => {
  it('on Auto (the default) with a hardware adapter draws with WebGPU, with the visit’s antialiasing', async () => {
    expect(DEFAULT_RENDERER).toBe('auto');
    for (const choice of ['auto', 'webgpu'] as const) {
      const make = maker();
      const start = await startingRenderer(choice, false, true, found(true), make);
      expect(start.node.kind, choice).toBe('webgpu');
      expect(start.adapterName).toBe('test gpu');
      expect(make).toHaveBeenCalledWith({ antialias: true, forceWebGL: false });
    }
  });

  it('on Auto with no adapter, or in a browser without navigator.gpu, draws with WebGL2 and logs no error', async () => {
    const error = vi.spyOn(console, 'error');
    for (const nav of [{}, { gpu: { requestAdapter: () => Promise.resolve(null) } }]) {
      const make = maker();
      expect((await startingRenderer('auto', false, false, () => probeWebGpu(nav), make)).node.kind).toBe('webgl2');
      expect(make).toHaveBeenCalledTimes(1);
    }
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('on the WebGL pick, or with forceWebGL, asks for no adapter', async () => {
    for (const [choice, force] of [['webgl', false], ['webgpu', true]] as const) {
      const probe = found(true);
      const make = maker();
      expect((await startingRenderer(choice, force, false, probe, make)).node.kind).toBe('webgl2');
      expect(probe).not.toHaveBeenCalled();
      expect(make).toHaveBeenCalledWith({ antialias: false, forceWebGL: true });
    }
  });

  it('on Auto leaves a software adapter alone (WebGL2 is far faster on that machine); a WebGPU pick still takes it', async () => {
    const software = vi.fn((): Promise<WebGpuProbe> => Promise.resolve({ ...noWebGpu(), available: true, software: true, name: 'swiftshader' }));
    expect(await startingRenderer('auto', false, false, software, maker())).toMatchObject({ node: { kind: 'webgl2' }, adapterName: 'swiftshader' });
    expect((await startingRenderer('webgpu', false, false, software, maker())).node.kind).toBe('webgpu');
  });

  it('falls back to WebGL2 quietly when a WebGPU device can’t be made, and rejects only when WebGL2 fails too', async () => {
    const make = maker(true);
    expect((await startingRenderer('webgpu', false, false, found(true), make)).node.kind).toBe('webgl2');
    expect(make).toHaveBeenCalledTimes(2);
    await expect(startingRenderer('auto', false, false, found(false), () => Promise.reject(new Error('no WebGL2 context')))).rejects.toThrow('no WebGL2 context');
  });
});
