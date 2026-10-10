# Project Outbound — Concept Doc v0.2

*Working title. Revised 2026-10-09 after William's notes: a Scottish setting grounded in folklore and real history, a sword with a spiritual resource instead of ammunition, and WebGPU. v0.1 is kept alongside for history.*

**Settled by William:** Scottish Highlands, folklore and real history. Sword (or other melee) as the primary weapon. No firearms or consumable ammunition, with a spiritual or mental resource as the "ammo". Web-first on WebGPU and current standards, with a possible engine port later.

## 1. The pitch

Winter, 1847. A soldier of a Highland regiment comes home to a glen on Scotland's west coast because of a letter with three words on it: *Come home. Bring the sword.* The township is starving, half its people have been evicted, the kirk has forbidden the old death rites, and the dead of the glen no longer stay in the ground.

Project Outbound is a slow, cold, dread-heavy survival horror game. Its fights are short and precise and built around the sword. You can always swing and deflect, but only your **Resolve**, a scarce spiritual strength, can lay the dead to rest for good. Fight cleanly and you earn Resolve back. Fight badly and the dead rise again behind you.

**The hook:** *skill is your ammunition.* There are no bullets to count. What you have instead is your own nerve, and the only reliable way to refill it is to fight well.

## 2. Why Scotland works so well for this

The core idea from v0.1, the dead not resting unless they are properly laid down, turns out to be rooted in real Highland practice and history. We don't have to invent a rite. One existed, and it was taken away:

- **Rites of the dead.** Highland households kept a **late-wake** (a vigil over the body, sometimes with music until daylight), placed a **platter of salt and earth on the corpse's chest**, put out fires where the body lay, stopped clocks and covered mirrors. Kirk sessions campaigned against wake customs from at least the 1700s.
- **Body-snatching.** Before the Anatomy Act of 1832, resurrection men dug up fresh graves for the anatomy schools, and kirkyards built **mortsafes** (iron cages over graves) and **watch-houses** to guard the dead. By 1847 these are rusting relics: a whole architecture built to keep the dead in the ground.
- **The Clearances and the famine.** Landlords evicted Highland townships for sheep and sporting estates, and the potato blight hit the Highlands from 1846. Whole communities and their customs were scattered, which is the real-world loss at the game's heart.
- **The folklore** is unusually rich in death omens and restless dead (see section 5), and is distinctly Gaelic rather than generic "dark fantasy".

**Treatment:** the Clearances and the famine are real trauma within living cultural memory. The glen, its laird and every character are fictional, no real individuals are portrayed, and the horror comes from loss and neglect rather than from mocking the people who suffered. Before release, Gaelic text and cultural details get reviewed by a Gaelic speaker and someone with knowledge of the history. No tartan-and-shortbread kitsch, and the bagpipes stay out of the soundtrack except on purpose.

### Closest comparable: Silent Hill: Townfall

William named it as an example of the kind of game to aim for. It is a Scottish horror game from Screen Burn Interactive (formerly No Code), released on 24 September 2026 for PS5 and PC to an 81 on Metacritic. Here is how the two line up.

| | Silent Hill: Townfall | Project Outbound |
|---|---|---|
| Place and time | St. Amelia, a fogbound island town on the Fife coast (based on St Monans), 1996 | A fictional Gaelic-speaking glen on the west Highland coast, 1847 |
| Horror source | Psychological: guilt, a purgatory loop, "a state of mind" | Folkloric and historical: real death rites, real Gaelic folklore, the Clearances |
| Perspective | First person | High-angle authored third-person cameras |
| Combat | Improvised melee (planks, pipes) plus stealth | A deliberate sword-and-targe deflect system, Resolve, laying the dead to rest |
| Look | Modern high-fidelity 3D | PS1/PS2 lo-fi 3D |

**What we take from it:** proof that a Scottish horror setting has real appetite behind it, a town that feels like a character, a fictional place drawn from a real one, and a protagonist carrying personal guilt. Our soldier came home too late: they were away with the regiment while the glen starved and was cleared. **What keeps us distinct:** a different century, a different coast, a Gaelic culture rather than a Lowland fishing town, supernatural folklore rather than a psychological purgatory, and skill-based swordplay rather than improvised weapons and stealth.

## 3. Core mechanics

### 3.1 Resolve (the spiritual "ammo")

Resolve is your nerve, faith and will, shown as a single gauge (working name; possibly *misneach*, Gaelic for courage).

**Always free:** basic sword attacks, deflects with the targe, the evasive step, and walking. You are never disarmed.

**Costs Resolve:**
- **Sained strike.** A charged blessed blow that hits the dead much harder and builds Break quickly.
- **The Rite.** Laying a broken enemy to rest with the dirk (section 3.3). This is cheap and pays back more than it costs.
- **Laying a fallen body down.** Making an attrition kill stay dead. This is expensive.
- **Caim (warding circle).** You draw a protective circle with the blade's point, a real Gaelic protective prayer form. It holds back a group or the Sluagh for a few seconds.

**Drains Resolve:** being hurt by spirits, terror events, long exposure to darkness and cold, and watching the dead rise.

**Restores Resolve:** perfect deflects (a small amount each), completing a Rite (a chunk), resting at a **hearth** (full), and scarce charms such as rowan and red thread, juniper for smoke-saining, or a salt-and-earth platter.

**When Resolve is low,** your deflect window tightens, the image and sound close in, and the dead read you as prey. **At zero you break:** you are staggered and defenceless until you recover or die. That is the survival-horror pressure without a single bullet.

There is no separate stamina bar. One resource keeps decisions readable. Health is separate and heals only through scarce items (linen, a dram of *uisge-beatha*, a healer's salve) and at hearths.

### 3.2 The sword: deflect, break, rite

- **Weapon (recommended, Decision 2):** a **basket-hilted broadsword with a targe**, the classic Highland pairing. The targe is your deflect, so a perfect parry lands as a heavy, physical *thunk* rather than a fencing clang. A **dirk** is drawn only for the Rite. Fiction: the sword is a family blade, hidden in the roof thatch since the disarming acts after Culloden.
- **Moves:** light attack chain, heavy or sained strike, targe deflect (timed), targe bash (punishes a guarding enemy and builds Break), short step.
- **Break** builds through perfect deflects and well-timed hits. It reads on the enemy's body (it sags, its shroud tears, its breathing changes) rather than on a HUD bar. A broken enemy is open to the **Rite**.
- **Enemies are not fencers.** Their rhythms are irregular: they crawl, lurch, feint and go still. Reading a wrong body in poor light is the skill being tested.

### 3.3 The unburied (skill → scarcity)

- **Laid to rest by the Rite:** gone for good. You hear the name they were buried under, and some names link to documents.
- **Killed by attrition:** the body falls but isn't at rest. Later, or when you come back, it rises again and is often worse.
- **Laying a fallen body down afterwards** costs a lot of Resolve, or one rare salt-and-earth platter.

Every encounter asks the same question: commit and fight cleanly, spend scarce Resolve, leave the body and avoid this path, or sneak past entirely? The glen remembers your answers, and routes you have settled become safe ground.

### 3.4 Light

You carry a **horn lantern** on your belt. It needs no fuel, but you can shutter it.

- **Open:** you can read telegraphs clearly and Resolve drains slowly. But the dead see you from further away.
- **Shuttered:** you can sneak, but darkness wears down your Resolve and every body becomes hard to read.

### 3.5 Survival structure

- An interconnected, persistent glen that loops back on itself, opened up through keys, tools and shortcuts. Resident Evil's structure, not a procedural run.
- A small inventory, with storage at hearths.
- **Hearths are the safe rooms.** In Highland homes the peat fire was never allowed to die. At night it was banked (**smoored**) with a blessing. Kneeling to smoor a hearth saves the game and restores you. The dead never cross a lit threshold.
- **Death reloads the last save** (pending Decision 3).
- Puzzles grow out of the world, such as an order of burial in the parish mortcloth register, a mortsafe's lock, or which windows face west.

## 4. Setting

**Glen Dubhar** (placeholder; *dubhar* means "shade" or "shadow" in Gaelic): a fictional township at the head of a sea loch on the west Highland coast, in winter 1847.

- **The clachan:** thatched blackhouses with central peat fires and box beds, many standing empty with their roofs pulled down after evictions.
- **The kirk and kirkyard:** mortsafes, the watch-house, a parish register and the hired mortcloth (the pall).
- **The manse:** a Georgian minister's house, and the closest thing to RE1's mansion rooms early on.
- **The ford:** the river crossing where the Bean Nighe washes.
- **The laird's shooting lodge:** a Scottish baronial pile with antlers, stuffed game and locked gun rooms whose guns are all gone. This is the later "mansion".
- **The broch and the sìthean:** an Iron Age tower and a fairy mound above the glen, where whatever is underneath begins.

**Mood:** remote, beautiful and cold. Sleet across the loch, low cloud on the hills, snow in the corries, dead bracken and heather. The light is short-lived: most of the game happens in the long winter dark.

### Story premise (never stated outright)

The glen kept its dead with the old rites for centuries: the watch, the salt and earth, the names spoken. Then came the body-snatchers, then a minister who called the wakes heathen, then the factor's evictions and the blight. The dead of a starving winter were buried hastily, unwatched and unnamed, and some were not buried at all. Something older than the kirk, something that had kept a bargain with the glen, stopped keeping it.

The player learns why *they* were sent for, who wrote the letter, and whose grave the sword was meant for, through:

- **Documents:** eviction notices, the minister's sermons and diary, a schoolmaster's letters, an anatomist's receipt, a soldier's discharge papers, the parish register.
- **Item descriptions:** two or three sentences each.
- **Names.** Every Rite speaks a name, and the player slowly reconstructs the township's families.
- **Places:** a box bed with three shrouds, a door chalked with an eviction mark.
- **No exposition cutscenes,** only a few wordless in-engine moments.

## 5. The dead and the fair folk

Grounded in recorded Highland folklore, adapted for play. Each creature is built around a distinct mechanic, not just a skin.

| Creature | Folklore | In game |
|---|---|---|
| **The Unwaked** | The improperly buried dead | The core enemy. Famine dead in grave linen. Lurching rhythms, sudden lunges. Rises again if not laid to rest. |
| **Cù-sìth** | A huge dark-green fairy hound whose three bays are a death omen | A hunting encounter. You hear the first bay, then the second, and must reach a hearth or a lit threshold before the third. Fast and fightable when cornered, but with brutal pressure. |
| **The Sluagh** | The host of the unforgiven dead, who fly out of the west at dusk and enter through west-facing windows | An unkillable stalker for open ground at dusk. You can't fight it, only hide from it, shut west windows, or hold it back briefly with the Caim. The game's signature dread system. |
| **Bean Nighe** | The washer at the ford, washing the grave-clothes of those about to die | **Vertical slice boss.** She is washing *your* shirt. |
| **Each-uisge** | A water horse of the lochs that drowns its riders | A later area along the sea loch. |
| **Baobhan sìth** | Blood-drinking women in green who dance with travellers | A later fast, agile duellist enemy. |
| **The Cailleach** | The winter hag and mother of storms | A mythic presence behind the whole winter. Final act. |

## 6. Camera and controls

Recommendation unchanged (Decision 1, the card already posted): authored high-angle cameras that track the player through each room or zone. Movement is camera-relative, not tank controls. The direction you're holding is kept across camera cuts. Fight spaces each get a single tracking camera, and there's a soft lock-on. Keyboard, mouse and gamepad are all supported, with gamepad as the reference feel.

## 7. Art direction

**Low-poly 3D at PS1/PS2 resolution** (internal around 480×270, upscaled with hard pixels). Colour is reduced with ordered dithering, textures are unfiltered (64–256 px), there's subtle vertex snapping and real distance fog. Each effect is a slider for taste and comfort.

**Palette:** cold blue-grey, peat-smoke brown, sleet white and dead-heather mauve. Peat-fire orange is the warm key light. Red is reserved for blood and danger.

**Weather is the set dressing:** blowing sleet, mist rolling down the glen, and snow that settles. This is where WebGPU compute earns its keep (section 9).

**Characters:** 500–1,500 triangles with strong silhouettes (shrouds, plaids, the targe's round shape) that read at low resolution.

**UI:** minimal and mostly in-world. Health and Resolve read from posture, breathing and the screen's edges, with an optional HUD for accessibility. Documents look like real paper of the period: handwriting, print, ink blots.

## 8. Audio direction

- Wind, sleet, peat crackle, sea and silence.
- **Gaelic precented psalm singing** (the line-out style of the Hebrides), waulking-song rhythms and keening, all used sparingly and with respect. They give the game a sound no other horror game has.
- Every enemy telegraph has a sound, so a player with a shuttered lantern can survive by listening. The targe deflect is the most satisfying sound in the game.
- 3D positional audio (Web Audio HRTF). The Sluagh is heard coming from the west before it is seen.
- Hearths get one calm theme.

## 9. Technical direction: WebGPU-first

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
| WebGPU features we actually use | Compute shaders (sleet, snow, mist, embers, blood), storage-buffer instancing (heather, grass, debris), TSL post chain (low-res target, dither, palette, fog), timestamp queries for GPU profiling where available | Each one serves the look or performance |
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

## 10. Vertical slice

**Goal:** prove the hook. Clean swordplay and careful Resolve kept me alive, and the glen is frightening.

- **Area:** the kirkyard, kirk, watch-house, manse, the edge of the clachan and the ford. About 10–12 spaces, looping back with one shortcut.
- **Enemies:** two or three Unwaked variants, one Cù-sìth hunt, and a short Sluagh-at-dusk sequence. **Boss:** the Bean Nighe at the ford.
- **Systems:** movement, sword and targe (attack, sained strike, deflect, bash, step), Break and the Rite, rising dead, Resolve, Caim, lantern, hearth save, small inventory, one key-and-lock loop, one register puzzle.
- **Story:** 6–8 documents and item texts that hint at the premise.
- **Length:** 20–40 minutes.

| | Milestone | Done when |
|---|---|---|
| M0 | Look and tech spike | WebGPU renderer with the low-res and dither TSL pipeline, a sleet compute particle system, a greybox kirkyard, a controllable character and one authored camera. 60 fps in Chrome, Safari and Firefox, and the WebGL 2 fallback works. |
| M1 | Combat prototype | One Unwaked you can fight: deflect, Break, Rite, rising dead, and Resolve. We iterate until it feels great on a gamepad. |
| M2 | Slice systems | Lantern, Caim, hearth save, inventory, documents, Cù-sìth hunt. |
| M3 | Slice content | The full area, the Sluagh sequence, the Bean Nighe, audio and art passes. |
| M4 | Polish | Playtests, tuning, performance, settings and accessibility. |

## 11. Risks

| Risk | Mitigation |
|---|---|
| Deflect timing feels soft in a browser | Fixed-tick simulation and timestamped input, measured in M1 before content |
| `WebGPURenderer` gaps | Version pinned, M0 spike, Babylon.js fallback plan |
| Fixed cameras make fights unreadable | Single tracking camera per fight space, soft lock-on, tested in M1 |
| Resolve feels like a punishment loop | Basic actions are always free, perfect deflects refund Resolve, and a generous early teaching section |
| Cultural or historical missteps | Fictional glen and people, specialist review before release |
| Scope creep (stats, many weapons) | One weapon set and no levelling until the slice proves the core |

## 12. Decisions only you can make

Recommendations are in bold. Until you say otherwise, I'll proceed on them.

1. **Camera:** **authored high-angle tracking cameras**, over-the-shoulder, top-down or side-scroller. *(Card already posted.)*
2. **Weapon set:** **broadsword and targe** (the targe deflects, dirk for the Rite), broadsword alone, or a two-handed claymore (slower and heavier, deflecting with the blade). *(Card posted.)*
3. **Death:** **reload the last hearth save**, or Souls-style (respawn at the hearth, the world keeps your progress, you lose something you can recover).
4. **Era:** **1847, the famine and the Clearances** (as above), the 1690s (the Glencoe massacre and the witch trials, when swords were everywhere), or a timeless and mythic Highland setting.
5. **Protagonist:** **a returning Highland soldier**, or someone else you have in mind. Their gender, name and face are yours to choose.

## 13. Next

Once the camera and weapon cards are answered (or you say "go with the recommendations"), I'll set up the repository and build M0: a playable web build in the browser showing the WebGPU low-res look, sleet blowing across a greybox kirkyard, and a character walking through it under an authored camera.
