import { describe, expect, it } from 'vitest';
import { RELEASE, releaseName } from './release';

describe('releaseName', () => {
  it('names a chapter as the minor version, with the Dev build after it', () => {
    expect(releaseName({ major: 0, chapter: 1, dev: 1 })).toBe('0.1 Dev 1');
    expect(releaseName({ major: 0, chapter: 2, dev: 3 })).toBe('0.2 Dev 3');
  });

  it('starts chapter 1 at 0.1 Dev 1', () => {
    expect(RELEASE.chapter).toBeGreaterThanOrEqual(1);
    expect(RELEASE.dev).toBeGreaterThanOrEqual(1);
  });
});
