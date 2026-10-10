import { el } from './dom';

/**
 * The pause pane (Escape or P while playing): the game holds still behind it, with the controls listed again. Escape,
 * P or a click on the pane resumes.
 */
export class PauseScreen {
  private readonly pane: HTMLDivElement;

  constructor(parent: HTMLElement, controls: readonly (readonly [string, string])[], hint: string, onResume: () => void) {
    this.pane = el('div', 'start-gate pause-screen');
    const box = el('div', 'start-gate-box');
    box.appendChild(el('h1', '', 'PAUSED'));
    const list = el('dl', 'start-gate-controls');
    for (const [keys, what] of controls) {
      list.appendChild(el('dt', '', keys));
      list.appendChild(el('dd', '', what));
    }
    box.appendChild(list);
    box.appendChild(el('p', 'start-gate-go', hint));
    this.pane.appendChild(box);
    this.pane.hidden = true;
    this.pane.addEventListener('click', onResume);
    // The click that resumes isn't also a swing.
    this.pane.addEventListener('mousedown', (e) => e.stopPropagation());
    parent.appendChild(this.pane);
  }

  get shown(): boolean {
    return !this.pane.hidden;
  }

  show(on: boolean): void {
    this.pane.hidden = !on;
  }

  /** Take it off the page (another part of the game, with other controls, replaces it). */
  remove(): void {
    this.pane.remove();
  }
}
