# Verification — Operations release

- 21 automated tests passed: original cards/Pulse, plans/quotas/freeze/installments/backup/access and service-worker recursive assets/fonts and offline cache fallback.
- Local HTTP integration passed: real D1 + API + native local identity, receptionist redaction and authorization, single-use invitation, branch/tenant scope, duplicate request replay, optimistic conflict, owner restore and recoverable pre-restore snapshot.
- Browser confirmed: plan creation, partial collection, outstanding 600 from invoice 800 and paid 200; two cards generated together; visit queued while local server stopped and accepted once after restart.
- Independent decoder verified original QR and Code128 pass tokens.
- TypeScript check passed. Production web build and Windows self-contained build are checked during packaging.
- Offline cold-opening in browser was attempted; preview-browser/dev-cache issues prevented final confirmation of cold-opening. Service-worker shell/asset fallback is covered by automated tests.
- Not tested: physical USB reader, physical camera, physical print output, Windows cloud login/offline launch, real employee accounts through platform sharing, load/performance/security audit.

No production member data was used for local tests. Site sharing remains unchanged.

## Training extension
28 automated tests now pass (7 new training tests). Covered ready templates, assignment history, copy/archive behavior, malformed exercise data, branch isolation, daily completion uniqueness, backup references, demo cleanup and reception write restrictions. Physical printed training sheets and coaching suitability are not verified.

Local browser verified preset assignment to a demo member, day completion once with disabled repeat button, and print preview containing the correct member/program/schedule. No production member assignments were created during verification.
