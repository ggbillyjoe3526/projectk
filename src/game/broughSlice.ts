import { PerspectiveCamera, Plane, Raycaster, type RenderPipeline, type Scene, Vector2, Vector3, type WebGPURenderer } from 'three/webgpu';
import { IslandHum } from '../audio/islandHum';
import { type CameraPose, selectZone, zonePose } from '../camera/authoredCamera';
import { PLAYER_COMBAT } from '../config/combat';
import { RETRO_LOOK } from '../config/render';
import { DEFAULT_TIDE } from '../config/tide';
import { TORCH } from '../config/torch';
import { hasPower, inRefuge, isIndoors, type Level, levelLayout, loadLevel, type Thing } from '../content/level';
import { HAUGSAY } from '../content/levels/haugsay';
import { buildGreybox, type GreyboxScene } from '../render/greyboxScene';
import { Rain } from '../render/rain';
import { ps1Snap } from '../render/retro/ps1Snap';
import { internalResolution } from '../render/retro/retroMath';
import { createRetroPipeline, type RetroControls } from '../render/retro/retroPipeline';
import type { CombatEvent, FighterInput } from '../sim/combat/encounter';
import { HumClock, listeningClarity } from '../sim/humClock';
import { createPlayer, type PlayerCommand, type PlayerState } from '../sim/player';
import { causewayPassable, humParams, nextCausewayOpen, tideLevel, tidePhase } from '../sim/tide';
import type { WorldDef } from '../sim/world/types';
import { createTorch, stepTorch, switchTorch, torchBrightness, type TorchState } from '../sim/torch';
import { inBox } from '../sim/world/ground';
import { type Checkpoint, readSavedGame, writeSavedGame } from '../save/progress';
import { CombatHud } from '../ui/combatHud';
import { BEAT_LINES, beatsFrom, END_LINES, weaponFor } from './beats';
import { BroughFight } from './broughFight';
import { freshProgress, nudgeHere, onGateSide, type Progress, thingHere, thingPrompt, thingThere, tideTableLines } from './things';

/**
 * The playable slice: the father's cottage, the Brough and the tidal causeway in greybox, under the authored cameras
 * (concept v0.6 section 7, camera A), in the low-resolution dithered look, with the tide and the island's hum (M0),
 * and the fight with the dead on the shore (M1, game/broughFight.ts). It owns the scene and the simulation; main.ts
 * runs it on the fixed 60 Hz step and draws it.
 */

/** What the player asks for this tick, from the bindings and the mouse. Presses are true on one tick only. */
export interface SliceIntent extends FighterInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  listen: boolean;
  /** The mouse in normalised device coordinates, or null before it has moved over the game. */
  aim: { x: number; y: number } | null;
}

/** Island time runs this many times faster than real time, cycled by the debug key. */
const TIME_SCALES = [1, 4, 16, 64] as const;
/** Where a visit starts in the tide's cycle: 07:50, with the causeway just open and low water at ten. */
const START_TIDE = 0.82;
/** Said as a new game starts. */
const OPENING_LINE = 'The morning after the vigil. The cottage is empty. Low water is at ten.';

/** Interface for the browser storage the game saves to. */
interface SaveStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class BroughSlice {
  readonly scene: Scene;
  private readonly level: Level = loadLevel(HAUGSAY);
  readonly camera = new PerspectiveCamera(50, 16 / 9, 0.1, 220);
  private readonly g: GreyboxScene;
  private readonly rain = new Rain();
  private renderer: WebGPURenderer | null = null;
  private pipeline: RenderPipeline | null = null;
  private look: RetroControls | null = null;
  private audio: IslandHum | null = null;
  private readonly hud: CombatHud;
  private readonly fight: BroughFight;
  /** The world as the simulation sees it now: the level, less any gates opened. */
  private world: WorldDef;
  private readonly layout = levelLayout(this.level);
  /** What has changed for good (saved at once), and where a death or a reload returns to (saved on resting). */
  private progress: Progress = freshProgress();
  private checkpoint: Checkpoint;
  /** Off when a debug flag (`at`, `tide`, `weapon`) set the visit up: then nothing is written over the player's save. */
  private readonly persist: boolean;
  /** The time of the last drawn frame (performance.now()), for the HUD's captions. */
  private now = 0;
  /** A new game: the opening line waits for the first tick. */
  private opening = false;
  /** Things whose nudge has been said this visit. */
  private readonly nudged = new Set<string>();
  /** The cottage, where the sword is brought home: the interior around the hearth. */
  private readonly home = this.level.interiors.find((i) => this.level.things.some((t) => t.kind === 'hearth' && inBox(i, t.x, t.z))) ?? null;

  private readonly player: PlayerState;
  /** The player at the previous tick, for interpolating between ticks. */
  private readonly prev = { x: 0, y: 0, z: 0 };
  /** Seconds of island time. */
  private tideClock: number;
  private timeScale = 0;
  private readonly torch: TorchState = createTorch();
  /** The torch beam's brightness at full charge. */
  private torchIntensity = 0;
  private readonly cmd: PlayerCommand = { moveX: 0, moveZ: 0, aimX: null, aimZ: null, listen: false, speedScale: 1, turn: true };

  private readonly humClock = new HumClock();
  private zone: number;
  private readonly pose: CameraPose = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 50 };
  private readonly camPos = new Vector3();
  private readonly camLook = new Vector3();
  private readonly target = new Vector3();
  private snapCamera = true;
  private readonly ray = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly aimPlane = new Plane(new Vector3(0, 1, 0), 0);
  private readonly aimHit = new Vector3();
  /** What the last drawn frame showed, for the debug overlay. */
  private readonly shown = { clarity: 0, hum: 0, beatHz: 0 };

  /**
   * `params`: `at=x,z` starts the player there, `tide=f` at fraction f of the tide's cycle (0 low, 0.5 high),
   * `weapon=sword` with the sword already in hand; any of them leaves the saved game alone. `seed` seeds the fight;
   * `hudParent` holds the on-screen readouts; `storage` is where the game is saved (null: not saved).
   */
  constructor(params: URLSearchParams, seed: number, hudParent: HTMLElement, private readonly storage: SaveStore | null) {
    const world = this.level.sim;
    this.world = world;
    this.g = buildGreybox(this.level);
    this.scene = this.g.scene;
    this.torchIntensity = this.g.torch.intensity;
    this.scene.add(this.rain.object);
    this.hud = new CombatHud(hudParent);
    const sword = this.level.things.find((t) => t.kind === 'sword');
    this.fight = new BroughFight(this.scene, this.g, this.hud, sword ?? null, this.level.dead, seed);
    this.persist = !['at', 'tide', 'weapon'].some((flag) => params.has(flag));

    this.player = createPlayer(world);
    const at = params.get('at')?.split(',').map(Number);
    if (at?.length === 2 && at.every(Number.isFinite)) {
      this.player.x = at[0]!;
      this.player.z = at[1]!;
      this.player.y = world.groundAt(this.player.x, this.player.z).height;
    }
    const tide = Number(params.get('tide') ?? Number.NaN);
    this.tideClock = DEFAULT_TIDE.cycleSeconds * (Number.isFinite(tide) ? tide : START_TIDE);
    this.checkpoint = this.save();

    const saved = this.persist ? readSavedGame(storage, this.layout, this.level.dead.length) : null;
    if (saved) {
      this.progress = saved.progress;
      if (saved.checkpoint) this.load(saved.checkpoint);
    } else this.opening = this.persist;
    const weapon = params.get('weapon');
    if (weapon === 'knife' || weapon === 'sword') {
      // As if the story had got that far: the knife in hand once the dead are seen, the sword once it fails.
      this.progress.knifeTaken = true;
      this.progress.swordTaken = weapon === 'sword';
      this.progress.beats = weapon === 'sword' ? ['sawDead', 'sawRise'] : ['sawDead'];
    }
    this.applyProgress();
    this.checkpoint = this.save();
    this.copyPrev();
    this.zone = selectZone(this.level.cameras, -1, this.player.x, this.player.z);
  }

  /** There is a saved game to continue (the start pane offers to start over). */
  get continuing(): boolean {
    return this.persist && readSavedGame(this.storage, this.layout, this.level.dead.length) !== null;
  }

  /** Forget the saved game and start again from the cottage, as on a first visit. */
  startOver(): void {
    this.progress = freshProgress();
    this.fight.reset();
    Object.assign(this.player, createPlayer(this.level.sim));
    this.tideClock = DEFAULT_TIDE.cycleSeconds * START_TIDE;
    Object.assign(this.torch, createTorch());
    this.applyProgress();
    this.checkpoint = this.save();
    this.writeGame();
    this.copyPrev();
    this.snapCamera = true;
    this.nudged.clear();
    this.opening = true;
  }

  /** Draw with this renderer (the first one, or the one replacing a lost device). */
  attach(renderer: WebGPURenderer): void {
    this.pipeline?.dispose();
    this.renderer = renderer;
    renderer.shadowMap.enabled = true;
    const retro = createRetroPipeline(renderer, this.scene, this.camera);
    this.pipeline = retro.pipeline;
    this.look = retro.controls;
  }

  /** Size the canvas to the low internal resolution for a window of `width` × `height` CSS pixels. */
  fit(width: number, height: number): void {
    const size = internalResolution(width, height, RETRO_LOOK.internalHeight);
    this.renderer?.setPixelRatio(1);
    this.renderer?.setSize(size.width, size.height, false);
    this.camera.aspect = size.width / size.height;
    this.camera.updateProjectionMatrix();
    ps1Snap.grid.value.set(size.width * RETRO_LOOK.snapScale, size.height * RETRO_LOOK.snapScale);
  }

  /** Start the island's sound; call from a click (browsers keep audio silent until one). */
  startAudio(): void {
    try {
      this.audio = new IslandHum();
      void this.audio.resume().catch(() => undefined);
      this.fight.attachAudio(this.audio.context, this.audio.bus);
    } catch {
      this.audio = null; // No Web Audio: the game plays silent.
    }
  }

  /** The off-hand light on or off (the off-hand swap, until there are other items to swap to). */
  toggleTorch(): void {
    if (!switchTorch(this.torch) && this.torch.charge === 0) this.hud.say('The torch is dead. It needs charging at the cottage.', this.now, 3);
  }

  /** The deflect timing readout on or off. */
  toggleFightReadout(): void {
    this.fight.toggleReadout(this.now);
  }

  cycleTimeScale(): void {
    this.timeScale = (this.timeScale + 1) % TIME_SCALES.length;
  }

  /** One fixed simulation step. */
  tick(intent: SliceIntent, dt: number): void {
    // The mouse aims at a level plane at chest height.
    this.cmd.aimX = this.cmd.aimZ = null;
    if (intent.aim) {
      this.ndc.set(intent.aim.x, intent.aim.y);
      this.aimPlane.constant = -(this.player.y + 0.9);
      this.ray.setFromCamera(this.ndc, this.camera);
      if (this.ray.ray.intersectPlane(this.aimPlane, this.aimHit)) {
        this.cmd.aimX = this.aimHit.x;
        this.cmd.aimZ = this.aimHit.z;
      }
    }

    // Movement is relative to where the player faces, which follows the pointer: W walks toward it, S backs away, A
    // and D step round it. The mouse steers, so walking is smooth, and a camera cut never turns the keys round.
    const fx = Math.sin(this.player.facing);
    const fz = Math.cos(this.player.facing);
    let mx = 0;
    let mz = 0;
    if (intent.forward) (mx += fx), (mz += fz);
    if (intent.back) (mx -= fx), (mz -= fz);
    if (intent.right) (mx -= fz), (mz += fx);
    if (intent.left) (mx += fz), (mz -= fx);
    const length = Math.hypot(mx, mz);
    this.cmd.moveX = length > 0 ? mx / length : 0;
    this.cmd.moveZ = length > 0 ? mz / length : 0;
    this.cmd.listen = intent.listen;

    // E: put down what's being read, or use what's in reach, before the fight sees the press.
    if (this.hud.reading) {
      if (intent.interactPressed) this.hud.closeReader();
      this.cmd.moveX = this.cmd.moveZ = 0;
      intent.interactPressed = intent.attackPressed = intent.deflectPressed = intent.stepPressed = false;
    } else if (intent.interactPressed && this.fight.free) {
      const thing = thingHere(this.level.things, this.progress, this.player.x, this.player.z);
      if (thing) {
        intent.interactPressed = false;
        this.use(thing);
      }
    }

    this.copyPrev();
    this.tideClock += dt * TIME_SCALES[this.timeScale]!;
    const { x, z } = this.player;
    const torchNews = stepTorch(this.torch, hasPower(this.level, x, z), dt);
    if (torchNews === 'low') this.hud.say('The torch is dimming.', this.now, 3);
    else if (torchNews === 'dead') this.hud.say('The torch gutters and goes out.', this.now, 3.5);
    else if (torchNews === 'charged') this.hud.say('The torch is charged.', this.now, 2.5);
    const lit = this.torch.on;
    const ctx = { lit, dark: !lit && !isIndoors(this.level, x, z), inRefuge: inRefuge(this.level, x, z) };
    const events = this.fight.tick(intent, this.cmd, this.player, this.world, tideLevel(this.tideClock), ctx, dt);
    this.storyBeats(events);
    if (this.fight.wantsWake) {
      this.load(this.checkpoint);
      this.hud.say('You come to where you last rested.', this.now, 3.5);
    }
  }

  /** The opening's pacing (game/beats.ts): what the fight just showed, what's near, and the sword brought home. */
  private storyBeats(events: readonly CombatEvent[]): void {
    const now = this.now;
    if (this.opening) {
      this.opening = false;
      this.hud.say(OPENING_LINE, now, 6);
    }
    const p = this.progress;
    const beats = beatsFrom(events, this.fight.weapon, p);
    for (const beat of beats) {
      p.beats.push(beat);
      this.hud.say(BEAT_LINES[beat], now, 5);
    }
    const { x, z } = this.player;
    // The nudges lead to the sword; once it's in hand they've done their work.
    const nudge = beats.length || p.swordTaken ? null : nudgeHere(this.level.things, p, this.nudged, x, z);
    if (nudge?.nudge) {
      this.nudged.add(nudge.id);
      this.hud.say(nudge.nudge, now, 5);
    }
    if (p.swordTaken && !p.beats.includes('swordHome') && this.home && inBox(this.home, x, z) && this.fight.free) {
      p.beats.push('swordHome');
      this.hud.read(END_LINES);
      beats.push('swordHome');
    }
    if (beats.length) this.writeGame();
  }

  private use(thing: Thing): void {
    const now = this.now;
    switch (thing.kind) {
      case 'hearth': {
        this.fight.recover(true);
        this.torch.charge = 1;
        const waited = this.waitForCauseway();
        this.hud.say(waited ? 'You rest by the hearth until the causeway clears.' : 'You rest by the hearth a while.', now, 3.5);
        this.rest();
        break;
      }
      case 'refuge': {
        const waited = this.waitForCauseway();
        if (waited) this.fight.wear(PLAYER_COMBAT.refugeWait.resolveCost);
        this.hud.say(waited ? 'You wait out the tide. The hours wear on you.' : 'You sit a while, and catch your breath.', now, 4);
        this.rest();
        break;
      }
      case 'document':
        this.hud.read(thing.lines);
        if (!this.progress.read.includes(thing.id)) {
          this.progress.read.push(thing.id);
          this.writeGame();
        }
        break;
      case 'tideTable':
        this.hud.read(tideTableLines(this.tideClock));
        break;
      case 'knife':
        this.progress.knifeTaken = true;
        this.applyProgress();
        this.hud.say('The kitchen knife. Better than nothing.', now, 4);
        this.writeGame();
        break;
      case 'sword':
        this.progress.swordTaken = true;
        this.applyProgress();
        this.hud.say('Iron from the howe.', now, 4);
        this.writeGame();
        break;
      case 'gate':
        if (!onGateSide(thing, this.player.x, this.player.z)) {
          this.hud.say('It’s barred from the other side.', now, 3);
          break;
        }
        this.progress.opened.push(thing.wall);
        this.applyProgress();
        this.hud.say('You lift the bar. The gate swings out over the steps to the shore.', now, 4);
        this.writeGame();
        break;
    }
  }

  /** If the causeway is under water, let the hours pass until it clears. True if any time passed. */
  private waitForCauseway(): boolean {
    if (causewayPassable(this.tideClock)) return false;
    // A second past the moment it opens, so it's open beyond rounding.
    this.tideClock = nextCausewayOpen(this.tideClock) + 1;
    this.fight.passTime();
    return true;
  }

  /** A save point: this is where a death or the next visit returns to. */
  private rest(): void {
    this.checkpoint = this.save();
    this.writeGame();
  }

  /** The blade in hand and the gates open, as the progress says, in the fight, the world and the scene. */
  private applyProgress(): void {
    const weapon = weaponFor(this.progress);
    if (this.fight.weapon !== weapon) this.fight.arm(weapon);
    const opened = this.progress.opened;
    this.world = { ...this.level.sim, walls: this.level.sim.walls.filter((w) => w.id === undefined || !opened.includes(w.id)) };
    for (const [id, mesh] of this.g.wallMeshes) mesh.visible = !opened.includes(id);
  }

  private writeGame(): void {
    if (this.persist) writeSavedGame(this.storage, this.layout, { progress: this.progress, checkpoint: this.checkpoint });
  }

  private save(): Checkpoint {
    return { encounter: this.fight.snapshot(), player: { ...this.player, listening: false }, tideClock: this.tideClock, torch: { ...this.torch } };
  }

  private load(c: Checkpoint): void {
    this.fight.restore(c.encounter);
    Object.assign(this.player, c.player);
    this.tideClock = c.tideClock;
    Object.assign(this.torch, c.torch ?? createTorch());
    this.copyPrev();
    this.snapCamera = true;
  }

  /** Bring the scene up to date for drawing: `alpha` is how far between the last two ticks this frame falls. */
  present(alpha: number, frameDt: number, now: number): void {
    this.now = now;
    const p = this.player;
    const px = this.prev.x + (p.x - this.prev.x) * alpha;
    const py = this.prev.y + (p.y - this.prev.y) * alpha;
    const pz = this.prev.z + (p.z - this.prev.z) * alpha;

    // Camera zones: cut on a change, track within one.
    const next = selectZone(this.level.cameras, this.zone, px, pz);
    if (next !== this.zone) {
      this.zone = next;
      this.snapCamera = true;
    }
    const zone = this.level.cameras[this.zone]!;
    zonePose(zone, px, py, pz, this.pose);
    this.camPos.lerp(this.target.set(this.pose.px, this.pose.py, this.pose.pz), this.snapCamera ? 1 : 1 - Math.exp(-frameDt * 5));
    this.camLook.lerp(this.target.set(this.pose.lx, this.pose.ly, this.pose.lz), this.snapCamera ? 1 : 1 - Math.exp(-frameDt * 9));
    this.snapCamera = false;

    // The tide and the island's hum: what the sea is doing, and how clearly the player can hear it from here.
    const hum = humParams(this.tideClock);
    this.humClock.advance(hum, frameDt * Math.sqrt(TIME_SCALES[this.timeScale]!));
    const beat = this.humClock.beat();
    const indoors = zone.indoors === true;
    const world = this.level.sim;
    const nearPost = world.listeningPosts.some((post) => Math.hypot(post.x - px, post.z - pz) < post.radius);
    const clarity = listeningClarity(nearPost, indoors, world.groundAt(px, pz).kind);
    const feel = hum.strength * beat * clarity * (p.listening ? 1 : 0.3);
    this.shown.clarity = clarity;
    this.shown.hum = hum.strength;
    this.shown.beatHz = hum.beatHz;

    const shake = p.listening ? feel * 0.05 : 0;
    this.camera.position.copy(this.camPos);
    this.camera.position.x += (Math.random() - 0.5) * shake;
    this.camera.position.y += (Math.random() - 0.5) * shake;
    this.camera.lookAt(this.camLook);
    if (this.camera.fov !== this.pose.fov) {
      this.camera.fov = this.pose.fov;
      this.camera.updateProjectionMatrix();
    }

    const g = this.g;
    g.sea.position.y = tideLevel(this.tideClock);
    for (const pebble of g.pebbles) {
      const near = Math.max(0, 1 - Math.hypot(pebble.mesh.position.x - px, pebble.mesh.position.z - pz) / 6);
      pebble.mesh.position.y = pebble.baseY + (Math.random() - 0.5) * 0.03 * hum.strength * beat * (0.3 + near);
    }
    g.ripple.amount.value = Math.min(1, hum.strength * 1.4 * (0.35 + 0.65 * beat));
    g.ripple.phase.value = this.humClock.phase;
    for (const beam of g.beams) beam.rotation.y += frameDt * 0.35;
    // Fire and candle light flicker.
    for (const [i, f] of g.flames.entries()) f.light.intensity = f.base * (0.85 + 0.1 * Math.sin(now / 90 + i * 2.1) + 0.08 * Math.random());
    for (const [id, mesh] of g.thingMeshes) {
      const thing = this.level.things.find((t) => t.id === id);
      mesh.visible = thing !== undefined && thingThere(thing, this.progress);
    }
    g.fog.density = 0.026 + 0.012 * (0.5 + 0.5 * Math.sin(now / 9000));

    // The figure: crouched to listen with a hand on the ground trembling with the beat, otherwise holding the torch.
    g.player.position.set(px, py, pz);
    g.player.rotation.y = p.facing;
    const crouch = p.listening ? 1 : 0;
    g.playerBody.position.y = 0.8 - crouch * 0.32;
    g.playerBody.rotation.x = crouch * 0.35;
    if (p.listening) g.hand.position.set(-0.15 + (Math.random() - 0.5) * feel * 0.04, 0.06, 0.5);
    else g.hand.position.set(-0.3, 1.05, 0.28);

    g.torch.visible = this.torch.on;
    // Near the end of its charge the beam dims and stutters.
    const stutter = this.torch.charge < TORCH.low && Math.random() < 0.06 ? 0.4 : 1;
    g.torch.intensity = this.torchIntensity * torchBrightness(this.torch.charge) * stutter;
    this.hud.setTorch(this.torch.charge, this.torch.on);
    const sx = Math.sin(p.facing);
    const sz = Math.cos(p.facing);
    g.torch.position.set(px - 0.3 * sz + 0.3 * sx, py + 1.1, pz + 0.3 * sx + 0.3 * sz);
    g.torch.target.position.set(px + sx * 6, py, pz + sz * 6);
    g.torch.target.updateMatrixWorld();

    this.rain.object.visible = !indoors;
    if (this.renderer) this.rain.step(this.renderer, frameDt, { x: px, y: py, z: pz });

    this.audio?.update(hum, beat, this.humClock.hiss(hum), clarity, p.listening, indoors);

    const thing = this.fight.free && !this.hud.reading ? thingHere(this.level.things, this.progress, p.x, p.z) : null;
    const fx = this.fight.present(p, alpha, frameDt, now / 1000, now, thing ? thingPrompt(thing, this.progress, p.x, p.z) : null);
    this.camera.position.x += (Math.random() - 0.5) * fx.shake;
    this.camera.position.y += (Math.random() - 0.5) * fx.shake;
    if (this.look) this.look.squeeze.value += (fx.squeeze - this.look.squeeze.value) * Math.min(1, frameDt * 3);
    this.audio?.setSqueeze(fx.squeeze);
  }

  render(): void {
    this.pipeline?.render();
  }

  /** Lines for the debug overlay. */
  debugStats(): Record<string, string | number> {
    const p = this.player;
    return {
      tide: `${tidePhase(this.tideClock)} ${tideLevel(this.tideClock).toFixed(2)} m, causeway ${causewayPassable(this.tideClock) ? 'open' : 'closed'}`,
      'island time': `×${TIME_SCALES[this.timeScale]} (])`,
      player: `${p.x.toFixed(1)}, ${p.z.toFixed(1)}, facing ${Math.round((p.facing * 180) / Math.PI)}°, water ${p.depth.toFixed(2)} m`,
      camera: this.level.cameras[this.zone]!.id,
      hum: `${(this.shown.hum * 100).toFixed(0)}%, ${this.shown.beatHz.toFixed(2)} beats/s, heard ${(this.shown.clarity * 100).toFixed(0)}%`,
      ...this.fight.debugStats(),
    };
  }

  private copyPrev(): void {
    this.prev.x = this.player.x;
    this.prev.y = this.player.y;
    this.prev.z = this.player.z;
  }
}
