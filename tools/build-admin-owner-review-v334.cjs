const fs=require('fs'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
const before=z.gunzipSync(fs.readFileSync('supabase/backups/admin-candidate-taxi-v329.html.gz')).toString();
assert.equal(crypto.createHash('md5').update(before).digest('hex'),'4d67fa4dca85a59171db6ef0230e0bcb');
const start=before.indexOf('function groups(input=state.customerBookings||[])'),end=before.indexOf('\nfunction names(g)',start);
assert(start>0&&end>start);
const groups=`function reviewAccountV334(row){const owner=dogById(row.dog_id)?.owner_id;return row.user_id?String(row.user_id)+':'+(owner?String(owner):'account'):'dog:'+row.dog_id}
function groups(input=state.customerBookings||[]){
 const pending=input.filter(r=>r.status==='pending'||r.taxi_change_status==='pending'),units=new Map(),map=new Map();
 for(const r of pending){const kind=r.taxi_change_status==='pending'?'taxi':'booking',account=reviewAccountV334(r),key=JSON.stringify([kind,account,r.reservation_date,kind==='taxi'?r.id:'']);
  if(!units.has(key))units.set(key,{kind,date:r.reservation_date,user:r.user_id||'',account,rows:[]});
  const unit=units.get(key);if(!unit.rows.some(q=>Number(q.id)===Number(r.id)))unit.rows.push(r);
 }
 for(const unit of units.values()){
  unit.rows.sort((a,b)=>Number(a.id)-Number(b.id));unit.ids=unit.rows.map(r=>Number(r.id));unit.dogs=[...new Set(unit.rows.map(r=>Number(r.dog_id)))].sort((a,b)=>a-b);
  const key=JSON.stringify([unit.kind,unit.account,unit.kind==='taxi'?unit.dogs:[]]);
  if(!map.has(key))map.set(key,{key,kind:unit.kind,dogs:[],units:[]});const group=map.get(key);group.units.push(unit);group.dogs=[...new Set([...group.dogs,...unit.dogs])].sort((a,b)=>a-b);
 }
 return [...map.values()].map(g=>({...g,units:g.units.sort((a,b)=>a.date.localeCompare(b.date)||a.ids[0]-b.ids[0])})).sort((a,b)=>a.units[0].date.localeCompare(b.units[0].date)||a.key.localeCompare(b.key));
}`;
const patches=[
 ['<meta charset="UTF-8" />','<meta charset="UTF-8" />\n  <meta name="chvostikovo-admin-build" content="20261021-owner-review-v334" />'],
 [before.slice(start,end),groups],
 ["label=unit?'Schváliť':'Schváliť všetky'","label=unit?(unit.ids.length===2?'Schváliť oboch':unit.ids.length>2?'Schváliť všetkých':'Schváliť'):'Schváliť všetky'"],
 ["(u.rows.length>1?(dogById(r.dog_id)?.name||'Psík')+': ':'')","(g.dogs.length>1?(dogById(r.dog_id)?.name||'Psík')+': ':'')"],
 ["const multiDay=kind==='booking'&&decision==='approve'&&new Set(selected.map(q=>q.reservation_date)).size>1;","const multiDay=kind==='booking'&&decision==='approve'&&selected.length>1;"],
 ["function versionFingerprint(doc){\n  var nodes=","function versionFingerprint(doc){\n  var build=doc.querySelector('meta[name=\"chvostikovo-admin-build\"]');\n  if(build&&build.content)return 'build:'+build.content;\n  var nodes="],
 ["fetch(window.location.href.split('#')[0],{cache:'no-store',credentials:'same-origin',headers:{'Accept':'text/html'}})","fetch('https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/chvostikovo-frontend',{cache:'no-store',credentials:'omit',headers:{'Accept':'text/html'}})"],
 ["if(remote.querySelector('script')&&versionFingerprint(remote)!==runningVersion)reportUpdate();","if(remote.querySelector('script')){if(versionFingerprint(remote)!==runningVersion)reportUpdate();else{updateAvailable=false;if(notice)notice.classList.remove('visible')}}"]
];
let after=before;for(const [oldText,newText] of patches){assert.equal(after.split(oldText).length,2,'exact once: '+oldText.slice(0,90));after=after.replace(oldText,newText)}
const md5=crypto.createHash('md5').update(after).digest('hex');
if(require.main===module){
 fs.writeFileSync('/tmp/admin-candidate-v334.html',after);fs.writeFileSync('/tmp/admin-patches-v334.json',JSON.stringify(patches));
 let sql="DO $guard334$ DECLARE source text;candidate text;BEGIN SELECT html INTO source FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;IF md5(source)<>'4d67fa4dca85a59171db6ef0230e0bcb' THEN RAISE EXCEPTION 'Newer live admin exists';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-owner-review-v334-20261021',source);candidate:=source;\n";
 patches.forEach(([oldText,newText],i)=>{const a='$old334_'+i+'$',b='$new334_'+i+'$';assert(!oldText.includes(a)&&!newText.includes(b));sql+='IF (length(candidate)-length(replace(candidate,'+a+oldText+a+",'')))<>length("+a+oldText+a+") THEN RAISE EXCEPTION 'Patch "+i+" differs';END IF;candidate:=replace(candidate,"+a+oldText+a+','+b+newText+b+');\n';});
 sql+="IF md5(candidate)<>'"+md5+"' THEN RAISE EXCEPTION 'Candidate differs';END IF;INSERT INTO public.frontend_snapshots(key,html) VALUES('staging-admin-owner-review-v334-20261021',candidate);UPDATE public.frontend_snapshots SET html=candidate,created_at=now() WHERE key='stable-v10-clean';END $guard334$;SELECT key,md5(html),length(html) FROM public.frontend_snapshots WHERE key IN ('stable-v10-clean','backup-admin-before-owner-review-v334-20261021','staging-admin-owner-review-v334-20261021');\n";
 fs.writeFileSync('supabase/changes/deploy-admin-owner-review-v334.sql',sql);console.log(JSON.stringify({md5,chars:after.length,bytes:Buffer.byteLength(after),patches:patches.length}));
}
module.exports={before,after,patches,md5};
