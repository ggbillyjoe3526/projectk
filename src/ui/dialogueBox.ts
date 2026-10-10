import type { Step } from '../game/crossing/dialogue';
import { el } from './dom';

/**
 * A conversation on screen (game/crossing/dialogue.ts): who's speaking, what they say, and when it's William's turn,
 * what he can say, numbered. E or a click goes on from a line; a number key or a click picks an answer. A topic
 * already asked about is shown dimmed. The box only reports what was pressed; the chapter moves the conversation.
 */
export class DialogueBox {
  private readonly root: HTMLDivElement;
  private readonly speaker: HTMLDivElement;
  private readonly text: HTMLParagraphElement;
  private readonly options: HTMLOListElement;
  private readonly hint: HTMLParagraphElement;
  private picked: number | null = null;
  private clicked = false;
  private choosing = 0;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'talk');
    this.speaker = el('div', 'talk-speaker');
    this.text = el('p', 'talk-text');
    this.options = el('ol', 'talk-options');
    this.hint = el('p', 'talk-hint');
    this.root.append(this.speaker, this.text, this.options, this.hint);
    this.root.hidden = true;
    // A click on the box goes on (or picks), and is never also a swing.
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.root.addEventListener('click', () => {
      if (!this.choosing) this.clicked = true;
    });
    window.addEventListener('keydown', (e) => {
      if (this.root.hidden || !this.choosing || e.repeat) return;
      const n = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
      if (n && Number(n) <= this.choosing) {
        this.picked = Number(n) - 1;
        e.preventDefault();
      }
    });
    parent.appendChild(this.root);
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  /** Show a step: a line (with its speaker's name), or the choice. `speakerName` maps a speaker to how it's shown. */
  show(step: Step, interactKey: string): void {
    if (step.kind === 'over') return this.hide();
    this.root.hidden = false;
    this.picked = null;
    this.clicked = false;
    if (step.kind === 'line') {
      this.choosing = 0;
      this.showLine(step.speaker, step.text);
      this.options.replaceChildren();
      this.options.hidden = true;
      this.hint.textContent = `${interactKey} or click to go on`;
      return;
    }
    // The question comes with its answers; coming back to the topics, the last line said stays above them.
    if (step.line) this.showLine(step.line.speaker, step.line.text);
    this.choosing = step.options.length;
    this.options.hidden = false;
    this.options.replaceChildren(
      ...step.options.map((o, i) => {
        const item = el('li');
        const pick = el('button', o.said ? 'talk-option said' : 'talk-option', `${i + 1}. ${o.label}`);
        pick.type = 'button';
        pick.addEventListener('click', (e) => {
          e.stopPropagation();
          this.picked = i;
        });
        item.appendChild(pick);
        return item;
      }),
    );
    this.hint.textContent = step.options.length > 1 ? `1–${step.options.length} or click to answer` : '1 or click to answer';
  }

  private showLine(speaker: string | undefined, text: string): void {
    this.speaker.textContent = speaker ?? '';
    this.speaker.hidden = speaker === undefined;
    this.text.textContent = text;
    this.text.classList.toggle('narration', speaker === undefined);
    this.text.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
    this.choosing = 0;
    this.picked = null;
    this.clicked = false;
  }

  /** The answer picked since the last call, if any. */
  takePick(): number | null {
    const p = this.picked;
    this.picked = null;
    return p;
  }

  /** Whether the line was clicked since the last call. */
  takeClick(): boolean {
    const c = this.clicked;
    this.clicked = false;
    return c;
  }
}
