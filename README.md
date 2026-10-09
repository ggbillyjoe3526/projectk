# ProjectK

A web survival-horror game (working title UNBURIED): TypeScript, Vite and Three.js's `WebGPURenderer`, keyboard and
mouse. The design lives in the project's concept document (v0.6).

The engine skeleton (the loop, saving, input, renderer start-up and diagnostics) runs the first playable slice, M0:
the father's cottage, the Brough and the tidal causeway in greybox, under authored tracking cameras (concept camera A),
in the low-resolution dithered look, with the tide and the island's hum. There is no combat, story or art yet.

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
(the hum's strength and beat tell the tide), Q for the torch. Press `` ` `` or F3 for the debug overlay (frame rate,
renderer, draw calls, GPU time, simulation tick, seed, tide, player, camera zone, hum) and `]` to run island time
×4, ×16 or ×64.

URL flags: `?seed=N` plays seed N; `?forceWebGL` draws with the renderer's WebGL2 back end without asking for WebGPU
(automated browsers in containers have no WebGPU adapter); `?at=x,z` starts the player at that point and `?tide=f` at
fraction f of the tide's cycle (0 low water, 0.5 high water).

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
src/game       the playable slice: runs the simulation and presents it (game/broughSlice.ts)
src/camera     authored cameras: zones, fixed/rail/crane rigs, movement keys that keep their direction across cuts
src/render     renderer start-up, the WebGPU adapter probe, GPU tier, automatic quality step-down; the greybox scene,
               sea and GPU-computed rain
src/render/retro  the low-resolution look: ordered dither and colour quantisation (TSL), PS1 vertex snapping
src/render/webgpu  the renderer back end (device loss, GPU timing) and Chromium WebGPU compatibility fixes
src/save       guarded storage, the save file (format, migrations, checksum), restore points and Undo, tab lock
src/settings   the player's saved settings: one versioned object
src/sim        pure simulation: the tide, the hum's rhythm, player movement and wading, collision, the greybox world;
               seeded random numbers, allocation-free vectors
src/audio      voice limiting; the island's hum, wind and rain (synthesised with Web Audio)
src/ui         start pane, debug overlay, crash pane
```

## Where this came from

Most modules here were brought over from William's other game, Airsoft
([ggbillyjoe3526/Airsoft](https://github.com/ggbillyjoe3526/Airsoft), MIT), together with their tests, and adapted:
storage keys moved to the `projectk.` prefix, the controls are ProjectK's (concept section 7), and the renderer
start-up was reworked because ProjectK has one renderer (`WebGPURenderer`, WebGPU or its WebGL2 back end) where
Airsoft keeps a separate WebGL renderer. Airsoft's gameplay, art, physics and WebGL-era rendering were left behind.
