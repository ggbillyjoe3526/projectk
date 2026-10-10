import {
  BoxGeometry, DataTexture, LinearMipmapNearestFilter, type Material, MeshStandardNodeMaterial, NearestFilter, NoColorSpace, RepeatWrapping,
  RGBAFormat, SRGBColorSpace, Vector2,
} from 'three/webgpu';
import { texture, uv } from 'three/tsl';
import { applyPs1Snap } from '../retro/ps1Snap';
import { boards, flagstones, plaster, rubble, rug, type SurfaceTexels, slates } from './procedural';

/**
 * The textured materials of the round 3 look, from the procedural textures: PS2-style sampling (hard texels close up,
 * mip levels that switch without blending, no anisotropic filtering), PBR shading with the generated normal and
 * roughness, and the PS1 vertex snap like everything else. `tile` is how many metres one repeat of the texture covers,
 * for geometry given world-scaled UVs (tiledBox).
 */

export type SurfaceName = 'flagstones' | 'plaster' | 'harl' | 'boards' | 'darkBoards' | 'rubble' | 'slates' | 'rug';

const MAKERS: Readonly<Record<SurfaceName, { make: () => SurfaceTexels; tile: number; color?: number; normalScale?: number }>> = {
  flagstones: { make: () => flagstones(256, 3), tile: 2.4, normalScale: 1 },
  plaster: { make: () => plaster(128, 7), tile: 2.0, normalScale: 0.6 },
  // The outside: the same lime, brighter, the cottage whitewashed against the weather.
  harl: { make: () => plaster(128, 8), tile: 2.5, color: 0xe8e4da, normalScale: 0.8 },
  boards: { make: () => boards(128, 5), tile: 1.2, normalScale: 0.7 },
  darkBoards: { make: () => boards(128, 6, 6, 0x3e2c20, 0x1e140e), tile: 1.0, normalScale: 0.7 },
  rubble: { make: () => rubble(128, 9), tile: 1.6, normalScale: 1 },
  slates: { make: () => slates(128, 2), tile: 1.6, normalScale: 1 },
  rug: { make: () => rug(128, 4), tile: 2.4, normalScale: 0.5 },
};

function dataTexture(data: Uint8Array, size: number, srgb: boolean): DataTexture {
  const t = new DataTexture(data, size, size, RGBAFormat);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = NearestFilter;
  t.minFilter = LinearMipmapNearestFilter;
  t.generateMipmaps = true;
  t.anisotropy = 1;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.needsUpdate = true;
  return t;
}

const cache = new Map<SurfaceName, MeshStandardNodeMaterial>();

/** The material for a surface, made once and shared. */
export function surface(name: SurfaceName): MeshStandardNodeMaterial {
  let m = cache.get(name);
  if (m) return m;
  const spec = MAKERS[name];
  const texels = spec.make();
  const map = dataTexture(texels.albedo, texels.size, true);
  const normalRough = dataTexture(texels.normal, texels.size, false);
  m = new MeshStandardNodeMaterial({ map, normalMap: normalRough, color: spec.color ?? 0xffffff, metalness: 0 });
  m.normalScale = new Vector2(spec.normalScale ?? 1, spec.normalScale ?? 1);
  // Roughness rides in the normal map's alpha.
  m.roughnessNode = texture(normalRough, uv()).a;
  m.userData.tile = spec.tile;
  applyPs1Snap(m);
  cache.set(name, m);
  return m;
}

/** Metres one repeat of the material's texture covers (1 for an untextured material). */
export function tileOf(material: Material): number {
  return (material.userData.tile as number | undefined) ?? 1;
}

/**
 * A box whose UVs are in world metres divided by `tile`, so a texture keeps its scale whatever the box's size. Faces in
 * BoxGeometry's order: +x, -x, +y, -y, +z, -z, four vertices each.
 */
export function tiledBox(w: number, h: number, d: number, tile: number): BoxGeometry {
  const g = new BoxGeometry(w, h, d);
  const uvs = g.attributes.uv!;
  const spans: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    const [su, sv] = spans[face]!;
    for (let i = face * 4; i < face * 4 + 4; i++) uvs.setXY(i, (uvs.getX(i) * su) / tile, (uvs.getY(i) * sv) / tile);
  }
  uvs.needsUpdate = true;
  return g;
}
