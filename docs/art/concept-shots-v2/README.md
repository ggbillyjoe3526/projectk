# Concept shots, round 2: Lamplight (B), gritty and realistic

William picked direction B, with a monochrome look for low health or Resolve, and asked for something grittier, more realistic and less blocky. These are the same six moments as round 1, rebuilt from scratch.

| File | What it is |
|---|---|
| `sheet-normal.jpg` | All six moments in the normal look |
| `sheet-low-resolve.jpg` | The same six frames at low Resolve |
| `combat-normal-vs-low-resolve.jpg` | Combat, normal and low Resolve side by side |
| `normal/*.jpg`, `low-resolve/*.jpg` | Full 1920x1080 frames |
| `tool/` | The renderer that made them (see below) |

The renders were PNGs of 1 to 4 MB each. They are kept here as high-quality JPEGs (about a tenth of the size) to keep the repository small.

**William's verdict (2026-10-10):** "Better but not quite there." It lost the PS1/PS2 look he wants, low resolution and dithering. The next round, when the project resumes, is this level of detail seen through direction B's lo-fi pipeline. See the [project record](../../project-record.md#art-direction).

## How they were made

They are still real-time 3D renders in three.js, not paintings. What changed from round 1:

- **Faces** are a photo-scanned human head (Lee Perry-Smith scan), with opened, modelled eyes and per-character changes to jaw, nose, brow and width. Everyone shares this one base head, so it is a stand-in for a proper set of character heads.
- **Bodies and clothes** are sculpted as smooth shapes (signed distance fields) and meshed at 5 to 8 mm detail: coats with folds, slits and collars, knitwear, scarves, caps, oilskins and boots. There are no boxes left.
- **Textures** are procedural PBR sets (colour, normal, roughness, metalness) at 512 to 1024 px: damp plaster with tide lines and flaking, harled render, worn floorboards, rusted ship paint, wet flagstones and tarmac, slate, tweed, knitwear, oilskin and coffin wood. A large-scale noise layer breaks up tiling.
- **Lighting** is image-based (HDR sky maps) plus soft shadowed lamps, candles and the phone torch, with ambient occlusion (GTAO), bloom, ACES tone mapping, a slight lens fringe, vignette and film grain.
- **Sea** is an animated water shader with reflections. The sky is a custom cloud dome.

## The low-Resolve look

It is a single post-process switch (`mono` in `tool/src/post.js`). The world drains to a cold haar grey, contrast goes up, the vignette closes in, and only strong reds keep their colour: blood, rowan berries and warning lights. Skin is excluded so faces don't flush red. In the game this would fade in with Resolve or health, not snap on.

## Known rough edges

- Every character uses the same scanned head. Women read as women at a distance, but close-ups need their own heads.
- Hair is a textured cap and still looks a little like a helmet from behind.
- Eyes on the turned congregation are only partly visible at this distance.
- Hands are simple. Fingers would need proper modelling.

## Credits

- Head scan: "Lee Perry-Smith" head by Infinite-Realities, CC BY 3.0. **Credit is required** if this is used in the game.
- HDR skies: Poly Haven, CC0 (via the three.js examples).
- Water normals: three.js examples (MIT).
- Everything else (models, textures, scenes, UI) was generated for this project.

## Re-rendering

From `tool/`:

```
npm install                          # three 0.186, playwright, fonts
python3 texgen.py                    # writes tex/ (about 50 MB); needs numpy, scipy, Pillow
python3 headprep.py                  # writes assets/head*.bin and head*.json from the scan (not committed: generated)
python3 sculpt.py                    # writes chars/ (about 85 MB); needs scikit-image too
node render.mjs ferry,vigil,kirk,dialogue,combat,note B,M out
python3 sheets.py . out
```

`render.mjs` expects Chromium at the Playwright path. `B` is the normal look and `M` is low Resolve. Each frame takes about a minute in software rendering; on a real GPU it runs in real time.
