import { DEFAULT_TIDE, type TideConfig } from '../../config/tide';
import { causewayOpenFraction, nextTides, tideCyclePosition, tideRate } from '../../sim/tide';

/**
 * Chapter 1's clock and tide. The island's time still runs on the tide clock (a day is 3000 of its seconds, so one real
 * second is 28.8 island seconds), but the tide here keeps a real Orkney rhythm (William, 2026-10-10): two low waters a
 * day, 12 hours 25 minutes apart, so each comes about 50 minutes later than the day before. A winter's daylight is short:
 * light from about nine, dark again by four.
 *
 * The week: the late ferry docks at 23:45 on the Wednesday, half an hour after the causeway shut, so William stays the
 * night in the village. The causeway opens again on Thursday morning; he spends Thursday with his father at the cottage
 * and sits up with him that night. The funeral is on Friday at ten, at low water, so the causeway is open for the run
 * home after it.
 */

/** Tide-clock seconds in an island day, and in an island minute. */
export const DAY_UNITS = 3000;
const PER_MINUTE = DAY_UNITS / (24 * 60);

/** Tide clock 0 is a low water, at 20:50 on the Wednesday. */
const ZERO_MINUTES = 20 * 60 + 50;

export const DAYS = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const CROSSING_TIDE: TideConfig = { ...DEFAULT_TIDE, cycleSeconds: (12 * 60 + 25) * PER_MINUTE };

/** The tide clock at a time of day, `day` counted from the Wednesday (0). */
export function atTime(day: number, hours: number, minutes = 0): number {
  return (day * 24 * 60 + hours * 60 + minutes - ZERO_MINUTES) * PER_MINUTE;
}

/** Which day (0: the Wednesday) and how many minutes into it a tide clock is. */
export function clockOf(t: number): { day: number; minutes: number } {
  const total = Math.round(t / PER_MINUTE) + ZERO_MINUTES;
  const day = Math.floor(total / (24 * 60));
  return { day, minutes: total - day * 24 * 60 };
}

/** "23:45". */
export function timeText(t: number): string {
  const { minutes } = clockOf(t);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function dayName(t: number): string {
  return DAYS[Math.max(0, Math.min(DAYS.length - 1, clockOf(t).day))]!;
}

const smooth = (k: number): number => {
  const c = Math.min(1, Math.max(0, k));
  return c * c * (3 - 2 * c);
};

/** 1 in daylight, 0 at night: dawn from 08:10 to 09:40, dusk from 14:40 to 16:10. */
export function daylight(t: number): number {
  const h = clockOf(t).minutes / 60;
  return smooth((h - 8.17) / 1.5) * (1 - smooth((h - 14.67) / 1.5));
}

/** Whether the tide is in or out, and which way it's going, as the phone says it. */
export function tideWords(t: number, causewayOpen: boolean): string {
  const p = tideCyclePosition(t, CROSSING_TIDE);
  const state = p < 0.25 || p > 0.75 ? 'out' : 'in';
  const going = tideRate(t, CROSSING_TIDE) > 0 ? 'coming in' : 'going out';
  return `Tide ${state}, ${going}. Causeway ${causewayOpen ? 'open' : 'shut'}.`;
}

/** When the causeway is open around each of the next low waters, from `t`. */
export function causewayWindows(t: number, count: number): { opens: number; shuts: number }[] {
  const half = CROSSING_TIDE.cycleSeconds * causewayOpenFraction(CROSSING_TIDE);
  return nextTides(t - half, count * 2 + 2, CROSSING_TIDE)
    .filter((tide) => tide.kind === 'low' && tide.at + half > t)
    .slice(0, count)
    .map((tide) => ({ opens: tide.at - half, shuts: tide.at + half }));
}

/** His father's tide table, pinned by the cottage door: the next waters, by day. */
export function tideTableText(t: number): string[] {
  const at = (x: number): string => `${dayName(x)} ${timeText(x)}`;
  const tides = nextTides(t, 6, CROSSING_TIDE).map((tide) => `${tide.kind === 'low' ? 'Low water ' : 'High water'}  ${at(tide.at)}`);
  const windows = causewayWindows(t, 3).map((w) => `${at(w.opens)} to ${timeText(w.shuts)}`);
  return [
    'Haugsay tide table, in his hand, the corners soft from pinning and re-pinning:',
    ...tides,
    'Pencilled underneath: CAUSEWAY. Over at low water, two hours either side. Not a minute more.',
    ...windows.map((w) => `Safe: ${w}`),
  ];
}
