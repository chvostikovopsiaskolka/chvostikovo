function showAdminAuthRetryV323(){
 const boot=$('appBoot');
 if(!boot){console.warn('Overenie personálu sa dočasne nepodarilo; relácia zostáva uložená.');return}
 if(boot.querySelector('.admin-auth-retry-v323'))return;
 const box=document.createElement('div');box.className='admin-auth-retry-v323';
 const message=document.createElement('p');message.textContent='Prihlásenie sa teraz nepodarilo overiť. Skontrolujte pripojenie a skúste to znova.';
 const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='Skúsiť znova';
 button.onclick=async()=>{button.disabled=true;box.remove();try{const {data:{session}}=await supabase.auth.getSession();await handleAdminSessionV47(session)}finally{button.disabled=false}};
 box.append(message,button);boot.querySelector('.concept-center').append(box);
}
