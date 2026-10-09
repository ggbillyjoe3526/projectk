/**
 * Where the mouse points over the game, in normalised device coordinates (x and y from -1 to 1, y up), for aiming the
 * torch and the character's facing (concept v0.6 section 7, camera A). Measured against the container rather than the
 * canvas, because the canvas is replaced when a lost GPU device is.
 */
export class PointerAim {
  x = 0;
  y = 0;
  /** The mouse has moved over the game at least once. */
  known = false;

  constructor(
    private readonly target: Window,
    private readonly area: HTMLElement,
  ) {
    target.addEventListener('pointermove', this.onMove);
  }

  dispose(): void {
    this.target.removeEventListener('pointermove', this.onMove);
  }

  private readonly onMove = (e: PointerEvent): void => {
    const r = this.area.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.y = 1 - ((e.clientY - r.top) / r.height) * 2;
    this.known = true;
  };
}
