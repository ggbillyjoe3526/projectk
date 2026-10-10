/**
 * Combat tuning (concept v0.6 sections 3.2 to 3.4): the player's moves, Resolve, the weapons and the Unburied. Every
 * duration is in simulation ticks (60 a second, config/sim.ts); distances in metres; angles in radians.
 */

/** `none`: empty-handed (the first trip over, with only the phone's torch). */
export type WeaponId = 'none' | 'knife' | 'sword';

export interface WeaponTuning {
  /** Light attack: wind-up, hitting and recovery ticks. */
  readonly windup: number;
  readonly active: number;
  readonly recovery: number;
  /** Ticks into the recovery after which the next attack in the chain can start. */
  readonly chainFrom: number;
  readonly reach: number;
  /** Half the angle of the swing's arc. */
  readonly halfArc: number;
  readonly damage: number;
  /** Break each hit builds. The knife builds none: it can cut the dead, never lay them to rest. */
  readonly breakPerHit: number;
  /** Whether a broken enemy can be given the Rite with this in hand. */
  readonly canLay: boolean;
  /** Hits in a chain before it starts again. */
  readonly chain: number;
  /** Whether it can swing and deflect at all. Empty-handed, the player can only step aside and run. */
  readonly armed: boolean;
}

export const WEAPONS: Readonly<Record<WeaponId, WeaponTuning>> = {
  none: { windup: 0, active: 0, recovery: 0, chainFrom: 0, reach: 0, halfArc: 0, damage: 0, breakPerHit: 0, canLay: false, chain: 1, armed: false },
  knife: { windup: 5, active: 4, recovery: 12, chainFrom: 4, reach: 1.35, halfArc: 0.8, damage: 20, breakPerHit: 0, canLay: false, chain: 3, armed: true },
  sword: { windup: 9, active: 6, recovery: 15, chainFrom: 5, reach: 2.0, halfArc: 1.05, damage: 18, breakPerHit: 9, canLay: true, chain: 3, armed: true },
};

export const PLAYER_COMBAT = {
  maxHealth: 100,
  maxResolve: 100,
  /** Resolve when a visit (or a reload) starts. */
  startResolve: 70,
  /** The sained strike: hold attack (sword only) for `chargeTicks`, then release. */
  sained: { chargeTicks: 30, maxHoldTicks: 120, windup: 4, active: 7, recovery: 26, cost: 20, damage: 42, breakPerHit: 34, reach: 2.3, halfArc: 1.2 },
  deflect: {
    /** The perfect window at full nerve (200 ms), shrinking to `minPerfectTicks` as Resolve falls from `lowResolve` to zero. */
    perfectTicks: 12,
    minPerfectTicks: 4,
    /** Holding past the perfect window guards: a blow costs Resolve instead of health. */
    guardResolveCost: 9,
    /**
     * A deflect pressed this soon after the last one ended has no perfect window (no spamming). A perfect deflect re-arms
     * at once, so blows in quick succession can each be met.
     */
    rearmTicks: 10,
    /** Shortest deflect, even on a tap. */
    minTicks: 12,
    /** A press that comes while the player can't deflect yet (mid-swing, a hit-stop) waits this long, then is dropped. */
    bufferTicks: 8,
    /** A press this soon after being struck reads as a deflect that came too late. */
    lateTicks: 15,
  },
  perfectDeflectResolve: 5,
  step: { ticks: 14, invulnerableFrom: 1, invulnerableTo: 10, distance: 3.0, cooldown: 8 },
  /** Knocked off balance by a blow. */
  hurtTicks: 20,
  /** Below this the deflect window tightens and the screen and sound close in. */
  lowResolve: 30,
  /** At zero Resolve: defenceless this long, then back to `recoverResolve`. */
  brokenTicks: 180,
  brokenSpeed: 0.45,
  recoverResolve: 20,
  rite: { ticks: 72, cost: 10, restore: 35, reach: 1.8 },
  /** Waiting out the tide in a refuge: the hours wear on you (concept 3.1, "Caught out"). */
  refugeWait: { resolveCost: 15 },
  /** Laying a fallen (not broken) body down afterwards: expensive. */
  layFallen: { ticks: 72, cost: 40, reach: 1.8 },
  /** Resolve a second drained by darkness (torch off, out of doors). */
  darknessDrain: 0.6,
  /** Soft lock-on: an attack turns toward an enemy this close and within this angle of the player's facing. */
  lockReach: 3.2,
  lockHalfAngle: 1.1,
  /** Walking speed while attacking or guarding. */
  busySpeed: 0.25,
} as const;

export const UNBURIED_TUNING = {
  radius: 0.4,
  health: 60,
  /** Each time one rises it comes back stronger. */
  riseHealthGain: 1.25,
  /** How far it notices the player: further when the player carries a light. */
  sightLit: 15,
  sightDark: 6.5,
  /** Gives up and drifts home past this. */
  loseInterest: 22,
  shuffleSpeed: 0.9,
  lurchSpeed: 3.0,
  /** A lurch lasts this long, and comes this often. */
  lurchTicks: [14, 30],
  shuffleTicks: [30, 90],
  /** Chance at each lurch-or-shuffle change that it goes still instead, and for how long. */
  stillChance: 0.18,
  stillTicks: [40, 110],
  /**
   * The wind-up raises the arm over `raiseTicks` then holds it; the strike brings it down and the blow lands on
   * `impactTick`, when the arm visibly reaches the player (earlier it landed on the strike's first tick, arm still
   * overhead, so a deflect timed to the visible blow came too late).
   */
  attack: { reach: 1.7, windup: [32, 56], raiseTicks: 12, active: 9, impactTick: 4, recovery: 32, damage: 20, spiritWound: 7, halfArc: 1.0 },
  /**
   * The tell: a glint and a hiss this many ticks before the blow lands (400 ms). Deflecting on reaction to it, about
   * 200 ms later, falls in the middle of the perfect window.
   */
  tellTicks: 24,
  feintChance: 0.22,
  /** After a perfect deflect: reeling and open. */
  reelTicks: 40,
  /** ...and thrown back: this fast (m/s) for this many ticks. */
  reelPushSpeed: 2.6,
  reelPushTicks: 9,
  hurtTicks: 10,
  maxBreak: 100,
  breakPerPerfectDeflect: 26,
  breakPerGuard: 6,
  /** Break drains away a second when it isn't kept up. */
  breakDecay: 6,
  /** Broken: on its knees, open to the Rite, then it gets up with some Break left. */
  brokenTicks: 260,
  breakAfterRecover: 30,
  /** Down after losing its health, then rising. */
  downedTicks: [420, 640],
  risingTicks: 100,
  /** Resolve lost watching one rise, within this distance. */
  riseDread: 8,
  riseDreadReach: 14,
  /** Hit-stop: the whole fight pauses this many ticks on a solid hit and on a perfect deflect. */
  hitStop: 4,
  deflectStop: 7,
} as const;

/** Names spoken when the Rite lays one of the dead to rest (concept 3.4: you hear the name your father would have spoken). */
export const PARISH_NAMES = {
  given: ['Magnus', 'Thomas', 'Margaret', 'Janet', 'William', 'Isobel', 'Robert', 'Christian', 'Marion', 'Hugh', 'Elspeth', 'David'],
  family: ['Isbister', 'Flett', 'Rendall', 'Linklater', 'Harcus', 'Drever', 'Sinclair', 'Tulloch', 'Spence', 'Rousay', 'Halcro'],
  /** Years of death. */
  years: [1611, 1889],
} as const;
