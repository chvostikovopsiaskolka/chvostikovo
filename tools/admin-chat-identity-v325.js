// Conversation identity follows the account's explicit dog scope, like the customer API.
function customerMessageDogsV325(conversation){
 const userId=conversation?.customer_user_id;if(!userId)return[];
 const links=(state.customerOwnerLinks||[]).filter(l=>String(l.user_id)===String(userId));
 return (state.dogs||[]).filter(d=>d.active!==false&&links.some(l=>
  Number(l.owner_id)===Number(d.owner_id)&&
  (l.allowed_dog_ids==null||(Array.isArray(l.allowed_dog_ids)&&l.allowed_dog_ids.map(Number).includes(Number(d.id))))
 ));
}
function customerMessageLabel(conversation){
 const profile=(state.customerProfiles||[]).find(p=>p.user_id===conversation?.customer_user_id);
 const first=String(profile?.full_name||'Majiteľ').trim().split(/\s+/)[0]||'Majiteľ';
 const dogs=customerMessageDogsV325(conversation).map(d=>d.name);
 return first+(dogs.length?' • '+dogs.join(', '):'');
}
