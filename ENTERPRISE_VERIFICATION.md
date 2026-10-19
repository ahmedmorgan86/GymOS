# Enterprise changes: verification and remaining work

Snapshot: 2026-10-19. This branch contains the current implementation, not a declaration that the full product audit is complete.

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
- ESLint: zero errors and zero warnings.
- Synthetic PostgreSQL tests for entity migration, revision conflict, photo isolation, RLS, team permissions and append-only audit passed during implementation. Synthetic data was cleaned up or rolled back.
- Windows build and installed-voice enumeration passed during implementation. Voice smoke tests now include actual Arabic/English driver-completed playback and cancellation (~541 ms).

## Remaining acceptance and limitations
- Full visual acceptance of every business mutation and physical USB scanner/camera acceptance remain pending. Native login using the existing profile and audio-driver tests passed.
- No new installer/portable release is included in this source upload.
- Scheduled speech requires the application open and device awake; no closed-app push service. Device playback history records requested/finished/failed status. Cross-device coordination remains local-profile only.
- Notification read state is local to the device, scoped by owner/user/branch; operation-error history lasts only for the session.
- Password recovery email delivery and actual password change have not been exercised.
- Entity persistence stores metadata in gym_states after the first write. Do not roll back to an older application without reconstructing the full state; an automated rollback conversion is pending.
- Backup restore request limit is 4 MB, total assembled state limit 20 MB. Offline photo caching is not implemented.
- The daily cash-count snapshot is not an accounting lock or a multi-cashier shift ledger. Partial returns do not trigger external payment refunds.
- Production deployment and real-account multi-user acceptance are not part of this GitHub upload.

## Free Arabic voice addition
Nabra local Modern Standard Arabic voice downloaded and pinned, self-hosted with source/license notices. Browser tests generated and completed playback for diacritized (103800 samples) and plain Arabic (134400 samples), both 24 kHz. No text is sent to an outside voice provider. Initial voice assets are approximately 45 MB; voice is installed inside GymOS rather than system-wide. Pronunciation quality must be previewed, especially names.
