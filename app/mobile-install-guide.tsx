import Link from 'next/link';
import Image from 'next/image';
import members from '../public/downloads/gymeg-members-android.json';
import management from '../public/downloads/gymeg-management-android.json';
import './member-install/install.css';
export default function MobileInstallGuide({kind,en=false}:{kind:'members'|'management';en?:boolean}){
 const member=kind==='members',release=member?members:management,home=member?'/member':'/clubs';
 const t=(ar:string,english:string)=>en?english:ar;
 const name=member?(en?'GymEG Members':'GymEG الأعضاء'):(en?'GymEG Manager':'GymEG إدارة النادي'),entry=member?'/mobile/member':'/mobile/management';
 return <main className="mobile-install-guide" dir={en?'ltr':'rtl'}>
  <header><Link href="/">GymEG</Link><Link href={(member?'/member-install':'/management-install')+(en?'':'?lang=en')}>{en?'العربية':'English'}</Link></header>
  <section className="install-intro"><small>YOUR GYM. ONE SYSTEM.</small><h1>{name}</h1><p>{t('التطبيق الجديد، بنفس حسابك وبياناتك الحالية.','Your new app, with your existing account and records.')}</p><Link className="button secondary" href={home}>{t('فتح نسخة الويب','Open web app')}</Link></section>
  <div className="install-platforms"><section className="card"><h2>Android</h2>
   <a href={entry}><Image src={member?'/downloads/gymeg-member-qr.png':'/downloads/gymeg-management-qr.png'} width={180} height={180} alt={t('QR تحميل التطبيق','App download QR')} unoptimized/></a>
   <a className="button primary" href={release.url}>{t('تحميل '+name,'Download '+name)}</a>
   <p>{t('الإصدار','Version')} {release.version} · Android {release.minAndroid}+ · {t('يتطلب الإنترنت','Internet required')}</p>
   <ol><li>{t('حمّل التطبيق وافتحه، ثم اسمح بالتثبيت إذا طلب Android ذلك.','Download and open the app, then allow installation if Android asks.')}</li><li>{t('سجّل بنفس حسابك الحالي.','Sign in with your existing account.')}</li><li>{member?t('استخدم رقم الهاتف والرقم السري المسجلين لدى النادي.','Use the phone number and PIN registered with your club.'):t('يمكنك السماح باستخدام الكاميرا لمسح الكروت.','Allow camera access to scan membership cards.')}</li></ol>
  </section><section className="card"><h2>iPhone / iPad</h2><ol><li>{t('افتح نسخة الويب في Safari.','Open the web app in Safari.')}</li><li>{t('اختر مشاركة ← إضافة إلى الشاشة الرئيسية ← إضافة.','Choose Share → Add to Home Screen → Add.')}</li><li>{t('افتح التطبيق من الشاشة الرئيسية وسجّل الدخول.','Open the app from your Home Screen and sign in.')}</li></ol><Link className="button primary" href={home}>{t('فتح التطبيق','Open app')}</Link></section></div>
 </main>;
}
