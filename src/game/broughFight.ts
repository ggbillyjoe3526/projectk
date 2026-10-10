import { BoxGeometry, Color, ConeGeometry, Group, Mesh, MeshBasicNodeMaterial, MeshLambertNodeMaterial, PointLight, type Scene, Vector3 } from 'three/webgpu';
import { CombatSounds } from '../audio/combatSounds';
import { PLAYER_COMBAT as PC, type WeaponId } from '../config/combat';
import type { Placement } from '../content/level';
import { ClashSparks } from '../render/clashSparks';
import { PlayerWeapon, UnburiedFigures } from '../render/fighterFigures';
import type { GreyboxScene } from '../render/greyboxScene';
import { applyPs1Snap } from '../render/retro/ps1Snap';
import {
  type CombatEvent,
  createEncounter,
  createFighter,
  type DeflectTiming,
  type Encounter,
  type FightContext,
  type FighterInput,
  interactTarget,
  passTime,
  stepEncounter,
} from '../sim/combat/encounter';
import type { PlayerCommand, PlayerState } from '../sim/player';
import type { WorldDef } from '../sim/world/types';
import type { CombatHud } from '../ui/combatHud';

/**
 * The fight (concept v0.6 sections 3.2 to 3.4): the player starts empty-handed, then has the kitchen knife, which cuts
 * the dead down but never keeps them down, until they take the old sword from the howe slab in the kirk. This presents the encounter
 * (bodies, the blade, sparks, sounds, the gauges) and gives the rest of the game what it needs to rest and reload.
 */

/** Ticks after dying before waking at the last place rested: long enough to read DEAD. */
const WAKE_AFTER = 240;
/** The target mark: pale while the enemy is out of reach, the colour of blood once an attack would reach it. */
const MARK_FAR = new Color(0xcfc8b4);
const MARK_NEAR = new Color(0xc8402e);
const NO_EVENTS: readonly CombatEvent[] = [];

export class BroughFight {
  enc: Encounter;
  /** The blade in hand, kept through deaths and reloads. */
  private weaponId: WeaponId = 'none';
  private readonly arms: PlayerWeapon;
  private readonly figures: UnburiedFigures;
  private readonly swordOnSlab: Group;
  private readonly flash = new PointLight(0xfff4dc, 0, 7, 1.8);
  private flashLevel = 0;
  private shake = 0;
  private sounds: CombatSounds | null = null;
  /** Each body's position at the previous tick, for interpolation. */
  private readonly prevDead: { x: number; z: number }[];
  private readonly pending: CombatEvent[] = [];
  private readonly sparks: ClashSparks;
  private readonly clashAt = new Vector3();
  /** The deflect timing readout (F4); on in the prototype so the window can be learned and tuned. */
  readout = true;
  /** The last event shown was a guard: the timing line that follows it reads as a guard. */
  private guarded = false;
  /** Where the player stands, for placing the sparks between them and the enemy. */
  private player: PlayerState | null = null;
  /** Over the head of the enemy the player is squaring up to (sim `focus`). */
  private readonly mark: Mesh;
  private readonly markMaterial = new MeshBasicNodeMaterial({ color: MARK_FAR, transparent: true, opacity: 0.9, depthTest: false });

  constructor(
    scene: Scene,
    private readonly g: GreyboxScene,
    private readonly hud: CombatHud,
    private readonly swordAt: { x: number; z: number; top: number } | null,
    private readonly deadAt: readonly Placement[],
    private readonly seed: number,
  ) {
    const sword = swordAt;
    const dead = deadAt;
    this.enc = createEncounter(seed, 'none', dead);
    this.arms = new PlayerWeapon(g.player);
    this.figures = new UnburiedFigures(scene, dead.length);
    this.prevDead = this.enc.dead.map((u) => ({ x: u.x, z: u.z }));

    this.swordOnSlab = new Group();
    const steel = applyPs1Snap(new MeshLambertNodeMaterial({ color: 0x8e979c, emissive: new Color(0x0d1418) })) as MeshLambertNodeMaterial;
    const blade = new Mesh(new BoxGeometry(0.07, 0.025, 0.95), steel);
    const hilt = new Mesh(new BoxGeometry(0.24, 0.04, 0.05), steel);
    hilt.position.z = -0.47;
    this.swordOnSlab.add(blade, hilt);
    if (sword) this.swordOnSlab.position.set(sword.x, sword.top + 0.02, sword.z);
    this.swordOnSlab.rotation.y = 0.4;
    this.swordOnSlab.visible = sword !== null;
    // A small four-sided point, upside down, drawn over everything so a wall never hides it.
    const point = new ConeGeometry(0.13, 0.26, 4);
    point.rotateX(Math.PI);
    this.mark = new Mesh(point, this.markMaterial);
    this.mark.renderOrder = 10;
    this.mark.visible = false;
    scene.add(this.swordOnSlab, this.flash, this.mark);
    this.sparks = new ClashSparks(scene);
  }

  /** Start the fight's sounds in the island's mix. */
  attachAudio(ctx: AudioContext, bus: AudioNode): void {
    this.sounds = new CombatSounds(ctx, bus);
  }

  /** The encounter as plain data, for a checkpoint. */
  snapshot(): Encounter {
    return structuredClone({ ...this.enc, events: [] });
  }

  /** Back to a checkpoint. A blade stays in hand once taken, whatever the checkpoint says. */
  restore(encounter: Encounter): void {
    this.enc = structuredClone(encounter);
    // A checkpoint saved before sprinting and the target mark: fresh legs, nothing marked.
    this.enc.fighter = { ...createFighter(this.weaponId), ...this.enc.fighter };
    this.enc.focus ??= -1;
    this.enc.fighter.weapon = this.weaponId;
    this.syncPrev();
  }

  /** A new game: the dead as they first stood, empty-handed, and the sword back on its slab. */
  reset(): void {
    this.enc = createEncounter(this.seed, 'none', this.deadAt);
    this.weaponId = 'none';
    this.swordOnSlab.visible = this.swordAt !== null;
    this.syncPrev();
  }

  get weapon(): WeaponId {
    return this.weaponId;
  }

  /** A blade in hand (just taken, or already taken in a saved game). The sword leaves its slab. */
  arm(weapon: WeaponId): void {
    this.weaponId = weapon;
    this.enc.fighter.weapon = weapon;
    if (weapon === 'sword') this.swordOnSlab.visible = false;
  }

  /** Resting: health and Resolve back to full (the hearth), or only what's left (a refuge). */
  recover(full: boolean): void {
    if (!full) return;
    this.enc.fighter.health = PC.maxHealth;
    this.enc.fighter.resolve = PC.maxResolve;
  }

  /** Lose this much Resolve (a night waiting out the tide), never quite to zero. */
  wear(resolve: number): void {
    this.enc.fighter.resolve = Math.max(1, this.enc.fighter.resolve - resolve);
  }

  /** Hours have passed: the dead are back where they stood (sim passTime). */
  passTime(): void {
    passTime(this.enc);
    this.syncPrev();
  }

  /** The player is free to use something (not fighting, hurt, broken or down). */
  get free(): boolean {
    return this.enc.fighter.action === 'free';
  }

  private syncPrev(): void {
    this.enc.dead.forEach((u, i) => Object.assign(this.prevDead[i]!, { x: u.x, z: u.z }));
  }

  /** The player has died and lain long enough: time to wake at the hearth. */
  get wantsWake(): boolean {
    return this.enc.fighter.action === 'dead' && this.enc.deadFor >= WAKE_AFTER;
  }

  get listeningAllowed(): boolean {
    return this.enc.fighter.action === 'free';
  }

  /** One fixed tick, returning what happened in it. The caller has already spent E on anything the player used. */
  tick(input: FighterInput, cmd: PlayerCommand, p: PlayerState, world: WorldDef, waterLevel: number, ctx: FightContext, dt: number): readonly CombatEvent[] {
    this.syncPrev();
    stepEncounter(this.enc, input, cmd, p, world, waterLevel, ctx, dt);
    if (!this.enc.events.length) return NO_EVENTS;
    // Events wait here until the next drawn frame plays and shows them.
    const events = this.enc.events.splice(0);
    this.pending.push(...events);
    return events;
  }

  /** Per drawn frame: poses, effects, sounds, the HUD. Returns how hard the view should shake and squeeze. */
  /** `thingPrompt`: what E would do with something nearby, which takes the prompt over the fight's own. */
  present(p: PlayerState, alpha: number, frameDt: number, clock: number, now: number, thingPrompt: string | null): { shake: number; squeeze: number } {
    const f = this.enc.fighter;
    this.player = p;
    for (const e of this.pending) this.show(e, now);
    this.pending.length = 0;
    this.sparks.update(frameDt);

    this.arms.update(f, f.t + alpha);
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

    this.placeMark(p, alpha, clock);

    this.flashLevel = Math.max(0, this.flashLevel - frameDt * 7);
    this.flash.intensity = this.flashLevel * 9;
    const tip = this.arms.arm.localToWorld(this.flash.position.set(0, -1.2, 0));
    this.flash.position.copy(tip);
    this.shake = Math.max(0, this.shake - frameDt * 0.9);

    const resolve = f.resolve / PC.maxResolve;
    const low = f.resolve < PC.lowResolve;
    this.hud.setGauges(f.health / PC.maxHealth, resolve, low);
    this.hud.setStamina(f.stamina / PC.maxStamina, f.winded);
    this.hud.setDead(f.action === 'dead');
    this.hud.setPrompt(this.hud.reading || !this.free ? '' : (thingPrompt ?? this.promptHere(p)));
    this.hud.frame(now);

    const squeeze = f.action === 'broken' || f.action === 'dead' ? 1 : low ? 0.85 * (1 - f.resolve / PC.lowResolve) : 0;
    return { shake: this.shake, squeeze };
  }

  /** The target mark over the marked enemy's head, bobbing a little, turning red within striking reach. */
  private placeMark(p: PlayerState, alpha: number, clock: number): void {
    const i = this.enc.focus;
    const u = this.enc.dead[i];
    this.mark.visible = u !== undefined;
    if (!u) return;
    const prev = this.prevDead[i]!;
    const x = prev.x + (u.x - prev.x) * alpha;
    const z = prev.z + (u.z - prev.z) * alpha;
    this.mark.position.set(x, u.y + 2.05 + Math.sin(clock * 4) * 0.05, z);
    this.mark.rotation.y = clock * 1.5;
    this.markMaterial.color.copy(Math.hypot(x - p.x, z - p.z) <= PC.lockReach ? MARK_NEAR : MARK_FAR);
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

  /** The Rite or laying a body down, when one is in reach. */
  private promptHere(p: PlayerState): string {
    const f = this.enc.fighter;
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
