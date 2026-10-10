import { type BufferGeometry, BoxGeometry, type Material, Mesh, type Object3D } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Everything that never moves or changes, merged into one mesh per material (and per whether it casts shadows), so the
 * whole static scene costs a handful of draw calls however many walls, gravestones and cups on a dresser the level has.
 * Geometry put in must all have the same attributes per material (BoxGeometry, or any geometry with position, normal and uv).
 */
export class StaticBatch {
  private readonly groups = new Map<Material, { cast: BufferGeometry[]; still: BufferGeometry[] }>();

  /** Add geometry, moved by (x, y, z); it belongs to the batch from now on. */
  put(geometry: BufferGeometry, material: Material, x: number, y: number, z: number, cast: boolean): void {
    geometry.translate(x, y, z);
    this.add(geometry, material, cast);
  }

  /** Add geometry already in place (world coordinates); it belongs to the batch from now on. */
  add(geometry: BufferGeometry, material: Material, cast: boolean): void {
    // Merged geometry must agree on its attributes: drop any that only some carry.
    if (geometry.index) geometry = geometry.toNonIndexed();
    let group = this.groups.get(material);
    if (!group) this.groups.set(material, (group = { cast: [], still: [] }));
    (cast ? group.cast : group.still).push(geometry);
  }

  block(minX: number, maxX: number, bottom: number, top: number, minZ: number, maxZ: number, material: Material, cast = false): void {
    this.put(new BoxGeometry(maxX - minX, top - bottom, maxZ - minZ), material, (minX + maxX) / 2, (bottom + top) / 2, (minZ + maxZ) / 2, cast);
  }

  addTo(parent: Object3D): void {
    for (const [material, group] of this.groups) {
      for (const [geometries, cast] of [[group.cast, true], [group.still, false]] as const) {
        if (geometries.length === 0) continue;
        const merged = mergeGeometries(geometries);
        for (const g of geometries) g.dispose();
        const mesh = new Mesh(merged, material);
        mesh.castShadow = cast;
        mesh.receiveShadow = true;
        parent.add(mesh);
      }
    }
    this.groups.clear();
  }
}
