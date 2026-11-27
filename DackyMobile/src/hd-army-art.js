// R4: representative project-owned HD art, no gameplay changes.
export const HD_ARMY_PATHS=["./assets/reuse/hd-army/human-1-atlas.webp","./assets/reuse/hd-army/human-vanguard.webp","./assets/reuse/hd-army/human-archer.webp","./assets/reuse/hd-army/undead-7-atlas.webp","./assets/reuse/hd-army/orc-3-atlas.webp","./assets/reuse/hd-army/orc-2-atlas.webp","./assets/reuse/hd-army/human-7-atlas.webp","./assets/reuse/hd-army/elf-4-atlas.webp","./assets/reuse/hd-army/elf-8-atlas.webp","./assets/reuse/hd-army/undead-skeleton.webp","./assets/reuse/hd-army/human-priest.webp","./assets/reuse/hd-army/demonlord-samurai.webp"];
const CLIPS={stand:[0,960],run:[1,640],attack:[2,960],injured1:[3,640],dead1:[4,1200]};
export function hdArmyFamily(troop){
 if(!troop)return null;
 const name=String(troop.name||'').normalize('NFC'),role=String(troop.role||'').normalize('NFC'),label=name+' '+role;
 const raw=String(troop.id??''),numeric=Number(raw.match(/^(?:legacy-npc-)?(\d{4})$/)?.[1]);
 const category=Number.isFinite(numeric)&&numeric>=1000&&numeric<=1199&&numeric%10<=3?numeric%10:null;
 const cavalry=/(?:kỵ|chiến xa|cavalry|mounted)/iu.test(label)||category===3;
 const dark=/(?:ma quân|âm binh|âm tốt|u minh)/iu.test(name);
 const celestial=/(?:tiên tộc|thiên đình|thiên triều)/iu.test(name);
 const elite=Number(troop.tier)>=4||/(?:tinh nhuệ|huyền giáp|thiết giáp|kim giáp|cấm vệ|trọng giáp)/iu.test(name);
 if(cavalry){if(dark||numeric===1103)return 'undead-7-atlas';if(/yêu tộc/iu.test(name)||numeric===1013)return 'orc-2-atlas';return null}
 if(/công thành|pháo|nỏ xa|vân thê/iu.test(label))return null;
 if(/(?:pháp sư|đạo sĩ|đạo binh|trị liệu|priest|mage)/iu.test(label))return 'human-priest';
 if(/(?:cung|tiễn|nỏ|nỗ|xạ|archer|ranged)/iu.test(label)||category===2)return celestial?(elite?'elf-8-atlas':'elf-4-atlas'):elite?'elf-8-atlas':'human-archer';
 if(/(?:thương|mâu|giáo|trường đinh|spear|pike)/iu.test(label)||category===0)return 'human-1-atlas';
 if(/(?:phủ|rìu|axe)/iu.test(name))return 'orc-3-atlas';
 if(/(?:đao|kiếm|khiên|bộ binh|infantry|sword|âm tốt)/iu.test(label)||category===1){
  if(dark)return /(?:đao|kiếm)/iu.test(name)?'demonlord-samurai':'undead-skeleton';
  return elite||celestial?'human-7-atlas':'human-vanguard';
 }
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
export function isRangedArmy(troop){
 const label=String(troop?.name||'')+' '+String(troop?.role||'');
 return /(?:cung|tiễn|nỏ|xạ|archer|ranged)/iu.test(label);
}
export function compactRanks(count,side,groups=1,options={}){
 const {ranged=false,hasMelee=false,roleIndex=0,roleCount=1}=options;
 const back=ranged&&hasMelee;
 const cap=groups===1?12:back?6:8;
 const n=Math.min(Math.max(0,Math.floor(Number(count)||0)),cap,Math.max(1,Math.ceil(Math.log2(Math.max(0,Number(count)||0)+1)*1.35)));
 const cols=back?Math.min(2,n):n>8?4:n>4?3:n>1?2:1,rows=Math.ceil(n/Math.max(1,cols));
 const laneHeight=56/Math.max(1,roleCount),laneStart=27+roleIndex*laneHeight;
 const front=back?43:93,spacing=back?18:17;
 return Array.from({length:n},(_,k)=>{
  const col=k%cols,r=Math.floor(k/cols),fromFront=col*spacing+(r%2?2:0);
  const y=rows===1?laneStart+laneHeight*.53:laneStart+5+r*Math.max(5,laneHeight-13)/(rows-1);
  return {x:side===0?front-fromFront:100-front+fromFront,y,depth:Math.round(y),delay:(k%4)*24};
 });
}
