const fs=require('fs'),assert=require('assert/strict');
module.exports=function(){
 let h=require('zlib').gunzipSync(fs.readFileSync('supabase/admin-snapshots/admin-before-v321.html.gz')).toString('utf8');
 const old=require('zlib').gunzipSync(fs.readFileSync('supabase/admin-snapshots/admin-before-v321.html.gz')).toString('utf8');
 assert.equal(require('crypto').createHash('md5').update(h).digest('hex'),'6c8ab60f9f7b4b5064346562daa38105');
 const start=h.indexOf('async function renderAdminVaccinationProofsV104(dogId){'),end=h.indexOf('\nfunction adminCustomerContactsForOwnerV59',start);assert(start>0&&end>start);
 h=h.slice(0,start)+fs.readFileSync('tools/admin-proofs-v321.js','utf8')+`
async function renderAdminVaccinationProofsV104(dogId){
 const root=$('adminVaccinationProofsV104');if(!root)return;
 if(root.dataset.loadingDog===String(dogId)||adminProofBusyV321.has(Number(dogId)))return;
 if(root.dataset.loadedDog===String(dogId)&&Date.now()-Number(root.dataset.loadedAt||0)<5*60*1000)return;
 root.dataset.loadingDog=String(dogId);
 try{
  const rows=await adminVaccinationProofRowsV104(dogId);
  if(!root.isConnected||root!==$('adminVaccinationProofsV104'))return;
  drawAdminProofsV321(root,dogId,rows);root.dataset.loadedDog=String(dogId);root.dataset.loadedAt=String(Date.now());
 }catch(error){if(root.isConnected){let msg=root.querySelector('.admin-proof-message-v321');if(!msg){msg=document.createElement('div');msg.className='error';root.append(msg)}msg.textContent=error.message||'Fotografie sa nepodarilo načítať.'}}
 finally{delete root.dataset.loadingDog}
}
`+h.slice(end);
 const style=`<style id="admin-proof-management-v321">
 #adminVaccinationProofsV104 .admin-vacc-proof-grid-v104{display:grid;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:calc((100% - 18px)/3);gap:9px;overflow-x:auto;padding:2px 0 6px;scroll-snap-type:x proximity}
 .admin-proof-tile-v321{position:relative;min-width:0;scroll-snap-align:start}.admin-proof-tile-v321 .admin-vacc-proof-thumb-v104{width:100%;display:block;min-width:0}
 .admin-proof-pencil-v321{position:absolute;right:2px;top:2px;width:44px;height:44px;border:1px solid #fed7aa;border-radius:50%;background:#fff7ed;color:#ea580c;font-size:22px;padding:0;display:grid;place-items:center}
 .admin-proof-add-v321{display:inline-flex!important;margin:8px 0;position:relative;cursor:pointer}.admin-proof-add-v321[hidden]{display:none!important}
 .admin-proof-file-v321{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);padding:0;border:0}
 .admin-proof-modal-v321{position:fixed;inset:0;z-index:10010;display:grid;place-items:center;padding:calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom));background:rgba(17,24,39,.65)}
 .admin-proof-modal-v321.hidden{display:none!important}.admin-proof-card-v321{width:min(440px,100%);max-height:86dvh;overflow-y:auto;background:#fff;border-radius:22px;padding:18px;box-sizing:border-box;display:grid;gap:12px}
 .admin-proof-card-v321 h3{margin:0;font-size:18px}.admin-proof-edit-preview-v321{width:100%;height:200px;object-fit:contain}.admin-proof-rotate-v321{display:flex;gap:8px}.admin-proof-rotate-v321>*{flex:1}.admin-proof-replace-v321{position:relative;cursor:pointer;text-align:center}
 .admin-proof-card-v321 [hidden]{display:none!important}.admin-proof-card-v321 [data-proof-delete]{color:#be123c;border-color:#fecdd3}
 .admin-proof-card-v321 button,.admin-proof-card-v321 label,#adminVaccinationProofsV104 button,#adminVaccinationProofsV104 label,.admin-proof-file-v321,.admin-proof-file-v321::file-selector-button{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
 .admin-proof-card-v321 label:has(input:focus-visible),#adminVaccinationProofsV104 label:has(input:focus-visible){outline:3px solid #fb923c;outline-offset:3px}
 </style>`;
 assert(!old.includes('admin-proof-management-v321'));h=h.replace('</head>',style+'\n</head>');
 assert(h.includes('admin-proof-management-v321'));
 return h;
};
if(require.main===module){fs.writeFileSync('/tmp/admin-candidate-v321.html',module.exports());console.log('Built admin v321');}
