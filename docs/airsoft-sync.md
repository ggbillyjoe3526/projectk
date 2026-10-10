# Airsoft sync record

Project Outbound's engine skeleton came from William's other game, Airsoft
([ggbillyjoe3526/Airsoft](https://github.com/ggbillyjoe3526/Airsoft), MIT). This file records what was
taken, and from which Airsoft commit.

**No more syncing.** A weekly check used to compare new Airsoft commits against these files and port fixes. William
stopped it on 2026-10-10: nothing more is pulled from Airsoft, and the files below are now Project Outbound's own.

**Last synced Airsoft commit:** `324602b813e89def3aa41cfd12252d455c9d3d86` (main, "WebGPU step 3", 0.1 Dev 4)

Every file below matched Airsoft at that commit apart from Project Outbound's own adaptations (the `outbound.` storage
prefix and the one-time move of keys from the first working title's `projectk.` prefix in `guardedStorage.ts`, which
also reads save files marked `ProjectK`; Project Outbound's controls; the single-renderer start-up).

## Taken as-is (same path in both repos, with their tests)

Tests beside a module (`x.test.ts`, `x.qa.test.ts` and so on) are at the same path in both repos and came across with it.

| Area | Paths |
|---|---|
| Loop | `src/core/fixedStepper.ts`, `src/core/framePacer.ts`, `src/core/awayWatch.ts` |
| Determinism | `src/sim/rng.ts`, `src/core/seed.ts`, `src/sim/vec.ts` |
| WebGPU start-up | `src/render/webgpuProbe.ts`, `src/render/rendererStart.ts` (reworked: one renderer) |
| WebGPU back end | `src/render/webgpu/nodeBackend.ts` (device loss and GPU timing only), `src/render/webgpu/webgpuCompat.ts` |
| Quality | `src/render/qualityStepDown.ts`, `src/render/gpuCheck.ts` |
| Diagnostics | `src/core/crashReport.ts`, `src/ui/crashScreen.ts`, `src/ui/debugOverlay.ts`, `src/ui/clipboard.ts` |
| Saving | `src/save/guardedStorage.ts`, `src/save/tabLock.ts`, `src/save/saveFile.ts`, `src/save/sha256.ts`, `src/save/overStored.ts`, `src/save/saveManager.ts`, `src/save/stores.ts` |
| Settings | `src/settings/storage.ts` (Project Outbound's settings list) |
| Input | `src/input/keyBindings.ts`, `src/input/keyboard.ts`, `src/input/keyboardLayout.ts` |
| Audio | `src/audio/voiceLimit.ts` |
| Config | `src/config/sim.ts`, `src/config/render.ts`, `src/config/renderBackend.ts`, `src/config/save.ts`, `src/config/crash.ts`, `src/config/controls.ts` (this game's values; only structural changes carry over) |

`src/ui/dom.ts` and `src/testSupport/memoryStorage.ts` are Project Outbound's own.

## Never taken: rewrite references

The 2026-10-09 review marked these as references for later Project Outbound features. Since the sync stopped, nothing
more is taken from Airsoft, these included.

`src/render/retroFilter.ts` (dither and low-res maths, to be rewritten in TSL), `src/sim/simulation.ts`,
`src/sim/commands.ts`, `src/sim/events.ts`, `src/input/playerInput.ts`, `src/input/pointerLock.ts`,
`src/input/sensitivity.ts`, `src/audio/` (engine, mix, occlusion, dsp), `vite.config.ts`, `e2e/webgpu.spec.ts`,
`pipeline/perf-run.mjs`, `.github/workflows/check.yml`.

## Never taken

Airsoft's gameplay (ballistics, hits, rounds, modes, bot AI, replicas, economy, stats, tutorial), its WebGL renderer
and node "twins", the `EffectComposer` post stack, procedural art, Rapier physics and the box map format. The full
reasoning is in the original review, [reuse/airsoft-review.md](reuse/airsoft-review.md).
