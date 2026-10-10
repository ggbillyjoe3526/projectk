import { TORCH } from '../config/torch';

/** The torch: whether it's on, and its charge, 0..1. Plain data, so it goes in a checkpoint. */
export interface TorchState {
  on: boolean;
  charge: number;
}

export type TorchEvent = 'low' | 'dead' | 'charged' | null;

export function createTorch(): TorchState {
  return { on: true, charge: 1 };
}

/** Switch it: on only if there's charge left. Returns whether it's now on. */
export function switchTorch(t: TorchState): boolean {
  t.on = !t.on && t.charge > 0;
  return t.on;
}

/** One tick: burn while on, charge at a charging point. Returns what the player should be told, if anything. */
export function stepTorch(t: TorchState, charging: boolean, dt: number): TorchEvent {
  const before = t.charge;
  if (charging) t.charge = Math.min(1, t.charge + dt / TORCH.chargeSeconds);
  else if (t.on) t.charge = Math.max(0, t.charge - dt / TORCH.burnSeconds);
  if (t.on && t.charge === 0) {
    t.on = false;
    return 'dead';
  }
  if (before >= TORCH.low && t.charge < TORCH.low) return 'low';
  if (before < 1 && t.charge === 1) return 'charged';
  return null;
}

/** How bright the beam is for this charge: full above `low`, dimming to `dimmest` as it runs out. */
export function torchBrightness(charge: number): number {
  if (charge >= TORCH.low) return 1;
  return TORCH.dimmest + (1 - TORCH.dimmest) * (charge / TORCH.low);
}
