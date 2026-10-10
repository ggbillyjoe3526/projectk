import { describe, expect, it } from 'vitest';
import { BED, BEDROOM, BIER, COTTAGE } from '../../content/levels/brough';
import { HAUGSAY } from '../../content/levels/haugsay';
import { clearSight } from './sight';

describe('clear sight', () => {
  const wall = { minX: 0, maxX: 1, minZ: -5, maxZ: 5 };

  it('is blocked by a box across the line, and clear past its end', () => {
    expect(clearSight([wall], -2, 0, 3, 0)).toBe(false);
    expect(clearSight([wall], -2, 6, 3, 6)).toBe(true);
    expect(clearSight([wall], -2, 0, -1, 3)).toBe(true);
  });

  it('sees the coffin through the bedroom doorway, but not from the bed', () => {
    const walls = HAUGSAY.world.walls.filter((w) => w.kind === 'cottage');
    const cx = (BIER.minX + BIER.maxX) / 2;
    const cz = (BIER.minZ + BIER.maxZ) / 2;
    const door = (BEDROOM.door[0] + BEDROOM.door[1]) / 2;
    expect(clearSight(walls, COTTAGE.minX - 0.6, door, cx, cz)).toBe(true);
    expect(clearSight(walls, -23, -1, cx, cz)).toBe(true);
    expect(clearSight(walls, (BED.minX + BED.maxX) / 2, (BED.minZ + BED.maxZ) / 2, cx, cz)).toBe(false);
    expect(clearSight(walls, -15, 0, cx, cz)).toBe(false);
  });
});
