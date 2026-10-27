'use client';
import {useState} from 'react';
import {addDays,type GymState,type Member} from './lib/domain';
import type {Role} from './lib/access';
type Task='add'|'renew'|'collect'|'checkin'|'members'|'reports'|'team'|'settings'|'classes';
export default function DailyHome({state,branch,role,ar,today,canEdit,admin,onTask,onMember}:{state:GymState;branch:string;role:Role;ar:boolean;today:string;canEdit:boolean;admin:boolean;onTask:(task:Task)=>void;onMember:(member:Member)=>void}){
 const [query,setQuery]=useState('');
 const t=(a:string,e:string)=>ar?a:e;
 const members=state.members.filter(m=>m.branch===branch&&!m.archived&&!m.demo);
 const renewals=members.filter(m=>m.awaitingSubscription||m.expires<=addDays(today,7)).sort((a,b)=>a.expires.localeCompare(b.expires));
 const matches=members.filter(m=>[m.name,m.phone,m.card??''].some(v=>v.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))).slice(0,8);
 const tasks:{id:Task;title:string;detail:string;write?:boolean}[]=role==='reception'?[
 {id:'members',title:t('البحث عن عضو','Find a member'),detail:t('بيانات العضو وحالة اشتراكه','Member details and membership status')},
 {id:'classes',title:t('جدول الحصص','Class schedule'),detail:t('مواعيد الحصص والحجوزات','Class times and bookings')}
 ]:[
 {id:'add',title:t('١. إضافة عضو','1. Add member'),detail:t('أنشئ الملف، ثم اختر الاشتراك','Create a profile, then choose a membership'),write:true},
 {id:'renew',title:t('٢. اشتراك أو تجديد','2. Subscribe or renew'),detail:t('اختر العضو والباقة وتاريخ البداية','Choose the member, package and start date'),write:true},
 {id:'collect',title:t('٣. تحصيل مستحقات','3. Collect a balance'),detail:t('افتح الفاتورة وسجّل المبلغ المدفوع','Open an invoice and record its payment'),write:true},
 {id:'checkin',title:t('٤. تسجيل حضور','4. Check in'),detail:t('سجّل دخول العضو صاحب الاشتراك النشط','Check in a member with an active membership'),write:true}
 ];
 return <section className="daily-home"><div className="section-head"><div><span className="eyebrow">{t('مساحة النادي','CLUB WORKSPACE')}</span><h1>{role==='owner'?t('أهلًا، ابدأ إدارة ناديك','Welcome, manage your club'):role==='manager'?t('ابدأ تشغيل اليوم','Start today’s operations'):t('مساحة الموظف','Staff workspace')}</h1><p>{state.branches.find(b=>b.id===branch)?.name} · {role==='owner'?t('صاحب النادي','Club owner'):role==='manager'?t('مدير النادي','Club manager'):t('موظف استقبال — عرض فقط','Reception — read only')}</p></div></div>
 {!canEdit&&<p className="operation-notice">{role==='reception'?t('حسابك يعرض البيانات فقط. اطلب من المالك أو المدير تسجيل الحضور أو التحصيل.','Your account can view records. Ask an owner or manager to record attendance or payments.'):t('التعديل غير متاح حاليًا؛ يمكنك مراجعة البيانات.','Editing is currently unavailable; you can review records.')}</p>}
 <section className="card"><h2>{t('ماذا تريد أن تفعل؟','What would you like to do?')}</h2><div className="daily-actions">{tasks.map(task=><button className="daily-action" key={task.id} disabled={task.write&&!canEdit} onClick={()=>onTask(task.id)}><strong>{task.title}</strong><span>{task.detail}</span></button>)}</div></section>
 <section className="card"><h2>{t('ملف العضو في مكان واحد','One place for each member')}</h2><label>{t('ابحث بالاسم أو الهاتف أو رقم الكارت','Search by name, phone or card')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('اكتب بيانات العضو…','Enter member details…')}/></label><p>{t('افتح الملف لمراجعة الاشتراك والحضور والمدفوعات حسب صلاحيتك.','Open the profile for membership, visits and payments allowed by your role.')}</p>{query.trim()&&<div className="daily-results" aria-live="polite">{matches.length?matches.map(m=><button className="daily-action" key={m.id} onClick={()=>onMember(m)}><strong>{m.name}</strong><span>{m.phone} · {t('الاشتراك حتى: ','Valid through: ')}{m.expires}</span></button>):<p>{t('لا توجد نتائج في هذا الفرع.','No matches in this branch.')}</p>}</div>}</section>
 <div className="daily-columns"><section className="card"><h2>{t('يحتاج إلى متابعة','Needs attention')} · {renewals.length}</h2><p>{t('اشتراك لم يُفعّل، أو انتهت صلاحيته، أو ينتهي خلال ٧ أيام.','Awaiting subscription, expired, or expiring within 7 days.')}</p>{renewals.slice(0,5).map(m=><button className="daily-action" key={m.id} onClick={()=>onMember(m)}><strong>{m.name}</strong><span>{m.awaitingSubscription?t('بانتظار اختيار باقة','Awaiting package'):m.expires}</span></button>)}{!renewals.length&&<p>{t('لا توجد اشتراكات تحتاج متابعة الآن.','No memberships need attention now.')}</p>}</section><section className="card"><h2>{t('ملخص اليوم','Today at a glance')}</h2><p>{t('أعضاء الفرع الحقيقيون: ','Real branch members: ')}<b>{members.length}</b></p><p>{t('زيارات اليوم الحقيقية: ','Today’s real member visits: ')}<b>{state.visits.filter(v=>v.branch===branch&&v.day===today&&members.some(m=>m.id===v.member)).length}</b></p>{role!=='reception'&&<button className="button secondary" onClick={()=>onTask('reports')}>{t('عرض التقارير التفصيلية','View detailed reports')}</button>}{admin&&<div className="head-actions"><button className="text-button" onClick={()=>onTask('team')}>{t('الفريق والصلاحيات','Team & permissions')}</button><button className="text-button" onClick={()=>onTask('settings')}>{t('إعداد النادي','Set up club')}</button></div>}</section></div>
 </section>;
}
