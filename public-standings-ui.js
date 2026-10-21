import {db,$,elem,box,api,owned,opt,downloadBlob} from "./suite-core.js";
import {buildStandings} from "./lib/volleyball-rules.mjs";
const nav=document.createElement("button");nav.dataset.page="public";nav.textContent="◷ โปรแกรมและอันดับ";document.querySelector(".nav").append(nav);
const root=document.createElement("section");root.id="public";root.className="page";root.innerHTML="\n<div class=\"eyebrow\">PUBLIC RESULTS • FIXTURES • STANDINGS</div><h1>โปรแกรมและตารางคะแนน</h1>\n<p>เปิดดูรายการที่เผยแพร่ได้โดยไม่ต้องล็อกอิน คะแนนสะสมคำนวณจากแมตช์ที่ได้รับรองผลแล้วเท่านั้น</p>\n<div class=\"card\"><div class=\"formrow\"><label>รายการแข่งขันสาธารณะ<select id=\"pubTournament\"></select></label>\n<button class=\"btn\" id=\"pubReload\">↻ โหลดข้อมูล</button><button class=\"btn\" id=\"pubCopy\">คัดลอกลิงก์รายการ</button></div><p id=\"pubStatus\" role=\"status\"></p></div>\n<div class=\"card\" style=\"margin-top:16px\"><h3 id=\"pubTitle\">ตารางคะแนน</h3>\n<div class=\"tablewrap\"><table><thead><tr><th>อันดับ</th><th>ทีม</th><th>แข่ง</th><th>ชนะ</th><th>คะแนน</th><th>เซตได้–เสีย</th><th>แต้มได้–เสีย</th></tr></thead>\n<tbody id=\"pubStandings\"></tbody></table></div>\n<p class=\"small\" id=\"pubTieNote\">เกณฑ์: ชนะ → คะแนนสะสม → อัตราส่วนเซต → อัตราส่วนแต้ม → เฮดทูเฮด (เสมอรอการตัดสินหากยังแยกไม่ได้)</p></div>\n<div class=\"card\" style=\"margin-top:16px\"><h3>โปรแกรมและผลการแข่งขัน</h3>\n<div class=\"tablewrap\"><table><thead><tr><th>คู่</th><th>ทีม A</th><th>ทีม B</th><th>วัน–เวลา</th><th>สนาม</th><th>ผล</th></tr></thead>\n<tbody id=\"pubFixtures\"></tbody></table></div>\n<div class=\"actions\"><button class=\"btn\" id=\"pubCSV\">ส่งออก CSV</button><button class=\"btn\" id=\"pubPrint\">พิมพ์ / บันทึก PDF</button></div></div>\n<div class=\"card\" id=\"pubOwner\" hidden style=\"margin-top:16px\">\n<h3>จัดการการเผยแพร่และตารางแข่ง (เจ้าของรายการ)</h3>\n<label>เลือกรายการของฉัน<select id=\"pubOwnerTournament\"></select></label>\n<div class=\"actions\"><button class=\"btn primary\" id=\"pubPublish\">เผยแพร่รายการนี้สู่สาธารณะ</button></div>\n<label>เลือกคู่แข่งขัน<input id=\"pubMatchId\" placeholder=\"Match ID จากรายการแมตช์\"></label>\n<div class=\"formrow\"><label>วัน–เวลา (ตามเครื่องผู้ใช้)<input id=\"pubStart\" type=\"datetime-local\"></label><label>สนาม<input id=\"pubCourt\" placeholder=\"สนาม 1\"></label></div>\n<div class=\"actions\"><button class=\"btn\" id=\"pubSchedule\">บันทึกเวลาแข่งพร้อมตรวจสนาม/ระยะพัก</button></div>\n<p class=\"small\">ระบบนี้ไม่เรียงลำดับคู่ใหม่ การปรับลำดับการแข่งเป็นประเด็นที่รอแก้ไขตามข้อเสนอของผู้จัด</p>\n<p id=\"pubOwnerStatus\" role=\"status\"></p></div>";document.querySelector(".content").insertBefore(root,document.querySelector(".footer"));
nav.onclick=()=>{document.querySelectorAll(".page").forEach(s=>s.classList.toggle("active",s.id==="public"));document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b===nav));document.getElementById("location").textContent="VALLEY BALL CHECK / โปรแกรมและอันดับ";window.scrollTo(0,0)};

let cached=null,ownedList=[],publicList=[];
const tell=(s,b=false)=>box("pubStatus",s,b),admin=(s,b=false)=>box("pubOwnerStatus",s,b);
const datefmt=d=>d?new Date(d).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"}):"ยังไม่กำหนด";
function rows(el,values){el.replaceChildren();for(const list of values){const r=elem("tr");for(const x of list)r.append(elem("td",x??""));el.append(r)}}
async function publicInit(){
 try{publicList=await api("public_tournament_list",{});
   opt($("pubTournament"),publicList.map(t=>({value:t.slug,label:t.name+" ("+t.status+")"})),"เลือกรายการ");
   tell("พบรายการสาธารณะ "+publicList.length+" รายการ");
   const hash=location.hash.match(/^#public=([a-z0-9-]+)$/);
   if(hash&&publicList.some(x=>x.slug===hash[1])){$("pubTournament").value=hash[1];await show(hash[1]);}
 }catch(e){tell(e.message,true)}
 try{ownedList=await owned();$("pubOwner").hidden=false;
 opt($("pubOwnerTournament"),ownedList.map(x=>({value:x.id,label:x.name+" · "+x.status})),"เลือกรายการของฉัน");
 }catch(e){$("pubOwner").hidden=true}
}
async function show(slug){
 if(!slug)return;
 try{cached=await api("public_tournament_snapshot",{p_slug:slug});
   const c=cached,names=new Map(c.teams.map(t=>[t.id,t.name]));
   const scores=c.matches.map(m=>({teamA:m.team_a_id,teamB:m.team_b_id,bestOf:m.best_of,sets:m.sets,approved:m.status==="approved"}));
   const rank=buildStandings(c.teams.map(t=>t.id),scores);
   rows($("pubStandings"),rank.map(s=>[s.pendingTie?s.rank+" *":s.rank,names.get(s.id),s.played,s.wins,s.matchPoints,
     s.setsFor+"–"+s.setsAgainst,s.pointsFor+"–"+s.pointsAgainst]));
   rows($("pubFixtures"),c.matches.map((m,i)=>[i+1,names.get(m.team_a_id)||"?",names.get(m.team_b_id)||"?",datefmt(m.scheduled_start),m.court||"—",
     m.status==="approved"?m.sets_a+"–"+m.sets_b:m.status==="live"?"กำลังแข่งขัน":m.status==="pending_approval"?"รอรับรอง":"ยังไม่แข่งขัน"]));
   $("pubTitle").textContent=c.name+" — ตารางคะแนน";
   tell("โหลดแล้ว "+c.teams.length+" ทีม "+c.matches.length+" คู่ (นับอันดับจากผลรับรองแล้ว)");
 }catch(e){cached=null;tell(e.message,true)}
}
$("pubReload").onclick=()=>{$("pubTournament").value?show($("pubTournament").value):publicInit()};
$("pubTournament").onchange=e=>show(e.target.value);
$("pubCopy").onclick=async()=>{
 if(!$("pubTournament").value)return tell("เลือกรายการ",true);
 const link=location.origin+location.pathname+"#public="+$("pubTournament").value;
 try{await navigator.clipboard.writeText(link);tell("คัดลอกลิงก์รายการแข่งขันแล้ว")}catch(e){tell(link)}
};
function csv(s){let val=String(s??"");if(/^[=+\-@\t\r]/.test(val))val="'"+val;return '"'+val.replace(/"/g,'""')+'"'}
$("pubCSV").onclick=()=>{
 if(!cached)return tell("เลือกรายการก่อน",true);
 const names=new Map(cached.teams.map(t=>[t.id,t.name]));
 const lines=[["ทีม A","ทีม B","วันเวลา","สนาม","สถานะ","เซต A","เซต B"]];
 for(const m of cached.matches)lines.push([names.get(m.team_a_id),names.get(m.team_b_id),m.scheduled_start||"",m.court||"",m.status,m.sets_a,m.sets_b]);
 downloadBlob(new Blob(["\ufeff"+lines.map(x=>x.map(csv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),"valley-ball-report.csv");
};
$("pubPrint").onclick=()=>window.print();
$("pubPublish").onclick=async()=>{
 const id=$("pubOwnerTournament").value;if(!id)return admin("เลือกรายการ",true);
 if(!confirm("เผยแพร่ชื่อทีมและโปรแกรมของรายการนี้สู่สาธารณะ?"))return;
 try{const result=await api("publish_tournament",{p_tournament:id});admin("เผยแพร่สำเร็จ: "+result.slug);await publicInit();
   $("pubTournament").value=result.slug;await show(result.slug);}
 catch(e){admin(e.message,true)}
};
$("pubSchedule").onclick=async()=>{
 const id=$("pubMatchId").value.trim(),start=$("pubStart").value,court=$("pubCourt").value.trim();
 if(!id||!start||!court)return admin("กรอก Match ID วันเวลา และสนามให้ครบ",true);
 try{const result=await api("set_match_schedule",{p_match:id,p_start:new Date(start).toISOString(),p_court:court});
 admin("กำหนดเวลา "+datefmt(result.scheduled_start)+" สนาม "+result.court+" เรียบร้อย")}
 catch(e){admin("กำหนดเวลาไม่ได้: "+e.message,true)}
};
publicInit();
