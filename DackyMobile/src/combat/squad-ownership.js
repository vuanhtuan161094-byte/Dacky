// D2: deterministic ownership, explicit local simulation (not confirmed Mobile).
export function distributeSquads(stacks,commanders){
 if(!Array.isArray(commanders)||!commanders.length||commanders.length>5)throw Error('Invalid squad commanders');
 const ids=new Set(commanders.map(c=>String(c.instanceId??c.heroId)));if(ids.size!==commanders.length)throw Error('Duplicate commander');
 const out=commanders.map(()=>[]),ready=commanders.map((c,i)=>({c,i})).filter(x=>x.c.vitality!==0).map(x=>x.i);if(!ready.length)throw Error('No viable squad commander');let cursor=0;
 for(const t of stacks){
  if(!Number.isSafeInteger(t.count)||t.count<=0)throw Error('Invalid squad troop count');
  const q=Math.floor(t.count/ready.length),r=t.count%ready.length;
  for(let i=0;i<ready.length;i++){const n=q+((i-cursor+ready.length)%ready.length<r?1:0);if(n)out[ready[i]].push({id:t.id,count:n});}
  cursor=(cursor+r)%ready.length;
 }
 return out;
}
export function aggregateSquadStacks(groups){
 const totals=new Map();for(const group of groups)for(const t of group)totals.set(t.id,(totals.get(t.id)??0)+t.count);
 return [...totals].map(([id,count])=>({id,count}));
}
export function validateSquadAllocation(stacks,groups,rosterSize){
 if(!Array.isArray(groups)||groups.length!==rosterSize||groups.some(g=>!Array.isArray(g)))throw Error('Invalid squad allocation');
 for(const group of groups){const ids=new Set();for(const t of group){if(ids.has(t.id)||!Number.isSafeInteger(t.count)||t.count<=0)throw Error('Invalid squad stack');ids.add(t.id);}}
 const sums=aggregateSquadStacks(groups),base=new Map(stacks.map(t=>[t.id,t.count]));
 if(sums.length!==base.size||sums.some(t=>base.get(t.id)!==t.count))throw Error('Squad ownership mismatch');
 return groups;
}
export function squadView(groups,roster,active){
 return groups.map((stacks,i)=>({id:String(roster[i].instanceId),heroId:roster[i].heroId,instanceId:roster[i].instanceId,mana:roster[i].mana,vitality:roster[i].vitality,troops:stacks.reduce((n,t)=>n+t.count,0),stacks:stacks.map(({id,count})=>({id,count})),status:!roster[i].vitality||!stacks.some(t=>t.count>0)?'defeated':i===active?'active':'reserve',evidence:'SIMULATED'}));
}

 // Weighted allocation with cap; the original equal allocator is retained for unconfigured saves.
 export function distributeWeightedSquads(stacks,commanders,weights,cap){
  if(!Array.isArray(weights)||weights.length!==commanders.length||!Number.isSafeInteger(cap)||cap<1)throw Error('Invalid squad plan');
  const out=commanders.map(()=>[]),left=commanders.map(c=>c.vitality===0?0:cap);
  const total=stacks.reduce((n,t)=>n+t.count,0);if(left.reduce((n,v)=>n+v,0)<total)throw Error('Sức chứa tiểu đội không đủ');
  for(const t of stacks){let remaining=t.count;const counts=left.map(()=>0);
   while(remaining){const eligible=left.map((v,i)=>({v,i,w:Math.max(1,Math.min(100,Number(weights[i])||1))})).filter(x=>x.v>0);if(!eligible.length)throw Error('Hết sức chứa');const sum=eligible.reduce((n,x)=>n+x.w,0),start=remaining;for(const x of eligible){const n=Math.min(left[x.i],remaining,Math.floor(start*x.w/sum));left[x.i]-=n;counts[x.i]+=n;remaining-=n;}if(remaining===start){const i=eligible[0].i;left[i]--;counts[i]++;remaining--;}}
   counts.forEach((n,i)=>{if(n)out[i].push({id:t.id,count:n});});
  }
  return validateSquadAllocation(stacks,out,commanders.length);
 }
