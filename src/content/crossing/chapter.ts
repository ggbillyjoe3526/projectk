/**
 * Chapter 1's timing and words outside conversations: when the ferry sails and docks (on the island's clock, where
 * tide clock 0 is 22:00 and low water), what the phone receives and when, and the lines said as things happen.
 * The ferry docks a little after four, with the light going; the causeway opens about half past seven.
 */

/** The tide clock as the chapter begins: 15:36, out in the sound. */
export const FERRY_START_TIDE = -800;
/** Real seconds from the start to the ferry tying up at the pier. */
export const VOYAGE_SECONDS = 75;
/** Real seconds for the ferry to pull away again once William is ashore. */
export const DEPARTURE_SECONDS = 70;

/** Daylight goes between these tide clocks: from 16:00, full dusk, to 18:30, full night. */
export const DUSK = { from: -750, to: -437.5 } as const;

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
  mumOnIt: { id: 'mum-on-it', from: 'Mum', sent: '13:02', text: 'Are you on it? x' },
  ferryWarning: {
    id: 'ferry-warning',
    from: 'Skerry Line',
    sent: '14:40',
    text: 'Weather warning. Sailings to and from Haugsay may be disrupted from Friday evening due to forecast gales. Please check before you travel.',
  },
  mumArrived: { id: 'mum-arrived', from: 'Mum', sent: '16:12', text: 'Did you get there ok? x' },
} as const satisfies Record<string, Message>;

/** On the phone from the start, oldest first. */
export const MESSAGES_AT_START: readonly Message[] = [MESSAGES.mumLastNight];
/** Arriving on the ferry, at real seconds into the chapter. */
export const MESSAGES_ON_FERRY: readonly { readonly at: number; readonly message: Message }[] = [
  { at: 7, message: MESSAGES.mumOnIt },
  { at: 22, message: MESSAGES.ferryWarning },
];

export const LINES = {
  opening: 'The afternoon ferry to Haugsay. Your father’s funeral is tomorrow.',
  phoneHint: (key: string): string => `${key} to look at your phone`,
  docked: 'The ferry bumps against the pier. Haugsay.',
  gangway: 'They’ve run the gangway out.',
  departing: 'Behind you, the ferry is already pulling away from the pier.',
  causewayShut: 'The sea is over the causeway. You’ll have to wait for the tide.',
  waited: 'You sit on the wall and watch the sea draw back off the causeway. It takes hours. The light goes.',
  turnedBack: 'The sea is coming over. You scramble back the way you came.',
  cottage: 'His house. It smells of peat smoke, and something underneath it.',
  cottageAfter: 'He’s here. They brought him home this morning.',
  listenHint: (key: string): string => `Hold ${key} to kneel and listen.`,
  noSignal: 'No service',
} as const;
