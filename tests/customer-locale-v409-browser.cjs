const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const script=fs.readFileSync('customer-locale-v409.js','utf8');
const markup=`<main id="authView"><section><h1 id="authFormTitleV403">Prihlásenie</h1><label for="email">E-mail</label><input id="email" value="synthetic@example.invalid"><p>Podľa mena ho priradíme k vášmu účtu.</p><div id="customerLocaleSwitchV408"><button data-customer-locale="sk">SK</button><button data-customer-locale="en">EN</button></div></section></main>
<div id="appView"><section id="bookingTab"><h2>Vyberte deň</h2><div id="passSummary">2 z 10</div></section>
<section id="menuTab"><h1>Menu</h1><button id="menuVaccinations">Očkovania</button><div id="customerLocaleInMenuV409"><button data-customer-locale="sk">SK</button><button data-customer-locale="en">EN</button></div></section>
<div id="messageThread"><p>Správy</p></div><div class="legal-card"><h3>Podmienky škôlky</h3></div></div>`;
const flush=()=>new Promise(resolve=>setTimeout(resolve,35));
(async()=>{
 const dom=new JSDOM(markup,{url:'https://app.chvostikovo.sk/?lang=en',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.eval(script);await flush();
 assert.equal(w.document.documentElement.lang,'en');
 assert.equal(w.document.getElementById('authFormTitleV403').textContent,'Sign in');
 assert.equal(w.document.querySelector('label').textContent,'Email');
 assert.equal(w.document.getElementById('menuVaccinations').textContent,'Vaccinations');
 assert.equal(w.document.getElementById('passSummary').textContent,'2 of 10');
 assert.equal(w.document.querySelector('#bookingTab h2').textContent,'Choose a day');
 assert.equal(w.document.querySelector('#messageThread p').textContent,'Správy','Customer/staff chat content must remain untranslated');
 assert.equal(w.document.querySelector('.legal-card h3').textContent,'Podmienky škôlky','Legally binding text must remain unchanged');
 assert.equal(w.localStorage.getItem('chvostikovo-customer-locale-v408'),'en');
 assert.equal(w.document.getElementById('email').value,'synthetic@example.invalid');
 const guide=w.document.createElement('div');guide.id='customerGuideV358';guide.innerHTML='<h2>Sprievodca appkou</h2><p>Ukážka rezervácie</p>';w.document.body.append(guide);
 await flush();assert.equal(guide.querySelector('h2').textContent,'App guide');assert.equal(guide.querySelector('p').textContent,'Example booking');
 w.document.getElementById('authFormTitleV403').textContent='Obnova hesla';await flush();
 assert.equal(w.document.getElementById('authFormTitleV403').textContent,'Reset password');
 w.document.querySelector('#customerLocaleInMenuV409 [data-customer-locale=sk]').click();await flush();
 assert.equal(w.document.getElementById('authFormTitleV403').textContent,'Obnova hesla');
 assert.equal(w.document.getElementById('menuVaccinations').textContent,'Očkovania');
 assert.equal(w.document.getElementById('passSummary').textContent,'2 z 10');
 assert.equal(w.localStorage.getItem('chvostikovo-customer-locale-v408'),'sk');
 w.document.querySelector('#customerLocaleSwitchV408 [data-customer-locale=en]').click();await flush();
 assert.equal(w.document.getElementById('authFormTitleV403').textContent,'Reset password');
 assert.equal(w.document.getElementById('email').value,'synthetic@example.invalid');
 assert.equal(w.document.querySelectorAll('#email').length,1,'No form remount');
 assert.equal(w.document.querySelector('.legal-card h3').textContent,'Podmienky škôlky');
 w.close();console.log('PASS v409: auth/menu switch, bookings and guide EN, legal and chat SK, form state preserved');
})().catch(e=>{console.error(e);process.exitCode=1});