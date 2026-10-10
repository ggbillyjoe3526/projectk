# Airsoft → Project Outbound: reuse review

Reviewed 2026-10-09 against `ggbillyjoe3526/Airsoft` at `324602b` (main, "WebGPU step 3", 0.1 Dev 4) and the Project Outbound
concept at `concept/concept-v0.6.md`. Nothing has been copied into the game's repo yet.

## Bottom line

Airsoft has no separate "engine" to lift out. It is one well-built game (about 70,000 lines of TypeScript, plus 379
test files) whose glue (`game.ts`, `matchSession.ts`) is airsoft-specific. What it does have is a set of **small,
pure, well-tested modules** around the edges (loop timing, saving, key bindings, WebGPU start-up and device loss,
quality step-down, crash reports) and a **proven architecture** that matches the one the Project Outbound concept already
chose (pure 60 Hz simulation, commands in, events out, presentation reads only).

Recommendation: copy about **2,200 lines as-is** (with their tests), use about **2,700 more as the starting point for
rewrites**, adopt the architecture and the tooling patterns, and skip the rest. That saves real time in M0 and M1,
mostly on the unglamorous parts that are easy to get subtly wrong. It does not give us rendering, combat or the
camera; those are Project Outbound's own work.

Licence: Airsoft is MIT and the same owner, so there's no licence issue. It has no third-party art worth taking (all
procedural), and its one font (Inter, OFL) is easy to get directly.

Both projects use the same stack: TypeScript strict, Vite, Vitest, Playwright and Three.js. Airsoft pins
**three 0.186.1** and has already shipped `WebGPURenderer` on it, which is a good reason for Project Outbound to pin the same
version for M0.

## 1. Reuse almost as-is

These have no Airsoft game logic in them. Most import only a config constant, which moves to Project Outbound's own `config/`.

| Area | Files (Airsoft `src/`) | Lines | Why it's useful here |
|---|---|---|---|
| Loop | `core/fixedStepper.ts`, `core/framePacer.ts`, `core/awayWatch.ts` | 80 | Fixed 60 Hz accumulator with interpolation alpha and a spiral-of-death cap; frame-rate cap; pauses on a hidden tab or lost focus. Exactly the sim loop section 10 asks for. |
| Determinism | `sim/rng.ts`, `core/seed.ts`, `sim/vec.ts` | 120 | Seedable mulberry32 kept in state, `?seed=N`, allocation-free vector helpers. |
| WebGPU start-up | `render/webgpuProbe.ts`, `render/rendererStart.ts` | 120 | Probes for an adapter (with a timeout, quietly) before downloading `three/webgpu`; rejects the software adapter on Auto; falls back to WebGL2 cleanly. This is the "WebGPU with automatic WebGL2 fallback" decision, already working. |
| WebGPU browser fixes | `render/webgpu/webgpuCompat.ts` | 110 | Patches two real Chromium 141 WebGPU differences with three 0.186 (texture swizzle string; 3D texture layer writes), tested on the device. Worth keeping while we're on the same three version. |
| Device loss, GPU timing | parts of `render/webgpu/nodeBackend.ts` | ~120 of 265 | Recovers from a lost device instead of Three's default (which stops for good), reads GPU time from timestamp queries without allocating, reads draw counts correctly on the node renderer (`render.drawCalls`, not `render.calls`). Take those parts; the rest is Airsoft's WebGL-twin plumbing. |
| Quality | `render/qualityStepDown.ts`, `render/gpuCheck.ts` | 150 | Drops one preset after sustained slow frames (no allocation, no sort); detects software rendering so the title screen can warn and start on Low. |
| Diagnostics | `ui/debugOverlay.ts`, `core/crashReport.ts`, `ui/crashScreen.ts` | 200 | F3 overlay fed by a stats callback; "Something went wrong" pane with a copyable report (build, GPU, seed, settings, stack). Cheap to have from day one. |
| Saving | `save/guardedStorage.ts`, `save/tabLock.ts`, `save/saveFile.ts`, `save/sha256.ts`, `save/overStored.ts`, `save/saveManager.ts` | 950 | One tab plays at a time (Web Locks, BroadcastChannel fallback); a versioned save file with migrations and a checksum; never overwrites a newer build's save; storage full or blocked handled. A survival-horror save system needs all of this. See the note below on IndexedDB. |
| Key bindings | `input/keyBindings.ts`, `input/keyboard.ts`, `input/keyboardLayout.ts`, `input/sensitivity.ts` | 490 | Full rebinding with two keys per action, mouse buttons bindable like keys, key names that follow the player's layout (AZERTY shows "Z"), migration of moved defaults. Keyboard-and-mouse-only makes this matter more. |
| Audio | `audio/voiceLimit.ts` | 20 | Caps simultaneous voices. |

**Note on saving:** the concept says IndexedDB. Airsoft uses localStorage through `guardedStorage.ts`. Settings and key
bindings are small and fine in localStorage. The game save (world state, documents, inventory) should go to IndexedDB,
but the save *file* format, migrations, checksum and tab lock carry over unchanged; only the storage backend underneath
is new.

## 2. Adapt: good designs to rewrite for Project Outbound

| Area | Airsoft source | What carries over | What changes |
|---|---|---|---|
| **The PS1 retro filter** | `render/retroFilter.ts` (151) | Its pure, unit-tested maths: low-res target sizing, the 4×4 Bayer threshold, per-channel quantisation, dither cells as chunky as the pixels. This is the concept's core look (section 8). | It's a GLSL `ShaderMaterial`; Airsoft hasn't ported it to the node renderer yet (their W4). Project Outbound writes it in **TSL** from the start, using these functions and tests as the reference. |
| **Simulation architecture** | `sim/simulation.ts`, `sim/commands.ts`, `sim/events.ts`, `sim/movement.ts` | The shape: plain-data `GameState`; one `PlayerCommand` that the player and AI both fill; `state.events` that audio, VFX and HUD consume after each tick; services injected as interfaces (`CharacterMover`, `WorldQuery`) so the sim never imports physics or Three.js. | Contents are all new (sword, deflect, Break, Resolve, tide). The `CharacterMover` interface fits the concept's custom controller over `three-mesh-bvh` directly. |
| **Input latching** | `input/playerInput.ts` (309) | One-shot actions (attack, deflect, step) latched until a tick consumes them, so nothing is lost or doubled between frames and ticks; hold-or-toggle modes. Deflect timing depends on this. | Add the concept's high-resolution event timestamps so a deflect press lands in the right tick. Drop the order wheel, ADS, lean. |
| **Mouse** | `input/pointerLock.ts` (249) | Button routing into bindings, blocking the browser's back/forward buttons, releasing everything on focus loss. | Camera A aims with a visible cursor on the floor, so pointer lock may not be used at all (section 10 already says "only if the camera needs it"). |
| **Audio engine** | `audio/audioEngine.ts`, `audioMix.ts`, `sfx.ts`, `occlusion.ts`, `dsp.ts` (≈1,700) | Suspended-until-play `AudioContext`; master / effects / interface buses with a limiter and ducking; one HRTF panner per character that follows them, muffled by two occlusion rays (the Nuckelavee's hooves on the shingle); `dsp.ts` renders layered noise/tone/resonance recipes offline into buffers, which is a fast way to prototype the island's hum in M0 before real recordings. | Strip airsoft cues and the replica motor. The concept's AudioWorklet and tide-driven hum layers are new. |
| **Settings storage** | `settings/storage.ts` (286) | Versioned settings object, fields only added, unknown fields kept, debounced saves. | Swap in Project Outbound's settings list. |
| **Quality presets** | `config/renderQuality.ts`, `config/graphics.ts` | The rule that every effect is a quality field with a value on every preset and a Custom row. | Project Outbound's own effects (internal resolution, dither, fog, rain compute, tide surface). |
| **Build config** | `vite.config.ts` (193) | Per-chunk size budgets that fail the build, Brotli and gzip precompression, hidden source maps, version string from git. | Budgets for Project Outbound's chunks (the concept's 20 MB first-playable target). |
| **Test and perf tooling** | `e2e/webgpu.spec.ts`, `pipeline/perf-run.mjs`, `pipeline/build-cached.mjs`, `.github/workflows/check.yml` | Playwright specs that fail on any console error and run the node renderer on its WebGL2 back end via `?forceWebGL` (cloud containers have no WebGPU adapter); a scripted 60-second perf run recording frame time, draw calls, triangles and heap growth against a committed baseline. That covers the concept's "smoke test on both paths" and its budgets. | A scripted Project Outbound walk instead of a Depot match. |
| **Pathfinding** | `nav/navGrid.ts` (827) | Layered 0.2 m grid with A* and string-pulling; handles floors above floors. | It builds from Airsoft's box-based map format. Useful later for the Unburied and trows, once Project Outbound's level format exists; not needed for M0. |

## 3. Skip

- **All airsoft gameplay:** BB ballistics, hop-up, hits and hit calling, rounds, modes, Extraction, the bots' AI
  (lanes, squads, cover), replicas and parts, the pool, Armory and economy, stats and records, the tutorial. None of it
  maps onto sword combat or survival horror.
- **The WebGL renderer and its "node twins".** Airsoft is mid-migration: its world materials are GLSL patches, and its
  WebGPU path re-creates each as a node "twin". Project Outbound is TSL-native from the start, so it needs neither the old
  path nor the twins (`worldTwins.ts`, `surfaceNodes.ts`, `effectNodes.ts`, `pointSprites.ts`, `figureNodes.ts`).
- **The post stack** (`render/post/`): built on `three/examples` `EffectComposer` passes, which the WebGPU renderer
  doesn't use. Project Outbound's post chain is TSL.
- **Procedural art:** textures, figure and replica builders, map dressing. Project Outbound's art is Blender to glTF.
- **Rapier physics** (`physics/`, a 4.3 MB chunk): the concept chose a custom kinematic controller over
  `three-mesh-bvh`. Airsoft's experience supports that choice: they disabled Rapier's snap-to-ground and hit a
  capsule-vs-cuboid bug.
- **Map format and `sim/levelRay.ts`:** axis-aligned boxes only.
- **The heavy process layer:** the eight-step pipeline, critic and QA agents, review packets, task records. It suits a
  mature project with many threads; at M0 it would cost more than it saves. Revisit around M2.

## 4. Lessons worth carrying (from Airsoft's code comments and decisions)

- Headless Chromium in cloud containers has no WebGPU adapter, so automated tests run the node renderer on its WebGL2
  back end (`forceWebGL`); real WebGPU numbers need the owner's laptop or desktop.
- A `WebGPURenderer` whose `init()` failed must not be disposed (its `dispose()` re-triggers init and leaves an
  unhandled rejection).
- `Points` draw one pixel wide on WebGPU; sized particles need instanced sprites. That's relevant to rain, sleet and
  spray.
- Frame times measured in a container are noise; gate only draw calls, triangles and memory there.
- "WebGPU no slower than WebGL on the owner's machines" was Airsoft's bar; Project Outbound has no WebGL baseline, so its bar
  is the concept's budgets (60 fps on integrated graphics, under 250 draw calls).

## 5. Suggested next step

If William approves, copy section 1 into the game's repo as the M0 skeleton (`src/core`, `src/save`, `src/input`, WebGPU
start-up, diagnostics), each module with its tests, renamed off the `airsoft.` storage prefix. Section 2 items are then
written fresh as M0 and M1 reach them, with the Airsoft file open as the reference.

## 6. Ongoing sync (weekly)

Section 1 was copied into the game's repo in PR #1 (merged 2026-10-09). A weekly routine ("Airsoft sync check", Mondays
08:58 UTC) now compares new Airsoft commits against what Project Outbound took. Its record of files and the last *synced*
commit lives in the game's repo at `docs/airsoft-sync.md`; this file keeps the log of checks.

**Last checked Airsoft commit:** `324602b` (2026-10-09, baseline; nothing new since the review)

### Check log

- 2026-10-09: baseline set at `324602b`. No changes to port.
