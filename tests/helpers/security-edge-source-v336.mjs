import fs from 'node:fs';
export function securityEdgeSourceV336(slug){
 const dir='supabase/functions/'+slug+'/';
 const helper=fs.readFileSync(dir+'security-v336.ts','utf8').replace(/export /g,'');
 const source=fs.readFileSync(dir+'index.ts','utf8').replace(/^import [^\n]+\n/gm,'');
 return helper+'\n'+source;
}
