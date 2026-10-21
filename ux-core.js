(function() {
 "use strict";
 const themeKey="vbc_theme";
 const root=document.documentElement;
 const stack=document.createElement("div");stack.className="toast-stack";
 stack.setAttribute("role","region");stack.setAttribute("aria-label","การแจ้งเตือน");document.body.append(stack);
 function notify(message,type="success",details=""){
  const item=document.createElement("div");item.className="toast "+(type==="error"?"error":type==="warning"?"warning":"");
  item.setAttribute("role",type==="error"?"alert":"status");
  const icon=document.createElement("strong");icon.textContent=type==="error"?"✕":type==="warning"?"!":"✓";
  icon.style.fontSize="20px";icon.style.color=type==="error"?"#ef7182":"var(--u-accent)";
  const content=document.createElement("div");content.className="toast-content";
  const title=document.createElement("strong");title.textContent=String(message||"ดำเนินการเรียบร้อย");
  content.append(title);
  if(details){const text=document.createElement("span");text.textContent=String(details);content.append(text)}
  const close=document.createElement("button");close.type="button";close.setAttribute("aria-label","ปิดแจ้งเตือน");close.textContent="×";
  close.onclick=()=>item.remove();item.append(icon,content,close);
  stack.prepend(item);
  while(stack.children.length>4)stack.lastElementChild.remove();
  setTimeout(()=>item.remove(),type==="error"?8000:4800);
 }
 function theme(v){
  const value=v==="light"?"light":"dark";root.dataset.theme=value;try{localStorage.setItem(themeKey,value)}catch{}
  const btn=document.getElementById("themeSwitch");
  if(btn){btn.textContent=value==="dark"?"☀ โหมดสว่าง":"☾ โหมดมืด";btn.setAttribute("aria-label","เปลี่ยนเป็น"+(value==="dark"?"โหมดสว่าง":"โหมดมืด"))}
 }
 window.VBC={notify,theme,navigate:page=>{
  const target=document.querySelector('button[data-page="'+page+'"]');
  if(target)target.click();
 }};
 try{theme(localStorage.getItem(themeKey)||"dark")}catch{theme("dark")}
 document.getElementById("themeSwitch")?.addEventListener("click",()=>theme(root.dataset.theme==="light"?"dark":"light"));
 const helper=document.querySelectorAll(".nav button");
 const names={home:"ภาพรวม",scoreboard:"กระดานคะแนน",manager:"จัดการแข่งขัน",scoresheet:"สกอร์ชีตและตำแหน่ง",draw:"จับสลาก",graphics:"กราฟิก",public:"โปรแกรมและอันดับ"};
 for(const button of helper) {
  const p=button.dataset.page;
  if(names[p])button.setAttribute("aria-label","เปิดหน้า"+names[p]);
 }
 const previous=window.onerror;
 window.addEventListener("unhandledrejection",e=>{
  const error=e.reason?.message||"เกิดข้อผิดพลาดที่ไม่คาดคิด";
  console.error("Uncaught app error:",e.reason);
  notify("ไม่สามารถดำเนินการได้","error",error);
 });
})();
