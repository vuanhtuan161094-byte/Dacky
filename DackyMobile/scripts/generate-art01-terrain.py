import math,random,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
W,H=1440,760
R=random.Random(413);N=np.random.default_rng(413)
P=[(720,335),(1060,338),(505,225),(170,375),(1240,245),(1150,525),(420,420),(850,165),(515,136),(925,310),(1180,390),(1030,465),(720,566),(1250,145),(375,255),(210,535),(130,175),(1290,550),(1240,650),(390,130),(1060,160),(530,375),(620,482),(860,470),(960,600),(1090,640),(1190,310)]
Y,X=np.mgrid[0:H,0:W]
def noise(w,h):
 a=N.integers(0,256,(h,w),dtype=np.uint8);return np.asarray(Image.fromarray(a).resize((W,H),Image.Resampling.BICUBIC),dtype=np.float32)/255-.5
large=noise(13,8);mid=noise(49,28);small=noise(180,100);grain=N.normal(0,1,(H,W))
dist=np.sqrt(((X-720)/710)**2+((Y-340)/480)**2)
shade=large*33+mid*17+small*10+grain*2.2-8*dist
meadow=np.clip(1-dist,0,1)
base=np.stack([90+30*meadow+shade,111+23*meadow+shade,66+17*meadow+shade*.76],2)
img=Image.fromarray(np.uint8(np.clip(base,0,255)),'RGB').convert('RGBA')
def bezier(points):
 a=[points[0]]+points+[points[-1]];out=[]
 for i in range(1,len(a)-2):
  for t in np.linspace(0,1,35):
   p0,p1,p2,p3=[np.array(v) for v in a[i-1:i+3]];v=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);out.append(tuple(v))
 return out
def maskline(path,width):
 m=Image.new('L',(W,H));d=ImageDraw.Draw(m);d.line(path,fill=255,width=width,joint='curve');r=width//2
 for x,y in [path[0],path[-1]]:d.ellipse((x-r,y-r,x+r,y+r),fill=255)
 return m
river=bezier([(-80,520),(90,528),(230,625),(400,684),(600,681),(780,637),(925,660),(1120,699),(1310,630),(1510,530)])
riverbank=maskline(river,95);watermask=maskline(river,72);bank=Image.new('RGBA',(W,H),(159,151,103,255));img.paste(bank,(0,0),riverbank.filter(ImageFilter.GaussianBlur(2)))
wshade=large*21+mid*14+small*9+grain*1.5
water=np.stack([38+wshade,91+wshade,89+wshade],2);water=Image.fromarray(np.uint8(np.clip(water,0,255)),'RGB').convert('RGBA');wd=ImageDraw.Draw(water,'RGBA')
for i in range(3600):
 x=R.randrange(W);y=R.randrange(H)
 if watermask.getpixel((x,y))>0:
  w=R.randint(3,28);wd.line((x,y,x+w,y+R.choice([0,1,-1])),fill=(167,195,169,R.randint(15,65)),width=1)
img.paste(water,(0,0),watermask.filter(ImageFilter.GaussianBlur(.9)))
paths=[[(100,310),(315,319),(460,359),(645,406),(815,380),(1030,321),(1375,338)],[(350,95),(440,220),(535,309),(650,430),(720,566),(735,680)],[(850,85),(825,215),(855,347),(860,470),(960,558),(1150,600)],[(170,535),(290,488),(420,420),(530,375),(650,410)],[(1030,465),(1120,470),(1230,530),(1280,640)],[(375,255),(505,225),(690,195),(850,165),(1060,160),(1250,145)]]
roadmask=Image.new('L',(W,H));d=ImageDraw.Draw(roadmask)
for i,path in enumerate(paths):
 p=bezier(path);w=39 if i==0 else 24;d.line(p,fill=255,width=w,joint='curve')
 for x,y in [p[0],p[-1]]:d.ellipse((x-w/2,y-w/2,x+w/2,y+w/2),fill=255)
rd=ImageDraw.Draw(roadmask);rd.ellipse((549,245,895,405),fill=255)
for i,(x,y) in enumerate(P):
 if i==0:continue
 rx=R.randint(30,50);ry=R.randint(13,24);rd.ellipse((x-rx,y-ry,x+rx,y+ry),fill=180)
road=np.stack([159+large*17+mid*17+small*14+grain*3,145+large*15+mid*14+small*12+grain*3,111+large*12+mid*11+small*12+grain*2],2);road=Image.fromarray(np.uint8(np.clip(road,0,255)),'RGB').convert('RGBA');dr=ImageDraw.Draw(road,'RGBA')
for y in range(-20,H+20,10):
 for x in range(-20,W+20,18):
  xx=x+(y//10%2)*9+R.randint(-2,2);yy=y+R.randint(-2,2)
  if not(0<=xx<W and 0<=yy<H) or roadmask.getpixel((xx,yy))<140:continue
  a=R.randint(15,21);b=R.randint(7,10);v=R.randint(-12,12)
  dr.polygon([(xx,yy),(xx+a,yy+R.randint(-2,2)),(xx+a+2,yy+b),(xx+1,yy+b+R.randint(-2,2))],fill=(165+v,151+v,119+v,210),outline=(108+v,99+v,77+v,90));dr.line((xx+1,yy+1,xx+a-1,yy+1),fill=(210,191,150,115),width=1)
edge=roadmask.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(3));img.paste(Image.new('RGBA',(W,H),(101,103,67,255)),(0,0),edge.point(lambda v:int(v*.53)));img.paste(road,(0,0),roadmask.filter(ImageFilter.GaussianBlur(1.1)))
D=ImageDraw.Draw(img,'RGBA')
for i in range(12000):
 x=R.randrange(W);y=R.randrange(H)
 if roadmask.getpixel((x,y))>80 or watermask.getpixel((x,y))>30:continue
 c=R.choice([(52,79,42,75),(151,159,85,80),(179,167,108,45),(45,69,38,65)])
 D.line((x,y,x+R.randint(-2,3),y-R.randint(1,5)),fill=c,width=1)
D.polygon([(705,630),(746,633),(750,708),(710,706)],fill=(55,55,43,150));D.polygon([(699,627),(735,629),(741,705),(705,702)],fill=(103,78,48,255))
for i in range(17):
 y=628+i*4.5;D.line((701+(y-628)*.075,y,736+(y-628)*.075,y+1),fill=(169,136,83,255),width=3)
D.line((701,625,706,703),fill=(76,56,37,255),width=3);D.line((737,627,742,706),fill=(76,56,37,255),width=3)
def tree(scale=1,kind=0):
 s=96;im=Image.new('RGBA',(s,s));d=ImageDraw.Draw(im,'RGBA');cx=46;cy=56
 d.ellipse((26,58,87,77),fill=(22,37,24,110));d.line((45,65,43,35),fill=(92,69,40,255),width=5)
 centers=[(43,19,15),(29,34,18),(55,33,22),(42,48,24),(65,47,15)] if kind else [(44,21,18),(25,33,16),(61,33,18),(34,49,22),(57,49,19)]
 for a,b,r in centers:
  poly=[]
  for k in range(38):
   t=k*2*math.pi/38;rr=r*R.uniform(.84,1.15);poly.append((a+math.cos(t)*rr,b+math.sin(t)*rr*.76))
  d.polygon(poly,fill=(34,66,37,255))
 for a,b,r in centers:
  for j in range(90):
   ang=R.random()*math.tau;rr=r*math.sqrt(R.random());x=a+math.cos(ang)*rr;y=b+math.sin(ang)*rr*.7
   light=max(0,min(1,.56+(a-x+b-y)/max(r,1)*.23+R.uniform(-.20,.2)));v=R.randint(-10,10);col=(int(45+75*light+v),int(75+71*light+v),int(35+34*light+v*.7),255)
   r0=R.uniform(1.0,3.6);d.ellipse((x-r0,y-r0*.65,x+r0,y+r0*.65),fill=col)
 return im.resize((round(s*scale),round(s*scale)),Image.Resampling.LANCZOS)
trees=[tree(1,i%2) for i in range(10)]
places=[]
for i in range(450):
 x=R.uniform(0,W);y=R.uniform(32,H-7)
 if roadmask.getpixel((int(x),int(y)))>25 or watermask.getpixel((int(x),int(y)))>5:continue
 if any(math.hypot((x-a)*.95,y-b)<(110 if j==0 else 65) for j,(a,b) in enumerate(P)):continue
 if any(math.hypot(x-a,y-b)<23 for a,b,_ in places):continue
 if 300<x<1150 and 110<y<550 and R.random()<.76:continue
 places.append((x,y,R.uniform(.54,1.05)))
for i,(x,y,s) in enumerate(sorted(places,key=lambda p:p[1])):
 t=trees[i%len(trees)].resize((round(96*s),round(96*s)),Image.Resampling.LANCZOS);img.alpha_composite(t,(round(x-t.width*.45),round(y-t.height*.69)))
D=ImageDraw.Draw(img,'RGBA')
for i in range(125):
 x=R.randrange(W);y=R.randrange(H)
 if roadmask.getpixel((x,y))>25 or watermask.getpixel((x,y))>5 or any(math.hypot(x-a,y-b)<70 for a,b in P):continue
 r=R.randint(3,12);D.ellipse((x-r,y-r/3,x+r*1.5,y+r/2),fill=(28,49,33,100));D.polygon([(x-r,y),(x-r*.7,y-r*.8),(x+.1*r,y-r*1.1),(x+r,y-r*.5),(x+r*.8,y+r*.2),(x-r*.2,y+r*.35)],fill=(111,114,92,255));D.polygon([(x-r*.7,y-r*.8),(x+.1*r,y-r*1.1),(x+r,y-r*.5),(x,y-r*.3)],fill=(163,164,133,255));D.polygon([(x,y-r*.3),(x+r,y-r*.5),(x+r*.8,y+r*.2),(x-r*.2,y+r*.35)],fill=(80,89,72,255))
a=np.asarray(img.convert('RGB'),dtype=np.float32);v=np.clip((dist-.65)*.30,0,.23);a=a*(1-v[:,:,None]);out=Image.fromarray(np.uint8(np.clip(a,0,255)),'RGB')
path=Path(sys.argv[1] if len(sys.argv)>1 else 'assets/art01-city-ground.svg');path.parent.mkdir(parents=True,exist_ok=True)
import io,base64
buf=io.BytesIO();out.save(buf,format='WEBP',quality=88,method=6);b64=base64.b64encode(buf.getvalue()).decode();path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}"><image width="{W}" height="{H}" xlink:href="data:image/webp;base64,{b64}"/></svg>')
print(path,len(buf.getvalue()),'bytes')

# ART06: separate inner stone courtyard and outer resource plots.
# Reuse the deterministic terrain/noise/tree palette; no benchmark screenshot is shipped.
def save_scene(scene,target):
 buf=io.BytesIO();scene.convert('RGB').save(buf,format='WEBP',quality=91,method=6)
 b64=base64.b64encode(buf.getvalue()).decode()
 target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}"><image width="{W}" height="{H}" xlink:href="data:image/webp;base64,{b64}"/></svg>')
def project(u,v):
 return (720+(u-v)*124,378+(u+v-4)*66)
def diamond(u,v,r=.47):
 return [project(u-r,v-r),project(u+r,v-r),project(u+r,v+r),project(u-r,v+r)]
def polygon_scene():
 sc=Image.fromarray(np.uint8(np.clip(base,0,255)),'RGB').convert('RGBA')
 sc.paste(bank,(0,0),riverbank.filter(ImageFilter.GaussianBlur(2)))
 sc.paste(water,(0,0),watermask.filter(ImageFilter.GaussianBlur(.9)))
 return sc
inner=polygon_scene()
# Stone plinth with stepped outer boundary and raised rim.
shape=[project(-.67,-.67),project(4.67,-.67),project(4.67,4.67),project(-.67,4.67)]
mask=Image.new('L',(W,H));ImageDraw.Draw(mask).polygon(shape,fill=255)
shadow=Image.new('L',(W,H));ImageDraw.Draw(shadow).polygon([(x+8,y+20) for x,y in shape],fill=200)
inner.paste(Image.new('RGBA',(W,H),(31,49,39,255)),(0,0),shadow.filter(ImageFilter.GaussianBlur(8)))
d=ImageDraw.Draw(inner,'RGBA')
for i in range(4):
 a,b=shape[i],shape[(i+1)%4];d.polygon([a,b,(b[0],b[1]+15),(a[0],a[1]+15)],fill=(83,98,94,255),outline=(43,61,55,255))
# Warm grey paved base, individual weathered stone slabs following isometric axes.
stone=np.stack([143+large*17+mid*13+small*8+grain*2,150+large*15+mid*13+small*8+grain*2,143+large*15+mid*10+small*8+grain*2],2)
stone=Image.fromarray(np.uint8(np.clip(stone,0,255)),'RGB').convert('RGBA')
sd=ImageDraw.Draw(stone,'RGBA')
for u in np.arange(-.7,4.8,.12):
 for v in np.arange(-.7,4.8,.12):
  p=[project(u,v),project(u+.12,v),project(u+.12,v+.12),project(u,v+.12)]
  k=R.randint(-13,13);sd.polygon(p,fill=(147+k,155+k,148+k,255),outline=(110+k,123+k,116+k,255));sd.line([p[0],p[1]],fill=(191+k,196+k,182+k,255),width=1)
inner.paste(stone,(0,0),mask)
d=ImageDraw.Draw(inner,'RGBA')
d.line(shape+[shape[0]],fill=(203,199,178,255),width=14,joint='curve')
d.line(shape+[shape[0]],fill=(87,110,106,255),width=3,joint='curve')
# Plots have jade-grey frames, not brown floating circular pads.
for u in range(5):
 for v in range(5):
  if (u,v) in [(1,2),(2,1),(2,3),(3,2),(2,2)]:continue
  p=diamond(u,v,.435);d.polygon(p,fill=(109,132,126,255),outline=(62,85,81,255),width=2)
  q=diamond(u,v,.36);d.polygon(q,fill=(155,166,154,255),outline=(190,201,182,255),width=2)
  for k in [.12,.24]:
   a=project(u-.36,v-.36+k);b=project(u+.36,v-.36+k);d.line((a,b),fill=(123,144,137,180),width=1)
   a=project(u-.36+k,v-.36);b=project(u-.36+k,v+.36);d.line((a,b),fill=(123,144,137,180),width=1)
d.polygon(diamond(2,2,.76),fill=(82,126,122,255),outline=(211,207,178,255),width=4)
d.polygon(diamond(2,2,.64),fill=(117,155,145,255),outline=(43,81,77,255),width=2)
# Stone access bridges, outside grounds and decorative pillars.
for a,b in [((720,35),(720,100)),((720,650),(720,754)),((22,378),(78,378)),((1362,378),(1430,378))]:
 d.line((a,b),fill=(85,93,79,255),width=62);d.line((a,b),fill=(174,174,153,255),width=50)
for x,y in [(720,34),(58,378),(1382,378),(720,724)]:
 d.rounded_rectangle((x-14,y-18,x+14,y+10),radius=2,fill=(137,148,133,255),outline=(63,78,68,255),width=2)
 d.polygon([(x-18,y-18),(x,y-28),(x+18,y-18),(x,y-8)],fill=(193,195,163,255),outline=(75,86,74,255))
for i,(x,y,s) in enumerate(sorted(places,key=lambda p:p[1])):
 if mask.getpixel((int(x),int(y)))>0 or (y<110 and abs(x-720)<90) or (y>635 and abs(x-720)<65):continue
 t=trees[i%len(trees)].resize((round(96*s),round(96*s)),Image.Resampling.LANCZOS);inner.alpha_composite(t,(round(x-t.width*.45),round(y-t.height*.69)))
save_scene(inner,path)
outer=polygon_scene()
od=ImageDraw.Draw(outer,'RGBA')
outer_pts=[[610,194.5],[830,311.5],[1050,428.5],[390,311.5],[610,428.5],[830,545.5]]
for i,(x,y) in enumerate(outer_pts):
 # Isometric agricultural parcels, stone/grassy verge and worn paths.
 p=[(x-106,y),(x,y-58),(x+106,y),(x,y+58)]
 od.polygon([(a+5,b+9) for a,b in p],fill=(69,83,49,180))
 od.polygon(p,fill=(139,142,88,255),outline=(169,167,117,255),width=3)
 q=[(x-88,y),(x,y-46),(x+88,y),(x,y+46)]
 od.polygon(q,fill=(122,128,74,255),outline=(98,112,67,255))
 for k in range(-4,5):
  a=(x-58+k*10,y-5+k*5);b=(x+21+k*10,y+33+k*5)
  od.line((a,b),fill=(157,154,97,160),width=2)
for i,(x,y,s) in enumerate(sorted(places,key=lambda p:p[1])):
 if any(math.hypot((x-a)*.85,y-b)<117 for a,b in outer_pts):continue
 t=trees[i%len(trees)].resize((round(96*s),round(96*s)),Image.Resampling.LANCZOS);outer.alpha_composite(t,(round(x-t.width*.45),round(y-t.height*.69)))
save_scene(outer,path.with_name('art01-outer-ground.svg'))
