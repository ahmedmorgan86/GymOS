# إصلاحات التشغيل والبيانات التجريبية / Business repairs and fictional data

تحديث المصدر في 24 أكتوبر 2026: أُلغي قبول الرقم المشترك القديم، ويصدر موظف مخول رقمًا مؤقتًا عشوائيًا بعد التحقق من هوية العضو. الأرقام الشخصية السابقة لا تتغير. التعديل غير منشور ولم يغيّر حسابات إنتاج. راجع MEMBER_APP_CONNECTED_AR_EN.md.

إنشاء ملف عضو جديد لا يمنحه دخول النادي تلقائيًا؛ يمكن اختيار عضوية يدوية صراحة بالتواريخ، أو اختيار باقة بعد إنشاء الملف.

الاشتراكات أصبحت فترات مستقلة لها بداية ونهاية وحد زيارات. التجديد المجدول يحفظ الفترة الحالية ويضع الجديدة بعد آخر حجز، ويمكن اختيار البدء اليوم بعد تأكيد إنهاء الفترة الحالية؛ الحجوزات المستقبلية المتعارضة لا تُحذف. محفوظات الاشتراكات تبقى ظاهرة. التجديد اليدوي القديم لا يمسح عقدًا محدد الزيارات. التجميد وفكه يحركان مواعيد الفترات المجدولة معًا.

التحصيل العام يسدد الفواتير الأقدم أولًا، والزائد رصيد مقدم واضح. الرصيد الجديد يُستهلك عند إنشاء فاتورة باقة أو تدريب. التحصيل القديم لا يُعاد تخصيصه تلقائيًا؛ من حساب العضو يمكن ربطه بفاتورة دون إضافة دفعة جديدة. الإلغاء يعيد المديونية، ولا يعيد مالًا إلكترونيًا. التقارير تفصل العضويات والتدريب والرصيد المقدم وتحافظ على إجمالي التحصيل دون تكرار.

الدخول في يوم جديد يغلق الزيارة المفتوحة السابقة عند وقت التسجيل الجديد؛ هذا توقيت إغلاق تلقائي وليس ادعاءً بمعرفة وقت مغادرة الشخص. الخروج ينهي الزيارات المفتوحة الأقدم أيضًا. عدد الموجودين تقديري من أحدث زيارة مسجلة لكل عضو خلال 12 ساعة.

تم تقديم النظرة العامة والاستقبال والأعضاء والحضور والحسابات في التنقل، وربط برنامج عرض المدرب عند اختيار ذلك. عمولات المدرب تستند إلى التحصيل الصحيح، ويظهر الرصيد السالب كمبلغ مسترد من المدرب.

شاشة العضو لا تعرض تعليمات تثبيت أو رابط APK. التنزيل موجود في واجهة GYM OS الرئيسية وصفحة الموقع العامة فقط.

البيانات الكاملة للتجربة تُضاف فقط إلى نادي اختبار معزول. تشمل 1000 عضو إضافي بأسماء عربية موسومة «تجريبي» وأرقام محجوزة خيالية، وفروعًا وباقات وفترات وفواتير ومدفوعات وحضورًا وتدريبًا ومدربين ومخزونًا ونداءات عربية وإنجليزية. لا يُنشأ اتصال WhatsApp أو تُرسل رسائل. مثالان يوميان من النداءات مجدولان بدءًا من الغد، والباقي جاهز للتجربة والتفعيل. التشغيل الصوتي المجدول يحتاج التطبيق مفتوحًا وصوت الجهاز متاحًا.

المولد completeDemo إضافي وقابل لإعادة التشغيل دون تكرار؛ يرفض اسم نادي عادي. سكربت scripts/seed-complete-demo.mjs يتحقق أيضًا من أن الأعضاء الموجودين تجريبيون، ويحفظ نسخة قبل الإضافة، ثم يحفظ بدفعات 100. استخدم حساب قاعدة التشغيل المحدود ومفتاح مساحة نادي الاختبار، ولا تستخدم بيانات اتصال الإدارة في المتصفح. لا تشغله على نادي عميل فعلي. استعادة النسخة السابقة تعيد حالة النادي بأكملها وقد تستبدل تعديلات أجريت بعد الإضافة؛ راجعها قبل الاستعادة.

Memberships now preserve explicit current/history/scheduled terms and visit limits. Early renewal queues safely; immediate replacement requires confirmation and cannot silently cancel conflicting future terms. Freezes shift queued dates consistently. General collections allocate oldest invoices and expose surplus as advance credit; historical receipts require explicit allocation. Partial allocations across invoices are validated against the actual receipt total. Voids reopen debt; no electronic refund is implied.

Cross-midnight entry closes the previous open visit, checkout closes stale open visits, and occupancy uses only the latest recorded visit per member. Occupancy remains an estimate with a 12-hour window. Coaching can link the offer program; navigation prioritizes daily operations. Member installation/download content is removed; APK download lives in the main dashboard/public site. Authentication and existing permissions are preserved.

The complete fictional dataset is test-club-only, additive/idempotent and validated for references, dates, invoice allocations and stock. It preserves existing member records/PINs and uses reserved fictional phone numbers; no real messaging connections are created. A pre-seed backup and verification manifest are written outside the source. Test hardware camera/scanner and physical Android installation still require available devices.
