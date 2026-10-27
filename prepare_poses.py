"""Build four new poses around the supplied, unchanged marker-drawn head.
Run after prepare_assets.py. Pillow is the only build dependency.
The website uses only the resulting small, transparent WebP files.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
S = 3
INK = (7, 18, 21, 255)
original = Image.open(ROOT / 'assets/body.webp').convert('RGBA')
head = original.crop((414, 22, 556, 153))

class Drawing:
    def __init__(self):
        self.im = Image.new('RGBA', (640*S, 640*S))
        self.d = ImageDraw.Draw(self.im)
    def path(self, start, *segments, width=8, color=INK):
        points = [start]
        for segment in segments:
            if len(segment) == 2:
                points.append(segment)
            else:
                x0,y0 = points[-1]
                x1,y1,x2,y2,x3,y3 = segment
                for i in range(1,41):
                    t=i/40; u=1-t
                    points.append((u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,
                                   u*u*u*y0+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3))
        p=[(round(x*S),round(y*S)) for x,y in points]
        self.d.line(p,fill=color,width=round(width*S),joint='curve')
        r=width*S/2
        for x,y in (p[0],p[-1]):
            self.d.ellipse((x-r,y-r,x+r,y+r),fill=color)
    def face(self, x=234, y=34, w=160, glasses=False):
        h=round(w*head.height/head.width)
        self.im.alpha_composite(head.resize((w*S,h*S),Image.Resampling.LANCZOS),(x*S,y*S))
        if glasses:
            def P(a,b): return (x+(a-414)*w/142,y+(b-22)*w/142)
            # Open, slightly irregular professional frames: the original eyes stay visible.
            self.path(P(453,60), P(477,59),P(477,81),P(458,82),P(453,60),width=4.3)
            self.path(P(483,59),P(504,56),P(508,78),P(487,81),P(483,59),width=4.3)
            self.path(P(477,66),P(484,66),width=4)
            self.path(P(505,62),P(518,58),width=4)
    def save(self,name):
        self.im.resize((640,640),Image.Resampling.LANCZOS).save(ROOT/'assets'/f'egor-{name}.webp',lossless=True)

# Off duty: long limbs folded over a tiny, wonky stool.
a=Drawing()
a.path((248,419),(410,417),width=6)
a.path((262,420),(252,478,248,538,236,574),width=6)
a.path((397,420),(404,482,420,541,428,571),width=6)
a.face(x=230,y=47,w=164)
a.path((311,191),(310,217,311,226,310,240),width=9)
a.path((275,239),(299,235,332,238,348,238),(349,275,350,326,360,383),(332,392,303,394,277,387),(273,345,278,286,275,239),width=9)
a.path((277,242),(250,287,247,330,267,369),(286,382,313,382,332,380),width=8)
a.path((348,244),(371,278,392,303,411,311),(422,286,425,264,424,247),width=8)
a.path((282,391),(325,416,367,415,414,410),(438,443,453,480,473,521),width=10)
a.path((359,390),(382,375,414,372,449,382),(453,421,457,457,456,481),width=9)
a.path((474,521),(490,515,515,521,520,531),(506,542,487,540,474,521),width=8)
a.path((455,482),(470,476,489,477,496,487),(481,499,466,497,455,482),width=8)
a.save('seated')

# On brand: same face and hair, open glasses, crossed arms, original long-legged silhouette.
b=Drawing(); b.face(x=237,y=20,w=156,glasses=True)
b.path((315,158),(314,178,314,190,314,209),width=9)
b.path((277,211),(295,205,334,205,351,209),(354,254,354,304,361,343),(330,339,301,349,279,347),(276,306,277,254,277,211),width=9)
b.path((277,213),(262,241,246,265,245,285),(266,304,320,304,348,281),width=9)
b.path((351,211),(369,235,387,271,385,292),(359,304,310,281,280,276),width=9)
b.path((282,348),(278,417,281,490,280,571),width=10)
b.path((358,345),(361,410,359,485,367,572),width=10)
b.path((280,571),(258,568,239,579,232,593),(248,599,267,583,280,579),width=8)
b.path((368,573),(385,571,403,583,408,593),(396,604,374,586,367,580),width=8)
b.save('confident')

# Your guide: an open gesture drawn as one line, never a palm or fingers.
c=Drawing(); c.face(x=229,y=25,w=158)
c.path((307,165),(307,182,307,198,307,213),width=9)
c.path((272,214),(294,210,324,212,345,214),(349,261,345,306,354,349),(324,349,293,357,272,353),(270,306,272,258,272,214),width=9)
c.path((345,217),(371,247,392,273,418,279),(443,252,463,219,481,198),width=9)
c.path((270,219),(251,259,235,301,231,352),width=9)
c.path((276,355),(280,425,277,493,277,573),width=10)
c.path((350,353),(364,422,389,492,404,562),width=10)
c.path((277,573),(257,572,237,580,232,593),(245,599,264,587,278,579),width=8)
c.path((405,562),(425,561,445,567,448,580),(433,587,412,576,405,570),width=8)
c.save('guide')

# The curious one: sitting, elbow supported, a simple line resting by the chin.
d=Drawing(); d.face(x=224,y=40,w=162)
d.path((305,185),(304,205,305,220,305,237),width=9)
d.path((269,238),(292,234,326,236,347,239),(348,281,349,321,355,359),(327,368,295,371,270,364),(268,320,270,274,269,238),width=9)
d.path((270,242),(251,275,244,313,262,329),(288,342,318,334,337,318),width=8)
d.path((347,241),(373,266,389,291,385,315),(360,295,342,254,337,207),width=8)
d.path((272,367),(319,390,360,404,401,421),(374,459,341,494,318,534),width=10)
d.path((353,362),(389,363,424,384,445,402),(419,448,387,490,369,534),width=9)
d.path((318,534),(296,530,279,538,277,550),(288,559,308,548,320,541),width=8)
d.path((369,534),(389,533,407,539,412,551),(397,560,377,546,369,542),width=8)
d.path((253,389),(236,389,226,391,212,390),(215,446,216,494,213,551),width=5)
d.path((215,390),(309,393),width=5)
d.save('curious')

# Build-only contact sheet, deliberately outside the deployable website.
sheet=Image.new('RGB',(1280,320),(3,175,213))
for i,name in enumerate(['seated','confident','guide','curious']):
    im=Image.open(ROOT/'assets'/f'egor-{name}.webp').resize((320,320))
    sheet.paste(im,(i*320,0),im)
sheet.save(ROOT.parent/'egor-poses.png')
print('Created four original-head poses.')
