# GYM OS Enterprise

Arabic/English Cairo interface for Windows and web. Windows release: 1.1.5. The portable WPF/WebView2 host uses the same Next.js interface as the website.

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

## Windows 1.1.5

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

Bilingual handbook sources and renderer: docs/manuals/. Install reportlab, arabic-reshaper and python-bidi, then run python docs/manuals/build_manuals.py. Generated files are under ignored outputs/manuals/output/pdf/. Render with Poppler and visually inspect Arabic glyphs, page breaks and every page before distribution. Customer delivery includes manager/employee manuals; keep the platform-owner manual separate.

Current review records responsive/emulated coverage and physical-device limitations. Historical *_VERIFICATION.md / TEST_REPORT.md files describe their dated releases and are not blanket certification of current production.

## Public 30-day demo

/demo provides the self-service trial entry. Owners register their own email/password, create a club, start the free trial once and upload their logo in Settings. Trial entitlement: 1 branch, 1000 members, 5 staff; 30 × 24 hours from database activation, no automatic charge. Apply 20261020192657_public_month_trial.sql before deployment.

The private start_public_trial function is the narrow, audited write boundary: it checks creator/active ownership, serializes claims, refuses existing activation and retains immutable per-owner/per-club claims. Operational APIs reject closed trials using server time. Backup export and the club/billing directory remain available to authorized owners. Trial offline attendance/cached workspace access is disabled.

Windows 1.1.6 also saves a DPAPI-protected local first-trial receipt. It never extends the earlier deadline, counts elapsed calendar time while closed, rejects material clock rollback and checks local time against the server at activation. The server remains authoritative; this is not tamper-proof offline DRM against a machine administrator or a new identity. Local receipts are scoped to the Windows profile; reinstalling does not reset the existing account's server claim.

## Provider preview playback — Windows 1.1.7

On Windows, opening/saving a provider link now defaults to that provider's canonical web player in the existing docked app panel, rather than its embed widget. Widget URLs normalize to provider content URLs. Sign in inside this isolated provider profile; account, DRM, region and provider support still determine full playback. The official embed remains an explicit fallback on web/Windows; GymOS does not turn previews into full tracks.

The Windows music view previously denied every permission, including autoplay. It now prompts the user for autoplay only on the exact supported provider hosts; other permissions remain denied. This does not install a DRM component, bypass provider rules or certify playback with a paid subscription. Full-track provider playback still needs an acceptance check with the customer's actual account/device.

Spotify reference: https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting
Deezer widget reference: https://newsroom-deezer.com/2021/04/deezers-new-embeddable-widget-player-adds-instant-audio-to-any-website/
