# Project Outbound

A web survival-horror game (Project Outbound is its working title): TypeScript, Vite and Three.js's `WebGPURenderer`,
keyboard and mouse. The design lives in the [concept document](docs/concept/concept-v0.6.md) (v0.6) and the
[story summary](docs/story/story-so-far.md).

Work is chapter by chapter ([chapter plan](docs/story/chapters.md)). Chapter 1, "The Crossing", is built: a new game
opens on it, and Low water (the vertical slice, [plan](docs/vertical-slice-plan.md), which becomes chapter 3) follows
once it's done. The [project record](docs/project-record.md)
has every decision, what's still open and how the project got here, and [docs/](docs/README.md) has everything else:
the concept versions, the story, the art direction shots and their tools, and the camera lab.

The engine skeleton (the loop, saving, input, renderer start-up and diagnostics) runs the first playable slice, M0:
the father's cottage (now fully dressed), the Brough and the tidal causeway in greybox, under authored tracking cameras (concept camera A),
in the low-resolution dithered look, with the tide and the island's hum; and M1, the fight: the dead on the shore,
the kitchen knife that cuts them down but can't keep them down, the note on the cottage table, and the sword, with
deflect, Resolve, Break and the Rite. The first stage of the vertical slice adds the village street and its shop, the
lane up to the kirkyard, and the kirk, where the sword lies on the howe slab, with the vestry as a refuge, and plays
the opening's beats with no cutscenes: you first go over with only the torch and have to turn back, take the kitchen
knife from the dresser, watch one it cut down get up again, find your father's notebook, and bring the sword home from
the kirk. All of it is greybox. Chapter 1 (`src/game/crossing`, `src/content/crossing`) is the night before: the late ferry
docks at 23:45 after the causeway has shut, Morag offers a room at her inn, the island is shut, the night passes at
the inn, and on Thursday he crosses to his father's cottage for the vigil, which ends the chapter. It has people to
talk to, signs and gravestones to read, texts and notes on the phone (Tab, which also shows the time and the tide),
and a real Orkney tide.

## Run it

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev          # development server with hot reload, http://localhost:5173
npm run t            # unit tests, dots and failures only
npm run check        # unit tests, then type check and production build
npm run build        # static site in dist/ (relative paths; any static host)
npm run smoke        # after a build: start the game in headless Chromium on the WebGL2 path
                     # (needs `npx playwright install chromium` once)
```

Controls: the player faces the pointer and W walks toward it (there is no strafing; the mouse steers), and a tap of
Left Shift sprints (another tap, or stopping, ends it) while stamina lasts (the pale green mark under Resolve), loudly enough that the dead hear it from
further off than they can see you; a small mark over one of the
dead shows which one an attack goes for, turning red once it's in reach; Escape or P pauses; the mouse
also aims the torch, hold F to kneel and listen to the island
(the hum's strength and beat tell the tide, and the screen's edges ripple with it), Q for the torch (its battery, the thin amber mark under Resolve, runs down
while it's lit and charges in the cottage). Left click attacks (hold it with the sword for a sained
strike, which costs Resolve), right click deflects (as the blow lands; a glint in the attacker's hand
comes just before it), Space steps quickly back, away from the pointer (the only defence empty-handed), and E reads (the notebook, the tide table by the cottage door), takes, opens
a gate from its barred side, rests at the hearth or waits out the tide in the kirk vestry (both save the game, and are
where a death returns to), and gives a kneeling body the Rite. Press `` ` `` or F3 for the debug overlay (frame rate,
renderer, draw calls, GPU time, simulation tick, seed, tide, player, camera zone, hum) and `]` to run island time
×4, ×16 or ×64. F4 hides or shows the deflect timing readout (early, late or perfect, in milliseconds).

URL flags: `?chapter=1` or `?chapter=lowwater` starts that part; `?seed=N` plays seed N; `?forceWebGL` draws with the renderer's WebGL2 back end without asking for WebGPU
(automated browsers in containers have no WebGPU adapter); `?at=x,z` starts the player at that point and `?tide=f` at
fraction f of the tide's cycle (0 low water, 0.5 high water); `?weapon=knife` or `?weapon=sword` starts with that in hand, the story as far on as it would be. Any of
`at`, `tide` and `weapon` sets up a test visit that neither loads nor overwrites the saved game.

The game saves in the browser: the blades taken, the story's beats, documents read and gates opened as soon as they happen, and the checkpoint
when you rest. A new build that changes the level's layout keeps that progress but starts you at the cottage. The start
pane offers to start over.

## How it starts

1. `save/guardedStorage.ts` starts the browser storage every save goes through.
2. `render/rendererStart.ts` probes for a WebGPU adapter and makes `WebGPURenderer` on it; with no hardware adapter
   (or the WebGL setting), the same renderer runs on its WebGL2 back end. A lost device gets a new one, and after
   repeated losses the WebGL2 back end takes over.
3. `main.ts` runs the fixed 60 Hz simulation step (`core/fixedStepper.ts`) and draws at the display rate, capped by
   `core/framePacer.ts`. Any uncaught error stops the game on the crash pane with a copyable report.

## Layout

```
src/config     tuning data: simulation rate, renderer, quality and look, controls, tide, player, save keys, crash text
src/core       fixed-timestep loop, frame pacing, seeds, pausing when the player looks away, crash reports
src/input      keyboard and mouse into actions: bindings (rebindable, two keys each), keyboard layout names, mouse aim
src/game       the playable slice: runs the simulation and presents it (game/broughSlice.ts), and the fight in it
               (game/broughFight.ts)
src/content    levels as data (content/levels): ground, walls, props, cameras, where things and the dead are, set dressing;
               content/level.ts checks a level for authoring mistakes (run by the unit tests)
src/camera     authored cameras: zones, fixed/rail/crane rigs, movement keys that keep their direction across cuts
src/render     renderer start-up, the WebGPU adapter probe, GPU tier, automatic quality step-down; the greybox scene,
               sea and GPU-computed rain
src/render/retro  the low-resolution look: ordered dither and colour quantisation (TSL), PS1 vertex snapping
src/render/webgpu  the renderer back end (device loss, GPU timing) and Chromium WebGPU compatibility fixes
src/save       guarded storage, the save file (format, migrations, checksum), restore points and Undo, tab lock
src/settings   the player's saved settings: one versioned object
src/sim        pure simulation: the tide, the hum's rhythm, player movement and wading, collision, the ground built from
               level data, the fight (sim/combat: moves, Resolve, Break, the Rite, the dead's behaviour);
               seeded random numbers, allocation-free vectors
src/audio      voice limiting; the island's hum, wind and rain (synthesised with Web Audio)
src/ui         start pane, debug overlay, crash pane
docs           the project record, concept and story documents, art direction shots and tools, the camera lab
```

## Where this came from

Most modules here were brought over from William's other game, Airsoft
([ggbillyjoe3526/Airsoft](https://github.com/ggbillyjoe3526/Airsoft), MIT), together with their tests, and adapted:
storage keys moved to the game's own prefix (`outbound.`), the controls are Project Outbound's (concept section 7),
and the renderer start-up was reworked because Project Outbound has one renderer (`WebGPURenderer`, WebGPU or its
WebGL2 back end) where Airsoft keeps a separate WebGL renderer. Airsoft's gameplay, art, physics and WebGL-era rendering were left behind.
