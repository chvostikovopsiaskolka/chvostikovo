DO $pair263$ declare h text;patch jsonb;begin
select html into h from frontend_snapshots where key='stable-v10-clean' for update;
if md5(h)<>'38e0d47cb1f7df37b1e277092b698054' then raise exception 'CRM baseline changed';end if;
for patch in select value from jsonb_array_elements('[{"old": "if(register){const c=await withJwtRetry(()=>supabase.rpc(''convert_web_application_two_dogs_v237'',{p_submission_id:context.sourceId}));if(c.error)throw c.error;await loadData()}", "new": "if(register){const c=await withJwtRetry(()=>supabase.rpc(''convert_web_application_two_dogs_v237'',{p_submission_id:context.sourceId}));if(c.error)throw c.error;await sendMetaCrmStage(context.sourceId,''qualified'');await sendMetaCrmStage(context.sourceId,''converted'');await loadData()}"}, {"old": "    if(result.error)throw result.error;\n    var ids=result.data?.dog_ids||[];", "new": "    if(result.error)throw result.error;\n    await sendMetaCrmStage(Number(id),''converted'');\n    var ids=result.data?.dog_ids||[];"}]'::jsonb) loop
 if (length(h)-length(replace(h,patch->>'old','')))/length(patch->>'old')<>1 then raise exception 'Pair event source changed';end if;
 h:=replace(h,patch->>'old',patch->>'new');
 end loop;
if md5(h)<>'e0cd8f3987a9b90bc17032e3a39c5484' then raise exception 'Pair event checksum';end if;update frontend_snapshots set html=h where key='stable-v10-clean';end $pair263$;
