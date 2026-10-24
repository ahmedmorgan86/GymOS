'use client';
import {useState,type FormEvent} from 'react';
import {dayAt,type GymState,type Operation} from './lib/domain';

type Props={state:GymState;branch:string;ar:boolean;busy:boolean;canSell:boolean;canCollect:boolean;mutate:(op:Omit<Operation,'branch'>&{type:string})=>Promise<boolean>};
function cents(value:FormDataEntryValue|null){
 const text=String(value??'');if(!/^\d{1,8}(\.\d{1,2})?$/.test(text))throw Error('amount');
 const [whole,fraction='']=text.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export default function ReceptionSales({state,branch,ar,busy,canSell,canCollect,mutate}:Props){
 const [pending,setPending]=useState(false),[notice,setNotice]=useState(''),[planId,setPlanId]=useState('');
 const t=(a:string,b:string)=>ar?a:b,today=dayAt(new Date().toISOString(),state.settings.timezone);
 const members=state.members.filter(m=>m.branch===branch&&!m.archived&&!m.demo),plans=(state.plans??[]).filter(p=>p.branch===branch&&!p.archived),selected=plans.find(p=>p.id===planId);
 const money=(n:number)=>new Intl.NumberFormat(ar?'ar-EG':'en-GB',{style:'currency',currency:state.settings.currency}).format(n/100);
 async function submit(e:FormEvent<HTMLFormElement>,build:(f:FormData)=>Omit<Operation,'branch'>&{type:string}){
  e.preventDefault();if(pending||busy)return;const form=e.currentTarget;setPending(true);setNotice('');
  try{if(await mutate(build(new FormData(form)))){form.reset();setPlanId('');setNotice(t('تم حفظ العملية.','Operation saved.'));}}
  catch{setNotice(t('راجع المبلغ والحقول المطلوبة.','Check the amount and required fields.'));}finally{setPending(false);}
 }
 const memberField=<label>{t('العضو','Member')}<select name="member" required defaultValue=""><option value="">{t('اختر عضوًا','Choose member')}</option>{members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.phone||m.id.slice(0,8)}</option>)}</select></label>;
 const methodField=<label>{t('وسيلة التحصيل','Collection method')}<select name="method"><option value="cash">{t('نقدي','Cash')}</option><option value="card">{t('بطاقة — تسجيل فقط','Card — record only')}</option><option value="transfer">{t('تحويل','Transfer')}</option></select></label>;
 return <fieldset className="workspace-permissions" disabled={busy||pending}>
  <legend>{t('العضويات والتحصيل المفوض','Delegated memberships & collections')}</legend>
  {notice&&<p role="status" className="operation-notice">{notice}</p>}
  <div className="settings-grid">
   {canSell&&<section className="card"><h2>{t('تسجيل عضو جديد','Register a new member')}</h2><p>{t('يُنشأ الملف بانتظار اختيار باقة؛ تسجيل البيانات وحده لا يفعّل الدخول.','The profile awaits a plan; registration alone does not activate access.')}</p>
    <form onSubmit={e=>void submit(e,f=>({type:'member.register',name:f.get('name'),phone:f.get('phone'),joined:today,expires:today,consent:f.get('consent')==='on'}))}>
     <label>{t('الاسم','Name')}<input name="name" maxLength={150} required/></label>
     <label>{t('رقم الموبايل — اختياري','Mobile number — optional')}<input name="phone" type="tel" maxLength={40}/></label>
     <label className="checkbox"><input name="consent" type="checkbox"/>{t('العضو وافق على التواصل','Member consented to contact')}</label>
     <button className="button primary">{t('إنشاء الملف','Create profile')}</button>
    </form>
   </section>}
   {canSell&&<section className="card"><h2>{t('اشتراك جديد أو تجديد','New membership or renewal')}</h2><p>{t('تبدأ الفترة بعد آخر اشتراك محجوز أو في التاريخ المختار إن كان لاحقًا. لا تُستبدل الفترة السارية. الرصيد المقدم المتاح يُستخدم تلقائيًا.','The term starts after the last booked term, or the selected date if later. The current term is preserved; available advance credit is applied automatically.')}</p>
    <form onSubmit={e=>void submit(e,f=>({type:'plan.assign',id:f.get('member'),plan:f.get('plan'),start:f.get('start'),due:f.get('due'),startMode:'scheduled',paid:canCollect?cents(f.get('paid')):0,method:canCollect?f.get('method'):'cash'}))}>
     {memberField}<label>{t('الباقة المعتمدة','Approved plan')}<select name="plan" required value={planId} onChange={e=>setPlanId(e.target.value)}><option value="">{t('اختر باقة','Choose plan')}</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {money(p.minor)}</option>)}</select></label>
     {selected&&<p>{selected.days} {t('يوم','days')} · {selected.visits??t('زيارات غير محدودة','Unlimited visits')}</p>}
     <div className="form-row"><label>{t('البداية المطلوبة','Requested start')}<input name="start" type="date" defaultValue={today} min={today} required/></label><label>{t('تاريخ استحقاق المبلغ','Balance due date')}<input name="due" type="date" defaultValue={today} min={today} required/></label></div>
     {canCollect?<><label>{t('المدفوع الآن — صفر مسموح','Paid now — zero allowed')}<input name="paid" inputMode="decimal" defaultValue="0" pattern="[0-9]{1,8}([.][0-9]{1,2})?" required/></label>{methodField}</>:<p>{t('لا توجد صلاحية تحصيل؛ يُسجّل المتبقي في الفاتورة دون قبض جديد.','No collection permission: the remaining amount is invoiced without recording a new payment.')}</p>}
     <button className="button primary" disabled={!plans.length}>{t('تأكيد الاشتراك','Confirm membership')}</button>
    </form>
   </section>}
   {canCollect&&<section className="card"><h2>{t('تسجيل تحصيل','Record a collection')}</h2><p>{t('يسدد التحصيل الفواتير الأقدم، والمبلغ الزائد يبقى رصيدًا مقدمًا للعضو. هذا تسجيل إداري ولا يخصم من بطاقة.','Collections settle oldest invoices; any excess stays as member advance credit. This records a payment and does not charge a card.')}</p>
    <form onSubmit={e=>void submit(e,f=>({type:'payment.add',id:f.get('member'),minor:cents(f.get('amount')),method:f.get('method')}))}>
     {memberField}<label>{t('المبلغ','Amount')} · {state.settings.currency}<input name="amount" inputMode="decimal" pattern="[0-9]{1,8}([.][0-9]{1,2})?" required/></label>{methodField}
     <button className="button primary">{t('تسجيل التحصيل','Record collection')}</button>
    </form>
   </section>}
  </div>
 </fieldset>;
}
