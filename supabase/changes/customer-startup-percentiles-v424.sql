-- Private read-only report. No raw/account data, no writes, no public grants.
-- DRAFT: collector extension has not been applied to production.
-- Successful starts are sampled at 10% of document loads, max8 startup spans/10min.
-- Failed/interrupted starts use a different sampling rate: do not infer failure
-- percentages from these counts. Always display sample counts with percentiles.
with windows(days) as (values(7),(30)), samples as (
 select w.days,e.build,e.platform,e.browser,split_part(e.operation,'/',2) kind,
        split_part(e.operation,'/',3) stage,e.category,e.duration_ms
 from windows w join private.app_telemetry_v345 e on e.received_at>=now()-make_interval(days=>w.days)
 where e.app='customer' and e.category in ('startup.complete','startup.failed','startup.interrupted')
   and e.operation ~ '^startup/(cold|reload|resume|refresh|recovery)/(total|api|data|photos)$'
)
select days,build,platform,browser,kind,stage,category,count(*) sample_count,
       case when category='startup.complete' then percentile_cont(0.50) within group(order by duration_ms) end p50_ms,
       case when category='startup.complete' then percentile_cont(0.75) within group(order by duration_ms) end p75_ms,
       case when category='startup.complete' then percentile_cont(0.95) within group(order by duration_ms) end p95_ms
from samples group by days,build,platform,browser,kind,stage,category
order by days,build,platform,browser,kind,stage,category;
