import { PARISH_NAMES, PLAYER_COMBAT as PC, UNBURIED_TUNING as UT, WEAPONS, type WeaponId } from '../../config/combat';
import { PLAYER_TUNING } from '../../config/player';
import { resolveCircleVsBoxes } from '../collision';
import { type PlayerCommand, type PlayerState, stepPlayer } from '../player';
import { createRng, rngNext, type RngState } from '../rng';
import type { WorldDef } from '../world/types';

/**
 * The fight (concept v0.6 sections 3.2 to 3.4): the player's sword or knife, deflect and step, Resolve and health,
 * against the Unburied, who lurch, feint and go still, fall and rise again unless broken and given the Rite. Pure and
 * deterministic on the fixed tick: all randomness comes from the encounter's own seeded stream, and the whole state is
 * plain data, so a checkpoint is a copy of it.
 */

export type FighterAction = 'free' | 'attack' | 'charge' | 'sained' | 'deflect' | 'step' | 'hurt' | 'broken' | 'rite' | 'lay' | 'dead';

export interface Fighter {
  health: number;
  resolve: number;
  weapon: WeaponId;
  action: FighterAction;
  /** Ticks into the current action. */
  t: number;
  /** Which swing of the chain this is (0 = first). */
  chain: number;
  /** Ticks since the last swing ended; a long pause starts the chain again. */
  sinceSwing: number;
  /** Another swing was asked for before this one could chain. */
  queued: boolean;
  /** Bit per enemy already hit by this swing. */
  hitMask: number;
  /** Ticks since the last deflect ended. */
  sinceDeflect: number;
  /** This deflect's perfect window in ticks (0: none, it was pressed too soon after the last). */
  perfect: number;
  /** The last deflect met a blow perfectly: the next one is armed at once. */
  met: boolean;
  /** Ticks a deflect press still waits for the player to be free to deflect (0: none waiting). */
  deflectBuffer: number;
  /** Ticks since the last deflect started. */
  sinceDeflectStart: number;
  /** Ticks since a blow last landed on the player, while a deflect pressed now would be too late (999: none). */
  sinceStruck: number;
  stepCooldown: number;
  stepX: number;
  stepZ: number;
  /** The enemy being given the Rite or laid down (-1: none). */
  target: number;
  stamina: number;
  /** Sprinting this tick. */
  sprinting: boolean;
  /** Ticks since stamina was last spent. */
  sinceSprint: number;
  /** Ran out of stamina: no sprinting until it is back to `sprint.recoverAt`. */
  winded: boolean;
}

export type UnburiedState = 'idle' | 'stalk' | 'still' | 'windup' | 'strike' | 'recover' | 'reel' | 'hurt' | 'broken' | 'downed' | 'rising' | 'rested' | 'home';

export interface Unburied {
  x: number;
  z: number;
  y: number;
  facing: number;
  readonly homeX: number;
  readonly homeZ: number;
  readonly homeFacing: number;
  health: number;
  maxHealth: number;
  /** 0..maxBreak, shown on its body. Full: broken, open to the Rite. */
  break: number;
  state: UnburiedState;
  t: number;
  /** How long the current state lasts (states that time out). */
  duration: number;
  /** Stalking gait: lurching (fast) or shuffling, and ticks until it changes. */
  lurching: boolean;
  gait: number;
  /** This wind-up is a feint and won't land. */
  feint: boolean;
  /** This strike has landed or been met already. */
  struck: boolean;
  rises: number;
  /** The name the Rite speaks. */
  readonly name: string;
}

/**
 * How a deflect was timed, for the player to learn the rhythm: met in the window, pressed early (the window had closed
 * when the blow landed; `ticks` past it), late (`ticks` after the blow), too soon after the last deflect (no window at
 * all), or while busy (mid-swing, unable to deflect).
 */
export type DeflectTiming = 'perfect' | 'early' | 'late' | 'tooSoon' | 'busy';

export type CombatEvent =
  | { kind: 'swing'; heavy: boolean }
  | { kind: 'charged' }
  | { kind: 'hit'; enemy: number; heavy: boolean; weapon: WeaponId }
  | { kind: 'perfectDeflect'; enemy: number }
  | { kind: 'guard'; enemy: number }
  | { kind: 'hurt'; enemy: number }
  | { kind: 'step' }
  | { kind: 'enemyNotice'; enemy: number }
  | { kind: 'enemyWindup'; enemy: number }
  | { kind: 'enemyTell'; enemy: number }
  | { kind: 'enemyStrike'; enemy: number }
  | { kind: 'deflectTiming'; result: DeflectTiming; ticks: number }
  | { kind: 'feint'; enemy: number }
  | { kind: 'enemyBroken'; enemy: number }
  | { kind: 'enemyDown'; enemy: number }
  | { kind: 'enemyRise'; enemy: number }
  | { kind: 'riteBegin'; enemy: number }
  | { kind: 'rested'; enemy: number; name: string; rite: boolean }
  | { kind: 'playerBroken' }
  | { kind: 'playerRecovered' }
  | { kind: 'playerDead' };

export interface Encounter {
  fighter: Fighter;
  dead: Unburied[];
  rng: RngState;
  /** Ticks the whole fight stays frozen for weight on a hit (hit-stop). */
  hitStop: number;
  /** Ticks since the player died. */
  deadFor: number;
  /** The enemy the player is marked as facing up to, that an attack turns toward when it is close enough (-1: none). */
  focus: number;
  /** What happened since the presentation last read it; the presentation empties it. */
  events: CombatEvent[];
}

/** What the player asks of the fight this tick. Presses are edges, true on one tick only. */
export interface FighterInput {
  attackHeld: boolean;
  attackPressed: boolean;
  deflectHeld: boolean;
  deflectPressed: boolean;
  stepPressed: boolean;
  /** Left Shift or Left Alt held: sprint while walking, for as long as stamina lasts. */
  sprintHeld: boolean;
  /** E near a broken or fallen body: the Rite or laying it down. */
  interactPressed: boolean;
}

/** What the fight needs to know about where the player is. */
export interface FightContext {
  /** Carrying a light: the dead see the player from further. */
  lit: boolean;
  /** Out in the dark without a light: Resolve drains. */
  dark: boolean;
  /** In a refuge (the cottage): the dead lose interest. */
  inRefuge: boolean;
}

export function createFighter(weapon: WeaponId): Fighter {
  return {
    health: PC.maxHealth,
    resolve: PC.startResolve,
    weapon,
    action: 'free',
    t: 0,
    chain: 0,
    sinceSwing: 999,
    queued: false,
    hitMask: 0,
    sinceDeflect: 999,
    perfect: 0,
    met: false,
    deflectBuffer: 0,
    sinceDeflectStart: 999,
    sinceStruck: 999,
    stepCooldown: 0,
    stepX: 0,
    stepZ: 0,
    target: -1,
    stamina: PC.maxStamina,
    sprinting: false,
    sinceSprint: 999,
    winded: false,
  };
}

export function createUnburied(x: number, z: number, facing: number, rng: RngState): Unburied {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rngNext(rng) * list.length)]!;
  const [from, to] = PARISH_NAMES.years;
  const year = from + Math.floor(rngNext(rng) * (to - from + 1));
  return {
    x,
    z,
    y: 0,
    facing,
    homeX: x,
    homeZ: z,
    homeFacing: facing,
    health: UT.health,
    maxHealth: UT.health,
    break: 0,
    state: 'idle',
    t: 0,
    duration: 0,
    lurching: false,
    gait: 0,
    feint: false,
    struck: false,
    rises: 0,
    name: `${pick(PARISH_NAMES.given)} ${pick(PARISH_NAMES.family)}, ${year}`,
  };
}

export function createEncounter(seed: number, weapon: WeaponId, spawns: readonly { x: number; z: number; facing: number }[]): Encounter {
  const rng = createRng(seed);
  return { fighter: createFighter(weapon), dead: spawns.map((s) => createUnburied(s.x, s.z, s.facing, rng)), rng, hitStop: 0, deadFor: 0, focus: -1, events: [] };
}

/**
 * Hours pass (resting at the hearth, waiting out the tide in a refuge): the player is at rest, and every one of the dead
 * not laid to rest is back where it stood, whole. Any that were down have risen, stronger, as they would have.
 */
export function passTime(enc: Encounter): void {
  const f = enc.fighter;
  f.action = 'free';
  f.t = 0;
  f.queued = false;
  f.deflectBuffer = 0;
  f.target = -1;
  enc.hitStop = 0;
  for (const u of enc.dead) {
    if (u.state === 'rested') continue;
    if (u.state === 'downed' || u.state === 'rising') {
      u.rises++;
      u.maxHealth = Math.round(u.maxHealth * UT.riseHealthGain);
    }
    u.health = u.maxHealth;
    u.break = 0;
    u.x = u.homeX;
    u.z = u.homeZ;
    u.facing = u.homeFacing;
    setState(u, 'idle');
  }
}

/** The perfect-deflect window for this much Resolve: full above `lowResolve`, narrowing toward zero. */
export function perfectWindow(resolve: number): number {
  const d = PC.deflect;
  if (resolve >= PC.lowResolve) return d.perfectTicks;
  const k = Math.max(0, resolve) / PC.lowResolve;
  return Math.round(d.minPerfectTicks + (d.perfectTicks - d.minPerfectTicks) * k);
}

/** A body the player can act on with E from here: a broken one for the Rite, else a fallen one to lay down. */
export function interactTarget(enc: Encounter, p: PlayerState): { enemy: number; rite: boolean } | null {
  if (!WEAPONS[enc.fighter.weapon].canLay) return null;
  let best = -1;
  let bestRite = false;
  let bestD = Infinity;
  enc.dead.forEach((u, i) => {
    const rite = u.state === 'broken';
    if (!rite && u.state !== 'downed') return;
    const reach = rite ? PC.rite.reach : PC.layFallen.reach;
    const d = Math.hypot(u.x - p.x, u.z - p.z);
    if (d > reach + UT.radius) return;
    // The Rite comes first; then the nearest.
    if ((rite && !bestRite) || (rite === bestRite && d < bestD)) {
      best = i;
      bestRite = rite;
      bestD = d;
    }
  });
  return best < 0 ? null : { enemy: best, rite: bestRite };
}

/** Where the dead may stand: any walkable ground out of the sea, except the Brough, where they never set foot. */
export function deadCanStand(world: WorldDef, x: number, z: number, waterLevel: number): boolean {
  const g = world.groundAt(x, z);
  return g.kind !== 'channel' && g.kind !== 'islet' && g.height >= waterLevel;
}

const pos = { x: 0, z: 0 };

/**
 * One fixed tick of the fight. Turns `cmd` (the player's walking and aim, from the input) into what the fight allows,
 * moves the player with it, then runs the dead.
 */
export function stepEncounter(
  enc: Encounter,
  input: FighterInput,
  cmd: PlayerCommand,
  player: PlayerState,
  world: WorldDef,
  waterLevel: number,
  ctx: FightContext,
  dt: number,
): void {
  const f = enc.fighter;
  if (f.action === 'dead') {
    enc.deadFor++;
    enc.focus = -1;
    f.sprinting = false;
    return;
  }
  // Noted even through a hit-stop, so a press in the freeze still counts.
  if (input.deflectPressed && WEAPONS[enc.fighter.weapon].armed) noteDeflectPress(enc);
  if (enc.hitStop > 0) {
    enc.hitStop--;
    return;
  }

  updateFighter(enc, input, player, ctx, dt);
  shapeCommand(f, cmd);
  sprint(f, input, cmd, dt);
  stepPlayer(player, cmd, world, waterLevel, dt);
  if (f.action === 'attack' || f.action === 'sained') swingHits(enc, player);

  for (let i = 0; i < enc.dead.length; i++) stepUnburied(enc, i, player, world, waterLevel, ctx, dt);
  separate(enc, player, world);
  enc.focus = focusOf(enc, player);
}

/** Sprinting: only walking free (not mid-swing, guarding or stepping), and only while there's stamina for it. */
function sprint(f: Fighter, input: FighterInput, cmd: PlayerCommand, dt: number): void {
  const S = PC.sprint;
  const moving = cmd.moveX !== 0 || cmd.moveZ !== 0;
  f.sprinting = input.sprintHeld && moving && f.action === 'free' && !f.winded && f.stamina > 0;
  if (f.sprinting) {
    cmd.speedScale *= S.speed;
    cmd.listen = false;
    f.stamina = Math.max(0, f.stamina - S.drain * dt);
    f.sinceSprint = 0;
    if (f.stamina === 0) f.winded = true;
    return;
  }
  if (f.sinceSprint < 999) f.sinceSprint++;
  if (f.sinceSprint >= S.regenDelay) f.stamina = Math.min(PC.maxStamina, f.stamina + S.regen * dt);
  if (f.winded && f.stamina >= S.recoverAt) f.winded = false;
}

// --- the player ---

function noteDeflectPress(enc: Encounter): void {
  const f = enc.fighter;
  if (f.sinceStruck <= PC.deflect.lateTicks) {
    enc.events.push({ kind: 'deflectTiming', result: 'late', ticks: f.sinceStruck + 1 });
    f.sinceStruck = 999;
  }
  f.deflectBuffer = PC.deflect.bufferTicks;
}

function setAction(f: Fighter, action: FighterAction): void {
  f.action = action;
  f.t = 0;
}

function swingLength(f: Fighter): number {
  const w = WEAPONS[f.weapon];
  return w.windup + w.active + w.recovery;
}

function updateFighter(enc: Encounter, input: FighterInput, p: PlayerState, ctx: FightContext, dt: number): void {
  const f = enc.fighter;
  const w = WEAPONS[f.weapon];
  f.t++;
  f.sinceSwing++;
  if (f.action !== 'deflect') f.sinceDeflect++;
  f.sinceDeflectStart = Math.min(999, f.sinceDeflectStart + 1);
  f.sinceStruck = Math.min(999, f.sinceStruck + 1);
  if (f.stepCooldown > 0) f.stepCooldown--;
  const wantsDeflect = f.deflectBuffer > 0;
  if (f.deflectBuffer > 0) f.deflectBuffer--;

  if (ctx.dark && f.action !== 'broken') drainResolve(enc, PC.darknessDrain * dt);

  const startDeflect = (): void => {
    f.perfect = f.met || f.sinceDeflect >= PC.deflect.rearmTicks ? perfectWindow(f.resolve) : 0;
    f.met = false;
    f.deflectBuffer = 0;
    f.sinceDeflectStart = 0;
    setAction(f, 'deflect');
  };
  const startStep = (): void => {
    // Always straight back, away from where the player faces (the pointer), whatever they were doing.
    f.stepX = -Math.sin(p.facing);
    f.stepZ = -Math.cos(p.facing);
    setAction(f, 'step');
    enc.events.push({ kind: 'step' });
  };
  const startSwing = (): void => {
    f.chain = f.sinceSwing < 20 ? (f.chain + 1) % w.chain : 0;
    f.hitMask = 0;
    f.queued = false;
    lockOn(enc, p);
    setAction(f, 'attack');
  };

  switch (f.action) {
    case 'free':
      if (input.interactPressed) {
        const target = interactTarget(enc, p);
        const cost = target?.rite ? PC.rite.cost : PC.layFallen.cost;
        if (target && f.resolve >= cost) {
          f.resolve -= cost;
          f.target = target.enemy;
          setAction(f, target.rite ? 'rite' : 'lay');
          enc.events.push({ kind: 'riteBegin', enemy: target.enemy });
          break;
        }
      }
      if (wantsDeflect) startDeflect();
      else if (input.stepPressed && f.stepCooldown === 0) startStep();
      else if (input.attackPressed && w.armed) startSwing();
      break;

    case 'attack': {
      const end = swingLength(f);
      if (input.attackPressed) f.queued = true;
      // Held through the wind-up of a first swing with the sword: the blow becomes a sained strike's charge.
      if (f.weapon === 'sword' && f.chain === 0 && f.t === w.windup - 1 && input.attackHeld) {
        setAction(f, 'charge');
        break;
      }
      if (f.t === w.windup) enc.events.push({ kind: 'swing', heavy: false });
      const inWindup = f.t < w.windup;
      const recovering = f.t >= w.windup + w.active;
      if ((inWindup || recovering) && wantsDeflect) startDeflect();
      else if (recovering && input.stepPressed && f.stepCooldown === 0) startStep();
      else if (f.t >= w.windup + w.active + w.chainFrom && f.queued) {
        f.sinceSwing = 0;
        startSwing();
      } else if (f.t >= end) {
        f.sinceSwing = 0;
        setAction(f, 'free');
      }
      break;
    }

    case 'charge':
      if (f.t === PC.sained.chargeTicks) enc.events.push({ kind: 'charged' });
      if (wantsDeflect) startDeflect();
      else if (!input.attackHeld || f.t >= PC.sained.maxHoldTicks) {
        if (f.t >= PC.sained.chargeTicks && f.resolve >= PC.sained.cost) {
          f.resolve -= PC.sained.cost;
          f.hitMask = 0;
          setAction(f, 'sained');
        } else {
          // Let go early, or no Resolve to spend: the plain blow lands after all.
          f.hitMask = 0;
          setAction(f, 'attack');
          f.t = w.windup;
          enc.events.push({ kind: 'swing', heavy: false });
        }
      }
      break;

    case 'sained': {
      const s = PC.sained;
      if (f.t === s.windup) enc.events.push({ kind: 'swing', heavy: true });
      if (f.t >= s.windup + s.active + s.recovery) {
        f.sinceSwing = 999;
        setAction(f, 'free');
      }
      break;
    }

    case 'deflect':
      // Straight after meeting a blow, a fresh press meets the next one.
      if (f.met && wantsDeflect) startDeflect();
      else if (f.t >= PC.deflect.minTicks && !input.deflectHeld) {
        f.sinceDeflect = 0;
        setAction(f, 'free');
      }
      break;

    case 'step':
      if (f.t >= PC.step.ticks || (f.t >= PC.step.invulnerableTo && wantsDeflect)) {
        f.stepCooldown = PC.step.cooldown;
        if (wantsDeflect) startDeflect();
        else setAction(f, 'free');
      }
      break;

    case 'hurt':
      if (f.t >= PC.hurtTicks) setAction(f, 'free');
      break;

    case 'broken':
      if (f.t >= PC.brokenTicks) {
        f.resolve = PC.recoverResolve;
        setAction(f, 'free');
        enc.events.push({ kind: 'playerRecovered' });
      }
      break;

    case 'rite':
    case 'lay': {
      const u = enc.dead[f.target];
      const rite = f.action === 'rite';
      // The body has to stay down for the whole of it.
      if (!u || u.state !== (rite ? 'broken' : 'downed')) {
        setAction(f, 'free');
        break;
      }
      if (f.t >= (rite ? PC.rite.ticks : PC.layFallen.ticks)) {
        u.state = 'rested';
        u.t = 0;
        if (rite) f.resolve = Math.min(PC.maxResolve, f.resolve + PC.rite.restore);
        enc.events.push({ kind: 'rested', enemy: f.target, name: u.name, rite });
        f.target = -1;
        setAction(f, 'free');
      }
      break;
    }

    case 'dead':
      break;
  }
}

/** The fight's say over the player's walking and turning this tick. */
function shapeCommand(f: Fighter, cmd: PlayerCommand): void {
  const w = WEAPONS[f.weapon];
  cmd.turn = true;
  cmd.speedScale = 1;
  switch (f.action) {
    case 'attack':
      cmd.speedScale = PC.busySpeed;
      cmd.turn = f.t < w.windup;
      break;
    case 'charge':
      cmd.speedScale = PC.busySpeed;
      break;
    case 'sained':
      cmd.speedScale = 0;
      cmd.turn = false;
      break;
    case 'deflect':
      cmd.speedScale = PC.busySpeed;
      break;
    case 'step': {
      const speed = PC.step.distance / (PC.step.ticks / 60);
      cmd.moveX = f.stepX;
      cmd.moveZ = f.stepZ;
      cmd.speedScale = speed / PLAYER_TUNING.walkSpeed;
      cmd.turn = false;
      break;
    }
    case 'broken':
      cmd.speedScale = PC.brokenSpeed;
      break;
    case 'hurt':
    case 'rite':
    case 'lay':
    case 'dead':
      cmd.speedScale = 0;
      cmd.turn = false;
      break;
    case 'free':
      break;
  }
  cmd.listen = cmd.listen && f.action === 'free';
}

/** The enemy to mark as the target: the nearest in front within `focusReach`, keeping the last one unless another is clearly nearer. */
export function focusOf(enc: Encounter, p: PlayerState): number {
  if (!WEAPONS[enc.fighter.weapon].armed) return -1;
  const inFront = (u: Unburied): number => {
    if (!targetable(u)) return Infinity;
    const d = Math.hypot(u.x - p.x, u.z - p.z);
    return d <= PC.focusReach && Math.abs(angleTo(p.facing, p.x, p.z, u.x, u.z)) <= PC.lockHalfAngle ? d : Infinity;
  };
  let best = -1;
  let bestD = Infinity;
  enc.dead.forEach((u, i) => {
    const d = inFront(u);
    if (d < bestD) (best = i), (bestD = d);
  });
  const kept = enc.dead[enc.focus];
  if (kept && best !== enc.focus && inFront(kept) <= bestD * PC.focusKeep) return enc.focus;
  return best;
}

/**
 * Turn an attack toward the marked target when it is close, else the nearest close in front, so swings don't whiff
 * past a target the aim almost has.
 */
function lockOn(enc: Encounter, p: PlayerState): void {
  const reach = (u: Unburied | undefined): number => (u && targetable(u) ? Math.hypot(u.x - p.x, u.z - p.z) : Infinity);
  let best = enc.dead[enc.focus];
  if (reach(best) > PC.lockReach) {
    best = undefined;
    let bestD: number = PC.lockReach;
    for (const u of enc.dead) {
      const d = reach(u);
      if (d < bestD && Math.abs(angleTo(p.facing, p.x, p.z, u.x, u.z)) <= PC.lockHalfAngle) (best = u), (bestD = d);
    }
  }
  if (best) p.facing = Math.atan2(best.x - p.x, best.z - p.z);
}

function targetable(u: Unburied): boolean {
  return u.state !== 'downed' && u.state !== 'rising' && u.state !== 'rested';
}

/** Signed angle from a facing (0 = +z) to the direction of a point. */
function angleTo(facing: number, fromX: number, fromZ: number, x: number, z: number): number {
  const a = Math.atan2(x - fromX, z - fromZ) - facing;
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function swingHits(enc: Encounter, p: PlayerState): void {
  const f = enc.fighter;
  const heavy = f.action === 'sained';
  const w = WEAPONS[f.weapon];
  const windup = heavy ? PC.sained.windup : w.windup;
  const active = heavy ? PC.sained.active : w.active;
  if (f.t < windup || f.t >= windup + active) return;
  const reach = heavy ? PC.sained.reach : w.reach;
  const halfArc = heavy ? PC.sained.halfArc : w.halfArc;
  for (let i = 0; i < enc.dead.length; i++) {
    const u = enc.dead[i]!;
    if (f.hitMask & (1 << i) || !targetable(u)) continue;
    if (Math.hypot(u.x - p.x, u.z - p.z) > reach + UT.radius) continue;
    if (Math.abs(angleTo(p.facing, p.x, p.z, u.x, u.z)) > halfArc) continue;
    f.hitMask |= 1 << i;
    // A blow on one reeling from a deflect, or on its knees, lands harder: the follow-up.
    const opened = u.state === 'reel' || u.state === 'broken';
    enc.events.push({ kind: 'hit', enemy: i, heavy: heavy || opened, weapon: f.weapon });
    hitUnburied(enc, i, (heavy ? PC.sained.damage : w.damage) * (opened ? UT.openedDamage : 1), heavy ? PC.sained.breakPerHit : w.breakPerHit, w.canLay);
    enc.hitStop = UT.hitStop;
  }
}

function drainResolve(enc: Encounter, amount: number): void {
  const f = enc.fighter;
  f.resolve = Math.max(0, f.resolve - amount);
  if (f.resolve === 0 && f.action !== 'broken' && f.action !== 'dead') {
    setAction(f, 'broken');
    enc.events.push({ kind: 'playerBroken' });
  }
}

// --- the dead ---

function setState(u: Unburied, state: UnburiedState, duration = 0): void {
  u.state = state;
  u.t = 0;
  u.duration = duration;
}

function range(rng: RngState, r: readonly [number, number]): number {
  return Math.round(r[0] + rngNext(rng) * (r[1] - r[0]));
}

/** A blow lands. `lays`: the blade is iron from the howe, so one it cuts down stays down; the knife's get back up. */
function hitUnburied(enc: Encounter, i: number, damage: number, breakAmount: number, lays: boolean): void {
  const u = enc.dead[i]!;
  const opened = u.state === 'reel' || u.state === 'broken';
  u.health -= damage;
  u.break = Math.min(UT.maxBreak, u.break + breakAmount * (opened ? 1.5 : 1));
  if (u.health <= 0) {
    u.health = 0;
    enc.events.push({ kind: 'enemyDown', enemy: i });
    if (lays) {
      setState(u, 'rested');
      enc.events.push({ kind: 'rested', enemy: i, name: u.name, rite: false });
    } else setState(u, 'downed', range(enc.rng, UT.downedTicks));
  } else if (u.state !== 'broken' && u.break >= UT.maxBreak) {
    setState(u, 'broken', UT.brokenTicks);
    enc.events.push({ kind: 'enemyBroken', enemy: i });
  } else if (u.state === 'idle' || u.state === 'stalk' || u.state === 'still' || u.state === 'recover' || u.state === 'home') {
    // A blow staggers it between attacks, never out of one: the dead don't flinch mid-swing.
    setState(u, 'hurt', UT.hurtTicks);
  }
}

function stepUnburied(enc: Encounter, i: number, p: PlayerState, world: WorldDef, waterLevel: number, ctx: FightContext, dt: number): void {
  const u = enc.dead[i]!;
  const f = enc.fighter;
  u.t++;
  const dist = Math.hypot(p.x - u.x, p.z - u.z);
  // Seen within sight (further with the torch lit), or heard further still while the player sprints.
  const sight = Math.max(ctx.lit ? UT.sightLit : UT.sightDark, f.sprinting ? UT.hearSprint : 0);
  const canReach = !ctx.inRefuge && f.action !== 'dead';

  if (u.state === 'idle' || u.state === 'stalk' || u.state === 'still' || u.state === 'home') {
    u.break = Math.max(0, u.break - UT.breakDecay * dt);
  }

  switch (u.state) {
    case 'idle':
      turnToward(u, u.homeFacing, 1.5 * dt);
      if (canReach && dist < sight) {
        setState(u, 'stalk');
        u.gait = 0;
        enc.events.push({ kind: 'enemyNotice', enemy: i });
      }
      break;

    case 'home':
      if (canReach && dist < sight) {
        setState(u, 'stalk');
        break;
      }
      if (Math.hypot(u.homeX - u.x, u.homeZ - u.z) < 0.4) setState(u, 'idle');
      else walkToward(u, u.homeX, u.homeZ, UT.shuffleSpeed, world, waterLevel, dt);
      break;

    case 'stalk': {
      if (!canReach || dist > UT.loseInterest) {
        setState(u, 'home');
        break;
      }
      if (dist <= UT.attack.reach * 0.9 + PLAYER_TUNING.radius) {
        setState(u, 'windup', range(enc.rng, UT.attack.windup));
        u.feint = rngNext(enc.rng) < UT.feintChance;
        u.struck = false;
        enc.events.push({ kind: 'enemyWindup', enemy: i });
        break;
      }
      if (--u.gait <= 0) {
        if (rngNext(enc.rng) < UT.stillChance) {
          setState(u, 'still', range(enc.rng, UT.stillTicks));
          break;
        }
        u.lurching = !u.lurching;
        u.gait = range(enc.rng, u.lurching ? UT.lurchTicks : UT.shuffleTicks);
      }
      walkToward(u, p.x, p.z, u.lurching ? UT.lurchSpeed : UT.shuffleSpeed, world, waterLevel, dt);
      break;
    }

    case 'still':
      // Gone still, watching. Close enough and it strikes from stillness.
      turnToward(u, Math.atan2(p.x - u.x, p.z - u.z), 2 * dt);
      if (u.t >= u.duration || (canReach && dist <= UT.attack.reach * 0.9 + PLAYER_TUNING.radius)) setState(u, 'stalk');
      break;

    case 'windup':
      turnToward(u, Math.atan2(p.x - u.x, p.z - u.z), 4 * dt);
      if (u.t === u.duration - (UT.tellTicks - UT.attack.impactTick)) enc.events.push({ kind: 'enemyTell', enemy: i });
      if (u.t >= u.duration) {
        if (u.feint) {
          enc.events.push({ kind: 'feint', enemy: i });
          setState(u, 'still', 18);
        } else {
          setState(u, 'strike', UT.attack.active);
          enc.events.push({ kind: 'enemyStrike', enemy: i });
        }
      }
      break;

    case 'strike':
      walkForward(u, 2.4, world, waterLevel, dt);
      // The blow lands when the arm comes down on the player, not as it starts to fall.
      if (!u.struck && u.t >= UT.attack.impactTick) strikePlayer(enc, i, p);
      if (u.t >= u.duration) setState(u, 'recover', UT.attack.recovery);
      break;

    case 'reel':
      // Thrown back a step by the deflect.
      if (u.t <= UT.reelPushTicks) walkForward(u, -UT.reelPushSpeed, world, waterLevel, dt);
      if (u.t >= u.duration) setState(u, 'stalk');
      break;

    case 'recover':
    case 'hurt':
      if (u.t >= u.duration) setState(u, 'stalk');
      break;

    case 'broken':
      if (u.t >= u.duration) {
        u.break = UT.breakAfterRecover;
        setState(u, 'stalk');
      }
      break;

    case 'downed':
      if (u.t >= u.duration) {
        setState(u, 'rising', UT.risingTicks);
        enc.events.push({ kind: 'enemyRise', enemy: i });
        if (dist < UT.riseDreadReach) drainResolve(enc, UT.riseDread);
      }
      break;

    case 'rising':
      if (u.t >= u.duration) {
        u.rises++;
        u.maxHealth = Math.round(u.maxHealth * UT.riseHealthGain);
        u.health = u.maxHealth;
        u.break = 0;
        setState(u, 'stalk');
      }
      break;

    case 'rested':
      break;
  }
}

function strikePlayer(enc: Encounter, i: number, p: PlayerState): void {
  const u = enc.dead[i]!;
  const f = enc.fighter;
  const a = UT.attack;
  if (Math.hypot(p.x - u.x, p.z - u.z) > a.reach + PLAYER_TUNING.radius) return;
  if (Math.abs(angleTo(u.facing, u.x, u.z, p.x, p.z)) > a.halfArc) return;
  if (f.action === 'step' && f.t >= PC.step.invulnerableFrom && f.t < PC.step.invulnerableTo) return;
  u.struck = true;
  const breaks = WEAPONS[f.weapon].canLay;

  if (f.action === 'deflect' && f.t < f.perfect) {
    if (breaks) u.break = Math.min(UT.maxBreak, u.break + UT.breakPerPerfectDeflect);
    f.resolve = Math.min(PC.maxResolve, f.resolve + PC.perfectDeflectResolve);
    enc.hitStop = UT.deflectStop;
    f.met = true;
    enc.events.push({ kind: 'perfectDeflect', enemy: i });
    enc.events.push({ kind: 'deflectTiming', result: 'perfect', ticks: f.t });
    if (u.break >= UT.maxBreak) {
      setState(u, 'broken', UT.brokenTicks);
      enc.events.push({ kind: 'enemyBroken', enemy: i });
    } else {
      setState(u, 'reel', UT.reelTicks);
    }
    return;
  }
  if (f.action === 'deflect') {
    if (breaks) u.break = Math.min(UT.maxBreak, u.break + UT.breakPerGuard);
    enc.events.push({ kind: 'guard', enemy: i });
    enc.events.push(f.perfect === 0 ? { kind: 'deflectTiming', result: 'tooSoon', ticks: 0 } : { kind: 'deflectTiming', result: 'early', ticks: f.t - f.perfect + 1 });
    drainResolve(enc, PC.deflect.guardResolveCost);
    return;
  }
  // Struck: say why the deflect didn't meet it, if one was tried.
  if (f.deflectBuffer > 0) {
    f.deflectBuffer = 0;
    enc.events.push({ kind: 'deflectTiming', result: 'busy', ticks: 0 });
  } else if (f.sinceDeflectStart < 45) {
    enc.events.push(f.perfect === 0 ? { kind: 'deflectTiming', result: 'tooSoon', ticks: 0 } : { kind: 'deflectTiming', result: 'early', ticks: f.sinceDeflectStart - f.perfect + 1 });
  } else f.sinceStruck = 0;
  f.health = Math.max(0, f.health - a.damage);
  enc.events.push({ kind: 'hurt', enemy: i });
  if (f.health === 0) {
    setAction(f, 'dead');
    enc.deadFor = 0;
    enc.events.push({ kind: 'playerDead' });
    return;
  }
  // Knocked out of whatever the player was doing, unless already broken (still defenceless).
  if (f.action !== 'broken') setAction(f, 'hurt');
  drainResolve(enc, a.spiritWound);
}

function turnToward(u: Unburied, target: number, maxStep: number): void {
  const d = Math.atan2(Math.sin(target - u.facing), Math.cos(target - u.facing));
  u.facing += Math.max(-maxStep, Math.min(maxStep, d));
}

function walkToward(u: Unburied, x: number, z: number, speed: number, world: WorldDef, waterLevel: number, dt: number): void {
  turnToward(u, Math.atan2(x - u.x, z - u.z), 5 * dt);
  walkForward(u, speed, world, waterLevel, dt);
}

function walkForward(u: Unburied, speed: number, world: WorldDef, waterLevel: number, dt: number): void {
  const dx = Math.sin(u.facing) * speed * dt;
  const dz = Math.cos(u.facing) * speed * dt;
  if (deadCanStand(world, u.x + dx, u.z, waterLevel)) u.x += dx;
  if (deadCanStand(world, u.x, u.z + dz, waterLevel)) u.z += dz;
}

/** Keep bodies out of each other and out of the walls. */
function separate(enc: Encounter, p: PlayerState, world: WorldDef): void {
  const minPlayer = UT.radius + PLAYER_TUNING.radius;
  for (let i = 0; i < enc.dead.length; i++) {
    const u = enc.dead[i]!;
    if (u.state === 'rested') continue;
    if (targetable(u)) {
      const dx = u.x - p.x;
      const dz = u.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < minPlayer && d > 1e-6) {
        u.x = p.x + (dx / d) * minPlayer;
        u.z = p.z + (dz / d) * minPlayer;
      }
      for (let j = i + 1; j < enc.dead.length; j++) {
        const o = enc.dead[j]!;
        if (!targetable(o)) continue;
        const ex = o.x - u.x;
        const ez = o.z - u.z;
        const e = Math.hypot(ex, ez);
        if (e < UT.radius * 2 && e > 1e-6) {
          const push = (UT.radius * 2 - e) / 2;
          u.x -= (ex / e) * push;
          u.z -= (ez / e) * push;
          o.x += (ex / e) * push;
          o.z += (ez / e) * push;
        }
      }
    }
    pos.x = u.x;
    pos.z = u.z;
    resolveCircleVsBoxes(pos, UT.radius, world.walls);
    u.x = pos.x;
    u.z = pos.z;
    u.y = world.groundAt(u.x, u.z).height;
  }
}
