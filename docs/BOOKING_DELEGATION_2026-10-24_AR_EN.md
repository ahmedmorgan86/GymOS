# تفويض الحجوزات / Independent booking delegation

24 October 2026. Follow-up to `6bed6dd` and `43f6c0b`. Source changes, not production deployment.

## Implemented

- Owners may grant/revoke reception booking access independently from attendance for each employee and branch. New `bookingGrants` metadata retains legacy attendance grants unchanged.
- Only `class.book` is delegated: ordinary bookings, cancellations and waitlist management use the existing membership, capacity, promotion and demo-boundary validation. Class creation/cancellation, financial operations, prices and permission administration stay restricted.
- Workspace API reads the trusted grant from server tenant state. Assignment to the branch is also required. User-provided capability flags do not authorize operations. License, revision and idempotency checks remain.
- Packet includes only the current user's effective booking branches and hides the grant roster from non-owners. The calendar and booking modal use a separate booking capability; class-administration buttons retain their existing edit checks.
- Staff-management UI retains existing full-manager administration without granting managers the owner's delegation controls.
- Backup validation checks valid branches and unique user/branch pairs. Restore retains current booking grants for surviving branches, ignoring uploaded/historical grants. Entity metadata split/assembly round-trips the new field.

## Validation

Raw logs in `docs/verification/2026-10-24-booking/`.

| Check | Result |
|---|---|
| Unit/domain suite | 126 passed, 7 optional database tests skipped, 0 failures |
| Role API | 9 passed |
| Member API | 2 passed |
| Member session API | 9 passed |
| Credential provisioning API | 3 passed |
| TypeScript | Passed |
| ESLint | Passed |

Total passed: **126 + 9 + 2 + 9 + 3 = 149**. The new role test checks an independent grant, admission denial without an attendance grant, booking capacity, waitlisting, automatic promotion after cancellation, foreign branch denial, administration denial and immediate grant revocation. The restore test covers injected attendance and booking grants. API stores are isolated test doubles; no live database, RLS, hardware or load certification is claimed.

## Delivery and open scope

A development branch was successfully created via the signed-in GitHub browser. The GitHub connector still returns 403 for writes. A browser upload attempt was denied at the upload approval gate before any file was transferred; no PR existed at the time of this report. The local branch retains all implemented changes.

No new schema migration is required for the optional JSON metadata. Production build remains blocked by the execution environment's Node `uv_resident_set_memory` failure. No production source, database or member data was changed.

This closes delegated bookings for reception, not the original nine-phase program. Delegated member sales/renewal and collection, granular manager capabilities, multi-branch membership entitlements, entity-specific APIs, live RLS/concurrency/load/recovery tests, MFA, full visual/device acceptance, competition research and commercial acceptance remain unfinished. See earlier reports for their exact boundaries.

Owner workflow: select the branch → Users & permissions → enable the employee's booking checkbox. Attendance is a separate checkbox. Revoking either right leaves the other unchanged. This functionality requires the new frontend and backend together. Restore will not resurrect historical authorization grants.

تم تنفيذ تفويض الحجوزات بصورة مستقلة عن الحضور، مع حفظ عزل الفروع وقيود السعة وقوائم الانتظار وسحب التفويض. لا يتضمن ذلك صلاحيات مالية أو إدارة الحصص، ولا يعني اكتمال الجاهزية التجارية.
