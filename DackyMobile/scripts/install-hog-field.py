"""Build-time, pinned reuse of our own generated Heroes Gaia background.
Never requests the game site or player sessions. Falls back to existing Dacky art.
"""
from pathlib import Path
import os, json, hashlib, io, urllib.request
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/reuse/battlefield'
OUT.mkdir(parents=True,exist_ok=True)
URL='https://raw.githubusercontent.com/vuanhtuan161094-byte/Heoofgaia/d2e76c8979914d46c3f1efcd1d0d8b9a8d0ac935/assets/generated/hg11/battlefield/open-field-v2-1176x550.png'
EXPECTED='439cf6ee5da0998b29e91ceb26d8070e86525be33003809e090095d5584fcb3a'.replace(' ','')
def digest(b): return hashlib.sha256(b).hexdigest()
def main():
    target=OUT/'open-field.webp'
    rec=OUT/'receipt.json'
    if target.exists() and rec.exists():
        try:
            prior=json.loads(rec.read_text())
            if prior.get('mode')=='heroes-gaia' and prior.get('source_sha256')==EXPECTED and digest(target.read_bytes())==prior.get('webp_sha256'):
                print('Battlefield: verified cached Heroes Gaia image')
                return
        except (OSError,ValueError): pass
    mode='dacky-fallback'; raw=None; error=None
    if os.getenv('DACKY_HOG_FIELD')=='1':
        try:
            with urllib.request.urlopen(URL,timeout=20) as res: raw=res.read(2_000_001)
            if len(raw)>2_000_000 or digest(raw)!=EXPECTED: raise ValueError('pinned source SHA256 mismatch')
            mode='heroes-gaia'
        except Exception as exc:
            error=type(exc).__name__+': '+str(exc); raw=None
    if raw is None: raw=(ROOT/'assets/visual/assets/battle/nen-thung-lung.jpg').read_bytes()
    with Image.open(io.BytesIO(raw)) as img:
        img=img.convert('RGB')
        img.thumbnail((1176,620),Image.Resampling.LANCZOS)
        img.save(target,'WEBP',quality=87,method=6)
        dimensions=list(img.size)
    rec.write_text(json.dumps({'mode':mode,'source_url':URL if mode=='heroes-gaia' else 'assets/visual/assets/battle/nen-thung-lung.jpg','source_sha256':digest(raw),'webp_sha256':digest(target.read_bytes()),'size':target.stat().st_size,'dimensions':dimensions,'error':error},indent=2)+'\n')
    print('Battlefield:',mode,error or '')
if __name__=='__main__': main()
