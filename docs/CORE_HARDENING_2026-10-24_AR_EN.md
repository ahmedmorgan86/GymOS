# GymOS — دفعة إصلاح المنطق الأساسي / Core hardening batch

Date: 24 October 2026. Base commit: `2fbe2f7`.
Branch: `codex/commercial-core-hardening-20261024`.

**حالة الإصدار: غير جاهز للاعتماد التجاري النهائي.** هذه دفعة منفذة محليًا، وليست استكمالًا للمراحل التسع أو تدقيقًا شاملًا للمستودع. لا نشر ولا دمج ولا تعديل لقاعدة إنتاج.

**Release decision: NOT accepted for commercial release.** This is a locally implemented batch, not completion of all nine phases or a full repository audit. No deployment, merge, production database access or customer-data changes were performed.

## Implemented and verified

| Change | Files and behavior | Evidence |
|---|---|---|
| Explicit attendance delegation | `access.ts`, `domain.ts`, workspace API and packet: owner-only grants for exact user/branch pairs; no default expansion for reception. Grants enable online `visit.add`, `visit.scan`, `visit.exit` only. Managers cannot delegate. Existing manager permissions otherwise remain unchanged. | `commercial-core.test.mjs`, role API integration |
| Reception UI | `team-page.tsx`, `workspace.tsx`, `operations.tsx`, `client-types.ts`: owner checkbox for a reception user's selected assigned branch; reception scan, manual check-in and checkout use existing domain validation. | TypeScript, lint; API tests; no interactive visual acceptance |
| Backup authorization | `backup.ts`, backup API: validate additive grants and retain current grants on restore, filtered to surviving branches. Uploaded or historical grants cannot reintroduce access. Delegation identities are excluded from staff packets. | Restore API test with full administrator and forged grant |
| Plan editing | `extensions.ts`, `operations.tsx`: edit name, price, days and visit allowance under existing plan identity and branch; preserve archive flag and references. Audit previous/new price, days and allowance. | Domain tests, typecheck and lint |
| Sale snapshot | `membership-periods.ts`, `extensions.ts`, `member-view.ts`, backup schema: new sales record name, price, days, visit allowance and timestamp; member-facing name follows sold terms after later edits. Existing invoices and periods stay unchanged. Legacy periods remain valid without invented snapshots. Price snapshot is removed from reception packets. | Domain and member API tests |

No SQL migration is required for these optional JSON metadata fields. `entity-state.ts` retains metadata and membership payloads through existing split/assemble storage. A deterministic round-trip test covers grants. This is not verification against a live database.

## Actual validation results

Raw command output is committed in `docs/verification/2026-10-24-core/`.

| Command | Result |
|---|---|
| `npm test` | 132 discovered; 125 passed; 7 optional database tests skipped; 0 failures |
| `node --import ./tests/role-api-loader.mjs --test --test-isolation=none tests/role-api.integration.mjs` | 8 passed, 0 failures |
| `node --import ./tests/member-api-loader.mjs --test --test-isolation=none tests/member-api.integration.mjs` | 2 passed, 0 failures |
| `node --import ./tests/member-session-loader.mjs --test --test-isolation=none tests/member-session.integration.mjs` | 7 passed, 0 failures |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm audit --omit=dev --audit-level=low` | Found 0 vulnerabilities at execution time; not a penetration test |
| `npm run build` | Failed in environment: `ENOENT: no such file or directory, uv_resident_set_memory`; production build is not verified |

API tests import actual route handlers with isolated identity/storage loaders. The concurrent-check-in test uses a mock compare-and-swap store: one successful commit and one conflict from a shared revision, then idempotent replay. **It is not a PostgreSQL concurrency or load test.** No test database credentials were provided or used.

## Security and architecture decisions

- Grants are trusted only from server-loaded tenant state. Browser-supplied flags do not authorize anything. Existing authentication, tenant header binding, branch assignment, writable license, revision and request receipt checks still apply.
- Persisting grants uses the existing revision-checked transaction. A concurrent grant revocation changes the revision, so stale mutations must conflict. Live database locking remains unverified here.
- Reception retains no financial, health, backup, face-enrollment, member-editing or configuration rights. A grant does not create tenant membership or branch access. Offline writes are deliberately excluded from this initial delegation feature.
- Backup restore does not restore authorization grants, even for the owner. Current grant settings are retained for surviving branches; an owner must explicitly re-grant access after moving to a new club.
- Grants use stable user IDs. Existing revoked memberships remain blocked by existing context resolution. Restoring a staff account can reactivate a retained grant if that same user and branch are restored; review grants during staff reactivation.
- The whole-workspace revision and reads remain. No scalability improvement or capacity claim is made.
- Plan updates affect future sales. Existing old terms without snapshots do not gain fabricated historical prices or names.
- Deployment must update frontend and backend together. An old backend does not support grants or new snapshot fields; old strict backup validators reject new-format optional fields. Keep the new backend for restores of backups containing these fields.

## Remaining work and release gates

1. Full repository audit remains partial. This batch reviewed the workspace route, access/context/packet, team flow, entity storage, membership domain, backup, related UI/tests, package/CI and the existing review documents. It did not verify every module, Windows or Android implementation.
2. Fine-grained manager permissions; delegated member sales/renewal, payment collection and bookings remain open. Platform licensing and club plans already use separate code paths; a complete isolation audit remains open.
3. Cross-branch membership policy engine, selected/all-branch entitlements, extra visit fees, refunds and full policy history remain open.
4. Entity-specific reads/writes, server-side pagination, live RLS/advisors, PostgreSQL concurrency/load testing, recovery and backup restoration tests remain open.
5. MFA, administrative support-access policy, full security audit and independent penetration testing remain open.
6. Full visual/RTL/LTR, keyboard/accessibility, responsive and actual Windows/Android/hardware acceptance remain open. Existing documents' historical device claims were not re-run in this batch.
7. Current official-source competitive matrix and measurable superiority claims were not researched in this batch. No superiority claim is made.
8. Production build must pass in an environment exposing required Node system APIs; existing GitHub quality workflow already runs the added tests and build on PRs.
9. Hosting, monitoring, legal/tax/privacy review, signing/updating Windows and final commercial acceptance remain open.

## Review, rollout and rollback

Local GitHub clone succeeded. `git push` failed because no HTTPS credentials were available. The connected GitHub integration returned `403 Resource not accessible by integration` when asked to create a branch. No remote branch or PR was created.

Apply the accompanying patch to an unchanged checkout of the base commit:

```sh
git switch -c codex/commercial-core-hardening-20261024 2fbe2f7
git am /path/to/GymOS-core-hardening.patch
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm test
node --import ./tests/role-api-loader.mjs --test --test-isolation=none tests/role-api.integration.mjs
npm run build
```

Before any approved rollout: run existing CI and real test-database isolation/concurrency checks; inspect bilingual plan editor and delegated reception paths; test staff revocation and backups; obtain approval to merge and deploy.

Rollback: this batch changes no relational schema. Prefer a forward fix and disabling attendance grants through owner controls. If reverting application code, first revoke grants and preserve a current backup; old code loses new capabilities and may reject backups containing additive fields. Do not strip fields from the only backup or overwrite production data. Old attendance policy defaults reception to read-only. Do not treat rollback as tested until exercised against a disposable database and matched application version.
