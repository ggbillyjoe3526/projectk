import './style.css';
import type { Action } from './config/controls';
import { CRASH_TEXT, GRAPHICS_ERROR } from './config/crash';
import { FRAME_RATE_CAPS } from './config/render';
import { releaseName } from './config/release';
import { DEFAULT_RENDERER, RENDER_BACKEND, RENDERER_IDS } from './config/renderBackend';
import { SIM, SIM_DT } from './config/sim';
import { awayWatch } from './core/awayWatch';
import { crashReport, type ReportField } from './core/crashReport';
import { advanceStepper, createStepper, stepperAlpha } from './core/fixedStepper';
import { FramePacer } from './core/framePacer';
import { deriveSeed, parseSeed, randomSeed } from './core/seed';
import { BroughSlice, type SliceIntent } from './game/broughSlice';
import { CrossingChapter } from './game/crossing/crossingChapter';
import { readCrossing } from './game/crossing/progress';
import { levelLayout } from './content/level';
import { ARRIVAL } from './content/levels/arrival';
import { KeyBindings } from './input/keyBindings';
import { Keyboard } from './input/keyboard';
import { browserKeyboardMap, watchKeyboardLayout } from './input/keyboardLayout';
import { watchMouseButtons } from './input/mouseButtons';
import { PointerAim } from './input/pointerAim';
import { SprintToggle } from './input/sprintToggle';
import { startingRenderer } from './render/rendererStart';
import { isDeviceLossEcho, type NodeBackend } from './render/webgpu/nodeBackend';
import { startGuardedStorage } from './save/guardedStorage';
import { browserStorage, flushSettings, loadSetting, oneOf } from './settings/storage';
import { CrashScreen } from './ui/crashScreen';
import { DebugOverlay } from './ui/debugOverlay';
import { PauseScreen } from './ui/pauseScreen';
import { startGate } from './ui/startGate';

/**
 * The boot shell: starts the save storage, the renderer (WebGPU, else its WebGL2 back end), input and the fixed 60 Hz
 * loop, with the debug overlay (` or F3) and the crash pane. It runs the game a part at a time, each with its
 * simulation on the fixed step and its scene drawn at the display rate between ticks: chapter 1, The Crossing
 * (game/crossing/crossingChapter.ts), then the slice's "Low water" (game/broughSlice.ts), the morning after.
 * `?chapter=1` or `?chapter=lowwater` opens one directly.
 */

/** A part of the game main.ts can run. */
type Part = BroughSlice | CrossingChapter;

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
  const report = crashReport({ title: 'Project Outbound crash report', build: `${releaseName()} (${__BUILD_VERSION__})`, userAgent: navigator.userAgent, fields: reportFields(), error });
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
  const found = document.getElementById('app');
  if (!found) throw new Error('#app container missing');
  const container: HTMLElement = found;
  startGuardedStorage();
  const params = new URLSearchParams(window.location.search);
  facts.seed = parseSeed(params.get('seed')) ?? randomSeed();

  const choice = loadSetting('renderer', oneOf(RENDERER_IDS), DEFAULT_RENDERER);
  // No multisampling: hard pixel edges are part of the look.
  const start = await startingRenderer(choice, params.has('forceWebGL'), false);
  let node: NodeBackend = start.node;
  facts.backend = node.kind;
  facts.adapter = start.adapterName;

  const bindings = new KeyBindings(browserStorage());
  watchKeyboardLayout(browserKeyboardMap(), window, (layout) => bindings.setLayout(layout));
  const keyboard = new Keyboard(window, bindings);
  const pointer = new PointerAim(window, container);
  watchMouseButtons(container, keyboard);

  // Chapter 1 until its day is over, then Low water; a link can ask for either.
  const seed = deriveSeed(facts.seed, 0x9e3779b1, 0x2545f491);
  const crossingDone = readCrossing(browserStorage(), levelLayout(ARRIVAL))?.progress.phase === 'done';
  const asked = params.get('chapter');
  const lowWater = asked === 'lowwater' || (asked !== '1' && crossingDone);
  const crossing = (): CrossingChapter => {
    const c = new CrossingChapter(params, container, browserStorage(), (action) => keyboard.keyName(action));
    c.onFinished = toLowWater;
    return c;
  };
  let part: Part = lowWater ? new BroughSlice(params, seed, container, browserStorage()) : crossing();
  part.attach(node.renderer);
  const fit = (): void => part.fit(window.innerWidth, Math.max(1, window.innerHeight));
  container.appendChild(node.renderer.domElement);
  fit();
  window.addEventListener('resize', fit);

  const sprint = new SprintToggle();
  // Looking away (another tab, another window) pauses the game, as well as letting go of every key.
  awayWatch({ doc: document, win: window }, () => {
    keyboard.releaseAll();
    sprint.reset();
    setPaused(true);
  });
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
    ...part.debugStats(),
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
        part.attach(node.renderer);
        fit();
        node.setTiming(overlay.visible);
        node.compile(part.scene, part.camera);
        lostAt = performance.now();
        watchLoss(node);
      });
    });
  watchLoss(node);

  const stepper = createStepper(SIM_DT, SIM.maxTicksPerFrame);
  const intent: SliceIntent = {
    forward: false,
    listen: false,
    aim: null,
    attackHeld: false,
    attackPressed: false,
    deflectHeld: false,
    deflectPressed: false,
    stepPressed: false,
    sprintHeld: false,
    interactPressed: false,
  };
  const aim = { x: 0, y: 0 };
  /** The simulation waits behind the start pane, and while paused. */
  let playing = false;
  let paused = false;
  let pauseScreen: PauseScreen | null = null;
  const setPaused = (on: boolean): void => {
    if (!playing || on === paused) return;
    paused = on;
    pauseScreen?.show(on);
    keyboard.releaseAll();
    sprint.reset();
    part.setPaused(on);
    // Paused, the browser keeps its own keys (Space scrolls nothing, but menus and shortcuts work as usual).
    keyboard.capturing = !on;
  };
  // Escape can't be bound (in fullscreen the browser takes it first), so it's heard here rather than through the bindings.
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !e.repeat) setPaused(!paused);
  });
  const pacer = new FramePacer();
  let last = performance.now();
  let lastDrawn = last;
  node.compile(part.scene, part.camera);
  started = true;

  const frame = (now: number): void => {
    const dt = Math.min(Math.max(0, (now - last) / 1000), SIM.maxFrameDt);
    last = now;
    const ticks = playing && !paused ? advanceStepper(stepper, dt) : 0;
    facts.tick += ticks;
    intent.forward = keyboard.isDown('forward');
    intent.listen = keyboard.isDown('listen');
    aim.x = pointer.x;
    aim.y = pointer.y;
    intent.aim = pointer.known ? aim : null;
    intent.attackHeld = keyboard.isDown('attack');
    intent.deflectHeld = keyboard.isDown('deflect');
    intent.sprintHeld = sprint.update(keyboard.wasPressed('sprint'), intent.forward);
    // A press reaches the next tick only, held over a frame that runs no tick (above 60 frames a second).
    intent.attackPressed ||= keyboard.wasPressed('attack');
    intent.deflectPressed ||= keyboard.wasPressed('deflect');
    intent.stepPressed ||= keyboard.wasPressed('step');
    intent.interactPressed ||= keyboard.wasPressed('interact');
    for (let i = 0; i < ticks; i++) {
      part.tick(intent, SIM_DT);
      intent.attackPressed = intent.deflectPressed = intent.stepPressed = intent.interactPressed = false;
    }
    if (keyboard.wasPressed('pause')) setPaused(!paused);
    if (keyboard.wasPressed('swapOffHand') && !paused) part.toggleTorch();
    if (keyboard.wasPressed('phone') && !paused && part instanceof CrossingChapter) part.togglePhone();
    if (keyboard.wasPressed('debugTimeScale')) part.cycleTimeScale();
    if (keyboard.wasPressed('debugFightReadout')) part.toggleFightReadout();
    if (keyboard.wasPressed('debugOverlay')) {
      overlay.toggle();
      node.setTiming(overlay.visible);
    }
    if (keyboard.wasPressed('fullscreen')) void (document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen()).catch(() => undefined);
    keyboard.endFrame();
    if (!node.lost && pacer.shouldDraw(now, frameRateCap)) {
      part.present(stepperAlpha(stepper), dt, now);
      part.render();
      node.frameDone();
      overlay.frame((now - lastDrawn) / 1000);
      lastDrawn = now;
    }
    if (!crash) requestAnimationFrame(frame);
  };
  keyboard.capturing = true;
  requestAnimationFrame(frame);

  const key = (action: Action): string => keyboard.keyName(action);
  const sliceControls = (): [string, string][] => [
    ['Mouse', 'face and aim (the mark over one of the dead is your target)'],
    [`${key('forward')}`, 'walk toward the pointer'],
    [`${keyboard.keysName('sprint')} (tap)`, 'sprint on or off, while stamina lasts'],
    [`${key('attack')}`, 'attack (hold with the sword: sained strike)'],
    [keyboard.keysName('deflect'), 'deflect as the blow lands (a glint in its hand warns you)'],
    [`${key('step')}`, 'step back, quickly'],
    [key('interact'), 'read, take, open, rest, the Rite'],
    [`${key('listen')} (hold)`, 'kneel and listen to the island'],
    [key('swapOffHand'), 'torch on or off'],
    [`Esc / ${key('pause')}`, 'pause'],
    [`${key('debugOverlay')} / ${key('debugTimeScale')} / ${key('debugFightReadout')}`, 'debug readout / faster island time / deflect timing'],
  ];
  const crossingControls = (): [string, string][] => [
    ['Mouse', 'face where you want to go'],
    [`${key('forward')}`, 'walk toward the pointer'],
    [`${keyboard.keysName('sprint')} (tap)`, 'walk faster, until you stop'],
    [key('interact'), 'talk, look, read, use; go on in a conversation'],
    ['1–4 or click', 'choose what to say'],
    [`${key('listen')} (hold)`, 'kneel and listen to the island'],
    [key('phone'), 'your phone: messages and notes'],
    [key('swapOffHand'), 'phone torch on or off'],
    [`Esc / ${key('pause')}`, 'pause'],
    [`${key('debugOverlay')} / ${key('debugTimeScale')}`, 'debug readout / faster island time'],
  ];
  const controls = (): [string, string][] => (part instanceof CrossingChapter ? crossingControls() : sliceControls());
  const resumeHint = 'Click, Esc or P to carry on';

  /** The day is over: on to Low water, the morning after, from its start. */
  function toLowWater(): void {
    if (!(part instanceof CrossingChapter)) return;
    part.dispose();
    const slice = new BroughSlice(new URLSearchParams(), seed, container, browserStorage());
    slice.startOver();
    part = slice;
    part.attach(node.renderer);
    fit();
    node.compile(part.scene, part.camera);
    part.startAudio();
    pauseScreen?.remove();
    pauseScreen = new PauseScreen(container, controls(), resumeHint, () => setPaused(false));
    keyboard.releaseAll();
  }

  await startGate(container, 'PROJECT OUTBOUND', controls(), part.continuing ? () => part.startOver() : undefined, releaseName());
  pauseScreen = new PauseScreen(container, controls(), resumeHint, () => setPaused(false));
  part.startAudio();
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
