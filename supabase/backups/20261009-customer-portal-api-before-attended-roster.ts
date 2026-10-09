const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

type Json = Record<string, unknown>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

function cleanText(value: unknown, max = 500) {
  const valueText = String(value ?? '').trim();
  return valueText ? valueText.slice(0, max) : null;
}

function normalizePhone(value: unknown) {
  let phone = String(value ?? '').trim().replace(/[\s()-]/g, '').replace(/^00/, '+');
  if (/^09\d{8}$/.test(phone)) phone = '+421' + phone.slice(1);
  return /^\+[1-9]\d{8,14}$/.test(phone) ? phone : null;
}

function validIsoDate(value: unknown) {
  const valueText = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(valueText) ? valueText : null;
}

function inFilter(values: Array<string | number>) {
  return 'in.(' + values.map((value) => String(value).replace(/,/g, '\\,')).join(',') + ')';
}

async function rest(
  path: string,
  options: { method?: string; body?: unknown; prefer?: string; token?: string } = {},
) {
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + (options.token || SERVICE_KEY),
    'Content-Type': 'application/json',
  };
  if (options.prefer) headers.Prefer = options.prefer;
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const responseText = await response.text();
  let data: unknown = null;
  try { data = responseText ? JSON.parse(responseText) : null; } catch { data = responseText; }
  if (!response.ok) {
    const detail = typeof data === 'object' && data
      ? String((data as Json).message || (data as Json).error || response.status)
      : String(data || response.status);
    throw new Error(detail);
  }
  return data;
}

async function getUser(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Najprv sa prihláste.');
  const token = auth.slice(7).trim();
  const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token },
  });
  if (!response.ok) throw new Error('Prihlásenie vypršalo. Prihláste sa znova.');
  const user = await response.json();
  return { user, token };
}

async function isStaff(userId: string) {
  const rows = await rest('staff?user_id=eq.' + encodeURIComponent(userId) + '&active=eq.true&select=user_id');
  return Array.isArray(rows) && rows.length > 0;
}

async function linkedOwnerIds(userId: string) {
  const rows = await rest(
    'customer_owner_links?user_id=eq.' + encodeURIComponent(userId) + '&select=owner_id',
  ) as Array<{ owner_id: number }>;
  return rows.map((row) => Number(row.owner_id));
}

async function linkedDogs(userId: string) {
  const ownerIds = await linkedOwnerIds(userId);
  if (!ownerIds.length) return [];
  return await rest(
    'dogs?owner_id=' + encodeURIComponent(inFilter(ownerIds)) +
    '&select=id,owner_id,name,customer_name,age_text,birth_date,breed,weight_kg,sex,neutered,allergies,temperament,default_entry_type,legacy_total_visits,active,booking_late_exception,photo_path,photo_updated_at,share_name_photo,share_name_photo_at,share_name_photo_version&order=name.asc',
  ) as Array<Json>;
}

async function signedPhotoUrl(pathValue: unknown, expiresIn = 3600) {
  const path = cleanText(pathValue, 500);
  if (!path) return null;
  const objectPath = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    SUPABASE_URL + '/storage/v1/object/sign/dog-profile-photos/' + objectPath,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    },
  );
  if (!response.ok) return null;
  const result = await response.json().catch(() => ({})) as Json;
  const signed = String(result.signedURL || result.signedUrl || '');
  if (!signed) return null;
  return signed.startsWith('http') ? signed : SUPABASE_URL + '/storage/v1' + signed;
}

async function getAppSetting(key: string) {
  const rows = await rest(
    'app_settings?setting_key=eq.' + encodeURIComponent(key) + '&select=setting_value&limit=1',
  ) as Array<Json>;
  return cleanText(rows[0]?.setting_value, 500);
}

async function staffChatPhotoUrl() {
  const path = await getAppSetting('chat_staff_photo_path');
  return path ? await signedPhotoUrl(path, 86400) : null;
}

async function uploadStaffChatPhoto(payload: Json) {
  const imageData = String(payload.image_data || '');
  const match = imageData.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Fotografia musí byť vo formáte JPEG.');
  let bytes: Uint8Array;
  try {
    const binary = atob(match[1]);
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Error('Fotografiu sa nepodarilo načítať.');
  }
  if (!bytes.length || bytes.length > 1048576) throw new Error('Fotografia môže mať najviac 1 MB.');

  const previousPath = await getAppSetting('chat_staff_photo_path');
  const path = 'staff/chat/' + crypto.randomUUID() + '.jpg';
  const objectPath = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    SUPABASE_URL + '/storage/v1/object/dog-profile-photos/' + objectPath,
    {
      method:'POST',
      headers:{
        apikey:SERVICE_KEY,
        Authorization:'Bearer ' + SERVICE_KEY,
        'Content-Type':'image/jpeg',
        'Cache-Control':'3600',
        'x-upsert':'false',
      },
      body:bytes,
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('Fotografiu sa nepodarilo uložiť: ' + detail.slice(0, 180));
  }

  const updatedAt = new Date().toISOString();
  try {
    await rest('app_settings?on_conflict=setting_key', {
      method:'POST',
      prefer:'resolution=merge-duplicates,return=representation',
      body:{setting_key:'chat_staff_photo_path',setting_value:path,updated_at:updatedAt},
    });
  } catch (error) {
    await removeProfilePhoto(path);
    throw error;
  }
  if (previousPath && previousPath !== path && previousPath.startsWith('staff/chat/')) await removeProfilePhoto(previousPath);
  return {photo_path:path,photo_url:await signedPhotoUrl(path,86400),updated_at:updatedAt};
}

async function withSignedPhotos(rows: Array<Json>, userId?: string) {
  const photos = userId && rows.length ? await rest('customer_dog_photos?user_id=eq.' + encodeURIComponent(userId) + '&dog_id=' + encodeURIComponent(inFilter(rows.map(row => Number(row.id)))) + '&select=dog_id,photo_path,updated_at') as Array<Json> : [];
  const own = new Map(photos.map(photo => [Number(photo.dog_id), photo]));
  return await Promise.all(rows.map(async (row) => {
    const personal = own.get(Number(row.id));
    const path = personal ? personal.photo_path : row.photo_path;
    return {...row, photo_path: path, photo_updated_at: personal ? personal.updated_at : row.photo_updated_at,
      personal_photo: !!personal, photo_url: await signedPhotoUrl(path)};
  }));
}

async function signedVaccinationProofUrl(pathValue: unknown) {
  const path = cleanText(pathValue, 500);
  if (!path) return null;
  const objectPath = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    SUPABASE_URL + '/storage/v1/object/sign/vaccination-proof-photos/' + objectPath,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    },
  );
  if (!response.ok) return null;
  const result = await response.json().catch(() => ({})) as Json;
  const signed = String(result.signedURL || result.signedUrl || '');
  if (!signed) return null;
  return signed.startsWith('http') ? signed : SUPABASE_URL + '/storage/v1' + signed;
}

async function withSignedVaccinationProofs(rows: Array<Json>) {
  return await Promise.all(rows.map(async (row) => ({
    ...row,
    image_url: await signedVaccinationProofUrl(row.storage_path),
  })));
}

function localDateIso() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return String(value.year) + '-' + String(value.month) + '-' + String(value.day);
}

function addDays(iso: string, days: number) {
  const date = new Date(iso + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextMonday() {
  const today = localDateIso();
  const day = new Date(today + 'T12:00:00Z').getUTCDay();
  const mondayOffset = ((8 - day) % 7) || 7;
  return addDays(today, mondayOffset);
}

async function ensureProfile(user: Json) {
  const userId = String(user.id);
  let rows = await rest(
    'customer_profiles?user_id=eq.' + encodeURIComponent(userId) + '&select=*',
  ) as Array<Json>;
  if (rows.length) return rows[0];

  const metadata = (user.user_metadata || {}) as Json;
  const payload = {
    user_id: userId,
    email: cleanText(user.email, 320),
    full_name: cleanText(metadata.full_name, 120),
    phone: normalizePhone(metadata.phone),
    status: 'pending',
  };
  rows = await rest('customer_profiles?on_conflict=user_id', {
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=representation',
  }) as Array<Json>;
  return rows[0] || payload;
}

async function ensureDogSubmission(user: Json) {
  const userId = String(user.id);
  const metadata = (user.user_metadata || {}) as Json;
  const dogName = cleanText(metadata.dog_name, 100);
  if (!dogName) return;

  const [links, submissions] = await Promise.all([
    rest('customer_owner_links?user_id=eq.' + encodeURIComponent(userId) + '&select=owner_id'),
    rest('customer_dog_submissions?user_id=eq.' + encodeURIComponent(userId) + '&status=' + encodeURIComponent('in.(pending,approved)') + '&select=id,status,linked_dog_id&limit=10'),
  ]);
  if (Array.isArray(submissions) && submissions.length) return;

  const ownerIds = (Array.isArray(links) ? links : [])
    .map((row: Json) => Number(row.owner_id))
    .filter((id: number) => Number.isFinite(id) && id > 0);
  if (ownerIds.length) {
    const dogs = await rest(
      'dogs?owner_id=' + encodeURIComponent(inFilter(ownerIds)) + '&active=eq.true&select=id&limit=1',
    ) as Array<Json>;
    if (dogs.length) return;
  }

  await rest('customer_dog_submissions', {
    method: 'POST',
    body: { user_id: userId, dog_name: dogName, status: 'pending' },
  });
}

function nextWeekdays(startIso: string, count: number) {
  const values: string[] = [];
  let cursor = startIso;
  while (values.length < count) {
    const day = new Date(cursor + 'T12:00:00Z').getUTCDay();
    if (day >= 1 && day <= 5) values.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return values;
}

async function getAvailability(userId: string, linkedDogRows?: Array<Json>) {
  const today = localDateIso();
  const weekday = new Date(today + 'T12:00:00Z').getUTCDay();
  const firstMonday = addDays(today, weekday === 0 ? 1 : 1 - weekday);
  const dates = nextWeekdays(firstMonday, 15);
  const monday = dates[0];
  const friday = dates[dates.length - 1];
  const results = await Promise.all([
    rest('reservations?reservation_date=gte.' + monday + '&reservation_date=lte.' + friday + '&status=eq.booked&select=reservation_date,dog_id'),
    rest('customer_booking_requests?reservation_date=gte.' + monday + '&reservation_date=lte.' + friday + '&status=eq.pending&select=reservation_date'),
    rest('portal_day_settings?day=gte.' + monday + '&day=lte.' + friday + '&select=day,capacity,bookings_open,note'),
    linkedDogRows ? Promise.resolve(linkedDogRows) : linkedDogs(userId),
    rest('customer_booking_requests?user_id=eq.' + encodeURIComponent(userId) + '&reservation_date=gte.' + monday + '&reservation_date=lte.' + friday + '&status=eq.approved&select=reservation_date'),
  ]);
  const reservations = results[0] as Array<{ reservation_date: string; dog_id: number }>;
  const pending = results[1] as Array<{ reservation_date: string }>;
  const settings = results[2] as Array<Json>;
  const ownDogs = results[3] as Array<Json>;
  const approvedRequests = results[4] as Array<{ reservation_date: string }>;
  const ownDogIds = new Set(ownDogs.map((dog) => Number(dog.id)));
  const rosterDogIds = [...new Set(reservations.map((row) => Number(row.dog_id)).filter(Boolean))];
  const rosterDogs = rosterDogIds.length
    ? await rest(
      'dogs?id=' + encodeURIComponent(inFilter(rosterDogIds)) +
      '&select=id,name,customer_name,sex,photo_path,photo_updated_at,share_name_photo',
    ) as Array<Json>
    : [];
  const rosterDogMap = new Map(rosterDogs.map((dog) => [Number(dog.id), dog]));
  const settingMap = new Map(settings.map((setting) => [String(setting.day), setting]));
  const days = await Promise.all(dates.map(async (date) => {
    const capacity = Number(settingMap.get(date)?.capacity ?? 8);
    const booked = reservations.filter((row) => row.reservation_date === date).length;
    const waiting = pending.filter((row) => row.reservation_date === date).length;
    const viewerApproved = approvedRequests.some((row) => row.reservation_date === date) ||
      reservations.some((row) => row.reservation_date === date && ownDogIds.has(Number(row.dog_id)));
    const consentedDogs = viewerApproved
      ? reservations.filter((row) => row.reservation_date === date)
        .map((row) => rosterDogMap.get(Number(row.dog_id)))
        .filter((dog) => dog?.share_name_photo === true)
      : [];
    const visibleDogs = await Promise.all(consentedDogs.map(async (dog) => ({
      name: dog?.customer_name || dog?.name || 'Psík',
      sex: dog?.sex || null,
      photo_url: await signedPhotoUrl(dog?.photo_path),
    })));
    return {
      date,
      capacity,
      occupied: booked + waiting,
      available: Math.max(0, capacity - booked - waiting),
      bookings_open: settingMap.get(date)?.bookings_open !== false,
      note: settingMap.get(date)?.note || null,
      roster_visible: viewerApproved,
      dogs: visibleDogs,
      anonymous_dogs: viewerApproved ? Math.max(0, booked - visibleDogs.length) : booked,
    };
  }));
  return { monday, friday, deadline_label: 'nedeľa 20:00', days };
}

async function customerBootstrap(user: Json) {
  const userId = String(user.id);
  const [profile, linkedDogRows] = await Promise.all([
    ensureProfile(user),
    linkedDogs(userId),
    ensureDogSubmission(user),
  ]);
  const dogIds = linkedDogRows.map((dog) => Number(dog.id)).filter(Boolean);
  const sharedActiveRequests = dogIds.length
    ? rest(
      'customer_booking_requests?dog_id=' + encodeURIComponent(inFilter(dogIds)) +
      '&status=' + encodeURIComponent('in.(pending,approved)') +
      '&select=*&order=reservation_date.asc,created_at.asc',
    )
    : Promise.resolve([]);
  const results = await Promise.all([
    rest('customer_dog_submissions?user_id=eq.' + encodeURIComponent(userId) + '&select=*&order=created_at.desc'),
    rest('customer_booking_requests?user_id=eq.' + encodeURIComponent(userId) + '&select=*&order=reservation_date.asc,created_at.asc'),
    sharedActiveRequests,
    rest('portal_notifications?recipient_user_id=eq.' + encodeURIComponent(userId) + '&select=*&order=created_at.desc&limit=30'),
    getAvailability(userId, linkedDogRows),
    rest('customer_pass_requests?user_id=eq.' + encodeURIComponent(userId) + '&select=*&order=requested_at.desc'),
    rest('dog_visibility_consents?changed_by=eq.' + encodeURIComponent(userId) + '&select=dog_id,granted,consent_version,created_at&order=created_at.desc'),
    rest('portal_dog_onboarding?user_id=eq.' + encodeURIComponent(userId) + '&select=dog_id,details_prompt_answered_at,details_prompt_skipped'),
    rest('portal_push_subscriptions?user_id=eq.' + encodeURIComponent(userId) + '&active=eq.true&select=id&limit=1'),
  ]);
  const submissions = results[0] as Array<Json>;
  const registrationDogName = cleanText((user.user_metadata as Json | undefined)?.dog_name, 100);
  const nameByDogId = new Map<number,string>();
  for (const submission of submissions) {
    const linkedId = Number(submission.linked_dog_id || 0);
    const submittedName = cleanText(submission.dog_name, 100);
    if (linkedId && submittedName && !nameByDogId.has(linkedId)) nameByDogId.set(linkedId, submittedName);
  }
  const dogs = await withSignedPhotos(linkedDogRows.map((dog) => ({
    ...dog,
    name: nameByDogId.get(Number(dog.id)) ||
      (linkedDogRows.length === 1 ? registrationDogName : null) ||
      cleanText(dog.customer_name, 100) ||
      dog.name,
  })), userId);
  const ownRequests = results[1] as Array<Json>;
  const dogRequests = results[2] as Array<Json>;
  const requests = [...new Map(
    [...ownRequests, ...dogRequests].map((row) => [Number(row.id), row]),
  ).values()].map((row) => {
    const { user_id: requestUserId, ...dogBooking } = row;
    return { ...dogBooking, can_manage: String(requestUserId) === userId };
  });
  const notifications = results[3] as Array<Json>;
  const availability = results[4] as Json;
  const [sharedPassRequests, otherDogOnboarding] = dogIds.length ? await Promise.all([
    rest('customer_pass_requests?dog_id=' + encodeURIComponent(inFilter(dogIds)) + '&status=eq.pending&select=id,dog_id,total_entries,status,requested_at'),
    rest('portal_dog_onboarding?dog_id=' + encodeURIComponent(inFilter(dogIds)) + '&user_id=neq.' + encodeURIComponent(userId) + '&select=dog_id,details_prompt_answered_at'),
  ]) as [Array<Json>,Array<Json>] : [[],[]];
  const passRequests = [...new Map([...(results[5] as Array<Json>),...sharedPassRequests].map(row => [Number(row.id),row])).values()];
  const visibilityConsents = results[6] as Array<Json>;
  const dogOnboarding = results[7] as Array<Json>;
  const pushSubscriptions = results[8] as Array<Json>;
  const [conversations, chatStaffPhotoUrl, chatStaffPhone] = await Promise.all([
    rest(
      'portal_conversations?customer_user_id=eq.' + encodeURIComponent(userId) + '&select=id&limit=1',
    ) as Promise<Array<Json>>,
    staffChatPhotoUrl(),
    getAppSetting('chat_staff_phone'),
  ]);
  const conversationId = conversations.length ? Number(conversations[0].id) : null;
  const messages = conversationId
    ? await rest('portal_messages?conversation_id=eq.' + conversationId + '&select=*&order=created_at.asc&limit=200') as Array<Json>
    : [];

  let passes: Array<Json> = [];
  let vaccinations: Array<Json> = [];
  let vaccinationProofs: Array<Json> = [];
  let reservations: Array<Json> = [];
  let visits: Array<Json> = [];
  let monthlyTotals: Array<Json> = [];
  if (dogIds.length) {
    const dogFilter = encodeURIComponent(inFilter(dogIds));
    const dogResults = await Promise.all([
      rest('passes?dog_id=' + dogFilter + '&status=' + encodeURIComponent('in.(active,queued)') + '&select=id,dog_id,total_entries,used_entries,purchased_on,valid_from,valid_until,no_expiry,status&order=created_at.asc'),
      rest('vaccinations?dog_id=' + dogFilter + '&select=id,dog_id,vaccination_type,valid_until,notes&order=vaccination_type.asc'),
      rest('reservations?dog_id=' + dogFilter + '&reservation_date=gte.' + localDateIso() + '&status=eq.booked&select=id,dog_id,reservation_date,entry_type,planned_entry_number,planned_pass_total,taxi_mode,taxi_amount&order=reservation_date.asc'),
      rest('visits?dog_id=' + dogFilter + '&select=id,dog_id,visit_date&order=visit_date.desc'),
      rest('monthly_visit_totals?dog_id=' + dogFilter + '&select=dog_id,month,visits&order=month.desc'),
      rest('vaccination_proofs?dog_id=' + dogFilter + '&is_current=eq.true&select=id,dog_id,batch_id,storage_path,source,uploaded_at&order=uploaded_at.desc'),
    ]);
    passes = dogResults[0] as Array<Json>;
    vaccinations = dogResults[1] as Array<Json>;
    reservations = dogResults[2] as Array<Json>;
    visits = dogResults[3] as Array<Json>;
    monthlyTotals = dogResults[4] as Array<Json>;
    vaccinationProofs = await withSignedVaccinationProofs(dogResults[5] as Array<Json>);
  }

  return {
    profile,
    dogs,
    submissions,
    requests,
    pass_requests: passRequests,
    visibility_consents: visibilityConsents,
    dog_onboarding: dogOnboarding,
    other_owner_onboarded_dog_ids: [...new Set(otherDogOnboarding.filter(row => row.details_prompt_answered_at).map(row => Number(row.dog_id)))],
    push_subscription_active: pushSubscriptions.length > 0,
    passes,
    vaccinations,
    vaccination_proofs: vaccinationProofs,
    reservations,
    visits,
    monthly_totals: monthlyTotals,
    notifications,
    availability,
    conversation_id: conversationId,
    messages,
    chat_staff_photo_url: chatStaffPhotoUrl,
    chat_staff_phone: chatStaffPhone,
  };
}

async function staffBootstrap() {
  const results = await Promise.all([
    rest('customer_profiles?select=*&order=created_at.desc'),
    rest('customer_dog_submissions?status=eq.pending&select=*&order=created_at.asc'),
    rest('customer_booking_requests?or=' + encodeURIComponent('(status.eq.pending,taxi_change_status.eq.pending)') + '&select=*&order=reservation_date.asc,created_at.asc'),
    rest('dogs?active=eq.true&select=id,owner_id,name&order=name.asc'),
    rest('owners?select=id,name,phone&order=name.asc'),
    rest('portal_conversations?select=*&order=last_message_at.desc'),
    rest('portal_messages?select=*&order=created_at.asc&limit=500'),
    rest('customer_pass_requests?status=eq.pending&select=*&order=requested_at.asc'),
  ]);
  return {
    profiles: results[0],
    submissions: results[1],
    bookings: results[2],
    dogs: results[3],
    owners: results[4],
    conversations: results[5],
    messages: results[6],
    pass_requests: results[7],
  };
}

async function requestNewPass(user: Json, payload: Json) {
  const userId = String(user.id);
  const dogId = Number(payload.dog_id || 0);
  const totalEntries = Number(payload.total_entries || 0);
  if (!dogId || !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }
  if (totalEntries !== 10) {
    throw new Error('Zákaznícky portál umožňuje požiadať iba o 10-vstupovú permanentku.');
  }

  const profiles = await rest(
    'customer_profiles?user_id=eq.' + encodeURIComponent(userId) + '&select=status&limit=1',
  ) as Array<Json>;
  if (profiles[0]?.status === 'suspended') {
    throw new Error('Účet je pozastavený. Kontaktujte Chvostíkovo telefonicky.');
  }

  const pending = await rest(
    'customer_pass_requests?user_id=eq.' + encodeURIComponent(userId) +
    '&dog_id=eq.' + dogId + '&status=eq.pending&select=id&limit=1',
  ) as Array<Json>;
  if (pending.length) throw new Error('Žiadosť o novú permanentku už čaká na schválenie.');

  const passes = await rest(
    'passes?dog_id=eq.' + dogId +
    '&status=' + encodeURIComponent('in.(active,queued)') +
    '&select=id,status,used_entries,total_entries,valid_until,no_expiry',
  ) as Array<Json>;
  const today = localDateIso();
  if (passes.some((pass) => pass.status === 'queued')) {
    throw new Error('Psík už má pripravenú ďalšiu permanentku.');
  }
  const active = passes.find((pass) => pass.status === 'active' &&
    Number(pass.used_entries) < Number(pass.total_entries) &&
    (pass.no_expiry === true || !pass.valid_until || String(pass.valid_until) >= today)
  );
  if (active) {
    const used = Number(active.used_entries) || 0;
    const total = Number(active.total_entries) || 0;
    const [reservations, requests] = await Promise.all([
      rest(
        'reservations?dog_id=eq.' + dogId +
        '&reservation_date=gte.' + today +
        '&status=eq.booked&entry_type=eq.pass&select=planned_entry_number,planned_pass_total',
      ) as Promise<Array<Json>>,
      rest(
        'customer_booking_requests?dog_id=eq.' + dogId +
        '&reservation_date=gte.' + today +
        '&status=eq.pending&select=projected_entry_number,projected_pass_total',
      ) as Promise<Array<Json>>,
    ]);
    const reservedEntries = new Set<number>();
    for (const row of reservations) {
      if (Number(row.planned_pass_total) === total) {
        const entry = Number(row.planned_entry_number) || 0;
        if (entry > used && entry <= total) reservedEntries.add(entry);
      }
    }
    for (const row of requests) {
      if (Number(row.projected_pass_total) === total) {
        const entry = Number(row.projected_entry_number) || 0;
        if (entry > used && entry <= total) reservedEntries.add(entry);
      }
    }
    const everyRemainingEntryReserved = Array.from(
      { length: Math.max(0, total - used) },
      (_, index) => used + index + 1,
    ).every((entry) => reservedEntries.has(entry));
    if (!everyRemainingEntryReserved) {
      throw new Error('Psík má ešte voľný vstup na aktuálnej permanentke.');
    }
  }

  const rows = await rest('customer_pass_requests', {
    method: 'POST',
    body: { user_id: userId, dog_id: dogId, total_entries: totalEntries },
    prefer: 'return=representation',
  }) as Array<Json>;
  return rows[0];
}

async function saveProfile(user: Json, payload: Json) {
  const fullName = cleanText(payload.full_name, 120);
  const phone = normalizePhone(payload.phone);
  if (!fullName) throw new Error('Zadajte meno a priezvisko.');
  if (!phone) throw new Error('Telefón zadajte v tvare 09… alebo +421…');
  const rows = await rest('customer_profiles?on_conflict=user_id', {
    method: 'POST',
    body: {
      user_id: String(user.id),
      email: cleanText(user.email, 320),
      full_name: fullName,
      phone,
    },
    prefer: 'resolution=merge-duplicates,return=representation',
  }) as Array<Json>;
  const ownerIds = await linkedOwnerIds(String(user.id));
  if (ownerIds.length) {
    await rest('owners?id=' + encodeURIComponent(inFilter(ownerIds)), {
      method: 'PATCH',
      body: { name: fullName, phone },
    });
  }
  return rows[0];
}

function cleanVaccinations(value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(['rabies', 'infectious', 'kennel_cough']);
  return value.flatMap((raw) => {
    const item = raw as Json;
    const type = String(item.type || '');
    if (!allowed.has(type)) return [];
    const validUntil = validIsoDate(item.valid_until);
    if (!validUntil) return [];
    return [{
      type,
      valid_until: validUntil,
      notes: cleanText(item.notes, 300),
    }];
  });
}

function cleanDogPayload(payload: Json) {
  const dogName = cleanText(payload.dog_name, 100);
  if (!dogName) throw new Error('Zadajte meno psíka.');
  const sex = payload.sex === 'male' || payload.sex === 'female' ? payload.sex : null;
  const weightValue = Number(String(payload.weight_kg ?? '').replace(',', '.'));
  const weightKg = Number.isFinite(weightValue) && weightValue > 0 && weightValue <= 150
    ? weightValue
    : null;
  return {
    dog_name: dogName,
    age_text: cleanText(payload.age_text, 80),
    birth_date: validIsoDate(payload.birth_date),
    breed: cleanText(payload.breed, 150),
    weight_kg: weightKg,
    sex,
    neutered: typeof payload.neutered === 'boolean' ? payload.neutered : null,
    allergies: cleanText(payload.allergies, 3000),
    temperament: cleanText(payload.temperament, 1000),
    vaccinations: cleanVaccinations(payload.vaccinations),
  };
}

async function ownsDog(userId: string, dogId: number) {
  const dogs = await linkedDogs(userId);
  return dogs.some((dog) => Number(dog.id) === dogId);
}

async function saveDog(user: Json, payload: Json) {
  const cleaned = cleanDogPayload(payload);
  const userId = String(user.id);
  const dogId = Number(payload.dog_id || 0);
  const vaccinationsProvided = Array.isArray(payload.vaccinations);
  const requiredVaccinations = ['rabies', 'infectious', 'kennel_cough'];
  const today = localDateIso();
  const allDatesPresent = vaccinationsProvided && requiredVaccinations.every((type) =>
    cleaned.vaccinations.some((v) => v.type === type && !!v.valid_until)
  );
  const hasExpiredVaccination = vaccinationsProvided && cleaned.vaccinations.some((v) =>
    requiredVaccinations.includes(v.type) && !!v.valid_until && String(v.valid_until) < today
  );
  const datesComplete = allDatesPresent && !hasExpiredVaccination;
  if (dogId) {
    if (!await ownsDog(userId, dogId)) throw new Error('Tento psík nie je priradený k vášmu účtu.');
    let proofRows: Array<Json> = [];
    if (vaccinationsProvided && datesComplete) {
      proofRows = await rest(
        'vaccination_proofs?dog_id=eq.' + dogId + '&is_current=eq.true&select=id&limit=1',
      ) as Array<Json>;
    }
    if (payload.require_vaccination_proof === true) {
      if (!allDatesPresent) throw new Error('Doplňte platnosť všetkých troch očkovaní.');
      if (hasExpiredVaccination) throw new Error('Očkovanie je po platnosti. Aktualizujte dátum „Platí do“.');
      if (!proofRows.length) throw new Error('Nahrajte aspoň jednu fotografiu očkovacieho preukazu.');
    }
    const dogPatch: Json = {
      age_text: cleaned.age_text,
      birth_date: cleaned.birth_date,
      breed: cleaned.breed,
      weight_kg: cleaned.weight_kg,
      sex: cleaned.sex,
      neutered: cleaned.neutered,
      allergies: cleaned.allergies,
      temperament: cleaned.temperament,
    };
    await rest('dogs?id=eq.' + dogId, {
      method: 'PATCH',
      body: dogPatch,
    });
    if (vaccinationsProvided) {
      await rest(
        'vaccinations?dog_id=eq.' + dogId + '&vaccination_type=' + encodeURIComponent('in.(rabies,infectious,kennel_cough)'),
        { method: 'DELETE' },
      );
      if (cleaned.vaccinations.length) {
        await rest('vaccinations', {
          method: 'POST',
          body: cleaned.vaccinations.map((v) => ({
            dog_id: dogId,
            vaccination_type: v.type,
            valid_until: v.valid_until,
            notes: v.notes,
          })),
        });
      }
    }
    const completeVaccinations = datesComplete && proofRows.length > 0;
    if (completeVaccinations) {
      await rest('portal_dog_onboarding?on_conflict=user_id,dog_id', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: {
          user_id: userId,
          dog_id: dogId,
          details_prompt_answered_at: new Date().toISOString(),
          details_prompt_skipped: false,
        },
      });
    }
    return { dog_id: dogId, linked: true, onboarding_complete: completeVaccinations };
  }

  const submissionId = Number(payload.submission_id || 0);
  const body = { user_id: userId, ...cleaned, status: 'pending' };
  if (submissionId) {
    const { dog_name: _ignoredDogName, ...editableBody } = body;
    const rows = await rest(
      'customer_dog_submissions?id=eq.' + submissionId + '&user_id=eq.' +
      encodeURIComponent(userId) + '&status=eq.pending',
      { method: 'PATCH', body: editableBody, prefer: 'return=representation' },
    ) as Array<Json>;
    if (!rows.length) throw new Error('Profil psíka už nie je možné upraviť.');
    return rows[0];
  }
  const rows = await rest('customer_dog_submissions', {
    method: 'POST',
    body,
    prefer: 'return=representation',
  }) as Array<Json>;
  return rows[0];
}

async function sendMessage(user: Json, staff: boolean, payload: Json) {
  const userId = String(user.id);
  const body = cleanText(payload.message, 2000);
  if (!body) throw new Error('Napíšte správu.');
  let customerUserId = userId;
  let senderRole = 'customer';
  let conversationId = Number(payload.conversation_id || 0);

  if (staff) {
    senderRole = 'staff';
    if (!conversationId) throw new Error('Konverzácia sa nenašla.');
    const rows = await rest('portal_conversations?id=eq.' + conversationId + '&select=customer_user_id&limit=1') as Array<Json>;
    if (!rows.length) throw new Error('Konverzácia sa nenašla.');
    customerUserId = String(rows[0].customer_user_id);
  } else {
    const profiles = await rest('customer_profiles?user_id=eq.' + encodeURIComponent(userId) + '&select=status&limit=1') as Array<Json>;
    if (profiles[0]?.status === 'suspended') throw new Error('Účet je pozastavený. Kontaktujte Chvostíkovo telefonicky.');
    const rows = await rest('portal_conversations?customer_user_id=eq.' + encodeURIComponent(userId) + '&select=id&limit=1') as Array<Json>;
    if (rows.length) conversationId = Number(rows[0].id);
    else {
      const created = await rest('portal_conversations', {
        method: 'POST',
        body: { customer_user_id: userId },
        prefer: 'return=representation',
      }) as Array<Json>;
      conversationId = Number(created[0]?.id || 0);
    }
  }
  if (!conversationId) throw new Error('Konverzáciu sa nepodarilo vytvoriť.');

  const bookingId = Number(payload.booking_request_id || 0) || null;
  if (bookingId && !staff) {
    const rows = await rest(
      'customer_booking_requests?id=eq.' + bookingId + '&user_id=eq.' + encodeURIComponent(userId) + '&select=id&limit=1',
    ) as Array<Json>;
    if (!rows.length) throw new Error('Vybraná rezervácia nepatrí k vášmu účtu.');
  }
  const rows = await rest('portal_messages', {
    method: 'POST',
    body: {
      conversation_id: conversationId,
      sender_user_id: userId,
      sender_role: senderRole,
      body,
      booking_request_id: bookingId,
    },
    prefer: 'return=representation',
  }) as Array<Json>;
  return { conversation_id: conversationId, message: rows[0], customer_user_id: customerUserId };
}

async function markMessagesRead(userId: string, staff: boolean, conversationId: number) {
  if (staff) {
    await rest('portal_messages?conversation_id=eq.' + conversationId + '&sender_role=eq.customer&read_at=is.null', {
      method: 'PATCH', body: { read_at: new Date().toISOString() },
    });
  } else {
    const conversations = await rest(
      'portal_conversations?id=eq.' + conversationId + '&customer_user_id=eq.' + encodeURIComponent(userId) + '&select=id&limit=1',
    ) as Array<Json>;
    if (!conversations.length) throw new Error('Konverzácia sa nenašla.');
    const readAt = new Date().toISOString();
    await rest('portal_messages?conversation_id=eq.' + conversationId + '&sender_role=eq.staff&read_at=is.null', {
      method: 'PATCH', body: { read_at: readAt },
    });
    // Shadow notification for the same conversation is read together with the actual message.
    await rest('portal_notifications?recipient_user_id=eq.' + encodeURIComponent(userId)
      + '&notification_type=eq.staff_message_customer&entity_type=eq.conversation&entity_id=eq.'
      + conversationId + '&read_at=is.null&created_at=lte.' + encodeURIComponent(readAt), {
      method: 'PATCH', body: { read_at: readAt },
    });
  }
  return true;
}

async function uploadVaccinationProofs(userId: string, staff: boolean, payload: Json) {
  const dogId = Number(payload.dog_id || 0);
  if (!dogId) throw new Error('Psík sa nenašiel.');
  if (!staff && !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }
  const images = Array.isArray(payload.images) ? payload.images : [];
  if (!images.length) throw new Error('Vyberte aspoň jednu fotografiu očkovacieho preukazu.');
  if (images.length > 5) throw new Error('Naraz môžete nahrať najviac 5 fotografií.');

  const decoded: Uint8Array[] = [];
  for (const value of images) {
    const imageData = String(value || '');
    const match = imageData.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error('Fotografie musia byť vo formáte JPEG.');
    let bytes: Uint8Array;
    try {
      const binary = atob(match[1]);
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    } catch {
      throw new Error('Fotografiu sa nepodarilo načítať.');
    }
    if (!bytes.length || bytes.length > 1258291) {
      throw new Error('Jedna fotografia môže mať po úprave najviac 1,2 MB.');
    }
    decoded.push(bytes);
  }

  const append = payload.append === true;
  const existing = append ? await rest(
    'vaccination_proofs?dog_id=eq.' + dogId + '&is_current=eq.true&select=id,dog_id,batch_id,storage_path,source,uploaded_at&order=uploaded_at.desc',
  ) as Array<Json> : [];
  if (existing.length + images.length > 5) {
    throw new Error('Na jedného psíka možno uložiť najviac 5 fotografií.');
  }
  const batchId = append && existing.length ? String(existing[0].batch_id) : crypto.randomUUID();
  const uploadedAt = new Date().toISOString();
  const source = staff ? 'staff' : 'customer';
  const uploadedPaths: string[] = [];
  try {
    for (const bytes of decoded) {
      const path = 'dogs/' + dogId + '/' + batchId + '/' + crypto.randomUUID() + '.jpg';
      const objectPath = path.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(
        SUPABASE_URL + '/storage/v1/object/vaccination-proof-photos/' + objectPath,
        {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: 'Bearer ' + SERVICE_KEY,
            'Content-Type': 'image/jpeg',
            'Cache-Control': '3600',
            'x-upsert': 'false',
          },
          body: bytes,
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error('Fotografiu očkovania sa nepodarilo uložiť: ' + detail.slice(0, 160));
      }
      uploadedPaths.push(path);
    }

    const inserted = await rest('vaccination_proofs', {
      method: 'POST',
      body: uploadedPaths.map((path) => ({
        dog_id: dogId,
        uploaded_by: userId,
        batch_id: batchId,
        storage_path: path,
        source,
        is_current: true,
        uploaded_at: uploadedAt,
      })),
      prefer: 'return=representation',
    }) as Array<Json>;

    if (!append) await rest(
      'vaccination_proofs?dog_id=eq.' + dogId + '&is_current=eq.true&batch_id=neq.' + encodeURIComponent(batchId),
      {
        method: 'PATCH',
        body: { is_current: false, replaced_at: uploadedAt },
      },
    );

    return {
      dog_id: dogId,
      batch_id: batchId,
      proofs: await withSignedVaccinationProofs(append ? [...existing, ...inserted] : inserted),
    };
  } catch (error) {
    if (uploadedPaths.length) {
      await fetch(SUPABASE_URL + '/storage/v1/object/vaccination-proof-photos', {
        method: 'DELETE',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: 'Bearer ' + SERVICE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: uploadedPaths }),
      }).catch(() => undefined);
    }
    throw error;
  }
}

async function adminVaccinationProofs(dogId: number) {
  if (!dogId) throw new Error('Psík sa nenašiel.');
  const rows = await rest(
    'vaccination_proofs?dog_id=eq.' + dogId +
    '&is_current=eq.true&select=id,dog_id,batch_id,storage_path,source,uploaded_at&order=uploaded_at.desc',
  ) as Array<Json>;
  return await withSignedVaccinationProofs(rows);
}

async function removeProfilePhoto(path: string) {
  await fetch(SUPABASE_URL + '/storage/v1/object/dog-profile-photos', {
    method:'DELETE', headers:{apikey:SERVICE_KEY,Authorization:'Bearer ' + SERVICE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({prefixes:[path]}),
  }).catch(() => undefined);
}

async function uploadDogPhoto(userId: string, staff: boolean, payload: Json) {
  const dogId = Number(payload.dog_id || 0);
  if (!dogId) throw new Error('Psík sa nenašiel.');
  if (!staff && !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }

  const imageData = String(payload.image_data || '');
  const match = imageData.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Fotografia musí byť vo formáte JPEG.');
  let bytes: Uint8Array;
  try {
    const binary = atob(match[1]);
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Error('Fotografiu sa nepodarilo načítať.');
  }
  if (!bytes.length || bytes.length > 1048576) {
    throw new Error('Fotografia môže mať najviac 1 MB.');
  }

  const currentRows = await rest(
    staff ? 'dogs?id=eq.' + dogId + '&select=photo_path&limit=1' : 'customer_dog_photos?dog_id=eq.' + dogId + '&user_id=eq.' + encodeURIComponent(userId) + '&select=photo_path&limit=1',
  ) as Array<Json>;
  if (staff && !currentRows.length) throw new Error('Psík sa nenašiel.');
  const previousPath = cleanText(currentRows[0]?.photo_path, 500);
  const path = (staff ? 'dogs/' : 'customers/' + userId + '/' + dogId + '/') + crypto.randomUUID() + '.jpg';
  const objectPath = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    SUPABASE_URL + '/storage/v1/object/dog-profile-photos/' + objectPath,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'image/jpeg',
        'Cache-Control': '3600',
        'x-upsert': 'false',
      },
      body: bytes,
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('Fotografiu sa nepodarilo uložiť: ' + detail.slice(0, 180));
  }

  const updatedAt = new Date().toISOString();
  try {
    await rest(staff ? 'dogs?id=eq.' + dogId : 'customer_dog_photos?on_conflict=dog_id,user_id', {
      method: staff ? 'PATCH' : 'POST',
      prefer: staff ? undefined : 'resolution=merge-duplicates,return=representation',
      body: staff ? {photo_path:path,photo_updated_at:updatedAt} : {dog_id:dogId,user_id:userId,photo_path:path},
    });
  } catch (error) {
    await removeProfilePhoto(path);
    throw error;
  }
  if (previousPath && previousPath.startsWith(staff ? 'dogs/' : 'customers/' + userId + '/' + dogId + '/')) await removeProfilePhoto(previousPath);

  return { dog_id: dogId, photo_path: path, photo_updated_at: updatedAt };
}

async function deleteDogPhoto(userId: string, staff: boolean, payload: Json) {
  const dogId = Number(payload.dog_id || 0);
  if (!dogId) throw new Error('Psík sa nenašiel.');
  if (!staff && !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }

  const currentRows = await rest(
    staff ? 'dogs?id=eq.' + dogId + '&select=photo_path&limit=1' : 'customer_dog_photos?dog_id=eq.' + dogId + '&user_id=eq.' + encodeURIComponent(userId) + '&select=photo_path&limit=1',
  ) as Array<Json>;
  if (staff && !currentRows.length) throw new Error('Psík sa nenašiel.');

  const previousPath = cleanText(currentRows[0]?.photo_path, 500);
  const updatedAt = new Date().toISOString();
  await rest(staff ? 'dogs?id=eq.' + dogId : 'customer_dog_photos?on_conflict=dog_id,user_id', {
    method: staff ? 'PATCH' : 'POST',
    prefer: staff ? undefined : 'resolution=merge-duplicates,return=representation',
    body: staff ? {photo_path:null,photo_updated_at:updatedAt} : {dog_id:dogId,user_id:userId,photo_path:null},
  });

  if (previousPath && previousPath.startsWith(staff ? 'dogs/' : 'customers/' + userId + '/' + dogId + '/')) await removeProfilePhoto(previousPath);

  return { dog_id: dogId, photo_path: null, photo_updated_at: updatedAt };
}

async function setPhotoVisibility(userId: string, staff: boolean, payload: Json) {
  const dogId = Number(payload.dog_id || 0);
  const granted = payload.granted === true;
  if (!dogId) throw new Error('Psík sa nenašiel.');
  if (!staff && !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }
  const current = await rest('dogs?id=eq.' + dogId + '&select=id&limit=1') as Array<Json>;
  if (!current.length) throw new Error('Psík sa nenašiel.');
  const decidedAt = new Date().toISOString();
  await rest('dogs?id=eq.' + dogId, {
    method: 'PATCH',
    body: {
      share_name_photo: granted,
      share_name_photo_at: decidedAt,
      share_name_photo_version: '2026-09-09',
    },
  });
  await rest('dog_visibility_consents', {
    method: 'POST',
    body: { dog_id: dogId, changed_by: userId, granted, consent_version: '2026-09-09' },
  });
  return { dog_id: dogId, granted, decided_at: decidedAt };
}

async function completePushPrompt(user: Json) {
  const userId = String(user.id);
  await ensureProfile(user);
  const answeredAt = new Date().toISOString();
  await rest('customer_profiles?user_id=eq.' + encodeURIComponent(userId), {
    method: 'PATCH',
    body: { push_prompt_answered_at: answeredAt },
  });
  return { answered_at: answeredAt };
}

async function setDogDetailsPrompt(userId: string, payload: Json) {
  const dogId = Number(payload.dog_id || 0);
  if (!dogId || !await ownsDog(userId, dogId)) {
    throw new Error('Tento psík nie je priradený k vášmu účtu.');
  }
  const answeredAt = new Date().toISOString();
  const skipped = payload.skipped === true;
  await rest('portal_dog_onboarding?on_conflict=user_id,dog_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: {
      user_id: userId,
      dog_id: dogId,
      details_prompt_answered_at: answeredAt,
      details_prompt_skipped: skipped,
    },
  });
  return { dog_id: dogId, skipped, answered_at: answeredAt };
}

async function userRpc(name: string, args: Json, token: string) {
  return await rest('rpc/' + name, {
    method: 'POST',
    body: args,
    token,
    prefer: 'return=representation',
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!SUPABASE_URL || !SERVICE_KEY) return fail('Chýba konfigurácia servera.', 500);
  try {
    const auth = await getUser(req);
    const user = auth.user as Json;
    const token = auth.token;
    const staff = await isStaff(String(user.id));

    if (req.method === 'GET') {
      const result = await customerBootstrap(user);
      return json({ ...result, is_staff: staff, staff: staff ? await staffBootstrap() : null });
    }
    if (req.method !== 'POST') return fail('Nepodporovaná metóda.', 405);

    const body = await req.json().catch(() => ({})) as Json;
    const action = String(body.action || '');
    if (action === 'save_profile') return json({ data: await saveProfile(user, body) });
    if (action === 'save_dog') {
      await ensureProfile(user);
      return json({ data: await saveDog(user, body) });
    }
    if (action === 'upload_vaccination_proofs') {
      return json({ data: await uploadVaccinationProofs(String(user.id), staff, body) });
    }
    if (action === 'upload_dog_photo') {
      return json({ data: await uploadDogPhoto(String(user.id), staff && body.photo_scope !== 'account', body) });
    }
    if (action === 'delete_dog_photo') {
      return json({ data: await deleteDogPhoto(String(user.id), staff && body.photo_scope !== 'account', body) });
    }
    if (action === 'set_photo_visibility') {
      return json({ data: await setPhotoVisibility(String(user.id), staff, body) });
    }
    if (action === 'complete_push_prompt') {
      return json({ data: await completePushPrompt(user) });
    }
    if (action === 'set_dog_details_prompt') {
      return json({ data: await setDogDetailsPrompt(String(user.id), body) });
    }
    if (action === 'request_new_pass') {
      return json({ data: await requestNewPass(user, body) });
    }
    if (action === 'request_late_booking') {
      const dogId = Number(body.dog_id || 0);
      const date = validIsoDate(body.reservation_date);
      const message = cleanText(body.message, 2000);
      if (!dogId || !date || !message) throw new Error('Vyberte psíka, deň a napíšte správu.');
      return json({ data: await userRpc('portal_request_late_booking', {
        p_dog_id: dogId,
        p_reservation_date: date,
        p_message: message,
      }, token) });
    }
    if (action === 'request_booking') {
      const dogId = Number(body.dog_id || 0);
      const date = validIsoDate(body.reservation_date);
      const taxiMode = ['none', 'pickup', 'pickup_dropoff'].includes(String(body.taxi_mode || ''))
        ? String(body.taxi_mode)
        : 'none';
      if (!dogId || !date) throw new Error('Vyberte psíka a deň.');
      return json({ data: await userRpc('portal_request_booking', {
        p_dog_id: dogId,
        p_reservation_date: date,
        p_taxi_mode: taxiMode,
      }, token) });
    }
    if (action === 'cancel_booking') {
      const requestId = Number(body.request_id || 0);
      const reservationId = Number(body.reservation_id || 0);
      const reason = cleanText(body.reason, 500);
      if (requestId) {
        return json({ data: await userRpc('portal_cancel_booking', {
          p_request_id: requestId,
          p_reason: reason,
        }, token) });
      }
      if (reservationId) {
        return json({ data: await userRpc('portal_cancel_reservation', {
          p_reservation_id: reservationId,
          p_reason: reason,
        }, token) });
      }
      throw new Error('Rezervácia sa nenašla.');
    }
    if (action === 'request_taxi_change') {
      const requestId = Number(body.request_id || 0);
      const taxiMode = String(body.taxi_mode || '');
      if (!requestId || !['pickup', 'pickup_dropoff'].includes(taxiMode)) {
        throw new Error('Vyberte rezerváciu a možnosť taxi.');
      }
      return json({ data: await userRpc('portal_request_taxi_change', {
        p_request_id: requestId,
        p_taxi_mode: taxiMode,
      }, token) });
    }
    if (action === 'mark_notifications_read') {
      await rest('portal_notifications?recipient_user_id=eq.' + encodeURIComponent(String(user.id)) + '&read_at=is.null', {
        method: 'PATCH',
        body: { read_at: new Date().toISOString() },
      });
      return json({ data: true });
    }
    if (action === 'send_message') {
      return json({ data: await sendMessage(user, false, body) });
    }
    if (action === 'mark_messages_read') {
      return json({ data: await markMessagesRead(String(user.id), false, Number(body.conversation_id || 0)) });
    }

    if (!staff) return fail('Nemáte oprávnenie.', 403);
    if (action === 'admin_chat_photo') {
      return json({ data: { photo_url: await staffChatPhotoUrl() } });
    }
    if (action === 'admin_upload_chat_photo') {
      return json({ data: await uploadStaffChatPhoto(body) });
    }
    if (action === 'admin_vaccination_proofs') {
      return json({ data: await adminVaccinationProofs(Number(body.dog_id || 0)) });
    }
    if (action === 'admin_send_message') {
      return json({ data: await sendMessage(user, true, body) });
    }
    if (action === 'admin_mark_messages_read') {
      return json({ data: await markMessagesRead(String(user.id), true, Number(body.conversation_id || 0)) });
    }
    if (action === 'staff_photo_urls') {
      const ids = Array.isArray(body.dog_ids)
        ? body.dog_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0).slice(0, 500)
        : [];
      const dogs = ids.length
        ? await rest('dogs?id=' + encodeURIComponent(inFilter(ids)) + '&select=id,owner_id,photo_path,photo_updated_at') as Array<Json>
        : [];
      const photos = ids.length ? await rest('customer_dog_photos?dog_id=' + encodeURIComponent(inFilter(ids)) + '&select=dog_id,user_id,photo_path,updated_at') as Array<Json> : [];
      const userIds = [...new Set(photos.map(photo => String(photo.user_id)))];
      const profiles = userIds.length ? await rest('customer_profiles?user_id=' + encodeURIComponent(inFilter(userIds)) + '&select=user_id,full_name') as Array<Json> : [];
      const links = userIds.length ? await rest('customer_owner_links?user_id=' + encodeURIComponent(inFilter(userIds)) + '&select=user_id,owner_id') as Array<Json> : [];
      const names = new Map(profiles.map(profile => [String(profile.user_id), profile.full_name]));
      return json({ data: await Promise.all(dogs.map(async (dog) => ({
        id:Number(dog.id), photo_url:await signedPhotoUrl(dog.photo_path), photo_updated_at:dog.photo_updated_at || null,
        owner_photos:await Promise.all(photos.filter(photo => Number(photo.dog_id)===Number(dog.id) && photo.photo_path && links.some(link => String(link.user_id)===String(photo.user_id) && Number(link.owner_id)===Number(dog.owner_id))).map(async photo => ({
          owner_name:names.get(String(photo.user_id)) || 'Majiteľ', photo_url:await signedPhotoUrl(photo.photo_path), updated_at:photo.updated_at,
        }))),
      }))) });
    }
    if (action === 'admin_approve_booking') {
      return json({ data: await userRpc('portal_approve_booking', {
        p_request_id: Number(body.request_id || 0),
        p_decision_note: cleanText(body.note, 500),
      }, token) });
    }
    if (action === 'admin_reject_booking') {
      return json({ data: await userRpc('portal_reject_booking', {
        p_request_id: Number(body.request_id || 0),
        p_decision_note: cleanText(body.note, 500),
      }, token) });
    }
    if (action === 'admin_approve_taxi_change') {
      return json({ data: await userRpc('portal_approve_taxi_change', {
        p_request_id: Number(body.request_id || 0),
        p_decision_note: cleanText(body.note, 500),
      }, token) });
    }
    if (action === 'admin_reject_taxi_change') {
      return json({ data: await userRpc('portal_reject_taxi_change', {
        p_request_id: Number(body.request_id || 0),
        p_decision_note: cleanText(body.note, 500),
      }, token) });
    }
    if (action === 'admin_approve_submission') {
      return json({ data: await userRpc('portal_approve_dog_submission', {
        p_submission_id: Number(body.submission_id || 0),
      }, token) });
    }
    if (action === 'admin_reject_submission') {
      const id = Number(body.submission_id || 0);
      await rest('customer_dog_submissions?id=eq.' + id + '&status=eq.pending', {
        method: 'PATCH',
        body: { status: 'rejected', staff_note: cleanText(body.note, 500) },
      });
      return json({ data: true });
    }
    if (action === 'admin_link_existing_dog') {
      return json({ data: await userRpc('portal_link_existing_dog', {
        p_user_id: String(body.user_id || ''),
        p_dog_id: Number(body.dog_id || 0),
      }, token) });
    }
    return fail('Neznáma akcia.', 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(message, /prihlás|vypršalo/i.test(message) ? 401 : 400);
  }
});
