/**
 * The release this build belongs to, by William's scheme (2026-10-10): each chapter is a minor version (chapter 1 is
 * 0.1, chapter 2 is 0.2), and the builds of a chapter are numbered Dev builds, "0.1 Dev 1", "0.1 Dev 2" and so on.
 * Bump `dev` for each build put out to play, and `chapter` (with `dev` back to 1) when a new chapter's builds begin.
 * The git version (`__BUILD_VERSION__`) still names the exact commit, next to this in crash reports.
 */
export const RELEASE = { major: 0, chapter: 1, dev: 1 } as const;

/** A release's name as players see it, "0.1 Dev 1". */
export function releaseName(release: { major: number; chapter: number; dev: number } = RELEASE): string {
  return `${release.major}.${release.chapter} Dev ${release.dev}`;
}
