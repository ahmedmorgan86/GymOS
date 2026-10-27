# GYM OS Members for Android

Member-only native Android APK containing a restricted WebView of https://pushtorq.vercel.app/member. Uses the same live member account, branch isolation, profile, training and digital attendance pass. Requires Android 8+ and current Android System WebView, with internet. Not a fully offline native data client and not published to Google Play.

Build: Android SDK platform 36/build-tools 36.0.0 and JDK 21, then `./android/build.ps1 -SigningKey <private-path>`. Supply GYMOS_ANDROID_STORE_PASSWORD only through the process environment. Reuse the SAME private signing key and increment versionCode for every update. Never publish the key/password or include it in club packages. The checked-in APK is signed with the platform-owned release certificate; verify it using Android SDK apksigner before distributing.

Only INTERNET permission. No file/content access, JavaScript bridge, third-party cookies, HTTP, SSL overrides, device credentials, camera/microphone or contacts permission. Main navigation is limited to the production member path; subresources use the same trusted HTTPS host. No account data is embedded in the APK. Cloud/device backup of app storage is disabled. A network error offers an explicit retry.

Download from the main GYM OS dashboard or the public Arabic/English site. Android asks the user to authorize installing an APK from that browser; no setting is changed automatically. This is direct APK distribution, not Play Store certification. Certificate verification/compile checks do not substitute for installing and testing on an actual Android phone.

References: https://developer.android.com/reference/android/webkit/WebSettings and https://developer.android.com/tools/apksigner .

PUSHTORQ launcher branding and origin migration are prepared in docs/identity/native-pending. The currently signed APK retains its original matching sources until rebuilt with the original signing key.
