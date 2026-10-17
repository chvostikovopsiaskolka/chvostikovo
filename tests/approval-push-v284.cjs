const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{stripTypeScriptTypes}=require('node:module');
const src=fs.readFileSync('supabase/functions/admin-push/index.ts','utf8');const fn=src.slice(src.indexOf('async function messageForWebhook'),src.indexOf('\nfunction bratislavaParts'));
let rows=[],dogs=[];const context=vm.createContext({console,Date,encodeURIComponent,rest:async path=>path.startsWith('dogs?')?dogs:rows});
vm.runInContext(stripTypeScriptTypes(fn)+';this.format=messageForWebhook;',context);
const row=(id,date,dog=1,user='account')=>({id,reservation_date:date,dog_id:dog,user_id:user,status:'approved'});
async function format(input){return context.format({table:'booking_approval_push_events_v284',record:{id:'batch',user_id:'account',request_ids:input}})}
(async()=>{
 dogs=[{id:1,name:'Hannah'}];rows=Array.from({length:5},(_,i)=>row(i+1,'2026-10-'+(19+i)));
 let m=await format([1,2,3,4,5]);assert.equal(m.body,'Hannah má schválených 5 dní v škôlke. Už sa tešíme!');assert.equal(m.audience,'customer');assert.equal(m.recipientUserId,'account');
 rows=rows.slice(0,2);m=await format([1,2]);assert(m.body.includes('schválené 2 dni'));
 rows=[row(1,'2026-10-19')];m=await format([1]);assert.equal(m.title,'Rezervácia bola schválená 🐾');assert(m.body.includes('na 19. 10. 2026'));
 dogs=[{id:1,name:'Bella'},{id:2,name:'Iris'}];rows=Array.from({length:5},(_,i)=>[row(2*i+1,'2026-10-'+(19+i)),row(2*i+2,'2026-10-'+(19+i),2)]).flat();m=await format(rows.map(r=>r.id));assert.equal(m.body,'Bella a Iris majú schválených 5 dní v škôlke. Tešíme sa na nich!');assert(!m.body.includes('10 dní'));
 rows=[row(1,'2026-10-19'),row(2,'2026-10-20',2,'other'),{...row(3,'2026-10-21'),status:'pending'},row(999,'2026-10-22')];m=await format([1,2,3]);assert(m.body.startsWith('Bella má schválenú'));assert(!m.body.includes('Iris'));
 rows=[];assert.equal(await format([1]),null);assert.equal(await format([]),null);
 console.log('PASS batch push: 5 days, 2-day grammar, one-day fallback, two dogs count distinct dates, user/id/status isolation, empty ignored; no push sent');
})().catch(e=>{console.error(e);process.exitCode=1});
