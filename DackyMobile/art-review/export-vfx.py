"""Decode native animated WebP (or verified strip); preserve source timing."""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
root,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
rows=[]
for a in json.loads((root/'assets/visual-art-manifest.json').read_text())['assets']:
    if '/battle-fx/' not in a['path']:continue
    src=root/a['path'];assert hashlib.sha256(src.read_bytes()).hexdigest()==a['sha256']
    w,h,n=a['width'],a['height'],a['frames'];frames=[];delays=[]
    with Image.open(src) as im:
        count=getattr(im,'n_frames',1)
        if count==n and im.size==(w,h):
            for i in range(count):
                im.seek(i);f=im.convert('RGBA');frames.append(f.copy());delays.append(im.info.get('duration',0))
            layout='native-animated-webp'
        elif count==1 and im.size==(w*n,h):
            f=im.convert('RGBA');frames=[f.crop((i*w,0,(i+1)*w,h)) for i in range(n)]
            layout='horizontal-strip'
        else:
            rows.append(dict(path=a['path'],status='HOLD',size=im.size,actualFrames=count,expectedFrames=n));continue
    if len(delays)!=n or any(d<=0 for d in delays):
        delays=[a['durationMs']/n]*n
        timing='manifest-average'
    else:timing='native-frame-duration'
    elapsed=0;rounded=0;gifDelays=[]
    for d in delays:
        elapsed+=d;target=round(elapsed/10)*10;v=max(10,target-rounded);gifDelays.append(v);rounded+=v
    p=out/a['kind']/'frames';p.mkdir(parents=True,exist_ok=True);preview=[]
    for i,f in enumerate(frames):
        f.save(p/f'{i:03}.png')
        bg=Image.new('RGBA',(w,h),(31,49,44,255));bg.alpha_composite(f);bg.thumbnail((360,360));preview.append(bg.convert('RGB'))
    gif=out/a['kind']/(a['kind']+'.gif')
    preview[0].save(gif,save_all=True,append_images=preview[1:],duration=gifDelays,loop=0,disposal=2,optimize=False)
    with Image.open(gif) as g:encoded=g.n_frames
    rows.append(dict(path=a['path'],sourceEffect=a['effect'],sourcePhase=a['phase'],status='EXPORTED',layout=layout,frames=n,encodedGifFrames=encoded,timing=timing,sourceFrameDurationsMs=delays,durationMs=sum(delays),gifDurationMs=sum(gifDelays),gif=str(gif.relative_to(out))))
(out/'manifest.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
assert len(rows)==4 and all(x['status']=='EXPORTED' for x in rows)
