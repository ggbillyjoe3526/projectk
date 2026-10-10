import type { Dialogue } from '../../game/crossing/dialogue';
import type { Placement } from '../level';

/**
 * The people of chapter 1, the night William arrives: who they are, where they stand, how they look in greybox, and
 * what they say (game/crossing/dialogue.ts). Each knew Alan Sloan, says a little and holds back a little, and each
 * tells the death a different way. These are the people who turn in chapter 2, so meeting them now is what makes that
 * hurt. Names, firms and places are made up for the game.
 *
 * It's a quarter to midnight and the island is shut: Morag meets the late boat and keeps the inn, the one place open;
 * Isa is there with a late glass; Tam is out in the street, listening to the ground. The minister (`RUTH_HARCUS`) isn't
 * about tonight; she's kept for the funeral.
 */

export interface Look {
  /** Coat or jacket, trousers, skin, and a detail (a hi-vis stripe, a collar, an apron), as colours. */
  readonly coat: number;
  readonly legs: number;
  readonly skin: number;
  readonly detail?: number;
  /** Shorter or taller than the player's 1.0. */
  readonly height: number;
}

export interface Person extends Placement {
  readonly id: string;
  readonly name: string;
  /** What William calls them before they've met ("the old woman"). */
  readonly stranger: string;
  readonly look: Look;
  /** Kneeling with a palm on the ground, until spoken to. */
  readonly kneeling?: boolean;
  /** Said once as the player first comes near, before they've spoken. */
  readonly notice?: string;
  readonly dialogue: Dialogue;
}

const MAGNUS = 'Magnus';
const MORAG = 'Morag';
const ISA = 'Isa';
const TAM = 'Tam';
const RUTH = 'Ruth';

/** Flags other things look for: what William has been told or has seen. */
export const FLAGS = {
  toldTide: 'toldTide',
  /** Morag offered her room, and William said yes, or said he'd find his own way. */
  acceptedRoom: 'acceptedRoom',
  declinedRoom: 'declinedRoom',
  /** He spent the night at the inn. */
  slept: 'slept',
  toldVigil: 'toldVigil',
  taughtListen: 'taughtListen',
  sawSalt: 'saw:salt',
  sawRowan: 'saw:rowan',
  sawSword: 'saw:sword',
  sawMemorial: 'saw:memorial',
} as const;

export const MAGNUS_LINKLATER: Person = {
  id: 'magnus',
  name: 'Magnus Linklater',
  stranger: 'the deckhand',
  x: 37.4,
  z: 33.6,
  facing: -Math.PI / 2,
  look: { coat: 0x1d2a3a, legs: 0x22252a, skin: 0xa48a74, detail: 0xd8e04a, height: 1.04 },
  notice: 'A deckhand in a wet hi-vis jacket is coiling a rope by the gangway. He keeps glancing at you.',
  dialogue: {
    id: 'magnus',
    first: 'hello',
    hub: 'topics',
    nodes: {
      hello: {
        lines: [
          { speaker: MAGNUS, text: 'Sloan, is it? You were on the list.' },
          { speaker: MAGNUS, text: 'You’ll be Alan’s boy. You’ve his walk. Magnus Linklater; I work the boat. I’m sorry for your trouble.' },
        ],
        next: 'topics',
      },
      topics: {
        lines: [{ speaker: MAGNUS, text: 'Anything you need?' }],
        options: [
          { label: 'You knew my father?', to: 'knew' },
          { label: 'How long till we’re in?', to: 'howLong' },
          { label: 'Is it always this quiet?', to: 'quiet' },
          { label: 'I’ll leave you to it.', to: 'bye' },
        ],
      },
      knew: {
        lines: [
          { speaker: MAGNUS, text: 'Everybody knew Alan. You couldn’t not, on Haugsay.' },
          { speaker: MAGNUS, text: 'He kept a lamp in his window, out on the Brough. Every night, thirty years. Coming in late on the boat, that was the first light you’d see, before the lighthouse even.' },
          { speaker: MAGNUS, text: 'Daft thing to miss. A lamp. But I’ll miss it.' },
        ],
      },
      howLong: {
        lines: [
          { speaker: MAGNUS, text: 'Twenty minutes, if she doesn’t get worse.' },
          { speaker: MAGNUS, text: 'There’s a blow coming tomorrow night. If you’re not off the island before it, you’ll be there till it’s done.' },
        ],
      },
      quiet: {
        lines: [
          { speaker: MAGNUS, text: 'Out of season. Nobody comes to Haugsay in the winter unless they were born there or they’re being buried there.' },
          { text: 'He hears himself, and looks at the deck.' },
          { speaker: MAGNUS, text: 'Sorry. That came out wrong.' },
        ],
      },
      bye: { lines: [{ speaker: MAGNUS, text: 'Aye. Mind the step when we’re in. It’s greasy.' }], end: true },
    },
  },
};

/** Where Morag stands behind the bar, once she's home. */
export const MORAG_AT_INN = { x: 73.4, z: -11.05, facing: 0 } as const;
/** Her way home from the pier: up the shore, along the high street, in at the inn door and round behind the bar. */
export const MORAG_WAY_HOME: readonly { x: number; z: number }[] = [
  { x: 33.6, z: 9.5 },
  { x: 38.5, z: 1.5 },
  { x: 60, z: -1.5 },
  { x: 68.8, z: -3.6 },
  { x: 68.8, z: -6.4 },
  { x: 69.8, z: -11 },
  MORAG_AT_INN,
];

export const MORAG_RENDALL: Person = {
  id: 'morag',
  name: 'Morag Rendall',
  stranger: 'the old woman',
  x: 31.9,
  z: 14.2,
  facing: Math.PI / 2 + 0.6,
  look: { coat: 0x4a3a44, legs: 0x2a2626, skin: 0xb09a88, detail: 0x8a8a7a, height: 0.92 },
  notice: 'An old woman is waiting under the lamp at the top of the pier, at a quarter to midnight, as if it were nothing. She lifts a hand.',
  dialogue: {
    id: 'morag',
    first: 'hello',
    hub: 'topics',
    nodes: {
      hello: {
        lines: [
          { speaker: MORAG, text: 'There you are. William.' },
          { text: 'She says your name as if she’s been practising it.' },
          { speaker: MORAG, text: 'Morag Rendall. I keep the inn. I’m the one that rang your mother. You’ll not remember me, but I mind you fine: a peedie thing, always down at the water’s edge.' },
          { speaker: MORAG, text: 'I’ve been waiting on this boat a long while.' },
          { text: 'She smiles. It goes on a little too long.' },
        ],
        next: 'topics',
      },
      topics: {
        lines: [{ speaker: MORAG, text: 'What is it, buddo?' }],
        options: [
          { label: 'How do I get to my father’s house?', to: 'directions' },
          { label: 'Is there somewhere I can stay tonight?', to: 'room', when: { notFlag: FLAGS.acceptedRoom } },
          { label: 'Which is my room?', to: 'whichRoom', when: { flag: FLAGS.acceptedRoom, notFlag: FLAGS.slept } },
          { label: 'How did he die?', to: 'death' },
          { label: 'What happens now?', to: 'now' },
          { label: 'What do I do, sitting with him?', to: 'whatToDo', when: { flag: FLAGS.toldVigil } },
          { label: 'Why is there salt on the doorsteps?', to: 'salt', when: { flag: FLAGS.sawSalt } },
          { label: 'I should go.', to: 'bye' },
        ],
      },
      directions: {
        lines: [
          { speaker: MORAG, text: 'Over the causeway, out on the Brough. Along the shore from the pier and keep the sea on your right. You’ll see the lighthouse.' },
          { speaker: MORAG, text: 'But not tonight. The sea came over the causeway at a quarter past eleven. You’ve missed it by half an hour.' },
          { speaker: MORAG, text: 'It’ll not let you over till the morning. Seven, maybe. Your father would have told you to the minute; he had the tide table pinned by his door.' },
          { speaker: MORAG, text: 'Don’t try it in the dark. The sea comes over that causeway faster than you’d credit.' },
        ],
        sets: [FLAGS.toldTide],
      },
      room: {
        lines: [
          { speaker: MORAG, text: 'I’ve a room made up for you at the inn. I made it up on Monday.' },
          { text: 'Monday. He died on the Tuesday.' },
          { speaker: MORAG, text: 'Come away up with me. It’s warm, and it’s no night to be out on your own.' },
        ],
        options: [
          { label: 'Thank you. I’ll come with you.', to: 'accept' },
          { label: 'I’ll find my own way.', to: 'decline' },
        ],
      },
      accept: {
        lines: [{ speaker: MORAG, text: 'Good lad. Come away in out of the wet.' }],
        sets: [FLAGS.acceptedRoom],
        next: 'goToInn',
      },
      goToInn: {
        // The cut: the line shows once they're inside, by the fire.
        lines: [{ speaker: MORAG, text: 'There now. Sit in by the fire and get the cold out of you. Your room’s up the stair.' }],
        effect: 'goToInn',
        end: true,
      },
      decline: {
        lines: [
          { speaker: MORAG, text: 'Suit yourself.' },
          { speaker: MORAG, text: 'The Skerry Inn, on the high street. The door’s on the latch. You’ll not miss it: it’s the only light.' },
        ],
        sets: [FLAGS.declinedRoom],
      },
      whichRoom: {
        lines: [
          { speaker: MORAG, text: 'Up the stair, first on the left. There’s a bottle in the bed.' },
          { speaker: MORAG, text: 'Sleep, William. The tide’ll wait for you. It waited for him.' },
        ],
      },
      death: {
        lines: [
          { speaker: MORAG, text: 'Oh, peacefully. In his bed, in his sleep. He’d not have known a thing.' },
          { speaker: MORAG, text: 'He’d been out walking on the shore, you see, in the cold. It gets into you, the cold. And then his heart.' },
          { text: 'In his bed, she said. Then on the shore.' },
          { speaker: MORAG, text: 'It’s late, William. You’ll hear all sorts on this island, and none of it matters now.' },
        ],
      },
      now: {
        lines: [
          { speaker: MORAG, text: 'Tomorrow you’ll go over to him. He’s lying at home.' },
          { speaker: MORAG, text: 'Somebody sits up with them, the night before. That’s the custom here. It should be family.' },
          { speaker: MORAG, text: 'The funeral’s Friday, ten o’clock at the kirk. We put it back a day, so you’d have your night with him.' },
          { text: 'She looks at you for a long moment.' },
          { speaker: MORAG, text: 'You’ll know what to do.' },
        ],
        sets: [FLAGS.toldVigil],
      },
      whatToDo: {
        lines: [
          { speaker: MORAG, text: 'Sit with him. Keep him company. Don’t leave him on his own in the dark.' },
          { speaker: MORAG, text: 'The rest…' },
          { text: 'She stops, and starts again.' },
          { speaker: MORAG, text: 'Alan always said it can’t be taught. Only remembered.' },
          { speaker: MORAG, text: 'Will I come over with you? No. No, I don’t cross to the Brough. Not any more.' },
        ],
      },
      salt: {
        lines: [
          { speaker: MORAG, text: 'Is there? Folk are old-fashioned here. It keeps the damp out.' },
          { text: 'She doesn’t look at you when she says it.' },
        ],
      },
      bye: { lines: [{ speaker: MORAG, text: 'Aye. Go on. Mind the tide.' }], end: true },
    },
  },
};

export const ISA_MUIR: Person = {
  id: 'isa',
  name: 'Isa Muir',
  stranger: 'the woman by the fire',
  x: 68.9,
  z: -9.3,
  facing: Math.PI / 2,
  look: { coat: 0x5a6a5a, legs: 0x2a2a30, skin: 0xb8a090, detail: 0xd8d4c4, height: 0.96 },
  dialogue: {
    id: 'isa',
    first: 'hello',
    hub: 'topics',
    nodes: {
      hello: {
        lines: [
          { speaker: ISA, text: 'You’re Alan’s son. I’d have known you anywhere.' },
          { speaker: ISA, text: 'I’m Isa. I keep the shop across the road. I couldn’t sit in the house tonight. I’m sorry for your loss, William. We all are.' },
        ],
        next: 'topics',
      },
      topics: {
        lines: [{ speaker: ISA, text: 'Is there anything you need? Anything at all.' }],
        options: [
          { label: 'Did he come into your shop much?', to: 'fridays' },
          { label: 'What was he like?', to: 'like' },
          { label: 'Is your shop open tomorrow?', to: 'shut' },
          { label: 'Why the rowan over the doors?', to: 'rowan', when: { flag: FLAGS.sawRowan } },
          { label: 'Goodbye.', to: 'bye' },
        ],
      },
      fridays: {
        lines: [
          { speaker: ISA, text: 'Every Friday, regular as the boat. Bread, tea, his tobacco, and a bottle of whisky. Twenty years, near enough.' },
          { speaker: ISA, text: 'Then last summer he stood at my counter and asked me to stop selling it to him.' },
          { speaker: ISA, text: 'If he came in asking, I was to say no, and he’d thank me for it. He did ask, twice. I said no. And he did thank me.' },
        ],
      },
      like: {
        lines: [
          { speaker: ISA, text: 'Quiet. Kept himself to himself, but never unkind. He fixed my roof after the big storm and wouldn’t take a penny for it.' },
          { speaker: ISA, text: 'He talked about you, you know. Not often. But when he did, he leaned on that counter so hard it creaked.' },
        ],
      },
      shut: {
        lines: [
          { speaker: ISA, text: 'Not tomorrow, and not Friday. Everyone’s going. The whole island will be in the kirk.' },
          { speaker: ISA, text: 'He’d have hated that.' },
        ],
      },
      rowan: {
        lines: [
          { speaker: ISA, text: 'Rowan and red thread. My granny put it up, and her mother before her. You don’t take it down.' },
          { speaker: ISA, text: 'Why? It’s just what you do.' },
        ],
      },
      bye: { lines: [{ speaker: ISA, text: 'Mind yourself, William.' }], end: true },
    },
  },
};

export const TAM_DREVER: Person = {
  id: 'tam',
  name: 'Tam Drever',
  stranger: 'the kneeling man',
  x: 75.2,
  z: -2.6,
  facing: Math.PI,
  look: { coat: 0x2a2a2e, legs: 0x26242a, skin: 0xa88a78, detail: 0xd8d4cc, height: 1.06 },
  kneeling: true,
  notice: 'A man is kneeling in the middle of the road with his palm flat on the tarmac, as if he’s feeling for something.',
  dialogue: {
    id: 'tam',
    first: 'hello',
    hub: 'topics',
    nodes: {
      hello: {
        lines: [
          { speaker: TAM, text: 'Hush a minute.' },
          { text: 'He stays down, still as a stone, then nods to himself and gets up, wiping his hand on his trousers.' },
          { speaker: TAM, text: 'Tam Drever. I’ve the croft out past the hall. And you’re William. Everybody knows you’re here, son. It’s a small island.' },
        ],
        next: 'topics',
      },
      topics: {
        lines: [{ speaker: TAM, text: 'What can I do for you?' }],
        options: [
          { label: 'What were you doing down there?', to: 'listening' },
          { label: 'How did he die?', to: 'death' },
          { label: 'Did he drink at the inn?', to: 'drink' },
          { label: 'What are you doing out at this hour?', to: 'open' },
          { label: 'Goodbye.', to: 'bye' },
        ],
      },
      listening: {
        lines: [
          { speaker: TAM, text: 'Listening. The sea comes up through the rock here. You can feel it in your hand.' },
          { speaker: TAM, text: 'Every tide has its own beat. Slow and soft when it’s low. Hard and quick when it’s coming in.' },
          { speaker: TAM, text: 'Your father could tell you the state of the tide to ten minutes, kneeling on his own doorstep. Go on. Try it. Down on one knee, hand flat on the stone.' },
        ],
        sets: [FLAGS.taughtListen],
        effect: 'teachListen',
      },
      death: {
        lines: [
          { speaker: TAM, text: 'His heart. In his chair by the fire, the doctor says. Peaceful.' },
          { text: 'He says it like something he’s practised.' },
        ],
      },
      drink: {
        lines: [
          { speaker: TAM, text: 'He did. More than he should have, for a lot of years.' },
          { speaker: TAM, text: 'Then last summer he came in, ordered a pint, and looked at it a full hour. Walked out and left it on the bar. Never went back in.' },
          { speaker: TAM, text: 'I was sat beside him. I thought he’d fallen out with me. He hadn’t. He’d fallen out with something, but it wasn’t me.' },
        ],
      },
      open: {
        lines: [
          { speaker: TAM, text: 'Same as you. Can’t settle.' },
          { speaker: TAM, text: 'The sea’s restless tonight. It’s been restless since Tuesday. I keep coming out to check on it, like you’d check on a bairn.' },
        ],
      },
      bye: { lines: [{ speaker: TAM, text: 'Mind the tide, son.' }], end: true },
    },
  },
};

export const RUTH_HARCUS: Person = {
  id: 'ruth',
  name: 'Rev. Ruth Harcus',
  stranger: 'the minister',
  x: 62,
  z: -21.4,
  facing: 0,
  look: { coat: 0x16161a, legs: 0x1a1a1e, skin: 0xb49c8c, detail: 0xf0f0ea, height: 0.98 },
  dialogue: {
    id: 'ruth',
    first: 'hello',
    hub: 'topics',
    nodes: {
      hello: {
        lines: [
          { speaker: RUTH, text: 'William Sloan? I’m Ruth Harcus. I’m taking the service tomorrow.' },
          { speaker: RUTH, text: 'I’m so sorry. I wish we were meeting some other way.' },
        ],
        next: 'topics',
      },
      topics: {
        lines: [{ speaker: RUTH, text: 'What can I tell you?' }],
        options: [
          { label: 'About tomorrow.', to: 'service' },
          { label: 'How did he die?', to: 'death' },
          { label: 'The sword on the slab inside?', to: 'sword', when: { flag: FLAGS.sawSword } },
          { label: 'The names on the memorial.', to: 'memorial', when: { flag: FLAGS.sawMemorial } },
          { label: 'Goodbye.', to: 'bye' },
        ],
      },
      service: {
        lines: [
          { speaker: RUTH, text: 'Ten o’clock, here. It’ll be short. Your father asked for it short.' },
          { speaker: RUTH, text: 'He planned the whole thing years ago and left it with me in an envelope. Two hymns, one reading, carried by islanders. No flowers.' },
          { speaker: RUTH, text: 'And he was to come down from the Brough at low water. He was very particular about the tide.' },
        ],
      },
      death: {
        lines: [
          { speaker: RUTH, text: 'You’d be better asking Dr Spence.' },
          { speaker: RUTH, text: 'I’m not being evasive. It’s that people here say a lot of things, and I’d rather you heard it from someone who knows.' },
        ],
      },
      sword: {
        lines: [
          { speaker: RUTH, text: 'Oh, that. It was found when they opened the howe under the floor, in 1843. The kirk was built right on top of a burial mound.' },
          { speaker: RUTH, text: 'They laid it on the slab and it’s never been moved since. Your father came in once a year to oil it. He said somebody ought to.' },
        ],
      },
      memorial: {
        lines: [
          { speaker: RUTH, text: 'The Sloans? Your grandparents. Lost off the Noup in a boat that should never have been out.' },
          { speaker: RUTH, text: 'Your father was fifteen. The island raised him, after. I think that’s why he never left it.' },
        ],
      },
      bye: { lines: [{ speaker: RUTH, text: 'Get some rest, if you can. Tomorrow’s a long day.' }], end: true },
    },
  },
};

/** Everyone about in chapter 1 (the minister isn't, the night William arrives). */
export const PEOPLE: readonly Person[] = [MAGNUS_LINKLATER, MORAG_RENDALL, ISA_MUIR, TAM_DREVER];
