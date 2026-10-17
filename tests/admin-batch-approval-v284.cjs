const fs=require('fs'),assert=require('assert/strict'),{boot}=require('./admin-history-v283.cjs');
(async()=>{
 const source=fs.readFileSync(process.env.ADMIN_SOURCE||'admin-v284.html','utf8'),marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
 fs.writeFileSync('admin-batch-testable.html',source.replace(marker,'window.__batchTestV284={state,supabase};'+marker));
 const {w,errors}=await boot('admin-batch-testable.html');try{
 assert.deepEqual(errors,[]);const t=w.__batchTestV284;assert(t);const calls=[];let partial=false;
 const rows=()=>[{id:1001,user_id:'synthetic',dog_id:8,reservation_date:'2026-10-19',status:'pending'},{id:1002,user_id:'synthetic',dog_id:8,reservation_date:'2026-10-20',status:'pending'}];
 t.supabase.rpc=async(name,args)=>{calls.push({name,args});return {data:name==='portal_approve_booking_batch_v284'?{approved_ids:partial?[1001]:[1001,1002],errors:partial?[{id:1002,message:'Synthetic capacity error'}]:[]}:null,error:null}};
 t.state.customerBookings=rows();t.state.dogs=[{id:8,name:'Spirit',active:true}];
 const button=w.document.createElement('button');button.dataset.reviewIds='1001,1002';button.dataset.review267='approve';button.dataset.reviewKind='booking';
 await w.bookingReviewV267.decide(button);assert.equal(calls.length,1);assert.equal(calls[0].name,'portal_approve_booking_batch_v284');assert.deepEqual(Array.from(calls[0].args.p_request_ids),[1001,1002]);
 calls.length=0;t.state.customerBookings=rows();button.dataset.reviewIds='1001';await w.bookingReviewV267.decide(button);assert.equal(calls.length,1);assert.equal(calls[0].name,'portal_approve_booking');
 calls.length=0;partial=true;t.state.customerBookings=rows();button.dataset.reviewIds='1001,1002';await w.bookingReviewV267.decide(button);assert.equal(calls.length,1);assert.equal(calls[0].name,'portal_approve_booking_batch_v284');assert.deepEqual(errors,[]);
 console.log('PASS assembled main scope: multiple days one batch RPC, single day old RPC, partial success handled without replay/per-day fallback; no runtime errors');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
