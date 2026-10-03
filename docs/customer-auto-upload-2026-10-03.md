# Customer release v145

Vaccination photographs upload automatically after preparation. The extra upload button is removed. Existing upload controls retry retained photographs after a failed request. Uploads remain guarded by account, selected dog and stage epoch, and share one in-flight request. Saving vaccinations waits for an active upload; duplicate saves are ignored.

Onboarding avoids showing the details prompt while the dog form or save is active. Synchronization responses started before a local mutation cannot overwrite freshly saved vaccination data.

Android uses one instruction when beforeinstallprompt supplies the native install button, preserving manual fallback and installation completion checks. iOS installation steps remain unchanged.

Validation: JavaScript syntax, diff whitespace, registration audit v143, onboarding UI v144 and native-install/save regression v145. No database, terms, booking, financial or notification schedule changes. Physical device installation remains a user check.
