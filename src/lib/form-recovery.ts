import { SUPABASE_ENDPOINT, type InquiryInput } from "./inquiry";
import { normalizePhone } from "./phone";
const KEY="chvostikovo_pending_contact_v273";
type Contact={action:"recover_contact";form_attempt_id:string;form_type:"lead"|"application";owner_name:string;phone:string;email:string;dog_name:string;interest_reason:string;source_ref:string;consent:true;expires_at:number};
function contact(input:InquiryInput,attemptId:string):Contact|null{
  if(input.consent!==true||!input.meno?.trim())return null;
  let phone:string;try{phone=normalizePhone(input.telefon)}catch{return null}
  return {action:"recover_contact",form_attempt_id:attemptId,form_type:input.typ==="prihlaska"?"application":"lead",owner_name:input.meno.trim().slice(0,160),phone,email:"email" in input?String(input.email||"").slice(0,254):"",dog_name:"pes" in input?String(input.pes||"").slice(0,160):"",interest_reason:"duvod" in input?String(input.duvod||"").slice(0,300):"zaujem" in input?String(input.zaujem||"").slice(0,300):"",source_ref:String(input.source_ref||"/").slice(0,500),consent:true,expires_at:Date.now()+86400000};
}
async function send(value:Contact){try{const r=await fetch(SUPABASE_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value),signal:AbortSignal.timeout(4000)});const j=await r.json();return r.ok&&j.recovery_saved===true}catch{return false}}
export function stageContactDraft(input:InquiryInput,attemptId:string){const value=contact(input,attemptId);if(value)try{sessionStorage.setItem(KEY,JSON.stringify(value))}catch{}}
export async function preserveFailedContact(input:InquiryInput,attemptId?:string){
  const value=contact(input,attemptId||crypto.randomUUID());if(!value)return false;
  try{sessionStorage.setItem(KEY,JSON.stringify(value))}catch{}
  const saved=await send(value);if(saved)try{sessionStorage.removeItem(KEY)}catch{}return saved;
}
export function clearRecoveredContact(){try{sessionStorage.removeItem(KEY)}catch{}}
async function retryPending(){try{const raw=sessionStorage.getItem(KEY);if(!raw)return;const value=JSON.parse(raw) as Contact;if(value.expires_at<Date.now()){sessionStorage.removeItem(KEY);return}if(await send(value))sessionStorage.removeItem(KEY)}catch{}}
if(typeof window!=="undefined"){window.addEventListener("online",()=>{void retryPending()});setTimeout(()=>{void retryPending()},0)}
