/**
 * Talking to people (chapter 1 onward): a conversation is a small graph of nodes, each a few lines and then either a
 * choice of what to say, the next node, the end, or (by default) back to the person's list of topics, the hub. Pure:
 * the runtime shows the current step (ui/dialogueBox.ts) and applies the effects a node asks for.
 *
 * Flags record what has been said, for good: `met:<person>` once the conversation has started, `seen:<person>:<node>`
 * for every node shown, and whatever a node `sets`. Options can wait on a flag (`when`), or on the causeway being
 * open or shut, so a person only offers what makes sense now.
 */

export interface Line {
  /** Who says it; none for what William does or sees. */
  readonly speaker?: string;
  readonly text: string;
}

/** What a node asks the game to do once it's shown. */
export type Effect = 'waitForCauseway' | 'teachListen' | 'takePill' | 'skipPill' | 'goToInn' | 'pickUpBag';

export interface Condition {
  readonly flag?: string;
  readonly notFlag?: string;
  readonly causeway?: 'open' | 'shut';
}

export interface Option {
  readonly label: string;
  readonly to: string;
  readonly when?: Condition;
}

export interface Node {
  readonly lines: readonly Line[];
  readonly options?: readonly Option[];
  /** After the lines, on to this node (when there are no options). */
  readonly next?: string;
  /** After the lines, the conversation is over. */
  readonly end?: boolean;
  readonly sets?: readonly string[];
  readonly effect?: Effect;
}

export interface Dialogue {
  /** The person's id: their flags are named by it. */
  readonly id: string;
  /** The first node on meeting them, if it differs from the hub. */
  readonly first?: string;
  /** Their list of topics: where a topic's answer comes back to. */
  readonly hub: string;
  readonly nodes: Readonly<Record<string, Node>>;
}

/** What the game knows when a conversation asks. */
export interface TalkContext {
  readonly flags: Set<string>;
  readonly causewayOpen: boolean;
}

export interface Conversation {
  readonly dialogue: Dialogue;
  node: string;
  /** The line showing; past the last line, the choice (or the move on). */
  line: number;
  over: boolean;
}

export type Step =
  | { readonly kind: 'line'; readonly speaker: string | undefined; readonly text: string }
  | {
      readonly kind: 'choice';
      readonly options: readonly { readonly label: string; readonly said: boolean }[];
      /** The node's last line, shown with the answers it asks for (none coming back to the hub). */
      readonly line?: Line;
    }
  | { readonly kind: 'over' };

export const metFlag = (person: string): string => `met:${person}`;
export const seenFlag = (person: string, node: string): string => `seen:${person}:${node}`;

function nodeOf(d: Dialogue, id: string): Node {
  const node = d.nodes[id];
  if (!node) throw new Error(`Dialogue "${d.id}" has no node "${id}"`);
  return node;
}

export function holds(c: Condition | undefined, ctx: TalkContext): boolean {
  if (!c) return true;
  if (c.flag !== undefined && !ctx.flags.has(c.flag)) return false;
  if (c.notFlag !== undefined && ctx.flags.has(c.notFlag)) return false;
  if (c.causeway === 'open' && !ctx.causewayOpen) return false;
  if (c.causeway === 'shut' && ctx.causewayOpen) return false;
  return true;
}

/** The options a node offers now. */
export function optionsNow(d: Dialogue, node: string, ctx: TalkContext): Option[] {
  return (nodeOf(d, node).options ?? []).filter((o) => holds(o.when, ctx));
}

/** Show a node: record it, and return its effect. `quiet` skips its lines (coming back to the hub). */
function enter(c: Conversation, id: string, ctx: TalkContext, quiet: boolean, effects: Effect[]): void {
  const node = nodeOf(c.dialogue, id);
  c.node = id;
  c.line = quiet ? node.lines.length : 0;
  ctx.flags.add(seenFlag(c.dialogue.id, id));
  for (const f of node.sets ?? []) ctx.flags.add(f);
  if (node.effect) effects.push(node.effect);
  settle(c, ctx, effects);
}

/** Past a node's lines with nothing to choose: move on (or end). */
function settle(c: Conversation, ctx: TalkContext, effects: Effect[]): void {
  const node = nodeOf(c.dialogue, c.node);
  if (c.line < node.lines.length) return;
  if (optionsNow(c.dialogue, c.node, ctx).length > 0) return;
  if (node.end) c.over = true;
  else if (node.next !== undefined) enter(c, node.next, ctx, false, effects);
  else if (c.node !== c.dialogue.hub) enter(c, c.dialogue.hub, ctx, true, effects);
  else c.over = true;
}

export function startConversation(d: Dialogue, ctx: TalkContext): { conversation: Conversation; effects: Effect[] } {
  const effects: Effect[] = [];
  const first = d.first !== undefined && !ctx.flags.has(metFlag(d.id));
  ctx.flags.add(metFlag(d.id));
  const conversation: Conversation = { dialogue: d, node: d.hub, line: 0, over: false };
  enter(conversation, first ? d.first! : d.hub, ctx, false, effects);
  return { conversation, effects };
}

export function currentStep(c: Conversation, ctx: TalkContext): Step {
  if (c.over) return { kind: 'over' };
  const node = nodeOf(c.dialogue, c.node);
  const line = node.lines[c.line];
  const options = optionsNow(c.dialogue, c.node, ctx).map((o) => ({ label: o.label, said: ctx.flags.has(seenFlag(c.dialogue.id, o.to)) }));
  // The last line before a choice comes with it, so answering a question is one press, not two.
  const asks = options.length > 0 && c.line >= node.lines.length - 1;
  if (line && !asks) return { kind: 'line', speaker: line.speaker, text: line.text };
  if (options.length === 0) return { kind: 'over' };
  return line ? { kind: 'choice', options, line } : { kind: 'choice', options };
}

/** On from a line (E, or a click). Nothing at a choice. */
export function advance(c: Conversation, ctx: TalkContext): Effect[] {
  const effects: Effect[] = [];
  if (c.over || currentStep(c, ctx).kind !== 'line') return effects;
  c.line++;
  settle(c, ctx, effects);
  return effects;
}

/** Pick the `index`th option shown. Nothing when there's no choice showing, or no such option. */
export function choose(c: Conversation, index: number, ctx: TalkContext): Effect[] {
  const effects: Effect[] = [];
  if (c.over || currentStep(c, ctx).kind !== 'choice') return effects;
  const option = optionsNow(c.dialogue, c.node, ctx)[index];
  if (option) enter(c, option.to, ctx, false, effects);
  return effects;
}

/** Authoring mistakes in a dialogue, as readable lines: links to nodes that don't exist, and nodes nothing reaches. */
export function validateDialogue(d: Dialogue): string[] {
  const problems: string[] = [];
  const ids = Object.keys(d.nodes);
  const linked = new Set<string>([d.hub, ...(d.first ? [d.first] : [])]);
  for (const [id, node] of Object.entries(d.nodes)) {
    const targets = [...(node.options ?? []).map((o) => o.to), ...(node.next !== undefined ? [node.next] : [])];
    for (const t of targets) {
      if (!d.nodes[t]) problems.push(`"${d.id}": node "${id}" leads to "${t}", which doesn't exist.`);
      linked.add(t);
    }
    if (node.lines.length === 0 && !node.options?.length) problems.push(`"${d.id}": node "${id}" has nothing to show.`);
  }
  for (const start of [d.hub, d.first]) if (start !== undefined && !d.nodes[start]) problems.push(`"${d.id}": starts at "${start}", which doesn't exist.`);
  for (const id of ids) if (!linked.has(id)) problems.push(`"${d.id}": nothing leads to node "${id}".`);
  return problems;
}
