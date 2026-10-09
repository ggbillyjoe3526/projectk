/**
 * Simulation seeds: unsigned 32-bit integers. A game starts from a fresh random seed each page load, or from the one
 * the URL names (`?seed=N`) to replay a session; streams derived from it (one per system that needs its own
 * randomness) use exact 32-bit arithmetic, so every bit of the seed counts.
 */

export const MAX_SEED = 0xffffffff;

/** The seed a `?seed=` value names, or undefined unless it is a whole number from 0 to MAX_SEED. */
export function parseSeed(value: string | null): number | undefined {
  if (value === null || !/^\d{1,10}$/.test(value)) return undefined;
  const n = Number(value);
  return n <= MAX_SEED ? n : undefined;
}

/** A fresh random seed (the browser's crypto source: this only picks the seed, it's not simulation randomness). */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

/**
 * `seed × multiplier + add`, wrapped to 32 bits exactly (a plain multiply loses low bits past 2^53): a separate
 * stream for one system. The multiplier and offset are arbitrary primes, one pair per stream, kept with that system's
 * tuning; changing them changes every decision seeded from that stream.
 */
export function deriveSeed(seed: number, multiplier: number, add: number): number {
  return (Math.imul(seed, multiplier) + add) >>> 0;
}
