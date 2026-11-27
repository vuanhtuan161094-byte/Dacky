/* Presentation-only reuse assets. Source notices: assets/reuse/. No combat state mutation. */
const EFFECTS=[{"id":"fireball","path":"./assets/reuse/vfx/fireball.png","frames":4,"duration":266,"loop":true,"rects":[[0,0,0,709,144,75,96,135],[0,1,279,498,122,85,88,156],[0,2,412,318,69,106,37,172],[0,3,263,583,120,91,38,162],[0,4,316,98,145,82,49,131],[0,5,279,412,126,86,38,121],[0,6,350,674,58,112,31,126],[0,7,142,582,121,91,82,124],[1,0,143,229,161,79,96,137],[1,1,0,611,135,98,86,164],[1,2,401,544,71,117,28,175],[1,3,282,318,130,94,47,160],[1,4,150,160,162,69,66,132],[1,5,142,489,137,93,51,131],[1,6,222,674,66,113,36,138],[1,7,142,395,137,94,89,127],[2,0,150,0,166,83,96,133],[2,1,0,417,142,97,86,156],[2,2,144,673,78,112,32,167],[2,3,0,0,150,108,60,167],[2,4,150,83,166,77,70,137],[2,5,0,514,142,97,56,135],[2,6,405,424,77,120,46,141],[2,7,0,108,150,103,90,129],[3,0,312,180,159,72,96,132],[3,1,316,0,145,98,94,158],[3,2,408,661,60,110,29,166],[3,3,143,308,139,87,53,151],[3,4,304,252,160,66,64,126],[3,5,0,211,143,106,52,136],[3,6,288,674,62,113,30,140],[3,7,0,317,140,100,86,131]]},{"id":"quake","path":"./assets/reuse/vfx/quake.png","frames":4,"duration":400,"loop":false,"rects":[[0,0,676,412,192,72,144,44],[0,1,676,484,192,72,144,44],[0,2,676,556,192,72,144,44],[1,0,0,631,285,178,143,103],[1,1,285,631,285,178,143,103],[1,2,570,631,285,178,143,103],[2,0,0,438,338,193,169,121],[2,1,401,219,338,193,169,121],[2,2,338,438,338,193,169,121],[3,0,0,0,401,219,207,128],[3,1,0,219,401,219,207,128],[3,2,401,0,401,219,207,128]]},{"id":"thunderstrike","path":"./assets/reuse/vfx/thunderstrike.png","frames":6,"duration":200,"loop":false,"rects":[[0,0,0,0,229,664,115,569],[1,0,229,0,226,600,113,514],[2,0,455,0,216,458,109,383],[3,0,455,458,196,286,99,224],[4,0,229,600,113,138,54,104],[5,0,0,664,37,51,18,47]]}];
export const REUSE_ASSET_PATHS=["./assets/reuse/skeleton/idle.png","./assets/reuse/skeleton/walk.png","./assets/reuse/skeleton/attack.png","./assets/reuse/skeleton/hit.png","./assets/reuse/skeleton/death.png","./assets/reuse/heavy-soldier/idle.png","./assets/reuse/heavy-soldier/walk.png","./assets/reuse/heavy-soldier/attack.png","./assets/reuse/heavy-soldier/hit.png","./assets/reuse/heavy-soldier/death.png","./assets/reuse/vfx/fireball.png","./assets/reuse/vfx/quake.png","./assets/reuse/vfx/thunderstrike.png"];
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
 if(!['artifactCast','commanderDuel'].includes(event.type))return null;
 const label=String(event.name||'')+' '+String(event.element||'')+' '+(event.events||[]).map(e=>String(e.name||'')+' '+String(e.element||'')).join(' ');
 if(/(?:lôi|sấm|thiên lôi|thunder|lightning)/iu.test(label))return 'thunderstrike';
 if(/(?:hỏa|hoả|lửa|fire|flame)/iu.test(label))return 'fireball';
 if(/(?:địa chấn|thổ thuật|earthquake|quake)/iu.test(label))return 'quake';
 return null;
}
export function reuseEffectFrames(id,variant=0){
 const e=EFFECTS.find(x=>x.id===id);if(!e)return null;
 const frames=e.rects.filter(r=>r[1]===variant);
 if(!frames.length)return null;
 return {...e,rects:frames};
}
export function reuseVfxMarkup(event,index,assetUrl,esc){
 const id=selectReuseEffect(event),e=reuseEffectFrames(id,0);if(!e)return '';
 const side=event.type==='wallBreached'?1:(event.targetSide===0||event.targetSide===1?event.targetSide:event.side===0?1:event.side===1?0:null);
 const left=side===0?29:side===1?71:50;
 const scale=id==='thunderstrike'?.42:id==='quake'?.65:.80;
 const repeats=e.loop?3:1,step=e.duration/e.frames;
 const frames=Array.from({length:repeats},(_,cycle)=>e.rects.map(([n,,x,y,w,h,px,py])=>'<i style="left:'+(-px)+'px;top:'+(-py)+'px;width:'+w+'px;height:'+h+'px;background-position:'+(-x)+'px '+(-y)+'px;--reuse-delay:'+((cycle*e.frames+n)*step)+'ms;--reuse-frame:'+step+'ms"></i>').join('')).join('');
 return '<span class="reuse-vfx" data-reuse-effect="'+id+'" aria-hidden="true" style="left:'+left+'%;top:'+(55+index*9)+'%;--reuse-image:url(\''+esc(assetUrl(e.path))+'\');--reuse-scale:'+scale+'"><span class="reuse-vfx-anchor">'+frames+'</span></span>';
}
export function reuseNpcMarkup(clip){
 return '<span class="reuse-npc" data-reuse-npc="'+clip.key+'" aria-hidden="true"><i class="reuse-npc-atlas" style="left:'+(-clip.pivot[0])+'px;top:'+(-clip.pivot[1])+'px;--reuse-clip:'+clip.ms+'ms;--reuse-key:reuse-'+clip.cols+'-'+clip.frames+'"></i></span>';
}
