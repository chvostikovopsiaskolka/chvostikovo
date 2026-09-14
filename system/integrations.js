// Documentation for integrations and recovery-critical automations.
(() => {
  const data = window.SYSTEM_DATA;
  if (!data) return;

  if (data.meta) data.meta.updated = '14. 9. 2026';

  if (!data.systems?.some(item => item.name === 'Google Calendar sync')) {
    data.systems = [
      ...(data.systems || []),
      {
        name: 'Google Calendar sync',
        status: 'production',
        statusLabel: 'Produkcia',
        detail: 'Supabase rezervácie sa synchronizujú cez Apps Script Web App do hlavného Google Kalendára Chvostíkova. Supabase ostáva zdroj pravdy.'
      }
    ];
  }

  const section = {
    id: 'integrations',
    title: 'Integrácie a automatizácie',
    description: 'Externé prepojenia, ktoré sú súčasťou produkčnej prevádzky Chvostíkovo APP a musia mať obnoviteľnú zálohu.',
    items: [
      {
        title: 'Google Calendar sync',
        subtitle: 'Supabase → Apps Script → Google Calendar',
        status: 'production',
        statusLabel: 'Produkcia',
        categories: ['admin', 'technical'],
        body: 'Schválené a manuálne rezervácie zo Supabase sa automaticky zapisujú do Google Kalendára. Pri zmene rezervácie sa udalosť aktualizuje a pri zrušení alebo zmazaní rezervácie sa príslušná udalosť odstráni. Supabase je zdroj pravdy; ručné zmazanie udalosti v Google Kalendári nemení rezerváciu v appke.',
        bullets: [
          'Názov jednorazového vstupu: „Meno - škôlka“.',
          'Názov permanentky: napr. „Kevin - škôlka 9/10“.',
          'Čas udalosti: 07:00–17:00.',
          'Farba udalostí zo škôlky: hroznová / MAUVE / Google event color ID 3.',
          'Každá synchronizovaná udalosť obsahuje marker CHVOSTIKOVO_RESERVATION_ID:<id>, podľa ktorého Apps Script bezpečne nájde existujúcu udalosť a nevytvára duplicity.',
          'Rezervácie so source = google_calendar sa neposielajú späť do Google Kalendára, aby nevznikla slučka pri historicky importovaných dátach.',
          'Permanentková rezervácia sa neposiela, kým nemá finálne planned_entry_number a planned_pass_total, aby názov obsahoval správne X/Y.',
          'HTTP požiadavky zo Supabase používajú pg_net a timeout 30 sekúnd.',
          'Apps Script Web App je nasadený ako Execute as: Me / Who has access: Anyone; request je chránený SYNC_SECRET uloženým iba v Script Properties a v private Supabase configu.',
          'Záloha Apps Scriptu: system/backups/google-calendar/CalendarSync.gs',
          'Záloha Supabase funkcií a triggera: system/backups/google-calendar/supabase-calendar-sync.sql',
          'SYNC_SECRET ani živý webhook URL sa zámerne neukladajú do GitHubu.'
        ],
        tags: ['Google Calendar', 'Apps Script', 'pg_net', 'reservations', 'backup', 'MAUVE']
      }
    ]
  };

  const existingIndex = data.sections?.findIndex(item => item.id === section.id) ?? -1;
  if (existingIndex >= 0) {
    data.sections[existingIndex] = section;
  } else {
    data.sections = [...(data.sections || []), section];
  }
})();
