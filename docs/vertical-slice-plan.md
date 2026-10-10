# Project Outbound: where the game stands, and a vertical slice plan

Written 2026-10-10 from the code on `main` (after PR #11), the [project record](project-record.md), the
[concept doc v0.6](concept/concept-v0.6.md) and the [story summary v4](story/story-so-far.md).

**Settled (William, 2026-10-10):** the slice is built in the two stages below, "Low water" first. The details inside
each stage are still a working plan.

**Wrapped up (William, 2026-10-10):** Stage 1 was built (PRs #12 to #25) and the slice ends there; work moves to the
first chapter. Stage 2 was not started. The [project record](project-record.md) has what was built and the playtest
changes.

## 1. What you can play today

Everything below runs in the current build (M0 + M1), in greybox, on one small map: the father's cottage, the Brough,
the tidal causeway and a strip of shore past a dyke. The unit tests cover the simulation (234 passing).

**Moving and seeing**
- WASD walking at 3 m/s, relative to the camera; slower when wading. Authored high-angle cameras in four zones
  (cottage, Brough, causeway, shore), and your direction holds across a camera cut.
- The mouse aims you and the torch beam. Q switches the torch on or off. With it on, the dead see you from 15 m;
  with it off, from 6.5 m, but darkness outdoors drains Resolve.
- The low-res dithered look (270 lines high), rain, a real sea surface, fog.

**The tide**
- A 25-minute cycle. The causeway is walkable while the water over it is under 0.45 m, so you can be cut off on
  either side.
- Hold F to kneel and listen: the island's hum (synthesised audio) gets stronger and quicker as the tide rises, with
  a trembling hand, pebbles and a shivering puddle. It reads clearest at the standing stone, worst indoors.

**The fight**
- You start with the kitchen knife: quick, short, cuts the dead down, but builds no Break and can't lay them to rest.
- The note on the cottage table points to the sword on a slab past the dyke. E takes it.
- Sword: a three-hit chain that builds Break; hold for a sained strike (20 Resolve, heavy Break).
- Deflect (right click): a 200 ms perfect window that shrinks when Resolve is low. Perfect gives back
  5 Resolve, builds a lot of Break and throws the enemy back with sparks and a flash. Too late but still holding
  means a guard, which costs Resolve instead of health. A glint and a hiss come 400 ms before each blow. F4 shows
  how early or late you were.
- Space steps aside with a short invulnerable moment. Attacks turn toward a nearby enemy (soft lock-on).
- Three Unburied on the shore. They lurch, shuffle, go still and feint. Cut down, they rise again stronger 7 to 10
  seconds later, and watching one rise costs Resolve. Broken (full Break), they kneel: E gives the Rite (10 Resolve,
  gives back 35) and speaks their name, and they're gone for good. A fallen body can be laid down for 40 Resolve.
- Resolve starts at 70 of 100. Below 30 the picture drains of colour and closes in. At zero you're helpless for
  3 seconds.
- Resting at the hearth (E) restores you and sets the checkpoint. Death reloads it.

**Under the hood:** WebGPU with the WebGL2 fallback and device-loss recovery, a fixed 60 Hz simulation, automatic
quality step-down, a debug overlay (F3), a crash report screen, key rebinding, and a save system that exists but
isn't connected yet.

## 2. What is designed but not built

| Area | In the design | In the game |
|---|---|---|
| Story opening | The ferry, arrival, the vigil (salt, mirror, clock, window, candle), the kirk service where the body is gone and the islanders turn | None of it |
| Places | Village and pier, kirk and kirkyard, the Howe, then the rest of the island | Brough, causeway and one strip of shore |
| Tide play | Refuges for when you're caught out, a tide table at the cottage, spring tides and surges | The tide and listening only |
| Off hand | Torch (with a battery that charges at safe areas), lantern, two-handed grip, deid bell, salt, targe | Torch on or off, no battery |
| Resolve extras | Caim (warding circle), charms, drain from cold and terror | Not built |
| Health | Separate and scarce, with ways to heal | Only the hearth heals |
| Phone | The menu: notes, photos, the map, tide times, messages (the ferry email) | No phone. The note is read in a box on screen |
| Enemies | Unburied variants, the Drowned, trows, the Hogboon (boss 1), the Nuckelavee glimpse | One kind of Unburied |
| People | Islanders to talk to, no cutscenes | None |
| Puzzles | War-memorial names, solstice light | None |
| Saving | Hearth and refuges saved to disk | The checkpoint lives in memory and a page reload loses it |
| Look | Round 3 art: sculpted, detailed models through the PS2 pipeline at 640x360; low Resolve goes grey except red | Greybox at 270 lines; low Resolve greys everything, red included |
| Audio | Wind, sea, 3D positional sound, telegraph sounds, music | Hum, wind, rain and combat sounds |

Three places where the old concept doc disagrees with newer decisions (the project record wins):
- Concept section 11 puts the Hogboon fight in the Howe. The story moved it to the ferry pier, and its curse is why
  the pier can't be used.
- Concept section 6 has voicemails from the father. The story says no voicemails.
- The approved look is 640x360; the build runs at 270 lines. That's a one-line change when the art pass starts.

## 3. The slice in the concept, and why to stage it

Concept section 11 describes a 30 to 45 minute slice: the whole opening from the ferry to boss 1, about 10 to 12
spaces with a shortcut loop, two tide cycles with a night caught out in a refuge, three off-hand items, the phone,
two puzzles, three enemy types and the Hogboon. Compared with today's build that's roughly ten times the content and
a dozen new systems. Built in one go, nothing would be playable end to end for a long time, and the parts that most
need playtesting (the tide as a rhythm, listening, the knife's failure) would get tested last.

**Recommendation: build it in two playable stages.** Each one ends with something William can play start to finish.

### Stage 1: "Low water" (the proof of concept)

The question it answers: is an expedition fun? Cross at low water, push in, listen, fight, get back or get caught.

**Story beats 6 to 9:** the torch-only crossing and retreat, the knife crossing (they get back up), the note, and
taking the sword from the kirk. It starts on the morning after the vigil, with the cottage empty.

**Places (greybox, about 7 spaces):** the cottage, the Brough, the causeway, the shore, a short village street with
one open building, the kirkyard, and the kirk with the sword above the slab. One shortcut gate from the kirkyard back
to the village.

**Systems to build:**
1. **Spaces as data.** Today the whole world is one hard-coded greybox. Move it to a level format (walls, ground,
   doors, camera zones, spawns, items) so new spaces are authored, not coded. Everything else depends on this.
2. **The expedition loop.** The tide table at the cottage, one refuge (the kirk vestry) where you wait out the tide
   and save, and Resolve wearing down while you wait.
3. **Interaction and documents.** A small system for things you read and take, with every document logged so you
   can read it again. The phone comes in stage 2; until then the log is a simple overlay.
4. **The dead across the island.** Unburied placed per space, remembering who you've laid to rest and who will rise,
   across trips and saves.
5. **Torch battery,** charged at the cottage.
6. **Saving to disk** at the hearth and the refuge, through the existing save system.
7. **Pacing beats** with no cutscenes: the first sight of the dead on the torch-only trip, the knife kill that gets
   back up, the sword above the slab.

**Also in stage 1:**
- **One space in the real look.** The cottage interior built to the round 3 standard, in-engine at 640x360, to prove
  the art pipeline (original models and textures only) before it's needed everywhere.
- **The low-Resolve grade done properly:** grey with only red kept.
- **A GitHub workflow** that runs the tests and build on every pull request, and a smoke test on the WebGL2 path.

**Length:** about 15 minutes for a first-time player.

### Stage 2: "The funeral" (completes the concept's slice)

Story beats 1 to 5 and 10: the ferry crossing, arrival and the neighbour's tide lesson, the vigil played with the
five customs, the kirk service where the body is gone and the islanders turn, and the Hogboon hunting you down to the
pier. Its corpse curses the pier, and the ferry company's email arrives at the cottage.

**Systems:** talking to islanders (no cutscenes), the phone menu (notes, map photo, tide times, messages), the Drowned
at the causeway, the off-hand swap (torch, two-handed grip, deid bell), Caim, health pickups, a boss framework for the
Hogboon, the war-memorial puzzle, and the second tide cycle with a guaranteed night caught out.

**Length:** 30 to 45 minutes, matching the concept.

Then **polish (M4):** fresh-player playtests of listening and the tide, tuning, performance on a mid-range laptop,
settings and accessibility (visual tide indicator, generous tides, screen shake).

## 4. Decisions needed

- **Stage 1 can proceed on current rules:** death reloads the hearth, and three Unburied at the speed they have now.
  Both are open questions that the stage 1 playtest will help answer.
- **Before the art pass grows past the cottage:** the protagonist's face.
- **Before stage 2:** what the vigil's customs feed into (the ending choices are still open).

## 5. First steps

1. Spaces as data, with today's map converted to it and nothing changing in play. Done in PR #12.
2. The village street, kirkyard and kirk in greybox with their cameras.
3. The expedition loop: tide table, refuge, saving to disk, battery.
4. The opening beats wired through those spaces.
5. Playtest build for William, then the cottage art pass.
