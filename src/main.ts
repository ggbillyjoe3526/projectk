import './style.css';
import type { Action } from './config/controls';
import { CRASH_TEXT, GRAPHICS_ERROR } from './config/crash';
import { FRAME_RATE_CAPS } from './config/render';
import { DEFAULT_RENDERER, RENDER_BACKEND, RENDERER_IDS } from './config/renderBackend';
import { SIM, SIM_DT } from './config/sim';
import { awayWatch } from './core/awayWatch';
import { crashReport, type ReportField } from './core/crashReport';
import { advanceStepper, createStepper, stepperAlpha } from './core/fixedStepper';
import { FramePacer } from './core/framePacer';
import { deriveSeed, parseSeed, randomSeed } from './core/seed';
import { BroughSlice, type SliceIntent } from './game/broughSlice';
import { KeyBindings } from './input/keyBindings';
import { Keyboard } from './input/keyboard';
import { browserKeyboardMap, watchKeyboardLayout } from './input/keyboardLayout';
import { watchMouseButtons } from './input/mouseButtons';
import { PointerAim } from './input/pointerAim';
import { startingRenderer } from './render/rendererStart';
import { isDeviceLossEcho, type NodeBackend } from './render/webgpu/nodeBackend';
import { startGuardedStorage } from './save/guardedStorage';
import { browserStorage, flushSettings, loadSetting, oneOf } from './settings/storage';
import { CrashScreen } from './ui/crashScreen';
import { DebugOverlay } from './ui/debugOverlay';
import { startGate } from './ui/startGate';

/**
 * The boot shell: starts the save storage, the renderer (WebGPU, else its WebGL2 back end), input and the fixed 60 Hz
 * loop, with the debug overlay (` or F3) and the crash pane. It runs the first playable slice (game/broughSlice.ts):
 * its simulation on the fixed step, its scene drawn at the display rate between ticks.
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
  const report = crashReport({ title: 'Project Outbound crash report', build: __BUILD_VERSION__, userAgent: navigator.userAgent, fields: reportFields(), error });
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
  // No multisampling: hard pixel edges are part of the look.
  const start = await startingRenderer(choice, params.has('forceWebGL'), false);
  let node: NodeBackend = start.node;
  facts.backend = node.kind;
  facts.adapter = start.adapterName;

  const slice = new BroughSlice(params, deriveSeed(facts.seed, 0x9e3779b1, 0x2545f491), container);
  const { scene, camera } = slice;
  slice.attach(node.renderer);
  const fit = (): void => slice.fit(window.innerWidth, Math.max(1, window.innerHeight));
  container.appendChild(node.renderer.domElement);
  fit();
  window.addEventListener('resize', fit);

  const bindings = new KeyBindings(browserStorage());
  watchKeyboardLayout(browserKeyboardMap(), window, (layout) => bindings.setLayout(layout));
  const keyboard = new Keyboard(window, bindings);
  const pointer = new PointerAim(window, container);
  watchMouseButtons(container, keyboard);
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
    ...slice.debugStats(),
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
        slice.attach(node.renderer);
        fit();
        node.setTiming(overlay.visible);
        node.compile(scene, camera);
        lostAt = performance.now();
        watchLoss(node);
      });
    });
  watchLoss(node);

  const stepper = createStepper(SIM_DT, SIM.maxTicksPerFrame);
  const intent: SliceIntent = {
    forward: false,
    back: false,
    left: false,
    right: false,
    listen: false,
    aim: null,
    attackHeld: false,
    attackPressed: false,
    deflectHeld: false,
    deflectPressed: false,
    stepPressed: false,
    interactPressed: false,
  };
  const aim = { x: 0, y: 0 };
  /** The simulation waits behind the start pane. */
  let playing = false;
  const pacer = new FramePacer();
  let last = performance.now();
  let lastDrawn = last;
  node.compile(scene, camera);
  started = true;

  const frame = (now: number): void => {
    const dt = Math.min(Math.max(0, (now - last) / 1000), SIM.maxFrameDt);
    last = now;
    const ticks = playing ? advanceStepper(stepper, dt) : 0;
    facts.tick += ticks;
    intent.forward = keyboard.isDown('forward');
    intent.back = keyboard.isDown('back');
    intent.left = keyboard.isDown('left');
    intent.right = keyboard.isDown('right');
    intent.listen = keyboard.isDown('listen');
    aim.x = pointer.x;
    aim.y = pointer.y;
    intent.aim = pointer.known ? aim : null;
    intent.attackHeld = keyboard.isDown('attack');
    intent.deflectHeld = keyboard.isDown('deflect');
    // A press reaches the next tick only, held over a frame that runs no tick (above 60 frames a second).
    intent.attackPressed ||= keyboard.wasPressed('attack');
    intent.deflectPressed ||= keyboard.wasPressed('deflect');
    intent.stepPressed ||= keyboard.wasPressed('step');
    intent.interactPressed ||= keyboard.wasPressed('interact');
    for (let i = 0; i < ticks; i++) {
      slice.tick(intent, SIM_DT);
      intent.attackPressed = intent.deflectPressed = intent.stepPressed = intent.interactPressed = false;
    }
    if (keyboard.wasPressed('swapOffHand')) slice.toggleTorch();
    if (keyboard.wasPressed('debugTimeScale')) slice.cycleTimeScale();
    if (keyboard.wasPressed('debugOverlay')) {
      overlay.toggle();
      node.setTiming(overlay.visible);
    }
    if (keyboard.wasPressed('fullscreen')) void (document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen()).catch(() => undefined);
    keyboard.endFrame();
    if (!node.lost && pacer.shouldDraw(now, frameRateCap)) {
      slice.present(stepperAlpha(stepper), dt, now);
      slice.render();
      node.frameDone();
      overlay.frame((now - lastDrawn) / 1000);
      lastDrawn = now;
    }
    if (!crash) requestAnimationFrame(frame);
  };
  keyboard.capturing = true;
  requestAnimationFrame(frame);

  const key = (action: Action): string => keyboard.keyName(action);
  await startGate(container, 'PROJECT OUTBOUND', [
    [`${key('forward')} ${key('left')} ${key('back')} ${key('right')}`, 'walk'],
    ['Mouse', 'aim'],
    [`${key('attack')}`, 'attack (hold with the sword: sained strike)'],
    [`${key('deflect')}`, 'deflect, just as a blow lands'],
    [`${key('step')}`, 'step aside'],
    [key('interact'), 'read, take, rest, the Rite'],
    [`${key('listen')} (hold)`, 'kneel and listen to the island'],
    [key('swapOffHand'), 'torch on or off'],
    [`${key('debugOverlay')} / ${key('debugTimeScale')}`, 'debug readout / faster island time'],
  ]);
  slice.startAudio();
  playing = true;
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
