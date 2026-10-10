# Project Outbound — Concept Doc v0.4

*Working title. Revised 2026-10-09 after William's notes: present day, stranded on the island, a hub you can only reach or leave at low tide (like the Brough of Birsay), an old sword taken from the kirk, and technology that matters even though there's little or no signal. v0.1–v0.3 are kept alongside for history.*

**Settled by William so far:**
- Scotland, with folklore and real history from the whole country.
- Present day, on a remote Orkney/Shetland-style island reached by ferry, where the player is stranded.
- Tide-gated access to areas, including possibly the hub itself.
- The primary weapon is an old sword, taken from a grave or a church. No firearms or consumable ammunition. The "ammo" is a spiritual or mental resource.
- Occasional boss fights.
- A small Resident Evil / Dark Souls-style map that loops back on itself.
- Technology plays a part, with no or poor phone and wifi signal.
- Web-first on WebGPU and current standards, with a possible engine port later.
- Mood references: The Outrun and Silent Hill: Townfall.

## 1. The pitch

You come home to **Haugsay** (placeholder, Old Norse for "mound island") on the last ferry before a winter storm, for your grandmother's funeral. She was the last person on the island who still kept the old ways: she sat with the dead through the night, spoke their names, and put salt on the chest. Nobody sits with *her*.

By morning, the island's few dozen residents are gone, the ferry is cancelled until the storm passes, the phone mast is dead, and the island's dead are walking.

You're staying in the old lighthouse keepers' cottage on **the Brough**, a tidal islet you can only walk to across the causeway at low water. When the tide is in, the sea keeps you safe. When it goes out, you have a few hours to cross to the island, find what you need, and get back before the water closes the road home. If you don't make it back, you have to survive the island until the next low tide.

Project Outbound is a slow, cold, dread-heavy survival horror game with short, precise fights built around a sword taken from the kirk. Swinging and deflecting are always free. **Resolve**, your nerve, is the only thing that can lay the dead to rest for good. Fight cleanly and you earn it back. Fight badly and the dead rise again behind you.

**Two hooks:**
- *Skill is your ammunition.*
- *The sea decides when you're safe.*

## 2. Why this setting

- **Stranded on an island** is the natural shape for a small world that loops back on itself, and it needs no explaining. Ferries to the Northern Isles really are cancelled for days in winter storms. The ferry coming back is the ending.
- **A tidal hub** turns the Resident Evil safe room into a rhythm. Every trip out has a deadline set by the sea, not by a timer on screen, and the player can read it, plan around it, and get caught out by it. It's a structure we haven't seen in this genre.
- **Present day** puts the horror in a place players recognise: a closed school, a shop with an honesty box, a community wind turbine, a heritage centre, a fish farm, wartime bunkers, a holiday let. Under all of it lie five thousand years of the dead: Neolithic tombs, Norse graves, a medieval kirk, a witch burned in the 1600s, cleared crofts, the war dead. It's an island emptying out, which is the modern version of the Clearances, and the theme of the whole game.
- **All of Scotland arrives here.** The firths carry the drowned of every coast to Haugsay's shore, and with them the things that follow the dead. Northern Isles folklore is native to the island. Highland and Hebridean spirits come in on the tide.
- **Distinct from the comparables.** The Outrun is a modern Orkney homecoming story, and we borrow its mood (the wind, the huge sky, coming back to an island you left) but none of its story. Silent Hill: Townfall is a 1996 Fife fishing town told as psychological purgatory in first person. We are folkloric, tidal, sword-based, third person and lo-fi. We deliberately have **no enemy-detecting device**, because a radio or monitor that warns of monsters is Silent Hill's signature.

**Treatment:** the island and every character are fictional. Real history appears through documents and places, treated with gravity. Gaelic, Scots and the customs get specialist review before release. Resolve touches on grief, panic and anxiety, and we treat that with care rather than as a gimmick.

## 3. Core mechanics

### 3.1 The tide (the signature structure)

**The Brough is the hub.** It holds:
- the keepers' cottage, whose stove is the hearth where you save, rest and store items
- the automatic lighthouse
- a ruined Norse chapel
- the VHF radio
- the place where your phone and torch charge

**The causeway** opens for a window around low water and floods as the tide rises. It's a real place-type: the Brough of Birsay in Orkney works like this.

**An expedition** works like this:
1. Cross at low water.
2. Push into the island.
3. Either get back before the causeway floods, or get caught on the island and survive until the next low water.

**Caught out.** Across the island are **refuges**: a bird hide, a wartime bunker, the kirk vestry, a car with half a tank. In a refuge you can wait out the tide and save, but you can't fully recover. A night on the island steadily wears down your Resolve, and some refuges can be breached. Getting caught out is survivable, tense, and something you'll do on purpose when you need to push deeper.

**The tide clock** is predictable and readable:
- the tide-table app on your phone
- the sound of the sea changing
- weed on the causeway stones going wet
- the drowned wading further in as the water rises

A full cycle runs about 25 real minutes and the causeway is open for about 8 of them. These are starting values for tuning. Time passes only while you're on the island or waiting, never in menus. A **"generous tides"** accessibility setting widens the window.

**The tide also opens places.** Low water uncovers sea caves, a wreck and the boat grave on the shore. High water brings the Drowned inland.

**The story bends the tide.** Late in the game a spring tide doesn't fall, a storm surge cuts the Brough off, and one night the sea doesn't protect you at all. That's the moment when the safe room stops being safe.

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
- scarce charms: salt, rowan and red thread, your grandmother's things, a voicemail from someone who loves you

**When Resolve is low,** your deflect window tightens and the screen and sound close in. **At zero you break,** and you're defenceless until you recover or die.

There is no stamina bar. Health is separate and scarce.

### 3.3 The sword: deflect, break, rite

- **The weapon** is an old Norse sword that has hung for a century and a half on the wall of Haugsay's kirk, above the slab of the grave it came out of. The kirk was built on top of a burial mound, and when the floor was relaid in the 1800s, they found a warrior beneath it. You take the sword down on the first night, because nothing else stops the dead. Taking it from its grave is what turns the island's oldest dead against you.
- **The off hand holds the light:** a heavy rubber torch from the cottage. You deflect with the blade.
  - **Light open:** you read telegraphs clearly, but the dead see you from further away.
  - **Light off:** you can sneak, but darkness wears your Resolve down.
  - **Battery:** the torch's battery and your phone's are a light budget for each expedition. They recharge at the Brough. Running dark drains Resolve, so light isn't ammunition, but it is what keeps your nerve.
- **Moves:** light attack chain, sained strike, blade deflect (timed, with a bright ring of old iron), a shove with the torch arm (builds Break against guarding enemies), short step.
- **Break** builds through perfect deflects and good hits, and reads on the enemy's body, not on a HUD bar. A broken enemy is open to the **Rite**.
- **Enemies are not fencers.** Their rhythms are irregular: they crawl, lurch, feint and go still.

### 3.4 The unburied (skill → scarcity)

- **Laid to rest by the Rite:** gone for good. You hear the name your grandmother would have spoken.
- **Killed by attrition:** the body falls, then rises later, often worse.
- **Laying a fallen body down afterwards** costs a lot of Resolve, or one scarce dish of salt.

Settled routes become safe ground, which matters most on the path back to the causeway.

### 3.5 Technology, with no signal

The phone is your journal, clock and lifeline, but it is not a radar.

| Tech | Role |
|---|---|
| **Phone: torch** | Backup light. It drains the battery. |
| **Phone: camera** | Your notes system. Photograph notice boards, gravestones, documents and runes, and they go into the camera roll as readable entries. Long exposures in the dark show things the eye doesn't, such as old runes or footprints, which feeds puzzles rather than combat. |
| **Phone: tide app** | Offline tide tables, the diegetic tide clock |
| **Phone: messages** | One bar of signal exists only in a few high places: the mast hill and the top of the lighthouse. Reach one and queued messages arrive all at once: family on the mainland, the coastguard, the ferry company, and some from numbers that shouldn't exist anymore. This is a main story-delivery channel. |
| **VHF marine radio** (at the cottage) | Weather and tide broadcasts, the coastguard, and a voice on channel 16 at night |
| **The island's power** | It's out. Getting the community wind turbine and the diesel generator running is a Resident Evil-style power puzzle that opens locked areas, the heritage centre's systems and the Hall's lift. |
| **The phone mast** | Repairing it is a late goal. The call you make from it is part of the ending. |
| **Heritage centre** | Displays about the sword's excavation, CCTV footage to review for puzzles |

### 3.6 Survival structure

- The persistent, interconnected island opens up through keys, tools, power, shortcuts and the tide.
- A small inventory, with storage only at the cottage. Choosing what to take on each expedition is a decision.
- **Death reloads the last save** (pending Decision 3). The cottage hearth and refuges are the save points.
- Puzzles grow out of the world: the order of names on the war memorial, the wind turbine and generator, the winter-solstice light in the Howe, and tide timing.

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
 [THE BROUGH: keepers' cottage (hearth), lighthouse, Norse chapel]   <- safe hub
```

| Area | What it is | Gates and loops |
|---|---|---|
| **The Brough** (safe hub) | Keepers' cottage (a holiday let), the lighthouse, Norse chapel ruins | Tide-gated. Hearth, storage, radio, charging. The top of the lighthouse has one bar of signal. |
| **Village and ferry pier** | Ferry waiting room, shop, community hall, closed school | The crossroads. The ferry's return is the ending. |
| **Kirk, kirkyard and heritage centre** | Deconsecrated kirk with the sword, war memorial, iron mortsafes, the heritage displays | The sword. Memorial-names puzzle. Shortcut gate to the village. |
| **The Howe** | Neolithic chambered cairn beneath the kirk's mound, with Norse runes cut in its walls (like Maeshowe) | **Boss 1: the Hogboon** (the mound-dweller, from Old Norse *haugbúi*). Solstice-light puzzle. |
| **Shore, kelp kilns, fish farm** | The old kelp industry, a modern salmon farm, the drowned | Tidal. **The Nuckelavee** hunts here. Sea caves and the boat grave at low water. |
| **Loch, mill and wind turbine** | Fresh water, plus the island's power | Safe ground from the Nuckelavee (it can't cross running fresh water). Power puzzle. |
| **Mast hill and Trowie knowe** | The dead phone mast on a fairy hill | **Boss 2: the Trow fiddler**, a fight where the attacks fall on the music's beat. Signal, and repairing the mast. |
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

- **No exposition cutscenes,** just a few wordless moments. The ferry crossing and arriving at the empty island are the first.
- **The phone:** your camera roll as the document log, messages that arrive in bursts at the signal spots, and your grandmother's voicemails, saved and replayed.
- **Documents:** the order of service for the funeral, community-council minutes about the school closing, a fish-farm incident log, heritage-centre panels about the 1800s excavation, a minister's sermons, the laird's estate ledgers, the 17th-century trial record.
- **Names.** Every Rite speaks a name. The war memorial, the kirkyard and your grandmother's notebook of the dead she sat with are the spine of the mystery.
- **The personal thread:** why you left the island, why you didn't come back while she was alive, and what she was keeping at bay all those years alone.

## 7. Camera and controls

Recommendation unchanged (Decision 1): authored high-angle cameras that track the player through each space.
- Outdoors they become long, slow cranes that sell the size of the sky and the sea, and they frame the causeway crossings for maximum dread.
- Movement is camera-relative, and the direction you're holding is kept across camera cuts.
- Each fight space has a single tracking camera, and there's a soft lock-on.
- Keyboard, mouse and gamepad are all supported, with gamepad as the reference feel.

## 8. Art direction

**Low-poly 3D at PS1/PS2 resolution.**
- Internal resolution is about 480×270, upscaled with hard pixels.
- Colour is reduced with ordered dithering, textures are unfiltered, there's subtle vertex snapping and distance fog.
- Each effect is a slider.

**Mood:** The Outrun's island, seen through a PS1. Treeless land under an enormous sky, flagstone dykes, a winter sun that barely clears the horizon, the slow pulse of the lighthouse beam.

**The modern world in lo-fi:** sodium streetlights, the phone screen's cold glow as a light source, hi-vis jackets, wheelie bins, a car with its interior light left on, concrete bunkers, the turning wind turbine.

**Palette:**
- slate sea-grey, wet-stone brown and lichen green
- peat-stove orange as the warm key light
- the white sweep of the lighthouse
- sodium orange in the village
- red reserved for blood and danger

**Weather is the set dressing** and where WebGPU compute earns its keep: horizontal rain and sleet, spray over the causeway, sea fog (haar) rolling in, and the tide itself (a real water surface that visibly rises over the causeway).

**Characters:** 500–1,500 triangles with strong silhouettes. Folklore creatures are designed from the written sources, not from existing game or film versions.

**UI:** minimal and in-world. The phone *is* the menu: the tide app, the camera roll and messages. Resolve and health read from posture, breathing and the screen's edges, with an optional HUD.

## 9. Audio direction

- **Wind is the score.** Then the sea, rain on corrugated iron, the turbine's hum, fulmars on the cliffs, the foghorn and silence.
- **The tide is audible:** the sea's voice changes as the water turns, so experienced players can hear the causeway closing.
- **Music:** Northern Isles fiddle (and the trows' fiddle, which is wrong), Gaelic psalm singing coming in with the storm, and keening. Used sparingly and with respect.
- **Every enemy telegraph has a sound.** The blade deflect is the most satisfying sound in the game.
- **3D positional audio** (Web Audio HRTF). You hear the Nuckelavee's hooves on the shingle before you see it.
- **The cottage** has one calm theme: the stove and the radio.

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
| Input | Gamepad API plus keyboard and mouse, with input timestamped and buffered | Responsive deflects |
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

**Goal:** prove the three hooks. Clean swordplay kept my nerve up, the tide made every trip out tense, and I want to know what's behind the locked doors.

**Content:**
- Arriving on the last ferry.
- The Brough and cottage, the causeway, the village, the kirk and kirkyard with the sword, and the Howe. That's about 10–12 spaces, with one shortcut loop.
- **At least one full tide cycle,** including one guaranteed "caught out" night in a refuge.
- **Enemies:** two or three Unburied variants, the Drowned at the causeway, and trows.
- **Boss:** the Hogboon.
- A glimpse of the Nuckelavee on the shore.

**Systems:**
- movement, sword and torch (attack, sained strike, deflect, shove, step)
- Break and the Rite, rising dead, Resolve, Caim
- the tide clock and causeway, refuges, battery and light
- the phone (tide app, camera roll, one signal spot)
- the cottage hearth save, a small inventory
- the memorial-names puzzle and the solstice-light puzzle

**Story:** 6–8 documents, photos and messages. **Length:** 30–45 minutes.

| | Milestone | Done when |
|---|---|---|
| M0 | Look and tech spike | WebGPU renderer with the low-res and dither TSL pipeline, wind-driven rain compute particles, haar fog, **a rising and falling tide over a greybox causeway**, a controllable character and one authored camera. 60 fps in Chrome, Safari and Firefox, and the WebGL 2 fallback works. |
| M1 | Combat prototype | One Unburied you can fight: deflect, Break, Rite, rising dead, Resolve. We iterate until it feels great on a gamepad. |
| M2 | Slice systems | Tide clock and refuges, light and battery, phone UI, hearth save, inventory, trows. |
| M3 | Slice content | The slice areas, the loop, the Hogboon, audio and art passes. |
| M4 | Polish | Playtests, tide and Resolve tuning, performance, settings and accessibility. |

## 12. Risks

| Risk | Mitigation |
|---|---|
| The tide feels like a stressful timer instead of a rhythm | Readable diegetic cues, no on-screen countdown, being caught out is survivable, the "generous tides" option, tuned in M2 playtests |
| Deflect timing feels soft in a browser | Fixed-tick simulation, timestamped input, measured in M1 |
| `WebGPURenderer` gaps | Pinned version, M0 spike, Babylon.js fallback plan |
| Fixed cameras make fights unreadable | Single tracking camera per fight space, soft lock-on |
| Too many resources (Resolve, health, battery) | Battery only gates light, and light only affects Resolve, so there's one real pressure. Cut battery if playtests say so. |
| Too close to Silent Hill: Townfall | No enemy-detecting device, a different era and structure, swordplay, folklore |
| Cultural, historical or mental-health missteps | Fictional island and people, specialist review before release |
| Scope creep | One weapon, no levelling, four bosses in the full game until the slice proves the core |

## 13. Decisions only you can make

Recommendations are in bold. Until you say otherwise, I'll proceed on them.

1. **Camera:** **authored high-angle tracking cameras.** *(Card posted.)*
2. **Weapon set:** in a modern setting I now recommend **the sword alone (blade deflect) with a torch in the off hand**, rather than sword and shield. *(Card posted.)*
3. **Protagonist:** **an islander coming home for their grandmother's funeral**, an archaeologist on a winter dig, or an engineer sent to fix the phone mast. *(Card posted.)*
4. **Death:** **reload the last save** (cottage or refuge), or Souls-style respawn at the cottage.

## 14. Next

Once the cards are answered, or you say "go with the recommendations", I'll set up the repository and build M0: a playable WebGPU build in your browser with the low-res look, rain across a greybox causeway, the tide rising over it, and a character walking it under an authored camera.
