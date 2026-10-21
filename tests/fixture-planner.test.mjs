import test from "node:test";
import assert from "node:assert/strict";
import {roundRobinRounds,interleavePoolRounds,sequenceExisting,analyzeOrder} from "../lib/fixture-planner.mjs";
test("full round robin includes each unordered pairing exactly once",()=>{
 for(const count of [2,3,4,5,6,7,8,16]){
  const teams=Array.from({length:count},(_,i)=>"T"+i);
  const rounds=roundRobinRounds(teams);
  const pairs=rounds.flat();
  assert.equal(pairs.length,count*(count-1)/2,"count "+count);
  const keys=pairs.map(p=>[p.a,p.b].sort().join("|"));
  assert.equal(new Set(keys).size,keys.length);
  for(const round of rounds) {
   const all=round.flatMap(p=>[p.a,p.b]);
   assert.equal(new Set(all).size,all.length,"same round duplicate team");
  }
 }
});
test("interleaves two 4-team groups A/B without back-to-back team collisions",()=>{
 const p=[{code:"A",teams:["A1","A2","A3","A4"]},{code:"B",teams:["B1","B2","B3","B4"]}];
 const x=interleavePoolRounds(p);
 assert.equal(x.fixtures.length,12);
 assert.equal(x.totalRounds,3);
 assert.equal(analyzeOrder(x.fixtures).violations.length,0);
 for(let i=1;i<x.fixtures.length;i++)assert.notEqual(x.fixtures[i].group,x.fixtures[i-1].group);
});
test("small or unbalanced pools cannot silently guarantee zero rest conflict",()=>{
 const x=interleavePoolRounds([{code:"A",teams:["A1","A2","A3","A4"]}]);
 assert.equal(x.fixtures.length,6);
 assert.equal(x.warnings.length>0,true);
 assert.equal(analyzeOrder(x.fixtures).hasAdjacent,true);
});
test("sequencing matches preserves IDs and does not fabricate missing pairs",()=>{
 const groups=[{code:"A",teams:["A1","A2","A3","A4"]},{code:"B",teams:["B1","B2","B3","B4"]}];
 const base=interleavePoolRounds(groups);
 const original=base.fixtures.map((f,i)=>({id:"id"+i,team_a_id:f.a,team_b_id:f.b})).reverse();
 const seq=sequenceExisting(groups,original);
 assert.equal(seq.ordered.length,original.length);
 assert.deepEqual(new Set(seq.ordered.map(x=>x.id)),new Set(original.map(x=>x.id)));
 assert.equal(seq.warnings.length,0);
 const removed=original.slice(1);
 const shorter=sequenceExisting(groups,removed);
 assert.equal(shorter.ordered.length,removed.length);
});
test("does not allow repeated teams or an invalid group",()=>{
 assert.throws(()=>roundRobinRounds(["A","A"]),/INVALID_POOL/);
 assert.throws(()=>roundRobinRounds(["A"]),/INVALID_POOL/);
});
