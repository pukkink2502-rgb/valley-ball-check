import {db,$,elem,box,api,signedIn,opt} from "./suite-core.js";

const root=$("scoresheet");root.innerHTML="<div class=\"eyebrow\">สกอร์ชีตและตรวจตำแหน่ง</div>\n<h1>ควบคุมการแข่งขัน</h1><p>เลือกคู่แข่งขัน แล้วดูตำแหน่งผู้เล่นสองฝั่งได้ทันที กรอกหมายเลขเสื้อบนสนามและบันทึกแยกแต่ละเซต</p>\n<div class=\"card\"><div class=\"match-pick\"><label>1. เลือกรายการแข่งขัน<select id=\"offTournament\"></select></label>\n<label>2. เลือกคู่แข่งขัน<select id=\"offMatch\"></select></label>\n<button class=\"btn\" id=\"offReload\">↻ โหลดรายการ</button></div>\n<div class=\"actions\"><button class=\"btn\" id=\"offGoOrganizer\">ไปจัดการแข่งขัน</button></div>\n<p id=\"offStatus\" role=\"status\" class=\"small\"></p></div>\n<div id=\"offLoaded\" hidden>\n<div class=\"score-strip\" style=\"margin-top:16px\">\n<div class=\"score-side\"><strong id=\"offName0\">ทีม A</strong><span id=\"offPoints0\" class=\"score-pts\">0</span></div>\n<div class=\"score-sets\"><span id=\"offSetScore\">0 : 0</span><div style=\"font-size:11px\">เซตที่ชนะ</div></div>\n<div class=\"score-side\"><span id=\"offPoints1\" class=\"score-pts\">0</span><strong id=\"offName1\">ทีม B</strong></div>\n</div>\n<div class=\"card\" style=\"margin-top:13px\">\n<div class=\"section-head\"><div><h3>สนามและตำแหน่งผู้เล่น</h3><p id=\"offMeta\">เลือกแมตช์เพื่อเริ่ม</p></div><span class=\"drawing-badge\" id=\"offBadge\">ยังไม่แข่งขัน</span></div>\n<div class=\"set-tabs\" id=\"offSetTabs\" aria-label=\"เลือกเซต\"></div>\n<div class=\"court-wrap\"><div class=\"court-half\"><div class=\"court-label\" id=\"courtNameA\">ทีม A</div><div class=\"court-positions\" id=\"offCourtA\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\"></div></div>\n<div class=\"net-center\" aria-label=\"ตาข่าย\">ตาข่าย</div>\n<div class=\"court-half\"><div class=\"court-label\" id=\"courtNameB\">ทีม B</div><div class=\"court-positions\" id=\"offCourtB\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\"></div></div></div>\n<div class=\"section-head\"><p class=\"mobile-note\" id=\"offCourtHint\">แตะช่องหมายเลขในสนามเพื่อกรอกตำแหน่งได้เลย</p>\n<button class=\"btn primary\" id=\"offSaveBoth\">✓ บันทึกตำแหน่งเซตนี้</button></div>\n</div>\n<div class=\"card\" style=\"margin-top:14px\"><div class=\"section-head\"><div><h3>ควบคุมคะแนน</h3><p id=\"offSetHistory\"></p></div><span id=\"offMatchId\" class=\"small\"></span></div>\n<div class=\"actions\" id=\"offActions\"><button class=\"btn primary\" id=\"offPointA\">+ แต้มทีมซ้าย</button><button class=\"btn primary\" id=\"offPointB\">+ แต้มทีมขวา</button>\n<button class=\"btn\" id=\"offTimeoutA\">เวลานอกทีมซ้าย</button><button class=\"btn\" id=\"offTimeoutB\">เวลานอกทีมขวา</button>\n</div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"offApprove\" hidden>✓ ผู้อนุมัติ: รับรองผล</button></div>\n</div>\n<details class=\"card\" style=\"margin-top:14px\"><summary style=\"cursor:pointer;font-weight:600\">เครื่องมือเพิ่มเติม: เปลี่ยนตัว / Libero / หมุนตำแหน่ง / เจ้าหน้าที่</summary>\n<div class=\"two\" style=\"margin-top:16px\"><div><h3>จัดการนักกีฬา</h3>\n<label>ทีม<select id=\"offTeamChoice\"><option value=\"0\">ทีมซ้าย</option><option value=\"1\">ทีมขวา</option></select></label>\n<p class=\"small\">ผู้เล่น 6 คนในสนามบันทึกจากช่องหมายเลขด้านบนแล้ว สามารถเพิ่มรายชื่อสำรองด้วยการกรอกด้านล่าง</p>\n<textarea id=\"offRosterInput\" rows=\"5\" placeholder=\"1,ชื่อนักกีฬา&#10;2,ชื่อนักกีฬา&#10;8,ตัวสำรอง&#10;12,ตัวรับอิสระ,L\"></textarea>\n<div class=\"actions\"><button class=\"btn\" id=\"offSaveRoster\">บันทึกทะเบียนนักกีฬา</button></div>\n<label>เบอร์คนออก<input id=\"offOut\" placeholder=\"5\"></label><label>เบอร์คนเข้า<input id=\"offIn\" placeholder=\"8\"></label>\n<div class=\"actions\"><button class=\"btn\" id=\"offSubstitute\">เปลี่ยนตัว</button><button class=\"btn\" id=\"offLibero\">บันทึก Libero</button><button class=\"btn\" id=\"offRotate\">หมุนตำแหน่ง</button></div></div>\n<div><h3>เจ้าหน้าที่และเหตุการณ์</h3><label>เหตุผล / หมายเหตุ<input id=\"offReason\"></label><button class=\"btn\" id=\"offSanction\">บันทึกการลงโทษ</button>\n<label>อีเมลเจ้าหน้าที่ที่จะมอบหมาย<input type=\"email\" id=\"offOfficerEmail\" placeholder=\"อีเมลที่สมัครบัญชีแล้ว\"></label>\n<label>บทบาท<select id=\"offOfficerRole\"><option value=\"scorekeeper\">ผู้บันทึกคะแนน</option><option value=\"approver\">ผู้อนุมัติผล</option><option value=\"designer\">ผู้ออกแบบ</option></select></label>\n<button class=\"btn\" id=\"offAssign\">เพิ่มเจ้าหน้าที่</button></div></div>\n</details>\n<details class=\"card\" style=\"margin-top:14px\"><summary style=\"cursor:pointer;font-weight:600\">ประวัติเหตุการณ์ทั้งหมด</summary>\n<div class=\"tablewrap\" style=\"margin-top:12px\"><table><thead><tr><th>#</th><th>เซต</th><th>เหตุการณ์</th><th>เวลา</th><th>ข้อมูล</th></tr></thead><tbody id=\"offLog\"></tbody></table></div></details>\n</div>";
let cur=null,items=[],selectedSet=1,busy=false,dirty=false;
const notify=(message,type="success",detail="")=>window.VBC?.notify(message,type,detail);
const labels={scheduled:"ยังไม่แข่งขัน",live:"กำลังแข่งขัน",pending_approval:"รอรับรองผล",approved:"รับรองผลแล้ว",void:"ยกเลิก"};
const status=s=>labels[s]||s||"ยังไม่แข่งขัน";
async function loadMatches(keep=true){
 try{
  const user=await signedIn(),data=await api("my_official_matches",{});
  items=data||[];
  const tournamentNames=[...new Map(items.map(x=>[x.tournament_id,x.tournament])).entries()].map(([id,name])=>({value:id,label:name}));
  const previous=keep?$("offTournament").value:"";
  opt($("offTournament"),tournamentNames,"เลือกรายการ");
  if(previous&&tournamentNames.some(x=>x.value===previous))$("offTournament").value=previous;
  if(!previous&&tournamentNames.length===1)$("offTournament").value=tournamentNames[0].value;
  matchOptions(keep);
  $("offStatus").textContent=items.length?"พบ "+items.length+" คู่แข่งขัน":"ยังไม่มีคู่แข่งขัน ไปสร้างรายการในเมนูจัดการแข่งขัน";
 }catch(e){
  $("offStatus").textContent=e.message;
  $("offLoaded").hidden=true;
 }
}
function matchOptions(keep){
 const id=$("offTournament").value,old=keep?$("offMatch").value:"";
 const list=items.filter(m=>m.tournament_id===id);
 opt($("offMatch"),list.map((x,i)=>({value:x.id,label:"คู่ "+(i+1)+" · "+(x.team_a||"ทีม A")+" พบ "+(x.team_b||"ทีม B")+" · "+status(x.status)})),"เลือกคู่แข่งขัน");
 if(old&&list.some(x=>x.id===old))$("offMatch").value=old;
 if(!$("offMatch").value&&list.length===1)$("offMatch").value=list[0].id;
 if($("offMatch").value)openMatch($("offMatch").value);
 else{cur=null;$("offLoaded").hidden=true;}
}
async function openMatch(id,keepSet=false){
 if(!id)return;
 try{
  cur=await api("official_match_snapshot",{p_match:id});
  if(!keepSet)selectedSet=currentSet();
  dirty=false;render();
  $("offStatus").textContent="โหลดข้อมูล "+cur.team_a+" พบ "+cur.team_b+" เรียบร้อย";
 }catch(e){notify("เปิดสกอร์ชีตไม่ได้","error",e.message);$("offStatus").textContent=e.message}
}
function currentSet(){
 if(!cur||!cur.sets.length)return 1;
 const last=cur.sets.at(-1);
 return Math.min(cur.best_of,last.status==="complete"&&cur.status==="live"?last.set+1:last.set);
}
function isLocked(){return ["approved","pending_approval","void"].includes(cur.status)}
function canEditSet(){
 return cur.can_score&&!isLocked()&&!cur.sets.some(s=>s.set===selectedSet&&(s.a>0||s.b>0));
}
const fieldValue=(side,pos)=>root.querySelector('input[data-court-side="'+side+'"][data-court-pos="'+pos+'"]')?.value.trim()||"";
function render(){
 if(!cur)return;$("offLoaded").hidden=false;
 $("offName0").textContent=cur.team_a;$("offName1").textContent=cur.team_b;
 $("courtNameA").textContent=cur.team_a;$("courtNameB").textContent=cur.team_b;
 const last=cur.sets.at(-1),live=last?.status==="live"?last:null;
 $("offPoints0").textContent=live?.a??0;$("offPoints1").textContent=live?.b??0;
 $("offSetScore").textContent=cur.sets_won.join(" : ");
 $("offMeta").textContent="เซตที่ "+selectedSet+" / "+cur.best_of+" · "+status(cur.status);
 $("offBadge").textContent=status(cur.status);
 $("offMatchId").textContent="คู่ที่เลือก · "+cur.id.slice(0,8);
 $("offSetHistory").textContent=cur.sets.length?cur.sets.map(s=>"เซต "+s.set+" ("+s.a+"–"+s.b+")").join(" · "):"ยังไม่เริ่มการแข่งขัน";
 const tabs=$("offSetTabs");tabs.replaceChildren();
 for(let i=1;i<=cur.best_of;i++){
  const b=elem("button","เซต "+i);b.classList.toggle("active",selectedSet===i);b.setAttribute("aria-pressed",String(selectedSet===i));
  b.onclick=()=>{selectedSet=i;dirty=false;render()};tabs.append(b);
 }
 for(const side of ["a","b"]){
  const team=side==="a"?cur.team_a_id:cur.team_b_id;
  const positions=side==="a"?[5,4,6,3,1,2]:[2,1,3,6,4,5];
  const parent=$(side==="a"?"offCourtA":"offCourtB");parent.replaceChildren();
  const lineup=cur.lineups.find(x=>x.team_id===team&&x.set===selectedSet);
  const roster=new Map(cur.roster.filter(x=>x.team_id===team).map(x=>[x.id,x.number]));
  for(const pos of positions){
   const block=elem("label","","court-player");
   const n=elem("small","ตำแหน่ง "+pos);
   const input=document.createElement("input");input.type="text";input.inputMode="numeric";input.maxLength=3;
   input.dataset.courtSide=side;input.dataset.courtPos=String(pos);
   input.setAttribute("aria-label",(side==="a"?cur.team_a:cur.team_b)+" ตำแหน่ง "+pos+" เซต "+selectedSet);
   input.placeholder="—";input.value=roster.get(lineup?.positions?.[pos-1])||"";
   input.disabled=!canEditSet();
   input.oninput=()=>{input.value=input.value.replace(/\D/g,"");dirty=true};
   block.append(n,input);parent.append(block);
  }
 }
 $("offSaveBoth").disabled=!canEditSet();
 $("offCourtHint").textContent=canEditSet()?
  "กรอกหมายเลขเสื้อทีมซ้ายและขวาให้ครบ 6 ตำแหน่ง แล้วกดบันทึก": "เซตนี้เริ่มมีคะแนนแล้วหรือถูกล็อก จึงไม่สามารถแก้ตัวจริงได้";
 $("offActions").hidden=!cur.can_score||isLocked();
 $("offApprove").hidden=cur.status!=="pending_approval"||!cur.can_approve;
 const log=$("offLog");log.replaceChildren();
 for(const ev of [...cur.events].reverse().slice(0,200)){
  const r=elem("tr");for(const v of [ev.seq,ev.set,ev.event,new Date(ev.at).toLocaleTimeString("th-TH"),JSON.stringify(ev.payload)])r.append(elem("td",v));log.append(r);
 }
}
async function save(){
 if(!cur||busy||!canEditSet())return;
 const teamNumbers=side=>[1,2,3,4,5,6].map(pos=>fieldValue(side,pos));
 const a=teamNumbers("a"),b=teamNumbers("b");
 if([...a,...b].some(x=>!x)||new Set(a).size!==6||new Set(b).size!==6){
  return notify("กรอกตำแหน่งยังไม่ครบ","error","กรอกหมายเลขเสื้อ 6 ตำแหน่งของทั้งสองทีม โดยห้ามซ้ำภายในทีม");
 }
 busy=true;$("offSaveBoth").disabled=true;
 try{
  await api("save_court_both",{p_match:cur.id,p_set:selectedSet,p_a:a,p_b:b});
  await openMatch(cur.id,true);notify("บันทึกตำแหน่งเซต "+selectedSet+" สำเร็จ","success","ทั้งสองทีมเรียบร้อยแล้ว");
 }catch(e){notify("บันทึกตำแหน่งไม่สำเร็จ","error",e.message);$("offSaveBoth").disabled=false}
 finally{busy=false}
}
async function command(action,payload={}){
 if(!cur||busy)return;busy=true;
 try{await api("official_match_command",{p_match:cur.id,p_expected:cur.revision,p_command:action,p_payload:payload});await openMatch(cur.id,true);
  if(action==="point")notify("บันทึกคะแนนแล้ว","success",cur.team_a+" "+$("offPoints0").textContent+" : "+$("offPoints1").textContent+" "+cur.team_b);
  else notify("บันทึกเหตุการณ์สำเร็จ");
 }catch(e){notify("ไม่สามารถบันทึกได้","error",e.message);await openMatch(cur.id,true)}
 finally{busy=false}
}
const teamId=()=>$("offTeamChoice").value==="0"?cur.team_a_id:cur.team_b_id;
const player=(n,team,libero)=>cur.roster.find(r=>r.team_id===team&&r.number===String(n).trim()&&r.libero===libero);
$("offSaveBoth").onclick=save;
$("offPointA").onclick=()=>command("point",{team:0});$("offPointB").onclick=()=>command("point",{team:1});
$("offTimeoutA").onclick=()=>command("timeout",{team:0});$("offTimeoutB").onclick=()=>command("timeout",{team:1});
$("offRotate").onclick=()=>command("rotation",{team_id:teamId()});
$("offSubstitute").onclick=async()=>{
 const t=teamId(),a=player($("offOut").value,t,false),b=player($("offIn").value,t,false);
 if(!a||!b)return notify("ระบุหมายเลขคนออกและคนเข้าไม่ถูกต้อง","error","ผู้เล่นต้องอยู่ในทะเบียนของทีม");
 await command("substitution",{team_id:t,out_player:a.id,in_player:b.id});
};
$("offLibero").onclick=()=>{
 const t=teamId(),a=player($("offIn").value,t,true);
 if(!a)return notify("ไม่พบ Libero ในทะเบียน","error");
 command("libero",{team_id:t,in_player:a.id,reason:$("offReason").value.slice(0,120)});
};
$("offSanction").onclick=()=>command("sanction",{reason:$("offReason").value.slice(0,120)});
$("offSaveRoster").onclick=async()=>{
 if(!cur)return;
 const t=teamId();
 const entries=$("offRosterInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{
  const [number,name,kind]=x.split(",").map(a=>a?.trim());return {number,name,libero:kind?.toUpperCase()==="L"};
 });
 if(!entries.length||entries.some(x=>!x.number||!x.name))return notify("กรอกทะเบียนไม่ถูกต้อง","error","รูปแบบ: เบอร์,ชื่อ และ ,L สำหรับ Libero");
 if(!confirm("บันทึกทะเบียนใหม่? รายชื่อทะเบียนเดิมของทีมนี้จะถูกแทนที่"))return;
 try{await api("official_match_roster",{p_match:cur.id,p_team:t,p_players:entries});await openMatch(cur.id,true);notify("บันทึกทะเบียนสำเร็จ")}
 catch(e){notify("บันทึกทะเบียนไม่สำเร็จ","error",e.message)}
};
$("offAssign").onclick=async()=>{
 if(!cur)return;
 try{await api("tournament_assign_official",{p_tournament:cur.tournament_id,p_email:$("offOfficerEmail").value,p_role:$("offOfficerRole").value});notify("เพิ่มเจ้าหน้าที่สำเร็จ")}
 catch(e){notify("เพิ่มเจ้าหน้าที่ไม่สำเร็จ","error",e.message)}
};
$("offApprove").onclick=async()=>{
 if(!cur||!confirm("ยืนยันรับรองผลการแข่งขันอย่างเป็นทางการ?"))return;
 try{await api("official_match_approve",{p_match:cur.id,p_note:"รับรองโดยเจ้าหน้าที่อิสระ"});await openMatch(cur.id,true);notify("รับรองผลสำเร็จ")}
 catch(e){notify("รับรองผลไม่สำเร็จ","error",e.message)}
};
$("offTournament").onchange=()=>matchOptions(false);
$("offMatch").onchange=e=>openMatch(e.target.value);
$("offReload").onclick=async()=>{await loadMatches(true);notify("โหลดรายการล่าสุดแล้ว")};
$("offGoOrganizer").onclick=()=>window.VBC?.navigate("manager");
db.auth.onAuthStateChange(()=>setTimeout(()=>loadMatches().catch(e=>console.warn(e)),0));
loadMatches();
