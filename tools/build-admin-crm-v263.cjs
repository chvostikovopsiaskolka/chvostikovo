const fs=require('fs'),crypto=require('crypto');
const hash=s=>crypto.createHash('md5').update(s).digest('hex');
function build(){
 let h=fs.readFileSync('admin/stable-v10-clean-before-v257.html','utf8');
 if(hash(h)!=='e8fc02fdd98e98accf81a01f9ea38422')throw Error('Historical baseline differs');
 const sql=fs.readFileSync('supabase/changes/admin-shared-v260.sql','utf8');
 const match=sql.match(/jsonb_array_elements\('((?:''|[^'])*)'::jsonb\)/);
 if(!match)throw Error('Shared patch source missing');
 for(const p of JSON.parse(match[1].replace(/''/g,"'")).sort((a,b)=>b.start-a.start)){
  const chars=Array.from(h),old=Array.from(p.old);if(chars.slice(p.start,p.start+old.length).join('')!==p.old)throw Error('Shared source position differs');
  h=chars.slice(0,p.start).join('')+p.new+chars.slice(p.start+old.length).join('');
 }
 if(hash(h)!=='3a420f031dd671da1d0692918290f80f')throw Error('Shared baseline checksum differs');
 const exact=(old,next)=>{if(h.split(old).length!==2)throw Error('CRM anchor differs');h=h.replace(old,next)};
 exact('staff_note,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)','staff_note,waiting_for_application,crm_lead_id,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)');
 exact('</body>','<script id="chvo-crm-workflow-v263">\n'+fs.readFileSync('admin/crm-workflow-v263.js','utf8')+'\n</script>\n</body>');
 for(const p of JSON.parse(fs.readFileSync('admin/crm-pair-events-v263.json','utf8')))exact(p.old,p.new);
 if(hash(h)!=='e0cd8f3987a9b90bc17032e3a39c5484')throw Error('Final CRM checksum differs');
 return h;
}
module.exports=build;
if(require.main===module){const h=build();console.log('Admin v263',Array.from(h).length,hash(h));}
