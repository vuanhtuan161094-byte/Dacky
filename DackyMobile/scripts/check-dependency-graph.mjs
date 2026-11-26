import { BUILDINGS, TECHNOLOGIES, TROOPS } from '../src/catalog.js';

const buildingsByName=new Map(BUILDINGS.map(row=>[row.name,row]));
const technologiesByName=new Map(TECHNOLOGIES.map(row=>[row.name,row]));
const graph=new Map(),impossible=[],unknown=[],edges=[],populationConditions=new Set(),officialConditions=new Set();
const addNode=(id,deps=[])=>{if(!graph.has(id))graph.set(id,[]);for(const dep of deps)graph.get(id).push(dep);};
const requirementTerms=text=>String(text||'').split(/\s*[·,]\s*/).map(x=>x.trim()).filter(x=>x&&x!=='—'&&x!=='-');
const localizedNumber=value=>Number(String(value).replace(/\./g,'').replace(',','.'));
function addRequirement(owner,text,domain){
  for(const term of requirementTerms(text)){
    const pop=term.match(/^Dân số\s+([\d.,]+)$/i),official=term.match(/^Quan chức\s+(\d+)$/i),blueprint=term.match(/^Bản Vẽ Xây Dựng\s*[×x]\s*(\d+)$/i),match=term.match(/^(.+?)\s+(\d+)$/);
    if(pop){const value=Math.ceil(localizedNumber(pop[1]));if(value>180+30*1400+30*700+73*350)impossible.push({owner,term,reason:'population cap'});else{populationConditions.add(value);edges.push([owner,`condition:population:${value}`]);}continue;}
    if(official){const value=Number(official[1]);if(value>19)impossible.push({owner,term,reason:'official rank cap'});else{officialConditions.add(value);edges.push([owner,`official:${value}`]);}continue;}
    if(blueprint)continue; // Source item is consumable; a priced Workshop order exists.
    if(!match){unknown.push({owner,term});continue;}
    const [,name,raw]=match,level=Number(raw),building=buildingsByName.get(name),tech=technologiesByName.get(name);
    if(building){if(level>building.maxLevel)impossible.push({owner,term,reason:`${building.id} cap ${building.maxLevel}`});else edges.push([owner,`building:${building.id}:${level}`]);continue;}
    if(tech){if(level>tech.maxLevel)impossible.push({owner,term,reason:`${tech.id} cap ${tech.maxLevel}`});else edges.push([owner,`technology:${tech.id}:${level}`]);continue;}
    if(name==='Công trình'){continue;} // Explicit aggregate-building SIMULATED adapter.
    unknown.push({owner,term,domain});
  }
}
for(const building of BUILDINGS){
  for(let level=1;level<=building.maxLevel;level++){
    const id=`building:${building.id}:${level}`,deps=[];if(level>1)deps.push(`building:${building.id}:${level-1}`);
    if(building.id!=='citadel'){const citadel=Math.max(1,Math.ceil(level/2));if(citadel>BUILDINGS.find(x=>x.id==='citadel').maxLevel)impossible.push({owner:id,term:`Tử Vi Thành ${citadel}`,reason:'citadel cap'});else deps.push(`building:citadel:${citadel}`);}
    addNode(id,deps);const row=building.mobileLevelCosts?.find(x=>x.level===level)||building.simulatedLevelCosts?.find(x=>x.level===level);addRequirement(id,row?.requirement,'building');
  }
}
for(const tech of TECHNOLOGIES){
  for(let level=1;level<=tech.maxLevel;level++){
    const id=`technology:${tech.id}:${level}`,deps=[];if(level>1)deps.push(`technology:${tech.id}:${level-1}`);if(level===1)deps.push('building:academy:1');
    addNode(id,deps);const row=tech.mobileLevelCosts?.find(x=>x.level===level);addRequirement(id,row?.requirement,'technology');
  }
}
for(const troop of TROOPS.filter(x=>x.mobileSourceId)){
  const id=`troop:${troop.id}`;addNode(id);
  for(const req of troop.trainingRequirements?.buildings||[]){const b=BUILDINGS.find(x=>x.id===req.runtimeBuildingId);if(b&&req.level<=b.maxLevel)graph.get(id).push(`building:${b.id}:${req.level}`);else impossible.push({owner:id,term:`${req.sourceName} ${req.level}`,reason:'missing building runtime mapping/cap'});}
  for(const req of troop.trainingRequirements?.technologies||[]){const t=TECHNOLOGIES.find(x=>x.id===req.runtimeTechnologyId);if(t&&req.level<=t.maxLevel)graph.get(id).push(`technology:${t.id}:${req.level}`);else impossible.push({owner:id,term:`${req.sourceName} ${req.level}`,reason:'missing technology runtime mapping/cap'});}
  for(const req of troop.trainingRequirements?.unknown||[]){if(['WorkShop','Workshop'].includes(req.sourceName)&&req.level<=BUILDINGS.find(x=>x.id==='workshop').maxLevel)graph.get(id).push(`building:workshop:${req.level}`);else unknown.push({owner:id,term:`${req.sourceName} ${req.level}`});}
}
for(const level of populationConditions)addNode(`condition:population:${level}`);
for(let level=1;level<=73;level++)addNode(`cities:${level}`,level>1?[`cities:${level-1}`]:[]);
for(let rank=0;rank<=19;rank++)addNode(`official:${rank}`,rank>0?[`official:${rank-1}`,`fame:${rank*rank*100}`,`gold:${rank*100}`]:[]);
for(let rank=1;rank<=19;rank++)addNode(`fame:${rank*rank*100}`);
for(let rank=1;rank<=19;rank++)addNode(`gold:${rank*100}`);
for(const [owner,dep] of edges){const list=graph.get(owner);if(list)list.push(dep);}
const visiting=new Set(),visited=new Set(),cycles=[];
function visit(id,path=[]){if(visiting.has(id)){cycles.push([...path.slice(path.indexOf(id)),id]);return;}if(visited.has(id))return;visiting.add(id);for(const next of graph.get(id)||[])if(graph.has(next))visit(next,[...path,id]);visiting.delete(id);visited.add(id);}
for(const id of graph.keys())visit(id);
const report={nodes:graph.size,edges:[...graph.values()].reduce((n,x)=>n+x.length,0),impossible,cycles,unknownUnique:[...new Map(unknown.map(x=>[`${x.owner}|${x.term}`,x])).values()],conditionNodes:{population:[...populationConditions].sort((a,b)=>a-b),official:[...officialConditions].sort((a,b)=>a-b),officialLevels:20,capturedCityMilestones:73},bridges:BUILDINGS.filter(x=>x.runtimeMaxEvidence==='SIMULATED_PREREQUISITE_BRIDGE').map(x=>({id:x.id,sourceMaxLevel:x.sourceMaxLevel,runtimeMaxLevel:x.maxLevel,reason:'Source Mobile research requirement cap',simulatedLevels:x.simulatedLevelCosts?.length||0})),mobile:{buildings:BUILDINGS.filter(x=>x.mobileSourceId).length,technologyBranches:TECHNOLOGIES.filter(x=>x.mobileSourceId).length,technologyLevels:TECHNOLOGIES.reduce((n,x)=>n+x.mobileLevelCosts.length,0),troops:TROOPS.filter(x=>x.mobileSourceId).length}};
console.log(JSON.stringify(report,null,2));
if(cycles.length||impossible.length)process.exitCode=1;
