import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function patchAdminHealthFields(original) {
  let html = original;
  const replacements = [];
  function replace(before, after, expected = 1) {
    const count = html.split(before).length - 1;
    if (count !== expected) throw new Error(`Admin snapshot changed: expected ${expected}, found ${count}: ${before.slice(0, 80)}`);
    html = html.split(before).join(after);
    replacements.push({ before, after });
  }
  function field(id, label, value = "") {
    return `<div><label class="muted small" for="${id}">${label}</label><textarea id="${id}" class="input" rows="3" maxlength="3000">${value}</textarea></div>`;
  }
  replace("interest_reason,dog_info,staff_note", "interest_reason,dog_info,dog_allergies,dog_temperament,staff_note");
  replace("owner_phone,notes,breed,weight_kg,sex", "owner_phone,notes,allergies,temperament,breed,weight_kg,sex", 3);
  replace("s.dog_breed,s.dog_info", "s.dog_breed,s.dog_info,s.dog_allergies,s.dog_temperament");
  replace('<textarea id="newDogNotes" class="input" rows="4" placeholder="Poznámky – alergie, povaha, zdravotné obmedzenia, dôležité info"></textarea>', field("newDogAllergies", "Alergie a zdravotné obmedzenia") + field("newDogTemperament", "Povaha a ďalšie informácie") + '<div><label class="muted small" for="newDogNotes">Interné poznámky / pôvodné informácie</label><textarea id="newDogNotes" class="input" rows="4" placeholder="Poznámky personálu alebo pôvodný spoločný text prihlášky"></textarea></div>');
  replace('<textarea id="introNotes" class="input" rows="3" placeholder="Poznámka – čo ste si dohodli alebo dôležité informácie"></textarea>', field("introAllergies", "Alergie a zdravotné obmedzenia") + field("introTemperament", "Povaha a ďalšie informácie") + '<textarea id="introNotes" class="input" rows="3" placeholder="Poznámka – čo ste si dohodli alebo pôvodné informácie"></textarea>');
  replace('<div><label class="muted small">Poznámka</label><textarea id="editIntroNotes"', field("editIntroAllergies", "Alergie a zdravotné obmedzenia", "${esc(v.allergies??introSourceSubmissionV62(v)?.dog_allergies??'')}") + field("editIntroTemperament", "Povaha a ďalšie informácie", "${esc(v.temperament??introSourceSubmissionV62(v)?.dog_temperament??'')}") + '<div><label class="muted small">Poznámka / pôvodné informácie</label><textarea id="editIntroNotes"');
  replace("if(s.dog_info)parts.push('Informácie o psíkovi: '+s.dog_info);", "if(s.dog_allergies==null&&s.dog_temperament==null&&s.dog_info)parts.push('Pôvodné informácie o psíkovi: '+s.dog_info);");
  replace("$('introNotes').value=webSubmissionIntroNotes(s);", "$('introNotes').value=webSubmissionIntroNotes(s);\n  $('introAllergies').value=s.dog_allergies??'';\n  $('introTemperament').value=s.dog_temperament??'';");
  replace("$('newDogNotes').value=s.dog_info||'';", "$('newDogAllergies').value=s.dog_allergies??'';\n  $('newDogTemperament').value=s.dog_temperament??'';\n  $('newDogNotes').value=s.dog_allergies==null&&s.dog_temperament==null?s.dog_info||'':'';");
  replace("$('newDogNotes').value=intro.notes||source?.dog_info||'';", "$('newDogAllergies').value=intro.allergies??source?.dog_allergies??'';\n    $('newDogTemperament').value=intro.temperament??source?.dog_temperament??'';\n    $('newDogNotes').value=intro.notes||(source?.dog_allergies==null&&source?.dog_temperament==null?source?.dog_info:'')||'';");
  replace("notes:$('newDogNotes').value.trim()||null,allergies:sourceSubmissionId?(state.webSubmissions||[]).find(s=>Number(s.id)===Number(sourceSubmissionId))?.dog_info||null:null,active:true", "notes:$('newDogNotes').value.trim()||null,allergies:$('newDogAllergies').value.trim()||null,temperament:$('newDogTemperament').value.trim()||null,active:true");
  replace("owner_phone:phone,notes,breed,weight_kg", "owner_phone:phone,notes,allergies:$('introAllergies').value.trim(),temperament:$('introTemperament').value.trim(),breed,weight_kg");
  replace("const payload={dog_name,owner_name,owner_phone,notes,breed,weight_kg", "const payload={dog_name,owner_name,owner_phone,notes,allergies:$('editIntroAllergies').value.trim(),temperament:$('editIntroTemperament').value.trim(),breed,weight_kg");
  replace("const dogInfo=isApplication&&s.dog_info\n    ?'<div class=\"history-row\"><div class=\"muted small\">Informácie o psíkovi</div><div style=\"margin-top:4px;white-space:pre-wrap\">'+esc(s.dog_info)+'</div></div>'\n    :'';", "const dogInfo=isApplication?webSubmissionCareHtml(s):'';");
  replace("(s.dog_info?'<div class=\"intro-source-section-v62\"><strong>Informácie o psíkovi</strong><p class=\"intro-source-text-v62\">'+esc(s.dog_info)+'</p></div>':'')+", "webSubmissionCareHtml(s)+");
  replace("function webSubmissionIntroNotes(s){", `function webSubmissionCareHtml(s){
  const row=(label,value)=>'<div class="history-row"><div class="muted small">'+esc(label)+'</div><div style="margin-top:4px;white-space:pre-wrap;overflow-wrap:anywhere">'+esc(value||'—')+'</div></div>';
  if(s.dog_allergies!=null||s.dog_temperament!=null)return row('Alergie a zdravotné obmedzenia',s.dog_allergies)+row('Povaha a ďalšie informácie',s.dog_temperament);
  return s.dog_info?row('Pôvodné informácie o psíkovi',s.dog_info):'';
}
function webSubmissionIntroNotes(s){`);
  return { html, replacements };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(patchAdminHealthFields(readFileSync(process.argv[2], "utf8")).replacements));
}
