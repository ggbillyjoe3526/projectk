import { el } from './dom';

/**
 * The pane over the first frame: the title, the controls, and a click to begin. The click is also what lets the page
 * start its sound (browsers keep audio silent until the player interacts with the page).
 */
export function startGate(parent: HTMLElement, title: string, controls: readonly (readonly [string, string])[]): Promise<void> {
  const pane = el('div', 'start-gate');
  const box = el('div', 'start-gate-box');
  box.appendChild(el('h1', '', title));
  const list = el('dl', 'start-gate-controls');
  for (const [keys, what] of controls) {
    list.appendChild(el('dt', '', keys));
    list.appendChild(el('dd', '', what));
  }
  box.appendChild(list);
  box.appendChild(el('p', 'start-gate-go', 'Click to begin'));
  pane.appendChild(box);
  parent.appendChild(pane);
  return new Promise((resolve) => {
    pane.addEventListener(
      'click',
      () => {
        pane.remove();
        resolve();
      },
      { once: true },
    );
  });
}
