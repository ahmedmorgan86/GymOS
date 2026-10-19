from pathlib import Path
from PIL import Image,ImageDraw
out=Path('public/icons');out.mkdir(exist_ok=True)
im=Image.new('RGBA',(2048,2048));d=ImageDraw.Draw(im);scale=32
d.rounded_rectangle((0,0,2047,2047),radius=18*scale,fill='#7955f6')
for x,y1,y2 in [(15,24,40),(22,19,45),(42,19,45),(49,24,40)]:
 d.line((x*scale,y1*scale,x*scale,y2*scale),fill='white',width=5*scale)
 for y in [y1,y2]:d.ellipse(((x-2.5)*scale,(y-2.5)*scale,(x+2.5)*scale,(y+2.5)*scale),fill='white')
d.line((22*scale,32*scale,42*scale,32*scale),fill='white',width=5*scale)
for size in [32,64,180,192,256,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(out/f'icon-{size}.png')
im.resize((256,256),Image.Resampling.LANCZOS).save('public/favicon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
Path('windows/GymOS.ico').write_bytes(Path('public/favicon.ico').read_bytes())
mask=Image.new('RGBA',(512,512),'#7955f6');mask.alpha_composite(im.resize((400,400),Image.Resampling.LANCZOS),(56,56));mask.save(out/'maskable-512.png')
