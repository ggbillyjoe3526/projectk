import type { Point } from '../level';
import { FLAGS } from './people';

/**
 * Chapter 1's things to look at and use, by place: what the prompt says (E), and what using it shows. Short looks are
 * a caption; letters and notices open in the reader and stay in the phone's notes. In the cottage are the vigil's
 * five customs, which nothing explains: each is done once, and recorded for the ending (chapter 1 plan, beat 6).
 */

/** The vigil's customs. */
export type Custom = 'salt' | 'mirror' | 'clock' | 'window' | 'candle';
export const CUSTOMS: readonly Custom[] = ['salt', 'mirror', 'clock', 'window', 'candle'];

export type Spot = Point & {
  readonly id: string;
  readonly prompt: string;
  /** A flag set on using it (what other people's topics wait on). */
  readonly sets?: string;
  /** Only there while the causeway is under water. */
  readonly whileShut?: boolean;
} & (
    | { readonly kind: 'look'; readonly text: string }
    | { readonly kind: 'read'; readonly title: string; readonly lines: readonly string[] }
    | { readonly kind: 'tideTable' }
    | { readonly kind: 'custom'; readonly custom: Custom; readonly text: string }
    | { readonly kind: 'coffin' }
    | { readonly kind: 'pills' }
    | { readonly kind: 'wait' }
  );

/** The funeral director's letter, in William's bag on the ferry. */
export const FUNERAL_LETTER: Extract<Spot, { kind: 'read' }> = {
  id: 'funeral-letter',
  kind: 'read',
  x: 39.5,
  z: 43.75,
  prompt: 'E  Your bag',
  title: 'The funeral director’s letter',
  lines: [
    'J. Flett & Son, Funeral Directors, Kirkwall.',
    'Dear Mr Sloan,',
    'We write on behalf of the friends of your father, Mr Alan Sloan, of the Brough, Haugsay, who died suddenly on Tuesday. Please accept our sincere condolences.',
    'In accordance with his written wishes, Mr Sloan will rest at his home on the night before the funeral. The service will be held at Haugsay Kirk at ten o’clock on Friday, followed by burial in the kirkyard.',
    'Mrs M. Rendall, a neighbour, has kindly offered to meet the Thursday afternoon ferry.',
    'Yours sincerely, J. Flett',
  ],
};

export const FERRY_SPOTS: readonly Spot[] = [
  FUNERAL_LETTER,
  {
    id: 'bow-rail',
    kind: 'look',
    x: 39.5,
    z: 17.8,
    prompt: 'E  Look out over the bow',
    text: 'The island comes out of the rain: low and dark, a light turning at one end. You were five the last time you saw it. You don’t remember it at all.',
  },
];

export const ISLAND_SPOTS: readonly Spot[] = [
  {
    id: 'pier-timetable',
    kind: 'read',
    x: 30.3,
    z: 17.9,
    prompt: 'E  Read the timetable',
    title: 'The timetable at the pier',
    lines: [
      'HAUGSAY PIER. Skerry Line sailings to Kirkwall.',
      'Winter timetable: Monday, Thursday and Saturday. Afternoon sailing, weather permitting.',
      'In bad weather sailings may be cancelled at short notice. Notices will be posted here.',
    ],
  },
  {
    id: 'wait-for-tide',
    kind: 'wait',
    x: 13.4,
    z: 2.4,
    prompt: 'E  Sit on the wall and wait for the tide',
    whileShut: true,
  },
  {
    id: 'doorstep-salt',
    kind: 'look',
    x: 47,
    z: -4.6,
    prompt: 'E  Look at the doorstep',
    text: 'A line of salt across the doorstep, fresh and unbroken, from one side of the frame to the other.',
    sets: FLAGS.sawSalt,
  },
  {
    id: 'door-rowan',
    kind: 'look',
    x: 45.5,
    z: 4.6,
    prompt: 'E  Look at the door',
    text: 'A sprig of rowan over the door, tied with red thread. The berries are fresh. Someone put it up this week.',
    sets: FLAGS.sawRowan,
  },
  {
    id: 'shop-notice',
    kind: 'read',
    x: 52.7,
    z: 9.6,
    prompt: 'E  Read the notice on the counter',
    title: 'A notice in the shop',
    lines: ['Handwritten, propped against the till:', 'CLOSED FRIDAY for Alan Sloan’s funeral. Service at the kirk, ten o’clock.', 'Honesty box as usual. Back Saturday. — I.'],
  },
  {
    id: 'inn-window',
    kind: 'look',
    x: 73,
    z: -4.6,
    prompt: 'E  Look at the inn window',
    text: 'The Skerry Inn. A card in the window, in careful capitals: CLOSED TONIGHT. ALAN SLOAN, REST IN PEACE.',
  },
  {
    id: 'war-memorial',
    kind: 'look',
    x: 67.8,
    z: -14.5,
    prompt: 'E  Read the war memorial',
    text: 'Two wars’ worth of names, and below them a newer plaque: LOST AT SEA. Fishermen, a lifeboat crew. Near the bottom, two names together: JAMES SLOAN. MARY SLOAN.',
    sets: FLAGS.sawMemorial,
  },
  {
    id: 'open-grave',
    kind: 'look',
    x: 53.2,
    z: -16,
    prompt: 'E  Look at the grave',
    text: 'A grave, freshly dug, under a weighted tarpaulin by the kirkyard wall. Ready for tomorrow.',
  },
  {
    id: 'kirk-sword',
    kind: 'look',
    x: 62,
    z: -33.2,
    prompt: 'E  Look at the sword',
    text: 'An old sword on a stone slab before the altar, black with age and lightly oiled. A typed card: FOUND IN THE HOWE BENEATH THIS KIRK, 1843. PLEASE DO NOT TOUCH.',
    sets: FLAGS.sawSword,
  },
];

export const COTTAGE_SPOTS: readonly Spot[] = [
  { id: 'coffin', kind: 'coffin', x: -26.7, z: 1.5, prompt: 'E  The coffin' },
  {
    id: 'candle',
    kind: 'custom',
    custom: 'candle',
    x: -25.25,
    z: 1.6,
    prompt: 'E  The candle',
    text: 'There are matches on the stool. You light the candle at his head, and the room draws in around it.',
  },
  {
    id: 'salt',
    kind: 'custom',
    custom: 'salt',
    x: -24.5,
    z: 0.35,
    prompt: 'E  The saucer of salt',
    text: 'A saucer of salt on the table, put out for something. You set it on the coffin lid, over his heart. It seems to belong there. You couldn’t say why.',
  },
  {
    id: 'mirror',
    kind: 'custom',
    custom: 'mirror',
    x: -27.65,
    z: -1.875,
    prompt: 'E  The mirror',
    text: 'Your face in his mirror. You have his jaw; you can see it now. You turn the mirror to face the wall, and feel better for it.',
  },
  {
    id: 'clock',
    kind: 'custom',
    custom: 'clock',
    x: -26.65,
    z: -2.2,
    prompt: 'E  The clock on the mantel',
    text: 'His clock, ticking. It’s very loud in here. You open the little glass door and hold the hands until it stops. The quiet is better.',
  },
  {
    id: 'window',
    kind: 'custom',
    custom: 'window',
    x: -23,
    z: -2.5,
    prompt: 'E  The window',
    text: 'The room is close with the fire. You push the sash up a few inches. Cold air, and the sound of the sea.',
  },
  {
    id: 'letters',
    kind: 'read',
    x: -24.6,
    z: 2.05,
    prompt: 'E  The dresser drawer',
    title: 'Your letters, in his drawer',
    lines: [
      'The drawer sticks. Inside, held with a rubber band gone soft: letters. Your letters.',
      'Forty-one of them. Your mother’s handwriting on the early envelopes, then yours, getting older. Every one opened. Every one read so often the folds have worn through.',
      'Underneath, a sheet of his writing paper, in his hand:',
      '“William. I’ve started this eleven times. I don’t know what a boy of nine wants to hear from a father he hasn’t seen in four years. There are things I can’t put in a letter. I read every one of yours. Tell me more about the football.”',
      'It isn’t finished. It was never sent.',
      'At the back of the drawer, a photograph: a young man in British Army uniform, squinting into sun somewhere that isn’t Orkney. On the back, in pencil: A.S.',
    ],
  },
  {
    id: 'whisky',
    kind: 'look',
    x: -23.6,
    z: -0.9,
    prompt: 'E  The bottle on the table',
    text: 'A bottle of whisky, the seal unbroken, dust on its shoulders. Whatever else he did last summer, he didn’t open this.',
  },
  {
    id: 'chair',
    kind: 'look',
    x: -25.5,
    z: -1.65,
    prompt: 'E  His chair',
    text: 'His chair by the fire. The cushion has worn to the shape of him.',
  },
  { id: 'tide-table', kind: 'tideTable', x: -20.6, z: -1.8, prompt: 'E  Read the tide table' },
  { id: 'pills', kind: 'pills', x: -20.8, z: 1.6, prompt: 'E  Your bag' },
];

export const SPOTS: readonly Spot[] = [...FERRY_SPOTS, ...ISLAND_SPOTS, ...COTTAGE_SPOTS];

/** What the coffin says the first time, and what it offers after. */
export const COFFIN = {
  first: [
    'The coffin rests on the trestles. Plain oak, brass handles, the lid screwed down. A brass plate:',
    'ALAN SLOAN',
    'You came all this way, and you don’t know what to say to him.',
  ],
  sitPrompt: 'E  Sit with him through the night',
  confirm: 'Sit with him until morning? This ends the day. Press E again to sit down.',
} as const;

/** The pill, a free choice every night (William, 2026-10-10: no consequence for now). */
export const PILLS = {
  ask: 'Your tablets, in the side pocket. One a night, the same time, the same glass of water. You haven’t missed one in two years.',
  take: 'Take one',
  skip: 'Not tonight',
  taken: 'You take one with a cupful from the tap, the same as every night.',
  skipped: 'You put them back in the pocket. Just tonight.',
  decided: 'Your bag. There’s nothing else you need from it tonight.',
} as const;

/** The vigil's end: what the black screen says, by what William did (chapter 1 plan, beat 6). */
export function vigilLines(done: ReadonlySet<Custom>): string[] {
  const lines = ['You pull his chair over to the coffin and sit down beside him.'];
  if (done.size === 0) lines.push('You don’t know what you’re meant to do, so you do nothing. You just sit with him.');
  else if (done.size < CUSTOMS.length) lines.push('You did what felt right. You hope it was enough.');
  else lines.push('You did everything the room seemed to ask for. You couldn’t have said why, any of it.');
  lines.push('The fire settles. The sea goes on outside. You think about the letters in the drawer, every one of them read.');
  lines.push(done.has('candle') ? 'Somewhere near dawn, the candle gutters out.' : 'The fire burns down to embers, and the room goes dark around him.');
  lines.push('You don’t remember falling asleep.');
  return lines;
}
