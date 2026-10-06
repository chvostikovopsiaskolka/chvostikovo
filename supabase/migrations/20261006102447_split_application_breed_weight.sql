-- Preserve existing table permissions and RLS while adding separate weight data.
alter table public.web_form_submissions add column dog_weight_kg numeric;
alter table public.web_form_submissions add constraint web_form_submissions_dog_weight_check
  check (dog_weight_kg is null or (dog_weight_kg > 0 and dog_weight_kg <= 150));
alter table public.intro_visits add column weight_kg numeric;
alter table public.intro_visits add constraint intro_visits_weight_kg_check
  check (weight_kg is null or (weight_kg > 0 and weight_kg <= 150));

-- Keep the existing staff authorization and fill only a missing dog's weight.
do $migration$
declare definition text;
begin
  select pg_get_functiondef('public.portal_link_existing_dog(uuid,bigint)'::regprocedure) into definition;
  if strpos(definition,'weight_kg=coalesce(weight_kg,v_submission.weight_kg),') = 0 then
    raise exception 'portal_link_existing_dog changed; review before updating';
  end if;
  definition := replace(definition,
    'weight_kg=coalesce(weight_kg,v_submission.weight_kg),',
    'weight_kg=coalesce(weight_kg,v_submission.weight_kg,v_web.dog_weight_kg),');
  execute definition;
end;
$migration$;
