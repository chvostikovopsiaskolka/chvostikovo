const endpoint = "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";
const origin = "https://chvostikovo.sk";
// Synthetic non-subscriber fixture; dry_run validates without storage or delivery.
const phone = "+421000000000";

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
await post({ ...application, dog_allergies: "Nemá", dog_temperament: "Priateľský, zvyknutý na psov." });
await post({ ...application, dog_allergies: "", dog_temperament: "Priateľský." });
await post({ ...application, dog_temperament: "Priateľský." });
await post({ ...application, dog_allergies: "A".repeat(3000), dog_temperament: "P".repeat(3000), dog_info: "S".repeat(6100), raw_payload: { health: "A".repeat(3000), temperament: "P".repeat(3000) } });


const dualDogs = {
  ...application,
  dog_count: 2,
  dog_breed: "Labrador",
  dog_weight_kg: 25,
  dog_allergies: "",
  dog_temperament: "Priateľský a pokojný.",
  dogs: [
    {
      dog_name: "Rocky", dog_breed: "Labrador", dog_weight_kg: 25,
      dog_sex: "Pes", dog_age_text: "2 roky", dog_neutered: "Áno",
      interest_reason: "Pravidelne – 1 až 2× týždenne",
      dog_allergies: "", dog_temperament: "Priateľský a pokojný.",
    },
    {
      dog_name: "Beny", dog_breed: "Zlatý retriever", dog_weight_kg: 19.5,
      dog_sex: "Fenka", dog_age_text: "3 roky", dog_neutered: "Nie",
      interest_reason: "Občas podľa potreby",
      dog_allergies: "Citlivé trávenie", dog_temperament: "Pokojná, zvyknutá na psov.",
    },
  ],
};
// dry_run:true exercises the live edge validator but does NOT INSERT,
// so these checks cannot create a lead, SMS, push or customer record.
await post(dualDogs);
async function postRejected(payload, expectedError) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ ...payload, dry_run: true }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status !== 400 || body?.ok !== false || body?.error !== expectedError) {
    throw new Error(`Two-dog negative smoke test expected ${expectedError}, got [${response.status}]: ${JSON.stringify(body)}`);
  }
}
await postRejected({ ...dualDogs, dogs: [dualDogs.dogs[0]] }, "missing_second_dog");
await postRejected({ ...dualDogs, dogs: [dualDogs.dogs[0], { ...dualDogs.dogs[1], dog_weight_kg: 0 }] }, "invalid_second_dog");

console.log("Live web-form-submit smoke tests passed.");
