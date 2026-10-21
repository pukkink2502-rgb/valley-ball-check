import {db,$,elem,box,api,signedIn,opt} from "./suite-core.js";
const root=$("scoresheet");root.innerHTML="\n<div class=\"eyebrow\">OFFICIAL SCORESHEET</div><h1>Official Scoresheet</h1>\n<p>รายชื่อนักกีฬา • ตัวจริง 6 คน • คะแนนแต่ละเซต • Timeout • Substitution • Libero • Rotation • การรับรองผล</p>\n<div class=\"notice\">ใช้บันทึกจริงใน Supabase แต่การตรวจการยืนตำแหน่งก่อนเสิร์ฟและข้อยกเว้น Libero ขั้นสูงยังต้องอาศัยผู้ตัดสินรับรอง</div>\n<div class=\"card\"><div class=\"formrow\"><label>รายการแมตช์<select id=\"offMatch\"></select></label><button class=\"btn\" id=\"offReload\">โหลดแมตช์</button></div>\n<div class=\"formrow\"><label>Match ID ที่เจ้าหน้าที่ได้รับ<input id=\"offMatchId\" placeholder=\"UUID\"></label><button class=\"btn\" id=\"offOpenId\">เปิด Match ID</button></div><p id=\"offStatus\" role=\"status\"></p></div>\n<div id=\"offLoaded\" hidden><div class=\"card\" style=\"margin-top:16px\"><h2 id=\"offHeadline\"></h2><p id=\"offMeta\"></p>\n<div class=\"scoreboard\"><div class=\"team\"><b id=\"offName0\"></b><div class=\"points\" id=\"offPoints0\">0</div><div class=\"setscore\" id=\"offSets0\"></div>\n<button class=\"btn primary\" data-off-point=\"0\">+ แต้ม A</button></div>\n<div class=\"team\"><b id=\"offName1\"></b><div class=\"points\" id=\"offPoints1\">0</div><div class=\"setscore\" id=\"offSets1\"></div>\n<button class=\"btn primary\" data-off-point=\"1\">+ แต้ม B</button></div></div>\n<p id=\"offSetHistory\"></p>\n<div class=\"actions\" id=\"offActions\"><button class=\"btn\" id=\"offTimeoutA\">เวลานอก A</button><button class=\"btn\" id=\"offTimeoutB\">เวลานอก B</button>\n<button class=\"btn\" id=\"offRotate\">หมุนตำแหน่งทีม</button><button class=\"btn\" id=\"offSubstitute\">เปลี่ยนตัว</button><button class=\"btn\" id=\"offLibero\">บันทึก Libero</button></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"offApprove\">ผู้อนุมัติ: รับรองผล</button></div></div>\n<div class=\"two\" style=\"margin-top:16px\">\n<div class=\"card\"><h3>รายชื่อนักกีฬาและตัวจริง</h3><p>บรรทัดละ เบอร์,ชื่อ และเพิ่ม ,L สำหรับ Libero</p>\n<label>ทีม<select id=\"offTeamChoice\"><option value=\"0\">ทีม A</option><option value=\"1\">ทีม B</option></select></label>\n<textarea id=\"offRosterInput\" placeholder=\"1,นักกีฬา 1&#10;2,นักกีฬา 2&#10;3,นักกีฬา 3&#10;4,นักกีฬา 4&#10;5,นักกีฬา 5&#10;6,นักกีฬา 6&#10;7,สำรอง&#10;12,ตัวรับอิสระ,L\"></textarea>\n<button class=\"btn\" id=\"offSaveRoster\">บันทึกรายชื่อ</button>\n<label>เซต<input id=\"offSetNo\" type=\"number\" min=\"1\" max=\"5\" value=\"1\"></label>\n<label>เบอร์ตัวจริง 6 คน ตามตำแหน่ง 1–6<input id=\"offLineupNumbers\" placeholder=\"1,2,3,4,5,6\"></label>\n<button class=\"btn\" id=\"offSaveLineup\">บันทึกตัวจริง</button></div>\n<div class=\"card\"><h3>เหตุการณ์ในสนาม</h3>\n<label>เบอร์คนออก<input id=\"offOut\" placeholder=\"5\"></label><label>เบอร์คนเข้า<input id=\"offIn\" placeholder=\"9\"></label>\n<label>เหตุผล / หมายเหตุ<input id=\"offReason\"></label><button class=\"btn\" id=\"offSanction\">บันทึกการลงโทษ</button>\n<h3>มอบหมายเจ้าหน้าที่</h3><p>เพิ่มผู้บันทึกหรือผู้อนุมัติจากบัญชีที่สมัครไว้แล้ว</p>\n<label>อีเมล<input id=\"offOfficerEmail\" type=\"email\"></label>\n<label>บทบาท<select id=\"offOfficerRole\"><option value=\"scorekeeper\">ผู้บันทึก</option><option value=\"approver\">ผู้อนุมัติ</option><option value=\"designer\">นักออกแบบ</option></select></label>\n<button class=\"btn\" id=\"offAssign\">เพิ่มเจ้าหน้าที่</button></div></div>\n<div class=\"card\" style=\"margin-top:16px\"><h3>บันทึกเหตุการณ์ย้อนหลัง</h3><div class=\"tablewrap\">\n<table><thead><tr><th>#</th><th>เซต</th><th>รายการ</th><th>เวลา</th><th>รายละเอียด</th></tr></thead><tbody id=\"offLog\"></tbody></table>\n</div></div></div>";

let cur=null,busy=false;
async function fetchMatches(){
 try{await signedIn();const list=await api("my_official_matches",{});opt($("offMatch"),list.map(x=>({value:x.id,label:x.tournament+" · "+(x.team_a||"A")+" – "+(x.team_b||"B")+" ("+x.status+")"})),"เลือกแมตช์");box("offStatus","พบ "+list.length+" แมตช์")}
 catch(e){box("offStatus",e.message,true)}
}
async function openMatch(id){
 if(!id)return;
 try{await signedIn();cur=await api("official_match_snapshot",{p_match:id});render();box("offStatus","โหลดข้อมูลสำเร็จ")}
 catch(e){box("offStatus",e.message,true)}
}
function render(){
 if(!cur)return;$("offLoaded").hidden=false;
 $("offHeadline").textContent=cur.tournament+" · "+cur.team_a+" พบ "+cur.team_b;
 const s=cur.sets.at(-1),setN=s?(s.status==="complete"&&cur.status==="live"?s.set+1:s.set):1;
 $("offMeta").textContent="สถานะ "+cur.status+" · เซต "+setN+" · revision "+cur.revision+" · Match ID "+cur.id;
 $("offName0").textContent=cur.team_a;$("offName1").textContent=cur.team_b;
 $("offPoints0").textContent=s?.status==="live"?s.a:0;$("offPoints1").textContent=s?.status==="live"?s.b:0;
 $("offSets0").textContent="ชนะ "+cur.sets_won[0]+" เซต";$("offSets1").textContent="ชนะ "+cur.sets_won[1]+" เซต";
 $("offSetHistory").textContent="เซต: "+(cur.sets.length?cur.sets.map(x=>x.set+": "+x.a+"–"+x.b+" ("+x.status+")").join(" · "):"ยังไม่เริ่ม");
 $("offSetNo").value=String(Math.min(cur.best_of,setN));
 $("offActions").hidden=!cur.can_score||["approved","pending_approval","void"].includes(cur.status);
 for(const btn of root.querySelectorAll("[data-off-point]"))btn.disabled=$("offActions").hidden;
 $("offApprove").hidden=cur.status!=="pending_approval"||!cur.can_approve;
 const tbody=$("offLog");tbody.replaceChildren();
 for(const event of [...cur.events].reverse().slice(0,200)){
  const tr=elem("tr");
  for(const value of [event.seq,event.set,event.event,new Date(event.at).toLocaleTimeString("th-TH"),JSON.stringify(event.payload)])
   tr.append(elem("td",value));
  tbody.append(tr);
 }
}
async function cmd(action,payload={}){
 if(!cur||busy)return;busy=true;
 try{await api("official_match_command",{p_match:cur.id,p_expected:cur.revision,p_command:action,p_payload:payload});await openMatch(cur.id)}
 catch(e){box("offStatus",e.message,true);await openMatch(cur.id)}finally{busy=false}
}
const choice=()=>$("offTeamChoice").value==="0"?cur.team_a_id:cur.team_b_id;
const player=(num,team,libero=false)=>cur.roster.find(x=>x.team_id===team&&x.number===String(num).trim()&&x.libero===libero);
$("offReload").onclick=fetchMatches;$("offMatch").onchange=e=>openMatch(e.target.value);
$("offOpenId").onclick=()=>openMatch($("offMatchId").value.trim());
root.querySelectorAll("[data-off-point]").forEach(b=>b.onclick=()=>cmd("point",{team:Number(b.dataset.offPoint)}));
$("offTimeoutA").onclick=()=>cmd("timeout",{team:0});$("offTimeoutB").onclick=()=>cmd("timeout",{team:1});
$("offRotate").onclick=()=>cmd("rotation",{team_id:choice()});
$("offSubstitute").onclick=async()=>{
 const team=choice(),a=player($("offOut").value,team),b=player($("offIn").value,team);
 if(!a||!b){box("offStatus","เลือกหมายเลขผู้เล่นปกติทั้ง 2 คนที่มีในรายชื่อ",true);return}
 await cmd("substitution",{team_id:team,out_player:a.id,in_player:b.id});
};
$("offLibero").onclick=async()=>{const t=choice(),p=player($("offIn").value,t,true);
 if(!p){box("offStatus","ระบุหมายเลข Libero ที่ลงทะเบียนไว้ในช่องคนเข้า",true);return}
 await cmd("libero",{team_id:t,in_player:p.id,reason:$("offReason").value.slice(0,150)});
};
$("offSanction").onclick=()=>cmd("sanction",{reason:$("offReason").value.slice(0,150)});
$("offSaveRoster").onclick=async()=>{
 if(!cur)return;const team=choice();
 const players=$("offRosterInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{
  const [number,name,mark]=x.split(",").map(t=>t?.trim());return {number,name,libero:mark?.toUpperCase()==="L"};
 });
 if(players.length<1||players.some(x=>!x.name||!x.number)){box("offStatus","ใช้รูปแบบ เบอร์,ชื่อ ทีละบรรทัด",true);return}
 try{await api("official_match_roster",{p_match:cur.id,p_team:team,p_players:players});await openMatch(cur.id);box("offStatus","บันทึกรายชื่อนักกีฬาสำเร็จ")}
 catch(e){box("offStatus",e.message,true)}
};
$("offSaveLineup").onclick=async()=>{
 if(!cur)return;const team=choice(),ids=$("offLineupNumbers").value.split(",").map(x=>player(x,team)?.id);
 if(ids.length!==6||ids.some(x=>!x)||new Set(ids).size!==6){box("offStatus","ตัวจริงต้องเป็นผู้เล่น 6 คนไม่ซ้ำและมีในรายชื่อ",true);return}
 try{await api("official_match_lineup",{p_match:cur.id,p_set_number:Number($("offSetNo").value),p_team:team,p_positions:ids});await openMatch(cur.id);box("offStatus","บันทึกตัวจริงสำเร็จ")}
 catch(e){box("offStatus",e.message,true)}
};
$("offAssign").onclick=async()=>{if(!cur)return;try{await api("tournament_assign_official",{p_tournament:cur.tournament_id,p_email:$("offOfficerEmail").value,p_role:$("offOfficerRole").value});box("offStatus","มอบหมายบทบาทสำเร็จ")}catch(e){box("offStatus",e.message,true)}};
$("offApprove").onclick=async()=>{
 if(!cur||!confirm("รับรองผลการแข่งขันและล็อกคะแนน?"))return;
 try{await api("official_match_approve",{p_match:cur.id,p_note:"Approved by independent officer"});await openMatch(cur.id)}
 catch(e){box("offStatus",e.message,true)}
};
fetchMatches();
