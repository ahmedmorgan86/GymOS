import {addDays,applyOperation,dayAt,type GymState} from './domain.ts';
import {membershipIssue} from './extensions.ts';
import {membershipPeriod} from './membership-periods.ts';
import {demoMemberPhotos} from './demo-member-photos.ts';

const syntheticMember=/^sample-full-member-(\d+)$/;
/** Enrich only reserved synthetic identities; preserve uploaded photos and historical records. */
export function addDemoShowcase(s:GymState,now:string){
 const today=dayAt(now,s.settings.timezone);
 for(const member of s.members){
  const match=syntheticMember.exec(member.id);if(!match||member.photo)continue;
  const female=member.gender==='female'||/^(سارة|منى|نور|مريم|دينا|هبة) /.test(member.name);
  const choices=female?demoMemberPhotos.female:demoMemberPhotos.male;
  member.photo=choices[(Number(match[1])-1)%choices.length];
 }
 for(const branch of s.branches.slice(0,2)){
  const prefix='sample-full-'+branch.id+'-showcase-v3-'+today+'-',marker=prefix+'seed';
  if(s.events.some(e=>e.id===marker))continue;
  const members=s.members.filter(m=>m.branch===branch.id&&syntheticMember.test(m.id)&&!m.archived);
  if(!members.length)continue;
  let sequence=0;
  const run=(type:string,data:Record<string,unknown>={},at=now)=>Object.assign(s,applyOperation(s,{type,branch:branch.id,...data},at,'عرض اصطناعي — بيانات تجريبية',()=>prefix+(++sequence)));
  const timestamp=(day:string,hour:number)=>day+'T'+String(hour).padStart(2,'0')+':00:00.000Z';
  const active=members.filter(m=>membershipIssue(s,m,today)===null);
  // A current presence roster, without consuming or rewriting any existing visit.
  for(const [i,member] of active.filter(m=>!m.shift).slice(0,3).entries()){
   if(s.visits.some(v=>v.member===member.id&&v.day===today))continue;
   const at=new Date(Date.parse(now)-(20+i*10)*60000).toISOString();
   if(dayAt(at,s.settings.timezone)!==today)continue;
   const period=membershipPeriod(member,today);if(!period)continue;
   s.visits.push({id:prefix+'present-'+i,member:member.id,branch:branch.id,day:today,at,periodId:period.id});
  }
  // Both confirmed bookings and a waitlist remain visible on upcoming days.
  for(let i=0;i<3;i++){
   const day=addDays(today,i+1),eligible=members.filter(m=>membershipIssue(s,m,day)===null).slice(0,6);
   s.classes.push({id:prefix+'class-'+i,branch:branch.id,title:['قوة ولياقة — حجز تجريبي','كارديو جماعي — حجز تجريبي','مرونة وحركة — حجز تجريبي'][i],at:timestamp(day,15+i),capacity:3,members:eligible.slice(0,3).map(m=>m.id),waitlist:eligible.slice(3).map(m=>m.id),coach:i===1?'كابتن منى — تجريبي':'كابتن كريم — تجريبي',price:0,minutes:45+i*15,demo:false,cancelled:false});
  }
  // Recent invoices demonstrate paid, partial and unpaid balances using only demo members.
  for(const [i,member] of members.slice(0,3).entries()){
   const invoice=prefix+'invoice-'+i,payment=prefix+'payment-'+i,total=[25000,40000,18000][i],paid=[25000,15000,0][i];
   if(paid)s.payments.push({id:payment,member:member.id,branch:branch.id,minor:paid,day:today,method:i?'card':'cash',voided:false});
   s.invoices??=[];s.invoices.push({id:invoice,member:member.id,branch:branch.id,title:['جلسة تقييم لياقة — تجريبي','متابعة تدريب شهرية — تجريبي','جلسة مرونة — تجريبي'][i],total,due:today,voided:false,allocations:paid?[{payment,minor:paid}]:[]});
  }
  run('book.expense.add',{title:'مستلزمات نظافة وتجهيز — بيانات تجريبية',category:'other',minor:18500,method:'cash',day:today});
  run('book.expense.add',{title:'تسويق نشاط النادي — بيانات تجريبية',category:'marketing',minor:45000,method:'transfer',day:today});
  const supplier=s.suppliers?.find(x=>x.branch===branch.id&&x.id.startsWith('sample-full-'));
  const product=s.products?.find(x=>x.branch===branch.id&&x.id.startsWith('sample-full-')&&!x.archived);
  if(supplier&&product)run('book.purchase.add',{supplier:supplier.id,reference:'DEMO-SHOWCASE-'+today,due:addDays(today,10),paid:60000,method:'transfer',lines:[{product:product.id,quantity:4,cost:45000,batch:'DEMO-SHOWCASE-'+today,expires:addDays(today,180)}]});
  for(const [i,person] of [{name:'هبة عادل حسن — تجريبي',job:'أخصائية تغذية',base:720000,allowance:60000},{name:'محمود سمير علي — تجريبي',job:'خدمات وتشغيل',base:450000,allowance:20000}].entries()){
   // One employee per role, not one new employee every time the demo is refreshed.
   let employee=s.hr?.employees.find(e=>e.branch===branch.id&&e.name===person.name&&e.id.startsWith('sample-full-'));
   if(!employee){run('hr.employee.save',{...person,phone:'',contractStart:today.slice(0,4)+'-01-01',annualLeave:21});employee=s.hr!.employees.at(-1)!;}
   const workDay=addDays(today,-1);
   if(!s.hr!.attendance.some(a=>a.employee===employee!.id&&dayAt(a.at,s.settings.timezone)===workDay)){
    run('hr.attendance.in',{employee:employee.id},timestamp(workDay,7));
    run('hr.attendance.out',{employee:employee.id},timestamp(workDay,15));
   }
   if(!s.hr!.payroll.some(p=>p.employee===employee!.id&&p.month===today.slice(0,7)))run('hr.payroll.generate',{employee:employee.id,month:today.slice(0,7)});
   if(!s.hr!.leaves.some(l=>l.employee===employee!.id)){
    run('hr.leave.request',{employee:employee.id,from:addDays(today,3+i*4),to:addDays(today,4+i*4),kind:i?'unpaid':'sick',reason:'طلب توضيحي لحالات الإجازات — بيانات تجريبية'});
    if(i)run('hr.leave.decide',{id:s.hr!.leaves.at(-1)!.id,approved:false});
   }
  }
  for(const [title,body] of [['نصائح التمرين للمبتدئين — تجريبي','ابدأ بإحماء تدريجي، واطلب من المدرب ضبط أداء الحركة. محتوى اصطناعي للتجربة.'],['تحدي الأسبوع — تجريبي','ثلاث زيارات تدريب منتظمة مع تسجيل الحضور. إعلان توضيحي للنظام.'],['مواعيد الحصص — تجريبي','راجع الحصص القادمة من جدول الحجز. توجد أمثلة لحجز مؤكد وقائمة انتظار.']])run('community.post',{title,body,publishAt:now,expiresAt:new Date(Date.parse(now)+7*86400000).toISOString(),enabled:true});
  for(const [i,member] of members.slice(0,3).entries()){
   s.community!.messages.push({id:prefix+'member-message-'+i,branch:branch.id,member:member.id,side:'member',actor:member.id,text:['هل يمكنني معرفة موعد الحصة القادمة؟ — رسالة تجريبية','أحتاج متابعة برنامجي التدريبي — رسالة تجريبية','أين أجد سجل قياساتي؟ — رسالة تجريبية'][i],at:now});
   run('community.reply',{member:member.id,text:'أهلًا بك، بيانات اشتراكك وحجزك وبرنامجك موجودة في حساب العضو. رد اصطناعي للتجربة فقط.'});
  }
  run('competition.save',{name:'بطولة القوة واللياقة — تجريبي '+today,sport:'قوة ولياقة',date:addDays(today,-1),location:'صالة النادي — بيانات تجريبية'});
  const competition=s.competitions!.events.at(-1)!;
  for(const [i,member] of members.slice(0,3).entries())run('competition.result',{event:competition.id,member:member.id,division:'المستوى العام',rank:i+1,note:'نتيجة اصطناعية لعرض ترتيب المشاركين'});
  run('competition.save',{name:'تحدي التحمل القادم — تجريبي '+today,sport:'كارديو',date:addDays(today,10),location:'قاعة التدريب — بيانات تجريبية'});
  run('engagement.ticket.create',{subject:'مراجعة إعداد التقرير — بيانات تجريبية',priority:'urgent',text:'تذكرة تدريب داخل النادي، لا ترسل أي إشعار خارجي.'});
  run('engagement.ticket.reply',{id:s.engagement!.tickets.at(-1)!.id,text:'تمت مراجعة خطوات التقرير في العرض التجريبي.'});
  run('pulse.evaluate');
  const proposals=s.pulse.filter(p=>p.branch===branch.id&&p.status==='proposed'&&p.asOf===today&&syntheticMember.test(p.member));
  for(const [i,p] of proposals.slice(0,3).entries()){
   run('pulse.decide',{id:p.id,approved:i!==1,reason:'قرار توضيحي في البيانات التجريبية'});
   if(i===2){run('pulse.followup',{id:p.id,outcome:'contacted',note:'متابعة اصطناعية، لم يتم التواصل مع شخص حقيقي.'});run('pulse.complete',{id:p.id,reason:'تمت المتابعة داخل المثال التجريبي'});}
  }
  s.events.push({id:marker,branch:branch.id,at:now,kind:'demo.showcase',subject:'workspace',actor:'عرض اصطناعي — بيانات تجريبية',detail:'Synthetic portraits and linked examples; no external messages, login accounts or enabled devices created.'});
 }
}
