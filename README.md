# GYM OS — Vercel edition

Arabic/English Cairo UI, member cards (QR + Code128), attendance, billing, staff roles, deterministic Gym Pulse and 13 customizable training templates.

## Deployment

This edition runs native Next.js on Node 24 with PostgreSQL and Supabase Auth email/password sessions. Previous platform build files are retained as historical sources but excluded from TypeScript and unused by npm build. Do not run the old Vinext/Sites scripts.

1. Connect this repository to the existing Vercel project gymos-enterprise. Framework: Next.js. Root directory: repository root. Use the committed vercel.json settings.
2. In Vercel Storage/Marketplace connect the Supabase PostgreSQL project to this project. Prefer a pooled DATABASE_URL.
3. Configure DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Set each environment separately; do not mix production and preview databases. Never commit or paste secret values in chat.
4. Securely pull Development variables using the authenticated Vercel CLI. Run npm ci, then supply a separate administrative MIGRATION_DATABASE_URL on a trusted machine before npm run db:migrate. The runtime gymos_app login cannot alter schemas; never store the administrative URL in the frontend or production runtime. This creates GYM OS tables; Supabase manages its own Auth schema; builds do not migrate or mutate the database.
5. Deploy and verify sign-up, sign-in, tenant isolation, operations and backup restore. Registration creates an empty personal workspace. A staff member signs up separately and claims a one-time gym invitation.

## Move existing club data

Download a full JSON backup from the old site's Club operations → Workspace & device → Backup. Create the owner's account on the new deployment. From the same screen, check Import this club backup from previous hosting into my current account, upload the JSON, review it, and restore. This explicitly rebinds data to the authenticated owner and retains a pre-restore recovery snapshot. Cards, IDs, attendance, finances and training history remain in the backup. New Supabase Auth accounts, passwords, staff invitations and staff grants must be created again; old platform login identities are not migrated. Pending offline attendance must be synchronized on the old origin first. Local offline data does not move between domains. Do not delete the old workspace until verification is complete.

## Authentication limits

Email/password registration and sessions are implemented with Supabase Auth rate limiting. Email confirmation uses Supabase Auth. Configure Auth Site URL and redirect allowlist for /auth/callback. Production email delivery requires your own SMTP provider; the built-in sender is restricted. Password-reset UI and MFA are not implemented. Never trust the old platform's identity headers on Vercel.

## Windows

The existing Windows wrapper still points to the old site. The new Windows source in windows/ reads the deployment HTTPS origin from gymos.json beside the executable. Configure the confirmed deployment URL, rebuild, and distribute after web verification.

## Local checks

npm ci
npm test
npm run typecheck
npm run build

Node 24 is the deployment target. Unit tests use Node 24 native TypeScript stripping. Use npm start after database migration and environment setup. Physical QR scanning, physical printing and Supabase backup import require separate end-to-end verification.

Database tables live in the unexposed gymos schema. anon/authenticated have no direct grants. The dedicated gymos_app database login has only business-table access and no direct access to the managed Auth schema. The server validates identity through a fresh Supabase Auth getUser() response, tenant, staff role and branch before querying/updating data. Frontend metadata is display-only. DATABASE_URL must never be public. TLS verification uses the official Supabase CA bundled under certs/.

## Current deployment

Production: https://gymos-enterprise.vercel.app
Supabase project: GymOS (frsstuqstutbflkaffcx). Production health and anonymous API rejection passed. Create and confirm the owner account before importing the old backup. Authenticated end-to-end acceptance and old-data transfer remain pending; see TEST_REPORT.md.

## Supplement store

Owner/manager navigation includes a bilingual supplement store with product categories, unique per-branch SKU/barcode search, stock receiving by batch/expiry/unit cost, low-stock and expiry summaries, and a multi-product cart. Sales use integer minor currency units and server-side prices with FEFO batch allocation. Expired batches, overselling and cross-branch references are rejected atomically. Walk-in or real member sales support cash/card/transfer recording. Receipts preserve historical prices/costs; full void with a reason restores exact batches and reverses the store collection summary. Receipts are internal, non-tax documents, with a print layout. Store collections are separate from membership payments. Cash/card/transfer are recording methods, not payment processor integrations.

Store data uses the existing tenant-scoped, revision-checked workspace payload and event log; no database migration or new grants are required. Reception staff receive no store arrays and cannot perform store operations. Backup validation includes product/lot/sale references, totals and stock conservation. Legacy backups without store fields remain valid. Authenticated server persistence, actual printer/scanner hardware, and production acceptance remain pending. No partial returns, tax integration, supplier accounts or online checkout are included in this version.

## Member photo, card serial and announcements

Member forms can capture a square JPEG from the device camera, with explicit camera access and a consent reminder. Images are reduced to 160x160, capped at 22 KB each and saved atomically with the member; camera tracks stop after capture or leaving the form. Photos remain subject to the current 1.6 MB total workspace payload limit, so photo storage is intended for compact portraits, not original-resolution files. Removal is supported. Backups validate photo format/size.

Member passes support an externally assigned serial (1–64 ASCII letters/numbers or . _ -), normalized to uppercase with leading zeros retained. Duplicate serials within the gym are rejected. Reassignment invalidates the previous serial; the same value generates QR/Code128 and works in the card check-in form or reception panel. A USB HID keyboard scanner should send the serial followed by Enter with the scan field focused. Native RFID/serial-port devices that do not emulate a keyboard require their vendor integration and are not covered.

Voice announcements support Arabic/English text, available installed/browser voices, test playback, speed and one-time schedules. Arm the intended speaker device explicitly. The app must remain open and the device awake; this is not a background Windows service. A one-minute due window skips stale/missed messages. A per-tenant/branch/device playback marker and browser Web Locks prevent duplicate scheduled requests in tabs sharing that browser profile. Use only one armed physical device; this does not coordinate multiple PCs. Voice names are device-specific. Scheduled speech requires the saved voice on that device. The test browser exposed three English voices and no Arabic voice; install a Windows Arabic speech language pack for Arabic playback. Audible output and real camera/USB hardware still require device acceptance testing.

## Windows encrypted local backup database

The Windows toolbar lets the user choose a SQLite .sqlite file, save an owner-authorized cloud backup, and export the latest snapshot for the currently authenticated owner as JSON for the existing restore screen. Supabase remains authoritative. Choosing another file selects a different backup destination; it does not move previous snapshots or the WebView profile. Backups are manual and require an online owner session. Payloads are encrypted with Windows DPAPI CurrentUser; keep the same Windows account/machine for decryption. For transfer to another PC, export JSON first. Exported JSON is not encrypted and must be protected by the user. The executable contains no database credentials.

Publish Windows: dotnet publish windows/GymOS.Windows.csproj -c Release -r win-x64 --self-contained true -o windows/publish-v2. The single-file executable still requires Microsoft Edge WebView2 Runtime on Windows 10/11 x64. It is unsigned; no code-signing certificate was provided. Backup integration accepts messages only from the configured HTTPS origin during an explicit toolbar request. Smoke test: dotnet run --project tests/windows-backup/BackupSmoke.csproj -c Release.
