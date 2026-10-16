-- Revert only the UI. Preserve CRM links, qualification markers, audit and compatible Edge8.
do $$declare original text;begin
 if (select md5(html) from public.frontend_snapshots where key='stable-v10-clean')<>'e0cd8f3987a9b90bc17032e3a39c5484' then raise exception 'Admin changed; review before rollback';end if;
 select html into original from public.frontend_snapshots where key='backup-admin-before-crm-workflow-v263-20261016';
 if original is null or md5(original)<>'3a420f031dd671da1d0692918290f80f' then raise exception 'Backup missing/different';end if;
 update public.frontend_snapshots set html=original where key='stable-v10-clean';
end $$;
