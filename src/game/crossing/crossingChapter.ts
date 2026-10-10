import {
  Color, DirectionalLight, HemisphereLight, type Object3D, PerspectiveCamera, Plane, Raycaster, type RenderPipeline, type Scene, Vector2, Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import { FerrySounds } from '../../audio/ferrySounds';
import { IslandHum } from '../../audio/islandHum';
import { type CameraPose, selectZone, zonePose } from '../../camera/authoredCamera';
import { PLAYER_COMBAT } from '../../config/combat';
import { PLAYER_TUNING } from '../../config/player';
import { releaseName } from '../../config/release';
import { RETRO_LOOK } from '../../config/render';
import { TORCH } from '../../config/torch';
import {
  DEPARTURE_SECONDS, FERRY_START_TIDE, LINES, type Message, MESSAGES, MESSAGES_AT_START, MESSAGES_ON_FERRY, MORNING_TIDE, VOYAGE_SECONDS,
} from '../../content/crossing/chapter';
import { CROSSING_TIDE, dayName, daylight, tideTableText, tideWords, timeText } from '../../content/crossing/clock';
import { FLAGS, MORAG_AT_INN, MORAG_WAY_HOME, PEOPLE, type Person } from '../../content/crossing/people';
import { COFFIN, type Custom, FUNERAL_LETTER, PILLS, READABLES, type Spot, SPOTS, vigilLines } from '../../content/crossing/places';
import { hasPower, isIndoors, type Level, levelLayout, loadLevel, VIGIL_MESHES } from '../../content/level';
import { ARRIVAL, PIER_HEAD } from '../../content/levels/arrival';
import { INN, INN_DOOR } from '../../content/levels/village';
import { COTTAGE, CAUSEWAY } from '../../content/levels/brough';
import { FERRY, FERRY_GANGWAY } from '../../content/levels/ferry';
import { PIER } from '../../content/levels/pier';
import { buildGreybox, type GreyboxScene } from '../../render/greyboxScene';
import { PeopleFigures, type PersonPlace } from '../../render/people';
import { Rain } from '../../render/rain';
import { ps1Snap } from '../../render/retro/ps1Snap';
import { internalResolution } from '../../render/retro/retroMath';
import { createRetroPipeline, type RetroControls, updateListenCue } from '../../render/retro/retroPipeline';
import { buildArrival, type ArrivalSet, wornBackpack } from '../../render/sets/arrival';
import { buildFerry, type FerrySet } from '../../render/sets/ferry';
import { HumClock, listeningClarity } from '../../sim/humClock';
import { createPlayer, type PlayerCommand, type PlayerState, stepPlayer } from '../../sim/player';
import { causewayPassable, humParams, nextCausewayOpen, tideLevel, tidePhase } from '../../sim/tide';
import { createTorch, stepTorch, switchTorch, torchBrightness, type TorchState } from '../../sim/torch';
import { inBox } from '../../sim/world/ground';
import type { Wall, WorldDef } from '../../sim/world/types';
import { CombatHud } from '../../ui/combatHud';
import { DayEnd } from '../../ui/dayEnd';
import { DialogueBox } from '../../ui/dialogueBox';
import { Phone } from '../../ui/phone';
import type { SliceIntent } from '../broughSlice';
import { advance, choose, type Conversation, currentStep, type Dialogue, type Effect, startConversation, type TalkContext } from './dialogue';
import { departurePose, type ShipPose, shipToWorld, voyagePose, worldToShip } from './evening';
import { clearCrossing, type CrossingCheckpoint, type CrossingProgress, freshCrossing, readCrossing, writeCrossing } from './progress';
import { lookedFlag, type ReachState, type Target, targetHere, targetPrompt } from './reach';

/**
 * Chapter 1, The Crossing: the late ferry in at 23:45, the shut village and the people who knew Alan Sloan, a night at
 * Morag's inn while the tide is in, the causeway in the morning, the cottage, and the vigil William doesn't know how to
 * keep. No threat anywhere: it's played, not watched, with the story in what people say and what he reads. It ends
 * when he sits with the coffin and falls asleep, and hands over to the slice's "Low water".
 *
 * It runs the way the slice does (game/broughSlice.ts): main.ts steps it at 60 Hz and draws it between steps, with the
 * same cameras, the same look, the tide and the hum, on its own map (content/levels/arrival.ts) and its own save.
 */

/** Island time runs this many times faster than real time, cycled by the debug key. */
const TIME_SCALES = [1, 4, 16, 64] as const;
/** A grey winter day, for the sky and the fog (night is the slice's own colour). */
const DUSK_SKY = new Color(0x5f6a70);
const NIGHT_SKY = new Color(0x0c1317);
/** How near someone comes before their notice is said. */
const NOTICE_RANGE = 7;
/** How long the coffin waits for the second E that sits down with it (ms). */
const SIT_CONFIRM_MS = 4500;
/** The pier's middle, for the phone's one bar of signal near it. */
const SIGNAL = { x: (PIER.minX + PIER.maxX) / 2, z: 26, range: 34 } as const;

interface SaveStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const MESSAGE_BY_ID = new Map<string, Message>(Object.values(MESSAGES).map((m) => [m.id, m]));
const SPOT_BY_ID = new Map<string, Spot>(READABLES.map((s) => [s.id, s]));
/** Morag's walking pace home from the pier (metres a second), and how near the player stops her to talk. */
const MORAG_PACE = 1.05;
const MORAG_WAITS_WITHIN = 2.8;
/** How far off the player has to be after meeting her before she sets off home. */
const MORAG_LEAVES_BEYOND = 9;
/** Just inside the inn door, facing in: where a yes to Morag's room cuts to. */
const INN_INSIDE = { x: (INN.door[0] + INN.door[1]) / 2, z: INN.maxZ - 1.4, facing: Math.PI } as const;

/** The tablet, asked as a choice (places.ts PILLS). */
const PILL_TALK: Dialogue = {
  id: 'pills',
  hub: 'ask',
  nodes: {
    ask: { lines: [{ text: PILLS.ask }], options: [{ label: PILLS.take, to: 'taken' }, { label: PILLS.skip, to: 'skipped' }] },
    taken: { lines: [{ text: PILLS.taken }], effect: 'takePill', end: true },
    skipped: { lines: [{ text: PILLS.skipped }], effect: 'skipPill', end: true },
  },
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** A person stands in the way, like anyone would (moved with them when they walk). */
const personWall = (p: Person): Mutable<Wall> => ({ id: `person-${p.id}`, minX: p.x - 0.25, maxX: p.x + 0.25, minZ: p.z - 0.25, maxZ: p.z + 0.25, height: 1.7, kind: 'furniture' });

export class CrossingChapter {
  readonly scene: Scene;
  readonly camera = new PerspectiveCamera(50, 16 / 9, 0.1, 220);
  /** Called when the player chooses to carry on from the end of the day into the next part. */
  onFinished: (() => void) | null = null;

  private readonly level: Level = loadLevel(ARRIVAL);
  private readonly layout = levelLayout(ARRIVAL);
  private readonly g: GreyboxScene;
  private readonly rain = new Rain();
  private readonly ferry: FerrySet;
  private readonly arrival: ArrivalSet;
  private readonly backpack: Object3D;
  private readonly people: PeopleFigures;
  private readonly hemi: HemisphereLight | null;
  private readonly moon: DirectionalLight | null;
  private readonly hemiBase: number;
  private readonly moonBase: number;
  private renderer: WebGPURenderer | null = null;
  private pipeline: RenderPipeline | null = null;
  private look: RetroControls | null = null;
  private audio: IslandHum | null = null;
  private ferrySounds: FerrySounds | null = null;
  private readonly hud: CombatHud;
  private readonly talk: DialogueBox;
  private readonly phone: Phone;
  private readonly dayEnd: DayEnd;
  private readonly persist: boolean;
  /** The world with the gangway open (the ferry alongside) or shut, and the people standing in it. */
  private worldOpen: WorldDef;
  private worldShut: WorldDef;
  private readonly personWalls = new Map<string, Mutable<Wall>>();
  /** Where Morag is: at the pier, on her way home (along MORAG_WAY_HOME, `moragLeg` the point she's making for), or home. */
  private moragAt: 'pier' | 'walking' | 'inn' = 'pier';
  private moragLeg = 0;
  private readonly morag: PersonPlace = { x: 0, z: 0, facing: 0 };

  private progress: CrossingProgress = freshCrossing();
  private flags = new Set<string>();
  private checkpoint: CrossingCheckpoint | null = null;
  private readonly player: PlayerState;
  private readonly prev = { x: 0, y: 0, z: 0 };
  private tideClock = FERRY_START_TIDE;
  private timeScale = 0;
  private readonly torch: TorchState = createTorch();
  private readonly torchIntensity: number;
  private readonly cmd: PlayerCommand = { moveX: 0, moveZ: 0, aimX: null, aimZ: null, listen: false, speedScale: 1, turn: true };
  /** Seconds since the ferry left (it docks at VOYAGE_SECONDS), and since it pulled away again (-1: it hasn't). */
  private voyage = 0;
  private departure = -1;
  private readonly ship: ShipPose = { dx: 0, dz: 0, yaw: 0 };
  private conversation: Conversation | null = null;
  private talkingTo: string | null = null;
  /** Until when (ms) a second E at the coffin sits down for the night. */
  private sitUntil = 0;
  private readonly noticed = new Set<string>();
  /** A new game: the opening line waits for the first tick. */
  private opening = false;
  /** The causeway's being shut has been said, this time it's shut. */
  private toldShut = false;
  private now = 0;
  /** Until when (ms) the caption line is taken: a notice waits for it rather than cut a line off. */
  private captionUntil = 0;
  /** Lines waiting their turn on the caption line, said one after another. */
  private readonly queued: { text: string; seconds: number }[] = [];

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
  private readonly onShip = { x: 0, z: 0 };
  private readonly drawn = { x: 0, z: 0 };
  private readonly shown = { clarity: 0, hum: 0, beatHz: 0 };

  /**
   * `params`: `at=x,z` starts the player there (on the island, the ferry in), `tide=f` at tide clock f; either leaves
   * the saved game alone. `hudParent` holds the on-screen readouts; `storage` is where the chapter is saved (null:
   * not saved); `keyName` names an action's key for the hints.
   */
  constructor(params: URLSearchParams, hudParent: HTMLElement, private readonly storage: SaveStore | null, private readonly keyName: (action: 'phone' | 'listen' | 'interact') => string) {
    this.g = buildGreybox(this.level);
    this.scene = this.g.scene;
    this.torchIntensity = this.g.torch.intensity;
    this.scene.add(this.rain.object);
    let hemi: HemisphereLight | null = null;
    let moon: DirectionalLight | null = null;
    this.scene.traverse((o) => {
      if (o instanceof HemisphereLight) hemi = o;
      else if (o instanceof DirectionalLight) moon = o;
    });
    this.hemi = hemi;
    this.moon = moon;
    this.hemiBase = (hemi as HemisphereLight | null)?.intensity ?? 1;
    this.moonBase = (moon as DirectionalLight | null)?.intensity ?? 1;
    this.ferry = buildFerry(this.scene);
    this.arrival = buildArrival(this.scene);
    this.backpack = wornBackpack(this.g.player);
    const groundAt = (x: number, z: number): number => this.level.sim.groundAt(x, z).height;
    this.people = new PeopleFigures(this.scene, PEOPLE, groundAt);
    for (const person of PEOPLE) this.personWalls.set(person.id, personWall(person));
    // The inn is open: its door is taken away.
    const innDoor = this.g.wallMeshes.get(INN_DOOR);
    if (innDoor) innDoor.visible = false;
    const walls = [...this.level.sim.walls.filter((w) => w.id !== INN_DOOR), ...this.personWalls.values()];
    this.worldShut = { ...this.level.sim, walls };
    this.worldOpen = { ...this.level.sim, walls: walls.filter((w) => w.id !== FERRY_GANGWAY) };
    this.hud = new CombatHud(hudParent);
    this.hud.setCalm(true);
    this.talk = new DialogueBox(hudParent);
    this.phone = new Phone(hudParent, (id) => this.readNote(id), `${keyName('phone')} to put it away`);
    this.dayEnd = new DayEnd(hudParent);
    this.persist = !['at', 'tide'].some((flag) => params.has(flag));

    this.player = createPlayer(this.level.sim);
    this.placeMorag('pier');
    const saved = this.persist ? readCrossing(storage, this.layout) : null;
    if (saved && saved.progress.phase !== 'ferry') {
      this.progress = saved.progress;
      this.flags = new Set(saved.progress.flags);
      this.checkpoint = saved.checkpoint;
      // Once they've met, she's gone home by the time a saved game picks up.
      if (this.flags.has('met:morag')) this.placeMorag('inn');
      this.ashore();
      if (saved.checkpoint) this.load(saved.checkpoint);
      else this.placeAt(PIER_HEAD.x, PIER_HEAD.z, PIER_HEAD.facing);
    } else {
      this.begin();
    }
    const at = params.get('at')?.split(',').map(Number);
    if (at?.length === 2 && at.every(Number.isFinite)) {
      this.ashore();
      this.opening = false;
      this.placeAt(at[0]!, at[1]!, this.player.facing);
    }
    const tide = Number(params.get('tide') ?? Number.NaN);
    if (Number.isFinite(tide)) this.tideClock = tide;
    this.copyPrev();
    this.zone = selectZone(this.level.cameras, -1, this.player.x, this.player.z);
  }

  /** There is a saved chapter to continue past the ferry (the start pane offers to start over). */
  get continuing(): boolean {
    const saved = this.persist ? readCrossing(this.storage, this.layout) : null;
    return saved !== null && saved.progress.phase !== 'ferry';
  }

  /** Forget the saved chapter and start again on the ferry. */
  startOver(): void {
    clearCrossing(this.persist ? this.storage : null);
    this.progress = freshCrossing();
    this.flags = new Set();
    this.checkpoint = null;
    this.noticed.clear();
    this.placeMorag('pier');
    this.begin();
    this.copyPrev();
    this.snapCamera = true;
  }

  /** The chapter from the top: out in the sound, the phone holding last night's text. */
  private begin(): void {
    Object.assign(this.player, createPlayer(this.level.sim));
    Object.assign(this.torch, createTorch(), { on: false });
    this.tideClock = FERRY_START_TIDE;
    this.voyage = 0;
    this.departure = -1;
    this.progress.phase = 'ferry';
    for (const m of MESSAGES_AT_START) if (!this.progress.messages.includes(m.id)) this.progress.messages.push(m.id);
    // The letter is in his backpack from the start.
    if (!this.progress.read.includes(FUNERAL_LETTER.id)) this.progress.read.push(FUNERAL_LETTER.id);
    this.opening = true;
    this.refreshPhone();
  }

  /** Straight to ashore: the ferry has been and gone. */
  private ashore(): void {
    this.voyage = VOYAGE_SECONDS;
    this.departure = DEPARTURE_SECONDS;
    if (this.progress.phase === 'ferry') this.progress.phase = 'island';
    this.refreshPhone();
  }

  attach(renderer: WebGPURenderer): void {
    this.pipeline?.dispose();
    this.renderer = renderer;
    renderer.shadowMap.enabled = true;
    const retro = createRetroPipeline(renderer, this.scene, this.camera);
    this.pipeline = retro.pipeline;
    this.look = retro.controls;
  }

  fit(width: number, height: number): void {
    const size = internalResolution(width, height, RETRO_LOOK.internalHeight);
    this.renderer?.setPixelRatio(1);
    this.renderer?.setSize(size.width, size.height, false);
    this.camera.aspect = size.width / size.height;
    this.camera.updateProjectionMatrix();
    ps1Snap.grid.value.set(size.width * RETRO_LOOK.snapScale, size.height * RETRO_LOOK.snapScale);
  }

  startAudio(): void {
    try {
      this.audio = new IslandHum();
      void this.audio.resume().catch(() => undefined);
      this.ferrySounds = new FerrySounds(this.audio.context, this.audio.bus);
    } catch {
      this.audio = null;
      this.ferrySounds = null;
    }
  }

  setPaused(on: boolean): void {
    void (on ? this.audio?.suspend() : this.audio?.resume())?.catch(() => undefined);
  }

  toggleTorch(): void {
    if (!switchTorch(this.torch) && this.torch.charge === 0) this.say('Your phone’s torch is dead. It needs charging at the cottage.', 3);
  }

  /** The phone out or away. */
  togglePhone(): void {
    if (this.dayEnd.ended || this.conversation) return;
    this.hud.closeReader();
    this.phone.toggle();
  }

  /** Nothing to time in this chapter. */
  toggleFightReadout(): void {}

  cycleTimeScale(): void {
    this.timeScale = (this.timeScale + 1) % TIME_SCALES.length;
  }

  /** Take the chapter off the page and stop its sound (the next part takes over). */
  dispose(): void {
    this.hud.dispose();
    this.talk.hide();
    this.phone.close();
    this.dayEnd.dispose();
    for (const node of document.querySelectorAll('.talk, .phone, .phone-toast')) node.remove();
    void this.audio?.close().catch(() => undefined);
    this.audio = null;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.look = null;
  }

  private get world(): WorldDef {
    return this.gangwayOpen ? this.worldOpen : this.worldShut;
  }

  /** The ferry is alongside, its gangway out. */
  private get gangwayOpen(): boolean {
    return this.voyage >= VOYAGE_SECONDS && this.departure < 0;
  }

  /** On the ferry's deck or its gangway, so drawn wherever the ferry is. */
  private aboard(x: number, z: number): boolean {
    return inBox(FERRY.deck, x, z) || inBox(FERRY.gangway, x, z);
  }

  private reach(): ReachState {
    return { progress: this.progress, flags: this.flags, causewayOpen: this.causewayOpen };
  }

  private talkContext(): TalkContext {
    return { flags: this.flags, causewayOpen: this.causewayOpen };
  }

  private get causewayOpen(): boolean {
    return causewayPassable(this.tideClock, CROSSING_TIDE);
  }

  private get seaLevel(): number {
    return tideLevel(this.tideClock, CROSSING_TIDE);
  }

  /** Who's about now, where they stand: Morag wherever she's got to; Isa gone home after the night. */
  private peopleNow(): Person[] {
    return PEOPLE.flatMap((p) => {
      if (p.id === 'isa' && this.flags.has(FLAGS.slept)) return [];
      if (p.id === 'magnus' && this.departure >= DEPARTURE_SECONDS) return [];
      if (p.id === 'morag') return [{ ...p, x: this.morag.x, z: this.morag.z, facing: this.morag.facing }];
      return [p];
    });
  }

  private placeMorag(at: 'pier' | 'inn'): void {
    this.moragAt = at;
    this.moragLeg = 0;
    const spot = at === 'pier' ? { x: PEOPLE.find((p) => p.id === 'morag')!.x, z: PEOPLE.find((p) => p.id === 'morag')!.z, facing: PEOPLE.find((p) => p.id === 'morag')!.facing } : MORAG_AT_INN;
    Object.assign(this.morag, spot);
    this.moveWall('morag', this.morag.x, this.morag.z);
  }

  private moveWall(id: string, x: number, z: number): void {
    const w = this.personWalls.get(id);
    if (!w) return;
    w.minX = x - 0.25;
    w.maxX = x + 0.25;
    w.minZ = z - 0.25;
    w.maxZ = z + 0.25;
  }

  /** Morag's way home, once she's met him and he's left her standing (a yes to her room takes her home at once). */
  private walkMorag(dt: number): void {
    const p = this.player;
    const m = this.morag;
    const away = Math.hypot(p.x - m.x, p.z - m.z);
    if (this.moragAt === 'pier') {
      if (this.flags.has('met:morag') && !this.conversation && away > MORAG_LEAVES_BEYOND) this.moragAt = 'walking';
      return;
    }
    if (this.moragAt !== 'walking' || this.talkingTo === 'morag' || away < MORAG_WAITS_WITHIN) return;
    const to = MORAG_WAY_HOME[this.moragLeg]!;
    const dx = to.x - m.x;
    const dz = to.z - m.z;
    const d = Math.hypot(dx, dz);
    const step = MORAG_PACE * dt;
    if (d <= step) {
      m.x = to.x;
      m.z = to.z;
      if (++this.moragLeg >= MORAG_WAY_HOME.length) this.placeMorag('inn');
    } else {
      m.x += (dx / d) * step;
      m.z += (dz / d) * step;
      m.facing = Math.atan2(dx, dz);
    }
    this.moveWall('morag', m.x, m.z);
  }

  tick(intent: SliceIntent, dt: number): void {
    const p = this.player;
    // The mouse aims at a level plane at chest height; out at sea, that point is found back on the deck.
    this.cmd.aimX = this.cmd.aimZ = null;
    if (intent.aim) {
      this.ndc.set(intent.aim.x, intent.aim.y);
      this.aimPlane.constant = -(p.y + 0.9);
      this.ray.setFromCamera(this.ndc, this.camera);
      if (this.ray.ray.intersectPlane(this.aimPlane, this.aimHit)) {
        if (this.aboard(p.x, p.z)) {
          worldToShip(this.ship, this.aimHit.x, this.aimHit.z, this.onShip);
          this.cmd.aimX = this.onShip.x;
          this.cmd.aimZ = this.onShip.z;
        } else {
          this.cmd.aimX = this.aimHit.x;
          this.cmd.aimZ = this.aimHit.z;
        }
      }
    }
    let mx = Math.sin(p.facing);
    let mz = Math.cos(p.facing);
    if (this.cmd.aimX !== null && this.cmd.aimZ !== null) {
      const dx = this.cmd.aimX - p.x;
      const dz = this.cmd.aimZ - p.z;
      const d = Math.hypot(dx, dz);
      if (d > PLAYER_TUNING.aimDeadZone) (mx = dx / d), (mz = dz / d);
    }
    this.cmd.moveX = intent.forward ? mx : 0;
    this.cmd.moveZ = intent.forward ? mz : 0;
    this.cmd.listen = intent.listen;
    this.cmd.speedScale = intent.sprintHeld && intent.forward ? PLAYER_COMBAT.sprint.speed : 1;
    this.cmd.turn = true;

    // What holds the player still: the day's end, a letter being read, the phone, a conversation.
    let held = this.dayEnd.ended || this.phone.open;
    if (!held && this.hud.reading) {
      held = true;
      if (intent.interactPressed) this.hud.closeReader();
    } else if (!held && this.conversation) {
      held = true;
      this.converse(intent.interactPressed);
    } else if (!held && intent.interactPressed) {
      const target = targetHere(SPOTS, this.peopleNow(), this.reach(), p.x, p.z);
      if (target) this.use(target);
    }
    if (held) {
      this.cmd.moveX = this.cmd.moveZ = 0;
      this.cmd.listen = false;
      this.cmd.turn = false;
    }

    this.copyPrev();
    const scale = TIME_SCALES[this.timeScale]!;
    this.tideClock += dt * scale;
    this.walkMorag(dt);
    stepPlayer(p, this.cmd, this.world, this.seaLevel, dt);
    const torchNews = stepTorch(this.torch, hasPower(this.level, p.x, p.z), dt);
    if (torchNews === 'low') this.say('Your phone’s battery is getting low.', 3);
    else if (torchNews === 'dead') this.say('The torch goes out. The phone needs charging.', 3.5);
    this.story(dt * scale);
  }

  /** E and the box's clicks and keys, moving the conversation on. */
  private converse(interactPressed: boolean): void {
    const c = this.conversation!;
    const ctx = this.talkContext();
    const pick = this.talk.takePick();
    const clicked = this.talk.takeClick();
    let effects: Effect[] = [];
    if (pick !== null) effects = choose(c, pick, ctx);
    else if (interactPressed || clicked) effects = advance(c, ctx);
    else return;
    for (const e of effects) this.apply(e);
    this.saveFlags();
    if (currentStep(c, ctx).kind === 'over') this.endConversation();
    else this.talk.show(currentStep(c, ctx), this.keyName('interact'));
  }

  private startTalk(dialogue: Dialogue, person: string | null): void {
    const ctx = this.talkContext();
    const { conversation, effects } = startConversation(dialogue, ctx);
    this.conversation = conversation;
    this.talkingTo = person;
    for (const e of effects) this.apply(e);
    this.saveFlags();
    this.talk.show(currentStep(conversation, ctx), this.keyName('interact'));
  }

  private endConversation(): void {
    this.conversation = null;
    this.talkingTo = null;
    this.talk.hide();
  }

  private apply(effect: Effect): void {
    switch (effect) {
      case 'waitForCauseway':
        this.waitForTide();
        break;
      case 'goToInn':
        this.toInn();
        break;
      case 'teachListen':
        this.say(LINES.listenHint(this.keyName('listen')), 6);
        break;
      case 'takePill':
        this.progress.pill = 'taken';
        this.write();
        break;
      case 'skipPill':
        this.progress.pill = 'skipped';
        this.write();
        break;
    }
  }

  private use(target: Target): void {
    const now = this.now;
    if (target.kind === 'person') {
      this.startTalk(target.person.dialogue, target.person.id);
      return;
    }
    const spot = target.spot;
    if (spot.sets) this.flags.add(spot.sets);
    switch (spot.kind) {
      case 'look':
        this.say(spot.text, 7);
        break;
      case 'read':
        this.hud.read(spot.lines);
        if (!this.progress.read.includes(spot.id)) this.progress.read.push(spot.id);
        this.refreshPhone();
        break;
      case 'tideTable':
        this.hud.read(tideTableText(this.tideClock));
        break;
      case 'custom':
        this.progress.customs.push(spot.custom);
        this.say(spot.text, 7);
        break;
      case 'coffin': {
        const looked = lookedFlag(spot.id);
        if (!this.flags.has(looked)) {
          this.flags.add(looked);
          this.hud.read(COFFIN.first);
        } else if (now < this.sitUntil) {
          this.endDay();
          return;
        } else {
          this.sitUntil = now + SIT_CONFIRM_MS;
          this.say(COFFIN.confirm, SIT_CONFIRM_MS / 1000);
        }
        break;
      }
      case 'pills':
        if (this.progress.pill) this.say(PILLS.decided, 4);
        else this.startTalk(PILL_TALK, null);
        break;
      case 'wait':
        this.waitForTide();
        break;
      case 'sleep':
        this.sleep();
        break;
    }
    this.saveFlags();
  }

  /** Let the hours pass until the causeway clears, and save there. */
  private waitForTide(): void {
    if (this.causewayOpen) return;
    this.tideClock = nextCausewayOpen(this.tideClock, CROSSING_TIDE) + 1;
    this.dayEnd.dip();
    this.toldShut = false;
    this.rest();
  }

  /** A yes to Morag's room: straight to the inn with her, out of the rain. */
  private toInn(): void {
    this.dayEnd.dip();
    this.placeMorag('inn');
    this.placeAt(INN_INSIDE.x, INN_INSIDE.z, INN_INSIDE.facing);
    this.tideClock += 15 * (3000 / 1440);
    this.flags.add('atInn');
    this.queued.push({ text: LINES.innArrive, seconds: 6 });
    this.rest();
  }

  /** Up the inn's stair to sleep: the night passes, and it's Thursday morning with the causeway open. */
  private sleep(): void {
    if (this.flags.has(FLAGS.slept) || this.tideClock >= MORNING_TIDE) {
      this.say('You’re not tired now. He’s waiting for you, over the causeway.', 4);
      return;
    }
    this.flags.add(FLAGS.slept);
    this.endConversation();
    this.dayEnd.dip();
    this.tideClock = MORNING_TIDE;
    this.toldShut = false;
    this.placeAt(INN_INSIDE.x + 5, INN_INSIDE.z - 1.6, Math.PI);
    if (this.moragAt !== 'inn') this.placeMorag('inn');
    this.say(LINES.slept, 7);
    this.rest();
  }

  /** What happens as the player goes: the ferry in and away, texts, people noticed, the causeway, the cottage. */
  private story(dt: number): void {
    const now = this.now;
    const p = this.player;
    if (this.opening) {
      this.opening = false;
      this.say(LINES.opening, 6);
      this.queued.push({ text: LINES.bagHint(this.keyName('phone')), seconds: 6 });
    }
    const phase = this.progress.phase;
    if (phase === 'ferry') {
      const before = this.voyage;
      this.voyage = Math.min(VOYAGE_SECONDS, this.voyage + dt);
      for (const { at, message } of MESSAGES_ON_FERRY) if (before < at && this.voyage >= at) this.receive(message, true);
      if (before < VOYAGE_SECONDS && this.voyage >= VOYAGE_SECONDS) {
        this.ferrySounds?.horn();
        this.say(`${LINES.docked} ${LINES.gangway}`, 5);
        this.receive(MESSAGES.mumArrived, false);
      }
      // Off the gangway and onto the pier: ashore, and saved there.
      if (this.voyage >= VOYAGE_SECONDS && inBox(PIER, p.x, p.z)) {
        this.progress.phase = 'island';
        this.rest();
      }
    } else if (this.departure < 0 && !this.aboard(p.x, p.z) && p.z < PIER.maxZ - 12) {
      this.departure = 0;
      this.ferrySounds?.horn();
      this.say(LINES.departing, 5);
    } else if (this.departure >= 0 && this.departure < DEPARTURE_SECONDS) {
      this.departure = Math.min(DEPARTURE_SECONDS, this.departure + dt);
    }

    const next = now >= this.captionUntil ? this.queued.shift() : undefined;
    if (next) this.say(next.text, next.seconds);
    for (const person of PEOPLE) {
      if (!person.notice || now < this.captionUntil || this.noticed.has(person.id) || this.flags.has(`met:${person.id}`)) continue;
      if (Math.hypot(person.x - p.x, person.z - p.z) < NOTICE_RANGE) {
        this.noticed.add(person.id);
        this.say(person.notice, 6);
      }
    }

    // The causeway: say once that the sea's over it; turn back anyone the tide comes up around.
    const ground = this.level.sim.groundAt(p.x, p.z).kind;
    const open = this.causewayOpen;
    if (open) this.toldShut = false;
    else if (ground === 'causeway' && !this.toldShut && Math.abs(p.x) < CAUSEWAY.maxX - 3) {
      this.toldShut = true;
      const knowsRoom = this.flags.has(FLAGS.acceptedRoom) || this.flags.has(FLAGS.declinedRoom);
      this.say(knowsRoom && !this.flags.has(FLAGS.slept) ? LINES.causewayShutRoom : LINES.causewayShut, 6);
    }

    // The inn, the first time in on his own feet.
    if (!this.flags.has('atInn') && inBox(INN, p.x, p.z) && p.z < INN.maxZ - INN.wall) {
      this.flags.add('atInn');
      this.say(this.moragAt === 'inn' ? LINES.innArrive : 'The Skerry Inn. Warm, and too quiet. Nobody behind the bar yet.', 6);
      this.saveFlags();
    }
    if (ground === 'causeway' && p.depth > PLAYER_TUNING.maxWadeDepth + 0.05) {
      const toIslet = p.x < 0;
      this.placeAt(toIslet ? CAUSEWAY.minX - 0.5 : CAUSEWAY.maxX + 0.5, 0, toIslet ? -Math.PI / 2 : Math.PI / 2);
      this.say(LINES.turnedBack, 4);
    }

    // The cottage: the first time in, the bag set down and the game saved.
    if (!this.flags.has('atCottage') && inBox(COTTAGE, p.x, p.z)) {
      this.flags.add('atCottage');
      this.say(LINES.cottage, 5);
      this.queued.push({ text: LINES.cottageAfter, seconds: 5 });
      this.rest();
    }
  }

  /** A caption, holding the line for its time. */
  private say(text: string, seconds: number): void {
    this.hud.say(text, this.now, seconds);
    this.captionUntil = this.now + seconds * 1000;
  }

  private receive(message: Message, hint: boolean): void {
    if (this.progress.messages.includes(message.id)) return;
    this.progress.messages.push(message.id);
    const tail = hint && !this.flags.has('phoneHinted') ? `   (${LINES.phoneHint(this.keyName('phone'))})` : '';
    if (tail) this.flags.add('phoneHinted');
    this.phone.toast(`${message.from.toUpperCase()}: ${message.text}${tail}`, this.now, tail ? 7 : 5);
    this.refreshPhone();
    this.write();
  }

  private refreshPhone(): void {
    this.phone.setMessages(
      this.progress.messages.flatMap((id) => {
        const m = MESSAGE_BY_ID.get(id);
        return m ? [{ from: m.from, when: m.sent, text: m.text }] : [];
      }),
    );
    this.phone.setNotes(
      this.progress.read.flatMap((id) => {
        const s = SPOT_BY_ID.get(id);
        return s?.kind === 'read' ? [{ id, title: s.title }] : [];
      }),
    );
  }

  private readNote(id: string): void {
    const s = SPOT_BY_ID.get(id);
    if (s?.kind === 'read') this.hud.read(s.lines);
  }

  /** He sits with his father, and the day ends. */
  private endDay(): void {
    this.progress.phase = 'done';
    this.checkpoint = null;
    this.endConversation();
    this.hud.closeReader();
    this.phone.close();
    this.write();
    const done = new Set<Custom>(this.progress.customs);
    this.dayEnd.end(
      vigilLines(done),
      'END OF CHAPTER 1',
      'The Crossing',
      releaseName(),
      'Chapter 2, The Funeral, isn’t built yet. You can carry on into Low water, the stage built before the chapters, which starts the morning after the vigil.',
      [
        ['Carry on into Low water', () => this.onFinished?.()],
        [
          'Play chapter 1 again',
          () => {
            clearCrossing(this.persist ? this.storage : null);
            window.location.reload();
          },
        ],
      ],
    );
  }

  private saveFlags(): void {
    this.progress.flags = [...this.flags];
    this.write();
  }

  /** A save point: where a reload picks up. */
  private rest(): void {
    this.checkpoint = { x: this.player.x, z: this.player.z, facing: this.player.facing, tideClock: this.tideClock, torch: { ...this.torch } };
    this.saveFlags();
  }

  private write(): void {
    if (this.persist) writeCrossing(this.storage, this.layout, { progress: this.progress, checkpoint: this.checkpoint });
  }

  private load(c: CrossingCheckpoint): void {
    this.placeAt(c.x, c.z, c.facing);
    this.tideClock = c.tideClock;
    Object.assign(this.torch, c.torch);
  }

  private placeAt(x: number, z: number, facing: number): void {
    const p = this.player;
    p.x = x;
    p.z = z;
    p.facing = facing;
    p.y = this.level.sim.groundAt(x, z).height;
    p.depth = Math.max(0, this.seaLevel - p.y);
    this.copyPrev();
    this.snapCamera = true;
  }

  present(alpha: number, frameDt: number, now: number): void {
    this.now = now;
    const p = this.player;
    const px = this.prev.x + (p.x - this.prev.x) * alpha;
    const py = this.prev.y + (p.y - this.prev.y) * alpha;
    const pz = this.prev.z + (p.z - this.prev.z) * alpha;

    // Where the ferry is, and so where everything aboard it is drawn.
    if (this.voyage < VOYAGE_SECONDS) voyagePose(this.voyage, this.ship);
    else if (this.departure >= 0) departurePose(this.departure, this.ship);
    else Object.assign(this.ship, { dx: 0, dz: 0, yaw: 0 });
    const aboard = this.aboard(px, pz);
    if (aboard) shipToWorld(this.ship, px, pz, this.drawn);
    else (this.drawn.x = px), (this.drawn.z = pz);
    const dx = this.drawn.x;
    const dz = this.drawn.z;

    // Camera zones, as the slice has them; aboard, the camera rides with the ship.
    const next = selectZone(this.level.cameras, this.zone, px, pz);
    if (next !== this.zone) {
      this.zone = next;
      this.snapCamera = true;
    }
    const zone = this.level.cameras[this.zone]!;
    zonePose(zone, px, py, pz, this.pose);
    if (aboard) {
      const at = shipToWorld(this.ship, this.pose.px, this.pose.pz, { x: 0, z: 0 });
      const look = shipToWorld(this.ship, this.pose.lx, this.pose.lz, { x: 0, z: 0 });
      this.pose.px = at.x;
      this.pose.pz = at.z;
      this.pose.lx = look.x;
      this.pose.lz = look.z;
    }
    // At sea the camera follows the ship hard, so the deck doesn't slide under it.
    const follow = this.snapCamera || (aboard && this.voyage < VOYAGE_SECONDS) || (aboard && this.departure >= 0);
    this.camPos.lerp(this.target.set(this.pose.px, this.pose.py, this.pose.pz), follow ? 1 : 1 - Math.exp(-frameDt * 5));
    this.camLook.lerp(this.target.set(this.pose.lx, this.pose.ly, this.pose.lz), follow ? 1 : 1 - Math.exp(-frameDt * 9));
    this.snapCamera = false;

    const hum = humParams(this.tideClock, CROSSING_TIDE);
    this.humClock.advance(hum, frameDt * Math.sqrt(TIME_SCALES[this.timeScale]!));
    const beat = this.humClock.beat();
    const indoors = zone.indoors === true;
    const world = this.level.sim;
    const nearPost = world.listeningPosts.some((post) => Math.hypot(post.x - px, post.z - pz) < post.radius);
    const clarity = aboard ? 0.1 : listeningClarity(nearPost, indoors, world.groundAt(px, pz).kind);
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

    // The light going: the sky and the fog from dusk to night, and the haar thinning as the ferry comes in.
    const g = this.g;
    const day = daylight(this.tideClock);
    const sky = (this.scene.background as Color | null) ?? null;
    sky?.copy(NIGHT_SKY).lerp(DUSK_SKY, day);
    g.fog.color.copy(NIGHT_SKY).lerp(DUSK_SKY, day);
    if (this.hemi) this.hemi.intensity = this.hemiBase * (1 + 0.9 * day);
    if (this.moon) this.moon.intensity = this.moonBase * (1 + 0.6 * day);
    const haar = this.voyage < VOYAGE_SECONDS ? 1 - this.voyage / VOYAGE_SECONDS : 0;
    g.fog.density = 0.026 + 0.012 * (0.5 + 0.5 * Math.sin(now / 9000)) + 0.03 * haar;

    g.sea.position.y = this.seaLevel;
    for (const pebble of g.pebbles) {
      const near = Math.max(0, 1 - Math.hypot(pebble.mesh.position.x - px, pebble.mesh.position.z - pz) / 6);
      // Listening, the stones near him jump with the beat, and the puddles shiver even at low water.
      pebble.mesh.position.y = pebble.baseY + (Math.random() - 0.5) * (p.listening ? 0.09 : 0.03) * hum.strength * beat * (0.3 + near * (p.listening ? 3 : 1));
    }
    g.ripple.amount.value = Math.min(1, (hum.strength * (p.listening ? 2 : 1.4) + (p.listening ? 0.2 : 0)) * (0.35 + 0.65 * beat));
    if (this.look) updateListenCue(this.look, p.listening, hum.strength, beat, frameDt, now / 1000);
    g.ripple.phase.value = this.humClock.phase;
    for (const beam of g.beams) beam.rotation.y += frameDt * 0.35;
    for (const [i, f] of g.flames.entries()) f.light.intensity = f.base * (0.85 + 0.1 * Math.sin(now / 90 + i * 2.1) + 0.08 * Math.random());

    // The vigil night's set, as the customs have left it; nothing of the slice's things.
    const customs = this.progress.customs;
    for (const mesh of g.thingMeshes.values()) mesh.visible = false;
    const show = (id: string, on: boolean): void => {
      const mesh = g.thingMeshes.get(id);
      if (mesh) mesh.visible = on;
    };
    show(VIGIL_MESHES.coffin, true);
    show(VIGIL_MESHES.candleFlame, customs.includes('candle'));
    show(VIGIL_MESHES.saltOnTable, !customs.includes('salt'));
    show(VIGIL_MESHES.saltOnCoffin, customs.includes('salt'));
    show(VIGIL_MESHES.mirrorTurned, customs.includes('mirror'));
    show(VIGIL_MESHES.windowOpen, customs.includes('window'));
    this.arrival.bag.visible = this.flags.has('atCottage');
    this.backpack.visible = !this.flags.has('atCottage');

    // The ferry: in, alongside, away; gone once it's out of sight.
    const underWay = this.voyage < VOYAGE_SECONDS ? 1 - Math.pow(this.voyage / VOYAGE_SECONDS, 3) : this.departure >= 0 ? Math.min(1, this.departure / 12) : 0;
    this.ferry.ship.visible = this.departure < DEPARTURE_SECONDS;
    this.ferry.update(this.ship, now / 1000, underWay, g.sea.position.y);
    this.ferry.gangway.visible = this.gangwayOpen;
    // His only luggage is the backpack he's wearing.
    this.ferry.bag.visible = false;

    // The figure: crouched to listen, or holding the phone's torch; on the ferry, turned with it.
    const facing = p.facing + (aboard ? this.ship.yaw : 0);
    g.player.position.set(dx, py, dz);
    g.player.rotation.y = facing;
    const crouch = p.listening ? 1 : 0;
    g.playerBody.position.y = 0.8 - crouch * 0.32;
    g.playerBody.rotation.x = crouch * 0.35;
    if (p.listening) g.hand.position.set(-0.15 + (Math.random() - 0.5) * feel * 0.04, 0.06, 0.5);
    else g.hand.position.set(-0.3, 1.05, 0.28);
    // Nothing in his hands: only the phone, held up while its torch is on.
    g.hand.visible = this.torch.on || p.listening;
    g.torch.visible = this.torch.on;
    const stutter = this.torch.charge < TORCH.low && Math.random() < 0.06 ? 0.4 : 1;
    g.torch.intensity = this.torchIntensity * torchBrightness(this.torch.charge) * stutter;
    this.hud.setTorch(this.torch.charge, this.torch.on);
    const sx = Math.sin(facing);
    const sz = Math.cos(facing);
    g.torch.position.set(dx - 0.3 * sz + 0.3 * sx, py + 1.1, dz + 0.3 * sx + 0.3 * sz);
    g.torch.target.position.set(dx + sx * 6, py, dz + sz * 6);
    g.torch.target.updateMatrixWorld();

    this.people.update(
      px,
      pz,
      frameDt,
      this.talkingTo,
      (id) => id === 'tam' && !this.flags.has('met:tam'),
      (id) => (id !== 'magnus' || this.ferry.ship.visible) && (id !== 'isa' || !this.flags.has(FLAGS.slept)),
      (person, at, drawn) => {
        if (person.id === 'morag') Object.assign(at, this.morag);
        if (!this.aboard(at.x, at.z)) {
          drawn.x = at.x;
          drawn.z = at.z;
          return 0;
        }
        shipToWorld(this.ship, at.x, at.z, drawn);
        return this.ship.yaw;
      },
    );

    this.rain.object.visible = !indoors;
    if (this.renderer) this.rain.step(this.renderer, frameDt, { x: dx, y: py, z: dz });

    this.audio?.update(hum, beat, this.humClock.hiss(hum), clarity, p.listening, indoors);
    const fromShip = aboard ? 0 : Math.hypot(px - (FERRY.deck.minX + FERRY.deck.maxX) / 2 - this.ship.dx, pz - 31 - this.ship.dz);
    this.ferrySounds?.setEngine(this.ferry.ship.visible ? (0.35 + 0.65 * underWay) * Math.max(0, 1 - fromShip / 45) : 0);

    const idle = !this.conversation && !this.hud.reading && !this.phone.open && !this.dayEnd.ended;
    const target = idle ? targetHere(SPOTS, this.peopleNow(), this.reach(), p.x, p.z) : null;
    this.hud.setPrompt(target ? targetPrompt(target, this.reach()) : '');
    const signal = aboard || Math.hypot(px - SIGNAL.x, pz - SIGNAL.z) < SIGNAL.range;
    this.phone.setStatus(timeText(this.tideClock), signal ? '1 bar' : LINES.noSignal, `${dayName(this.tideClock)}. ${tideWords(this.tideClock, this.causewayOpen)}`);
    this.hud.frame(now);
    this.phone.frame(now);
  }

  render(): void {
    this.pipeline?.render();
  }

  debugStats(): Record<string, string | number> {
    const p = this.player;
    return {
      chapter: `1, The Crossing (${this.progress.phase})`,
      'island time': `${dayName(this.tideClock)} ${timeText(this.tideClock)}, ×${TIME_SCALES[this.timeScale]} (])`,
      tide: `${tidePhase(this.tideClock, CROSSING_TIDE)} ${this.seaLevel.toFixed(2)} m, causeway ${this.causewayOpen ? 'open' : 'closed'}`,
      morag: this.moragAt,
      player: `${p.x.toFixed(1)}, ${p.z.toFixed(1)}, facing ${Math.round((p.facing * 180) / Math.PI)}°, water ${p.depth.toFixed(2)} m`,
      camera: this.level.cameras[this.zone]!.id,
      indoors: isIndoors(this.level, p.x, p.z) ? 'yes' : 'no',
      hum: `${(this.shown.hum * 100).toFixed(0)}%, ${this.shown.beatHz.toFixed(2)} beats/s, heard ${(this.shown.clarity * 100).toFixed(0)}%`,
      customs: this.progress.customs.join(', ') || '-',
    };
  }

  private copyPrev(): void {
    this.prev.x = this.player.x;
    this.prev.y = this.player.y;
    this.prev.z = this.player.z;
  }
}
