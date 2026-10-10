import { describe, expect, it } from 'vitest';
import { DEFAULT_TIDE as C } from '../config/tide';
import { islandTime } from './islandClock';
import { causewayOpenFraction, causewayPassable, humParams, nextCausewayOpen, nextTides, tideLevel, tidePhase, tideRate } from './tide';

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

  it('knows when the causeway next opens, and how long it stays open', () => {
    const a = causewayOpenFraction();
    // At the edge of the window, the water over the causeway is exactly wading depth.
    expect(tideLevel(a * C.cycleSeconds) - C.causewayTop).toBeCloseTo(C.maxWadeDepth, 6);
    const highWater = C.cycleSeconds / 2;
    const opens = nextCausewayOpen(highWater);
    expect(opens).toBeCloseTo((1 - a) * C.cycleSeconds, 6);
    expect(causewayPassable(opens + 0.01)).toBe(true);
    expect(causewayPassable(opens - 1)).toBe(false);
    expect(nextCausewayOpen(10)).toBe(10);
  });

  it('lists the next low and high waters', () => {
    expect(nextTides(10, 3)).toEqual([
      { kind: 'high', at: C.cycleSeconds / 2 },
      { kind: 'low', at: C.cycleSeconds },
      { kind: 'high', at: 1.5 * C.cycleSeconds },
    ]);
    expect(nextTides(C.cycleSeconds, 1)).toEqual([{ kind: 'high', at: 1.5 * C.cycleSeconds }]);
  });

  it('keeps island time: two tide cycles a day, low water at 22:00 and 10:00', () => {
    expect(islandTime(0)).toBe('22:00');
    expect(islandTime(C.cycleSeconds / 2)).toBe('04:00');
    expect(islandTime(C.cycleSeconds)).toBe('10:00');
    expect(islandTime(0.82 * C.cycleSeconds)).toBe('07:50');
  });
});
