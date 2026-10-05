const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('admin-snapshot/stable-v10-clean.html','utf8'),source=html.slice(html.indexOf('function visitReminderControlHtml('),html.indexOf('async function openDog('));
(async()=>{
 const d=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=d.window;const dog={id:77,visit_reminder_channel:'auto'};w.dogById=()=>dog;w.$=id=>w.document.getElementById(id);let fail=false;
 w.withJwtRetry=async fn=>fn();w.supabase={from:()=>({update:payload=>({eq:()=>({select:()=>({single:async()=>fail?{error:new Error('test failure')}:{data:payload}})})})})};w.eval(source);
 w.document.body.innerHTML=w.visitReminderControlHtml(dog);const select=w.$('dogVisitReminderChannel');assert.equal(select.value,'auto');select.value='push';await w.saveVisitReminderChannel(77,select);assert.equal(dog.visit_reminder_channel,'push');assert.equal(select.disabled,false);select.value='auto';await w.saveVisitReminderChannel(77,select);assert.equal(dog.visit_reminder_channel,'auto');select.value='push';await w.saveVisitReminderChannel(77,select);
 fail=true;select.value='both';await w.saveVisitReminderChannel(77,select);assert.equal(select.value,'push');assert.equal(dog.visit_reminder_channel,'push');assert(w.$('dogVisitReminderMessage').textContent.includes('nepodarila'));w.close();
 console.log('PASS: default SMS; staff selector save; failed update restores prior channel and enables control');
})().catch(error=>{console.error(error);process.exit(1)});
