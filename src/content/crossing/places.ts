import type { Point } from '../level';
import { BUILDINGS, INN, INN_STAIR, SHOP, STREET } from '../levels/village';
import { KIRK } from '../levels/kirk';
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
  /** A sign board drawn on the building front at this spot, on the street's north or south side. */
  readonly board?: 'north' | 'south';
} & (
    | { readonly kind: 'look'; readonly text: string }
    | { readonly kind: 'read'; readonly title: string; readonly lines: readonly string[] }
    | { readonly kind: 'tideTable' }
    | { readonly kind: 'custom'; readonly custom: Custom; readonly text: string }
    | { readonly kind: 'coffin' }
    | { readonly kind: 'pills' }
    | { readonly kind: 'wait' }
    | { readonly kind: 'sleep' }
  );

/** The funeral director's letter, in William's backpack: read from the phone's bag page, never set down anywhere. */
export const FUNERAL_LETTER: Extract<Spot, { kind: 'read' }> = {
  id: 'funeral-letter',
  kind: 'read',
  x: Number.NaN,
  z: Number.NaN,
  prompt: '',
  title: 'The funeral director’s letter',
  lines: [
    'J. Flett & Son, Funeral Directors, Kirkwall.',
    'Dear Mr Sloan,',
    'We write on behalf of the friends of your father, Mr Alan Sloan, of the Brough, Haugsay, who died suddenly on Tuesday. Please accept our sincere condolences.',
    'In accordance with his written wishes, Mr Sloan will rest at his home on Thursday, the night before the funeral. The service will be held at Haugsay Kirk at ten o’clock on Friday, followed by burial in the kirkyard.',
    'Mrs M. Rendall, of the Skerry Inn, has kindly offered to meet the late ferry on Wednesday, and to give you a room.',
    'Yours sincerely, J. Flett',
  ],
};

export const FERRY_SPOTS: readonly Spot[] = [
  {
    id: 'bow-rail',
    kind: 'look',
    x: 39.5,
    z: 17.8,
    prompt: 'E  Look out over the bow',
    text: 'The island comes out of the rain: low and dark, a light turning at one end, a few lamps along a street. You were five the last time you saw it. You don’t remember it at all.',
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
      'Winter timetable: Monday and Saturday, afternoon sailing. Wednesday, late sailing, arriving 23:45. Weather permitting.',
      'In bad weather sailings may be cancelled at short notice. Notices will be posted here.',
    ],
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
    id: 'inn-window',
    kind: 'look',
    x: 74.4,
    z: -4.6,
    prompt: 'E  Look in at the inn window',
    text: 'The Skerry Inn’s window, steamed at the corners. A fire in the grate, low beams, one woman drinking alone by the fire. A card propped in the glass, in careful capitals: ALAN SLOAN. REST IN PEACE.',
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
    text: 'A grave, freshly dug, under a weighted tarpaulin by the kirkyard wall. Ready for Friday. The rain has pooled on the tarpaulin, and it trembles.',
  },
  {
    id: 'kirk-door',
    kind: 'look',
    x: (KIRK.door[0] + KIRK.door[1]) / 2,
    z: KIRK.maxZ + 0.5,
    prompt: 'E  The kirk door',
    text: 'Locked. A typed notice in a plastic sleeve: HAUGSAY KIRK. FRIDAY, 10 A.M. FUNERAL SERVICE FOR ALAN SLOAN, OF THE BROUGH. ALL WELCOME.',
  },
  {
    id: 'inn-stair',
    kind: 'sleep',
    x: (INN_STAIR.minX + INN_STAIR.maxX) / 2,
    z: INN_STAIR.maxZ + 0.5,
    prompt: 'E  Go up to your room and sleep',
  },
  ...SIGNS(),
  ...GRAVES(),
];

/** A sign on a building's front, to read from the street. */
function sign(id: string, building: { minX: number; maxX: number; minZ: number }, text: string, at?: number): Spot {
  const north = building.minZ < 0;
  return {
    id: `sign-${id}`,
    kind: 'look',
    x: at ?? (building.minX + building.maxX) / 2,
    z: north ? STREET.minZ + 0.45 : STREET.maxZ - 0.45,
    prompt: 'E  Read the sign',
    text,
    board: north ? 'north' : 'south',
  };
}

/** The high street's signs (William, 2026-10-10: buildings have signs to read). Almost everything is shut. */
function SIGNS(): Spot[] {
  const b = BUILDINGS;
  return [
    sign('post-office', b.postOffice, 'HAUGSAY POST OFFICE. Hours on the door: Monday, Wednesday and Friday, 10 till 12. Dark inside.'),
    sign('heritage', b.heritage, 'HAUGSAY HERITAGE CENTRE. Closed for the winter. A faded poster in the window: THE HOWE. 5,000 YEARS BENEATH THE KIRK.'),
    sign('kirk-lane', { minX: 62, maxX: 66, minZ: -12 }, 'A fingerpost at the foot of the lane: KIRK. The lane climbs into the dark.', 62.6),
    sign('inn', INN, 'THE SKERRY INN. A painted board: a ship on a rock. Under it, smaller: PROP. M. RENDALL. The only lit windows on the street.', INN.door[1] + 1.1),
    sign('garage', b.garage, 'ISBISTER’S GARAGE. Repairs, fuel, tyres. A card taped inside the glass: GONE TO KIRKWALL FOR PARTS.'),
    sign('taits', b.taits, 'A house with a boat in its garden, upside down on trestles. On the gatepost, a carved board: TAIT.'),
    sign('surgery', b.surgery, 'HAUGSAY SURGERY. Dr A. Spence. Tuesdays and Thursdays. In an emergency, ring Kirkwall.'),
    sign('shop', SHOP, 'HAUGSAY STORES. Open 9 till 5. A card on the door, in capitals: CLOSED THURSDAY AND FRIDAY. SORRY. — I.', SHOP.door[1] + 1.2),
    sign('bakery', b.bakery, 'THE BAKEHOUSE. Shut. Flour on the inside of the glass, and one loaf left on the rack, going hard.'),
    sign('manse', b.manse, 'THE MANSE. A light is on upstairs. As you look up at it, it goes off.'),
    sign('crafts', b.crafts, 'HAUGSAY CRAFTS. Knitwear, pottery, local honey. A paper sign: CLOSED UNTIL SPRING.'),
    sign('isbisters', b.isbisters, 'A pebble-dashed house. Rowan over the door, and a child’s bicycle lying on its side in the yard, wheel still turning in the wind.'),
    sign('hall', b.hall, 'HAUGSAY COMMUNITY HALL. Notices: whist drive (cancelled), lifeboat fundraiser (cancelled). Pinned over both, newer: FRIDAY, AFTER THE SERVICE. TEA IN THE HALL. FOR ALAN.'),
  ];
}

/** The kirkyard's stones (content/levels/kirk.ts puts them), each with who lies there. */
function GRAVES(): Spot[] {
  const stones: readonly [number, number, string][] = [
    [49, -20, 'ROBERT FLETT. 1931 – 2009. Fisherman. “The sea is his, and he made it.”'],
    [51, -20, 'ANNIE FLETT, née SINCLAIR. 1934 – 2016. Beloved wife and mother.'],
    [49, -24, 'JOHN GROAT. 1898 – 1941. Lost at sea. His body was not recovered.'],
    [51, -24, 'In loving memory of ELSPETH TAIT. 1952 – 1987. Loving mother of three. “Asleep.”'],
    [49, -28, 'WILLIAM ISBISTER, 1870 – 1923, and his wife MARGARET, 1874 – 1951. At rest.'],
    [51, -28, 'JAMES RENDALL. 1940 – 1999. Husband of Morag. “Gone before.” The grass on this one is cut short, and there are fresh flowers.'],
    [50, -32, 'Too worn to read. Moss has the name. A skull and crossed bones carved at the top, and a date: 17—.'],
    [72.5, -22, 'MAGNUS LINKLATER. 1922 – 1990. Loving father and grandfather.'],
    [72.5, -26, 'DAVID MUIR. 1961 – 2019. Beloved husband of Isa. “Till we meet again.”'],
    [72.5, -30, 'CATHERINE HARCUS. 1945 – 2020. Loving mother. Sadly missed.'],
    [72.5, -33, 'PETER DREVER. 1950 – 2002. Crofter. Sunday school teacher. “He listened.”'],
    [56, -18, 'In memory of JAMES SLOAN, 1936 – 1979, and his wife MARY, 1938 – 1979. Lost off the Noup. “The sea gave up not its dead.” Your father was fifteen.'],
    [58, -18, 'A small stone. ELLEN SPENCE. 1990 – 1991. Our little one.'],
    [57, -15, 'SARAH SCOTT. 1918 – 2011. Beloved mother and granny. Fresh flowers in a jar, still in their cellophane.'],
    [71, -19, 'ANDREW CLOUSTON. 1956 – 2024. Loving father. “Always looking out to sea.”'],
  ];
  return stones.map(([x, z, text], i) => ({ id: `grave-${i}`, kind: 'look', x, z: z + 0.45, prompt: 'E  Read the gravestone', text }));
}

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
  { id: 'pills', kind: 'pills', x: -20.8, z: 1.6, prompt: 'E  Your backpack' },
];

export const SPOTS: readonly Spot[] = [...FERRY_SPOTS, ...ISLAND_SPOTS, ...COTTAGE_SPOTS];
/** Everything that can be read again from the phone: what was read in the world, and the letter in the backpack. */
export const READABLES: readonly Spot[] = [FUNERAL_LETTER, ...SPOTS];

/** What the coffin says the first time, and what it offers after. */
export const COFFIN = {
  first: [
    'The coffin rests on the trestles. Plain oak, brass handles, the lid screwed down. A brass plate:',
    'ALAN SLOAN',
    'You came all this way, and you don’t know what to say to him.',
  ],
  sitPrompt: 'E  Sit with him through the night',
  confirm: 'Sit with him until morning? This ends the chapter. Press E again to sit down.',
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
  const lines = ['You pull his chair over to the coffin and sit down beside him. The day goes, and the light with it.'];
  if (done.size === 0) lines.push('You don’t know what you’re meant to do, so you do nothing. You just sit with him.');
  else if (done.size < CUSTOMS.length) lines.push('You did what felt right. You hope it was enough.');
  else lines.push('You did everything the room seemed to ask for. You couldn’t have said why, any of it.');
  lines.push('The fire settles. The sea goes on outside. You think about the letters in the drawer, every one of them read.');
  lines.push(done.has('candle') ? 'Somewhere near dawn, the candle gutters out.' : 'The fire burns down to embers, and the room goes dark around him.');
  lines.push('You don’t remember falling asleep.');
  return lines;
}
