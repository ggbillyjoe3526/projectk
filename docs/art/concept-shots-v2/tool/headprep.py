"""Prepares the scanned head (Lee Perry-Smith, Infinite-Realities, CC BY 3.0) for the characters.

- scales it to metres in the sculptor's head-joint frame (eyes line up with the sculpted sockets)
- cuts the bust off below the neck (coat collars hide the seam)
- subdivides around the eyes and opens the closed lids into almond apertures for eyeballs
- builds a hair cap shell over the scalp

Output: assets/head.bin + assets/head.json
"""
import json, struct, sys
import numpy as np

SRC = 'assets/lps/LeePerrySmith.glb'
S = 0.052
EYE_SCAN = np.array([0.64, 1.66, 1.6])
EYE_LOCAL = np.array([0.033, 0.097, 0.077])
T = EYE_LOCAL - EYE_SCAN * S


def load():
    b = open(SRC, 'rb').read()
    l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); off = 20 + l
    bl = struct.unpack('<I', b[off:off + 4])[0]; bin_ = b[off + 8:off + 8 + bl]

    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
        dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}[a['componentType']]
        return np.frombuffer(bin_, dt, a['count'] * n, bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, n).copy()
    return acc(1).astype(np.float64), acc(3).astype(np.float64), acc(0).reshape(-1, 3).astype(np.int64)


def subdivide(P, UV, F, mask_fn, times=2):
    for _ in range(times):
        sel = mask_fn(P[F].mean(1))
        edges = {}
        newP = list(P); newUV = list(UV)

        def mid(a, b):
            k = (min(a, b), max(a, b))
            if k not in edges:
                edges[k] = len(newP); newP.append((P[a] + P[b]) / 2); newUV.append((UV[a] + UV[b]) / 2)
            return edges[k]
        out = []
        for f, s in zip(F, sel):
            if not s: continue
            a, b, c = f; ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            out += [(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)]
        # neighbours of split faces get split along the shared edge (avoid T-junction cracks)
        for f, s in zip(F, sel):
            if s: continue
            a, b, c = f
            ms = [edges.get((min(x, y), max(x, y))) for x, y in ((a, b), (b, c), (c, a))]
            n = sum(m is not None for m in ms)
            if n == 0: out.append((a, b, c)); continue
            # fan from the centroid when any edge was split
            cen = len(newP); newP.append(P[f].mean(0)); newUV.append(UV[f].mean(0))
            ring = []
            for (x, y), m in zip(((a, b), (b, c), (c, a)), ms):
                ring.append(x)
                if m is not None: ring.append(m)
            for i in range(len(ring)):
                out.append((ring[i], ring[(i + 1) % len(ring)], cen))
        P = np.array(newP); UV = np.array(newUV); F = np.array(out)
    return P, UV, F


def normals(P, F):
    N = np.zeros_like(P)
    fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
    for k in range(3): np.add.at(N, F[:, k], fn)
    return N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)


def main(closed, out):
    P, UV, F = load()
    # keep the head and neck
    keep = P[F][:, :, 1].min(1) > -1.85
    F = F[keep]
    # eye regions, in scan units
    def near_eye(c, rx=0.42, ry=0.24):
        out = np.zeros(len(c), bool)
        for sx in (1, -1):
            e = EYE_SCAN * [sx, 1, 1]
            out |= (((c[:, 0] - e[0]) / rx) ** 2 + ((c[:, 1] - e[1]) / ry) ** 2 < 1) & (c[:, 2] > 1.2)
        return out
    P, UV, F = subdivide(P, UV, F, near_eye, 2)
    def scalp_zone(c):
        ym = c[:, 1] * S + T[1]; zm = c[:, 2] * S + T[2]
        return ym > 0.02 + 0.1 * np.clip((zm + 0.05) / 0.13, 0, 1) ** 1.2
    P, UV, F = subdivide(P, UV, F, scalp_zone, 1)
    # open the lids: push an almond inward so an eyeball behind shows through
    for sx in ((1, -1) if not closed else ()):
        e = EYE_SCAN * [sx, 1, 1]
        dx = (P[:, 0] - e[0]) / 0.28; dy = (P[:, 1] - e[1] - 0.012 * (1 - dx ** 2)) / 0.078
        # almond: narrower towards the corners, inner corner a little lower
        dy = dy / np.maximum(1 - 0.35 * dx ** 2, 0.2) + 0.12 * dx * sx
        r = np.sqrt(dx ** 2 + dy ** 2)
        front = P[:, 2] > 1.3
        w = np.clip((1.12 - r) / 0.25, 0, 1) ** 1.5 * front
        P[:, 2] -= w * 0.3
    # to metres, head-joint frame
    Pm = P * S + T
    # remove now-unused vertices
    used = np.unique(F); remap = -np.ones(len(Pm), np.int64); remap[used] = np.arange(len(used))
    Pm = Pm[used]; UV = UV[used]; F = remap[F]
    N = normals(Pm, F)
    # ---- hair cap over the scalp ----
    x, y, z = Pm[:, 0], Pm[:, 1], Pm[:, 2]
    hl = 0.035 + 0.105 * np.clip((z + 0.05) / 0.13, 0, 1) ** 1.2  # hairline height, low at the back, high at the brow
    temple = np.clip((np.abs(x) - 0.055) / 0.02, 0, 1) * np.clip((z - 0.02) / 0.04, 0, 1)
    hl += temple * 0.01
    rng = np.random.default_rng(3)
    ph = rng.random(6) * 6.28
    hl += (np.sin(x * 260 + ph[0]) * np.sin(z * 210 + ph[1]) + 0.5 * np.sin(x * 610 + ph[2]) * np.sin(y * 540 + ph[3])) * 0.004
    ear = (np.abs(x) > 0.066) & (y < 0.122) & (z > -0.04) & (z < 0.03)
    # sideburns run down in front of the ears
    burn = (np.abs(x) > 0.062) & (z > 0.026) & (z < 0.05) & (y > 0.07)
    hl = np.where(burn, np.minimum(hl, 0.075), hl)
    # coverage: 1 inside the hairline, fading over ~1 cm (alpha-hashed, reads as stray hairs)
    cov = np.clip((y - hl) / 0.01 + 0.5, 0, 1) * (~ear)
    cov = np.where(ear, 0, cov)
    hf = F[(cov[F] > 0).any(1)]
    hu = np.unique(hf); hm = -np.ones(len(Pm), np.int64); hm[hu] = np.arange(len(hu))
    q = Pm[hu]
    clump = (np.sin(q[:, 0] * 900 + ph[4]) * np.sin(q[:, 2] * 760 + ph[5]) * 0.6 + np.sin(q[:, 1] * 1300 + q[:, 0] * 400) * 0.4)
    thick = 0.0055 + clump * 0.0012
    HA = cov[hu]
    HP = q + N[hu] * (thick * (0.25 + 0.75 * HA))[:, None]
    HF = hm[hf]
    # strands run back over the crown and down the sides
    HUV = np.stack([q[:, 0] / 0.3 * 4, (q[:, 2] * 0.8 - q[:, 1] * 0.6) / 0.3 * 4], 1)
    eyes = [(EYE_LOCAL * [sx, 1, 1] + [0, 0, -0.0035]).tolist() for sx in (1, -1)]
    blobs = [Pm.astype(np.float32), UV.astype(np.float32), F.astype(np.uint32), HP.astype(np.float32), HUV.astype(np.float32), HF.astype(np.uint32), HA.astype(np.float32)]
    offs = []; o = 0
    with open(f'assets/{out}.bin', 'wb') as fh:
        for b in blobs: offs.append(o); fh.write(b.tobytes()); o += b.nbytes
    json.dump({'verts': len(Pm), 'tris': len(F), 'hverts': len(HP), 'htris': len(HF), 'offsets': offs, 'eyes': eyes, 'eyeR': 0.0125}, open(f'assets/{out}.json', 'w'))
    print('head', len(Pm), 'verts', len(F), 'tris; hair', len(HP), len(HF))


main(False, 'head')
main(True, 'head_closed')
