import { character, personMats, pbr, plain } from './lib.js';

const GLOW = '#cfe4ff'; // the Unburied: eyes gone pale and lit from inside

/** Materials and head for each sculpted character. */
export async function person(id, M, o = {}) {
  const hairCol = (c) => pbr('hair', { color: c });
  const base = id.startsWith('w_') ? 'william' : id.startsWith('cong') ? 'cong' : id;
  const P = await personMats({ skin: '#e6c0ac' });
  let mats, head;
  const turned = { pale: '#b4b9b4', glow: GLOW };
  switch (base) {
    case 'william':
      mats = { ...P, coat: M.wool_charcoal, shirt: M.shirt, tie: M.wool_black, trousers: M.trouser_dark, shoes: M.leather };
      head = { hair: await hairCol('#2e241c'), skin: '#f4dcd0', warp: { width: 0.98, jaw: 0.95 } };
      break;
    case 'morag':
      mats = { ...P, coat: M.wool_brown, knit_cream: M.knit_cream, scarf: M.scarf_plum, trousers: M.wool_black, shoes: M.leather };
      head = { skin: '#f2d6cc', warp: { width: 0.93, jaw: 0.86, nose: 0.85, brow: 0.5, chin: 0.85 }, look: [-0.25, 0.05, 1] };
      break;
    case 'listener':
      mats = { ...P, coat: M.tweed, knit_cream: M.knit_cream, hat: M.tweed, trousers: M.denim, shoes: M.leather };
      head = { hair: await hairCol('#6a645c'), skin: '#e8c8b8', warp: { width: 1.04, jaw: 1.08 } };
      break;
    case 'crew':
      mats = { ...P, coat: M.wool_navy, wool_navy: M.wool_navy, hivis: M.hivis, hair: await hairCol('#5a3a28'), trousers: M.trouser_dark, shoes: M.leather };
      head = { hair: mats.hair, skin: '#f0d4c6', warp: { width: 0.92, jaw: 0.85, nose: 0.85, brow: 0.5, chin: 0.85 }, hairVol: 1.04, look: [0.3, 0, 1] };
      break;
    case 'fisher':
      mats = { ...P, coat: M.oilskin_yellow, knit_cream: M.knit_cream, hat: M.oilskin_yellow, oilskin: M.oilskin_yellow, shoes: M.leather, skin: P.skin };
      head = { ...turned, warp: { width: 1.06, jaw: 1.12 } };
      break;
    case 'hivis':
      mats = { ...P, knit_cream: M.wool_navy, hivis: M.hivis, trousers: M.denim, shoes: M.leather };
      head = { ...turned, warp: { width: 1.05, jaw: 1.1, len: 1.03 } };
      break;
    case 'kneel':
      mats = { ...P, coat: M.wool_charcoal, shirt: M.shirt, trousers: M.trouser_dark, shoes: M.leather, hair: await hairCol('#4a3a2e') };
      head = { ...turned, hair: mats.hair, warp: { width: 0.93, jaw: 0.88, nose: 0.9 } };
      break;
    case 'watcher':
      mats = { ...P, coat: M.wool_black, shirt: M.shirt, trousers: M.wool_black, shoes: M.leather, hair: await hairCol('#141210') };
      head = { ...turned, hair: mats.hair, warp: { width: 0.92, jaw: 0.85, nose: 0.85, brow: 0.5 } };
      break;
    case 'minister':
      mats = { ...P, coat: M.wool_black, wool_black: M.wool_black, collar: plain('#f2f0ea', { rough: 0.4 }), trousers: M.wool_black, shoes: M.leather };
      head = { ...turned, warp: { width: 0.97, len: 1.04 } };
      break;
    case 'reach':
      mats = { ...P, coat: M.tweed, wool_black: M.wool_black, trousers: M.trouser_dark, shoes: M.leather };
      head = { ...turned, hair: await hairCol('#8a847c'), warp: { width: 1.02, jaw: 1.04 } };
      break;
    case 'alan':
      mats = { ...P, shirt: M.shirt, linen: M.linen, trousers: M.trouser_dark, shoes: M.leather };
      head = { closed: true, eyes: false, skin: '#d4d2cc', hair: await hairCol('#a8a49c'), warp: { width: 1.0, len: 1.02 }, rough: 0.7 };
      break;
    case 'cong': {
      const i = +id.slice(4);
      const coats = [M.wool_brown, M.wool_charcoal, M.tweed, M.wool_navy, M.wool_black, M.wool_charcoal];
      const hairs = ['#9a948c', '#3a3028', '#5a5048', '#1a1814', '#2a2420', '#6a5a4a'];
      const hm = await hairCol(hairs[i]);
      mats = { ...P, coat: coats[i], shirt: M.shirt, knit_cream: M.knit_cream, tie: M.wool_black, scarf: [M.scarf_plum, M.wool_navy][i % 2], hat: M.tweed, hair: hm, trousers: M.trouser_dark, shoes: M.leather };
      const fem = [0, 4].includes(i);
      head = { ...turned, hair: [2].includes(i) ? null : hm, warp: fem ? { width: 0.92, jaw: 0.85, nose: 0.85, brow: 0.5 } : { width: 0.98 + i * 0.02, jaw: 0.95 + i * 0.04 } };
      if (i === 0) head.hair = null;
      break;
    }
    default: throw new Error('no person ' + id);
  }
  // the head is sculpted into the body mesh, so its look comes through the materials
  const h = { ...head, ...(o.head || {}) };
  if (h.pale) { mats.skin = mats.skin.clone(); mats.skin.color.set(h.pale); }
  if (h.hair) mats.hair = h.hair;
  if (h.glow) { const g = await personMats({ glow: h.glow }); mats.eyes = g.eyes; mats.iris = g.iris; }
  return character(id, mats, { head: h, pos: o.pos, rotY: o.rotY });
}
