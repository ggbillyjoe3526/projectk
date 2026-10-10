import { describe, expect, it } from 'vitest';
import { FLAGS } from '../../content/crossing/people';
import { BAG, COTTAGE_SPOTS, vigilLines } from '../../content/crossing/places';
import { freshCrossing } from './progress';
import { type ReachState, targetHere, targetPrompt } from './reach';

const state = (over: Partial<ReachState> = {}): ReachState => ({ progress: freshCrossing(), flags: new Set(), causewayOpen: true, ...over });
const spot = (id: string) => COTTAGE_SPOTS.find((s) => s.id === id)!;

describe('chapter 1 reach', () => {
  it('uses the cottage’s things only from close by', () => {
    const window = spot('window');
    expect(targetHere([window], [], state(), window.x, window.z + 1)?.kind).toBe('spot');
    expect(targetHere([window], [], state(), window.x + 1.4, window.z + 0.4)).toBeNull();
  });

  it('offers to undo a custom once it’s done', () => {
    const window = spot('window');
    const target = { kind: 'spot' as const, spot: window };
    expect(targetPrompt(target, state())).toBe(window.prompt);
    const done = state({ progress: { ...freshCrossing(), customs: ['window'] } });
    expect(targetHere(COTTAGE_SPOTS, [], done, window.x, window.z + 0.5)).toEqual(target);
    expect(targetPrompt(target, done)).toBe(window.kind === 'custom' ? window.undoPrompt : '');
  });

  it('asks to set the backpack down, then offers it once it’s down', () => {
    const target = { kind: 'spot' as const, spot: spot('bag') };
    expect(targetPrompt(target, state())).toBe(spot('bag').prompt);
    expect(targetPrompt(target, state({ flags: new Set([FLAGS.bagDown]) }))).toBe(BAG.prompt);
  });
});

describe('the vigil’s end', () => {
  it('never says the rite was done right, and only mentions the letters once they were read', () => {
    const all = vigilLines(new Set(['salt', 'mirror', 'clock', 'window', 'candle']), false).join(' ');
    expect(all).not.toMatch(/letters/);
    expect(all).not.toMatch(/everything/);
    expect(vigilLines(new Set(), true).join(' ')).toMatch(/letters in the drawer/);
  });
});
