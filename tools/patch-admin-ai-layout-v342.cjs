const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const before=fs.readFileSync(process.argv[2],'utf8');
assert.equal(crypto.createHash('md5').update(before).digest('hex'),'17ef940be116618aa0fadd8f281513fa');
const css=`<style id="ai-report-layout-v342">
.t266-ai-panel{min-width:0;max-width:100%}
.t266-ai-panel .t266-kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.t266-ai-panel .t266-kpi{padding:12px 10px;border-radius:13px}
.t266-ai-panel .t266-kpi>span{font-size:11px;line-height:1.35;min-height:30px;margin-bottom:7px}
.t266-ai-panel .t266-kpi>strong{font-size:26px;letter-spacing:-.5px}
.t266-ai-panel .t266-twocol{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
.t266-ai-panel .t266-twocol>div{min-width:0}
.t266-ai-panel h4{margin:0 0 7px;font-size:13px}
.t266-ai-row{display:grid;grid-template-columns:minmax(0,1fr) max-content;align-items:start;gap:12px;padding:9px 0;border-bottom:1px solid #eef0f3;font-size:12px;line-height:1.5;min-width:0}
.t266-ai-row>span{min-width:0;overflow-wrap:anywhere;word-break:normal}
.t266-ai-row>b{white-space:nowrap;text-align:right;font-weight:800;font-variant-numeric:tabular-nums}
.t266-ai-panel>small{display:block;margin-top:14px;font-size:11px;line-height:1.5;color:#798294}
@media(max-width:350px){.t266-ai-panel .t266-kpi{padding:10px 7px}.t266-ai-panel .t266-kpi>span{font-size:10px}.t266-ai-panel .t266-kpi>strong{font-size:23px}}
@media(min-width:750px){.t266-ai-panel .t266-twocol{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}}
</style>`;
const patches=[
 ['content="20261021-ai-referral-v341"','content="20261022-ai-layout-v342"'],
 ['<div class="t266-source"><span style="min-width:0;overflow-wrap:anywhere">','<div class="t266-ai-row"><span>'],
 ["kpi('Identifikované vstupy',n(total))","kpi('Vstupy z AI',n(total))"],
 ["return panel('AI vyhľadávanie',Array.isArray(p.ai_landings)","return panel('AI vyhľadávanie','<div class=\"t266-ai-panel\">'+(Array.isArray(p.ai_landings)"],
 ["empty('AI prehľad nie je v tomto reporte dostupný.'));","empty('AI prehľad nie je v tomto reporte dostupný.'))+'</div>');"],
 ['</head>',css+'\n</head>']
];
let after=before;for(const [a,b] of patches){assert.equal(after.split(a).length,2,'unique patch: '+a);after=after.replace(a,b)}
fs.writeFileSync(process.argv[3],after);
if(process.argv[4]){
 let sql="DO $guard342$ DECLARE source text;candidate text;BEGIN SELECT html INTO source FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;IF md5(source)<>'17ef940be116618aa0fadd8f281513fa' THEN RAISE EXCEPTION 'Newer admin source exists';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-ai-layout-v342-20261022',source);candidate:=source;\n";
 patches.forEach(([a,b],i)=>{const x='$old342_'+i+'$',y='$new342_'+i+'$';sql+="IF (length(candidate)-length(replace(candidate,"+x+a+x+",'')))<>length("+x+a+x+") THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,"+x+a+x+","+y+b+y+");\n"});
 const hash=crypto.createHash('md5').update(after).digest('hex');
 sql+="IF md5(candidate)<>'"+hash+"' THEN RAISE EXCEPTION 'Candidate differs';END IF;UPDATE public.frontend_snapshots SET html=candidate,created_at=now() WHERE key='stable-v10-clean';END $guard342$;SELECT key,md5(html),length(html) FROM public.frontend_snapshots WHERE key IN ('stable-v10-clean','backup-admin-before-ai-layout-v342-20261022');";
 fs.writeFileSync(process.argv[4],sql);
}
