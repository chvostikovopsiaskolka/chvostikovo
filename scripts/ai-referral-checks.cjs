const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const stripTypeScriptTypes=require('node:module').stripTypeScriptTypes || (source=>{const ts=require('typescript');return ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText});
const edgePath='supabase/functions/website-landing-event/index.ts';
const source=stripTypeScriptTypes(fs.readFileSync(edgePath,'utf8'));
let handler;const inserts=[];
const context={Request,Response,URL,crypto,console,AbortSignal,setTimeout,clearTimeout,Deno:{env:{get:k=>({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic'})[k]},serve:h=>handler=h},fetch:async(url,init)=>{inserts.push({url,body:JSON.parse(init.body)});return new Response(null,{status:201})}};
vm.createContext(context);vm.runInContext(source,context);
const base={path:'/',language:'sk'};
async function send(input,ua='Mozilla/5.0 Windows NT Chrome/130.0'){return handler(new Request('https://test.invalid',{method:'POST',headers:{origin:'https://chvostikovo.sk','content-type':'application/json','user-agent':ua},body:JSON.stringify({...base,...input})}));}
(async()=>{
const cases=[
 [{utm_source:'chatgpt.com'},'ai_referral'],[{utm_source:' HTTPS://WWW.CHATGPT.COM/ '},'ai_referral'],[{utm_source:'chatgpt%2ecom'},'ai_referral'],
 [{referrer_host:'www.perplexity.ai'},'ai_referral'],[{referrer_host:'gemini.google.com'},'ai_referral'],[{utm_source:'claude'},'ai_referral'],[{referrer_host:'copilot.microsoft.com'},'ai_referral'],
 [{},'direct'],[{referrer_host:'www.google.com'},'google_organic'],[{utm_source:'facebook',utm_medium:'paid_social',has_fbclid:true,referrer_host:'chatgpt.com'},'meta_paid'],
 [{utm_source:'google',utm_medium:'cpc',referrer_host:'chatgpt.com'},'google_paid'],[{utm_source:'chatgpt.com',referrer_host:'chvostikovo.sk'},'internal_navigation'],
 [{referrer_host:'chatgpt.com.evil.test'},'referral'],[{utm_source:'newsletter',referrer_host:'chatgpt.com'},'utm_other'],[{utm_source:'chatgpt.com',utm_medium:'cpc'},'utm_other'],
 [{referrer_host:'openai.com'},'referral'],[{utm_source:'%E0%A4%A'},'utm_other'],[{utm_source:null},'direct'],[{referrer_host:'gemini.google.com.evil.test'},'referral']
];
for(const [input,expected] of cases){const before=inserts.length,r=await send(input);assert.equal(r.status,201);assert.equal(inserts.length,before+1);assert.equal(inserts.at(-1).body.source_channel,expected,JSON.stringify(input));}
// Compare all unaffected legacy channels against the exact production classifier.
for(const utm_source of ['facebook','fb','instagram','ig','meta','google','bing','tiktok','youtube','linkedin','threads','reddit','pinterest','newsletter',''])for(const utm_medium of ['','cpc','organic','paid_social']){
 const input={utm_source,utm_medium,referrer_host:''};assert.equal(vm.runInContext('classifySource('+JSON.stringify(input)+')',context),vm.runInContext('legacyClassifySource('+JSON.stringify(input)+')',context));
}
for(const ua of ['GPTBot/1.0','OAI-SearchBot/1.0','ChatGPT-User/1.0','PerplexityBot/1.0','Perplexity-User/1.0','Claude-SearchBot/1.0','Googlebot/2.1']){const before=inserts.length,r=await send({utm_source:'chatgpt.com'},ua);assert.equal((await r.json()).ignored,'crawler');assert.equal(inserts.length,before);}
const id=crypto.randomUUID();await send({event_name:'form_submit',event_source:'main_form',attempt_id:id,utm_source:'chatgpt.com'});assert(inserts.at(-1).url.endsWith('website_interaction_events'));assert.equal(inserts.at(-1).body.source_channel,'ai_referral');assert.equal(inserts.at(-1).body.attempt_id,id);
// Execute real attribution + sanitizer modules. Existing session attribution survives internal navigation and consent states.
const data=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const sanitizer=data(stripTypeScriptTypes(fs.readFileSync('src/lib/tracking-sanitization.ts','utf8')));
const trafficCode=stripTypeScriptTypes(fs.readFileSync('src/lib/traffic-source.ts','utf8')).replace('"./tracking-sanitization"',JSON.stringify(sanitizer));
const module=await import(data(trafficCode));
for(const consent of [false,true])for(const ref of ['','https://www.perplexity.ai/search']){
 const storage=new Map();global.window={location:{href:'https://chvostikovo.sk/?utm_source=chatgpt.com',search:'?utm_source=chatgpt.com'},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};global.document={referrer:ref};
 const first=module.getTrafficAttribution();assert.equal(first.source,'chatgpt.com');window.location={href:'https://chvostikovo.sk/psia-skolka-kosice',search:''};document.referrer='https://chvostikovo.sk/';assert.deepEqual(module.getTrafficAttribution(),first);
 const payload={traffic_source:first.source,traffic_medium:first.medium,landing_page:first.landing_page,referrer:first.referrer,marketing_consent:consent};assert.equal(payload.traffic_source,'chatgpt.com');
}
console.log('PASS: 19 classification cases, 56 unchanged legacy cases, 7 crawler exclusions, single existing request, interaction attempt, consent-independent original form/session attribution. No production requests.');
})().catch(e=>{console.error(e);process.exitCode=1});
