const fs=require('fs'),vm=require('vm'),assert=require('assert');
const callback=fs.readFileSync('email-confirmed.js','utf8'),app=fs.readFileSync('app.js','utf8');
const storage=()=>{const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
async function run(installed,confirmed=true,error=false){
 const sessionStorage=storage(),localStorage=storage();let target=null,calls=0;
 const nodes={confirmationTitle:{},confirmationMessage:{}};
 const ctx={URLSearchParams,Date,JSON,AbortSignal,sessionStorage,localStorage,navigator:{},window:{matchMedia:()=>({matches:installed})},location:{hash:error?'#error=expired':'#access_token=secret&type=signup',pathname:'/email-confirmed.html',replace:x=>target=x},history:{replaceState(){}},document:{getElementById:id=>nodes[id]},fetch:async()=>{calls++;return{ok:true,json:async()=>({email:'owner@example.test',email_confirmed_at:confirmed?'2026-10-06':null})}}};
 await vm.runInNewContext(callback,ctx);
 return{ctx,nodes,target,calls};
}
(async()=>{
 let r=await run(false);assert(!r.target);assert.equal(r.nodes.confirmationTitle.textContent,'Váš e-mail je potvrdený');
 r=await run(true);assert.equal(r.target,'/?email_confirmed=1');assert(!r.ctx.sessionStorage.getItem('chvostikovo_verified_email_return').includes('secret'));
 const helper=app.slice(app.indexOf('function handleVerifiedEmailReturn(){'),app.indexOf('async function init(){'));
 let message=null,mode=null;const email={value:''};
 const ctx={URLSearchParams,Date,JSON,sessionStorage:r.ctx.sessionStorage,location:{search:'?email_confirmed=1',pathname:'/'},history:{replaceState(){}},showAuth:x=>mode=x,$:()=>email,authMessage:(type,text)=>message={type,text},loading(){}};
 vm.createContext(ctx);vm.runInContext(helper,ctx);assert(ctx.handleVerifiedEmailReturn());assert.equal(mode,'login');assert.equal(email.value,'owner@example.test');assert.equal(message.type,'info');assert(!ctx.handleVerifiedEmailReturn());
 r=await run(true,false);assert(!r.target);assert(!r.ctx.sessionStorage.getItem('chvostikovo_verified_email_return'));
 r=await run(true,true,true);assert(!r.target);assert.equal(r.calls,0);
 console.log('PASS: browser confirmation stays; installed confirmation routes to login with verified email; no token persistence; one-use marker; unconfirmed/expired callbacks do not claim success');
})().catch(e=>{console.error(e);process.exit(1)});
