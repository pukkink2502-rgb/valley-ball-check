import {db,$,elem,box,api,signedIn,opt,owned,downloadBlob} from "./suite-core.js";
$("graphics").innerHTML="<div class=\"eyebrow\">ออกแบบภาพการแข่งขัน</div><h1>สร้างกราฟิกการแข่งขัน</h1>\n<p>สร้างโปสเตอร์โปรแกรมการแข่งขันหรือผลการแข่งขัน รองรับแนวตั้ง 9:16 และสี่เหลี่ยม 1:1 ปรับสีและข้อความ แล้วส่งออก PNG/PDF</p>\n<div class=\"two\">\n<div class=\"card\"><h3>ตั้งค่าโปสเตอร์</h3>\n<label>รายการแข่งขัน<select id=\"gfxTournament\"></select></label><button class=\"btn\" id=\"gfxReload\">↻ โหลดรายการ</button>\n<label>ประเภทงาน<select id=\"gfxType\"><option value=\"fixtures\">โปรแกรมการแข่งขัน</option><option value=\"results\">ผลการแข่งขัน</option><option value=\"teams\">รายชื่อทีม</option></select></label>\n<label>ฟอนต์หัวเรื่อง<select id=\"gfxFont\"><option value=\"Anuphan\">Anuphan</option><option value=\"Kanit\">Kanit</option><option value=\"Prompt\">Prompt</option></select></label>\n<label>ชื่อหัวเรื่อง<input id=\"gfxTitle\" value=\"โปรแกรมการแข่งขันวอลเลย์บอล\"></label>\n<label>หัวเรื่องรอง<input id=\"gfxSubtitle\" value=\"ข้อมูลจากรายการแข่งขัน\"></label>\n<div class=\"formrow\"><label>ขนาด<select id=\"gfxSize\"><option value=\"portrait\">9:16 • 1080 × 1920</option><option value=\"square\">1:1 • 1080 × 1080</option></select></label>\n<label>ธีม<select id=\"gfxTheme\"><option value=\"red\">แดง–ทอง</option><option value=\"blue\">กรมท่า–ทอง</option><option value=\"black\">ดำ–ทอง</option></select></label></div>\n<label>จำนวนคู่ที่แสดง<input id=\"gfxLimit\" type=\"number\" min=\"2\" max=\"30\" value=\"16\"></label>\n<label>เพิ่มโลโก้ (รูปจากเครื่อง)<input type=\"file\" id=\"gfxLogo\" accept=\"image/png,image/jpeg,image/webp\"></label>\n<div class=\"actions\"><button class=\"btn primary\" id=\"gfxBuild\">สร้างภาพจากรายการ</button><button class=\"btn\" id=\"gfxSave\">บันทึกแบบ</button><button class=\"btn\" id=\"gfxHistory\">ดูแบบที่บันทึก</button></div>\n<div class=\"actions\"><button class=\"btn\" id=\"gfxPNG\">ดาวน์โหลด PNG</button><button class=\"btn\" id=\"gfxPDF\">ดาวน์โหลด PDF</button></div>\n<p role=\"status\" id=\"gfxStatus\"></p><div id=\"gfxSaved\"></div></div>\n<div class=\"card\"><h3>ตัวอย่างโปสเตอร์</h3><p>พาดหัวและข้อมูลการแข่งขันอ้างอิงจากรายการที่เลือก</p>\n<canvas id=\"gfxCanvas\" width=\"1080\" height=\"1920\" style=\"width:100%;height:auto;border-radius:12px;background:#6d0f18;touch-action:none\" aria-label=\"โปสเตอร์ที่สร้าง\"></canvas>\n<p class=\"small\">ไฟล์ส่งออกสร้างจากภาพแคนวาส รองรับอักษรไทยตามฟอนต์ที่อุปกรณ์มี</p></div></div>";

const canvas=$("gfxCanvas"),ctx=canvas.getContext("2d"),say=(x,b=false)=>box("gfxStatus",x,b),toast=(x,kind="success",extra="")=>window.VBC?.notify(x,kind,extra);
let rows=[],logo=null,tournaments=[],label="",lastData=null;
let fontsReady=false;
async function loadThaiFonts(){
 if(!fontsReady){try{
  await Promise.all([
    document.fonts.load("700 66px Anuphan","กีฬาไทย"),
    document.fonts.load("700 66px Kanit","การแข่งขันวอลเลย์บอล"),
    document.fonts.load("500 29px Prompt","ประเทศไทย")
  ]);
  await document.fonts.ready;fontsReady=true;
 }catch(e){console.warn("Font fallback:",e)}}
 paint();
}
function titleFont(){return $("gfxFont")?.value||"Anuphan"}
const palettes={red:["#6b101b","#200a17","#edbd63"],blue:["#123662","#07142b","#ffca78"],black:["#232323","#080808","#d7bd85"]};
function measureLine(text,maxWidth,size){ctx.font="700 "+size+"px "+titleFont()+",Prompt,sans-serif";let s=String(text);while(s.length>1&&ctx.measureText(s).width>maxWidth)s=s.slice(0,-2)+"…";return s}
function paint(){
 const W=1080,H=$("gfxSize").value==="square"?1080:1920;canvas.width=W;canvas.height=H;
 const [a,b,gold]=palettes[$("gfxTheme").value],gradient=ctx.createLinearGradient(0,0,W,H);
 gradient.addColorStop(0,a);gradient.addColorStop(1,b);ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=gold;ctx.lineWidth=8;for(let i=-5;i<16;i++){ctx.beginPath();ctx.moveTo(-100+i*120,0);ctx.lineTo(300+i*120,H);ctx.stroke()}ctx.restore();
 ctx.strokeStyle=gold;ctx.lineWidth=8;ctx.strokeRect(36,36,W-72,H-72);
 ctx.fillStyle=gold;ctx.textAlign="center";ctx.font="700 48px Kanit,Prompt,sans-serif";ctx.fillText("การแข่งขันวอลเลย์บอล",W/2,105);
 if(logo){const scale=Math.min(170/logo.width,170/logo.height);ctx.drawImage(logo,W/2-logo.width*scale/2,124,logo.width*scale,logo.height*scale);}
 ctx.fillStyle="#fff7ef";let header=$("gfxTitle").value||"โปรแกรมการแข่งขันวอลเลย์บอล";
 ctx.font="700 66px "+titleFont()+",Prompt,sans-serif";ctx.fillText(measureLine(header,990,66),W/2,logo?365:255);
 ctx.font="500 29px Prompt,sans-serif";ctx.fillStyle="#ffe0a8";ctx.fillText(measureLine($("gfxSubtitle").value,1000,29),W/2,logo?420:310);
 const start=logo?495:390,foot=H-160,available=foot-start,count=Math.min(rows.length,Number($("gfxLimit").value)||16,30);
 const line=Math.min(91,Math.max(35,available/Math.max(1,count)));
 const font=Math.max(18,Math.min(31,line*.37));
 ctx.textAlign="left";ctx.fillStyle=gold;ctx.font="700 27px Anuphan,Prompt,sans-serif";
 ctx.fillText(label||"รายการแข่งขัน",75,start-38);
 for(let i=0;i<count;i++){
  const y=start+i*line;
  ctx.fillStyle=i%2?"#ffffff12":"#ffffff20";ctx.fillRect(65,y,950,line-6);
  ctx.fillStyle="#fff";ctx.font="700 "+font+"px Anuphan,Prompt,sans-serif";
  ctx.fillText(String(i+1).padStart(2,"0"),82,y+line*.62);
  const r=rows[i],left=measureLine(r.a,390,font),right=measureLine(r.b,390,font);
  ctx.fillText(left,170,y+line*.62);
  ctx.fillStyle=gold;ctx.font="700 "+font+"px Kanit,Prompt,sans-serif";ctx.fillText("พบ",555,y+line*.62);
  ctx.textAlign="right";ctx.fillStyle="#fff";ctx.font="700 "+font+"px Anuphan,Prompt,sans-serif";ctx.fillText(right,1010,y+line*.62);ctx.textAlign="left";
 }
 ctx.fillStyle=gold;ctx.fillRect(90,H-135,900,2);
 ctx.fillStyle="#f9dcc4";ctx.textAlign="center";ctx.font="500 22px Prompt,sans-serif";ctx.fillText("สร้างจากข้อมูลการแข่งขัน",W/2,H-89);
}
async function tournamentsLoad(){
 try{tournaments=await owned();opt($("gfxTournament"),tournaments.map(x=>({value:x.id,label:x.name})),"เลือกรายการ");say("พบรายการแข่งขัน "+tournaments.length+" รายการ");paint()}
 catch(e){say(e.message,true);paint()}
}
async function build(){
 const id=$("gfxTournament").value;if(!id){say("กรุณาเลือกรายการแข่งขัน",true);return}
 say("กำลังโหลดข้อมูล...");
 try{
  const [{data:teams,error:et},{data:matches,error:em}]=await Promise.all([
   db.from("tournament_teams").select("team_id").eq("tournament_id",id),
   db.from("matches").select("id,team_a_id,team_b_id,status,score_a_sets,score_b_sets").eq("tournament_id",id).order("created_at")
  ]);
  if(et||em)throw (et||em);
  const ids=[...new Set(teams.map(x=>x.team_id))];
  const {data:info,error:ei}=await db.from("teams").select("id,name").in("id",ids);
  if(ei)throw ei;const name=new Map(info.map(t=>[t.id,t.name]));
  const type=$("gfxType").value;
  rows=type==="teams"?info.map((x,i)=>({a:x.name,b:"ทีม "+(i+1)})):matches.filter(m=>type==="fixtures"||m.status==="approved").map(m=>({
   a:name.get(m.team_a_id)||"?",b:type==="results"?(name.get(m.team_b_id)||"?")+" ("+m.score_a_sets+"–"+m.score_b_sets+")":name.get(m.team_b_id)||"?"
  }));
  label=tournaments.find(t=>t.id===id)?.name||"รายการแข่งขัน";lastData={tournament_id:id,type,rows,created_at:new Date().toISOString()};
  paint();say("สร้างภาพ "+rows.length+" รายการแล้ว");toast("สร้างภาพตัวอย่างสำเร็จ");
 }catch(e){say(e.message||"โหลดข้อมูลไม่สำเร็จ",true)}
}
$("gfxBuild").onclick=build;
for(const id of ["gfxTitle","gfxSubtitle","gfxTheme","gfxSize","gfxLimit","gfxType","gfxFont"])$(id).addEventListener("input",paint);
$("gfxLogo").onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>3e6){say("โลโก้ต้องเล็กกว่า 3 MB",true);return}
 const uri=URL.createObjectURL(f),image=new Image();image.onload=()=>{logo=image;URL.revokeObjectURL(uri);paint()};image.onerror=()=>{URL.revokeObjectURL(uri);say("เปิดภาพไม่ได้",true)};image.src=uri;
};
function filename(ext){return "valley-ball-poster-"+new Date().toISOString().slice(0,10)+"."+ext}
$("gfxPNG").onclick=async()=>{await loadThaiFonts();canvas.toBlob(blob=>{if(blob){downloadBlob(blob,filename("png"));toast("ดาวน์โหลดภาพ PNG แล้ว")}else{say("ส่งออกไม่ได้",true);toast("ส่งออก PNG ไม่สำเร็จ","error") }},"image/png")};
$("gfxPDF").onclick=async()=>{
 say("กำลังสร้าง PDF...");await loadThaiFonts();
 try{const {jsPDF}=await import("https://esm.sh/jspdf@2.5.2");
 const portrait=$("gfxSize").value!=="square";
 const doc=new jsPDF({orientation:"portrait",unit:"mm",format:portrait?[210,373.33]:[210,210],compress:true});
 doc.addImage(canvas.toDataURL("image/jpeg",.92),"JPEG",0,0,210,portrait?373.33:210);
 doc.save(filename("pdf"));say("ส่งออก PDF สำเร็จ");toast("ดาวน์โหลดไฟล์ PDF แล้ว");
 }catch(e){say("สร้าง PDF ไม่สำเร็จ: "+e.message,true)}
};
$("gfxSave").onclick=async()=>{
 if(!lastData){say("กรุณาสร้างโปสเตอร์จากรายการก่อน",true);return}
 try{
  const user=await signedIn(),doc={...lastData,title:$("gfxTitle").value,subtitle:$("gfxSubtitle").value,theme:$("gfxTheme").value,size:$("gfxSize").value,limit:Number($("gfxLimit").value)};
  const size=$("gfxSize").value==="square"?1080:1920;
  const {error}=await db.from("graphics_projects").insert({tournament_id:lastData.tournament_id,created_by:user.id,title:doc.title.slice(0,150)||"Graphic",document:doc,width:1080,height:size});
  if(error)throw error;say("บันทึกการตั้งค่ากราฟิกลง Supabase แล้ว");toast("บันทึกแบบกราฟิกสำเร็จ");
 }catch(e){say(e.message,true)}
};
$("gfxHistory").onclick=async()=>{
 const id=$("gfxTournament").value;if(!id)return say("เลือกรายการก่อน",true);
 const {data,error}=await db.from("graphics_projects").select("id,title,document,created_at").eq("tournament_id",id).order("created_at",{ascending:false}).limit(12);
 if(error)return say(error.message,true);
 const area=$("gfxSaved");area.replaceChildren();
 if(!data.length)area.append(elem("p","ยังไม่มีแบบที่บันทึก"));
 for(const item of data){
  const b=elem("button",item.title+" · "+new Date(item.created_at).toLocaleDateString("th-TH"),"btn");
  b.onclick=()=>{
   const d=item.document;lastData=d;rows=d.rows||[];label=tournaments.find(t=>t.id===id)?.name||"";
   $("gfxTitle").value=d.title||"";$("gfxSubtitle").value=d.subtitle||"";$("gfxTheme").value=d.theme||"red";
   $("gfxSize").value=d.size||"portrait";$("gfxType").value=d.type||"fixtures";$("gfxLimit").value=d.limit||16;paint();
  };area.append(b);
 }
 say("โหลดแบบที่บันทึก "+data.length+" รายการ");
};
$("gfxReload").onclick=tournamentsLoad;
db.auth.onAuthStateChange(()=>setTimeout(()=>tournamentsLoad().catch(e=>say(e.message,true)),0));
tournamentsLoad();

loadThaiFonts();
