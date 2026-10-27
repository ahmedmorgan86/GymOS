# نشر PUSHTORQ في البحث / Search publishing

الإعداد الحالي مخصص للرابط https://pushtorq.vercel.app. صفحات الأندية والأعضاء ولوحة الإدارة ليست للنشر. الفهرسة والترتيب قرار محرك البحث؛ إرسال رابط لا يضمن الظهور.

The public site is separate from the authenticated application. No tenant names, member records or private API URLs are included in discovery files.

## ما تم تجهيزه / Prepared files

- `/`: الصفحة العربية الأساسية، و`/about` نسخة تشير إليها عبر canonical، و`/en/about`: الصفحة الإنجليزية، و`/demo`: شرح التجربة.
- `/sitemap.xml`: هذه الصفحات الثلاث فقط، وروابط اللغات البديلة للصفحتين التعريفيتين.
- `/robots.txt`: يسمح بالصفحات العامة والأصول اللازمة لعرضها ويستبعد المسارات الداخلية. النسخ التجريبية على Vercel تمنع الفهرسة.
- Canonical, hreflang, Open Graph, Twitter metadata and SoftwareApplication JSON-LD, without invented ratings or paid-price claims.
- Private pages inherit noindex; authenticated/API middleware also sends X-Robots-Tag. This is discovery control, not a replacement for authorization.
- `public/indexnow-key.txt`: مفتاح ملكية عام لإشعارات IndexNow، وليس كلمة مرور أو مفتاح وصول للحساب.
- `scripts/submit-indexnow.mjs`: عرض الروابط أولًا؛ `--submit` يتحقق من الصفحات والمفتاح المنشور ثم يرسل الصفحات العامة فقط.

## Google

1. افتح https://search.google.com/search-console وسجّل بحسابك.
2. أضف خاصية URL-prefix بالرابط الكامل `https://pushtorq.vercel.app/`. استخدام نطاق خاص لاحقًا يسمح بخاصية Domain وإثبات DNS.
3. اختر HTML tag وانسخ قيمة `content` فقط إلى إعداد Vercel باسم `GOOGLE_SITE_VERIFICATION`، ثم أعد النشر واضغط Verify. التطبيق يدعم هذا الوسم بالفعل، لكن لا توجد قيمة ملكية مولدة من حسابك في المصدر.
4. من Sitemaps أرسل `https://pushtorq.vercel.app/sitemap.xml`.
5. افحص `/` و`/en/about` في URL Inspection واطلب الفهرسة إن لزم. تابع Page indexing والأخطاء؛ لا ترسل بيانات الأعضاء.

Submission is a hint, not an indexing guarantee: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
The old Google sitemap ping endpoint is retired and is not used: https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

## Bing and IndexNow

1. افتح https://www.bing.com/webmasters وأضف نفس رابط الموقع. يمكن استيراد خاصية Google بعد إثباتها أو استخدام إثبات Bing.
2. لقيمة HTML meta استخدم `BING_SITE_VERIFICATION` ثم أعد النشر واضغط Verify.
3. أرسل نفس `sitemap.xml` من Sitemaps.
4. بعد التأكد من نشر النسخة النهائية شغّل `node scripts/submit-indexnow.mjs --submit`. الأمر بدون `--submit` يعرض معاينة فقط. المفاتيح هنا عامة ومخصصة لإثبات استضافة الروابط، وليست أسرارًا.
5. قبول 200/202 يعني استلام الإشعار أو انتظار التحقق، ولا يعني فهرسة الصفحات.

Official guidance: https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed
Protocol and supported notification behavior: https://www.indexnow.org/documentation

## Yandex

أضف الموقع من https://webmaster.yandex.com/، وأثبت الملكية بقيمة HTML meta في `YANDEX_SITE_VERIFICATION` ثم أعد النشر. أضف رابط خريطة الموقع من Sitemap files. الدليل الرسمي يشترط إثبات إدارة الموقع: https://yandex.com/support/webmaster/en/service/quick-start

## بقية المحركات / Other search surfaces

- DuckDuckGo: السماح بالزحف وتجهيز Bing يساعد على اكتشاف الصفحات؛ معظم الروابط التقليدية تأتي من Bing مع مصادر أخرى، فلا يوجد وعد بانتقال كل نتيجة. Source: https://duckduckgo.com/duckduckgo-help-pages/results/sources
- Apple Search/Siri/Spotlight: قواعد robots الحالية تسمح لـApplebot بالصفحات العامة. ظهور النتائج يخضع لـApple. Source: https://support.apple.com/en-us/119829
- Baidu: بوابة المالك الرسمية https://zy.baidu.com/ تتطلب تسجيل دخول وإثبات الموقع؛ نفذ طريقة الإثبات التي يتيحها حسابك، ولا تفترض أن إرسال Bing يثبت الملكية هناك.
- المحركات الأخرى تستطيع اكتشاف الصفحات العامة عبر الروابط وخريطة الموقع وقواعد الزحف؛ لا توجد خدمة واحدة تضمن النشر في كل محرك. لا توجد حسابات Yahoo/Baidu/Google/Yandex منشأة أو موثقة تلقائيًا بهذه الحزمة.

## تغيير النطاق والمتابعة / Domain changes and monitoring

عند ربط نطاقك الخاص اضبط `NEXT_PUBLIC_SITE_URL` على أصل HTTPS فقط دون مسار، ثم أعد النشر وإثبات الملكية وإرسال الخريطة على النطاق الجديد. راجع تحويلات النطاق القديم قبل طلب النقل. لا تغيّر روابط البيانات أو تسمح بفهرسة صفحات الأعضاء.

Keep claims in public content accurate. Add useful real product guides as public pages when available; do not create copied keyword pages, fake reviews, fake organization addresses or hidden text. Inspect rendered mobile pages and real performance after content changes. Verification codes and account confirmations remain owner actions; no passwords should be shared in chat.

## تحديث 26 أكتوبر 2026 / 26 October 2026 update
العنوان والوصف يعكسان إدارة الأعضاء والاشتراكات والحضور والتحصيل والفروع، مع صورة مشاركة 1200×630 من واجهات عرض فعلية مخفية المعلومات. sitemap يستخدم تاريخ آخر تعديل مهم 2026-10-26، وليس وقت فتحه في كل مرة. مسارات الخريطة هي / و/en/about و/demo فقط.
Metadata now reflects members, memberships, attendance, collections and branches. The1200×630 sharing image uses redacted synthetic interface captures. Sitemap lastmod records the significant content update,2026-10-26, rather than changing on every request. Only /, /en/about and /demo are submitted.
SoftwareApplication structured data is descriptive. PUSHTORQ does not fabricate an Offer price or review/rating to qualify for Google's software rich result. Prices remain by agreement. See https://developers.google.com/search/docs/appearance/structured-data/software-app . IndexNow200/202 is only notification acceptance; it is not proof of indexing. See https://www.indexnow.org/documentation .
