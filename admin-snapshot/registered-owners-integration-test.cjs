const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('admin-snapshot/stable-v10-clean.html','utf8');
const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const dom=new JSDOM('<div id="modal" class="hidden"></div><h2 id="adminDashboardModalTitleV41"></h2><div id="adminDashboardModalBodyV41"></div><button id="adminDashboardModalAction"></button>',{runScripts:'outside-only'}),w=dom.window;
w.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Preserve the real isolation between the main async script and dashboard script.
w.eval('(function(){'+section('function registeredOwnerCompactHtml(','async function linkRegisteredOwner(')+'})();');
assert.equal(typeof w.registeredOwnerCompactHtml,'function');
w.state={customerOwnerLinks:[{user_id:'a',owner_id:60}],customerProfiles:[{user_id:'a',full_name:'Marek Leder',email:'private@example.test'}],dogs:[{id:77,owner_id:60,name:'Bella'}]};
let opened=null,errors=[];w.openDog=id=>opened=id;w.console.error=(...args)=>errors.push(args);
w.eval('(function(){const q=id=>document.getElementById(id);const ensureDashboardModalV42=()=>q("modal");const closeDashboardModalV42=()=>q("modal").classList.add("hidden");'+section('  function dashRegisteredOwnersHtml(){','  function dashEndingPassesHtml(){')+section('  function bindDashboardModalV42(','  function openDashboardModalV42(')+section('  function openDashboardModalV42(','function dashboardDefsV48(')+'})();');
w.openAdminDashboardModal('registered','Registrovaní majitelia');
assert.equal(errors.length,0);assert.equal(w.document.querySelectorAll('details').length,1);assert(!w.document.querySelector('summary').textContent.includes('@'));assert(w.document.querySelector('summary').textContent.includes('Marek L.'));
w.document.querySelector('details').open=true;assert(w.document.querySelector('.registered-owner-email').textContent.includes('private@'));
w.document.querySelector('.v42-open-dog').click();assert.equal(opened,77);
w.state.customerOwnerLinks=[];w.openAdminDashboardModal('registered','Registrovaní majitelia');assert.equal(errors.length,0);assert(w.document.getElementById('adminDashboardModalBodyV41').textContent.includes('Momentálne'));
w.close();console.log('PASS: isolated script export; real registered dashboard modal; expanded private email; real dog action binding; empty list without sync error');
