import { describe, expect, it } from 'vitest';
import { TORCH } from '../config/torch';
import { createTorch, stepTorch, switchTorch, torchBrightness } from './torch';

const run = (t: ReturnType<typeof createTorch>, charging: boolean, seconds: number) => {
  const events: string[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    const e = stepTorch(t, charging, 1 / 60);
    if (e) events.push(e);
  }
  return events;
};

describe('the torch battery', () => {
  it('burns down while lit, warns once when low, and goes out when empty', () => {
    const t = createTorch();
    expect(run(t, false, TORCH.burnSeconds + 1)).toEqual(['low', 'dead']);
    expect(t).toEqual({ on: false, charge: 0 });
    expect(switchTorch(t)).toBe(false);
  });

  it('keeps its charge while off', () => {
    const t = { on: false, charge: 0.5 };
    run(t, false, 60);
    expect(t.charge).toBe(0.5);
  });

  it('charges at a charging point, lit or not, and says when it is full', () => {
    const t = { on: true, charge: 0 };
    expect(run(t, true, TORCH.chargeSeconds + 1)).toEqual(['charged']);
    expect(t.charge).toBe(1);
  });

  it('dims as the last of the charge goes', () => {
    expect(torchBrightness(1)).toBe(1);
    expect(torchBrightness(TORCH.low)).toBe(1);
    expect(torchBrightness(0)).toBe(TORCH.dimmest);
  });
});
