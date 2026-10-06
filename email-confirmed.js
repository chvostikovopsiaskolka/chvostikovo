/* This page verifies confirmation with Auth; it never stores or logs tokens. */
(async()=>{
  const params=new URLSearchParams(location.hash.slice(1));
  const access=params.get('access_token'),error=params.get('error')||params.get('error_code');
  history.replaceState(null,'',location.pathname);
  const title=document.getElementById('confirmationTitle'),message=document.getElementById('confirmationMessage');
  try{
    if(error||!access)throw new Error('Odkaz je neplatný alebo jeho platnosť vypršala. Otvorte najnovší potvrdzovací e-mail. Ak už bol e-mail potvrdený, môžete sa prihlásiť.');
    const response=await fetch('https://tlhcqwsluyqpywymjoxn.supabase.co/auth/v1/user',{headers:{apikey:"sb_publishable_43vD4AvQwchu1V2MwDbniA_j2tLiLi_",Authorization:'Bearer '+access},cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Potvrdenie sa nepodarilo overiť. Otvorte najnovší potvrdzovací e-mail alebo sa skúste prihlásiť, ak už bol potvrdený.');
    const user=await response.json();
    if(!user.email_confirmed_at)throw new Error('E-mail zatiaľ nie je potvrdený. Otvorte odkaz v potvrdzovacom e-maile.');
    const installed=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
    if(installed){
      // Carry only verified display data, never callback tokens, into the login screen.
      sessionStorage.setItem('chvostikovo_verified_email_return',JSON.stringify({email:user.email||'',at:Date.now()}));
      localStorage.removeItem('chvostikovo_customer_session');
      sessionStorage.removeItem('chvostikovo_customer_session');
      location.replace('/?email_confirmed=1');
      return;
    }
    title.textContent='Váš e-mail je potvrdený';
    message.textContent='Vráťte sa do aplikácie Chvostíkovo a prihláste sa.';
  }catch(error){
    title.textContent='Potvrdenie e-mailu';
    message.textContent=error.name==='TimeoutError'||error.name==='TypeError'?'Potvrdenie sa nepodarilo overiť pre problém s pripojením. Skúste odkaz otvoriť znovu alebo sa prihlásiť do aplikácie.':error.message;
  }
})();
