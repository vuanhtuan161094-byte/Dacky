"""Export existing VFX source strips as review GIFs, preserving native frames."""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
root,out=map(Path,sys.argv[1:3])
out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'assets/visual-art-manifest.json').read_text())['assets']
rows=[]
for a in manifest:
    if '/battle-fx/' not in a['path']:continue
    src=root/a['path']
    assert hashlib.sha256(src.read_bytes()).hexdigest()==a['sha256']
    w,h,n=a['width'],a['height'],a['frames']
    with Image.open(src) as im:
        im=im.convert('RGBA')
    if im.size!=(w*n,h):
        rows.append(dict(path=a['path'],status='HOLD',size=im.size,expected=[w*n,h]));continue
    frames=[]
    for i in range(n):
        f=im.crop((i*w,0,(i+1)*w,h))
        p=out/a['kind']/'frames';p.mkdir(parents=True,exist_ok=True);f.save(p/f'{i:03}.png')
        bg=Image.new('RGBA',(w,h),(31,49,44,255));bg.alpha_composite(f)
        bg.thumbnail((360,360))
        frames.append(bg.convert('RGB'))
    # Source duration is authoritative, rounded to GIF's 10 ms timebase.
    ms=a['durationMs'];delays=[max(10,round((i+1)*ms/n/10)*10-round(i*ms/n/10)*10) for i in range(n)]
    gif=out/a['kind']/(a['kind']+'.gif')
    frames[0].save(gif,save_all=True,append_images=frames[1:],duration=delays,loop=0,disposal=2,optimize=False)
    with Image.open(gif) as g:encoded=g.n_frames
    rows.append(dict(path=a['path'],sourceEffect=a['effect'],sourcePhase=a['phase'],status='EXPORTED',frames=n,encodedGifFrames=encoded,durationMs=ms,gif=str(gif.relative_to(out))))
(out/'manifest.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows,indent=2))
assert len(rows)==4
