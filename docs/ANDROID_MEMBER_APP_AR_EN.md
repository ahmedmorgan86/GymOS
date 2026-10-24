# تطبيق الأعضاء Android / Android members app

افتح https://gymos-enterprise.vercel.app/about أو واجهة GYM OS الرئيسية من هاتف Android، واضغط «تحميل تطبيق الأعضاء — Android APK». افتح GymOS-Members-Android-1.0.0.apk ووافق على تثبيت هذا الملف من المتصفح إذا طلب Android ذلك. لا يلزم تعطيل Play Protect، ولا تتجاوز تحذير ملف ضار.

يلزم Android 8.0 أو أحدث وAndroid System WebView محدث واتصال بالإنترنت. افتح GYM OS Members، ثم أدخل رقم الموبايل المسجل لدى النادي. تقبل الأرقام المصرية 01… أو الدولية +رمز الدولة، والأرقام العربية.

أول دخول برقم مؤقت عشوائي تستلمه من موظف مخول بعد التحقق من هويتك، ثم اختر رقمًا جديدًا خاصًا من 6 أرقام وكرره. لن تُعرض بياناتك قبل تغييره. يمكنك تغييره لاحقًا من داخل الحساب. الرقم الشخصي لا يمكن للإدارة عرضه؛ يمكن للمالك أو المدير إصدار رقم مؤقت عشوائي جديد، مع إبطال الجلسات وإلزام تغييره مجددًا. لا توجد رسائل بريد أو SMS للتفعيل.

الرقم المشترك القديم لم يعد مقبولًا في نسخة المصدر المعدلة. يلزم إصدار رقم مؤقت خاص للعضو بعد التحقق من هويته. لم تُشغّل خدمة رسائل مدفوعة. لا يُفترض سريان ذلك على الإنتاج قبل نشر التعديل.

افتح كارتك لعرض QR والباركود لقارئ النادي. فتح التطبيق أو الكارت وحده لا يسجل حضورًا. اسم وأيقونة المشغّل GYM OS Members؛ اسم وشعار النادي يظهران داخل حسابه. التطبيق غلاف Android محدود لمساحة العضو الحية، وليس قاعدة مستقلة دون إنترنت أو تطبيقًا منشورًا في Google Play.

Download from the GYM OS main dashboard or the Arabic/English public site. The member portal contains no installation instructions or APK download controls. Open the APK and authorize that specific browser installation if Android requests it. Do not disable Play Protect or bypass a malware warning. Android 8+, current System WebView and internet are required. Sign in with the saved mobile and a random temporary PIN privately issued by authorized club staff, then choose a different six-digit PIN before viewing records. Member-chosen PINs cannot be revealed to staff; owners/managers can reset to the temporary PIN. No email/SMS activation is sent.

This signed APK is a restricted WebView of the live member portal, not an offline native database or a Google Play release. Launcher branding is GYM OS Members; club branding appears in the account. The production domain is pinned; independent hosting needs rebuilding. Keep the SAME private signing key for updates and increase versionCode. Never publish the keystore/password in source or club packages.

Verification: compiled APK, v2/v3 signatures, SHA-256, manifest and DEX/resources were checked. Browser/API/database checks cover phone/PIN login, initial-PIN data blocking, PIN change, membership selection and tenant isolation. Physical Android installation, keyboard/lifecycle and OEM WebView behavior remain unverified in this session. Test on the customer's phone before commercial rollout.

Source security update, not deployed: the former shared PIN and its pending sessions are rejected. Existing accounts still using it require a staff-issued random temporary PIN. This session did not rebuild or physically test the APK. No SMS-provider charge was introduced.

Release signing certificate SHA-256: 6b70cd2aa1e6f6a71189aae8bcfcef4a4409488625083883622736b818160801.
