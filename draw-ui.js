import {db,$,elem,box,api,signedIn,opt,owned} from "./suite-core.js";
$("draw").innerHTML="<div class=\"eyebrow\">SERVER-SIDE DRAW · AUDITED</div><h1>Live Draw</h1>\n<p>จับสลากรายชื่อทีมแบบสุ่มฝั่งฐานข้อมูลและบันทึกลำดับ ตั๋วสุ่ม เวลา และประวัติการจับสลาก</p>\n<div class=\"notice\">การจับสลากนี้แยกจากโปรแกรมการแข่งขันเดิม ไม่เรียงลำดับคู่แข่งใหม่โดยอัตโนมัติ และเป็นการสุ่มที่ตรวจย้อนหลังได้ ไม่ใช่พิธีจับสลากแบบ Commit–Reveal ที่พิสูจน์ความเป็นธรรมต่อสาธารณะ</div>\n<div class=\"card\">\n<div class=\"formrow\"><label>รายการแข่งขัน<select id=\"drawTournament\"></select></label><button class=\"btn\" id=\"drawReload\">โหลดรายการ</button></div>\n<label>ชื่อรอบจับสลาก<input id=\"drawTitle\" value=\"จับสลากลำดับทีม\"></label>\n<div class=\"actions\"><button class=\"btn primary\" id=\"drawRun\">เริ่มจับสลากและบันทึกผล</button><button class=\"btn\" id=\"drawHistory\">ประวัติการจับสลาก</button></div><p id=\"drawStatus\" role=\"status\"></p>\n</div>\n<div class=\"card\" style=\"margin-top:16px\"><h3>ผลการจับสลาก</h3><div class=\"tablewrap\">\n<table><thead><tr><th>ลำดับ</th><th>ทีม</th><th>ตั๋วสุ่ม (Audit)</th></tr></thead><tbody id=\"drawOutput\"></tbody></table></div><p id=\"drawDetail\"></p></div>";

const root=$("draw"),show=(s,b=false)=>box("drawStatus",s,b);let tournaments=[];
async function init(){
 try{tournaments=await owned();opt($("drawTournament"),tournaments.map(t=>({value:t.id,label:t.name})),"เลือกรายการ");show("พร้อมจับสลาก "+tournaments.length+" รายการ")}
 catch(e){show(e.message,true)}
}
async function showEvents(draw){
 const {data,error}=await db.from("draw_events").select("sequence_no,payload,created_at").eq("draw_session_id",draw.id).order("sequence_no");
 if(error){show(error.message,true);return}
 const tbody=$("drawOutput");tbody.replaceChildren();
 for(const e of data||[]){
  const tr=elem("tr");for(const s of [e.sequence_no,e.payload?.team||"",e.payload?.ticket||""])tr.append(elem("td",s));
  tbody.append(tr);
 }
 $("drawDetail").textContent="รหัสครั้งจับสลาก "+draw.id+" · "+new Date(draw.created_at).toLocaleString("th-TH")+" · ทั้งหมด "+data.length+" ทีม";
}
async function history(){
 const id=$("drawTournament").value;if(!id)return show("เลือกรายการก่อน",true);
 const {data,error}=await db.from("draw_sessions").select("id,created_at,status,config").eq("tournament_id",id).order("created_at",{ascending:false}).limit(20);
 if(error)return show(error.message,true);
 if(!data.length)return show("ยังไม่มีประวัติ",true);
 await showEvents(data[0]);show("แสดงผลการจับสลากครั้งล่าสุด รวม "+data.length+" ครั้งในประวัติ");
}
$("drawReload").onclick=init;$("drawHistory").onclick=history;
$("drawRun").onclick=async()=>{
 const id=$("drawTournament").value;
 if(!id)return show("กรุณาเลือกรายการ",true);
 if(!confirm("ยืนยันการสุ่มและบันทึกผลลงฐานข้อมูล? ไม่เปลี่ยนโปรแกรมเดิม"))return;
 $("drawRun").disabled=true;show("กำลังจับสลาก...");
 try{const result=await api("run_tournament_draw",{p_tournament:id,p_title:$("drawTitle").value.slice(0,120)});
   const {data,error}=await db.from("draw_sessions").select("id,created_at").eq("id",result.draw_id).single();
   if(error)throw error;await showEvents(data);show("จับสลากสำเร็จ "+result.count+" ทีมและบันทึก Audit Log แล้ว");
 }catch(e){show(e.message,true)}finally{$("drawRun").disabled=false}
};
init();
