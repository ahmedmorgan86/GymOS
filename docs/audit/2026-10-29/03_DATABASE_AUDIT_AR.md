# مراجعة قاعدة البيانات — GymEG

تاريخ التقرير: 29 أكتوبر 2026 — فرع codex/gymeg-full-audit-20261029، baseline ce1a426 مع تعديلات موثقة.

لقطة كتالوج قراءة فقط بتاريخ 29 أكتوبر 2026: 28 جدولًا، 41 policy، 18 function و2 trigger. جميع الجداول في اللقطة لها RLS إجباري. لم تُنسخ بيانات أعضاء إلى التقرير.

اسم المشروع GymEG؛ قاعدة postgres ومخطط gymos وrole gymos_app لم تُعد تسميتها. المشروع المعروض ليس اسم قاعدة PostgreSQL ولا إعادة إنشاء لها. إعادة التسمية تتطلب مطابقة كل SQL وfunction body وsearch_path وcron ونسخة التطبيق وتخطيط رجوع؛ لم تنفذ على الإنتاج.

المستشار: pg_net في public وحماية كلمات المرور المسربة غير مفعلة؛ أداء RLS يتضمن 39 تحذير تهيئة و6 تحذيرات سياسات متعددة و5 فهارس غير مستخدمة. لا ادعاء بأن تحذير يعني اختراقًا مؤكدًا.

| الجدول | الأعمدة | RLS إجباري | FK |
|---|---:|---|---:|
| member_code_access | 12 | True | 1 |
| member_code_sessions | 5 | True | 1 |
| member_code_attempts | 3 | True | 0 |
| membership_cards | 7 | True | 0 |
| card_number_counters | 2 | True | 0 |
| gym_access | 6 | True | 0 |
| gym_states | 4 | True | 0 |
| gym_recovery | 4 | True | 0 |
| gym_invites | 6 | True | 0 |
| gym_entities | 6 | True | 0 |
| gym_photos | 3 | True | 0 |
| gym_access_events | 7 | True | 0 |
| commercial_plans | 10 | True | 0 |
| tenants | 5 | True | 0 |
| tenant_memberships | 6 | True | 1 |
| tenant_licenses | 10 | True | 2 |
| activation_requests | 17 | True | 2 |
| trial_claims | 4 | True | 1 |
| platform_settings | 3 | True | 0 |
| gym_backup_transfers | 8 | True | 0 |
| platform_admins | 2 | True | 0 |
| commercial_audit | 6 | True | 0 |
| gym_activity_archive | 5 | True | 0 |
| whatsapp_connections | 7 | True | 1 |
| member_portal_access | 8 | True | 1 |
| member_faces | 6 | True | 1 |
| whatsapp_rules | 4 | True | 1 |
| whatsapp_outbox | 11 | True | 1 |

## حدود الاستدلال

النتائج خاصة بالأدلة المتاحة وقت المراجعة. راجع issues.json ونتائج evidence؛ لا تعني الفهرسة أو نجاح mock اكتمال تجربة جهاز أو مزود خارجي.
