import { AdditiveBlending, BoxGeometry, DoubleSide, Mesh, MeshBasicNodeMaterial, RingGeometry, type Scene, Vector3 } from 'three/webgpu';

/**
 * Steel meeting a blow, drawn where the blades meet: on a perfect deflect a spray of bright sparks and a ring of light
 * thrown out flat; on a guard a few dull ones. Sized to read at the game's low resolution, where a point light alone
 * was lost (William's M1 playtest: "I can't really tell if it's working").
 */

const POOL = 48;
const GRAVITY = 9;

interface Spark {
  mesh: Mesh;
  vel: Vector3;
  life: number;
  maxLife: number;
}

export type ClashKind = 'perfect' | 'guard';

export class ClashSparks {
  private readonly sparks: Spark[] = [];
  private readonly ring: Mesh;
  private readonly ringMat: MeshBasicNodeMaterial;
  private ringLife = 0;
  private next = 0;
  private readonly hot = new MeshBasicNodeMaterial({ color: 0xfff1c8, blending: AdditiveBlending, depthWrite: false, transparent: true });
  private readonly dull = new MeshBasicNodeMaterial({ color: 0xc27a3c, blending: AdditiveBlending, depthWrite: false, transparent: true });
  private readonly look = new Vector3();

  constructor(scene: Scene) {
    const streak = new BoxGeometry(0.035, 0.035, 0.22);
    for (let i = 0; i < POOL; i++) {
      const mesh = new Mesh(streak, this.hot);
      mesh.visible = false;
      mesh.frustumCulled = false;
      scene.add(mesh);
      this.sparks.push({ mesh, vel: new Vector3(), life: 0, maxLife: 1 });
    }
    this.ringMat = new MeshBasicNodeMaterial({ color: 0xfff6e0, blending: AdditiveBlending, depthWrite: false, transparent: true, side: DoubleSide });
    this.ring = new Mesh(new RingGeometry(0.55, 0.75, 24), this.ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    scene.add(this.ring);
  }

  /** Throw sparks out from `at`, mostly away from the player along `dirX, dirZ` (toward the enemy). */
  burst(kind: ClashKind, at: Vector3, dirX: number, dirZ: number): void {
    const perfect = kind === 'perfect';
    const count = perfect ? 22 : 7;
    const speed = perfect ? 6.5 : 3.2;
    for (let n = 0; n < count; n++) {
      const s = this.sparks[this.next]!;
      this.next = (this.next + 1) % POOL;
      // A fan across the clash, thrown sideways and up more than forward.
      const side = (Math.random() * 2 - 1) * 1.6;
      const fx = dirX * Math.cos(side) - dirZ * Math.sin(side);
      const fz = dirZ * Math.cos(side) + dirX * Math.sin(side);
      const v = speed * (0.45 + Math.random() * 0.75);
      s.vel.set(fx * v, (0.4 + Math.random() * 1.1) * v * 0.6, fz * v);
      s.mesh.position.copy(at);
      s.mesh.material = perfect ? this.hot : this.dull;
      s.maxLife = s.life = (perfect ? 0.32 : 0.2) * (0.6 + Math.random() * 0.6);
      s.mesh.visible = true;
    }
    if (perfect) {
      this.ring.position.set(at.x, at.y - 0.25, at.z);
      this.ringLife = 1;
      this.ring.visible = true;
    }
  }

  update(dt: number): void {
    for (const s of this.sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.mesh.visible = false;
        continue;
      }
      s.vel.y -= GRAVITY * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.lookAt(this.look.copy(s.mesh.position).add(s.vel));
      const k = s.life / s.maxLife;
      s.mesh.scale.set(k, k, 0.4 + k);
    }
    if (this.ringLife > 0) {
      this.ringLife = Math.max(0, this.ringLife - dt * 5);
      const grow = 1 - this.ringLife;
      this.ring.scale.setScalar(0.4 + grow * 1.6);
      this.ringMat.opacity = this.ringLife * 0.9;
      this.ring.visible = this.ringLife > 0;
    }
  }
}
