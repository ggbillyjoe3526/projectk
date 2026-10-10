import { BoxGeometry, Color, Group, Mesh, MeshLambertNodeMaterial, PointLight, type Scene, Vector3 } from 'three/webgpu';
import { CombatSounds } from '../audio/combatSounds';
import { PLAYER_COMBAT as PC, type WeaponId } from '../config/combat';
import type { LevelPlaces } from '../content/level';
import { PLAYER_TUNING } from '../config/player';
import { ClashSparks } from '../render/clashSparks';
import { PlayerWeapon, UnburiedFigures } from '../render/fighterFigures';
import type { GreyboxScene } from '../render/greyboxScene';
import { applyPs1Snap } from '../render/retro/ps1Snap';
import {
  type CombatEvent,
  createEncounter,
  type DeflectTiming,
  type Encounter,
  type FightContext,
  type FighterInput,
  interactTarget,
  stepEncounter,
} from '../sim/combat/encounter';
import type { PlayerCommand, PlayerState } from '../sim/player';
import type { WorldDef } from '../sim/world/types';
import type { CombatHud } from '../ui/combatHud';

/**
 * The M1 fight on the Brough's greybox (concept v0.6 sections 3.2 to 3.4): the player starts with the kitchen knife,
 * which cuts the dead down but never keeps them down; the note on the cottage table says why; the old sword lies on the
 * howe slab past the dyke. Resting at the hearth restores the player and is where a death reloads to.
 */

/** Read at the cottage table. */
const NOTE = [
  'From your father’s notebook, the last page written:',
  'The knife won’t do it. Nothing will that wasn’t in the ground with them.',
  'Iron from the howe. Nothing else will lay them.',
  'When one goes down on its knees, say the words over it, and it stays down for good.',
  'The old blade is on the slab past the dyke, where they opened the howe.',
] as const;

/** Ticks after dying before waking at the hearth. */
const WAKE_AFTER = 150;
const ITEM_REACH = 1.6;

type Place = 'hearth' | 'note' | 'sword';

export interface FightSnapshot {
  readonly encounter: Encounter;
  readonly swordTaken: boolean;
}

export class BroughFight {
  enc: Encounter;
  private swordTaken: boolean;
  private noteRead = false;
  private readonly weapon: PlayerWeapon;
  private readonly figures: UnburiedFigures;
  private readonly swordOnSlab: Group;
  private readonly flash = new PointLight(0xfff4dc, 0, 7, 1.8);
  private flashLevel = 0;
  private shake = 0;
  private sounds: CombatSounds | null = null;
  /** Each body's position at the previous tick, for interpolation. */
  private readonly prevDead: { x: number; z: number }[];
  /** The knife has dropped one of the dead and watched it get up: the note now matters. */
  private sawRise = false;
  private readonly pending: CombatEvent[] = [];
  private readonly sparks: ClashSparks;
  private readonly clashAt = new Vector3();
  /** The deflect timing readout (F4); on in the prototype so the window can be learned and tuned. */
  readout = true;
  /** The last event shown was a guard: the timing line that follows it reads as a guard. */
  private guarded = false;
  /** Where the player stands, for placing the sparks between them and the enemy. */
  private player: PlayerState | null = null;

  constructor(
    scene: Scene,
    private readonly g: GreyboxScene,
    private readonly hud: CombatHud,
    private readonly places: LevelPlaces,
    private readonly seed: number,
    weapon: WeaponId,
  ) {
    this.enc = createEncounter(seed, weapon, places.dead);
    this.swordTaken = weapon === 'sword';
    this.weapon = new PlayerWeapon(g.player);
    this.figures = new UnburiedFigures(scene, places.dead.length);
    this.prevDead = this.enc.dead.map((u) => ({ x: u.x, z: u.z }));

    this.swordOnSlab = new Group();
    const steel = applyPs1Snap(new MeshLambertNodeMaterial({ color: 0x8e979c, emissive: new Color(0x0d1418) })) as MeshLambertNodeMaterial;
    const blade = new Mesh(new BoxGeometry(0.07, 0.025, 0.95), steel);
    const hilt = new Mesh(new BoxGeometry(0.24, 0.04, 0.05), steel);
    hilt.position.z = -0.47;
    this.swordOnSlab.add(blade, hilt);
    this.swordOnSlab.position.set(places.sword.x, places.sword.top + 0.02, places.sword.z);
    this.swordOnSlab.rotation.y = 0.4;
    this.swordOnSlab.visible = !this.swordTaken;
    scene.add(this.swordOnSlab, this.flash);
    this.sparks = new ClashSparks(scene);
  }

  /** Start the fight's sounds in the island's mix. */
  attachAudio(ctx: AudioContext, bus: AudioNode): void {
    this.sounds = new CombatSounds(ctx, bus);
  }

  snapshot(): FightSnapshot {
    return { encounter: structuredClone({ ...this.enc, events: [] }), swordTaken: this.swordTaken };
  }

  restore(s: FightSnapshot): void {
    this.enc = structuredClone(s.encounter);
    this.swordTaken = s.swordTaken;
    this.swordOnSlab.visible = !this.swordTaken;
    this.enc.dead.forEach((u, i) => Object.assign(this.prevDead[i]!, { x: u.x, z: u.z }));
  }

  /** The player has died and lain long enough: time to wake at the hearth. */
  get wantsWake(): boolean {
    return this.enc.fighter.action === 'dead' && this.enc.deadFor >= WAKE_AFTER;
  }

  get listeningAllowed(): boolean {
    return this.enc.fighter.action === 'free';
  }

  /**
   * One fixed tick. E is spent on the reader, the hearth, the note or the sword before the fight sees it. Returns true
   * when the player rests at the hearth (the caller saves the checkpoint).
   */
  tick(input: FighterInput, cmd: PlayerCommand, p: PlayerState, world: WorldDef, waterLevel: number, ctx: FightContext, dt: number, now: number): boolean {
    let rested = false;
    if (this.hud.reading) {
      if (input.interactPressed) this.hud.closeReader();
      cmd.moveX = cmd.moveZ = 0;
      input.interactPressed = input.attackPressed = input.deflectPressed = input.stepPressed = false;
    } else if (input.interactPressed && this.enc.fighter.action === 'free') {
      const place = this.placeHere(p);
      if (place) {
        input.interactPressed = false;
        rested = this.use(place, now);
      }
    }
    this.enc.dead.forEach((u, i) => Object.assign(this.prevDead[i]!, { x: u.x, z: u.z }));
    stepEncounter(this.enc, input, cmd, p, world, waterLevel, ctx, dt);
    // Events wait here until the next drawn frame plays and shows them.
    if (this.enc.events.length) {
      this.pending.push(...this.enc.events);
      this.enc.events.length = 0;
    }
    return rested;
  }

  /** Per drawn frame: poses, effects, sounds, the HUD. Returns how hard the view should shake and squeeze. */
  present(p: PlayerState, alpha: number, frameDt: number, clock: number, now: number): { shake: number; squeeze: number } {
    const f = this.enc.fighter;
    this.player = p;
    for (const e of this.pending) this.show(e, now);
    this.pending.length = 0;
    this.sparks.update(frameDt);

    this.weapon.update(f, f.t + alpha);
    this.figures.update(this.enc, this.prevDead, alpha, clock);

    // The player's body: kneeling for the Rite, slumped when broken, down when dead.
    const g = this.g;
    g.player.rotation.z = 0;
    if (f.action === 'rite' || f.action === 'lay') {
      g.playerBody.position.y = 0.48;
      g.playerBody.rotation.x = 0.3;
    } else if (f.action === 'broken') {
      g.playerBody.position.y = 0.66;
      g.playerBody.rotation.x = 0.55;
    } else if (f.action === 'hurt') {
      g.playerBody.rotation.x = -0.3 * (1 - f.t / PC.hurtTicks);
    } else if (f.action === 'dead') {
      g.player.rotation.z = Math.min(1, f.t / 30) * (Math.PI / 2);
      g.playerBody.position.y = 0.8 - Math.min(1, f.t / 30) * 0.55;
    }

    this.flashLevel = Math.max(0, this.flashLevel - frameDt * 7);
    this.flash.intensity = this.flashLevel * 9;
    const tip = this.weapon.arm.localToWorld(this.flash.position.set(0, -1.2, 0));
    this.flash.position.copy(tip);
    this.shake = Math.max(0, this.shake - frameDt * 0.9);

    const resolve = f.resolve / PC.maxResolve;
    const low = f.resolve < PC.lowResolve;
    this.hud.setGauges(f.health / PC.maxHealth, resolve, low);
    this.hud.setPrompt(this.promptHere(p));
    this.hud.frame(now);

    const squeeze = f.action === 'broken' || f.action === 'dead' ? 1 : low ? 0.85 * (1 - f.resolve / PC.lowResolve) : 0;
    return { shake: this.shake, squeeze };
  }

  private show(e: CombatEvent, now: number): void {
    this.sounds?.play(e);
    switch (e.kind) {
      case 'perfectDeflect':
        this.flashLevel = 1;
        this.shake = Math.max(this.shake, 0.09);
        this.clash('perfect', e.enemy);
        this.hud.flashScreen(0.22);
        break;
      case 'guard':
        this.flashLevel = Math.max(this.flashLevel, 0.35);
        this.shake = Math.max(this.shake, 0.05);
        this.clash('guard', e.enemy);
        this.guarded = true;
        return;
      case 'deflectTiming':
        if (this.readout) this.hud.showTiming(...timingLine(e.result, e.ticks, this.guarded), now);
        break;
      case 'hit':
        this.shake = Math.max(this.shake, e.heavy ? 0.1 : 0.045);
        break;
      case 'hurt':
        this.shake = Math.max(this.shake, 0.16);
        break;
      case 'enemyRise':
        if (!this.sawRise && this.enc.fighter.weapon === 'knife') {
          this.sawRise = true;
          this.hud.say('It’s getting up again.', now);
        }
        break;
      case 'rested':
        this.hud.say(e.rite ? `${e.name}. At rest.` : `${e.name}. Laid down.`, now, 6);
        break;
      case 'playerBroken':
        this.hud.say('Your nerve goes.', now, 3);
        break;
      case 'playerDead':
        this.hud.say('…', now, 2);
        break;
      default:
        break;
    }
    this.guarded = false;
  }

  /** Sparks where the blades meet: between the player and the enemy, at chest height. */
  private clash(kind: 'perfect' | 'guard', enemy: number): void {
    const u = this.enc.dead[enemy];
    const p = this.player;
    if (!u || !p) return;
    const dx = u.x - p.x;
    const dz = u.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const along = Math.min(0.8, d * 0.5);
    this.clashAt.set(p.x + (dx / d) * along, p.y + 1.35, p.z + (dz / d) * along);
    this.sparks.burst(kind, this.clashAt, dx / d, dz / d);
  }

  toggleReadout(now: number): void {
    this.readout = !this.readout;
    this.hud.say(this.readout ? 'Deflect timing shown' : 'Deflect timing hidden', now, 2);
  }

  private placeHere(p: PlayerState): Place | null {
    const near = (q: { x: number; z: number }): boolean => Math.hypot(q.x - p.x, q.z - p.z) < ITEM_REACH + PLAYER_TUNING.radius;
    if (near(this.places.hearth)) return 'hearth';
    if (near(this.places.note)) return 'note';
    if (!this.swordTaken && near(this.places.sword)) return 'sword';
    return null;
  }

  private use(place: Place, now: number): boolean {
    const f = this.enc.fighter;
    switch (place) {
      case 'hearth':
        f.health = PC.maxHealth;
        f.resolve = PC.maxResolve;
        this.hud.say('You rest by the hearth a while.', now, 3);
        return true;
      case 'note':
        this.noteRead = true;
        this.hud.read(NOTE);
        return false;
      case 'sword':
        this.swordTaken = true;
        this.swordOnSlab.visible = false;
        f.weapon = 'sword';
        this.hud.say('Iron from the howe.', now, 4);
        return false;
    }
  }

  private promptHere(p: PlayerState): string {
    if (this.hud.reading) return '';
    const f = this.enc.fighter;
    if (f.action !== 'free') return '';
    const place = this.placeHere(p);
    if (place === 'hearth') return 'E  Rest by the hearth';
    if (place === 'note') return this.noteRead ? 'E  Read the note again' : 'E  Read the note';
    if (place === 'sword') return 'E  Take the sword';
    const target = interactTarget(this.enc, p);
    if (target?.rite) return f.resolve >= PC.rite.cost ? 'E  The Rite' : 'Not enough Resolve for the Rite';
    if (target) return f.resolve >= PC.layFallen.cost ? `E  Lay the body down (${PC.layFallen.cost} Resolve)` : '';
    return '';
  }

  /** Lines for the debug overlay. */
  debugStats(): Record<string, string | number> {
    const f = this.enc.fighter;
    return {
      fight: `${f.weapon} ${f.action} t${f.t}, health ${f.health.toFixed(0)}, resolve ${f.resolve.toFixed(0)}`,
      dead: this.enc.dead.map((u) => `${u.state}${u.state === 'downed' ? '' : ` h${u.health.toFixed(0)} b${u.break.toFixed(0)}`}`).join(' | '),
      'fight seed': this.seed,
    };
  }
}

/** The readout's line for a deflect: what happened, and by how much, in milliseconds. */
export function timingLine(result: DeflectTiming, ticks: number, guarded: boolean): [string, 'good' | 'near' | 'miss'] {
  const ms = Math.round((ticks * 1000) / 60);
  switch (result) {
    case 'perfect':
      return ['Deflected', 'good'];
    case 'early':
      // Held well before the blow: a guard by choice, not a mistimed deflect.
      if (guarded && ms > 400) return ['Guarded', 'near'];
      return [guarded ? `Guarded, ${ms} ms early` : `${ms} ms early`, guarded ? 'near' : 'miss'];
    case 'late':
      return [`${ms} ms late`, 'miss'];
    case 'tooSoon':
      return [guarded ? 'Guarded, pressed again too soon' : 'Pressed again too soon', guarded ? 'near' : 'miss'];
    case 'busy':
      return ['Mid-swing, too busy to deflect', 'miss'];
  }
}
