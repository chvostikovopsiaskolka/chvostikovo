/* Attendance guard v283: reuse the authenticated main client and existing refresh events. */
let attendanceCheckV283=null,attendanceCheckedAtV283=0;
function attendanceCardV283(){
 let card=$('attendanceGuardV283');if(card)return card;
 const section=$('todaySection');if(!section)return null;
 card=document.createElement('section');card.id='attendanceGuardV283';card.className='card hidden';card.setAttribute('role','status');card.setAttribute('aria-live','polite');
 section.insertBefore(card,section.firstChild);return card;
}
async function checkAttendanceV283(force=false){
 if(attendanceCheckV283)return attendanceCheckV283;
 if(!force&&Date.now()-attendanceCheckedAtV283<60000)return;
 attendanceCheckV283=(async()=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session){attendanceCardV283()?.classList.add('hidden');return}
  const card=attendanceCardV283();if(!card)return;
  try{
   const {data,error}=await supabase.rpc('admin_attendance_health_v283');if(error)throw new Error(error.message);
   if(!data||!Array.isArray(data.issues))throw new Error('Neúplná odpoveď kontroly.');
   attendanceCheckedAtV283=Date.now();card.replaceChildren();
   if(!data.issues.length){card.classList.add('hidden');return}
   card.classList.remove('hidden');card.style.border='2px solid #dc2626';
   const title=document.createElement('strong');title.textContent='⚠️ Skontrolujte dochádzku';card.append(title);
   const intro=document.createElement('p');intro.textContent='Zistili sme nezrovnalosť. Pred ďalším počítaním vstupov skontrolujte uvedené dni.';card.append(intro);
   for(const issue of data.issues){const line=document.createElement('p');line.textContent=(issue.day?issue.day.split('-').reverse().join('.')+' · ':'')+issue.title+' — '+issue.detail;card.append(line)}
   const history=document.createElement('button');history.type='button';history.className='btn secondary full';history.textContent='Otvoriť históriu návštev';history.onclick=()=>{$('menuStatsCardV1')?.click();setTimeout(()=>document.querySelector('[data-v40-stats="history"]')?.click(),20)};card.append(history);
  }catch(error){card.replaceChildren();card.classList.remove('hidden');card.style.border='2px solid #d97706';const msg=document.createElement('p');msg.textContent='⚠️ Dochádzku sa nepodarilo skontrolovať. Skúste kontrolu znova.';card.append(msg)}
  const retry=document.createElement('button');retry.type='button';retry.className='btn secondary full';retry.textContent='Znova skontrolovať';retry.onclick=()=>checkAttendanceV283(true);card.append(retry);
 })().finally(()=>{attendanceCheckV283=null});return attendanceCheckV283;
}
window.addEventListener('chvostikovo-admin-data-ready-v63',()=>checkAttendanceV283());
window.addEventListener('focus',()=>checkAttendanceV283());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkAttendanceV283()});
window.checkAdminAttendanceV283=checkAttendanceV283;
