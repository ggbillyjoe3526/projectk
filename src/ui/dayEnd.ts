import { button, el } from './dom';

/**
 * Black over the view: a quick fade for hours passing (waiting out the tide), and the end of a day, where the night's
 * lines come up one at a time and then the day's card: END OF DAY 1, the chapter, the build, and what comes next.
 */
export class DayEnd {
  private readonly root: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'day-end');
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    parent.appendChild(this.root);
  }

  /** Dip to black and back, for hours passing. */
  dip(): void {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.root.replaceChildren();
    this.root.getAnimations().forEach((a) => a.cancel());
    this.root.animate([{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: calm ? 900 : 2600, easing: 'ease-in-out' });
  }

  /** The end of the day: `lines` one by one, then the card with its `actions` ([label, onClick], the first primary). */
  end(lines: readonly string[], title: string, subtitle: string, version: string, note: string, actions: readonly (readonly [string, () => void])[]): void {
    this.root.getAnimations().forEach((a) => a.cancel());
    this.root.classList.add('on');
    const text = el('div', 'day-end-lines');
    const card = el('div', 'day-end-card');
    card.append(el('h1', '', title), el('p', 'day-end-sub', subtitle), el('p', 'day-end-version', version), el('p', 'day-end-note', note));
    const row = el('div', 'day-end-actions');
    actions.forEach(([label, onClick], i) => row.appendChild(button(label, i === 0 ? 'primary' : 'secondary', onClick)));
    card.appendChild(row);
    card.hidden = true;
    this.root.replaceChildren(text, card);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = calm ? 600 : 2600;
    lines.forEach((line, i) => {
      window.setTimeout(() => {
        const p = el('p', '', line);
        text.appendChild(p);
        p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: calm ? 1 : 1200, fill: 'both' });
      }, 900 + i * step);
    });
    window.setTimeout(() => {
      text.hidden = true;
      card.hidden = false;
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: calm ? 1 : 1600, fill: 'both' });
    }, 900 + lines.length * step + 1800);
  }

  get ended(): boolean {
    return this.root.classList.contains('on');
  }

  dispose(): void {
    this.root.remove();
  }
}
