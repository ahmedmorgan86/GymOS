"use client";
import Image from 'next/image';
import Link from 'next/link';
import {useRef,useState} from 'react';
import {ArrowUpRight,ChartNoAxesCombined,Dumbbell,ShoppingBag,Smartphone,ShieldCheck,Expand,X} from 'lucide-react';
import styles from './product-gallery.module.css';
const screens=[
 {id:'shop',src:'/images/app-shop-private.webp?v=20261029-gymeg-r2',ar:'المتجر والمخزون',en:'Sales & inventory',headline:'المبيعات وإدارة المخزون',english:'Sales and stock management',description:'منتجات بصورها، مخزون واضح، وبيع في خطوات مباشرة.',detail:'Product images, clear stock and a direct sales flow.',icon:ShoppingBag},
 {id:'training',src:'/images/app-training-private.webp?v=20261029-gymeg-r2',ar:'التدريب والمتابعة',en:'Training & progress',headline:'إنشاء برامج التدريب ومتابعتها',english:'Create and track training programs',description:'حديد وكارديو وبرامج مرنة، مع متابعة تنفيذ تمارين الأعضاء.',detail:'Strength, cardio and flexible programs with member workout tracking.',icon:Dumbbell},
 {id:'reports',src:'/images/app-reports-private.webp?v=20261029-gymeg-r2',ar:'التقارير والتحصيل',en:'Reports & collections',headline:'تقارير التحصيل والفروع',english:'Collections and branch reports',description:'فترات وفروع وفواتير وتحصيل، في تقارير تجمع التفاصيل.',detail:'Periods, branches, invoices and collections brought together in detailed reports.',icon:ChartNoAxesCombined}
];
export default function ProductGallery({en}:{en:boolean}){
 const [active,setActive]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const screen=screens[active],Icon=screen.icon;
 const t=(ar:string,english:string)=>en?english:ar;
 return <section className={styles.gallery} aria-labelledby="product-gallery-title">
  <div className={styles.intro}><span className={styles.eyebrow}>GymEG / PRODUCT SCREENS</span><h2 id="product-gallery-title">{t('شاهد النظام من الداخل','See the system in action')}</h2><p>{t('اختر شاشة لتشاهد إدارة المنتجات أو التدريب أو التقارير، وافتح الصورة بحجم أكبر لمراجعة الواجهة.','Choose sales, training or reports, then enlarge the screenshot to inspect the interface.')}</p></div>
  <div className={styles.stage}>
   <div className={styles.orbit} aria-hidden="true"/>
   <div className={styles.toolbar} role="group" aria-label={t('اختر شاشة التطبيق','Choose an application screen')}>{screens.map((item,index)=>{const ItemIcon=item.icon;return <button type="button" key={item.id} aria-pressed={active===index} onClick={()=>setActive(index)}><ItemIcon size={18}/>{en?item.en:item.ar}</button>;})}</div>
   <div className={styles.stageHeading} aria-live="polite"><div><span>0{active+1} / GymEG</span><h3>{en?screen.english:screen.headline}</h3><p>{en?screen.detail:screen.description}</p></div><Icon size={40} strokeWidth={1.2} aria-hidden="true"/></div>
   <div className={styles.screenLayout}>
    <figure className={styles.browser} key={screen.id}><div className={styles.browserChrome}><span aria-hidden="true"><i/><i/><i/></span><b>GymEG / {en?screen.en:screen.ar}</b><button type="button" onClick={()=>dialog.current?.showModal()} aria-label={t('تكبير لقطة الواجهة','Enlarge interface screenshot')}><Expand size={16}/></button></div><Image src={screen.src} width={1440} height={1000} sizes="(max-width:850px) 100vw, 1000px" alt={t('معاينة تصميم واجهة ','Interface design preview: ')+(en?screen.en:screen.ar)+t('، ببيانات عرض مخفية',', with demonstration records obscured')}/></figure>
    <aside className={styles.phoneColumn}><div className={styles.phone}><div className={styles.phoneNotch} aria-hidden="true"/><Image src="/images/app-member-private.webp?v=20261029-gymeg-r2" width={390} height={844} sizes="240px" alt={t('واجهة تطبيق العضو بمعلومات شخصية مخفية','Member application interface with personal details obscured')}/></div><span className={styles.mobileTag}><Smartphone size={16}/>{t('تطبيق العضو: الاشتراك والكارت والتدريب','Member app: membership, pass and training')}</span></aside>
   </div>
   <p className={styles.privacy}><ShieldCheck size={15}/>{t('معاينات للهوية الجديدة. بيانات توضيحية وليست سجلات عملاء.','New identity previews. Illustrative data, not customer records.')}</p>
  </div>
  <div className={styles.bottom}><div><span>{t('جرّب النظام ببيانات ناديك','TRY IT WITH YOUR OWN CLUB')}</span><h3>{t('جرّب إضافة عضو وتجديد اشتراك وتسجيل حضور.','Try registering a member, renewing and checking in.')}</h3></div><Link href="/demo">{t('ابدأ تجربتك ٣٠ يومًا','Start your 30-day trial')}<ArrowUpRight size={22}/></Link></div>
  <dialog ref={dialog} className={styles.lightbox} aria-label={t('لقطة مكبرة من واجهة التطبيق','Enlarged application interface screenshot')} onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}><button type="button" className={styles.close} onClick={()=>dialog.current?.close()} aria-label={t('إغلاق الصورة','Close screenshot')}><X size={24}/></button><Image src={screen.src} width={1440} height={1000} sizes="95vw" alt={en?screen.en:screen.ar}/></dialog>
 </section>;
}
