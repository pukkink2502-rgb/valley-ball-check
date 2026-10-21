// Shared volleyball match/standings rules, development v0.1
// FIVB best-of-5 set targets, tournament-specific best-of-3 set targets.
export function setTarget(bestOf,setNumber){
 if(![3,5].includes(bestOf)||!Number.isInteger(setNumber)||setNumber<1||setNumber>bestOf)
  throw new Error("INVALID_SET");
 return setNumber===bestOf?15:25;
}
export function setWinner(scoreA,scoreB,bestOf,setNumber){
 if(![scoreA,scoreB].every(n=>Number.isInteger(n)&&n>=0&&n<=999))throw new Error("INVALID_POINTS");
 const target=setTarget(bestOf,setNumber);
 return (Math.max(scoreA,scoreB)>=target && Math.abs(scoreA-scoreB)>=2)
   ?(scoreA>scoreB?0:1):null;
}
export function matchSummary(sets,bestOf){
 if(!Array.isArray(sets)||sets.length<1||sets.length>bestOf)throw new Error("INVALID_SETS");
 let w=[0,0],points=[0,0];
 sets.forEach((s,i)=>{
  const a=Array.isArray(s)?s[0]:s.a,b=Array.isArray(s)?s[1]:s.b;
  const winner=setWinner(a,b,bestOf,i+1);
  if(winner===null||Math.max(...w)>=Math.ceil(bestOf/2))throw new Error("INVALID_SET_SEQUENCE");
  w[winner]++;points[0]+=a;points[1]+=b;
 });
 if(Math.max(...w)!==Math.ceil(bestOf/2))throw new Error("MATCH_NOT_FINISHED");
 return {winner:w[0]>w[1]?0:1,setsWon:w,points};
}
export function standingPoints(summary,bestOf){
 if(![3,5].includes(bestOf))throw new Error("INVALID_FORMAT");
 const loserSets=Math.min(...summary.setsWon),winner=summary.winner;
 const winPoints=loserSets===(Math.ceil(bestOf/2)-1)?2:3;
 return winner===0?[winPoints,3-winPoints]:[3-winPoints,winPoints];
}
export function compareQuotient(aNum,aDen,bNum,bDen){
 if([aNum,aDen,bNum,bDen].some(n=>!Number.isSafeInteger(n)||n<0))throw new Error("INVALID_RATIO");
 function rank(n,d){return d===0?(n>0?2:0):1}
 const x=rank(aNum,aDen),y=rank(bNum,bDen);
 if(x!==y)return x>y?1:-1;
 if(x!==1)return 0;
 const left=BigInt(aNum)*BigInt(bDen),right=BigInt(bNum)*BigInt(aDen);
 return left>right?1:left<right?-1:0;
}
function baseCompare(a,b){
 if(a.wins!==b.wins)return b.wins-a.wins;
 if(a.matchPoints!==b.matchPoints)return b.matchPoints-a.matchPoints;
 let x=compareQuotient(a.setsFor,a.setsAgainst,b.setsFor,b.setsAgainst);
 if(x!==0)return -x;
 x=compareQuotient(a.pointsFor,a.pointsAgainst,b.pointsFor,b.pointsAgainst);
 return -x;
}
export function buildStandings(teamIds,matches){
 const rows=new Map();
 for(const id of teamIds){if(rows.has(id))throw new Error("DUPLICATE_TEAM");rows.set(id,{id,played:0,wins:0,losses:0,matchPoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,rank:null,pendingTie:false})}
 for(const m of matches){
  if(m.approved!==true)continue;
  const a=rows.get(m.teamA),b=rows.get(m.teamB);
  if(!a||!b||a===b)throw new Error("INVALID_MATCH_TEAMS");
  const summary=matchSummary(m.sets,m.bestOf);
  const pts=standingPoints(summary,m.bestOf);
  a.played++;b.played++;
  a.wins+=summary.winner===0?1:0;b.wins+=summary.winner===1?1:0;
  a.losses+=summary.winner===1?1:0;b.losses+=summary.winner===0?1:0;
  a.matchPoints+=pts[0];b.matchPoints+=pts[1];
  a.setsFor+=summary.setsWon[0];a.setsAgainst+=summary.setsWon[1];
  b.setsFor+=summary.setsWon[1];b.setsAgainst+=summary.setsWon[0];
  a.pointsFor+=summary.points[0];a.pointsAgainst+=summary.points[1];
  b.pointsFor+=summary.points[1];b.pointsAgainst+=summary.points[0];
 }
 const sorted=[...rows.values()].sort((a,b)=>baseCompare(a,b));
 let rank=1;
 for(let i=0;i<sorted.length;){
  let j=i+1;
  while(j<sorted.length&&baseCompare(sorted[i],sorted[j])===0)j++;
  // Head-to-head can decide tied pairs when the competition regulation explicitly does.
  // Unresolved pairs and multi-team ties remain shared rank / pending per V3.2.1.
  if(j-i===2){
   const [a,b]=[sorted[i],sorted[i+1]];
   let hA=0,hB=0;
   for(const m of matches){
    if(m.approved!==true||!((m.teamA===a.id&&m.teamB===b.id)||(m.teamA===b.id&&m.teamB===a.id)))continue;
    const w=matchSummary(m.sets,m.bestOf).winner;
    const who=w===0?m.teamA:m.teamB;
    if(who===a.id)hA++;else hB++;
   }
   if(hA!==hB){
    if(hB>hA){sorted[i]=b;sorted[i+1]=a;}
    sorted[i].rank=rank;sorted[i+1].rank=rank+1;
   }else {sorted[i].rank=rank;sorted[i+1].rank=rank;sorted[i].pendingTie=sorted[i+1].pendingTie=true;}
  }else{
   for(let k=i;k<j;k++){sorted[k].rank=rank;sorted[k].pendingTie=j-i>1;}
  }
  rank+=j-i;i=j;
 }
 return sorted;
}
