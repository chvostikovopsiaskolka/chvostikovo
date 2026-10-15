const fs=require('node:fs'),crypto=require('node:crypto');
let html=fs.readFileSync(process.argv[2],'utf8');const changes=[];
if(crypto.createHash('md5').update(html).digest('hex')!=='a980dd1bba0686099e135ae817417067')throw Error('LIVE baseline changed');
function replace(a,b){if(!html.includes(a))throw Error('Missing anchor '+a.slice(0,90));changes.push([a,b]);html=html.replace(a,b)}
replace('var db,rows=[],current=null,loaded=false,cache={};','var db,rows=[],current=null,loaded=false,cache={},publishedDraftsV247=new Map();');
replace("function reset(){current=null;", "window.chvoIsPublishedDraftV247=function(){return current!=null&&publishedDraftsV247.has(String(current))};\nwindow.chvoMarkPublishedDraftsV247=function(items){publishedDraftsV247=new Map(items.filter(x=>x.source_draft_id).map(x=>[String(x.source_draft_id),x.id]));window.chvBulletinButtonV241?.()};\nwindow.chvoEditPublishedDraftV247=async function(id){try{await refresh();var row=rows.find(x=>String(x.id)===String(id));if(!row)throw Error('Koncept oznamu sa nepodarilo načítať.');get('bb116HistoryModal')?.classList.add('hidden');get('bb112Article')?.classList.add('hidden');get('bb112Modal').classList.remove('hidden');get('bb112Modal').querySelector('h2').textContent='Upraviť oznam';get('bb112File').value='';await edit(row);get('bb112Archive').checked=false;window.chvBulletinButtonV241?.();get('bb112Modal').querySelector('.bb112-scroll').scrollTop=0;get('bb112Title').focus({preventScroll:true})}catch(e){alert('Úpravu nemožno otvoriť: '+(e.message||e))}};\nfunction reset(){current=null;");
replace("listing();note('')}", "listing();note('');window.chvBulletinButtonV241?.()}");
replace("listing();note('Koncept je otvorený na úpravu.')}", "listing();note(window.chvoIsPublishedDraftV247()?'Upravujete zverejnený oznam.':'Koncept je otvorený na úpravu.');window.chvBulletinButtonV241?.()}");
replace("var result=await client().rpc('publish_bulletin_draft_v241',{p_draft_id:current,p_public_image_path:publicPath});if(result.error)throw result.error;await refresh();", "var wasPublished=window.chvoIsPublishedDraftV247();var result=await client().rpc('publish_bulletin_draft_v241',{p_draft_id:current,p_public_image_path:publicPath});if(result.error)throw result.error;publishedDraftsV247.set(String(current),result.data);await refresh();");
replace("note('Oznam zverejnený'+", "note(wasPublished?'Zmeny uložené.':('Oznam zverejnený'+");
replace("?' – zákazníkom sa zobrazí od nastaveného dátumu.':' pre zákazníkov.'));}", "?' – zákazníkom sa zobrazí od nastaveného dátumu.':' pre zákazníkov.')));}");
replace(".select('id,title,body,active,valid_from,valid_until,created_at').order('created_at'", ".select('id,title,body,active,valid_from,valid_until,created_at,source_draft_id,paper_style,image_path,cta_enabled,cta_title,cta_body,cta_button_label,cta_url').order('created_at'");
replace('var data=r.data||[],now=Date.now();', 'var data=r.data||[],now=Date.now();window.chvoMarkPublishedDraftsV247?.(data);');
replace("open.textContent='Otvoriť článok';open.addEventListener('click',function(){", "open.textContent='Otvoriť oznam';open.addEventListener('click',function(){\nif(window.chvoOpenPublishedArticleV247){window.chvoOpenPublishedArticleV247(item);return}");
replace('row.append(name,meta,open);root.append(row)', "var actions=document.createElement('div');actions.className='bb247-actions';actions.append(open);if(item.source_draft_id){var editButton=document.createElement('button');editButton.type='button';editButton.textContent='Upraviť';editButton.addEventListener('click',function(){void window.chvoEditPublishedDraftV247(item.source_draft_id)});actions.append(editButton)}row.append(name,meta,actions);root.append(row)");
replace("var copy=node.cloneNode(true),original=node.querySelector('button'),button=copy.querySelector('button');\n    if(button&&original)button.addEventListener('click',()=>original.click());", "var copy=node.cloneNode(true),originals=node.querySelectorAll('button');\n    copy.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>originals[i]?.click()));");
replace("var action=document.createElement('button');action.id='bb118PublishedAction';action.type='button';action.hidden=true;", "var action=document.createElement('button');action.id='bb118PublishedAction';action.type='button';action.hidden=true;action.style.display='none';");
replace("function draw(){\n if(!cards)return;", "window.chvoOpenPublishedArticleV247=article;\nfunction draw(){\n if(!cards)return;");
replace("save.textContent=box.checked?'Uložiť koncept':'Zdieľať oznam';", "var published=!!window.chvoIsPublishedDraftV247?.();\n save.textContent=published?'Uložiť zmeny':box.checked?'Uložiť koncept':'Zdieľať oznam';\n var archiveLabel=box.closest('label');if(archiveLabel)archiveLabel.hidden=published;\n if(published)box.checked=false;");
const style=`<style id="chvo-bulletin-live-v247-style">
#bb116HistoryModal{z-index:16000!important}
#bb112Modal{z-index:16500!important}
#bb112Article{z-index:17000!important}
#bb116ImageZoom{z-index:18000!important}
#bb116HistoryModal .bb113-old{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:14px;row-gap:4px;align-items:center;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa}
#bb116HistoryModal .bb113-old>strong{grid-column:1;grid-row:1;min-width:0;font-size:14px;line-height:1.35;overflow-wrap:anywhere}
#bb116HistoryModal .bb113-old>small{grid-column:1;grid-row:2;min-width:0;line-height:1.4;color:#6b7280;font-size:11px;margin:0}
#bb116HistoryModal .bb247-actions{grid-column:2;grid-row:1 / span 2;display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:0}
#bb116HistoryModal .bb247-actions button{margin:0!important;min-height:40px;padding:8px 10px;white-space:nowrap;border:1px solid #e2e5ea;border-radius:10px;background:#fff;color:#374151;font-size:12px;font-weight:750}
#bb116HistoryModal .bb247-actions button:last-child:not(:first-child){color:#ad3869;background:#fff6fb;border-color:#e9bad0}
#bb118PublishedAction{display:none!important}
</style>`;
replace('</body>',style+'\n</body>');
fs.writeFileSync(process.argv[3],html);fs.writeFileSync(process.argv[3]+'.replacements.json',JSON.stringify(changes));console.log(crypto.createHash('md5').update(html).digest('hex'));
