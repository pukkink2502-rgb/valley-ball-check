import test from 'node:test';import assert from 'node:assert/strict';
import {courtForSet,automaticFirstServer,isCoinTossSet,courtScoreView,courtScoreMessage} from './court-side-rules.mjs';
const m={team_a_id:'A',team_b_id:'B',best_of:5,court_sides:[{set:1,left_team_id:'B'},{set:5,left_team_id:'A'}],
sets:[],services:[{set:1,first_team_id:'A'},{set:2,first_team_id:'B'},{set:3,first_team_id:'A'},{set:4,first_team_id:'B'}]};
test('set 1 selected side, sets 2-4 alternate, deciding reselected',()=>{
 assert.equal(courtForSet(m,1).left,'B');assert.equal(courtForSet(m,2).left,'A');
 assert.equal(courtForSet(m,3).left,'B');assert.equal(courtForSet(m,4).left,'A');
 assert.equal(courtForSet(m,5).left,'A');
});
test('deciding set changes physical side at 8 without reassigning team identities',()=>{
 const x={...m,sets:[{set:5,a:8,b:5}]};
 assert.deepEqual([courtForSet(x,5).left,courtForSet(x,5).right],['B','A']);
 assert.equal(x.team_a_id,'A');
});
test('first server manually selected only first/decider; alternating in normal sets',()=>{
 assert.equal(isCoinTossSet(1,5),true);assert.equal(isCoinTossSet(2,5),false);
 assert.equal(isCoinTossSet(5,5),true);
 assert.equal(automaticFirstServer(m,2),'B');assert.equal(automaticFirstServer(m,3),'A');
 const three={...m,best_of:3,court_sides:[{set:1,left_team_id:'A'},{set:3,left_team_id:'B'}]};
 assert.equal(isCoinTossSet(3,3),true);assert.equal(automaticFirstServer(three,2),'B');
});

test('MAE HAO CUP: BANDONG gets its OWN 13 points on the LEFT; notification has same names',()=>{
 const snapshot={team_a_id:'spk',team_b_id:'bandong',team_a:'S.P.K VC',team_b:'BANDONG VC',
  best_of:3,court_sides:[{set:1,left_team_id:'bandong'}],
  sets:[{set:1,a:7,b:13}]};
 const board=courtScoreView(snapshot,1);
 assert.deepEqual([board.left.name,board.left.points,board.right.name,board.right.points],
  ['BANDONG VC',13,'S.P.K VC',7]);
 assert.equal(courtScoreMessage(snapshot,1),'เซต 1 · BANDONG VC 13 : 7 S.P.K VC');
 assert.deepEqual([snapshot.sets[0].a,snapshot.sets[0].b],[7,13]);
});
test('second set changes physical sides but preserves canonical score ownership',()=>{
 const snapshot={team_a_id:'spk',team_b_id:'bandong',team_a:'S.P.K VC',team_b:'BANDONG VC',
  best_of:3,court_sides:[{set:1,left_team_id:'bandong'}],
  sets:[{set:1,a:7,b:25},{set:2,a:18,b:20}]};
 const board=courtScoreView(snapshot,2);
 assert.deepEqual([board.left.name,board.left.points,board.right.name,board.right.points],
  ['S.P.K VC',18,'BANDONG VC',20]);
 assert.equal(courtScoreMessage(snapshot,2),'เซต 2 · S.P.K VC 18 : 20 BANDONG VC');
});
test('deciding set flips BOTH names and points at 8 without changing stored A/B numbers',()=>{
 const snapshot={team_a_id:'a',team_b_id:'b',team_a:'S.P.K VC',team_b:'BANDONG VC',
  best_of:3,court_sides:[{set:1,left_team_id:'b'},{set:3,left_team_id:'a'}],
  sets:[{set:3,a:8,b:6}]};
 const score=courtScoreView(snapshot,3);
 assert.deepEqual([score.left.name,score.left.points,score.right.name,score.right.points],
  ['BANDONG VC',6,'S.P.K VC',8]);
 assert.equal(courtScoreMessage(snapshot,3),'เซต 3 · BANDONG VC 6 : 8 S.P.K VC');
});
test('invalid/missing side mapping must not silently attach score to team B',()=>{
 const snapshot={team_a_id:'a',team_b_id:'b',team_a:'S.P.K VC',team_b:'BANDONG VC',
 best_of:3,sets:[{set:3,a:8,b:6}],court_sides:[{set:1,left_team_id:'a'}]};
 assert.equal(courtForSet(snapshot,3),null);
 assert.equal(courtScoreView(snapshot,3),null);
 assert.equal(courtScoreMessage(snapshot,3),null);
});
