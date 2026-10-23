# مراجعة الأدوار والجاهزية / Role and release review

تاريخ المراجعة: 23 أكتوبر 2026. هذه نتائج اختبارات محددة، وليست ضمانًا بعدم وجود أخطاء.
Review date: 23 October 2026. These are bounded test results, not a zero-defect guarantee.

## المالك التجاري / Platform owner

اختبار PostgreSQL بحساب التشغيل المحدود نجح: إنشاء ناديين تجريبيين، طلب عرض سعر، تسجيل تحويل، اشتراط تأكيد التحويل قبل التفعيل، منع اعتماد التحويل مرتين، حماية المالك الأخير، ومنع ترقية المستخدم نفسه لإدارة المنصة. البيانات التجريبية داخل معاملة تراجعت بالكامل.

Connected runtime-role PostgreSQL test passed: separate tenants, quote, transfer approval confirmation, duplicate approval/reference protection, last-owner protection, no self-escalation to platform administration. Synthetic transaction rolled back.

## صاحب النادي والمدير / Gym owner and manager

اختبارات واجهة البرمجة الفعلية للعمليات، باستخدام سياق اختبار معزول، نجحت للمالك والمدير الكامل ومدير الفرع. مدير الفرع لا يقرأ أو يعدل فرعًا آخر ولا يعدل إعدادات النادي العامة أو يصدر البيانات الصحية لكل النادي. هذه ليست تجربة تسجيل دخول فعلية في المتصفح.

Actual workspace/presence API handlers passed isolated-context role tests. A branch manager cannot cross branch boundaries, change global settings or export club-wide health data. This does not constitute interactive browser login testing.

مسارات قوالب الوجه ودعوات الأعضاء وواتساب ترفض التعديل عند تعليق الترخيص. الإعدادات الحساسة ترفض الموظف والزائر ومدير فرع آخر قبل الاتصال بالقاعدة. حفظ البيانات الصحية يتطلب موافقة صريحة. التقارير تستبعدها افتراضيًا.

Face templates, member invitations and WhatsApp writes reject suspended licenses. Sensitive endpoints reject reception, anonymous users and foreign branches before database access. Health writes require consent and exports exclude health by default.

## الموظف والعضو / Employee and member

الموظف للقراءة فقط حسب سياسة المشروع الحالية؛ لا يعدل أعضاء أو حضورًا أو أسعارًا أو مخزونًا أو صلاحيات. حساب العضو يعرض سجلاته فقط وعدد الموجودين في فرعه دون أسماء بقية الأعضاء. نظام الكاميرا التلقائي يعمل داخل جلسة مصرح لها للمالك أو المدير.

Reception remains read-only under the current product policy, including attendance writes. Member projection exposes only own records and aggregate own-branch occupancy. Automatic camera attendance runs in an authorized owner/manager session.

## الاختبارات الأخرى / Other coverage

- الأعضاء والكروت وتجديد الاشتراك والتجميد والحصص وقوائم الانتظار والتمارين وGym Pulse والموافقات.
- Supplement sales, FEFO batches, stock adjustments, returns, supplier references and cash reconciliation.
- المدربون الخارجيون وأسعار البرامج ونسب العقود والتحصيل والتسويات والشيفت الليلي وحدوده.
- CSV/JSON/XLSX import: mapping, leading zeros, Arabic, exact money, duplication, cross-branch references, bounded ZIP expansion and formula rejection.
- Excel: generate then reopen, all rows beyond 25, Arabic/RTL/Cairo styles, exact decimal values and branch privacy. HTML escapes values. PDF uses print/save from the in-app report preview.
- Connected database: member invitation/actor isolation, one-time claim, biometric isolation, Vault encryption and wrong-tenant decryption denial.
- النسخ الاحتياطي: اختبار متصل بالقاعدة نجح بعد مهلة اتصال في المحاولة الأولى؛ لا توجد إعادة محاولة تلقائية لإخفاء فشل كتابة.
- Trial: connected test of one-time owner claim, immutable start and exact 30-day boundary passed.

## حدود المراجعة / Unverified boundaries

لم تتوفر أداة تحكم تفاعلي بالمتصفح أو Windows في هذه الجلسة. لم تُجرَ مراجعة بصرية لكل الشاشات أو تجربة فعلية لقارئ USB أو الكاميرا/الحيوية أو السماعات والأصوات أو تثبيت PWA على Android/iPhone. لم ترسل رسالة WhatsApp حقيقية لعدم وجود حساب مزود وقوالب فعلية للاختبار. قبول المزود لا يعني وصول الرسالة؛ لا يوجد ادعاء بتأكيد التسليم أو webhook للردود.

No interactive browser/Windows control was available. Full visual/device acceptance, camera/liveness calibration, physical USB reader, speaker voices, Android/iPhone installation and real WhatsApp delivery remain unverified. Provider acceptance is not delivery confirmation; no inbound reply webhook is claimed.

Local Next.js 16.4.2 production build passed after explicitly resolving Human to its browser ESM bundle for SSR/client compilation. The original EPERM restriction was resolved using the authorized build environment. A remote build must also pass before publication.

94 local unit tests passed (5 optional database tests skipped in that command and run separately). Five API role integration tests passed. Connected commercial, trial, backup/archive and member-feature isolation tests passed separately. TypeScript and ESLint passed; production dependency audit found zero advisories.

Native Windows regression tests passed: encrypted tenant-scoped SQLite snapshots, command allowlist, immutable local 30-day timer/clock rollback, PNG/ICO/splash caching and provider URL/profile boundaries. Speech synthesis passed for all 15 installed Arabic/English voices, including Hoda ar-EG and Naayf ar-SA. This checks generated audio bytes, not audible speaker quality. NuGet advisory metadata lookup was unavailable (NU1900), so a clean NuGet vulnerability audit is not claimed.

## ملاحظات تشغيل / Operations

WhatsApp requires a club-owned Meta Business number, valid access token and approved templates. Configure per branch as owner/manager. Explicit member opt-in is separate from general contact consent. Pending messages recheck current consent/rule; uncertain sends are not automatically retried. The five-minute database worker is installed disabled until the production route is verified.

Legacy proprietary SQL/BAK/SQLite backups are not automatically converted. Export tables to CSV/JSON/XLSX. GYM OS JSON restoration is a separate confirmed full restore and requires downloading the current backup first.

Current occupancy is derived from check-in/out and expires an unattended visit after twelve hours; it is not a physical people counter. A same-day re-entry after that boundary preserves the previous session.

The full dependency audit still reports a braces issue reachable through development-only Next ESLint tooling, with no patched upstream version at review time. Production dependency audit is checked separately. No downgrade of Next.js is used to conceal the warning.

Supabase advisors report leaked-password protection disabled, pg_net in its non-relocatable public extension namespace, and performance suggestions for RLS initialization/permissive policy evaluation. These have not been represented as fixed. Relevant references:

- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

Face model sources, Apache/MIT notices and limitations are in public/face-models/NOTICE.txt. Face matching must be validated with the customer's lighting/camera before commercial reliance; it is not a certified identity system.
