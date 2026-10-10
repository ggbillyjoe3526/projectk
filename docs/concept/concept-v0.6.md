# Project Outbound — Concept Doc v0.6

*Working title. Revised 2026-10-09 after William's notes:*
- *The themes are depression, grief, growing up, and what it means to be an adult.*
- *The "one pill a day" idea.*
- *The game is keyboard and mouse only, so the island's vibrations come through sound, visuals and the character.*
- *The opening runs phone torch, then kitchen knife, then the note.*
- *Camera: decided, option A (authored tracking camera with mouse aim).*
- *Art direction (section 8) updated 2026-10-10 to the look William approved in the round 3 concept shots.*

*v0.1–v0.5 are kept alongside for history.*

**Settled by William so far:**
- Scotland, with folklore and real history from the whole country.
- Present day, on a remote Orkney/Shetland-style island reached by ferry, where the player is stranded.
- Tide-gated access to areas, with the safe hub itself only reachable when the tide allows.
- The tide is read by the sound and vibration of the sea. A tide table is only available in safe areas.
- You start with a makeshift weapon (a pocket or kitchen knife) and learn it can't kill the dead. Only an ancient sword in the kirk can. After that, the sword is the main weapon.
- The off hand holds a light source, and it can be swapped for other items that each have pros and cons.
- The phone is an offline device and the game's menu, holding notes and discoveries. It only gets signal and charges, along with other electronics, in safe areas.
- **Protagonist:** grew up on the island until age five, then moved to a large city with their mother. The city is never named. They return because their father, who stayed on the isles, has died, and they've come for his funeral.
- No firearms or consumable ammunition. The "ammo" is a spiritual or mental resource.
- Occasional boss fights, and a small Resident Evil / Dark Souls-style map that loops back on itself.
- Web-first on WebGPU and current standards, with a possible engine port later.
- Mood references: The Outrun and Silent Hill: Townfall.
- **Keyboard and mouse only.** No controller support, so the vibrations are felt by the *character* and shown through sound and visuals.
- **Opening:** you first enter the dangerous area with just your phone torch and have to retreat. Then you try a kitchen knife, and realise it's useless when you read an old book, note or log saying only the ancient sword can defeat the dead.
- **Themes:** depression, grief, growing up, and what it means to be an adult. William would like to work "one pill a day" (antidepressants) into the game; see section 3.7 for the proposal.
- **Look:** direction B, "Lamplight". Detailed models and textures seen through a PS2-style low-resolution, dithered image, switching to a monochrome grade (only red keeps its colour) when health or Resolve is low. No third-party or licensed art. See section 8.

## 1. The pitch

You were five when your mother took you off **Haugsay** (placeholder, Old Norse for "mound island") and never brought you back. You don't remember why. Thirty years later your father is dead, and you take the last ferry before a winter storm to bury a man you barely knew.

He lived alone in the old lighthouse keepers' cottage on **the Brough**, a tidal islet you can only reach across the causeway at low water. He is laid out there in his own front room, the old way, and an old neighbour tells you that by island custom his nearest kin sits with him through the night. You don't know the words. You don't know about the salt. Sometime after midnight the lights go out.

In the morning his body is gone. So are the island's few dozen residents. The ferry is cancelled until the storm passes, and the dead of Haugsay are walking.

Project Outbound is a slow, cold, dread-heavy survival horror game. The fights are short and precise and built around an ancient sword from the kirk. Swinging and deflecting are always free. **Resolve**, your nerve, is the only thing that can lay the dead to rest for good. Fight cleanly and you earn it back. Fight badly and the dead rise again behind you.

The island's tide sets the rhythm of everything. When the sea is in, the Brough is cut off and safe. When it goes out, you cross, work, and **listen to the island** to know when to run back.

**Three hooks:**
- *Skill is your ammunition.*
- *The sea decides when you're safe.*
- *You can feel it coming.*

## 2. Why this setting

- **Stranded on an island** is the natural shape for a small world that loops back on itself, and it needs no explaining. Ferries to the Northern Isles really are cancelled for days in winter storms. The ferry coming back is the ending.
- **A tidal hub** turns the Resident Evil safe room into a rhythm. Every trip out has a deadline set by the sea, not by a timer on screen, and the player can read it, plan around it, and get caught out by it. It's a structure we haven't seen in this genre.
- **Present day** puts the horror in a place players recognise: a closed school, a shop with an honesty box, a community wind turbine, a heritage centre, a fish farm, wartime bunkers, a holiday let. Under all of it lie five thousand years of the dead: Neolithic tombs, Norse graves, a medieval kirk, a witch burned in the 1600s, cleared crofts, the war dead. It's an island emptying out, which is the modern version of the Clearances, and the theme of the whole game.
- **All of Scotland arrives here.** The firths carry the drowned of every coast to Haugsay's shore, and with them the things that follow the dead. Northern Isles folklore is native to the island. Highland and Hebridean spirits come in on the tide.
- **Distinct from the comparables.** The Outrun is a modern Orkney homecoming story, and we borrow its mood (the wind, the huge sky, coming back to an island you left) but none of its story. Silent Hill: Townfall is a 1996 Fife fishing town told as psychological purgatory in first person. We are folkloric, tidal, sword-based, third person and lo-fi. We deliberately have **no enemy-detecting device**, because a radio or monitor that warns of monsters is Silent Hill's signature.

**Treatment:** the island and every character are fictional. Real history appears through documents and places, treated with gravity. Gaelic, Scots and the customs get specialist review before release. Resolve touches on grief, panic and anxiety, and we treat that with care rather than as a gimmick.

## 2b. What the game is about

The horror is the surface. Underneath it, Project Outbound is about four things, and every system should serve at least one of them.

- **Grief.** Burying a parent you barely knew, and grieving for the relationship you never had as much as for the man. The unburied dead are grief that hasn't been dealt with. Laying them to rest, by name, is mourning made into play.
- **Depression.** Resolve isn't "sanity" and it isn't fear. It's the capacity to keep going. When it runs low the world goes **flat and heavy**: colour drains, sound muffles, your steps slow, and the island's hum becomes harder to read. We avoid the usual "insanity meter" tropes of hallucinations and madness. Depression doesn't look like a monster jumping out. It looks like the light getting further away.
- **Growing up.** You left at five, and you come back at thirty-five carrying a child's half-memories. Being the adult now means:
  - the funeral arrangements, his house, his bills and his will, which show up as documents among the folklore
  - finding out your parents were people, with reasons
  - taking on the watch your father kept
- **Care is a daily practice.** Your father's rites (the watch, the salt, the names) and your one pill a day are the same kind of thing: small acts, repeated, that keep the dark at bay. Neither is magic. Both work because you keep doing them. That's the thematic spine, and it's what the ending says.

**Handling it well:**
- A content note at the start.
- A support line in the menu and the credits (for example Samaritans, 116 123 in the UK and Ireland, plus local equivalents).
- Before release, review by people with lived experience and ideally a mental-health professional.
- No glamorising, and no tidy cure.

## 3. Core mechanics

### 3.1 The tide (the signature structure)

**The Brough is the safe hub.** Your father's cottage has:
- the stove: the hearth where you save, rest and store items
- his satellite broadband: the only signal on the island
- the charging points for your phone, torch and other electronics
- the VHF radio
- the automatic lighthouse next door, and a ruined Norse chapel

**The causeway** opens for a window around low water and floods as the tide rises. It's a real place-type: the Brough of Birsay in Orkney works like this.

**An expedition** works like this:
1. Check the tide table at the cottage.
2. Cross at low water.
3. Push into the island.
4. Judge when to turn back by **listening to the island**.
5. Either get back before the causeway floods, or get caught out and survive until the next low water.

#### Reading the tide: the island hums

In The Outrun, Orkney is described as vibrating with the ocean. We make that literal. The swell against the island's rock comes through the ground as a low, rhythmic pulse that the player can **hear and feel**.

**Listen** (hold the button): your character crouches and lays a palm flat on stone. The world's sound ducks, and the island's pulse comes up through:
- **sound:** a deep, rhythmic thrum with a hiss of water drawing back
- **the character:** their hand trembles against the stone, their breath catches on the strong beats, and a faint shake runs through the camera. You feel it through them, not through a controller.
- **sight:** a puddle shivering, pebbles trembling, grass in the cracks of a dyke quivering

**What the pulse tells you:**
| Tide | The island feels like |
|---|---|
| **Rising** | Stronger and quicker beats, building like a heartbeat, a pull *toward* you |
| **High** | A heavy, grinding pressure, almost too much to bear |
| **Falling** | Slower, softer beats with a long draw-back between them |
| **Slack low water** | Nearly still. The island holds its breath. *Cross now.* |

**Rules that make listening a skill:**
- **Listening takes a few seconds and leaves you exposed.** Doing it in the open, with the dead about, is a gamble.
- **Where you listen matters.** Bedrock and **standing stones** give a clear reading. Your father's notebook says the old islanders read the sea through the stones, and the stones become listening posts across the map. Wooden floors, peat bog and the concrete bunkers muffle it.
- **Players learn it.** Early on, your father's notebook pages teach the patterns. Later you can read the island in one touch.
- **The tide table is a prediction; the island is the truth.** The cottage can show tomorrow's tide times because the forecast downloads over the satellite link. Out on the island you only have what you remember and what you feel. Late in the game a storm surge and a spring tide break the predictions, and only the vibrations are honest.
- **Accessibility:** a visual tide indicator option, adjustable screen shake, and the cues carried in the mid frequencies so they work on laptop speakers and without headphones.

**Caught out:** across the island are **refuges**: a bird hide, a wartime bunker, the kirk vestry, a car. In a refuge you can wait out the tide and save, but you can't fully recover, charge anything or get signal. A night on the island steadily wears down your Resolve, and some refuges can be breached.

**Pacing:** a full tide cycle runs about 25 real minutes and the causeway is open for about 8 of them. These are starting values for tuning. Time passes only while you're on the island or waiting, never in menus. A **"generous tides"** setting widens the window.

**The tide also opens places.** Low water uncovers sea caves, a wreck and the boat grave on the shore. High water brings the Drowned inland.

**The story bends the tide.** A spring tide doesn't fall, a storm surge cuts the Brough off, and one night the sea doesn't protect you at all. That's the moment when the safe room stops being safe.

### 3.2 Resolve (the spiritual "ammo")

Resolve is your nerve. It's a single gauge.

**Always free:** sword attacks, deflects, the evasive step, walking. You're never disarmed.

**Costs Resolve:**
- **Sained strike:** a charged blessed blow that hits the dead hard and builds Break.
- **The Rite:** laying a broken enemy to rest. It's cheap and pays back more than it costs.
- **Laying a fallen body down afterwards:** expensive.
- **Caim:** a warding circle drawn with the blade's point, from a Gaelic protective prayer form. It holds back a group or a stalker for a few seconds.

**Drains Resolve:** spirit wounds, terror events, darkness and cold, being caught out overnight, and watching the dead rise.

**Restores Resolve:**
- perfect deflects (a little each)
- completing a Rite (a chunk)
- resting at the cottage hearth (full)
- scarce charms: salt, rowan and red thread, your father's things, a message from your mother

**When Resolve is low,** your deflect window tightens and the screen and sound close in. **At zero you break,** and you're defenceless until you recover or die.

There is no stamina bar. Health is separate and scarce.

### 3.3 Weapons: the knife, the sword, and the off hand

#### The opening: phone torch, then the knife, then the note

1. **The wake.** You arrive on the last ferry, sit the watch at your father's cottage, and the lights go out.
2. **The first crossing: phone torch only.** It's morning, the island is empty, and the tide is out. You cross to look for people with nothing but your phone's torch. You find the first of the dead, you can't fight it, and you run back over the causeway as the sea comes in. This teaches movement, light, listening, and that the Brough is safety.
3. **The second crossing: the kitchen knife.** You go back armed, or so you think. The knife cuts and the dead go down, then they get up. Again. Running is still the right answer.
4. **The note.** In your father's notebook, backed up by the kirk's old session record and a heritage-centre panel about the 1800s excavation, you read that only one thing has ever laid the island's dead: *"Iron from the howe. Nothing else will lay them."*
5. **The sword.** You reach the kirk at low tide and take the sword down. The opening act ends.

**What the opening teaches, through failure rather than tutorial text:**
1. Movement, light and listening.
2. The dead don't stay down, and running is a real answer.
3. The Brough and the tide are your safety.
4. The world's documents are worth reading, because one of them is the key.

#### The sword

It's an old Norse blade that has hung for a century and a half on the kirk wall, above the slab of the grave it was dug out of. The kirk was built on a burial mound, and when the floor was relaid in the 1800s they found a warrior beneath it. Reaching it is the third crossing and the end of the opening act.

Taking it from its grave is also what turns the island's oldest dead against you: the Hogboon wants it back.

From then on the sword is your main weapon:
- **Moves:** light attack chain, sained strike (costs Resolve), blade deflect (timed, with a bright ring of old iron), short step.
- **Break** builds through perfect deflects and good hits, and reads on the enemy's body, not on a HUD bar. A broken enemy is open to the **Rite**.
- **Enemies are not fencers.** Their rhythms are irregular: they crawl, lurch, feint and go still.

#### The off hand

The off hand holds **one item at a time**. You can swap freely at the cottage. Out on the island, you carry two at most and swapping takes a moment. That makes what you take out each low tide a real decision.

| Off-hand item | Pros | Cons |
|---|---|---|
| **Torch** (your father's heavy rubber torch) | Clear sight, so you read enemy telegraphs early. Darkness doesn't drain your Resolve. | The dead see you from much further away. The battery runs down and only charges at a safe area. |
| **Storm lantern** (paraffin, from the cottage) | A wide, warm pool of light that keeps your Resolve steady. It can be set down to light a room. | It can't be dimmed quickly, and it's visible from very far off. It slows your step. A hard hit can smash it. |
| **Nothing: two-handed grip** | Heavier sword blows and faster Break. Silent and sneaky. | No light at all, so darkness drains your Resolve and telegraphs are hard to read. |
| **Deid bell** (the kirk's hand bell, rung through the parish to announce a death) | Ringing it freezes the nearby Unburied for a moment and reveals hidden ones. | It's loud. Everything within earshot comes, the Nuckelavee included. No light. |
| **Salt pouch** | Pour a line the dead won't cross, or lay a fallen body down without spending Resolve | Limited salt, no light, and pouring it takes time |
| **Old targe** (taken from the wall display in the laird's Hall) | The strongest deflect and a bash that builds Break | Heavy, so you step slower. No light. Found mid-game. |

These are starting proposals. Playtesting will cut or merge items until each one is a clear, different choice. The phone is never an off-hand item: it's the menu.

### 3.4 The unburied (skill → scarcity)

- **Laid to rest by the Rite:** gone for good. You hear the name your father would have spoken.
- **Killed by attrition:** the body falls, then rises later, often worse.
- **Laying a fallen body down afterwards** costs a lot of Resolve, or one scarce dish of salt.

Settled routes become safe ground, which matters most on the path back to the causeway.

### 3.5 Technology: the phone, offline

**Your phone is the game's menu, and it works offline.** Opening it is in the world: your character looks down at the screen, the world keeps moving, and the screen's glow is a small light source.

| Phone app | Offline (out on the island) | In a safe area (signal and power) |
|---|---|---|
| **Notes** | Every document and clue you find is logged automatically | Same |
| **Camera and photos** | Photograph notice boards, gravestones, runes and documents. They become readable entries. Long exposures in the dark show things the eye doesn't, for puzzles. | Same |
| **Map** | Your photo of the heritage centre's island map, with your own marks on it | Same |
| **Tide times** | The last forecast you downloaded, which can be wrong | Up-to-date predictions over the satellite link |
| **Messages and voicemail** | Nothing gets through | Queued messages arrive in a burst: your mother in the city, the ferry company, the coastguard, and some from numbers that shouldn't exist anymore. A main story channel. |
| **Battery** | Drains with use and with the camera flash | Charges |

**Safe areas** are wherever there's signal and power. At first that means your father's cottage on the Brough. Restoring the island's power (the community wind turbine and diesel generator, a Resident Evil-style puzzle) brings the village community hall and its wifi online as a **second safe area** mid-game. Refuges are not safe areas: there's no signal and nothing charges.

**Other technology:**
- the cottage's **VHF radio** (weather, the coastguard, and a voice on channel 16 at night)
- the heritage centre's **CCTV footage**, reviewed for puzzles
- the dead **phone mast**, which you repair late in the game for the call that's part of the ending

**There's deliberately no device that detects enemies.** That's Silent Hill's signature, and our "sixth sense" is listening to the island.

### 3.6 Survival structure

- The persistent, interconnected island opens up through keys, tools, power, shortcuts and the tide.
- A small inventory, with storage only at safe areas. Choosing what to take on each expedition is a decision.
- **Death reloads the last save** (pending Decision 2). The cottage hearth and refuges are the save points.
- Puzzles grow out of the world: the order of names on the war memorial, the wind turbine and generator, the winter-solstice light in the Howe, and tide timing.

### 3.7 One pill a day

**Proposal.** The protagonist takes an antidepressant, one pill each morning, and the game treats it the way it should be treated: as an ordinary, quietly important part of looking after yourself.

**Design principles (non-negotiable):**
1. **Care, not a power-up.** No instant heal, no buff, no "high".
2. **Never the villain.** We won't use the tired trope where medication hides the truth, causes the monsters, or where stopping it means "waking up". That trope does real harm.
3. **Never a punishment.** Missing a dose is never a fail state.
4. **Grounded.** It works quietly and over time. The real fear when you're stranded isn't the pill. It's running out.

**How it plays:**
- **The morning dose.** Once per in-game day (two tide cycles), at a safe area, you can take today's pill. It's a short, quiet moment: a glass of water at the sink, a pill pushed out of the blister pack, one line of thought (often a memory, or something small you notice about the island). It's a breath in the game's rhythm, like the safe-room music in Resident Evil.
- **Its effect is steadiness.** It keeps your Resolve maximum and its recovery steady for the day. It doesn't refill Resolve. It's the floor you stand on, not a boost.
- **Missing a day** just makes the next day feel heavier: a slightly lower Resolve ceiling and slower recovery, until you take it again. Taking two does nothing, and the game says so gently: *"One a day. That's how it works."*
- **Running low.** You packed a week's supply for a three-day trip. The storm keeps you longer. The count shows on your phone, and mid-game the island's **GP surgery and its dispensary** become an objective: a very adult, very ordinary problem sitting among the supernatural ones, and a classic Resident Evil-style locked building to get into.
- **People notice.** Your mother's messages, arriving in bursts at safe areas, ask if you're taking your tablets. They're irritating and loving, like real mothers.

**Open question for William:** whether your father also struggled, alone on the Brough keeping the watch for thirty years, would be a strong generational thread. It's personal territory, so it's your call, and nothing about how he died is decided.

## 4. The map: Haugsay

**Design rules:**
1. **Two hubs, one safe.** The Brough is safe and the village is the crossroads. Every island area eventually opens a shortcut back to the village, and the village leads to the causeway.
2. **Locked before it opens.** You see the Hall, the mast and the bunkers early, long before you can reach them.
3. **Every boss and major puzzle opens a loop** or changes the world: power restored, the loch drained, the mast repaired, a new tide route.
4. **Small and dense.** With all shortcuts open, the causeway to the far end of the island takes about three minutes, so a low-tide window feels just long enough.
5. **The stalker turns known ground into planned ground.** Once the Nuckelavee walks the shore, the route back to the causeway is the most dangerous path in the game.

```
                  [Mast hill / Trowie knowe]  BOSS 2
                               |
 [Wartime battery & bunkers] -- [Loch, mill & wind turbine] -- [The Hall: failed hotel]  BOSS 3
          |                         |                               |
 [Shore, kelp kilns, fish farm] -- [VILLAGE & FERRY PIER] -- [Kirk, kirkyard, heritage centre]
          |                                                         |
   ~~~ tidal causeway ~~~                                      [The Howe]  BOSS 1
          |
 [THE BROUGH: father's cottage (hearth, signal), lighthouse, chapel]  <- safe hub
```

| Area | What it is | Gates and loops |
|---|---|---|
| **The Brough** (safe hub) | Your father's cottage (the old keepers' cottage), the lighthouse, Norse chapel ruins | Tide-gated. Hearth, storage, satellite signal, charging, radio. |
| **Village and ferry pier** | Ferry waiting room, shop, community hall, closed school | The crossroads. Once the power is back, the community hall becomes a second safe area. The ferry's return is the ending. |
| **Kirk, kirkyard and heritage centre** | Deconsecrated kirk with the sword, war memorial, iron mortsafes, the heritage displays | The sword. Memorial-names puzzle. Shortcut gate to the village. |
| **The Howe** | Neolithic chambered cairn beneath the kirk's mound, with Norse runes cut in its walls (like Maeshowe) | **Boss 1: the Hogboon** (the mound-dweller, from Old Norse *haugbúi*). Solstice-light puzzle. |
| **Shore, kelp kilns, fish farm** | The old kelp industry, a modern salmon farm, the drowned | Tidal. **The Nuckelavee** hunts here. Sea caves and the boat grave at low water. |
| **Loch, mill and wind turbine** | Fresh water, plus the island's power | Safe ground from the Nuckelavee (it can't cross running fresh water). Power puzzle. |
| **Mast hill and Trowie knowe** | The dead phone mast on a fairy hill, with a ring of standing stones | **Boss 2: the Trow fiddler**, a fight where the attacks fall on the music's beat. Repairing the mast is a late goal. The stones are a clear listening post. |
| **Wartime battery and bunkers** | Concrete gun emplacements and magazines from both world wars | Close-quarters concrete interiors, the drowned sailors' story, refuges |
| **The Hall** | The laird's house, turned into a hotel that failed. Locked wings, eviction-era estate records. | The "mansion". **Boss 3: the Finwife**, a sea sorceress |
| **Finale** | The Nuckelavee, and the Sea Mither who once kept it chained | The storm breaks, the ferry comes back, and you have to be on the pier |

The vertical slice covers the Brough, the causeway, the village, the kirk, and the Howe.

## 5. Folklore cast (from across Scotland)

| Creature | Origin | In game |
|---|---|---|
| **The Unburied** | The island's own dead, old and recent | Core enemy. Rises again if not laid to rest. |
| **The Drowned** | Sea dead carried in by the firths, from Viking raiders to lost trawlermen | They come inland as the tide rises and drag you toward the sea. They guard the causeway. |
| **Trows** | Orkney and Shetland: small night-folk who love music and steal | Scavengers that snatch an item from your pack and run |
| **The Hogboon** | Orkney: the mound-dweller who guards its howe | **Boss 1** (slice), in the cairn's tight chambers. It wants its sword back. |
| **The Trow fiddler** | Orkney and Shetland: the trows' dance that lasts a hundred years | **Boss 2**, a rhythm fight |
| **Finfolk** | Orkney: sea sorcerers who take people to their undersea home | **Boss 3** and a grab enemy. They are where the islanders went. |
| **Nuckelavee** | Orkney: the skinless horse-demon of the sea, which can't cross fresh running water | **The stalker.** Escape it by crossing fresh water. It can't be killed until the finale. |
| **Sea Mither and Teran** | Orkney: the summer sea-spirit who chains the Nuckelavee, and the winter storm she fights | The finale's mythic frame. The storm *is* Teran. |
| **The Sluagh** | Highlands and Hebrides: the host of the unforgiven dead from the west | They ride the storm in. A dusk hazard on open ground. |
| **Bean Nighe** | Highlands: the washer at the ford | A recurring omen at the mill stream. Possibly a secret boss. |
| **Cù-sìth** | Highlands: the fairy hound whose third bay is death | A hunt sequence: reach a refuge before the third bay |
| **Selkies** | Scotland's coasts | Not enemies. A tragic thread in the story. |

The real history comes through documents and places:
- Neolithic and Norse burial
- the 17th-century witch trials (a woman of the island, burned, whose name keeps coming up)
- the kelp boom and bust
- the Clearances (the laird's fortune)
- the body-snatchers and mortsafes
- both world wars and the island's sea dead
- the oil years
- today's depopulation

## 6. How the story is told

- **No exposition cutscenes,** just a few wordless moments: the ferry crossing, the empty pier, and the lights going out during the wake.
- **The phone:** notes and photos as the document log, messages and voicemails in bursts at safe areas, and your father's own voicemails to you, which he left and you never answered.
- **Documents:**
  - the funeral's order of service
  - community-council minutes about the school closing
  - a fish-farm incident log
  - heritage-centre panels about the sword's excavation
  - a minister's sermons and the laird's estate ledgers
  - the 17th-century trial record
  - **your father's notebook**: the dead he sat with, the rites, and how to read the sea through the stones
- **Names.** Every Rite speaks a name. The war memorial, the kirkyard and your father's notebook are the spine of the mystery.
- **A five-year-old's memories:** at certain places, fragments come back as distorted low-res flashes or a child's drawing found in a drawer. They're unreliable, the way early memories are.

**The personal thread (proposal):**
- Why did your mother take you away at five, and why did she never speak about the island?
- Your father stayed, alone, keeping the watch for the island's dead for thirty years. What was he holding back, and what did it cost him?
- You failed the one watch you were asked to keep, and his body is out there somewhere.

**The ending you're building toward** is the one rite you came to perform: finding your father among the Unburied and laying him to rest yourself, by name.

## 7. Camera options

The game is **keyboard and mouse only**, which changes the camera question. The mouse needs a job. Below are five options, from most to least recommended, followed by a small playable comparison so you can feel them rather than read about them: **[Haugsay Camera Lab](https://claude.ai/artifact/AeiT4iTYDFGWtLZhDpbzBU)**.

**Controls proposal (all options):**
- **WASD:** move
- **Mouse:** facing and torch aim, or camera, depending on the option
- **Left click:** attack
- **Right click:** deflect
- **Space:** step
- **F (hold):** listen
- **Q:** swap the off-hand item
- **Tab:** the phone
- **E:** interact

### A. Authored tracking camera with mouse aim (recommended)

High-angle cameras placed by hand for each space, like RE1, Kuon and your references, but tracking smoothly rather than cutting. The **mouse aims your facing and your torch beam** across the floor. Indoors the cameras sit in corners; outdoors they become long, slow cranes.

- **Pros:**
  - The strongest horror framing: we choose what you can't see.
  - The mouse has a satisfying job: sweeping the torch is the core of exploring.
  - It's the most PS1/PS2-authentic look, and it hides the low-poly budget.
  - Fights stay readable because each fight space gets one camera.
- **Cons:**
  - Every space needs camera authoring.
  - Some players dislike not controlling the camera.
  - Open outdoor areas need careful framing.

### B. Free third-person camera, Souls-style

The camera orbits behind the character, controlled by the mouse, with lock-on for fights.

- **Pros:**
  - Familiar to Souls and modern Resident Evil players.
  - The best fit for an open island and for melee lock-on.
  - Lowest authoring cost per room.
- **Cons:**
  - Weaker scares, because the player can always look.
  - Every angle must be dressed, which means more art.
  - It's the most common look in the genre.
  - The torch can't be aimed independently of the camera.

### C. Three-quarter top-down with a vision cone

A high camera follows overhead, like Signalis. You only see what your character could actually see, so walls and darkness hide enemies in a line-of-sight cone, and the mouse aims it.

- **Pros:**
  - The clearest combat, and the mouse feels great here.
  - The tide and the causeway read beautifully from above.
  - Cheapest art.
  - Line of sight brings back fear.
- **Cons:**
  - Less intimate and claustrophobic.
  - Less of the "PS1 3D horror" feel from your references.
  - Furthest from Kuon and RE1.

### D. Over-the-shoulder, close

A tight camera just behind the shoulder, like the Resident Evil remakes or your two PS1 reference shots, with the mouse looking around.

- **Pros:**
  - Very immersive and tense.
  - Matches two of your references.
  - Great for torch-lit interiors.
- **Cons:**
  - A narrow view makes irregular, crawling enemies hard to read for deflect timing.
  - Closer to what Silent Hill: Townfall and many modern games do.
  - Every angle must be dressed.

### E. First person

You see through the protagonist's eyes.

- **Pros:**
  - Maximum immersion, and natural with keyboard and mouse.
- **Cons:**
  - Deflect-based melee is hard to read in first person.
  - It's exactly Townfall's perspective.
  - The lo-fi first-person horror space is crowded.

**Decided (William, 2026-10-09): A.** Recommendation was A. It keeps the horror framing your references share and gives the mouse a meaningful job in aiming the light, which ties straight into the light-versus-detection trade-off. If the camera comparison makes A feel restrictive, B is the safest fallback.

## 8. Art direction

**Detailed 3D seen through a PS2: direction B, "Lamplight".** Approved by William on 2026-10-10 from the round 3 concept shots (`docs/art/concept-shots-v3/`).
- Models and textures are detailed: sculpted characters with folded coats, knitwear and real faces, and rich procedural materials (damp plaster, harled walls, worn boards, rust, wet flagstones).
- Lighting is modern: soft shadowed lamps and torchlight, ambient occlusion, bloom, filmic tone mapping and grain.
- The image is PS2: an internal resolution of 640×360 with no anti-aliasing, upscaled with hard pixels; colour posterised through a 4×4 ordered dither; subtle vertex snapping; hard texels close up; distance fog.
- **Low Resolve or health:** the world drains to the haar's grey and only red keeps its colour (blood, rowan berries, warning lights). It fades in rather than snapping on.
- Each effect is a slider.
- **No third-party art.** Faces, skies, textures and models are made for the project; nothing scanned, photographed or licensed.

**Mood:** The Outrun's island, seen through a PS1. Treeless land under an enormous sky, flagstone dykes, a winter sun that barely clears the horizon, the slow pulse of the lighthouse beam.

**The modern world in lo-fi:** sodium streetlights, the phone screen's cold glow as a light source, hi-vis jackets, wheelie bins, a car with its interior light left on, concrete bunkers, the turning wind turbine.

**Palette:**
- slate sea-grey, wet-stone brown and lichen green
- peat-stove orange as the warm key light
- the white sweep of the lighthouse
- sodium orange in the village
- red reserved for blood and danger

**Weather is the set dressing** and where WebGPU compute earns its keep: horizontal rain and sleet, spray over the causeway, sea fog (haar) rolling in, and the tide itself (a real water surface that visibly rises over the causeway).

**Characters:** sculpted in detail with strong silhouettes that still read at 640×360. Folklore creatures are designed from the written sources, not from existing game or film versions.

**UI:** minimal and in-world. The phone *is* the menu: notes, photos, the map, tide times and messages, shown on a modern phone screen rendered at the same low resolution as the world. Resolve and health read from posture, breathing and the screen's edges, with an optional HUD.

## 9. Audio direction

- **Wind is the score.** Then the sea, rain on corrugated iron, the turbine's hum, fulmars on the cliffs, the foghorn and silence.
- **The tide is audible:** the island's hum (section 3.1) is the most important sound in the game. It's designed in layers (sub-bass for headphones, mid-range harmonics for laptop speakers) and backed by visuals and mixed so it's always readable under combat.
- **The cottage** sounds full: the stove, the radio, wind on the windows. Out on the island, the hum is never quite gone.
- **Music:** Northern Isles fiddle (and the trows' fiddle, which is wrong), Gaelic psalm singing coming in with the storm, and keening. Used sparingly and with respect.
- **Every enemy telegraph has a sound.** The blade deflect is the most satisfying sound in the game.
- **3D positional audio** (Web Audio HRTF). You hear the Nuckelavee's hooves on the shingle before you see it.
- **The cottage** has one calm theme.

## 10. Technical direction: WebGPU-first

### Platform reality (checked 2026-10-09 against the gpuweb implementation-status page)

**WebGPU ships by default in:**
- Chrome and Edge on Windows, macOS, ChromeOS and Android 12+
- Safari 26 on macOS, iOS and iPadOS
- Firefox on Windows (141+) and macOS (145+ on Apple Silicon, 147+ on all macOS)

**Still missing:**
- Firefox on Linux and Android
- Chrome on most Linux setups (Intel Gen12+ and NVIDIA-on-Wayland only)
- Windows on ARM

**Recommendation:** build for WebGPU and design every effect for it, and keep the automatic WebGL 2 fallback that the renderer gives us at almost no cost. Players on the remaining browsers then still get the game, with fewer effects, instead of a blank screen. If you'd rather be WebGPU-only, it's a one-line change, so this isn't a big fork.

### Stack

| Area | Choice | Why |
|---|---|---|
| Language and build | TypeScript (strict), ES modules, Vite | Fast iteration and small bundles |
| Renderer | **Three.js `WebGPURenderer` with TSL** (node materials and post-processing), pinned to a specific release | The most widely used WebGPU path on the web. TSL compiles the same shader to WGSL for WebGPU, or GLSL for the fallback. |
| WebGPU features we actually use | Compute shaders (rain, sleet, sea spray, haar, blood) and the tide water surface, storage-buffer instancing (grass, kelp, shingle, debris), TSL post chain (low-res target, dither, palette, fog), timestamp queries for GPU profiling where available | Each one serves the look or performance |
| Simulation | Fixed 60 Hz tick in pure TypeScript, with no renderer imports, and interpolated rendering | Deflect windows are measured in ticks, the combat rules are unit-testable, and the logic is portable |
| Collision | Custom kinematic character controller over `three-mesh-bvh` | Exact control of melee movement. Rapier (WebAssembly) only if we need physics props later. |
| Assets | Blender → glTF 2.0 with meshopt compression, small PNG textures | Open, portable to any engine |
| Animation | glTF skeletal clips, with combat events (hit frames, deflect windows) as data | Designers tune timing without touching code |
| Audio | Web Audio API with AudioWorklet and HRTF panning | Sample-accurate timing and positional audio |
| Input | Keyboard and mouse only, using Pointer Events with high-resolution timestamps, buffered into the fixed tick. Pointer Lock only if the chosen camera needs it. | Responsive deflects. Controller support is out of scope. |
| Save | IndexedDB with a versioned save format | Local, migratable |
| Delivery | Static hosting with a service worker for caching (installable as a PWA) | Fast repeat loads and offline play |
| Tests | Vitest for simulation and combat rules; Playwright smoke test on both the WebGPU and the forced-WebGL 2 paths | Protects what matters |

**Caveat:** the Three.js manual still labels `WebGPURenderer` "experimental". Its maturity has improved a great deal and it is the renderer the project is investing in, but we pin the version and verify our needs in the M0 spike before building content on it. Babylon.js has a mature WebGPU engine and is the fallback option if the spike disappoints. A custom raw-WebGPU engine would give the most control but costs months, and this art style doesn't need it.

**Porting later:** the game simulation, the combat data, the levels (glTF plus JSON) and all the assets are engine-agnostic. A future move to Godot, Unity or Unreal would reuse the design data and the art, and reimplement a well-specified, tested set of rules rather than untangling them from a renderer.

### Budgets (to be measured)

- 60 fps on a mid-range laptop with integrated graphics.
- Under 250 draw calls.
- First playable download under about 20 MB.
- No per-frame allocations in the combat loop.


## 11. Vertical slice

**Goal:** prove the hooks. A player should come away feeling that:
- listening to the island got them home in time
- the knife's failure made the sword feel earned
- clean swordplay kept their nerve up
- they want to know what's behind the locked doors

**Content:**
- **The opening:** arriving on the last ferry, the wake at your father's cottage, the lights going out, and the empty morning.
- **The opening crossings:** first with only the phone torch (retreat), then with the kitchen knife (useless), then the note that points to the sword.
- **Areas:** the Brough and cottage, the causeway, the village, the kirk and kirkyard, and the Howe. About 10–12 spaces, with one shortcut loop.
- **The sword** taken from the kirk.
- **At least two tide cycles,** including one guaranteed "caught out" night in a refuge.
- **Enemies:** two or three Unburied variants, the Drowned at the causeway, and trows.
- **Boss:** the Hogboon.
- A glimpse of the Nuckelavee on the shore.

**Systems:**
- movement, phone torch, knife, then sword (attack, sained strike, deflect, step)
- **three off-hand items:** torch, two-handed grip, deid bell
- Break and the Rite, rising dead, Resolve, Caim
- the tide clock, **listening**, a standing-stone listening post, refuges
- battery and charging, and the offline phone (notes, photos, map, tide times at the cottage, messages at the cottage)
- the hearth save and a small inventory
- the memorial-names puzzle and the solstice-light puzzle

**Story:** 6–8 documents, photos and messages, plus the first pages of your father's notebook.

**Length:** 30–45 minutes.

| | Milestone | Done when |
|---|---|---|
| M0 | Look and tech spike | WebGPU renderer with the low-res and dither TSL pipeline, wind-driven rain compute particles, haar fog, a rising and falling tide over a greybox causeway, **a first pass of the island's hum (audio and visual tremor) tied to the tide**, a controllable character and one authored camera. 60 fps in Chrome, Safari and Firefox, and the WebGL 2 fallback works. |
| M1 | Combat prototype | One Unburied: the knife that can't kill it, then the sword with deflect, Break, the Rite, rising dead and Resolve. We iterate until it feels great on keyboard and mouse. |
| M2 | Slice systems | Tide clock, listening and refuges, off-hand items, battery and charging, the phone UI, hearth save, inventory, trows. |
| M3 | Slice content | The opening, the slice areas, the loop, the Hogboon, audio and art passes. |
| M4 | Polish | Playtests, tuning of the tide, listening and Resolve, performance, settings and accessibility. |

## 12. Risks

| Risk | Mitigation |
|---|---|
| Players can't read the island's hum | Multi-sensory cues (sound, puddles and pebbles, the character's trembling hand), the notebook teaching it, standing stones giving clear readings, a visual-indicator accessibility option, tested early with fresh players |
| The tide feels like a stressful timer instead of a rhythm | No on-screen countdown, being caught out is survivable, the "generous tides" option, tuned in M2 playtests |
| The knife hour feels frustrating instead of frightening | Kept short, clearly signposted that running is the right answer, the sword reachable on the first or second crossing |
| Too many off-hand items blur together | Start with three in the slice, add more only if each is a distinct choice |
| Deflect timing feels soft in a browser | Fixed-tick simulation, timestamped input, measured in M1 |
| `WebGPURenderer` gaps | Pinned version, M0 spike, Babylon.js fallback plan |
| Fixed cameras make fights unreadable | A single tracking camera per fight space, soft lock-on |
| The pill mechanic feels preachy, trivial or harmful | The principles in section 3.7, review by people with lived experience, playtesting it as a quiet moment and never a nag |
| Too close to Silent Hill: Townfall | No enemy-detecting device, a different structure, swordplay, folklore |
| Cultural, historical or mental-health missteps | Fictional island and people, specialist review before release |
| Scope creep | One main weapon, no levelling, four bosses in the full game until the slice proves the core |

## 13. Decisions still open

Recommendations are in bold. Until you say otherwise, I'll proceed on them.

1. **Camera:** **A, the authored tracking camera with mouse aim**, or B to E in section 7. Try them in the [Haugsay Camera Lab](https://claude.ai/artifact/AeiT4iTYDFGWtLZhDpbzBU) first.
2. **The daily pill:** the proposal in section 3.7: as written, lighter (story only, with no mechanical effect), or changed.
3. **Death:** **reload the last save** (the cottage or a refuge), or Souls-style respawn at the cottage.
4. **The protagonist's gender, name and face:** yours to choose. Until then the design stays neutral.

## 14. Next

Once the camera is chosen, or you say "go with the recommendations", I'll set up the repository and build M0: a playable WebGPU build in your browser with the low-res look, rain across a greybox causeway, the tide rising over it, the island's hum you can hear and see as it turns, and a character walking it under the chosen camera.
