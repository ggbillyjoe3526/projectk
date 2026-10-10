/**
 * Sprint on a toggle (William, 2026-10-10): a tap of the sprint key starts it, another tap stops it, and so does
 * stopping walking (letting go of Walk once sprinting has begun), pausing or looking away. A tap before walking holds
 * until you set off, so Shift then W works as well as W then Shift. Nothing is held down for long, so a key whose
 * release the browser never hears can't leave the player running.
 */
export class SprintToggle {
  private on = false;
  private walked = false;

  /** Per frame: whether the sprint key was pressed this frame, and whether Walk is held. Returns whether to sprint. */
  update(pressed: boolean, forward: boolean): boolean {
    if (pressed) {
      this.on = !this.on;
      this.walked = false;
    }
    if (this.on && forward) this.walked = true;
    else if (this.on && this.walked && !forward) this.on = false;
    return this.on && forward;
  }

  reset(): void {
    this.on = false;
    this.walked = false;
  }
}
