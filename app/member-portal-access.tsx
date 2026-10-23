"use client";
import {useEffect,useState} from 'react';
import Image from 'next/image';
type Status={status:'none'|'linked'|'pending'|'expired'|'revoked';email:string;expiresAt:string|null};
export default function MemberPortalAccess({member,owner,ar,busy}:{member:string;owner:string;ar:boolean;busy:boolean}){
 const [status,setStatus]=useState<Status|null>(null),[email,setEmail]=useState(''),[url,setUrl]=useState(''),[qr,setQr]=useState<{url:string;image:string}|null>(null),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const t=(a:string,e:string)=>ar?a:e;
 useEffect(()=>{let live=true;void fetch('/api/member-access?member='+encodeURIComponent(member),{cache:'no-store',headers:{'X-GymOS-Tenant':owner}}).then(async r=>{if(!r.ok)return;const d=await r.json();if(live){setStatus(d);setEmail(d.email);}}).catch(()=>{});return()=>{live=false;};},[member,owner]);
 useEffect(()=>{let live=true;if(url)void import('qrcode').then(q=>q.toDataURL(url,{width:240,margin:2,errorCorrectionLevel:'M'})).then(image=>{if(live)setQr({url,image});}).catch(()=>{});return()=>{live=false;};},[url]);
 async function submit(revoke=false){setPending(true);setMessage('');try{
 const r=await fetch('/api/member-access',{method:'POST',headers:{'Content-Type':'application/json','X-GymOS-Tenant':owner},body:JSON.stringify({member,email,...(revoke?{action:'revoke'}:{})})}),d=await r.json();if(!r.ok)throw Error();
 setUrl(revoke?'':d.url);setStatus({status:revoke?'revoked':'pending',email,expiresAt:revoke?null:new Date(Date.now()+72*3600000).toISOString()});
 setMessage(revoke?t('تم إلغاء دخول العضو.','Member access revoked.'):t('الدعوة جاهزة وصالحة ٧٢ ساعة. لم تُرسل تلقائيًا.','Invitation ready for 72 hours. It has not been sent automatically.'));
 }catch{setMessage(t('تعذر حفظ إعدادات دخول العضو.','Could not save member access.'));}finally{setPending(false);}}
 return <section className="card member-access-panel"><h3>{t('تطبيق الموبايل للعضو','Member mobile app')}</h3><p>{t('نفس بيانات النادي، بحساب خاص لهذا العضو فقط.','The same club records, with a private account for this member only.')}</p>
 <p role="status">{status?({none:t('لم تتم دعوة العضو بعد','Not invited yet'),linked:t('حساب العضو مربوط','Member account linked'),pending:t('الدعوة في انتظار التفعيل','Invitation awaiting activation'),expired:t('الدعوة انتهت؛ جدّدها','Invitation expired; renew it'),revoked:t('دخول العضو ملغى','Member access revoked')})[status.status]:t('جارٍ التحقق من حالة الربط…','Checking access status…')}</p>
 <a className="button secondary" href={'/member?member='+encodeURIComponent(member)+'&club='+encodeURIComponent(owner)} target="_blank" rel="noopener noreferrer">{t('عرض تطبيق العضو ببياناته الحقيقية','View mobile app with this member’s real data')}</a>
 <form onSubmit={e=>{e.preventDefault();if(status?.status==='linked'&&!confirm(t('تجديد الدعوة يفصل الحساب المرتبط حتى يقبل دعوة جديدة. متابعة؟','Renewing disconnects the linked account until the new invitation is accepted. Continue?')))return;void submit();}}>
 <label>{t('بريد العضو الشخصي','Member’s personal email')}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off" maxLength={254} required/></label>
 <button className="button secondary" disabled={busy||pending}>{t('إنشاء / تجديد دعوة العضو','Create / renew invitation')}</button>
 <button type="button" className="text-button" disabled={busy||pending||!status||status.status==='none'||status.status==='revoked'} onClick={()=>{if(confirm(t('إلغاء دخول هذا العضو للموبايل؟','Revoke this member’s mobile access?')))void submit(true);}}>{t('إلغاء دخول العضو','Revoke member access')}</button></form>
 {message&&<p role="status">{message}</p>}{url&&<div className="member-invitation"><label>{t('رابط الدعوة الخاص — شاركه مع العضو فقط','Private invitation link — share only with this member')}<input dir="ltr" readOnly value={url} onFocus={e=>e.currentTarget.select()}/></label><button className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage(t('تم نسخ الرابط','Link copied'));}catch{setMessage(t('حدد الرابط وانسخه يدويًا','Select the link and copy it manually'));}}}>{t('نسخ رابط الدعوة','Copy invitation link')}</button>{qr?.url===url&&<Image src={qr.image} width={200} height={200} unoptimized alt={t('QR للدعوة الخاصة وليس لتسجيل الحضور','Private invitation QR, not an attendance pass')}/>}<p>{t('العضو يمسح QR أو يفتح الرابط، وينشئ حسابًا بنفس البريد ثم يؤكد بريده ويسجل الدخول. رمز الدعوة يُستخدم مرة واحدة.','The member scans the QR or opens the link, creates an account with the same email, confirms it and signs in. The invitation can be used once.')}</p></div>}
 </section>;
}
