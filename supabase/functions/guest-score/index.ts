// Valley Ball Check — capability-scoped guest scoreboard API (development)
const projectUrl = Deno.env.get("SUPABASE_URL") || "";
const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const tokenShape = /^[0-9a-f]{64}$/;
const uuidShape = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function allowedOrigin(origin) {
  if(!origin) return "";
  try {
    const u = new URL(origin);
    if(u.protocol === "https:" && (u.hostname === "valley-ball-check.vercel.app" ||
      /^valley-ball-check-[a-z0-9-]+-pukkink\.vercel\.app$/.test(u.hostname))) return origin;
    if(u.protocol === "http:" && ["localhost","127.0.0.1"].includes(u.hostname)) return origin;
  } catch (_) {}
  return "";
}
function headersFor(origin) {
  const h = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff"};
  const a = allowedOrigin(origin);
  if(a) {h["Access-Control-Allow-Origin"]=a;h["Access-Control-Allow-Headers"]="Content-Type";h["Access-Control-Allow-Methods"]="POST, GET, OPTIONS";}
  return h;
}
function json(value,status,origin) {return new Response(JSON.stringify(value),{status,headers:headersFor(origin)});}
function token() {return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,"0")).join("");}
async function digest(value) {const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(d),v=>v.toString(16).padStart(2,"0")).join("");}
function safeName(value) {if(typeof value!=="string") return null;const s=value.trim();return s.length>=1 && s.length<=60?s:null;}
async function db(url,options) {
  const response=await fetch(projectUrl+url,{
    ...options,
    headers:{"apikey":adminKey,"Authorization":"Bearer "+adminKey,"Content-Type":"application/json", ...(options.headers||{})}
  });
  const body=await response.json().catch(()=>null);
  if(!response.ok){
    const message=String(body?.message||"DATABASE_FAILURE").slice(0,120);
    const ex=new Error(message); ex.pgCode=body?.code; ex.http=response.status; throw ex;
  }
  return body;
}
function publicState(row) {
  const s={...(row.state||{})};delete s.undo;
  return {id:row.id,names:[row.name_a,row.name_b],best_of:row.best_of,revision:Number(row.revision),
    status:row.status,controller_expires_at:row.controller_expires_at,session_expires_at:row.session_expires_at,
    delete_after:row.delete_after,state:s};
}
Deno.serve(async (request) => {
  const origin=request.headers.get("origin")||"";
  if(request.method==="OPTIONS") {
    if(origin && !allowedOrigin(origin)) return json({error:"ORIGIN_DENIED"},403,origin);
    return new Response(null,{status:204,headers:headersFor(origin)});
  }
  if(request.method==="GET") return json({service:"vbc-guest-score",phase:"development",status:"ok"},200,origin);
  if(request.method!=="POST") return json({error:"METHOD_NOT_ALLOWED"},405,origin);
  if(origin && !allowedOrigin(origin)) return json({error:"ORIGIN_DENIED"},403,origin);
  if(!projectUrl || !adminKey) return json({error:"SERVER_NOT_CONFIGURED"},503,origin);
  try {
    if(Number(request.headers.get("content-length")||0)>4096) return json({error:"TOO_LARGE"},413,origin);
    const raw=await request.text();
    if(raw.length>4096) return json({error:"TOO_LARGE"},413,origin);
    const x=JSON.parse(raw);
    if(!x || typeof x!=="object" || Array.isArray(x)) return json({error:"BAD_REQUEST"},400,origin);
    if(x.action==="create") {
      const a=safeName(x.name_a),b=safeName(x.name_b),best=Number(x.best_of);
      if(!a||!b||![3,5].includes(best)) return json({error:"INVALID_TEAMS_OR_FORMAT"},400,origin);
      const tokens={controller:token(),viewer:token(),recovery:token()};
      // A salted pseudonymous fingerprint for per-hour rate limits, never persisted in plaintext.
      // x-forwarded-for is best-effort; add a platform-verified limiter or CAPTCHA prior to general launch.
      const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
      const fingerprint=await digest("creation:"+ip+":"+adminKey);
      const result=await db("/rest/v1/rpc/guest_score_create",{method:"POST",body:JSON.stringify({
        p_name_a:a,p_name_b:b,p_best_of:best,p_controller_hash:await digest(tokens.controller),
        p_viewer_hash:await digest(tokens.viewer),p_recovery_hash:await digest(tokens.recovery),p_fingerprint:fingerprint
      })});
      return json({id:result.id,revision:0,status:"active",tokens},201,origin);
    }
    const id=x.id;
    if(typeof id!=="string"||!uuidShape.test(id)||typeof x.token!=="string"||!tokenShape.test(x.token))
      return json({error:"INVALID_ACCESS"},400,origin);
    const h=await digest(x.token);
    if(x.action==="read"||x.action==="recover") {
      const path="/rest/v1/guest_sessions?select=id,name_a,name_b,best_of,state,revision,status,controller_token_hash,viewer_token_hash,recovery_token_hash,controller_expires_at,session_expires_at,delete_after&id=eq."+encodeURIComponent(id)+"&limit=1";
      const rows=await db(path,{method:"GET"});
      const row=rows?.[0];
      if(!row) return json({error:"ACCESS_DENIED"},403,origin);
      const isRecovery=row.recovery_token_hash===h;
      const isViewer=row.viewer_token_hash===h;
      const isController=row.controller_token_hash===h;
      const now=Date.now(),retention=Date.parse(row.delete_after);
      if(now>=retention||row.status==="closed") return json({error:"EXPIRED"},410,origin);
      if(x.action==="read") {
        if(!isRecovery && !(isViewer||isController && now<Date.parse(row.controller_expires_at))) return json({error:"ACCESS_DENIED"},403,origin);
        if(!isRecovery && now>=Date.parse(row.session_expires_at)) return json({error:"EXPIRED"},410,origin);
        return json({session:publicState(row)},200,origin);
      }
      if(!isRecovery) return json({error:"ACCESS_DENIED"},403,origin);
      const tokens={controller:token(),viewer:token(),recovery:token()};
      await db("/rest/v1/rpc/guest_score_recover",{method:"POST",body:JSON.stringify({
        p_session:id,p_recovery_hash:h,p_new_controller_hash:await digest(tokens.controller),
        p_new_viewer_hash:await digest(tokens.viewer),p_new_recovery_hash:await digest(tokens.recovery)
      })});
      return json({id,revision:Number(row.revision),tokens,status:"active"},200,origin);
    }
    if(x.action==="command") {
      const command=String(x.command||"");
      if(!["point","confirm_set","swap","switch_done","switch_later","undo"].includes(command))
        return json({error:"BAD_COMMAND"},400,origin);
      if(!Number.isSafeInteger(x.expected_revision)||x.expected_revision<0)
        return json({error:"BAD_REVISION"},400,origin);
      const rid=(typeof x.request_id==="string"&&uuidShape.test(x.request_id))?x.request_id:crypto.randomUUID();
      const team=(x.team===0||x.team===1)?x.team:null;
      const delta=(x.delta===-1||x.delta===1)?x.delta:null;
      if(command==="point"&&(team===null||delta===null)) return json({error:"BAD_POINT"},400,origin);
      const r=await db("/rest/v1/rpc/guest_score_command",{method:"POST",body:JSON.stringify({
        p_session:id,p_controller_hash:h,p_expected:x.expected_revision,p_request:rid,
        p_command:command,p_team:team,p_delta:delta
      })});
      return json(r,200,origin);
    }
    return json({error:"UNKNOWN_ACTION"},400,origin);
  } catch(e) {
    const m=String(e?.message||"INTERNAL_ERROR");
    if(m.includes("RATE_LIMIT"))return json({error:"RATE_LIMIT",message:"สร้างเกมบ่อยเกินไป โปรดลองใหม่ภายหลัง"},429,origin);
    if(m.includes("CONFLICT")||e?.pgCode==="40001")return json({error:"REVISION_CONFLICT"},409,origin);
    if(m.includes("EXPIRED")||m.includes("RECOVERY_EXPIRED"))return json({error:"EXPIRED"},410,origin);
    if(m.includes("UNAUTHORIZED")||e?.pgCode==="42501")return json({error:"ACCESS_DENIED"},403,origin);
    if(["BAD_REQUEST","BAD_COMMAND","INVALID_POINT","NO_UNDO","INVALID_SWITCH","SET_NOT_FINISHED"].some(x=>m.includes(x)))
      return json({error:m},400,origin);
    return json({error:"INTERNAL_ERROR"},500,origin);
  }
});
