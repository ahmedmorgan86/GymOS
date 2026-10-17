# GYM OS Web + Windows — Operations release

Cairo Arabic RTL / English LTR. Same React UI in browser and Windows WebView2. Features: members, attendance QR/Code128 cards, batch card printing (100 per action), classes, collections, plans (days/visits), membership replacement/upgrade, freezes, invoices/partial payments and printed statements, deterministic Pulse approvals and prioritized follow-up outcomes, staff access, owner backup/restore and recovery snapshots, local attendance queue and offline shell, text-size controls.

## Run
Node 24+: npm ci; npm run build. Apply migrations in drizzle/ in order to the DB D1 binding before use; the hosting workflow applies them in production. For local development use npm run dev -- --hostname 127.0.0.1 --port 5173, then /signin-with-chatgpt?return_to=/. Local sign-in is a loopback test identity; do not expose the development server.

## Staff
The Site remains owner-private. First grant intended staff Site viewing access through platform sharing (outside this application); no sharing audience is automatically expanded. In Club operations > Workspace & device, owner creates a 24-hour single-use code scoped to current branch. Staff sign in with their own ChatGPT account, claim the invitation and enter the gym. Reception can read branch members/classes/visits and record attendance/bookings, with financial records removed server-side. Managers operate the branch but cannot administer staff, restore backups or alter owner settings. Owner can revoke access. Site admission and gym role are independent.

## Subscription policy
Assignment creates a new invoice and replaces entitlement starting at the chosen date. It does not prorate or refund previous plans; previous debts remain. Daily check-in is unique per member/day. A visit-based plan counts attendance from its start. Freezing starts today through the chosen date, extends expiry by the inclusive duration and blocks attendance/bookings; early unfreeze removes the unused extension.

## Offline
Open online and enable offline attendance on a trusted device. Wait for preparation success; Cairo fonts and app shell are stored locally, and member snapshots/queued visits use IndexedDB scoped to account, gym and role. Only attendance is queued offline; other writes require connection. Sync rechecks identity, role, branch, card, expiry, freeze, quota and a 72-hour timestamp window. Restores change generation and block old queued visits for review. Failed items remain visible; manual resolution moves them to device history. Signing out disables cached opening, preserving pending visits for the same account. There is no encrypted device vault or PIN. Do not clear browser storage while visits are pending.

## Backup
Owner-only JSON export includes business data/cards but never staff invitation codes. Restore validates format, tenant, hash, structure, references and optimistic revision; a pre-restore recovery snapshot is atomically saved server-side. Download recovery snapshots from the same tools screen. Backups contain member information and must be stored appropriately.

## Validation
21 domain/service-worker tests passed; TypeScript and production build pass. Live local API tests covered one-use invite claim, reception data redaction, forbidden writes/backup/team changes, account/branch scope, attendance idempotency/replay/conflict, backup validation/restore and recovery retrieval. Browser tests covered partial plan subscription (800, paid 200, remaining 600), batch issue of 2 passes, local queued check-in during server outage and exactly-once acceptance after reconnection. Final offline cold-opening and physical devices require additional real-device acceptance; see TEST_REPORT.md for exact limits.

## Tests
node --test --test-isolation=none tests/*.test.mjs
npx tsc --noEmit

## Limits
Windows win-x64 requires Edge WebView2; .NET is bundled. First login/preparation requires internet. Per-gym serialized state limit remains 1.6 MB in this edition; this is not a load-tested enterprise deployment. No SMS/WhatsApp delivery, prorated refunds, accounting tax certification or independent tamper-proof audit is claimed.

## Training programs
13 bilingual editable templates: weights, cardio, hybrid, hypertrophy, full body, PPL, upper/lower, functional, circuit, HIIT, mobility, bodyweight and general fitness; unlimited category through custom programs within workspace limits. Coach can add up to 7 schedule days and 20 exercises/day, including rest days, weight (kg), sets, repetition text, minutes, rest seconds and notes. Templates do not prescribe individual loads/dosages; those fields are coach defined. Saving creates an independent copy. Assigning replaces the member's active training program while retaining history. Archived programs remain available to existing assignments. Workout completion does not register gym attendance. Manager/owner may write, reception reads only. Training data is included in account/branch scope and backup validation.
