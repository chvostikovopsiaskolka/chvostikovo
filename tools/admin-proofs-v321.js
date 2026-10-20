/* v321: staff uses the same private proof records and upload API as customers. */
const adminProofBusyV321=new Set();
async function adminProofApiV321(payload){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('Prihlásenie vypršalo.');
  const response=await fetch(SUPABASE_URL+'/functions/v1/customer-portal-api',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||result.error)throw new Error(result.error||'Fotografiu sa nepodarilo uložiť.');
  return result.data;
}
function drawAdminProofsV321(root,dogId,rows){
  if(!root.isConnected||root!==$('adminVaccinationProofsV104'))return;
  const scope=String(dogId),busy=adminProofBusyV321.has(Number(dogId));
  if(root.dataset.proofDog!==scope){root.replaceChildren();root.dataset.proofDog=scope;root.innerHTML='<div class="admin-vacc-proof-count-v104"></div><div class="admin-vacc-proof-grid-v104"></div><label class="btn secondary admin-proof-add-v321">＋ Pridať fotky preukazu<input type="file" accept="image/*,.heic,.heif" multiple class="admin-proof-file-v321"></label><div class="small admin-proof-message-v321" role="status" aria-live="polite"></div>';
    root.querySelector('input').onchange=async e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)await mutateAdminProofV321(root,dogId,{files})};
  }
  root.proofRowsV321=rows;
  root.querySelector('.admin-vacc-proof-count-v104').textContent=rows.length?'Nahraté fotografie: '+rows.length:'Zatiaľ nie sú nahraté fotografie preukazu.';
  const grid=root.querySelector('.admin-vacc-proof-grid-v104'),old=new Map([...grid.children].map(el=>[el.dataset.proofId,el]));
  const keep=new Set(rows.map(p=>String(p.id)));
  [...grid.children].forEach(el=>{if(!keep.has(el.dataset.proofId))el.remove()});
  rows.forEach((p,i)=>{
    let tile=old.get(String(p.id));
    if(!tile){tile=document.createElement('div');tile.className='admin-proof-tile-v321';tile.dataset.proofId=String(p.id);tile.innerHTML='<button type="button" class="admin-vacc-proof-thumb-v104"><img><span></span></button><button type="button" class="admin-proof-pencil-v321" aria-label="Upraviť fotografiu">✎</button>'}
    const img=tile.querySelector('img'),identity=String(p.storage_path||p.image_url?.split('?')[0]||'');
    if(img.dataset.identity!==identity){img.src=p.image_url||'';img.dataset.identity=identity}
    img.alt='Očkovací preukaz '+(i+1);tile.querySelector('span').textContent='Foto '+(i+1);
    tile.querySelector('.admin-vacc-proof-thumb-v104').onclick=()=>openAdminVaccProofV104(p.image_url);
    const pencil=tile.querySelector('.admin-proof-pencil-v321');pencil.disabled=busy;pencil.onclick=()=>openAdminProofActionsV321(root,dogId,p);
    if(grid.children[i]!==tile)grid.insertBefore(tile,grid.children[i]||null);
  });
  const input=root.querySelector('input');input.disabled=busy||rows.length>=5;
  input.closest('label').hidden=rows.length>=5;
  root.setAttribute('aria-busy',String(busy));
}
function adminProofModalV321(){
  let modal=$('adminProofActionsV321');if(modal)return modal;
  document.body.insertAdjacentHTML('beforeend','<div id="adminProofActionsV321" class="admin-proof-modal-v321 hidden" role="dialog" aria-modal="true" aria-labelledby="adminProofTitleV321"><section class="admin-proof-card-v321"><div class="row between"><h3 id="adminProofTitleV321">Upraviť fotku preukazu</h3><button type="button" class="btn secondary compact" data-proof-close aria-label="Zavrieť">×</button></div><img class="admin-proof-edit-preview-v321" alt="Náhľad fotografie preukazu"><div class="admin-proof-rotate-v321"><button type="button" class="btn secondary" data-proof-left>↶ Otočiť</button><button type="button" class="btn secondary" data-proof-right>↷ Otočiť</button></div><button type="button" class="btn full" data-proof-save hidden>Uložiť úpravu</button><label class="btn secondary full admin-proof-replace-v321">Vymeniť fotku<input class="admin-proof-file-v321" type="file" accept="image/*,.heic,.heif"></label><button type="button" class="btn secondary full" data-proof-delete>Vymazať fotku</button><div role="status" class="small" data-proof-status></div></section></div>');
  modal=$('adminProofActionsV321');
  const close=()=>{if(modal.dataset.busy==='true')return;modal.classList.add('hidden');modal.proofContextV321=null;modal.previousFocusV321?.focus?.()};
  modal.querySelector('[data-proof-close]').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.stopPropagation();close()}
    if(e.key==='Tab'){const controls=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(el=>!el.hidden&&!el.closest('[hidden]'));if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  });
  return modal;
}
function openAdminProofActionsV321(root,dogId,proof){
  if(adminProofBusyV321.has(Number(dogId)))return;
  const modal=adminProofModalV321(),img=modal.querySelector('img'),save=modal.querySelector('[data-proof-save]');
  modal.previousFocusV321=document.activeElement;modal.proofContextV321={root,dogId,proof};modal.dataset.turns='0';modal.querySelector('[data-proof-status]').textContent='';img.style.transform='';img.src=proof.image_url;save.hidden=true;
  const rotate=delta=>{modal.dataset.turns=String((Number(modal.dataset.turns)+delta+4)%4);img.style.transform='rotate('+Number(modal.dataset.turns)*90+'deg)';save.hidden=modal.dataset.turns==='0'};
  modal.querySelector('[data-proof-left]').onclick=()=>rotate(-1);modal.querySelector('[data-proof-right]').onclick=()=>rotate(1);
  modal.querySelector('input').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(file)await mutateAdminProofV321(root,dogId,{files:[file],replaceId:proof.id,modal})};
  save.onclick=()=>mutateAdminProofV321(root,dogId,{proof,turns:Number(modal.dataset.turns),replaceId:proof.id,modal});
  modal.querySelector('[data-proof-delete]').onclick=()=>{if(confirm('Vymazať túto fotku očkovacieho preukazu? Ostatné fotografie a dátumy očkovaní zostanú zachované.'))void mutateAdminProofV321(root,dogId,{deleteId:proof.id,modal})};
  modal.classList.remove('hidden');modal.querySelector('[data-proof-close]').focus();
}
async function prepareAdminProofV321(file,turns=0){
  if(!file||file.size>25*1024*1024)throw new Error('Vyberte fotografiu do 25 MB.');
  // Native image decoding handles EXIF orientation and HEIC where supported, as in the customer editor.
  let source,close=()=>{},width,height;
  if(typeof createImageBitmap==='function')try{source=await createImageBitmap(file,{imageOrientation:'from-image'});width=source.width;height=source.height;close=()=>source.close()}catch(_){}
  if(!source){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Fotografiu sa nepodarilo načítať.'));reader.readAsDataURL(file)});source=new Image();await new Promise((resolve,reject)=>{source.onload=resolve;source.onerror=()=>reject(new Error('Tento formát sa nepodarilo načítať. Použite JPEG alebo Fotoaparát.'));source.src=data});width=source.naturalWidth;height=source.naturalHeight}
  try{
    if(!width||!height)throw new Error('Fotografia nemá platné rozmery.');
    const ratio=Math.min(1,1280/Math.max(width,height)),w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio)),canvas=document.createElement('canvas');
    canvas.width=turns%2?h:w;canvas.height=turns%2?w:h;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Fotografiu sa nepodarilo spracovať.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(turns*Math.PI/2);ctx.drawImage(source,-w/2,-h/2,w,h);
    let dataUrl;for(let q=.78;q>=.46;q-=.08){dataUrl=canvas.toDataURL('image/jpeg',q);if(dataUrl.length*.75<850000)break}
    if(!/^data:image\/jpeg;base64,/.test(dataUrl)||dataUrl.length*.75>1150000)throw new Error('Fotografia je príliš veľká. Skúste menší obrázok.');
    return dataUrl;
  }finally{close()}
}
async function mutateAdminProofV321(root,dogId,operation){
  dogId=Number(dogId);if(adminProofBusyV321.has(dogId))return;
  const modal=operation.modal,oldRows=root.proofRowsV321||[],message=modal?.querySelector('[data-proof-status]')||root.querySelector('.admin-proof-message-v321');
  const current=()=>root.isConnected&&root===$('adminVaccinationProofsV104')&&root.dataset.proofDog===String(dogId);
  if(!current())return;
  adminProofBusyV321.add(dogId);if(modal){modal.dataset.busy='true';modal.querySelectorAll('button,input').forEach(el=>el.disabled=true)}drawAdminProofsV321(root,dogId,oldRows);message.textContent='Ukladám…';
  try{
    let result;
    if(operation.deleteId){result=await adminProofApiV321({action:'admin_delete_vaccination_proof',dog_id:dogId,proof_id:operation.deleteId})}
    else{
      const files=operation.files||[];
      if(!operation.replaceId&&oldRows.length+files.length>5)throw new Error('Na jedného psíka možno uložiť najviac 5 fotografií.');
      if(operation.proof){const r=await fetch(operation.proof.image_url);if(!r.ok)throw new Error('Fotku sa nepodarilo načítať. Obnovte prehľad.');files.push(await r.blob())}
      const images=[];for(const file of files)images.push(await prepareAdminProofV321(file,operation.turns||0));
      if(!current())return;
      result=await adminProofApiV321({action:'upload_vaccination_proofs',dog_id:dogId,images,append:!operation.replaceId,replace_proof_id:operation.replaceId||undefined});
    }
    if(!Array.isArray(result?.proofs))throw new Error('Obnovte prehľad fotografií.');
    if(current()){root.dataset.loadedAt=String(Date.now());drawAdminProofsV321(root,dogId,result.proofs);root.querySelector('.admin-proof-message-v321').textContent=operation.deleteId?'Fotografia bola vymazaná.':'Fotografie sú uložené.'}
    if(modal){modal.classList.add('hidden');modal.proofContextV321=null;modal.previousFocusV321?.focus?.()}
  }catch(error){message.textContent=error.message||'Zmena sa nepodarila. Skúste znova.'}
  finally{adminProofBusyV321.delete(dogId);if(modal){modal.dataset.busy='false';modal.querySelectorAll('button,input').forEach(el=>el.disabled=false)}if(current())drawAdminProofsV321(root,dogId,root.proofRowsV321||oldRows)}
}
