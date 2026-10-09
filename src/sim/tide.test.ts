import { describe, expect, it } from 'vitest';
import { DEFAULT_TIDE as C } from '../config/tide';
import { causewayPassable, humParams, tideLevel, tidePhase, tideRate } from './tide';

describe('tide', () => {
  it('starts at low water and peaks at half a cycle', () => {
    expect(tideLevel(0)).toBeCloseTo(C.lowLevel, 6);
    expect(tideLevel(C.cycleSeconds / 2)).toBeCloseTo(C.highLevel, 6);
    expect(tideLevel(C.cycleSeconds)).toBeCloseTo(C.lowLevel, 6);
  });

  it('handles negative clocks', () => {
    expect(tideLevel(-C.cycleSeconds / 4)).toBeCloseTo(tideLevel((3 * C.cycleSeconds) / 4), 6);
  });

  it('reports phases in order through a cycle', () => {
    const seen: string[] = [];
    for (let i = 0; i < 200; i++) {
      const p = tidePhase((i / 200) * C.cycleSeconds);
      if (seen[seen.length - 1] !== p) seen.push(p);
    }
    expect(seen).toEqual(['low', 'rising', 'high', 'falling', 'low']);
  });

  it('rate is positive while rising, negative while falling', () => {
    expect(tideRate(C.cycleSeconds * 0.25)).toBeGreaterThan(0.99);
    expect(tideRate(C.cycleSeconds * 0.75)).toBeLessThan(-0.99);
  });

  it('opens the causeway around low water only', () => {
    expect(causewayPassable(0)).toBe(true);
    expect(causewayPassable(C.cycleSeconds / 2)).toBe(false);
    let open = 0;
    const steps = 1000;
    for (let i = 0; i < steps; i++) if (causewayPassable((i / steps) * C.cycleSeconds)) open++;
    // Concept target: roughly a third of the cycle (≈8 of 25 minutes).
    expect(open / steps).toBeGreaterThan(0.25);
    expect(open / steps).toBeLessThan(0.45);
  });

  it('hum is nearly still at slack low water and strongest rising toward high', () => {
    const low = humParams(0);
    const risingLate = humParams(C.cycleSeconds * 0.45);
    const fallingEarly = humParams(C.cycleSeconds * 0.55);
    expect(low.strength).toBeLessThan(0.1);
    expect(risingLate.strength).toBeGreaterThan(fallingEarly.strength);
    expect(risingLate.beatHz).toBeGreaterThan(fallingEarly.beatHz);
    expect(fallingEarly.drawBack).toBeGreaterThan(risingLate.drawBack);
    expect(humParams(C.cycleSeconds / 2).grind).toBeGreaterThan(0.9);
  });
});
