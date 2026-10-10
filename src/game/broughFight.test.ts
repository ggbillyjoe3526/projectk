import { describe, expect, it } from 'vitest';
import { timingLine } from './broughFight';

describe('the deflect timing readout', () => {
  it('names the result and the miss in milliseconds', () => {
    expect(timingLine('perfect', 4, false)).toEqual(['Deflected', 'good']);
    expect(timingLine('early', 6, true)).toEqual(['Guarded, 100 ms early', 'near']);
    expect(timingLine('early', 3, false)).toEqual(['50 ms early', 'miss']);
    expect(timingLine('late', 9, false)).toEqual(['150 ms late', 'miss']);
  });

  it('reads a long hold as a guard, not a mistimed deflect', () => {
    expect(timingLine('early', 60, true)).toEqual(['Guarded', 'near']);
  });
});
