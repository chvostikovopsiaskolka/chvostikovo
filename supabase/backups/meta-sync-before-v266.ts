import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const base=Deno.env.get("SUPABASE_URL")||"";
const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const token=Deno.env.get("META_MARKETING_ACCESS_TOKEN")||"";
const account="157532227";
const admin=createClient(base,service,{auth:{persistSession:false,autoRefreshToken:false}});
const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function dateShift(day,offset){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
async function graph(path,params={}){
  const url=new URL("https://graph.facebook.com/v24.0/"+path.replace(/^\/+/,""));
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(url,{headers:{Authorization:"Bearer "+token}});
    const body=await response.json().catch(()=>({}));
    if(response.ok)return body;
    if((response.status===429||response.status>=500)&&attempt<2){await sleep(1000*(attempt+1));continue}
    throw new Error("Meta API "+response.status+": "+String(body?.error?.message||"neznáma chyba").slice(0,200));
  }
}
async function graphPages(path,params={}){
 let result=[],after=null;
 for(let page=0;page<20;page++){
   const r=await graph(path,{...params,...(after?{after}:{})});
   result.push(...(r.data||[]));
   if(!r.paging?.cursors?.after||!r.paging?.next)return result;
   after=r.paging.cursors.after;
 }
 throw new Error("Meta API výsledky prekročili stránkovanie; synchronizácia nebola uložená.");
}
function actionValue(arr,types){
 if(!Array.isArray(arr))return null;
 for(const type of types){const it=arr.find(x=>x.action_type===type);if(it)return Number(it.value)||0}
 return null;
}
function videoValue(arr){
 if(!Array.isArray(arr))return null;
 const v=arr.find(x=>x.action_type==="video_view"||x.action_type==="video_play")||arr[0];
 return v?Number(v.value)||0:null;
}
function numberOrNull(x){return x===null||x===undefined||x===""?null:Number(x)}
async function authorize(req){
 const cronSecret=req.headers.get("x-chv-marketing-cron")||"";
 if(cronSecret){
   const {data,error}=await admin.rpc("verify_chv_marketing_cron_secret",{p_secret:cronSecret});
   if(!error&&data===true)return true;
   throw new Error("Neplatné oprávnenie plánovanej úlohy.");
 }
 const raw=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 if(!raw)throw new Error("Neprihlásený používateľ.");
 if(raw===service)return true;
 const {data:{user},error}=await admin.auth.getUser(raw);
 if(error||!user)throw new Error("Neplatné prihlásenie.");
 const {data:staff,error:staffError}=await admin.from("staff").select("user_id").eq("user_id",user.id).eq("active",true).limit(1).maybeSingle();
 if(staffError||!staff)throw new Error("Prístup je povolený iba zamestnancom.");
 return true;
}
Deno.serve(async req=>{
 if(req.method!=="POST")return respond({error:"Použite POST."},405);
 try{await authorize(req)}catch(e){return respond({error:String(e.message)},403)}
 if(!token)return respond({error:"META_MARKETING_ACCESS_TOKEN nie je nakonfigurovaný. Automatický import nie je aktívny."},503);
 let runId=null,from=null,to=null;
 try{
   const payload=await req.json().catch(()=>({}));
   const days=Math.floor(Number(payload.days||7));
   if(!Number.isFinite(days)||days<1||days>180)throw new Error("Rozsah je 1 až 180 dní.");
   const acct=await graph("act_"+account,{fields:"id,currency,timezone_name"});
   if(acct.currency!=="EUR")throw new Error("Účet nemá menu EUR; prevod nie je nakonfigurovaný.");
   const today=new Intl.DateTimeFormat("en-CA",{timeZone:acct.timezone_name||"Europe/Bratislava",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   to=dateShift(today,-1);from=dateShift(to,-days+1);
   const {data:run,error:runErr}=await admin.from("marketing_sync_runs").insert({report_date:to,source:"meta",status:"running",details:{account_id:account,range:[from,to],timezone:acct.timezone_name}}).select("id").single();
   if(runErr)throw runErr;runId=run.id;
   const [campaigns,adsets,ads,insights]=await Promise.all([
     graphPages("act_"+account+"/campaigns",{fields:"id,name,status,effective_status,objective",limit:500}),
     graphPages("act_"+account+"/adsets",{fields:"id,name,campaign_id,status",limit:500}),
     graphPages("act_"+account+"/ads",{fields:"id,name,adset_id,campaign_id,status,effective_status,creative{thumbnail_url}",limit:500}),
     graphPages("act_"+account+"/insights",{level:"ad",time_increment:1,time_range:JSON.stringify({since:from,until:to}),fields:"date_start,ad_id,adset_id,campaign_id,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions",limit:500})
   ]);
   const cmap=new Map(campaigns.map(x=>[String(x.id),x])),amap=new Map(ads.map(x=>[String(x.id),x]));
   const dayRows=new Map(insights.map(x=>[x.date_start+"|"+x.ad_id,x]));
   // Explicitly record non-delivering ads for each day, while preserving null
   // for metrics the API did not supply (not zero).
   const rows=[];
   for(const ad of ads){
     const camp=cmap.get(String(ad.campaign_id))||{};
     for(let date=from;date<=to;date=dateShift(date,1)){
       const row=dayRows.get(date+"|"+ad.id);
       rows.push({
         report_date:date,account_id:account,campaign_id:String(ad.campaign_id),
         adset_id:String(ad.adset_id),ad_id:String(ad.id),
         campaign_name:camp.name||"",ad_name:ad.name||"",
         metrics:{
           amount_spent:row?numberOrNull(row.spend):0,
           impressions:row?numberOrNull(row.impressions):0,
           reach:row?numberOrNull(row.reach):0,
           clicks:row?numberOrNull(row.clicks):0,
           link_click:row?actionValue(row.actions,["link_click"]):null,
           landing_page_view:row?actionValue(row.actions,["landing_page_view"]):null,
           lead:row?actionValue(row.actions,["offsite_conversion.fb_pixel_lead","lead","onsite_conversion.lead_grouped"]):null,
           results:row?actionValue(row.actions,camp.objective==="OUTCOME_ENGAGEMENT"?["post_engagement"]:["offsite_conversion.fb_pixel_lead","lead"]):null,
           ctr:row?numberOrNull(row.ctr):null,cpc:row?numberOrNull(row.cpc):null,cpm:row?numberOrNull(row.cpm):null,
           video_play:row?videoValue(row.video_play_actions):null,
           thruplay:row?videoValue(row.video_thruplay_watched_actions):null,
           video_p25:row?videoValue(row.video_p25_watched_actions):null,
           video_p50:row?videoValue(row.video_p50_watched_actions):null,
           video_p75:row?videoValue(row.video_p75_watched_actions):null,
           video_p100:row?videoValue(row.video_p100_watched_actions):null,
           status:ad.effective_status||ad.status||"UNKNOWN",campaign_status:camp.effective_status||camp.status||"UNKNOWN",
           objective:camp.objective||null,creative_thumb:ad.creative?.thumbnail_url||null,
           timezone:acct.timezone_name||null,import_method:"meta_marketing_api_automatic"
         }
       });
     }
   }
   // If an API call failed, no earlier data was changed. Upsert only after
   // all pages have been fetched and parsed.
   if(rows.length>5000)throw new Error("Priveľa riadkov pre bezpečnú atómovú synchronizáciu. Znížte počet dní.");
   const {error:writeError}=await admin.from("marketing_daily_meta").upsert(rows,{onConflict:"report_date,account_id,campaign_id,adset_id,ad_id"});
   if(writeError)throw writeError;
   await admin.from("marketing_sync_runs").update({status:"success",finished_at:new Date().toISOString(),details:{account_id:account,range:[from,to],timezone:acct.timezone_name,campaigns:campaigns.length,adsets:adsets.length,ads:ads.length,rows:rows.length}}).eq("id",runId);
   return respond({ok:true,range:[from,to],timezone:acct.timezone_name,ads:ads.length,rows:rows.length});
 }catch(error){
   if(runId)await admin.from("marketing_sync_runs").update({status:"error",finished_at:new Date().toISOString(),details:{message:String(error.message||error).slice(0,250),range:[from,to]}}).eq("id",runId);
   return respond({error:String(error.message||error)},500);
 }
});

