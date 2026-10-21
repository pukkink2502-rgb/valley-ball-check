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
