import {courtForSet} from "./court-side-rules.mjs";
/**
 * A4 LANDSCAPE volleyball scoresheet — printable, one summary and one/more set pages.
 * Inspired by FIVB service-order/point recording, NOT the official FIVB-issued form.
 * Uses recorded event history and shows gaps rather than pretending it is complete.
 */
const W=1754,H=1240;
const C={navy:"#163350",blue:"#19577c",ink:"#162735",muted:"#506679",line:"#bac9d5",pale:"#edf3f8",teal:"#daf2e8",white:"#fff",gold:"#e3ac46",red:"#9e3040"};
const font="'Anuphan','Prompt',Tahoma,sans-serif";
const str=x=>String(x??"");
const integer=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
function canvasPage(){
 const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
 const c=canvas.getContext("2d");c.fillStyle=C.white;c.fillRect(0,0,W,H);
 c.fillStyle=C.navy;c.fillRect(0,0,W,16);return {c,canvas};
}
function txt(c,s,x,y,n=23,bold=false,color=C.ink,max=1600,align="left"){
 c.font=(bold?700:400)+" "+n+"px "+font;c.fillStyle=color;c.textAlign=align;
 c.fillText(str(s),x,y,max);c.textAlign="left";
}
function rect(c,x,y,w,h,color=C.white){c.fillStyle=color;c.fillRect(x,y,w,h);c.strokeStyle=C.line;c.lineWidth=1.5;c.strokeRect(x,y,w,h)}
function line(c,x,y,w){c.strokeStyle=C.line;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke()}
function pageTitle(c,s,name,sub){
 txt(c,name,57,67,39,true,C.navy);
 txt(c,s.tournament||"รายการแข่งขัน",57,106,25,true,C.muted,1240);
 txt(c,(s.team_a||s.slot_a||"ทีม A")+" พบ "+(s.team_b||s.slot_b||"ทีม B"),57,146,27,true);
 txt(c,sub,1695,112,20,false,C.muted,490,"right");line(c,57,169,1640);
}
function footer(c,index,title){
 line(c,58,1184,1638);
 txt(c,"สกอร์ชีตวอลเลย์บอล · จัดทำจากบันทึกการแข่งขันจริง · รูปแบบแนวนอน",59,1211,18,false,C.muted);
 txt(c,title+" · หน้า "+index,1695,1211,18,false,C.muted,430,"right");
}
const names=s=>[s.team_a||s.slot_a||"ทีม A",s.team_b||s.slot_b||"ทีม B"];
function pointsByTeam(s,number){
 const events=[...(s.events||[])].filter(e=>e.event==="point"&&Number(e.set)===Number(number))
 .sort((a,b)=>integer(a.seq)-integer(b.seq));
 const counts=[0,0],list=[[],[]];
 for(const e of events){
  const i=Number(e.payload?.team);if(i!==0&&i!==1)continue;
  counts[i]++;list[i].push({point:counts[i],seq:e.seq,time:e.at});
 }
 return list;
}
function lineup(s,set,teamId){
 const roster=new Map((s.roster||[]).map(x=>[str(x.id),str(x.number)]));
 const l=(s.lineups||[]).find(x=>x.set===set&&x.team_id===teamId);
 return Array.from({length:6},(_,i)=>roster.get(str(l?.initial?.[i]))||"—");
}
function drawSummary(s,sign,index){
 const {canvas,c}=canvasPage();pageTitle(c,s,"รายงานสกอร์ชีตวอลเลย์บอล · สรุปการแข่งขัน","A4 แนวนอน");
 const [a,b]=names(s),wins=s.sets_won||[0,0];
 rect(c,57,194,1640,158,C.pale);
 txt(c,a,110,251,43,true,C.ink,650);txt(c,b,1640,251,43,true,C.ink,650,"right");
 txt(c,wins[0]+" : "+wins[1],878,286,74,true,C.navy,300,"center");
 const closed=["approved","pending_approval"].includes(s.status);
 const winner=closed?(wins[0]===wins[1]?"รอผล":wins[0]>wins[1]?a:b):"ยังไม่สิ้นสุด";
 txt(c,"ทีมชนะ: "+winner,878,329,30,true,C.blue,1360,"center");
 txt(c,"สถานะ: "+({approved:"ปิดผลแล้ว",pending_approval:"แข่งขันจบแล้ว รอปิดผล",live:"กำลังแข่งขัน",scheduled:"ยังไม่แข่งขัน"}[s.status]||s.status),59,402,25,true);
 txt(c,"วันที่ออกเอกสาร: "+new Date().toLocaleString("th-TH"),1692,402,21,false,C.muted,800,"right");
 txt(c,"คะแนนรายเซต",59,465,30,true,C.navy);
 const edges=[57,210,650,1060,1375,1697],header=490;
 rect(c,57,header,1640,60,C.pale);
 ["เซต","ทีม A: "+a,"ทีม B: "+b,"ชนะเซต","สถานะ"].forEach((v,i)=>txt(c,v,edges[i]+15,header+38,23,true,C.navy,edges[i+1]-edges[i]-27));
 const sets=s.sets||[];
 for(let i=0;i<Math.max(3,sets.length);i++){
  const row=sets[i]||{},y=550+i*66;
  rect(c,57,y,1640,66,i%2?C.pale:C.white);
  txt(c,row.set||i+1,72,y+43,27,true);
  txt(c,row.a??"—",227,y+43,28,true);
  txt(c,row.b??"—",671,y+43,28,true);
  txt(c,row.status==="complete"?(Number(row.a)>Number(row.b)?a:b):"—",1078,y+43,22,true,C.blue,284);
  txt(c,row.status==="complete"?"จบเซต":"รอดำเนินการ",1392,y+43,21);
 }
 const start=550+Math.max(3,sets.length)*66+55;
 txt(c,"ผู้บันทึก / เจ้าหน้าที่: "+(s._officer||s.official_name||"............................................."),61,start,27,true);
 txt(c,"ลงลายมือชื่อผู้บันทึก",1040,start+42,23,true);
 if(sign)try{c.drawImage(sign,1020,start+47,510,125)}catch{}
 line(c,1018,start+184,565);
 txt(c,"สามารถเซ็นสดหลังพิมพ์หรือเซ็นบนหน้าจอก่อนส่งออก",1018,start+211,18,false,C.muted,580);
 txt(c,"หมายเหตุ: บันทึกผลจากระบบไม่ใช่เอกสารรับรองการแข่งขันโดย FIVB",60,1121,19,false,C.muted);
 footer(c,index,"สรุป");return canvas.toDataURL("image/jpeg",.91);
}
function drawPoints(c,x,y,team,realPoints,final,first,last){
 rect(c,x,y,788,453);
 c.fillStyle=C.navy;c.fillRect(x,y,788,51);
 txt(c,team,x+15,y+34,28,true,C.white,760);
 txt(c,"แต้มตั้งแต่ "+first+" ถึง "+last+"  •  ผลจบเซต "+final+" แต้ม",x+15,y+82,19,false,C.muted);
 const logged=new Set(realPoints.map(p=>p.point));
 for(let j=0;j<=59&&first+j<=last;j++){
  const n=first+j,row=Math.floor(j/10),col=j%10;
  const px=x+13+col*76,py=y+100+row*56,scored=n<=final,verified=logged.has(n);
  rect(c,px,py,74,54,scored?(verified?C.teal:"#fff2dc"):C.white);
  txt(c,n,px+9,py+27,21,scored,C.ink);
  if(scored){
   c.strokeStyle=verified?C.blue:C.gold;c.lineWidth=2.7;c.beginPath();
   c.moveTo(px+6,py+43);c.lineTo(px+65,py+8);c.stroke();
  }
 }
 txt(c,"ขีดน้ำเงิน = พบเหตุการณ์คะแนน  |  ขีดทอง = คะแนนสรุปที่ไม่มีเหตุการณ์",x+15,y+446,16,false,C.muted,760);
}
function serviceSequence(s,set){
 const first=(s.services||[]).find(x=>Number(x.set)===Number(set))?.first_team_id;
 const id=[s.team_a_id,s.team_b_id],k=team=>id.indexOf(team);
 const serverIndex=k(first);
 if(serverIndex<0)return {ok:false,turns:[],note:"ไม่มีข้อมูลทีมเริ่มเสิร์ฟของเซตนี้"};
 const seq=[...(s.events||[])].filter(e=>Number(e.set)===Number(set))
 .sort((a,b)=>integer(a.seq)-integer(b.seq));
 const rotations=[0,0],score=[0,0],turns=[];
 let server=serverIndex;
 const add=()=>turns.push({side:server,pos:(rotations[server]%6)+1,score:[...score],seq:null});
 add();
 for(const event of seq){
  if(event.event==="rotation"){
   const side=k(event.payload?.team_id);
   if(side<0)continue;
   rotations[side]++;
   if(server!==side){server=side;add()}
  }else if(event.event==="point"){
   const side=Number(event.payload?.team);
   if(side!==0&&side!==1)continue;
   if(server!==side){server=side;rotations[side]++;add()}
   score[side]++;turns.at(-1).score=[...score];turns.at(-1).seq=event.seq;
  }
 }
 const end=(s.sets||[]).find(x=>Number(x.set)===Number(set));
 const verified=!end||(score[0]===Number(end.a)&&score[1]===Number(end.b));
 return {ok:verified,turns,note:verified?"เรียงตามเหตุการณ์หมุนตำแหน่งและแต้ม":"คะแนนในเหตุการณ์ไม่ตรงผลรวม • โปรดตรวจบันทึกเดิม"};
}
function drawService(c,s,set,top){
 const result=serviceSequence(s,set),roster=[lineup(s,set,s.team_a_id),lineup(s,set,s.team_b_id)];
 txt(c,"ลำดับผู้เล่นเสิร์ฟ I–VI และรอบเสิร์ฟ",57,top,27,true,C.navy);
 for(let side=0;side<2;side++){
  const x=side?910:57,base=top+19;
  rect(c,x,base,787,45,side?C.pale:C.teal);
  txt(c,"ทีม "+(side?"B":"A"),x+10,base+30,23,true,C.navy);
  for(let pos=1;pos<=6;pos++)txt(c,["I","II","III","IV","V","VI"][pos-1],x+255+(pos-1)*83,base+30,20,true);
  const matches=result.turns.filter(t=>t.side===side);
  for(let round=0;round<3;round++){
   const y=base+45+round*57;rect(c,x,y,787,57,round%2?C.pale:C.white);
   txt(c,"รอบ "+(round+1),x+9,y+36,19,true);
   for(let pos=1;pos<=6;pos++){
    const colX=x+239+(pos-1)*83,t=matches.filter(t=>t.pos===pos)[round];
    c.strokeStyle=C.line;c.strokeRect(colX,y,83,57);
    if(t){
     txt(c,"#"+roster[side][pos-1],colX+7,y+24,17,true,C.blue,76);
     txt(c,t.score[side],colX+7,y+46,19,true);
    }else txt(c,"—",colX+31,y+34,16,false,C.muted);
   }
  }
  if(matches.length>18)txt(c,"รอบเพิ่มเติม: "+(matches.length-18),x+12,base+237,16,false,C.red);
 }
 if(!result.ok)txt(c,"ตรวจสอบข้อมูลเสิร์ฟ: "+result.note,63,top+279,18,true,C.red,1570);
 return result;
}
function drawSetPage(s,data,set,page,first,last,pages){
 const {canvas,c}=canvasPage(),namesList=names(s);
 pageTitle(c,s,"บันทึกคะแนน · เซต "+set.set,"หน้า "+(page+1)+"/"+pages+" • ผล "+set.a+"–"+set.b);
 const court=courtForSet(s,set.set),start=(s.court_sides||[]).find(x=>Number(x.set)===(Number(set.set)===Number(s.best_of)?set.set:1));
 const initial=Number(set.set)===Number(s.best_of)?start?.left_team_id:Number(set.set)%2===1?start?.left_team_id:
  start?.left_team_id===s.team_a_id?s.team_b_id:s.team_a_id;
 const firstTeam=(s.services||[]).find(x=>Number(x.set)===Number(set.set))?.first_team_id;
 txt(c,"ฝั่งต้นเซต: "+(initial===s.team_a_id?"A":initial===s.team_b_id?"B":"ไม่บันทึก")+
 " อยู่ซ้าย    |    เริ่มเสิร์ฟ: "+(firstTeam===s.team_a_id?"A":firstTeam===s.team_b_id?"B":"ไม่บันทึก")+
 (court?.decidingSwitched?"    |    เปลี่ยนฝั่งในเซตตัดสินเมื่อมีทีมถึง 8 แต้ม":""),60,196,21,true,C.blue);
 rect(c,57,208,1640,92,C.pale);
 const la=lineup(s,set.set,s.team_a_id),lb=lineup(s,set.set,s.team_b_id);
 txt(c,"ตัวจริง: ลำดับเสิร์ฟ I → VI",75,239,22,true,C.navy);
 txt(c,"A: "+la.map((n,i)=>["I","II","III","IV","V","VI"][i]+" #"+n).join("   "),75,268,22,false,C.ink,1550);
 txt(c,"B: "+lb.map((n,i)=>["I","II","III","IV","V","VI"][i]+" #"+n).join("   "),75,293,22,false,C.ink,1550);
 drawPoints(c,57,318,namesList[0],data[0],integer(set.a),first,last);
 drawPoints(c,910,318,namesList[1],data[1],integer(set.b),first,last);
 const service=drawService(c,s,set.set,808);
 const all=(s.events||[]).filter(e=>Number(e.set)===Number(set.set));
 const other=all.filter(e=>["timeout","substitution","libero","sanction","correction"].includes(e.event));
 txt(c,"บันทึกอื่น: "+other.length+" รายการ (เวลานอก / เปลี่ยนตัว / Libero / ลงโทษ)",62,1124,20,false,C.muted);
 txt(c,"ผู้บันทึก: "+(s._officer||s.official_name||"........................................"),62,1152,20,true);
 line(c,1065,1151,582);txt(c,"ลายมือชื่อเจ้าหน้าที่",1150,1171,16,false,C.muted);
 footer(c,s._page,"เซต "+set.set);
 return {jpeg:canvas.toDataURL("image/jpeg",.92),turns:service.turns};
}
async function createPages(snapshot,options={}){
 if(!snapshot?.id)throw Error("กรุณาเลือกคู่แข่งขันก่อน");
 if(document.fonts){
  await Promise.allSettled([document.fonts.load("700 41px Anuphan","ผลการแข่งขัน"),
    document.fonts.load("500 25px Prompt","คะแนน")]);await document.fonts.ready;
 }
 let signature=null;
 if(options.signature){
  try{signature=new Image();signature.src=options.signature;await signature.decode()}catch{signature=null}
 }
 const s={...snapshot,_officer:options.name||snapshot.official_name||""};
 const pages=[drawSummary(s,signature,1)];
 for(const set of s.sets||[]){
  const required=Math.max(Number(set.set)===Number(s.best_of)?15:25,integer(set.a),integer(set.b));
  const chunks=Math.max(1,Math.ceil(required/60)),points=pointsByTeam(s,set.set);
  for(let i=0;i<chunks;i++){
   s._page=pages.length+1;
   pages.push(drawSetPage(s,points,set,i,i*60+1,Math.min(required,(i+1)*60),chunks).jpeg);
  }
 }
 return pages;
}
export async function createScoresheetPreviewImages(snapshot,options={}){return createPages(snapshot,options)}
export async function makeScoresheetDocument(snapshot,options={}){
 const pages=await createPages(snapshot,options);
 const {jsPDF}=await import("https://esm.sh/jspdf@2.5.2");
 const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
 pages.forEach((img,index)=>{if(index)doc.addPage();doc.addImage(img,"JPEG",0,0,297,210)});
 return doc;
}
const filename=(s)=>"สกอร์ชีต-"+str(s.team_a||"ทีม-A").replace(/[\\/:*?"<>|]/g,"-")+"-"+str(s.team_b||"ทีม-B").replace(/[\\/:*?"<>|]/g,"-")+".pdf";
export async function downloadScoresheet(snapshot,options){(await makeScoresheetDocument(snapshot,options)).save(filename(snapshot))}
export async function printScoresheet(snapshot,options){
 const tab=window.open("","_blank");
 try{
  const doc=await makeScoresheetDocument(snapshot,options),url=URL.createObjectURL(doc.output("blob"));
  if(tab){tab.location.href=url;tab.focus();setTimeout(()=>URL.revokeObjectURL(url),120000)}
  else{doc.save(filename(snapshot));URL.revokeObjectURL(url)}
 }catch(e){tab?.close();throw e}
}
