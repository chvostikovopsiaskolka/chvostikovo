const fs=require('fs'),vm=require('vm'),assert=require('assert'),{stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8');
const photos=new Map(),writes=[],removed=[];let handler,failSave=false;
const dog={id:77,owner_id:60,photo_path:'dogs/common.jpg',photo_updated_at:'old'};
const context={console,Request,Response,URL,Uint8Array,atob,crypto:require('crypto').webcrypto,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://test.invalid':'test'},serve:fn=>handler=fn},fetch:async(url,options)=>{if(options.method==='DELETE')removed.push(...JSON.parse(options.body).prefixes);return new Response(JSON.stringify({signedURL:'/object/sign/'+url.split('/').pop()}),{status:200})}};
vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source),context);
context.ownsDog=async(user,id)=>['alice','bob'].includes(user)&&id===77;
context.rest=async(path,options={})=>{
 if(options.method){writes.push({path,...options});if(failSave)throw Error('Save failed');if(path.startsWith('dogs?'))Object.assign(dog,options.body);else photos.set(options.body.user_id,{...options.body,updated_at:'server-time'});return[];}
 if(path.startsWith('customer_dog_photos?')){const u=new URL('https://test.invalid/'+path).searchParams.get('user_id');return [...photos.values()].filter(p=>!u||u.startsWith('in.')||u==='eq.'+p.user_id);}
 if(path.startsWith('dogs?'))return [dog];
 if(path.startsWith('customer_profiles?'))return [{user_id:'alice',full_name:'Alice Owner'},{user_id:'bob',full_name:'Bob Owner'}];
 if(path.startsWith('customer_owner_links?'))return [{user_id:'alice',owner_id:60},{user_id:'bob',owner_id:60}];
 throw Error('Unmocked '+path);
};
(async()=>{
 const initial=await context.withSignedPhotos([dog],'alice');assert.equal(initial[0].photo_path,'dogs/common.jpg');
 const payload={dog_id:77,image_data:'data:image/jpeg;base64,/9j/2Q=='};
 await context.uploadDogPhoto('alice',false,payload);const alice=photos.get('alice').photo_path;assert(alice.startsWith('customers/alice/77/'));assert.equal(dog.photo_path,'dogs/common.jpg');assert.equal(removed.length,0);
 await context.uploadDogPhoto('bob',false,payload);const bob=photos.get('bob').photo_path;assert.notEqual(alice,bob);assert.equal((await context.withSignedPhotos([dog],'alice'))[0].photo_path,alice);assert.equal((await context.withSignedPhotos([dog],'bob'))[0].photo_path,bob);
 await context.uploadDogPhoto('alice',false,payload);assert(removed.includes(alice));assert(!removed.includes(bob));assert(!removed.includes('dogs/common.jpg'));
 await context.deleteDogPhoto('alice',false,{dog_id:77});assert.equal((await context.withSignedPhotos([dog],'alice'))[0].photo_url,null);assert.equal((await context.withSignedPhotos([dog],'bob'))[0].photo_path,bob);
 await assert.rejects(context.uploadDogPhoto('stranger',false,payload),/priradený/);await assert.rejects(context.deleteDogPhoto('stranger',false,{dog_id:77}),/priradený/);
 failSave=true;const n=removed.length;await assert.rejects(context.uploadDogPhoto('alice',false,payload),/Save failed/);assert.equal(removed.length,n+1);failSave=false;
 await context.uploadDogPhoto('alice',false,payload);
 context.getUser=async()=>({user:{id:'staff'},token:'test'});context.isStaff=async()=>true;
 const result=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({action:'staff_photo_urls',dog_ids:[77]})}));const j=await result.json();assert.equal(result.status,200);assert.equal(j.data[0].owner_photos.length,2);assert.deepEqual(j.data[0].owner_photos.map(p=>p.owner_name),['Alice Owner','Bob Owner']);
 context.isStaff=async()=>false;const denied=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({action:'staff_photo_urls',dog_ids:[77]})}));assert.equal(denied.status,403);
 await context.uploadDogPhoto('staff',true,payload);assert(dog.photo_path.startsWith('dogs/'));assert.equal(photos.get('bob').photo_path,bob);
 console.log('PASS: independent account photos, shared fallback, isolated replacement/deletion, foreign ownership denied, failed-save cleanup, staff-only gallery, common admin photo preserved');
})().catch(e=>{console.error(e);process.exit(1)});
