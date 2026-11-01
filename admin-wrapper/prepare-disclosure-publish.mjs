import {readFileSync,writeFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {stabilizeAdminHtml} from './admin-lifecycle-patch.mjs';import {enhanceRevenueDisclosures} from './revenue-disclosure-patch.mjs';
const source=stabilizeAdminHtml(gunzipSync(readFileSync('supabase/admin-snapshots/admin-before-stability-20261101.html.gz')).toString('utf8')),edits=[];
const md5=value=>createHash('md5').update(value).digest('hex');
if(md5(source)!=='d6f8450f53c67cda5021f776585a6656')throw Error('Unexpected v403 source');
const original=String.prototype.replace;let candidate;
try{String.prototype.replace=function(a,b){if(this.length>1000000&&typeof a==='string'&&typeof b==='string')edits.push([a,b]);return original.call(this,a,b)};candidate=enhanceRevenueDisclosures(source);}finally{String.prototype.replace=original;}
const sql=`DO $release$ DECLARE original text; candidate text; edit jsonb; pos integer; BEGIN
SELECT html INTO original FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
IF md5(original) IS DISTINCT FROM '${md5(source)}' THEN RAISE EXCEPTION 'Stable v403 changed; abort'; END IF;
candidate:=original;
FOR edit IN SELECT value FROM jsonb_array_elements($edits$${JSON.stringify(edits)}$edits$::jsonb) LOOP
pos:=strpos(candidate,edit->>0); IF pos>0 THEN candidate:=overlay(candidate placing (edit->>1) from pos for length(edit->>0)); END IF;
END LOOP;
IF md5(candidate) IS DISTINCT FROM '${md5(candidate)}' THEN RAISE EXCEPTION 'Candidate checksum mismatch'; END IF;
IF EXISTS(SELECT 1 FROM public.frontend_snapshots WHERE key='backup-disclosure-20261101-v403' AND md5(html)<>md5(original)) THEN RAISE EXCEPTION 'Backup key conflict'; END IF;
INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-disclosure-20261101-v403',original) ON CONFLICT(key) DO NOTHING;
UPDATE public.frontend_snapshots SET html=candidate WHERE key='stable-v10-clean';
END $release$;
SELECT key,md5(html) AS checksum FROM public.frontend_snapshots WHERE key IN('stable-v10-clean','backup-disclosure-20261101-v403');`;
writeFileSync(process.env.ADMIN_PUBLISH_SQL||'admin-wrapper/publish-disclosure.sql',sql);console.log(JSON.stringify({edits:edits.length,before:md5(source),after:md5(candidate)}));
