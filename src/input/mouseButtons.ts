import type { Keyboard } from './keyboard';

/**
 * Mouse buttons into the bindings as `Mouse<n>` codes (config/controls.ts: attack Mouse0, deflect Mouse2), from presses
 * on the game area. The right button's menu is blocked there, since it is the deflect.
 *
 * Mouse events, not pointer events: a pointer sends `pointerdown` only for the first button pressed, so a right click
 * while the left is held (deflecting out of a charge or a swing) never arrived. `mousedown` fires for every button.
 */
export function watchMouseButtons(area: HTMLElement, keyboard: Keyboard): () => void {
  const down = (e: MouseEvent): void => {
    keyboard.press(`Mouse${e.button}`);
  };
  const up = (e: MouseEvent): void => {
    keyboard.release(`Mouse${e.button}`);
  };
  const menu = (e: Event): void => e.preventDefault();
  area.addEventListener('mousedown', down);
  window.addEventListener('mouseup', up);
  area.addEventListener('contextmenu', menu);
  return () => {
    area.removeEventListener('mousedown', down);
    window.removeEventListener('mouseup', up);
    area.removeEventListener('contextmenu', menu);
  };
}
