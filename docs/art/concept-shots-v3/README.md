# Concept shots, round 3: round 2's detail through B's lo-fi look

William liked round 2's detail but missed the PS1/PS2 feel of direction B. He also asked for anything that might be licensed to come out. This round merges the two in two shots:

| File | What it is |
|---|---|
| `dialogue.png` | Morag at the shop door, dusk |
| `combat.png` | The street that night, sword and torch |
| `tool/` | The renderer that made them |

## The look

The scenes, sculpted characters and procedural textures are round 2's. The image pipeline is direction B's:

- **640x360 internal resolution** with no anti-aliasing, blown up 3x with hard pixels.
- **Ordered 4x4 Bayer dither** into 32 levels per channel, so gradients in the sky, the lamplight and the fog break into a visible dither pattern.
- **Vertex snapping** to a 480x270 grid, the slight PS1/PS2 wobble on edges.
- **PS2-style texture sampling**: hard texels close up, mip levels that switch without blending, no anisotropic filtering.
- Round 2's lighting stays: soft shadowed lamps, ambient occlusion, bloom, filmic tone mapping and grain, all rendered at the low resolution.
- The UI is drawn at 960x540 and scaled 2x with hard pixels, as in round 1.

The low-Resolve grade (`mono` in `tool/src/post.js`) still works on top: render with `M` instead of `B`.

## Nothing licensed

Everything in the shots and the tool is made for this project:

- **Faces** are sculpted from shapes (skull, jaw, cheekbones, brow, nose, lips, ears, lids) with per-character width, jaw, nose and brow, and painted with vertex colour (lips, flush, brows, stubble). The photo-scanned head from round 2 is gone.
- **Skies and image lighting** are procedural gradients matched to the brightness of the photographed skies used before. The HDR files are gone.
- **Sea ripples** come from a generated normal map (`texgen.py water`) instead of the three.js sample texture.
- The tool still uses three.js (MIT) and the UI fonts VT323, Silkscreen and Caveat from npm (SIL Open Font License). Both licences allow use in a commercial game.

## Re-rendering

From `tool/`:

```
npm install                          # three 0.186, playwright, fonts
python3 texgen.py                    # writes tex/; needs numpy, scipy, Pillow
python3 sculpt.py                    # writes chars/; needs scikit-image too
node render.mjs dialogue,combat B out
```

The other round 2 scenes (`ferry`, `vigil`, `kirk`, `note`) also render with this tool, in the new look.
