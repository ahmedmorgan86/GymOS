# Vercel + Supabase migration verification

2026-10-18

- 36 automated tests passed: cards, attendance, Pulse, billing, freezes, quotas, backup, staff permission rules, 13 training presets, SQL parameter conversion, native Next configuration and separation of login from the offline shell.
- Native Next.js 16.3.4 production build passed, including TypeScript, routes and .next/routes-manifest.json.
- Windows x64 self-contained publish completed; WebView2 runtime is still required on target Windows.
- Live Supabase schemas were created: four business tables in private gymos schema, all with RLS enabled. anon and authenticated have no schema access. A dedicated gymos_app login has no superuser/create-role/create-db/bypass-RLS privileges and no direct Auth-table access.
- Supabase security advisor returned no findings after schema creation.
- Direct PostgreSQL connections from this workstation time out. The actual Vercel production function connected successfully using the dedicated login and verified TLS: GET /api/health returned HTTP 200 with status ready. GET /api/workspace without a session returned HTTP 401. GET /sign-in returned HTTP 200.
- Not yet verified: deployed sign-up/sign-in/session refresh, employee invitation, cross-tenant HTTP access, backup import on Supabase, Windows live login, physical scanning and physical printing.
- Existing club data has not been copied to a new owner identity. The old hosting remains the source of truth until backup import and record comparison.

The earlier Sites/D1 integration results apply only to the old hosting; they are not evidence that the Supabase migration has passed integration testing.

Local production HTTP verification passed: /api/workspace, /api/team and /api/backup reject anonymous requests and spoofed legacy identity headers with 401; cross-origin POST is 403; root redirects to /sign-in and the login document has no offline-shell marker. Browser verified Arabic RTL and English LTR login labels. Database privileges were verified through Supabase metadata (business CRUD; direct Auth-table access was subsequently revoked); the attempted SET ROLE test was denied and created no test rows.

Production deployment succeeded on 2026-10-18: commit 29eb8cf2ba6e7120af0c4d9fc625c31f94841cec, Vercel deployment dpl_CaNppq5Bh2zBAFtQ8wssWX7nN4c1, https://gym-os-liart.vercel.app. Supabase Auth Site URL and the exact /auth/callback redirect were configured for that origin. Owner registration/confirmation is still pending, so authenticated writes and data import must not be marked complete.

## Login regression fix

Vercel logs tied error digest 492543978 to permission denied for schema auth after email confirmation. The application now verifies identity through Supabase Auth getUser() for every protected request, without querying managed auth.sessions. Direct session-table column privileges were revoked. Three added tests cover a fresh verified identity for each request, invalid/missing/anonymous identity rejection, and non-authoritative editable metadata. Production build and all 36 tests passed before deployment.

## Fresh Vercel project

Created gymos-enterprise on 2026-10-18 from main at 7cbc610. Deployment dpl_96BUbWg68NSggnrK2Hd5Cwhxx54r is Ready at https://gymos-enterprise.vercel.app. The previous gym-os project was absent from the authenticated team project list; this run did not delete it. Supabase data and existing accounts were retained. Site URL and the exact /auth/callback redirect now include the new production origin.

Live new-project checks passed: GET /sign-in 200; GET /api/health 200 with status ready; GET /api/workspace without a session 401. Browser rendered the Arabic login. Authenticated dashboard loading and writes still require the owner to sign in; no claim of end-to-end completion is made.

## Node runtime alignment

Pinned package engines and .nvmrc to Node 24 for @zxing/library 0.23.0. Removed unused drizzle-kit (historical SQLite tooling), which removes both deprecated @esbuild-kit packages. On Node 24.19.0: npm ci installed 583 packages without EBADENGINE or those deprecation warnings; all 36 tests and the native Next production build including TypeScript passed. npm emitted a separate allow-scripts notice for unrs-resolver; scripts were not broadly approved. This runtime update still needs PR merge and a new production deployment.


## npm environment warnings

The Vercel npm runner maps legacy npm_config_cache_dir to the supported npm_config_cache before npm starts, preserving the cache path. package.json explicitly denies the unneeded unrs-resolver postinstall instead of enabling dependency scripts. A clean npm ci with an injected legacy cache variable installed 583 packages without the reported warnings. All 36 tests passed. Production build result is recorded in the PR validation.


## Supplement store verification

43 tests passed (7 new shop tests): FEFO allocation, integer totals and historical snapshots; atomic rejection of overselling, invalid methods/quantities and expired/archived goods; one-time full void restoring exact stock; branch/role boundaries; backup tamper rejection and legacy compatibility; currency/SKU validation. Browser verification used a temporary, local in-memory fixture (not a production account): Arabic sale/receipt reduced available stock from 36 to 35; full void returned it to 36 and sales collected to zero; English LTR also rendered. The temporary preview route and fixture were removed before commit. Physical printing/scanning, authenticated Supabase sales persistence and production deployment are not covered by this preview.

Final production webpack build including TypeScript passed after removal of stale generated development types for the deleted preview route. Production route list contains no shop-preview endpoint.


## Camera, serials, speech and Windows backups

47 Node tests passed, including atomic bounded photo saving/removal, external serial normalization/leading zeros/duplicates/check-in, announcement validation and one-minute deduplication window. Windows console smoke passed with SQLite 3.53.3: encrypted blob payload, latest snapshot per tenant and missing-tenant rejection. SQLitePCLRaw bundle pinned to 2.1.12 to remove the earlier vulnerable native SQLite dependency warning.

Temporary browser fixture verified voice enumeration (3 English, 0 Arabic), message/voice/time selection and schedule saving without arming audio, photo consent/capture UI rendering, external serial assignment, QR/Code128 rendering and Enter-driven check-in success. No live camera frames or actual audible output were tested. Temporary route/data were removed. Actual USB scanner, speaker audio, camera permission/capture, Windows toolbar WebView owner-session integration and production persistence still require acceptance testing. No changes to Supabase permissions/schema were made. Local SQLite encryption/data isolation were tested independently of the GUI.

Production Next webpack/TypeScript build passed; self-contained single-file win-x64 publish completed with no SQLite vulnerability warnings. EXE uses the configured production URL; web additions still require merge/deployment. EXE is not code-signed and requires WebView2. GUI launch, actual speaker/camera/scanner hardware and authenticated backup integration were not marked tested.

