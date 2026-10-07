const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8'),d=new JSDOM('<div id="supportMessageThreadV52"></div>',{runScripts:'outside-only'}),w=d.window;
Object.assign(w,{$:id=>w.document.getElementById(id),state:{data:{messages:[]}},esc:s=>String(s).replaceAll('<','&lt;'),skTime:()=> '7. 10. 8:00',requestAnimationFrame:f=>f()});
w.eval(app.slice(app.indexOf('  function renderSupportThread(){'),app.indexOf('  async function markRead(){')));
w.renderSupportThread();assert(w.$('supportMessageThreadV52').classList.contains('hidden'));assert.equal(w.$('supportMessageThreadV52').innerHTML,'');
w.state.data.messages=[{body:'Rezervácia <Bella>',sender_role:'customer',created_at:'2026-10-07'}];w.renderSupportThread();assert(!w.$('supportMessageThreadV52').classList.contains('hidden'));assert(w.$('supportMessageThreadV52').textContent.includes('Rezervácia <Bella>'));assert.equal(w.$('supportMessageThreadV52').querySelectorAll('Bella').length,0);
w.state.data.messages=[];w.renderSupportThread();assert(w.$('supportMessageThreadV52').classList.contains('hidden'));assert.equal(w.$('supportMessageThreadV52').innerHTML,'');
assert(app.includes('Správy sa automaticky vymažú po 7 dňoch bez novej správy.'));d.window.close();console.log('PASS: first message without empty history; existing history visible and escaped; deletion clears customer thread');
