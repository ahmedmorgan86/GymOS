import {addDays,applyOperation,dayAt,type GymState} from './domain.ts';
import {emptyEngagement} from './engagement.ts';

/** Explicitly synthetic, tenant-local scenarios. Never dispatch messages or enable hardware. */
export function addDemoScenarios(s:GymState,now:string){
 const today=dayAt(now,s.settings.timezone);
 for(const branch of s.branches.slice(0,2)){
  const prefix='sample-full-'+branch.id+'-scenarios-v2-',marker=prefix+'seed';
  const members=s.members.filter(m=>m.branch===branch.id&&/^sample-full-member-\d+$/.test(m.id));
  if(!members.length)continue;
  for(let c=0;c<3;c++)if(!s.classes.some(x=>x.id===prefix+'future-class-'+c))s.classes.push({id:prefix+'future-class-'+c,branch:branch.id,title:['حديد وقوة — تجربة الحجز','كارديو — تجربة الحجز','مرونة — تجربة الحجز'][c],at:addDays(today,c+1)+'T16:00:00.000Z',capacity:[4,8,12][c],members:[],waitlist:[],coach:'كابتن تجريبي',demo:false,cancelled:false});
  for(const m of members)if(!m.measurements?.length&&m.vitals?.length)m.measurements=m.vitals.flatMap(v=>v.weight===undefined?[]:[{day:v.day,weight:v.weight,waist:v.waist??null,note:'قياس اصطناعي للتجربة فقط'}]);
  if(s.events.some(e=>e.id===marker))continue;
  let seq=0;const run=(type:string,data:Record<string,unknown>={},at=now)=>Object.assign(s,applyOperation(s,{type,branch:branch.id,...data},at,'بيانات تجريبية فقط',()=>prefix+(++seq)));
  s.shifts??=[];
  for(const [key,name,start,end,weekdays] of [
   ['evening','مسائي — تجريبي','16:00','23:00',[0,1,2,3,4,5,6]],
   ['weekend','نهاية الأسبوع — تجريبي','10:00','18:00',[5,6]]
  ] as const)s.shifts.push({id:prefix+key,branch:branch.id,name,start,end,weekdays:[...weekdays],archived:false});
  for(const [i,m]of members.entries()){
   m.birthDate??=m.health?.birthDate??(1985+i%20)+'-05-15';m.gender??=/^(سارة|منى|نور|مريم|دينا|هبة) /.test(m.name)?'female':'male';
   m.address??=['مدينة نصر — عنوان تجريبي','المعادي — عنوان تجريبي','الهرم — عنوان تجريبي','شبرا — عنوان تجريبي'][i%4];
   m.notes??='سجل اصطناعي للتدريب على النظام؛ لا يمثل شخصًا حقيقيًا.';
   if(!m.cards&&m.card)m.cards=[{code:m.card+'-OLD',status:'lost',issuedAt:addDays(today,-90)+'T08:00:00.000Z',cancelledAt:addDays(today,-20)+'T08:00:00.000Z',reason:'كارت مفقود — سيناريو تجريبي',actor:'تجربة النظام',history:[]},{code:m.card,status:'active',issuedAt:addDays(today,-20)+'T08:00:00.000Z',reason:'كارت بديل — سيناريو تجريبي',actor:'تجربة النظام',history:[]}];
   const initial=m.vitals?.[0];if(initial&&!m.vitals?.some(v=>v.id===m.id+'-trend-1'))for(let n=1;n<=2;n++)m.vitals!.push({...initial,id:m.id+'-trend-'+n,day:addDays(today,-n*14),weight:(initial.weight??75)+n,waist:(initial.waist??80)+n,note:'قياس تاريخي اصطناعي لإظهار اتجاه التقدم'});
   if(m.vitals?.length)m.measurements=m.vitals.flatMap(v=>v.weight===undefined?[]:[{day:v.day,weight:v.weight,waist:v.waist??null,note:'قياس اصطناعي للتجربة فقط'}]);
  }
  const eligible=members.filter(m=>!m.archived),member=eligible[0];
  if(member){
   run('competition.save',{name:'تحدي اللياقة الشهري — تجريبي',sport:'لياقة عامة',date:addDays(today,-2),location:'قاعة التدريب — تجريبي'});
   const event=s.competitions!.events.at(-1)!;
   for(const [i,m]of eligible.slice(0,3).entries())run('competition.result',{event:event.id,member:m.id,division:'الفئة المفتوحة',rank:i+1,note:'نتيجة اصطناعية للتجربة'});
  }
  run('engagement.ticket.create',{subject:'تجربة إعداد قارئ الكارت — تذكرة تدريب',priority:'normal',text:'تذكرة داخلية اصطناعية، لا تعني وجود جهاز موصل.'});
  const ticket=s.engagement!.tickets.at(-1)!.id;run('engagement.ticket.reply',{id:ticket,text:'مثال على متابعة الدعم داخل النادي.'});
  run('engagement.ticket.create',{subject:'تجربة تقرير المخزون — مغلقة',priority:'normal',text:'مثال تعليمي فقط.'});
  run('engagement.ticket.close',{id:s.engagement!.tickets.at(-1)!.id});
  const engagement=s.engagement??=emptyEngagement();
  engagement.devices.push({id:prefix+'device',branch:branch.id,name:'محاكاة قارئ — غير موصل وغير مفعل',enabled:false,mappings:member?[{person:'SAMPLE-IDENTITY',member:member.id}]:[]});
  if(member)engagement.sms.push({id:prefix+'sms',branch:branch.id,member:member.id,occurrence:prefix+'preview',to:member.phone,text:'مرحبًا بك — مسودة تجريبية غير مرسلة.',status:'draft',at:now,actor:'تجربة النظام'});
  const sale=s.shopSales?.find(x=>x.branch===branch.id&&x.id.startsWith('sample-full-')&&!x.voided&&!x.returns?.length);
  if(sale)run('shop.sale.return',{id:sale.id,line:0,quantity:1,reason:'مرتجع اصطناعي لتجربة المخزون والمبيعات'});
  for(const employee of s.hr?.employees.filter(x=>x.branch===branch.id&&x.id.startsWith('sample-full-'))??[]){
   const workDay=Date.parse(now)>=Date.parse(today+'T15:00:00.000Z')?today:addDays(today,-1);if(workDay<employee.contractStart)continue;
   run('hr.attendance.in',{employee:employee.id},workDay+'T07:00:00.000Z');
   run('hr.attendance.out',{employee:employee.id},workDay+'T15:00:00.000Z');
  }
  run('pulse.evaluate');
  s.events.push({id:marker,branch:branch.id,at:now,kind:'demo.scenarios',subject:'workspace',actor:'بيانات تجريبية فقط',detail:'No external delivery, credentials or active device connections created.'});
 }
}
