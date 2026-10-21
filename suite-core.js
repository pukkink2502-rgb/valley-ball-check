import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
export const db=createClient("https://rwnvlxwdorsrxjuepcxp.supabase.co","sb_publishable_cFjo5kmsCst-vDjTmD_ViQ_0aoK4VeQ",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const $=id=>document.getElementById(id);
export const elem=(name,text="",cls="")=>{const x=document.createElement(name);x.textContent=String(text);if(cls)x.className=cls;return x};
export const box=(id,msg,bad=false)=>{const node=$(id);if(node){node.textContent=String(msg);node.style.color=bad?"#ffabb8":"#a8f3ce"}};
export async function api(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw Error(error.message);return data}
export async function signedIn(){const {data:{user}}=await db.auth.getUser();if(!user)throw Error("กรุณาเข้าสู่ระบบในเมนูจัดการแข่งขันออนไลน์ก่อน");return user}
export async function owned(){await signedIn();const {data,error}=await db.from("tournaments").select("id,name,status,created_at,best_of").order("created_at",{ascending:false}).limit(100);if(error)throw Error(error.message);return data||[]}
export function opt(select,values,placeholder){select.replaceChildren();if(placeholder)select.add(new Option(placeholder,""));for(const v of values)select.add(new Option(v.label,v.value));}
export function downloadBlob(blob,file){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function th(txt){return elem("th",txt)}
export function td(txt){return elem("td",txt)}
