"""Sculpts posed, clothed characters as signed distance fields and meshes them with marching cubes.

Each character is one smooth, organic surface (no boxes): tapered limbs, sculpted faces with sockets,
noses, lips and ears, coats with collars, lapels and creases, and per-vertex ambient occlusion
baked from the field. Output: chars/<id>.bin + chars/<id>.json (material groups, joint transforms).

Usage: python3 sculpt.py chars [id,id,...]
"""
import json, os, sys, math
import numpy as np
from scipy.ndimage import map_coordinates
from skimage.measure import marching_cubes

OUT = sys.argv[1] if len(sys.argv) > 1 else 'chars'
os.makedirs(OUT, exist_ok=True)


# ---------------- maths ----------------
def rot(x=0, y=0, z=0):
    cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz  # three.js 'YXZ'


def length(v):
    return np.sqrt(np.sum(v * v, -1))


def smin(a, b, k):
    if k <= 0: return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def ssub(d, cut, k):
    """Smoothly subtract `cut` from `d`."""
    h = np.clip(0.5 - 0.5 * (d + cut) / k, 0, 1)
    return d + (-cut - d) * h + k * h * (1 - h)


def sd_round_cone(P, a, b, r1, r2):
    ba = b - a; l2 = ba @ ba; rr = r1 - r2; a2 = l2 - rr * rr; il2 = 1.0 / l2
    pa = P - a; y = pa @ ba; z = y - l2
    q = pa * l2 - np.outer(y, ba)
    x2 = np.sum(q * q, -1); y2 = y * y * l2; z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
    d1 = np.sqrt(x2 + z2) * il2 - r2
    d2 = np.sqrt(x2 + y2) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d1, np.where(np.sign(y) * a2 * y2 < k, d2, d3))


def sd_ellipsoid(P, c, R, r):
    q = (P - c) @ R  # into the local frame
    r = np.asarray(r, float)
    k0 = length(q / r); k1 = length(q / (r * r))
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_torus(P, c, R, R0, r0):
    q = (P - c) @ R
    qx = np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2) - R0
    return np.sqrt(qx * qx + q[:, 1] ** 2) - r0


_noise_grid = np.random.default_rng(7).random((48, 48, 48))
def noise3(P, freq):
    q = (P * freq) % 48
    return map_coordinates(_noise_grid, q.T, order=1, mode='grid-wrap')


def fbm3(P, freq):
    return noise3(P, freq) * 0.6 + noise3(P, freq * 2.03) * 0.3 + noise3(P, freq * 4.1) * 0.1


# ---------------- skeleton ----------------
# joint: parent, offset in parent's frame (character facing +z, y up, metres, before scale)
SKELETON = {
    'hips': (None, (0, 0.95, 0)),
    'spine': ('hips', (0, 0.1, 0)),
    'chest': ('spine', (0, 0.17, 0)),
    'neck': ('chest', (0, 0.225, -0.01)),
    'head': ('neck', (0, 0.085, 0.01)),
    'lSh': ('chest', (0.17, 0.185, -0.015)), 'rSh': ('chest', (-0.17, 0.185, -0.015)),
    'lEl': ('lSh', (0, -0.29, 0)), 'rEl': ('rSh', (0, -0.29, 0)),
    'lHand': ('lEl', (0, -0.26, 0)), 'rHand': ('rEl', (0, -0.26, 0)),
    'lHip': ('hips', (0.095, -0.05, 0)), 'rHip': ('hips', (-0.095, -0.05, 0)),
    'lKnee': ('lHip', (0, -0.44, 0)), 'rKnee': ('rHip', (0, -0.44, 0)),
    'lFoot': ('lKnee', (0, -0.43, 0)), 'rFoot': ('rKnee', (0, -0.43, 0)),
}
ORDER = ['hips', 'spine', 'chest', 'neck', 'head', 'lSh', 'rSh', 'lEl', 'rEl', 'lHand', 'rHand', 'lHip', 'rHip', 'lKnee', 'rKnee', 'lFoot', 'rFoot']


def fk(pose, scale, build, hipsY=None):
    J = {}
    for name in ORDER:
        parent, off = SKELETON[name]
        off = np.array(off, float)
        if name in ('lSh', 'rSh'): off[0] *= build
        if name in ('lHip', 'rHip'): off[0] *= (0.85 + 0.15 * build)
        off *= scale
        R_local = rot(*pose.get(name, (0, 0, 0)))
        if parent is None:
            pos = off.copy()
            if hipsY is not None: pos[1] = hipsY
            Rw = R_local
        else:
            pp, pR = J[parent]
            pos = pp + pR @ off
            Rw = pR @ R_local
        J[name] = (pos, Rw)
    return J


# ---------------- character field ----------------
class Field:
    def __init__(self, spec):
        self.s = spec
        sc = spec.get('scale', 1.0); self.sc = sc
        self.b = spec.get('build', 1.0)
        self.J = fk(spec.get('pose', {}), sc, self.b, spec.get('hipsY'))

    def P(self, name, local=(0, 0, 0)):
        p, R = self.J[name]
        return p + R @ (np.array(local, float) * self.sc)

    def R(self, name):
        return self.J[name][1]

    def parts(self, X):
        """Return list of (matKey, distance) and the combined field."""
        s, sc, b = self.s, self.sc, self.b
        P, R = self.P, self.R
        out = []
        coat = s.get('coat', 'long')
        # --- torso (worn layer underneath: shirt / jumper) ---
        top = s.get('top', 'shirt')
        chest = sd_ellipsoid(X, P('chest', (0, 0.07, 0.008)), R('chest'), np.array([0.152 * b, 0.13, 0.098]) * sc)
        ribs = sd_ellipsoid(X, P('chest', (0, -0.01, 0.0)), R('chest'), np.array([0.145 * b, 0.13, 0.095]) * sc)
        nb = P('chest', (0, 0.205, -0.012))
        traps = np.minimum(sd_round_cone(X, nb, P('lSh', (-0.02, 0.0, 0)), 0.048 * sc, 0.036 * sc),
                           sd_round_cone(X, nb, P('rSh', (0.02, 0.0, 0)), 0.048 * sc, 0.036 * sc))
        delts = np.minimum(sd_ellipsoid(X, P('lSh', (0.0, -0.045, 0)), R('lSh'), np.array([0.044, 0.062, 0.05]) * sc * b ** 0.5),
                           sd_ellipsoid(X, P('rSh', (0.0, -0.045, 0)), R('rSh'), np.array([0.044, 0.062, 0.05]) * sc * b ** 0.5))
        traps = smin(traps, delts, 0.03 * sc)
        abdo = sd_ellipsoid(X, P('spine', (0, 0.04, 0.008)), R('spine'), np.array([0.145 * b, 0.13, 0.1]) * sc * s.get('belly', 1.0))
        pelvis = sd_ellipsoid(X, P('hips', (0, -0.02, 0)), R('hips'), np.array([0.16 * (0.85 + 0.15 * b), 0.12, 0.11]) * sc)
        torso = smin(smin(smin(chest, ribs, 0.04 * sc), traps, 0.05 * sc), abdo, 0.05 * sc)
        out.append((top, torso))
        # --- neck and head ---
        neck = sd_round_cone(X, P('neck', (0, -0.04, 0)), P('head', (0, 0.0, -0.005)), 0.054 * sc, 0.043 * sc)
        H = 'head'; Rh = R(H)
        if s.get('scan', True):
            # the photo-scanned head is attached at runtime; only the neck stump is sculpted
            out.append(('skin', neck))
        else:
            H = 'head'; Rh = R(H)
            cran = sd_ellipsoid(X, P(H, (0, 0.105, -0.012)), Rh, np.array([0.079, 0.098, 0.098]) * sc)
            jaw = sd_ellipsoid(X, P(H, (0, 0.035, 0.028)), Rh, np.array([0.062, 0.07, 0.068]) * sc * np.array([s.get('jaw', 1.0), 1, 1]))
            chin = sd_ellipsoid(X, P(H, (0, -0.012, 0.072)), Rh, np.array([0.024, 0.02, 0.02]) * sc)
            cheeks = np.minimum(sd_ellipsoid(X, P(H, (0.046, 0.075, 0.062)), Rh, np.array([0.024, 0.02, 0.022]) * sc),
                                sd_ellipsoid(X, P(H, (-0.046, 0.075, 0.062)), Rh, np.array([0.024, 0.02, 0.022]) * sc))
            brow = sd_round_cone(X, P(H, (-0.045, 0.118, 0.077)), P(H, (0.045, 0.118, 0.077)), 0.013 * sc, 0.013 * sc)
            nose = sd_round_cone(X, P(H, (0, 0.108, 0.088)), P(H, (0, 0.066, 0.106)), 0.008 * sc, 0.0145 * s.get('nose', 1.0) * sc)
            nostr = np.minimum(sd_ellipsoid(X, P(H, (0.012, 0.064, 0.096)), Rh, np.array([0.01, 0.008, 0.01]) * sc),
                               sd_ellipsoid(X, P(H, (-0.012, 0.064, 0.096)), Rh, np.array([0.01, 0.008, 0.01]) * sc))
            lips = sd_round_cone(X, P(H, (-0.021, 0.04, 0.09)), P(H, (0.021, 0.04, 0.09)), 0.0075 * sc, 0.0075 * sc)
            ears = np.minimum(sd_ellipsoid(X, P(H, (0.08, 0.085, 0.0)), Rh, np.array([0.011, 0.03, 0.02]) * sc),
                              sd_ellipsoid(X, P(H, (-0.08, 0.085, 0.0)), Rh, np.array([0.011, 0.03, 0.02]) * sc))
            head = smin(cran, jaw, 0.03 * sc)
            head = smin(head, chin, 0.015 * sc); head = smin(head, cheeks, 0.02 * sc); head = smin(head, brow, 0.012 * sc)
            head = smin(head, nose, 0.01 * sc); head = smin(head, nostr, 0.006 * sc); head = smin(head, lips, 0.008 * sc)
            head = smin(head, ears, 0.006 * sc)
            sockets = np.minimum(sd_ellipsoid(X, P(H, (0.033, 0.097, 0.086)), Rh, np.array([0.018, 0.011, 0.012]) * sc),
                                 sd_ellipsoid(X, P(H, (-0.033, 0.097, 0.086)), Rh, np.array([0.018, 0.011, 0.012]) * sc))
            head = ssub(head, sockets, 0.008 * sc)
            mouth = sd_round_cone(X, P(H, (-0.018, 0.034, 0.098)), P(H, (0.018, 0.034, 0.098)), 0.002 * sc, 0.002 * sc)
            head = ssub(head, mouth, 0.003 * sc)
            head = smin(head, neck, 0.025 * sc)
            out.append(('skin', head))
            e0, e1 = P(H, (0.033, 0.097, 0.077)), P(H, (-0.033, 0.097, 0.077))
            eyes = np.minimum(length(X - e0) - 0.0118 * sc, length(X - e1) - 0.0118 * sc)
            out.append(('eyes', eyes))
            look = Rh @ np.array(s.get('look', (0, 0, 1.0))); look = look / np.linalg.norm(look)
            iris = np.minimum(length(X - (e0 + look * 0.0092 * sc)) - 0.0052 * sc, length(X - (e1 + look * 0.0092 * sc)) - 0.0052 * sc)
            out.append(('iris', iris))
            # eyelids: thin shells over the top of each eye
            lids = np.minimum(np.maximum(length(X - e0) - 0.0135 * sc, -((X - e0) @ Rh)[:, 1] + 0.0035 * sc),
                              np.maximum(length(X - e1) - 0.0135 * sc, -((X - e1) @ Rh)[:, 1] + 0.0035 * sc))
            out.append(('skin', lids))
        # --- hair / headwear ---
        hs = s.get('hair', 'short')
        if hs == 'long':
            Rh = R(H)
            drape = sd_ellipsoid(X, P(H, (0, 0.03, -0.065)), Rh, np.array([0.09, 0.14, 0.05]) * sc)
            drape -= (fbm3(X, 120) - 0.5) * 0.008 * sc
            out.append(('hair', drape))
        if hs in ('short', 'long', 'bald', 'swept') and not s.get('scan', True):
            cap = sd_ellipsoid(X, P(H, (0, 0.118, -0.016)), Rh, np.array([0.087, 0.098, 0.106]) * sc)
            q = (X - P(H)) @ Rh / sc
            hairline = np.maximum(0.085 - q[:, 1] + np.maximum(q[:, 2], 0) * 0.0, q[:, 2] - 0.06 - (q[:, 1] - 0.12) * 0.9)
            if hs == 'bald':
                hairline = np.maximum(0.03 - q[:, 1], np.maximum(q[:, 1] - 0.13, q[:, 2] - 0.0))
            hair = np.maximum(cap, hairline * sc)
            hair -= (fbm3(X, 160) - 0.5) * 0.006 * sc
            if hs == 'long':
                drape = sd_ellipsoid(X, P(H, (0, 0.04, -0.06)), Rh, np.array([0.085, 0.13, 0.05]) * sc)
                hair = smin(hair, drape, 0.03 * sc)
            out.append(('hair', hair))
        elif hs == 'scarf':
            q = (X - P(H)) @ Rh / sc
            sc_shell = sd_ellipsoid(X, P(H, (-0.004, 0.112, -0.006)), Rh, np.array([0.113, 0.127, 0.133]) * sc)
            face_open = sd_ellipsoid(X, P(H, (-0.004, 0.072, 0.135)), Rh, np.array([0.072, 0.098, 0.095]) * sc)
            scarf = ssub(sc_shell, face_open, 0.01 * sc)
            knot = sd_ellipsoid(X, P(H, (0, -0.03, 0.07)), Rh, np.array([0.032, 0.026, 0.03]) * sc)
            scarf = smin(scarf, knot, 0.02 * sc) - (fbm3(X, 90) - 0.5) * 0.006 * sc
            out.append(('scarf', scarf))
        if s.get('hat') == 'cap':
            crown = sd_ellipsoid(X, P(H, (-0.004, 0.182, -0.004)), Rh, np.array([0.108, 0.058, 0.122]) * sc)
            peak = sd_ellipsoid(X, P(H, (-0.004, 0.16, 0.105)), Rh, np.array([0.088, 0.012, 0.065]) * sc)
            out.append(('hat', smin(crown, peak, 0.01 * sc)))
        if s.get('hat') == 'souwester':
            crown = sd_ellipsoid(X, P(H, (-0.004, 0.172, -0.008)), Rh, np.array([0.112, 0.08, 0.122]) * sc)
            q = (X - P(H, (0, 0.13, -0.03))) @ Rh
            brim = np.maximum(np.abs(q[:, 1] + q[:, 2] * 0.25) - 0.008 * sc, np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2) - 0.17 * sc)
            out.append(('hat', smin(crown, brim, 0.015 * sc)))
        if top == 'shirt' or s.get('tie'):
            sc_col = sd_torus(X, P('neck', (0, -0.005, 0.004)), R('neck') @ rot(-0.2, 0, 0), 0.05 * sc, 0.011 * sc)
            out.append((top, sc_col))
        # --- arms (sleeves are the coat or the top) ---
        sleeve = 'coat' if coat in ('long', 'short', 'gown') else top
        sleeves = []
        for side in ('l', 'r'):
            sh, el, hd = P(side + 'Sh'), P(side + 'El'), P(side + 'Hand')
            up = sd_round_cone(X, P(side + 'Sh', (0, -0.035, 0)), el, 0.05 * sc * b ** 0.5, 0.043 * sc)
            fo = sd_round_cone(X, el, P(side + 'Hand', (0, 0.03, 0)), 0.044 * sc, 0.037 * sc)
            arm = smin(up, fo, 0.02 * sc)
            if sleeve == 'coat': arm = arm - 0.006 * sc
            sleeves.append(arm)
            out.append((sleeve, arm))
            out.append(('skin', self.hand(X, side)))
        # --- legs ---
        legmat = s.get('legs', 'trousers')
        for side in ('l', 'r'):
            hp, kn, ft = P(side + 'Hip'), P(side + 'Knee'), P(side + 'Foot')
            th = sd_round_cone(X, hp, kn, 0.088 * sc, 0.056 * sc)
            sh = sd_round_cone(X, kn, ft + R(side + 'Foot') @ np.array([0, 0.06, 0]) * sc, 0.054 * sc, 0.04 * sc)
            leg = smin(th, sh, 0.03 * sc)
            leg -= (fbm3(X, 70) - 0.5) * 0.008 * sc
            out.append((legmat, leg))
            Rf = R(side + 'Foot')
            boot = s.get('boots', False)
            shoe = sd_round_cone(X, ft + Rf @ np.array([0, 0.02 if not boot else 0.12, -0.01]) * sc, ft + Rf @ np.array([0, -0.035, 0.15]) * sc, (0.048 if boot else 0.042) * sc, 0.038 * sc)
            q = (X - ft) @ Rf / sc
            shoe = np.maximum(shoe, (-0.065 - q[:, 1]) * sc)  # flat sole
            out.append(('shoes', shoe))
        out.append((legmat, pelvis))
        # --- outer layers ---
        if coat in ('long', 'short', 'gown'):
            shell = smin(smin(chest, ribs, 0.04 * sc), traps, 0.05 * sc)
            shell = smin(shell, abdo, 0.06 * sc) - 0.016 * sc
            pel = pelvis - 0.02 * sc
            shell = smin(shell, pel, 0.05 * sc)
            L = {'long': 0.46, 'short': 0.22, 'gown': 0.74}[coat]
            kmid = (P('lKnee') + P('rKnee')) / 2
            hip = P('hips', (0, 0.06, 0))
            down = kmid - hip; down /= np.linalg.norm(down)
            end = hip + down * L * sc
            skirt = sd_round_cone(X, hip, end + down * 0.15 * sc, 0.165 * sc * (0.85 + 0.15 * b), (0.24 if coat == 'gown' else 0.18) * sc)
            skirt = np.maximum(skirt, (X - end) @ down)  # straight hem
            q = (X - hip) @ R('hips') / sc
            skirt = np.maximum(skirt, (np.abs(q[:, 2] + 0.01) - (0.15 if coat == 'gown' else 0.13) - np.maximum(-q[:, 1], 0) * 0.08) * sc)
            # drape: soft vertical folds that deepen towards the hem
            ang = np.arctan2(q[:, 0], q[:, 2])
            fold = np.sin(ang * 9 + fbm3(X, 6) * 5) * np.clip(-q[:, 1] / 0.4, 0, 1)
            skirt -= fold * 0.009 * sc
            if coat != 'gown':
                # hangs open below the waist button, showing the trousers
                op = 0.12 if s.get('closed') else 0.22
                slit = np.maximum(np.abs(q[:, 0]) - np.maximum(-q[:, 1] - 0.06, 0) * op - 0.004, -q[:, 2] + 0.02)
                skirt = ssub(skirt, slit * sc, 0.008 * sc)
            shell = smin(shell, skirt, 0.05 * sc)
            # collar: a band standing up behind the neck
            col = sd_torus(X, P('neck', (0, -0.02, -0.004)), R('chest') @ rot(-0.3, 0, 0), 0.066 * sc, 0.016 * sc)
            qn = (X - P('neck')) @ R('chest') / sc
            col = np.maximum(col, (qn[:, 2] - 0.035) * sc)
            shell = smin(shell, col, 0.015 * sc)
            for arm in sleeves: shell = smin(shell, arm, 0.025 * sc)
            # open front: a V from the collar to the button shows the shirt and tie
            q = (X - P('chest', (0, 0.25, 0))) @ R('chest') / sc
            depth = s.get('v', 0.2)
            wedge = np.maximum.reduce([np.abs(q[:, 0]) - (q[:, 1] + depth) * 0.3 - 0.004, 0.03 - q[:, 2], q[:, 1] - 0.06, -depth - q[:, 1]])
            if s.get('closed'): wedge = wedge + 1
            shell = ssub(shell, wedge * sc, 0.005 * sc)
            shell -= (fbm3(X, 30) - 0.5) * 0.008 * sc
            # hem: cut level with the hands' reach so arms stay their own shape
            out.append(('coat', shell))
            if s.get('tie'):
                t0 = P('chest', (0, 0.24, 0.11)); t1 = P('chest', (0, 0.0, 0.118))
                out.append(('tie', sd_round_cone(X, t0, t1, 0.012 * sc, 0.02 * sc)))
        if s.get('vest'):
            vest = smin(smin(chest, ribs, 0.04 * sc), abdo, 0.05 * sc) - (0.05 if coat in ('long', 'short') else 0.016) * sc
            q = (X - P('chest')) @ R('chest') / sc
            vest = np.maximum(vest, (q[:, 1] - 0.24) * sc)
            out.append(('hivis', vest))
        if s.get('dogcollar'):
            out.append(('collar', sd_torus(X, P('neck', (0, 0.0, 0.004)), R('neck'), 0.053 * sc, 0.011 * sc)))
        if s.get('shroud'):
            # a sheet over the body to the chest (Alan, laid out)
            parts = [pelvis, abdo] + [sd_round_cone(X, P(sd + 'Hip'), P(sd + 'Foot'), 0.12 * sc, 0.09 * sc) for sd in ('l', 'r')]
            sheet = parts[0]
            for p_ in parts[1:]: sheet = smin(sheet, p_, 0.12 * sc)
            sheet = smin(sheet, ribs, 0.1 * sc) - 0.03 * sc
            q = (X - P('chest', (0, 0.05, 0))) @ R('chest')
            sheet = np.maximum(sheet, q[:, 1])
            sheet -= (fbm3(X, 25) - 0.5) * 0.02 * sc
            out.append(('linen', sheet))
        d = out[0][1]
        for _, di in out[1:]:
            d = np.minimum(d, di)
        # blend skin joins (neck into collar) softly
        return out, d

    def tint(self, X):
        """Per-vertex skin colour variation: lips, flushed cheeks/nose/ears, darker sockets, stubble."""
        sc = self.sc
        q = (X - self.P('head')) @ self.R('head') / sc
        t = np.ones((len(X), 3))
        def blob(c, r, col, amt=1.0):
            d = np.sqrt(np.sum(((q - np.array(c)) / np.array(r)) ** 2, -1))
            w = np.clip(1 - d, 0, 1) ** 1.5 * amt
            t[:] = t * (1 - w[:, None]) + t * np.array(col) * w[:, None]
        blob((0, 0.039, 0.09), (0.03, 0.014, 0.03), (0.86, 0.58, 0.56), 1.0)
        for sx in (1, -1):
            blob((sx * 0.047, 0.068, 0.07), (0.03, 0.028, 0.03), (1.0, 0.84, 0.82), 0.8)
            blob((sx * 0.033, 0.097, 0.082), (0.03, 0.022, 0.025), (0.8, 0.72, 0.75), 0.9)
            blob((sx * 0.08, 0.085, 0.0), (0.02, 0.04, 0.03), (1.0, 0.82, 0.8), 0.8)
        blob((0, 0.07, 0.105), (0.02, 0.02, 0.02), (1.0, 0.82, 0.8), 0.7)
        st = self.s.get('stubble', 0)
        if st:
            jaw = np.clip((0.07 - q[:, 1]) / 0.03, 0, 1) * np.clip((q[:, 2] + 0.02) / 0.04, 0, 1) * np.clip((0.115 - q[:, 1]) / 0.1, 0, 1)
            lip = np.sqrt(((q[:, 0]) / 0.03) ** 2 + ((q[:, 1] - 0.052) / 0.008) ** 2 + ((q[:, 2] - 0.095) / 0.03) ** 2) < 1
            w = np.clip(jaw + lip * 0.8, 0, 1) * st * (1 - (np.abs(q[:, 1] - 0.039) < 0.008) * (np.abs(q[:, 0]) < 0.022))
            t = t * (1 - w[:, None] * 0.35) + np.array([0.42, 0.4, 0.4]) * w[:, None] * 0.35
        return t

    def hand(self, X, side):
        sc = self.sc
        P = lambda loc: self.P(side + 'Hand', loc)
        sgn = 1 if side == 'l' else -1
        grip = self.s.get(side + 'Grip', False)
        palm = sd_ellipsoid(X, P((0, -0.05, 0.005)), self.R(side + 'Hand'), np.array([0.018, 0.048, 0.042]) * sc)
        wrist = sd_round_cone(X, P((0, 0.02, 0)), P((0, -0.02, 0.003)), 0.03 * sc, 0.024 * sc)
        d = smin(palm, wrist, 0.015 * sc)
        for i, z in enumerate((0.03, 0.01, -0.01, -0.028)):
            ln = (0.075, 0.085, 0.08, 0.065)[i]
            if grip:
                k0 = P((0, -0.092, z)); k1 = P((-sgn * 0.035, -0.1, z)); k2 = P((-sgn * 0.035, -0.07, z))
                f = smin(sd_round_cone(X, k0, k1, 0.0095 * sc, 0.009 * sc), sd_round_cone(X, k1, k2, 0.009 * sc, 0.008 * sc), 0.005 * sc)
            else:
                k0 = P((0, -0.09, z)); k1 = P((-sgn * 0.012, -0.09 - ln, z))
                f = sd_round_cone(X, k0, k1, 0.0095 * sc, 0.0075 * sc)
            d = smin(d, f, 0.006 * sc)
        th0 = P((-sgn * 0.01, -0.03, 0.035)); th1 = P((-sgn * 0.03, -0.075, 0.05 if grip else 0.06))
        d = smin(d, sd_round_cone(X, th0, th1, 0.012 * sc, 0.009 * sc), 0.01 * sc)
        return d


def build(spec, voxel=0.006):
    F = Field(spec)
    pts = np.array([F.J[k][0] for k in ORDER])
    lo = pts.min(0) - 0.32 * F.sc; hi = pts.max(0) + 0.32 * F.sc
    lo[1] = min(lo[1], -0.02)
    # coarse pass, then refine only the narrow band near the surface
    cv = voxel * 4
    cshape = np.ceil((hi - lo) / cv).astype(int) + 1
    cg = np.stack(np.meshgrid(*[lo[i] + np.arange(cshape[i]) * cv for i in range(3)], indexing='ij'), -1).reshape(-1, 3)
    _, cd = F.parts(cg)
    cd = cd.reshape(cshape)
    shape = (cshape - 1) * 4 + 1
    idx = np.stack(np.meshgrid(*[np.arange(shape[i]) for i in range(3)], indexing='ij'), -1).reshape(-1, 3)
    near = np.abs(cd[tuple((idx // 4).T)]) < cv * 1.8
    d = np.where(cd[tuple((idx // 4).T)] > 0, 1.0, -1.0) * cv
    sel = idx[near]
    X = lo + sel * voxel
    for i in range(0, len(X), 400000):
        _, di = F.parts(X[i:i + 400000])
        d[np.nonzero(near)[0][i:i + 400000]] = di
    vol = d.reshape(shape)
    verts, faces, normals, _ = marching_cubes(vol, 0.0, spacing=(voxel,) * 3)
    verts += lo
    # materials: the layer whose surface the vertex lies on
    parts, _ = F.parts(verts)
    keys = [k for k, _ in parts]
    D = np.stack([np.abs(dd) for _, dd in parts], 1)
    m = np.argmin(D, 1)
    vkey = np.array(keys)[m]
    # normals from the field gradient (smoother than marching-cubes normals)
    e = voxel * 0.5
    g = np.zeros_like(verts)
    for a in range(3):
        o = np.zeros(3); o[a] = e
        g[:, a] = F.parts(verts + o)[1] - F.parts(verts - o)[1]
    normals = g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
    # ambient occlusion from the field (Quilez): sample along the normal
    ao = np.zeros(len(verts))
    for i, h in enumerate((0.01, 0.025, 0.05, 0.09, 0.14)):
        dd = F.parts(verts + normals * h * F.sc)[1]
        ao += (h * F.sc - dd) / (2 ** i)
    ao = np.clip(1 - ao * 3.2, 0.25, 1.0)
    col = np.repeat(ao[:, None], 3, 1)
    skin = vkey == 'skin'
    col[skin] *= F.tint(verts[skin])
    # box-projected UVs, ~0.3 m per texture tile
    an = np.abs(normals)
    ax = np.argmax(an, 1)
    uv = np.where(ax[:, None] == 0, verts[:, [2, 1]], np.where(ax[:, None] == 1, verts[:, [0, 2]], verts[:, [0, 1]])) / 0.3
    # faces grouped by material
    fkey = vkey[faces[:, 0]]
    order = []
    groups = []
    start = 0
    for k in dict.fromkeys(keys):
        fi = np.nonzero(fkey == k)[0]
        if len(fi) == 0: continue
        order.append(fi)
        groups.append({'mat': k, 'start': start * 3, 'count': len(fi) * 3})
        start += len(fi)
    faces = faces[np.concatenate(order)]
    joints = {k: {'p': F.J[k][0].tolist(), 'R': F.J[k][1].tolist()} for k in ORDER}
    return verts.astype(np.float32), normals.astype(np.float32), uv.astype(np.float32), col.astype(np.float32), faces.astype(np.uint32), groups, joints


def write(cid, spec, voxel):
    v, n, uv, ao, f, groups, joints = build(spec, voxel)
    blobs = [v, n, uv, ao, f]
    offs = []; o = 0
    with open(f'{OUT}/{cid}.bin', 'wb') as fh:
        for b in blobs:
            offs.append(o); fh.write(b.tobytes()); o += b.nbytes
    meta = {'verts': len(v), 'tris': len(f), 'offsets': offs, 'groups': groups, 'joints': joints, 'scale': spec.get('scale', 1)}
    json.dump(meta, open(f'{OUT}/{cid}.json', 'w'))
    print(cid, len(v), 'verts', len(f), 'tris')


if __name__ == '__main__':
    from cast import CAST
    only = set(sys.argv[2].split(',')) if len(sys.argv) > 2 else None
    for cid, (spec, voxel) in CAST.items():
        if only and cid not in only: continue
        write(cid, spec, voxel)
