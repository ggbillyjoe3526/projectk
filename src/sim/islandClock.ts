import { ISLAND_CLOCK } from '../config/tide';

/** The island's time of day for a tide clock, as hours 0..24. */
export function islandHours(t: number): number {
  const h = (ISLAND_CLOCK.hourAtZero + (t / ISLAND_CLOCK.daySeconds) * 24) % 24;
  return h < 0 ? h + 24 : h;
}

/** "07:50": the island's time of day for a tide clock, to the minute. */
export function islandTime(t: number): string {
  const minutes = Math.round(islandHours(t) * 60) % (24 * 60);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
