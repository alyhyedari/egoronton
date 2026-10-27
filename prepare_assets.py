from PIL import Image
import numpy as np
from pathlib import Path
import base64
p=Path('/mnt/data/egor-world'); (p/'assets').mkdir(parents=True, exist_ok=True)
im=Image.open('/mnt/data/goodbye-paper-background.png').convert('RGB')
a=np.asarray(im).astype(float)
# Extract only black marker strokes. The paper remains a separate stationary layer.
alpha=np.clip((80-a[:,:,1])/55,0,1)
rgba=np.zeros((*alpha.shape,4),dtype=np.uint8); rgba[:,:,:3]=[7,18,21]; rgba[:,:,3]=(alpha*255).astype('uint8')
y,x=np.indices(alpha.shape)
forearm=(x>=573)&(y<=258)
body=rgba.copy(); body[forearm,3]=0
arm=rgba.copy(); arm[~forearm,3]=0
Image.fromarray(body).save(p/'assets/body.webp',lossless=True)
Image.fromarray(arm).save(p/'assets/arm.webp',lossless=True)
ref=Image.open('/mnt/data/79a62012-8ac5-4308-9028-75424120bebd.webp')
ref.resize((320,320)).save(p/'assets/portrait.webp',quality=85)
# A clean patch of the actual reference paper, not animated procedural noise.
ref.crop((0,0,90,90)).resize((180,180)).convert('L').save(p/'assets/paper.webp',quality=75)
print('Prepared original-character assets')
