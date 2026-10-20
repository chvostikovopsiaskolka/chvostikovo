const fs=require('fs'),assert=require('assert/strict'),zlib=require('zlib'),crypto=require('crypto');
module.exports=function(){
 const old=require('./build-admin-proofs-v321.cjs')();
 assert.equal(crypto.createHash('md5').update(old).digest('hex'),'c89018c3f89c7d25b399d5829f59ccdc');let h=old;
 const edits=[];function replace(a,b){assert.equal(h.split(a).length,2,'Unique anchor: '+a.slice(0,100));h=h.replace(a,b);edits.push({old:a,new:b})}
 replace('return Number(setting?.capacity||8)','return Number(setting?.capacity??state.defaultCapacity??8)');
 replace('function dayCapacity(date){',fs.readFileSync('tools/admin-capacity-v322.js','utf8')+'\nfunction dayCapacity(date){');
 replace('customerPassRequestsRes,vaccinationsRes]=await Promise.all([','customerPassRequestsRes,vaccinationsRes,defaultCapacityResV322]=await Promise.all([');
 replace("withJwtRetry(()=>supabase.from('vaccinations').select('id,dog_id,vaccination_type,valid_until,created_at').order('created_at',{ascending:false}))\n  ])","withJwtRetry(()=>supabase.from('vaccinations').select('id,dog_id,vaccination_type,valid_until,created_at').order('created_at',{ascending:false})),\n    withJwtRetry(()=>supabase.from('app_settings').select('setting_value').eq('setting_key','daycare_default_capacity').maybeSingle())\n  ])");
 replace('||vaccinationsRes.error\n  if(err)','||vaccinationsRes.error||defaultCapacityResV322.error\n  if(err)');
 replace('state.portalDaySettings=daySettingsRes.data||[];','state.defaultCapacity=Number(defaultCapacityResV322.data?.setting_value||8);state.portalDaySettings=daySettingsRes.data||[];');
 replace('<div id="weekSectionTitle" class="section-title">Tento týždeň</div>','<div class="week-capacity-head-v322"><div id="weekSectionTitle" class="section-title">Tento týždeň</div><button id="defaultCapacityV322" type="button" class="btn" aria-label="Nastaviť všeobecnú kapacitu miest"></button></div>');
 replace("  renderWeekBlock(start,$('weekList'));","  renderDefaultCapacityV322();\n  renderWeekBlock(start,$('weekList'));");
 const source=fs.readFileSync('index.html','utf8');
 const defs=source.match(/<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs><symbol id="ci-loading-paw"[\s\S]*?<\/svg>/)[0];
 const loader=source.split('\n').find(x=>x.startsWith('<div id="loading"')).replace('id="loading"','id="appBoot"').replace('class="loading-screen loading-concept"','class="app-boot loading-screen loading-concept"').replace('src="/loading-brand.png"','src="https://app.chvostikovo.sk/loading-brand.png"').replace('aria-live="polite">','aria-live="polite">'+defs);
 const oldBoot=h.match(/<div id="appBoot"[\s\S]*?<script id="chvo-boot-anchor-v309">[\s\S]*?<\/script>/)[0];
 const motion=fs.readFileSync('loading-motion.js','utf8').replaceAll('#loading','#appBoot').replace('const visible=arc=>','const visible=arc=>arc.isConnected&&');
 replace(oldBoot,loader+'<script id="admin-boot-motion-v322">'+motion+'</script>');
 const css=fs.readFileSync('loading-design.css','utf8').replaceAll('#loading','#appBoot');
 const style=`<style id="admin-capacity-boot-v322">
 .week-capacity-head-v322{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0}.week-capacity-head-v322 .section-title{margin:0;min-width:0}#defaultCapacityV322{display:grid;gap:3px;min-height:48px;flex-shrink:0;padding:8px 12px;border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;color:#9a4b12;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}#defaultCapacityV322 span{font-size:11px}#defaultCapacityV322 strong{font-size:18px}#defaultCapacityV322:focus-visible{outline:3px solid #fb923c;outline-offset:3px}
 #weekSection .card.dog:has(.mark-no-show)>.row{display:grid!important;grid-template-columns:40px minmax(0,1fr) max-content;gap:7px!important;align-items:center!important}
 #weekSection .card.dog:has(.mark-no-show)>.row>.grow{min-width:0}#weekSection .card.dog:has(.mark-no-show) h3{font-size:clamp(12px,3.7vw,18px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 #weekSection .card.dog:has(.mark-no-show) .dog-mini-avatar{width:40px;height:40px;flex-basis:40px}#weekSection .card.dog:has(.mark-no-show) .reservation-side{max-width:none!important;flex-wrap:nowrap!important;gap:4px!important}#weekSection .mark-no-show{white-space:nowrap!important;flex:0 0 auto}
 @media(max-width:360px){#weekSection .card.dog:has(.mark-no-show)>.row{grid-template-columns:32px minmax(0,1fr) max-content;gap:4px!important}#weekSection .card.dog:has(.mark-no-show) .dog-mini-avatar{width:32px;height:32px;flex-basis:32px}#weekSection .card.dog:has(.mark-no-show) .reservation-side{gap:2px!important}#weekSection .card.dog:has(.mark-no-show) .reservation-side>*{font-size:8px!important;padding:3px 4px!important}}
 ${css}
 html:has(#appBoot),body:has(#appBoot){background:#fffaf5!important}#appBoot.app-boot{padding:0!important}
 </style>`;
 replace('</head>',style+'\n</head>');
 fs.writeFileSync('/tmp/admin-patch-v322.json',JSON.stringify(edits));return h;
};
if(require.main===module){const h=module.exports();fs.writeFileSync('/tmp/admin-candidate-v322.html',h);console.log('Candidate MD5',crypto.createHash('md5').update(h).digest('hex'));}
