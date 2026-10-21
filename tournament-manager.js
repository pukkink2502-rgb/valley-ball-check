import {db,$,elem,api} from "./suite-core.js";

const root=$("manager");root.innerHTML="<div class=\"eyebrow\">จัดการรายการแข่งขัน</div>\n<h1>รายการแข่งขันของฉัน</h1><p>สร้างรายการเพียงครั้งเดียว แล้วจัดทีม แบ่งสาย แก้ไขคู่แข่งขัน และเข้าสกอร์ชีตจากรายการเดียวกันได้</p>\n<div id=\"mgrGuest\" class=\"card\"><h3>เข้าสู่ระบบผู้จัดการแข่งขัน</h3>\n<p>เข้าสู่ระบบเพื่อดูและจัดการรายการที่บันทึกไว้</p>\n<div class=\"formrow\"><label>อีเมล<input type=\"email\" id=\"mgrEmail\" autocomplete=\"email\" placeholder=\"อีเมลของคุณ\"></label>\n<label>รหัสผ่าน<input type=\"password\" id=\"mgrPassword\" autocomplete=\"current-password\" placeholder=\"รหัสผ่านอย่างน้อย 6 ตัวอักษร\"></label></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"mgrSignIn\">เข้าสู่ระบบ</button><button class=\"btn\" id=\"mgrSignUp\">สมัครบัญชีใหม่</button></div>\n</div>\n<div id=\"mgrSignedIn\" hidden>\n<div class=\"card\" style=\"margin-bottom:16px\"><div class=\"section-head\"><span>เข้าสู่ระบบในชื่อ <strong id=\"mgrUser\"></strong></span>\n<button class=\"btn\" id=\"mgrSignOut\">ออกจากระบบ</button></div></div>\n<div class=\"wizard-head\"><span class=\"wizard-pill current\">1. สร้างรายการ</span><span class=\"wizard-pill\">2. จัดทีมและสาย</span><span class=\"wizard-pill\">3. คู่แข่งขัน</span><span class=\"wizard-pill\">4. สกอร์ชีต</span></div>\n<div class=\"two\">\n<div class=\"card\"><h3>สร้างรายการใหม่</h3>\n<label>ชื่อรายการ<input id=\"mgrTournamentName\" maxlength=\"140\" placeholder=\"ตัวอย่าง: วอลเลย์บอลหญิง อบต.สบเปิง\"></label>\n<label>รายชื่อทีม (1 ทีมต่อบรรทัด)</label>\n<textarea id=\"mgrTeams\" rows=\"7\" placeholder=\"ทีม A&#10;ทีม B&#10;ทีม C&#10;ทีม D\"></textarea>\n<div class=\"formrow\"><label>จำนวนสาย<select id=\"mgrGroupCount\"><option value=\"1\">1 สาย</option><option value=\"2\" selected>2 สาย</option><option value=\"3\">3 สาย</option><option value=\"4\">4 สาย</option></select></label>\n<label>รูปแบบ<select id=\"mgrBestOf\"><option value=\"3\">2 ใน 3 เซต</option><option value=\"5\">3 ใน 5 เซต</option></select></label></div>\n<div class=\"actions\"><button class=\"btn primary\" id=\"mgrCreate\">บันทึกและเปิดจัดการรายการ</button></div></div>\n<div class=\"card\"><div class=\"section-head\"><h3>รายการที่บันทึกแล้ว</h3><button class=\"btn\" id=\"mgrReload\">↻ รีเฟรช</button></div>\n<div id=\"mgrList\"><p>ยังไม่มีรายการแข่งขัน</p></div></div></div>\n<div class=\"card\" id=\"mgrEditor\" hidden style=\"margin-top:16px\">\n<div class=\"section-head\"><div><div class=\"eyebrow\">รายการที่เลือก</div><h2 id=\"mgrSelectedTitle\"></h2><p id=\"mgrSelectedMeta\"></p></div>\n<div class=\"action-row\"><button class=\"btn\" id=\"mgrOpenScoresheet\">ไปสกอร์ชีต →</button><button class=\"btn danger\" id=\"mgrDeleteTournament\">ลบรายการนี้</button></div></div>\n<div class=\"formrow\"><label>แก้ไขชื่อรายการ<input id=\"mgrRenameName\"></label><button class=\"btn\" id=\"mgrRename\">บันทึกชื่อใหม่</button></div>\n<h3 style=\"margin-top:21px\">ทีมและสายการแข่งขัน</h3><p>เลือกสายของแต่ละทีมได้ทันที ระบบจะบันทึกการย้ายและปรับคู่ในฉบับร่าง</p>\n<div id=\"mgrPoolTeams\" style=\"display:grid;gap:8px\"></div>\n<h3 style=\"margin-top:22px\">คู่แข่งขันทั้งหมด</h3><p>สามารถลบคู่ที่ใส่ผิดได้เฉพาะคู่ฉบับร่างที่ยังไม่ได้กำหนดเวลา/เริ่มแข่งขัน</p>\n<div class=\"tablewrap\"><table><thead><tr><th>คู่</th><th>สาย</th><th>ทีมแรก</th><th>ทีมที่สอง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody id=\"mgrMatches\"></tbody></table></div>\n</div></div><p id=\"mgrStatus\" class=\"small\" role=\"status\"></p>";
const note=(msg,type="success",detail="")=>window.VBC?.notify(msg,type,detail);
let identity=null,current=null,waiting=false,tournamentList=[];
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
 const {data,error}=await db.from("tournaments").select("id,name,status,best_of,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){note("โหลดรายการไม่สำเร็จ","error",error.message);return}
 tournamentList=data||[];
 const list=$("mgrList");list.replaceChildren();
 if(!tournamentList.length)list.append(elem("p","ยังไม่มีรายการ กรอกชื่อและทีมทางซ้ายเพื่อเริ่มได้เลย"));
 for(const t of tournamentList){
  const card=elem("div","","item-card");const left=elem("div");
  left.append(elem("strong",t.name),elem("small",fmt(t.status)+" · "+(t.best_of===3?"2 ใน 3 เซต":"3 ใน 5 เซต")));
  const b=elem("button","เปิดจัดการ","btn");b.onclick=()=>open(t.id,true);card.append(left,b);list.append(card);
 }
 const choice=selectId||current?.id;
 if(choice&&tournamentList.some(t=>t.id===choice))await open(choice,false);
 status("พบ "+tournamentList.length+" รายการ");
}
async function create(){
 if(!identity)return note("กรุณาเข้าสู่ระบบก่อน","error");
 if(waiting)return;
 const name=$("mgrTournamentName").value.trim();
 const teams=$("mgrTeams").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const groups=Number($("mgrGroupCount").value),best=Number($("mgrBestOf").value);
 if(!name||teams.length<2||teams.length>64||groups>teams.length)return note("ข้อมูลไม่ครบ","error","ตั้งชื่อรายการและกรอกทีม 2–64 ทีม");
 if(new Set(teams.map(s=>s.toLocaleLowerCase())).size!==teams.length)return note("พบชื่อทีมซ้ำ","error","กรุณาแก้ไขชื่อทีมก่อนบันทึก");
 waiting=true;$("mgrCreate").disabled=true;
 try{
  const data=await api("create_tournament_draft",{p_name:name,p_slug:"vbc-"+crypto.randomUUID().replaceAll("-","").slice(0,24),p_best_of:best,p_group_count:groups,p_team_names:teams});
  await reload(data.tournament_id);
  note("บันทึกรายการสำเร็จ","success",name+" · "+data.teams+" ทีม · "+data.matches+" คู่");
  $("mgrEditor").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){note("บันทึกรายการไม่สำเร็จ","error",e.message)}
 finally{waiting=false;$("mgrCreate").disabled=false}
}
$("mgrCreate").onclick=create;$("mgrReload").onclick=()=>reload().then(()=>note("โหลดรายการล่าสุดแล้ว"));
async function open(id,scroll){
 try{
  const item=tournamentList.find(t=>t.id===id);
  if(!item)throw Error("ไม่พบรายการที่เลือก");
  const requests=await Promise.all([
   db.from("tournament_teams").select("team_id").eq("tournament_id",id),
   db.from("pools").select("id,code").eq("tournament_id",id).order("code"),
   db.from("matches").select("id,team_a_id,team_b_id,status,scheduled_start,stage_id").eq("tournament_id",id).order("created_at"),
  ]);
  const fail=requests.find(x=>x.error);if(fail)throw fail.error;
  const [members,pools,matches]=requests.map(x=>x.data);
  const ids=members.map(x=>x.team_id);
  let teams=[],assigned=[];
  if(ids.length){const r=await db.from("teams").select("id,name").in("id",ids);if(r.error)throw r.error;teams=r.data;}
  if(pools.length){const r=await db.from("pool_teams").select("pool_id,team_id").in("pool_id",pools.map(x=>x.id));if(r.error)throw r.error;assigned=r.data;}
  current={...item,teams,pools,matches,assigned,id};
  render();
  if(scroll)$("mgrEditor").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){note("เปิดรายการไม่สำเร็จ","error",e.message)}
}
function render(){
 if(!current)return;
 const m=current;$("mgrEditor").hidden=false;
 $("mgrSelectedTitle").textContent=m.name;
 $("mgrSelectedMeta").textContent=fmt(m.status)+" · "+m.teams.length+" ทีม · "+m.pools.length+" สาย · "+m.matches.length+" คู่";
 $("mgrRenameName").value=m.name;
 $("mgrRename").disabled=m.status!=="draft";$("mgrDeleteTournament").disabled=m.status!=="draft";
 const poolById=new Map(m.pools.map(x=>[x.id,x.code])),teamsById=new Map(m.teams.map(x=>[x.id,x.name]));
 const byTeam=new Map(m.assigned.map(x=>[x.team_id,x.pool_id]));
 const pane=$("mgrPoolTeams");pane.replaceChildren();
 for(const team of m.teams){
  const row=elem("div","","item-card"),name=elem("strong",team.name);
  const sel=elem("select");sel.setAttribute("aria-label","สายการแข่งขันของ "+team.name);
  for(const p of m.pools)sel.add(new Option("สาย "+p.code,p.id));
  sel.value=byTeam.get(team.id)||"";sel.disabled=m.status!=="draft";
  sel.onchange=async()=>{
   if(!confirm("ย้าย "+team.name+" ไป "+poolById.get(sel.value)+" และสร้างคู่แข่งขันในสายใหม่?")){sel.value=byTeam.get(team.id)||"";return}
   const v=sel.value;sel.disabled=true;
   try{const response=await api("move_team_pool",{p_tournament:m.id,p_team:team.id,p_pool:v});
    await open(m.id,false);note("บันทึกการย้ายสายสำเร็จ","success",team.name+" · สาย "+response.new_pool)}
   catch(e){note("ย้ายสายไม่สำเร็จ","error",e.message);sel.value=byTeam.get(team.id)||"";sel.disabled=false}
  };
  row.append(name,sel);pane.append(row);
 }
 const tbody=$("mgrMatches");tbody.replaceChildren();
 m.matches.forEach((match,index)=>{
  const row=elem("tr");
  const group=poolById.get(byTeam.get(match.team_a_id))||"—";
  for(const val of [index+1,group,teamsById.get(match.team_a_id)||"?",teamsById.get(match.team_b_id)||"?",fmt(match.status)])row.append(elem("td",val));
  const td=elem("td"),b=elem("button","ลบ","btn danger");
  b.disabled=match.status!=="scheduled"||!!match.scheduled_start;
  b.setAttribute("aria-label","ลบคู่แข่งขันที่ "+(index+1));b.onclick=async()=>{
   if(!confirm("ยืนยันลบคู่ที่ "+(index+1)+"? การดำเนินการนี้ย้อนกลับไม่ได้"))return;
   b.disabled=true;
   try{await api("delete_match_draft",{p_match:match.id});await open(m.id,false);note("ลบคู่แข่งขันสำเร็จ")}
   catch(e){note("ลบคู่ไม่สำเร็จ","error",e.message);b.disabled=false}
  };
  td.append(b);row.append(td);tbody.append(row);
 });
}
$("mgrRename").onclick=async()=>{
 if(!current)return;
 const name=$("mgrRenameName").value.trim();
 try{await api("rename_tournament_draft",{p_tournament:current.id,p_name:name});note("บันทึกชื่อรายการสำเร็จ");await reload(current.id)}
 catch(e){note("แก้ไขชื่อไม่สำเร็จ","error",e.message)}
};
$("mgrDeleteTournament").onclick=async()=>{
 if(!current)return;const name=current.name;
 if(!confirm("ยืนยันลบรายการ «"+name+"» พร้อมสายและคู่แข่งขันฉบับร่างทั้งหมด?\nการลบนี้ย้อนกลับไม่ได้"))return;
 try{await api("delete_tournament_draft",{p_tournament:current.id});current=null;$("mgrEditor").hidden=true;await reload();note("ลบรายการสำเร็จ","success",name)}
 catch(e){note("ลบรายการไม่สำเร็จ","error",e.message)}
};
$("mgrOpenScoresheet").onclick=()=>window.VBC?.navigate("scoresheet");
db.auth.onAuthStateChange(()=>setTimeout(()=>authSync().catch(e=>note("โหลดข้อมูลบัญชีไม่สำเร็จ","error",e.message)),0));
authSync().catch(e=>note("ตรวจสอบบัญชีไม่ได้","error",e.message));
