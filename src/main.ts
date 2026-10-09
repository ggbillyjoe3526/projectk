import './style.css';
import * as THREE from 'three';
import { CRASH_TEXT, GRAPHICS_ERROR } from './config/crash';
import { FRAME_RATE_CAPS } from './config/render';
import { DEFAULT_RENDERER, RENDER_BACKEND, RENDERER_IDS } from './config/renderBackend';
import { SIM, SIM_DT } from './config/sim';
import { awayWatch } from './core/awayWatch';
import { crashReport, type ReportField } from './core/crashReport';
import { advanceStepper, createStepper } from './core/fixedStepper';
import { FramePacer } from './core/framePacer';
import { parseSeed, randomSeed } from './core/seed';
import { KeyBindings } from './input/keyBindings';
import { Keyboard } from './input/keyboard';
import { browserKeyboardMap, watchKeyboardLayout } from './input/keyboardLayout';
import { startingRenderer } from './render/rendererStart';
import { isDeviceLossEcho, type NodeBackend } from './render/webgpu/nodeBackend';
import { startGuardedStorage } from './save/guardedStorage';
import { browserStorage, flushSettings, loadSetting, oneOf } from './settings/storage';
import { CrashScreen } from './ui/crashScreen';
import { DebugOverlay } from './ui/debugOverlay';

/**
 * The boot shell: starts the save storage, the renderer (WebGPU, else its WebGL2 back end), input and the fixed 60 Hz
 * loop, with the debug overlay (` or F3) and the crash pane. It draws an empty scene: the simulation's fixed step
 * goes where the ticks are counted, and presentation interpolates between ticks with `stepperAlpha(stepper)`.
 */

/** The facts every crash report carries, filled in as the boot learns them. */
const facts: { seed: number | null; backend: string; adapter: string; tick: number } = { seed: null, backend: '', adapter: '', tick: 0 };
let crash: CrashScreen | null = null;
let started = false;
/** When the GPU device was last lost (performance.now()), for telling its echoes from real errors. */
let lostAt = Number.NEGATIVE_INFINITY;

function reportFields(): ReportField[] {
  return [
    ['Seed', facts.seed],
    ['Renderer', facts.backend],
    ['Adapter', facts.adapter],
    ['Tick', facts.tick],
  ];
}

/** Shows the crash pane (once; later errors join its report). */
function fail(error: unknown): void {
  const report = crashReport({ title: 'ProjectK crash report', build: __BUILD_VERSION__, userAgent: navigator.userAgent, fields: reportFields(), error });
  if (crash) {
    crash.append(report);
    return;
  }
  const graphics = !started && error instanceof Error && GRAPHICS_ERROR.test(error.message);
  crash = new CrashScreen(document.body, {
    heading: started ? CRASH_TEXT.heading : CRASH_TEXT.bootHeading,
    body: started ? CRASH_TEXT.body : CRASH_TEXT.bootBody,
    advice: graphics ? CRASH_TEXT.bootGraphics : '',
    report,
  });
}

async function main(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) throw new Error('#app container missing');
  startGuardedStorage();
  const params = new URLSearchParams(window.location.search);
  facts.seed = parseSeed(params.get('seed')) ?? randomSeed();

  const choice = loadSetting('renderer', oneOf(RENDERER_IDS), DEFAULT_RENDERER);
  const start = await startingRenderer(choice, params.has('forceWebGL'), true);
  let node: NodeBackend = start.node;
  facts.backend = node.kind;
  facts.adapter = start.adapterName;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  const fit = (): void => {
    node.renderer.setPixelRatio(window.devicePixelRatio);
    node.renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.updateProjectionMatrix();
  };
  container.appendChild(node.renderer.domElement);
  fit();
  window.addEventListener('resize', fit);

  const bindings = new KeyBindings(browserStorage());
  watchKeyboardLayout(browserKeyboardMap(), window, (layout) => bindings.setLayout(layout));
  const keyboard = new Keyboard(window, bindings);
  awayWatch({ doc: document, win: window }, () => keyboard.releaseAll());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushSettings();
  });

  const overlay = new DebugOverlay(container, () => ({
    renderer: `${node.kind}${start.adapterName ? ` (${start.adapterName})` : ''}`,
    'draw calls': node.stats.calls,
    triangles: node.stats.triangles,
    'gpu ms': Number.isNaN(node.gpuMs) ? '-' : node.gpuMs.toFixed(2),
    tick: facts.tick,
    seed: facts.seed ?? '-',
  }));
  overlay.setFpsReadout(loadSetting('showFps', (raw) => (typeof raw === 'boolean' ? raw : undefined), false));
  const frameRateCap = loadSetting('frameRateCap', (raw) => FRAME_RATE_CAPS.find((cap) => cap === raw), 0);

  // A lost device gets a new one (or the WebGL2 back end) on a new canvas; with neither, the game stops on the crash pane.
  let losses = 0;
  const watchLoss = (current: NodeBackend): void =>
    current.onLost(() => {
      lostAt = performance.now();
      const tries = ++losses > RENDER_BACKEND.maxWebGpuLosses ? 0 : RENDER_BACKEND.recoverTries;
      void current.replacement(() => false, undefined, tries).then((next) => {
        if (!next) return fail(new Error('The GPU device was lost and no new one could be made'));
        container.replaceChild(next.renderer.domElement, current.renderer.domElement);
        current.dispose();
        node = next;
        facts.backend = node.kind;
        fit();
        node.setTiming(overlay.visible);
        node.compile(scene, camera);
        lostAt = performance.now();
        watchLoss(node);
      });
    });
  watchLoss(node);

  const stepper = createStepper(SIM_DT, SIM.maxTicksPerFrame);
  const pacer = new FramePacer();
  let last = performance.now();
  let lastDrawn = last;
  node.compile(scene, camera);
  started = true;

  const frame = (now: number): void => {
    const dt = Math.min(Math.max(0, (now - last) / 1000), SIM.maxFrameDt);
    last = now;
    const ticks = advanceStepper(stepper, dt);
    facts.tick += ticks;
    if (keyboard.wasPressed('debugOverlay')) {
      overlay.toggle();
      node.setTiming(overlay.visible);
    }
    if (keyboard.wasPressed('fullscreen')) void (document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen()).catch(() => undefined);
    keyboard.endFrame();
    if (!node.lost && pacer.shouldDraw(now, frameRateCap)) {
      node.renderer.render(scene, camera);
      node.frameDone();
      overlay.frame((now - lastDrawn) / 1000);
      lastDrawn = now;
    }
    if (!crash) requestAnimationFrame(frame);
  };
  keyboard.capturing = true;
  requestAnimationFrame(frame);
}

window.addEventListener('error', (e) => fail(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => {
  if (isDeviceLossEcho(e.reason, lostAt, performance.now())) {
    e.preventDefault();
    return;
  }
  fail(e.reason);
});
main().catch(fail);
