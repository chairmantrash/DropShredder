#!/usr/bin/env python3
"""Render store SVG layouts and PNGs from unchanged real Chrome capture crops."""
from pathlib import Path
import base64, hashlib, html, json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'store-assets'
FONT = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
BOLD = FONT.with_name('DejaVuSans-Bold.ttf')
BG, RED, WHITE, MUTED = '#090b0f', '#ff4d43', '#f5f7fc', '#aebed0'
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
class Canvas:
    def __init__(self,w,h):
        self.size=(w,h); self.im=Image.new('RGB',self.size,BG)
        self.d=ImageDraw.Draw(self.im)
        self.parts=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',f'<rect width="{w}" height="{h}" fill="{BG}"/>']
    def rect(self,xy,fill):
        self.d.rectangle(xy,fill=fill);x,y,x2,y2=xy
        self.parts.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="{y2-y}" fill="{fill}"/>')
    def text(self,x,y,s,size=24,fill=WHITE,bold=False):
        f=ImageFont.truetype(str(BOLD if bold else FONT),size)
        self.d.text((x,y),s,font=f,fill=fill,anchor='lt')
        self.parts.append(f'<text x="{x}" y="{y+size}" fill="{fill}" font-family="DejaVu Sans" font-weight="{700 if bold else 400}" font-size="{size}">{html.escape(s)}</text>')
    def image(self,im,x,y):
        self.im.paste(im,(x,y));import io
        b=io.BytesIO();im.save(b,format='PNG')
        self.parts.append(f'<image x="{x}" y="{y}" width="{im.width}" height="{im.height}" xlink:href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/>')
    def save(self,p):
        p.parent.mkdir(parents=True,exist_ok=True)
        self.im.save(p,format='PNG',compress_level=9)
        p.with_suffix('.svg').write_text('\n'.join(self.parts+['</svg>'])+'\n')

specs=[
 dict(name='01-check-control',capture='professional-panel.png',crop=(0,0,420,716),
      title=['Choose what','you investigate.'],
      bullets=[('Start with a product','Run a bounded check on the listing you choose.'),('Keep alerts optional','Chrome asks before automatic site access.'),('Follow the evidence','Inspect the report; uncertainty stays visible.')],
      note='Chrome-rendered panel document · before a scan',
      scope='Real Chromium extension document in a tab; default professional tone, not native toolbar opening or merchant accuracy.'),
 dict(name='02-local-label',capture='native-local-label.png',crop=(929,136,1289,852),
      title=['Read labels','on your device.'],
      bullets=[('Choose a local image','Packaged English OCR runs after your click.'),('Treat text as a lead','Recognition can be wrong; verify the identifier.'),('Control the next step','Open source searches only when you choose.')],
      note='Native Chrome panel · synthetic owned label demo',
      scope='Actual native bundled OCR on synthetic PRODUCT 12345 image. Native barcode support unavailable in this browser; no real-photo accuracy claim.'),
 dict(name='03-private-history',capture='native-private-history.png',crop=(929,136,1289,852),
      title=['Keep control','of your history.'],
      bullets=[('Review before sharing','Export a minimized evidence summary.'),('Delete local history','Remove your stored observations from the panel.'),('Revoke extra access','Manage optional Chrome site permissions.')],
      note='Native Chrome panel · owned fixture; access revoked',
      scope='Actual native privacy controls after revoking fixture host access. Disabled stale export is visible.'),
 dict(name='04-signed-reference',capture='native-signed-reference.png',crop=(929,152,1289,780),
      title=['Use sources','you choose.'],
      bullets=[('Preview before saving','Review a small reference list explicitly.'),('Pin a publisher key','Trust keys obtained independently.'),('Opt in to updates','Only preauthorized signed feeds qualify.')],
      note='Native Chrome panel · owned test feed and public key',
      scope='Actual native signed-feed onboarding with ephemeral owned fixture key; no external issuer authenticated or elapsed-week scheduler test.')
]
assets=[]
for s in specs:
    source=OUT/'captures'/s['capture'];im=Image.open(source);im.load()
    pane=im.crop(s['crop']).convert('RGB')
    c=Canvas(1280,800)
    c.rect((48,44,94,50),RED);c.text(48,78,'DROPSHREDDER',19,RED,True)
    for i,t in enumerate(s['title']):c.text(48,145+i*65,t,52,WHITE,True)
    y=325
    for heading,body in s['bullets']:
        c.text(48,y,heading,26,WHITE,True)
        c.text(48,y+42,body,20,MUTED);y+=114
    x=820+(420-pane.width)//2
    c.rect((x-2,40,x+pane.width+2,40+pane.height+4),'#34404c')
    c.image(pane,x,42)
    c.text(48,751,s['note'],17,MUTED)
    p=OUT/'screenshots'/(s['name']+'-1280x800.png');c.save(p)
    assets.append(dict(path=str(p.relative_to(ROOT)),width=1280,height=800,sha256=digest(p),
        source=str(source.relative_to(ROOT)),sourceSha256=digest(source),sourceDimensions=list(im.size),
        crop=list(s['crop']),transforms='Crop only, no UI pixel edits or scaling; external brand/caption composition; PNG encoded RGB',
        scope=s['scope']))
# Brand-only promotion; precise source SVG geometry, never a fabricated UI.
for w,h,name in [(440,280,'promo-440x280'),(1400,560,'marquee-1400x560')]:
    c=Canvas(w,h);factor=w/440
    if w==440:
        c.rect((0,0,8,280),RED)
        for i in range(4):c.rect((55+i*55,55,72+i*55,122),RED)
        c.rect((48,38,280,43),WHITE)
        c.text(48,154,'DropShredder',38,WHITE,True)
        c.text(48,215,'Product clues. Your control.',19,MUTED)
    else:
        c.rect((0,0,12,h),RED)
        for i in range(4):c.rect((70+i*62,120,90+i*62,330),RED)
        c.rect((60,98,330,108),WHITE)
        c.text(420,160,'DropShredder',88,WHITE,True)
        c.text(426,282,'Product clues. Your control.',34,MUTED)
        c.text(426,370,'Local evidence · optional research · clear limits',24,MUTED)
    p=OUT/(name+'.png');c.save(p)
    assets.append(dict(path=str(p.relative_to(ROOT)),width=w,height=h,sha256=digest(p),scope='Project-authored vector brand composition; no accuracy/Google endorsement claims'))
manifest=dict(schemaVersion=1,preparedAt='2026-10-09',task='DS-038',productionSource='cc315e4690b9a3cc5a16b4d6d6e3b6dd739bb0c6',
    testedHarness='fe22e27b44424273d4b465d8af5cafbc40178bdb',browser='Chrome/156.0.8078.4',
    sourceRun='https://github.com/chairmantrash/DropShredder/actions/runs/37979165995',
    artifacts={'native':11640001725,'packaged':11640825265},
    exclusions=['Initial headed capture was blank before compositor paint; excluded.','Nuclear-tone scan/toast captures excluded from customer-facing assets.','Live merchant logos/images and full public-key textarea not used.'],
    rendering={'script':'scripts/prepare-store-assets.py','Pillow':Image.__version__,'font':str(FONT),'fontSha256':digest(FONT),'boldSha256':digest(BOLD)},
    sources='Unmodified source capture files retained under store-assets/captures; SVG layout files are also included.',
    images=assets,icon=dict(path='store-assets/icon-128.png',sha256=digest(OUT/'icon-128.png'),source='public/icon/128.png',transforms='Exact copy; no runtime icon change'))
(OUT/'ASSET-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared',len(assets),'images plus store icon; original captures and SVGs retained.')

