import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source='https://raw.githubusercontent.com/vuanhtuan161094-byte/Heoofgaia/d2e76c8979914d46c3f1efcd1d0d8b9a8d0ac935/assets/generated/hg11/battlefield/open-field-v2-1176x550.png';
const blob='5178fab8cb99a647f21477de747ce0488db3d384';
const cache=path.join(root,'.cache','r3-hog-open-field.png'),out=path.join(root,'assets','r3','hog-open-field.webp');
const digest=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
await mkdir(path.dirname(cache),{recursive:true});await mkdir(path.dirname(out),{recursive:true});
let bytes=await readFile(cache).catch(()=>null);
if(!bytes||digest(bytes)!==blob){const response=await fetch(source,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Heroes Gaia field download: '+response.status);bytes=Buffer.from(await response.arrayBuffer());if(digest(bytes)!==blob)throw Error('Heroes Gaia field blob mismatch');await writeFile(cache,bytes);}
execFileSync('python3',['-c','from PIL import Image; import sys; im=Image.open(sys.argv[1]).convert("RGB"); assert im.size==(1176,550), im.size; im.save(sys.argv[2],format="WEBP",quality=90,method=6)',cache,out],{stdio:'inherit'});
console.log('R3 ground imported from verified Heroes Gaia blob '+blob+'; offline WebP ready.');
