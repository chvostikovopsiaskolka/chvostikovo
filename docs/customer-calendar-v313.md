# Beta 2.0.4 / v313 — late-booking occupancy

Base customer-portal-production 36b629b5864e0f52f4c12efe2d95d72bffb3a2a9 (2.0.3/v312).
Rollback backup/customer-before-calendar-v313 or Vercel dpl_5FRRJFtdPm4zK5Qj8pVpt8Mqp7CT.

Available future days show real occupied/capacity and the same free/limited capacity dot even after the weekly deadline. They retain data-contact=true and the original message handler; this display change does not submit a reservation or bypass cutoff/capacity. Full stays Plno; closed/past/own statuses remain unchanged. The current-week notice states Sunday 20:00 closure and how to request an extra booking by message, including full days. It remains under Tento týždeň throughout the week.

Hide the reservation submit button when no dates are selected, reveal the original Rezervovať N dní button once there is a selection. Hidden attribute has scoped CSS to override older button layout rules.

Validation: full actual runtime 0/1/2 dogs, late 6/8 with limited dot still opens chat, empty submit hidden, selected submit visible, existing taxi/full-day chat retention, badge/popup and vaccine/photo scenarios passed. No backend/DB changes or test sends; production source readback required, physical phones unobserved.
