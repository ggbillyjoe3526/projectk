import { BoxGeometry, CapsuleGeometry, Color, Group, Mesh, MeshLambertNodeMaterial, type Scene } from 'three/webgpu';
import { PLAYER_COMBAT as PC, UNBURIED_TUNING as UT, WEAPONS } from '../config/combat';
import type { Encounter, Fighter, Unburied } from '../sim/combat/encounter';
import { applyPs1Snap } from './retro/ps1Snap';

/**
 * Greybox figures for the fight: the player's weapon arm, and the Unburied. Poses are read from the simulation's state
 * and its tick counters, so what you see is exactly what the fight is doing: a raised arm is a wind-up (the eye's
 * telegraph), Break shows as a cold light seeping out of the body rather than a bar, and a broken one kneels.
 */

function lambert(color: number): MeshLambertNodeMaterial {
  return applyPs1Snap(new MeshLambertNodeMaterial({ color })) as MeshLambertNodeMaterial;
}

function box(w: number, h: number, d: number, material: MeshLambertNodeMaterial, y = 0): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), material);
  m.position.y = y;
  m.castShadow = true;
  return m;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.min(1, Math.max(0, k));
const ease = (k: number): number => {
  const c = Math.min(1, Math.max(0, k));
  return c * c * (3 - 2 * c);
};

/** An arm pose: sweep (yaw: negative to the figure's right), lift (pitch: -π/2 points the arm straight ahead), roll. */
interface ArmPose {
  sweep: number;
  lift: number;
}

function setArm(arm: Group, p: ArmPose): void {
  arm.rotation.set(p.lift, p.sweep, 0, 'YXZ');
}

/** The player's weapon arm: a lever from the shoulder with the blade at its end, the knife or the sword. */
export class PlayerWeapon {
  readonly arm = new Group();
  private readonly sword: Mesh;
  private readonly knife: Mesh;
  private readonly steel = lambert(0x9aa3a8);

  constructor(parent: Group) {
    this.arm.position.set(0.3, 1.32, 0.02);
    const sleeve = box(0.1, 0.55, 0.1, lambert(0x2c3640), -0.27);
    this.arm.add(sleeve);
    const hilt = box(0.05, 0.16, 0.05, lambert(0x3a2c22), -0.62);
    this.arm.add(hilt);
    this.sword = box(0.07, 0.95, 0.025, this.steel, -1.17);
    const guard = box(0.24, 0.04, 0.05, this.steel, 0.47);
    this.sword.add(guard);
    this.arm.add(this.sword);
    this.knife = box(0.035, 0.24, 0.015, lambert(0xc8ccce), -0.82);
    this.arm.add(this.knife);
    this.steel.emissive = new Color(0x000000);
    parent.add(this.arm);
  }

  /** Pose the arm for the fighter's action; `t` is ticks into it, with the frame's fraction of a tick added. */
  update(f: Fighter, t: number): void {
    const hasSword = f.weapon === 'sword';
    this.sword.visible = hasSword;
    this.knife.visible = !hasSword;
    setArm(this.arm, armPose(f, t));
    // The sained strike's blessing: the blade warms as the charge builds.
    const glow = f.action === 'charge' ? Math.min(1, t / PC.sained.chargeTicks) : f.action === 'sained' ? 1 - t / 40 : 0;
    this.steel.emissive.setRGB(0.9 * glow, 0.75 * glow, 0.45 * glow);
  }
}

const REST: ArmPose = { sweep: -0.25, lift: -0.45 };

function armPose(f: Fighter, t: number): ArmPose {
  const w = WEAPONS[f.weapon];
  switch (f.action) {
    case 'attack': {
      // Three swings in a chain: right to left, left to right, then overhead.
      const mirror = f.chain === 1 ? -1 : 1;
      const overhead = f.chain === 2;
      const from: ArmPose = overhead ? { sweep: 0, lift: -2.7 } : { sweep: -1.5 * mirror, lift: -1.35 };
      const to: ArmPose = overhead ? { sweep: 0.1, lift: -0.35 } : { sweep: 1.25 * mirror, lift: -1.25 };
      if (t < w.windup) return mix(REST, from, ease(t / w.windup));
      if (t < w.windup + w.active) return mix(from, to, (t - w.windup) / w.active);
      return mix(to, REST, ease((t - w.windup - w.active) / w.recovery));
    }
    case 'charge': {
      const tremble = Math.sin(t * 1.7) * 0.03 * Math.min(1, t / PC.sained.chargeTicks);
      return { sweep: tremble, lift: lerp(-2.0, -2.95, t / PC.sained.chargeTicks) };
    }
    case 'sained': {
      const s = PC.sained;
      const high: ArmPose = { sweep: 0, lift: -2.95 };
      const low: ArmPose = { sweep: 0.05, lift: -0.2 };
      if (t < s.windup) return high;
      if (t < s.windup + s.active) return mix(high, low, (t - s.windup) / s.active);
      return mix(low, REST, ease((t - s.windup - s.active) / s.recovery));
    }
    case 'deflect':
      // Blade held across the body, snapping up fast.
      return mix(REST, { sweep: 1.15, lift: -1.25 }, ease(t / 3));
    case 'step':
      return { sweep: -0.5, lift: -0.2 };
    case 'hurt':
      return { sweep: -0.9, lift: -0.15 };
    case 'broken':
      return { sweep: -0.1, lift: 0.05 };
    case 'rite':
    case 'lay':
      // Point down, planted before the body.
      return { sweep: 0, lift: -0.25 };
    case 'dead':
    case 'free':
      return REST;
  }
}

function mix(a: ArmPose, b: ArmPose, k: number): ArmPose {
  return { sweep: lerp(a.sweep, b.sweep, k), lift: lerp(a.lift, b.lift, k) };
}

/** One of the dead, in greybox. */
class UnburiedFigure {
  readonly root = new Group();
  private readonly body: Mesh;
  private readonly armL = new Group();
  private readonly armR = new Group();
  readonly material = lambert(0x7b8576);

  constructor(scene: Scene) {
    this.material.emissive = new Color(0x000000);
    this.body = new Mesh(new CapsuleGeometry(0.24, 0.85, 4, 8), this.material);
    this.body.castShadow = true;
    this.body.position.y = 0.75;
    this.root.add(this.body);
    const head = box(0.25, 0.27, 0.27, this.material, 0.72);
    head.rotation.x = 0.35;
    this.body.add(head);
    for (const [arm, x] of [[this.armL, -0.3], [this.armR, 0.3]] as const) {
      arm.position.set(x, 0.42, 0);
      arm.add(box(0.09, 0.78, 0.09, this.material, -0.39));
      this.body.add(arm);
    }
    scene.add(this.root);
  }

  update(u: Unburied, x: number, z: number, t: number, clock: number): void {
    this.root.visible = !(u.state === 'rested' && t > 120);
    this.root.position.set(x, u.y, z);
    this.root.rotation.set(0, u.facing, 0);
    this.root.scale.setScalar(1);
    let hunch = 0.35;
    let sway = 0;
    let drop = 0;
    let armR: ArmPose = { sweep: 0, lift: 0.1 };
    let armL: ArmPose = { sweep: 0, lift: 0.1 };

    switch (u.state) {
      case 'idle':
      case 'home':
        hunch = 0.35;
        sway = Math.sin(clock * 0.9 + x) * 0.05;
        break;
      case 'stalk':
        hunch = u.lurching ? 0.6 : 0.42;
        sway = Math.sin(clock * (u.lurching ? 9 : 3) + x) * (u.lurching ? 0.22 : 0.1);
        armL = armR = { sweep: 0, lift: u.lurching ? -0.9 : -0.45 };
        break;
      case 'still':
        // Gone rigid, head cocked.
        hunch = 0.05;
        sway = 0.35;
        break;
      case 'windup': {
        const k = ease(t / Math.max(1, u.duration));
        hunch = lerp(0.4, -0.15, k);
        armR = { sweep: -0.3, lift: lerp(-0.4, -2.9, k) };
        armL = { sweep: 0.2, lift: -0.8 };
        break;
      }
      case 'strike': {
        const k = t / UT.attack.active;
        hunch = lerp(-0.15, 0.7, k);
        armR = { sweep: lerp(-0.3, 0.2, k), lift: lerp(-2.9, -0.4, k) };
        armL = { sweep: 0.2, lift: -0.6 };
        break;
      }
      case 'recover':
        hunch = lerp(0.7, 0.4, t / UT.attack.recovery);
        break;
      case 'reel':
        hunch = -0.45 + 0.2 * (t / UT.reelTicks);
        armR = { sweep: -1.1, lift: -0.5 };
        armL = { sweep: 1.1, lift: -0.5 };
        break;
      case 'hurt':
        hunch = -0.25;
        break;
      case 'broken':
        hunch = 0.95;
        drop = 0.45;
        armR = armL = { sweep: 0, lift: 0.25 };
        break;
      case 'downed':
        this.lie();
        break;
      case 'rising': {
        // Up in jerks, not smoothly.
        const k = Math.floor((t / UT.risingTicks) * 6) / 6;
        if (k < 0.5) this.lie(k * 2);
        hunch = lerp(1.2, 0.4, k);
        drop = lerp(0.5, 0, k);
        break;
      }
      case 'rested':
        // Sinks back into the ground it came from.
        this.root.position.y = u.y - Math.min(1.6, t / 70);
        hunch = 0.9;
        drop = 0.45;
        break;
    }
    if (u.state !== 'downed' && !(u.state === 'rising' && t / UT.risingTicks < 0.5)) {
      this.body.rotation.set(hunch, 0, sway);
      this.body.position.y = 0.75 - drop;
    }
    setArm(this.armR, armR);
    setArm(this.armL, armL);

    // Break, read on the body: a cold light seeping out, pulsing once it's broken.
    const b = u.break / UT.maxBreak;
    const glow = u.state === 'broken' ? 0.55 + 0.25 * Math.sin(clock * 6) : u.state === 'rested' ? 0.8 : Math.pow(b, 1.6) * 0.45;
    this.material.emissive.setRGB(0.55 * glow, 0.7 * glow, 0.85 * glow);
  }

  /** Flat on its back; `k` lifts it toward kneeling. */
  private lie(k = 0): void {
    this.body.rotation.set(lerp(-Math.PI / 2, -0.6, k), 0, 0);
    this.body.position.y = lerp(0.25, 0.5, k);
  }
}

export class UnburiedFigures {
  private readonly figures: UnburiedFigure[];

  constructor(scene: Scene, count: number) {
    this.figures = Array.from({ length: count }, () => new UnburiedFigure(scene));
  }

  /** `prev` holds each body's position at the previous tick, for interpolating by `alpha`. */
  update(enc: Encounter, prev: readonly { x: number; z: number }[], alpha: number, clock: number): void {
    enc.dead.forEach((u, i) => {
      const p = prev[i] ?? u;
      this.figures[i]?.update(u, lerp(p.x, u.x, alpha), lerp(p.z, u.z, alpha), u.t + alpha, clock);
    });
  }
}
