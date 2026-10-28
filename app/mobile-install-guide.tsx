import Link from 'next/link';
import Image from 'next/image';
import members from '../public/downloads/gymeg-members-android.json';
import management from '../public/downloads/gymeg-management-android.json';
import './member-install/install.css';
export default function MobileInstallGuide({kind,en=false}:{kind:'members'|'management';en?:boolean}){
 const member=kind==='members',release=member?members:management,home=member?'/member':'/clubs';
 const t=(ar:string,english:string)=>en?english:ar;
 const name=member?'GYMEG Members':'GYMEG Manager',entry=member?'/mobile/member':'/mobile/management';
 return <main className="mobile-install-guide" dir={en?'ltr':'rtl'}>
  <header><Link href="/">GYMEG</Link><Link href={(member?'/member-install':'/management-install')+(en?'':'?lang=en')}>{en?'العربية':'English'}</Link></header>
  <section className="install-intro"><small>YOUR GYM. ONE SYSTEM.</small><h1>{name}</h1><p>{t('التطبيق الجديد، بنفس حسابك وبياناتك الحالية.','Your new app, with your existing account and records.')}</p><Link className="button secondary" href={home}>{t('فتح نسخة الويب','Open web app')}</Link></section>
  <div className="install-platforms"><section className="card"><h2>Android</h2>
   <a href={entry}><Image src={member?'/downloads/gymeg-member-qr.png':'/downloads/gymeg-management-qr.png'} width={180} height={180} alt={t('QR تحميل التطبيق','App download QR')} unoptimized/></a>
   <a className="button primary" href={release.url}>{t('تحميل '+name,'Download '+name)}</a>
   <p>{t('الإصدار','Version')} {release.version} · Android {release.minAndroid}+ · {t('يتطلب الإنترنت','Internet required')}</p>
   <ol><li>{t('حمّل APK وافتحه، ثم اسمح بالتثبيت من المتصفح إذا طلب Android ذلك.','Download and open the APK, then allow installation from your browser if Android asks.')}</li><li>{t('افتح الأيقونة الجديدة وسجّل بنفس حسابك الحالي؛ لا تنشئ حسابًا آخر.','Open the new icon and sign in with your existing account; do not create another account.')}</li><li>{member?t('استخدم نفس رقم الهاتف والرقم السري المسجلين لدى النادي.','Use the same phone and PIN registered with your club.'):t('الكاميرا اختيارية لمسح الكروت؛ يتطلب استخدامها موافقتك. صلاحيات الحساب يطبقها الخادم.','Camera access is optional for scanning and requires your consent. Account permissions remain enforced by the server.')}</li></ol>
   <p>{t('هذه هي نسخة GYMEG الحالية. إذا كانت لديك نسخة أقدم، زامن أي عمل غير محفوظ ثم أزلها قبل التثبيت. سجّل بحسابك الحالي لاستعادة بيانات النادي من الخادم.','This is the current GYMEG release. If an earlier app is installed, sync pending work and uninstall it before installing. Sign in with your existing account to access server records.')}</p>
   <details><summary>{t('تفاصيل الإصدار والتحقق','Release details and verification')}</summary><p dir="ltr">{release.package}</p><p>SHA-256</p><code style={{overflowWrap:'anywhere'}}>{release.sha256}</code><p>{t('تم التحقق من التوقيع والبناء برمجيًا. لم يتم اختبار التثبيت على هاتف فعلي بعد. التوقيع لا يضمن اختفاء تحذيرات التثبيت.','Build and signature were verified programmatically. Installation on a physical phone has not been tested. Signing does not guarantee the absence of installation warnings.')}</p></details>
  </section><section className="card"><h2>iPhone / iPad</h2><ol><li>{t('افتح نسخة الويب في Safari.','Open the web app in Safari.')}</li><li>{t('اختر مشاركة ← إضافة إلى الشاشة الرئيسية ← إضافة.','Choose Share → Add to Home Screen → Add.')}</li><li>{t('فعّل فتح كتطبيق ويب إذا ظهر، ثم سجّل بنفس حسابك.','Enable Open as Web App if shown, then use your existing account.')}</li></ol><Link className="button primary" href={home}>{t('فتح التطبيق','Open app')}</Link><p>{t('نسخة iPhone تطبيق ويب، وليست APK أو إصدار App Store. هذا التسليم لا يتضمن نشرًا على Google Play أو App Store.','iPhone uses an installable web app, not an APK or an App Store release. This delivery does not include store publication.')}</p></section></div>
 </main>;
}
