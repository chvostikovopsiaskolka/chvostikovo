const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const md5=h=>crypto.createHash('md5').update(h).digest('hex');
module.exports=function(){
 let h=require('./build-admin-loader-v323.cjs')();
 for(const e of JSON.parse(fs.readFileSync('tools/admin-live-payment-v324.json','utf8'))){assert.equal(h.split(e.old).length,2);h=h.replace(e.old,e.new)}
 assert.equal(md5(h),'b6b70f76d1f6caab8045571e0df6931c','Exact current live v324 baseline');
 const edits=[];function replace(old,next){assert.equal(h.split(old).length,2,'Unique anchor '+old.slice(0,80));h=h.replace(old,next);edits.push({old,new:next})}
 replace('window.adminMessageRuntime={label:customerMessageLabel,','window.adminMessageRuntime={dogs:customerMessageDogsV325,label:customerMessageLabel,');
 const start=h.indexOf('function customerMessageLabel(conversation){'),end=h.indexOf('function customerMessageProfile(',start);
 replace(h.slice(start,end),fs.readFileSync('tools/admin-chat-identity-v325.js','utf8')+'\n');
 replace("    const ownerIds=new Set((state.customerOwnerLinks||[]).filter(l=>String(l.user_id)===String(conversation.customer_user_id)).map(l=>Number(l.owner_id)));\n    return (state.dogs||[]).find(d=>ownerIds.has(Number(d.owner_id))&&d.active!==false)||(state.dogs||[]).find(d=>ownerIds.has(Number(d.owner_id)))||null;",'    return window.adminMessageRuntime.dogs(conversation)[0]||null;');
 replace("    const photo=mainPhoto||ownerPhotos[0]||'';",`    const conversation=(state.portalConversations||[]).find(c=>Number(c.id)===Number(conversationId));
    const profile=(state.customerProfiles||[]).find(p=>p.user_id===conversation?.customer_user_id);
    const personal=(dog?.owner_photos||[]).filter(p=>profile?.full_name&&p.owner_name===profile.full_name&&p.photo_url);
    const photo=String((personal.length===1?personal[0].photo_url:'')||mainPhoto||ownerPhotos[0]||'');`);
 replace("    avatar.innerHTML=photo?'<img src=\"'+esc(photo)+'\" alt=\"'+esc(dog?.name||'Psík')+'\">':'🐾';",`    const key=JSON.stringify([dog?.id||null,dog?.photo_path||'',dog?.photo_updated_at||'',personal.length===1?personal[0].updated_at||'':'',dog?.name||'',photo.split('?')[0]]);
    if(avatar.dataset.identityKey===key)return;
    avatar.dataset.identityKey=key;
    avatar.innerHTML=photo?'<img src="'+esc(photo)+'" alt="'+esc(dog?.name||'Psík')+'">':'🐾';`);
 replace("    const signature=rows.map(m=>m.id+':'+(m.read_at||'')+':'+m.sender_role+':'+m.body).join('|');if(!force&&signature===chatSignatureV48)return;", "    setAdminChatDogAvatarV66(activeChatConversationV48);setAdminChatCallV68(activeChatConversationV48);\n    const signature=rows.map(m=>m.id+':'+(m.read_at||'')+':'+m.sender_role+':'+m.body).join('|');if(!force&&signature===chatSignatureV48)return;");
 fs.writeFileSync('/tmp/admin-patch-v325.json',JSON.stringify(edits));return h;
};
if(require.main===module){const h=module.exports();fs.writeFileSync('/tmp/admin-candidate-v325.html',h);console.log('Candidate',md5(h))}
