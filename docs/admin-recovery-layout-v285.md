# Unsent form placement v285 —17 October2026

The user superseded the earlier menu plan: unsuccessful form recoveries belong only below the new enquiries in the existing interest modal. Remove the standalone dashboard root, retain the existing unresolved/handled filters, data, refresh and staff action. Scoped CSS arranges header/date, contacts, dog names, expandable form data and handled button as one compact column without long-text overflow.

The assembled runtime also reproduced a loading failure: the existing query adapter lacked limit(), although the recovery module calls limit(100). Add the standard chain method and query parameter to the adapter; queries without limit stay unchanged. No backend/schema/CRM/lead/SMS changes.

Runtime regression reproduces old duplicate root/loading error and verifies only one modal host, server bound100, long contact text, two-dog fields, handled PATCH/refresh and no dashboard section. No production recovery was changed during tests. Mobile CSS is scoped; physical iOS/Android rendering remains unobserved.

Rollback: snapshot backup-admin-before-recovery-layout-v285-20261017 (MD5 29d8a430e6390cdba3d245acb76eaadd); restore only if current checksum is v285. Existing attendance guard/history/bulk approval push remain present.
