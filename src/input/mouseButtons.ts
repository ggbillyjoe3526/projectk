import type { Keyboard } from './keyboard';

/**
 * Mouse buttons into the bindings as `Mouse<n>` codes (config/controls.ts: attack Mouse0, deflect Mouse2), from presses
 * on the game area. The right button's menu is blocked there, since it is the deflect.
 */
export function watchMouseButtons(area: HTMLElement, keyboard: Keyboard): () => void {
  const down = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    keyboard.press(`Mouse${e.button}`);
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    keyboard.release(`Mouse${e.button}`);
  };
  const menu = (e: Event): void => e.preventDefault();
  area.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);
  area.addEventListener('contextmenu', menu);
  return () => {
    area.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    area.removeEventListener('contextmenu', menu);
  };
}
