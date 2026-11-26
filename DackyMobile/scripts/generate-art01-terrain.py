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
inner=ground()
# Approved shape: broad hexagonal walled city, palace on high rear terrace,
# civic wings around a clear central axis, military front near the main gate.
moat=waterway(inner,[(-80,610),(190,655),(390,739),(710,751),(1060,735),(1350,650),(1520,550)],62)
boundary=[(720,48),(1260,162),(1390,350),(1230,626),(720,731),(210,626),(50,350),(180,162)]
baseMask=poly_mask(boundary)
scatter(inner,lambda x,y:not baseMask.getpixel((x,y)) and not moat.getpixel((x,y)),[],180)
terrace(inner,boundary,(156,162,146),24)
midTerrace=[(720,111),(1170,209),(1240,341),(1130,484),(720,558),(310,484),(200,341),(270,209)]
terrace(inner,midTerrace,(168,170,151),23)
upper=[(720,73),(1065,151),(1105,230),(720,302),(335,230),(375,151)]
terrace(inner,upper,(179,181,161),29)
# Three flights lead down from palace to civic plaza and military court.
stair(inner,720,282,110,52);stair(inner,720,475,118,58)
d=ImageDraw.Draw(inner,'RGBA')
# ceremonial axis, central plaza, ornamental paths and shallow pools
d.polygon([(720,338),(859,383),(720,430),(581,383)],fill=(187,185,162,255),outline=(118,133,122,255),width=2)
d.ellipse((676,351,764,397),fill=(143,153,138,255),outline=(224,215,188,255),width=3)
d.ellipse((688,357,752,391),fill=(74,128,128,255),outline=(104,159,155,255),width=2)
for x in (563,877):
 d.polygon([(x-29,302),(x,287),(x+29,302),(x,318)],fill=(89,133,129,255),outline=(217,206,175,255),width=3)
# The approved central axis is a real procession path, with landscaped wings.
courtyard_band(inner,720,325,70,31)
courtyard_band(inner,720,404,85,71)
courtyard_band(inner,720,572,80,96)
for x,y,rx,ry in [(550,262,48,19),(890,262,48,19),(345,379,46,18),(1095,379,46,18),(545,410,38,15),(895,410,38,15),(390,511,47,18),(1050,511,47,18),(610,580,34,14),(830,580,34,14),(350,676,36,15),(1090,676,36,15)]:
 garden(inner,x,y,rx,ry)
# walls along the visible front; split at the entrance to leave gate access.
for a,b in [(boundary[2],boundary[3]),(boundary[3],(820,710)),((620,710),boundary[5]),(boundary[5],boundary[6]),(boundary[6],boundary[7]),(boundary[1],boundary[2])]:wall_segment(inner,a,b,21)
# Towers at wall corners; no building asset hidden behind a foreground wall.
d=ImageDraw.Draw(inner,'RGBA')
for x,y in [(1260,162),(1390,350),(1230,626),(210,626),(50,350),(180,162)]:
 d.rectangle((x-18,y-13,x+18,y+15),fill=(124,139,129,255),outline=(65,85,76,255),width=2)
 d.polygon([(x-25,y-13),(x,y-28),(x+25,y-13),(x,y)],fill=(65,103,91,255),outline=(192,188,152,255),width=2)
for bid,(x,y,w,h,r,source) in layout.items():
 if bid in outer_ids:continue
 plot(inner,x,y,r,True)
# Architecture at the walls: actual native roofed tower art, decorative only.
for x,y in [(180,187),(1260,187),(63,379),(1377,379),(224,650),(1216,650)]:
 source_stamp(inner,'mobile-source/flash/city/RES_WARFLAMESTAGE_IMAGE.png',x,y,56,72)
# Rear gate approach and two planted pairs around the ceremonial stair.
for x,y in [(575,290),(865,290),(564,469),(876,469),(596,539),(844,539)]:
 t=trees[int(x+y)%len(trees)].resize((48,48),Image.Resampling.LANCZOS)
 inner.alpha_composite(t,(x-24,y-34))
# Deliberate ornamental trees between districts, placed only clear of lot centers.
inner_ex=[(v[0],v[1],v[4]+17) for k,v in layout.items() if k not in outer_ids]
scatter(inner,lambda x,y:bool(baseMask.getpixel((x,y))) and abs(x-720)>95 and (x<220 or x>1220 or 255<y<285 or 468<y<506),inner_ex,23)
save_scene(inner,path)
# Outside: woodland left, hills/mineral deposits right, irrigated fields front.
outer=ground()
river=waterway(outer,[(-30,55),(165,140),(380,285),(440,420),(367,570),(490,800)],83)
# Mountain foothills: weathered multi-plane rock, irregular ridges and texture.
for p,c in [
 ([(1440,0),(1154,0),(1109,37),(1040,58),(1022,100),(1071,151),(1144,183),(1265,202),(1348,168),(1440,137)],(111,123,103)),
 ([(1440,0),(1240,0),(1200,25),(1160,70),(1208,109),(1290,142),(1440,90)],(147,153,132)),
 ([(1120,28),(1077,53),(1020,70),(970,92),(1000,159),(1048,146),(1090,118),(1160,170),(1240,83)],(128,139,119))]:
 textured_poly(outer,p,c)
 mask=poly_mask(p)
 d=ImageDraw.Draw(outer,'RGBA')
 for j in range(140):
  x=R.randint(965,1435);y=R.randint(0,195)
  if not mask.getpixel((x,y)):continue
  ln=R.randint(5,25);b=min(H-1,y+ln)
  if x-ln>0 and mask.getpixel((x-ln,b)):d.line((x,y,x-ln,b),fill=R.choice([(88,106,89,255),(154,161,141,255),(109,124,104,255)]),width=R.randint(1,3))
 for x,y in [(1040,132),(1134,97),(1320,149),(1390,91)]:
  if mask.getpixel((x,y)):d.ellipse((x-12,y-4,x+12,y+4),fill=(93,118,77,255))

road(outer,[(720,35),(720,160),(650,295),(695,516),(845,620),(1110,600)],29)
road(outer,[(650,295),(880,248),(1120,184),(1110,363),(1110,600)],24)
road(outer,[(650,295),(500,330),(275,230),(175,410)],24)
d=ImageDraw.Draw(outer,'RGBA')
# crossing on the woodland route
d.polygon([(350,284),(381,263),(471,326),(441,347)],fill=(115,82,47,255),outline=(73,60,42,255),width=3)
for i in range(12):
 x=355+i*7.2;y=280+i*5.4;d.line((x,y,x+28,y-20),fill=(184,148,97,255),width=4)
# Irrigated cultivated parcels around the farm instead of identical platforms.
for cx,cy,rx,ry in [(565,478,78,39),(692,519,116,56),(810,477,85,41),(690,612,109,51),(795,575,65,32)]:
 p=[(cx-rx,cy),(cx,cy-ry),(cx+rx,cy),(cx,cy+ry)]
 textured_poly(outer,p,(147,137,68),(190,172,111,255));d=ImageDraw.Draw(outer,'RGBA');m=poly_mask(p);rows=Image.new('RGBA',(W,H));rd=ImageDraw.Draw(rows)
 for j in range(-14,15):
  x=cx+j*12;rd.line((x-80,cy-70,x+80,cy+70),fill=(96,113,54,255),width=5);rd.line((x-83,cy-70,x+77,cy+70),fill=(181,167,89,255),width=1)
 outer.paste(rows,(0,0),Image.fromarray(np.minimum(np.asarray(m),np.asarray(rows.getchannel('A'))).astype('uint8')))
# Irrigation channels and planting rows follow the parcel geometry.
d=ImageDraw.Draw(outer,'RGBA')
d.line([(565,448),(691,510),(810,447)],fill=(59,108,107,255),width=5)
d.line([(692,558),(795,607)],fill=(70,115,110,255),width=4)
# An actual road entrance connects both views (decorative, not an extra lot).
source_stamp(outer,'mobile-source/flash/city/RES_WARFLAMESTAGE_IMAGE.png',720,80,66,86)
# exposed veins, stone rubble and ore piles surrounding the two mines.
d=ImageDraw.Draw(outer,'RGBA')
for bid in ('quarry','mine','foundryfield'):
 x,y,w,h,r,_=layout[bid]
 for j in range(35):
  a=x+R.randint(-r-35,r+35);b=y+R.randint(-45,38)
  if not(10<a<W-10 and 10<b<H-10):continue
  s=R.randint(4,17)
  d.polygon([(a-s,b),(a-s//2,b-s),(a+s//2,b-s-2),(a+s,b),(a,b+s//2)],fill=(130,139,124,255),outline=(88,101,91,255))
  d.polygon([(a-s//2,b-s),(a+s//2,b-s-2),(a+s,b),(a,b-2)],fill=(177,183,161,255))
for bid,(x,y,w,h,r,_) in layout.items():
 if bid in outer_ids:plot(outer,x,y,r,False)
outer_ex=[(v[0],v[1],v[4]+30) for k,v in layout.items() if k in outer_ids]
scatter(outer,lambda x,y:not river.getpixel((x,y)) and (x<355 or x>1270 or y<90 or (x<590 and y>625)),outer_ex,205)
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
  im=Image.new('RGBA',(500,265));d=ImageDraw.Draw(im,'RGBA')
  p=[(12,142),(248,30),(486,142),(248,254)]
  d.polygon(p,fill=(108,115,62,255),outline=(149,149,97,255),width=4)
  for j in range(11):
   a=20+j*20;b=146+j*9.5
   d.line((a,b,a+226,b-107),fill=(153,133,70,255),width=8)
   d.line((a,b+3,a+226,b-104),fill=(60,92,46,255),width=4)
   for n in range(23):
    t=n/22;xx=a+226*t;yy=b-107*t
    d.line((xx,yy,xx+2,yy-8),fill=(114,151,65,255),width=2)
    d.line((xx,yy-4,xx-3,yy-9),fill=(192,174,76,255),width=1)
  d.line(p+[p[0]],fill=(180,165,105,255),width=2)
  im=im.crop(im.getbbox())
 elif bid=='wall':
  # A gate, not a duplicate city fortress. Native roof palette and stone piers.
  im=Image.new('RGBA',(320,245));d=ImageDraw.Draw(im,'RGBA')
  d.polygon([(32,138),(160,80),(286,138),(286,188),(160,242),(32,188)],fill=(102,117,108,255),outline=(63,85,73,255),width=3)
  d.polygon([(32,138),(160,80),(286,138),(160,193)],fill=(184,182,153,255),outline=(111,126,109,255),width=3)
  for k in range(5,45,10):
   d.line((33,138+k,160,193+k,286,138+k),fill=(147,150,129,255),width=2)
  d.polygon([(121,188),(121,160),(160,144),(199,161),(199,221),(160,240),(121,221)],fill=(49,62,56,255),outline=(170,159,124,255),width=3)
  d.polygon([(72,93),(160,53),(249,93),(160,136)],fill=(166,149,115,255))
  d.polygon([(62,87),(160,38),(258,87),(160,117)],fill=(53,96,87,255),outline=(204,183,128,255),width=3)
  for j in range(1,10):
   t=j/10;d.line((62+98*t,87-49*t,160+98*t,117-30*t),fill=(94,139,121,255),width=2)
  d.polygon([(92,53),(160,17),(228,53),(160,82)],fill=(62,108,93,255),outline=(215,188,130,255),width=3)
  d.line((160,17,160,7),fill=(219,187,106,255),width=4)
  im=im.crop(im.getbbox())
 im.thumbnail((640,560),Image.Resampling.LANCZOS)
 im.save(dst/(bid+'.webp'),format='WEBP',quality=93,method=6)
 manifest[bid]={'source':source,'pixelSize':list(im.size),'foot':[x,y],'display':[w,h],'transformation':('custom terrain-aligned isometric farm/gate sprite; source reference' if bid in ('farm','wall') else 'alpha trim, bounded resample, common tonal grade')}
(dst/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('ART09:',len(manifest),'normalized source-derived sprites; two terrain scenes')
