function renderDefaultCapacityV322(){
 const b=$('defaultCapacityV322');if(!b)return;
 b.innerHTML='<span>Kapacita miest</span><strong>'+Number(state.defaultCapacity??8)+' ✎</strong>';
 b.onclick=editDefaultCapacityV322;
}
async function editDefaultCapacityV322(){
 const raw=prompt('Všeobecná kapacita miest (1 až 30). Denné výnimky zostanú zachované:',String(state.defaultCapacity??8));
 if(raw===null)return;const value=Number(raw);
 if(!Number.isInteger(value)||value<1||value>30){alert('Kapacita musí byť celé číslo od 1 do 30.');return}
 const b=$('defaultCapacityV322');if(b)b.disabled=true;
 try{const {error}=await withJwtRetry(()=>supabase.rpc('portal_set_default_capacity_v322',{p_capacity:value}));if(error)throw error;
 state.defaultCapacity=value;renderWeek();
 }catch(error){alert('Kapacitu sa nepodarilo uložiť: '+(error.message||String(error)))}
 finally{if(b)b.disabled=false}
}
