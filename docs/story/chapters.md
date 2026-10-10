# Project Outbound: chapter plan (draft)

*2026-10-10. A proposal built from the story's v4 rough draft ([story-so-far.md](story-so-far.md)) and from what the vertical slice already builds. Only chapter 1's scope is settled so far.*

## How chapters work in this game

The island is one persistent, interconnected map that loops back on itself, like Resident Evil or Dark Souls. So a chapter isn't a separate level. It's a stretch of story that ends when the world changes: a boss falls, a new safe area opens, a road unlocks, or the tide turns on you. Building chapter by chapter then works like this:
- Each chapter adds its new spaces to the same map, plus any new systems it needs.
- Each chapter re-dresses some spaces that already exist. For example, chapter 1 shows the village calm before chapter 2 turns it.
- Each chapter ends on a natural save point that can be played start to finish.

Each chapter also carries one piece of the father's story, so the personal thread keeps moving while the map opens up.

---

## The chapters

| # | Chapter | What happens | Ends when | Father thread |
|---|---|---|---|---|
| 1 | **The Crossing** | Ferry, arrival, the neighbour, crossing to the Brough, the vigil | He falls asleep at the vigil and the candle gutters out | His letters to Alan, kept. Alan's house, his rules, his bottles |
| 2 | **The Funeral** | The service in the kirk. The coffin is empty and the islanders turn. He flees empty-handed in daylight, racing the falling tide back to the Brough safe house *(settled)* | He's back behind the flooding causeway, safe for the night | The order of service: Alan's life in one page. A first version of how he died |
| 3 | **Low Water** *(built as stage 1, to rework)* | Next day he takes the kitchen knife across, and it fails. Hints in the kirk point him to the sword, and he takes it from the place it went wrong *(settled)* | The sword is home by the hearth | What Alan did in the kirk: the oil and cloth, his initials in the log |
| 4 | **The Mound-Dweller** | Taking the sword woke the Hogboon. Signs build: the war memorial puzzle, the Howe beneath the kirk, the first night caught out in a refuge. It hunts him down to the pier | The Hogboon dies on the pier, its corpse curses the harbour, and the ferry email arrives: the ferry is going to the town across the island. **The vertical slice ends here** | Alan's army photo on the war memorial. The grandparents' names on the drowned plaque |
| 5 | **Power** | The loch, the mill and the wind turbine. He restores the island's power, and the community hall becomes a second safe area. The Nuckelavee is first seen on the shore, and fresh water is the only escape | The hall's lights come on and the freed islanders move in | The publican, freed: the drinking, told kindly and plainly |
| 6 | **The Battery** | The wartime bunkers and the GP surgery. Close concrete interiors and the drowned sailors | A bunker key or shortcut opens the north road | The army friend, freed: who Alan was before, and why he came home |
| 7 | **The Trowie Knowe** | The mast hill and its standing stones. Boss 2, the Trow fiddler, a fight to the beat of its music. Repairing the mast brings signal across the island | Signal everywhere, and the first proper call with his mother | Mother's side: why she left, partly told |
| 8 | **The Hall** | The laird's failed hotel. Locked wings, the estate records, the witch's trial papers. Boss 3, the Finwife. The Finfolk are behind what took the islanders | The road to the far town opens | The laird's ledgers: the island's long habit of sending people away |
| 9 | **Spring Tide** | The tide stops behaving: a spring tide that won't fall, then a storm surge. One night the sea doesn't protect the Brough. The full memory of the night he nearly drowned at five | His father comes home. He finds Alan among the dead at his own door and can lay him to rest by name | The truth of how Alan died, in his own hand. The unsent replies, complete |
| 10 | **Outbound** | The final journey across the island to the far town's ferry terminal. The Nuckelavee finale as the storm breaks | The ending: home, or the watch, decided by how he played | |

Chapters 5 to 8 can be reordered or made partly open, so the player picks their route, as long as chapter 8 comes last of the four, because it opens the far road.

**Rough length:** chapters 1 to 4 are the 30 to 45 minute slice, and each later chapter is about 45 to 75 minutes.

---

## Chapter 1 in detail: The Crossing

**Goal:** make the player care, and make them uneasy, without a single threat. It's quiet, played rather than watched, and short (about 15 to 20 minutes).

**Spaces**
- **The ferry deck and lounge.** This is new. Rain on the windows, a few passengers, the island growing out of the haar.
- **The pier and the village street, by day.** These exist from stage 1 and just need re-dressing calm, with islanders about.
- **The causeway and the Brough.** These exist. It's his first crossing, at the low water the neighbour told him about.
- **The cottage,** which exists in the real look, now with the coffin on the bier.

**Beats**
1. **On the ferry.** He only knows he's going to a funeral. His phone shows the ferry company's storm warning and a text from his mother. A crew member recognises the surname: "You'll be Alan's boy."
2. **The pier.** The old neighbour meets him. She's the first person you talk to and the tide lesson in person: "Service is at ten, low water's at nine. Don't dawdle on the way back."
3. **The village.** He can talk to a few islanders who knew his father: the shopkeeper, the minister, the publican in passing. Each says a little and holds back a little. These are the same people who turn in chapter 2, so meeting them now is what makes that hurt. Small strange things: everyone knows him, salt lines on doorsteps, rowan over the shop door, someone stopping mid-sentence to listen to the ground.
4. **The causeway.** The neighbour shows him how to kneel and lay a palm on the stone to feel the sea. That's the listening mechanic, taught as a custom rather than a tutorial.
5. **The cottage.** Alan's things: the army photo, empty bottles behind the stove, a drawer of every letter William ever sent, worn soft. The first unsent reply is half-hidden. The pill moment at the sink, if the player wants it.
6. **The vigil.** The coffin, the salt, the mirror, the clock, the window, the candle, and nothing to say what any of it is for. He falls asleep before dawn and the candle gutters out. That's the end of the chapter, and the save.

**New systems chapter 1 needs**
- Talking to NPCs: a short dialogue box with a portrait, no choices needed yet.
- A first version of the phone: messages and the document log. The full menu can come later.
- Non-combat island states: the same spaces dressed "before", with daylight.
- The vigil's five customs as things you can use, each recorded for the ending.
- A ferry space that moves, or appears to (a deck on a swell with the island approaching).

**How it joins up with what's built:** chapter 3 is the built stage 1, so chapter 2 has to hand over cleanly. See rework item 1 below.

**Settled scope (William, 2026-10-10):** chapter 1 runs to the failed vigil. He doesn't know the rites, sits with his father, falls asleep, and day 1 ends. It releases as **0.1 Dev 1**.

**Built in 0.1 Dev 1** (game repo, `src/game/crossing/`, `src/content/crossing/`):
- The ferry at 15:36 out in the haar, docking at 16:12. Magnus the deckhand, the funeral director's letter in the bag, and texts arriving on the phone (Tab).
- Ashore at dusk: Morag at the pier (the sea version of his death, the tide, "You'll know what to do", and waiting with her until the causeway opens at about 19:40), Isa in the shop, Tam kneeling outside the closed inn (teaches listening), and Rev. Harcus at the kirk (the sword, the grandparents on the memorial).
- Small strange things to look at: salt on a doorstep, rowan over a door, the inn's card, the open grave, the sword.
- The cottage with the coffin on the bier: the letters drawer with the unsent reply and the army photo, the unopened whisky, his chair, the tide table, the pill choice, and the five customs (salt, mirror, clock, window, candle), each done once with nothing to explain it.
- Sitting with him ends the day: lines that depend on what he did, END OF DAY 1, then on into Low water.

**Reworked after William's first playtest (2026-10-10, still 0.1 Dev 1: William decides when there's a new version):**
- **A real Orkney night.** The late ferry docks at **23:45 on the Wednesday**, half an hour after the causeway shut (23:16), so he can't get over until **Thursday morning (open 06:49 to 11:41, low water 09:15)**. The tide keeps a real rhythm: two low waters a day, 12 hours 25 minutes apart. Winter light is from about nine to four.
- **The island is shut.** Only the Skerry Inn is open. The kirk is locked with a notice on the door (Friday, 10 a.m., the funeral service for Alan Sloan); the shop is locked. Rev. Ruth is not outside the kirk.
- **Morag**, creepier but welcoming: directions (and that he's missed the tide), a room at her inn ("I made it up on Monday": he died on the Tuesday), and a poor lie about his death ("In his bed... out walking on the shore"). Accept and the scene cuts to the inn. Decline and she walks home to the inn on her own once he walks off; he can still talk to her, and still go to the inn himself. Upstairs he sleeps until Thursday morning.
- **The funeral moved to Friday** ("We put it back a day, so you'd have your night with him"). Thursday is the day with his father and the vigil that night; Friday's 10:00 service is at low water (07:39 to 12:31), so the causeway is open for the run home after it.
- **The high street** has more buildings, each with a sign to read; the kirkyard's stones can be read too (names, dates, "Loving father", and his grandparents' stone: "Your father was fifteen").
- **His only luggage is a backpack**, with the letter in it; nothing in his hands at the start.
- **Listening** now shows on screen: the edges move like water, gently at low tide and unsteadily at high water, and pebbles and puddles near him react.
- The phone shows the time, the day and the tide; there is no clock on the HUD.

**For chapter 2 (proposal, from William's note that the dead won't follow him to the Brough):** a lore reason could be that the dead don't cross running salt water. The causeway is the sea's twice a day, and even at low water its stones are wet with it; Alan kept a line of salt across the Brough end. Not settled.

---

## The sword's hints in the kirk (proposal)

William (2026-10-10): no note that appears by magic in Alan's house; "maybe there are some hints in the kirk?" The idea is that the answer has been in front of the player since chapter 1, and day 3 is when he finally puts it together. No single document says "take the sword".

**Already planted in chapter 1 (built):**
- The sword on the howe slab before the altar, black with age and **lightly oiled**, with its card: FOUND IN THE HOWE BENEATH THIS KIRK, 1843.
- Rev. Harcus says Alan came in once a year to oil it: "He said somebody ought to."
- The salt on the doorsteps and the rowan over the doors: the island already guards against something.

**Seen at the funeral (chapter 2):** the empty coffin lies right below the sword. The dead come in through the kirkyard, and none of them goes near the slab.

**Found on day 3, after the knife fails (chapter 3):** he falls back into the kirk to shelter (the vestry refuge is built), and there:
1. **In the vestry cupboard:** a tin of oil, a cloth and a stone, and a card of dates in Alan's hand, one a year for thirty years. The last, from this autumn: "Oiled. Keen. A.S."
2. **A framed account on the vestry wall:** the minister of 1843 describing that winter's wreck, the drowned "walking up from the shore", and the blade from the howe that "gave them rest". It reads as a quaint local legend, until tonight.
3. **The memorial window above the slab:** a figure holding a sword over kneeling, drowned shapes, with the old inscription "Iron from the howe. Nothing else will lay them."
4. **The slab itself:** the dead that downed him in the kirkyard don't cross the line of the howe stones in the floor.

Each piece is optional and small. Seeing any two is enough for the player to try the sword, and taking it is always possible. That keeps "the answer in plain sight" from the story summary. Alan's notebook, with the rites, can come later on its own terms, found where he'd plausibly keep it (rather than appearing).

**What it changes in the built "Low water":** the start moves to the morning after the funeral, with the knife in hand (the `sawDead` retreat moves into chapter 2, in daylight). The notebook that turns up on the cottage table is removed, and the kirk hints above replace it. This is chapter 3 work, so it waits until chapter 2 is built.

## Beats that are missing or need reworking

1. **The torch retreat and the funeral overlap. Settled (William, 2026-10-10):** the retreat is the flight from the funeral. The service is at ten in the morning, so it's daylight and he doesn't need the torch: he just has to get back to the Brough safe house alive, and he's safe there for the night. The next day he thinks to take a kitchen knife and finds it's useless. He does **not** learn about the sword from a note that turns up in his father's house; the hints are in the kirk (see "The sword's hints in the kirk" below). Original recommendation: The built "Low water" starts on a quiet morning after the vigil, with a separate torch-only trip where he first sees the dead. In the story, the dead first appear at the kirk service. **Recommendation:** make the torch-only retreat the flight from the funeral (chapter 2), and start "Low water" from the knife. In code that's small: the `sawDead` beat moves into chapter 2, and stage 1 starts with the knife available.
2. **Daylight at the funeral. Settled (William, 2026-10-10):** the service stays at ten in the morning (as chapter 1's letter and notices say), so the flight is in daylight and the torch isn't needed for it. Ten o'clock is also low water, so the causeway is open for the run home and shuts behind him a couple of hours later. Original note: The built clock puts low water at 10:00 and 22:00. A ten o'clock service means fleeing in grey daylight, where the phone torch barely matters. In an Orkney winter the light goes by about half past three, so an afternoon service with the flight at dusk would let the torch earn its place. Either way works, but it's worth deciding before chapter 2.
3. **Repairing the mast has lost its purpose.** It used to be how you called the ferry, but the email reroute replaced that. **Recommendation:** the mast brings signal across the island (new safe areas, texts arriving out in the field) and the first real call with his mother, which feeds her thread.
4. **A second vigil (missing).** The endings depend on learning the rites, but there's no moment to prove it. **Recommendation:** in chapter 9, or late in 8, the old neighbour, freed and frail, dies at the community hall and asks him to sit with her. It's the same five customs, and this time he knows them. It mirrors chapter 1 and is the strongest test of "The Watch".
5. **The mystery of Alan's death needs planted versions.** Each chapter should leave one islander's version: the drink (the publican, ch 5), the sea (the neighbour, ch 2), his heart (the GP, ch 6), something on the watch (the army friend, ch 6). The truth comes in his own hand in ch 9.
6. **Where his father is (missing).** The story says you find Alan among the dead, but not where. **Recommendation:** on the night the Brough isn't safe (ch 9), Alan walks home across the flooded causeway to his own door. The watch he kept for thirty years ends at his own threshold.
7. **The islanders' disappearance needs earlier clues.** The Finfolk are only revealed in ch 8. Plant wet footprints leading to the sea, empty beds and seaweed on doorsteps from ch 2 onward.
8. **The pub has no chapter.** That's where the drinking is told, so put it on the village street in ch 5 when power returns and the publican is freed.
9. **The witch and the selkies are still loose threads.** Suggestion: the witch's trial papers sit in the Hall (ch 8), tied to the laird. The selkie thread is optional side content on the shore. Neither is needed for the main path.
10. **Chapter 1 has no threat, by design.** That's right for the tone, but it needs to stay short and give the player things to do: talk, listen at the causeway, explore the cottage, the vigil. If it drags, the ferry is the place to trim.

## Questions for William

1. ~~**The torch retreat:**~~ answered: the daylight flight from the funeral back to the Brough, then the knife the next day, with the sword's hints in the kirk.
2. **The second vigil for the neighbour (recommended),** or a different test of the rites.
3. **Where Alan is found:** he walks home on the night the Brough falls (recommended), or somewhere else.
