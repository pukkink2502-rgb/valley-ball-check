import {$,elem,box,api} from "./suite-core.js";

const off=$("offLoaded");const panel=document.createElement("div");panel.className="card";panel.style.marginTop="16px";
panel.innerHTML="<h3>Position Check — ตรวจการยืนตำแหน่ง</h3>\n<p>เลือกทีมและเซตที่บันทึกตัวจริง 6 คนไว้ แล้วระบุตำแหน่ง X/Y บนสนามเป็นเปอร์เซ็นต์ ระบบจะตรวจความสัมพันธ์หน้า–หลังและซ้าย–ขวาของตำแหน่ง 1–6</p>\n<div class=\"formrow\"><label>ทีม<select id=\"pcTeam\"><option value=\"0\">ทีม A</option><option value=\"1\">ทีม B</option></select></label>\n<label>เซต<input id=\"pcSet\" type=\"number\" min=\"1\" max=\"5\" value=\"1\"></label><button class=\"btn\" id=\"pcLoad\">ดึงตัวจริงจากสกอร์ชีต</button>\n<button class=\"btn primary\" id=\"pcCheck\">ตรวจตำแหน่ง</button></div>\n<div id=\"pcCourt\" class=\"grid\" style=\"grid-template-columns:repeat(3,minmax(0,1fr));gap:8px\"></div>\n<p id=\"pcStatus\" role=\"status\"></p><p class=\"small\">ตัวช่วยตรวจเบื้องต้นจากจุดที่ระบุ ไม่ใช่การตรวจ Video Tracking หรือการตัดสินฟาวล์ตำแหน่งอัตโนมัติ</p>";off.append(panel);
const nums=[4,3,2,5,6,1];let state=null;
const origin={4:[20,25],3:[50,25],2:[80,25],5:[20,75],6:[50,75],1:[80,75]};
const tell=(s,b=false)=>box("pcStatus",s,b);
async function load(){
 const id=$("offMatch").value||$("offMatchId").value.trim();if(!id)return tell("กรุณาเลือกแมตช์ก่อน",true);
 try{
  const snap=await api("official_match_snapshot",{p_match:id});
  const team=$("pcTeam").value==="0"?snap.team_a_id:snap.team_b_id;
  const setNo=Number($("pcSet").value);
  const lineup=snap.lineups.find(l=>l.team_id===team&&l.set===setNo);
  if(!lineup){tell("ยังไม่บันทึกตัวจริงทีมนี้ในเซตดังกล่าว",true);return}
  const names=new Map(snap.roster.map(r=>[r.id,r.number+" "+r.name]));
  state=nums.map((pos,index)=>({pos,player:names.get(lineup.positions[pos-1])||"ไม่พบรายชื่อ",x:origin[pos][0],y:origin[pos][1]}));
  const court=$("pcCourt");court.replaceChildren();
  for(const p of state){
   const c=document.createElement("div");c.className="team";c.style.padding="10px";
   c.append(elem("strong","ตำแหน่ง "+p.pos),elem("p",p.player));
   for(const axis of ["x","y"]){const label=elem("label",axis.toUpperCase()+" %");const field=document.createElement("input");
    field.type="number";field.min="0";field.max="100";field.value=String(p[axis]);field.style.width="100%";
    field.addEventListener("input",()=>{p[axis]=Number(field.value)});label.append(field);c.append(label);}
   court.append(c);
  }
  tell("โหลดผู้เล่น "+state.length+" คนแล้ว ตรวจตำแหน่งก่อนเสิร์ฟตามจุดที่กำหนด");
 }catch(e){tell(e.message,true)}
}
function check(){
 if(!state||state.length!==6)return tell("โหลดตัวจริงก่อน",true);
 const p=Object.fromEntries(state.map(a=>[a.pos,a])),faults=[];
 for(const s of state)if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<0||s.x>100||s.y<0||s.y>100)faults.push("ตำแหน่ง "+s.pos+" อยู่นอกสนาม");
 for(const [front,back] of [[4,5],[3,6],[2,1]])if(p[front].y>=p[back].y)faults.push("หน้า–หลัง "+front+"/"+back);
 for(const [l,m,r] of [[4,3,2],[5,6,1]])if(!(p[l].x<p[m].x && p[m].x<p[r].x))faults.push("ซ้าย–ขวา "+l+"/"+m+"/"+r);
 if(faults.length)tell("พบตำแหน่งเสี่ยงผิดกติกา: "+faults.join(", "),true);
 else tell("ผ่านการตรวจรูปแบบตำแหน่งเบื้องต้นตามพิกัดที่กรอก (ยังต้องให้ผู้ตัดสินยืนยัน)");
}
$("pcLoad").onclick=load;$("pcCheck").onclick=check;
$("offMatch").addEventListener("change",()=>{state=null;$("pcCourt").replaceChildren()});
