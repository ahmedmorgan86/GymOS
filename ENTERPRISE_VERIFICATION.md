# Enterprise changes: verification and remaining work

Snapshot: 2026-10-18. This branch contains the current implementation, not a declaration that the full product audit is complete.

## Implemented source
- Scoped notification center with unread state and session operation-error history; reading does not approve Pulse actions.
- Member profile and consent-based measurements; workout set log and rest timer.
- Combined financial reports, CSV export and daily cash-count snapshots.
- Weekly class calendar, recurrence preserving gym local time and waitlists.
- Suppliers, stock adjustments, partial returns and gross-profit reporting.
- Password recovery flow; private member-photo endpoint and transactional entity persistence.
- Atomic team invite claim and append-only staff access audit.
- Windows installed-voice bridge, external link handling and updated version metadata.
- Explicit mutation controls, navigation consolidation and shared preference hooks.

## Verified
- 60 automated Node tests passed.
- TypeScript noEmit passed.
- ESLint: zero errors, eight warnings (hook dependencies/cleanup still require review).
- Synthetic PostgreSQL tests for entity migration, revision conflict, photo isolation, RLS, team permissions and append-only audit passed during implementation. Synthetic data was cleaned up or rolled back.
- Windows build and installed-voice enumeration passed during implementation. Voice smoke test does not play audio.

## Remaining acceptance and limitations
- Full bilingual visual acceptance and native Windows end-to-end playback are pending.
- No new installer/portable release is included in this source upload.
- Scheduled speech requires the application open and device awake; no closed-app push service. Playback history and cross-device coordination remain incomplete.
- Notification read state is local to the device, scoped by owner/user/branch; operation-error history lasts only for the session.
- Password recovery email delivery and actual password change have not been exercised.
- Entity persistence stores metadata in gym_states after the first write. Do not roll back to an older application without reconstructing the full state; an automated rollback conversion is pending.
- Backup restore request limit is 4 MB, total assembled state limit 20 MB. Offline photo caching is not implemented.
- The daily cash-count snapshot is not an accounting lock or a multi-cashier shift ledger. Partial returns do not trigger external payment refunds.
- Production deployment and real-account multi-user acceptance are not part of this GitHub upload.
