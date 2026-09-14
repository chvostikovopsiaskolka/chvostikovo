# Google Calendar sync – recovery backup

Production architecture:

`Supabase reservations → private trigger/function → pg_net POST → Google Apps Script Web App → Google Calendar`

Supabase is the source of truth.

## Files

- `CalendarSync.gs` – Apps Script Web App handler, event upsert/cancel, 07:00–17:00 time, pass X/Y title and MAUVE (grape) color.
- `supabase-calendar-sync.sql` – private config table shape, enqueue function, reservation trigger function and production trigger.

## Secrets intentionally excluded

The repository does **not** contain:

- `SYNC_SECRET`,
- the live Apps Script `/exec` webhook URL.

`SYNC_SECRET` must exist in Apps Script **Project Properties** and the matching secret + webhook URL must be restored into `private.google_calendar_sync_config` in Supabase.

## Apps Script deployment

- Type: Web app
- Execute as: Me
- Who has access: Anyone
- Project timezone: Europe/Bratislava
- Grant Google Calendar authorization by running `authorizeCalendar()` once as the owner.

After changing `CalendarSync.gs`, create a **New version** of the existing Web App deployment so the same `/exec` URL serves the new code.

## Expected behavior

- booked reservation → create/update Google event,
- cancelled/deleted reservation → delete Google event,
- single entry title: `Meno - škôlka`,
- pass title: `Meno - škôlka X/Y`,
- event time: 07:00–17:00,
- event color: MAUVE / grape / event color ID 3,
- description marker: `CHVOSTIKOVO_RESERVATION_ID:<reservation_id>`,
- rows with `source = google_calendar` are ignored by outbound sync,
- pass events wait until `planned_entry_number` and `planned_pass_total` are available.
