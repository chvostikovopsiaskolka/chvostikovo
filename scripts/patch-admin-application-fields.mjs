import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function patchAdminApplicationFields(original) {
  let html = original;
  const replacements = [];
  function replace(before, after, expected = 1) {
    const count = html.split(before).length - 1;
    if (count !== expected) throw new Error(`Admin snapshot changed: expected ${expected}, found ${count}: ${before.slice(0, 70)}`);
    html = html.split(before).join(after);
    replacements.push({ before, after });
  }
  function field(id, label, placeholder, value = "") {
    return `<div><label class="muted small" for="${id}">${label}</label><input id="${id}" class="input" placeholder="${placeholder}"${id.includes("Weight") ? ' inputmode="decimal"' : ""}${value ? ` value="${value}"` : ""}></div>`;
  }
  replace("dog_name,dog_breed,dog_sex", "dog_name,dog_breed,dog_weight_kg,dog_sex");
  replace("notes,breed,sex,neutered,age_years", "notes,breed,weight_kg,sex,neutered,age_years", 3);
  replace('<input id="newDogBreed" class="input" placeholder="Plemeno a váha (ako v prihláške)">', `<div class="grid2">${field("newDogBreed", "Plemeno", "Labrador")}${field("newDogWeightKg", "Váha", "25 kg")}</div>`);
  replace('<div><label class="muted small" for="introDogBreed">Plemeno a váha</label><input id="introDogBreed" class="input" placeholder="Napr. kríženec, 12 kg"></div>', `<div class="grid2">${field("introDogBreed", "Plemeno", "Labrador")}${field("introDogWeightKg", "Váha", "25 kg")}</div>`);
  replace('<div><label class="muted small" for="editIntroBreed">Plemeno a váha</label><input id="editIntroBreed" class="input" value="${esc(v.breed||\'\')}"></div>', `<div class="grid2">${field("editIntroBreed", "Plemeno", "Labrador", "${esc(parseAdminBreedWeight(v.breed).breed||'')}")}${field("editIntroWeightKg", "Váha", "25 kg", "${esc(v.weight_kg??parseAdminBreedWeight(v.breed).weight_kg??'')}")}</div>`);
  replace("$('introDogBreed').value=s.dog_breed||'';", "$('introDogBreed').value=parseAdminBreedWeight(s.dog_breed).breed||'';\n  $('introDogWeightKg').value=s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg??'';");
  replace("$('newDogBreed').value=s.dog_breed||'';", "$('newDogBreed').value=parseAdminBreedWeight(s.dog_breed).breed||'';\n  $('newDogWeightKg').value=s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg??'';");
  replace("$('newDogBreed').value=intro.breed||source?.dog_breed||'';", "$('newDogBreed').value=parseAdminBreedWeight(intro.breed||source?.dog_breed).breed||'';\n    $('newDogWeightKg').value=intro.weight_kg??source?.dog_weight_kg??parseAdminBreedWeight(intro.breed||source?.dog_breed).weight_kg??'';");
  replace("...parseAdminBreedWeight($('newDogBreed').value),", "breed:$('newDogBreed').value.trim()||null,weight_kg:parseAdminDogWeightKg($('newDogWeightKg').value),");
  replace("if(!name){m.innerHTML='<div class=\"error\">Zadaj meno psa.</div>';return}", "if(!name){m.innerHTML='<div class=\"error\">Zadaj meno psa.</div>';return}\n  if($('newDogWeightKg').value.trim()&&parseAdminDogWeightKg($('newDogWeightKg').value)===null){m.innerHTML='<div class=\"error\">Zadajte platnú váhu v kilogramoch.</div>';return}");
  replace("const source_submission_id=state.convertingSubmissionId||null;", "if($('introDogWeightKg').value.trim()&&parseAdminDogWeightKg($('introDogWeightKg').value)===null){m.innerHTML='<div class=\"error\">Zadajte platnú váhu v kilogramoch.</div>';return}\n  const source_submission_id=state.convertingSubmissionId||null;");
  replace("owner_phone:phone,notes,breed,sex:", "owner_phone:phone,notes,breed,weight_kg:parseAdminDogWeightKg($('introDogWeightKg').value),sex:");
  replace("const payload={dog_name,owner_name,owner_phone,notes,breed,sex,neutered:", "if($('editIntroWeightKg').value.trim()&&parseAdminDogWeightKg($('editIntroWeightKg').value)===null){msg.innerHTML='<div class=\"error\">Zadajte platnú váhu v kilogramoch.</div>';return}const payload={dog_name,owner_name,owner_phone,notes,breed,weight_kg:parseAdminDogWeightKg($('editIntroWeightKg').value),sex,neutered:");
  replace("function parseAdminBreedWeight(value){", String.raw`function parseAdminDogWeightKg(value){
  const raw=String(value??'').trim().replace(/\s*kg\s*$/i,'').trim();
  if(!/^\d+(?:[.,]\d+)?$/.test(raw))return null;
  const weight=Number(raw.replace(',','.'));
  return Number.isFinite(weight)&&weight>0&&weight<=150?weight:null;
}
function parseAdminBreedWeight(value){`);
  replace("const breed=String(match[1]||'').replace(/[\\s,;|\\/-]+$/,'').trim();", "const breed=String(match[1]||'').replace(/[\\s,;|\\/-]+$/,'').replace(/\\s+cca\\.?$/i,'').replace(/[\\s,;|\\/-]+$/,'').trim();");
  replace("'<div class=\"row between history-row\"><span>Plemeno a váha</span><strong>'+esc(s.dog_breed||'—')+'</strong></div>'+", "'<div class=\"row between history-row\"><span>Plemeno</span><strong>'+esc(parseAdminBreedWeight(s.dog_breed).breed||'—')+'</strong></div>'+\n     '<div class=\"row between history-row\"><span>Váha</span><strong>'+esc((s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)!=null?(s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)+' kg':'—')+'</strong></div>'+" );
  replace("<span>Plemeno a váha</span><b>'+esc(s.dog_breed||'—')+'</b></div>", "<span>Plemeno</span><b>'+esc(parseAdminBreedWeight(s.dog_breed).breed||'—')+'</b></div><div class=\"row between history-row\"><span>Váha</span><b>'+esc((s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)!=null?(s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)+' kg':'—')+'</b></div>");
  return { html, replacements };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { html, replacements } = patchAdminApplicationFields(readFileSync(process.argv[2], "utf8"));
  writeFileSync(process.argv[3], html);
  if (process.argv[4]) writeFileSync(process.argv[4], JSON.stringify(replacements));
  console.log(`Admin application fields updated with ${replacements.length} checked replacements.`);
}
