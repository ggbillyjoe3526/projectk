import { describe, expect, it } from 'vitest';
import { PLAYER_COMBAT as PC, UNBURIED_TUNING as UT, WEAPONS } from '../../config/combat';
import { SIM_DT } from '../../config/sim';
import type { PlayerCommand, PlayerState } from '../player';
import { loadLevel } from '../../content/level';
import { HAUGSAY } from '../../content/levels/haugsay';
import type { WorldDef } from '../world/types';
import { createEncounter, deadCanStand, type Encounter, type FightContext, type FighterInput, interactTarget, perfectWindow, stepEncounter } from './encounter';

/** Open flat shore with no walls. */
const flat: WorldDef = {
  walls: [],
  props: [],
  groundAt: () => ({ height: 0, kind: 'shore' }),
  listeningPosts: [],
  spawn: { x: 0, z: 0, facing: 0 },
};
const broughGreybox = loadLevel(HAUGSAY).sim;
const ctx: FightContext = { lit: true, dark: false, inRefuge: false };

const none = (): FighterInput => ({ attackHeld: false, attackPressed: false, deflectHeld: false, deflectPressed: false, stepPressed: false, interactPressed: false });
const still = (): PlayerCommand => ({ moveX: 0, moveZ: 0, aimX: null, aimZ: null, listen: false, speedScale: 1, turn: true });

/** The player at the origin facing +z, one of the dead `d` metres in front facing back at them. */
function duel(weapon: 'knife' | 'sword', d = 1.5): { enc: Encounter; p: PlayerState } {
  const enc = createEncounter(7, weapon, [{ x: 0, z: d, facing: Math.PI }]);
  const p: PlayerState = { x: 0, z: 0, y: 0, facing: 0, listening: false, depth: 0 };
  return { enc, p };
}

function tick(enc: Encounter, p: PlayerState, input: Partial<FighterInput> = {}, cmd: PlayerCommand = still()): void {
  stepEncounter(enc, { ...none(), ...input }, cmd, p, flat, -10, ctx, SIM_DT);
}

/** Run ticks, skipping hit-stop so counts are of real fight ticks. */
function run(enc: Encounter, p: PlayerState, n: number, input: Partial<FighterInput> = {}): void {
  for (let i = 0; i < n; i++) {
    tick(enc, p, input);
    while (enc.hitStop > 0) tick(enc, p, input);
  }
}

/** Freeze the enemy's AI into an attack whose blow lands on the tick after the next `ticks`. */
function windup(enc: Encounter, ticks: number): void {
  const u = enc.dead[0]!;
  const before = ticks + 1 - UT.attack.impactTick;
  const attack = before >= 1 ? { state: 'windup', t: 0, duration: before } : { state: 'strike', t: -before, duration: UT.attack.active };
  Object.assign(u, attack, { feint: false, struck: false, facing: Math.PI });
}

/** Keep the enemy from attacking (it stands recovering) so a test sees only the player's moves. */
function pacify(enc: Encounter): void {
  Object.assign(enc.dead[0]!, { state: 'recover', t: 0, duration: 1e9 });
}

describe('attacks', () => {
  it('a light swing hits the enemy in front once', () => {
    const { enc, p } = duel('sword');
    tick(enc, p, { attackPressed: true, attackHeld: true });
    run(enc, p, WEAPONS.sword.windup + WEAPONS.sword.active + 2);
    expect(enc.dead[0]!.health).toBe(UT.health - WEAPONS.sword.damage);
    expect(enc.events.filter((e) => e.kind === 'hit')).toHaveLength(1);
  });

  it('misses an enemy behind', () => {
    const { enc, p } = duel('sword');
    p.facing = Math.PI;
    tick(enc, p, { attackPressed: true });
    run(enc, p, 30);
    expect(enc.dead[0]!.health).toBe(UT.health);
  });

  it('a held first swing charges into a sained strike that costs Resolve', () => {
    const { enc, p } = duel('sword');
    pacify(enc);
    const before = enc.fighter.resolve;
    tick(enc, p, { attackPressed: true, attackHeld: true });
    run(enc, p, WEAPONS.sword.windup + PC.sained.chargeTicks + 2, { attackHeld: true });
    expect(enc.fighter.action).toBe('charge');
    run(enc, p, PC.sained.windup + PC.sained.active + 1);
    expect(enc.fighter.resolve).toBe(before - PC.sained.cost);
    expect(enc.events.some((e) => e.kind === 'hit' && e.heavy)).toBe(true);
    expect(enc.dead[0]!.health).toBe(UT.health - PC.sained.damage);
  });

  it('letting go before the charge is full lands a plain blow and costs nothing', () => {
    const { enc, p } = duel('sword');
    pacify(enc);
    const before = enc.fighter.resolve;
    tick(enc, p, { attackPressed: true, attackHeld: true });
    run(enc, p, WEAPONS.sword.windup + 5, { attackHeld: true });
    run(enc, p, WEAPONS.sword.active + 2);
    expect(enc.fighter.resolve).toBe(before);
    expect(enc.dead[0]!.health).toBe(UT.health - WEAPONS.sword.damage);
  });
});

describe('the knife', () => {
  it('cuts the dead down but they rise again, stronger, and it can never lay them', () => {
    const { enc, p } = duel('knife');
    const u = enc.dead[0]!;
    u.health = 5;
    tick(enc, p, { attackPressed: true });
    run(enc, p, 20);
    expect(u.state).toBe('downed');
    expect(u.break).toBe(0);
    expect(interactTarget(enc, p)).toBeNull();
    run(enc, p, UT.downedTicks[1] + UT.risingTicks + 2);
    expect(u.rises).toBe(1);
    expect(u.maxHealth).toBeGreaterThan(UT.health);
    expect(u.state).not.toBe('downed');
  });
});

describe('deflect', () => {
  it('a perfect deflect staggers the enemy, builds Break and restores Resolve', () => {
    const { enc, p } = duel('sword');
    windup(enc, 1);
    const before = enc.fighter.resolve;
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    run(enc, p, 3, { deflectHeld: true });
    expect(enc.dead[0]!.state).toBe('reel');
    expect(enc.dead[0]!.break).toBeCloseTo(UT.breakPerPerfectDeflect, 0);
    expect(enc.fighter.resolve).toBe(before + PC.perfectDeflectResolve);
    expect(enc.fighter.health).toBe(PC.maxHealth);
  });

  it('a late deflect guards: no wound, but it costs Resolve', () => {
    const { enc, p } = duel('sword');
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    windup(enc, PC.deflect.perfectTicks + 4);
    const before = enc.fighter.resolve;
    run(enc, p, PC.deflect.perfectTicks + 8, { deflectHeld: true });
    expect(enc.events.some((e) => e.kind === 'guard')).toBe(true);
    expect(enc.fighter.health).toBe(PC.maxHealth);
    expect(enc.fighter.resolve).toBe(before - PC.deflect.guardResolveCost);
  });

  it('no deflect: the blow wounds body and nerve', () => {
    const { enc, p } = duel('sword');
    windup(enc, 1);
    run(enc, p, 4);
    expect(enc.fighter.health).toBe(PC.maxHealth - UT.attack.damage);
    expect(enc.fighter.resolve).toBe(PC.startResolve - UT.attack.spiritWound);
    expect(enc.fighter.action).toBe('hurt');
  });

  it('pressing again straight after a deflect has no perfect window', () => {
    const { enc, p } = duel('sword', 6);
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    run(enc, p, PC.deflect.minTicks + 1);
    expect(enc.fighter.action).toBe('free');
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    expect(enc.fighter.perfect).toBe(0);
  });

  it('says how each deflect was timed: perfect, early, late or too soon', () => {
    const timing = (enc: Encounter) => enc.events.filter((e) => e.kind === 'deflectTiming');

    const perfect = duel('sword');
    windup(perfect.enc, 3);
    tick(perfect.enc, perfect.p, { deflectPressed: true, deflectHeld: true });
    run(perfect.enc, perfect.p, 5, { deflectHeld: true });
    expect(timing(perfect.enc)).toEqual([{ kind: 'deflectTiming', result: 'perfect', ticks: 3 }]);

    const early = duel('sword');
    tick(early.enc, early.p, { deflectPressed: true, deflectHeld: true });
    windup(early.enc, PC.deflect.perfectTicks + 4);
    run(early.enc, early.p, PC.deflect.perfectTicks + 8, { deflectHeld: true });
    expect(timing(early.enc)).toEqual([{ kind: 'deflectTiming', result: 'early', ticks: 6 }]);

    const late = duel('sword');
    windup(late.enc, 1);
    run(late.enc, late.p, 4);
    expect(late.enc.fighter.action).toBe('hurt');
    tick(late.enc, late.p, { deflectPressed: true, deflectHeld: true });
    expect(timing(late.enc)).toEqual([{ kind: 'deflectTiming', result: 'late', ticks: 3 }]);

    const tooSoon = duel('sword');
    tick(tooSoon.enc, tooSoon.p, { deflectPressed: true, deflectHeld: true });
    run(tooSoon.enc, tooSoon.p, PC.deflect.minTicks + 1);
    windup(tooSoon.enc, 2);
    tick(tooSoon.enc, tooSoon.p, { deflectPressed: true, deflectHeld: true });
    run(tooSoon.enc, tooSoon.p, 4, { deflectHeld: true });
    expect(timing(tooSoon.enc)).toEqual([{ kind: 'deflectTiming', result: 'tooSoon', ticks: 0 }]);
  });

  it('a press mid-swing waits and deflects as soon as the swing allows', () => {
    const { enc, p } = duel('sword', 6);
    const w = WEAPONS.sword;
    tick(enc, p, { attackPressed: true });
    run(enc, p, w.windup + 1);
    expect(enc.fighter.action).toBe('attack');
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    expect(enc.fighter.action).toBe('attack');
    run(enc, p, w.active, { deflectHeld: true });
    expect(enc.fighter.action).toBe('deflect');
    expect(enc.fighter.perfect).toBe(PC.deflect.perfectTicks);
  });

  it('a press during a hit-stop still counts', () => {
    const { enc, p } = duel('sword', 6);
    enc.hitStop = 5;
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    expect(enc.fighter.action).toBe('free');
    for (let i = 0; i < 5; i++) tick(enc, p, { deflectHeld: true });
    expect(enc.fighter.action).toBe('deflect');
  });

  it('a press is dropped if the player is busy too long', () => {
    const { enc, p } = duel('sword', 6);
    enc.fighter.action = 'hurt';
    tick(enc, p, { deflectPressed: true });
    run(enc, p, PC.hurtTicks + 2);
    expect(enc.fighter.action).toBe('free');
  });

  it('a perfect deflect re-arms at once for the next blow', () => {
    const { enc, p } = duel('sword');
    windup(enc, 1);
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    run(enc, p, 2, { deflectHeld: true });
    expect(enc.fighter.met).toBe(true);
    // Pressed again straight away, mid-deflect: a fresh window.
    tick(enc, p, { deflectPressed: true, deflectHeld: true });
    expect(enc.fighter.t).toBe(0);
    expect(enc.fighter.perfect).toBe(PC.deflect.perfectTicks);
  });

  it('the dead give a tell a fixed time before the blow lands', () => {
    const { enc, p } = duel('sword');
    Object.assign(enc.dead[0]!, { state: 'windup', t: 0, duration: UT.attack.windup[0], feint: false, struck: false, facing: Math.PI });
    let tellAt = -1;
    let hurtAt = -1;
    for (let i = 1; i <= 80 && hurtAt < 0; i++) {
      tick(enc, p);
      if (enc.events.some((e) => e.kind === 'enemyTell')) tellAt = i;
      if (enc.events.some((e) => e.kind === 'hurt')) hurtAt = i;
      enc.events.length = 0;
    }
    expect(tellAt).toBeGreaterThanOrEqual(UT.attack.raiseTicks);
    expect(hurtAt - tellAt).toBe(UT.tellTicks);
  });

  it('the blow lands when the arm comes down, not as the strike begins', () => {
    const { enc, p } = duel('sword');
    Object.assign(enc.dead[0]!, { state: 'windup', t: 0, duration: 1, feint: false, struck: false, facing: Math.PI });
    tick(enc, p);
    expect(enc.dead[0]!.state).toBe('strike');
    for (let i = 1; i < UT.attack.impactTick; i++) tick(enc, p);
    expect(enc.fighter.health).toBe(PC.maxHealth);
    tick(enc, p);
    expect(enc.fighter.health).toBe(PC.maxHealth - UT.attack.damage);
  });

  it('the window narrows as Resolve runs low', () => {
    expect(perfectWindow(PC.maxResolve)).toBe(PC.deflect.perfectTicks);
    expect(perfectWindow(PC.lowResolve / 2)).toBeLessThan(PC.deflect.perfectTicks);
    expect(perfectWindow(0)).toBe(PC.deflect.minPerfectTicks);
  });
});

describe('the step', () => {
  it('slips a blow while invulnerable and carries the player away', () => {
    const { enc, p } = duel('sword');
    windup(enc, 3);
    tick(enc, p, { stepPressed: true });
    run(enc, p, PC.step.ticks);
    expect(enc.fighter.health).toBe(PC.maxHealth);
    expect(p.z).toBeLessThan(-PC.step.distance * 0.8);
  });
});

describe('Break and the Rite', () => {
  it('a broken enemy given the Rite is laid to rest for good, and the player comes out ahead', () => {
    const { enc, p } = duel('sword');
    const u = enc.dead[0]!;
    u.break = UT.maxBreak - 1;
    tick(enc, p, { attackPressed: true });
    run(enc, p, 40);
    expect(u.state).toBe('broken');
    const before = enc.fighter.resolve;
    expect(interactTarget(enc, p)).toEqual({ enemy: 0, rite: true });
    tick(enc, p, { interactPressed: true });
    expect(enc.fighter.action).toBe('rite');
    run(enc, p, PC.rite.ticks + 1);
    expect(u.state).toBe('rested');
    expect(enc.fighter.resolve).toBe(before - PC.rite.cost + PC.rite.restore);
    const rested = enc.events.find((e) => e.kind === 'rested');
    expect(rested && rested.kind === 'rested' && rested.name).toMatch(/^\w+ \w+, \d{4}$/);
    run(enc, p, UT.downedTicks[1] * 2);
    expect(u.state).toBe('rested');
  });

  it('laying a fallen body down costs far more than the Rite', () => {
    const { enc, p } = duel('sword');
    const u = enc.dead[0]!;
    u.health = 1;
    tick(enc, p, { attackPressed: true });
    run(enc, p, 40);
    expect(u.state).toBe('downed');
    enc.fighter.resolve = 60;
    tick(enc, p, { interactPressed: true });
    run(enc, p, PC.layFallen.ticks + 1);
    expect(u.state).toBe('rested');
    expect(enc.fighter.resolve).toBe(60 - PC.layFallen.cost);
  });
});

describe('Resolve', () => {
  it('at zero the player breaks, defenceless, then recovers a little', () => {
    const { enc, p } = duel('sword', 10);
    enc.fighter.resolve = 1;
    stepEncounter(enc, none(), still(), p, flat, -10, { ...ctx, dark: true }, 2);
    expect(enc.fighter.action).toBe('broken');
    tick(enc, p, { attackPressed: true });
    expect(enc.fighter.action).toBe('broken');
    run(enc, p, PC.brokenTicks + 1);
    expect(enc.fighter.action).toBe('free');
    expect(enc.fighter.resolve).toBe(PC.recoverResolve);
  });

  it('watching the dead rise drains it', () => {
    const { enc, p } = duel('knife', 3);
    const u = enc.dead[0]!;
    Object.assign(u, { state: 'downed', t: 0, duration: 1, health: 0 });
    const before = enc.fighter.resolve;
    run(enc, p, 2);
    expect(enc.fighter.resolve).toBe(before - UT.riseDread);
  });
});

describe('the dead', () => {
  it('never set foot on the Brough or in the sea', () => {
    expect(deadCanStand(broughGreybox, 20, 0, 0)).toBe(true);
    expect(deadCanStand(broughGreybox, -20, 0, -1)).toBe(false);
    expect(deadCanStand(broughGreybox, 0, 0, 2)).toBe(false);
    expect(deadCanStand(broughGreybox, 0, 0, -0.4)).toBe(true);
  });

  it('lose interest when the player shelters', () => {
    const { enc, p } = duel('sword', 5);
    run(enc, p, 2);
    expect(enc.dead[0]!.state).not.toBe('idle');
    for (let i = 0; i < 5; i++) stepEncounter(enc, none(), still(), p, flat, -10, { ...ctx, inRefuge: true }, SIM_DT);
    expect(['home', 'idle']).toContain(enc.dead[0]!.state);
  });

  it('play out the same way from the same seed', () => {
    const play = (): string => {
      const { enc, p } = duel('sword', 4);
      for (let i = 0; i < 900; i++) tick(enc, p, { deflectPressed: i % 50 === 0, deflectHeld: i % 50 < 10, attackPressed: i % 37 === 0 });
      return JSON.stringify([enc.dead, enc.fighter, p]);
    };
    expect(play()).toBe(play());
  });
});
