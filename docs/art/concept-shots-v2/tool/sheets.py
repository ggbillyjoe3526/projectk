import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
src = sys.argv[2] if len(sys.argv) > 2 else 'out'
shots = [('ferry', 'Story: the crossing'), ('vigil', 'Story: the vigil'), ('kirk', 'Story: the service, when they turn'),
         ('dialogue', 'Dialogue: Morag at the shop door'), ('combat', 'Combat: the street, that night'), ('note', "Reading: Alan's notebook")]
F = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
Fr = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BG = (14, 14, 16); FG = (232, 226, 210); MUTED = (150, 146, 136)

def sheet(k, name, sub, fn):
    W, H, top = 960, 540, 110
    sh = Image.new('RGB', (W * 2, top + H * 3), BG)
    d = ImageDraw.Draw(sh)
    d.text((24, 20), name, font=F(40), fill=FG); d.text((26, 72), sub, font=Fr(22), fill=MUTED)
    for i, (s, label) in enumerate(shots):
        x, y = (i % 2) * W, top + (i // 2) * H
        sh.paste(Image.open(f'{src}/{s}-{k}.png').resize((W, H), Image.LANCZOS), (x, y))
        d.rectangle((x, y, x + 520, y + 40), fill=(0, 0, 0))
        d.text((x + 14, y + 8), f'{i + 1}  {label}', font=F(22), fill=FG)
    sh.save(f'{out}/{fn}', optimize=True)

sheet('B', 'Lamplight, round 2: gritty and realistic', 'The normal look: photo-scanned head, sculpted bodies, PBR textures, image-based light, soft shadows, AO, film grain', 'sheet-normal.png')
sheet('M', 'Low Resolve: the haar takes over', 'The same frames when health or Resolve is low: the world drains to grey and only red keeps its colour', 'sheet-low-resolve.png')

# normal vs low Resolve, combat, side by side
W, H, top = 960, 540, 110
sh = Image.new('RGB', (W * 2, top + H), BG); d = ImageDraw.Draw(sh)
d.text((24, 20), 'Combat: normal vs low Resolve', font=F(40), fill=FG)
d.text((26, 72), 'Left: Resolve 3 of 8. Right: what the same moment looks like when it drops low.', font=Fr(22), fill=MUTED)
for i, k in enumerate('BM'):
    sh.paste(Image.open(f'{src}/combat-{k}.png').resize((W, H), Image.LANCZOS), (i * W, top))
sh.save(f'{out}/combat-normal-vs-low-resolve.png', optimize=True)
print('sheets done')
