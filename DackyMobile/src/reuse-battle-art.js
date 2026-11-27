/* Presentation-only reuse assets. Source notices: assets/reuse/. No combat state mutation. */
const EFFECTS=[{"id":"fireball","path":"./assets/reuse/vfx/fireball.png","frames":4,"duration":266,"loop":true,"rects":[[0,0,0,709,144,75,96,135],[0,1,279,498,122,85,88,156],[0,2,412,318,69,106,37,172],[0,3,263,583,120,91,38,162],[0,4,316,98,145,82,49,131],[0,5,279,412,126,86,38,121],[0,6,350,674,58,112,31,126],[0,7,142,582,121,91,82,124],[1,0,143,229,161,79,96,137],[1,1,0,611,135,98,86,164],[1,2,401,544,71,117,28,175],[1,3,282,318,130,94,47,160],[1,4,150,160,162,69,66,132],[1,5,142,489,137,93,51,131],[1,6,222,674,66,113,36,138],[1,7,142,395,137,94,89,127],[2,0,150,0,166,83,96,133],[2,1,0,417,142,97,86,156],[2,2,144,673,78,112,32,167],[2,3,0,0,150,108,60,167],[2,4,150,83,166,77,70,137],[2,5,0,514,142,97,56,135],[2,6,405,424,77,120,46,141],[2,7,0,108,150,103,90,129],[3,0,312,180,159,72,96,132],[3,1,316,0,145,98,94,158],[3,2,408,661,60,110,29,166],[3,3,143,308,139,87,53,151],[3,4,304,252,160,66,64,126],[3,5,0,211,143,106,52,136],[3,6,288,674,62,113,30,140],[3,7,0,317,140,100,86,131]]},{"id":"quake","path":"./assets/reuse/vfx/quake.png","frames":4,"duration":400,"loop":false,"rects":[[0,0,676,412,192,72,144,44],[0,1,676,484,192,72,144,44],[0,2,676,556,192,72,144,44],[1,0,0,631,285,178,143,103],[1,1,285,631,285,178,143,103],[1,2,570,631,285,178,143,103],[2,0,0,438,338,193,169,121],[2,1,401,219,338,193,169,121],[2,2,338,438,338,193,169,121],[3,0,0,0,401,219,207,128],[3,1,0,219,401,219,207,128],[3,2,401,0,401,219,207,128]]},{"id":"thunderstrike","path":"./assets/reuse/vfx/thunderstrike.png","frames":6,"duration":200,"loop":false,"rects":[[0,0,0,0,229,664,115,569],[1,0,229,0,226,600,113,514],[2,0,455,0,216,458,109,383],[3,0,455,458,196,286,99,224],[4,0,229,600,113,138,54,104],[5,0,0,664,37,51,18,47]]},{"id":"shield","path":"./assets/reuse/vfx/shield.png","frames":4,"duration":400,"loop":true,"rects":[[0,0,268,307,261,300,131,231],[1,0,269,0,265,307,135,234],[2,0,0,304,268,302,133,233],[3,0,0,0,269,304,133,233]]},{"id":"heal","path":"./assets/reuse/vfx/heal.png","frames":6,"duration":600,"loop":false,"rects":[[0,0,163,322,163,117,82,117],[1,0,184,176,170,146,88,152],[2,0,184,0,184,176,88,186],[3,0,0,0,184,180,88,191],[4,0,0,180,163,146,67,192],[5,0,0,326,158,107,67,187]]},{"id":"freeze","path":"./assets/reuse/vfx/freeze.png","frames":4,"duration":400,"loop":false,"rects":[[0,0,0,129,118,133,69,103],[0,1,127,105,118,101,56,81],[0,2,0,0,127,129,59,111],[1,0,0,262,112,113,65,79],[1,1,235,227,113,77,54,54],[1,2,127,0,123,105,57,83],[2,0,245,133,101,94,61,63],[2,1,218,304,107,62,51,35],[2,2,118,206,117,89,54,64],[3,0,250,50,92,83,57,54],[3,1,250,0,98,50,47,24],[3,2,112,295,106,75,49,52]]},{"id":"cleave","path":"./assets/reuse/vfx/cleave.png","frames":6,"duration":400,"loop":false,"rects":[[0,0,334,162,69,39,-38,19],[0,1,692,405,58,36,-18,-5],[0,2,536,434,78,44,39,-12],[0,3,750,405,57,36,76,-5],[0,4,334,122,69,40,107,19],[0,5,692,441,58,30,76,37],[0,6,614,434,78,36,39,52],[0,7,750,441,58,30,-18,37],[1,0,718,77,84,74,-26,36],[1,1,699,155,115,66,-7,3],[1,2,179,425,142,47,71,-11],[1,3,699,221,115,66,122,3],[1,4,321,401,84,74,110,36],[1,5,699,287,115,59,122,61],[1,6,415,303,143,42,72,54],[1,7,689,346,115,59,-7,61],[2,0,308,207,107,97,-2,48],[2,1,415,152,142,76,28,19],[2,2,424,0,198,74,99,17],[2,3,415,228,142,75,114,18],[2,4,308,304,106,97,108,48],[2,5,557,155,142,72,114,56],[2,6,212,67,198,55,99,53],[2,7,557,227,142,71,28,56],[3,0,179,207,129,109,32,54],[3,1,0,73,179,103,39,31],[3,2,0,0,212,73,106,22],[3,3,0,176,179,103,140,31],[3,4,179,316,129,109,97,54],[3,5,0,371,179,91,140,70],[3,6,212,0,212,67,106,48],[3,7,0,279,179,92,39,71],[4,0,410,74,154,78,101,38],[4,1,558,298,131,67,87,44],[4,2,179,122,155,85,78,56],[4,3,414,345,132,67,44,44],[4,4,564,77,154,78,53,38],[4,5,546,365,131,69,44,21],[4,6,622,0,156,77,78,25],[4,7,405,412,131,69,87,21],[5,0,0,462,39,18,124,7],[5,1,179,92,33,18,89,45],[5,2,778,0,32,22,15,62],[5,3,179,73,33,19,-56,46],[5,4,39,462,39,18,-85,7],[5,5,78,462,33,17,-56,-30],[5,6,778,22,32,21,15,-44],[5,7,111,462,33,17,89,-30]]}];
export const REUSE_ASSET_PATHS=["./assets/reuse/skeleton/idle.png","./assets/reuse/skeleton/walk.png","./assets/reuse/skeleton/attack.png","./assets/reuse/skeleton/hit.png","./assets/reuse/skeleton/death.png","./assets/reuse/heavy-soldier/idle.png","./assets/reuse/heavy-soldier/walk.png","./assets/reuse/heavy-soldier/attack.png","./assets/reuse/heavy-soldier/hit.png","./assets/reuse/heavy-soldier/death.png","./assets/reuse/vfx/fireball.png","./assets/reuse/vfx/quake.png","./assets/reuse/vfx/thunderstrike.png","./assets/reuse/vfx/shield.png","./assets/reuse/vfx/heal.png","./assets/reuse/vfx/freeze.png","./assets/reuse/vfx/cleave.png"];
export const REUSE_BACKGROUND_PATH="./assets/reuse/battlefield/open-field.webp";
const UNIT_CLIPS={
 skeleton:{cols:5,pivot:[128,246],counts:{idle:10,walk:10,attack:10,hit:10,death:10},ms:{idle:1200,walk:850,attack:700,hit:550,death:1150}},
 'heavy-soldier':{cols:8,pivot:[148,216],counts:{idle:13,walk:13,attack:13,hit:8,death:10},ms:{idle:1067,walk:1083,attack:1000,hit:667,death:833}}
};
export function reuseNpcClip(id,phase='stand'){
 const key=({'legacy-npc-1101':'skeleton','legacy-npc-1021':'heavy-soldier'})[id];
 if(!key)return null;
 const a=({stand:'idle',run:'walk',attack:'attack',injured1:'hit',dead1:'death'})[phase]||'idle',u=UNIT_CLIPS[key];
 return {key,action:a,path:'./assets/reuse/'+key+'/'+a+'.png',cols:u.cols,frames:u.counts[a],ms:u.ms[a],pivot:u.pivot};
}
export function selectReuseEffect(event){
 if(!event)return null;
 if(event.type==='wallBreached')return 'quake';
 if(!['artifactCast','commanderDuel','skillCast','spellCast'].includes(event.type))return null;
 const label=[event.name,event.element,...(Array.isArray(event.events)?event.events.flatMap(e=>[e.name,e.element]):[])].filter(Boolean).join(' ');
 if(/(?:hồi phục|hồi sinh|trị liệu|chữa lành|heal|restore)/iu.test(label))return 'heal';
 if(/(?:hộ thuẫn|khiên|hộ thể|shield|barrier)/iu.test(label))return 'shield';
 if(/(?:băng|hàn băng|đóng băng|ice|freeze|frost)/iu.test(label))return 'freeze';
 if(/(?:lôi|sấm|thunder|lightning)/iu.test(label))return 'thunderstrike';
 if(/(?:hỏa|hoả|lửa|fire|flame)/iu.test(label))return 'fireball';
 if(/(?:địa chấn|thổ thuật|earthquake|quake)/iu.test(label))return 'quake';
 if(/(?:trảm|đao khí|kiếm khí|cleave|slash)/iu.test(label))return 'cleave';
 return null;
}
export function reuseEffectFrames(id,variant=0){
 const e=EFFECTS.find(x=>x.id===id);if(!e)return null;
 const rects=e.rects.filter(r=>r[1]===variant);
 return rects.length?{...e,rects}:null;
}
export function presentationEvents(events){
 const list=Array.isArray(events)?events:[];
 const special=list.filter(e=>['artifactCast','commanderDuel','skillCast','spellCast','wallBreached','troopDelta'].includes(e.type));
 const chosen=[],keys=new Set();
 const add=e=>{const k=e.type+':'+e.side+':'+(e.name||'');if(!keys.has(k)){keys.add(k);chosen.push(e);}};
 // Do not let the later casualty events suppress a cast or a wall breach.
 for(const e of special.filter(e=>selectReuseEffect(e)))add(e);
 for(const e of special)add(e);
 for(const side of [0,1]){const e=list.find(e=>e.type==='strikeLoss'&&e.side===side&&Number(e.actual)>0);if(e)add(e);}
 if(!chosen.length){const wall=list.find(e=>e.type==='wallHit'&&Number(e.amount)>0);if(wall)add(wall);}
 return chosen.slice(0,4);
}
export function presentationTarget(event,id){
 if(event.type==='wallBreached'||event.type==='wallHit')return 1;
 if(event.targetSide===0||event.targetSide===1)return event.targetSide;
 if(![0,1].includes(event.side))return null;
 if(['strikeLoss','troopDelta'].includes(event.type)||['shield','heal'].includes(id))return event.side;
 return 1-event.side;
}
export function reuseVfxMarkup(event,index,assetUrl,esc){
 const id=selectReuseEffect(event),side=presentationTarget(event,id),e=reuseEffectFrames(id,0);if(!e)return '';
 const left=side===0?32:side===1?68:50;
 const scale=({thunderstrike:.36,quake:.60,fireball:.72,freeze:.62,shield:.60,heal:.60,cleave:.60})[id]||.6;
 const repeats=e.loop?3:1,step=e.duration/e.frames,delay=index*85+180;
 const frames=Array.from({length:repeats},(_,cycle)=>e.rects.map(([n,,x,y,w,h,px,py])=>'<i style="left:'+(-px)+'px;top:'+(-py)+'px;width:'+w+'px;height:'+h+'px;background-position:'+(-x)+'px '+(-y)+'px;--reuse-delay:'+(delay+(cycle*e.frames+n)*step)+'ms;--reuse-frame:'+step+'ms"></i>').join('')).join('');
 return '<span class="reuse-vfx" data-reuse-effect="'+id+'" aria-hidden="true" style="left:'+left+'%;top:'+(65+(index%2)*8)+'%;--reuse-image:url(\''+esc(assetUrl(e.path))+'\');--reuse-scale:'+scale+'"><span class="reuse-vfx-anchor">'+frames+'</span></span>';
}
export function reuseNpcMarkup(clip){
 return '<span class="reuse-npc" data-reuse-npc="'+clip.key+'" aria-hidden="true"><i class="reuse-npc-atlas" style="left:'+(33-clip.pivot[0]*.29)+'px;top:'+(52-clip.pivot[1]*.29)+'px;--reuse-clip:'+clip.ms+'ms;--reuse-key:reuse-'+clip.cols+'-'+clip.frames+'"></i></span>';
}
