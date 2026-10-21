import test from 'node:test';
import assert from 'node:assert/strict';
import {createScoresheetPreviewImages} from '../scoresheet-report.js';
// Lightweight Canvas2D mock: actually execute the entire page renderer, not only look for strings.
const drawn=[];
globalThis.document={createElement(kind){
 assert.equal(kind,'canvas');
 const canvas={width:0,height:0,toDataURL(type){assert.equal(type,'image/jpeg');return 'data:image/jpeg;base64,AA=='},getContext(type){
  assert.equal(type,'2d');
  return {
   fillStyle:'',strokeStyle:'',lineWidth:0,font:'',textAlign:'',
   fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
   fillText(...args){drawn.push(String(args[0]))},drawImage(){}
  };
 }};
 return canvas;
}};
test('landscape score document renders match summary and per-set sheets from actual event records',async()=>{
 const snapshot={
  id:'match-001',tournament:'รายการทดสอบ',team_a_id:'a',team_b_id:'b',
  team_a:'หมู่ 1',team_b:'หมู่ 4',best_of:3,status:'approved',sets_won:[2,0],
  sets:[{set:1,a:25,b:12,status:'complete'},{set:2,a:27,b:25,status:'complete'}],
  events:Array.from({length:25},(_,i)=>({seq:i+1,set:1,event:'point',payload:{team:0},at:'2026-10-21T09:00:00Z'})),
  roster:[],lineups:[],services:[{set:1,first_team_id:'a'}],court_sides:[{set:1,left_team_id:'b'}],
  official_name:'กรรมการ'
 };
 const images=await createScoresheetPreviewImages(snapshot,{name:'กรรมการ'});
 assert.equal(images.length,3);
 assert.ok(images.every(x=>x.startsWith('data:image/jpeg')));
 assert.ok(drawn.some(x=>x.includes('รายงานสกอร์ชีต')));
 assert.ok(drawn.some(x=>x.includes('ลำดับผู้เล่นเสิร์ฟ')));
 assert.ok(drawn.some(x=>x.includes('กรรมการ')));
});
test('deuce over 60 points produces continuation page without truncating scores',async()=>{
 const s={id:'m2',best_of:3,team_a_id:'a',team_b_id:'b',team_a:'A',team_b:'B',status:'live',sets_won:[0,0],
  sets:[{set:1,a:65,b:64,status:'complete'}],events:[],lineups:[],roster:[],services:[],court_sides:[]};
 const images=await createScoresheetPreviewImages(s);
 assert.equal(images.length,3);
});
