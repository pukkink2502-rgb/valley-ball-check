import {db,$,elem,box,api,owned,opt,downloadBlob} from "./suite-core.js";
import {buildStandings} from "./lib/volleyball-rules.mjs";

const nav=document.createElement("button");nav.dataset.page="public";nav.textContent="◷ โปรแกรมและอันดับ";
const navParent=document.querySelector(".nav"),scoreNav=navParent.querySelector('button[data-page="scoreboard"]');
navParent.insertBefore(nav,scoreNav||null);
const root=document.createElement("section");root.id="public";root.className="page";root.innerHTML="<div class=\"eyebrow\">โปรแกรมการแข่งขัน</div><h1>โปรแกรมและตารางคะแนน</h1>\n<p>แสดงรายการที่เผยแพร่แล้ว ตารางคะแนนจะนับเฉพาะผลที่รับรองแล้วในรอบพบกันหมด ไม่รวมรอบแพ้คัดออก</p>\n<div class=\"card\"><div class=\"formrow\"><label>เลือกรายการแข่งขัน<select id=\"pubTournament\"></select></label>\n<button class=\"btn\" id=\"pubReload\">↻ โหลดใหม่</button><button class=\"btn\" id=\"pubCopy\">แชร์ลิงก์</button></div><p id=\"pubStatus\" role=\"status\"></p></div>\n<div class=\"card\" style=\"margin-top:16px\"><h3 id=\"pubTitle\">ตารางคะแนน</h3>\n<div class=\"tablewrap\"><table><thead><tr><th>อันดับ</th><th>ทีม</th><th>แข่ง</th><th>ชนะ</th><th>คะแนน</th><th>เซตได้–เสีย</th><th>แต้มได้–เสีย</th></tr></thead><tbody id=\"pubStandings\"></tbody></table></div>\n<p class=\"small\">ใช้เกณฑ์ชนะ → คะแนนสะสม → อัตราส่วนเซต → อัตราส่วนแต้ม → ผลพบกัน หากเสมอทั้งหมดจะแสดงรอการตัดสิน</p></div>\n<div class=\"card\" style=\"margin-top:16px\"><h3>โปรแกรมทุกคู่ ตั้งแต่รอบแรกจนรอบชิง</h3><p id=\"pubNextMatch\" class=\"small\">เลือกดูรายการเพื่อแสดงคู่ถัดไป</p><div class=\"tablewrap\">\n<table><thead><tr><th>คู่</th><th>รอบการแข่งขัน</th><th>ทีมแรก</th><th>ทีมที่สอง</th><th>วันเวลา</th><th>สนาม</th><th>ผล</th></tr></thead>\n<tbody id=\"pubFixtures\"></tbody></table></div>\n<div class=\"actions\"><button class=\"btn\" id=\"pubCSV\">ส่งออก CSV</button><button class=\"btn\" id=\"pubPrint\">พิมพ์ / บันทึก PDF</button></div></div>\n<div class=\"card\" id=\"pubOwner\" hidden style=\"margin-top:16px\"><h3>จัดการเผยแพร่และเวลาแข่งขัน</h3>\n<div class=\"formrow\"><label>เลือกรายการของฉัน<select id=\"pubOwnerTournament\"></select></label>\n<button class=\"btn primary\" id=\"pubPublish\">เผยแพร่รายการ</button></div>\n<div class=\"formrow\"><label>เลือกคู่แข่งขัน<select id=\"pubMatchPick\"></select></label>\n<label>วันที่และเวลา<input id=\"pubStart\" type=\"datetime-local\"></label><label>สนาม<input id=\"pubCourt\" placeholder=\"สนาม 1\"></label></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"pubSchedule\">บันทึกเวลาแข่งขัน</button></div>\n<p id=\"pubOwnerStatus\" role=\"status\" class=\"small\"></p>\n<p class=\"small\">โปรแกรมจะยังคงลำดับคู่เดิม และตรวจการชนกันของสนาม/เวลาพักเมื่อบันทึกเวลา</p></div>";
document.querySelector(".content").insertBefore(root,document.querySelector(".footer"));
nav.onclick=()=>{document.querySelectorAll(".page").forEach(s=>s.classList.toggle("active",s===root));
document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b===nav));
$("location").textContent="โปรแกรมและอันดับ";window.scrollTo(0,0)};
let current=null,list=[],owners=[];
const pop=(x,type="success",detail="")=>window.VBC?.notify(x,type,detail);
const say=(msg,err=false)=>box("pubStatus",msg,err),admin=(msg,err=false)=>box("pubOwnerStatus",msg,err);
const dstr=d=>d?new Date(d).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"}):"ยังไม่กำหนด";
function tableRows(id,rows){
 const el=$(id);el.replaceChildren();
 if(!rows.length){const tr=elem("tr"),cell=elem("td","ยังไม่มีข้อมูล");cell.colSpan=7;tr.append(cell);el.append(tr);}
 for(const data of rows){const tr=elem("tr");for(const val of data)tr.append(elem("td",val??""));el.append(tr);}
}
async function init(){
 try{list=await api("public_tournament_list",{});
  const selected=$("pubTournament").value;
  opt($("pubTournament"),list.map(t=>({label:t.name+" ("+t.status+")",value:t.slug})),"เลือกรายการ");
  if(list.some(x=>x.slug===selected))$("pubTournament").value=selected;
  say("มีรายการที่เผยแพร่ "+list.length+" รายการ");
  const hash=location.hash.match(/^#public=([a-z0-9-]+)$/);
  const target=hash?.[1]||$("pubTournament").value;
  if(target&&list.some(x=>x.slug===target)){
   $("pubTournament").value=target;
   if(hash)nav.click();
   await show(target);
  }
 }catch(e){say("ไม่สามารถโหลดรายการได้: "+e.message,true)}
 try{
  owners=await owned();
  $("pubOwner").hidden=false;
  const old=$("pubOwnerTournament").value;
  opt($("pubOwnerTournament"),owners.map(x=>({label:x.name+" · "+x.status,value:x.id})),"เลือกรายการของฉัน");
  if(owners.some(x=>x.id===old))$("pubOwnerTournament").value=old;
  if($("pubOwnerTournament").value)await ownerMatches();
 }catch(e){$("pubOwner").hidden=true}
}
async function show(slug){
 if(!slug)return;
 try{
  current=await api("public_tournament_snapshot",{p_slug:slug});
  const names=new Map(current.teams.map(x=>[x.id,x.name]));
  const poolMatches=current.matches.filter(m=>["pool","round_robin"].includes(m.stage_type));
  const matches=poolMatches.map(m=>({teamA:m.team_a_id,teamB:m.team_b_id,bestOf:m.best_of,sets:m.sets,approved:m.status==="approved"}));
  const standings=poolMatches.length?buildStandings(current.teams.map(x=>x.id),matches):[];
  tableRows("pubStandings",standings.map(s=>[s.rank+(s.pendingTie?" · รอตัดสิน":""),names.get(s.id),s.played,s.wins,s.matchPoints,s.setsFor+"–"+s.setsAgainst,s.pointsFor+"–"+s.pointsAgainst]));
  const player=m=>names.get(m)||null;
  const first=m=>player(m.team_a_id)||m.slot_a||"รอระบุทีม";
  const second=m=>player(m.team_b_id)||m.slot_b||"รอระบุทีม";
  tableRows("pubFixtures",current.matches.map((m,i)=>[i+1,m.stage_title+(m.round_number?" · รอบ "+m.round_number:""),
   first(m),second(m),dstr(m.scheduled_start),m.court||"—",
   m.status==="approved"?m.sets_a+"–"+m.sets_b:m.status==="live"?"กำลังแข่งขัน":m.status==="pending_approval"?"รอรับรอง":"ยังไม่แข่งขัน"]));
  const next=current.matches.find(m=>["scheduled","live","pending_approval"].includes(m.status));
  $("pubNextMatch").textContent=next?"คู่ถัดไป: "+first(next)+" พบ "+second(next)+" · "+next.stage_title+
   (next.scheduled_start?" · "+dstr(next.scheduled_start):" · ยังไม่กำหนดเวลา"):
   "ยังไม่มีคู่ที่รอแข่งขัน";
  $("pubTitle").textContent=(poolMatches.length?"ตารางคะแนนรอบพบกันหมด":"รูปแบบนี้ไม่มีตารางคะแนนสะสม")+" · "+current.name;
  say("แสดง "+current.teams.length+" ทีม · "+current.matches.length+" คู่แล้ว");
 }catch(e){current=null;say("ไม่สามารถเปิดรายการได้: "+e.message,true);pop("โหลดตารางคะแนนไม่สำเร็จ","error",e.message)}
}
async function ownerMatches(){
 const id=$("pubOwnerTournament").value;if(!id){opt($("pubMatchPick"),[],"เลือกรายการก่อน");return}
 try{
  const [mr,tr]=await Promise.all([
   db.from("matches").select("id,team_a_id,team_b_id,slot_a,slot_b,stage_id,status,court,scheduled_start").eq("tournament_id",id).order("created_at"),
   db.from("tournament_teams").select("team_id").eq("tournament_id",id)
  ]);
  if(mr.error||tr.error)throw (mr.error||tr.error);
  const ids=tr.data.map(x=>x.team_id);
  const names=new Map();
  if(ids.length){const t=await db.from("teams").select("id,name").in("id",ids);if(t.error)throw t.error;for(const team of t.data)names.set(team.id,team.name)}
  opt($("pubMatchPick"),mr.data.map((m,i)=>({value:m.id,label:"คู่ "+(i+1)+" · "+(names.get(m.team_a_id)||m.slot_a||"รอระบุ")+" พบ "+(names.get(m.team_b_id)||m.slot_b||"รอระบุ")})),"เลือกคู่แข่งขัน");
  admin("โหลดคู่แข่งขัน "+mr.data.length+" คู่แล้ว");
 }catch(e){admin(e.message,true)}
}
$("pubTournament").onchange=e=>show(e.target.value);
$("pubReload").onclick=()=>init().then(()=>pop("โหลดข้อมูลล่าสุดแล้ว"));
$("pubCopy").onclick=async()=>{
 const slug=$("pubTournament").value;if(!slug)return pop("เลือกรายการแข่งขันก่อน","error");
 const url=location.origin+location.pathname+"#public="+slug;
 try{await navigator.clipboard.writeText(url);pop("คัดลอกลิงก์รายการแล้ว")}
 catch{say("ลิงก์: "+url)}
};
function csv(v){let x=String(v??"");if(/^[=+\-@\t\r]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'}
$("pubCSV").onclick=()=>{
 if(!current)return pop("เลือกรายการแข่งขันก่อน","error");
 const names=new Map(current.teams.map(x=>[x.id,x.name]));
 const rows=[["รอบการแข่งขัน","ทีมแรก","ทีมที่สอง","วันเวลา","สนาม","สถานะ","เซต A","เซต B"]];
 for(const m of current.matches)rows.push([m.stage_title,names.get(m.team_a_id)||m.slot_a||"",names.get(m.team_b_id)||m.slot_b||"",m.scheduled_start||"",m.court||"",m.status,m.sets_a,m.sets_b]);
 downloadBlob(new Blob(["\ufeff"+rows.map(x=>x.map(csv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),"โปรแกรมแข่งขัน.csv");pop("ดาวน์โหลดไฟล์ CSV แล้ว");
};
$("pubPrint").onclick=()=>window.print();
$("pubOwnerTournament").onchange=ownerMatches;
$("pubPublish").onclick=async()=>{
 const id=$("pubOwnerTournament").value;if(!id)return pop("เลือกรายการแข่งขันก่อน","error");
 if(!confirm("เผยแพร่รายการนี้ให้ผู้อื่นดูชื่อทีมและโปรแกรมได้?"))return;
 try{const res=await api("publish_tournament",{p_tournament:id});await init();$("pubTournament").value=res.slug;await show(res.slug);pop("เผยแพร่รายการสำเร็จ")}
 catch(e){admin(e.message,true);pop("เผยแพร่ไม่สำเร็จ","error",e.message)}
};
$("pubSchedule").onclick=async()=>{
 const id=$("pubMatchPick").value,start=$("pubStart").value,court=$("pubCourt").value.trim();
 if(!id||!start||!court)return pop("กรอกข้อมูลไม่ครบ","error","เลือกคู่ วันที่เวลา และสนามก่อนบันทึก");
 try{const result=await api("set_match_schedule",{p_match:id,p_start:new Date(start).toISOString(),p_court:court});
  admin("บันทึก "+dstr(result.scheduled_start)+" · "+result.court+" สำเร็จ");pop("บันทึกเวลาแข่งขันสำเร็จ");
 }catch(e){admin(e.message,true);pop("บันทึกเวลาไม่ได้","error",e.message)}
};
db.auth.onAuthStateChange(()=>setTimeout(()=>init().catch(console.warn),0));
init();
