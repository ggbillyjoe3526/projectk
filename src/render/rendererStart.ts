import { type RendererChoice, wantsWebGpu } from '../config/renderBackend';
import { NodeBackend, type NodeBackendOptions } from './webgpu/nodeBackend';
import { probeWebGpu, type WebGpuProbe } from './webgpuProbe';

/**
 * The renderer a visit starts with. On Auto (the default) or WebGPU the adapter probe runs first; with a hardware
 * adapter (on Auto: a software WebGPU is far slower than WebGL2 on the same machine) `WebGPURenderer` draws on a WebGPU
 * device. With none, on the WebGL2 pick, with `forceWebGL` (automated browsers in containers, which have no adapter),
 * or when a device can't be made after all, the same renderer draws on its WebGL2 back end, quietly. Only when that
 * fails too does the start reject, and the boot shows the crash pane with the graphics advice.
 */

/** What a visit draws with, and the adapter's name ('' when none was asked for or given). */
export interface StartingRenderer {
  node: NodeBackend;
  adapterName: string;
}

export async function startingRenderer(
  choice: RendererChoice,
  forceWebGL: boolean,
  antialias: boolean,
  probe: () => Promise<WebGpuProbe> = probeWebGpu,
  make: (options: NodeBackendOptions) => Promise<NodeBackend> = NodeBackend.make,
): Promise<StartingRenderer> {
  let adapterName = '';
  if (wantsWebGpu(choice) && !forceWebGL) {
    const found = await probe();
    adapterName = found.name;
    if (found.available && !(found.software && choice === 'auto')) {
      const node = await make({ antialias, forceWebGL: false }).catch(() => null);
      if (node) return { node, adapterName };
    }
  }
  return { node: await make({ antialias, forceWebGL: true }), adapterName };
}
