"use client";
import Image from 'next/image';
import Link from 'next/link';
import {useRef,useState} from 'react';
import {ArrowUpRight,ChartNoAxesCombined,Dumbbell,ShoppingBag,Smartphone,ShieldCheck,Expand,X} from 'lucide-react';
import styles from './product-gallery.module.css';
const screens=[
 {id:'shop',src:'/images/app-shop-private.webp',ar:'المتجر والمخزون',en:'Sales & inventory',headline:'من المنتج… لآخر وحدة.',english:'From the product to the last unit.',description:'منتجات بصورها، مخزون واضح، وبيع في خطوات مباشرة.',detail:'Product images, clear stock and a direct sales flow.',icon:ShoppingBag},
 {id:'training',src:'/images/app-training-private.webp',ar:'التدريب والمتابعة',en:'Training & progress',headline:'خطة واضحة. لكل هدف.',english:'A clear plan. For every goal.',description:'حديد وكارديو وبرامج مرنة، مع متابعة تنفيذ تمارين الأعضاء.',detail:'Strength, cardio and flexible programs with member workout tracking.',icon:Dumbbell},
 {id:'reports',src:'/images/app-reports-private.webp',ar:'التقارير والتحصيل',en:'Reports & collections',headline:'قرارك يبدأ بصورة كاملة.',english:'Better decisions start with clarity.',description:'فترات وفروع وفواتير وتحصيل، في تقارير تجمع التفاصيل.',detail:'Periods, branches, invoices and collections brought together in detailed reports.',icon:ChartNoAxesCombined}
];
export default function ProductGallery({en}:{en:boolean}){
 const [active,setActive]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const screen=screens[active],Icon=screen.icon;
 const t=(ar:string,english:string)=>en?english:ar;
 return <section className={styles.gallery} aria-labelledby="product-gallery-title">
  <div className={styles.intro}><span className={styles.eyebrow}>BUILT FOR YOUR EVERYDAY</span><h2 id="product-gallery-title">{t('شوف القوة. في التفاصيل.','See the power. In the details.')}</h2><p>{t('مش مجرد شاشة حلوة. مساحة شغل تجمع النادي كله، وتقرّب المعلومة المهمة.','More than a beautiful screen. A workspace that brings your club together and the important information closer.')}</p></div>
  <div className={styles.stage}>
   <div className={styles.orbit} aria-hidden="true"/>
   <div className={styles.toolbar} role="group" aria-label={t('اختر شاشة التطبيق','Choose an application screen')}>{screens.map((item,index)=>{const ItemIcon=item.icon;return <button type="button" key={item.id} aria-pressed={active===index} onClick={()=>setActive(index)}><ItemIcon size={18}/>{en?item.en:item.ar}</button>;})}</div>
   <div className={styles.stageHeading} aria-live="polite"><div><span>0{active+1} / GYM OS</span><h3>{en?screen.english:screen.headline}</h3><p>{en?screen.detail:screen.description}</p></div><Icon size={40} strokeWidth={1.2} aria-hidden="true"/></div>
   <div className={styles.screenLayout}>
    <figure className={styles.browser} key={screen.id}><div className={styles.browserChrome}><span aria-hidden="true"><i/><i/><i/></span><b>GYM OS / {en?screen.en:screen.ar}</b><button type="button" onClick={()=>dialog.current?.showModal()} aria-label={t('تكبير لقطة الواجهة','Enlarge interface screenshot')}><Expand size={16}/></button></div><Image src={screen.src} width={1440} height={1000} sizes="(max-width:850px) 100vw, 1000px" alt={t('لقطة فعلية لواجهة ','Actual interface screenshot: ')+(en?screen.en:screen.ar)+t('، ببيانات عرض مخفية',', with demonstration records obscured')}/></figure>
    <aside className={styles.phoneColumn}><div className={styles.phone}><div className={styles.phoneNotch} aria-hidden="true"/><Image src="/images/app-member-private.webp" width={390} height={844} sizes="240px" alt={t('واجهة تطبيق العضو بمعلومات شخصية مخفية','Member application interface with personal details obscured')}/></div><span className={styles.mobileTag}><Smartphone size={16}/>{t('وناديك مع العضو، أينما كان.','Your club. With every member.')}</span></aside>
   </div>
   <p className={styles.privacy}><ShieldCheck size={15}/>{t('واجهات فعلية من التطبيق. بيانات العرض وهمية، ومعلومات السجلات مخفية.','Actual application interfaces. Demonstration data only; record details are obscured.')}</p>
  </div>
  <div className={styles.bottom}><div><span>{t('تجربة واحدة. كل شغلك.','ONE EXPERIENCE. YOUR ENTIRE CLUB.')}</span><h3>{t('من أول انطباع، لأول يوم شغل.','From first impression to your first working day.')}</h3></div><Link href="/demo">{t('ابدأ تجربتك ٣٠ يومًا','Start your 30-day trial')}<ArrowUpRight size={22}/></Link></div>
  <dialog ref={dialog} className={styles.lightbox} aria-label={t('لقطة مكبرة من واجهة التطبيق','Enlarged application interface screenshot')} onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}><button type="button" className={styles.close} onClick={()=>dialog.current?.close()} aria-label={t('إغلاق الصورة','Close screenshot')}><X size={24}/></button><Image src={screen.src} width={1440} height={1000} sizes="95vw" alt={en?screen.en:screen.ar}/></dialog>
 </section>;
}
