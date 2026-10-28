// v336: atomic database ceilings; no raw IP/contact values are retained by the limiter.
export async function securityLimitV336(req: Request, scope: string, subject: string, base: string, key: string, cors: Record<string,string> = {}) {
 const raw = subject || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
 const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(scope+':'+raw));
 const hash = Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const r = await fetch(base+'/rest/v1/rpc/consume_request_limit_v336',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_scope:scope,p_subject:hash}),signal:AbortSignal.timeout(5000)});
 if(!r.ok)throw new Error('Ochranu požiadaviek sa nepodarilo overiť. Skúste to o chvíľu.');
 if(await r.json()===true)return null;
 return new Response(JSON.stringify({ok:false,error:'Príliš veľa požiadaviek. Skúste to o chvíľu.',code:'rate_limited'}),{status:429,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Retry-After':'300'}});
}
export async function securityAccessV336(req:Request,base:string,key:string,cors:Record<string,string>={}){
 const r=await fetch(base+'/rest/v1/rpc/portal_customer_access_allowed_v336',{method:'POST',headers:{apikey:key,Authorization:req.headers.get('authorization')||'','Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
 if(!r.ok)throw new Error('Prístup k účtu sa nepodarilo overiť. Skúste to o chvíľu.');
 if(await r.json()===true)return null;
 return new Response(JSON.stringify({error:'Prístup k účtu je zablokovaný. Kontaktujte Chvostíkovo.',code:'account_blocked'}),{status:403,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}

