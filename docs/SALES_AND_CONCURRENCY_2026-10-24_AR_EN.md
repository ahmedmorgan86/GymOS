# تفويض البيع والتحصيل وعزل معاملات الأندية — 2026-10-24

أضيف تفويض مستقل لكل موظف استقبال وفرع لبيع العضويات، وآخر لتسجيل التحصيل. التسجيل ينشئ ملفًا بانتظار باقة، ولا يفعّل دخول العضو بمفرده. البيع يستخدم سعر الباقة المحفوظ على الخادم، ويحافظ على الفترة الحالية؛ التحصيل ممنوع بدون تفويضه المنفصل. تُحجب السجلات المالية والصحية وقوائم التفويض عن الاستقبال، ولا تعيد النسخ الاحتياطية صلاحيات قديمة. التحكم بالترخيص يظل ساريًا على العمليات.

تجديد الترخيص المدفوع يحافظ على المدة المشتراة حتى عند التعليق أو جدولة البداية مستقبلًا. تواريخ إيصال التحويل تُراجع كتاريخ حقيقي وبتوقيت القاهرة. لا تغير هذه الدفعة أي ترخيص أو معاملة مالية حية.

استُبدل القفل الحصري العام في معاملات النادي بقفل خاص بالنادي، مع قفل مشترك للتوافق مع الإصدارات القديمة التي تستعمل القفل العام. لم يتغير مسار RLS. التصادم النادر في hashtext قد يؤخر ناديين، ولا يوسع الوصول.

## Verification

164 local assertions passed: 130 unit/domain, 12 role API, 2 member API, 9 member sessions, 3 credentials, 5 batch serialization, 3 React visibility. Seven pre-existing tests are skipped. TypeScript, ESLint and whitespace checks passed. Raw logs are in `verification/2026-10-24-sales/`.

API tests execute actual handlers with isolated mocked storage/identity. Batch tests simulate PostgreSQL advisory lock semantics; React tests render static markup. They do not prove live database concurrency, browser interaction, payment processing or hardware behavior. The local production build remains blocked by the environment's `uv_resident_set_memory` failure; remote CI must build the final uploaded tree.

Read-only live PostgreSQL catalog inspection found 26 gymos tables with RLS enabled and forced. Effective SELECT/INSERT/UPDATE/DELETE privileges for anon/authenticated were false on all 26 tables. Required advisory-lock functions exist and gymos_app can execute them. No customer rows were queried and no production writes occurred. See `LIVE_DATABASE_CATALOG_2026-10-24.json`. Security advisor warnings remain for pg_net in public and disabled leaked-password protection; performance warnings require separate query/plan review.

## Remaining acceptance gates

### Subsequent isolated PostgreSQL verification

GitHub Actions run `40122041923`, commit `f649b5ba001ae4fc71bb85214289981414e4ebe1`, job `120955520166`, passed four additional tests on disposable PostgreSQL 17.11 (no production connection). They execute the actual `database.ts` batch code and `db/entities.sql` policies: independent-club progress, same-club and mixed-version exclusion, rollback/scope cleanup, and entity RLS denial of cross-club reads/writes/reassignment. A test-only loader permits plain local container transport exclusively for `127.0.0.1/gymos_ci`; production TLS remains unchanged. The CI service is destroyed afterward. Extracted job output is in `verification/2026-10-24-sales/postgres-ci.log`. This brings automated evidence to 168 passes across local and CI suites. Seven older optional tests remain skipped.

This checks repository entity policies on synthetic rows, not the entire Supabase migration history, deployed authorization policies, full financial/attendance concurrency, restore, throughput or load. Those wider gates below remain open.

This is a tested development increment, not completion of the enterprise master prompt. Remaining work includes granular manager policies, cross-branch membership entitlements, narrower/paginated workspace persistence, MFA and replacement of legacy SQL PIN provisioning, support-access governance, isolated live SQL/RLS/concurrency/restore/load tests, signed Windows updates, Android/device acceptance, official competitor research, and legal/privacy/incident acceptance. No production merge or deployment is performed here.
