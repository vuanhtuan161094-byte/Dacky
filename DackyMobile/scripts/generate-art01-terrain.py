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


# ART09 — approved terraced city and organic resource landscape.
# Layout/asset source is defined once, in the actual renderer, then consumed here.
import json,re
from PIL import ImageEnhance,ImageOps
root=path.parent.parent
layout=json.loads(re.search(r'CITY_R9_LAYOUT=Object\.freeze\((\{[^\n]+\})\);',(root/'src/ui.js').read_text()).group(1))
outer_ids={'lumber','quarry','farm','grove','mine','foundryfield'}
assert len(layout)==27 and len(outer_ids)==6
def save_scene(scene,target):
 buf=io.BytesIO();scene.convert('RGB').save(buf,format='WEBP',quality=93,method=6)
 b64=base64.b64encode(buf.getvalue()).decode()
 target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}"><image width="{W}" height="{H}" xlink:href="data:image/webp;base64,{b64}"/></svg>')
def ground():
 return Image.fromarray(np.uint8(np.clip(base,0,255)),'RGB').convert('RGBA')
def poly_mask(points):
 m=Image.new('L',(W,H));ImageDraw.Draw(m).polygon(points,fill=255);return m
def color_texture(rgb, strength=1):
 v=large*13+mid*12+small*7+grain*2
 arr=np.stack([np.clip(c+v*strength,0,255) for c in rgb],2)
 return Image.fromarray(arr.astype(np.uint8),'RGB').convert('RGBA')
def textured_poly(sc,points,rgb,edge=None):
 sc.paste(color_texture(rgb),(0,0),poly_mask(points))
 if edge:ImageDraw.Draw(sc).line(points+[points[0]],fill=edge,width=2,joint='curve')
def stone_surface(sc,points,rgb):
 textured_poly(sc,points,rgb,(82,91,81,255))
 mask=poly_mask(points)
 tile=Image.new('RGBA',(W,H));td=ImageDraw.Draw(tile)
 # small irregular blocks, subtle joint seams, no floating grid.
 for y in range(0,H+18,18):
  for x in range(-38,W+38,36):
   a=x+(y//18%2)*18; k=R.randint(-9,9)
   td.polygon([(a,y),(a+35,y-1),(a+42,y+17),(a+7,y+18)],fill=tuple(max(0,min(255,c+k)) for c in rgb)+(255,),outline=(111,113,100,160))
   td.line((a+2,y+1,a+32,y),fill=(213,209,184,135),width=1)
 sc.paste(tile,(0,0),mask.point(lambda v:int(v*.38)))
def shadow_poly(sc,p,dy=16):
 m=poly_mask([(x+7,y+dy) for x,y in p]).filter(ImageFilter.GaussianBlur(7))
 sc.paste(Image.new('RGBA',(W,H),(31,47,34,255)),(0,0),m.point(lambda v:int(v*.62)))
def terrace(sc,p,rgb,height=30):
 shadow_poly(sc,p,height+5);d=ImageDraw.Draw(sc,'RGBA')
 for i,a in enumerate(p):
  b=p[(i+1)%len(p)]
  if a[0]<b[0] and a[1]<=b[1]:continue
  face=[a,b,(b[0],b[1]+height),(a[0],a[1]+height)]
  d.polygon(face,fill=(91,101,92,255),outline=(59,72,64,255))
  for k in range(8,height,8):d.line((a[0],a[1]+k,b[0],b[1]+k),fill=(129,137,122,255),width=1)
 stone_surface(sc,p,rgb)
 d=ImageDraw.Draw(sc,'RGBA');d.line(p+[p[0]],fill=(202,201,177,255),width=5,joint='curve')
def plot(sc,x,y,r,stone=True):
 # Flush foundations, not a raised diamond platform underneath every building.
 if not stone:return
 p=[(x-r,y-13),(x,y-r*.43-13),(x+r,y-13),(x,y+r*.43-13)]
 d=ImageDraw.Draw(sc,'RGBA')
 d.line(p+[p[0]],fill=(133,141,126,255),width=2,joint='curve')
 for a,b in zip(p,p[1:]+p[:1]):
  d.line((a[0]+1,a[1]+2,b[0]+1,b[1]+2),fill=(193,190,165,255),width=1)
def source_stamp(sc,name,x,y,width,maxh):
 im=Image.open(root/'assets'/name).convert('RGBA')
 bbox=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
 if bbox:im=im.crop(bbox)
 im.thumbnail((width,maxh),Image.Resampling.LANCZOS)
 sc.alpha_composite(im,(round(x-im.width/2),round(y-im.height)))
def garden(sc,x,y,rx,ry):
 d=ImageDraw.Draw(sc,'RGBA')
 p=[(x-rx,y),(x,y-ry),(x+rx,y),(x,y+ry)]
 d.polygon(p,fill=(95,120,77,255),outline=(205,201,170,255),width=3)
 d.line((x-rx+6,y,x,y+ry-5,x+rx-6,y),fill=(65,87,58,255),width=2)
 # Small rocks, flowering shrubs and varied foliage, in restrained clear strips.
 for i in range(28):
  a=R.uniform(-rx*.8,rx*.8);b=R.uniform(-ry*.75,ry*.75)
  if abs(a)/rx+abs(b)/ry>.85:continue
  s=R.uniform(2,6);c=R.choice([(89,124,68,255),(132,145,76,255),(67,99,57,255),(180,132,123,255)])
  d.ellipse((x+a-s,y+b-s*.6,x+a+s,y+b+s*.6),fill=c)
def courtyard_band(sc,x,y,w,h):
 d=ImageDraw.Draw(sc,'RGBA')
 p=[(x-w/2,y),(x+w/2,y),(x+w/2+h*.27,y+h),(x-w/2-h*.27,y+h)]
 d.polygon(p,fill=(171,145,112,255),outline=(214,198,156,255),width=2)
 for k in range(4,int(h),8):
  a=w/2+k*.27;d.line((x-a,y+k,x+a,y+k),fill=(153,126,99,255),width=1)

def stair(sc,x,y,w,h):
 d=ImageDraw.Draw(sc,'RGBA')
 d.polygon([(x-w/2-8,y),(x+w/2+8,y),(x+w*.62,y+h),(x-w*.62,y+h)],fill=(103,109,99,255))
 for k in range(0,h,7):
  dx=w/2+k*.11;d.polygon([(x-dx,y+k),(x+dx,y+k),(x+dx+2,y+k+5),(x-dx-2,y+k+5)],fill=(180-k%13,178-k%9,156,255))
 d.line((x-w/2-5,y,x-w*.62,y+h),fill=(221,211,185,255),width=4);d.line((x+w/2+5,y,x+w*.62,y+h),fill=(221,211,185,255),width=4)
def road(sc,pts,width=20):
 pts=bezier(pts);m=maskline(pts,width)
 sc.paste(color_texture((117,109,79)),(0,0),maskline(pts,width+8).filter(ImageFilter.GaussianBlur(2)))
 sc.paste(color_texture((172,158,117)),(0,0),m.filter(ImageFilter.GaussianBlur(.8)))
def scatter(sc,allowed,exclude,count=400):
 # Paint foliage outside walkable terraces, depth-sort by footpoint.
 positions=[]
 for i in range(count*5):
  x=R.randint(8,W-8);y=R.randint(22,H-4)
  if not allowed(x,y) or any(math.hypot((x-a)*.9,y-b)<r for a,b,r in exclude):continue
  if any(math.hypot(x-a,y-b)<22 for a,b,_ in positions):continue
  positions.append((x,y,R.uniform(.43,1.05)))
  if len(positions)>=count:break
 for i,(x,y,s) in enumerate(sorted(positions,key=lambda p:p[1])):
  t=trees[i%len(trees)].resize((round(96*s),round(96*s)),Image.Resampling.LANCZOS)
  sc.alpha_composite(t,(round(x-t.width*.45),round(y-t.height*.70)))
def wall_segment(sc,a,b,height=23):
 d=ImageDraw.Draw(sc,'RGBA');dx=b[0]-a[0];dy=b[1]-a[1];ln=math.hypot(dx,dy);nx=-dy/ln*6;ny=dx/ln*6
 face=[a,b,(b[0],b[1]+height),(a[0],a[1]+height)]
 d.polygon(face,fill=(92,104,99,255),outline=(57,76,69,255))
 for k in range(5,height,7):d.line((a[0],a[1]+k,b[0],b[1]+k),fill=(139,149,137,255),width=1)
 d.line((a,b),fill=(200,200,177,255),width=7)
 for i in range(max(1,int(ln/23))):
  t=(i+.5)/max(1,int(ln/23));x=a[0]+t*dx;y=a[1]+t*dy
  d.rectangle((x-5,y-8,x+5,y+1),fill=(159,171,153,255),outline=(76,91,82,255))
def waterway(sc,points,width=76):
 pts=bezier(points)
 sc.paste(color_texture((144,149,104)),(0,0),maskline(pts,width+22).filter(ImageFilter.GaussianBlur(2)))
 sc.paste(color_texture((49,101,105)),(0,0),maskline(pts,width).filter(ImageFilter.GaussianBlur(1)))
 d=ImageDraw.Draw(sc,'RGBA');m=maskline(pts,width-3)
 for _ in range(2000):
  x=R.randrange(W);y=R.randrange(H)
  if m.getpixel((x,y)) and x+12<W and m.getpixel((x+12,y)):d.line((x,y,x+R.randint(4,12),y),fill=(106,151,151,130),width=1)
 return m
# ART12: rectangular, front-facing urban landscape with native architecture.
# All land anchors and gameplay remain unchanged; locked plots are not painted
# into the countryside. DOM markers disclose available land.
extra=json.loads(re.search(r'CITY_EXTRA_LAYOUT=Object\.freeze\((\{[^\n]+\})\);',(root/'src/ui.js').read_text()).group(1))
assert len(extra)==40
def rect_points(x1,y1,x2,y2):return [(x1,y1),(x2,y1),(x2,y2),(x1,y2)]
def soft_shadow(sc,box,blur=5,alpha=76):
 sh=Image.new('L',(W,H));ImageDraw.Draw(sh).ellipse(box,fill=alpha)
 sc.paste(Image.new('RGBA',(W,H),(34,45,34,255)),(0,0),sh.filter(ImageFilter.GaussianBlur(blur)))
def stone_path(sc,box,basecol=(183,174,145)):
 x1,y1,x2,y2=map(int,box);d=ImageDraw.Draw(sc,'RGBA')
 d.rounded_rectangle((x1-2,y1-1,x2+2,y2+2),radius=2,fill=(100,108,93,255))
 d.rectangle((x1,y1,x2,y2),fill=tuple(basecol)+(255,))
 for y in range(y1,y2,8):
  for x in range(x1-16,x2,19):
   xx=x+(y//8%2)*9
   l=max(x1,xx);r=min(x2,xx+18)
   if r<=l:continue
   k=R.randint(-10,10);col=tuple(max(0,min(255,c+k)) for c in basecol)+(255,)
   d.rectangle((l,y,r,min(y2,y+7)),fill=col,outline=(139,139,119,255))
   if r-l>4:d.line((l+1,y+1,r-1,y+1),fill=(min(255,col[0]+15),min(255,col[1]+15),min(255,col[2]+12),255))
def garden_strip(sc,box):
 x1,y1,x2,y2=map(int,box);d=ImageDraw.Draw(sc,'RGBA')
 d.rounded_rectangle((x1,y1,x2,y2),radius=3,fill=(72,99,66,255),outline=(139,152,112,255),width=1)
 for _ in range(max(8,(x2-x1)*(y2-y1)//24)):
  x=R.randint(x1+2,x2-2);y=R.randint(y1+2,y2-2);r=R.randint(1,3)
  d.ellipse((x-r,y-r*.6,x+r,y+r*.6),fill=R.choice([(102,128,76,255),(125,145,87,255),(83,112,70,255),(157,143,91,255)]))
def lantern(sc,x,y):
 d=ImageDraw.Draw(sc,'RGBA');d.ellipse((x-6,y-2,x+7,y+2),fill=(66,77,62,255))
 d.line((x,y,x,y-28),fill=(76,58,43,255),width=3)
 d.line((x-5,y-27,x+5,y-27),fill=(177,147,81,255),width=2)
 d.ellipse((x-5,y-26,x+5,y-16),fill=(155,66,44,255),outline=(102,45,37,255))
 d.line((x-2,y-24,x-2,y-18),fill=(229,139,69,255),width=2)
 d.rectangle((x-3,y-16,x+3,y-14),fill=(192,150,77,255))
def planted_tree(sc,x,y,scale=0.5):
 t=trees[int(x+y)%len(trees)].resize((int(96*scale),int(96*scale)),Image.Resampling.LANCZOS)
 sc.alpha_composite(t,(round(x-t.width*.47),round(y-t.height*.73)))
def court_lot(sc,x,y,r):
 # A recessed courtyard, horizontal front and planted edge; no floating platform.
 d=ImageDraw.Draw(sc,'RGBA')
 p=[(x-r*.85,y-49),(x+r*.85,y-49),(x+r,y+8),(x-r,y+8)]
 d.polygon(p,fill=(164,163,143,255),outline=(133,141,125,255))
 d.line((x-r+1,y+8,x+r-1,y+8),fill=(200,191,163,255),width=2)
 # Stone paving is intentionally very low contrast, so sprites own the scene.
 for yy in range(y-43,y+6,9):
  for xx in range(x-r+8,x+r-8,19):
   if xx<x-r*.85 or xx>x+r*.85-12:continue
   k=R.randint(-9,9);d.rectangle((xx,yy,xx+17,yy+8),fill=(164+k,163+k,143+k,255),outline=(147,151,131,255))
 for xx in (x-r+5,x+r-14):garden_strip(sc,(xx,y-28,xx+8,y+2))
inner=ground()
moat=waterway(inner,[(-70,694),(230,730),(720,746),(1210,730),(1510,682)],45)
boundary=[(115,63),(1325,63),(1370,143),(1370,674),(1298,729),(142,729),(70,674),(70,143)]
baseMask=poly_mask(boundary)
scatter(inner,lambda x,y:not baseMask.getpixel((x,y)) and not moat.getpixel((x,y)),[],125)
terrace(inner,boundary,(151,158,139),25)
terrace(inner,rect_points(153,48,1287,223),(173,173,154),25)
# District courts separated by textured avenues; the central axis is kept clear.
stone_path(inner,(631,222,809,688),(188,179,151))
for yy in (310,424,538,652):stone_path(inner,(153,yy,1287,yy+18),(177,174,151))
for yy in (227,342,456,570):
 for xx in (152,1288):garden_strip(inner,(xx-9,yy,xx+9,yy+67))
for xx in (315,480,960,1125):
 for yy in (233,347,461,575):
  garden_strip(inner,(xx-7,yy,xx+7,yy+50))
# Central procession avenue: pairs of lamps, low hedges and small carved stone medallions.
stair(inner,720,204,115,55)
d=ImageDraw.Draw(inner,'RGBA')
for yy in (304,418,532,646):
 d.ellipse((697,yy-13,743,yy+13),fill=(164,160,137,255),outline=(209,197,166,255),width=2)
 d.ellipse((704,yy-9,736,yy+9),outline=(124,137,117,255),width=1)
 d.line((712,yy,720,yy-5,728,yy,720,yy+5,712,yy),fill=(108,124,104,255),width=2)
 for xx in (646,794):lantern(inner,xx,yy-5)
for yy in (270,385,499,613):
 for xx in (619,821):garden_strip(inner,(xx-9,yy-12,xx+9,yy+12))
# Fortification has visible depth and native tower silhouettes.
for x1,x2 in [(142,640),(800,1298)]:wall_segment(inner,(x1,706),(x2,706),27)
for aa,bb in [((70,143),(70,674)),((1370,143),(1370,674)),((115,63),(1325,63))]:wall_segment(inner,aa,bb,22)
for xx in range(178,1280,125):
 if abs(xx-720)>95:lantern(inner,xx,699)
for xx,yy in [(88,144),(1352,144),(88,675),(1352,675)]:source_stamp(inner,'mobile-source/flash/city/RES_WARFLAMESTAGE_IMAGE.png',xx,yy,73,88)
for bid,(x,y,w,h,r,_) in layout.items():
 if bid not in outer_ids and bid not in ('citadel','wall'):court_lot(inner,x,y,r)
for bid,(x,y,w,h,r) in extra.items():
 if bid.startswith('i'):court_lot(inner,x,y,r)
for xx,yy in [(159,237),(1281,237),(160,350),(1280,350),(160,464),(1280,464),(160,578),(1280,578),(612,187),(828,187),(615,675),(825,675)]:
 soft_shadow(inner,(xx-16,yy-5,xx+18,yy+6),3,70);planted_tree(inner,xx,yy,.42)
# Garden entrance, small bridge and shaded edge give the walled town a setting.
stone_path(inner,(678,714,762,759),(165,164,143))
d=ImageDraw.Draw(inner,'RGBA');d.line((681,716,681,759),fill=(97,111,95,255),width=4);d.line((759,716,759,759),fill=(97,111,95,255),width=4)
save_scene(inner,path)
# Exterior: lush surveyed land in a valley, with blank land reserved for future
# building. Future lots are not hard-painted as identical green rectangles.
outer=ground()
# Mottled meadow, dry soil and vegetation on the actual ground, not flat bands.
arr=np.asarray(outer.convert('RGB'),dtype=np.float32).copy()
var=large*21+mid*13+small*10+grain*2
arr[:,:,0]+=var*.8+9;arr[:,:,1]+=var*.65+6;arr[:,:,2]+=var*.4
outer=Image.fromarray(np.uint8(np.clip(arr,0,255)),'RGB').convert('RGBA')
river=waterway(outer,[(-65,0),(80,85),(90,250),(77,450),(110,635),(196,800)],65)
# Rocky foothills textured and irregular, away from all usable sites.
for p,c in [([(1440,0),(1160,0),(1138,40),(1198,74),(1260,75),(1330,112),(1370,177),(1440,192)],(115,128,111)), ([(1440,0),(1320,0),(1285,25),(1350,67),(1410,101),(1440,113)],(156,161,140))]:
 textured_poly(outer,p,c);mask=poly_mask(p);d=ImageDraw.Draw(outer,'RGBA')
 for _ in range(250):
  x=R.randrange(1139,1440);y=R.randrange(0,192)
  if not mask.getpixel((x,y)):continue
  dx=R.randint(4,15);dy=R.randint(3,15)
  if x-dx>=0 and y+dy<H and mask.getpixel((x-dx,y+dy)):
   d.line((x,y,x-dx,y+dy),fill=R.choice([(86,108,92,255),(137,146,122,255),(165,170,143,255)]),width=R.randint(1,2))
# Paths are between, never through, buildable parcels. Earthen road edges and
# track texture make the cleared land part of the landscape.
def dirt_path(sc,points,width):
 pts=bezier(points)
 sc.paste(color_texture((112,122,80)),(0,0),maskline(pts,width+10).filter(ImageFilter.GaussianBlur(3)))
 sc.paste(color_texture((160,146,107)),(0,0),maskline(pts,width).filter(ImageFilter.GaussianBlur(.8)))
 return pts
# Gap between x=550 and x=720 plots: narrower north/south trail.
for xx in (149,635,1290):
 dirt_path(outer,[(xx,-30),(xx+2,177),(xx-2,400),(xx+2,590),(xx,790)],16 if xx==635 else 22)
for yy in (100,234,359,484,609,727):
 dirt_path(outer,[(145,yy),(430,yy+1),(720,yy-1),(1010,yy+1),(1300,yy)],17)
# Natural field grass, scattered wildflowers and clumps, while keeping building
# anchor footprints usable; no permanent crop art on unbuilt land.
d=ImageDraw.Draw(outer,'RGBA')
for _ in range(2800):
 x=R.randrange(0,W);y=R.randrange(0,H)
 if river.getpixel((x,y)) or abs(x-635)<13 or min(abs(y-yy) for yy in (100,234,359,484,609,727))<12:continue
 if x>1130 and y<120:continue
 c=R.choice([(110,133,76,255),(79,110,61,255),(141,147,87,255),(96,123,69,255)])
 dx=R.randint(1,3);d.line((x,y,x+dx,y-R.randint(2,5)),fill=c,width=1)
all_ex=[(v[0],v[1],v[4]+14) for k,v in layout.items() if k in outer_ids]+[(v[0],v[1],v[4]+14) for k,v in extra.items() if k.startswith('o')]
scatter(outer,lambda x,y:not river.getpixel((x,y)) and (x<180 or x>1300 or y<25 or (y<100 and x<300)),all_ex,165)
# Entry bridge from the inner city and decorative watch pavilion.
d=ImageDraw.Draw(outer,'RGBA');d.rectangle((23,117,145,137),fill=(144,111,68,255),outline=(83,76,49,255))
for xx in range(28,145,9):d.line((xx,118,xx,136),fill=(186,151,93,255),width=2)
d.line((24,117,145,117),fill=(91,76,51,255),width=3);d.line((24,137,145,137),fill=(91,76,51,255),width=3)
source_stamp(outer,'mobile-source/flash/city/RES_WARFLAMESTAGE_IMAGE.png',158,75,68,78)
save_scene(outer,path.with_name('art01-outer-ground.svg'))
# Build-normalize native source sprites: trim transparent margins, preserve silhouette,
# mild uniform tonal grade, fixed bottom anchor and bounded output resolution.
dst=root/'assets/art09-buildings';dst.mkdir(exist_ok=True)
manifest={}
for bid,(x,y,w,h,r,source) in layout.items():
 original=root/'assets'/source
 im=Image.open(original).convert('RGBA')
 alpha=im.getchannel('A');bbox=alpha.point(lambda v:255 if v>12 else 0).getbbox()
 if bbox: im=im.crop(bbox)
 alpha=im.getchannel('A');rgb=im.convert('RGB')
 rgb=ImageEnhance.Color(rgb).enhance(.92);rgb=ImageEnhance.Contrast(rgb).enhance(1.04)
 im=rgb.convert('RGBA');im.putalpha(alpha)
 # Built farm uses a detailed isometric cultivated field rather than magnifying
 # the low-resolution source raster. Other assets retain native silhouette.
 if bid=='farm':
  # Front-aligned cultivated land: shaded soil, irrigation channel and
  # individual stalk clusters. Source farm remains the reference silhouette.
  im=Image.new('RGBA',(520,300));d=ImageDraw.Draw(im,'RGBA')
  p=[(70,40),(450,40),(506,251),(14,251)]
  d.polygon([(x+2,y+12) for x,y in p],fill=(54,70,44,155))
  d.polygon(p,fill=(119,105,58,255),outline=(166,151,93,255),width=5)
  d.polygon([(78,48),(442,48),(494,241),(26,241)],fill=(89,107,52,255),outline=(75,86,43,255),width=2)
  for i in range(10):
   t=(i+.5)/10;back=86+t*348;front=30+t*460
   d.line((back,51,front,239),fill=(146,121,66,255),width=9)
   d.line((back+3,51,front+3,239),fill=(53,79,38,255),width=5)
   for j in range(21):
    v=(j+.5)/21;x=back+(front-back)*v+R.randint(-3,3);y=55+v*180
    size=4+v*6
    d.line((x,y,x-3,y-size),fill=(73,114,42,255),width=2)
    d.line((x,y,x+4,y-size*.9),fill=(145,159,62,255),width=2)
    d.line((x,y,x,y-size*1.4),fill=(204,179,81,255),width=2)
    d.ellipse((x-1,y-size*1.4-2,x+1,y-size*1.4+1),fill=(223,190,94,255))
  # Low stone-lined irrigation ditch across the foot of the field.
  d.polygon([(28,225),(493,225),(498,243),(22,243)],fill=(133,144,118,255))
  d.polygon([(30,228),(491,228),(493,239),(27,239)],fill=(61,121,116,255))
  for xx in range(36,486,15):d.line((xx,232,xx+8,232),fill=(112,165,149,255),width=1)
  d.line((14,251,506,251),fill=(181,159,98,255),width=4)
  im=im.crop(im.getbbox())
 elif bid=='wall':
  # A proper multi-storey gate with source-derived tiled roof and masonry.
  im=Image.new('RGBA',(390,280));d=ImageDraw.Draw(im,'RGBA')
  d.polygon([(18,141),(195,87),(372,141),(372,223),(195,274),(18,223)],fill=(100,114,103,255),outline=(58,80,68,255),width=3)
  d.polygon([(18,141),(195,87),(372,141),(195,198)],fill=(172,173,146,255),outline=(107,124,104,255),width=3)
  for k in range(7,80,10):
   d.line((19,141+k,195,198+k,371,141+k),fill=(143,149,126,255),width=2)
   for xx in range(40,190,30):
    yy=141+k+(xx-19)*57/176;d.line((xx,yy,xx,yy+9),fill=(72,92,80,255),width=1)
   for xx in range(213,370,30):
    yy=198+k-(xx-195)*57/176;d.line((xx,yy,xx,yy+9),fill=(72,92,80,255),width=1)
  d.polygon([(143,251),(143,211),(165,187),(195,178),(225,187),(247,211),(247,251),(195,267)],fill=(44,53,48,255),outline=(193,179,143,255),width=4)
  d.line((195,196,195,267),fill=(105,78,49,255),width=3)
  for xx in (169,221):d.ellipse((xx-3,229,xx+3,235),fill=(191,155,75,255))
  # Roof/upper pavilion from native DAK source, preserving its detailed art.
  roof=Image.open(root/'assets/mobile-source/flash/city/RES_DAK_IMAGE.png').convert('RGBA')
  rb=roof.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
  if rb:roof=roof.crop(rb)
  roof=roof.resize((268,round(roof.height*268/roof.width)),Image.Resampling.LANCZOS)
  roof=roof.crop((0,0,roof.width,round(roof.height*.87)))
  im.alpha_composite(roof,(61,13))
  im=im.crop(im.getbbox())
 im.thumbnail((640,560),Image.Resampling.LANCZOS)
 im.save(dst/(bid+'.webp'),format='WEBP',quality=93,method=6)
 manifest[bid]={'source':source,'pixelSize':list(im.size),'foot':[x,y],'display':[w,h],'transformation':('custom terrain-aligned farm; native-roof stone gate; source reference' if bid in ('farm','wall') else 'alpha trim, bounded resample, common tonal grade')}
(dst/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('ART09:',len(manifest),'normalized source-derived sprites; two terrain scenes')
