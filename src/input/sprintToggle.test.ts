import { describe, expect, it } from 'vitest';
import { SprintToggle } from './sprintToggle';

describe('sprint toggle', () => {
  it('starts on a tap while walking and keeps going after the key is let go', () => {
    const s = new SprintToggle();
    expect(s.update(false, true)).toBe(false);
    expect(s.update(true, true)).toBe(true);
    expect(s.update(false, true)).toBe(true);
    expect(s.update(false, true)).toBe(true);
  });

  it('stops on a second tap', () => {
    const s = new SprintToggle();
    s.update(true, true);
    expect(s.update(true, true)).toBe(false);
    expect(s.update(false, true)).toBe(false);
  });

  it('stops when the player stops walking, and stays stopped when they walk again', () => {
    const s = new SprintToggle();
    s.update(true, true);
    expect(s.update(false, false)).toBe(false);
    expect(s.update(false, true)).toBe(false);
  });

  it('waits for the player to set off after a tap while standing', () => {
    const s = new SprintToggle();
    expect(s.update(true, false)).toBe(false);
    expect(s.update(false, false)).toBe(false);
    expect(s.update(false, true)).toBe(true);
  });

  it('stops on reset (pause, looking away)', () => {
    const s = new SprintToggle();
    s.update(true, true);
    s.reset();
    expect(s.update(false, true)).toBe(false);
  });
});
