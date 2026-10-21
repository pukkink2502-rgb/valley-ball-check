import {db,$,elem,box,api,signedIn,opt} from "./suite-core.js";

const root=$("scoresheet");root.innerHTML="<div class=\"eyebrow\">สกอร์ชีตและตรวจตำแหน่ง</div>\n<h1>ควบคุมการแข่งขัน</h1><p>เลือกคู่แข่งขัน แล้วดูตำแหน่งผู้เล่นสองฝั่งได้ทันที กรอกหมายเลขเสื้อบนสนามและบันทึกแยกแต่ละเซต</p>\n<div class=\"card\"><div class=\"match-pick\"><label>1. เลือกรายการแข่งขัน<select id=\"offTournament\"></select></label>\n<label>2. เลือกคู่แข่งขัน<select id=\"offMatch\"></select></label>\n<button class=\"btn\" id=\"offReload\">↻ โหลดรายการ</button></div>\n<div class=\"actions\"><button class=\"btn\" id=\"offGoOrganizer\">ไปจัดการแข่งขัน</button></div>\n<p id=\"offStatus\" role=\"status\" class=\"small\"></p></div>\n<div id=\"offLoaded\" hidden>\n<div class=\"score-strip\" style=\"margin-top:16px\">\n<div class=\"score-side\"><strong id=\"offName0\">ทีม A</strong><span id=\"offPoints0\" class=\"score-pts\">0</span></div>\n<div class=\"score-sets\"><span id=\"offSetScore\">0 : 0</span><div style=\"font-size:11px\">เซตที่ชนะ</div></div>\n<div class=\"score-side\"><span id=\"offPoints1\" class=\"score-pts\">0</span><strong id=\"offName1\">ทีม B</strong></div>\n</div>\n<div class=\"card\" style=\"margin-top:13px\">\n<div class=\"section-head\"><div><h3>สนามและตำแหน่งผู้เล่น</h3><p id=\"offMeta\">เลือกแมตช์เพื่อเริ่ม</p></div><span class=\"drawing-badge\" id=\"offBadge\">ยังไม่แข่งขัน</span></div>\n<div class=\"set-tabs\" id=\"offSetTabs\" aria-label=\"เลือกเซต\"></div>\n<div class=\"serve-config\"><h3>ฝ่ายเสิร์ฟเริ่มต้นเซตนี้</h3><p id=\"offServeInfo\">บันทึกตัวจริง 6 คนทั้งสองทีม แล้วเลือกฝ่ายเสิร์ฟ</p>\n<div class=\"actions\"><button class=\"btn\" id=\"offStartServeA\">🏐 ทีมซ้ายเริ่มเสิร์ฟ</button><button class=\"btn\" id=\"offStartServeB\">🏐 ทีมขวาเริ่มเสิร์ฟ</button></div></div><div class=\"court-wrap\"><div class=\"court-half\"><div class=\"court-label\" id=\"courtNameA\">ทีม A</div><div class=\"court-positions\" id=\"offCourtA\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\"></div></div>\n<div class=\"net-center\" aria-label=\"ตาข่าย\">ตาข่าย</div>\n<div class=\"court-half\"><div class=\"court-label\" id=\"courtNameB\">ทีม B</div><div class=\"court-positions\" id=\"offCourtB\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\"></div></div></div>\n<div class=\"section-head\"><p class=\"mobile-note\" id=\"offCourtHint\">แตะช่องหมายเลขในสนามเพื่อกรอกตำแหน่งได้เลย</p>\n<button class=\"btn primary\" id=\"offSaveBoth\">✓ บันทึกตำแหน่งเซตนี้</button></div>\n</div>\n<div class=\"card\" style=\"margin-top:14px\"><div class=\"section-head\"><div><h3>ควบคุมคะแนน</h3><p id=\"offSetHistory\"></p></div><span id=\"offMatchId\" class=\"small\"></span></div>\n<div class=\"actions\" id=\"offActions\"><button class=\"btn primary\" id=\"offPointA\">+ แต้มทีมซ้าย</button><button class=\"btn primary\" id=\"offPointB\">+ แต้มทีมขวา</button>\n<button class=\"btn\" id=\"offTimeoutA\">เวลานอกทีมซ้าย</button><button class=\"btn\" id=\"offTimeoutB\">เวลานอกทีมขวา</button>\n</div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"offApprove\" hidden>✓ ผู้อนุมัติ: รับรองผล</button></div>\n</div>\n<div class=\"card\" style=\"margin-top:14px\"><h3>เปลี่ยนตัวด้วยหมายเลขเสื้อ</h3>\n<p>แตะหมายเลขผู้เล่นในสนามเพื่อเลือกคนออก แล้วพิมพ์เบอร์คนเข้า กดยืนยันได้เลย ไม่ต้องกรอกชื่อ</p>\n<div class=\"formrow\"><label>ทีม<select id=\"offTeamChoice\"><option value=\"0\">ทีมซ้าย</option><option value=\"1\">ทีมขวา</option></select></label>\n<label>เบอร์คนออก<input id=\"offOut\" maxlength=\"3\" inputmode=\"numeric\" placeholder=\"แตะในสนาม\"></label>\n<label>เบอร์คนเข้า<input id=\"offIn\" maxlength=\"3\" inputmode=\"numeric\" placeholder=\"เบอร์สำรอง\"></label></div>\n<button class=\"btn primary\" id=\"offSubstitute\">↔ ยืนยันเปลี่ยนตัว</button></div>\n<div class=\"card\" style=\"margin-top:14px\"><h3>ตั้งค่า Libero แยกแต่ละทีมและเซต</h3><p>กำหนดหมายเลข Libero กับหมายเลขที่จะแทน ใช้ปุ่มส่งลงสนามหรือออกจากสนาม</p><div class=\"two\">\n<div class=\"libero-team-card\"><h3 id=\"offLiberoNameA\">ทีมซ้าย</h3><label>เบอร์ Libero<input id=\"offLiberoNumberA\" maxlength=\"3\" inputmode=\"numeric\"></label><label>เบอร์ผู้เล่นที่จะถูกแทน<input id=\"offLiberoReplaceA\" maxlength=\"3\" inputmode=\"numeric\"></label>\n<div class=\"actions\"><button class=\"btn\" id=\"offConfigureLiberoA\">บันทึก Libero</button><button class=\"btn primary\" id=\"offToggleLiberoA\">ส่งลงสนาม</button></div><p class=\"small\" id=\"offLiberoStatusA\"></p></div>\n<div class=\"libero-team-card\"><h3 id=\"offLiberoNameB\">ทีมขวา</h3><label>เบอร์ Libero<input id=\"offLiberoNumberB\" maxlength=\"3\" inputmode=\"numeric\"></label><label>เบอร์ผู้เล่นที่จะถูกแทน<input id=\"offLiberoReplaceB\" maxlength=\"3\" inputmode=\"numeric\"></label>\n<div class=\"actions\"><button class=\"btn\" id=\"offConfigureLiberoB\">บันทึก Libero</button><button class=\"btn primary\" id=\"offToggleLiberoB\">ส่งลงสนาม</button></div><p class=\"small\" id=\"offLiberoStatusB\"></p></div>\n</div></div>\n<details class=\"card\" style=\"margin-top:14px\"><summary style=\"cursor:pointer;font-weight:600\">ตัวเลือกเพิ่มเติม: เจ้าหน้าที่ ชื่อผู้เล่น และบันทึกเหตุการณ์</summary>\n<div class=\"two\" style=\"margin-top:16px\"><div><h3>ชื่อผู้เล่น (ไม่บังคับ)</h3><textarea id=\"offRosterInput\" rows=\"4\" placeholder=\"1,ชื่อนักกีฬา&#10;7,ชื่อนักกีฬา\"></textarea><button class=\"btn\" id=\"offSaveRoster\">บันทึกชื่อเพิ่มเติม</button><p>ใช้เฉพาะหมายเลขเสื้อก็ได้</p></div>\n<div><label>เหตุผล/หมายเหตุ<input id=\"offReason\"></label><button class=\"btn\" id=\"offSanction\">บันทึกเหตุการณ์ลงโทษ</button>\n<label>อีเมลเจ้าหน้าที่<input id=\"offOfficerEmail\" type=\"email\"></label>\n<label>บทบาท<select id=\"offOfficerRole\"><option value=\"scorekeeper\">ผู้บันทึกคะแนน</option><option value=\"approver\">ผู้รับรองผล</option><option value=\"designer\">ผู้ออกแบบ</option></select></label><button class=\"btn\" id=\"offAssign\">เพิ่มเจ้าหน้าที่</button></div></div></details>\n<details class=\"card\" style=\"margin-top:14px\"><summary style=\"cursor:pointer;font-weight:600\">ประวัติเหตุการณ์ทั้งหมด</summary>\n<div class=\"tablewrap\" style=\"margin-top:12px\"><table><thead><tr><th>#</th><th>เซต</th><th>เหตุการณ์</th><th>เวลา</th><th>ข้อมูล</th></tr></thead><tbody id=\"offLog\"></tbody></table></div></details>\n</div>";
let cur=null,items=[],selectedSet=1,busy=false,dirty=false;
const notify=(message,type="success",detail="")=>window.VBC?.notify(message,type,detail);
const errText=e=>({CHOOSE_SERVING_TEAM_FIRST:"กรุณาเลือกฝ่ายเริ่มเสิร์ฟก่อนกดคะแนน",SAVE_BOTH_LINEUPS_FIRST:"กรุณาบันทึกผู้เล่น 6 คนทั้งสองทีมก่อน",LIBERO_EXIT_BEFORE_ROTATION:"นำ Libero ออกจากสนามก่อนหมุนตำแหน่งขึ้นแดนหน้า",REVISION_CONFLICT:"ข้อมูลเปลี่ยนแล้ว กรุณาโหลดแมตช์ใหม่",SET_ALREADY_STARTED:"เซตนี้มีคะแนนแล้ว ไม่สามารถเปลี่ยนฝ่ายเริ่มเสิร์ฟ",LIBERO_ONLY_BACK_ROW_FIVE_SIX:"Libero ในระบบนี้แทนตำแหน่งหลัง 5 หรือ 6 เท่านั้น",PLAYER_ALREADY_ON_COURT:"เบอร์ที่ต้องการส่งลงอยู่ในสนามแล้ว"}[e.message]||e.message);
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
 opt($("offMatch"),list.map((x,i)=>({value:x.id,label:(x.stage_title||"รอบแข่งขัน")+" · คู่ "+(i+1)+" · "+(x.team_a||x.slot_a||"รอระบุทีม")+" พบ "+(x.team_b||x.slot_b||"รอระบุทีม")+" · "+status(x.status)})),"เลือกคู่แข่งขัน");
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
  $("offStatus").textContent="โหลดข้อมูล "+(cur.team_a||cur.slot_a||"รอทีม")+" พบ "+(cur.team_b||cur.slot_b||"รอทีม")+" เรียบร้อย";
 }catch(e){notify("เปิดสกอร์ชีตไม่ได้","error",e.message);$("offStatus").textContent=e.message}
}
function currentSet(){
 if(!cur||!cur.sets.length)return 1;
 const last=cur.sets.at(-1);
 return Math.min(cur.best_of,last.status==="complete"&&cur.status==="live"?last.set+1:last.set);
}
function isLocked(){return ["approved","pending_approval","void"].includes(cur.status)}
function canEditSet(){
 return cur.can_score&&!!cur.team_a_id&&!!cur.team_b_id&&!isLocked()&&!cur.sets.some(s=>s.set===selectedSet&&(s.a>0||s.b>0));
}
const fieldValue=(side,pos)=>root.querySelector('input[data-court-side="'+side+'"][data-court-pos="'+pos+'"]')?.value.trim()||"";
function render(){
 if(!cur)return;$("offLoaded").hidden=false;
 $("offName0").textContent=cur.team_a||cur.slot_a||"รอระบุทีม";$("offName1").textContent=cur.team_b||cur.slot_b||"รอระบุทีม";
 $("courtNameA").textContent=cur.team_a||cur.slot_a||"รอระบุทีม";$("courtNameB").textContent=cur.team_b||cur.slot_b||"รอระบุทีม";
 const last=cur.sets.at(-1),live=last?.status==="live"?last:null;
 $("offPoints0").textContent=live?.a??0;$("offPoints1").textContent=live?.b??0;
 $("offSetScore").textContent=cur.sets_won.join(" : ");
 $("offMeta").textContent="เซตที่ "+selectedSet+" / "+cur.best_of+" · "+status(cur.status);
 $("offBadge").textContent=cur.team_a_id&&cur.team_b_id?status(cur.status):"รอกำหนดทีม";
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
  const serving=cur.services?.find(s=>s.set===selectedSet)?.team_id;
  for(const pos of positions){
   const block=elem("label","","court-player");
   const n=elem("small","ตำแหน่ง "+pos+(pos===1&&serving===team?" 🏐":""));
   const input=document.createElement("input");input.type="text";input.inputMode="numeric";input.maxLength=3;
   input.dataset.courtSide=side;input.dataset.courtPos=String(pos);
   input.setAttribute("aria-label",(side==="a"?cur.team_a:cur.team_b)+" ตำแหน่ง "+pos+" เซต "+selectedSet);
   input.placeholder="—";input.value=roster.get(lineup?.positions?.[pos-1])||"";
   input.readOnly=!canEditSet();input.classList.toggle('court-readonly',input.readOnly);
   input.oninput=()=>{input.value=input.value.replace(/\D/g,"");dirty=true};
   input.onclick=()=>{if(input.value){$("offTeamChoice").value=side==="a"?"0":"1";$("offOut").value=input.value}};
   block.append(n,input);parent.append(block);
  }
 }
 $("offSaveBoth").disabled=!canEditSet();
 const server=cur.services?.find(s=>s.set===selectedSet);
 const ready=cur.lineups.filter(l=>l.set===selectedSet&&[cur.team_a_id,cur.team_b_id].includes(l.team_id)).length===2;
 $("offServeInfo").textContent=server?"🏐 ฝ่ายเสิร์ฟปัจจุบัน: "+(server.team_id===cur.team_a_id?cur.team_a:cur.team_b):
  ready?"เลือกฝ่ายเสิร์ฟ"+(cur.sets.some(x=>x.set===selectedSet&&(x.a>0||x.b>0))?"ปัจจุบันสำหรับเซตที่มีคะแนนอยู่แล้ว":"เริ่มต้นเซต "+selectedSet):
  "กรอกและบันทึกตัวจริงทั้งสองทีมก่อน";
 const hasScored=cur.sets.some(s=>s.set===selectedSet&&(s.a>0||s.b>0));
 const canChoose=cur.can_score&&!isLocked()&&ready&&selectedSet===currentSet()&&(!hasScored||!server);
 $("offStartServeA").disabled=!canChoose;$("offStartServeB").disabled=!canChoose;
 for(const [code,team] of [["A",cur.team_a_id],["B",cur.team_b_id]]){
   const config=cur.liberos?.find(l=>l.set===selectedSet&&l.team_id===team);
   $("offLiberoName"+code).textContent=code==="A"?cur.team_a:cur.team_b;
   $("offLiberoNumber"+code).value=config?.number||"";
   $("offLiberoReplace"+code).value=config?.replaces||"";
   $("offLiberoStatus"+code).textContent=config?"Libero #"+config.number+" แทน #"+config.replaces+(config.in_play?" · อยู่ในสนาม":" · อยู่ข้างสนาม"):"ยังไม่ได้กำหนด";
   $("offToggleLibero"+code).textContent=config?.in_play?"ให้ Libero ออกจากสนาม":"ส่ง Libero ลงสนาม";
   $("offToggleLibero"+code).disabled=!config||!cur.can_score||isLocked();
   $("offConfigureLibero"+code).disabled=!cur.can_score||isLocked()||!ready;
 }

 $("offCourtHint").textContent=canEditSet()?
  "กรอกหมายเลขเสื้อทีมซ้ายและขวาให้ครบ 6 ตำแหน่ง แล้วกดบันทึก": "เซตนี้เริ่มมีคะแนนแล้วหรือถูกล็อก จึงไม่สามารถแก้ตัวจริงได้";
 $("offActions").hidden=!cur.can_score||!cur.team_a_id||!cur.team_b_id||isLocked();
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
 if(!cur||busy)return;
 if(action==="point"&&selectedSet!==currentSet())return notify("เลือกเซตที่กำลังแข่งขันก่อน","error");
 if(action==="point"&&!cur.services?.some(x=>x.set===selectedSet))
  return notify("เลือกฝ่ายเสิร์ฟก่อนบันทึกคะแนน","error","เลือกทีมที่กำลังเสิร์ฟ และกดปุ่มเริ่มเสิร์ฟบนสนาม");
 busy=true;
 try{await api("official_match_command",{p_match:cur.id,p_expected:cur.revision,p_command:action,p_payload:payload});await openMatch(cur.id,true);
  if(action==="point")notify("บันทึกคะแนนแล้ว","success",cur.team_a+" "+$("offPoints0").textContent+" : "+$("offPoints1").textContent+" "+cur.team_b);
  else notify("บันทึกเหตุการณ์สำเร็จ");
 }catch(e){notify("ไม่สามารถบันทึกได้","error",errText(e));await openMatch(cur.id,true)}
 finally{busy=false}
}
const teamId=()=>$("offTeamChoice").value==="0"?cur.team_a_id:cur.team_b_id;
const player=(n,team,libero)=>cur.roster.find(r=>r.team_id===team&&r.number===String(n).trim()&&r.libero===libero);
$("offSaveBoth").onclick=save;
$("offPointA").onclick=()=>command("point",{team:0});$("offPointB").onclick=()=>command("point",{team:1});
$("offTimeoutA").onclick=()=>command("timeout",{team:0});$("offTimeoutB").onclick=()=>command("timeout",{team:1});


async function beginService(side){
 if(!cur||busy)return;const team=side==="A"?cur.team_a_id:cur.team_b_id;
 busy=true;
 try{
  await api("begin_set_service",{p_match:cur.id,p_set:selectedSet,p_team:team});
  await openMatch(cur.id,true);notify("เลือกฝ่ายเริ่มเสิร์ฟสำเร็จ","success",(side==="A"?cur.team_a:cur.team_b)+" · เซต "+selectedSet);
 }catch(e){notify("เริ่มเซตไม่ได้","error",errText(e))}
 finally{busy=false}
}
$("offStartServeA").onclick=()=>beginService("A");
$("offStartServeB").onclick=()=>beginService("B");
$("offSubstitute").onclick=async()=>{
 if(!cur||busy)return;
 const a=$("offOut").value.trim(),b=$("offIn").value.trim();
 if(!/^\d{1,3}$/.test(a)||!/^\d{1,3}$/.test(b)||a===b)
  return notify("กรอกหมายเลขไม่ถูกต้อง","error","ระบุเบอร์คนออกและเบอร์คนเข้าที่ไม่ซ้ำกัน");
 busy=true;
 try{await api("number_substitution",{p_match:cur.id,p_expected:cur.revision,p_team:teamId(),p_out:a,p_in:b});
  await openMatch(cur.id,true);notify("เปลี่ยนตัวสำเร็จ","success","#"+a+" → #"+b)}
 catch(e){notify("เปลี่ยนตัวไม่สำเร็จ","error",errText(e));await openMatch(cur.id,true)}
 finally{busy=false}
};
for(const side of ["A","B"]){
 const chosen=()=>side==="A"?cur.team_a_id:cur.team_b_id;
 $("offConfigureLibero"+side).onclick=async()=>{
  if(!cur||busy)return;
  const libero=$("offLiberoNumber"+side).value.trim(),replaced=$("offLiberoReplace"+side).value.trim();
  if(!/^\d{1,3}$/.test(libero)||!/^\d{1,3}$/.test(replaced))return notify("ระบุเบอร์ Libero และผู้เล่นที่ถูกแทนก่อน","error");
  busy=true;
  try{await api("configure_set_libero",{p_match:cur.id,p_set:selectedSet,p_team:chosen(),p_libero:libero,p_replace:replaced});
   await openMatch(cur.id,true);notify("บันทึก Libero ทีม"+side+" สำเร็จ")}
  catch(e){notify("ตั้งค่า Libero ไม่สำเร็จ","error",errText(e))}
  finally{busy=false}
 };
 $("offToggleLibero"+side).onclick=async()=>{
  if(!cur||busy)return;busy=true;
  try{const v=await api("toggle_set_libero",{p_match:cur.id,p_expected:cur.revision,p_set:selectedSet,p_team:chosen()});
   await openMatch(cur.id,true);notify(v.in_play?"Libero ลงสนามแล้ว":"Libero ออกจากสนามแล้ว")}
  catch(e){notify("สลับ Libero ไม่สำเร็จ","error",errText(e));await openMatch(cur.id,true)}
  finally{busy=false}
 };
}
$("offSanction").onclick=()=>command("sanction",{reason:$("offReason").value.slice(0,120)});
$("offSaveRoster").onclick=async()=>{
 if(!cur)return;
 const t=teamId();
 const entries=$("offRosterInput").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{
  const [number,name,kind]=x.split(",").map(a=>a?.trim());return {number,name,libero:kind?.toUpperCase()==="L"};
 });
 if(!entries.length||entries.some(x=>!x.number||!x.name))return notify("กรอกทะเบียนไม่ถูกต้อง","error","รูปแบบ: เบอร์,ชื่อ และ ,L สำหรับ Libero");
 if(!confirm("บันทึกหรืออัปเดตชื่อผู้เล่นในทะเบียน? หมายเลขเดิมจะได้รับการรักษาไว้"))return;
 try{await api("merge_match_roster",{p_match:cur.id,p_team:t,p_players:entries});await openMatch(cur.id,true);notify("บันทึกทะเบียนสำเร็จ")}
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
