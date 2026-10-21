// Generate true round-robin rounds and a fair interleaved fixture order.
// No implied dates, court slots or guarantees of a 45/60 minute rest without real clock times.
export function roundRobinRounds(teams) {
 if(!Array.isArray(teams)||teams.length<2||teams.length>64||new Set(teams).size!==teams.length)
  throw new Error("INVALID_POOL");
 const arr=[...teams];
 if(arr.length%2)arr.push(null);
 const rounds=[];
 for(let round=1;round<arr.length;round++){
  const pairs=[];
  for(let i=0;i<arr.length/2;i++){
   const a=arr[i],b=arr[arr.length-1-i];
   if(a!==null&&b!==null)pairs.push({a,b,round});
  }
  rounds.push(pairs);
  // Circle method: anchor position 1, rotate remaining positions.
  arr.splice(1,0,arr.pop());
 }
 return rounds;
}
export function interleavePoolRounds(pools) {
 if(!Array.isArray(pools)||!pools.length||pools.length>26)throw new Error("INVALID_POOLS");
 const byPool=pools.map((p,i)=>({
  code:p.code||String.fromCharCode(65+i),
  rounds:p.teams?.length>=2?roundRobinRounds(p.teams):[]
 }));
 let out=[],lastGroup="",lastSeen=new Map(),warnings=[];
 const rounds=Math.max(...byPool.map(p=>p.rounds.length),0);
 for(let round=1;round<=rounds;round++){
  const remaining=[];
  for(const p of byPool)for(const pair of p.rounds[round-1]||[])remaining.push({...pair,group:p.code});
  while(remaining.length){
   const pos=out.length;
   function cost(pair){
    const gap=Math.min(...[pair.a,pair.b].map(t=>lastSeen.has(t)?pos-lastSeen.get(t)-1:999));
    const consecutive=gap===0?10000:gap===1?180:gap===2?40:0;
    const samePool=pair.group===lastGroup?350:0;
    // Prefer early placement of a pool that has few future alternatives.
    return consecutive+samePool+((pair.group.charCodeAt(0)-65)*0.01);
   }
   remaining.sort((a,b)=>cost(a)-cost(b)||a.group.localeCompare(b.group)||String(a.a).localeCompare(String(b.a)));
   const next=remaining.shift();
   const adjacent=[next.a,next.b].some(t=>lastSeen.get(t)===pos-1);
   if(adjacent)warnings.push({type:"ADJACENT_TEAM",round,fixture:pos+1,group:next.group});
   out.push(next);lastGroup=next.group;lastSeen.set(next.a,pos);lastSeen.set(next.b,pos);
  }
 }
 return {fixtures:out,warnings,totalRounds:rounds};
}
export function sequenceExisting(pools,matches){
 const {fixtures,totalRounds}=interleavePoolRounds(pools);
 const indexes=new Map(),taken=new Set(),ordered=[];
 for(const m of matches){
  if(!m.team_a_id||!m.team_b_id)continue;
  const key=[m.team_a_id,m.team_b_id].sort().join("|");
  if(!indexes.has(key))indexes.set(key,[]);
  indexes.get(key).push(m);
 }
 for(const pair of fixtures){
  const key=[pair.a,pair.b].sort().join("|");
  const m=(indexes.get(key)||[]).find(x=>!taken.has(x.id));
  if(m){taken.add(m.id);ordered.push({...m,round:pair.round,group:pair.group});}
 }
 for(const m of matches)if(!taken.has(m.id))ordered.push({...m,round:Math.max(1,totalRounds+1),group:"อื่น ๆ"});
 const last=new Map(),warnings=[];
 ordered.forEach((m,i)=>{
  if([m.team_a_id,m.team_b_id].some(t=>t&&last.has(t)&&i-last.get(t)<=1))warnings.push({index:i+1,reason:"TEAM_ADJACENT"});
  for(const t of [m.team_a_id,m.team_b_id])if(t)last.set(t,i);
 });
 return {ordered,warnings,totalRounds,allTeams:PoolsSize(pools)};
}
function PoolsSize(pools){return pools.reduce((n,p)=>n+(p.teams?.length||0),0);}
export function analyzeOrder(fixtures){
 const seen=new Map(),violations=[];
 fixtures.forEach((m,i)=>{
  for(const team of [m.team_a_id||m.a,m.team_b_id||m.b]){
   if(!team)continue;
   if(seen.has(team)&&i-seen.get(team)===1)violations.push({at:i+1,team,kind:"ADJACENT"});
   seen.set(team,i);
  }
 });
 return {violations,hasAdjacent:violations.length>0,requiresRealRestCheck:true};
}
