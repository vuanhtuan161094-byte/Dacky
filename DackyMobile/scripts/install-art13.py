"""Install verified ART13 independent raster scenery and building assets."""
from pathlib import Path
import base64,hashlib,json,re,sys
from PIL import Image
root=Path(__file__).resolve().parent.parent
parts=sorted((root/'art-source/art13').glob('part-*.txt'))
assert len(parts)==8,'incomplete ART13 pack'
payload=''.join(p.read_text() for p in parts)
assert len(payload)==3118531,'ART13 pack byte count mismatch'
lines=payload.splitlines()
assert len(lines)==1569 and lines.pop(0)=='DACKY_ART13_ASSET_PACK_V1'
layout=json.loads(re.search(r'CITY_R9_LAYOUT=Object\.freeze\((\{[^\n]+\})\);',(root/'src/ui.js').read_text()).group(1))
expected={'assets/art01-city-ground.svg','assets/art01-outer-ground.svg','art13.css'}|{'assets/art09-buildings/'+id+'.webp' for id in layout}
records={}
def install(meta,encoded):
    if not meta:return
    name,size,sha=meta
    assert name in expected and name not in records,name
    data=base64.b64decode(''.join(encoded),validate=True)
    assert len(data)==int(size) and hashlib.sha256(data).hexdigest()==sha,name
    records[name]=sha
    if name=='art13.css':
        style=root/'styles.css';base=style.read_text();patch=data.decode('utf8')
        if patch not in base:
            assert '/* ART13 premium warm jade + gilt' not in base,'conflicting ART13 CSS'
            style.write_text(base+patch)
    else:
        dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
meta=None;encoded=[]
for line in lines:
    if line.startswith('FILE '):
        install(meta,encoded);meta=line.split()[1:];encoded=[]
    elif line.strip():encoded.append(line.strip())
install(meta,encoded)
assert set(records)==expected
manifest={}
for bid,(x,y,w,h,r,source) in layout.items():
    path='assets/art09-buildings/'+bid+'.webp'
    im=Image.open(root/path);im.verify()
    with Image.open(root/path) as im: size=list(im.size)
    manifest[bid]={'source':source if bid not in ('citadel','wall') else 'ART13 generated text-free source illustration silhouette cutout','pixelSize':size,'foot':[x,y],'display':[w,h],'sha256':records[path],'transformation':'ART13 independent architecture cutout' if bid in ('citadel','wall') else 'ART12 source-derived sprite tonal normalization'}
(root/'assets/art09-buildings/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('ART13 installed: 2 terrain scenes, 27 independent sprites, exact hashes verified')
