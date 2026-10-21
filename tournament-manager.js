
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
const sb=createClient("https://rwnvlxwdorsrxjuepcxp.supabase.co","sb_publishable_cFjo5kmsCst-vDjTmD_ViQ_0aoK4VeQ",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
let logged=null,busy=false;
function msg(s,err=false){const el=$("mgrStatus");el.textContent=s;el.style.color=err?"#ffaaa9":"#b2f5d3"}
function make(parent,tag,value){const x=document.createElement(tag);x.textContent=value;parent.append(x);return x}
async function syncUser(){
 const {data,error}=await sb.auth.getUser();logged=error?null:data.user;
 $("mgrGuest").hidden=!!logged;$("mgrSignedIn").hidden=!logged;$("mgrUser").textContent=logged?.email||"";
 if(logged)await reload();else $("mgrList").replaceChildren();
}
async function signin(signup){
 if(busy)return;busy=true;
 try{
  const email=$("mgrEmail").value.trim(),password=$("mgrPassword").value;
  if(!email.includes("@")||password.length<6)throw Error("ระบุอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร");
  const {data,error}=signup?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(signup&&!data.session)msg("สมัครแล้ว กรุณายืนยันบัญชีทางอีเมล");
  else{msg("เข้าสู่ระบบสำเร็จ");await syncUser()}
 }catch(e){msg(e.message,true)}finally{busy=false}
}
$("mgrSignIn").onclick=()=>signin(false);$("mgrSignUp").onclick=()=>signin(true);
$("mgrSignOut").onclick=async()=>{await sb.auth.signOut();await syncUser();msg("ออกจากระบบแล้ว")};
async function add(){
 if(!logged||busy)return;
 const name=$("mgrTournamentName").value.trim(),teams=$("mgrTeams").value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);
 const count=Number($("mgrGroupCount").value),best=Number($("mgrBestOf").value);
 if(!name||name.length>140||teams.length<2||teams.length>64||count>teams.length){msg("กรุณาระบุรายการและทีม 2–64 ทีม",true);return}
 if(new Set(teams.map(n=>n.toLowerCase())).size!==teams.length){msg("ชื่อทีมซ้ำกัน",true);return}
 busy=true;$("mgrCreate").disabled=true;msg("กำลังสร้างรายการ...");
 try{
  const {data,error}=await sb.rpc("create_tournament_draft",{p_name:name,p_slug:"vbc-"+crypto.randomUUID().replaceAll("-","").slice(0,24),p_best_of:best,p_group_count:count,p_team_names:teams});
  if(error)throw error;
  msg("สร้างรายการเรียบร้อย "+data.teams+" ทีม "+data.groups+" สาย "+data.matches+" คู่");await reload();
 }catch(e){msg("สร้างไม่สำเร็จ: "+e.message,true)}
 finally{busy=false;$("mgrCreate").disabled=false}
}
$("mgrCreate").onclick=add;
async function reload(){
 if(!logged)return;
 const {data,error}=await sb.from("tournaments").select("id,name,status,best_of,created_at").order("created_at",{ascending:false}).limit(40);
 if(error){msg(error.message,true);return}
 const list=$("mgrList");list.replaceChildren();
 if(!data.length)make(list,"p","ยังไม่มีรายการแข่งขัน");
 for(const t of data){
  const card=make(list,"div","");card.className="card";
  make(card,"h3",t.name);
  make(card,"p",(t.best_of===3?"2 ใน 3 เซต":"3 ใน 5 เซต")+" · "+t.status);
  const b=make(card,"button","ดูสายและคู่แข่งขัน");b.className="btn";b.onclick=()=>details(t);
 }
}
async function details(t){
 msg("กำลังโหลดรายการ...");
 const all=await Promise.all([
  sb.from("tournament_teams").select("team_id").eq("tournament_id",t.id),
  sb.from("pools").select("id,code").eq("tournament_id",t.id),
  sb.from("matches").select("team_a_id,team_b_id,status").eq("tournament_id",t.id)
 ]);
 const bad=all.find(x=>x.error);if(bad){msg(bad.error.message,true);return}
 const [members,pools,matches]=all.map(x=>x.data);
 const ids=members.map(x=>x.team_id);
 let teams=[],assigned=[];
 if(ids.length){
  const r=await sb.from("teams").select("id,name").in("id",ids);
  if(r.error){msg(r.error.message,true);return}teams=r.data;
 }
 if(pools.length){
  const r=await sb.from("pool_teams").select("pool_id,team_id").in("pool_id",pools.map(p=>p.id));
  if(r.error){msg(r.error.message,true);return}assigned=r.data;
 }
 const names=new Map(teams.map(x=>[x.id,x.name])),groupCodes=new Map(pools.map(x=>[x.id,x.code])),groupNames=new Map(assigned.map(x=>[x.team_id,groupCodes.get(x.pool_id)]));
 const box=$("mgrDetails");box.replaceChildren();make(box,"h3",t.name+" · "+matches.length+" คู่");
 for(const p of pools)make(box,"p","สาย "+p.code+": "+assigned.filter(a=>a.pool_id===p.id).map(a=>names.get(a.team_id)).join(", "));
 const table=make(box,"table","");const head=make(table,"tr","");
 for(const x of ["สาย","ทีม A","ทีม B","สถานะ"])make(head,"th",x);
 for(const match of matches){
  const tr=make(table,"tr","");
  for(const x of [groupNames.get(match.team_a_id)||"?",names.get(match.team_a_id)||"?",names.get(match.team_b_id)||"?",match.status])make(tr,"td",x);
 }
 msg("โหลดรายการสำเร็จ");
}
$("mgrReload").onclick=reload;
sb.auth.onAuthStateChange(()=>setTimeout(()=>syncUser().catch(e=>msg(e.message,true)),0));
syncUser().catch(e=>msg(e.message,true));
