const endpoint = "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";
const origin = "https://chvostikovo.sk";
const phone = "+421915349028";

async function post(payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ ...payload, dry_run: true }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok !== true || body?.dry_run !== true) {
    throw new Error(`Live form smoke test failed [${response.status}]: ${JSON.stringify(body)}`);
  }
}

for (const interest_reason of [
  "Chcem sa dozvedieť viac o psej škôlke",
  "Mám záujem o pravidelné návštevy",
  "Potrebujem škôlku občas",
  "Potrebujem jednorazové stráženie",
  "Mám záujem o škôlku pre šteniatko",
]) {
  await post({
    form_type: "lead",
    owner_name: "Automated smoke test",
    phone,
    consent: true,
    source_ref: "/automated-smoke-test",
    interest_reason,
    marketing_consent: false,
  });
}

const application = {
  form_type: "application",
  owner_name: "Automated smoke test",
  phone,
  consent: true,
  source_ref: "/automated-smoke-test",
  dog_name: "Rocky",
  dog_sex: "Pes",
  dog_age_text: "2 roky",
  dog_neutered: "Áno",
  interest_reason: "Pravidelne – 1 až 2× týždenne",
  dog_info: "Automated smoke test.",
  marketing_consent: false,
};
// Old open browser tabs and the new separated fields must both keep working.
await post({ ...application, dog_breed_weight: "Labrador, 25 kg" });
for (const dog_weight_kg of [25, "25 kg", "25,5 kg"]) {
  await post({ ...application, dog_breed: "Labrador", dog_weight_kg });
}

console.log("Live web-form-submit smoke tests passed.");
