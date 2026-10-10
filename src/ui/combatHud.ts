import { el } from './dom';

/**
 * What the player reads on screen during play, kept spare (concept v0.6 section 8): health, Resolve and the torch's
 * charge as thin marks at the bottom left, the action E would take here, a caption line for what just happened (a name spoken at the
 * Rite), and the reader for a found document.
 */
export class CombatHud {
  private readonly root: HTMLDivElement;
  private readonly health: HTMLDivElement;
  private readonly resolve: HTMLDivElement;
  private readonly torch: HTMLDivElement;
  private readonly prompt: HTMLDivElement;
  private readonly caption: HTMLDivElement;
  private readonly reader: HTMLDivElement;
  private readonly readerText: HTMLDivElement;
  private readonly flash: HTMLDivElement;
  private readonly timing: HTMLDivElement;
  private captionUntil = 0;
  private timingUntil = 0;
  private lastPrompt = '';

  constructor(parent: HTMLElement) {
    this.root = el('div', 'hud');
    const bars = el('div', 'hud-bars');
    this.health = this.bar(bars, 'hud-health', 'Health');
    this.resolve = this.bar(bars, 'hud-resolve', 'Resolve');
    this.torch = this.bar(bars, 'hud-torch', 'Torch battery');
    this.prompt = el('div', 'hud-prompt');
    this.caption = el('div', 'hud-caption');
    this.reader = el('div', 'hud-reader');
    this.readerText = el('div', 'hud-reader-text');
    this.reader.appendChild(this.readerText);
    this.reader.appendChild(el('p', 'hud-reader-close', 'E to put it down'));
    this.reader.hidden = true;
    this.flash = el('div', 'hud-flash');
    this.timing = el('div', 'hud-timing');
    this.root.append(this.flash, bars, this.prompt, this.timing, this.caption, this.reader);
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

  /** The torch's charge, 0..1; dimmed while it's off. */
  setTorch(charge: number, on: boolean): void {
    this.torch.style.width = `${(charge * 100).toFixed(1)}%`;
    this.torch.classList.toggle('off', !on);
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

  /** A flash of light over the whole view, gone in a blink: a perfect deflect. */
  flashScreen(strength: number): void {
    this.flash.getAnimations().forEach((a) => a.cancel());
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.flash.animate([{ opacity: calm ? strength * 0.35 : strength }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
  }

  /** The deflect timing readout: one short line under the view's centre. `tone` colours it. */
  showTiming(text: string, tone: 'good' | 'near' | 'miss', now: number): void {
    this.timing.textContent = text;
    this.timing.className = `hud-timing on ${tone}`;
    this.timingUntil = now + 1400;
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
    if (this.timingUntil && now > this.timingUntil) {
      this.timing.classList.remove('on');
      this.timingUntil = 0;
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
