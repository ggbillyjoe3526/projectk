/**
 * Rendering tuning that the loop, the quality step-down and the GPU check read. The quality presets carry no effect
 * settings yet: each effect (internal resolution, dither, fog, weather) adds a field here, with a value on every preset,
 * when it is built.
 */

/** The quality presets, cheapest first. */
export type QualityPreset = 'low' | 'medium' | 'high';
/** What the settings store holds: a preset, or the player's own mix ('custom', once there are effects to mix). */
export type QualityChoice = QualityPreset | 'custom';
export const QUALITY_PRESETS: readonly QualityPreset[] = ['low', 'medium', 'high'];

/** What the graphics card is, by the name the browser reports (render/gpuCheck.ts). */
export type GpuTier = 'software' | 'integrated' | 'discrete' | 'unknown';

/**
 * The preset a first visit starts on by GPU: Low when the browser draws in software, Medium on integrated graphics
 * and when the name is hidden (Firefox's fingerprinting protection), High on a discrete card.
 */
export const TIER_QUALITY: Readonly<Record<GpuTier, QualityPreset>> = { software: 'low', integrated: 'medium', unknown: 'medium', discrete: 'high' };

/**
 * The automatic step-down (render/qualityStepDown.ts): while the game's own pick is in force, frame times are watched
 * in windows of `windowSeconds`; when `windows` windows in a row have a 95th percentile over `p95Ms` (or over
 * `capSlack` frames of a frame-rate cap, whichever is longer), the next preset down applies. A window is slow when more
 * than `slowShare` of its frames are over the threshold (that is what a 95th percentile over it means).
 */
export const QUALITY_STEP_DOWN = { windowSeconds: 2, p95Ms: 20, slowShare: 0.05, windows: 2, capSlack: 1.25 } as const;

/** Frame-rate caps (frames a second; 0 = Unlimited). Not part of a preset; the simulation keeps 60 ticks a second. */
export const FRAME_RATE_CAPS = [0, 30, 60, 120, 144, 240] as const;
export type FrameRateCap = (typeof FRAME_RATE_CAPS)[number];

/**
 * The frame-rate cap's pacing (core/framePacer.ts): a frame up to `slackMs` early still counts as due, and a pacer more
 * than `resetFrames` periods behind restarts its schedule rather than bursting to catch up.
 */
export const FRAME_PACING = { slackMs: 1, resetFrames: 2 } as const;

/** The debug overlay's frame breakdown: GPU milliseconds a frame as a running average where each new frame weighs `smoothing`. */
export const FRAME_TIMING = { smoothing: 0.1 } as const;

/**
 * The low-resolution look (concept v0.6 section 8): the scene draws at `internalHeight` pixels tall (the width follows
 * the window's shape) and the browser scales the canvas up with hard pixels; each colour channel is cut to
 * `colourLevels` steps with a 4×4 ordered dither (render/retro). It is the game's art style, not a quality setting.
 */
export const RETRO_LOOK = { internalHeight: 270, colourLevels: 32 } as const;
