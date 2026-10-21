# Joint late enquiry · v330 / Beta 2.0.13

The two-dog picker previously blocked a late/full date with a generic error. It now opens the existing chat with one editable enquiry containing both selected dog names, the date and a request to confirm both places. The signed-in owner's existing conversation and staff notification route are reused. A joint late enquiry is message-only; it must not call the existing single-dog late-booking RPC or create only one pending reservation. Single-dog and on-time joint booking paths are unchanged. No message is sent until the customer presses Send.

Operational distinction: an enquiry is not a confirmed reservation. Staff must create/confirm both dog reservations after agreeing availability. A pass shared with both dogs then plans one entry per dog, e.g. 1/10 and 2/10, provided it is valid and has capacity. Actual used_entries changes with attendance, not merely with a message or future booking. An individual pass is not automatically shared by adding a second dog's reservation. No pass or booking was created for Didy/Mia while checking this request.

Validation: complete customer runtime with one/two dogs; actual late-day click opens chat, the joint draft contains both names and the real Send handler uses send_message rather than request_late_booking. All network responses in the test are synthetic, with no production sends. Existing stable-photo, taxi menu, pending taxi cancellation, viewport and gesture checks retained. Physical signed-in mobile behavior remains unverified.

Previous taxi work is already deployed: DB taxi_directions_v329, API63, admin-push36, admin stable-v10-clean MD5 4d67fa4dca85a59171db6ef0230e0bcb; customer v329b at merge6681bf6a237c945d5ba80df26240bf056d0bd4d2/deploy dpl_EcRXjR3caRKfgKvTa37pyomqLS4n. This patch does not change backend/admin/pass rules.

Rollback: backup/customer-before-pair-late-v330-20261021 points to 6681bf6a237c945d5ba80df26240bf056d0bd4d2. Selectively revert this customer patch after checking newer work; keep the taxi database/admin releases and real operational data.
