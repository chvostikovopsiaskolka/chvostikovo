const fs=require('fs');let s=fs.readFileSync(process.argv[2]||'../live-admin.html','utf8');
if(require('crypto').createHash('md5').update(s).digest('hex')!=='ad0e44ab84c454b75b747b3f08da254d')throw Error('Admin snapshot checksum changed: fetch and review current LIVE source.');
function exact(old,next){if(!s.includes(old))throw Error('Missing admin anchor: '+old.slice(0,100));s=s.split(old).join(next)}
exact("'user_id,owner_id,created_at'","'user_id,owner_id,allowed_dog_ids,created_at'");
exact('privacy_notice_acknowledged_at,created_at','privacy_notice_acknowledged_at,registration_dog_names,created_at');
exact("'id,user_id,dog_id,total_entries,status,requested_at,decided_at,decision_note'","'id,user_id,dog_id,dog_ids,total_entries,status,requested_at,decided_at,decision_note'");
exact("'id,dog_id,total_entries,used_entries,purchased_on,purchase_price,valid_from,valid_until,no_expiry,status,created_at'","'id,dog_id,total_entries,used_entries,purchased_on,purchase_price,valid_from,valid_until,no_expiry,status,created_at,pass_dogs(dog_id)'");
exact("'id,dog_id,total_entries,purchased_on,purchase_price,status'","'id,dog_id,total_entries,purchased_on,purchase_price,status,pass_dogs(dog_id)'");
exact('state.passes=new Map(); for(const p of passesRes.data||[]){ if(!state.passes.has(p.dog_id))state.passes.set(p.dog_id,[]); state.passes.get(p.dog_id).push(p) }','state.passes=window.indexSharedPassesV244(passesRes.data||[])');
exact('state.passes=new Map();for(const p of active.data||[]){if(!state.passes.has(p.dog_id))state.passes.set(p.dog_id,[]);state.passes.get(p.dog_id).push(p)}','state.passes=window.indexSharedPassesV244(active.data||[])');
exact('state.passes=new Map();for(const pass of active.data||[]){if(!state.passes.has(pass.dog_id))state.passes.set(pass.dog_id,[]);state.passes.get(pass.dog_id).push(pass)}','state.passes=window.indexSharedPassesV244(active.data||[])');
exact("esc(submission?.dog_name||'neuvedený')",'esc(registrationLabelV244(p,submission))');
exact("esc(sub?.dog_name||'neuvedený')",'esc(registrationLabelV244(p,sub))');
exact('projected_entry_number,projected_pass_total,planned_pass_request_id,taxi_mode','projected_entry_number,projected_pass_total,planned_pass_request_id,booking_group_id,taxi_mode');
exact('Uvedený psík:','Požadovaní psíkovia:');
exact('assigned=state.dogs.filter(d=>ownerIds.includes(Number(d.owner_id)))','assigned=state.dogs.filter(d=>ownerIds.includes(Number(d.owner_id))&&state.customerOwnerLinks.some(l=>l.user_id===p.user_id&&Number(l.owner_id)===Number(d.owner_id)&&(l.allowed_dog_ids===null||(l.allowed_dog_ids||[]).map(Number).includes(Number(d.id)))))');
exact('<strong>${p.total_entries}-vstupová permanentka</strong>','<strong>${p.total_entries}-vstupová permanentka</strong>${p.pass_dogs?.length===2?`<div class="muted small">Spoločná · ${esc(window.sharedPassNamesV244(p))}</div><button type="button" class="btn secondary compact" data-shared-pass-v244="${p.id}">História a plánované vstupy</button>`:""}');
exact("esc(dog?.name||'Pes')","esc(p.pass_dogs?.length===2?window.sharedPassNamesV244(p):(dog?.name||'Pes'))");
// Display the scope in both pending-pass lists, without duplicating a purchase row.
exact("Záujem o ${r.total_entries||10}-vstupovú permanentku", "${r.dog_ids?.length===2?'Spoločná pre '+r.dog_ids.map(id=>esc(dogById(id)?.name||'Psík')).join(' a '):'Individuálna'} · Záujem o ${r.total_entries||10}-vstupovú permanentku");
exact("Záujem o '+total+'-vstupovú permanentku", "'+(r.dog_ids?.length===2?'Spoločná pre '+r.dog_ids.map(id=>esc(dogById(id)?.name||'Psík')).join(' a '):'Individuálna')+' · Záujem o '+total+'-vstupovú permanentku");
// Show scope and price immediately before the staff purchase confirmation.
exact("'Potvrdiť nákup '+request.total_entries+'-vstupovej permanentky dnes?", "'Potvrdiť '+(request.dog_ids?.length===2?'spoločnú pre '+request.dog_ids.map(id=>dogById(id)?.name||'Psík').join(' a '):'individuálnu')+' '+request.total_entries+'-vstupovú permanentku za '+(Number(request.total_entries)===20?320:200)+' € dnes?");
exact('projected_entry_number,projected_pass_total,planned_pass_request_id,booking_group_id,taxi_mode','projected_entry_number,projected_pass_total,projected_pass_id,planned_pass_request_id,booking_group_id,taxi_mode');
exact('const usedBookingsFor=p=>(reservations||[]).filter(x=>', 'const usedBookingsFor=p=>[...new Map([...(reservations||[]),...(state.reservations||[])].map(x=>[Number(x.id),x])).values()].filter(x=>');
const js=fs.readFileSync('admin/shared-admin-v244.js','utf8');exact('</body>','<script>\n'+js+'\n</script>\n</body>');
fs.writeFileSync('../staged-admin-v244.html',s);console.log('Staged admin chars:',s.length);
