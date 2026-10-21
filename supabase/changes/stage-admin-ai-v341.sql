INSERT INTO public.frontend_snapshots(key,html) SELECT 'staging-admin-ai-referral-v341-20261021',replace(replace(replace(replace(html,$old$content="20261021-access-limits-v336"$old$,$new$content="20261021-ai-referral-v341"$new$),$old$const sourceGroups={meta_paid:$old$,$new$const sourceGroups={ai_referral:'AI vyhľadávanie',meta_paid:$new$),$old$function web(p,from,to,$old$,$new$function aiSearchV341(p,from,to,page){
 const entries=rows(p,'ai_landings',from,to,page),contacts=rows(p,'ai_forms',from,to,page);
 const providers={chatgpt:'ChatGPT / OpenAI',perplexity:'Perplexity',gemini:'Gemini',claude:'Claude',copilot:'Copilot'};
 const total=sum(entries,'landings'),leads=sum(contacts,'submissions');
 const sources=new Map(),paths=new Map();
 for(const r of entries){sources.set(r.provider,(sources.get(r.provider)||0)+Number(r.landings));paths.set(r.path,(paths.get(r.path)||0)+Number(r.landings))}
 const list=(map,names)=>[...map].sort((a,b)=>b[1]-a[1]).map(([key,value])=>'<div class="t266-source"><span style="min-width:0;overflow-wrap:anywhere">'+s(names?.[key]||key)+'</span><b>'+n(value)+'</b></div>').join('');
 const body='<div class="t266-kpis">'+kpi('Identifikované vstupy',n(total))+kpi('AI zdroje',n(sources.size))+kpi('Odoslané záujmy',n(leads))+'</div>';
 const detail=total?'<div class="t266-twocol"><div><h4>Zdroje</h4>'+list(sources,providers)+'</div><div><h4>Vstupné stránky</h4>'+list(paths)+'</div></div>':empty('V tomto období nemáme identifikované vstupy z AI.');
 const formSources=new Map();for(const r of contacts)formSources.set(r.provider,(formSources.get(r.provider)||0)+Number(r.submissions));
 return panel('AI vyhľadávanie',Array.isArray(p.ai_landings)&&Array.isArray(p.ai_forms)?body+detail+(leads?'<h4>Odoslané záujmy podľa zdroja</h4>'+list(formSources,providers):'')+'<small>Len identifikované prekliky, nie všetky odporúčania AI ani jedineční ľudia.</small>':empty('AI prehľad nie je v tomto reporte dostupný.'));
}
function web(p,from,to,$new$),$old$+pageBars(all)+donut(traffic)+clicks(activity)+forms(activity,contacts);$old$,$new$+pageBars(all)+donut(traffic)+(!report?aiSearchV341(p,from,to,page):'')+clicks(activity)+forms(activity,contacts);$new$) FROM public.frontend_snapshots WHERE key='stable-v10-clean' AND md5(html)='84a2c9c9c0d483eeaf15835221ceb610' AND NOT EXISTS(SELECT 1 FROM public.frontend_snapshots WHERE key='staging-admin-ai-referral-v341-20261021') RETURNING key,md5(html),length(html);
