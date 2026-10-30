const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/bellaris-admin.mjs','utf8').replaceAll('export ','').replace("await import('https://esm.sh/@supabase/supabase-js@2.57.0')",'({createClient:mockCreateClient})')+'\nglobalThis.openDashboard=openBellarisMobile;';
async function simulate(staff=true){
 const calls=[],listeners={};let confirm=true;const root={innerHTML:'',addEventListener:(key,fn)=>listeners[key]=fn};
 const rows={bp_staff:staff?{user_id:'staff'}:null,bp_inquiries:[{id:'one',name:'<Client>',email:'person@example.invalid',phone:'+421900000000',status:'new',project_type:'Nový web',message:'Konzultácia',is_test:false}],bp_projects:[],bp_milestones:[],bp_web_traffic_daily:[],bp_consultations:[{id:'one',inquiry_id:'one',starts_at:'2026-11-03T08:00:00Z',status:'reserved',is_test:false}],bp_consultation_blocks:[]};
 const client={auth:{getUser:async()=>({data:{user:{id:'staff'}}}),signOut:async()=>({})},from:table=>{const q={};for(const method of ['select','eq','gte','order','limit'])q[method]=()=>q;q.maybeSingle=async()=>({data:rows[table],error:null});q.then=(resolve,reject)=>Promise.resolve({data:rows[table]||[],error:null}).then(resolve,reject);return q;},rpc:async(name,args)=>{calls.push({name,args});if(name==='bp_update_consultation')rows.bp_consultations[0].status=args.p_status;return{data:true,error:null};}};
 const storage={getItem:()=>null,setItem(){},removeItem(){}};
 const context={mockCreateClient:()=>client,window:{BELLARIS_PORTAL_CONFIG:{supabaseUrl:'https://cycjpgjftbdcnrqisibw.supabase.co',publishableKey:'sb_publishable_test'},confirm:()=>confirm,alert(){}},localStorage:storage,sessionStorage:storage,document:{},FormData:class{constructor(target){this.values=target.values}get(key){return this.values[key]}},console,URL,Intl,Date,Map,Set,Promise};
 vm.createContext(context);vm.runInContext(source,context);await context.openDashboard(root,()=>{});
 const flush=async()=>{for(let i=0;i<8;i++)await new Promise(setImmediate);};
 return{root,calls,deny:()=>confirm=false,click:async(action,extra={})=>{listeners.click({target:{closest:()=>({dataset:{bm:action,...extra}})}});await flush();},block:async()=>{listeners.submit({target:{id:'bellarisBlockSlot',values:{day:'2026-11-03',time:'09:45'}},preventDefault(){}});await flush();}};
}
 (async()=>{
 const s=await simulate();assert(s.root.innerHTML.includes('Najbližšie konzultácie'));assert(!s.root.innerHTML.includes('<Client>'));assert.equal(s.calls.length,0,'render must never mutate');
 await s.click('consultations');assert(s.root.innerHTML.includes('Blokovať nedostupný čas'));
 await s.click('confirm-consultation',{id:'one'});assert.equal(s.calls[0].name,'bp_update_consultation');assert.equal(s.calls[0].args.p_status,'confirmed');assert.equal(s.calls[0].args.p_id,'one');
 await s.block();assert.equal(s.calls[1].name,'bp_block_consultation');assert.equal(s.calls[1].args.p_local,'2026-11-03T09:45');
 s.deny();await s.click('cancel-consultation',{id:'one'});assert.equal(s.calls.length,2,'cancel requires explicit staff confirmation');
 const outsider=await simulate(false);assert(outsider.root.innerHTML.includes('nemá oprávnenie'));await outsider.click('confirm-consultation',{id:'one'});assert.equal(outsider.calls.length,0,'non-staff has no write action');
 console.log('PASS: actual Bellaris module, staff-only explicit RPC, preserved read-only rendering, escaping, mobile consultation actions');
 })().catch(e=>{console.error(e);process.exitCode=1});
