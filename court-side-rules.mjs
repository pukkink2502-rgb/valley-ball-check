/** Side/team identity rules. Side changes NEVER change team A/B IDs or score ownership. */
export const opposite=(id,a,b)=>id===a?b:id===b?a:null;
export const isDecidingSet=(set,bestOf)=>Number(set)===Number(bestOf);
export const isCoinTossSet=(set,bestOf)=>Number(set)===1||isDecidingSet(set,bestOf);
export function courtForSet(snapshot,set){
 if(!snapshot?.team_a_id||!snapshot?.team_b_id)return null;
 const a=snapshot.team_a_id,b=snapshot.team_b_id;
 const isDeciding=isDecidingSet(set,snapshot.best_of);
 const entry=(snapshot.court_sides||[]).find(x=>Number(x.set)===(isDeciding?Number(set):1));
 if(!entry||![a,b].includes(entry.left_team_id))return null;
 let left=isDeciding||Number(set)%2===1?entry.left_team_id:opposite(entry.left_team_id,a,b);
 const current=(snapshot.sets||[]).find(x=>Number(x.set)===Number(set));
 const changed=isDeciding&&Math.max(Number(current?.a||0),Number(current?.b||0))>=8;
 if(changed)left=opposite(left,a,b);
 return {left,right:opposite(left,a,b),decidingSwitched:changed};
}
export function automaticFirstServer(snapshot,set){
 if(!snapshot||isCoinTossSet(set,snapshot.best_of))return null;
 const previous=(snapshot.services||[]).find(x=>Number(x.set)===Number(set)-1);
 return previous?.first_team_id?opposite(previous.first_team_id,snapshot.team_a_id,snapshot.team_b_id):null;
}

/**
 * Map canonical team A/B points to the physically displayed left/right sides.
 * A team's score NEVER changes ownership when its court side changes.
 * An optional court override supports clearly marked legacy matches.
 */
export function courtScoreView(snapshot,set,court=courtForSet(snapshot,set)){
 if(!snapshot||!court||![snapshot.team_a_id,snapshot.team_b_id].includes(court.left)
 || ![snapshot.team_a_id,snapshot.team_b_id].includes(court.right)
 || court.left===court.right)return null;
 const row=(snapshot.sets||[]).find(x=>Number(x.set)===Number(set));
 const team=id=>id===snapshot.team_a_id?
  {id,name:snapshot.team_a||snapshot.slot_a||"ทีม A",points:Number(row?.a)||0,index:0}:
  {id,name:snapshot.team_b||snapshot.slot_b||"ทีม B",points:Number(row?.b)||0,index:1};
 return {set:Number(set),left:team(court.left),right:team(court.right)};
}
export function courtScoreMessage(snapshot,set,court=courtForSet(snapshot,set)){
 const view=courtScoreView(snapshot,set,court);
 if(!view)return null;
 return "เซต "+view.set+" · "+view.left.name+" "+view.left.points+
 " : "+view.right.points+" "+view.right.name;
}
