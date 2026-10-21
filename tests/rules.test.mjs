import test from 'node:test';
import assert from 'node:assert/strict';
import {setTarget,setWinner,matchSummary,standingPoints,compareQuotient,buildStandings} from '../lib/volleyball-rules.mjs';
test('best-of-3 25/25/15 targets and deuce by two',()=>{
 assert.deepEqual([1,2,3].map(n=>setTarget(3,n)),[25,25,15]);
 assert.equal(setWinner(25,24,3,1),null);
 assert.equal(setWinner(26,24,3,1),0);
 assert.equal(setWinner(15,13,3,3),0);
});
test('best-of-5 25/25/25/25/15',()=>assert.deepEqual([1,2,3,4,5].map(n=>setTarget(5,n)),[25,25,25,25,15]));
test('best-of-3 match points 3/0 and 2/1',()=>{
 assert.deepEqual(standingPoints(matchSummary([[25,20],[25,22]],3),3),[3,0]);
 assert.deepEqual(standingPoints(matchSummary([[25,20],[21,25],[15,12]],3),3),[2,1]);
});
test('best-of-5 match points 3/0 and 2/1',()=>{
 assert.deepEqual(standingPoints(matchSummary([[25,20],[25,20],[25,20]],5),5),[3,0]);
 assert.deepEqual(standingPoints(matchSummary([[25,20],[25,20],[24,26],[23,25],[15,13]],5),5),[2,1]);
});
test('reject premature match results',()=>assert.throws(()=>matchSummary([[25,20]],3),/MATCH_NOT_FINISHED/));
test('exact quotient and undefeated handling',()=>{
 assert.ok(compareQuotient(8,0,8,2)>0);
 assert.ok(compareQuotient(0,0,4,2)<0);
 assert.ok(compareQuotient(6,2,9,3)===0);
});
test('unapproved match does not affect official standings',()=>{
 const rows=buildStandings(['A','B'],[{teamA:'A',teamB:'B',bestOf:3,sets:[[25,21],[25,21]],approved:false}]);
 assert.equal(rows[0].wins,0);assert.equal(rows[1].wins,0);
 assert.equal(rows[0].rank,1);assert.equal(rows[1].rank,1);
 assert.equal(rows[0].pendingTie,true);
});
test('approved win ranks above lower win count',()=>{
 const rows=buildStandings(['A','B'],[{teamA:'A',teamB:'B',bestOf:3,sets:[[25,21],[25,21]],approved:true}]);
 assert.equal(rows[0].id,'A');assert.equal(rows[0].rank,1);assert.equal(rows[1].rank,2);
});
