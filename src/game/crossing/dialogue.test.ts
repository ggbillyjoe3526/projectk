import { describe, expect, it } from 'vitest';
import { advance, choose, currentStep, type Dialogue, metFlag, seenFlag, startConversation, type TalkContext, validateDialogue } from './dialogue';

const ann: Dialogue = {
  id: 'ann',
  first: 'hello',
  hub: 'topics',
  nodes: {
    hello: { lines: [{ speaker: 'Ann', text: 'You must be new.' }], next: 'topics' },
    topics: {
      lines: [{ speaker: 'Ann', text: 'What is it?' }],
      options: [
        { label: 'The weather?', to: 'weather' },
        { label: 'Can I wait here?', to: 'wait', when: { causeway: 'shut' } },
        { label: 'About the salt.', to: 'salt', when: { flag: 'sawSalt' } },
        { label: 'Bye.', to: 'bye' },
      ],
    },
    weather: { lines: [{ speaker: 'Ann', text: 'Wet.' }, { speaker: 'Ann', text: 'Always.' }], sets: ['askedWeather'] },
    wait: { lines: [{ speaker: 'Ann', text: 'Sit down, then.' }], effect: 'waitForCauseway' },
    salt: { lines: [{ speaker: 'Ann', text: 'It keeps the damp out.' }] },
    bye: { lines: [{ speaker: 'Ann', text: 'Mind the tide.' }], end: true },
  },
};

const ctx = (over: Partial<TalkContext> = {}): TalkContext => ({ flags: new Set(), causewayOpen: true, ...over });
const labels = (step: ReturnType<typeof currentStep>) => (step.kind === 'choice' ? step.options.map((o) => o.label) : []);

describe('conversations', () => {
  it('opens with the first meeting once, and the topics after', () => {
    const c = ctx();
    const { conversation } = startConversation(ann, c);
    expect(currentStep(conversation, c)).toEqual({ kind: 'line', speaker: 'Ann', text: 'You must be new.' });
    expect(c.flags.has(metFlag('ann'))).toBe(true);
    advance(conversation, c);
    expect(currentStep(conversation, c)).toMatchObject({ kind: 'choice', line: { text: 'What is it?' } });
    const again = startConversation(ann, c).conversation;
    expect(currentStep(again, c)).toMatchObject({ kind: 'choice', line: { text: 'What is it?' } });
  });

  it('asks a question with its answers in one step, and goes on from a line only', () => {
    const c = ctx();
    const { conversation } = startConversation(ann, c);
    advance(conversation, c);
    expect(labels(currentStep(conversation, c))).toEqual(['The weather?', 'Bye.']);
    expect(advance(conversation, c)).toEqual([]);
    choose(conversation, 0, c);
    advance(conversation, c);
    advance(conversation, c);
    expect(currentStep(conversation, c)).not.toHaveProperty('line');
  });

  it('offers only what makes sense now', () => {
    const c = ctx();
    const { conversation } = startConversation(ann, c);
    advance(conversation, c);
    advance(conversation, c);
    expect(labels(currentStep(conversation, c))).toEqual(['The weather?', 'Bye.']);
    c.flags.add('sawSalt');
    const shut = { ...c, causewayOpen: false };
    expect(labels(currentStep(conversation, shut))).toEqual(['The weather?', 'Can I wait here?', 'About the salt.', 'Bye.']);
  });

  it('answers a topic, marks it said, and comes back to the topics without repeating their lines', () => {
    const c = ctx();
    const { conversation } = startConversation(ann, { ...c });
    advance(conversation, c);
    advance(conversation, c);
    choose(conversation, 0, c);
    expect(currentStep(conversation, c)).toMatchObject({ kind: 'line', text: 'Wet.' });
    advance(conversation, c);
    advance(conversation, c);
    const step = currentStep(conversation, c);
    expect(step.kind).toBe('choice');
    if (step.kind === 'choice') expect(step.options[0]).toEqual({ label: 'The weather?', said: true });
    expect(c.flags.has('askedWeather')).toBe(true);
    expect(c.flags.has(seenFlag('ann', 'weather'))).toBe(true);
  });

  it('hands back what a node asks the game to do, and ends where told', () => {
    const c = ctx({ causewayOpen: false });
    const { conversation } = startConversation(ann, c);
    advance(conversation, c);
    advance(conversation, c);
    expect(choose(conversation, 1, c)).toEqual(['waitForCauseway']);
    advance(conversation, c);
    choose(conversation, 2, c);
    expect(advance(conversation, c)).toEqual([]);
    expect(currentStep(conversation, c)).toEqual({ kind: 'over' });
  });

  it('ignores a press at the wrong moment', () => {
    const c = ctx();
    const { conversation } = startConversation(ann, c);
    expect(choose(conversation, 0, c)).toEqual([]);
    expect(currentStep(conversation, c)).toMatchObject({ text: 'You must be new.' });
    advance(conversation, c);
    advance(conversation, c);
    advance(conversation, c);
    expect(currentStep(conversation, c).kind).toBe('choice');
    choose(conversation, 9, c);
    expect(currentStep(conversation, c).kind).toBe('choice');
  });

  it('catches broken links and unreachable nodes', () => {
    expect(validateDialogue(ann)).toEqual([]);
    const broken: Dialogue = { ...ann, nodes: { ...ann.nodes, topics: { lines: [], options: [{ label: 'x', to: 'nowhere' }] } } };
    expect(validateDialogue(broken)).toEqual(expect.arrayContaining([expect.stringContaining('"nowhere"'), expect.stringContaining('nothing leads to node "weather"')]));
  });
});
