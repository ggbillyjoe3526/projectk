import { el } from './dom';

/**
 * What the player reads on screen during play, kept spare (concept v0.6 section 8): health and Resolve as two thin
 * marks at the bottom left, the action E would take here, a caption line for what just happened (a name spoken at the
 * Rite), and the reader for a found document.
 */
export class CombatHud {
  private readonly root: HTMLDivElement;
  private readonly health: HTMLDivElement;
  private readonly resolve: HTMLDivElement;
  private readonly prompt: HTMLDivElement;
  private readonly caption: HTMLDivElement;
  private readonly reader: HTMLDivElement;
  private readonly readerText: HTMLDivElement;
  private captionUntil = 0;
  private lastPrompt = '';

  constructor(parent: HTMLElement) {
    this.root = el('div', 'hud');
    const bars = el('div', 'hud-bars');
    this.health = this.bar(bars, 'hud-health', 'Health');
    this.resolve = this.bar(bars, 'hud-resolve', 'Resolve');
    this.prompt = el('div', 'hud-prompt');
    this.caption = el('div', 'hud-caption');
    this.reader = el('div', 'hud-reader');
    this.readerText = el('div', 'hud-reader-text');
    this.reader.appendChild(this.readerText);
    this.reader.appendChild(el('p', 'hud-reader-close', 'E to put it down'));
    this.reader.hidden = true;
    this.root.append(bars, this.prompt, this.caption, this.reader);
    parent.appendChild(this.root);
  }

  get reading(): boolean {
    return !this.reader.hidden;
  }

  setVisible(on: boolean): void {
    this.root.hidden = !on;
  }

  /** Fractions 0..1. */
  setGauges(health: number, resolve: number, low: boolean): void {
    this.health.style.width = `${(health * 100).toFixed(1)}%`;
    this.resolve.style.width = `${(resolve * 100).toFixed(1)}%`;
    this.resolve.classList.toggle('low', low);
  }

  setPrompt(text: string): void {
    if (text === this.lastPrompt) return;
    this.lastPrompt = text;
    this.prompt.textContent = text;
  }

  say(text: string, now: number, seconds = 4.5): void {
    this.caption.textContent = text;
    this.caption.classList.add('on');
    this.captionUntil = now + seconds * 1000;
  }

  read(lines: readonly string[]): void {
    this.readerText.replaceChildren(...lines.map((line) => el('p', '', line)));
    this.reader.hidden = false;
  }

  closeReader(): void {
    this.reader.hidden = true;
  }

  frame(now: number): void {
    if (this.captionUntil && now > this.captionUntil) {
      this.caption.classList.remove('on');
      this.captionUntil = 0;
    }
  }

  private bar(parent: HTMLElement, className: string, label: string): HTMLDivElement {
    const track = el('div', `hud-track ${className}`);
    track.title = label;
    const fill = el('div', 'hud-fill');
    track.appendChild(fill);
    parent.appendChild(track);
    return fill;
  }
}
