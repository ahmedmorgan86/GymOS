# GYM OS - مراجعة المنتج والإصدار 1.1.5

التاريخ: 20 أكتوبر 2026. مصدر الأساس: 6d597fa، مع تعديلات هذه الجولة. لم تُعدّل بيانات نادي الإنتاج أثناء هذه المراجعة.
Date: 20 October 2026. Baseline source: 6d597fa plus this release's changes. Production club data was not modified in this review.

## ما تم إصلاحه / Changes completed

- مشغل المنصة أصبح داخل تخطيط صفحة الموسيقى بدل position:fixed. عند الفتح تنتقل الشاشة إليه ويستقبل التركيز، مع تصغير/إغلاق/إعادة تحميل.
  Provider embeds now live in the music page layout, with focus/scroll on open, minimize, close and reload.
- مشغل Windows الموسع أصبح صفًا مثبتًا داخل Grid النافذة الرئيسية بدل لوحة عائمة فوق المتصفح؛ تصغيره يعيد المساحة، وإغلاقه يتخلص من WebView2.
  The expanded Windows provider player occupies a docked row in the main window layout; minimizing returns space and closing disposes the WebView2 instance.
- الانتقال بين المشغل الموسع والتضمين يوقف المصدر الآخر. إغلاق المشغل وإيقاف الكل يغلق المنصة، وتغيير الفرع يفصل مكتبتها.
  Switching expanded/embedded playback stops the other source; close/Stop all terminates provider playback and branch scope separates libraries.
- إصلاح طلب نسخ Windows: قراءة سياق النادي الحديث ثم إرسال X-GymOS-Tenant في طلب النسخة. لا يعطل هذا أي عزل.
  Windows backup now reads fresh club context and sends X-GymOS-Tenant without bypassing isolation.
- احتواء الجداول والتقويم والكروت، والتفاف أزرار التحصيل وأداة رفع الموسيقى، ونموذج العضو بعمود واحد على الموبايل، وضبط لوحة الإشعارات.
  Tables/calendar/cards stay contained; collection/upload controls wrap, member forms stack on mobile and notification placement is bounded.
- الشريط العلوي للهاتف الصغير في صفين لإظهار عنوان القسم وأزرار مناسبة للمس بدل إخفاء العنوان. حقوق الملكية في الويب والدخول وصفحات التراخيص وسبلاش Windows.
  Small phones use two header rows for a readable page title and larger touch controls. Copyright appears in web/login/license pages and Windows splash.
- تم أيضًا احتواء تبويب الموردين والجرد على الهاتف ومنع ضغط كروت مكتبة التدريب. Supplier/count tab overflow and compressed desktop training tiles were fixed and rechecked.
- حقوق الملكية © Ahmed Morgan تستخدم السنة الحالية وتتحدث دوريًا في الجلسة. أدلة الاستخدام موثقة حسب الصلاحيات الفعلية؛ تحديث README لتصحيح تعليمات قديمة.
  Copyright uses the current year and refreshes during a session. Manuals reflect actual roles; README's outdated setup/feature claims were corrected.

- إصلاح حد سجل النشاط: آخر 2000 حدث في حالة التشغيل، والتاريخ محفوظ في أرشيف append-only؛ صفحة النشاط تدعم التصفح 200 حدث في المرة ونسخة كاملة تشمل الأرشيف.
  Activity no longer blocks writes after 50,000 events. Archive RLS and immutable application grants were tested. Existing history is archived atomically on the next successful write.
- النسخ حتى 64 MiB تنقل في أجزاء 384 KiB مع SHA256 وعزل النادي والمستخدم وانتهاء جلسة النقل بعد 30 دقيقة. الويب وWindows يستخدمان نفس البروتوكول؛ استعادة البيانات تبقى مرتبطة بالمراجعة الحالية.
  Chunked backup transfer fixes request-size mismatch; operational state still has a 20-million-byte bound. Tests cover Arabic payloads, missing/corrupt chunks and actor/tenant isolation.
- الخطط الجديدة ترفض أكثر من 100 فرع أو 10,000 عضو بما يطابق حدود المحرك؛ لم تُعدّل العقود القديمة.
  New plans cannot promise branch/member limits beyond engine caps; existing contracts remain intact.
- تشغيل التطوير يستخدم webpack مثل الإنتاج بعد ظهور خطأ استيراد خطوط Cairo في Turbopack. Development now uses webpack like production after reproducing the Cairo import failure in Turbopack.

## حدود المنتج وسياسات التشغيل / Product limits and operating policies

| الأولوية / Priority | الملاحظة والأثر / Finding and effect | الإجراء المطلوب / Recommended action |
|---|---|---|
| سياسة صلاحيات / policy | app/lib/access.ts:2 وapp/use-offline.ts:22: الاستقبال للقراءة فقط حتى الحضور والحجز. الموظف لا يستطيع أداء مهمة الاستقبال الأساسية. Reception cannot perform its ordinary check-in task. | سياسة القراءة فقط باقية وفق طلب المالك السابق أن يقتصر التعديل على الأدمن والمالك؛ لا تمنح دور استقبال لموظف مطلوب منه تسجيل الحضور. Use an authorized Administrator for check-in; no existing employee permissions were widened. |
| P2 | القراءة والتحقق يعيدان تجميع حالة النادي كاملة رغم تخزين الكيانات والصور منفصلة؛ حد الحجم وrevision واحد يؤثران مع البيانات الكبيرة وتعدد نقاط الاستقبال. Whole-state assembly/global revision can cause size/latency/contention limits. | اختبار تحمل واقعي وصور كثيرة وزيارات متزامنة؛ قراءة مقسمة وعمليات دقيقة حسب الكيان. حدود الخطة ليست سعة مثبتة. |
| P2 | إقفال النقدية لقطة مراجعة لا قفل محاسبي، والإيصالات داخلية غير ضريبية. Cash closing is a snapshot; receipts are internal, not certified tax invoices. | توضيح السياسة للعميل، وإضافة تسوية/إقفال معتمد إذا كان مطلوبًا تجاريًا. لا تعد بنظام محاسبة أو فوترة ضريبية كامل. |
| P2 | الملاك خارج حصة الموظفين ولا توجد صلاحيات مخصصة لكل إجراء. Owners do not consume staff seats; roles are coarse. | تعريف المقاعد بالعقد وفصل المالك القانوني عن المشرف التشغيلي؛ تجنب استخدام ملكية مشتركة كبديل للمقاعد. |
| P2 | النداء يحتاج التطبيق مفتوحًا وجهازًا مستيقظًا؛ لا تنسيق بين أجهزة مختلفة، والفائت لا يعاد بعد دقيقة. Scheduling is device-local and not a background service. | جهاز صوت واحد مخصص واختبار يومي، أو خدمة جدولة مركزية مع حجز جهاز/heartbeat عند الحاجة. |
| P2 | Windows محمول بلا توقيع تجاري أو تحديث ذاتي. NuGet أعاد NU1900 لتعذر جلب بيانات الثغرات؛ البناء نجح ولا يعني فحص ثغرات ناجحًا. | توقيع الإصدار ومثبت/تحديث موثوق، وتشغيل فحص اعتماديات في CI باتصال متاح. |
| P2 | MFA غير موجود في الواجهة. استرجاع كلمة المرور موجود لكنه يعتمد على البريد وredirects ولم يجر إرسال بريد استعادة حقيقي في هذه الجولة. | اختبر بريد الإنتاج دون كشف بيانات الحساب، وخطط MFA لأصحاب الأندية وصاحب المنصة. |
| P2 | بعض حدود الترخيص قد تتجاوز حدود المحرك: الخطة القديمة تعرض 100,000 عضو بينما المحرك يقيد الأعضاء عند 10,000. License entitlements can exceed hard domain caps. | توحيد حدود الخطط مع المحرك وسياسة أرشفة واختبار تحمل؛ لا تستخدم الحد المعروض كوعد بالسعة. |
| P2 | قوالب التدريب الجاهزة لا تملأ الأوزان والمجموعات والتكرارات تلقائيًا؛ يمكن تعيين قالب غير مكتمل. المدرب هو المسؤول عن الجرعة. Training presets can be assigned with coach-defined values still empty. | إضافة فحص اكتمال قبل التعيين أو تمييزها كمسودات، دون توليد وصفة تدريب طبية. |

## الاختبارات / Verification

- نجح 79 اختبارًا مختلفًا: 76 محليًا و3 اختبارات قاعدة بيانات متصلة؛ يعاد اختبار اثنين محليين أيضًا في ملف النسخ.
  79 distinct tests passed: 76 local plus three connected database tests. See unit-tests.txt; two pure checks repeat in the backup test file.
- TypeScript نجح. نتائج ESLint والبناء النهائي تسجل في ملفات الحزمة بعد اكتمالها.
  TypeScript passed. Final lint/build results are recorded in the release verification file.
- فحص 16 قسمًا باللغتين على عروض 320 و360 و390 و768 و1024 و1440 و1920. القياسات محفوظة في responsive/measurements-*.json. بعد أي تعديل شريط هاتف يعاد فحص المقاسات المتأثرة.
  Sixteen sections, Arabic/English, seven viewport widths. Raw measurements are included. A viewport is not a physical phone/browser certification.
- تبويبات تشغيل النادي الخمسة وفحص حوار العضو على 320؛ المشغل الرسمي position:relative وعرضه ضمن الصفحة، وتصغيره يبقي الإطار وإغلاقه يزيله.
  Operations tabs/member dialog at 320; provider placement, minimization and frame removal on close checked.
- ملف محلي تجريبي 12 ثانية: readyState 4، paused=false وcurrentTime تقدم، ثم الإيقاف paused=true وcurrentTime=0. هذا دليل عمل مسار الوسائط وليس شهادة على جودة سماعات العميل.
  A 12-second local fixture played and Stop reset its position; this verifies the media path, not customer speaker quality.
- بناء Windows 1.1.5 نجح، واختبار allowlist الموسيقى وعزل ملف المنصة والشعار عالي الجودة نجح. الاختبار لا يثبت تشغيل اشتراك Spotify/Anghami كامل أو فحص لوحة Windows يدويًا على كل جهاز.
  Windows build and existing navigation/profile/branding smoke tests passed; full subscriber playback/native panel acceptance on physical devices remains separate.
- 3 أدلة PDF: 14 صفحة للمنصة و24 للمدير و12 للموظفين. رُسمت كل الصفحات وفُحصت وصلات العربية والفهرس والهوامش؛ الحروف الناقصة من الخط عولجت بالتشكيل الصحيح.
  Three bilingual PDFs, 51 pages total, rendered for visual QA with correct Arabic shaping.

- فحص بوابتي الأندية والمنصة: 12 حالة مقاس/لغة؛ صفحات الدخول والاستعادة: 18 حالة، دون إرسال بريد أو تغيير كلمة مرور. تبديل الثيمات الأربعة عشر نجح على بيانات وهمية.
  Commercial portals: 12 viewport/language states; sign-in/recovery/reset: 18 states with no email/password mutation; 14 theme switches passed on fixtures.

## ما لم يتم / Not performed

لم نُغيّر خططًا أو أدوارًا حقيقية، ولم نعتمد تحويلًا أو نستعد نسخة على الإنتاج. لم نختبر كل هاتف فعلي أو Safari/iOS أو قارئ USB وطابعة حقيقيين أو إخراج السماعات الفعلي بهذه الجولة. لا يوجد اختبار ضغط/اختراق مستقل. قيود حقوق وحسابات المنصات لا يعالجها التضمين.
No live plan/role changes, real transfer approvals or production restore were performed. Physical phones, Safari/iOS, actual USB scanner/printer/speakers, independent load/penetration testing and full provider subscriptions were not certified.

حزمة العميل تستبعد دليل المنصة والمصدر والمفاتيح وبيانات الأعضاء. حزمة الاستضافة المستقلة اختيارية لمالك التطبيق/المشغل التقني وتحتاج موارد جديدة، وليست نقلًا لموارد المنصة المشتركة.
The customer package excludes platform-owner docs, source, keys and member data. The optional independent-hosting kit is for the vendor/operator and requires fresh resources, not transfer of the shared service.

اتصال الجهاز بالقاعدة انقطع أثناء محاولات نقل كبيرة قبل نجاح الفحص المنفصل؛ أضيفت مهلات للطلبات ومعالجة انقطاع الاتصال. لم يختبر ملف 64 MiB كامل على الإنتاج ولم تنفذ استعادة لبيانات حقيقية.
The local database transport interrupted some large-payload attempts. Bounded query waits and connection-error handling were added. A complete 64 MiB production restore was not executed; no real club data was replaced.
