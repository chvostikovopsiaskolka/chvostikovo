# Admin chat identity v325

Conversation lists, chat titles and avatars use active dogs assigned to the conversation's customer account, including `allowed_dog_ids`. An empty scope does not fall back to other dogs sharing the operational owner. Legacy null scope retains all active dogs for the linked owner. No accounts, assignments, messages or dog records are changed.

The avatar uses the scoped dog's unique account-name photo from the existing staff photo response, falling back to its main profile photo. This follows the existing profile photo selection convention; the response does not expose photo user IDs. Open chats refresh identity even when messages have not changed. Unchanged images survive signed URL renewal; actual photo-version changes replace them.

Source: exact live v324 MD5 `b6b70f76d1f6caab8045571e0df6931c`, reconstructed from v323 plus the three preserved payment hunks in `tools/admin-live-payment-v324.json`. Candidate MD5 `23c5f4aa4b6c44b304be44bf360cb48d`. Loader, payments and customer app are unchanged.

Validation: the targeted test fails against the old served source; the fully assembled candidate passes actual list/modal/avatar, one/two/zero/inactive/account reassignment/photo replacement, phone and stable image tests with all network requests intercepted and zero mutations. Assembled startup/analytics and vaccination-photo regression tests pass. Physical iOS/Android unobserved.

Release: immutable snapshot backup `backup-admin-before-chat-scope-v325-20261021`, then a single transaction guarded by exact baseline and candidate MD5. Read back the served frontend and execute the targeted test against it. Roll back only after checking for newer releases: restore the backup's HTML to `stable-v10-clean` if current MD5 still equals this candidate. No schema/API/push changes.
