// V4 source fidelity: research/live-client/database/combat.json.
// The capacity divisor is observed; missing leadership and population values are local policies.
export const ARTIFACT_SLOTS=Object.freeze(['artifact','artifact2','artifact3','artifact4']);
const int=(v)=>Math.min(9999999,Math.max(0,Math.floor(Number(v)||0)));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
function numberFrom(v){return Number(String(v??'').replace(/[.,\s]/g,''))||0;}
export function leadership(h,heroes){
 const d=heroes.find(x=>x.id===h.id),row=d?.mobileBaseStats?.find(x=>norm(x.label).includes('thong suat'));
 const base=numberFrom(row?.value);
 return {value:base||Math.max(100,Math.floor(250+int(h.level)*115)),evidence:base?'SOURCE_BASE_STAT':'SIMULATED_LOCAL_POLICY'};
}
export function populationCost(t){
 const n=Number(t?.mobilePopulation??t?.populationCost??t?.mobilePopulationCost);
 if(Number.isSafeInteger(n)&&n>0)return {value:n,evidence:'SOURCE_FIELD'};
 const label=norm(t?.mobileClass)+' '+norm(t?.name)+' '+norm(t?.role);
 if(/cung tien|xa thu/.test(label))return {value:2,evidence:'LIVE_UI_ARCHER_CLASS'};
 return {value:/ky binh|cong thanh/.test(label)?3:1,evidence:'SIMULATED_LOCAL_POLICY'};
}
export function squadCapacity(h,t,heroes){return Math.floor(leadership(h,heroes).value/populationCost(t).value);}
export function normalizeSourceSquads(s,troops){
 const valid=new Set(troops.map(t=>t.id));
 for(const h of s.heroes){h.sourceSquad=Object.fromEntries(Object.entries(h.sourceSquad||{}).filter(([id,n])=>valid.has(id)&&int(n)>0).map(([id,n])=>[id,int(n)]));}
}
export function sourceParty(s){
 return s.heroes.filter(h=>h.assigned&&Object.values(h.sourceSquad||{}).some(n=>n>0)).slice(0,5);
}
export function sourcePlan(s){
 const party=sourceParty(s),stacks=party.map(h=>Object.entries(h.sourceSquad).map(([id,count])=>({id,count}))),total={};
 for(const rows of stacks)for(const t of rows)total[t.id]=(total[t.id]||0)+t.count;
 return {ids:party.map(h=>h.id),stacks,total};
}
export function setSourceTroops(s,heroId,troopId,count,troops,heroes){
 if(s.queues.march)throw Error('Không phối binh trong lúc hành quân');
 const h=s.heroes.find(h=>h.id===heroId),t=troops.find(t=>t.id===troopId);
 if(!h||!t||!Number.isSafeInteger(count)||count<0)throw Error('Phối binh không hợp lệ');
 const old=h.sourceSquad?.[troopId]||0,pool=(s.army[troopId]||0)+old,command=leadership(h,heroes).value;
 const occupied=Object.entries(h.sourceSquad||{}).filter(([id])=>id!==troopId).reduce((n,[id,q])=>n+q*populationCost(troops.find(t=>t.id===id)).value,0);
 const cap=Math.max(0,Math.floor((command-occupied)/populationCost(t).value));
 if(count>pool||count>cap)throw Error('Vượt quân dự bị hoặc thống suất '+cap);
 h.sourceSquad={...h.sourceSquad};if(count)h.sourceSquad[troopId]=count;else delete h.sourceSquad[troopId];
 s.army[troopId]=pool-count;
}
export function releaseForMarch(s,plan){
 for(const id of plan.ids){const h=s.heroes.find(h=>h.id===id);for(const [unit,n] of Object.entries(h.sourceSquad))s.army[unit]=(s.army[unit]||0)+n;h.sourceSquad={};}
}
export function settleSourceSquads(s,q,battle,troops,heroes){
 if(!q.sourceOwned)return;
 // Settlement already returned survivors to reserve. Reassign survivors to original owners,
 // then top up from the real reserve if checkbox enabled. Never manufacture units.
 const rows=battle.sides?.[0]?.squads||[];
 for(const [i,id] of q.commanderIds.entries()){
  const h=s.heroes.find(x=>x.id===id);if(!h)continue;
  const row=rows.find(x=>x.id===id||x.instanceId===id||x.squadId===id)??rows[i];
  const survivors=Object.fromEntries((row?.stacks||[]).map(t=>[t.id,t.count]));
  for(const t of q.squadAllocation[i]||[]){
   const n=Math.min(t.count,s.army[t.id]||0,Math.max(0,survivors[t.id]||0));
   if(n){h.sourceSquad[t.id]=n;s.army[t.id]-=n;}
  }
 }
 for(const [i,id] of q.commanderIds.entries()){
  const h=s.heroes.find(x=>x.id===id);if(!h||!s.gameplay.r4.replenish[id])continue;
  for(const t of q.squadAllocation[i]||[]){
   const occupied=Object.entries(h.sourceSquad).reduce((n,[unit,c])=>n+c*populationCost(troops.find(t=>t.id===unit)).value,0),pop=populationCost(troops.find(x=>x.id===t.id)).value;
   const room=Math.max(0,Math.floor((leadership(h,heroes).value-occupied)/pop)),n=Math.min(room,s.army[t.id]||0,t.count-(h.sourceSquad[t.id]||0));
   if(n>0){h.sourceSquad[t.id]=(h.sourceSquad[t.id]||0)+n;s.army[t.id]-=n;}
  }
 }
}
export const BAG_GROUPS=Object.freeze([['all','Tất cả'],['gear','Trang bị'],['chest','Bảo rương'],['artifact','Bảo vật / pháp bảo'],['speed','Tăng tốc'],['production','Sản xuất'],['gem','Châu báu'],['material','Nguyên liệu'],['quest','Nhiệm vụ']]);
export function bagGroup(i){
 if(i.type==='pháp bảo')return 'artifact';
 if(i.type!=='vật phẩm')return 'gear';
 const group=norm(i.mobileGroup),name=norm(i.name);
 if(/bao ruong|ruong|hop qua/.test(group+' '+name))return 'chest';
 if(/tang toc/.test(group+' '+name))return 'speed';
 if(/san xuat/.test(group))return 'production';
 if(/chau bau|bao thach/.test(group))return 'gem';
 if(/nhiem vu/.test(group)||i.legacySourceId)return 'quest';
 if(/bao vat/.test(group))return 'artifact';
 return 'material';
}
