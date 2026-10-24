# متابعة التنفيذ والأمان / Security follow-up

24 October 2026. Builds on local commit `6bed6dd` on `codex/commercial-core-hardening-20261024`.

## Actual changes

- `app/api/member-code/route.ts`: reset issues a random temporary PIN, explicitly removes member sessions and adds a scoped access-audit record without the credential. Reading old credentials does not return the shared PIN; it returns an activation requirement.
- `app/lib/member-phone.ts`: random generator excludes the former shared default.
- `app/api/member-session/route.ts`: rejects `123456` before session issuance, including normalized Arabic digits.
- `app/lib/member-code-session.ts`: pending sessions still backed by the shared PIN cannot authenticate or change a PIN. Private member-chosen PINs remain unchanged. The SQL uses existing parameterized matching functions and avoids hashing for non-pending accounts.
- Member setup and Android download instructions no longer advertise the public default. The change form requires entry of the actual privately issued temporary PIN.
- `tests/member-session.integration.mjs`: adds default rejection and old-session takeover prevention.
- New `tests/member-credentials.integration.mjs` and loader exercise real credential route handlers with isolated identity/storage doubles: activation response, random reset, audit, session removal and branch/role denial. GitHub quality workflow runs these tests.
- `app/workspace.tsx`: corrected a previous unintended `DesktopTools` prop replacement. The final follow-up typecheck passed after this correction. The earlier batch's green TypeScript log did not represent its final edited tree; this report and the final logs supersede that validation claim.

## Validation

Raw results: `docs/verification/2026-10-24-security/`.

| Check | Result |
|---|---|
| Default tests | 125 passed, 7 optional database tests skipped, 0 failed |
| Role API | 8 passed |
| Member API | 2 passed |
| Member session API | 9 passed |
| Member credential provisioning API | 3 passed |
| TypeScript | Passed after fixing DesktopTools props |
| ESLint | Passed |

Total passed across these commands: **125 + 8 + 2 + 9 + 3 = 147**. API database operations are mocked; these results do not verify PostgreSQL RLS, SQL privileges, transactions or load behavior. No production credential was read or changed. The existing optional phone database test still describes legacy database provisioning; the new route tests assert the stored shared value cannot authenticate.

Production build remains unverified. This environment throws `ENOENT / uv_resident_set_memory` even for a direct `process.memoryUsage()` call; no dependency or Node runtime check was disabled to conceal this limitation. The previous build log remains in `docs/verification/2026-10-24-core/build.txt`.

## Rollout and compatibility

This source is **not deployed**. Existing default-PIN users and new/phone-changed accounts must have an authorized staff member verify identity, use Reset PIN and privately deliver the generated temporary PIN. Existing chosen PINs are preserved. Do not post or print PINs on attendance cards. Frontend and backend must update together; reverting to old code would reopen default-PIN authentication.

No SQL migration was generated or applied. The existing sync function can still store the former shared default for newly provisioned or phone-changed accounts; hardened application endpoints reject that value and require explicit staff issuance. A future migration should replace database-side default provisioning after testing in a disposable database. This follow-up does not claim completion of that migration or all credential surfaces.

## GitHub delivery blocker

A repeat attempt to create the development branch through the connected GitHub integration returned `403 Resource not accessible by integration`. Prior Git HTTPS push also lacked credentials. The connector's metadata showing repository admin/push authority does not establish that its GitHub App token has Contents-write permission. No remote branch, PR, merge or deployment was created.

The repository connection must be reauthorized with write access before upload can proceed. This is a service authorization blocker, not a request for project approval. No attempt was made to bypass it.

## Remaining scope

The original nine-phase enterprise request is still incomplete. `CORE_HARDENING_2026-10-24_AR_EN.md` lists the open release gates: fine-grained manager authority, delegated sales/collections/bookings, cross-branch policy engine, transactional entity APIs and pagination, live database isolation/concurrency/load/recovery tests, MFA, comprehensive UI/device acceptance, competitor matrix and operational/legal release acceptance. **No 100% readiness claim is made.**

تم تنفيذ إصلاح إضافي لمنع استخدام الرقم السري المشترك والاستيلاء على الحسابات المؤقتة، مع اختبارات ومسار إعادة تعيين عشوائي مدقق. التعديلات محلية فقط، والرفع مرفوض بصلاحيات تكامل GitHub الحالية. لا تزال المراحل الشاملة وقبول الإصدار التجاري غير مكتملة.
