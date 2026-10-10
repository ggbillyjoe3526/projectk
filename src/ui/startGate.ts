import { el } from './dom';

/**
 * The pane over the first frame: the title, the controls, and a click to begin. The click is also what lets the page
 * start its sound (browsers keep audio silent until the player interacts with the page). With a saved game it says
 * the click continues it, and offers to start over (`startOver`), which takes a second click to confirm.
 */
export function startGate(
  parent: HTMLElement,
  title: string,
  controls: readonly (readonly [string, string])[],
  startOver?: () => void,
): Promise<void> {
  const pane = el('div', 'start-gate');
  const box = el('div', 'start-gate-box');
  box.appendChild(el('h1', '', title));
  const list = el('dl', 'start-gate-controls');
  for (const [keys, what] of controls) {
    list.appendChild(el('dt', '', keys));
    list.appendChild(el('dd', '', what));
  }
  box.appendChild(list);
  box.appendChild(el('p', 'start-gate-go', startOver ? 'Click to continue from where you last rested' : 'Click to begin'));
  if (startOver) {
    const again = el('button', 'start-gate-over', 'Start over');
    let armed = false;
    again.addEventListener('click', (e) => {
      if (!armed) {
        // The first click only arms it, so a stray click never erases a game.
        e.stopPropagation();
        armed = true;
        again.textContent = 'Click again to erase your progress and start over';
        return;
      }
      startOver();
    });
    box.appendChild(again);
  }
  pane.appendChild(box);
  parent.appendChild(pane);
  // The click that starts the game isn't also a swing.
  pane.addEventListener('mousedown', (e) => e.stopPropagation());
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
