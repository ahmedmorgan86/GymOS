# GYM OS Enterprise

Arabic/English Cairo interface for Windows and web. Windows release: 1.1.9. The portable WPF/WebView2 host uses the same Next.js interface as the website.

Production service: https://gymos-enterprise.vercel.app/

## Product access

Independent clubs contain their own branches. Commercial platform administration is separate from club ownership. Club owners have full control; administrators operate assigned branches and require all current branches for global/team administration. Reception is currently read-only, including attendance. Do not grant broader permissions merely to bypass this product limitation.

Monthly, annual and perpetual licenses with annual maintenance are supported. Activation uses quotation/manual transfer review; no electronic payment gateway is included. Pending/expired/suspended clubs retain read/export access while operational writes/restore are blocked.

## Safe setup on new hosting

1. Use Node 24 and the committed package lock. Install with npm ci. Build using npm run build (Next.js webpack), never the historical Vinext/Sites scripts.
2. Create separate Supabase/Vercel resources in the intended owner's accounts. Configure the private backend DATABASE_URL and public NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Keep development, preview and production data separate.
3. Provision a limited runtime database login. A separate administrative MIGRATION_DATABASE_URL is required for migrations and must not be stored in the frontend or production runtime.
4. Review base db/*.sql and commercial supabase/migrations/*.sql in dependency order against the target migration history. npm run db:migrate applies only the base schema files; it does NOT install the complete commercial schema. Do not blindly push migrations or replay already-applied policies.
5. Configure Supabase Auth Site URL, callback/recovery redirect allowlists and production email delivery. Sign-up, sign-in and forgot/reset-password UI are implemented; device/email delivery acceptance and provider setup remain necessary. MFA UI is not implemented.
6. Bootstrap a confirmed platform administrator using scripts/platform-admin.mjs on a trusted administrative machine. Never ship this administrative procedure/credentials in the ordinary club package. Enable GYMOS_COMMERCIAL=1 only after commercial setup is complete.
7. Configure windows/gymos.json with the intended HTTPS origin and rebuild for independent hosting. Do not transfer the existing shared production database/project to an individual club.

## Data migration and backups

Synchronize old-origin offline attendance before moving. Preserve source backups until acceptance. In commercial mode, backup restore is restricted to the current tenant/its verified legacy partition; an import checkbox does not permit unrelated cross-club restore. A move to a newly created independent tenant requires a reviewed, authorized migration procedure.

Operational backups do not move Auth passwords, staff invitations/grants or device-local music. JSON exports are unencrypted. Backups up to 64 MiB use scoped 384 KiB chunks and SHA256 verification. Live operational state remains capped at 20,000,000 bytes. Activity history is retained in an append-only archive; the live window is 2000 events and the activity page supports older pages. Apply supabase/migrations/20261020183809_reliable_backups_activity_archive.sql before deploying this release. See PRODUCT_REVIEW_2026-10-20.md.

Normalized entities/photos are stored separately in PostgreSQL, but current read/validation paths reconstruct complete club state and use a workspace revision. Entitlement limits are not load-test capacity promises.

## Windows 1.1.9

Windows 10/11 x64, self-contained .NET 10, requires official Microsoft Edge WebView2 Runtime. Portable executable; no code signing or automatic updater is provided.

Native controls are inside Settings > Windows app settings: choose SQLite backup location, save snapshot, export latest JSON, refresh sign-in and manage official Windows voices. Supabase remains authoritative. SQLite snapshots use Windows DPAPI CurrentUser; export JSON before moving machines/accounts. No database secrets are embedded in the executable. The backup bridge obtains a fresh tenant context and sends X-GymOS-Tenant.

Official music embeds now live inside the music page. The optional expanded native provider player is docked within the main application layout, not a floating or external window. Local music is device/club/branch scoped. Provider accounts/subscriptions/regions can limit playback. Announcements duck local music and stop provider playback; restart the provider manually. Scheduled announcements require the app open and device awake, with one armed speaker device.

Copyright displays © Ahmed Morgan with the current year on web/Windows, including the native splash.

## Checks and manuals

- npm test
- npm run typecheck
- npm run build
- npm run dev
- dotnet publish windows/GymOS.Windows.csproj -c Release -r win-x64 --self-contained true -o windows/release
- dotnet run --project tests/windows-backup/BackupSmoke.csproj -c Release
- dotnet run --project tests/windows-branding/BrandingSmoke.csproj -c Release -- public/icons/icon-512.png

Bilingual handbook sources and renderer: docs/manuals/. Install reportlab, arabic-reshaper and python-bidi, then run python docs/manuals/build_release119.py for all six current manuals. Set GYMOS_MANUAL_OUTPUT to override the delivery output folder. Use docs/manuals/requirements.txt and render every generated PDF page for visual review. Render with Poppler and visually inspect Arabic glyphs, page breaks and every page before distribution. Customer delivery includes manager/employee manuals; keep the platform-owner manual separate.

Current review records responsive/emulated coverage and physical-device limitations. Historical *_VERIFICATION.md / TEST_REPORT.md files describe their dated releases and are not blanket certification of current production.

## Public 30-day demo

/demo provides the self-service trial entry. Owners register their own email/password, create a club, start the free trial once and upload their logo in Settings. Trial entitlement: 1 branch, 1000 members, 5 staff; 30 × 24 hours from database activation, no automatic charge. Apply 20261020192657_public_month_trial.sql before deployment.

The private start_public_trial function is the narrow, audited write boundary: it checks creator/active ownership, serializes claims, refuses existing activation and retains immutable per-owner/per-club claims. Operational APIs reject closed trials using server time. Backup export and the club/billing directory remain available to authorized owners. Trial offline attendance/cached workspace access is disabled.

Windows 1.1.6 also saves a DPAPI-protected local first-trial receipt. It never extends the earlier deadline, counts elapsed calendar time while closed, rejects material clock rollback and checks local time against the server at activation. The server remains authoritative; this is not tamper-proof offline DRM against a machine administrator or a new identity. Local receipts are scoped to the Windows profile; reinstalling does not reset the existing account's server claim.

## Provider music - Windows1.1.9 and web

External platforms open their actual canonical site in a separate small window. Windows uses a480x680 isolated provider window; web requests a popup with a direct-link fallback. No embedded preview-player fallback remains in the music UI. Local audio stays inside GymOS. Sign in with the provider account in its own window; region, subscription and DRM support determine full playback. No provider restriction is bypassed or full-track playback certified.

Autoplay prompts are limited to supported provider hosts. The web app cannot duck audio in another provider window; announcements and provider volume need actual device acceptance. Windows speech stops its provider window. Use Windows1.1.9 so the host matches the current UI contract.

## Release 1.1.8 — member services and operational reports

Read docs/ROLE_REVIEW_2026-10-23_AR_EN.md for exact tested/untested boundaries. Historical features: member PWA and email-bound invitations (current phone/PIN login described below), consented health/vitals, optional automatic camera attendance, check-out and same-day re-entry, shifts, coach pricing/commission/settlements, scoped WhatsApp rules and full HTML/Excel reports. Reception remains read-only under the current policy. Camera matching is optional and requires device/lighting validation; no biometric accuracy certification is claimed.

Apply 20261022212137_member_portal_messaging_presence.sql and 20261022213838_messaging_vault_scheduler.sql after prior migrations on a fresh independent deployment. They add private RLS-protected member/face/messaging tables and narrow Vault-backed encryption/worker authentication. The scheduler migration deliberately installs disabled: change its production URL for independent hosting, verify the deployed /api/cron/whatsapp route, then enable the named job. The shared production scheduler was enabled and an empty authenticated worker returned 200 with zero sent messages on 23 October 2026. No provider connection or real WhatsApp delivery was tested.

### Legacy gym import and backup entry

Import & backups is a dedicated owner/full-administrator entry. Legacy tables accept CSV UTF-8, JSON arrays/keyed tables or bounded XLSX (sheet selection). Import members/membership dates first, then plans/historical payments. Each row needs a stable legacy id; payment member refers to the member legacy ID. Keep the same source key across files. Dates are YYYY-MM-DD, amounts use a decimal dot and card/phone columns remain text. Maximum 500 records: 1 MiB CSV/JSON or 2 MiB XLSX, with bounded decompression and no spreadsheet formulas. Preview/map before approving. Invalid rows block the entire save; existing differing records are not overwritten. Historic invoices/debts/visits/passwords/consents are not inferred from member rows. Proprietary SQL/BAK/SQLite files need a supported table export; GYM OS JSON full restoration is separate and confirmed.

### Public search publishing

/about and /en/about are public product pages; /demo explains the trial. Sitemap lists these three pages only. Private pages/APIs are noindex and authenticated; preview builds block indexing. Set NEXT_PUBLIC_SITE_URL to the HTTPS origin for independent hosting. Optional GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION and YANDEX_SITE_VERIFICATION are public ownership meta codes, not credentials. See docs/SEARCH_PUBLISHING_AR_EN.md for account verification and sitemap submission. node scripts/submit-indexnow.mjs previews public URLs; --submit verifies the production key/pages before notifying IndexNow. Notification acceptance does not guarantee indexing/ranking.

### Verification on 23 October 2026

96 local tests passed, with 5 optional connected PostgreSQL tests run separately successfully. Five API-role integration tests passed. TypeScript, ESLint, local Next production build, GitHub quality workflow and production Vercel status passed. Production dependency audit reported zero advisories; development-only braces/ESLint and database advisory limitations remain documented. Native backup/local-timer/branding/navigation tests passed and fifteen installed Arabic/English voices produced audio bytes. Full visual/device testing, physical scanner/camera/speaker/printer, phone install, actual WhatsApp delivery and subscribed music playback remain unverified. No zero-defect commercial certification is implied.

Interactive member UI preview: /member-preview uses only a fictional, deterministic fixture, makes no member API calls and is noindex. Real member login remains /member. Detailed WhatsApp setup: docs/WHATSAPP_SETUP_AR_EN.md.

## Members Android app

The signed direct-download APK and its checksum metadata are in `public/downloads/`. The main staff app and public Arabic/English site link to the APK and download QR; the member space intentionally contains no installation/download instructions. Android source/build instructions are in `android/`; installation and verification limits are in `docs/ANDROID_MEMBER_APP_AR_EN.md`. Members sign in with their saved mobile and initial PIN 123456, then must change it before viewing records. First-claim risks of a shared default are documented in `docs/MEMBER_APP_CONNECTED_AR_EN.md`. Never publish the private signing keystore/password.


## Release1.1.9 - current operations and member experience

See docs/GYMAWY_FEATURE_GAP_2026-10-25_AR_EN.md for the evidence matrix and remaining gaps. Current additions include branch cash shifts/expenses/supplier purchasing, HR duty/leave/payroll, day passes, competitions, manual WhatsApp templates, private member conversations, editable membership/class prices, confirmed-attendance profile popups, required PIN changes and private product images/commercial details. New fields are optional tenant metadata; no new SQL migration is needed for this release. Keep the existing base/commercial/auth migrations correctly installed.

The member mobile UI adds a daily dashboard, current-term days, weekly attendance, next confirmed class, private balance and direct pass/program/chat actions, with six accessible navigation destinations and expandable workout days. Offline labels identify stale last-refresh information; phone/PIN authentication is unchanged. Android remains the signed1.0.0 WebView shell loading the hosted UI, not a new store release.

Latest validation:153 unit cases and31 mocked API integration cases passed;7 optional connected-database cases skipped. Typecheck, lint, Next build, production dependency audit and Windows build/branding/music-policy tests passed. Six bilingual manuals total87pages. Logs and acceptance limits: docs/verification/2026-10-25-release119. Real provider/device, customer database/load/restore, fresh physical APK install and independent security acceptance remain outstanding. Internal tickets are not a central staffed helpdesk; statutory payroll, staff sales commissions and advanced cross-branch entitlement policies are not certified complete.
