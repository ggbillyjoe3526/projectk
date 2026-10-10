# Project Outbound — Concept Doc v0.3

*Working title. Revised 2026-10-09 after William's notes. The setting is now an island reached by ferry (The Outrun as a mood reference), drawing on folklore and history from all of Scotland. Bosses are occasional, and the map is small and loops back on itself. v0.1 and v0.2 are kept alongside for history.*

**Settled by William so far:**
- Setting is Scotland, using folklore and real history from the whole country.
- The player arrives by ferry from the mainland at a remote Orkney/Shetland-style island.
- The primary weapon is a sword, or another melee weapon. No firearms or consumable ammunition. The "ammo" is a spiritual or mental resource.
- There are occasional boss fights.
- The map works like Resident Evil or Dark Souls: a small location that loops back on itself as you solve puzzles and beat bosses.
- The game is web-first on WebGPU and current standards, with a possible engine port later.
- Mood references: Silent Hill: Townfall and The Outrun.

## 1. The pitch

**Winter, 1919.** The war is over and a soldier is coming home. The mail steamer crosses the Pentland Firth in a gale and leaves them on the pier of **Haugsay** (placeholder, Old Norse for "mound island"), a small island at the edge of the Northern Isles. The steamer won't be back until the weather turns. The weather does not turn.

The island lost its men to the sea and the trenches, then lost its old folk to the influenza. Too many dead, too few hands to bury them, and a minister who had no time for the old rites. Now the island's dead walk the shore, and things older than the kirk have come up out of the mounds and the sea to collect what they are owed.

Project Outbound is a slow, cold, dread-heavy survival horror game. Its fights are short and precise and built around a sword taken from a grave. Swinging and deflecting are always free. **Resolve**, which is your nerve and the thing the war nearly took from you, is the only thing that can lay the dead to rest for good. Fight cleanly and you earn it back. Fight badly and the dead rise again behind you.

**The hook:** *skill is your ammunition.*

## 2. Why this setting

- **An island makes the map.** A small island is the natural shape for a Resident Evil-style world that loops back on itself: one pier, one village, a handful of places, every route eventually linking back. The ferry that leaves you there is the trap, and seeing it again is the ending.
- **1919 gives the theme a body.** "Resolve as ammunition" isn't an abstract mechanic for a soldier home from the Western Front with shattered nerves. The year also carries a real weight of unburied dead:
  - men lost at sea or missing in France with no grave at all
  - influenza dead buried in haste
  - the war memorials going up with names on them and nobody underneath
- **It stands apart from the comparables.** Silent Hill: Townfall is set in 1996 in a Fife fishing town and The Outrun is contemporary, while we are a century earlier. We take The Outrun's mood (the wind, the huge sky, the cold sea, the return home to an island you left) and leave its story alone.
- **All of Scotland can come here.** The tides in the firths carry the drowned of every coast to Haugsay's shore, and with them the things that follow the dead. Northern Isles folklore (Norse and Scots) is native to the island. Gaelic Highland and Hebridean spirits arrive with the drowned, the soldiers and the incomers. That gives us a reason, inside the story, to use folklore and history from the whole country.

**Treatment:** the island and every character are fictional, as are any ships, so no real disaster or person is depicted. The real history (the war, the influenza, the Clearances, the witch trials, the body-snatchers, the kelp industry) shows up through documents and places, and is treated with gravity. Gaelic, Norn-influenced Scots and the details of the customs get specialist review before release.

## 3. Core mechanics

### 3.1 Resolve (the spiritual "ammo")

Resolve is your nerve and faith (period language: "nerves"). It's a single gauge.

**Always free:** sword attacks, deflects, the evasive step, walking. You are never disarmed.

**Costs Resolve:**
- **Sained strike:** a charged, blessed blow that hits the dead hard and builds Break.
- **The Rite:** laying a broken enemy to rest. It's cheap and pays back more than it costs.
- **Laying a fallen body down afterwards:** making an attrition kill stay dead. This is expensive.
- **Caim:** a warding circle drawn with the blade's point, from a Gaelic protective prayer form. It holds back a group or a stalker for a few seconds.

**Drains Resolve:** spirit wounds, terror events, darkness and cold, and watching the dead rise. The worst drain is the shell-shock trigger: shellfire-like sounds such as thunder, the sea striking the rocks and the guns of a ghost ship.

**Restores Resolve:**
- perfect deflects (a little each)
- completing a Rite (a chunk)
- resting at a hearth (full)
- scarce charms: rowan and red thread, salt, juniper smoke, a letter from home

**When Resolve is low,** your deflect window tightens, the screen and sound close in, and the dead treat you as prey. **At zero you break:** you're defenceless until you recover or die.

There is no separate stamina bar. Health is separate and heals only through scarce items and at hearths.

### 3.2 The sword: deflect, break, rite

- **The weapon:** a **Norse sword and round shield taken from a grave mound** on the island, recommended in the weapon card, with a knife for the Rite.
  - **Why a grave sword:** you come home without a rifle (soldiers didn't keep them), and bullets don't trouble the dead anyway. Iron that was buried with the dead is the one thing they respect. Taking it from its mound is also the act that starts the island's trouble with you.
  - **The other options in the card** still apply if you prefer them: blade-only deflects, or a heavy two-hander.
- **Moves:** light attack chain, sained strike, shield deflect (timed, giving a heavy physical *thunk*), shield bash (builds Break against guarding enemies), short step.
- **Break** builds through perfect deflects and well-timed hits. It reads on the enemy's body, not on a HUD bar. A broken enemy is open to the **Rite**.
- **Enemies are not fencers.** Their rhythms are irregular: they crawl, lurch, feint and go still.

### 3.3 The unburied (skill → scarcity)

- **Laid to rest by the Rite:** gone for good. You hear their name, and some names link to documents and to the war memorial being carved in the kirkyard.
- **Killed by attrition:** the body falls, then rises later, often worse.
- **Laying a fallen body down afterwards** costs a lot of Resolve, or one scarce salt-and-earth platter.

Every encounter asks: fight clean, spend Resolve, avoid the path, or sneak past? The island remembers your answers, and settled routes become safe ground.

### 3.4 Light

You carry a **hurricane lantern** with a shutter and no fuel to manage. Open, you read telegraphs clearly but the dead see you from further away. Shuttered, you can sneak, but darkness wears down your Resolve.

### 3.5 The tide

Haugsay's tide is a progression mechanic (Orkney's real tidal islands, like the Brough of Birsay, are cut off at high water).

- **Low tide** opens the causeway to the brough, uncovers wrecks and sea caves, and exposes the drowned.
- **High tide** closes those paths and floods the shore paths, and the sea dead come further in.
- The tide **turns on story beats and when you choose to "wait for the tide" at a hearth**, never on a real-time clock, so it is never a timer that punishes you.

### 3.6 Survival structure

- **Hearths are the safe rooms.** You keep the peat fire in and bank it for the night, which saves the game and restores you. The dead never cross a lit threshold.
- A small inventory, with storage at hearths.
- **Death reloads the last hearth save** (pending Decision 3).
- Puzzles grow out of the world: the order of names on the memorial, a laird's locked gun room, the solstice light in the chambered cairn, and tide timing.

## 4. The map: Haugsay

**Design rules, borrowed from the RE1 mansion and Dark Souls' Firelink-to-Undead-Burg loop:**
1. **One hub.** The pier village. Every area eventually opens a shortcut back to it.
2. **Locked before it opens.** You see most places early (the Hall's gates, the brough across the water, the lighthouse on the headland) long before you can reach them.
3. **Every boss and every major puzzle opens a loop.** A key item, a shortcut, or a change to the world, such as the tide, a drained loch or the lighthouse lit.
4. **Small and dense.** With every shortcut open you can walk from one end of the island to the other in about three minutes. Areas are revisited and changed, never used once and discarded.
5. **The stalker turns old ground into new danger.** Once the Nuckelavee walks the shore, a route you knew becomes a route you plan.

```
                          [Lighthouse]  (late)
                               |
   [Brough] ~~tidal causeway~~ [Shore & kelp kilns] ---- [Wreck caves] (low tide)
                               |                     \
 [Howe: chambered cairn] -- [Kirk & kirkyard] -- [PIER VILLAGE (hub)] -- [The Hall: laird's house]
        BOSS 1                 |  shortcut gate  /         |                 BOSS 3
                          [Manse]                   [Loch & mill] --- [Trowie knowe]
                                                     fresh water          BOSS 2
```

| Area | What it is | Gates and loops |
|---|---|---|
| **Pier village** (hub) | The steamer pier, the inn, your family's croft (the first hearth), the shop | Everything returns here |
| **Kirk and kirkyard** | Unfinished war memorial, influenza graves, iron mortsafes left from the body-snatching years | A back gate opens a shortcut to the pier. Memorial names puzzle. |
| **The Manse** | The minister's house, his sermons against "heathen" rites | Key items, documents |
| **The Howe** | A Neolithic chambered cairn with Norse runes cut in its walls (like Maeshowe). The grave the sword came from. | **Boss 1: the Hogboon** (the mound-dweller, from Old Norse *haugbúi*). Winter-solstice light puzzle. |
| **Shore and kelp kilns** | Ruined kelp-burning kilns from the 1700s–1800s kelp industry, and the drowned | Tide area. **The Nuckelavee** begins hunting here. |
| **Loch and mill** | Fresh water: a stream and a mill lade | Safe ground from the Nuckelavee (it can't cross running fresh water). Draining the lade opens a route. |
| **Trowie knowe** | A green hill where fiddle music is heard at night | **Boss 2: the Trow fiddler**, a fight where the attacks fall on the music's beat |
| **The Hall** | The laird's house: the "mansion", with locked wings, a gun room with no guns, and records of evictions | **Boss 3: the Finwife / finman**, a sea sorcerer who has taken the laird's family |
| **Brough** | A tidal islet with a broch and the ruins of a Norse chapel | Low tide only. Late-game key. |
| **Lighthouse** | The headland light, dark since the night the steamer left | Lighting it calls the steamer back. **Finale:** the Nuckelavee, and the Sea Mither who once kept it chained. |

The order and the bosses are a first proposal to be tuned in level design. The vertical slice covers the pier village, kirkyard, manse and the Howe.

## 5. Folklore cast (from across Scotland)

| Creature | Origin | In game |
|---|---|---|
| **The Unburied** | Universal; the island's own dead (the drowned, the influenza dead) | Core enemy. Rises again if not laid to rest. |
| **The Drowned** | Sea dead carried in by the firths | Tide-linked variant. They come further inland at high water and drag you toward the sea. |
| **Trows** | Orkney and Shetland: small night-folk who love music and steal | Scavengers. A trow can snatch an item from your pack and run, and you must chase it down or lose it. |
| **The Hogboon** | Orkney: the mound-dweller who guards its howe | **Boss 1** (slice), in the cairn's tight chambers |
| **The Trow fiddler** | Orkney and Shetland: trows lure people into a dance that lasts a hundred years | **Boss 2**, a rhythm fight |
| **Finfolk** | Orkney: sea sorcerers who abduct people to their undersea home | **Boss 3** and a grab enemy |
| **Nuckelavee** | Orkney: the skinless horse-demon of the sea, which can't cross fresh running water. Its breath blights crops and its fury was blamed on the kelp-burning. | **The stalker.** It can't be killed until the finale. You escape by crossing fresh water. |
| **Sea Mither and Teran** | Orkney: the summer sea-spirit who keeps the Nuckelavee chained, and the winter storm she fights | The finale's mythic frame |
| **The Sluagh** | Highlands and Hebrides: the host of the unforgiven dead, arriving from the west | They ride the storms in with the drowned. A dusk hazard on open ground: shut west-facing windows and hide. |
| **Bean Nighe** | Highlands: the washer at the ford, washing the clothes of those about to die | A recurring omen at the mill stream. Possibly a secret boss. |
| **Cù-sìth** | Highlands: the fairy hound whose third bay is death | A hunt sequence with three bays: reach a hearth before the third. |
| **Selkies** | Across Scotland's coasts | Not enemies. A tragic thread in the story. |
| **The Cailleach** | Highlands: the winter hag | The cold itself, in the lore |

Real history used through documents and places:
- the 1914–18 war and the influenza
- the Northern Isles kelp boom and its collapse
- the Clearances (the laird's family made its money clearing a Highland glen)
- the Scottish witch trials (a woman of the island was burned in the 1600s, and her name keeps coming up)
- the body-snatchers and mortsafes

## 6. How the story is told

- **No exposition cutscenes,** just a few wordless in-engine moments. The ferry crossing that opens the game is one of them.
- **Documents:** demob papers, letters home and from the front, the minister's sermons, the laird's estate ledgers, a doctor's influenza notes, and a 17th-century witch-trial record.
- **Item descriptions:** two or three sentences each.
- **Names.** Every Rite speaks a name. The unfinished war memorial is the spine of the mystery: some names on it have no body, and some bodies have no name.
- **The personal thread:** why you went to war and left the island, who you left behind, and whose grave the sword should have stayed in.

## 7. Camera and controls

Recommendation unchanged (Decision 1): authored high-angle cameras that track the player through each space.
- Outdoors, they become long, slow cranes that sell the size of the sky and the sea while keeping the player small in the frame.
- Movement is camera-relative, not tank controls, and the direction you're holding is kept across camera cuts.
- Each fight space gets a single tracking camera, and there's a soft lock-on.
- Keyboard, mouse and gamepad are all supported, with gamepad as the reference feel.

## 8. Art direction

**Low-poly 3D at PS1/PS2 resolution.**
- Internal resolution is about 480×270, upscaled with hard pixels.
- Colour is reduced with ordered dithering, textures are unfiltered (64–256 px), there's subtle vertex snapping and real distance fog.
- Each effect is a slider.

**Mood:** The Outrun's island, seen through a PS1. Treeless green and brown land under an enormous grey sky, a cold sea, flagstone walls and stone dykes, a winter sun that barely clears the horizon, and long blue dusks.

**Palette:**
- slate sea-grey, wet-flagstone grey-brown and pale lichen green
- peat-fire orange as the warm key light
- the lighthouse's white as a rare, precious beam
- red reserved for blood and danger

**Weather is the set dressing,** and it's where WebGPU compute earns its keep: horizontal rain and sleet, sea spray over the rocks, sea fog (haar) rolling in, kelp-kiln smoke and storm surf.

**Characters:**
- 500–1,500 triangles with strong silhouettes: greatcoats, oilskins, shrouds, the round shield.
- The folklore creatures are designed from the written sources, not from existing game or film versions.

**UI:** minimal and mostly in-world. Resolve and health read from posture, breathing and the screen's edges, with an optional HUD. Documents look like period paper: field-service postcards, typed estate letters, a parish register.

## 9. Audio direction

- **Wind is the score.** Then the sea, rain on corrugated iron, fulmars on the cliffs, the foghorn and silence.
- **Music:** Northern Isles fiddle (and the trows' fiddle, which is wrong), Gaelic psalm singing carried in with the Highland dead, and keening. All used sparingly and with respect.
- **Every enemy telegraph has a sound,** so a shuttered-lantern player can survive by listening. The shield deflect is the most satisfying sound in the game.
- **Shell-shock audio design:** thunder and surf can bleed into shellfire as Resolve drops.
- **3D positional audio** (Web Audio HRTF). You hear the Nuckelavee's hooves on the shingle before you see it.
- **Hearths** get one calm theme.

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
| WebGPU features we actually use | Compute shaders (rain, sleet, sea spray, haar, kiln smoke, blood), storage-buffer instancing (grass, kelp, shingle, debris), TSL post chain (low-res target, dither, palette, fog), timestamp queries for GPU profiling where available | Each one serves the look or performance |
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

**Goal:** prove the hook and the map. Clean swordplay and careful Resolve kept me alive, the island frightens me, and I want to see what's behind the locked doors.

**Content:**
- The ferry arrival.
- The pier village, the kirk and kirkyard, the manse, and the Howe: about 10–12 spaces, with one loop back to the pier.
- **Enemies:** two or three Unburied variants and trows.
- **Boss:** the Hogboon in the cairn.
- A glimpse of the Nuckelavee on the shore, as a tease.

**Systems:** movement, sword and shield (attack, sained strike, deflect, bash, step), Break and the Rite, rising dead, Resolve, Caim, lantern, hearth save, small inventory, the memorial-names puzzle and the solstice-light puzzle.

**Story:** 6–8 documents and item texts. **Length:** 20–40 minutes.

| | Milestone | Done when |
|---|---|---|
| M0 | Look and tech spike | WebGPU renderer with the low-res and dither TSL pipeline, wind-driven rain compute particles and haar fog, a greybox pier, a controllable character and one authored camera. 60 fps in Chrome, Safari and Firefox, and the WebGL 2 fallback works. |
| M1 | Combat prototype | One Unburied you can fight: deflect, Break, Rite, rising dead, Resolve. We iterate until it feels great on a gamepad. |
| M2 | Slice systems | Lantern, Caim, hearth save, inventory, documents, trows. |
| M3 | Slice content | The four areas, the loop, the Hogboon boss, audio and art passes. |
| M4 | Polish | Playtests, tuning, performance, settings and accessibility. |

## 12. Risks

| Risk | Mitigation |
|---|---|
| Deflect timing feels soft in a browser | Fixed-tick simulation, timestamped input, measured in M1 |
| `WebGPURenderer` gaps | Pinned version, M0 spike, Babylon.js fallback plan |
| Fixed cameras make fights unreadable | Single tracking camera per fight space, soft lock-on |
| Resolve feels like a punishment loop | Basic actions are free, perfect deflects refund Resolve, generous teaching |
| The folklore cast feels like a grab-bag | Each creature has one distinct mechanic and a story reason to be on Haugsay; the doc's cast table is the gate for adding more |
| Cultural or historical missteps | Fictional island and people, specialist review before release |
| Scope creep | One weapon set, no levelling, four bosses in the full game until the slice proves the core |

## 13. Decisions only you can make

Recommendations are in bold. Until you say otherwise, I'll proceed on them.

1. **Camera:** **authored high-angle tracking cameras.** *(Card posted.)*
2. **Weapon set:** **sword and shield** (a Norse grave pair in this version), sword alone, or a two-handed sword. *(Card posted.)*
3. **Era:** **winter 1919, after the war**; the 1840s; or the present day (like The Outrun). *(Card posted.)*
4. **Death:** **reload the last hearth save**, or Souls-style respawn.
5. **Protagonist:** **a returning soldier**. Another 1919 option is a nurse home from France. Their name, gender and face are yours to choose.

## 14. Next

Once the cards are answered, or you say "go with the recommendations", I'll set up the repository and build M0: a playable WebGPU build in your browser with the low-res look, rain driving across a greybox pier, sea fog, and a character walking it under an authored camera.
