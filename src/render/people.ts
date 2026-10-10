import { BoxGeometry, CapsuleGeometry, Group, Mesh, MeshLambertNodeMaterial, type Scene } from 'three/webgpu';
import type { Look, Person } from '../content/crossing/people';
import { applyPs1Snap } from './retro/ps1Snap';

/**
 * The islanders as greybox figures (chapter 1): a body in their coat, legs, a head, and the one detail that tells
 * them apart at a distance (a hi-vis stripe, a dog collar, an apron, a headscarf). They turn to face the player as
 * they come near, and back again as they go. A kneeling one stays down, palm on the ground, until spoken to.
 */

function lambert(color: number): MeshLambertNodeMaterial {
  return applyPs1Snap(new MeshLambertNodeMaterial({ color })) as MeshLambertNodeMaterial;
}

function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), lambert(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** How near the player comes before someone turns to them, and how fast they turn (radians a second). */
const NOTICE_RANGE = 4.5;
const TURN_SPEED = 3;

interface Figure {
  readonly person: Person;
  readonly root: Group;
  readonly body: Group;
  readonly hand: Mesh;
  facing: number;
}

function figure(person: Person): Figure {
  const look: Look = person.look;
  const s = look.height;
  const root = new Group();
  const body = new Group();
  root.add(body);
  const coat = new Mesh(new CapsuleGeometry(0.25 * s, 0.62 * s, 4, 8), lambert(look.coat));
  coat.position.y = 1.02 * s;
  coat.castShadow = true;
  body.add(coat);
  for (const x of [-0.1, 0.1]) body.add(box(0.14 * s, 0.62 * s, 0.16 * s, look.legs, x * s, 0.31 * s, 0));
  body.add(box(0.24 * s, 0.27 * s, 0.24 * s, look.skin, 0, 1.6 * s, 0));
  if (look.detail !== undefined) {
    const id = person.id;
    if (id === 'magnus') {
      // Hi-vis bands round the jacket.
      for (const y of [0.92, 1.18]) body.add(box(0.53 * s, 0.05, 0.53 * s, look.detail, 0, y * s, 0));
    } else if (id === 'ruth') {
      body.add(box(0.08, 0.05, 0.03, look.detail, 0, 1.43 * s, 0.24 * s));
    } else if (id === 'morag') {
      body.add(box(0.28 * s, 0.14 * s, 0.28 * s, look.detail, 0, 1.69 * s, -0.01));
    } else {
      // An apron, or a white shirt under a waistcoat.
      body.add(box(0.36 * s, 0.5 * s, 0.04, look.detail, 0, 0.98 * s, 0.24 * s));
    }
  }
  const hand = box(0.08, 0.08, 0.12, look.skin, 0.28 * s, 0.85 * s, 0.05);
  body.add(hand);
  root.position.set(person.x, 0, person.z);
  root.rotation.y = person.facing;
  return { person, root, body, hand, facing: person.facing };
}

export class PeopleFigures {
  private readonly figures: Figure[];
  private readonly at = { x: 0, z: 0 };

  constructor(scene: Scene, people: readonly Person[], groundAt: (x: number, z: number) => number) {
    this.figures = people.map(figure);
    for (const f of this.figures) {
      f.root.position.y = groundAt(f.person.x, f.person.z);
      scene.add(f.root);
    }
  }

  /**
   * Per frame: who's kneeling (`kneels(id)`), who's turned to the player (near, or the one they're talking to), a
   * visibility test (`shown(id)`) for people only there part of the chapter, and where each is drawn (`place`: writes
   * the drawn position into `out` and returns a turn to add, for someone aboard the moving ferry).
   */
  update(
    px: number,
    pz: number,
    dt: number,
    talkingTo: string | null,
    kneels: (id: string) => boolean,
    shown: (id: string) => boolean,
    place: (p: Person, out: { x: number; z: number }) => number,
  ): void {
    for (const f of this.figures) {
      const p = f.person;
      f.root.visible = shown(p.id);
      if (!f.root.visible) continue;
      const kneeling = kneels(p.id);
      const near = Math.hypot(px - p.x, pz - p.z) < NOTICE_RANGE;
      const want = (talkingTo === p.id || (near && !kneeling)) ? Math.atan2(px - p.x, pz - p.z) : p.facing;
      const by = Math.atan2(Math.sin(want - f.facing), Math.cos(want - f.facing));
      const most = TURN_SPEED * dt;
      f.facing += Math.max(-most, Math.min(most, by));
      const turn = place(p, this.at);
      f.root.position.x = this.at.x;
      f.root.position.z = this.at.z;
      f.root.rotation.y = f.facing + turn;
      // Kneeling: down on one knee, leaning over a palm flat on the ground.
      f.body.position.y = kneeling ? -0.5 * p.look.height : 0;
      f.body.rotation.x = kneeling ? 0.55 : 0;
      if (kneeling) f.hand.position.set(0.12, 0.62 * p.look.height, 0.55);
      else f.hand.position.set(0.28 * p.look.height, 0.85 * p.look.height, 0.05);
    }
  }
}
