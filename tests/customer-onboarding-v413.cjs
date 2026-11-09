const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const app=read('app.js'),html=read('index.html'),api=read('supabase/functions/customer-portal-api/index.ts'),locale=read('customer-locale-v409.js');
assert(app.includes("if(savedMode==='details'){"),'required profile fields validated in normal editing and onboarding');
assert(app.includes("if(!birthDate||!breed||!sex)"),'date, breed and sex are required');
assert(app.includes("if(weightText&&(!Number.isFinite(weight)||weight<=0||weight>150))"),'invalid entered weight rejected');
assert(!app.includes("!birthDate||!breed||!Number.isFinite(weight)"),'empty optional weight no longer blocks onboarding');
assert(app.includes("await api({action:'set_dog_details_prompt',dog_id:dogId,skipped:false});"),'core profile persisted independently of vaccines');
assert(app.includes("const detailsDog=dogs.find(d=>!detailsAlreadyComplete(d))"),'profile gate tests core fields, not vaccines');
assert(app.includes("const vaccineDog=dogs.find(d=>!customerVaccinationsCompleteV96(d)"),'vaccine gate is distinct');
assert(app.includes("showDetailsPrompt(vaccineDog,'vaccinations')"),'returning user receives vaccine-only prompt');
assert(app.includes("postponedVaccinationsV413.clear()"),'background/resume clears vaccine deferral');
assert(app.includes("vaccinePromptKeyV413=dogId=>String(state.session?.user?.id||'')+':'+Number(dogId)"),'deferral is scoped to account and dog');
assert(app.includes("window.customerPostponeVaccinationsV413?.(dog.id)"),'vaccine editor defer is wired');
assert(app.includes("if(window.customerVaccinationsCompleteV96&&!window.customerVaccinationsCompleteV96(dog))"),'reservation validation is preserved');
assert(api.includes("if (!dogId || !await ownsDog(userId, dogId))"),'profile completion endpoint enforces ownership');
assert(api.includes("details_prompt_answered_at: answeredAt"),'profile completion writes persisted row');
for(const id of ['dogName','dogBirthDate','dogBreed','dogSex']){
 assert(new RegExp('for="'+id+'"[^>]*>[^<]+<span class="dog-required-marker-v413"').test(html),'missing required marker '+id);
}
assert(html.includes('for="dogWeight">Váha (kg) <small class="dog-optional-v413">(nepovinné)</small>'),'weight labelled optional');
assert(html.includes('id="dogVaccinationsLaterV413"'),'vaccination editor defer button exists');
assert(app.includes('id="dogDetailsOnboardingLaterV413"'),'vaccination prompt defer button exists');
assert(locale.includes('"Zadám neskôr","I\'ll add them later"'),'EN defer label exists');
console.log('PASS v413 dog onboarding contract: optional weight, separate vaccine prompt, resume and booking gate');
