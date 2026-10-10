import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
shots = [('ferry', 'Story: the crossing'), ('vigil', 'Story: the vigil'), ('kirk', 'Story: the service, when they turn'),
         ('dialogue', 'Dialogue: Morag at the shop door'), ('combat', 'Combat: the street, that night'), ('note', "Reading: Alan's notebook")]
dirs = [('A', 'A  Peat & Sodium (PS1)', '320x180, hard dither, strong vertex wobble'),
        ('B', 'B  Lamplight (PS2)', '640x360, soft bloom, grain, light dither'),
        ('C', 'C  Haar (monochrome)', '480x270, black and white, only red survives')]
F = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
Fr = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BG = (14, 14, 16); FG = (232, 226, 210); MUTED = (150, 146, 136)

# 1) all directions side by side: rows = shots, columns = directions
W, H, top, lab = 640, 360, 96, 0
sheet = Image.new('RGB', (W * 3, top + H * len(shots)), BG)
d = ImageDraw.Draw(sheet)
for c, (k, name, sub) in enumerate(dirs):
    d.text((c * W + 20, 18), name, font=F(28), fill=FG); d.text((c * W + 20, 56), sub, font=Fr(18), fill=MUTED)
for r, (s, label) in enumerate(shots):
    for c, (k, _, _) in enumerate(dirs):
        im = Image.open(f'out/{s}-{k}.png').resize((W, H), Image.LANCZOS)
        sheet.paste(im, (c * W, top + r * H))
    d.rectangle((0, top + r * H, 470, top + r * H + 34), fill=(0, 0, 0))
    d.text((12, top + r * H + 6), f'{r + 1}  {label}', font=F(18), fill=FG)
sheet.save(f'{out}/compare-all-directions.png', optimize=True)

# 2) one sheet per direction, 2 x 3 at 960x540
for k, name, sub in dirs:
    W, H, top = 960, 540, 110
    sh = Image.new('RGB', (W * 2, top + H * 3), BG)
    d = ImageDraw.Draw(sh)
    d.text((24, 20), name, font=F(40), fill=FG); d.text((26, 72), sub, font=Fr(22), fill=MUTED)
    for i, (s, label) in enumerate(shots):
        x, y = (i % 2) * W, top + (i // 2) * H
        sh.paste(Image.open(f'out/{s}-{k}.png').resize((W, H), Image.LANCZOS), (x, y))
        d.rectangle((x, y, x + 520, y + 40), fill=(0, 0, 0))
        d.text((x + 14, y + 8), f'{i + 1}  {label}', font=F(22), fill=FG)
    sh.save(f'{out}/sheet-{k}.png', optimize=True)
print('sheets done')
