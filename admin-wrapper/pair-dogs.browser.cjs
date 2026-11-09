const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('admin-wrapper/admin-pair-v409.js','utf8');
const dom=new JSDOM('<div id="dogDetail"><div id="dogDetailContent"><section id="dogInfoCard"></section></div></div><div id="dogsList"><div class="dog" data-dog-id="1"><button id="openDog">Open</button></div></div>',{url:'https://chvostikovo-app.vercel.app',runScripts:'outside-only',pretendToBeVisual:true});
const {window:w}=dom;
const data={
 dogs:[{id:1,name:'Synthetic A',owner_id:11,active:true},{id:2,name:'Synthetic B',owner_id:22,active:true}],
 customer_owner_links:[],passes:[],pass_dogs:[],customer_pass_requests:[]
};
let updateCount=0;
function dbTable(name){
  let ids=null,filters=[],change=null,selectMode=false;
  const obj={
    select(){selectMode=true;return this;},
    in(k,values){ids={k,values};return this;},
    eq(k,value){filters.push([k,value]);return this;},
    update(values){change=values;return this;},
    then(resolve,reject){
      let rows=(data[name]||[]).filter(row=>(!ids||ids.values.includes(row[ids.k]))&&filters.every(([k,v])=>row[k]===v));
      if(change){updateCount+=rows.length;rows.forEach(r=>Object.assign(r,change));}
      return Promise.resolve({data:rows.map(r=>({...r})),error:null}).then(resolve,reject);
    }
  };
  return obj;
}
w.__chvostikovoAdminRuntime={state:{dogs:data.dogs},client:{from:dbTable},loadData:async()=>{}};
w.eval(source);
const flush=()=>new Promise(res=>setTimeout(res,35));
(async()=>{
  w.document.getElementById('openDog').click();await flush();
  const launch=w.document.getElementById('chvoPairLaunchV409');
  assert(launch,'Dog details must show staff pairing action');
  assert.equal(updateCount,0,'No update on rendering');
  launch.click();await flush();
  assert.equal(w.document.querySelector('#chvoPairSelectV409 option')?.value,'2');
  w.document.getElementById('chvoPairCommitV409').click();await flush();
  assert.equal(updateCount,0,'Checkbox is mandatory');
  w.document.getElementById('chvoPairVerifyV409').checked=true;
  w.document.getElementById('chvoPairCommitV409').click();await flush();
  assert.equal(updateCount,1,'Exactly one owner association is updated');
  assert.equal(data.dogs[1].owner_id,11,'Target shares source owner');
  assert.match(w.document.getElementById('chvoPairStatusV409').textContent,/Hotovo/);
  assert.equal(data.passes.length,0,'No pass sale');
  assert.equal(data.pass_dogs.length,0,'No pass members added before purchase');
  // Once the owner is shared, the UI must stop offering the same pairing again.
  w.document.getElementById('dogInfoCard').replaceChildren();
  w.document.getElementById('openDog').click();await flush();
  assert.equal(w.document.getElementById('chvoPairLaunchV409'),null,'Already linked dogs have no pairing action');
  assert.match(w.document.getElementById('chvoPairBoxV409').textContent,/Spárovaní psíkovia: Synthetic A \+ Synthetic B/);
  // Two explicit pass_dogs rows (not just a common owner) yield a shared pass readout.
  w.__chvostikovoAdminRuntime.state.passes=[{id:501,dog_id:1,status:'active',used_entries:6,total_entries:10,valid_until:'2026-12-23',pass_dogs:[{dog_id:1},{dog_id:2}]}];
  w.document.getElementById('openDog').click();await flush();
  assert.match(w.document.getElementById('chvoPairBoxV409').textContent,/Aktívna spoločná permanentka.*6 z 10/);
  assert.equal(w.document.getElementById('chvoPairLaunchV409'),null);
  assert.equal(updateCount,1,'Existing pairing is read-only');
  w.close();
  console.log('PASS: admin staff dog pairing UI, explicit confirmation, guarded update, zero finance writes');
})().catch(e=>{console.error(e);process.exitCode=1});