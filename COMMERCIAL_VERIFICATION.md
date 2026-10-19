# GYM OS commercial platform

## Implemented

- Independent tenant UUID, immutable internal storage partition, and tenant memberships. Existing owner-keyed partitions are mapped without copying or deleting operational records. Legacy column names remain internal implementation details; ownership is resolved through memberships.
- `/clubs`: create/select clubs, accept team invitations, request monthly/annual/perpetual licensing or perpetual maintenance, submit transfer reference/date/amount, cancel pending requests, review status, and manage additional owners. New clubs start pending. The last owner is protected.
- `/platform`: separately authorized vendor administration, editable plans/prices/quotas, quote review, transfer approval/rejection, suspension/resumption, business/payment instructions, terms/privacy text and append-only audit. Platform authority does not grant club membership or operational access.
- Manual payment workflow. A customer-reported transfer never activates a license. Approval requires a platform administrator, matching amount, explicit verification and a locked pending request. Reused transfer references cannot activate another order. Plan limits and quoted prices are snapshotted for the request.
- Monthly/annual calendar renewals; perpetual access remains available after annual maintenance ends. Expired/suspended/pending licenses allow reads and exports but reject operational writes and restores. Offline attendance checks the cached license expiry and the server rechecks on synchronization.
- Member/branch growth limits are enforced inside the workspace persistence transaction. Existing over-limit data can be read and reduced. Staff claims/restores are serialized and constrained by a database trigger. Ownership changes preserve the underlying partition.
- Arabic/English, RTL/LTR, Cairo typography, matching web/Windows screens. Local cache, music, branding and new backup identifiers use the public tenant UUID. A server-verified legacy alias migrates device outboxes/history, music Blob records and saved links, and speech history/consumed occurrences. Queue moves are atomic and deduplicate original request IDs; malformed records abort without deleting the source. Music migration preserves all existing files even if the combined historical library exceeds the new-import quota.
- Scoped RLS for commercial tables; a second migration replaces legacy permissive policies on state, recovery, staff and invitations after scoped server reads are deployed. Workspace writes, team management, backup reads/restores and offline synchronization bind requests to the tenant displayed in the originating tab. A mismatched or missing commercial tenant header fails with `clubChanged` before writing; member-photo URLs also bind their tenant. Switching the selected club in another tab cannot redirect an old operation to the newly selected club. A refreshed workspace with a different tenant reloads the document to clear stale forms. Existing open tabs must reload after this protocol upgrade. The private database role remains server-only. Neither anonymous nor authenticated Data API roles receive access.

## Deployment order

1. Back up and apply `supabase/migrations/20261019183227_commercial_multiclub.sql` once using an administrative migration connection. Existing base schema in `db/` must already exist. This additive migration creates grandfathered active perpetual licenses for existing spaces.
2. Bootstrap the explicitly selected, confirmed platform account with `scripts/platform-admin.mjs` using a separate administrative connection. Never put administrative credentials in the Windows EXE or public environment variables.
3. Deploy this source with `GYMOS_COMMERCIAL=1` on the intended project/environment.
4. Apply `supabase/migrations/20261019185320_commercial_partition_rls.sql` after the scoped reads are live. Do not roll back to old unscoped server code after this step. Use a forward fix or an explicitly reviewed compatible rollback.
5. Configure actual prices, business identity, transfer destination, support, terms and privacy. Empty prices deliberately request a quotation. No bank details or invented prices are seeded.

Do not rerun versioned migrations blindly. Supabase migrations applied through MCP have remote migration history; align that history before using CLI `db push` from a new checkout. `npm run db:migrate` continues to manage only the existing base schema.

## Verification

- Final deterministic suite: 74 passed, 0 failed. The opt-in PostgreSQL integration test is skipped by the default suite and was run separately with a passing result.
- Real PostgreSQL runtime-role integration test covers separate club selection, hidden foreign tenant rows, blocked self-granted platform authority, quotation → transfer → approval, repeat approval, duplicate open order, reused transfer, staff quota, additional owner, revocation, last-owner protection, and immutable audit permissions. All synthetic changes run inside a rolled-back transaction. No real transfer was approved.
- Final TypeScript and production webpack build passed after the scoped-read changes. ESLint reported 0 errors and 0 warnings across 145 source files.
- Local visual test verified Cairo, Arabic RTL and English LTR, with no horizontal overflow at the tested desktop viewport. No production prices or payment instructions were entered during testing. A local browser harness passed nine migration checks including exact audio bytes, unrelated-club isolation, repeat execution and failed-transaction preservation; its synthetic records were cleaned and the temporary route removed.
- Supabase security advisor reported no new table/function findings; the existing Auth leaked-password protection warning remains. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No paid security feature was enabled automatically.

Run the database integration test explicitly, with a local ignored administrative test identity identifier and the runtime `DATABASE_URL`:

```powershell
$env:GYMOS_DB_TESTS='1'
$env:GYMOS_TEST_ADMIN_ID='<confirmed platform account UUID>'
node --env-file=.env.local --import ./tests/commercial-loader.mjs --test --experimental-test-isolation=none tests/commercial-postgres.test.mjs
```

## Practical limits

This release provides manual commercial licensing, not electronic payment processing, tax invoicing, hardware-bound offline licensing, a separately hosted database per customer, delegated support impersonation, signed installers or an automatic updater. Those are not advertised as working. Workspace mutation payloads remain bounded to 20 MB; restore uploads are bounded to 4 MB on the API (the existing upload UI uses a smaller limit). Capacity must be validated for a large customer dataset before promising its operating scale. No real-money transaction, load test or independent penetration test is claimed. Playback subscriptions, provider restrictions and full subscriber music playback remain governed by the providers and require their account holders to verify.

## Production result — 19 October 2026

Both commercial migrations were applied to the intended Supabase project. The second application used a read-only catalog/history preflight and a five-second lock timeout after a transient connector failure; preflight confirmed that no partial schema changes existed before retrying. Post-migration runtime-role integration passed including state RLS and staff revocation while suspended. Catalog verification found one club, one operational partition, zero test activation requests and zero test audit events after rollback.

The production `/clubs` and `/platform` pages opened with the designated confirmed account. The existing club still displayed eight members and operational revision 22. The independent platform account authority was bootstrapped without publishing its email in the source or client configuration. Actual prices, payment instructions, business identity and legal text remain intentionally unconfigured.

Windows 1.1.4 published successfully. WPF automated checks passed for the high-resolution splash, icon decode, tenant branding cache, reset, music URL allowlist and profile isolation. The final main-window provider-panel manual check was not completed because native window access approval timed out. Full provider subscriber playback remains untested. The web commercial screens are delivered to the Windows host from the same production origin.
