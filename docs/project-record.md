# Project record

What has been decided on Project Outbound, what is still open, and how the project got here. It was written on
2026-10-10, when William put the project on hold, so that work can pick up again without asking him the same
questions twice.

How to read it: **settled** means William decided it. **Working plan** means a recommendation William said he's happy
with for now. Anything else is a proposal in the design documents that nobody has signed off.

Where this record and an older document disagree, this record is newer. The story summary
([story/story-so-far.md](story/story-so-far.md)) replaces the story parts of the concept document
([concept/concept-v0.6.md](concept/concept-v0.6.md)).

## Status: on hold

**Update:** work resumed later on 2026-10-10 at William's request (new concept shots, then the M1 playtest fixes
below). The rest of this section is the hold as it was.

On 2026-10-10 William put the whole project on hold:

- **No new work** until William asks for it.
- **No more concept images.**
- **The weekly Airsoft sync check is paused** (see [Routines](#routines)).

When work resumes, the open items are listed under [Open questions](#open-questions), and the next art step is under
[Art direction](#art-direction).

## The game in one paragraph

Project Outbound is a web survival-horror game: "Sekiro/Souls meets Resident Evil", with a PS1/PS2 lo-fi 3D look and a
story told through places, people and documents. In the present day, William Sloan takes the ferry to Haugsay, a remote
Orkney/Shetland-style island, for the funeral of his father, Alan, whom he hasn't seen since his mother took him away at
five. At the vigil and the funeral the dead rise, the islanders turn, and William is stranded. His father's cottage on a
tidal islet with a lighthouse is the hub, reachable only when the tide allows, and he reads the tide by the island's
hum. A kitchen knife can't keep the dead down; only an ancient sword from the kirk can. The island opens up through
bosses and puzzles until he can make the final journey to the ferry, or stay and take up his father's watch.

## Settled decisions

### Identity and scope

| Decision | When |
|---|---|
| Working title **Project Outbound**. The earlier names ProjectK (repo and code) and UNBURIED (concept title) are retired. "The Unburied" stays as the name of the dead enemies. | 2026-10-10 |
| A web game first, perhaps ported to another engine later. It must use **WebGPU** and current standards for the best quality and performance. | 2026-10-09 |
| **Keyboard and mouse only.** No controller support, so nothing relies on rumble. | 2026-10-09 |
| It must feel unique and must not copy any of the games that inspired it. *Silent Hill: Townfall* is a tone reference to stay distinct from. | 2026-10-09 |

### Setting

| Decision | When |
|---|---|
| **Scotland**, drawing on folklore and real history from **all** of Scotland, not one region. Remote, beautiful, creepy, dark and cold. | 2026-10-09 |
| **Present day.** The player arrives by ferry at a remote Orkney/Shetland-style island and is **stranded**. *The Outrun* (the film) is a mood reference. | 2026-10-09 |
| **Tide-gated areas**, like the Brough of Birsay. The hub is on a tidal islet, so the player must survive on the main island until the tide allows a retreat. | 2026-10-09 |
| The tide is read by the island's **vibrations** (from *The Outrun*: "Orkney vibrates"), conveyed through sound, visuals and the character, not rumble. A tide table exists only in safe areas. | 2026-10-09 |
| The **map** works like Resident Evil or Dark Souls: a small place that loops back on itself as puzzles are solved and bosses beaten. Occasional **boss fights**. | 2026-10-09 |

### Combat and items

| Decision | When |
|---|---|
| **No firearms and no consumable ammunition.** No katana, because it doesn't suit Scotland. The "ammo" is a spiritual or mental resource (Resolve in the design). | 2026-10-09 |
| The opening: the player first goes out with only the **phone torch** and has to retreat. Then a **kitchen knife** proves useless against the dead. Then an old **note** reveals that only the **ancient sword in the kirk** can lay them. | 2026-10-09 |
| The sword becomes the main weapon. The **off hand** holds a light source, swappable for other items, each with clear pros and cons (a light helps you see but gets you detected sooner). | 2026-10-09 |
| The **phone is offline**: it is the in-game menu (notes, discoveries). Signal and charging (phone, torch, other electronics) are available only in safe areas. | 2026-10-09 |
| **Camera A**: authored high-angle tracking cameras per zone, with the mouse aiming the torch. Movement keeps its direction across camera cuts. Chosen after trying all five in the camera lab. | 2026-10-09 |
| Death reloads the last hearth checkpoint. This is the prototype's rule; the final death rule hasn't been decided. | 2026-10-09 |

### Story

All from William on 2026-10-10 unless noted. The full summary, with a 22-beat outline, is in
[story/story-so-far.md](story/story-so-far.md) (v4, a rough draft William expects to revise).

- **Names:** the son is **William Sloan**; his father is **Alan Sloan**. His face hasn't been decided.
- **The son's past:** he grew up on the island until he was five, when his mother took him to a major city (never named)
  and never let him return. She let him write letters to his father, but he never got a reply. By sixteen his father was
  as good as dead to him, and he never visited. He loved his father, never fell out with him, and never hated his mother.
- **The father:** loving but somewhat strict, an alcoholic (revealed through notes and islanders), and he served in the
  British Army. His parents died when he was fifteen. **How he died is a mystery** until late: islanders tell different
  versions, and the truth comes late in his own hand. The actual cause is undecided.
- **The opening is on the ferry.** All we learn there is that he's going to his father's funeral; the backstory comes later.
- **Arrival** on the main island seems normal, with small strange things. He goes to his father's house on a tidal islet
  with a lighthouse, which is the **main hub**.
- **The vigil:** he sits by his father's coffin without knowing the rituals. It is playable, using real Scottish death
  customs the player can't get right. Nothing seems wrong until the kirk service, when the body is gone and the
  **islanders turn hostile**.
- If he's caught on the main island by the tide, he must **shelter and wait it out**.
- **Boss 1 is the Hogboon**, brought down at the ferry pier. Its corpse releases a curse, so the pier stands but can't be
  used. An **email from the ferry company** reroutes the ferry to a town across the island (as Orkney's ferries only use
  Stromness or Kirkwall).
- **The goal** is a final journey to that ferry terminal, earned by opening up the map through bosses and puzzles.
- **Two endings:** go home on the ferry, or stay and take over his father's watch. **The player never picks** from a menu:
  choices made through the game decide it. Staying has to be earned (learning the rites, laying his father to rest by
  name).
- **No cutscenes, ever.** The story is told through NPCs and through notes, letters and books. **No voicemails** from the
  father.
- **Themes:** depression, grief, growing up, and what it means to be an adult, with "one pill a day" worked in.
- **The pill** is, for now, a free daily choice with no consequences: take it or don't, and nothing changes. In
  character he half-fears running out. It is never the villain and never tied to the endings. Ideas for consequences are
  parked in section 9b of the story summary in case William revisits it.
- **Working plan** (William is "happy with most of it for now"): his father kept every letter and wrote replies he never
  sent; the islanders are taken by the dead but still alive, so laying the dead to rest frees them; and the story of why
  his mother left (story summary, section 5).

## Art direction

**Settled (2026-10-10):** direction **B, "Lamplight" (PS2)** is the base look. When health or Resolve is low, the screen
switches to the monochrome haar grade, where only red keeps its colour.

The two rounds of concept shots, both real-time three.js renders rather than generated images, are in
[art/](art/):

1. **Round 1** ([art/concept-shots/](art/concept-shots/README.md)): six moments (ferry, vigil, kirk, dialogue, combat,
   notebook) in three candidate looks: A Peat & Sodium (PS1, 320x180), B Lamplight (PS2, 640x360) and C Haar
   (monochrome). William picked B, with C's grade for low Resolve, but wanted it **grittier and more realistic, less
   cartoony and blocky, with rich, intricate textures**.
2. **Round 2** ([art/concept-shots-v2/](art/concept-shots-v2/README.md)): the same six moments at full resolution with a
   photo-scanned head, sculpted bodies, procedural PBR textures and image-based lighting, each in a normal and a
   low-Resolve version. William's verdict: **"Better but not quite there."** It lost the PS1/PS2 look he wants: low
   resolution and dithering. Its frames and tool were later removed because the face scan and the HDR skies were
   third-party.
3. **Round 3** ([art/concept-shots-v3/](art/concept-shots-v3/README.md), 2026-10-10): round 2's sculpted bodies and
   textures through B's pipeline (640x360, ordered dither, vertex snap, hard-pixel upscale), with self-sculpted faces
   and procedural skies so nothing in it is licensed. Two shots, dialogue and combat. Awaiting William's verdict.

**Where it stands:** the target is round 2's realistic models and detailed textures **seen through B's lo-fi pipeline**
(low internal resolution, dithering), not full-resolution realism. No third-party art: faces, skies and textures are
made for the project. Section 8 of the concept document (480x270) still needs updating to match.

## Open questions

- **Story:** which in-game choices count toward the ending (the five proposed in section 10 of the story summary); the
  true cause of Alan's death; whether the pill gets consequences later; whether texts from his mother and the coastguard
  stay.
- **Art:** the final look, as above, and the protagonist's face.
- **Combat:** whether the deflect now reads and feels right after the fixes (see [Playtest feedback](#playtest-feedback));
  how fast the dead are, and whether three at once is too many.
- **Death rule:** the concept recommends reloading the last save (the cottage or a refuge); the prototype does that for now.
- **Concept document section 13** lists decisions that have since been made (camera, the pill, the protagonist's name).
  Treat this record as current.

## What has been built

The game code is in this repository. See the [main README](../README.md) to run it.

| Milestone | What it is | Pull request |
|---|---|---|
| Engine skeleton | Small, tested modules brought over from Airsoft: the fixed 60 Hz loop, frame pacing, seeds, WebGPU start-up with the WebGL2 fallback and device-loss recovery, quality step-down, debug overlay, crash report, saves and key rebinding. William confirmed it runs on WebGPU on his own graphics card. | #1 |
| M0: first playable slice | The cottage, the Brough and the tidal causeway in greybox under camera A, in the low-res dithered look, with the tide and the island's hum. William: "I'm happy with that. Feels good." | #3 |
| M1: combat prototype | Three of the dead on the shore, the knife that can't keep them down, the note, the sword on the howe slab, with deflect, Resolve, Break and the Rite. William: "quite good for a first test". | #4 |
| M1 deflect fixes | The deflect made reliable and readable after William's playtest (see below). | #8 |

Playable builds and the camera lab were published as claude.ai artifacts, which only William's account can open:
[camera lab](https://claude.ai/artifact/AeiT4iTYDFGWtLZhDpbzBU),
[M0](https://claude.ai/artifact/FNETqvfTLu65TUHz5ZeWd8) and [M1](https://claude.ai/artifact/MyusiGSTaMTQzLVp8JHUjk).
The camera lab is a standalone page, so a copy is in [prototypes/camera-lab.html](prototypes/camera-lab.html): open it in
a browser and press 1 to 5 to switch cameras. M0 and M1 are builds of this repository (`npm run build`).

## Playtest feedback

### M1 combat, 2026-10-10

William: "this is quite good for a first test. deflects with right click feel a bit clunky/awkward. i can't really tell
if it's working."

What was wrong:

- **Right clicks were lost.** Mouse buttons were read from pointer events, which report only the first button pressed.
  A right click while the left button was held (deflecting out of a swing or a sained charge) never arrived.
- **Presses were dropped.** A deflect pressed during a swing's blow, a stagger or a hit-stop was thrown away, not
  remembered, so the game seemed to ignore it.
- **The window was tight and punished retries.** 150 ms, and a second press within about 230 ms of the last deflect
  ending had no window at all, even straight after a perfect deflect, so blows in quick succession couldn't each be met.
- **No clear cue to time it on.** The dead's wind-up is a random length, with no "now" moment.
- **The result was hard to see.** A perfect deflect showed only a small light at the blade tip, often off-screen at
  270p, and a guard looked almost the same as a hit.

What changed (PR #8):

- Mouse buttons come from mouse events, so a right click always registers. Left Shift also deflects.
- A deflect press waits up to 8 ticks (133 ms) for the player to be free, and a press during a hit-stop counts.
- The perfect window is 12 ticks (200 ms) at good Resolve. A perfect deflect re-arms at once, and pressing again
  straight after one opens a fresh window. The no-spam rule now covers only misses, for 10 ticks.
- **The tell:** a cold glint in the dead's raised hand and a sharp hiss 14 ticks (about 230 ms) before the blow.
- **Feedback:** a perfect deflect throws bright sparks and a ring of light where the blades meet, flashes the screen,
  rings louder and throws the enemy back a step. A guard throws a few dull sparks. The blade catches the light during
  the perfect window, so a press is seen to land.
- **A timing readout** under the view says how each deflect went: "Deflected", "100 ms early", "150 ms late",
  "Guarded", "Pressed again too soon" or "Mid-swing, too busy to deflect". It's on in the prototype so the window can be
  learned and tuned; F4 hides it.

Still to judge by playing: whether 200 ms is the right window, and whether the tell comes at the right moment.

## Process

### Pull requests

**Settled (William, 2026-10-09):** Claude merges its own pull requests in this repository once the typecheck, build and
tests pass (`npm run check`), without waiting for William's review, and tells him in the project thread when one is
merged. A failing PR is never merged. The repository has no GitHub CI yet, so the checks run before merging.

### The repository rename

On 2026-10-10 the game was renamed to Project Outbound (PR #5) and William renamed the GitHub repository from
`ggbillyjoe3526/projectk` to `ggbillyjoe3526/project-outbound`. GitHub redirects the old URLs, so a new repository must
never be created under the old name. In the code, storage keys use the `outbound.` prefix: settings, key bindings and
saves stored under the old `projectk.` prefix are moved over once at start-up, and save files marked `ProjectK` still
load.

### Airsoft

Airsoft ([ggbillyjoe3526/Airsoft](https://github.com/ggbillyjoe3526/Airsoft), MIT) is William's other browser game, on
the same stack. On 2026-10-09 it was reviewed for reuse ([reuse/airsoft-review.md](reuse/airsoft-review.md)): it has no
separable engine, so the small, well-tested modules around the edges were copied (PR #1) and the rest is used only as a
reference when a feature needs it, starting with the retro dither filter, to be rewritten in TSL. Airsoft's gameplay,
WebGL renderer, procedural art and physics were left behind. The record of what was taken, and from which Airsoft
commit, is [airsoft-sync.md](airsoft-sync.md) (PR #2).

### Routines

William asked on 2026-10-09 for the project to keep checking Airsoft for useful updates. A routine, **"Airsoft sync
check"**, runs on Mondays at 08:58 UTC: it compares new Airsoft commits on the modules Project Outbound took, ports
clear fixes by hand while keeping this game's adaptations, and opens a sync pull request, merged by the rule above. It
reports in the project's "Airsoft sync" thread, and its check log is section 6 of the Airsoft review (the copy here is a
snapshot from 2026-10-10).

**The routine is paused.** William asked for that when he put the project on hold (2026-10-10). It is still set up,
just disabled, and can be turned back on when he asks.

## History

| Date | What happened |
|---|---|
| 2026-10-09 | William started the project with his notes ("Sekiro/Dark Souls meets Resident Evil", PS1/PS2 lo-fi, horror, lore-driven story) and seven inspiration images ([reference/](reference/README.md)). |
| 2026-10-09 | Concept v0.1: working title UNBURIED, a mountain town over a funerary temple, "skill is your ammunition". |
| 2026-10-09 | v0.2: Scotland, a sword with a spiritual resource instead of ammo, WebGPU. Set in 1847 in the Highlands. |
| 2026-10-09 | v0.3: an island reached by ferry, a looping map, folklore from all of Scotland. Set in 1919. |
| 2026-10-09 | v0.4: present day, stranded, a hub on a tidal islet, the sword from the kirk. |
| 2026-10-09 | v0.5: reading the tide by the island's vibrations, the useless knife, off-hand items, the offline phone, the father's funeral. |
| 2026-10-09 | v0.6: the pill, keyboard and mouse only, the opening sequence, five camera options with the playable camera lab. Camera A chosen. |
| 2026-10-09 | Airsoft review; engine skeleton merged (PR #1); Airsoft sync record (PR #2) and the weekly routine set up. |
| 2026-10-09 | William asked for pull requests to be merged automatically once checks pass. |
| 2026-10-09 | M0 merged (PR #3) and approved by William. M1 combat prototype merged (PR #4). |
| 2026-10-10 | Renamed to Project Outbound (PR #5); repository renamed to `project-outbound`. |
| 2026-10-10 | Story summary written and revised to v4 over William's notes (ferry opening, names, vigil, the Hogboon and the pier, two endings, the pill). |
| 2026-10-10 | Art direction: round 1 (A/B/C), William picked B with the low-Resolve grade; round 2 (realistic), "better but not quite there". |
| 2026-10-10 | William put the project on hold: no new work, no more concept images, the Airsoft routine paused. Everything was brought into this repository. |
| 2026-10-10 | Work resumed. William's M1 playtest: the deflect felt clunky and he couldn't tell if it worked. Fixed in PR #8. |
