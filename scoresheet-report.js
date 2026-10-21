// Printable Thai score report. Canvas pages preserve Thai glyphs in PDF without embedding font files.
const PAGE_W=1240,PAGE_H=1754;
const COLORS={ink:"#1c2636",muted:"#586579",border:"#d4dbe5",accent:"#143d69",green:"#126052"};
const clean=x=>String(x??"");
const statusName={scheduled:"ยังไม่เริ่มแข่งขัน",live:"กำลังแข่งขัน",pending_approval:"รอปิดผล",approved:"ปิดผลแล้ว",void:"ยกเลิก"};
const evtName={timeout:"เวลานอก",substitution:"เปลี่ยนตัว",libero:"Libero",rotation:"หมุนตำแหน่ง",sanction:"ลงโทษ",correction:"แก้ไข",start_set:"เริ่มเซต",end_set:"จบเซต",result_finalized:"ปิดผลการแข่งขัน"};
const date=stamp=>stamp?new Date(stamp).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"}):"—";
function sheet(snapshot,{name="",signature=null}={}){
 const images=[],font="'Prompt','Anuphan',Tahoma,sans-serif";
 const teams=[snapshot.team_a||snapshot.slot_a||"ทีม A",snapshot.team_b||snapshot.slot_b||"ทีม B"];
 const score=snapshot.sets_won||[0,0];
 const winner=snapshot.status==="approved"||snapshot.status==="pending_approval"?
  (score[0]===score[1]?"รอตรวจผล":score[0]>score[1]?teams[0]:teams[1]):"ยังไม่สรุปผู้ชนะ";
 const roster=new Map((snapshot.roster||[]).map(x=>[x.id,clean(x.number)]));
 function page(){
  const canvas=document.createElement("canvas");canvas.width=PAGE_W;canvas.height=PAGE_H;
  const c=canvas.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,PAGE_W,PAGE_H);
  c.strokeStyle=COLORS.border;c.lineWidth=2;c.strokeRect(42,42,PAGE_W-84,PAGE_H-84);
  c.fillStyle=COLORS.accent;c.fillRect(44,44,PAGE_W-88,18);
  return {canvas,c};
 }
 function txt(c,value,x,y,size=28,bold=false,color=COLORS.ink,max=1100,align="left"){
  c.fillStyle=color;c.font=(bold?700:400)+" "+size+"px "+font;c.textAlign=align;
  c.fillText(clean(value),x,y,max);c.textAlign="left";
 }
 function line(c,x,y,w){c.strokeStyle=COLORS.border;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();}
 function finish(p,n){txt(p.c,"สกอร์ชีตสรุปผล · "+(snapshot.tournament||"การแข่งขัน"),70,1688,20,false,COLORS.muted);
 txt(p.c,"หน้า "+n,1160,1688,20,false,COLORS.muted,100,"right");
 images.push(p.canvas.toDataURL("image/jpeg",.91));}
 const p=page(),c=p.c;
 txt(c,"รายงานผลการแข่งขันวอลเลย์บอล",76,123,48,true,COLORS.accent);
 txt(c,snapshot.tournament||"รายการแข่งขัน",76,176,30,true);
 txt(c,"สถานะ: "+(statusName[snapshot.status]||snapshot.status)+"   |   หมายเลขแมตช์ "+clean(snapshot.id).slice(0,8).toUpperCase(),76,222,21,false,COLORS.muted);
 line(c,76,256,1085);
 txt(c,teams[0],85,334,35,true,COLORS.ink,430);
 txt(c,score[0]+" : "+score[1],620,354,60,true,COLORS.accent,250,"center");
 txt(c,teams[1],1150,334,35,true,COLORS.ink,430,"right");
 txt(c,"ผลการแข่งขัน: "+winner,85,415,30,true,COLORS.green);
 txt(c,"ข้อมูลดึงจากผลการแข่งขันที่บันทึกไว้ ณ "+date(new Date()),85,453,20,false,COLORS.muted);
 txt(c,"คะแนนรายเซต",85,516,32,true,COLORS.accent);
 c.fillStyle="#eaf1f9";c.fillRect(76,536,1085,53);
 txt(c,"เซต",107,573,24,true);txt(c,teams[0],340,573,23,true);txt(c,teams[1],810,573,23,true);
 const setRows=(snapshot.sets||[]).slice(0,5);
 for(let i=0;i<Math.max(3,setRows.length);i++){
  const s=setRows[i]||{},y=626+i*62;
  txt(c,String(s.set??i+1),113,y,26,true);
  txt(c,s.a??"—",365,y,28,true);
  txt(c,s.b??"—",832,y,28,true);
  if(i%2===1){c.strokeStyle="#e5ebf2";line(c,76,y+17,1080);}
 }
 const offset=840;
 txt(c,"ผู้เล่นเริ่มต้นแต่ละเซต (ตำแหน่ง 1–6)",85,offset,30,true,COLORS.accent);
 const lineups=snapshot.lineups||[];
 let active=offset+57;
 for(const s of Array.from({length:snapshot.best_of||3},(_,i)=>i+1)){
  const rows=lineups.filter(l=>l.set===s);
  if(!rows.length)continue;
  txt(c,"เซต "+s,98,active,22,true);
  for(let side=0;side<2;side++){
   const team=side===0?snapshot.team_a_id:snapshot.team_b_id;
   const values=(rows.find(l=>l.team_id===team)?.initial||[]).map(id=>roster.get(id)||"?").join(" · ");
   txt(c,(side===0?"ซ้าย: ":"ขวา: ")+(values||"—"),270,active+side*29,20,false,COLORS.ink,840);
  }
  active+=75;
  if(active>1325)break;
 }
 const events=(snapshot.events||[]).filter(e=>e.event!=="point");
 txt(c,"ประวัติสำคัญ: "+events.length+" รายการ (รายละเอียดหน้าถัดไป)",85,1390,22,false,COLORS.muted);
 line(c,85,1420,1040);
 txt(c,"ผู้บันทึก / เจ้าหน้าที่: "+(name||snapshot.official_name||"........................................................"),85,1462,23,true);
 if(signature){
  const im=new Image();im.src=signature;
  try{c.drawImage(im,670,1444,380,110)}catch{/* a blank signing line remains */}
 }
 line(c,670,1580,420);
 txt(c,"ลายมือชื่อเจ้าหน้าที่ (เซ็นบนกระดาษหรือบนหน้าจอ)",670,1610,18,false,COLORS.muted);
 finish(p,1);
 const pageSize=29;
 for(let i=0;i<events.length;i+=pageSize){
  const sheetPage=page(),ctx=sheetPage.c;
  txt(ctx,"บันทึกเหตุการณ์การแข่งขัน",75,124,41,true,COLORS.accent);
  txt(ctx,teams[0]+" พบ "+teams[1],75,177,27,true);
  txt(ctx,"รายการ: "+(snapshot.tournament||"—"),75,221,22);
  line(ctx,75,251,1080);
  txt(ctx,"# / เซต",90,295,23,true);txt(ctx,"ประเภท",250,295,23,true);txt(ctx,"รายละเอียด",505,295,23,true);
  const group=events.slice(i,i+pageSize);
  for(let j=0;j<group.length;j++){
   const event=group[j],y=339+j*44;
   if(j%2===0){ctx.fillStyle="#f4f7fb";ctx.fillRect(76,y-27,1080,39);}
   txt(ctx,clean(event.seq)+"/"+clean(event.set),90,y,19);
   txt(ctx,evtName[event.event]||event.event,250,y,20);
   const p=event.payload||{};
   const description=[p.out_number&&"ออก #"+p.out_number,p.in_number&&"เข้า #"+p.in_number,
   p.libero_number&&"Libero #"+p.libero_number,p.reason,p.official_name].filter(Boolean).join(" · ")||date(event.at);
   txt(ctx,description,505,y,20,false,COLORS.ink,635);
  }
  finish(sheetPage,images.length+1);
 }
 return images;
}
export async function makeScoresheetDocument(snapshot,options={}){
 if(!snapshot?.id)throw Error("กรุณาเลือกคู่แข่งขันก่อน");
 if(document.fonts){
  await Promise.allSettled([document.fonts.load("700 48px Prompt","รายงานการแข่งขัน"),
   document.fonts.load("500 25px Anuphan","คะแนนรวม")]);await document.fonts.ready;
 }
 const pages=sheet(snapshot,options);
 const {jsPDF}=await import("https://esm.sh/jspdf@2.5.2");
 const doc=new jsPDF({unit:"mm",format:"a4",orientation:"portrait",compress:true});
 for(let n=0;n<pages.length;n++){if(n)doc.addPage();doc.addImage(pages[n],"JPEG",0,0,210,297)}
 return doc;
}
export async function downloadScoresheet(snapshot,options){
 const doc=await makeScoresheetDocument(snapshot,options);
 doc.save("สกอร์ชีต-"+clean(snapshot.team_a||"A")+"-"+clean(snapshot.team_b||"B")+".pdf");
}
export async function printScoresheet(snapshot,options){
 // Open the tab synchronously to avoid losing the user gesture after awaits.
 const tab=window.open("","_blank");
 try{const doc=await makeScoresheetDocument(snapshot,options);
  const url=URL.createObjectURL(doc.output("blob"));
  if(tab){tab.location.href=url;tab.focus();setTimeout(()=>URL.revokeObjectURL(url),120000)}
  else{doc.save("สกอร์ชีต.pdf");URL.revokeObjectURL(url)}
 }catch(e){tab?.close();throw e}
}
