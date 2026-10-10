import { describe, expect, it } from 'vitest';
import { HAUGSAY } from '../content/levels/haugsay';
import { DEFAULT_TIDE as C } from '../config/tide';
import { freshProgress, nudgeHere, type Progress, thingHere, thingPrompt, tideTableLines } from './things';
import { beatsFrom, weaponFor } from './beats';

const things = HAUGSAY.things;
const gate = things.find((t) => t.kind === 'gate')!;

describe('things to use', () => {
  it('finds the nearest thing in reach', () => {
    expect(thingHere(things, freshProgress(), -26, -2)?.kind).toBe('hearth');
    expect(thingHere(things, freshProgress(), 62, -31.5)?.kind).toBe('sword');
    expect(thingHere(things, freshProgress(), 20, 0)).toBeNull();
  });

  it('leaves out the sword once taken and a gate once open', () => {
    expect(thingHere(things, { ...freshProgress(), swordTaken: true }, 62, -31.5)).toBeNull();
    expect(thingHere(things, { ...freshProgress(), opened: ['kirk-back-gate'] }, gate.x + 0.8, gate.z)).toBeNull();
  });

  it('keeps the knife and the notebook back until their beats', () => {
    const knife = things.find((t) => t.kind === 'knife')!;
    const note = things.find((t) => t.id === 'fathers-notebook')!;
    const fresh = freshProgress();
    expect(thingHere(things, fresh, knife.x, knife.z)).toBeNull();
    expect(thingHere(things, fresh, note.x, note.z + 0.8)).toBeNull();
    const seen: Progress = { ...fresh, beats: ['sawDead'] };
    expect(thingHere(things, seen, knife.x, knife.z)?.kind).toBe('knife');
    expect(thingHere(things, { ...seen, knifeTaken: true }, knife.x, knife.z)).toBeNull();
    expect(thingHere(things, { ...seen, beats: ['sawDead', 'sawRise'] }, note.x, note.z + 0.8)?.id).toBe('fathers-notebook');
  });

  it('nudges once toward a thing that has just come within reach of the story', () => {
    const knife = things.find((t) => t.kind === 'knife')!;
    const seen: Progress = { ...freshProgress(), beats: ['sawDead'] };
    expect(nudgeHere(things, freshProgress(), new Set(), knife.x, knife.z - 2)).toBeNull();
    expect(nudgeHere(things, seen, new Set(), knife.x, knife.z - 2)?.id).toBe('kitchen-knife');
    expect(nudgeHere(things, seen, new Set(['kitchen-knife']), knife.x, knife.z - 2)).toBeNull();
    expect(nudgeHere(things, { ...seen, knifeTaken: true }, new Set(), knife.x, knife.z - 2)).toBeNull();
    const all: Progress = { ...seen, knifeTaken: true, beats: ['sawDead', 'sawRise'], read: ['fathers-notebook'] };
    expect(nudgeHere(things, all, new Set(), -24.5, 1)).toBeNull();
  });

  it('moves the story on from what the fight shows', () => {
    const fresh = freshProgress();
    expect(beatsFrom([{ kind: 'enemyNotice', enemy: 0 }, { kind: 'enemyNotice', enemy: 1 }], 'none', fresh)).toEqual(['sawDead']);
    expect(beatsFrom([{ kind: 'enemyNotice', enemy: 0 }], 'knife', { ...fresh, beats: ['sawDead'] })).toEqual([]);
    expect(beatsFrom([{ kind: 'enemyRise', enemy: 0 }], 'knife', fresh)).toEqual(['sawRise']);
    expect(beatsFrom([{ kind: 'enemyRise', enemy: 0 }], 'sword', fresh)).toEqual([]);
    expect(weaponFor(fresh)).toBe('none');
    expect(weaponFor({ ...fresh, knifeTaken: true })).toBe('knife');
    expect(weaponFor({ ...fresh, knifeTaken: true, swordTaken: true })).toBe('sword');
  });

  it('opens a gate only from its own side', () => {
    expect(thingPrompt(gate, freshProgress(), gate.x + 1, gate.z)).toBe('E  Lift the bar and open the gate');
    expect(thingPrompt(gate, freshProgress(), gate.x - 1.2, gate.z)).toBe('Barred from the other side');
  });

  it('says "read again" for a document already read', () => {
    const note = things.find((t) => t.id === 'fathers-notebook')!;
    expect(thingPrompt(note, freshProgress(), 0, 0)).toBe('E  Read: Your father’s notebook');
    expect(thingPrompt(note, { ...freshProgress(), read: ['fathers-notebook'] }, 0, 0)).toBe('E  Read again: Your father’s notebook');
  });

  it('prints the time and the next four tides', () => {
    const lines = tideTableLines(0.82 * C.cycleSeconds);
    expect(lines[0]).toContain('07:50');
    expect(lines.slice(1, 5)).toEqual(['Low water  10:00', 'High water  16:00', 'Low water  22:00', 'High water  04:00']);
    expect(lines[5]).toContain('about 2.5 hours either side of low water');
  });
});
