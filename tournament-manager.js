import {db,$,elem,api} from "./suite-core.js";
import {sequenceExisting,analyzeOrder} from "./lib/fixture-planner.mjs";

const root=$("manager");root.innerHTML="<div class=\"eyebrow\">จัดการรายการแข่งขัน</div>\n<h1>รายการแข่งขันของฉัน</h1><p>สร้างรายการเพียงครั้งเดียว แล้วจัดทีม แบ่งสาย แก้ไขคู่แข่งขัน และเข้าสกอร์ชีตจากรายการเดียวกันได้</p>\n<div id=\"mgrGuest\" class=\"card\"><h3>เข้าสู่ระบบผู้จัดการแข่งขัน</h3>\n<p>เข้าสู่ระบบเพื่อดูและจัดการรายการที่บันทึกไว้</p>\n<div class=\"formrow\"><label>อีเมล<input type=\"email\" id=\"mgrEmail\" autocomplete=\"email\" placeholder=\"อีเมลของคุณ\"></label>\n<label>รหัสผ่าน<input type=\"password\" id=\"mgrPassword\" autocomplete=\"current-password\" placeholder=\"รหัสผ่านอย่างน้อย 6 ตัวอักษร\"></label></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"mgrSignIn\">เข้าสู่ระบบ</button><button class=\"btn\" id=\"mgrSignUp\">สมัครบัญชีใหม่</button></div>\n</div>\n<div id=\"mgrSignedIn\" hidden>\n<div class=\"card\" style=\"margin-bottom:16px\"><div class=\"section-head\"><span>เข้าสู่ระบบในชื่อ <strong id=\"mgrUser\"></strong></span>\n<button class=\"btn\" id=\"mgrSignOut\">ออกจากระบบ</button></div></div>\n<div class=\"wizard-head\"><span class=\"wizard-pill current\">1. สร้างรายการ</span><span class=\"wizard-pill\">2. จัดทีมและสาย</span><span class=\"wizard-pill\">3. คู่แข่งขัน</span><span class=\"wizard-pill\">4. สกอร์ชีต</span></div>\n<div class=\"two\">\n<div class=\"card\"><h3>สร้างรายการใหม่</h3><p class=\"small\">เลือกรูปแบบก่อน ระบบจะสร้างรอบและคู่ตามเงื่อนไขที่เลือก</p>\n<label>ชื่อรายการ<input id=\"mgrTournamentName\" maxlength=\"140\" placeholder=\"ตัวอย่าง: วอลเลย์บอลหญิง อบต.สบเปิง\"></label>\n<label>รายชื่อทีม (1 ทีมต่อบรรทัด)</label>\n<textarea id=\"mgrTeams\" rows=\"7\" placeholder=\"ทีม A&#10;ทีม B&#10;ทีม C&#10;ทีม D\"></textarea>\n<label>รูปแบบการแข่งขัน<select id=\"mgrCompetitionFormat\">\n<option value=\"group_round_robin\">แบ่งสาย พบกันหมดในแต่ละสาย</option>\n<option value=\"round_robin\">พบกันหมดทุกทีม (สายเดียว)</option>\n<option value=\"knockout\">แพ้คัดออกจนถึงรอบชิง</option>\n<option value=\"custom\">กำหนดคู่และรอบด้วยตัวเอง</option>\n</select></label><p class=\"small\" id=\"mgrFormatHelp\"></p>\n<div class=\"formrow\"><label>จำนวนสาย<select id=\"mgrGroupCount\"><option value=\"1\">1 สาย</option><option value=\"2\" selected>2 สาย</option><option value=\"3\">3 สาย</option><option value=\"4\">4 สาย</option></select></label>\n<label>รูปแบบ<select id=\"mgrBestOf\"><option value=\"3\">2 ใน 3 เซต</option><option value=\"5\">3 ใน 5 เซต</option></select></label></div>\n<label id=\"mgrPlayoffsLabel\" style=\"display:flex;gap:8px;align-items:center;margin-top:10px\">\n<input id=\"mgrPlayoffs\" type=\"checkbox\" checked style=\"min-height:unset;width:auto\">\nสร้างรอบรองชนะเลิศ ชิงอันดับ 3 และชิงชนะเลิศอัตโนมัติ (เมื่อแบ่ง 2 สาย)\n</label><div class=\"actions\"><button class=\"btn primary\" id=\"mgrCreate\">บันทึกและเปิดจัดการรายการ</button></div></div>\n<div class=\"card\"><div class=\"section-head\"><h3>รายการที่บันทึกแล้ว</h3><button class=\"btn\" id=\"mgrReload\">↻ รีเฟรช</button></div>\n<div id=\"mgrList\"><p>ยังไม่มีรายการแข่งขัน</p></div></div></div>\n<div class=\"card\" id=\"mgrEditor\" hidden style=\"margin-top:16px\">\n<div class=\"section-head\"><div><div class=\"eyebrow\">รายการที่เลือก</div><h2 id=\"mgrSelectedTitle\"></h2><p id=\"mgrSelectedMeta\"></p></div>\n<div class=\"action-row\"><button class=\"btn\" id=\"mgrOpenScoresheet\">ไปสกอร์ชีต →</button><button class=\"btn danger\" id=\"mgrDeleteTournament\">ลบรายการทั้งหมด</button></div></div>\n<div class=\"formrow\"><label>แก้ไขชื่อรายการ<input id=\"mgrRenameName\"></label><button class=\"btn\" id=\"mgrRename\">บันทึกชื่อใหม่</button></div>\n<h3 style=\"margin-top:21px\">ทีมและสายการแข่งขัน</h3><p>เลือกสายของแต่ละทีมได้ทันที ระบบจะบันทึกการย้ายและปรับคู่ในฉบับร่าง</p>\n<div id=\"mgrPoolTeams\" style=\"display:grid;gap:8px\"></div>\n<div class=\"card\" style=\"margin-top:20px;padding:18px!important\">\n<div class=\"section-head\"><h3>รอบการแข่งขันทั้งหมด</h3>\n<button class=\"btn\" id=\"mgrAddSemis\">สร้างรองชนะเลิศ / ชิงอันดับ 3 / ชิงชนะเลิศ</button></div>\n<div id=\"mgrStageList\"></div>\n<div class=\"formrow\">\n<label>ชื่อรอบใหม่<input id=\"mgrNewStageName\" maxlength=\"120\" placeholder=\"ตัวอย่าง: รอบ 8 ทีม / รอบแก้ตัว\"></label>\n<label>ประเภทรอบ<select id=\"mgrNewStageType\">\n<option value=\"knockout\">แพ้คัดออก / รอบชิง</option><option value=\"round_robin\">พบกันหมด / เก็บคะแนน</option><option value=\"pool\">แบ่งสาย</option>\n</select></label>\n<button class=\"btn\" id=\"mgrCreateStage\">+ เพิ่มรอบการแข่งขัน</button></div>\n<p class=\"small\">เพิ่มรอบได้ตามต้องการ ระบบไม่จำกัดว่าต้องจบหลังรอบแบ่งสาย</p></div>\n<div class=\"card\" style=\"margin-top:15px;padding:18px!important\">\n<h3 id=\"mgrAddMatchTitle\">เพิ่มคู่แข่งขันในรอบที่เลือก</h3>\n<div class=\"formrow\"><label>เลือกรอบ<select id=\"mgrMatchStage\"></select></label>\n<label>ทีมแรก<select id=\"mgrMatchTeamA\"></select></label><label>ทีมที่สอง<select id=\"mgrMatchTeamB\"></select></label></div>\n<div class=\"formrow\">\n<label>หากทีมแรกยังไม่ทราบ ให้ระบุช่องรอผล<input id=\"mgrMatchSlotA\" placeholder=\"เช่น ผู้ชนะรอบ 8 ทีม คู่ 1\"></label>\n<label>หากทีมที่สองยังไม่ทราบ ให้ระบุช่องรอผล<input id=\"mgrMatchSlotB\" placeholder=\"เช่น อันดับ 2 สาย A\"></label>\n</div><div class=\"actions\"><button class=\"btn primary\" id=\"mgrAddMatch\">+ เพิ่มคู่ถัดไป</button>\n<button class=\"btn\" id=\"mgrCancelMatchEdit\" hidden>ยกเลิกแก้ไข</button></div>\n<p class=\"small\">เลือกชื่อทีมจริง หรือเลือก “รอผลจากรอบก่อน” แล้วกรอกตำแหน่งทีมที่จะเข้ารอบ</p>\n</div>\n<div class=\"section-head\" style=\"margin-top:20px\"><h3>โปรแกรมการแข่งขันทุกคู่</h3>\n<button class=\"btn\" id=\"mgrAutoOrder\">จัดลำดับคู่พบกันหมดให้พักสลับกัน</button></div>\n<p id=\"mgrOrderReport\" class=\"small\"></p><p>คู่ที่ยังไม่เริ่มแข่งขันสามารถแก้ไขหรือลบได้ ส่วนผลแข่งขันที่บันทึกไว้จะถูกป้องกัน</p>\n<div class=\"tablewrap\"><table><thead><tr><th>ลำดับ</th><th>รอบ / สาย</th><th>ทีมแรก</th><th>ทีมที่สอง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody id=\"mgrMatches\"></tbody></table></div>\n</div></div><p id=\"mgrStatus\" class=\"small\" role=\"status\"></p>";
const note=(msg,type="success",detail="")=>window.VBC?.notify(msg,type,detail);
let identity=null,current=null,waiting=false,tournamentList=[],editingMatchId=null;
const formatName={group_round_robin:"แบ่งสายแล้วพบกันหมด",round_robin:"พบกันหมดทุกทีม",knockout:"แพ้คัดออก",custom:"กำหนดรอบและคู่เอง"};
const readableError=e=>{
 const k=e?.message||String(e);
 return ({ACTIVE_MATCHES_CANNOT_DELETE:"มีคู่แข่งขันที่กำหนดไว้หรือมีข้อมูลการแข่งขัน",
 HAS_RECORDED_MATCHES:"มีการแข่งขันที่เริ่มแล้วหรือมีคะแนนบันทึกไว้ จึงไม่สามารถลบทั้งรายการได้",
 ONLY_DRAFT_CAN_DELETE:"ลบได้เฉพาะรายการฉบับร่างที่ยังไม่เผยแพร่",
 MATCH_ALREADY_STARTED:"คู่นี้เริ่มบันทึกคะแนนแล้ว ไม่สามารถลบทิ้งได้",
 SCHEDULED_OR_STARTED_MATCHES_LOCK_ORDER:"มีคู่ที่กำหนดเวลาไว้หรือเริ่มแข่งแล้ว ระบบจะไม่เปลี่ยนลำดับโดยอัตโนมัติ",
 SEQUENCE_MUST_CONTAIN_EVERY_POOL_MATCH_ONCE:"จำนวนคู่รอบแบ่งสายไม่ตรงกัน กรุณาโหลดรายการใหม่ก่อนจัดลำดับ",
 KNOCKOUT_REQUIRES_POWER_OF_TWO:"แพ้คัดออกแบบอัตโนมัติต้องมี 2, 4, 8, 16, 32 หรือ 64 ทีม",
 TWO_POOLS_REQUIRED:"รอบรองชนะเลิศอัตโนมัติรองรับรายการที่แบ่ง 2 สาย",
 AUTO_PLAYOFFS_REQUIRES_TWO_POOLS:"เลือกสร้างรอบรองอัตโนมัติได้เมื่อแบ่ง 2 สายเท่านั้น",
 KNOCKOUT_ALREADY_EXISTS:"สร้างรอบแพ้คัดออกแล้ว ไม่สามารถสร้างซ้ำได้",
 MANUAL_FIXTURES_PRESENT_MOVE_NOT_SAFE:"มีคู่ที่ผู้จัดเพิ่มเองในรอบแบ่งสายแล้ว เพื่อป้องกันคู่เหล่านั้นหาย กรุณาแก้ไขคู่ด้วยตนเองแทนการย้ายสาย",
 MATCH_PARTICIPANTS_NOT_SELECTED:"ยังไม่ทราบผู้แข่งขันของคู่นี้ ให้กรอกทีมที่เข้ารอบก่อนเริ่มลงคะแนน",
 OWNER_REQUIRED:"รายการนี้ไม่ใช่ของบัญชีคุณ",
 MATCH_LOCKED:"คู่นี้เริ่มแข่งขันหรือถูกล็อกแล้ว"}[k]||k);
};

const status=message=>$("mgrStatus").textContent=message;
const thaiStatus={draft:"ฉบับร่าง",published:"เผยแพร่แล้ว",scheduled:"ยังไม่แข่งขัน",live:"กำลังแข่งขัน",approved:"รับรองแล้ว",pending_approval:"รอรับรอง",completed:"เสร็จสิ้น"};
const fmt=x=>thaiStatus[x]||x;
async function authSync(){
 const {data,error}=await db.auth.getUser();identity=error?null:data.user;
 $("mgrGuest").hidden=!!identity;$("mgrSignedIn").hidden=!identity;
 $("mgrUser").textContent=identity?.email||"";
 if(identity)await reload();else{$("mgrEditor").hidden=true;$("mgrList").replaceChildren();}
}
async function logIn(register){
 if(waiting)return;
 const email=$("mgrEmail").value.trim(),password=$("mgrPassword").value;
 if(!email.includes("@")||password.length<6)return note("ตรวจสอบอีเมลและรหัสผ่าน","error","รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
 waiting=true;$("mgrSignIn").disabled=$("mgrSignUp").disabled=true;
 try{
  const {data,error}=register?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(register&&!data.session)note("สมัครบัญชีแล้ว","success","กรุณาตรวจอีเมลยืนยันบัญชีก่อนเข้าสู่ระบบ");
  else{await authSync();note("เข้าสู่ระบบสำเร็จ");}
 }catch(e){note("เข้าสู่ระบบไม่สำเร็จ","error",e.message)}
 finally{waiting=false;$("mgrSignIn").disabled=$("mgrSignUp").disabled=false}
}
$("mgrSignIn").onclick=()=>logIn(false);$("mgrSignUp").onclick=()=>logIn(true);
$("mgrSignOut").onclick=async()=>{await db.auth.signOut();identity=null;current=null;await authSync();note("ออกจากระบบแล้ว")};
async function reload(selectId){
 if(!identity)return;
 const {data,error}=await db.from("tournaments").select("id,name,status,best_of,competition_format,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){note("โหลดรายการไม่สำเร็จ","error",error.message);return}
 tournamentList=data||[];
 const list=$("mgrList");list.replaceChildren();
 if(!tournamentList.length)list.append(elem("p","ยังไม่มีรายการ กรอกชื่อและทีมทางซ้ายเพื่อเริ่มได้เลย"));
 for(const t of tournamentList){
  const card=elem("div","","item-card");const left=elem("div");
  left.append(elem("strong",t.name),elem("small",(formatName[t.competition_format]||"แบ่งสาย")+" · "+fmt(t.status)+" · "+(t.best_of===3?"2 ใน 3 เซต":"3 ใน 5 เซต")));
  const b=elem("button","เปิดจัดการ","btn");b.onclick=()=>open(t.id,true);card.append(left,b);list.append(card);
 }
 const choice=selectId||current?.id;
 if(choice&&tournamentList.some(t=>t.id===choice))await open(choice,false);
 status("พบ "+tournamentList.length+" รายการ");
}
function updateFormat(){
 const type=$("mgrCompetitionFormat").value;
 const single=type!=="group_round_robin";
 $("mgrGroupCount").disabled=single;
 if(single)$("mgrGroupCount").value="1";
 else if($("mgrGroupCount").value==="1")$("mgrGroupCount").value="2";
 const two=type==="group_round_robin"&&Number($("mgrGroupCount").value)===2;
 $("mgrPlayoffsLabel").hidden=!two;
 $("mgrFormatHelp").textContent=({
 group_round_robin:"แบ่งทีมเป็นสาย A–D พบกันหมดภายในสาย สามารถมีรอบรองและรอบชิงต่อได้",
 round_robin:"ทุกทีมพบทุกทีม เก็บคะแนนรวมทั้งรายการ ไม่มีการแบ่งหลายสาย",
 knockout:"ทีมแพ้ตกรอบ โปรแกรมสร้างต่อเนื่องจนถึงคู่ชิง ต้องมี 2, 4, 8, 16, 32 หรือ 64 ทีม",
 custom:"สร้างทีมไว้ก่อน แล้วเพิ่มรอบและคู่แข่งขันด้วยตนเองตามที่ต้องการ"
 })[type];
}
$("mgrCompetitionFormat").onchange=updateFormat;
$("mgrGroupCount").onchange=updateFormat;
updateFormat();

async function create(){
 if(!identity)return note("กรุณาเข้าสู่ระบบก่อน","error");
 if(waiting)return;
 const name=$("mgrTournamentName").value.trim();
 const teams=$("mgrTeams").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const format=$("mgrCompetitionFormat").value;
 const groups=format==="group_round_robin"?Number($("mgrGroupCount").value):1;
 const best=Number($("mgrBestOf").value),playoffs=format==="group_round_robin"&&groups===2&&$("mgrPlayoffs").checked;
 if(!name||teams.length<2||teams.length>64||groups>teams.length)return note("ข้อมูลไม่ครบ","error","ตั้งชื่อรายการและกรอกทีม 2–64 ทีม");
 if(new Set(teams.map(s=>s.toLocaleLowerCase())).size!==teams.length)return note("พบชื่อทีมซ้ำ","error","กรุณาแก้ไขชื่อทีมก่อนบันทึก");
 if(format==="knockout"&&![2,4,8,16,32,64].includes(teams.length))return note("จำนวนทีมไม่เหมาะกับแพ้คัดออก","error","เลือกรูปแบบกำหนดเอง หรือใช้ 2, 4, 8, 16, 32, 64 ทีม");
 waiting=true;$("mgrCreate").disabled=true;
 try{
  const data=await api("create_tournament_v2",{p_name:name,p_slug:"vbc-"+crypto.randomUUID().replaceAll("-","").slice(0,24),
   p_best_of:best,p_groups:groups,p_team_names:teams,p_format:format,p_auto_playoffs:playoffs});
  await reload(data.tournament_id);
  // Generation is independent from publication. If sequencing cannot safely run, keep the draft and notify the organizer.
  if(["group_round_robin","round_robin"].includes(format)&&current?.id===data.tournament_id){
   try{await autoOrder(false)}catch(e){note("สร้างรายการแล้ว แต่ยังจัดลำดับคู่ไม่ได้","warning",readableError(e))}
  }
  note("บันทึกรายการสำเร็จ","success",name+" · "+data.teams+" ทีม · "+data.matches+" คู่ · "+data.stages+" รอบ");
  $("mgrEditor").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){note("บันทึกรายการไม่สำเร็จ","error",readableError(e))}
 finally{waiting=false;$("mgrCreate").disabled=false}
}
$("mgrCreate").onclick=create;$("mgrReload").onclick=()=>reload().then(()=>note("โหลดรายการล่าสุดแล้ว"));
async function open(id,scroll){
 try{
  const item=tournamentList.find(t=>t.id===id);
  if(!item)throw Error("ไม่พบรายการที่เลือก");
  const requests=await Promise.all([
   db.from("tournament_teams").select("team_id").eq("tournament_id",id),
   db.from("pools").select("id,code,stage_id").eq("tournament_id",id).order("code"),
   db.from("matches").select("id,team_a_id,team_b_id,slot_a,slot_b,round_number,display_order,event_revision,status,scheduled_start,stage_id,created_at").eq("tournament_id",id).order("created_at"),
   db.from("tournament_stages").select("id,title,stage_type,sort_order").eq("tournament_id",id).order("sort_order"),
  ]);
  const fail=requests.find(x=>x.error);if(fail)throw fail.error;
  const [members,pools,matches,stages]=requests.map(x=>x.data);
  const ids=members.map(x=>x.team_id);
  let teams=[],assigned=[];
  if(ids.length){const r=await db.from("teams").select("id,name").in("id",ids);if(r.error)throw r.error;teams=r.data;}
  if(pools.length){const r=await db.from("pool_teams").select("pool_id,team_id").in("pool_id",pools.map(x=>x.id));if(r.error)throw r.error;assigned=r.data;}
  current={...item,teams,pools,matches,stages,assigned,id};editingMatchId=null;
  render();
  if(scroll)$("mgrEditor").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){note("เปิดรายการไม่สำเร็จ","error",e.message)}
}
function sequenceMatches(m,stage=null){
 const order=new Map((m.stages||[]).map(t=>[t.id,t.sort_order]));
 return m.matches.filter(x=>!stage||x.stage_id===stage)
 .sort((a,b)=>(order.get(a.stage_id)||0)-(order.get(b.stage_id)||0)
 || (Number(a.display_order)||999999)-(Number(b.display_order)||999999)
 || new Date(a.created_at)-new Date(b.created_at) || a.id.localeCompare(b.id));
}
function initialStage(m){
 return m.stages.find(x=>["pool","round_robin"].includes(x.stage_type));
}
function poolFor(m,team){
 const row=m.assigned.find(x=>x.team_id===team);
 return m.pools.find(p=>p.id===row?.pool_id)?.code||"—";
}
function stageLabel(stage){
 return (stage?.title||"รอบเพิ่มเติม");
}
function addTeamOptions(node,teams,label){
 node.replaceChildren();
 node.add(new Option("รอผลจากรอบก่อน (กรอกคำอธิบาย)", ""));
 for(const t of teams)node.add(new Option(t.name,t.id));
}
function render(){
 if(!current)return;
 const m=current;
 $("mgrEditor").hidden=false;
 $("mgrSelectedTitle").textContent=m.name;
 $("mgrSelectedMeta").textContent=(formatName[m.competition_format]||"แบ่งสายพบกันหมด")+
 " · "+fmt(m.status)+" · "+m.teams.length+" ทีม · "+m.pools.length+" สาย · "+m.matches.length+" คู่ · "+m.stages.length+" รอบ";
 $("mgrRenameName").value=m.name;
 $("mgrRename").disabled=m.status!=="draft";
 $("mgrDeleteTournament").disabled=m.status!=="draft";
 $("mgrDeleteTournament").title=m.status==="draft"?"ลบรายการฉบับร่างได้ หากยังไม่มีผลการแข่งขัน":"ลบรายการที่เผยแพร่แล้วไม่ได้";
 const poolById=new Map(m.pools.map(x=>[x.id,x.code])),teamsById=new Map(m.teams.map(x=>[x.id,x.name]));
 const byTeam=new Map(m.assigned.map(x=>[x.team_id,x.pool_id]));
 const pane=$("mgrPoolTeams");pane.replaceChildren();
 const canMove=m.status==="draft"&&m.competition_format==="group_round_robin"&&m.pools.length>1;
 if(!canMove)pane.append(elem("p",m.competition_format==="group_round_robin"?"รายการนี้มีสายเดียว":"รายการนี้ไม่ใช้การแบ่งสายแบบอัตโนมัติ"));
 for(const team of m.teams){
  const row=elem("div","","item-card"),name=elem("strong",team.name);
  const sel=elem("select");sel.setAttribute("aria-label","สายการแข่งขันของ "+team.name);
  for(const p of m.pools)sel.add(new Option("สาย "+p.code,p.id));
  sel.value=byTeam.get(team.id)||"";sel.disabled=!canMove;
  sel.onchange=async()=>{
   const nextPool=sel.value;
   if(!confirm("ย้าย "+team.name+" ไปสาย "+poolById.get(nextPool)+" และสร้างคู่ในสายใหม่?"))
    return void (sel.value=byTeam.get(team.id)||"");
   sel.disabled=true;
   try{
    const response=await api("move_team_pool",{p_tournament:m.id,p_team:team.id,p_pool:nextPool});
    await open(m.id,false);
    try{await autoOrder(false)}catch(e){note("ย้ายทีมแล้ว แต่ยังเรียงคู่ไม่ได้","warning",readableError(e))}
    note("บันทึกการย้ายสายสำเร็จ","success",team.name+" · สาย "+response.new_pool);
   }catch(e){note("ย้ายสายไม่สำเร็จ","error",readableError(e));sel.value=byTeam.get(team.id)||"";sel.disabled=false}
  };
  row.append(name,sel);pane.append(row);
 }
 const list=$("mgrStageList");list.replaceChildren();
 for(const stage of m.stages){
  const row=elem("div","","item-card"),block=elem("div");
  block.append(elem("strong",stage.title),elem("small",
   ({pool:"แบ่งสาย",round_robin:"พบกันหมด",knockout:"แพ้คัดออก"})[stage.stage_type]+" · "+m.matches.filter(x=>x.stage_id===stage.id).length+" คู่"));
  const badge=elem("span","รอบ "+stage.sort_order,"wizard-pill");
  row.append(block,badge);list.append(row);
 }
 $("mgrAddSemis").hidden=!(m.competition_format==="group_round_robin"&&m.pools.length===2);
 $("mgrAddSemis").disabled=m.status!=="draft"||m.stages.some(x=>x.stage_type==="knockout");
 $("mgrCreateStage").disabled=!["draft","published"].includes(m.status);
 const stageSelect=$("mgrMatchStage");stageSelect.replaceChildren();
 for(const stage of m.stages)stageSelect.add(new Option(stage.title,stage.id));
 addTeamOptions($("mgrMatchTeamA"),m.teams);
 addTeamOptions($("mgrMatchTeamB"),m.teams);
 clearMatchEdit();
 $("mgrAddMatch").disabled=!["draft","published"].includes(m.status);
 const base=initialStage(m);
 const canAuto=m.status==="draft"&&["group_round_robin","round_robin"].includes(m.competition_format)&&base!==undefined;
 $("mgrAutoOrder").hidden=!canAuto;
 $("mgrAutoOrder").disabled=!canAuto||m.matches.some(x=>x.stage_id===base?.id&&
 (x.status!=="scheduled"||x.scheduled_start||x.event_revision>0));
 const scheduledPoolMatches=base?sequenceMatches(m,base.id):[];
 const last=analyzeOrder(scheduledPoolMatches);
 $("mgrOrderReport").textContent=base?
  (last.hasAdjacent?
   "⚠ มี "+last.violations.length+" จุดที่ทีมลงสนามติดกับคู่ก่อนหน้า กด “จัดลำดับ” เพื่อพยายามกระจายคู่"
   :"✓ ลำดับคู่รอบแบ่งสายไม่มีทีมเดิมแข่งขันต่อกันทันที")+
  " · การเว้น 45/60 นาทีต้องตรวจจากเวลาแข่งจริงอีกครั้ง":
  "เลือกประเภทการแข่งขันและเพิ่มรอบต่อไปได้ด้วยตัวเอง";
 const rows=sequenceMatches(m),tbody=$("mgrMatches");tbody.replaceChildren();
 rows.forEach((match,index)=>{
  const stage=m.stages.find(x=>x.id===match.stage_id);
  const label=stageLabel(stage)+(match.round_number?" · รอบย่อย "+match.round_number:"")+
   (stage?.stage_type==="pool"?" · สาย "+poolFor(m,match.team_a_id):"");
  const row=elem("tr");
  for(const v of [index+1,label,teamsById.get(match.team_a_id)||match.slot_a||"รอระบุทีม",
   teamsById.get(match.team_b_id)||match.slot_b||"รอระบุทีม",fmt(match.status)])row.append(elem("td",v));
  const td=elem("td"),wrap=elem("div","","action-row");
  const edit=elem("button","แก้ไขคู่","btn");
  edit.disabled=match.status!=="scheduled"||match.event_revision>0;
  edit.onclick=()=>editMatch(match);
  const del=elem("button","ลบ","btn danger");
  del.disabled=match.status!=="scheduled"||match.event_revision>0;
  del.setAttribute("aria-label","ลบคู่ที่ "+(index+1));
  del.onclick=async()=>{
   if(!confirm("ยืนยันลบคู่ที่ "+(index+1)+"? คู่ที่ยังไม่มีผลการแข่งขันจะถูกลบถาวร"))return;
   del.disabled=true;
   try{await api("delete_match_draft",{p_match:match.id});await open(m.id,false);note("ลบคู่แข่งขันสำเร็จ")}
   catch(e){note("ลบคู่ไม่สำเร็จ","error",readableError(e));del.disabled=false}
  };
  wrap.append(edit,del);
  if(canAuto&&match.stage_id===base.id){
   for(const direction of [-1,1]){
    const button=elem("button",direction<0?"↑":"↓","btn");
    button.title=direction<0?"ย้ายคู่ขึ้นหนึ่งลำดับ":"ย้ายคู่ลงหนึ่งลำดับ";
    button.disabled=$("mgrAutoOrder").disabled;
    button.onclick=()=>moveInSequence(match.id,direction);
    wrap.append(button);
   }
  }
  td.append(wrap);row.append(td);tbody.append(row);
 });
}
function clearMatchEdit(){
 editingMatchId=null;
 $("mgrAddMatchTitle").textContent="เพิ่มคู่แข่งขันในรอบที่เลือก";
 $("mgrAddMatch").textContent="+ เพิ่มคู่ถัดไป";
 $("mgrCancelMatchEdit").hidden=true;
 $("mgrMatchStage").disabled=false;
 $("mgrMatchTeamA").value="";$("mgrMatchTeamB").value="";
 $("mgrMatchSlotA").value="";$("mgrMatchSlotB").value="";
}
function editMatch(match){
 editingMatchId=match.id;
 $("mgrAddMatchTitle").textContent="แก้ไขคู่แข่งขัน";
 $("mgrAddMatch").textContent="บันทึกการแก้ไขคู่";
 $("mgrCancelMatchEdit").hidden=false;
 $("mgrMatchStage").value=match.stage_id;
 $("mgrMatchStage").disabled=true;
 $("mgrMatchTeamA").value=match.team_a_id||"";
 $("mgrMatchTeamB").value=match.team_b_id||"";
 $("mgrMatchSlotA").value=match.slot_a||"";
 $("mgrMatchSlotB").value=match.slot_b||"";
 $("mgrAddMatchTitle").scrollIntoView({behavior:"smooth",block:"center"});
}
$("mgrCancelMatchEdit").onclick=clearMatchEdit;
$("mgrCreateStage").onclick=async()=>{
 if(!current)return;
 const title=$("mgrNewStageName").value.trim();
 if(!title)return note("ระบุชื่อรอบการแข่งขันก่อน","error");
 try{
  await api("create_stage_manual",{p_tournament:current.id,p_title:title,p_type:$("mgrNewStageType").value});
  const id=current.id;await open(id,false);$("mgrNewStageName").value="";
  note("เพิ่มรอบการแข่งขันสำเร็จ","success",title);
 }catch(e){note("เพิ่มรอบไม่สำเร็จ","error",readableError(e))}
};
$("mgrAddSemis").onclick=async()=>{
 if(!current||!confirm("เพิ่มรอบรองชนะเลิศ 2 คู่ รอบชิงอันดับ 3 และรอบชิงชนะเลิศอีก 2 คู่?"))return;
 const id=current.id;
 try{await api("create_semis_and_final",{p_tournament:id});
  await open(id,false);note("สร้างรอบรองและรอบชิงสำเร็จ","success","เพิ่มคู่รอผลจากรอบก่อน 4 คู่แล้ว");
 }catch(e){note("สร้างรอบชิงไม่สำเร็จ","error",readableError(e))}
};
$("mgrAddMatch").onclick=async()=>{
 if(!current)return;
 const a=$("mgrMatchTeamA").value||null,b=$("mgrMatchTeamB").value||null,
  slotA=$("mgrMatchSlotA").value.trim(),slotB=$("mgrMatchSlotB").value.trim();
 if(a&&a===b)return note("ห้ามเลือกทีมเดียวกัน","error");
 if((!a&&!slotA)||(!b&&!slotB))return note("ระบุผู้แข่งขันให้ครบ","error","หากยังไม่ทราบทีม กรุณาใส่ เช่น ผู้ชนะคู่ 1");
 const id=current.id;const old=editingMatchId;
 try{
  if(old)await api("set_draft_match_teams",{p_match:old,p_team_a:a,p_team_b:b,p_slot_a:slotA,p_slot_b:slotB});
  else await api("add_stage_match",{p_tournament:id,p_stage:$("mgrMatchStage").value,
    p_team_a:a,p_team_b:b,p_slot_a:slotA,p_slot_b:slotB});
  await open(id,false);
  note(old?"แก้ไขคู่แข่งขันสำเร็จ":"เพิ่มคู่ถัดไปสำเร็จ");
 }catch(e){note("บันทึกคู่แข่งขันไม่สำเร็จ","error",readableError(e))}
};
async function autoOrder(userTriggered=true){
 if(!current)return;
 const m=current,base=initialStage(m);
 if(!base||!["group_round_robin","round_robin"].includes(m.competition_format))
  return;
 const groups=m.pools.filter(p=>p.stage_id===base.id)
  .map(p=>({code:p.code,teams:m.assigned.filter(a=>a.pool_id===p.id).map(a=>a.team_id)}));
 const pairings=m.matches.filter(x=>x.stage_id===base.id);
 if(!pairings.length)return;
 const plan=sequenceExisting(groups,pairings);
 if(plan.ordered.length!==pairings.length)throw Error("จำนวนคู่ไม่ครบ ตรวจข้อมูลก่อนจัดลำดับ");
 await api("save_pool_sequence",{p_tournament:m.id,p_match_ids:plan.ordered.map(x=>x.id),
  p_rounds:plan.ordered.map(x=>x.round)});
 await open(m.id,false);
 if(userTriggered){
  const gaps=analyzeOrder(plan.ordered);
  note(gaps.hasAdjacent?"จัดลำดับแล้ว แต่ยังมีทีมลงสนามติดกัน":"จัดลำดับคู่แข่งขันสำเร็จ",
   gaps.hasAdjacent?"warning":"success",
   gaps.hasAdjacent?"พบ "+gaps.violations.length+" จุดที่ไม่สามารถหลีกเลี่ยงได้จากจำนวนคู่/สาย":
    "กระจายคู่ตามรอบและสลับสายแล้ว ยังต้องกำหนดเวลาพักจริง");
 }
}
$("mgrAutoOrder").onclick=async()=>{
 $("mgrAutoOrder").disabled=true;
 try{await autoOrder(true)}catch(e){note("จัดลำดับไม่สำเร็จ","error",readableError(e));$("mgrAutoOrder").disabled=false}
};
async function moveInSequence(id,step){
 if(!current)return;
 const m=current,base=initialStage(m);
 if(!base)return;
 const rows=sequenceMatches(m,base.id);
 const at=rows.findIndex(x=>x.id===id),next=at+step;
 if(next<0||next>=rows.length)return;
 [rows[at],rows[next]]=[rows[next],rows[at]];
 try{
  await api("save_pool_sequence",{p_tournament:m.id,p_match_ids:rows.map(x=>x.id),
   p_rounds:rows.map(x=>Number(x.round_number)||1)});
  await open(m.id,false);
  const warnings=analyzeOrder(rows);
  note("ย้ายคู่แข่งขันแล้ว",warnings.hasAdjacent?"warning":"success",
   warnings.hasAdjacent?"มีทีมแข่งติดกัน "+warnings.violations.length+" จุด กรุณาตรวจสอบอีกครั้ง":"ไม่พบคู่ที่ทีมลงติดกัน");
 }catch(e){note("ย้ายคู่ไม่สำเร็จ","error",readableError(e))}
}

$("mgrRename").onclick=async()=>{
 if(!current)return;
 const name=$("mgrRenameName").value.trim();
 try{await api("rename_tournament_draft",{p_tournament:current.id,p_name:name});note("บันทึกชื่อรายการสำเร็จ");await reload(current.id)}
 catch(e){note("แก้ไขชื่อไม่สำเร็จ","error",e.message)}
};
$("mgrDeleteTournament").onclick=async()=>{
 if(!current)return;
 const {id,name}=current;
 if(!confirm(
  "ยืนยันลบรายการ «"+name+"» ออกจากระบบทั้งหมด?\n\n"+
  "แม้จะเริ่มแข่งขันหรือมีผลคะแนนแล้ว ก็สามารถลบได้\n"+
  "ทีมในรายการ สายการแข่งขัน คู่แข่งขัน คะแนนทุกเซต สกอร์ชีต "+
  "และประวัติการแข่งขันของรายการนี้จะถูกลบถาวร\n\n"+
  "การลบนี้ย้อนกลับไม่ได้"
 ))return;
 const button=$("mgrDeleteTournament");
 button.disabled=true;
 try{
  const result=await api("delete_tournament_draft",{p_tournament:id});
  if(!result?.deleted)throw new Error("ระบบไม่ยืนยันว่าลบรายการแล้ว");
  current=null;$("mgrEditor").hidden=true;await reload();
  note("ลบรายการเรียบร้อยแล้ว","success",name+" · ลบ "+(result.matches_deleted??0)+" คู่แข่งขัน พร้อมคะแนนและบันทึกที่เกี่ยวข้อง");
 }catch(e){note("ลบรายการไม่สำเร็จ","error",readableError(e))}
 finally{button.disabled=false}
};
$("mgrOpenScoresheet").onclick=()=>window.VBC?.navigate("scoresheet");
db.auth.onAuthStateChange(()=>setTimeout(()=>authSync().catch(e=>note("โหลดข้อมูลบัญชีไม่สำเร็จ","error",e.message)),0));
authSync().catch(e=>note("ตรวจสอบบัญชีไม่ได้","error",e.message));
