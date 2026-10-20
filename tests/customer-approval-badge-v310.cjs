const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync('supabase/functions/admin-push/index.ts','utf8').replace(/^import[^\n]+\n/,'');
let sends=0;
const context={Deno:{env:{get:()=>''},serve(){}},webpush:{setVapidDetails(){},sendNotification(){sends++}},Request,Response,URL,console,crypto,fetch:async()=>Response.json([])};
vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source),context);
vm.runInContext(`rest=async path=>path.startsWith('portal_notifications?')?[{notification_type:'dog_approved'},{notification_type:'weekly_booking_reminder'}]:[]`,context);
(async()=>{assert.equal(await vm.runInContext("customerUnreadBadgeCountV186('synthetic-account')",context),1);assert.equal(sends,0);console.log('PASS actual push runtime: unread dog approval counts once; reminder excluded; no notifications sent')})().catch(e=>{console.error(e);process.exitCode=1});
