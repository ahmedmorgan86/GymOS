# حالة التوقيع - PUSHTORQ

Windows 1.1.12 تم بناؤه في GitHub Actions، لكنه غير موقع Authenticode حتى تتوفر شهادة Code Signing موثوقة ومفتاحها في حساب المالك أو خدمة التوقيع. سكربت windows/Sign-PUSHTORQ.ps1 يرفض شهادة منتهية أو بلا مفتاح خاص، ويستخدم SHA256 وتوقيت RFC3161، ثم يتحقق من التوقيع والناشر. لم يتم تنفيذ التوقيع في هذه البيئة. لا ترسل المفتاح أو كلمة مروره في المحادثة.

Android: ملفات APK الحالية لها بيانات توقيع ضمن META-INF، وتطابق ملفات الإصدار المسجلة. لا يعد ذلك وحده تحققًا تشفيريًا مستقلاً. يلزم تشغيل Android SDK apksigner verify --verbose --print-certs ثم مقارنة بصمة الناشر السابقة قبل التوزيع. تحديث الاسم والأيقونة يتطلب المفتاح الأصلي؛ لا ننشئ مفتاحًا جديدًا لأنه يمنع الترقية فوق الإصدار الحالي. patch التحديث موجود في native-pending.

التوقيع لا يضمن إزالة تحذيرات SmartScreen أو Play Protect. التوزيع خارج المتاجر قد يظل يتطلب موافقة المستخدم. لا نطلب تعطيل برامج الحماية. iPhone هنا تطبيق ويب عبر Safari وليس ملف IPA موقعًا.

المراجع الرسمية:
- https://learn.microsoft.com/windows/win32/seccrypto/signtool
- https://developer.android.com/tools/apksigner
