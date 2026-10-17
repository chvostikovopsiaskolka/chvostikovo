const fs=require('fs'),assert=require('assert/strict'),{boot}=require('./admin-history-v283.cjs');
(async()=>{
 const source=fs.readFileSync(process.env.ADMIN_SOURCE||'admin-after.html','utf8');const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
 fs.writeFileSync('admin-testable.html',source.replace(marker,'window.__attendanceClientV283=supabase;'+marker));
 const {w,errors}=await boot('admin-testable.html');try{
 assert.deepEqual(errors,[]);const db=w.__attendanceClientV283;assert(db);
 db.auth.getSession=async()=>({data:{session:{access_token:'synthetic'}}});
 let calls=0,mode='issue';w.fetch=async()=>{calls++;if(mode==='error')return {ok:false,status:503,text:async()=>JSON.stringify({message:'unavailable'})};const data={ok:mode==='healthy',issues:mode==='healthy'?[]:[{day:'2026-10-14',title:'Chýba zapísaná dochádzka',detail:'1 psík: Synthetic'}]};return {ok:true,status:200,text:async()=>JSON.stringify(data)};};
 await w.checkAdminAttendanceV283(true);const card=w.document.getElementById('attendanceGuardV283');assert(!card.classList.contains('hidden'));assert(card.textContent.includes('14.10.2026'));assert(card.textContent.includes('Synthetic'));
 assert.equal(card.querySelectorAll('button').length,2);const oldCalls=calls;await w.checkAdminAttendanceV283();assert.equal(calls,oldCalls,'cooldown avoids repeated requests');
 mode='healthy';await w.checkAdminAttendanceV283(true);assert(card.classList.contains('hidden'));
 mode='error';await w.checkAdminAttendanceV283(true);assert(!card.classList.contains('hidden'));assert(card.textContent.includes('nepodarilo skontrolovať'));
 assert.deepEqual(errors,[]);console.log('PASS fully assembled admin: actual authenticated client, visible dated issue, healthy hides warning, API failure visible, cooldown; no unexpected runtime errors');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
