# Automatic visit reminders (v149)

The default dog reminder mode is now `auto`. Both the SMS feed and the push candidate query inspect active linked customer profiles and active push subscriptions. Automatic mode suppresses visit SMS only when such a subscription exists. Staff can retain explicit SMS, both, or push modes. Introductory visit SMS and the 19:15 Europe/Bratislava push schedule are unchanged.

Permission onboarding explains day-before reminders, vaccinations, pass expiry and the automatic SMS replacement. Provider receipt is not guaranteed by an active subscription; this change does not implement delivery-failure SMS retries.

Bella's registration details and vaccinations were reset after a private database backup. Current proof references were archived and the existing account's push subscriptions deactivated. Reservations, visits, passes and terms acceptances were preserved. Auth deletion is left to the owner; Auth cascades can affect linked account records, and terms evidence is included in the private backup.

Validation: mocked SMS feed covers auto/push suppression and inactive subscription/profile fallback; staff control covers auto/save/error restoration; customer caching/terms isolation tests and admin script/CSS/observer audit pass. Production assets and admin snapshot are compared to source after deployment. No test notifications are sent to customers.
