# Airsoft sync record

ProjectK's engine skeleton came from William's other game, Airsoft
([ggbillyjoe3526/Airsoft](https://github.com/ggbillyjoe3526/Airsoft), MIT). Both games keep being worked on, so a weekly
check compares new Airsoft commits against the modules ProjectK took and opens a pull request here when one of them
gained a fix or improvement worth having. This file is that check's record: what was taken, and from which Airsoft
commit.

**Last synced Airsoft commit:** `324602b813e89def3aa41cfd12252d455c9d3d86` (main, "WebGPU step 3", 0.1 Dev 4)

Every file below matches Airsoft at that commit apart from ProjectK's own adaptations (the `projectk.` storage prefix,
ProjectK's controls, the single-renderer start-up). A sync pull request updates the commit above in the same change
that brings the code across.

## How to check

```bash
git clone --filter=blob:none https://github.com/ggbillyjoe3526/Airsoft.git ../airsoft
git -C ../airsoft log --oneline <last synced>..origin/main -- <paths below>
git -C ../airsoft diff <last synced>..origin/main -- <path>
```

Then port the Airsoft change onto the ProjectK file by hand, keeping ProjectK's adaptations, and run `npm run check`.

## Taken as-is (same path in both repos, with their tests)

Tests beside a module (`x.test.ts`, `x.qa.test.ts` and so on) are at the same path in both repos and come across with it.

| Area | Paths |
|---|---|
| Loop | `src/core/fixedStepper.ts`, `src/core/framePacer.ts`, `src/core/awayWatch.ts` |
| Determinism | `src/sim/rng.ts`, `src/core/seed.ts`, `src/sim/vec.ts` |
| WebGPU start-up | `src/render/webgpuProbe.ts`, `src/render/rendererStart.ts` (reworked: one renderer) |
| WebGPU back end | `src/render/webgpu/nodeBackend.ts` (device loss and GPU timing only), `src/render/webgpu/webgpuCompat.ts` |
| Quality | `src/render/qualityStepDown.ts`, `src/render/gpuCheck.ts` |
| Diagnostics | `src/core/crashReport.ts`, `src/ui/crashScreen.ts`, `src/ui/debugOverlay.ts`, `src/ui/clipboard.ts` |
| Saving | `src/save/guardedStorage.ts`, `src/save/tabLock.ts`, `src/save/saveFile.ts`, `src/save/sha256.ts`, `src/save/overStored.ts`, `src/save/saveManager.ts`, `src/save/stores.ts` |
| Settings | `src/settings/storage.ts` (ProjectK's settings list) |
| Input | `src/input/keyBindings.ts`, `src/input/keyboard.ts`, `src/input/keyboardLayout.ts` |
| Audio | `src/audio/voiceLimit.ts` |
| Config | `src/config/sim.ts`, `src/config/render.ts`, `src/config/renderBackend.ts`, `src/config/save.ts`, `src/config/crash.ts`, `src/config/controls.ts` (ProjectK's values; only structural changes carry over) |

`src/ui/dom.ts` and `src/testSupport/memoryStorage.ts` are ProjectK's own.

## Not taken yet: rewrite references

These are read, not copied, when a ProjectK feature reaches them. A check only notes changes to them.

`src/render/retroFilter.ts` (dither and low-res maths, to be rewritten in TSL), `src/sim/simulation.ts`,
`src/sim/commands.ts`, `src/sim/events.ts`, `src/input/playerInput.ts`, `src/input/pointerLock.ts`,
`src/input/sensitivity.ts`, `src/audio/` (engine, mix, occlusion, dsp), `vite.config.ts`, `e2e/webgpu.spec.ts`,
`pipeline/perf-run.mjs`, `.github/workflows/check.yml`.

## Never taken

Airsoft's gameplay (ballistics, hits, rounds, modes, bot AI, replicas, economy, stats, tutorial), its WebGL renderer
and node "twins", the `EffectComposer` post stack, procedural art, Rapier physics and the box map format. The full
reasoning is in the original review in the project's shared files (`reuse/airsoft-review.md`).
