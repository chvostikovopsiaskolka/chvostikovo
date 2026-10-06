const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8');
async function run(response,error){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk',runScripts:'outside-only'}),w=dom.window;
 let message,mode,calls=0;
 w.$=id=>w.document.getElementById(id);w.PASSWORD_STRONG_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;w.PASSWORD_MIN_MESSAGE='Slabé heslo';w.CUSTOMER_PUBLIC_URL='https://app.chvostikovo.sk/';
 w.authFetch=async()=>{calls++;if(error)throw error;return response};w.authMessage=(type,text)=>message={type,text};w.loading=()=>{};w.showAuth=x=>mode=x;
 const again=w.document.createElement('input');again.id='signupPasswordAgain';w.document.body.append(again);again.value='ValidPass1';w.$('signupPassword').value='ValidPass1';w.$('signupEmail').value='owner@example.test';
 w.eval(app.slice(app.indexOf('function showExistingSignupAccount('),app.indexOf("$('forgotForm').addEventListener")));
 const btn=w.$('signupForm').querySelector('button[type=submit]');w.$('signupForm').dispatchEvent(new w.SubmitEvent('submit',{cancelable:true,submitter:btn}));await new Promise(setImmediate);
 const result={message,mode,calls,email:w.$('loginEmail').value,forgot:w.$('forgotEmail').value,disabled:btn.disabled};dom.window.close();return result;
}
(async()=>{
 for(const data of [{id:'fake',identities:[]},{user:{identities:[]}}]){const r=await run(data);assert.equal(r.mode,'login');assert(r.message.text.includes('už máte účet'));assert.equal(r.email,'owner@example.test');assert.equal(r.forgot,r.email);assert.equal(r.calls,1);assert(!r.disabled)}
 for(const error of [Object.assign(new Error('Duplicate'),{code:'user_already_exists'}),new Error('User already registered')]){assert((await run(null,error)).message.text.includes('už máte účet'))}
 const fresh=await run({identities:[{provider:'email'}]});assert(fresh.message.text.includes('Potvrdzovací e-mail bol odoslaný'));assert(!fresh.message.text.includes('už máte účet'));
 const limited=await run(null,new Error('Email rate limit exceeded'));assert.equal(limited.message.type,'error');assert.equal(limited.mode,undefined);
 console.log('PASS: existing-account response and explicit errors; login/recovery email prefill; fresh registration; rate-limit error stays distinct; no extra email lookup');
})().catch(e=>{console.error(e);process.exit(1)});
