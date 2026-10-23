# تطبيق العضو: دخول بالكود / Member app: private code sign-in

رابط التطبيق القابل للتثبيت: https://gymos-enterprise.vercel.app/member

- كل عضو حقيقي غير مؤرشف يحصل تلقائيًا على كود دخول خاص وحساب معزول. تم ترحيل الأعضاء الحاليين؛ إنشاء عضو جديد أو استيراده أو استعادة نسخة يولد الربط في نفس معاملة حفظ البيانات. سجلات الديمو العامة لا تحصل على دخول.
- لا يوجد بريد أو كلمة مرور أو تأكيد بريد لدخول العضو بالكود. كود الدخول سر عشوائي بقوة 128 بت، منفصل تمامًا عن سيريال كارت الحضور. لا تعتمد على رقم الهاتف أو كود مطبوع علنًا للتحقق من الهوية.
- المالك/المدير: الأعضاء ← ملف العضو ← تطبيق الموبايل ← عرض كود دخول العضو. سلم الكود أو QR الخاص لصاحب العضوية فقط. لا يرسل النظام رسائل تلقائية.
- العضو يفتح /member ويكتب الكود، أو يمسح QR الخاص بالدخول فيفتح #code محليًا، ويُحذف الرمز من عنوان الصفحة بعد قراءته. الجلسة محفوظة في Cookie آمنة HttpOnly/Secure/SameSite لمدة سبعة أيام، دون تخزين الكود في localStorage.
- المالك/المدير يستطيع تغيير الكود أو وقف الدخول. التغيير يبطل الكود السابق والجلسات القديمة عند الطلب التالي. الأرشفة/حذف العضو/وقف ترخيص النادي يمنع قراءة الملف. إعادة إنشاء عضو جديد تولد كودًا جديدًا. وقف الدخول يدويًا لا يُلغى بمجرد تعديل بيانات العضو؛ تغيير الكود يعيد تفعيله صراحة.
- كل عضو يرى ملفه وفرعه فقط، وقياساته وتدريبه وحجوزاته ومدفوعاته، وعدد الموجودين في فرعه دون أسمائهم. الموبايل يقرأ نفس قاعدة الويب وWindows كل خمس ثوانٍ أثناء فتح الشاشة. لا توجد صلاحيات تعديل إدارة النادي للعضو.
- QR/Code128 داخل الكارت الرقمي يستخدمان سيريال الحضور فقط، وليس سر تسجيل الدخول. فتح الكارت لا يسجل حضورًا؛ يتطلب قارئ النادي أو الاستقبال.
- Android: Chrome ← تثبيت التطبيق أو إضافة للشاشة الرئيسية. iPhone: Safari ← مشاركة ← إضافة للشاشة الرئيسية. التطبيق PWA يحتاج اتصالًا لعرض البيانات الخاصة، وليس APK/IPA منشورًا على المتاجر.
- الأكواد مخزنة كقيم بحث مجزأة، والنص مشفر بمفتاح Vault منفصل لكل نادي. لا تنسخ مفاتيح Vault بين العملاء. ملفات نقل النادي المعتادة لا تحتوي أكواد الدخول؛ في الاستضافة المستقلة يُولَّد لكل عضو كود جديد.
- حسابات إدارة النادي الحالية تظل محمية بنظام تسجيل دخولها. أكواد الأعضاء لا تمنح وصولًا للموظفين أو لإدارة المنصة. لم يتم تعطيل تأكيد البريد العام في Supabase.

## English

Real, non-archived members are automatically provisioned with a private 128-bit sign-in code in the same transaction as member creation/import/restore. Existing members are backfilled. There is no member email, password or confirmation step. The code is a secret, separate from the publicly presented attendance serial. Owners/managers reveal and hand it to the member in person, or provide the private sign-in QR. Codes are hashed for lookup and encrypted under a tenant-specific Vault key; private codes are not included in normal club transfer files.

The app exchanges a valid code for a seven-day HttpOnly, Secure, SameSite session. Codes in QR fragments are cleared from the address bar after reading and are not saved in localStorage. Rotation invalidates old codes/sessions; revocation, archived/missing member records and closed club licenses fail closed. Public demo members are excluded. Member sessions never authenticate staff APIs. Rate limits and same-origin checks protect sign-in and management routes. The same backend serves the web app, Windows app and member PWA; records refresh every five seconds while visible. Only the member’s own records and anonymous own-branch occupancy are returned.
