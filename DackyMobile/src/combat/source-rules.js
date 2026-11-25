// Source-aware Mobile artifact/hero adapter. Compiled operations are not proof of exact original combat timing.
export function createSourceRules(){
 const norm=v=>String(v??'').replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const num=v=>typeof v==='number'&&Number.isFinite(v)?v:/^\d+$/.test(String(v??'').trim())?Number(v):null;
 const info=(row,title)=>Object.fromEntries(row.details.find(b=>b.k==='cs'&&b.t===title)?.ds||[]);
 const ratio=(s)=>Number(s.replace(',','.'))/100;
 function compileText(text){
  const t=norm(text).replace(/[.!。]+$/,'').trim();
  const ops=[],unknown=[],assumptions=[];
  const op=(kind,params={})=>ops.push({kind,...params});
  // Complex clauses must be matched as a whole before the generic comma parser.
  if(t==='dot tinh luc de tang the luc tuong hien tai'){op('convert',{from:'mana',to:'vitality'});assumptions.push('conversion ratio and caps require explicit policy');}
  else if(t==='khoa tuong hien tai cua doi phuong khong cho thay ra, den khi binh luc ve 0'){op('lockSwitch');}
  else if(t==='dot the luc de tang tinh luc tuong hien tai'){op('convert',{from:'vitality',to:'mana'});assumptions.push('conversion ratio and caps require explicit policy');}
  else if(t==='hiep nay khong danh; khi trung don tra lai luong ton that tuong duong. chi hieu luc khi bi dich diet gon'){op('skipAttack');op('reflectLethal');}
  else if(t==='hiep nay chan moi don cua dich nhung ban than cung khong danh'){op('skipAttack');op('blockAttack');}
  else if(t==='khi binh luc con tren 1: hiep nay du dich danh bao nhieu, binh luc khong tut duoi 1'){op('floorOne');}
  else if(t==='tang 20% cong kich linh; neu quan dich dong gap 2 lan quan ta, tang them 15% nua'){op('modifier',{side:'own',stat:'attack',ratio:.20});op('modifier',{side:'own',stat:'attack',ratio:.15,condition:'enemyAtLeastTwiceOwn'});}
  else if(t==='tang 25% cong kich linh phe ta; neu trieu cong minh mang dinh hai than chau thi tang them 25% phong thu'){op('modifier',{side:'own',stat:'attack',ratio:.25});op('modifier',{side:'own',stat:'defense',ratio:.25,condition:'equippedCompanion',artifactId:'8822',heroId:'trieu-cong-minh'});assumptions.push('companion mapped by linked source IDs; verify equip slot compatibility');}
  else if(t==='tang 25% phong thu linh phe ta; neu trieu cong minh mang tu kim tien thi tang them 25% cong kich'){op('modifier',{side:'own',stat:'defense',ratio:.25});op('modifier',{side:'own',stat:'attack',ratio:.25,condition:'equippedCompanion',artifactId:'8821',heroId:'trieu-cong-minh'});assumptions.push('companion name alias and equip slot compatibility need verification');}
  else if(t==='dung trong tran: khoa tuyet ky bi dong nghich thien thuat cua dich trong hiep nay'){op('sealPassive',{name:'Nghịch Thiên Thuật'});}
  else {
   // These conjunctions occur in the actual catalog and have separable effects.
   const clauses=t.replace(/ va (?=(?:tang|giam|tru|hoi)\s+\d)/g,', ').split(/,\s*(?![^()]*\))/);
   for(const raw of clauses){
    let c=raw.trim().replace(/[.!。]+$/,'');let m;
    if(c==='vo hieu phap bao doi phuong'||c==='nuot hieu qua phap bao dich'){op('cancelArtifact');continue;}
    if(c==='nuot hieu qua phap thuat cua than tien dich'){op('cancelSpell');continue;}
    if(c==='cam than tien doi phuong thi trien phap thuat'){op('silenceSpell');continue;}
    if(c==='xua tan moi hieu qua phap thuat'){op('dispelSpells');continue;}
    if(c==='dua the luc than tien ca hai ben ve dung 1 diem'){op('setVitalityBoth',{value:1});continue;}
    if(/^khoa (?:tuong hien tai cua doi phuong|than tien dich) khong cho thay ra(?:,)? den khi (?:binh luc|linh) ve 0$/.test(c)){op('lockSwitch');continue;}
    if((m=c.match(/^giam (\d+) diem trung thanh cua than tien dich hien tai$/))){op('loyalty',{side:'enemy',amount:-Number(m[1])});continue;}
    if((m=c.match(/^tru (\d+) diem ben moi trang bi cua than tien dich$/))){op('durability',{side:'enemy',amount:-Number(m[1])});continue;}
    if((m=c.match(/^(tang|giam) (\d+(?:[.,]\d+)?)% (cong kich|phong thu)(?: linh)? (phe ta|dich|linh dich|phe dich)$/))){
      op('modifier',{side:m[4]==='phe ta'?'own':'enemy',stat:m[3]==='cong kich'?'attack':'defense',ratio:(m[1]==='giam'?-1:1)*ratio(m[2])});continue;}
    if((m=c.match(/^tang (\d+(?:[.,]\d+)?)% phong thu linh$/))){op('modifier',{side:'own',stat:'defense',ratio:ratio(m[1])});continue;}
    if((m=c.match(/^giam (\d+(?:[.,]\d+)?)% (?:so linh|toan bo linh|binh luc) dich$/))){op('troopLoss',{side:'enemy',ratio:ratio(m[1]),base:'current'});continue;}
    if((m=c.match(/^(tang|hoi) (\d+(?:[.,]\d+)?)% so linh phe ta(?: \(khong vuot qua so mang theo luc vao tran\))?$/))){op('troopRecover',{side:'own',ratio:ratio(m[2]),base:'current',cap:'initial'});continue;}
    unknown.push(c);
   }
  }
  if(ops.some(o=>['troopLoss','troopRecover'].includes(o.kind)))assumptions.push('current troop count basis, floor rounding and initial recovery cap are provisional');
  if(ops.some(o=>['modifier','cancelArtifact','cancelSpell','silenceSpell','dispelSpells','sealPassive'].includes(o.kind)))assumptions.push('round scope and phase ordering are provisional unless stated in text');
  return {status:unknown.length?(ops.length?'PARTIAL':'UNKNOWN'):ops.length?'MAPPED':'UNKNOWN',ops,unknown,assumptions:[...new Set(assumptions)]};
 }
 function buildSourceIndex(database){
  if(!database?.source?.version||!database.categories)throw Error('Missing source snapshot');
  const hs=database.categories['than-tien'],as=database.categories['phap-bao'];if(!Array.isArray(hs)||!Array.isArray(as))throw Error('Missing source categories');
  const heroes={},artifacts={},links=[];
  for(const x of hs){
   const id=String(x.id);if(Object.hasOwn(heroes,id))throw Error('Duplicate hero');
   const st=info(x,'Chỉ số khởi điểm'),i=info(x,'Thông tin');
   const root=String(st['Căn cốt']??'').match(/^(\d+)/);
   const p={id,name:x.name,occupation:i['Nghề']??null,faction:i['Giáo phái']??null,root:root?Number(root[1]):null,rootText:st['Căn cốt']??null,baseLevel:num(st['Cấp gốc']),physical:num(st['Dũng vũ']),arcane:num(st['Đạo pháp']),strategy:num(st['Mưu lược']),vitality:num(st['Thể lực']),spirit:num(st['Tinh lực']),exclusiveArtifactIds:[],sourceVersion:database.source.version,evidence:'VERIFIED_MOBILE'};
   for(const block of x.details.filter(b=>b.k==='kn'&&b.t==='Pháp bảo chuyên thuộc'))for(const z of block.ds||[]){
    const m=String(z.lk??'').match(/^phap-bao\/(.+)$/);if(!m)throw Error('Invalid artifact link '+id);
    const level=String(z.n?.[0]??'').match(/(\d+)/);
    links.push({heroId:id,artifactId:m[1],name:z.t,requiredLevel:level?Number(level[1]):null,evidence:'VERIFIED_MOBILE'});p.exclusiveArtifactIds.push(m[1]);
   }
   heroes[id]=p;
  }
  for(const x of as){
   const id=String(x.id);if(Object.hasOwn(artifacts,id))throw Error('Duplicate artifact');
   const i=info(x,'Thông tin'),text=x.details.find(b=>b.k==='mo'&&b.t==='Tiên pháp')?.v??'';
   const ownerIds=(x.details.find(b=>b.k==='icon'&&b.t==='Chuyên thuộc')?.ds||[]).map(z=>String(z.lk??'').replace(/^than-tien\//,''));
   artifacts[id]={id,name:x.name,occupation:i['Nghề dùng']??null,requiredLevel:num(i['Cấp cần']),manaCost:num(i['Pháp lực tiêu hao']),ownerIds,text,sourceVersion:database.source.version,evidence:'VERIFIED_MOBILE',...compileText(text)};
  }
  for(const l of links){const a=artifacts[l.artifactId];if(!a||a.name!==l.name||!a.ownerIds.includes(l.heroId))throw Error('Unresolved exclusive link '+l.artifactId);}
  for(const a of Object.values(artifacts))for(const id of a.ownerIds)if(!heroes[id]||!links.some(l=>l.heroId===id&&l.artifactId===a.id))throw Error('Unresolved artifact owner '+a.id);
  const all=Object.values(artifacts);return {sourceVersion:database.source.version,sourceProvenance:{heroes:database.source.categorySources?.['than-tien'],artifacts:database.source.categorySources?.['phap-bao']},heroes,artifacts,links,coverage:{heroes:Object.keys(heroes).length,linkedHeroes:new Set(links.map(l=>l.heroId)).size,exclusiveLinks:links.length,artifacts:all.length,distinctTexts:new Set(all.map(a=>a.text)).size,mapped:all.filter(a=>a.status==='MAPPED').length,partial:all.filter(a=>a.status==='PARTIAL').length,unknown:all.filter(a=>a.status==='UNKNOWN').length}};
 }
 return {compileText,buildSourceIndex};
}
const api=createSourceRules();
export const compileText=api.compileText;
export const buildSourceIndex=api.buildSourceIndex;
