"""Procedural PBR texture library for the v2 concept shots.

Every texture tiles. Each material writes <name>_albedo.png (sRGB), <name>_normal.png (OpenGL, +Y up)
and <name>_rough.png (roughness in R; metalness, where used, in G). Run: python3 texgen.py tex/
"""
import os, sys
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

OUT = sys.argv[1] if len(sys.argv) > 1 else 'tex'
os.makedirs(OUT, exist_ok=True)
ONLY = set(sys.argv[2].split(',')) if len(sys.argv) > 2 else None


# ---------------- noise primitives (all tileable) ----------------
def fbm(n, beta=2.0, seed=0, lo=1.0, aniso=(1.0, 1.0)):
    """Spectral-synthesis fractal noise, normalised to 0..1. beta ~2 = cloudy, ~1 = gritty."""
    r = np.random.default_rng(seed)
    w = r.standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None] * n * aniso[1]
    fx = np.fft.fftfreq(n)[None, :] * n * aniso[0]
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    amp = 1.0 / np.maximum(f, lo) ** (beta / 2 + 0.5)
    amp[0, 0] = 0
    out = np.real(np.fft.ifft2(np.fft.fft2(w) * amp))
    out -= out.min(); out /= out.max() + 1e-9
    return out


def band(n, f0, f1, seed=0):
    """Band-limited noise between frequencies f0..f1 (cycles per tile)."""
    r = np.random.default_rng(seed)
    w = r.standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    f = np.sqrt(fx * fx + fy * fy)
    mask = ((f >= f0) & (f <= f1)).astype(float)
    out = np.real(np.fft.ifft2(np.fft.fft2(w) * mask))
    out -= out.min(); out /= out.max() + 1e-9
    return out


def voronoi(n, count, seed=0, jitter=1.0, aspect=(1.0, 1.0)):
    """Tileable Voronoi: returns (cell id, F1, F2-F1) on an n×n grid. aspect stretches cells."""
    r = np.random.default_rng(seed)
    pts = r.random((count, 2))
    tiles = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)]
    allp = np.concatenate([pts + np.array(t) for t in tiles])
    ids = np.tile(np.arange(count), len(tiles))
    sc = np.array(aspect)
    tree = cKDTree(allp * sc)
    yy, xx = np.mgrid[0:n, 0:n] / n
    q = np.stack([xx.ravel(), yy.ravel()], 1) * sc
    d, i = tree.query(q, k=2)
    cell = ids[i[:, 0]].reshape(n, n)
    f1 = d[:, 0].reshape(n, n); f2 = d[:, 1].reshape(n, n)
    return cell, f1, f2 - f1


def warp(img, dx, dy, amt):
    n = img.shape[0]
    yy, xx = np.mgrid[0:n, 0:n]
    sx = (xx + (dx - 0.5) * amt * n).astype(int) % n
    sy = (yy + (dy - 0.5) * amt * n).astype(int) % n
    return img[sy, sx]


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def rgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float) / 255


def lerp(a, b, t):
    t = t[..., None] if np.ndim(t) == 2 else t
    return a + (b - a) * t


def blur(img, r=1):
    out = img.copy().astype(float)
    for _ in range(r):
        out = (out + np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 5
    return out


# ---------------- writers ----------------
def normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx = -dx * strength; ny = dy * strength; nz = np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / l, ny / l, nz / l], -1) * 0.5 + 0.5


def save(name, albedo, height, rough, nstrength=6.0, metal=None):
    if ONLY and name not in ONLY:
        return
    a = np.clip(albedo, 0, 1)
    Image.fromarray((a * 255).astype(np.uint8)).save(f'{OUT}/{name}_albedo.png')
    nm = normal_from_height(height, nstrength * height.shape[0] / 512)
    Image.fromarray((nm * 255).astype(np.uint8)).save(f'{OUT}/{name}_normal.png')
    rm = np.zeros(a.shape); rm[..., 0] = 1; rm[..., 1] = np.clip(rough, 0, 1)
    if metal is not None: rm[..., 2] = np.clip(metal, 0, 1)
    Image.fromarray((rm * 255).astype(np.uint8)).save(f'{OUT}/{name}_rough.png')
    print('wrote', name)


def want(name):
    return not ONLY or name in ONLY


N = 1024

# ---------- harled exterior wall: lime harl over rubble, rain-streaked ----------
if want('harl'):
    grit = fbm(N, 0.6, 1); pits = fbm(N, 1.2, 2); low = fbm(N, 3.0, 3); streak = fbm(N, 2.2, 4, aniso=(0.4, 6))
    h = grit * 0.35 + pits * 0.4 + low * 0.25
    h = h - smooth(pits, 0.78, 0.9) * 0.3
    base = rgb('#cfcabd'); dirt = rgb('#7f7a6c'); green = rgb('#6f7458')
    a = lerp(base, dirt, smooth(streak, 0.45, 0.9) * 0.55 + (1 - grit) * 0.12)
    a = lerp(a, green, smooth(low, 0.62, 0.85) * 0.35)
    a *= (0.88 + 0.12 * grit)[..., None]
    save('harl', a, h, 0.92 - 0.1 * streak, 9)

# ---------- interior plaster, limewashed, cracked and flaking to stone ----------
if want('plaster'):
    low = fbm(N, 3.2, 11); fine = fbm(N, 0.9, 12); damp = fbm(N, 2.6, 13); streak = fbm(N, 2.0, 15, aniso=(0.3, 5)); speck = fbm(N, 0.35, 16)
    _, f1, edge = voronoi(N, 22, 14)
    crack = (1 - smooth(edge, 0.0, 0.0025)) * smooth(warp(low, fine, fine, 0.02), 0.64, 0.74)
    flake = smooth(damp, 0.86, 0.88) * smooth(fine, 0.4, 0.6)
    stone = lerp(rgb('#6a6458'), rgb('#8a8272'), fine)
    a = lerp(rgb('#d6d0c0'), rgb('#c4bba6'), low * 0.7)
    # damp: a yellowed bloom with a darker tide line, and run-down staining
    a = lerp(a, rgb('#ada184'), smooth(damp, 0.55, 0.8) * 0.5)
    tide = smooth(damp, 0.76, 0.79) * (1 - smooth(damp, 0.8, 0.83))
    a = lerp(a, rgb('#8a7c60'), tide * 0.3)
    a = lerp(a, rgb('#9c9480'), smooth(streak, 0.55, 0.85) * 0.35)
    a = lerp(a, rgb('#5a5a48'), smooth(speck, 0.82, 0.9) * smooth(damp, 0.55, 0.75) * 0.3)
    a = lerp(a, stone, flake)
    a = lerp(a, rgb('#4a4436'), crack * 0.55)
    a *= (0.94 + 0.06 * fine)[..., None]
    h = 0.6 + fine * 0.06 + low * 0.1 - flake * 0.25 - crack * 0.12
    save('plaster', a, h, 0.88 + 0.08 * flake, 5)

# ---------- flagstone floor: Caithness-style laminated slabs, worn edges ----------
if want('flags'):
    r = np.random.default_rng(21)
    h = np.zeros((N, N)); tone = np.zeros((N, N))
    y = 0
    while y < N:
        hgt = int(r.integers(150, 300)); y1 = min(N, y + hgt)
        x = int(r.integers(0, N))
        while x < x + 1 and x < N * 2:
            ln = int(r.integers(180, 420))
            xs = np.arange(x, x + ln) % N; ys = np.arange(y, y1)
            u = (np.arange(ln) / ln)[None, :]; v = ((ys - y) / max(1, y1 - y))[:, None]
            prof = np.clip(np.minimum(np.minimum(u, 1 - u) * ln / 10, np.minimum(v, 1 - v) * (y1 - y) / 10), 0, 1) ** 0.5
            gy, gx = np.meshgrid(ys, xs, indexing='ij')
            h[gy, gx] = prof; tone[gy, gx] = r.random()
            x += ln
        y = y1
    lam = fbm(N, 2.0, 23, aniso=(6, 0.3)); fine = fbm(N, 0.8, 24); wear = fbm(N, 2.8, 25)
    gap = 1 - smooth(h, 0.02, 0.25)
    cols = [rgb('#5d5f5c'), rgb('#6d6a62'), rgb('#56544e'), rgb('#77746a')]
    a = lerp(cols[0], cols[1], tone)
    a = lerp(a, cols[2], smooth(lam, 0.4, 0.7) * 0.6)
    a = lerp(a, cols[3], smooth(wear, 0.55, 0.85) * 0.5)
    a *= (0.88 + 0.14 * fine)[..., None]
    a = lerp(a, rgb('#24221e'), gap)
    hh = h * 0.5 + 0.05 * lam + 0.04 * fine
    save('flags', a, hh, 0.72 - 0.25 * smooth(wear, 0.5, 0.9) + gap * 0.2, 7)

# ---------- drystone / laid flagstone walling ----------
if want('stonewall'):
    r = np.random.default_rng(31)
    yy, xx = np.mgrid[0:N, 0:N]
    rowh = []; y = 0
    while y < N:
        hgt = int(r.integers(22, 60)); rowh.append((y, min(N, y + hgt))); y += hgt
    h = np.zeros((N, N)); a = np.zeros((N, N, 3))
    fine = fbm(N, 1.0, 32); lam = fbm(N, 2.0, 33, aniso=(6, 0.2))
    pal = [rgb(c) for c in ('#615a4c', '#6e6553', '#575247', '#7b705c', '#5f5c52', '#4f4b42')]
    for (y0, y1) in rowh:
        x = int(r.integers(0, N))
        while x < N * 2:
            ln = int(r.integers(80, 260)); c = pal[int(r.integers(0, len(pal)))]
            xs = (np.arange(x, x + ln) % N)
            ys = np.arange(y0, y1)
            gy, gx = np.meshgrid(ys, xs, indexing='ij')
            # rounded slab profile
            u = (np.arange(ln) / ln)[None, :]; v = ((ys - y0) / max(1, y1 - y0))[:, None]
            prof = np.clip(np.minimum(np.minimum(u, 1 - u) * 14, np.minimum(v, 1 - v) * 6), 0, 1) ** 0.6
            h[gy, gx] = prof * (0.75 + 0.25 * r.random())
            a[gy, gx] = c * (0.85 + 0.3 * r.random())
            x += ln
    h = h * (0.85 + 0.15 * fine) + lam * 0.05
    gap = 1 - smooth(h, 0.05, 0.35)
    a = a * (0.85 + 0.25 * fine)[..., None]
    a = lerp(a, rgb('#1d1b17'), gap)
    a = lerp(a, rgb('#8a8a62'), smooth(fbm(N, 2.5, 34), 0.78, 0.92) * (1 - gap) * 0.3)  # lichen
    save('stonewall', a, h, 0.86 + 0.1 * gap, 10)

# ---------- old wood planks (floorboards, pews, trestles) ----------
def planks(name, base, dark, seed, n_planks=6, varnish=0.0):
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:N, 0:N]
    pw = N // n_planks
    pid = (xx * n_planks) // N
    off = r.integers(0, N, n_planks)[pid]
    shade = (0.8 + 0.35 * r.random(n_planks))[pid]
    # grain: warped stripes along v
    g1 = fbm(N, 4.0, seed + 1); g2 = fbm(N, 1.0, seed + 2, aniso=(0.3, 10))
    rings = np.sin(xx / N * 2 * np.pi * 36 * n_planks / 6 + g1 * 40 + pid * 2.1) * 0.5 + 0.5
    rings = rings ** 2
    knots = np.zeros((N, N))
    for k in range(5):
        kx, ky = r.integers(0, N), r.integers(0, N)
        d = np.sqrt(((xx - kx + N // 2) % N - N // 2) ** 2 * 1.0 + (((yy - ky + N // 2) % N - N // 2) * 0.35) ** 2)
        knots += np.exp(-d / 9)
    seam = (((xx * n_planks) % N) < 3 * n_planks) | (((yy + off) % N) < 3)
    t = rings * 0.3 + g2 * 0.5 + fbm(N, 3.0, seed + 4) * 0.2
    a = lerp(rgb(base), rgb(dark), smooth(t, 0.2, 0.95) * 0.55 + np.clip(knots, 0, 1) * 0.6)
    a *= shade[..., None]
    wear = fbm(N, 2.6, seed + 3)
    a = lerp(a, a * 1.25, smooth(wear, 0.6, 0.9) * 0.4)
    a = lerp(a, rgb('#120d09'), seam.astype(float) * 0.85)
    h = 0.6 + rings * 0.06 + g2 * 0.05 - seam * 0.5 - np.clip(knots, 0, 1) * 0.04
    rough = 0.78 - varnish * 0.45 + 0.1 * smooth(wear, 0.5, 0.9) * varnish + seam * 0.2
    save(name, a, h, rough, 9)

if want('boards'): planks('boards', '#7a5c40', '#3e2a1c', 41)
if want('pew'): planks('pew', '#5e4330', '#2a1a10', 51, 4, varnish=0.6)
if want('coffinwood'): planks('coffinwood', '#5a3422', '#2a140a', 61, 3, varnish=0.9)

# ---------- painted timber, chipped (doors, frames, boat) ----------
def painted(name, paint, seed, chip=0.7, under='#6a5a44'):
    if not want(name): return
    wood = fbm(N, 1.5, seed, aniso=(6, 0.3)); chips = fbm(N, 1.6, seed + 1); grime = fbm(N, 2.6, seed + 2)
    c = smooth(chips, chip, chip + 0.02)
    a = lerp(rgb(paint), rgb(paint) * 0.8, grime * 0.6)
    a = lerp(a, lerp(rgb(under), rgb(under) * 0.6, wood), c)
    h = 0.6 + 0.04 * wood - c * 0.1 + fbm(N, 0.7, seed + 3) * 0.03
    save(name, a, h, 0.5 + 0.3 * c + 0.15 * grime, 5)

painted('paint_door_blue', '#2c3e52', 71)
painted('paint_door_green', '#2e4a38', 72)
painted('paint_frame_white', '#d8d4c8', 73, chip=0.78)
painted('paint_shopfront', '#27384a', 74, chip=0.8)

# ---------- slate roof ----------
if want('slate'):
    yy, xx = np.mgrid[0:N, 0:N]
    rh = N // 8; rw = N // 6
    row = yy // rh; off = (row % 2) * rw // 2
    sid = row * 7 + ((xx + off) // rw)
    r = np.random.default_rng(81)
    tone = r.random(200)[sid % 200]
    v = (yy % rh) / rh; u = ((xx + off) % rw) / rw
    lam = fbm(N, 1.4, 82, aniso=(0.5, 3))
    h = v * 0.6 + lam * 0.15 - ((u < 0.02) | (u > 0.985)) * 0.4
    a = lerp(rgb('#2e3438'), rgb('#4a5258'), tone * 0.7 + lam * 0.3)
    lich = smooth(fbm(N, 2.2, 83), 0.7, 0.85)
    a = lerp(a, rgb('#9a9a6a'), lich * 0.5)
    a = lerp(a, rgb('#0e1012'), (v > 0.95).astype(float) * 0.7)
    save('slate', a, h, 0.62 - 0.1 * lam + lich * 0.3, 8)

# ---------- wet tarmac with puddles ----------
if want('tarmac'):
    agg = fbm(N, 0.2, 91); fine = fbm(N, 0.9, 92); pud = fbm(N, 3.2, 93); patch = fbm(N, 3.0, 94)
    stones = smooth(agg, 0.7, 0.75)
    a = lerp(rgb('#2d2e30'), rgb('#4a4846'), stones * 0.7 + fine * 0.2)
    a = lerp(a, rgb('#222326'), smooth(patch, 0.55, 0.57) * 0.6)
    p = smooth(pud, 0.6, 0.68)
    a = lerp(a, a * 0.55, p)
    h = 0.5 + stones * 0.12 + fine * 0.05 - p * 0.3
    h = np.where(p > 0.5, 0.35, h)
    save('tarmac', a, h, np.clip(0.75 - 0.4 * fine * 0 - p * 0.72, 0.02, 1) - stones * 0.05, 4)

# ---------- concrete (kerb, harbour, bunker) ----------
if want('concrete'):
    f = fbm(N, 1.0, 101); low = fbm(N, 3.0, 102); bub = fbm(N, 0.3, 103)
    a = lerp(rgb('#8a8780'), rgb('#5f5c56'), low * 0.6 + f * 0.2)
    a = lerp(a, rgb('#3a3832'), smooth(fbm(N, 2.3, 104, aniso=(5, 0.3)), 0.6, 0.9) * 0.5)
    h = 0.5 + f * 0.1 + low * 0.1 - smooth(bub, 0.8, 0.85) * 0.2
    save('concrete', a, h, 0.85, 6)

# ---------- ship steel: white paint with rust weeps ----------
if want('shipwhite'):
    rust = fbm(N, 2.0, 111, aniso=(0.25, 10)); spots = fbm(N, 1.4, 112); grime = fbm(N, 2.8, 113)
    weld = (np.mgrid[0:N, 0:N][0] % (N // 2) < 4).astype(float)
    r = smooth(rust, 0.68, 0.95) * 0.5 * smooth(grime, 0.35, 0.7) + smooth(spots, 0.84, 0.88)
    a = lerp(rgb('#d8d5cc'), rgb('#a9a69c'), smooth(grime, 0.3, 0.9) * 0.7)
    a = lerp(a, rgb('#6a4a34'), np.clip(r, 0, 1) * 0.55)
    a = lerp(a, a * 0.7, weld * 0.5)
    h = 0.6 + smooth(spots, 0.8, 0.85) * 0.1 - weld * 0.2 + fbm(N, 0.7, 114) * 0.02
    save('shipwhite', a, h, 0.45 + r * 0.4, 5)
if want('deck'):
    yy, xx = np.mgrid[0:N, 0:N]
    tread = ((np.sin(xx / 6.0) * np.sin(yy / 6.0)) > 0.6).astype(float)
    wear = fbm(N, 2.4, 121); dirt = fbm(N, 1.5, 122)
    a = lerp(rgb('#3d5a4a'), rgb('#55705e'), wear * 0.5)
    a = lerp(a, rgb('#5a3a22'), smooth(dirt, 0.7, 0.85) * 0.6)
    a = lerp(a, rgb('#8a8a80'), smooth(wear, 0.75, 0.9) * 0.5)
    h = 0.5 + tread * 0.1 + dirt * 0.05
    save('deck', a, h, 0.55 + 0.3 * smooth(dirt, 0.6, 0.9), 4)

# ---------- fabrics (512 is plenty at character scale) ----------
M = 512
def weave(name, c1, c2, seed, twill=True, fuzz=0.5, scale=3, rough=0.92, sheen_creases=0.0):
    if not want(name): return
    yy, xx = np.mgrid[0:M, 0:M]
    if twill:
        pat = (((xx // scale) + (yy // scale)) % 4 < 2).astype(float)
    else:
        pat = (((xx // scale) + (yy // scale)) % 2).astype(float)
    f = fbm(M, 0.6, seed); low = fbm(M, 2.8, seed + 1); crease = band(M, 3, 9, seed + 2)
    cr = np.abs(crease - 0.5) * 2
    a = lerp(rgb(c1), rgb(c2), pat * 0.35 + f * fuzz * 0.4 + low * 0.25)
    a *= (0.9 + 0.14 * (1 - cr))[..., None]
    h = pat * 0.15 + f * 0.1 + (1 - cr) * 0.35
    save(name, a, h, rough - sheen_creases * (1 - cr) * 0.4, 3)

weave('wool_charcoal', '#2a2b2e', '#3a3b3f', 131)
weave('wool_black', '#18181a', '#26262a', 132)
weave('wool_brown', '#4a3a30', '#5e4a3c', 133)
weave('wool_navy', '#20283a', '#2c3448', 134)
weave('tweed', '#4a4436', '#6a5e48', 135, twill=False, fuzz=1.0, scale=2)
weave('denim', '#2a3448', '#46526a', 136, scale=2)
weave('trouser_dark', '#1e1f22', '#2c2d31', 137, twill=False, scale=1)
weave('oilskin_yellow', '#b08a1c', '#c8a024', 138, twill=False, fuzz=0.1, scale=1, rough=0.55, sheen_creases=0.6)
weave('hivis', '#c8d020', '#dce83a', 139, twill=False, fuzz=0.2, scale=1, rough=0.7)
weave('linen', '#dcd6c6', '#cfc8b6', 140, twill=False, fuzz=0.6, scale=1)
weave('shirt', '#d8d6ce', '#cac8c0', 141, twill=False, fuzz=0.3, scale=1)
weave('scarf_plum', '#4a3448', '#5e4258', 142, scale=2)
weave('knit_cream', '#c8bea6', '#b4a88e', 143, twill=False, fuzz=0.9, scale=4)

if want('leather'):
    f = fbm(M, 0.5, 151); low = fbm(M, 2.5, 152); cr = band(M, 6, 20, 153)
    a = lerp(rgb('#141110'), rgb('#2e2620'), low * 0.5 + f * 0.2)
    save('leather', a, f * 0.2 + np.abs(cr - 0.5) * 0.4, 0.45 + 0.2 * low, 3)

# ---------- skin (tinted per character in the shader) ----------
if want('skin'):
    pores = fbm(M, 0.3, 161); blot = fbm(M, 2.6, 162); vein = fbm(M, 1.8, 163)
    a = lerp(rgb('#e8e0da'), rgb('#d4c4bc'), blot * 0.6 + pores * 0.2)
    a = lerp(a, rgb('#c8a8a8'), smooth(vein, 0.6, 0.8) * 0.3)
    save('skin', a, pores * 0.4 + blot * 0.2, 0.55 + 0.15 * pores, 2)

if want('hair'):
    s = fbm(M, 1.0, 171, aniso=(0.15, 10)); s2 = fbm(M, 0.6, 172, aniso=(0.1, 14))
    a = np.ones((M, M, 3)) * (0.75 + 0.35 * s[..., None] + 0.15 * s2[..., None])
    save('hair', a, s * 0.6 + s2 * 0.4, 0.5 + 0.2 * s2, 6)

# ---------- landscape ----------
if want('turf'):
    f = fbm(N, 0.7, 181); low = fbm(N, 3.0, 182); tuft = fbm(N, 0.4, 183)
    a = lerp(rgb('#3e4a2a'), rgb('#5a6236'), f * 0.6 + low * 0.3)
    a = lerp(a, rgb('#6a5a3c'), smooth(low, 0.62, 0.8) * 0.6)   # dead bracken
    a = lerp(a, rgb('#2a2a1e'), smooth(tuft, 0.75, 0.85) * 0.4)
    save('turf', a, f * 0.4 + tuft * 0.3, 0.95, 6)
if want('rock'):
    lam = fbm(N, 2.0, 191, aniso=(6, 0.25)); f = fbm(N, 0.9, 192); low = fbm(N, 3.0, 193)
    a = lerp(rgb('#4a4640'), rgb('#6e675c'), lam * 0.6 + f * 0.3)
    a = lerp(a, rgb('#c8c4a0'), smooth(low, 0.7, 0.8) * 0.35)  # lichen
    save('rock', a, lam * 0.6 + f * 0.3, 0.9, 10)

# ---------- worn rug ----------
if want('rug'):
    yy, xx = np.mgrid[0:N, 0:N]
    u = np.abs((xx / N) - 0.5) * 2; v = np.abs((yy / N) - 0.5) * 2
    border = ((np.maximum(u, v) > 0.82) & (np.maximum(u, v) < 0.9)).astype(float)
    motif = ((np.sin(xx / N * np.pi * 16) * np.sin(yy / N * np.pi * 10)) > 0.55).astype(float) * (np.maximum(u, v) < 0.78)
    f = fbm(N, 0.5, 201); wear = fbm(N, 3.0, 202)
    a = lerp(rgb('#5a2a22'), rgb('#3a3028'), motif)
    a = lerp(a, rgb('#8a7a52'), border)
    a = lerp(a, rgb('#6a5e50'), smooth(wear, 0.5, 0.8) * 0.6)
    a *= (0.85 + 0.2 * f)[..., None]
    save('rug', a, f * 0.5, 0.97, 3)

# ---------- metals ----------
if want('iron'):
    f = fbm(M, 1.0, 211); rust = fbm(M, 1.8, 212)
    rr = smooth(rust, 0.55, 0.8)
    a = lerp(rgb('#3a3a3a'), rgb('#6a3a20'), rr)
    save('iron', a, f * 0.3 + rr * 0.2, 0.5 + rr * 0.45, 4, metal=1 - rr)
if want('blade'):
    f = fbm(M, 1.2, 221, aniso=(0.2, 6)); pit = fbm(M, 0.6, 222); rust = fbm(M, 2.0, 223)
    rr = smooth(rust, 0.62, 0.85)
    a = lerp(rgb('#9aa0a4'), rgb('#5a4a3a'), rr * 0.8)
    a = lerp(a, a * 0.8, f * 0.4)
    save('blade', a, f * 0.2 + smooth(pit, 0.75, 0.8) * -0.3 + 0.5, 0.28 + 0.4 * rr + 0.1 * f, 3, metal=1 - rr * 0.8)
if want('brass'):
    f = fbm(M, 1.0, 231); tar = fbm(M, 2.4, 232)
    a = lerp(rgb('#b08a4a'), rgb('#4a4a2a'), smooth(tar, 0.5, 0.8) * 0.8)
    save('brass', a, f * 0.2, 0.35 + 0.4 * tar, 2, metal=np.ones((M, M)))

# ---------- the sea: a tiling wave normal map for three.js Water (replaces the stock waternormals.jpg) ----------
if want('water'):
    n = 512; r = np.random.default_rng(301)
    yy, xx = np.mgrid[0:n, 0:n] / n
    h = np.zeros((n, n))
    for i in range(48):  # integer wave vectors keep it tiling; a loose prevailing direction
        a = r.normal(0.4, 0.9); k = r.integers(2, 26)
        kx, ky = int(round(np.cos(a) * k)), int(round(np.sin(a) * k))
        if kx == 0 and ky == 0: continue
        amp = 1.0 / (kx * kx + ky * ky) ** 0.6
        ph = 2 * np.pi * (kx * xx + ky * yy) + r.uniform(0, 2 * np.pi)
        h += amp * (np.sin(ph) + 0.25 * np.sin(2 * ph + 1.3))  # slightly peaked crests
    h += (fbm(n, 1.4, 302) - 0.5) * 0.15
    h = (h - h.min()) / (h.max() - h.min())
    nm = (normal_from_height(h, 9.0) * 255).astype(np.uint8)
    Image.fromarray(nm).save(f'{OUT}/waternormals.png')
print('done')
