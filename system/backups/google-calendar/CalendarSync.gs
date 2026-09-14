// Chvostíkovo APP -> Google Calendar bridge
// Backup: 14. 9. 2026
// IMPORTANT: SYNC_SECRET is stored only in Apps Script Project Properties.
// Do not hardcode or commit the secret into this file.

const CHVOSTIKOVO_CALENDAR_ID = 'chvostikovo.psiaskolka@gmail.com';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const body = JSON.parse(e.postData?.contents || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');

    if (!expectedSecret || body.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const reservationId = String(body.reservation_id || '').trim();
    const dogName = String(body.dog_name || '').trim();
    const date = String(body.date || '').trim();
    const action = String(body.action || 'upsert');

    if (!reservationId || !date) {
      return jsonResponse({ ok: false, error: 'missing_data' });
    }

    const calendar = CalendarApp.getCalendarById(CHVOSTIKOVO_CALENDAR_ID);
    if (!calendar) {
      return jsonResponse({ ok: false, error: 'calendar_not_found' });
    }

    const marker = `CHVOSTIKOVO_RESERVATION_ID:${reservationId}`;
    const day = parseLocalDate(date);

    const existing = calendar
      .getEventsForDay(day)
      .find(event => String(event.getDescription() || '').includes(marker));

    if (action === 'cancel') {
      if (existing) existing.deleteEvent();
      return jsonResponse({ ok: true, action: 'cancelled' });
    }

    if (!dogName) {
      return jsonResponse({ ok: false, error: 'missing_dog_name' });
    }

    let title = `${dogName} - škôlka`;

    if (
      body.entry_type === 'pass' &&
      body.entry_number &&
      body.pass_total
    ) {
      title += ` ${body.entry_number}/${body.pass_total}`;
    }

    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 7, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 17, 0, 0);

    const description = `${marker}\nZdroj: Chvostíkovo APP`;

    if (existing) {
      existing.setTitle(title);
      existing.setTime(start, end);
      existing.setDescription(description);
      existing.setColor(CalendarApp.EventColor.MAUVE);
      return jsonResponse({ ok: true, action: 'updated', event_id: existing.getId() });
    }

    const event = calendar.createEvent(title, start, end, { description });
    event.setColor(CalendarApp.EventColor.MAUVE);
    return jsonResponse({ ok: true, action: 'created', event_id: event.getId() });

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function parseLocalDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper used only to grant/verify Calendar authorization for the Apps Script project.
function authorizeCalendar() {
  const calendar = CalendarApp.getCalendarById(CHVOSTIKOVO_CALENDAR_ID);
  Logger.log(calendar.getName());
}
