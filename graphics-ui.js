import {db,$,elem,box,api,signedIn,opt,owned,downloadBlob} from "./suite-core.js";
$("graphics").innerHTML="<div class=\"eyebrow\">ออกแบบภาพการแข่งขัน</div><h1>สร้างกราฟิกการแข่งขัน</h1>\n<p>สร้างโปสเตอร์โปรแกรมการแข่งขันหรือผลการแข่งขัน รองรับแนวตั้ง 9:16 และสี่เหลี่ยม 1:1 ปรับสีและข้อความ แล้วส่งออก PNG/PDF</p>\n<div class=\"two\">\n<div class=\"card\"><h3>ตั้งค่าโปสเตอร์</h3>\n<label>รายการแข่งขัน<select id=\"gfxTournament\"></select></label><button class=\"btn\" id=\"gfxReload\">↻ โหลดรายการ</button>\n<label>ประเภทงาน<select id=\"gfxType\"><option value=\"fixtures\">โปรแกรมการแข่งขัน</option><option value=\"results\">ผลการแข่งขัน</option><option value=\"teams\">รายชื่อทีม</option></select></label>\n<div id=\"gfxResultControls\" hidden style=\"padding:14px;border:1px solid var(--u-line);border-radius:12px;margin:10px 0\"><h3>ภาพผลการแข่งขัน · คู่เดียว</h3><label>เลือกคู่ที่จบการแข่งขัน<select id=\"gfxResultMatch\"></select></label><label>โลโก้ทีมซ้าย (ไม่บังคับ)<input id=\"gfxLogoA\" type=\"file\" accept=\"image/png,image/jpeg,image/webp\"></label><label>โลโก้ทีมขวา (ไม่บังคับ)<input id=\"gfxLogoB\" type=\"file\" accept=\"image/png,image/jpeg,image/webp\"></label><button id=\"gfxRefreshResult\" class=\"btn\">↻ โหลดคะแนนล่าสุด</button><p class=\"small\">ข้อมูลชื่อทีมและคะแนนมาจากคู่แข่งขันจริง หากยังไม่ปิดผลจะแสดงว่าเป็นภาพร่าง</p></div>\n<label>ฟอนต์หัวเรื่อง<select id=\"gfxFont\"><option value=\"Anuphan\">Anuphan</option><option value=\"Kanit\">Kanit</option><option value=\"Prompt\">Prompt</option></select></label>\n<label>ชื่อหัวเรื่อง<input id=\"gfxTitle\" value=\"โปรแกรมการแข่งขันวอลเลย์บอล\"></label>\n<label>หัวเรื่องรอง<input id=\"gfxSubtitle\" value=\"ข้อมูลจากรายการแข่งขัน\"></label>\n<div class=\"formrow\"><label>ขนาด<select id=\"gfxSize\"><option value=\"portrait\">9:16 • 1080 × 1920</option><option value=\"square\">1:1 • 1080 × 1080</option></select></label>\n<label>ธีม<select id=\"gfxTheme\"><option value=\"red\">แดง–ทอง</option><option value=\"blue\">กรมท่า–ทอง</option><option value=\"black\">ดำ–ทอง</option></select></label></div>\n<label>จำนวนคู่ที่แสดง<input id=\"gfxLimit\" type=\"number\" min=\"2\" max=\"30\" value=\"16\"></label>\n<label>เพิ่มโลโก้ (รูปจากเครื่อง)<input type=\"file\" id=\"gfxLogo\" accept=\"image/png,image/jpeg,image/webp\"></label>\n<div class=\"actions\"><button class=\"btn primary\" id=\"gfxBuild\">สร้างภาพจากรายการ</button><button class=\"btn\" id=\"gfxSave\">บันทึกแบบ</button><button class=\"btn\" id=\"gfxHistory\">ดูแบบที่บันทึก</button></div>\n<div class=\"actions\"><button class=\"btn\" id=\"gfxPNG\">ดาวน์โหลด PNG</button><button class=\"btn\" id=\"gfxPDF\">ดาวน์โหลด PDF</button></div>\n<p role=\"status\" id=\"gfxStatus\"></p><div id=\"gfxSaved\"></div></div>\n<div class=\"card\"><h3>ตัวอย่างโปสเตอร์</h3><p>พาดหัวและข้อมูลการแข่งขันอ้างอิงจากรายการที่เลือก</p>\n<canvas id=\"gfxCanvas\" width=\"1080\" height=\"1920\" style=\"width:100%;height:auto;border-radius:12px;background:#6d0f18;touch-action:none\" aria-label=\"โปสเตอร์ที่สร้าง\"></canvas>\n<p class=\"small\">ไฟล์ส่งออกสร้างจากภาพแคนวาส รองรับอักษรไทยตามฟอนต์ที่อุปกรณ์มี</p></div></div>";

const canvas=$("gfxCanvas"),ctx=canvas.getContext("2d"),say=(x,b=false)=>box("gfxStatus",x,b),toast=(x,kind="success",extra="")=>window.VBC?.notify(x,kind,extra);
let rows=[],logo=null,tournaments=[],label="",lastData=null;
let resultMatches=[],resultNames=new Map(),selectedResult=null,logoA=null,logoB=null;
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
function measureLine(text,maxWidth,size){
 ctx.font="700 "+size+"px "+titleFont()+",Prompt,sans-serif";
 const segments=typeof Intl!=="undefined"&&Intl.Segmenter?
  [...new Intl.Segmenter("th",{granularity:"grapheme"}).segment(String(text))].map(x=>x.segment):Array.from(String(text));
 let out=segments.join("");
 while(segments.length>1&&ctx.measureText(out).width>maxWidth){segments.pop();out=segments.join("")+"…"}
 return out;
}
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
 if($("gfxType").value==="results"){paintResultCard(H,gold);return}
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

function resultLogo(image,x,y,radius,gold){
 ctx.fillStyle="#ffffff1f";ctx.strokeStyle=gold;ctx.lineWidth=5;
 ctx.beginPath();ctx.arc(x,y,radius,0,2*Math.PI);ctx.fill();ctx.stroke();
 if(!image){ctx.fillStyle="#fff9";ctx.font="500 22px Anuphan,Prompt,sans-serif";
 ctx.textAlign="center";ctx.fillText("โลโก้",x,y+8);return}
 const r=Math.min(radius*1.7/image.width,radius*1.7/image.height);
 ctx.drawImage(image,x-image.width*r/2,y-image.height*r/2,image.width*r,image.height*r);
}
function paintResultCard(H,gold){
 ctx.textAlign="center";
 if(!selectedResult){ctx.fillStyle="#fff";ctx.font="700 40px Anuphan,Prompt,sans-serif";
 ctx.fillText("เลือกคู่ที่มีผลการแข่งขันก่อน",540,H*.58,960);return}
 const m=selectedResult,compact=H===1080,top=compact?385:540;
 ctx.fillStyle="#ffffff14";ctx.fillRect(70,top-70,940,compact?530:720);
 resultLogo(logoA,285,top+83,compact?75:108,gold);
 resultLogo(logoB,795,top+83,compact?75:108,gold);
 ctx.fillStyle="#fff";ctx.font="700 "+(compact?43:52)+"px Anuphan,Prompt,sans-serif";
 ctx.fillText(m.team_a,285,top+(compact?202:250),420);
 ctx.fillText(m.team_b,795,top+(compact?202:250),420);
 ctx.fillStyle=gold;ctx.font="700 "+(compact?98:143)+"px Kanit,Prompt,sans-serif";
 ctx.fillText(m.score_a+" : "+m.score_b,540,top+(compact?312:430),720);
 ctx.fillStyle="#fff";ctx.font="500 "+(compact?27:35)+"px Anuphan,Prompt,sans-serif";
 ctx.fillText("ผลการแข่งขัน (จำนวนเซตที่ชนะ)",540,top+(compact?359:480));
 const scores=(m.sets||[]).filter(x=>x.status==="complete").map(x=>x.a+"–"+x.b).join("   |   ");
 ctx.fillText(scores||"ยังไม่มีคะแนนรายเซต",540,top+(compact?400:542),915);
 ctx.fillStyle=gold;ctx.font="700 "+(compact?32:45)+"px Anuphan,Prompt,sans-serif";
 ctx.fillText("🏆 ผู้ชนะ: "+(m.winner||"ยังไม่สรุป"),540,top+(compact?467:622),920);
 if(m.status!=="approved"){ctx.fillStyle="#ffdcba";ctx.font="600 25px Anuphan,Prompt,sans-serif";
 ctx.fillText("ภาพร่าง · ผลยังไม่ปิดอย่างเป็นทางการ",540,top+(compact?507:675),920)}
 ctx.fillStyle=gold;ctx.fillRect(90,H-135,900,2);
 ctx.fillStyle="#f9dcc4";ctx.font="500 22px Prompt,sans-serif";
 ctx.fillText("ภาพผลการแข่งขันจากข้อมูลที่บันทึกไว้",540,H-90);
}
async function loadLocalTeamLogo(id,side){
 const file=$(id).files?.[0];if(!file)return;
 if(file.size>3e6){toast("โลโก้ใหญ่เกิน 3 MB","error");return}
 const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{if(side==="a")logoA=im;else logoB=im;URL.revokeObjectURL(url);paint()};
 im.onerror=()=>{URL.revokeObjectURL(url);toast("อ่านภาพโลโก้ไม่ได้","error")};
 im.src=url;
}
$("gfxLogoA").onchange=()=>loadLocalTeamLogo("gfxLogoA","a");
$("gfxLogoB").onchange=()=>loadLocalTeamLogo("gfxLogoB","b");
function graphicsMode(){
 const result=$("gfxType").value==="results";$("gfxResultControls").hidden=!result;
 $("gfxLimit").closest("label").hidden=result;paint();
}
async function selectedGraphicResult(clearLogos=true){
 const match=resultMatches.find(x=>x.id===$("gfxResultMatch").value);
 if(clearLogos){logoA=null;logoB=null;$("gfxLogoA").value="";$("gfxLogoB").value=""}
 if(!match){selectedResult=null;paint();say("กรุณาเลือกคู่แข่งขันที่จบแล้ว",true);return}
 // The official RPC grants the same tournament-member access used on the score sheet.
 // No direct RLS-blocked joins: each match supplies both names and set-by-set scores.
 const snapshot=await api("official_match_snapshot",{p_match:match.id});
 const a=snapshot.team_a||match.team_a||"ทีม A",b=snapshot.team_b||match.team_b||"ทีม B";
 const aa=Number(snapshot.sets_won?.[0])||0,bb=Number(snapshot.sets_won?.[1])||0;
 selectedResult={match_id:match.id,team_a:a,team_b:b,score_a:aa,score_b:bb,
 winner:aa>bb?a:bb>aa?b:null,status:snapshot.status,
 sets:(snapshot.sets||[]).map(x=>({set:x.set,a:x.a,b:x.b,status:x.status}))};
 lastData={tournament_id:$("gfxTournament").value,type:"results",rows:[],result:selectedResult,created_at:new Date().toISOString()};
 label=tournaments.find(x=>x.id===$("gfxTournament").value)?.name||"ผลการแข่งขัน";
 paint();say("ผลการแข่งขัน: "+a+" "+aa+" – "+bb+" "+b+" (บันทึกไว้แล้ว)");
}
$("gfxResultMatch").onchange=()=>selectedGraphicResult().catch(e=>{say(e.message,true);toast("เปิดผลไม่ได้","error",e.message)});
$("gfxRefreshResult").onclick=()=>selectedGraphicResult(false).then(()=>toast("โหลดคะแนนล่าสุดแล้ว")).catch(e=>toast("โหลดผลไม่สำเร็จ","error",e.message));

async function tournamentsLoad(){
 try{
  const previous=$("gfxTournament").value;
  const [ownedItems,allMatches]=await Promise.all([owned().catch(()=>[]),api("my_official_matches",{})]);
  const all=new Map(ownedItems.map(x=>[x.id,x]));
  for(const match of allMatches||[])if(!all.has(match.tournament_id))
   all.set(match.tournament_id,{id:match.tournament_id,name:match.tournament});
  tournaments=[...all.values()];
  opt($("gfxTournament"),tournaments.map(x=>({value:x.id,label:x.name})),"เลือกรายการ");
  if(tournaments.some(x=>x.id===previous))$("gfxTournament").value=previous;
  else if(tournaments.length===1)$("gfxTournament").value=tournaments[0].id;
  else {
   // Prefer a tournament with an approved result, instead of leaving the result mode empty.
   const approved=(allMatches||[]).find(x=>x.status==="approved");
   if(approved)$("gfxTournament").value=approved.tournament_id;
  }
  say("พบรายการแข่งขัน "+tournaments.length+" รายการ");
  if($("gfxType").value==="results"&&$("gfxTournament").value)await build();else paint();
 }catch(e){say("โหลดรายการไม่ได้: "+(e.message||e),true);paint()}
}
async function buildResultFromMatchRpc(id){
 say("กำลังโหลดคู่ที่มีผลการแข่งขัน...");
 try{
  const all=await api("my_official_matches",{});
  const inTournament=(all||[]).filter(m=>m.tournament_id===id);
  resultMatches=inTournament.filter(m=>["approved","pending_approval"].includes(m.status));
  const previous=$("gfxResultMatch").value;
  opt($("gfxResultMatch"),resultMatches.map((m,i)=>({value:m.id,label:
    "คู่ "+(i+1)+" · "+(m.team_a||"ทีม A")+" พบ "+(m.team_b||"ทีม B")+" · "+
     (m.status==="approved"?"รับรองผลแล้ว":"รอปิดผล")})),"เลือกคู่ที่แข่งขันจบแล้ว");
  if(resultMatches.some(m=>m.id===previous))$("gfxResultMatch").value=previous;
  else if(resultMatches.length)$("gfxResultMatch").value=resultMatches[0].id;
  if(!resultMatches.length){
   selectedResult=null;paint();
   say("ไม่พบคู่ที่จบการแข่งขันในรายการนี้ (พบ "+inTournament.length+" คู่) ลองเลือกรายการอื่น",true);return;
  }
  await selectedGraphicResult();toast("โหลดผลการแข่งขัน "+resultMatches.length+" คู่แล้ว");
 }catch(e){
  selectedResult=null;paint();say("โหลดผลการแข่งขันไม่ได้: "+(e.message||e),true);
  toast("โหลดผลการแข่งขันไม่สำเร็จ","error",e.message||String(e));
 }
}
async function build(){
 const id=$("gfxTournament").value;if(!id){say("กรุณาเลือกรายการแข่งขัน",true);return}
 if($("gfxType").value==="results")return buildResultFromMatchRpc(id);
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
  resultMatches=matches.filter(m=>["approved","pending_approval"].includes(m.status)&&m.team_a_id&&m.team_b_id);
  resultNames=name;
  const before=$("gfxResultMatch").value;
  opt($("gfxResultMatch"),resultMatches.map((m,i)=>({value:m.id,label:
   "คู่ "+(i+1)+" · "+(name.get(m.team_a_id)||"?")+" พบ "+(name.get(m.team_b_id)||"?")+
   " · "+m.score_a_sets+"–"+m.score_b_sets})),"เลือกคู่ที่มีผลการแข่งขัน");
  if(resultMatches.some(x=>x.id===before))$("gfxResultMatch").value=before;
  else if(resultMatches.length)$("gfxResultMatch").value=resultMatches[0].id;
  if(type==="results"){
   if(!resultMatches.length){selectedResult=null;paint();say("ยังไม่มีคู่ที่จบการแข่งขัน กราฟิกผลต้องใช้คะแนนที่บันทึกไว้จริง");return}
   await selectedGraphicResult();toast("สร้างภาพผลการแข่งขันสำเร็จ");return;
  }
  selectedResult=null;
  rows=type==="teams"?info.map((x,i)=>({a:x.name,b:"ทีม "+(i+1)})):matches.map(m=>({
   a:name.get(m.team_a_id)||"รอทีม",b:name.get(m.team_b_id)||"รอทีม"
  }));
  label=tournaments.find(t=>t.id===id)?.name||"รายการแข่งขัน";
  lastData={tournament_id:id,type,rows,created_at:new Date().toISOString()};
  paint();say("สร้างภาพ "+rows.length+" รายการแล้ว");toast("สร้างภาพตัวอย่างสำเร็จ");
 }catch(e){say(e.message||"โหลดข้อมูลไม่สำเร็จ",true)}
}
$("gfxBuild").onclick=build;
$("gfxTournament").onchange=()=>{if($("gfxType").value==="results")build();else paint()};
for(const id of ["gfxTitle","gfxSubtitle","gfxTheme","gfxSize","gfxLimit","gfxFont"])$(id).addEventListener("input",paint);
$("gfxType").onchange=()=>{
 const title=$("gfxTitle");
 if(["โปรแกรมการแข่งขันวอลเลย์บอล","ผลการแข่งขันวอลเลย์บอล"].includes(title.value))
  title.value=$("gfxType").value==="results"?"ผลการแข่งขันวอลเลย์บอล":"โปรแกรมการแข่งขันวอลเลย์บอล";
 graphicsMode();if($("gfxTournament").value)build();
};
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
  const user=await signedIn(),doc={...lastData,title:$("gfxTitle").value,subtitle:$("gfxSubtitle").value,theme:$("gfxTheme").value,size:$("gfxSize").value,limit:Number($("gfxLimit").value),font:$("gfxFont").value};
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
   const d=item.document;lastData=d;rows=d.rows||[];selectedResult=d.result||null;label=tournaments.find(t=>t.id===id)?.name||"";
   $("gfxTitle").value=d.title||"";$("gfxSubtitle").value=d.subtitle||"";$("gfxTheme").value=d.theme||"red";
   $("gfxSize").value=d.size||"portrait";$("gfxType").value=d.type||"fixtures";$("gfxLimit").value=d.limit||16;$("gfxFont").value=d.font||"Anuphan";graphicsMode();paint();
  };area.append(b);
 }
 say("โหลดแบบที่บันทึก "+data.length+" รายการ");
};
$("gfxReload").onclick=tournamentsLoad;
db.auth.onAuthStateChange(()=>setTimeout(()=>tournamentsLoad().catch(e=>say(e.message,true)),0));
tournamentsLoad();
graphicsMode();
loadThaiFonts();
