/** Small DOM builders the overlays share. */

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** A button: `primary` is the one that moves you on (Reload), `secondary` everything else. */
export function button(label: string, kind: 'primary' | 'secondary', onClick: () => void): HTMLButtonElement {
  const node = el('button', `button button-${kind}`, label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}
