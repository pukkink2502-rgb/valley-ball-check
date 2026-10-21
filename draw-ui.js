import {db,$,elem,api,owned,opt} from "./suite-core.js";

const root=$("draw");root.innerHTML="<div class=\"eyebrow\">ระบบจับสลากการแข่งขัน</div>\n<h1>จับสลากแบบวงล้อ</h1><p>ระบบจะจับ <strong>ลำดับทีมก่อน</strong> แล้วจึงจับ <strong>สาย A–D</strong> ทีละทีม มีภาพวงล้อและบันทึกผลลงฐานข้อมูลทุกครั้ง</p>\n<div class=\"card\"><div class=\"formrow\"><label>รายการแข่งขัน<select id=\"drawTournament\"></select></label>\n<label>จำนวนสาย<select id=\"drawGroupCount\"><option value=\"1\">1 สาย</option><option value=\"2\" selected>2 สาย</option><option value=\"3\">3 สาย</option><option value=\"4\">4 สาย</option></select></label></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"drawStart\">เริ่มจับสลากใหม่</button><button class=\"btn\" id=\"drawResume\">เปิดผลจับสลากเดิม</button>\n<button class=\"btn\" id=\"drawReload\">↻ โหลดรายการ</button></div>\n<p id=\"drawStatus\" role=\"status\" class=\"small\"></p></div>\n<div id=\"drawStage\" hidden><div class=\"wizard-head\" style=\"margin-top:17px\"><span class=\"wizard-pill\" id=\"drawOrderStage\">ขั้นที่ 1 · จับลำดับทีม</span><span class=\"wizard-pill\" id=\"drawGroupStage\">ขั้นที่ 2 · จับสาย</span></div>\n<div class=\"card\"><div class=\"wheel-stage\"><div class=\"wheel-shell\">\n<div class=\"wheel-pointer\" aria-hidden=\"true\"></div><div class=\"wheel-disc\" id=\"wheelDisc\"><div class=\"wheel-inner\" id=\"wheelLabel\">พร้อมจับสลาก</div></div></div>\n<div><div class=\"eyebrow\" id=\"drawPhase\">ขั้นที่ 1</div><h2 id=\"drawHeading\">จับลำดับทีม</h2>\n<p id=\"drawStepHelp\">กดหมุนวงล้อเพื่อจับลำดับทีละทีม เมื่อครบแล้วระบบจะเปลี่ยนเป็นการจับสายให้อัตโนมัติ</p>\n<div class=\"actions\"><button class=\"btn primary\" id=\"drawSpin\">🎯 หมุนวงล้อจับสลาก</button></div>\n<div class=\"result\" id=\"drawLastResult\" hidden></div><p class=\"small\" id=\"drawProgress\">ยังไม่เริ่ม</p>\n</div></div></div>\n<div class=\"two\" style=\"margin-top:15px\"><div class=\"card\"><h3>ผลจับลำดับ</h3><div id=\"drawOrders\">ยังไม่มีผล</div></div>\n<div class=\"card\"><h3>ผลจับสาย</h3><div id=\"drawGroups\">ยังไม่มีผล</div></div></div></div>";
let tournaments=[],current=null,events=[],loading=false,turns=0;
const toast=(message,type="success",details="")=>window.VBC?.notify(message,type,details);
const tell=message=>$("drawStatus").textContent=message;
async function list(){
 try{tournaments=await owned();
 opt($("drawTournament"),tournaments.map(x=>({value:x.id,label:x.name})),"เลือกรายการ");
 tell(tournaments.length?"พบ "+tournaments.length+" รายการ":"ยังไม่มีรายการแข่งขัน ให้สร้างในเมนูจัดการแข่งขันก่อน");
 }catch(e){tell(e.message)}
}
function phase(){
 const step=current?.config?.phase||"order",done=step==="completed";
 $("drawOrderStage").classList.toggle("current",step==="order");
 $("drawGroupStage").classList.toggle("current",step==="groups"||done);
 $("drawPhase").textContent=step==="order"?"ขั้นที่ 1 · จับลำดับ":step==="groups"?"ขั้นที่ 2 · จับสาย":"จับสลากเสร็จแล้ว";
 $("drawHeading").textContent=step==="order"?"จับลำดับทีม":step==="groups"?"จับสายทีละทีม":"จับสลากครบทุกทีม";
 $("drawStepHelp").textContent=step==="order"?"กดหมุนเพื่อสุ่มทีมออกมาตามลำดับ จับครบทุกทีมก่อนเข้าสู่ขั้นที่ 2":
 step==="groups"?"นำทีมตามลำดับที่จับได้มาจับสาย A–D ทีละทีม จำนวนทีมแต่ละสายจะใกล้เคียงกัน":
 "ผลการจับทั้งสองขั้นตอนถูกบันทึกไว้แล้ว สามารถย้อนดูได้ทุกครั้ง";
 $("drawSpin").disabled=loading||done;
 $("drawSpin").textContent=done?"จับสลากครบแล้ว":step==="order"?"หมุนวงล้อ · จับลำดับถัดไป":"หมุนวงล้อ · จับสายถัดไป";
 const totals=Number(current?.config?.total)||0;
 $("drawProgress").textContent="จับลำดับแล้ว "+events.filter(x=>x.event_type==="order").length+"/"+totals+
 " ทีม · จับสายแล้ว "+events.filter(x=>x.event_type==="group").length+"/"+totals+" ทีม";
}
function renderEvents(){
 const orders=$("drawOrders"),groups=$("drawGroups");orders.replaceChildren();groups.replaceChildren();
 const order=events.filter(x=>x.event_type==="order"),group=events.filter(x=>x.event_type==="group");
 if(!order.length)orders.append(elem("p","รอจับลำดับ"));
 if(!group.length)groups.append(elem("p","รอจับสาย"));
 for(const e of order){const item=elem("div","","item-card");item.append(elem("strong",e.payload.order+". "+e.payload.team));orders.append(item)}
 for(const e of group){const item=elem("div","","item-card");item.append(elem("strong",e.payload.team),elem("strong","สาย "+e.payload.group));groups.append(item)}
 phase();
}
async function refresh(){
 if(!current)return;
 const [one,two]=await Promise.all([
  db.from("draw_sessions").select("id,status,config,created_at").eq("id",current.id).single(),
  db.from("draw_events").select("sequence_no,event_type,payload").eq("draw_session_id",current.id).order("sequence_no")
 ]);
 if(one.error||two.error)throw (one.error||two.error);
 current=one.data;events=two.data||[];$("drawStage").hidden=false;renderEvents();
}
async function start(){
 const tournament=$("drawTournament").value,groups=Number($("drawGroupCount").value);
 if(!tournament)return toast("เลือกรายการแข่งขันก่อน","error");
 if(!confirm("เริ่มจับสลากใหม่แบบ 2 ขั้นตอนสำหรับรายการนี้? ผลเดิมจะยังถูกเก็บในประวัติ"))return;
 loading=true;$("drawStart").disabled=true;
 try{const s=await api("start_draw_steps",{p_tournament:tournament,p_groups:groups,p_title:"จับลำดับและจับสาย"});
  current={id:s.id,config:{phase:"order",total:s.total,groups},status:"running"};events=[];turns=0;
  $("wheelLabel").textContent="เริ่มจับลำดับ";$("drawLastResult").hidden=true;
  await refresh();toast("เริ่มการจับสลากสำเร็จ","success","ขั้นที่ 1 จับลำดับทีม");}
 catch(e){toast("เริ่มจับสลากไม่ได้","error",e.message)}
 finally{loading=false;$("drawStart").disabled=false}
}
async function resume(){
 const id=$("drawTournament").value;if(!id)return toast("เลือกรายการแข่งขันก่อน","error");
 try{const {data,error}=await db.from("draw_sessions").select("id,config,status,created_at").eq("tournament_id",id).order("created_at",{ascending:false}).limit(15);
 if(error)throw error;
 const flow=(data||[]).find(d=>d.config?.mode==="two_phase_wheel");
 if(!flow)return toast("รายการนี้ยังไม่มีผลจับสลากวงล้อ","warning");
 current=flow;turns=0;await refresh();toast("โหลดการจับสลากเดิมแล้ว")}
 catch(e){toast("โหลดการจับสลากไม่ได้","error",e.message)}
}
async function spin(){
 if(!current||loading||current.status!=="running")return;
 loading=true;phase();$("drawSpin").disabled=true;
 const disc=$("wheelDisc");
 turns+=1;disc.classList.add("spinning");
 disc.style.transform="rotate("+(turns*1440+Math.floor(Math.random()*350))+"deg)";
 $("wheelLabel").textContent="กำลังจับ...";
 const startAt=Date.now();
 try{
  const result=await api("draw_one_step",{p_draw:current.id});
  await new Promise(resolve=>setTimeout(resolve,Math.max(350,2300-(Date.now()-startAt))));
  $("wheelLabel").textContent=result.phase==="order"?result.team:"สาย "+result.group;
  $("drawLastResult").hidden=false;
  $("drawLastResult").textContent=result.phase==="order"?
  "ลำดับที่ "+result.position+" → "+result.team:
  result.team+" → สาย "+result.group;
  await refresh();
  toast(result.phase==="order"?"จับลำดับสำเร็จ":"จับสายสำเร็จ","success",
  result.phase==="order"?result.team+" · ลำดับ "+result.position:result.team+" · สาย "+result.group);
  if(result.next_phase==="groups")toast("จับลำดับครบแล้ว","success","ขั้นถัดไป: หมุนวงล้อจับสาย");
  if(result.next_phase==="completed")toast("จับสลากครบทั้ง 2 ขั้นตอนแล้ว");
 }catch(e){toast("หมุนวงล้อไม่สำเร็จ","error",e.message)}
 finally{disc.classList.remove("spinning");loading=false;phase()}
}
$("drawStart").onclick=start;$("drawSpin").onclick=spin;
$("drawReload").onclick=()=>list().then(()=>toast("โหลดรายการล่าสุดแล้ว"));
$("drawResume").onclick=resume;
db.auth.onAuthStateChange(()=>setTimeout(()=>list().catch(()=>{}),0));list();
