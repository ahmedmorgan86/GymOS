# PUSHTORQ Android — independent applications

PUSHTORQ Members: com.pushtorq.members, /member. PUSHTORQ Manager: com.pushtorq.management, /clubs. Initial version1.0.0, versionCode1. Android8+ and internet required. Both connect only to https://pushtorq.vercel.app and the existing cloud accounts/data. These WebView shells install alongside GYM OS; they are not in-place updates. iPhone uses the Safari Home Screen web app. No store publication is included.

The new certificate is pinned in docs/identity/android-signing-certificates.json. The private key is kept outside the repository, APKs and public delivery archive. Keep the separate owner-only recovery backup; future updates to these packages must retain this signing key and increment versionCode.

Build: python mobile-android/build.py. Requires official SDK Build Tools, platform36 and a JDK with jdk.compiler. Set ANDROID_BUILD_TOOLS to the SDK tools folder, ANDROID_PLATFORM_JAR to android.jar, PUSHTORQ_KEYSTORE to the external private PKCS12 file, PUSHTORQ_KEYSTORE_PASSWORD securely through environment and optionally PUSHTORQ_KEY_ALIAS (default pushtorq-android-release) and JAVA. Native libraries must be discoverable. The builder compiles resources and Java, creates DEX, aligns before signing, verifies signature/alignment and records source hashes.

Manager camera access requires runtime consent and the trusted origin. Members has only INTERNET permission. No JavaScript bridge, file/content access, SSL bypass, third-party cookies, WebView debugging or backup of app storage.

Verified: compilation, Android apksigner v2/v3 signatures, ZIP alignment, source/artifact hashes and automated security checks. Physical phone/emulator installation, actual account login, camera/barcode operation and Play Protect approval have not been tested. Signing does not guarantee that installation warnings disappear.

References: https://developer.android.com/tools/apksigner and https://developer.android.com/tools/aapt2
