// D2: deterministic ownership, explicit local simulation (not confirmed Mobile).
export function distributeSquads(stacks,commanders){
 if(!Array.isArray(commanders)||!commanders.length||commanders.length>5)throw Error('Invalid squad commanders');
 const ids=new Set(commanders.map(c=>String(c.instanceId??c.heroId)));if(ids.size!==commanders.length)throw Error('Duplicate commander');
 const out=commanders.map(()=>[]);let cursor=0;
 for(const t of stacks){
  if(!Number.isSafeInteger(t.count)||t.count<=0)throw Error('Invalid squad troop count');
  const q=Math.floor(t.count/out.length),r=t.count%out.length;
  for(let i=0;i<out.length;i++){const n=q+((i-cursor+out.length)%out.length<r?1:0);if(n)out[i].push({id:t.id,count:n});}
  cursor=(cursor+r)%out.length;
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
