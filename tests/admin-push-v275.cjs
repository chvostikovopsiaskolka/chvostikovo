const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('typescript');
const source=fs.readFileSync('supabase/functions/admin-push/index.ts','utf8').replace(/^import[^\n]+\n/,'');
let sends=0;const ctx={Deno:{env:{get:()=>''},serve(){}},webpush:{setVapidDetails(){},sendNotification(){sends++}},fetch:async()=>Response.json([]),Request,Response,URL,console,crypto};
vm.createContext(ctx);vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,ctx);
async function message(record){ctx.fixture={table:'web_form_submissions',record:{id:999,owner_name:'Synthetic Owner',...record}};return vm.runInContext('messageForWebhook(fixture)',ctx)}
(async()=>{
 let m=await message({form_type:'application',dog_name:'First',raw_payload:{dogs:[{dog_name:'First'},{dog_name:'Second'}]}});assert.equal(m.body,'Synthetic Owner · First a Second');assert.equal(m.title,'Nová prihláška psíkov');assert.equal(m.tag,'web-form-999');
 m=await message({form_type:'application',dog_name:'First',raw_payload:{dogs:[{dog_name:'First'}]}});assert.equal(m.body,'Synthetic Owner · First');assert.equal(m.title,'Nová prihláška psa');
 m=await message({form_type:'application',dog_name:'Legacy'});assert.equal(m.body,'Synthetic Owner · Legacy');
 m=await message({form_type:'application',dog_name:'Fallback',raw_payload:{dogs:[{},null]}});assert.equal(m.body,'Synthetic Owner · Fallback');
 m=await message({form_type:'lead'});assert.equal(m.body,'Synthetic Owner');assert(m.title.includes('záujem'));
 m=await message({form_type:'lead',raw_payload:{dogs:[{dog_name:'First'},{dog_name:'Second'}]}});assert.equal(m.body,'Synthetic Owner · First a Second');
 assert.equal(sends,0);console.log('PASS actual admin-push formatter: two dog names, one dog, legacy/fallback, lead count and stable tag; no push was sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
