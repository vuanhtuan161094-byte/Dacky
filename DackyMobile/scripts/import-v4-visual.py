"""Internal source research build only. Verify provenance and convert compatible sheets."""
import json,hashlib,pathlib
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1]
research=root/'research/live-client'
catalog=json.loads((research/'database/asset-inventory-v3.json').read_text())
acquired={x['sourcePath']:x for x in json.loads((research/'database/acquired-assets-v3.json').read_text())['assets']}
out=root/'assets/v4-internal';out.mkdir(exist_ok=True)
fx={};troops={};files=[]
pools={'normal':['fire203','fire205','fire217'],'critical':['fire207','fire223'],'skill':['fire035','fire219','bang007'],'magic':['bang006','bang009'],'artifact':['bang002','bang008','bang235'],'projectile':['bullet113','bullet123','bullet220']}
wanted={v:k for k,vs in pools.items() for v in vs}
def add(row,kind):
    a=acquired.get(row['path'])
    if not a:return None
    p=research/a['storedPath'];raw=p.read_bytes()
    if len(raw)!=a['bytes'] or hashlib.sha256(raw).hexdigest()!=a['sha256']:raise ValueError('Hash mismatch '+a['sourcePath'])
    w=row.get('width',row.get('frameWidth'));h=row.get('height',row.get('frameHeight'));n=max(1,row['frames'])
    im=Image.open(p);frames=[]
    if getattr(im,'n_frames',1)==n and n>1:
        for i in range(n):
            im.seek(i);frame=im.convert('RGBA')
            if frame.size!=(w,h):return None
            frames.append(frame)
    elif im.size==(w*n,h):frames=[im.crop((i*w,0,(i+1)*w,h)).convert('RGBA') for i in range(n)]
    elif im.size==(w,h*n):frames=[im.crop((0,i*h,w,(i+1)*h)).convert('RGBA') for i in range(n)]
    elif im.size==(w,h) and n==1:frames=[im.convert('RGBA')]
    elif im.width%w==0 and im.height%h==0 and im.width//w* (im.height//h)==n:
        cols=im.width//w;frames=[im.crop(((i%cols)*w,(i//cols)*h,(i%cols+1)*w,(i//cols+1)*h)).convert('RGBA') for i in range(n)]
    else:
        print('Unsupported sheet geometry',row['path'],im.size,w,h,n);return None
    # Downscale large effects only for WebP dimension limits, preserving transparency and sequence.
    scale=min(1,15000/(w*n));nw,nh=max(1,int(w*scale)),max(1,int(h*scale))
    strip=Image.new('RGBA',(nw*n,nh))
    for i,frame in enumerate(frames):
        if frame.size!=(nw,nh):frame=frame.resize((nw,nh),Image.Resampling.LANCZOS)
        strip.paste(frame,(i*nw,0))
    name=pathlib.Path(row['path']).stem+'.webp';dest=out/name;strip.save(dest,format='WEBP',quality=87,method=4)
    files.append({'path':'assets/v4-internal/'+name,'sourceSha256':a['sha256']})
    return {'path':'./assets/v4-internal/'+name,'width':nw,'height':nh,'frames':n,'durationMs':max(42,row['durationMs']),'anchor':row.get('anchor',{'x':.5,'y':.8})}
for a in acquired.values():
    raw=(research/a['storedPath']).read_bytes()
    if len(raw)!=a['bytes'] or hashlib.sha256(raw).hexdigest()!=a['sha256']:raise ValueError('Hash mismatch '+a['sourcePath'])
print('V3 source inventory verified:',len(acquired))
for row in catalog['combatVfxCatalog']['records']:
    kind=wanted.get(row['id'])
    if kind:
        f=add(row,kind)
        if f:fx.setdefault(kind,[]).append(f)
for row in catalog['battleSpriteCatalog']['records']:
    if row['state'] in ('cheer','dead2','injured2'):
        f=add(row,'troop')
        if f:troops.setdefault(row['family'],{})[row['state']]=f
module=root/'src/source-v4-visual.js'
module.write_text('export const V4_FX='+json.dumps(fx,separators=(',',':'))+';\nexport const V4_TROOP_FRAMES='+json.dumps(troops,separators=(',',':'))+';\nexport function v4Effect(kind,event,fallback){const pool=V4_FX[kind]||[];let hash=0;for(const ch of String(event?.artifactId??event?.name??event?.skill??event?.type??""))hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;return pool.length?pool[hash%pool.length]:fallback;}\n')
(out/'manifest.json').write_text(json.dumps({'assets':files,'scope':'INTERNAL_RESEARCH_REVIEW','effectCounts':{k:len(v) for k,v in fx.items()},'troopStates':sum(len(v) for v in troops.values())},indent=2))
print('V4 visual import:',len(files),'verified sprites and effects', {k:len(v) for k,v in fx.items()})
if not fx or not troops:raise ValueError('No usable V3 frames')
