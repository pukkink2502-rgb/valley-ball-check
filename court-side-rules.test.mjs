import test from 'node:test';import assert from 'node:assert/strict';
import {courtForSet,automaticFirstServer,isCoinTossSet} from './court-side-rules.mjs';
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
