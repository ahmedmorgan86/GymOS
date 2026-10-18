# Vercel + Supabase migration verification

2026-10-18

- 33 automated tests passed: cards, attendance, Pulse, billing, freezes, quotas, backup, staff permission rules, 13 training presets, SQL parameter conversion, native Next configuration and separation of login from the offline shell.
- Native Next.js 16.3.4 production build passed, including TypeScript, routes and .next/routes-manifest.json.
- Windows x64 self-contained publish completed; WebView2 runtime is still required on target Windows.
- Live Supabase schemas were created: four business tables in private gymos schema, all with RLS enabled. anon and authenticated have no schema access. A dedicated gymos_app login has no superuser/create-role/create-db/bypass-RLS privileges.
- Supabase security advisor returned no findings after schema creation.
- Direct PostgreSQL connections from this workstation time out. The actual Vercel production function connected successfully using the dedicated login and verified TLS: GET /api/health returned HTTP 200 with status ready. GET /api/workspace without a session returned HTTP 401. GET /sign-in returned HTTP 200.
- Not yet verified: deployed sign-up/sign-in/session refresh, employee invitation, cross-tenant HTTP access, backup import on Supabase, Windows live login, physical scanning and physical printing.
- Existing club data has not been copied to a new owner identity. The old hosting remains the source of truth until backup import and record comparison.

The earlier Sites/D1 integration results apply only to the old hosting; they are not evidence that the Supabase migration has passed integration testing.

Local production HTTP verification passed: /api/workspace, /api/team and /api/backup reject anonymous requests and spoofed legacy identity headers with 401; cross-origin POST is 403; root redirects to /sign-in and the login document has no offline-shell marker. Browser verified Arabic RTL and English LTR login labels. Database privileges were verified through Supabase metadata (business CRUD and session identifier columns only); the attempted SET ROLE test was denied and created no test rows.

Production deployment succeeded on 2026-10-18: commit 29eb8cf2ba6e7120af0c4d9fc625c31f94841cec, Vercel deployment dpl_CaNppq5Bh2zBAFtQ8wssWX7nN4c1, https://gym-os-liart.vercel.app. Supabase Auth Site URL and the exact /auth/callback redirect were configured for that origin. Owner registration/confirmation is still pending, so authenticated writes and data import must not be marked complete.
