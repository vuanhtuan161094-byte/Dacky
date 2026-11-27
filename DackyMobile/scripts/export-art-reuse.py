"""Source-only asset export; no new artwork and no gameplay changes."""
import hashlib, html, json, shutil, subprocess, sys
from collections import defaultdict
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art-review/pack'; OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
visual=json.loads((ROOT/'assets/visual-art-manifest.json').read_text())['assets']
mobile=json.loads((ROOT/'assets/mobile-source-manifest.json').read_text())['assets']
copies=[]; clips=[]; holds=[]; families=defaultdict(list)
def clean(im):
    rgba=im.convert('RGBA');a=rgba.getchannel('A');mask=a.point(lambda v:255 if v else 0)
    out=Image.composite(rgba,Image.new('RGBA',rgba.size,(0,0,0,0)),mask)
    assert out.getchannel('A').tobytes()==a.tobytes()
    assert Image.composite(out,rgba,mask).tobytes()==rgba.tobytes()
    return out
def copy(src,rel,fix=False):
    dst=OUT/rel;dst.parent.mkdir(parents=True,exist_ok=True)
    if fix:
        with Image.open(src) as im:clean(im).save(dst,'PNG',optimize=True)
    else:shutil.copy2(src,dst)
    copies.append(dict(source=str(src.relative_to(ROOT)),output=str(rel),sourceSha256=sha(src),outputSha256=sha(dst),transform='zero-alpha RGB only' if fix else 'exact copy'))
subprocess.run([sys.executable,str(ROOT/'scripts/install-art13.py')],cwd=ROOT,check=True)
art=ROOT/'assets/art09-buildings'
for p in sorted(art.glob('*.webp')):copy(p,Path('city/art13')/p.name)
for n in ['art01-city-ground.svg','art01-outer-ground.svg']:copy(ROOT/'assets'/n,Path('city/art13')/n)
copy(art/'manifest.json',Path('city/art13/manifest.json'))
for p in sorted((ROOT/'assets/mobile-source/flash/city').glob('*.png')):copy(p,Path('city/legacy-clean')/p.name,True)
for a in mobile+visual:
    p=a['path']
    if '/battle-ng/' in p:continue
    if not any(k in p for k in ['/tech/','/barback/','/map-ng/thanh/','/blr-ui/','/battle-fx/','/am-thanh/','/battle/','/worldmap/']):continue
    src=ROOT/p;assert sha(src)==a['sha256'],p
    copy(src,Path('reuse')/Path(p).relative_to('assets'))
for a in visual:
    if '/battle-ng/' not in a['path']:continue
    src=ROOT/a['path'];assert sha(src)==a['sha256'],a['path']
    family,state=a['family'],a['state'];w,h,n,fps=a['width'],a['height'],a['frames'],a['fps']
    with Image.open(src) as im:original=im.convert('RGBA')
    if original.size!=(w*n,h):
        holds.append(dict(source=a['path'],actual=original.size,expected=[w*n,h],reason='unexpected strip layout; not guessed'));continue
    frames=[clean(original.crop((i*w,0,(i+1)*w,h))) for i in range(n)]
    dest=OUT/'combat/frames'/family/state;dest.mkdir(parents=True,exist_ok=True)
    for i,f in enumerate(frames):f.save(dest/f'{i:03}.png',optimize=True)
    preview=[]
    for f in frames:
        bg=Image.new('RGBA',(w,h),(30,48,43,255));bg.alpha_composite(f)
        preview.append(bg.convert('RGB').resize((w*2,h*2),Image.Resampling.NEAREST))
    delays=[max(10,round((i+1)*100/fps)*10-round(i*100/fps)*10) for i in range(n)] if n>1 else [600]
    gif=OUT/'combat/gifs'/family/(state+'.gif');gif.parent.mkdir(parents=True,exist_ok=True)
    preview[0].save(gif,save_all=True,append_images=preview[1:],duration=delays,loop=0,disposal=2,optimize=False)
    with Image.open(gif) as g:
        assert g.size==(w*2,h*2)
        encoded=g.n_frames
    rec=dict(family=family,state=state,source=a['path'],sourceSha256=a['sha256'],frames=n,encodedGifFrames=encoded,fps=fps,anchor=a.get('anchor'),size=[w,h],gif=str(gif.relative_to(OUT)),framesDirectory=str(dest.relative_to(OUT)),previewDurationMs=sum(delays),gifSha256=sha(gif))
    clips.append(rec);families[family].append(rec)
(OUT/'asset-manifest.json').write_text(json.dumps(copies,ensure_ascii=False,indent=2))
(OUT/'animation-manifest.json').write_text(json.dumps(dict(clips=clips,holds=holds),indent=2))
def tag(x):return html.escape(str(x),quote=True)
def gallery(paths,title):
    return '<h2>'+tag(title)+'</h2><div class="grid">'+''.join('<figure><img loading="lazy" src="'+tag(p.relative_to(OUT))+'"><figcaption>'+tag(p.stem)+'</figcaption></figure>' for p in paths)+'</div>'
sections=[gallery(sorted((OUT/'city/art13').glob('*.webp')),'ART13 original'),gallery(sorted((OUT/'city/legacy-clean').glob('*.png')),'Legacy candidates — hidden RGB cleanup only')]
for family,rows in sorted(families.items()):
    sections.append('<h2>'+tag(family)+'</h2><div class="grid">'+''.join('<figure><img loading="lazy" src="'+tag(r['gif'])+'"><figcaption>'+tag(r['state'])+' · '+str(r['frames'])+' frames · '+str(r['fps'])+' fps</figcaption></figure>' for r in rows)+'</div>')
for key,title in [('mobile-source/assets/tech','Research'),('mobile-source/assets/barback','Troops'),('visual/assets/blr-ui','UI')]:
    sections.append(gallery(sorted(p for p in (OUT/'reuse'/key).rglob('*') if p.suffix.lower() in ['.png','.webp','.jpg'] and p.is_file()),title))
(OUT/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Dacky source asset review</title><style>body{background:#182c28;color:#f2dfb2;font:16px system-ui;margin:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}figure{margin:0;background:#243c35;padding:10px;border:1px solid #897649;text-align:center}img{max-width:100%;height:110px;object-fit:contain}figcaption{font-size:12px}</style><h1>Dacky — asset reuse review</h1><p>Existing source pixels only; GIF previews are not runtime scenes.</p>'+''.join(sections))
summary=dict(sourceCopies=len(copies),art13Sprites=len(list((OUT/'city/art13').glob('*.webp'))),legacyCandidates=len(list((OUT/'city/legacy-clean').glob('*.png'))),clips=len(clips),sourceFrames=sum(r['frames'] for r in clips),families=len(families),holds=holds)
(OUT/'summary.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
assert summary['art13Sprites']==27 and summary['legacyCandidates']==20
assert len(clips)+len(holds)==120 and clips
