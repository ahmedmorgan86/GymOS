import {z} from 'zod';
import {RuleError,dayAt,days,type GymState,type Member,type Operation} from './domain.ts';
import {normalizeMemberPhone} from './member-phone-format.ts';
import {invoiceOutstanding} from './member-ledger.ts';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
export const manualTemplateSchema=z.object({id:z.string().min(1).max(250),branch:z.string().min(1).max(250),name:z.string().trim().min(1).max(100),kind:z.enum(['welcome','policy','birthday','occasion','absence','renewal','expired']),body:z.string().trim().min(1).max(1500).refine(v=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)),enabled:z.boolean(),offset:z.number().int().min(1).max(90),date:date.optional()}).strict().refine(x=>x.kind!=='occasion'||Boolean(x.date));
export const manualWhatsAppSchema=z.array(manualTemplateSchema).max(100);
export type ManualWhatsAppTemplate=z.infer<typeof manualTemplateSchema>;
export const defaultWhatsApp=(kind:ManualWhatsAppTemplate['kind'],ar:boolean)=>({welcome:ar?'أهلًا {name}، نورت {gym}! يسعدنا انضمامك.':'Welcome {name} to {gym}!',policy:ar?'أهلًا {name}، تواصل معنا للحصول على سياسات {gym}.':'Hello {name}, please contact us for {gym} policies.',birthday:ar?'كل سنة وأنت بخير يا {name}! أطيب التمنيات من {gym}.':'Happy birthday {name}! Best wishes from {gym}.',occasion:ar?'أهلًا {name}، {occasion}. تحيات {gym}.':'Hello {name}, {occasion}. Best wishes from {gym}.',absence:ar?'وحشتنا يا {name} في {gym}. هل نقدر نساعدك ترجع للتمرين؟':'We miss you at {gym}, {name}. Can we help you return?',renewal:ar?'أهلًا {name}، اشتراكك في {gym} ينتهي {expires}. يسعدنا مساعدتك في التجديد.':'Hello {name}, your {gym} membership ends {expires}. Contact us to renew.',expired:ar?'أهلًا {name}، انتهى اشتراكك في {gym} بتاريخ {expires}. يسعدنا رجوعك.':'Hello {name}, your {gym} membership expired on {expires}. We look forward to your return.'}[kind]);
export function manualWhatsAppOperation(s:GymState,op:Operation,newId:()=>string){
 if(op.type!=='whatsapp.manual.save')return false;
 s.manualWhatsApp??=[];const old=op.id?s.manualWhatsApp.find(t=>t.id===op.id&&t.branch===op.branch):undefined;if(op.id&&!old)throw new RuleError('notFound');
 const row=manualTemplateSchema.parse({id:old?.id??newId(),branch:op.branch,name:op.name,kind:op.kind,body:op.body,enabled:op.enabled,offset:op.offset??7,...(op.date?{date:op.date}:{})});
 if(old)Object.assign(old,row);else s.manualWhatsApp.push(row);manualWhatsAppSchema.parse(s.manualWhatsApp);return true;
}
export function whatsAppText(s:GymState,m:Member,template:Pick<ManualWhatsAppTemplate,'body'|'name'>,now:string){
 const balance=(s.invoices??[]).filter(i=>i.member===m.id&&i.branch===m.branch).reduce((n,i)=>n+invoiceOutstanding(s,i),0);
 const fields:Record<string,string>={name:m.name,gym:s.settings.name,branch:s.branches.find(b=>b.id===m.branch)?.name??'',expires:m.expires,balance:(balance/100).toFixed(2)+' '+s.settings.currency,date:dayAt(now,s.settings.timezone),occasion:template.name};
 return template.body.replace(/\{(name|gym|branch|expires|balance|date|occasion)\}/g,(_,key)=>fields[key]);
}
export function memberWhatsAppLink(s:GymState,m:Member,branch:string,kind:ManualWhatsAppTemplate['kind'],ar:boolean,now:string,templateId?:string){
 if(m.branch!==branch||m.archived||m.demo||!s.members.some(x=>x.id===m.id&&x.branch===branch))return null;const phone=normalizeMemberPhone(m.phone);if(!phone)return null;
 const configured=s.manualWhatsApp?.find(t=>t.branch===branch&&t.enabled&&(templateId?t.id===templateId:t.kind===kind));if(templateId&&!configured)return null;
 const template=configured??{body:defaultWhatsApp(kind,ar),name:ar?'مناسبة سعيدة':'Best wishes'};
 return'https://wa.me/'+phone.slice(1)+'?text='+encodeURIComponent(whatsAppText(s,m,template,now));
}
export function manualWhatsAppDue(s:GymState,branch:string,now:string){const today=dayAt(now,s.settings.timezone),lastVisits=new Map<string,string>();for(const v of s.visits)if(v.branch===branch&&v.day<=today&&v.day>(lastVisits.get(v.member)??''))lastVisits.set(v.member,v.day);return(s.manualWhatsApp??[]).filter(t=>t.branch===branch&&t.enabled).flatMap(t=>s.members.filter(m=>m.branch===branch&&!m.demo&&!m.archived).flatMap(m=>{
 const last=lastVisits.get(m.id)??m.joined,until=days(today,m.expires);if(['absence','renewal','expired'].includes(t.kind)&&(m.awaitingSubscription||m.freezes?.some(f=>!f.cancelled&&f.from<=today&&f.to>=today)))return[];
 const due=t.kind==='occasion'?t.date===today:t.kind==='birthday'?m.health?.birthDate?.slice(5)===today.slice(5):t.kind==='welcome'||t.kind==='policy'?m.joined<=today&&days(m.joined,today)<=t.offset:t.kind==='absence'?m.expires>=today&&days(last,today)>=t.offset:t.kind==='renewal'?until>=0&&until<=t.offset:until<0&&until>=-t.offset;
 return due?[{member:m.id,template:t.id,kind:t.kind,name:t.name}]:[];
 }));}
