# Project Outbound

A web survival-horror game (Project Outbound is its working title): TypeScript, Vite and Three.js's `WebGPURenderer`,
keyboard and mouse. The design lives in the [concept document](docs/concept/concept-v0.6.md) (v0.6) and the
[story summary](docs/story/story-so-far.md).

**The project is on hold** (since 2026-10-10). The [project record](docs/project-record.md) has every decision, what's
still open and how the project got here, and [docs/](docs/README.md) has everything else: the concept versions, the
story, the art direction shots and their tools, and the camera lab.

The engine skeleton (the loop, saving, input, renderer start-up and diagnostics) runs the first playable slice, M0:
the father's cottage, the Brough and the tidal causeway in greybox, under authored tracking cameras (concept camera A),
in the low-resolution dithered look, with the tide and the island's hum; and M1, the fight: three of the dead on the
shore, the kitchen knife that cuts them down but can't keep them down, the note on the cottage table, and the sword on
the howe slab past the dyke, with deflect, Resolve, Break and the Rite. There is no story beyond that, and no art yet.

## Run it

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev          # development server with hot reload, http://localhost:5173
npm run t            # unit tests, dots and failures only
npm run check        # unit tests, then type check and production build
npm run build        # static site in dist/ (relative paths; any static host)
```

Controls: WASD to walk (relative to the camera), the mouse to aim the torch, hold F to kneel and listen to the island
(the hum's strength and beat tell the tide), Q for the torch. Left click attacks (hold it with the sword for a sained
strike, which costs Resolve), right click deflects (just as a blow lands), Space steps aside, and E reads, takes, rests
at the hearth (where a death reloads to) and gives a kneeling body the Rite. Press `` ` `` or F3 for the debug overlay (frame rate,
renderer, draw calls, GPU time, simulation tick, seed, tide, player, camera zone, hum) and `]` to run island time
×4, ×16 or ×64.

URL flags: `?seed=N` plays seed N; `?forceWebGL` draws with the renderer's WebGL2 back end without asking for WebGPU
(automated browsers in containers have no WebGPU adapter); `?at=x,z` starts the player at that point and `?tide=f` at
fraction f of the tide's cycle (0 low water, 0.5 high water); `?weapon=sword` starts with the sword in hand.

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
src/camera     authored cameras: zones, fixed/rail/crane rigs, movement keys that keep their direction across cuts
src/render     renderer start-up, the WebGPU adapter probe, GPU tier, automatic quality step-down; the greybox scene,
               sea and GPU-computed rain
src/render/retro  the low-resolution look: ordered dither and colour quantisation (TSL), PS1 vertex snapping
src/render/webgpu  the renderer back end (device loss, GPU timing) and Chromium WebGPU compatibility fixes
src/save       guarded storage, the save file (format, migrations, checksum), restore points and Undo, tab lock
src/settings   the player's saved settings: one versioned object
src/sim        pure simulation: the tide, the hum's rhythm, player movement and wading, collision, the greybox world,
               the fight (sim/combat: moves, Resolve, Break, the Rite, the dead's behaviour);
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
