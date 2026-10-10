import { atTime } from './clock';

/**
 * Chapter 1's timing and words outside conversations: when the ferry sails and docks (content/crossing/clock.ts keeps
 * the island's time and tide), what the phone receives and when, and the lines said as things happen. The late ferry
 * docks at 23:45 on the Wednesday, just after the causeway has shut for the night.
 */

/** Real seconds from the start to the ferry tying up at the pier. */
export const VOYAGE_SECONDS = 75;
/** The tide clock as the ferry ties up: 23:45 on the Wednesday. */
export const DOCKED_TIDE = atTime(0, 23, 45);
/** The tide clock as the chapter begins, out in the sound (one real second is one tide-clock second). */
export const FERRY_START_TIDE = DOCKED_TIDE - VOYAGE_SECONDS;
/** Real seconds for the ferry to pull away again once William is ashore. */
export const DEPARTURE_SECONDS = 70;
/** When a night at the inn ends: Thursday, half past eight, the causeway open. */
export const MORNING_TIDE = atTime(1, 8, 30);

export interface Message {
  readonly id: string;
  readonly from: string;
  /** When it was sent, as the phone shows it (one arriving in play: the island's time when it arrives). */
  readonly sent: string;
  readonly text: string;
}

/** Texts on the phone: some there when the chapter begins, the rest arriving as it plays. */
export const MESSAGES = {
  mumLastNight: { id: 'mum-last-night', from: 'Mum', sent: 'Yesterday 21:14', text: 'Text me when you’re on the boat. I know you don’t want to talk about it. I just want to know you got there safe. x' },
  mumOnIt: { id: 'mum-on-it', from: 'Mum', sent: '21:32', text: 'Are you on it? x' },
  ferryWarning: {
    id: 'ferry-warning',
    from: 'Skerry Line',
    sent: '18:40',
    text: 'Weather warning. Sailings to and from Haugsay may be disrupted from Friday evening due to forecast gales. Please check before you travel.',
  },
  mumArrived: { id: 'mum-arrived', from: 'Mum', sent: '23:45', text: 'Did you get there ok? Don’t sit up all night. x' },
} as const satisfies Record<string, Message>;

/** On the phone from the start, oldest first. */
export const MESSAGES_AT_START: readonly Message[] = [MESSAGES.mumLastNight];
/** Arriving on the ferry, at real seconds into the chapter. */
export const MESSAGES_ON_FERRY: readonly { readonly at: number; readonly message: Message }[] = [
  { at: 7, message: MESSAGES.mumOnIt },
  { at: 22, message: MESSAGES.ferryWarning },
];

export const LINES = {
  opening: 'The late ferry to Haugsay. Your father’s funeral is on Friday.',
  phoneHint: (key: string): string => `${key} to look at your phone`,
  bagHint: (key: string): string => `The letter is in your backpack. ${key} for your phone and bag.`,
  docked: 'The ferry bumps against the pier. Haugsay.',
  gangway: 'They’ve run the gangway out.',
  departing: 'Behind you, the ferry is already pulling away from the pier.',
  causewayShut: 'The sea is over the causeway, black and moving. It won’t be passable till the morning.',
  causewayShutRoom: 'The sea is over the causeway. It won’t be passable till the morning. Morag said there was a room at the inn.',
  innArrive: 'The Skerry Inn. Warm, and too quiet. Morag is behind the bar as if she’d never left it.',
  slept: 'You sleep badly, under a sloping ceiling, listening to the sea. In the morning the rain has eased.',
  turnedBack: 'The sea is coming over. You scramble back the way you came.',
  cottage: 'His house. It smells of peat smoke, and something underneath it.',
  cottageAfter: 'He’s here. They brought him home this morning, so he’d have his last night in his own house.',
  listenHint: (key: string): string => `Hold ${key} to kneel and listen.`,
  noSignal: 'No service',
} as const;
