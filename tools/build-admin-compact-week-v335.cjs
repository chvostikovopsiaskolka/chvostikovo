const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const before=require('./build-admin-owner-review-v334.cjs').after;
assert.equal(crypto.createHash('md5').update(before).digest('hex'),'4150da4d54264d3f51d790e8c077923a');
const css=`<style id="admin-compact-week-v335">
/* Reserve the cancellation control's column before fitting names and badges. */
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .card.dog>.row.between{display:grid!important;grid-template-columns:36px minmax(48px,1fr) minmax(0,auto);align-items:center;gap:7px;flex-wrap:nowrap!important}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .card.dog>.row.between>.grow{min-width:0}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .card.dog h3{font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .reservation-side{display:flex!important;align-items:center;justify-content:flex-end;flex-wrap:nowrap!important;gap:4px;min-width:0;width:100%!important;max-width:none!important}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .reservation-side .pill{flex:0 1 auto!important;min-width:0;font-size:10px!important;padding:4px 5px!important;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .reservation-side .cancel-reservation{flex:0 0 30px;min-width:30px;width:30px;padding:0;min-height:44px}
:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .card.dog>.row.between>:first-child{max-width:36px;min-width:0}
.week-capacity-head-v322{flex-wrap:nowrap;gap:8px}.week-capacity-head-v322 .section-title{font-size:13px;white-space:nowrap}
#defaultCapacityV322{display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;min-height:44px;padding:6px 10px}
#defaultCapacityV322 span{font-size:10px}#defaultCapacityV322 strong{font-size:16px;white-space:nowrap}
.admin-taxi-v329{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.admin-taxi-v329>div{display:contents}.admin-taxi-v329 button{font-size:9px;line-height:1.25;min-height:52px;padding:6px 3px;overflow-wrap:anywhere}
.admin-taxi-v329 .taxi-none-v329{margin:0;padding:6px 3px}.admin-taxi-v329 button b{margin-top:3px}
@media(max-width:350px){:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .card.dog h3{font-size:11px}:is(#weekList,#nextWeekList,#todayList,#tomorrowList) .reservation-side .pill{font-size:8px!important;padding:3px 4px!important}.week-capacity-head-v322 .section-title{font-size:11px}.admin-taxi-v329 button{font-size:8px}}
</style>`;
const patches=[['20261021-owner-review-v334','20261021-compact-week-v335'],['</body>',css+'</body>']];let after=before;
for(const [a,b] of patches){assert.equal(after.split(a).length,2);after=after.replace(a,b)}
const md5=crypto.createHash('md5').update(after).digest('hex');
if(require.main===module){fs.writeFileSync('/tmp/admin-candidate-v335.html',after);let sql="DO $guard335$ DECLARE source text;candidate text;BEGIN SELECT html INTO source FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;IF md5(source)<>'4150da4d54264d3f51d790e8c077923a' THEN RAISE EXCEPTION 'Newer live admin exists';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-compact-week-v335-20261021',source);candidate:=source;\n";
patches.forEach(([a,b],i)=>{const x='$old335_'+i+'$',y='$new335_'+i+'$';sql+='IF (length(candidate)-length(replace(candidate,'+x+a+x+",'')))<>length("+x+a+x+") THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,"+x+a+x+','+y+b+y+');\n';});sql+="IF md5(candidate)<>'"+md5+"' THEN RAISE EXCEPTION 'Candidate differs';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('staging-admin-compact-week-v335-20261021',candidate);UPDATE public.frontend_snapshots SET html=candidate,created_at=now() WHERE key='stable-v10-clean';END $guard335$;SELECT key,md5(html),length(html) FROM public.frontend_snapshots WHERE key IN ('stable-v10-clean','backup-admin-before-compact-week-v335-20261021','staging-admin-compact-week-v335-20261021');";fs.writeFileSync('supabase/changes/deploy-admin-compact-week-v335.sql',sql);console.log(JSON.stringify({md5,bytes:Buffer.byteLength(after)}));}
module.exports={before,after,md5};
