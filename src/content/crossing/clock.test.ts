import { describe, expect, it } from 'vitest';
import { causewayPassable, nextCausewayOpen, nextTides } from '../../sim/tide';
import { DOCKED_TIDE, FERRY_START_TIDE, MORNING_TIDE } from './chapter';
import { atTime, CROSSING_TIDE, causewayWindows, dayName, daylight, tideTableText, timeText, tideWords } from './clock';

describe('chapter 1’s clock and tide', () => {
  it('docks the late ferry at 23:45 on the Wednesday, just after the causeway shut', () => {
    expect(`${dayName(DOCKED_TIDE)} ${timeText(DOCKED_TIDE)}`).toBe('Wednesday 23:45');
    expect(timeText(FERRY_START_TIDE)).toBe('23:09');
    expect(causewayPassable(DOCKED_TIDE, CROSSING_TIDE)).toBe(false);
    expect(causewayPassable(DOCKED_TIDE - 80, CROSSING_TIDE)).toBe(true);
  });

  it('keeps a real tide: low waters 12 h 25 min apart, so about 50 minutes later each day', () => {
    const lows = nextTides(DOCKED_TIDE, 8, CROSSING_TIDE).filter((t) => t.kind === 'low');
    expect(lows.map((t) => `${dayName(t.at)} ${timeText(t.at)}`)).toEqual(['Thursday 09:15', 'Thursday 21:40', 'Friday 10:05', 'Friday 22:30']);
  });

  it('opens the causeway on Thursday morning, and at the Friday funeral', () => {
    const opens = nextCausewayOpen(DOCKED_TIDE, CROSSING_TIDE);
    expect(`${dayName(opens)} ${timeText(opens)}`).toMatch(/^Thursday 06:[45]\d$/);
    expect(causewayPassable(MORNING_TIDE, CROSSING_TIDE)).toBe(true);
    // The service at ten, and the run home after it.
    expect(causewayPassable(atTime(2, 10), CROSSING_TIDE)).toBe(true);
    expect(causewayPassable(atTime(2, 11, 30), CROSSING_TIDE)).toBe(true);
    expect(causewayWindows(DOCKED_TIDE, 1)[0]!.opens).toBeCloseTo(opens, 0);
  });

  it('is dark at night and light from about nine to three', () => {
    expect(daylight(DOCKED_TIDE)).toBe(0);
    expect(daylight(atTime(1, 12))).toBe(1);
    expect(daylight(atTime(1, 8, 30))).toBeGreaterThan(0);
    expect(daylight(atTime(1, 8, 30))).toBeLessThan(0.5);
    expect(daylight(atTime(1, 17))).toBe(0);
  });

  it('says whether the tide is in or out, and lists the waters by day', () => {
    expect(tideWords(DOCKED_TIDE, false)).toBe('Tide out, coming in. Causeway shut.');
    expect(tideWords(atTime(1, 3, 30), false)).toMatch(/^Tide in/);
    expect(tideTableText(MORNING_TIDE).join('\n')).toContain('Low water   Thursday 21:40');
  });
});
