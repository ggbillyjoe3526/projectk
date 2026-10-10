/**
 * The torch's battery (concept v0.6 sections 3.3 and 3.5): it runs down while lit and charges only where there's power
 * (the cottage). Seconds of play, not island time: waiting out a tide doesn't spend it.
 */
export const TORCH = {
  /** Seconds of light from a full charge. */
  burnSeconds: 420,
  /** Seconds to charge from empty at a charging point. */
  chargeSeconds: 40,
  /** Below this charge the beam dims and flickers, and the player is told once. */
  low: 0.2,
  /** The beam's brightness at the very end of the charge, against 1 when full or above `low`. */
  dimmest: 0.35,
} as const;
