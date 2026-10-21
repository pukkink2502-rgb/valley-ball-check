// Valley Ball Check online guest scoreboard — development preview
(function(){
"use strict";
const API="https://rwnvlxwdorsrxjuepcxp.supabase.co/functions/v1/guest-score";
const $=id=>document.getElementById(id);
const scopeMap={v:"viewer",c:"controller",r:"recovery"};
let active=null,session=null,stored=null,refreshTimer=null,busy=false;
function setMsg(message,isError){const out=$("onlineStatus");if(!out)return;out.textContent=message;out.style.color=isError?"#ff9fa9":"#c6e6c3";}
function urlFor(id,kind,token){return location.origin+location.pathname+"#guest="+id+"."+kind+"."+token;}
function validRoleFromHash() {
 const m=location.hash.match(/^#guest=([a-f0-9-]{36})\.([vcr])\.([a-f0-9]{64})$/i);
 return m?{id:m[1],kind:m[2],token:m[3]}:null;
}
async function call(body){
 const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
 const data=await response.json().catch(()=>({error:"BAD_RESPONSE"}));
 if(!response.ok)throw new Error(data.message||data.error||"HTTP "+response.status);
 return data;
}
function showLinks(){
 const c=stored;
 const container=$("onlineLinks");if(!container)return;
 const canShare=!!(c&&c.id);
 container.hidden=!canShare;
 if(!canShare)return;
 if(c.tokens?.viewer) $("onlineViewerUrl").value=urlFor(c.id,"v",c.tokens.viewer);
 if(c.tokens?.controller) $("onlineControllerUrl").value=urlFor(c.id,"c",c.tokens.controller);
 if(c.tokens?.recovery) $("onlineRecoveryUrl").value=urlFor(c.id,"r",c.tokens.recovery);
 [["onlineViewerUrl",!!c.tokens?.viewer],["onlineControllerUrl",!!c.tokens?.controller],["onlineRecoveryUrl",!!c.tokens?.recovery]].forEach(([id,yes])=>$(id).parentElement.hidden=!yes);
}
async function openSession(ref) {
 active=ref;session=null;history.replaceState(null,"",urlFor(ref.id,ref.kind,ref.token));
 document.querySelector('button[data-page="online"]')?.click();
 await refresh();
 if(refreshTimer)clearInterval(refreshTimer);
 refreshTimer=setInterval(()=>{if(active&&!busy)refresh(true).catch(()=>{});},3500);
}
async function refresh(silent=false){
 if(!active)return;
 try {
  const data=await call({action:"read",id:active.id,token:active.token});
  session=data.session;render();
  if(!silent)setMsg("โหลดคะแนนออนไลน์สำเร็จ — คะแนนดึงใหม่ประมาณทุก 3.5 วินาที",false);
 }catch(e){if(!silent)setMsg(e.message,true);}
}
function render(){
 const controls=$("onlineControls"),board=$("onlineBoard");
 if(!active){controls.hidden=true;board.hidden=true;return}
 $("onlineRole").textContent=scopeMap[active.kind]||"guest";
 $("onlineRecovery").hidden=active.kind!=="r";
 if(!session){board.hidden=true;controls.hidden=true;return;}
 board.hidden=false;
 const s=session.state,ended=!!s.ended,sets=s.sets||[],scores=ended&&sets.length?sets[sets.length-1]:s.scores||[0,0];
 const wins=sets.reduce((a,v)=>{a[v[0]>v[1]?0:1]++;return a},[0,0]);
 const left=Number(s.left)||0;
 [0,1].forEach(place=>{
   const id=(left+place)%2;
   $("onlineName"+place).textContent=session.names[id];
   $("onlinePoints"+place).textContent=String(scores[id]);
   $("onlineWins"+place).textContent="ชนะ "+wins[id]+" เซต";
 });
 $("onlineMeta").textContent=(ended?"จบการแข่งขัน":"เซต "+(sets.length+1))+
  " · เซตที่ชนะ "+wins.join("–")+" · revision "+session.revision+" · "+session.best_of+" เซตสูงสุด";
 $("onlineSetHistory").textContent=sets.length?sets.map((v,i)=>"เซต "+(i+1)+": "+v.join("–")).join(" · "):"ยังไม่จบเซต";
 const goal=(sets.length===session.best_of-1)?15:25;
 const hasWinner=!ended&&(Math.max(...scores)>=goal&&Math.abs(scores[0]-scores[1])>=2);
 controls.hidden=active.kind!=="c"||ended;
 document.querySelectorAll("#onlineBoard .counter").forEach(node=>{node.hidden=active.kind!=="c"||ended;});
 $("onlineConfirmSet").hidden=!hasWinner;
 $("onlineSwitchDone").hidden=!(sets.length===session.best_of-1 && Math.max(...scores)>=8 && !s.switched);
 $("onlineSwitchLater").hidden=!!s.seen8||$("onlineSwitchDone").hidden;
 document.querySelectorAll("[data-online-team]").forEach(b=>{
   const team=(left+Number(b.dataset.onlineTeam))%2, delta=Number(b.dataset.onlineDelta);
   b.dataset.logicalTeam=String(team);b.disabled=hasWinner || (delta<0&&scores[team]===0);
 });
 $("onlineCompleted").hidden=!ended;
 if(ended)$("onlineCompleted").textContent="จบเกม · ชนะ "+session.names[wins[0]>wins[1]?0:1]+" "+wins.join("–")+" เซต";
}
async function create(){
 if(busy)return;busy=true;$("onlineCreate").disabled=true;setMsg("กำลังสร้างเกม...");
 try {
  const data=await call({action:"create",name_a:$("onlineTeamA").value,name_b:$("onlineTeamB").value,best_of:Number($("onlineMode").value)});
  stored=data;showLinks();
  localStorage.setItem("vbc_guest_last",JSON.stringify(data));
  await openSession({id:data.id,kind:"c",token:data.tokens.controller});
  setMsg("สร้างเกมออนไลน์สำเร็จ! คัดลอกลิงก์ Viewer ให้ผู้ชม และเก็บลิงก์ Recovery ไว้ส่วนตัว",false);
 } catch(e){setMsg("สร้างเกมไม่สำเร็จ: "+e.message,true)}
 finally{busy=false;$("onlineCreate").disabled=false}
}
async function command(type,team=null,delta=null){
 if(!active||!session||busy)return;busy=true;setMsg("กำลังบันทึก...");
 try {
  const req={action:"command",id:active.id,token:active.token,command:type,expected_revision:session.revision,request_id:crypto.randomUUID()};
  if(type==="point"){req.team=team;req.delta=delta;}
  const result=await call(req);
  session={...session,revision:result.revision,state:result.state};
  render();setMsg("บันทึกสำเร็จ · revision "+result.revision,false);
 }catch(e){
   if(e.message.includes("CONFLICT")){await refresh(true);setMsg("คะแนนเปลี่ยนจากเครื่องอื่นแล้ว โหลดข้อมูลใหม่เรียบร้อย โปรดลองอีกครั้ง",true);}
   else setMsg("บันทึกไม่สำเร็จ: "+e.message,true);
 }finally{busy=false}
}
async function recover(){
 if(!active||active.kind!=="r"||busy)return;busy=true;
 try {
  const data=await call({action:"recover",id:active.id,token:active.token});
  stored=data;showLinks();localStorage.setItem("vbc_guest_last",JSON.stringify(data));
  await openSession({id:data.id,kind:"c",token:data.tokens.controller});
  setMsg("กู้คืนสิทธิ์สำเร็จ ลิงก์เก่าถูกเพิกถอนแล้ว กรุณาเก็บลิงก์ Recovery ใหม่",false);
 }catch(e){setMsg("กู้คืนไม่สำเร็จ: "+e.message,true)}
 finally{busy=false}
}
$("onlineCreate").onclick=create;
$("onlineRefresh").onclick=()=>refresh(false);
$("onlineRecovery").onclick=recover;
document.querySelectorAll("[data-online-team]").forEach(b=>b.addEventListener("click",()=>command("point",Number(b.dataset.logicalTeam),Number(b.dataset.onlineDelta))));
$("onlineConfirmSet").onclick=()=>command("confirm_set");
$("onlineSwap").onclick=()=>command("swap");
$("onlineUndo").onclick=()=>command("undo");
$("onlineSwitchDone").onclick=()=>command("switch_done");
$("onlineSwitchLater").onclick=()=>command("switch_later");
document.querySelectorAll("[data-online-copy]").forEach(b=>b.addEventListener("click",async()=>{
 const field=$(b.dataset.onlineCopy),value=field.value;if(!value)return;
 try{await navigator.clipboard.writeText(value);setMsg("คัดลอกลิงก์แล้ว",false)}
 catch(e){field.focus();field.select();setMsg("เลือกลิงก์แล้ว โปรดคัดลอกด้วยตนเอง",true)}
}));
$("onlineResume").onclick=()=>{
 try {
   const d=JSON.parse(localStorage.getItem("vbc_guest_last")||"null");
   if(!d?.id||!d?.tokens?.controller) throw new Error("ไม่มีลิงก์เกมเดิมในเครื่องนี้");
   stored=d;showLinks();openSession({id:d.id,kind:"c",token:d.tokens.controller});
 }catch(e){setMsg(e.message,true)}
};
try{const d=JSON.parse(localStorage.getItem("vbc_guest_last")||"null");if(d?.tokens){stored=d;showLinks();}}catch(e){}
const ref=validRoleFromHash();if(ref)openSession(ref);
})();
