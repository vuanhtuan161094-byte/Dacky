"""ART14: deterministic high-resolution terrain and independent architecture renders.
Only visual assets are changed. Plot coordinates, engine and saves are untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import base64, hashlib, io, json, math, random, re

ROOT=Path(__file__).resolve().parent.parent
A=ROOT/'assets'
S=2
W,H=1440,760
rng=random.Random(14027)

def scaled(points):
    return [(round(x*S),round(y*S)) for x,y in points]
def poly(d,points,fill,outline=None,width=1):
    d.polygon(scaled(points),fill=fill)
    if outline:d.line(scaled(points+[points[0]]),fill=outline,width=max(1,round(width*S)),joint='curve')
def line(d,points,fill,width=1):
    d.line(scaled(points),fill=fill,width=max(1,round(width*S)),joint='curve')
def rect(d,box,fill,outline=None,width=1):
    d.rectangle(tuple(round(v*S) for v in box),fill=fill,outline=outline,width=max(1,round(width*S)))
def ell(d,box,fill,outline=None,width=1):
    d.ellipse(tuple(round(v*S) for v in box),fill=fill,outline=outline,width=max(1,round(width*S)))
def tone(c,n):
    return tuple(max(0,min(255,x+n)) for x in c)
def grain(size,color,seed):
    r=random.Random(seed)
    lo=Image.new('L',(60,34));lo.putdata([r.randrange(55,200) for _ in range(60*34)])
    lo=lo.resize(size,Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(5))
    # Seeded noise: byte-identical for a given input and Pillow version.
    tile=Image.new('L',(256,256));tile.putdata([max(0,min(255,round(r.gauss(128,13)))) for _ in range(256*256)])
    hi=Image.new('L',size)
    for y in range(0,size[1],256):
        for x in range(0,size[0],256):hi.paste(tile,(x,y))
    noise=Image.blend(lo,hi,.39)
    chans=[noise.point(lambda v,c=c:max(0,min(255,round(c+(v-128)*.55)))) for c in color]
    return Image.merge('RGB',chans)

def read_ground(path):
    m=re.search(r'data:image/webp;base64,([A-Za-z0-9+/=]+)',path.read_text())
    assert m,path
    return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB').resize((W*S,H*S),Image.Resampling.LANCZOS)
def save_ground(path,im):
    buf=io.BytesIO();im.convert('RGB').save(buf,'WEBP',quality=90,method=6)
    data=base64.b64encode(buf.getvalue()).decode()
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}"><image width="{W}" height="{H}" xlink:href="data:image/webp;base64,{data}"/></svg>')

def shadow(im,x,y,rx,ry,alpha=95):
    # Small blurred patch, never a full-map blur for individual trees.
    p=Image.new('RGBA',(int((rx+14)*2*S),int((ry+10)*2*S)))
    pd=ImageDraw.Draw(p);ell(pd,(7,5,2*rx+7,2*ry+5),(22,35,23,alpha))
    p=p.filter(ImageFilter.GaussianBlur(2*S))
    im.alpha_composite(p,(round((x-rx-7)*S),round((y-ry-5)*S)))

def tree(im,x,y,r,flower=False,seed=0):
    q=random.Random(seed);shadow(im,x+5,y+2,r*.75,r*.27)
    d=ImageDraw.Draw(im)
    line(d,[(x,y),(x-2,y-r*.85),(x+2,y-r*1.35)],(77,60,40),max(2,r*.15))
    line(d,[(x-1,y-r*.4),(x-r*.5,y-r*.95)],(106,82,51),max(1,r*.09))
    palette=[(46,73,46),(63,91,48),(82,112,53),(109,137,64),(148,157,77)]
    if flower:palette=[(91,69,67),(137,76,90),(183,106,125),(222,151,156),(246,190,174)]
    for k in range(110):
        a=q.random()*math.tau; rr=math.sqrt(q.random()); px=x+math.cos(a)*r*rr; py=y-r*.95+math.sin(a)*r*.65*rr
        rad=q.uniform(.10,.24)*r
        col=palette[min(4,max(0,int(2.1+(-py+y-r*.9)/r*1.8+q.uniform(-1.5,1.5))))]
        ell(d,(px-rad,py-rad*.7,px+rad,py+rad*.7),col)
    for k in range(30):
        px=x+q.uniform(-.8,.65)*r;py=y-r*q.uniform(.8,1.48)
        ell(d,(px,py,px+1.4,py+.9),palette[-1])

def paving(im,x0,y0,x1,y1,seed,large=False):
    q=random.Random(seed);d=ImageDraw.Draw(im)
    rowh=13 if large else 9; bw=31 if large else 23
    for row,y in enumerate(range(int(y0),int(y1),rowh)):
        x=x0-(bw//2 if row%2 else 0)
        while x<x1:
            w=q.randint(bw-6,bw+7)
            l=max(x,x0);r=min(x+w-1,x1);b=min(y+rowh-1,y1)
            if r>l+2:
                c=tone((128,121,102),q.randint(-13,13))
                rect(d,(l,y,r,b),c);line(d,[(l,y),(r,y)],tone(c,18),.45)
                line(d,[(r,y),(r,b),(l,b)],tone(c,-22),.65)
                if q.random()<.27:line(d,[(l+2,y+3),(r-3,b-2)],tone(c,-6),.35)
            x+=w
    # Keep weathered high frequency texture visible over the stonework.
    return im

def inner_scene(old):
    field=grain(old.size,(127,120,100),14).convert('RGBA');d=ImageDraw.Draw(field)
    # Wide continuous plazas, not stacked identical rectangular shelves.
    paving(field,58,68,1382,754,140,True)
    d=ImageDraw.Draw(field)
    # Central processional route, distinct from side streets.
    poly(d,[(648,74),(792,74),(814,746),(626,746)],(153,141,111),(91,86,69),2)
    paving(field,657,76,783,745,141)
    d=ImageDraw.Draw(field)
    for x in (643,797):
        line(d,[(x,86),(x,742)],(196,175,128),2)
        line(d,[(x+3,86),(x+3,742)],(86,83,64),1)
    for y in (224,342,456,570,682):
        # Shallow real paths between rows: no huge horizontal black stripe.
        rect(d,(86,y-7,1354,y+7),(109,106,89))
        line(d,[(86,y-7),(1354,y-7)],(178,161,125),1.5)
        line(d,[(86,y+7),(1354,y+7)],(75,77,62),1.5)
        for x in range(100,1340,20):
            line(d,[(x,y-5),(x+4,y+5)],(91,88,73),.6)
        ell(d,(690,y-22,750,y+22),(115,106,85),(194,170,115),1.4)
        ell(d,(700,y-15,740,y+15),(140,127,100),(183,157,108),1)
        for a in range(0,360,60):
            r=math.radians(a);line(d,[(720, y),(720+17*math.cos(r),y+11*math.sin(r))],(186,161,110),1)
    # Boundary wall with weathered courses, crenels and a foreground gateway opening.
    for x0,x1 in ((60,630),(810,1380)):
        rect(d,(x0,718,x1,753),(91,88,76))
        paving(field,x0,720,x1,753,170+x0)
        d=ImageDraw.Draw(field);rect(d,(x0,710,x1,720),(165,153,121))
        for x in range(x0+4,x1-7,20):
            rect(d,(x,701,x+10,711),(155,144,114),(84,83,69))
    for x in (77,1361):
        rect(d,(x-9,90,x+9,710),(89,90,77))
        line(d,[(x-5,95),(x-5,710)],(180,164,125),2)
    # Garden pockets at the edge and side of the boulevard, outside lot centers.
    for i,(x,y) in enumerate([(110,134),(1330,134),(110,250),(1330,250),(110,367),(1330,367),(110,483),(1330,483),(110,603),(1330,603),(610,233),(830,233),(610,690),(830,690)]):
        tree(field,x,y,17+(i%3)*3,i%3==0,1400+i)
    return field

def outer_scene(old):
    field=grain(old.size,(92,113,64),15).convert('RGBA')
    d=ImageDraw.Draw(field)
    q=random.Random(1500)
    # Ground patches define organic landscape without blocking the 37 plots.
    for _ in range(520):
        x=q.uniform(90,1350);y=q.uniform(40,750);rx=q.uniform(4,30);ry=q.uniform(2,12)
        col=q.choice([(91,113,62),(105,123,68),(81,106,59),(118,128,77)])
        ell(d,(x-rx,y-ry,x+rx,y+ry),col)
    # Slightly meandering packed-earth roads, feathered edges and gravel detail.
    paths=[]
    for y in (124,250,375,500,625,747):
        paths.append([(x,y+math.sin(x/139+y/87)*3+math.sin(x/57)*1.3) for x in range(90,1361,12)])
    paths += [[(x+math.sin(y/90)*4,y) for y in range(35,761,10)] for x in (148,635,805,1292)]
    for p in paths:
        line(d,p,(82,98,58),22);line(d,p,(142,128,84),17);line(d,p,(167,150,105),11)
        for x,y in p:
            if q.random()<.7:
                gx=x+q.uniform(-4,4);gy=y+q.uniform(-4,4)
                ell(d,(gx,gy,gx+q.uniform(.6,2.1),gy+q.uniform(.5,1.3)),(111,105,72))
    # Plant clusters, not uniform icon trees. No scenery sits in the plot anchors.
    for i,y in enumerate(range(82,730,77)):
        for side,x in enumerate((105,1337)):
            tree(field,x+q.randint(-10,10),y,19+q.randint(0,8),i%4==0,1700+i*2+side)
    for i,(x,y) in enumerate([(630,124),(803,250),(630,375),(803,500),(630,625),(803,747)]):
        tree(field,x,y,13,i%3==0,1750+i)
    return field

def compose_ground(name,outer):
    path=A/name;old=read_ground(path)
    art=outer_scene(old) if outer else inner_scene(old)
    mask=Image.new('L',old.size);d=ImageDraw.Draw(mask)
    # Extend past the old hard pasted rectangles and feather into the scenic rim.
    pts=[(45,76),(105,45),(1335,45),(1395,76),(1410,735),(1370,760),(65,760),(30,735)] if not outer else [(117,32),(1320,32),(1395,120),(1370,760),(74,760),(48,140)]
    poly(d,pts,255);mask=mask.filter(ImageFilter.GaussianBlur(12*S))
    scene=Image.composite(art.convert('RGB'),old,mask)
    save_ground(path,scene)

# High-resolution consistent orthographic architectural sprites. Every asset is
# separate RGBA, with direct functional silhouettes and shared lighting.
ROOF={'blue':((51,89,91),(73,112,112),(102,133,125)), 'gold':((126,84,35),(173,120,44),(219,169,78)),
      'green':((49,84,62),(75,112,78),(112,142,92)), 'red':((106,53,43),(145,75,53),(185,107,69)),
      'slate':((62,72,75),(86,96,95),(123,130,121))}
def pavilion(im,cx,cy,w,h,roof='blue',tiers=1,seed=0,openhall=False):
    q=random.Random(seed);d=ImageDraw.Draw(im); dark,mid,light=ROOF[roof]
    # Foundation perspective: all buildings face the same lower-front street.
    poly(d,[(cx-w*.49,cy-h*.12),(cx+w*.43,cy-h*.12),(cx+w*.52,cy),(cx-w*.52,cy)],(135,128,109),(68,65,54),1)
    poly(d,[(cx-w*.52,cy),(cx+w*.52,cy),(cx+w*.52,cy+3),(cx-w*.52,cy+3)],(83,82,69))
    by=cy-h*.10;top=cy-h*.58
    poly(d,[(cx-w*.40,top),(cx+w*.40,top),(cx+w*.40,by),(cx-w*.40,by)],(155,111,70),(70,49,37),.9)
    poly(d,[(cx+w*.40,top),(cx+w*.48,top-h*.10),(cx+w*.48,by-h*.10),(cx+w*.40,by)],(83,63,46))
    for j in range(5):
        x=cx-w*.34+j*w*.17
        rect(d,(x-3,top+4,x+3,by-1),(104,48,35))
        line(d,[(x-2,top+5),(x-2,by-2)],(184,99,62),.9)
        if j<4:
            xx=x+w*.085
            rect(d,(xx-w*.052,top+8,xx+w*.052,by-5),(49,53,43) if openhall else (74,52,38),(197,153,87),.6)
            for k in (-1,0,1):line(d,[(xx+k*3,top+9),(xx+k*3,by-6)],(139,109,66),.6)
    rect(d,(cx-w*.41,by-3,cx+w*.41,by),(171,139,91))
    for t in range(tiers):
        yy=top-t*h*.23;ww=w*(1-t*.30);ridge=yy-h*.20
        # Roof side and curved front eaves.
        poly(d,[(cx-ww*.51,yy+3),(cx-ww*.36,yy-5),(cx-ww*.22,ridge),(cx+ww*.19,ridge),
                (cx+ww*.40,yy-5),(cx+ww*.52,yy+3),(cx+ww*.43,yy+8),(cx-ww*.43,yy+8)],dark,(54,50,40),1)
        poly(d,[(cx-ww*.49,yy+2),(cx-ww*.34,yy-7),(cx-ww*.20,ridge),(cx+ww*.20,ridge),
                (cx+ww*.37,yy-7),(cx+ww*.49,yy+2),(cx+ww*.39,yy+5),(cx-ww*.39,yy+5)],mid)
        for j in range(19):
            f=j/18;xr=cx-ww*.20+ww*.40*f;xe=cx-ww*.46+ww*.92*f
            line(d,[(xr,ridge+1),(xr*.55+xe*.45,yy-7),(xe,yy+3)],tone(light,q.randint(-15,10)),.68)
            line(d,[(xr+1,ridge+1),(xe+1,yy+3)],tone(dark,-5),.48)
        line(d,[(cx-ww*.23,ridge+1),(cx-ww*.19,ridge-2),(cx+ww*.19,ridge-2),(cx+ww*.23,ridge+1)],(223,178,87),1.5)
        line(d,[(cx-ww*.52,yy+2),(cx-ww*.43,yy+6),(cx+ww*.43,yy+6),(cx+ww*.52,yy+2)],(191,139,69),1.2)
        for sx in (-1,1):
            line(d,[(cx+sx*ww*.46,yy+3),(cx+sx*ww*.52,yy),(cx+sx*ww*.54,yy-4)],(224,174,86),1.3)
        if t+1<tiers:
            rect(d,(cx-ww*.22,ridge-9,cx+ww*.22,ridge),(119,68,42))
    for sx in (-1,1):
        lx=cx+sx*w*.37;ly=top+8
        line(d,[(lx,top),(lx,ly)],(73,57,35),.8)
        ell(d,(lx-2.2,ly-2,lx+2.2,ly+5),(206,84,37),(247,177,66),.5)
    # Steps at central door.
    for j in range(3):rect(d,(cx-11-j*2,by+j*1.5,cx+11+j*2,by+j*1.5+1.5),(158-j*12,145-j*10,117-j*8))

def crate(d,x,y,size=10,color=(137,96,54)):
    poly(d,[(x,y-size),(x+size,y-size),(x+size,y),(x,y)],color,(83,61,40),.8)
    poly(d,[(x,y-size),(x+4,y-size-3),(x+size+4,y-size-3),(x+size,y-size)],tone(color,25))
    poly(d,[(x+size,y-size),(x+size+4,y-size-3),(x+size+4,y-3),(x+size,y)],tone(color,-30))
    line(d,[(x+1,y-1),(x+size-1,y-size+1)],tone(color,35),.7)

def sprite(bid,index):
    im=Image.new('RGBA',(180*S,112*S));d=ImageDraw.Draw(im);q=random.Random(1600+index)
    # Consistent grounded feet at y=101, generous transparent margins.
    shadow(im,90,99,64,8,85);d=ImageDraw.Draw(im)
    resource=bid in ('farm','grove','lumber','mine','quarry')
    if resource:
        if bid=='farm':
            poly(d,[(23,31),(147,31),(166,100),(12,100)],(126,102,61),(73,67,42),1.4)
            for j in range(9):
                x=25+j*14;poly(d,[(x,35),(x+8,35),(x+13,95),(x+3,95)],(75,103,46))
                for y in range(39,96,6):
                    xx=x+(y-35)*.06+4
                    line(d,[(xx,y+3),(xx,y-3)],(181,164,66),.8)
                    line(d,[(xx,y),(xx-3,y-3)],(198,179,75),.8);line(d,[(xx,y),(xx+3,y-2)],(151,151,62),.8)
            line(d,[(15,97),(164,97)],(77,124,122),3)
            pavilion(im,143,43,37,34,'green',seed=index)
        elif bid in ('grove','lumber'):
            for j in range(8 if bid=='grove' else 5):
                x=35+(j%4)*30+q.uniform(-5,5);y=60+(j//4)*28
                tree(im,x,y,13+j%3,bid=='grove' and j%3==0,1900+j)
            if bid=='lumber':
                pavilion(im,111,88,62,49,'slate',seed=index,openhall=True);d=ImageDraw.Draw(im)
                for j in range(4):
                    x=27+j*11;line(d,[(x,96),(x+22,87)],(119,80,44),5);ell(d,(x-2,93,x+3,98),(178,132,75),(78,57,36),.5)
        else:
            for j in range(13):
                x=32+j*9+q.randint(-8,8);y=84+q.randint(-13,8);hh=q.randint(15,42)
                c=q.choice([(113,113,103),(132,126,109),(90,102,99)])
                poly(d,[(x-12,y),(x-16,y-hh*.35),(x-6,y-hh),(x+8,y-hh*.8),(x+17,y),(x,y+4)],c,(72,78,73),.7)
                poly(d,[(x-6,y-hh),(x+8,y-hh*.8),(x+17,y),(x+3,y-6)],tone(c,-25))
            if bid=='mine':
                rect(d,(72,69,110,95),(50,43,35),(133,99,57),3)
                line(d,[(76,94),(54,107)],(143,123,83),2);line(d,[(105,94),(84,107)],(143,123,83),2)
            else:
                for j in range(3):crate(d,112+j*12,100-j*5,11,(151,142,116))
        return im
    config={
      'government':('gold',2,136,78),'academy':('blue',2,116,72),'altar':('gold',2,101,80),
      'manor':('green',2,122,69),'hostel':('red',1,120,61),'embassy':('blue',2,113,68),
      'clinic':('green',1,109,62),'housing':('slate',1,101,57),'market':('red',1,124,58),
      'granary':('gold',1,98,68),'storehouse':('slate',1,132,65),'caravan':('green',1,110,57),
      'foundry':('red',1,99,57),'barracks':('blue',1,126,64),'training':('red',1,80,55),
      'workshop':('gold',1,106,62),'watch':('blue',2,72,84),'skirmisher':('green',1,109,60),
      'stable':('slate',1,116,56),'foundryfield':('slate',1,100,57)
    }
    roof,tiers,w,h=config[bid]
    pavilion(im,90,94,w,h,roof,tiers,index, bid in ('market','stable','caravan','workshop'))
    d=ImageDraw.Draw(im)
    if bid in ('market','caravan','storehouse','granary','workshop'):
        for j in range(3):crate(d,25+j*14,101-j%2*5,11,(149,104,56))
    if bid in ('housing','hostel','manor'):
        pavilion(im,35,85,42,40,roof,1,index+40)
    if bid in ('clinic','academy','embassy','government','altar'):
        tree(im,28,97,11,bid in ('clinic','altar'),2000+index)
    if bid in ('foundry','foundryfield'):
        rect(d,(132,62,149,98),(103,93,77),(67,64,56),1)
        ell(d,(129,60,152,66),(60,58,50));ell(d,(135,89,147,96),(237,105,35))
        crate(d,22,101,11,(103,102,90))
    if bid in ('training','barracks','skirmisher','watch'):
        for x in (24,156):
            line(d,[(x,99),(x,57)],(101,73,39),1.6)
            poly(d,[(x,58),(x+12,61),(x+9,71),(x,69)],(155,52,38),(225,155,71),.6)
    if bid=='stable':
        for x in (25,143):
            line(d,[(x,96),(x,83),(x+10,83),(x+10,96)],(132,94,52),1.4)
    return im

def clean_existing(path):
    im=Image.open(path).convert('RGBA')
    # Prevent low-alpha fringe noise from becoming colored outlines when scaled.
    a=im.getchannel('A').point(lambda v:0 if v<28 else v)
    im.putalpha(a)
    if im.getbbox():im=im.crop(im.getbbox())
    im=im.resize((im.width*2,im.height*2),Image.Resampling.LANCZOS)
    im.save(path,'WEBP',lossless=True,method=6)
    return im

def main():
    compose_ground('art01-city-ground.svg',False)
    compose_ground('art01-outer-ground.svg',True)
    folder=A/'art09-buildings';manifest_path=folder/'manifest.json'
    manifest=json.loads(manifest_path.read_text())
    for i,(bid,rec) in enumerate(manifest.items()):
        path=folder/(bid+'.webp')
        if bid in ('citadel','wall'):
            im=clean_existing(path);source='ART13 illustration cutout retained; low-alpha cleanup'
        else:
            im=sprite(bid,i);im.save(path,'WEBP',lossless=True,method=6)
            source='ART14 independent orthographic architecture render'
        rec.update(pixelSize=list(im.size),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),source=source,transformation='ART14 runtime sprite')
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    # Existing CSS handles plot interaction, labels, and mobile. Keep original
    # build hit boxes; align art and use consistent soft contact shadow.
    css=ROOT/'styles.css';patch='''
/* ART14 scene integration */
.art01-city.art09-city .city-extra-plot[data-building-state="built"] .city-building-art img{transform:scale(1.03);filter:drop-shadow(0 2px 1px #272d2260)}
.art01-city.art09-city.art06-outer .city-extra-plot[data-unlocked="true"][data-building-state="foundation"]::before{background:linear-gradient(180deg,#aebf7440,#64774744);border:1px solid #c5c7a16b}
.art01-city.art09-city .city-extra-plot[data-building-state="built"]:not(:hover):not([aria-pressed="true"]) .city-building-info{display:none}
'''
    if '/* ART14 scene integration */' not in css.read_text():css.write_text(css.read_text()+patch)
    print('ART14: 2 new terrain renders, 25 independent functional sprites, 2 retained cutouts; visual review pending')

if __name__=='__main__':main()
