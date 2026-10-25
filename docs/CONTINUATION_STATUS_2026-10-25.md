# Release 1.1.9 - 25 October 2026

Implemented: original Connect module, manual WhatsApp templates, supplier invoices/partial payments, cash shifts/expenses/journal, HR/duty/leave/payroll, competitions/own achievements, day passes, private member conversations, plan editing, class price/duration and invoice snapshots, scoped product photos/metadata, confirmed check-in profile popups, manager-required PIN changes and separate real-platform music windows. New pricing does not rewrite sold records. Optional JSON fields require no new SQL migration.

Six bilingual PDF manuals were updated and visually reviewed. Windows 1.1.9 builds self-contained for win-x64; unsigned. Android APK remains 1.0.0 and loads the hosted member UI. Synthetic test fixtures have fictional reserved phone numbers, original sample product artwork and linked supplier/HR/finance data. Existing chosen PINs must not be reset when updating fixtures.

See verification logs for exact tests/build results and the comparison report for remaining gaps. Mocked API tests are not live database/hardware/provider tests. Seven optional connected database cases remain skipped; real fingerprint SDK/device, SMS delivery, full provider music tracks, camera/scanner and fresh physical APK install require acceptance testing. Internal support is not a central staffed helpdesk. The initial PIN remains123456 by explicit owner choice.

Deployment approval was explicitly granted. Final commit, CI, merge and production evidence are recorded in the delivery package after verification.

Member mobile UI is also refined: immediate dashboard/actions, six accessible navigation destinations, expandable workout days and membership history, balance/next booking, loading skeleton, last-refresh and offline labels. Layout checked at390px Arabic and320px English; navigation touch areas exceed44px. No member auth policy or Android host URL changes.
