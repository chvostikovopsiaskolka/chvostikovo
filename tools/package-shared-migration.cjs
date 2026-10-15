const fs=require('fs');
const parts=['shared-passes-v244.sql','shared-existing-functions-v244.sql','shared-ownership-notifications-v244.sql','shared-rls-v244.sql'];
const content='-- V-029/V-030 STAGING ONLY. Release flag defaults to false. See docs/shared-passes-v244.md.\n'+parts.map(p=>'\n-- Source: '+p+'\n'+fs.readFileSync('supabase/changes/'+p,'utf8')).join('')+"\nNOTIFY pgrst, 'reload schema';\n";
fs.writeFileSync('supabase/migrations/20261015143657_shared_passes_v245.sql',content);
