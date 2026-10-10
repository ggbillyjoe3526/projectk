# Concept gameplay shots (art direction)

Six moments, each rendered in three candidate art directions. Same scenes, same lights, same cameras; only the image pipeline changes, so the comparison is fair.

**How they were made:** real-time 3D, not painted. Low-poly scenes (PS1-budget figures, 32-64 px procedural textures, no filtering) staged in three.js and rendered through a lo-fi pipeline like the game's own: tiny internal resolution, ordered dither, vertex snapping, fog, then upscaled with hard pixels. The UI is drawn at its own low resolution. Everything shown could run in the game's browser engine.

| | Direction | Pipeline |
|---|---|---|
| A | Peat & Sodium (PS1) | 320x180, 12 colour steps with hard dither, strong vertex wobble, no bloom |
| B | Lamplight (PS2) | 640x360, light dither, soft bloom round lights, film grain, warm grade |
| C | Haar (monochrome) | 480x270, black and white with heavier fog and grain; only blood red keeps its colour |

**Shots:** 1 the ferry crossing, 2 the vigil by the coffin, 3 the kirk service when the islanders turn (empty coffin, sword on the wall), 4 dialogue with Morag at the shop door (rowan, red thread, salt on the step), 5 a street fight at night (sword deflect, phone torch, the Unburied in oilskin and hi-vis), 6 reading Alan's notebook.

Files: `compare-all-directions.jpg`, `sheet-A.jpg`, `sheet-B.jpg`, `sheet-C.jpg`, and full 1920x1080 frames in `A-ps1/`, `B-ps2/`, `C-haar/`.

The frames are the original PNGs. The comparison sheets were saved as high-quality JPEGs to keep the repository small; `sheets.py` rebuilds them as PNGs from the frames.

**Re-rendering:** `tool/` holds the staging source. In a folder with `three@0.186.1` and `playwright` installed, run `node render.mjs ferry,vigil,kirk,dialogue,combat,note A,B,C out`, then `python3 sheets.py <dir>`. It's concept tooling, not game code.

Character names and dialogue (Morag Rendall, Kenny Flett, MV Selkie, the notebook text) are placeholders written for the shots.
