import { describe, expect, it } from 'vitest';
import { validateDialogue } from '../../game/crossing/dialogue';
import { type LevelDef, reachability, validateLevel } from '../level';
import { ARRIVAL, ARRIVAL_ISLAND } from '../levels/arrival';
import { KIRK } from '../levels/kirk';
import { INN_DOOR, SHOP } from '../levels/village';
import { FERRY_GANGWAY } from '../levels/ferry';
import { HAUGSAY } from '../levels/haugsay';
import { MORAG_AT_INN, MORAG_WAY_HOME, PEOPLE } from './people';
import { SPOTS } from './places';

/** The arrival with the ferry alongside (its gangway open), the inn open, and the people standing where they stand. */
function docked(): LevelDef {
  const people = PEOPLE.map((p) => ({ minX: p.x - 0.25, maxX: p.x + 0.25, minZ: p.z - 0.25, maxZ: p.z + 0.25, height: 1.7, kind: 'furniture' as const }));
  return { ...ARRIVAL, world: { ...ARRIVAL.world, walls: [...ARRIVAL.world.walls.filter((w) => w.id !== FERRY_GANGWAY && w.id !== INN_DOOR), ...people] } };
}

describe('chapter 1’s map', () => {
  it('is authored soundly, the island on its own and with the ferry alongside', () => {
    expect(validateLevel(ARRIVAL_ISLAND)).toEqual([]);
    expect(validateLevel(docked())).toEqual([]);
  });

  it('keeps the ferry apart from the island until the gangway is out', () => {
    const shut = reachability(ARRIVAL);
    expect(shut(31, 30, 0.5)).toBe(false);
    expect(reachability(docked())(31, 30, 0.5)).toBe(true);
  });

  it('lets the player walk from the ferry to every person and everything to use', () => {
    const canReach = reachability(docked());
    for (const s of SPOTS) expect(canReach(s.x, s.z, 1.5), `${s.id} (${s.x}, ${s.z})`).toBe(true);
    for (const p of PEOPLE) expect(canReach(p.x, p.z, 1.9), `${p.id} (${p.x}, ${p.z})`).toBe(true);
    expect(canReach(MORAG_AT_INN.x, MORAG_AT_INN.z, 1.9)).toBe(true);
  });

  it('walks Morag home along the street and in at the inn door', () => {
    const canReach = reachability(docked());
    for (const at of MORAG_WAY_HOME) expect(canReach(at.x, at.z, 0.3), `(${at.x}, ${at.z})`).toBe(true);
  });

  it('has the kirk and the shop locked the night he arrives', () => {
    const canReach = reachability(docked());
    expect(canReach((KIRK.door[0] + KIRK.door[1]) / 2, KIRK.maxZ - 2, 0.3)).toBe(false);
    expect(canReach((SHOP.minX + SHOP.maxX) / 2, (SHOP.minZ + SHOP.maxZ) / 2, 0.3)).toBe(false);
  });

  it('has the pier in the slice’s map too', () => {
    expect(reachability(HAUGSAY)(31, 35, 0.5)).toBe(true);
  });

  it('gives every thing its own id', () => {
    const ids = SPOTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('chapter 1’s conversations', () => {
  it.each(PEOPLE.map((p) => [p.name, p] as const))('%s’s talk is sound', (_name, person) => {
    expect(validateDialogue(person.dialogue)).toEqual([]);
    expect(person.dialogue.id).toBe(person.id);
  });
});
