# تطبيق الأعضاء Android / Android members app

افتح https://gymos-enterprise.vercel.app/about أو واجهة GYM OS الرئيسية من هاتف Android، واضغط «تحميل تطبيق الأعضاء — Android APK». افتح GymOS-Members-Android-1.0.0.apk ووافق على تثبيت هذا الملف من المتصفح إذا طلب Android ذلك. لا يلزم تعطيل Play Protect، ولا تتجاوز تحذير ملف ضار.

يلزم Android 8.0 أو أحدث وAndroid System WebView محدث واتصال بالإنترنت. افتح GYM OS Members، ثم أدخل رقم الموبايل المسجل لدى النادي. تقبل الأرقام المصرية 01… أو الدولية +رمز الدولة، والأرقام العربية.

أول دخول بالرقم الافتراضي 123456، ثم اختر رقمًا جديدًا خاصًا من 6 أرقام وكرره. لن تُعرض بياناتك قبل تغييره. يمكنك تغييره لاحقًا من داخل الحساب. الرقم الشخصي لا يمكن للإدارة عرضه؛ يمكن للمالك أو المدير إعادة تعيينه إلى 123456، مع إبطال الجلسات وإلزام تغييره مجددًا. لا توجد رسائل بريد أو SMS للتفعيل.

الرقم الافتراضي مشترك ومعروف ولا يثبت ملكية الهاتف. من يعرف رقم عضو لم يفعّل حسابه يمكنه محاولة حجز الدخول الأول؛ يفضل إتمام التفعيل الأول مع العضو في النادي. منع ذلك بالكامل يتطلب عامل تفعيل خاصًا أو OTP، ولم تُشغّل خدمة رسائل مدفوعة.

افتح كارتك لعرض QR والباركود لقارئ النادي. فتح التطبيق أو الكارت وحده لا يسجل حضورًا. اسم وأيقونة المشغّل GYM OS Members؛ اسم وشعار النادي يظهران داخل حسابه. التطبيق غلاف Android محدود لمساحة العضو الحية، وليس قاعدة مستقلة دون إنترنت أو تطبيقًا منشورًا في Google Play.

Download from the GYM OS main dashboard or the Arabic/English public site. The member portal contains no installation instructions or APK download controls. Open the APK and authorize that specific browser installation if Android requests it. Do not disable Play Protect or bypass a malware warning. Android 8+, current System WebView and internet are required. Sign in with the saved mobile and temporary PIN 123456, then choose a different six-digit PIN before viewing records. Member-chosen PINs cannot be revealed to staff; owners/managers can reset to the temporary PIN. No email/SMS activation is sent.

This signed APK is a restricted WebView of the live member portal, not an offline native database or a Google Play release. Launcher branding is GYM OS Members; club branding appears in the account. The production domain is pinned; independent hosting needs rebuilding. Keep the SAME private signing key for updates and increase versionCode. Never publish the keystore/password in source or club packages.

Verification: compiled APK, v2/v3 signatures, SHA-256, manifest and DEX/resources were checked. Browser/API/database checks cover phone/PIN login, initial-PIN data blocking, PIN change, membership selection and tenant isolation. Physical Android installation, keyboard/lifecycle and OEM WebView behavior remain unverified in this session. Test on the customer's phone before commercial rollout.

Known limitation: the public initial PIN permits first-claim takeover of an unclaimed account by someone knowing its phone number. Club-supervised activation is advised; prevention requires a private activation factor or OTP. No SMS-provider charge was introduced.

Release signing certificate SHA-256: 6b70cd2aa1e6f6a71189aae8bcfcef4a4409488625083883622736b818160801.
