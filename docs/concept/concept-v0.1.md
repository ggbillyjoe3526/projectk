# Project Outbound — Concept Doc v0.1

*Working title. Draft for William's review, 2026-10-09.*

## 1. The pitch in one paragraph

A slow, dread-soaked survival horror game with a fast, precise deflect-based combat system at its heart. You explore a decaying mountain town where the dead no longer stay dead, carrying a lantern that is both your only reliable light and your best weapon against fear. Every fight is a choice: fight cleanly and the dead are laid to rest for good; fight sloppily and they will get back up while you are elsewhere. Rendered as low-poly 3D at PS1/PS2 resolution, seen through authored high-angle cameras, and told almost entirely through places, objects and the documents the town left behind.

**The one-line hook:** *Skill is your ammunition.* Clean, Sekiro-style play is what saves the scarce resources that Resident Evil-style survival depends on.

## 2. Where this sits between the references

Your notes name two things that pull against each other, and resolving that tension is what makes this game its own thing rather than a mash-up.

| | Sekiro / Souls pull | Resident Evil pull | How Project Outbound resolves it |
|---|---|---|---|
| Pace | Aggressive, constant pressure | Slow, cautious, avoidance | Slow exploration, short sharp fights. Avoiding a fight is always a valid choice. |
| Power | Player is a master | Player is vulnerable | You can be very good at fighting, but you can never afford to fight everything. |
| Resources | Refilling healing, infinite enemies | Finite ammo and healing | Finite. Skill (clean finishes) is how you spend less. |
| Death | Respawn, try again | Reload last save | Reload last save (see Decision 3). |
| Story | Item descriptions, ruins | Files and notes | Both, plus the corpses themselves (they carry names). |

What we deliberately do **not** take: Sekiro's posture bar UI and stealth-kill grammar, Souls' bonfires and currency drop, RE's tank controls and typewriter ink ribbons, Bloodborne's Victorian gothic, Kuon's Heian-era Japan. The references inform the feel, not the furniture.

## 3. Core mechanics

### 3.1 Light and Composure (the signature system)

You carry a lantern. It burns oil, which is scarce.

- **Lantern lit:** you can read enemy telegraphs clearly, your deflect window is generous, and you are calm. But enemies see you from further away and are drawn to you.
- **Lantern dimmed or out:** you can sneak past and avoid fights. But your **Composure** drops: the deflect window tightens, the screen and audio close in, and enemies become harder to read.

Composure is the player's own internal state, not a bar to grind down on enemies. It also drops when you are hurt, grabbed, or see something terrible, and recovers in light and safe rooms. This turns the classic horror resource (light) into a direct combat-feel lever, which none of the references do.

### 3.2 Combat: deflect, break, finish

Melee-first, built around timing rather than stats.

- **Attack** (light, chainable), **Deflect** (timed block; a perfect deflect gives a crisp hit-stop, spark and sound), **Step** (short evade, not a long invulnerable roll), **Lantern raise** (briefly flares the lantern to stagger some enemies, costs oil).
- Perfect deflects and well-timed hits build an enemy's **Break**. Shown on the enemy (cracking, posture slump, sound), not as a HUD bar.
- A broken enemy can be **Finished** with a close-range rite. A finished enemy is laid to rest permanently.
- Enemies are horror creatures, not fencers. Their rhythms are irregular, they lunge, crawl and feint. Reading an unsettling body in a pool of lantern light is the skill being tested.
- A rare firearm (an old flare pistol or similar) exists for emergencies, with ammunition counted in single digits for the whole slice.

### 3.3 The unburied (the link between skill and scarcity)

The dead in this town do not stay down.

- An enemy killed by **attrition** (health worn down) collapses but is not at rest. After a while, or when you leave and return, it **rises again**, often stronger or changed.
- An enemy killed by a **Finish** is laid to rest for good.
- A collapsed body can also be laid to rest with a consumable (**burial salt**, scarce) if you could not finish it cleanly.

So every fight asks: do I commit and try for a clean finish, do I spend salt, do I leave this body and avoid this corridor later, or do I avoid the fight altogether? The world remembers your answers, and routes you have "settled" become safe ground. The rising dead is a known horror idea (RE Remake's crimson heads); tying it to deflect skill and to the lore of names is what makes it ours.

### 3.4 Survival structure

- Interconnected, persistent map (a town district that loops back on itself), unlocked by keys, tools and shortcuts. Resident Evil's mansion structure, not Dead Cells' procedural runs.
- Small grid inventory with storage boxes in safe rooms. Healing is finite and found, not refilled.
- **Safe rooms:** a lit shrine-lamp where you save and store items. Enemies never enter. A distinct calm music cue.
- **Death** reloads the last save (see Decision 3).
- Light puzzles that come out of the world (a crematorium's furnace sequence, a ledger's missing pages), not abstract sliding-tile puzzles.

## 4. Setting and lore

### 4.1 The place

**Hollin Vale** (placeholder name), an isolated mountain town in an unnamed country, in a late-20th-century period that is never precisely dated. The town grew up around a very old funerary temple complex. In the 1960s and 70s the municipality built over and around it: a brutalist civic hall, a crematorium, a clinic, concrete stairways and alleys cut into the old stone and timber.

This gives every area a built-in contrast the references point at: warm timber shrines and lantern light (Kuon), cold concrete and fluorescent tubes (the two PS1 shots, Signalis), and a wealthy family house full of wallpaper and fireplaces (RE1). It is a fictional culture with its own rites, so we are not borrowing any real religion or any one game's world.

### 4.2 The premise (never stated outright to the player)

For centuries the town kept a **Ledger of the Dead**. A death written in the Ledger, by name, was allowed to rest. The Registrar who kept it was the most important person in the valley.

When the town modernised, the civic authorities took the Ledger away from the temple and put it into the municipal records office, then the crematorium took over the dead, and names stopped being written. Something about the order of things broke. Now nobody in Hollin Vale stays dead.

You arrive because you received a letter asking you to come and bury someone. Who sent it, whose funeral it is, and why it had to be you are the questions the player pieces together.

### 4.3 How the story is told

- **No exposition cutscenes.** A handful of short, wordless in-engine moments at most.
- **Documents:** letters, municipal memos, a priest's diary, crematorium logs, children's school work. Each one short (a paragraph or two).
- **Item descriptions:** two or three sentences each, every one carrying a fragment of history.
- **The dead carry names.** Laying a body to rest shows the name that is written for it, and some names connect to documents. Players who pay attention reconstruct who these people were.
- **Places tell the story:** a clinic waiting room where the chairs face the wrong way, a filing room of burned ledgers.

## 5. Camera and controls

**Recommendation: authored high-angle cameras that track the player within each room or zone** (see Decision 1).

- Each room has hand-placed camera volumes. Most cameras are not static: they pan or dolly along a short rail to keep the player and nearby enemies framed, the way Kuon's high angles do in your reference.
- Combat spaces are designed around a single camera, so a fight never cuts mid-swing.
- Modern camera-relative movement, **not** tank controls. When the camera cuts, the held direction is kept until the stick is released, so the player never walks back through a door by accident.
- Soft lock-on: a target selection for attacks and deflects, without the camera swinging.
- Keyboard + mouse and gamepad are both first-class. Gamepad is the reference feel.

Why this camera: four of your seven references use it, it is the strongest framing tool horror has (we choose what you can and can't see), and it hides the low-poly look's weaknesses. The cost is that every room needs camera authoring, which is fine at our scale and becomes part of level design.

## 6. Art direction

**Low-poly 3D rendered at low resolution, then upscaled with hard pixels.** This gives the "pixelated / lo-fi" look from your notes and the Signalis and PS1 shots, while keeping real 3D lighting, shadows and animation. It is also much cheaper to animate than 2D sprites, which matters a lot for a deflect-based combat system that needs many attack, deflect, hit and finish animations.

- **Internal resolution:** about 480x270 (16:9), nearest-neighbour upscaled. Selectable down to 320x180 for a crunchier look.
- **PS1 character:** colour reduced to roughly 15-bit with ordered dithering, unfiltered textures (64–256 px), subtle vertex snapping, distance fog. Each of these is a slider, so they can be tuned for taste and for comfort.
- **Lighting:** one dominant warm key light in most shots (the lantern, a fire, a single lamp) against deep shadow. Cold teal fill outdoors. Red is reserved almost exclusively for blood and danger, so it always means something.
- **Characters:** 500–1,500 triangles, chunky silhouettes that read at low resolution. Enemies are recognisably human but wrong in posture and proportion.
- **UI:** minimal and mostly in-world. No health bar on screen during exploration; health is read from the character's posture and the screen. Inventory and documents are clean, typographic, slightly paper-like.
- **Avoid:** CRT filters on by default, chromatic aberration everywhere, and "retro" UI fonts that look like a parody.

## 7. Audio direction

- Sparse ambience and drones, heavy foley. Silence used as a tool.
- **Sound is gameplay:** every enemy telegraph has an audio cue, so a player in the dark can still survive by listening. Deflect sounds must be the crispest, most satisfying sound in the game.
- 3D positional audio (Web Audio HRTF) so you can hear where the dead are moving behind walls.
- Safe rooms get one memorable calm theme.

## 8. Technical direction (web)

**Recommended stack**

| Area | Choice | Why |
|---|---|---|
| Language / build | TypeScript + Vite | Fast iteration, type safety, small production bundles |
| Rendering | Three.js on WebGL2 | Mature, small, full control over the low-res pipeline. WebGPU is not needed for this look and would narrow device support. |
| Collision | Custom kinematic character controller using `three-mesh-bvh` against level geometry | Melee feel needs exact control of movement; a full physics engine is unnecessary for a slice. Revisit if we need rigid-body props. |
| Simulation | Fixed 60 Hz gameplay tick, rendering decoupled and interpolated | Deterministic, testable combat timing (deflect windows measured in ticks) |
| Animation | glTF skeletal animation, with combat events (hit frames, deflect windows) authored as data | Designers tune timing without code changes |
| Assets | Blender → glTF (GLB), small PNG textures | Standard, browser-friendly pipeline |
| Audio | Web Audio API directly | Precise timing and positional audio, no heavy dependency |
| Save | IndexedDB (localStorage fallback), versioned save format | Single-player, local, migratable |
| Tests | Vitest for gameplay logic, Playwright smoke test that boots the game | Combat rules and save/load are the things worth protecting |
| Hosting | Static hosting (GitHub Pages or Cloudflare Pages) | No server needed for a single-player game |

Godot, Unity and Babylon.js were considered. Godot and Unity web exports are much heavier to download and slower to start; Babylon.js would also work but Three.js gives a leaner fit for a custom low-res renderer.

**Budgets for the slice** (to be measured, not assumed)

- 60 fps on a mid-range laptop with integrated graphics; the game's render target is tiny, so the real costs are draw calls, lights and shadows.
- Under 250 draw calls and about 100k triangles per frame.
- First playable load under about 20 MB, with later areas streamed.
- No per-frame allocations in the combat and movement loop (avoids garbage-collection hitches during fights).

**Architecture boundaries:** simulation (movement, combat, AI, inventory, world state) is kept separate from presentation (rendering, camera, animation playback, audio, UI) so combat rules can be unit-tested and tuned without a browser.

## 9. Vertical slice: what "proof of concept" means

**Goal:** prove the hook. A player should come away feeling that clean deflect play and careful light use kept them alive, and that the place is frightening.

**Content**

- **One area:** the old temple and the crematorium built against it, about 10–12 rooms, looping back on itself with one shortcut.
- **Enemies:** three types (a shambling mourner, a fast crawler, a heavy "pall-bearer" that punishes greedy play) plus **one boss**.
- **Systems:** movement, attack / deflect / step / lantern flare, Break and Finish, rising dead, burial salt, lantern oil, Composure, small inventory, one safe room with save and storage, one key-and-lock loop, one environmental puzzle.
- **Story:** 6–8 documents and item descriptions that hint at the Ledger premise.
- **Length:** 20–40 minutes.

**Milestones**

| | Milestone | Done when |
|---|---|---|
| M0 | Look and feel spike | Low-res renderer with dithering and fog, a greybox room, a controllable character, one authored camera. Runs at 60 fps in Chrome, Firefox and Safari. |
| M1 | Combat prototype | One enemy you can fight: deflect, Break, Finish, rising dead. Timing feels good on a gamepad. This is the most important milestone; we iterate here until it is fun. |
| M2 | Slice systems | Lantern and Composure, inventory, save room, key/lock, documents. |
| M3 | Slice content | The full area, three enemies, the boss, audio pass, art pass. |
| M4 | Slice polish | Playtests, tuning, performance pass, settings menu, bug fixing. |

## 10. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Deflect combat feels floaty in a browser (input latency, frame pacing) | Fixed-tick simulation, input buffered and timestamped, measured in M1 before any content is built |
| Fixed cameras make combat unreadable | Combat spaces get single, tracking cameras; soft lock-on; tested in M1 |
| The rising dead feels unfair or confusing | Clear audio/visual tell when a body is not at rest; generous first encounters that teach it |
| Low-res look reads as "cheap" instead of stylish | Lighting and composition carry the look; M0 exists to get this right before content |
| Scope creep from the Souls side (builds, stats, many weapons) | Slice has one melee weapon and one firearm. No stats or levelling until the slice proves the core |

## 11. Decisions only you can make

My recommendation is marked on each. Until you say otherwise I'll proceed on the recommended option.

1. **Camera / perspective**
   - **A. Authored high-angle tracking cameras, 3D (recommended)** — Kuon / RE1 framing, best for horror.
   - B. Free over-the-shoulder 3D camera — like your two PS1 shots; more familiar, less control over scares.
   - C. Top-down / three-quarter 3D — Signalis-like; very readable combat, less claustrophobic.
   - D. 2D side-scroller — Dead Cells-like; great combat readability, weakest for horror and the most animation work.

2. **Combat weighting**
   - **A. Melee and deflect first, rare firearm for emergencies (recommended).**
   - B. Melee only.
   - C. Firearms first, melee as a backup (closer to Resident Evil).

3. **What happens on death**
   - **A. Reload your last save; the world is as you left it there (recommended).** Purest survival horror.
   - B. Souls-style: respawn at the last safe room, the world keeps your progress, you lose something recoverable.

4. **Setting**
   - **A. Hollin Vale, the modernised funerary town (recommended).**
   - B. A purely historical / folk setting (pre-industrial temple village). Closer to Kuon and Sekiro.
   - C. A purely late-20th-century setting (hospital, institute, apartment block). Closer to Signalis and the PS1 shots.

5. **Anything I've got wrong about your taste.** If any reference was there for a reason I've missed (for example, Dead Cells for its fluid movement, or Bloodborne for its aggression), tell me and I'll fold it in.

## 12. What happens next

Once you've answered (or told me to go with the recommendations), I'll set up the repository with the M0 tech spike: the low-res rendering pipeline, a greybox room with an authored camera, and a controllable character, published as a playable web build you can open in your browser.
