// R4: representative project-owned HD art, no gameplay changes.
export const HD_ARMY_PATHS=["./assets/reuse/hd-army/human-1-atlas.webp","./assets/reuse/hd-army/human-vanguard.webp","./assets/reuse/hd-army/human-archer.webp","./assets/reuse/hd-army/undead-7-atlas.webp","./assets/reuse/hd-army/orc-3-atlas.webp","./assets/reuse/hd-army/orc-2-atlas.webp"];
const CLIPS={stand:[0,960],run:[1,640],attack:[2,960],injured1:[3,640],dead1:[4,1200]};
export function hdArmyFamily(troop){
 if(!troop)return null;
 const name=String(troop.name||'').normalize('NFC'),role=String(troop.role||'').normalize('NFC'),label=name+' '+role;
 const raw=String(troop.mobileSourceId??troop.sourceId??troop.id??''),numeric=Number(raw.match(/\d{4,}/)?.[0]);
 const category=Number.isFinite(numeric)&&numeric>=1000&&numeric<=1199?[0,1,2,3].includes(numeric%10)?numeric%10:null:null;
 const cavalry=/(?:kỵ|chiến xa|cavalry|mounted)/iu.test(label)||category===3;
 if(cavalry){if(/ma quân|âm binh/iu.test(name)||numeric===1103)return 'undead-7-atlas';if(/yêu tộc/iu.test(name)||numeric===1013)return 'orc-2-atlas';return null}
 if(/(?:cung|tiễn|nỏ|xạ|archer|ranged)/iu.test(label)||category===2)return 'human-archer';
 if(/(?:thương|mâu|giáo|spear|pike)/iu.test(label)||category===0)return 'human-1-atlas';
 if(/(?:đao|kiếm|khiên|bộ binh|infantry|sword)/iu.test(label)||category===1)return 'human-vanguard';
 return null;
}
export function hdArmyClip(troop,phase='stand'){
 const family=hdArmyFamily(troop);if(!family)return null;
 const [row,ms]=CLIPS[phase]||CLIPS.stand;
 return {family,path:'./assets/reuse/hd-army/'+family+'.webp',row,ms,frames:8,cell:[192,204],atlas:[1536,1024]};
}
export function hdArmyMarkup(clip){
 return '<span class="fidelity-hd-sprite" data-hd-army="'+clip.family+'" data-hd-row="'+clip.row+'" style="--hd-y:-'+(clip.row*102)+'px;--hd-ms:'+clip.ms+'ms"></span>';
}
// Positions are foot anchors. Frontmost column always faces the centre.
// Keep a small army at the front line, not at the centre of its own half.
export function compactRanks(count,side,groups=1){
 const n=Math.min(Math.max(0,Math.floor(Number(count)||0)),groups===1?12:8,Math.max(1,Math.ceil(Math.log2(Math.max(0,Number(count)||0)+1)*1.35)));
 const cols=n>8?4:n>4?3:n>1?2:1,rows=Math.ceil(n/cols);
 return Array.from({length:n},(_,k)=>{
  const col=k%cols,r=Math.floor(k/cols),fromFront=col*19+(r%2?2:0);
  return {x:side===0?91-fromFront:9+fromFront,y:rows===1?76:35+r*52/(rows-1),depth:r+1,delay:(k%4)*24};
 });
}
