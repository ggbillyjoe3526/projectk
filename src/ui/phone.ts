import { el } from './dom';

/**
 * William's phone, a first version (chapter 1 plan: messages and the document log; the full menu comes later): his
 * texts, newest first, and his notes, the letters and notices he has read, which open again in the reader. A text
 * arriving shows a short notice at the top of the view. The phone's header shows the time, its signal and, in chapter 1, the tide (the time is only on the phone, never the
 * HUD: William, 2026-10-10).
 */

export interface PhoneMessage {
  readonly from: string;
  readonly when: string;
  readonly text: string;
}

export interface PhoneNote {
  readonly id: string;
  readonly title: string;
}

export class Phone {
  private readonly root: HTMLDivElement;
  private readonly signal: HTMLSpanElement;
  private readonly clock: HTMLSpanElement;
  private readonly tideLine: HTMLParagraphElement;
  private readonly list: HTMLDivElement;
  private readonly tabs: Record<'messages' | 'notes', HTMLButtonElement>;
  private readonly toastBox: HTMLDivElement;
  private tab: 'messages' | 'notes' = 'messages';
  private messages: readonly PhoneMessage[] = [];
  private notes: readonly PhoneNote[] = [];
  private toastUntil = 0;

  /** `onNote` opens a note again (the phone closes first). */
  constructor(parent: HTMLElement, private readonly onNote: (id: string) => void, closeHint: string) {
    this.root = el('div', 'phone');
    const head = el('div', 'phone-head');
    this.clock = el('span', 'phone-clock');
    this.signal = el('span', 'phone-signal');
    head.append(this.clock, this.signal);
    this.tideLine = el('p', 'phone-tide');
    const tabRow = el('div', 'phone-tabs');
    this.tabs = { messages: this.tabButton('Messages', 'messages'), notes: this.tabButton('Notes', 'notes') };
    tabRow.append(this.tabs.messages, this.tabs.notes);
    this.list = el('div', 'phone-list');
    this.root.append(head, this.tideLine, tabRow, this.list, el('p', 'phone-close', closeHint));
    this.root.hidden = true;
    this.root.addEventListener('mousedown', (e) => e.stopPropagation());
    this.toastBox = el('div', 'phone-toast');
    parent.append(this.root, this.toastBox);
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
    if (this.open) this.render();
  }

  close(): void {
    this.root.hidden = true;
  }

  /** The texts, oldest first (they're listed newest first). */
  setMessages(messages: readonly PhoneMessage[]): void {
    this.messages = messages;
    if (this.open) this.render();
  }

  setNotes(notes: readonly PhoneNote[]): void {
    this.notes = notes;
    if (this.open) this.render();
  }

  /** The header: the time, the signal, and (where the chapter keeps one) what the tide is doing. */
  setStatus(time: string, signal: string, tide = ''): void {
    if (this.clock.textContent !== time) this.clock.textContent = time;
    if (this.signal.textContent !== signal) this.signal.textContent = signal;
    if (this.tideLine.textContent !== tide) this.tideLine.textContent = tide;
    this.tideLine.hidden = tide === '';
  }

  /** A notice at the top of the view: a text arriving. */
  toast(text: string, now: number, seconds = 5): void {
    this.toastBox.textContent = text;
    this.toastBox.classList.add('on');
    this.toastUntil = now + seconds * 1000;
  }

  frame(now: number): void {
    if (this.toastUntil && now > this.toastUntil) {
      this.toastBox.classList.remove('on');
      this.toastUntil = 0;
    }
  }

  private tabButton(label: string, tab: 'messages' | 'notes'): HTMLButtonElement {
    const b = el('button', 'phone-tab', label);
    b.type = 'button';
    b.addEventListener('click', () => {
      this.tab = tab;
      this.render();
    });
    return b;
  }

  private render(): void {
    this.tabs.messages.classList.toggle('on', this.tab === 'messages');
    this.tabs.notes.classList.toggle('on', this.tab === 'notes');
    if (this.tab === 'messages') {
      const rows = [...this.messages].reverse().map((m) => {
        const row = el('div', 'phone-message');
        const top = el('div', 'phone-message-top');
        top.append(el('span', 'phone-from', m.from), el('span', 'phone-when', m.when));
        row.append(top, el('p', 'phone-text', m.text));
        return row;
      });
      this.list.replaceChildren(...(rows.length ? rows : [el('p', 'phone-empty', 'No messages.')]));
      return;
    }
    const rows = this.notes.map((n) => {
      const b = el('button', 'phone-note', n.title);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.close();
        this.onNote(n.id);
      });
      return b;
    });
    this.list.replaceChildren(...(rows.length ? rows : [el('p', 'phone-empty', 'Nothing yet. Letters and notices you read are kept here.')]));
  }
}
