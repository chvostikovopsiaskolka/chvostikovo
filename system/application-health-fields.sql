-- Additive change: preserve legacy dog_info, notes, rows, and existing RLS.
alter table public.web_form_submissions
  add column if not exists dog_allergies text,
  add column if not exists dog_temperament text;
alter table public.intro_visits
  add column if not exists allergies text,
  add column if not exists temperament text;

comment on column public.web_form_submissions.dog_allergies is 'Owner-provided allergies and health restrictions, separate from temperament.';
comment on column public.web_form_submissions.dog_temperament is 'Owner-provided temperament and other information, separate from staff notes.';
comment on column public.intro_visits.allergies is 'Health restrictions copied from the application; retained for conversion into dogs.allergies.';
comment on column public.intro_visits.temperament is 'Temperament copied from the application; retained for conversion into dogs.temperament.';

alter table public.web_form_submissions
  add constraint web_form_dog_care_lengths check (
    (dog_allergies is null or length(dog_allergies) <= 3000) and
    (dog_temperament is null or length(dog_temperament) <= 3000)
  );
alter table public.intro_visits
  add constraint intro_dog_care_lengths check (
    (allergies is null or length(allergies) <= 3000) and
    (temperament is null or length(temperament) <= 3000)
  );
