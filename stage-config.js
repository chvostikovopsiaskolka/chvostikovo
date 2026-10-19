/* Staging-only wiring. Do not include this file in a production release. */
if (location.hostname === 'app.chvostikovo.sk') throw new Error('Staging configuration cannot run on production.');
window.CUSTOMER_RUNTIME = Object.freeze({staging:true,supabaseUrl:'https://jgzabminzgbfhsrgqedt.supabase.co',supabaseKey:"sb_publishable_SxAm6NUsZ8699ienaT8fzw_6bWt5cPq"});
(() => {
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,options)=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.hostname.endsWith('.supabase.co')&&url.hostname!=='jgzabminzgbfhsrgqedt.supabase.co')return Promise.reject(new Error('Staging blocked a production request.'));
    return originalFetch(input,options).catch(error=>{console.warn('Staging request failed',url.origin+url.pathname,error.message);throw error;});
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const card=document.querySelector('.auth-card');if(!card)return;
    const panel=document.createElement('div');panel.className='stage-access';
    panel.innerHTML='<strong>Skúšobná zákaznícka appka</strong><p>Vyberte si skúšobný účet. Údaje sú oddelené od živej appky.</p><div><button type="button" data-stage-account="bella.design@example.invalid">Bella · 1 psík</button><button type="button" data-stage-account="dvojica.design@example.invalid">Falco a Spirit · 2 psíkovia</button></div>';
    card.prepend(panel);
    panel.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      document.getElementById('loginEmail').value=b.dataset.stageAccount;document.getElementById('loginPassword').value='ChvostikovoTest2026!';document.getElementById('loginForm').requestSubmit();
    }));
    for(const id of ['signupForm','forgotForm'])document.getElementById(id)?.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();alert('V skúšobnej verzii použite pripravené testovacie účty.');},true);
  });
})();
