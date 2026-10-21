import {db,$,elem,api,opt} from "./suite-core.js";
import {roundRobinRounds} from "./lib/fixture-planner.mjs";
const root=$("draw");root.innerHTML="<div class=\"eyebrow\">จับสลากวอลเลย์บอล</div><h1>ห้องจับสลาก</h1>\n<p>เพิ่มทีมได้ทันที ไม่ต้องสร้างรายการแข่งขันก่อน จับลำดับแล้วจับสาย ดูผลให้ครบ และกดบันทึกเป็นรายการแข่งขันเมื่อพร้อม</p>\n<div class=\"two\" style=\"align-items:start\">\n<div class=\"card\">\n<h3>1. ตั้งค่าการจับสลาก</h3>\n<label>ชื่อรายการที่จะใช้เมื่อบันทึก<input id=\"drawTitle\" maxlength=\"140\" placeholder=\"เช่น วอลเลย์บอลหญิงประจำปี 2569\"></label>\n<label>รายชื่อทีม (ทีมละหนึ่งบรรทัด)<textarea id=\"drawNames\" rows=\"8\" placeholder=\"ทีม 1&#10;ทีม 2&#10;ทีม 3&#10;ทีม 4\"></textarea></label>\n<div class=\"formrow\"><label>จำนวนสาย (สูงสุด 26 สาย)<input id=\"drawGroupCount\" type=\"number\" min=\"1\" max=\"26\" value=\"2\"></label>\n<label>รูปแบบเซต<select id=\"drawBestOf\"><option value=\"3\">2 ใน 3 เซต</option><option value=\"5\">3 ใน 5 เซต</option></select></label></div>\n<div class=\"actions\"><button id=\"drawStart\" class=\"btn primary\">เริ่มห้องจับสลาก</button><button id=\"drawGoLogin\" class=\"btn\">ไปเข้าสู่ระบบ</button></div>\n<p class=\"small\" id=\"drawStatus\" role=\"status\">กรอกข้อมูลแล้วเริ่มจับสลากได้เลย</p>\n</div>\n<div class=\"card\"><h3>ห้องจับสลากที่เคยทำ</h3>\n<label>รายการเดิม<select id=\"drawSavedRooms\"></select></label>\n<div class=\"actions\"><button class=\"btn\" id=\"drawResume\">เปิดรายการเดิม</button><button class=\"btn\" id=\"drawReload\">↻ โหลดใหม่</button></div>\n<p class=\"small\">ผลการหมุนถูกบันทึกแต่ละครั้ง สามารถเปิดกลับมาดูได้ และจะไม่เปลี่ยนตารางแข่งขันจนกว่าจะกดบันทึก</p>\n</div></div>\n<div id=\"drawStage\" hidden style=\"margin-top:16px\">\n<div class=\"wizard-head\"><span class=\"wizard-pill current\" id=\"drawOrderStage\">ขั้นที่ 1 · จับลำดับ</span><span class=\"wizard-pill\" id=\"drawGroupStage\">ขั้นที่ 2 · จับสาย</span>\n<span class=\"wizard-pill\" id=\"drawSaveStage\">ขั้นที่ 3 · บันทึก</span></div>\n<div class=\"card\"><div class=\"wheel-stage\">\n<div class=\"wheel-shell\"><div class=\"wheel-pointer\" aria-hidden=\"true\"></div><div class=\"wheel-disc\" id=\"wheelDisc\">\n<div class=\"wheel-inner\" id=\"wheelLabel\">พร้อมหมุนวงล้อ</div></div></div>\n<div><div class=\"eyebrow\" id=\"drawPhase\"></div><h2 id=\"drawHeading\"></h2>\n<p id=\"drawStepHelp\"></p><div class=\"actions\"><button id=\"drawSpin\" class=\"btn primary\">◉ หมุนวงล้อ</button></div>\n<div class=\"result\" id=\"drawLastResult\" hidden></div><p class=\"small\" id=\"drawProgress\"></p></div>\n</div></div>\n<div class=\"card\" style=\"margin-top:15px\"><h3>2. ผลการจับลำดับ</h3>\n<div id=\"drawOrders\" class=\"action-row\"></div></div>\n<div class=\"card\" style=\"margin-top:15px\"><div class=\"section-head\"><h3>3. ผลการจับสาย</h3>\n<span class=\"small\">จัดทีมตามสายและลำดับ A1, A2, B1, B2 …</span></div>\n<div id=\"drawGroupCards\" class=\"draw-group-grid\"></div></div>\n<div class=\"card\" style=\"margin-top:15px\"><h3>4. ตัวอย่างคู่พบกันหมดในแต่ละสาย</h3>\n<p>ตารางนี้จะแสดงหลังจับสายครบ สามารถกลับไปจัดการลำดับคู่หรือเพิ่มรอบต่อได้ในเมนูจัดการแข่งขัน</p>\n<div class=\"tablewrap\"><table><thead><tr><th>สาย</th><th>รอบ</th><th>ทีมแรก</th><th>ทีมที่สอง</th></tr></thead><tbody id=\"drawFixtures\"></tbody></table></div></div>\n<div class=\"card\" style=\"margin-top:15px\" id=\"drawSaveBox\" hidden><h3>5. ยืนยันบันทึกเข้าระบบแข่งขัน</h3>\n<p>ตรวจชื่อและผลสายก่อน แล้วบันทึกครั้งเดียว ระบบจะสร้างรายการแข่งขัน ทีม สาย และคู่พบกันหมดให้อัตโนมัติ</p>\n<label>ชื่อรายการแข่งขัน<input id=\"drawFinalTitle\" maxlength=\"140\"></label>\n<div class=\"actions\"><button id=\"drawCommit\" class=\"btn primary\">✓ บันทึกผลจับสลากเป็นรายการแข่งขัน</button>\n<button id=\"drawGoTournament\" class=\"btn\" hidden>เปิดรายการที่บันทึกแล้ว →</button></div>\n<p id=\"drawSavedResult\" role=\"status\"></p>\n</div>\n</div>";
const pop=(a,type="success",b="")=>window.VBC?.notify(a,type,b);
const say=x=>$("drawStatus").textContent=x;
let room=null,locked=false,spins=0,history=[];
async function listRooms(){
 try{
  const {data:{user}}=await db.auth.getUser();
  if(!user){say("กรุณาเข้าสู่ระบบในเมนูจัดการแข่งขันก่อน");opt($("drawSavedRooms"),[],"ต้องเข้าสู่ระบบ");return}
  history=await api("my_standalone_draws",{});
  opt($("drawSavedRooms"),history.map(x=>({value:x.id,label:x.title+" · "+x.teams+" ทีม · "+
   (x.phase==="saved"?"บันทึกแล้ว":x.phase==="complete"?"รอบันทึก":"กำลังจับสลาก")})),"เลือกห้องเดิม");
  say("มีห้องจับสลาก "+history.length+" รายการ");
 }catch(e){say(e.message);pop("โหลดห้องจับสลากไม่ได้","error",e.message)}
}
function names(){return room?.names||[]}
function name(index){return names()[Number(index)]||"ทีมไม่ทราบชื่อ"}
function sequence(){
 const e=room?.events||[];return e.filter(x=>x.phase==="order").sort((a,b)=>a.step-b.step);
}
function assignments(){
 return (room?.events||[]).filter(x=>x.phase==="groups").sort((a,b)=>a.step-b.step);
}
function groupRows(){
 const map=new Map();
 for(let i=0;i<(room?.groups||0);i++)map.set(String.fromCharCode(65+i),[]);
 for(const e of assignments())map.get(e.group)?.push({...e,name:name(e.team_index)});
 for(const list of map.values())list.sort((a,b)=>a.position-b.position);
 return map;
}
function appendBox(parent,title,subtitle){
 const el=elem("div","","item-card");el.append(elem("strong",title));
 if(subtitle)el.append(elem("small",subtitle));parent.append(el);
}
function render(){
 if(!room)return;
 $("drawStage").hidden=false;
 const phase=room.phase,done=["complete","saved"].includes(phase),ordered=sequence(),grouped=assignments();
 $("drawOrderStage").classList.toggle("current",phase==="order");
 $("drawGroupStage").classList.toggle("current",phase==="groups");
 $("drawSaveStage").classList.toggle("current",done);
 $("drawPhase").textContent=phase==="order"?"ขั้นที่ 1":phase==="groups"?"ขั้นที่ 2":"ขั้นที่ 3";
 $("drawHeading").textContent=phase==="order"?"จับลำดับทีม":phase==="groups"?"จับสายตามลำดับ":"ตรวจผลและบันทึก";
 $("drawStepHelp").textContent=phase==="order"?"หมุนวงล้อเลือกทีมออกมาทีละทีม ระบบจะเรียงลำดับ 1, 2, 3 …":
 phase==="groups"?"วงล้อเลือกสายให้ทีมตามลำดับที่จับไว้ และจัดตำแหน่ง A1, A2, B1 … อัตโนมัติ":
 "ผลทั้งสองขั้นตอนครบแล้ว ตรวจรายชื่อทุกสาย แล้วกดบันทึกเมื่อพร้อม";
 $("drawProgress").textContent="ลำดับ "+ordered.length+"/"+names().length+" · จับสาย "+grouped.length+"/"+names().length;
 $("drawSpin").hidden=done;$("drawSpin").disabled=locked;
 $("drawSpin").textContent=phase==="order"?"หมุนวงล้อจับลำดับถัดไป":"หมุนวงล้อจับสายถัดไป";
 if(done)$("wheelLabel").textContent="ครบทุกสายแล้ว";
 const out=$("drawOrders");out.replaceChildren();
 ordered.forEach((e,i)=>appendBox(out,"ลำดับ "+(i+1),name(e.team_index)));
 const cards=$("drawGroupCards");cards.replaceChildren();
 const groups=groupRows();
 for(const [letter,list] of groups){
  const card=elem("div","","draw-group-card");card.append(elem("h3","สาย "+letter));
  if(!list.length)card.append(elem("p","รอผลการจับสาย"));
  for(const e of list){
   const row=elem("div","","draw-team-row");
   row.append(elem("strong",letter+e.position));
   const field=document.createElement("input");field.value=e.name;field.maxLength=140;
   field.disabled=room.phase==="saved";field.setAttribute("aria-label","เปลี่ยนชื่อ "+letter+e.position);
   field.onchange=async()=>{
    const value=field.value.trim();if(value===e.name)return;
    try{await api("rename_draw_team",{p_id:room.id,p_team_index:e.team_index,p_name:value});
     await load(room.id);pop("บันทึกชื่อทีมสำเร็จ","success",letter+e.position+" · "+value)}
    catch(error){field.value=e.name;pop("เปลี่ยนชื่อทีมไม่ได้","error",error.message)}
   };row.append(field);card.append(row);
  }cards.append(card);
 }
 const body=$("drawFixtures");body.replaceChildren();
 if(done){
  for(const [letter,list] of groups){
   if(list.length<2)continue;
   for(const [r,fixtures] of roundRobinRounds(list.map(x=>letter+x.position)).entries()){
    for(const m of fixtures){const tr=elem("tr");
     for(const v of ["สาย "+letter,"รอบ "+(r+1),m.a,m.b])tr.append(elem("td",v));
     body.append(tr);}
   }
  }
 }
 if(!body.children.length){const tr=elem("tr"),td=elem("td",done?"ไม่มีคู่ในสายที่มีทีมเดียว":"รอจับสายให้ครบ");td.colSpan=4;tr.append(td);body.append(tr)}
 $("drawSaveBox").hidden=!done;
 $("drawCommit").hidden=phase==="saved";$("drawFinalTitle").disabled=phase==="saved";
 $("drawGoTournament").hidden=phase!=="saved";$("drawSavedResult").textContent=phase==="saved"?
 "บันทึกเป็นรายการแข่งขันเรียบร้อย เปิดเมนูจัดการแข่งขันเพื่อจัดรอบถัดไปได้":"";
}
async function load(id){
 const prev=room?.id;room=await api("standalone_draw_snapshot",{p_id:id});
 if(room.id!==prev)spins=0;
 if(!$("drawFinalTitle").value||room.id!==prev)$("drawFinalTitle").value=room.title;
 render();
}
$("drawStart").onclick=async()=>{
 if(locked)return;
 const list=$("drawNames").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),groups=Number($("drawGroupCount").value);
 const title=$("drawTitle").value.trim();
 if(!title||list.length<2||list.length>64||groups<1||groups>26||groups>list.length)
  return pop("ข้อมูลห้องจับสลากไม่ครบ","error","ต้องมีชื่อรายการ 2–64 ทีม และจำนวนสายไม่เกินทีม/26");
 if(new Set(list.map(s=>s.toLocaleLowerCase())).size!==list.length)return pop("ชื่อทีมซ้ำ","error","กรุณาแก้ชื่อก่อนเริ่ม");
 locked=true;$("drawStart").disabled=true;
 try{const next=await api("start_standalone_draw",{p_title:title,p_names:list,p_groups:groups,p_best_of:Number($("drawBestOf").value)});
  await load(next.id);await listRooms();$("drawSavedRooms").value=next.id;
  pop("เปิดห้องจับสลากสำเร็จ","success","เริ่มจับลำดับทีมได้เลย");
  $("drawStage").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){pop("เปิดห้องจับสลากไม่สำเร็จ","error",e.message)}
 finally{locked=false;$("drawStart").disabled=false}
};
$("drawSpin").onclick=async()=>{
 if(!room||locked||!["order","groups"].includes(room.phase))return;
 locked=true;$("drawSpin").disabled=true;const disc=$("wheelDisc");
 const wait=Date.now();spins++;disc.classList.add("spinning");
 disc.style.transform="rotate("+(spins*1440+Math.round(Math.random()*360))+"deg)";
 $("wheelLabel").textContent="กำลังหมุน…";
 try{
  const r=await api("standalone_draw_step",{p_id:room.id});
  await new Promise(done=>setTimeout(done,Math.max(250,2100-(Date.now()-wait))));
  $("drawLastResult").hidden=false;
  $("drawLastResult").textContent=r.phase==="order"?
   "ลำดับที่ "+r.number+": "+r.name:r.name+" → "+r.group+r.group_position;
  await load(room.id);
  $("wheelLabel").textContent=r.phase==="order"?r.name:r.group+r.group_position;
  if(r.next_phase==="groups")pop("จับลำดับครบแล้ว","success","ต่อไปจับสายให้ครบทุกทีม");
  else if(r.next_phase==="complete")pop("จับสายครบแล้ว","success","ตรวจผลและกดบันทึกเป็นรายการแข่งขัน");
  else pop(r.phase==="order"?"จับลำดับสำเร็จ":"จับสายสำเร็จ","success",
   r.phase==="order"?r.name:r.name+" → "+r.group+r.group_position);
 }catch(e){pop("หมุนวงล้อไม่สำเร็จ","error",e.message)}
 finally{disc.classList.remove("spinning");locked=false;render()}
};
$("drawCommit").onclick=async()=>{
 if(!room||locked||room.phase!=="complete")return;
 const title=$("drawFinalTitle").value.trim();if(!title)return pop("กรอกชื่อรายการแข่งขันก่อน","error");
 if(!confirm("บันทึกผลการจับสลากและสร้างรายการแข่งขันชื่อ «"+title+"» ใช่หรือไม่?"))return;
 locked=true;$("drawCommit").disabled=true;
 try{const result=await api("save_standalone_draw",{p_id:room.id,p_tournament_name:title});
  await load(room.id);pop("บันทึกผลจับสลากเรียบร้อย","success",result.teams+" ทีม "+result.groups+" สาย · "+result.matches+" คู่");
  await listRooms();
 }catch(e){pop("บันทึกผลเข้าการแข่งขันไม่สำเร็จ","error",e.message)}
 finally{locked=false;$("drawCommit").disabled=false}
};
$("drawResume").onclick=async()=>{const id=$("drawSavedRooms").value;if(!id)return pop("เลือกห้องจับสลากก่อน","error");
 try{await load(id);pop("โหลดผลจับสลากแล้ว");$("drawStage").scrollIntoView({behavior:"smooth",block:"start"})}
 catch(e){pop("เปิดห้องเดิมไม่ได้","error",e.message)}
};
$("drawReload").onclick=listRooms;
$("drawGoLogin").onclick=()=>window.VBC?.navigate("manager");
$("drawGoTournament").onclick=()=>window.VBC?.navigate("manager");
db.auth.onAuthStateChange(()=>setTimeout(()=>listRooms().catch(console.warn),0));
listRooms();
