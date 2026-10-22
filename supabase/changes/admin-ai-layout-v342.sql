DO $guard342$ DECLARE source text;candidate text;BEGIN SELECT html INTO source FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;IF md5(source)<>'17ef940be116618aa0fadd8f281513fa' THEN RAISE EXCEPTION 'Newer admin source exists';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-ai-layout-v342-20261022',source);candidate:=source;
IF (length(candidate)-length(replace(candidate,$old342_0$content="20261021-ai-referral-v341"$old342_0$,'')))<>length($old342_0$content="20261021-ai-referral-v341"$old342_0$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_0$content="20261021-ai-referral-v341"$old342_0$,$new342_0$content="20261022-ai-layout-v342"$new342_0$);
IF (length(candidate)-length(replace(candidate,$old342_1$<div class="t266-source"><span style="min-width:0;overflow-wrap:anywhere">$old342_1$,'')))<>length($old342_1$<div class="t266-source"><span style="min-width:0;overflow-wrap:anywhere">$old342_1$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_1$<div class="t266-source"><span style="min-width:0;overflow-wrap:anywhere">$old342_1$,$new342_1$<div class="t266-ai-row"><span>$new342_1$);
IF (length(candidate)-length(replace(candidate,$old342_2$kpi('Identifikované vstupy',n(total))$old342_2$,'')))<>length($old342_2$kpi('Identifikované vstupy',n(total))$old342_2$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_2$kpi('Identifikované vstupy',n(total))$old342_2$,$new342_2$kpi('Vstupy z AI',n(total))$new342_2$);
IF (length(candidate)-length(replace(candidate,$old342_3$return panel('AI vyhľadávanie',Array.isArray(p.ai_landings)$old342_3$,'')))<>length($old342_3$return panel('AI vyhľadávanie',Array.isArray(p.ai_landings)$old342_3$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_3$return panel('AI vyhľadávanie',Array.isArray(p.ai_landings)$old342_3$,$new342_3$return panel('AI vyhľadávanie','<div class="t266-ai-panel">'+(Array.isArray(p.ai_landings)$new342_3$);
IF (length(candidate)-length(replace(candidate,$old342_4$empty('AI prehľad nie je v tomto reporte dostupný.'));$old342_4$,'')))<>length($old342_4$empty('AI prehľad nie je v tomto reporte dostupný.'));$old342_4$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_4$empty('AI prehľad nie je v tomto reporte dostupný.'));$old342_4$,$new342_4$empty('AI prehľad nie je v tomto reporte dostupný.'))+'</div>');$new342_4$);
IF (length(candidate)-length(replace(candidate,$old342_5$</head>$old342_5$,'')))<>length($old342_5$</head>$old342_5$) THEN RAISE EXCEPTION 'Patch differs';END IF;candidate:=replace(candidate,$old342_5$</head>$old342_5$,$new342_5$<style id="ai-report-layout-v342">
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
</style>
</head>$new342_5$);
IF md5(candidate)<>'9406c5b76a787660b5bc7d8ed40f5dfa' THEN RAISE EXCEPTION 'Candidate differs';END IF;UPDATE public.frontend_snapshots SET html=candidate,created_at=now() WHERE key='stable-v10-clean';END $guard342$;SELECT key,md5(html),length(html) FROM public.frontend_snapshots WHERE key IN ('stable-v10-clean','backup-admin-before-ai-layout-v342-20261022');