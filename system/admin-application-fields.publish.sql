do $publish$
declare current_html text;
begin
  select html into current_html from public.frontend_snapshots where key='stable-v10-clean' for update;
  if md5(current_html) <> 'a0a88bef39a030abab9a34e21fb6e89e' then raise exception 'Admin snapshot changed; review before publishing'; end if;
  current_html := replace(current_html,$before_0$dog_name,dog_breed,dog_sex$before_0$,$after_0$dog_name,dog_breed,dog_weight_kg,dog_sex$after_0$);
  current_html := replace(current_html,$before_1$notes,breed,sex,neutered,age_years$before_1$,$after_1$notes,breed,weight_kg,sex,neutered,age_years$after_1$);
  current_html := replace(current_html,$before_2$<input id="newDogBreed" class="input" placeholder="Plemeno a váha (ako v prihláške)">$before_2$,$after_2$<div class="grid2"><div><label class="muted small" for="newDogBreed">Plemeno</label><input id="newDogBreed" class="input" placeholder="Labrador"></div><div><label class="muted small" for="newDogWeightKg">Váha</label><input id="newDogWeightKg" class="input" placeholder="25 kg" inputmode="decimal"></div></div>$after_2$);
  current_html := replace(current_html,$before_3$<div><label class="muted small" for="introDogBreed">Plemeno a váha</label><input id="introDogBreed" class="input" placeholder="Napr. kríženec, 12 kg"></div>$before_3$,$after_3$<div class="grid2"><div><label class="muted small" for="introDogBreed">Plemeno</label><input id="introDogBreed" class="input" placeholder="Labrador"></div><div><label class="muted small" for="introDogWeightKg">Váha</label><input id="introDogWeightKg" class="input" placeholder="25 kg" inputmode="decimal"></div></div>$after_3$);
  current_html := replace(current_html,$before_4$<div><label class="muted small" for="editIntroBreed">Plemeno a váha</label><input id="editIntroBreed" class="input" value="${esc(v.breed||'')}"></div>$before_4$,$after_4$<div class="grid2"><div><label class="muted small" for="editIntroBreed">Plemeno</label><input id="editIntroBreed" class="input" placeholder="Labrador" value="${esc(parseAdminBreedWeight(v.breed).breed||'')}"></div><div><label class="muted small" for="editIntroWeightKg">Váha</label><input id="editIntroWeightKg" class="input" placeholder="25 kg" inputmode="decimal" value="${esc(v.weight_kg??parseAdminBreedWeight(v.breed).weight_kg??'')}"></div></div>$after_4$);
  current_html := replace(current_html,$before_5$$('introDogBreed').value=s.dog_breed||'';$before_5$,$after_5$$('introDogBreed').value=parseAdminBreedWeight(s.dog_breed).breed||'';
  $('introDogWeightKg').value=s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg??'';$after_5$);
  current_html := replace(current_html,$before_6$$('newDogBreed').value=s.dog_breed||'';$before_6$,$after_6$$('newDogBreed').value=parseAdminBreedWeight(s.dog_breed).breed||'';
  $('newDogWeightKg').value=s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg??'';$after_6$);
  current_html := replace(current_html,$before_7$$('newDogBreed').value=intro.breed||source?.dog_breed||'';$before_7$,$after_7$$('newDogBreed').value=parseAdminBreedWeight(intro.breed||source?.dog_breed).breed||'';
    $('newDogWeightKg').value=intro.weight_kg??source?.dog_weight_kg??parseAdminBreedWeight(intro.breed||source?.dog_breed).weight_kg??'';$after_7$);
  current_html := replace(current_html,$before_8$...parseAdminBreedWeight($('newDogBreed').value),$before_8$,$after_8$breed:$('newDogBreed').value.trim()||null,weight_kg:parseAdminDogWeightKg($('newDogWeightKg').value),$after_8$);
  current_html := replace(current_html,$before_9$if(!name){m.innerHTML='<div class="error">Zadaj meno psa.</div>';return}$before_9$,$after_9$if(!name){m.innerHTML='<div class="error">Zadaj meno psa.</div>';return}
  if($('newDogWeightKg').value.trim()&&parseAdminDogWeightKg($('newDogWeightKg').value)===null){m.innerHTML='<div class="error">Zadajte platnú váhu v kilogramoch.</div>';return}$after_9$);
  current_html := replace(current_html,$before_10$const source_submission_id=state.convertingSubmissionId||null;$before_10$,$after_10$if($('introDogWeightKg').value.trim()&&parseAdminDogWeightKg($('introDogWeightKg').value)===null){m.innerHTML='<div class="error">Zadajte platnú váhu v kilogramoch.</div>';return}
  const source_submission_id=state.convertingSubmissionId||null;$after_10$);
  current_html := replace(current_html,$before_11$owner_phone:phone,notes,breed,sex:$before_11$,$after_11$owner_phone:phone,notes,breed,weight_kg:parseAdminDogWeightKg($('introDogWeightKg').value),sex:$after_11$);
  current_html := replace(current_html,$before_12$const payload={dog_name,owner_name,owner_phone,notes,breed,sex,neutered:$before_12$,$after_12$if($('editIntroWeightKg').value.trim()&&parseAdminDogWeightKg($('editIntroWeightKg').value)===null){msg.innerHTML='<div class="error">Zadajte platnú váhu v kilogramoch.</div>';return}const payload={dog_name,owner_name,owner_phone,notes,breed,weight_kg:parseAdminDogWeightKg($('editIntroWeightKg').value),sex,neutered:$after_12$);
  current_html := replace(current_html,$before_13$function parseAdminBreedWeight(value){$before_13$,$after_13$function parseAdminDogWeightKg(value){
  const raw=String(value??'').trim().replace(/\s*kg\s*$/i,'').trim();
  if(!/^\d+(?:[.,]\d+)?$/.test(raw))return null;
  const weight=Number(raw.replace(',','.'));
  return Number.isFinite(weight)&&weight>0&&weight<=150?weight:null;
}
function parseAdminBreedWeight(value){$after_13$);
  current_html := replace(current_html,$before_14$const breed=String(match[1]||'').replace(/[\s,;|\/-]+$/,'').trim();$before_14$,$after_14$const breed=String(match[1]||'').replace(/[\s,;|\/-]+$/,'').replace(/\s+cca\.?$/i,'').replace(/[\s,;|\/-]+$/,'').trim();$after_14$);
  current_html := replace(current_html,$before_15$'<div class="row between history-row"><span>Plemeno a váha</span><strong>'+esc(s.dog_breed||'—')+'</strong></div>'+$before_15$,$after_15$'<div class="row between history-row"><span>Plemeno</span><strong>'+esc(parseAdminBreedWeight(s.dog_breed).breed||'—')+'</strong></div>'+
     '<div class="row between history-row"><span>Váha</span><strong>'+esc((s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)!=null?(s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)+' kg':'—')+'</strong></div>'+$after_15$);
  current_html := replace(current_html,$before_16$<span>Plemeno a váha</span><b>'+esc(s.dog_breed||'—')+'</b></div>$before_16$,$after_16$<span>Plemeno</span><b>'+esc(parseAdminBreedWeight(s.dog_breed).breed||'—')+'</b></div><div class="row between history-row"><span>Váha</span><b>'+esc((s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)!=null?(s.dog_weight_kg??parseAdminBreedWeight(s.dog_breed).weight_kg)+' kg':'—')+'</b></div>$after_16$);
  update public.frontend_snapshots set html=current_html where key='stable-v10-clean';
end;
$publish$;
